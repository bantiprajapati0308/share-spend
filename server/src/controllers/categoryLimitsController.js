const { db, FieldValue } = require('../config/firebase');
const { ok, fail, badRequest } = require('../utils/response');

const col = (uid) => db.collection('users').doc(uid).collection('categoryLimits');

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
        const ref = col(req.uid).doc(req.params.id);
        await ref.update({ ...req.body, updatedAt: FieldValue.serverTimestamp() });
        const snap = await ref.get();
        ok(res, { id: snap.id, ...snap.data() });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/category-limits/:id
const deleteCategoryLimit = async (req, res) => {
    try {
        await col(req.uid).doc(req.params.id).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit };
