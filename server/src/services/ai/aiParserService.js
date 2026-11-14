const { MAX_INPUT_LENGTH } = require('../../config/aiConfig');
const { generateJson } = require('./geminiClient');

if (!process.env.GEMINI_API_KEY) {
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
    const {
        categories = [],
        paymentMethods = [],
        timezone = null,
        currentTime = null,
        recentTransactions = [],
    } = options;
    // Provide closed lists for categories (id, name, emoji, type) and paymentMethods (value,label)
    const catList = JSON.stringify(categories);
    const pmList = JSON.stringify(paymentMethods);
    const transactionHistory = JSON.stringify(recentTransactions);

    return `Extract financial transactions from the user's text and attached image, if present. Images may be receipts, payment screenshots, or handwriting. Read English, Hindi, Hinglish, and Romanized Hindi. Return only JSON matching the provided schema. Extract amount, date, time, payment method, concise name, and useful merchant/item notes. For itemized receipts, group items by best matching category and sum amounts within each category; keep separate payments separate. Do not duplicate a purchase described in both text and image. If no transaction is readable, return no transactions and explain in warnings. Never guess unreadable or missing values; use null.

Current local date: ${currentDate}
Current local time: ${currentTime || 'not provided'}
Timezone: ${timezone || 'UTC'}
Use this date, time, and timezone to resolve relative dates and times. For "abhi"/"right now"/"just now", use the current local date and time. For relative phrases such as "1 ghanta pehle", "30 min phle", "2 hours ago", or "15 minutes earlier", subtract the stated duration from the current local date and time, including changing the date when the subtraction crosses midnight. Return the resulting time in HH:MM:SS and date in YYYY-MM-DD. Mark date and time confidence high when a precise relative duration or "just now" is given. Do not use the server's receipt-processing time as the transaction time when the user gives a different time.

Do not treat a time-of-day phrase as a relative duration. When the user says "aaj subah"/"this morning", use currentDate as the date and the morning default below as the time, even if the current local time is later in the day. Do not question whether the transaction time is plausible, compare it with the current time, lower confidence, or add an ambiguity warning just because the mentioned time is earlier than now. Apply the same rule to "aaj dopahar"/"this afternoon", "aaj shaam"/"this evening", and "aaj raat"/"tonight", using the corresponding defaults below.

Return explicit times as HH:MM:SS. Time-of-day defaults: morning 10:00, afternoon 14:00, evening 18:00, night 22:00. Use currentDate with medium date confidence when no date is visible or mentioned. Use only category IDs and payment-method values from the supplied lists. Categories explicitly stated are high confidence; clear category inferences are medium; no reasonable match is null. Explicit payment methods are high confidence, clear hints medium. If payment method is missing, use the Online Banking option only if it exists and mark it low confidence; otherwise return null. Keep names concise and put extra context in note.

Time rules: Return explicit times in HH:MM:SS 24-hour format. If the user gives only a time-of-day phrase and no explicit time, use these defaults: morning/subah = 10:00:00, afternoon/dopahar = 14:00:00, evening/shaam/sham = 18:00:00, night/raat = 22:00:00.

Inference and confidence rules:
- For categoryId, use an exact category mentioned by the user with categoryConfidence "high". You may infer the closest matching category from UserCategories with categoryConfidence "medium" when the meaning is clear. For example, spending with Abhishek can map to a "Friend Spend" category if it exists, and eating momos can map to "Junk Food" if it exists. Return null for categoryId and categoryConfidence when there is no reasonable category match.
- Recognize the four Borrow/Lend system categories by their supplied category ID/name: "lent" / "Lent", "borrowed_pay" / "Borrowed Pay", "borrowed" / "Borrowed", and "repayment" / "Repayment". Use only a matching category actually present in UserCategories. Map money the user gives/lends to a person to the "Lent" expense category; money the user receives as a loan to "Borrowed" income; the user's payment back toward money they borrowed to "Borrowed Pay" expense; and money received back from someone who owed the user to "Repayment" income. Resolve direction from the full sentence in English, Hindi, or Hinglish (including "udhar", "liye/liya", "diye/diya", "wapas", "chukaya", "borrowed", "lent", "paid back", and "repaid"); do not classify unrelated purchases, gifts, or income as loans just because a person's name is mentioned.
- For any of those four Borrow/Lend categories, set the transaction "name" to the person's name explicitly mentioned in the current text/image, not a generic label such as "Borrowed", "Repayment", or "Loan". Exclude relationship/action words and pronouns from the name, preserve the person's full name when present, and keep the purpose or other context in "note". If no person is identified in the current input, use null for name rather than guessing from recent transaction history. The review form will provide the appropriate existing-person dropdown for these categories.
- An explicitly stated payment method in the current text or image always overrides historical habits, inferred preferences, and category-based assumptions. Match it to the supplied PaymentMethods list and set paymentMethodConfidence to "high". Never claim it conflicts with a user's habits or categories. If the explicit method has no matching list entry, return null for paymentMethod and explain that it is unavailable in warnings; do not substitute another method.
- Use dateConfidence "high" when the user gives an explicit or relative date (for example, 2026-01-10, today, aaj, yesterday, kal, parso). If no date is mentioned, use the supplied currentDate (${currentDate}) and dateConfidence "medium".
- Use timeConfidence "high" for an explicit clock time or precise relative duration ("30 minutes ago"). Use timeConfidence "medium" when applying a time-of-day default from the Time rules, including "aaj subah". If no time or time-of-day phrase is mentioned, use the supplied current local time (${currentTime || 'not provided'}) as the transaction time in HH:MM:SS and set timeConfidence to "medium". Never return a null time for a clear transaction when the current local time is supplied. Never lower confidence or add warnings because a time-of-day phrase is earlier than the current local time.
- For ordinary expenses or income, keep name minimal: only the concise item, merchant, or income name (for example, "Momos", "Petrol", or "Salary"). Put descriptive context such as people, vehicle, purpose, or place in note. The Borrow/Lend category rule above takes precedence and requires the person's name in name.

Recent user transactions are context only to help interpret the wording and entry style of the current input. Use them only to understand the user's naming, category, notes, and payment-method conventions. The current text and attached image are the sole source of transaction facts: never reuse or infer an amount, date, time, item, merchant, category, or payment method from history when it is not supported by the current input. Never create transactions from history or let it override the current input, especially when the current input explicitly states a payment method.
${transactionHistory}

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
function completeInferredFields(parsed, currentDate, currentTime) {
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

        if (!transaction.time) {
            transaction.time = currentTime;
            transaction.timeConfidence = 'medium';
        } else if (transaction.timeConfidence === undefined) {
            transaction.timeConfidence = 'medium';
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
    const { image = null } = options;
    if ((!text || typeof text !== 'string' || !text.trim()) && !image) {
        const err = new Error('Empty input');
        err.code = 'EMPTY_INPUT';
        throw err;
    }

    // enforce maximum input length before sending content to Gemini
    if (text && typeof MAX_INPUT_LENGTH === 'number' && text.length > MAX_INPUT_LENGTH) {
        const err = new Error('Input too large');
        err.code = 'INPUT_TOO_LARGE';
        throw err;
    }

    const currentDate = options.currentDate || new Date().toISOString().slice(0, 10);
    const currentTime = options.currentTime || new Date().toISOString().slice(11, 19);
    const prompt = buildPrompt(text, currentDate, options);

    let interaction;
    try {
        interaction = await generateJson({
            prompt,
            schema: QUICK_ADD_JSON_SCHEMA,
            image,
        });
    } catch (e) {
        // Log a concise, non-sensitive diagnostic for server logs
        try {
            console.error('[aiParserService] AI generation error:', e?.message || e);
            if (e?.code) console.error('[aiParserService] error.code:', e.code);
            // If SDK provides a response/status, log the keys only (no bodies)
            if (e?.status) console.error('[aiParserService] provider status:', e.status);
        } catch (logErr) {
            console.error('[aiParserService] error while logging AI generation error');
        }

        const err = new Error('AI generation failed');
        err.code = 'AI_GENERATION_FAILED';
        err.cause = { message: e?.message, code: e?.code };
        throw err;
    }

    let parsed = null;
    try {
        if (interaction && typeof interaction.output_text === 'string') {
            parsed = JSON.parse(interaction.output_text);
        }
    } catch {
        parsed = null;
    }

    completeInferredFields(parsed, currentDate, currentTime);

    if (!parsed || !validateParsedResponse(parsed)) {
        const err = new Error('AI produced invalid or unexpected structured output');
        err.code = 'INVALID_AI_OUTPUT';
        // Attach a short diagnostic for server logs
        const diag = { sample: typeof interaction === 'object' ? Object.keys(interaction).slice(0, 10) : undefined };
        if (parsed && Array.isArray(parsed.transactions)) {
            diag.transactionKeys = parsed.transactions.slice(0, 3).map((transaction) => (
                transaction && typeof transaction === 'object' ? Object.keys(transaction) : typeof transaction
            ));
        }

        // If developer enables debug, include a small, trimmed snippet of the provider response
        // WARNING: this may contain parts of the user's input or AI output; enable only for local debugging.
        try {
            if (process.env.QUICK_ADD_DEBUG === '1' && interaction && typeof interaction === 'object') {
                if (typeof interaction.output_text === 'string') diag.outputTextSnippet = interaction.output_text.slice(0, 1000);
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
