const { ok, fail, badRequest } = require('../utils/response');
const { parseText } = require('../services/ai/aiParserService');
const { db } = require('../config/firebase');
const UserRepository = require('../repositories/UserRepository');

// Minimal validation for the QuickAddResponse schema described in the task.
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

// GET user categories (names only) — optional context for the AI. Read-only.
async function getUserCategories(uid) {
    try {
        const snap = await db.collection('users').doc(uid).collection('categories').where('isEnable', '==', true).get();
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        // Silence errors — AI can function without this context
        return [];
    }
}

// GET payment methods from master config — optional context for the AI.
async function getPaymentMethods() {
    try {
        const snap = await db.collection('appConfig').doc('masterConfig').get();
        const pms = snap.exists ? snap.data().paymentMethods || [] : [];
        // Ensure each entry has { value, label }
        return pms.map(pm => ({ value: pm.value, label: pm.label }));
    } catch (e) {
        return [];
    }
}

async function getUserTimezone(uid) {
    try {
        const user = await UserRepository.getUserById(uid);
        return user?.timezone || user?.timeZone || null;
    } catch (e) {
        return null;
    }
}

// POST /api/quick-add/parse
const parse = async (req, res) => {
    try {
        const { text } = req.body || {};
        if (!text || typeof text !== 'string' || !text.trim()) return badRequest(res, 'text is required');

        const uid = req.uid; // set by auth middleware
        const currentDate = new Date().toISOString().slice(0, 10);

        // Provide optional context to the AI — helps mapping but not required.
        const [categories, paymentMethods, timezone] = await Promise.all([
            getUserCategories(uid),
            getPaymentMethods(),
            getUserTimezone(uid),
        ]);

        const parsed = await parseText(text, { currentDate, categories, paymentMethods, timezone });

        // Validate structure
        if (!validateParsedResponse(parsed)) {
            console.error('[quickAddController] Invalid AI response structure', { uid, parsedSample: JSON.stringify(parsed).slice(0, 200) });
            return fail(res, 'AI returned an invalid response');
        }

        // All good — return parsed JSON to the client
        return ok(res, parsed);
    } catch (err) {
        // Log error with minimal diagnostics (do not expose API key or full user input)
        try {
            console.error('[quickAddController] Error parsing quick-add text:', err?.message || err);
            if (err.code) console.error('[quickAddController] err.code:', err.code);
            if (err.cause && err.cause.message) console.error('[quickAddController] err.cause.message:', err.cause.message);
            if (err.diagnostic) console.error('[quickAddController] diagnostic keys:', Object.keys(err.diagnostic || {}).slice(0, 10));
            if (err.diagnostic?.transactionKeys) console.error('[quickAddController] AI transaction keys:', err.diagnostic.transactionKeys);
        } catch (logErr) {
            console.error('[quickAddController] error while logging parse error');
        }

        if (err.code === 'NO_API_KEY') {
            return fail(res, 'AI service not configured', 503);
        }
        if (err.code === 'INVALID_JSON') {
            return fail(res, 'AI produced invalid JSON', 502);
        }
        if (err.code === 'INVALID_AI_OUTPUT') {
            return fail(res, 'AI produced an invalid structured response', 502);
        }
        if (err.code === 'AI_GENERATION_FAILED') {
            return fail(res, 'AI generation failed', 502);
        }
        return fail(res, 'Failed to parse input', 500);
    }
};

module.exports = { parse };
