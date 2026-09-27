const { GoogleGenAI } = require('@google/genai');
const { MODEL, MAX_INPUT_LENGTH } = require('../../config/aiConfig');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BORROW_LEND_SCHEMA = {
    type: 'object',
    properties: {
        transactions: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['lend', 'borrow', 'return', 'repay'] },
                    personName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    amount: { anyOf: [{ type: 'number' }, { type: 'null' }] },
                    date: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    dueDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                },
                required: ['action', 'personName', 'amount', 'date', 'dueDate', 'description'],
                additionalProperties: false,
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
    },
    required: ['transactions', 'warnings'],
    additionalProperties: false,
};

const buildBorrowLendPrompt = ({ text, currentDate, defaultAction, ledger }) => `Extract every distinct money transaction from the user's text and optional image. The image may be a payment screenshot, receipt, or handwritten note. Read English, Hindi, Hinglish, and Romanized Hindi. Return JSON only, matching the schema.

Map action by perspective: lend = user gave money and expects it back ("udhar diye", "maine paise diye"); borrow = user received money and must repay ("udhar liya", "maine udhar liya"); return = someone paid back money previously lent to the user ("paise lautaye", "returned my loan"); repay = user paid back money previously borrowed ("udhar chukaya", "maine wapas kiya"). Use ${defaultAction || 'the wording'} as context only when the action is not explicit. Do not confuse return with repay.

Extract personName, amount, transaction date, optional dueDate, and concise description. Keep separate payments separate. Use null for unreadable or missing names, amounts, or dates; date may default to ${currentDate} only when a transaction is clear. Never invent due dates. Do not create transactions for balances, totals, or unrelated text.

Existing user ledger context (use only to understand likely names and history; never change existing records): ${JSON.stringify(ledger)}

User text: """${text || ''}"""`;

function isValidResponse(value) {
    return value && Array.isArray(value.transactions) && Array.isArray(value.warnings)
        && value.transactions.every((transaction) => transaction
            && ['lend', 'borrow', 'return', 'repay'].includes(transaction.action)
            && (transaction.personName === null || typeof transaction.personName === 'string')
            && (transaction.amount === null || (typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)))
            && (transaction.date === null || typeof transaction.date === 'string')
            && (transaction.dueDate === null || typeof transaction.dueDate === 'string')
            && (transaction.description === null || typeof transaction.description === 'string'));
}

async function parseBorrowLendInput({ text, image, defaultAction, ledger, currentDate }) {
    if ((!text || !text.trim()) && !image) {
        const error = new Error('Describe a transaction or attach an image');
        error.code = 'EMPTY_INPUT';
        throw error;
    }
    if (text && text.length > MAX_INPUT_LENGTH) {
        const error = new Error('Input too large');
        error.code = 'INPUT_TOO_LARGE';
        throw error;
    }
    if (!GEMINI_API_KEY) {
        const error = new Error('AI service not configured');
        error.code = 'NO_API_KEY';
        throw error;
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = buildBorrowLendPrompt({ text, currentDate, defaultAction, ledger });
    let interaction;
    try {
        interaction = await ai.interactions.create({
            model: MODEL,
            input: image
                ? [{ type: 'text', text: prompt }, { type: 'image', data: image.data, mime_type: image.mimeType }]
                : prompt,
            response_format: { type: 'text', mime_type: 'application/json', schema: BORROW_LEND_SCHEMA },
        });
    } catch (cause) {
        const error = new Error('AI generation failed');
        error.code = 'AI_GENERATION_FAILED';
        error.cause = cause;
        throw error;
    }

    let parsed;
    try {
        parsed = JSON.parse(interaction.output_text);
    } catch {
        const error = new Error('AI returned invalid transaction data');
        error.code = 'INVALID_AI_OUTPUT';
        throw error;
    }
    if (!isValidResponse(parsed)) {
        const error = new Error('AI returned invalid transaction data');
        error.code = 'INVALID_AI_OUTPUT';
        throw error;
    }
    return parsed;
}

module.exports = { parseBorrowLendInput };