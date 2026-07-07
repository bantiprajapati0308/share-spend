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

router.post('/daily-spend-reminder', verifyCronToken, async (req, res) => {
    try {
        const result = await ReminderService.runDailySpendReminder();
        return res.json(result);
    } catch (error) {
        console.error('[cron] daily-spend-reminder failed:', {
            step: 'routeHandler',
            message: error?.message,
            stack: error?.stack,
        });
        return res.status(500).json({ success: false, error: 'Reminder execution failed', details: error?.message || 'unknown' });
    }
});

module.exports = router;
