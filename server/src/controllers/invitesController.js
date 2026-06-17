const { db, FieldValue } = require('../config/firebase');
const { ok, fail, badRequest, notFound } = require('../utils/response');

// GET /api/invites/pending?email=X
// Returns all pending member docs (across all trips) for this email. Called post-login.
const getPendingInvitesByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return badRequest(res, 'email query param is required');

        if (req.email && req.email.toLowerCase() !== email.toLowerCase()) {
            return fail(res, 'Access denied: can only query your own email', 403);
        }

        const snap = await db.collection('memberIndex')
            .where('email', '==', email.toLowerCase())
            .get();

        // Fetch full member docs from subcollection for pending ones
        const pendingIndex = snap.docs.filter((d) => d.data().status === 'pending');

        const memberDocs = await Promise.all(
            pendingIndex.map((d) =>
                db.collection('trips').doc(d.data().tripId).collection('members').doc(d.id).get()
            )
        );

        const pending = memberDocs
            .filter((d) => d.exists)
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.addedAt?._seconds ?? 0) - (a.addedAt?._seconds ?? 0));

        ok(res, pending);
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/invites/:memberId/accept
// Invitee accepts: update the tripMembers doc to active, set userId + joinedAt.
const acceptInvite = async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        const memberRef = db.collection('trips').doc(tripId).collection('members').doc(memberId);
        const memberSnap = await memberRef.get();

        if (!memberSnap.exists) return notFound(res, 'Invite not found');
        const member = memberSnap.data();

        if (!req.email || req.email.toLowerCase() !== (member.email || '').toLowerCase()) {
            return fail(res, 'Access denied: this invite is not for your account', 403);
        }
        if (member.status !== 'pending') {
            return badRequest(res, `Invite is already ${member.status}`);
        }

        const now = FieldValue.serverTimestamp();
        const batch = db.batch();

        // Activate the member doc
        batch.update(memberRef, {
            status: 'active',
            userId: req.uid,
            joinedAt: now,
        });

        // Notify the trip owner
        const ownerNotifRef = db.collection('notifications').doc();
        batch.set(ownerNotifRef, {
            userId: member.invitedBy,
            type: 'invite_accepted',
            tripId: member.tripId,
            tripName: member.tripName || '',
            memberId,
            acceptedByEmail: req.email,
            isRead: false,
            createdAt: now,
        });

        // Mark the user's notification for this invite as read
        const notifSnap = await db.collection('notifications')
            .where('memberId', '==', memberId)
            .get();
        const ownNotif = notifSnap.docs.find((d) => d.data().userId === req.uid);
        if (ownNotif) batch.update(ownNotif.ref, { isRead: true });

        await batch.commit();

        // Update flat index: set userId + status active
        await db.collection('memberIndex').doc(memberId).update({
            userId: req.uid,
            status: 'active',
        });

        ok(res, { accepted: true, tripId: member.tripId, memberId });
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/invites/:memberId/reject
// Invitee rejects: update status to rejected. Doc stays for audit trail.
const rejectInvite = async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        const memberRef = db.collection('trips').doc(tripId).collection('members').doc(memberId);
        const memberSnap = await memberRef.get();

        if (!memberSnap.exists) return notFound(res, 'Invite not found');
        const member = memberSnap.data();

        if (!req.email || req.email.toLowerCase() !== (member.email || '').toLowerCase()) {
            return fail(res, 'Access denied: this invite is not for your account', 403);
        }
        if (member.status !== 'pending') {
            return badRequest(res, `Invite is already ${member.status}`);
        }

        const now = FieldValue.serverTimestamp();
        await memberRef.update({ status: 'rejected', joinedAt: null });

        // Update flat index
        await db.collection('memberIndex').doc(memberId).update({ status: 'rejected' });

        // Mark notification as read
        const notifSnap = await db.collection('notifications')
            .where('memberId', '==', memberId)
            .get();
        const ownNotif = notifSnap.docs.find((d) => d.data().userId === req.uid);
        if (ownNotif) await ownNotif.ref.update({ isRead: true });

        ok(res, { rejected: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getPendingInvitesByEmail, acceptInvite, rejectInvite };

