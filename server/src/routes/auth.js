const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getProfile, createOrUpdateProfile, updateProfile,
    updateLastLogin, register, forgotPassword, sendVerification,
} = require('../controllers/core/authController');

// Public routes — no auth token required
router.post('/forgot-password', forgotPassword);

// All routes below this line require a valid Firebase ID token
router.use(auth);

router.get('/profile', getProfile);
router.post('/profile', createOrUpdateProfile);
router.put('/profile', updateProfile);
router.patch('/last-login', updateLastLogin);
router.post('/register', register);
router.post('/send-verification', sendVerification);

module.exports = router;
