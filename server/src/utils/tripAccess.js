const { db } = require('../config/firebase');

/**
 * Verifies that the given uid is a member (or owner) of the given trip.
 * Returns the tripMembers document data if access is allowed.
 * Throws an error with status 403 if access is denied, or 404 if the trip doesn't exist.
 *
 * @param {string} uid - Firebase user ID
 * @param {string} tripId - Trip document ID
 * @param {string} [requiredRole] - Optional: 'owner' to restrict to owners only
 * @returns {Promise<object>} The tripMembers document data (includes role, userId, etc.)
 */
async function requireTripMember(uid, tripId, requiredRole = null) {
    // Check the trip exists
    const tripSnap = await db.collection('trips').doc(tripId).get();
    if (!tripSnap.exists) {
        const err = new Error('Trip not found');
        err.status = 404;
        throw err;
    }

    // Query flat memberIndex — single field, no index needed.
    // JS-filter on tripId + status to find the matching active membership.
    const memberSnap = await db.collection('memberIndex')
        .where('userId', '==', uid)
        .get();

    // Only active members have access (pending/rejected do not)
    const matchingDoc = memberSnap.docs.find(
        (d) => d.data().tripId === tripId && d.data().status === 'active'
    );

    if (!matchingDoc) {
        const err = new Error('Access denied: you are not a member of this trip');
        err.status = 403;
        throw err;
    }

    const memberData = { id: matchingDoc.id, ...matchingDoc.data() };

    if (requiredRole && memberData.role !== requiredRole) {
        const err = new Error(`Access denied: requires role '${requiredRole}'`);
        err.status = 403;
        throw err;
    }

    return memberData;
}

module.exports = { requireTripMember };
