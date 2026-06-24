const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, badRequest } = require('../../utils/response');

const col = (uid) => db.collection('users').doc(uid).collection('categoryLimits');
const userDoc = (uid) => db.collection('users').doc(uid);

// Default limits seeded for every new user (amounts in INR).
// Only spend categories get a limit; income categories are excluded.
const PREDEFINED_LIMITS = [
    { category: 'Grocery', limit: 5000, type: 'spend' },
    { category: 'Rent', limit: 15000, type: 'spend' },
    { category: 'Transportation', limit: 3000, type: 'spend' },
    { category: 'EMIs', limit: 4000, type: 'spend' },
    { category: 'Investment', limit: 5000, type: 'spend' },
    { category: 'Personal', limit: 2000, type: 'spend' },
    { category: 'Friend Spent', limit: 1500, type: 'spend' },
    { category: 'Credit Cards Bill', limit: 7000, type: 'spend' },
    { category: 'Salary', limit: 40000, type: 'income' },
    { category: 'Bonus', limit: 5000, type: 'income' },
];

/**
 * Seed predefined category limits for a user. Idempotent — skips categories
 * that already have a limit entry OR that the user has explicitly deleted.
 * Called internally on new user registration.
 */
const seedPredefinedLimitsForUser = async (uid) => {
    // Load existing limits and the user's deleted-predefined-limits exclusion list in parallel.
    const [limitsSnap, userSnap] = await Promise.all([
        col(uid).get(),
        userDoc(uid).get(),
    ]);

    const existingCategories = new Set(limitsSnap.docs.map((d) => d.data().category));
    // Categories the user deliberately deleted — never re-seed these.
    const deletedPredefined = new Set(userSnap.data()?.deletedPredefinedLimits || []);

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    let added = 0;

    PREDEFINED_LIMITS.forEach(({ category, limit, type }) => {
        if (!existingCategories.has(category) && !deletedPredefined.has(category)) {
            const ref = col(uid).doc();
            batch.set(ref, { category, limit, type, startDate: null, endDate: null, isPredefined: true, createdAt: now, updatedAt: now });
            added++;
        }
    });

    if (added > 0) await batch.commit();
    return added;
};

// GET /api/category-limits
const getCategoryLimits = async (req, res) => {
    try {
        const snap = await col(req.uid).get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/category-limits
const addCategoryLimit = async (req, res) => {
    try {
        const { category, limit, startDate, endDate } = req.body;
        if (!category || limit == null) return badRequest(res, 'category and limit required');
        const now = FieldValue.serverTimestamp();
        const data = { category, limit: Number(limit), startDate: startDate || null, endDate: endDate || null, createdAt: now, updatedAt: now };
        const ref = await col(req.uid).add(data);
        ok(res, { id: ref.id, ...req.body }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/category-limits/:id
const updateCategoryLimit = async (req, res) => {
    try {
        await col(req.uid).doc(req.params.id).update({ ...req.body, updatedAt: FieldValue.serverTimestamp() });
        ok(res, { id: req.params.id, ...req.body });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/category-limits/:id
const deleteCategoryLimit = async (req, res) => {
    try {
        const ref = col(req.uid).doc(req.params.id);
        const snap = await ref.get();

        if (!snap.exists) {
            await ref.delete();
            return ok(res, { deleted: true });
        }

        const data = snap.data();
        await ref.delete();

        // If the user is deleting a predefined limit, record it so the seeder
        // never re-adds it on subsequent logins.
        if (data.isPredefined) {
            await userDoc(req.uid).update({
                deletedPredefinedLimits: FieldValue.arrayUnion(data.category),
            });
        }

        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit, seedPredefinedLimitsForUser };
