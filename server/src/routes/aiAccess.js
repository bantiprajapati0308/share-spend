const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAiAccess } = require('../controllers/aiAccessController');

router.use(auth);
router.get('/', getAiAccess);

module.exports = router;
