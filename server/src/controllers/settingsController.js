const { db, FieldValue } = require('../config/firebase');
const { ok, fail } = require('../utils/response');

const settingsDoc = (uid, key) => db.collection('users').doc(uid).collection('settings').doc(key);

// GET /api/settings/date-range
const getDateRange = async (req, res) => {
    try {
        const snap = await settingsDoc(req.uid, 'dateRange').get();
        ok(res, snap.exists ? snap.data() : {});
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/settings/date-range
const saveDateRange = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        await settingsDoc(req.uid, 'dateRange').set(
            { startDate: startDate || null, endDate: endDate || null, updatedAt: FieldValue.serverTimestamp() },
            { merge: true }
        );
        ok(res, { saved: true });
    } catch (e) {
        fail(res, e.message);
    }
};

/**
 * Seed the default date range for a new user: first day to last day of the current calendar month.
 * Idempotent — skips if a date range is already saved.
 * Called internally on new user registration.
 */
const seedDefaultDateRangeForUser = async (uid) => {
    const ref = settingsDoc(uid, 'dateRange');
    const snap = await ref.get();
    // If a range already exists, leave it untouched.
    if (snap.exists && snap.data().startDate) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    // First day of the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    // Last day of the month (day 0 of next month)
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    await ref.set({ startDate, endDate, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
};

module.exports = { getDateRange, saveDateRange, seedDefaultDateRangeForUser };
