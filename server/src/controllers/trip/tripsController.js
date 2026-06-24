const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, notFound, badRequest } = require('../../utils/response');
const { requireTripMember } = require('../../utils/tripAccess');
const { toIso } = require('../../utils/dateTime');

const mapTripResponse = (tripDoc, memberDoc) => {
    const trip = tripDoc.data();
    return {
        id: tripDoc.id,
        ...trip,
        createdAt: toIso(trip.createdAt),
        updatedAt: toIso(trip.updatedAt),
        totalMember: Number(trip.totalMember || 0),
        totalAmount: Number(trip.totalAmount || 0),
        ...(memberDoc ? { role: memberDoc.role, memberId: memberDoc.id } : {}),
    };
};

// GET /api/trips
// Returns all trips where the current user is a member (any role).
const getTrips = async (req, res) => {
    try {
        // memberIndex is a flat collection keyed by memberId (same ID as subcollection doc).
        // Single-field query — no composite index needed.
        const memberSnap = await db.collection('memberIndex')
            .where('userId', '==', req.uid)
            .get();

        const activeDocs = memberSnap.docs.filter((d) => d.data().status === 'active');
        if (activeDocs.length === 0) return ok(res, []);

        // Batch-fetch trip documents
        const tripFetches = activeDocs.map((m) =>
            db.collection('trips').doc(m.data().tripId).get().then((t) => ({
                memberDoc: { id: m.id, ...m.data() },
                tripDoc: t,
            }))
        );
        const results = await Promise.all(tripFetches);
        const trips = results
            .filter((r) => r.tripDoc.exists)
            .map((r) => mapTripResponse(r.tripDoc, r.memberDoc));
        ok(res, trips);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/trips
// Creates a new trip and registers the creator as owner in tripMembers.
const addTrip = async (req, res) => {
    try {
        const { name, description, currency, date, organizer } = req.body;
        if (!name) return badRequest(res, 'Trip name is required');

        const now = FieldValue.serverTimestamp();
        const tripData = {
            name,
            description: description || '',
            organizer: organizer || '',
            currency: currency || 'INR',
            date: date || new Date().toISOString(),
            createdBy: req.uid,
            createdAt: now,
            updatedAt: now,
            isArchived: false,
            totalMember: 1,
            totalAmount: 0,
        };

        // Resolve owner's display name from their Firestore profile
        const userSnap = await db.collection('users').doc(req.uid).get();
        const userProfile = userSnap.data() || {};
        const ownerName =
            userProfile.firstName ||
            userProfile.displayName ||
            (req.email ? req.email.split('@')[0] : 'Owner');

        const batch = db.batch();
        const tripRef = db.collection('trips').doc();
        batch.set(tripRef, tripData);

        // Subcollection: full member data
        const memberRef = db.collection('trips').doc(tripRef.id).collection('members').doc();
        const memberPayload = {
            tripId: tripRef.id,
            tripName: name,
            name: ownerName,
            email: req.email || '',
            userId: req.uid,
            role: 'owner',
            status: 'active',
            type: 'invited',
            invitedBy: null,
            addedAt: now,
            joinedAt: now,
            inviteCount: 0,
            lastInvitedAt: null,
        };
        batch.set(memberRef, memberPayload);

        // Flat index: minimal fields for cross-trip lookups (no collectionGroup index needed)
        const indexRef = db.collection('memberIndex').doc(memberRef.id);
        batch.set(indexRef, {
            tripId: tripRef.id,
            memberId: memberRef.id,
            userId: req.uid,
            email: req.email || '',
            role: 'owner',
            status: 'active',
        });

        await batch.commit();

        ok(res, {
            id: tripRef.id,
            ...tripData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            role: 'owner',
            memberId: memberRef.id,
            totalMember: 1,
            totalAmount: 0,
        }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/trips/:tripId
// Owner-only update.
const updateTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId, 'owner');

        const updates = { ...req.body, updatedAt: FieldValue.serverTimestamp() };
        // Prevent overwriting immutable fields
        delete updates.createdBy;
        delete updates.createdAt;

        const ref = db.collection('trips').doc(tripId);
        await ref.update(updates);
        const snap = await ref.get();
        ok(res, mapTripResponse(snap));
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return notFound(res, e.message);
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId
// Owner-only. Cascades: deletes tripMembers, guestMembers, expenses for this trip.
const deleteTrip = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId, 'owner');

        // Fetch all subcollections to delete (both live under trips/{tripId})
        const [memberSnap, expenseSnap] = await Promise.all([
            db.collection('trips').doc(tripId).collection('members').get(),
            db.collection('trips').doc(tripId).collection('expenses').get(),
        ]);

        // Firestore batch limit is 500 writes — chunk if needed
        const allDeletes = [
            db.collection('trips').doc(tripId),
            ...memberSnap.docs.map((d) => d.ref),
            ...expenseSnap.docs.map((d) => d.ref),
        ];

        const chunkSize = 499;
        for (let i = 0; i < allDeletes.length; i += chunkSize) {
            const batch = db.batch();
            allDeletes.slice(i, i + chunkSize).forEach((ref) => batch.delete(ref));
            await batch.commit();
        }

        ok(res, { deleted: true });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return notFound(res, e.message);
        fail(res, e.message);
    }
};

module.exports = { getTrips, addTrip, updateTrip, deleteTrip };
