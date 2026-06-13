const { db, FieldValue } = require('../config/firebase');
const { ok, fail, badRequest } = require('../utils/response');

/**
 * Single source of truth for all predefined categories.
 * Every entry has a stable custom `id` used as the Firestore document ID.
 * `noDeletable: true`  — system-required categories (BorrowLend, CC tracking); rename only.
 * `noDeletable: false` — user-removable predefined categories.
 */
const PREDEFINED_CATEGORIES = [
    { id: 'grocery', name: 'Grocery', emoji: '🛒', type: 'spend', noDeletable: false },
    { id: 'rent', name: 'Rent', emoji: '🏠', type: 'spend', noDeletable: false },
    { id: 'transportation', name: 'Transportation', emoji: '🚗', type: 'spend', noDeletable: false },
    { id: 'emis', name: 'EMIs', emoji: '💳', type: 'spend', noDeletable: false },
    { id: 'investment', name: 'Investment', emoji: '📈', type: 'spend', noDeletable: false },
    { id: 'personal', name: 'Personal', emoji: '👤', type: 'spend', noDeletable: false },
    { id: 'friend_spent', name: 'Friend Spent', emoji: '👫', type: 'spend', noDeletable: false },
    { id: 'lent', name: 'Lent', emoji: '🤝', type: 'spend', noDeletable: true },
    { id: 'borrowed_pay', name: 'Borrowed Pay', emoji: '💳', type: 'spend', noDeletable: true },
    { id: 'credit_cards_bill', name: 'Credit Cards Bill', emoji: '💰', type: 'spend', noDeletable: false },
    { id: 'credit_card', name: 'Credit Card Spends', emoji: '💳', type: 'income', noDeletable: true },
    { id: 'salary', name: 'Salary', emoji: '💼', type: 'income', noDeletable: false },
    { id: 'bonus', name: 'Bonus', emoji: '🎉', type: 'income', noDeletable: false },
    { id: 'borrowed', name: 'Borrowed', emoji: '📋', type: 'income', noDeletable: true },
    { id: 'repayment', name: 'Repayment', emoji: '✅', type: 'income', noDeletable: true },
];

/** Fast lookup sets derived from the single source above — never edited directly. */
const PREDEFINED_CATEGORY_IDS = new Set(PREDEFINED_CATEGORIES.map(c => c.id));
const PREDEFINED_CATEGORY_NAMES = new Set(PREDEFINED_CATEGORIES.map(c => c.name));

const col = (uid) => db.collection('users').doc(uid).collection('categories');
const userDoc = (uid) => db.collection('users').doc(uid);

/**
 * Seed predefined categories for a user. Fully idempotent:
 *   – Checks by stable doc ID  (new users / already-seeded stable IDs).
 *   – Falls back to name check  (existing users whose predefined docs have auto-generated IDs).
 *   – Respects deletedPredefinedCategories array stored on the user doc.
 * Called internally on new user registration.
 */
const seedPredefinedCategoriesForUser = async (uid) => {
    const [snap, userSnap] = await Promise.all([
        col(uid).get(),
        userDoc(uid).get(),
    ]);

    const existingIds = new Set(snap.docs.map((d) => d.id));
    const existingNames = new Set(snap.docs.map((d) => d.data().name));
    // Names/IDs the user deliberately deleted — never re-seed these.
    const deletedPredefined = new Set(userSnap.data()?.deletedPredefinedCategories || []);

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    let added = 0;

    PREDEFINED_CATEGORIES.forEach(({ id, name, emoji, type, noDeletable }) => {
        if (
            !existingIds.has(id) &&
            !existingNames.has(name) &&
            !deletedPredefined.has(name) &&
            !deletedPredefined.has(id)
        ) {
            const ref = col(uid).doc(id);
            batch.set(ref, { id, name, emoji: emoji || '', type, noDeletable, isEnable: true, createdAt: now, updatedAt: now });
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
        if (req.query.enabled === 'true') query = query.where('isEnable', '==', true);
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
        // User-created categories always use an auto-generated Firestore doc ID.
        // We obtain the ref first so we can embed the same id inside the document itself,
        // keeping it as the single source of truth (no separate doc-ID vs field mismatch).
        const ref = col(req.uid).doc();
        const id = ref.id;
        await ref.set({ id, name, emoji: emoji || '', type, noDeletable: false, isEnable: true, createdAt: now, updatedAt: now });
        // Return a clean payload — FieldValue sentinels are not JSON-serialisable.
        ok(res, { id, name, emoji: emoji || '', type, noDeletable: false, isEnable: true }, 201);
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
        const ref = col(req.uid).doc(req.params.id);
        const snap = await ref.get();

        if (!snap.exists) {
            return ok(res, { deleted: true });
        }

        const data = snap.data();

        if (data.noDeletable === true) {
            return badRequest(res, 'This system category cannot be deleted. You may rename it.');
        }

        await ref.delete();

        // Track the deletion (by name for backward compat + by id for new schema)
        // so the seeder never re-adds it on subsequent logins.
        const isPredefinedEntry = PREDEFINED_CATEGORY_IDS.has(req.params.id) || PREDEFINED_CATEGORY_NAMES.has(data.name);
        if (isPredefinedEntry) {
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
