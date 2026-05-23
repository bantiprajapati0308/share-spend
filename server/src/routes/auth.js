const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, createOrUpdateProfile, updateProfile, updateLastLogin, register } = require('../controllers/authController');

router.use(auth);

router.get('/profile', getProfile);
router.post('/profile', createOrUpdateProfile);
router.put('/profile', updateProfile);
router.patch('/last-login', updateLastLogin);
router.post('/register', register);

module.exports = router;
