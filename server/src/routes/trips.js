const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTrips, addTrip, updateTrip, deleteTrip } = require('../controllers/trip/tripsController');
const { getMembersBriefDetails, getMembers, addMember, resendInvite, deleteMember } = require('../controllers/trip/membersController');
const { getExpenses, addExpense, updateExpense, deleteExpense } = require('../controllers/trip/expensesController');

router.use(auth);

// Trips
router.get('/', getTrips);
router.post('/', addTrip);
router.put('/:tripId', updateTrip);
router.delete('/:tripId', deleteTrip);

// Members (unified — guests, invited, active)
router.get('/:tripId/members/brief', getMembersBriefDetails);  // must be before /:memberId routes
router.get('/:tripId/members', getMembers);
router.post('/:tripId/members', addMember);
router.post('/:tripId/members/:memberId/resend', resendInvite);
router.delete('/:tripId/members/:memberId', deleteMember);

// Expenses (nested)
router.get('/:tripId/expenses', getExpenses);
router.post('/:tripId/expenses', addExpense);
router.put('/:tripId/expenses/:expenseId', updateExpense);
router.delete('/:tripId/expenses/:expenseId', deleteExpense);

module.exports = router;
