const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { parse } = require('../controllers/quickAddController');

router.use(auth);

// POST /api/quick-add/parse
router.post('/parse', parse);

module.exports = router;
