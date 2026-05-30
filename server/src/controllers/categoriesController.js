const { db, FieldValue } = require('../config/firebase');
const { ok, fail, badRequest } = require('../utils/response');

const PREDEFINED_CATEGORIES = [
    { name: 'Grocery', emoji: '🛒', type: 'spend', isPredefined: true },
    { name: 'Rent', emoji: '🏠', type: 'spend', isPredefined: true },
    { name: 'Transportation', emoji: '🚗', type: 'spend', isPredefined: true },
    { name: 'EMIs', emoji: '💳', type: 'spend', isPredefined: true },
    { name: 'Investment', emoji: '📈', type: 'spend', isPredefined: true },
    { name: 'Personal', emoji: '👤', type: 'spend', isPredefined: true },
    { name: 'Friend Spent', emoji: '👫', type: 'spend', isPredefined: true },
    { name: 'Lent', emoji: '🤝', type: 'spend', isPredefined: true },
    { name: 'Borrowed Pay', emoji: '💳', type: 'spend', isPredefined: true },
    { name: 'Credit Cards Bill', emoji: '💰', type: 'spend', isPredefined: true },
    { name: 'Salary', emoji: '💼', type: 'income', isPredefined: true },
    { name: 'Bonus', emoji: '🎉', type: 'income', isPredefined: true },
    { name: 'Borrowed', emoji: '📋', type: 'income', isPredefined: true },
    { name: 'Repayment', emoji: '✅', type: 'income', isPredefined: true, isEnabled: true },
];

const col = (uid) => db.collection('users').doc(uid).collection('categories');

// GET /api/categories?enabled=true
const getCategories = async (req, res) => {
    try {
        let query = col(req.uid);
        if (req.query.enabled === 'true') query = query.where('isEnabled', '==', true);
        const snap = await query.get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/categories
const addCategory = async (req, res) => {
    try {
        const { name, emoji, type } = req.body;
        if (!name || !type) return badRequest(res, 'name and type required');

        // Check for duplicate name — limit(1) stops scanning after first match
        const existing = await col(req.uid).where('name', '==', name).limit(1).get();
        if (!existing.empty) return badRequest(res, `Category "${name}" already exists`);

        const now = FieldValue.serverTimestamp();
        const data = { name, emoji: emoji || '', type, isEnabled: true, isPredefined: false, createdAt: now, updatedAt: now };
        const ref = await col(req.uid).add(data);
        ok(res, { id: ref.id, ...req.body, isEnabled: true }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/categories/:id
const updateCategory = async (req, res) => {
    try {
        await col(req.uid).doc(req.params.id).update({ ...req.body, updatedAt: FieldValue.serverTimestamp() });
        ok(res, { id: req.params.id, ...req.body });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
    try {
        await col(req.uid).doc(req.params.id).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/categories/initialize  — idempotent: adds any missing predefined categories
const initializeCategories = async (req, res) => {
    try {
        const snap = await col(req.uid).get();
        const existingNames = new Set(snap.docs.map((d) => d.data().name));
        const now = FieldValue.serverTimestamp();
        const batch = db.batch();
        let added = 0;

        PREDEFINED_CATEGORIES.forEach((cat) => {
            if (!existingNames.has(cat.name)) {
                const ref = col(req.uid).doc();
                batch.set(ref, { ...cat, isEnabled: cat.isEnabled ?? true, createdAt: now, updatedAt: now });
                added++;
            }
        });

        if (added > 0) await batch.commit();
        ok(res, { initialized: true, added });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory, initializeCategories };
