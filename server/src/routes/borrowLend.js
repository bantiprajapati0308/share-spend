const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getRecords, addRecord, addRepayment,
    archiveEntry, unarchiveEntry, toggleMarkDone, deleteEntry,
} = require('../controllers/borrowLendController');

router.use(auth);

router.get('/', getRecords);
router.post('/', addRecord);
router.post('/repayment', addRepayment);
router.patch('/entries/:uuid/archive', archiveEntry);
router.patch('/entries/:uuid/unarchive', unarchiveEntry);
router.patch('/entries/:uuid/mark-done', toggleMarkDone);
router.delete('/entries/:uuid', deleteEntry);

module.exports = router;
