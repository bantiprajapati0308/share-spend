const { db, admin, FieldValue } = require('../../config/firebase');
const { ok, fail, badRequest } = require('../../utils/response');
const { toIso, toMillis } = require('../../utils/dateTime');

const mapSettlement = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
    };
};

// GET /api/settlements?tripId=X
const getTripSettlements = async (req, res) => {
    try {
        const { tripId } = req.query;
        if (!tripId) return badRequest(res, 'tripId query param is required');

        const snap = await db.collection('settlements')
            .where('tripId', '==', tripId)
            .get();

        const settlements = snap.docs
            .map((d) => mapSettlement(d))
            .filter((d) => d.status === 'completed')
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        ok(res, settlements);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/settlements
const createSettlement = async (req, res) => {
    try {
        const { tripId, amount, payer, receiver, originalAmount, originalPayer, originalReceiver } = req.body;
        if (!tripId || !amount || !payer || !receiver) return badRequest(res, 'tripId, amount, payer, receiver required');

        const now = FieldValue.serverTimestamp();
        const nowIso = new Date().toISOString();
        const data = {
            tripId,
            amount,
            payer,
            receiver,
            originalAmount: originalAmount || amount,
            originalPayer: originalPayer || payer,
            originalReceiver: originalReceiver || receiver,
            processedBy: req.email || req.uid,
            status: 'completed',
            createdAt: now,
            updatedAt: now,
        };
        const ref = await db.collection('settlements').add(data);
        ok(res, { id: ref.id, ...data, createdAt: nowIso, updatedAt: nowIso }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/settlements/batch
const createBatchSettlements = async (req, res) => {
    try {
        const { settlements } = req.body;
        if (!Array.isArray(settlements) || settlements.length === 0) return badRequest(res, 'settlements array required');

        const batch = db.batch();
        const now = FieldValue.serverTimestamp();
        const nowIso = new Date().toISOString();
        const ids = [];

        settlements.forEach((s) => {
            const ref = db.collection('settlements').doc();
            ids.push(ref.id);
            batch.set(ref, {
                ...s,
                processedBy: req.email || req.uid,
                status: 'completed',
                createdAt: now,
                updatedAt: now,
            });
        });

        await batch.commit();
        ok(res, { created: ids.length, ids, createdAt: nowIso }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/trips/:tripId/balances  (update trip metadata)
const updateTripBalances = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { calculatedBalances } = req.body;
        await db.collection('trips').doc(tripId).update({
            lastSettlementUpdate: FieldValue.serverTimestamp(),
            lastUpdatedBy: req.email || req.uid,
            calculatedBalances: calculatedBalances || {},
        });
        ok(res, { updated: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getTripSettlements, createSettlement, createBatchSettlements, updateTripBalances };
