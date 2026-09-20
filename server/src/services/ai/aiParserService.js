const { GoogleGenAI } = require('@google/genai');
const { MODEL, MAX_INPUT_LENGTH } = require('../../config/aiConfig');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('[aiParserService] GEMINI_API_KEY not set; AI parsing will fail until provided.');
}

// JSON Schema for the QuickAddResponse (strict — no additional properties)
// NOTE: currency removed; categoryId used instead of category.
// Confidence values let the client distinguish explicit values from inferences.
const QUICK_ADD_JSON_SCHEMA = {
    type: 'object',
    properties: {
        transactions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['expense', 'income'] },
                    amount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
                    categoryId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    categoryConfidence: { anyOf: [{ type: 'string', enum: ['high', 'medium', 'low'] }, { type: 'null' }] },
                    name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    dateConfidence: { anyOf: [{ type: 'string', enum: ['high', 'medium', 'low'] }, { type: 'null' }] },
                    time: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    timeConfidence: { anyOf: [{ type: 'string', enum: ['high', 'medium', 'low'] }, { type: 'null' }] },
                    paymentMethod: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    paymentMethodConfidence: { anyOf: [{ type: 'string', enum: ['high', 'medium', 'low'] }, { type: 'null' }] },
                    note: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                },
                additionalProperties: false,
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
        missingFields: { type: 'array', items: { type: 'string' } },
    },
    required: ['transactions', 'warnings', 'missingFields'],
    additionalProperties: false,
};

function buildPrompt(text, currentDate, options = {}) {
    const { categories = [], paymentMethods = [], timezone = null } = options;
    // Provide closed lists for categories (id, name, emoji, type) and paymentMethods (value,label)
    const catList = JSON.stringify(categories);
    const pmList = JSON.stringify(paymentMethods);

    return `Extract financial transactions from the user's input. Respond ONLY with JSON that validates against the provided schema. Do not include any prose or markdown. Languages: English, Hindi, Hinglish, Romanized Hindi, mixed Hindi+English. Use the supplied currentDate (${currentDate}) and timezone (${timezone || 'none'}) to resolve relative dates (today, yesterday, aaj, kal) and times. Never invent values — if a field is missing or ambiguous, return null for that field. For categoryId and paymentMethod return ONLY values from the provided lists. Do NOT invent categories or payment methods. If no confident match exists, return null for categoryId. For paymentMethod, if missing or ambiguous, use the Online Banking fallback only if that exact payment method exists in the provided list; mark such fallback results with paymentMethodConfidence: "low". If the user explicitly mentions a payment method, set paymentMethodConfidence: "high". If wording gives a reasonable but not explicit hint, set "medium". Allowed paymentMethodConfidence values: high, medium, low, or null.

Time rules: Return explicit times in HH:MM:SS 24-hour format. If the user gives only a time-of-day phrase and no explicit time, use these defaults: morning/subah = 10:00:00, afternoon/dopahar = 14:00:00, evening/shaam/sham = 18:00:00, night/raat = 22:00:00.

Inference and confidence rules:
- For categoryId, use an exact category mentioned by the user with categoryConfidence "high". You may infer the closest matching category from UserCategories with categoryConfidence "medium" when the meaning is clear. For example, spending with Abhishek can map to a "Friend Spend" category if it exists, and eating momos can map to "Junk Food" if it exists. Return null for categoryId and categoryConfidence when there is no reasonable category match.
- Use dateConfidence "high" when the user gives an explicit or relative date (for example, 2026-01-10, today, aaj, yesterday, kal, parso). If no date is mentioned, use the supplied currentDate (${currentDate}) and dateConfidence "medium".
- Use timeConfidence "high" for an explicit clock time. Use timeConfidence "medium" when applying a time-of-day default from the Time rules. If no time or time-of-day phrase is mentioned, return null for both time and timeConfidence.
- Keep name minimal: only the concise expense or income name (for example, "Momos", "Petrol", or "Salary"). Put descriptive context such as people, vehicle, purpose, place, or other details in note.

Closed lists (do not invent):
UserCategories: ${catList}
PaymentMethods: ${pmList}

Input:
"""${text}"""

Return JSON only.`;
}

// Validate the parsed object strictly according to the QUICK_ADD_JSON_SCHEMA
function validateParsedResponse(obj) {
    if (!obj || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.transactions)) return false;
    if (!Array.isArray(obj.warnings)) return false;
    if (!Array.isArray(obj.missingFields)) return false;

    for (const t of obj.transactions) {
        if (typeof t !== 'object') return false;
        if (!['expense', 'income'].includes(t.type)) return false;
        if (!(typeof t.amount === 'number' || t.amount === null)) return false;
        const stringOrNull = (v) => v === null || typeof v === 'string';
        const confidenceOrNull = (v) => v === null || ['high', 'medium', 'low'].includes(v);
        if (!stringOrNull(t.categoryId)) return false;
        if (!confidenceOrNull(t.categoryConfidence)) return false;
        if (!stringOrNull(t.name)) return false;
        if (!stringOrNull(t.date)) return false;
        if (!confidenceOrNull(t.dateConfidence)) return false;
        if (!stringOrNull(t.time)) return false;
        if (!confidenceOrNull(t.timeConfidence)) return false;
        if (!stringOrNull(t.paymentMethod)) return false;
        if (!confidenceOrNull(t.paymentMethodConfidence)) return false;
        if (!stringOrNull(t.note)) return false;
    }

    return true;
}

// Complete optional inference metadata before strict validation.
function completeInferredFields(parsed, currentDate) {
    if (!parsed || !Array.isArray(parsed.transactions)) return;

    for (const transaction of parsed.transactions) {
        if (!transaction || typeof transaction !== 'object') continue;

        if (transaction.categoryConfidence === undefined) {
            transaction.categoryConfidence = transaction.categoryId ? 'medium' : null;
        }
        if (!['high', 'medium', 'low'].includes(transaction.categoryConfidence)) {
            transaction.categoryConfidence = null;
        }

        if (transaction.date === undefined || transaction.date === null) {
            transaction.date = currentDate;
            transaction.dateConfidence = 'medium';
        } else if (!['high', 'medium', 'low'].includes(transaction.dateConfidence)) {
            transaction.dateConfidence = 'medium';
        }

        if (transaction.timeConfidence === undefined) {
            transaction.timeConfidence = transaction.time ? 'medium' : null;
        }
        if (!['high', 'medium', 'low'].includes(transaction.timeConfidence)) {
            transaction.timeConfidence = null;
        }

        if (transaction.paymentMethodConfidence === undefined) {
            transaction.paymentMethodConfidence = null;
        }
        if (!['high', 'medium', 'low'].includes(transaction.paymentMethodConfidence)) {
            transaction.paymentMethodConfidence = null;
        }
    }
}

async function parseText(text, options = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
        const err = new Error('Empty input');
        err.code = 'EMPTY_INPUT';
        throw err;
    }

    // enforce maximum input length to avoid sending excessively large content to Gemini
    if (typeof MAX_INPUT_LENGTH === 'number' && text.length > MAX_INPUT_LENGTH) {
        const err = new Error('Input too large');
        err.code = 'INPUT_TOO_LARGE';
        throw err;
    }

    if (!GEMINI_API_KEY) {
        const err = new Error('AI service not configured');
        err.code = 'NO_API_KEY';
        throw err;
    }

    const currentDate = options.currentDate || new Date().toISOString().slice(0, 10);
    const prompt = buildPrompt(text, currentDate, options);

    // Initialize official client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Request a JSON text response that conforms to our schema.
    let interaction;
    try {
        interaction = await ai.interactions.create({
            model: MODEL,
            input: prompt,
            response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: QUICK_ADD_JSON_SCHEMA,
            },
        });
    } catch (e) {
        // Log a concise, non-sensitive diagnostic for server logs
        try {
            console.error('[aiParserService] AI generation error:', e?.message || e);
            if (e?.code) console.error('[aiParserService] error.code:', e.code);
            // If SDK provides a response/status, log the keys only (no bodies)
            if (e?.response) console.error('[aiParserService] response keys:', Object.keys(e.response).slice(0, 10));
        } catch (logErr) {
            console.error('[aiParserService] error while logging AI generation error');
        }

        const err = new Error('AI generation failed');
        err.code = 'AI_GENERATION_FAILED';
        err.cause = { message: e?.message, code: e?.code };
        throw err;
    }

    // Interactions API exposes the generated text as `output_text`.
    let parsed = null;
    try {
        if (interaction && typeof interaction.output_text === 'string') {
            parsed = JSON.parse(interaction.output_text);
        }
    } catch (e) {
        // Leave parsed null so the normal invalid-output path includes diagnostics.
        parsed = null;
    }

    try {
        // Some SDK responses include a top-level `output` or `result`.
        // Try common locations conservatively.
        if (interaction && typeof interaction === 'object') {
            // If the SDK already parsed JSON, it may be present as `content` or `json`.
            if (interaction.json) parsed = interaction.json;
            if (!parsed && interaction.output && Array.isArray(interaction.output)) {
                for (const out of interaction.output) {
                    if (out && out.content) {
                        for (const c of out.content) {
                            if (c && c.type === 'application/json' && c.text) {
                                try { parsed = JSON.parse(c.text); break; } catch (e) {}
                            }
                            if (c && c.type === 'message' && typeof c.text === 'string') {
                                try { const maybe = JSON.parse(c.text); if (maybe) { parsed = maybe; break; } } catch (e) {}
                            }
                        }
                    }
                }
            }
            // Fallback: SDK sometimes exposes `candidates` or `content` fields
            if (!parsed && interaction.candidates && Array.isArray(interaction.candidates)) {
                for (const cand of interaction.candidates) {
                    if (cand.content && typeof cand.content === 'string') {
                        try { parsed = JSON.parse(cand.content); break; } catch (e) {}
                    }
                    if (cand.text && typeof cand.text === 'string') {
                        try { parsed = JSON.parse(cand.text); break; } catch (e) {}
                    }
                }
            }
            // Last resort: if interaction.text exists and looks like JSON, parse it
            if (!parsed && typeof interaction.text === 'string') {
                try { parsed = JSON.parse(interaction.text); } catch (e) { parsed = null; }
            }
        }
    } catch (e) {
        // swallow — we'll validate below
        parsed = null;
    }

    completeInferredFields(parsed, currentDate);

    if (!parsed || !validateParsedResponse(parsed)) {
        const err = new Error('AI produced invalid or unexpected structured output');
        err.code = 'INVALID_AI_OUTPUT';
        // Attach a short diagnostic for server logs
        const diag = { sample: typeof interaction === 'object' ? Object.keys(interaction).slice(0,10) : undefined };
        if (parsed && Array.isArray(parsed.transactions)) {
            diag.transactionKeys = parsed.transactions.slice(0, 3).map((transaction) => (
                transaction && typeof transaction === 'object' ? Object.keys(transaction) : typeof transaction
            ));
        }

        // If developer enables debug, include a small, trimmed snippet of the SDK interaction
        // WARNING: this may contain parts of the user's input or AI output; enable only for local debugging.
        try {
            if (process.env.QUICK_ADD_DEBUG === '1' && interaction && typeof interaction === 'object') {
                if (typeof interaction.output_text === 'string') {
                    diag.outputTextSnippet = interaction.output_text.slice(0, 1000);
                } else if (Array.isArray(interaction.output) && interaction.output.length > 0) {
                    try { diag.outputSnippet = JSON.stringify(interaction.output[0]).slice(0, 1000); } catch (e) { /* ignore */ }
                } else if (Array.isArray(interaction.candidates) && interaction.candidates.length > 0) {
                    try { diag.candidateSnippet = JSON.stringify(interaction.candidates[0]).slice(0, 1000); } catch (e) { /* ignore */ }
                }
            }
        } catch (e) {
            // ignore any debug extraction errors
        }

        err.diagnostic = diag;
        throw err;
    }

    // Post-process: enforce that categoryId and paymentMethod come from provided lists
    const { categories = [], paymentMethods = [] } = options;

    // Build lookup maps
    const catById = new Map(categories.map(c => [c.id, c]));
    const catByName = new Map(categories.map(c => [String(c.name).toLowerCase(), c]));
    const pmByValue = new Map(paymentMethods.map(p => [p.value, p]));
    const pmByLabel = new Map(paymentMethods.map(p => [String(p.label).toLowerCase(), p]));

    // Helper to find Online Banking fallback in provided paymentMethods
    const findOnlineBanking = () => {
        for (const p of paymentMethods) {
            if (!p) continue;
            const label = String(p.label || '').toLowerCase();
            const value = String(p.value || '').toLowerCase();
            if (label === 'online banking' || value === 'online_banking' || (label.includes('online') && label.includes('bank'))) return p;
        }
        return null;
    };

    const onlineBanking = findOnlineBanking();

    // Normalize each transaction
    parsed.transactions = parsed.transactions.map((t) => {
        const tx = { ...t };

        // categoryId: must match an available category id; if given as name, map to id; otherwise null
        if (tx.categoryId) {
            if (catById.has(tx.categoryId)) {
                // ok
            } else if (catByName.has(String(tx.categoryId).toLowerCase())) {
                tx.categoryId = catByName.get(String(tx.categoryId).toLowerCase()).id;
            } else {
                tx.categoryId = null;
            }
        }
        if (!tx.categoryId || !['high', 'medium', 'low'].includes(tx.categoryConfidence)) {
            tx.categoryConfidence = null;
        }

        // paymentMethod: accept if it matches value or label; otherwise null
        let pmResolved = null;
        if (tx.paymentMethod) {
            if (pmByValue.has(tx.paymentMethod)) pmResolved = pmByValue.get(tx.paymentMethod).value;
            else if (pmByLabel.has(String(tx.paymentMethod).toLowerCase())) pmResolved = pmByLabel.get(String(tx.paymentMethod).toLowerCase()).value;
            else pmResolved = null;
        }

        // If no paymentMethod provided or could not resolve, consider Online Banking fallback
        if (!pmResolved) {
            if (!tx.paymentMethod && onlineBanking) {
                // use fallback with low confidence
                tx.paymentMethod = onlineBanking.value;
                tx.paymentMethodConfidence = 'low';
            } else if (!tx.paymentMethod && !onlineBanking) {
                tx.paymentMethod = null;
                tx.paymentMethodConfidence = null;
            } else {
                // paymentMethod was provided by AI but didn't match known list
                tx.paymentMethod = null;
                // preserve any paymentMethodConfidence only if valid, else null
                if (tx.paymentMethodConfidence && ['high', 'medium', 'low'].includes(tx.paymentMethodConfidence)) {
                    // keep as-is (but paymentMethod is null)
                } else {
                    tx.paymentMethodConfidence = null;
                }
            }
        } else {
            // Resolved to a known payment method value
            tx.paymentMethod = pmResolved;
            // Ensure confidence value is valid; if missing, keep null (model should provide it)
            if (!(tx.paymentMethodConfidence && ['high', 'medium', 'low'].includes(tx.paymentMethodConfidence))) {
                // leave as null — we don't infer high/medium automatically
                tx.paymentMethodConfidence = null;
            }
        }

        return tx;
    });

    // Final validation after normalization
    if (!validateParsedResponse(parsed)) {
        const err = new Error('AI produced invalid structured output after normalization');
        err.code = 'INVALID_AI_OUTPUT';
        throw err;
    }

    return parsed;
}

module.exports = { parseText };
