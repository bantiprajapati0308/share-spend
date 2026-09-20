const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTransactions, addTransaction, addTransactionsBulk, updateTransaction, deleteTransaction } = require('../controllers/dailySpends/dailySpendsController');

router.use(auth);

router.get('/', getTransactions);
router.post('/', addTransaction);
router.post('/bulk', addTransactionsBulk);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
