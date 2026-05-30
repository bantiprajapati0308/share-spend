const { db, FieldValue } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

const expensesCol = (uid, tripId) =>
    db.collection('users').doc(uid).collection('trips').doc(tripId).collection('expenses');

// GET /api/trips/:tripId/expenses
const getExpenses = async (req, res) => {
    try {
        const snap = await expensesCol(req.uid, req.params.tripId)
            .orderBy('createdAt', 'asc')
            .get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/trips/:tripId/expenses
const addExpense = async (req, res) => {
    try {
        const data = { ...req.body, createdAt: FieldValue.serverTimestamp() };
        const ref = await expensesCol(req.uid, req.params.tripId).add(data);
        ok(res, { id: ref.id, ...req.body }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/trips/:tripId/expenses/:expenseId
const updateExpense = async (req, res) => {
    try {
        await expensesCol(req.uid, req.params.tripId).doc(req.params.expenseId).update(req.body);
        ok(res, { id: req.params.expenseId, ...req.body });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId/expenses/:expenseId
const deleteExpense = async (req, res) => {
    try {
        await expensesCol(req.uid, req.params.tripId).doc(req.params.expenseId).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
