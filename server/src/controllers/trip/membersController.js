const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, badRequest } = require('../../utils/response');
const { requireTripMember } = require('../../utils/tripAccess');
const { sendTripInviteEmail } = require('../../utils/emailService');
const { toIso, toMillis } = require('../../utils/dateTime');

/**
 * Subcollection path: trips/{tripId}/members/{memberId}
 * Schema: { tripId, tripName, name, email, userId, role, status, type,
 *           invitedBy, addedAt, joinedAt, inviteCount, lastInvitedAt }
 * tripId is stored in the doc too so collectionGroup queries can identify the parent trip.
 */
const membersCol = (tripId) => db.collection('trips').doc(tripId).collection('members');
const memberIndexCol = () => db.collection('memberIndex');

const mapMember = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        addedAt: toIso(data.addedAt),
        joinedAt: toIso(data.joinedAt),
        lastInvitedAt: toIso(data.lastInvitedAt),
    };
};

// GET /api/trips/:tripId/members/brief
// Returns only { id, name, email, tripId, userId } for active members.
// Used by the expense form participants picker.
const getMembersBriefDetails = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId);

        const snap = await membersCol(tripId).get();
        const members = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .map((m) => ({
                id: m.id,
                name: m.name,
                email: m.email || null,
                tripId: m.tripId,
                userId: m.userId || null,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        ok(res, members);
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// GET /api/trips/:tripId/members
const getMembers = async (req, res) => {
    try {
        const { tripId } = req.params;
        await requireTripMember(req.uid, tripId);

        const snap = await membersCol(tripId).get();

        const members = snap.docs
            .map((d) => mapMember(d))
            .sort((a, b) => toMillis(a.addedAt) - toMillis(b.addedAt));

        ok(res, members);
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// POST /api/trips/:tripId/members
const addMember = async (req, res) => {
    try {
        const { tripId } = req.params;
        const { name, email } = req.body;
        if (!name || !name.trim()) return badRequest(res, 'Member name is required');

        await requireTripMember(req.uid, tripId);

        const normalizedEmail = email ? email.trim().toLowerCase() : null;

        const existingSnap = await membersCol(tripId).get();

        const nameDuplicate = existingSnap.docs.some(
            (d) => d.data().name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (nameDuplicate) return badRequest(res, 'A member with this name already exists in the trip');

        if (normalizedEmail) {
            const emailDuplicate = existingSnap.docs.some(
                (d) => (d.data().email || '').toLowerCase() === normalizedEmail
            );
            if (emailDuplicate) return badRequest(res, 'A member with this email already exists or has a pending invite');
        }

        const tripSnap = await db.collection('trips').doc(tripId).get();
        const tripName = tripSnap.data()?.name || '';

        const now = FieldValue.serverTimestamp();
        const nowIso = new Date().toISOString();
        const isInvited = !!normalizedEmail;

        const memberData = {
            tripId,
            tripName,
            name: name.trim(),
            email: normalizedEmail,
            userId: null,
            role: 'member',
            status: isInvited ? 'pending' : 'active',
            type: isInvited ? 'invited' : 'guest',
            invitedBy: isInvited ? req.uid : null,
            addedAt: now,
            joinedAt: isInvited ? null : now,
            inviteCount: isInvited ? 1 : 0,
            lastInvitedAt: isInvited ? now : null,
        };

        const memberRef = await membersCol(tripId).add(memberData);

        // Dual-write to flat index so cross-trip queries work without collectionGroup index
        await memberIndexCol().doc(memberRef.id).set({
            tripId,
            memberId: memberRef.id,
            userId: null,
            email: normalizedEmail,
            role: 'member',
            status: isInvited ? 'pending' : 'active',
        });

        // Keep denormalized aggregate on trip root to avoid repeated count queries.
        await db.collection('trips').doc(tripId).update({
            totalMember: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
        });

        if (isInvited) {
            const userSnap = await db.collection('users')
                .where('email', '==', normalizedEmail)
                .limit(1)
                .get();
            if (!userSnap.empty) {
                await db.collection('notifications').add({
                    userId: userSnap.docs[0].id,
                    type: 'trip_invite',
                    tripId,
                    tripName,
                    memberId: memberRef.id,
                    invitedByEmail: req.email || '',
                    isRead: false,
                    createdAt: now,
                });
            }

            sendTripInviteEmail({
                to: normalizedEmail,
                tripName,
                invitedBy: req.email || req.uid,
                inviteId: memberRef.id,
            }).catch((err) => console.error('[membersController] Failed to send invite email:', err.message));
        }

        ok(res, {
            id: memberRef.id,
            ...memberData,
            addedAt: nowIso,
            joinedAt: isInvited ? null : nowIso,
            lastInvitedAt: isInvited ? nowIso : null,
        }, 201);
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        if (e.status === 404) return fail(res, e.message, 404);
        fail(res, e.message);
    }
};

// POST /api/trips/:tripId/members/:memberId/resend
const resendInvite = async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        await requireTripMember(req.uid, tripId);

        const memberRef = membersCol(tripId).doc(memberId);
        const memberSnap = await memberRef.get();

        if (!memberSnap.exists) return fail(res, 'Member not found', 404);
        const member = memberSnap.data();
        if (member.status !== 'pending') {
            return badRequest(res, `Cannot resend: member status is '${member.status}'`);
        }
        if (!member.email) return badRequest(res, 'No email address to resend to');

        const now = FieldValue.serverTimestamp();
        await memberRef.update({
            inviteCount: (member.inviteCount || 1) + 1,
            lastInvitedAt: now,
        });

        sendTripInviteEmail({
            to: member.email,
            tripName: member.tripName || '',
            invitedBy: req.email || req.uid,
            inviteId: memberId,
        }).catch((err) => console.error('[membersController] Failed to resend invite email:', err.message));

        ok(res, { resent: true, inviteCount: (member.inviteCount || 1) + 1 });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        fail(res, e.message);
    }
};

// DELETE /api/trips/:tripId/members/:memberId
const deleteMember = async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        await requireTripMember(req.uid, tripId);

        const memberRef = membersCol(tripId).doc(memberId);
        const memberSnap = await memberRef.get();

        if (!memberSnap.exists) return fail(res, 'Member not found', 404);
        const member = memberSnap.data();

        if (member.status === 'active' && member.userId) {
            return badRequest(res, 'Cannot remove an active registered member.');
        }

        await memberRef.delete();
        // Remove from flat index
        await memberIndexCol().doc(memberId).delete();

        // Keep denormalized aggregate on trip root to avoid repeated count queries.
        await db.collection('trips').doc(tripId).update({
            totalMember: FieldValue.increment(-1),
            updatedAt: FieldValue.serverTimestamp(),
        });

        ok(res, { deleted: true });
    } catch (e) {
        if (e.status === 403) return fail(res, e.message, 403);
        fail(res, e.message);
    }
};

module.exports = { getMembersBriefDetails, getMembers, addMember, resendInvite, deleteMember };
