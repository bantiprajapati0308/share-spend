const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getNotifications, markRead, markAllRead } = require('../controllers/notificationsController');

router.use(auth);

// GET /api/notifications
router.get('/', getNotifications);

// PATCH /api/notifications/read-all  — must be before /:notificationId/read
router.patch('/read-all', markAllRead);

// PATCH /api/notifications/:notificationId/read
router.patch('/:notificationId/read', markRead);

module.exports = router;
