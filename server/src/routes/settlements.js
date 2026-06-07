const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTripSettlements, createSettlement, createBatchSettlements, updateTripBalances } = require('../controllers/settlementsController');

router.use(auth);

router.get('/', getTripSettlements);
router.post('/', createSettlement);
router.post('/batch', createBatchSettlements);
router.patch('/trips/:tripId/balances', updateTripBalances);

module.exports = router;
