const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getPendingInvitesByEmail, acceptInvite, rejectInvite } = require('../controllers/trip/invitesController');

router.use(auth);

// GET /api/invites/pending?email=X  — post-login check for pending invites
router.get('/pending', getPendingInvitesByEmail);

// PATCH /api/invites/:tripId/:memberId/accept
router.patch('/:tripId/:memberId/accept', acceptInvite);

// PATCH /api/invites/:tripId/:memberId/reject
router.patch('/:tripId/:memberId/reject', rejectInvite);

module.exports = router;
