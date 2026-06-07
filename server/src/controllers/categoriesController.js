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
    { name: 'Lent', emoji: '🤝', type: 'spend', isPredefined: true, systemId: 'lent' },
    { name: 'Borrowed Pay', emoji: '💳', type: 'spend', isPredefined: true, systemId: 'borrowed_pay' },
    { name: 'Credit Cards Bill', emoji: '💰', type: 'spend', isPredefined: true },
    { name: 'Salary', emoji: '💼', type: 'income', isPredefined: true },
    { name: 'Bonus', emoji: '🎉', type: 'income', isPredefined: true },
    { name: 'Borrowed', emoji: '📋', type: 'income', isPredefined: true, systemId: 'borrowed' },
    { name: 'Repayment', emoji: '✅', type: 'income', isPredefined: true, systemId: 'repayment' },
];

const col = (uid) => db.collection('users').doc(uid).collection('categories');
const userDoc = (uid) => db.collection('users').doc(uid);

/**
 * Category IDs that are managed by the system.
 * These cannot be deleted — only renamed.
 */
const SYSTEM_CATEGORY_IDS = new Set(['credit_card', 'lent', 'borrowed_pay', 'borrowed', 'repayment']);

/**
 * Seed predefined categories for a user. Idempotent — skips any that already exist
 * OR that the user has explicitly deleted.
 * Called internally on new user registration (no HTTP request/response needed).
 */
const seedPredefinedCategoriesForUser = async (uid) => {
    // Load existing categories and the deleted-predefined exclusion list in parallel.
    const [snap, userSnap] = await Promise.all([
        col(uid).get(),
        userDoc(uid).get(),
    ]);

    const existingNames = new Set(snap.docs.map((d) => d.data().name));
    // Categories the user deliberately deleted — never re-seed these.
    const deletedPredefined = new Set(userSnap.data()?.deletedPredefinedCategories || []);

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    let added = 0;

    PREDEFINED_CATEGORIES.forEach(({ name, emoji, type, systemId }) => {
        if (!existingNames.has(name) && !deletedPredefined.has(name)) {
            const ref = systemId ? col(uid).doc(systemId) : col(uid).doc();
            const docData = { name, emoji: emoji || '', type, isEnabled: true, isPredefined: true, createdAt: now, updatedAt: now };
            if (systemId) docData.systemId = systemId;
            batch.set(ref, docData);
            added++;
        }
    });

    if (added > 0) await batch.commit();
    return added;
};

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
        if (SYSTEM_CATEGORY_IDS.has(req.params.id)) {
            return badRequest(res, 'This system category cannot be deleted. You may rename it.');
        }

        const ref = col(req.uid).doc(req.params.id);
        const snap = await ref.get();

        if (!snap.exists) {
            await ref.delete();
            return ok(res, { deleted: true });
        }

        const data = snap.data();

        // Block deletion of system categories identified by their systemId field
        // (protects documents regardless of their Firestore document ID)
        if (data.systemId && SYSTEM_CATEGORY_IDS.has(data.systemId)) {
            return badRequest(res, 'This system category cannot be deleted. You may rename it.');
        }

        await ref.delete();

        // If the user is deleting a predefined category, record it so the seeder
        // never re-adds it on subsequent logins.
        if (data.isPredefined) {
            await userDoc(req.uid).update({
                deletedPredefinedCategories: FieldValue.arrayUnion(data.name),
            });
        }

        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/categories/initialize  — idempotent HTTP endpoint (kept for backwards compat)
const initializeCategories = async (req, res) => {
    try {
        const added = await seedPredefinedCategoriesForUser(req.uid);
        ok(res, { initialized: true, added });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory, initializeCategories, seedPredefinedCategoriesForUser };
