const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getRecords, getPersonNames, addRecord, addRepayment,
    updateContact, deleteEntry,
} = require('../controllers/borrowLend/borrowLendController');

router.use(auth);

router.get('/person-names', getPersonNames);
router.get('/', getRecords);
router.post('/', addRecord);
router.post('/repayment', addRepayment);
router.patch('/:id/contact', updateContact);
router.delete('/entries/:uuid', deleteEntry);

module.exports = router;
