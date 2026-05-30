const { db, FieldValue } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

const col = (uid) => db.collection('users').doc(uid).collection('dailySpends');

// GET /api/daily-spends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&type=spend|income]
const getTransactions = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        let query = col(req.uid);
        let docs;

        if (startDate && endDate) {
            const snap = await query
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .get();
            docs = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        } else if (type) {
            // Legacy: type-only filter (composite index: type ASC, createdAt DESC)
            const snap = await query
                .where('type', '==', type)
                .orderBy('createdAt', 'desc')
                .get();
            docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else {
            // No filter — full collection ordered by creation time (fallback / admin use)
            const snap = await query.orderBy('createdAt', 'desc').get();
            docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        ok(res, docs);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/daily-spends
const addTransaction = async (req, res) => {
    try {
        const now = FieldValue.serverTimestamp();
        const data = { ...req.body, userId: req.uid, createdAt: now, updatedAt: now };
        const ref = await col(req.uid).add(data);
        ok(res, { id: ref.id, ...req.body }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/daily-spends/:id
const updateTransaction = async (req, res) => {
    try {
        const ref = col(req.uid).doc(req.params.id);
        await ref.update({ ...req.body, updatedAt: FieldValue.serverTimestamp() });

        ok(res, { id: req.params.id, ...req.body });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/daily-spends/:id
const deleteTransaction = async (req, res) => {
    try {
        await col(req.uid).doc(req.params.id).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
