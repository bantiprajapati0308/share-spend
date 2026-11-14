const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAiAccess = require('../middleware/requireAiAccess');
const { parse } = require('../controllers/quickAddController');
const { transcribe } = require('../controllers/audioTranscriptionController');

router.use(auth);

// POST /api/quick-add/parse
router.post('/parse', requireAiAccess, parse);
router.post('/transcribe', requireAiAccess, transcribe);

module.exports = router;
