const { db, FieldValue } = require('../config/firebase');
const { ok, fail, notFound, badRequest } = require('../utils/response');
const { requireTripMember } = require('../utils/tripAccess');

const expensesCol = (tripId) => db.collection('trips').doc(tripId).collection('expenses');

// GET /api/trips/:tripId/expenses
const getExpenses = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId);

        const snap = await expensesCol(tripId).get();
        const expenses = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                const aTime = a.createdAt?._seconds ?? (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
                const bTime = b.createdAt?._seconds ?? (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
                return aTime - bTime;
            });
        ok(res, expenses);
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// POST /api/trips/:tripId/expenses
const addExpense = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId);

        // Strip participants to essential fields only
        const rawParticipants = Array.isArray(req.body.participants) ? req.body.participants : [];
        const participants = rawParticipants.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email || null,
            tripId: p.tripId || tripId,
            userId: p.userId || null,
        }));

        // Resolve createdBy name from Firestore profile (denormalised for display)
        const userSnap = await db.collection('users').doc(req.uid).get();
        const userProfile = userSnap.data() || {};
        const createdByName =
            userProfile.firstName ||
            userProfile.displayName ||
            req.email ||
            'Unknown';

        const now = new Date().toISOString();
        const data = {
            name: req.body.name,
            amount: req.body.amount,
            paidBy: req.body.paidBy,
            description: req.body.description || '',
            participants,
            tripId,
            createdBy: req.uid,
            createdByName,
            createdAt: now,
            lastUpdated: now,
            lastUpdatedByName: createdByName,
        };
        const ref = await expensesCol(tripId).add(data);
        ok(res, { id: ref.id, ...data }, 201);
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// PUT /api/trips/:tripId/expenses/:expenseId
const updateExpense = async (req, res) => {
    try {
        const { tripId, expenseId } = req.params;
        await requireTripMember(req.uid, tripId);

        const expenseRef = expensesCol(tripId).doc(expenseId);
        const expenseSnap = await expenseRef.get();
        if (!expenseSnap.exists) return notFound(res, 'Expense not found');

        const rawParticipants = Array.isArray(req.body.participants) ? req.body.participants : [];
        const participants = rawParticipants.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email || null,
            tripId: p.tripId || tripId,
            userId: p.userId || null,
        }));

        // Resolve editor's display name for audit trail
        const userSnap = await db.collection('users').doc(req.uid).get();
        const userProfile = userSnap.data() || {};
        const lastUpdatedByName =
            userProfile.firstName ||
            userProfile.displayName ||
            req.email ||
            'Unknown';

        const updates = {
            name: req.body.name,
            amount: req.body.amount,
            paidBy: req.body.paidBy,
            description: req.body.description || '',
            participants,
            updatedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            lastUpdatedByName,
        };
        delete updates.tripId;
        delete updates.createdBy;

        await expenseRef.update(updates);
        ok(res, { id: expenseId, ...updates, tripId });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId/expenses/:expenseId
const deleteExpense = async (req, res) => {
    try {
        const { tripId, expenseId } = req.params;
        await requireTripMember(req.uid, tripId);

        const expenseRef = expensesCol(tripId).doc(expenseId);
        const expenseSnap = await expenseRef.get();
        if (!expenseSnap.exists) return notFound(res, 'Expense not found');

        await expenseRef.delete();
        ok(res, { deleted: true });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
