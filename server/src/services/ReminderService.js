const UserRepository = require('../repositories/UserRepository');
const CronLogRepository = require('../repositories/CronLogRepository');
const EmailService = require('../utils/emailService');
const { normalizeDateString, isSameDateString } = require('../utils/dateUtils');

function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

class ReminderService {
    isUserEligible(user, today) {
        if (!user.lastSpendEntry) return true;
        return !isSameDateString(user.lastSpendEntry, today);
    }

    async runDailySpendReminder() {
        const startTime = Date.now();
        const logId = 'daily-spend-reminder';
        let users = [];
        let eligibleUsers = [];
        let emailsSent = 0;
        let skippedUsers = 0;
        let status = 'success';
        let errorMessage = null;

        try {
            users = await UserRepository.getUsersWithRemindersEnabled();
            const today = normalizeDateString(new Date());
            eligibleUsers = users.filter((user) => this.isUserEligible(user, today));
            skippedUsers = users.length - eligibleUsers.length;

            const results = [];

            for (const user of eligibleUsers) {
                try {
                    await EmailService.sendDailyReminderEmail({
                        email: user.email,
                        name: user.name || user.displayName || '',
                    });
                    emailsSent += 1;
                    results.push({ id: user.id, email: user.email, status: 'sent' });
                } catch (sendError) {
                    console.error('[ReminderService] Email send failed', {
                        step: 'sendEmail',
                        userId: user.id,
                        email: user.email,
                        message: sendError?.message,
                        stack: sendError?.stack,
                    });
                    results.push({ id: user.id, email: user.email, status: 'failed', error: sendError?.message || 'unknown' });
                    status = 'partial_failure';
                }
            }

            const executionTime = formatDuration(Date.now() - startTime);
            await CronLogRepository.updateCronLog(logId, {
                status,
                usersChecked: users.length,
                eligibleUsers: eligibleUsers.length,
                emailsSent,
                executionTime,
                error: null,
            });

            return {
                success: true,
                usersChecked: users.length,
                eligibleUsers: eligibleUsers.length,
                emailsSent,
                skippedUsers,
                executionTime,
                results,
            };
        } catch (error) {
            const executionTime = formatDuration(Date.now() - startTime);
            errorMessage = error?.message || 'unknown error';
            console.error('[ReminderService] runDailySpendReminder failed', {
                step: 'runDailySpendReminder',
                message: errorMessage,
                stack: error?.stack,
            });

            await CronLogRepository.updateCronLog(logId, {
                status: 'failed',
                usersChecked: users.length,
                eligibleUsers: eligibleUsers.length,
                emailsSent,
                executionTime,
                error: errorMessage,
            });

            return {
                success: false,
                usersChecked: users.length,
                eligibleUsers: eligibleUsers.length,
                emailsSent,
                skippedUsers,
                executionTime,
                error: errorMessage,
            };
        }
    }

}

module.exports = new ReminderService();
