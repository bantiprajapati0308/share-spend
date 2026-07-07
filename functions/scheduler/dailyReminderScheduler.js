const functions = require('firebase-functions');
const { db } = require('../config/firebase');
const EmailService = require('../services/EmailService');
const UserRepository = require('../repositories/UserRepository');
const { isSameUtcDay, todayUtcString } = require('../utils/dateUtils');

async function sendReminderEmails() {
    const users = await UserRepository.getUsersWithRemindersEnabled();
    const todayString = todayUtcString();

    const reminders = users
        .filter((user) => {
            if (!user.reminderEnabled) return false;
            if (!user.lastSpendEntry) return true;
            return !isSameUtcDay(user.lastSpendEntry, todayString);
        })
        .map(async (user) => {
            try {
                await EmailService.sendDailyReminder(user);
                console.log(`[dailyReminderScheduler] reminder sent to uid=${user.id}`);
            } catch (error) {
                console.error(`[dailyReminderScheduler] failed sending reminder to uid=${user.id}:`, error.message);
            }
        });

    await Promise.all(reminders);
}

exports.dailyReminderScheduler = functions.pubsub
    .schedule('every 5 minutes')
    .timeZone('Etc/UTC')
    .onRun(async (context) => {
        console.log('[dailyReminderScheduler] running scheduled reminder check');
        try {
            await sendReminderEmails();
            console.log('[dailyReminderScheduler] finished');
        } catch (error) {
            console.error('[dailyReminderScheduler] unexpected error:', error.message);
            throw error;
        }
    });

exports.sendReminderEmails = sendReminderEmails;
