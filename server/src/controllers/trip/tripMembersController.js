const { db } = require('../../config/firebase');
const { ok, fail, badRequest } = require('../../utils/response');
const { requireTripMember } = require('../../utils/tripAccess');

// GET /api/trips/:tripId/trip-members
// Returns all registered (user) members for a trip.
const getTripMembers = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId);

        const snap = await db.collection('trips').doc(tripId).collection('members')
            .get();

        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId/trip-members/:memberId
// Owner can remove any non-owner member. Members cannot remove themselves this way.
const removeTripMember = async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        await requireTripMember(req.uid, tripId, 'owner');

        const memberRef = db.collection('trips').doc(tripId).collection('members').doc(memberId);
        const memberSnap = await memberRef.get();

        if (!memberSnap.exists || memberSnap.data().tripId !== tripId) {
            return fail(res, 'Trip member not found', 404);
        }
        if (memberSnap.data().role === 'owner') {
            return badRequest(res, 'Cannot remove the trip owner');
        }

        await memberRef.delete();
        await db.collection('memberIndex').doc(memberId).delete();
        ok(res, { deleted: true });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

module.exports = { getTripMembers, removeTripMember };
