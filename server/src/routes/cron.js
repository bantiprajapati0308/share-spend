const express = require('express');
const router = express.Router();
const ReminderService = require('../services/ReminderService');

function verifyCronToken(req, res, next) {
    const token = req.headers['x-vercel-cron-token'] || req.query.token;
    if (!token || token !== process.env.VERCEL_CRON_TOKEN) {
        return res.status(401).json({ success: false, error: 'Unauthorized cron request' });
    }
    return next();
}

router.post('/daily-spend-reminder', verifyCronToken, async (req, res, next) => {
    try {
        console.log('[cron] daily-spend-reminder invoked');
        const result = await ReminderService.runDailySpendReminders();
        return res.json({ success: true, data: result });
    } catch (error) {
        console.error('[cron] daily-spend-reminder failed:', error?.message || error);
        return res.status(500).json({ success: false, error: 'Reminder execution failed', details: error?.message || 'unknown' });
    }
});

module.exports = router;
