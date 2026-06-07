const { db, FieldValue } = require('../config/firebase');
const { ok, fail, notFound } = require('../utils/response');

const tripsCol = (uid) => db.collection('users').doc(uid).collection('trips');

// GET /api/trips
const getTrips = async (req, res) => {
    try {
        const snap = await tripsCol(req.uid).get();
        const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        ok(res, trips);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/trips
const addTrip = async (req, res) => {
    try {
        const data = { ...req.body, date: req.body.date || new Date().toISOString() };
        const ref = await tripsCol(req.uid).add(data);
        ok(res, { id: ref.id, ...data }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/trips/:tripId
const updateTrip = async (req, res) => {
    try {
        const ref = tripsCol(req.uid).doc(req.params.tripId);
        await ref.update(req.body);
        const snap = await ref.get();
        if (!snap.exists) return notFound(res, 'Trip not found');
        ok(res, { id: snap.id, ...snap.data() });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId
const deleteTrip = async (req, res) => {
    try {
        await tripsCol(req.uid).doc(req.params.tripId).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getTrips, addTrip, updateTrip, deleteTrip };
