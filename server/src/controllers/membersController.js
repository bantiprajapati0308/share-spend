const { db, FieldValue } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

const membersCol = (uid, tripId) =>
    db.collection('users').doc(uid).collection('trips').doc(tripId).collection('members');

// GET /api/trips/:tripId/members
const getMembers = async (req, res) => {
    try {
        const snap = await membersCol(req.uid, req.params.tripId)
            .orderBy('createdAt', 'desc')
            .get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/trips/:tripId/members
const addMember = async (req, res) => {
    try {
        const data = { name: req.body.name, createdAt: FieldValue.serverTimestamp() };
        const ref = await membersCol(req.uid, req.params.tripId).add(data);
        ok(res, { id: ref.id, ...req.body }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId/members/:memberId
const deleteMember = async (req, res) => {
    try {
        await membersCol(req.uid, req.params.tripId).doc(req.params.memberId).delete();
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getMembers, addMember, deleteMember };
