const { db, FieldValue } = require('../../config/firebase');
const { ok, fail } = require('../../utils/response');
const { toIso, toMillis } = require('../../utils/dateTime');

const mapNotification = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
    };
};

// GET /api/notifications
// Returns all notifications for the current user, newest first.
const getNotifications = async (req, res) => {
    try {
        const snap = await db.collection('notifications')
            .where('userId', '==', req.uid)
            .get();
        const notifications = snap.docs
            .map((d) => mapNotification(d))
            .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        ok(res, notifications);
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/notifications/:notificationId/read
// Marks a single notification as read.
const markRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const ref = db.collection('notifications').doc(notificationId);
        const snap = await ref.get();

        if (!snap.exists) return fail(res, 'Notification not found', 404);
        if (snap.data().userId !== req.uid) return fail(res, 'Access denied', 403);

        await ref.update({ isRead: true });
        ok(res, { updated: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/notifications/read-all
// Marks all unread notifications for the current user as read.
const markAllRead = async (req, res) => {
    try {
        const snap = await db.collection('notifications')
            .where('userId', '==', req.uid)
            .get();

        const unread = snap.docs.filter((d) => !d.data().isRead);
        if (unread.length === 0) return ok(res, { updated: 0 });

        const batch = db.batch();
        unread.forEach((d) => batch.update(d.ref, { isRead: true }));
        await batch.commit();

        ok(res, { updated: unread.length });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getNotifications, markRead, markAllRead };
