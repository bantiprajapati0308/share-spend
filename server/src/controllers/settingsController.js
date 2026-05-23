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

module.exports = { getDateRange, saveDateRange };
