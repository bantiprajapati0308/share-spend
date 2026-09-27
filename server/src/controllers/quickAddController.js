const { ok, fail, badRequest } = require('../utils/response');
const { parseText } = require('../services/ai/aiParserService');
const { db } = require('../config/firebase');
const UserRepository = require('../repositories/UserRepository');

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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
        const { text = '', image = null } = req.body || {};
        if (typeof text !== 'string' || (!text.trim() && !image)) return badRequest(res, 'Add a description or receipt image');

        let validatedImage = null;
        if (image) {
            if (typeof image.data !== 'string' || !ALLOWED_IMAGE_TYPES.has(image.mimeType)) {
                return badRequest(res, 'Use a JPEG, PNG, or WebP image');
            }
            const base64 = image.data.replace(/^data:image\/(?:jpeg|png|webp);base64,/, '');
            if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return badRequest(res, 'The image data is invalid');
            const imageBuffer = Buffer.from(base64, 'base64');
            if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
                return badRequest(res, 'Image must be smaller than 1.5 MB');
            }
            validatedImage = { data: imageBuffer.toString('base64'), mimeType: image.mimeType };
        }

        const uid = req.uid; // set by auth middleware
        const currentDate = new Date().toISOString().slice(0, 10);

        // Provide optional context to the AI — helps mapping but not required.
        const [categories, paymentMethods, timezone] = await Promise.all([
            getUserCategories(uid),
            getPaymentMethods(),
            getUserTimezone(uid),
        ]);

        const parsed = await parseText(text, { currentDate, categories, paymentMethods, timezone, image: validatedImage });

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
