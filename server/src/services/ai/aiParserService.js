const { MAX_INPUT_LENGTH, DEFAULT_TIMEZONE } = require('../../config/aiConfig');
const { generateJson } = require('./geminiClient');

if (!process.env.GEMINI_API_KEY) {
    console.warn('[aiParserService] GEMINI_API_KEY not set; AI parsing will fail until provided.');
}

const QUICK_ADD_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        transactions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', enum: ['expense', 'income'] },
                    amount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
                    categoryName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
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
                required: [
                    'type', 'amount', 'categoryName', 'categoryConfidence', 'name',
                    'date', 'dateConfidence', 'time', 'timeConfidence', 'paymentMethod',
                    'paymentMethodConfidence', 'note',
                ],
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
        missingFields: { type: 'array', items: { type: 'string' } },
    },
    required: ['transactions', 'warnings', 'missingFields'],
};

function buildPrompt(text, currentDate, options = {}) {
    const {
        categories = [],
        paymentMethods = [],
        timezone = DEFAULT_TIMEZONE,
        currentTime = null,
        recentTransactions = [],
    } = options;
    const activeCategories = Array.isArray(categories) ? categories : [];
    const validPaymentMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
    const history = Array.isArray(recentTransactions) ? recentTransactions : [];
    const categoryNames = {
        expense: activeCategories
            .filter((category) => category?.isEnable === true && category.type === 'spend' && typeof category.name === 'string')
            .map((category) => category.name.slice(0, 100)),
        income: activeCategories
            .filter((category) => category?.isEnable === true && category.type === 'income' && typeof category.name === 'string')
            .map((category) => category.name.slice(0, 100)),
    };
    const catList = JSON.stringify(categoryNames);
    const pmList = JSON.stringify(validPaymentMethods.map(({ value, label }) => ({ value, label })));
    const transactionHistory = JSON.stringify(history.slice(0, 5).map((transaction) => ({
        type: typeof transaction?.type === 'string' ? transaction.type.slice(0, 20) : null,
        name: typeof transaction?.name === 'string' ? transaction.name.slice(0, 100) : null,
        category: typeof transaction?.category === 'string' ? transaction.category.slice(0, 100) : null,
        paymentMethod: typeof transaction?.paymentMethod === 'string' ? transaction.paymentMethod.slice(0, 50) : null,
    })));

    return `Extract readable expenses or income from the user's text and optional receipt/image. Read English, Hindi, and Hinglish. Return only JSON matching the response schema. For itemized receipts, group items by category and total each group; do not duplicate text/image purchases. If no transaction is readable, return an empty transactions list and explain in warnings.

Local date/time: ${currentDate} ${currentTime || 'not provided'} (${timezone}). Resolve relative dates/times using this local time. "Now"/"abhi" uses it; precise durations subtract from it. Explicit dates/times are high confidence. For "today morning/afternoon/evening/night" or "aaj subah/dopahar/shaam/raat", use today with 10:00/14:00/18:00/22:00 respectively and medium time confidence. Otherwise use the supplied local date/time with medium confidence. Return date YYYY-MM-DD and time HH:MM:SS.

Use only names in ActiveCategories and payment methods in PaymentMethods. Set categoryName to an exact category name: explicitly stated = high confidence; clear inference = medium. If uncertain, choose the first category in the matching expense/income list and mark low confidence; use null only if that list is empty. Return a payment method's value from its {value,label} entry. For lending/borrowing, map money the user gives to Lent expense, a loan received to Borrowed income, the user's repayment to Borrowed Pay expense, and money repaid to the user to Repayment income, when those categories exist. Resolve direction from the full English/Hindi/Hinglish sentence (e.g. udhar liya/diya, wapas, chukaya); don't classify gifts or unrelated income as loans. Use the explicitly named person's name, not a generic label. Keep ordinary transaction names concise; put extra context in note.

An explicitly stated payment method always wins. If missing, use Online Banking with low confidence only when available; otherwise use null. If an explicit method is unavailable, use null and explain in warnings. Never guess unreadable amounts or facts. Recent transactions are style context only; never copy their amounts, dates, times, names, categories, or methods as facts for this input.

ActiveCategories: ${catList}
PaymentMethods: ${pmList}
Recent transactions (type, name, category, payment method only): ${transactionHistory}
Input: """${text}"""`;
}

// Validate the parsed object against the quick-add response shape.
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

    const timezone = options.timezone || DEFAULT_TIMEZONE;
    const localParts = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date());
    const localValues = Object.fromEntries(localParts.map(({ type, value }) => [type, value]));
    const currentDate = options.currentDate || `${localValues.year}-${localValues.month}-${localValues.day}`;
    const currentTime = options.currentTime || `${localValues.hour}:${localValues.minute}:${localValues.second}`;
    const prompt = buildPrompt(text, currentDate, { ...options, currentTime, timezone });

    let interaction;
    try {
        interaction = await generateJson({
            prompt,
            schema: QUICK_ADD_RESPONSE_SCHEMA,
            image,
            usageLabel: 'quick-add-transaction-extraction',
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

    if (Array.isArray(parsed?.transactions)) {
        parsed.transactions.forEach((transaction) => {
            if (!transaction || typeof transaction !== 'object') return;
            transaction.categoryId = typeof transaction.categoryName === 'string'
                ? transaction.categoryName
                : null;
            delete transaction.categoryName;
        });
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
    const { categories: suppliedCategories = [], paymentMethods = [] } = options;
    const categories = suppliedCategories.filter((category) => category?.isEnable === true);

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
        if (!tx.categoryId) {
            const expectedType = tx.type === 'income' ? 'income' : 'spend';
            const fallbackCategory = categories.find((category) => (
                category
                && category.id
                && category.type === expectedType
                && category.isEnable === true
            ));
            if (fallbackCategory) {
                tx.categoryId = fallbackCategory.id;
                tx.categoryConfidence = 'low';
            } else {
                tx.categoryConfidence = null;
            }
        } else if (!['high', 'medium', 'low'].includes(tx.categoryConfidence)) {
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

    parsed.tokenUsage = {
        inputTokens: Number.isFinite(interaction.usageMetadata?.promptTokenCount)
            ? interaction.usageMetadata.promptTokenCount
            : null,
        outputTokens: Number.isFinite(interaction.usageMetadata?.candidatesTokenCount)
            ? interaction.usageMetadata.candidatesTokenCount
            : null,
    };

    return parsed;
}

module.exports = { parseText };
