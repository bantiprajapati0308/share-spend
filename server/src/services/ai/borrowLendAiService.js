const { MAX_INPUT_LENGTH } = require('../../config/aiConfig');
const { generateJson } = require('./geminiClient');

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
                    time: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    dueDate: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                },
                required: ['action', 'personName', 'amount', 'date', 'time', 'dueDate', 'description'],
                additionalProperties: false,
            },
        },
        warnings: { type: 'array', items: { type: 'string' } },
    },
    required: ['transactions', 'warnings'],
    additionalProperties: false,
};

const buildBorrowLendPrompt = ({ text, currentDate, currentTime, timezone, defaultAction, ledger }) => `Extract every distinct money transaction from the user's text and optional image. The image may be a payment screenshot, receipt, or handwritten note. Read English, Hindi, Hinglish, and Romanized Hindi. Return JSON only, matching the schema.

Map action by perspective: lend = user gave money and expects it back ("udhar diye", "maine paise diye"); borrow = user received money and must repay ("udhar liya", "maine udhar liya"); return = someone paid back money previously lent to the user ("paise lautaye", "returned my loan"); repay = user paid back money previously borrowed ("udhar chukaya", "maine wapas kiya"). Use ${defaultAction || 'the wording'} as context only when the action is not explicit. Do not confuse return with repay.

Extract personName, amount, transaction date, transaction time, optional dueDate, and concise description. Keep separate payments separate. Use null for unreadable or missing names, amounts, or dates; date may default to ${currentDate} only when a transaction is clear. For a clear transaction with no time stated, always use the supplied current local time (${currentTime}) in HH:MM:SS; do not return a null time. Respect an explicitly stated time or relative time instead. For time-of-day phrases without a clock time, use morning 10:00:00, afternoon 14:00:00, evening 18:00:00, and night 22:00:00. The timezone is ${timezone || 'UTC'}. Never invent due dates. Do not create transactions for balances, totals, or unrelated text.

Current local date: ${currentDate}
Current local time: ${currentTime}
Timezone: ${timezone || 'UTC'}

Existing user ledger context (use only to understand likely names and history; never change existing records): ${JSON.stringify(ledger)}

User text: """${text || ''}"""`;

function isValidResponse(value) {
    return value && Array.isArray(value.transactions) && Array.isArray(value.warnings)
        && value.transactions.every((transaction) => transaction
            && ['lend', 'borrow', 'return', 'repay'].includes(transaction.action)
            && (transaction.personName === null || typeof transaction.personName === 'string')
            && (transaction.amount === null || (typeof transaction.amount === 'number' && Number.isFinite(transaction.amount)))
            && (transaction.date === null || typeof transaction.date === 'string')
            && (transaction.time === null || (typeof transaction.time === 'string' && isValidTime(transaction.time)))
            && (transaction.dueDate === null || typeof transaction.dueDate === 'string')
            && (transaction.description === null || typeof transaction.description === 'string'));
}

function isValidTime(value) {
    const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) return false;
    const [, hours, minutes, seconds = '00'] = match;
    return Number(hours) < 24 && Number(minutes) < 60 && Number(seconds) < 60;
}

async function parseBorrowLendInput({ text, image, defaultAction, ledger, currentDate, currentTime, timezone }) {
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
    const resolvedCurrentTime = currentTime || new Date().toISOString().slice(11, 19);
    const prompt = buildBorrowLendPrompt({
        text,
        currentDate,
        currentTime: resolvedCurrentTime,
        timezone,
        defaultAction,
        ledger,
    });
    let interaction;
    try {
        interaction = await generateJson({
            prompt,
            schema: BORROW_LEND_SCHEMA,
            image,
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
    parsed.transactions = parsed.transactions.map((transaction) => ({
        ...transaction,
        time: transaction.time || resolvedCurrentTime,
    }));
    return parsed;
}

module.exports = { parseBorrowLendInput };