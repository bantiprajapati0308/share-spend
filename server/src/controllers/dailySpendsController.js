const { db, FieldValue } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

const col = (uid) => db.collection('users').doc(uid).collection('dailySpends');

// GET /api/daily-spends?type=spend|income
const getTransactions = async (req, res) => {
    try {
        // NOTE: the compound query (type + createdAt) requires a Firestore composite index:
        //   Collection: users/{uid}/dailySpends  Fields: type ASC, createdAt DESC
        let query = col(req.uid).orderBy('createdAt', 'desc');
        if (req.query.type) {
            query = col(req.uid)
                .where('type', '==', req.query.type)
                .orderBy('createdAt', 'desc');
        }
        const snap = await query.get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
        const snap = await ref.get();
        ok(res, { id: snap.id, ...snap.data() });
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
