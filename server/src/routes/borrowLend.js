const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getRecords, getPersonNames, addRecord, addRepayment,
    updateContact,
    archiveEntry, unarchiveEntry, toggleMarkDone, deleteEntry,
} = require('../controllers/borrowLend/borrowLendController');

router.use(auth);

router.get('/person-names', getPersonNames);
router.get('/', getRecords);
router.post('/', addRecord);
router.post('/repayment', addRepayment);
router.patch('/:id/contact', updateContact);
router.patch('/entries/:uuid/archive', archiveEntry);
router.patch('/entries/:uuid/unarchive', unarchiveEntry);
router.patch('/entries/:uuid/mark-done', toggleMarkDone);
router.delete('/entries/:uuid', deleteEntry);

module.exports = router;
