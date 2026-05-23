const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getDateRange, saveDateRange } = require('../controllers/settingsController');

router.use(auth);

router.get('/date-range', getDateRange);
router.put('/date-range', saveDateRange);

module.exports = router;
