const UserRepository = require('../repositories/UserRepository');
const EmailService = require('../utils/emailService');
const { normalizeDateString, isSameDateString } = require('../utils/dateUtils');

class ReminderService {
    async findUsersNeedingReminder() {
        const users = await UserRepository.getUsersWithRemindersEnabled();
        const today = normalizeDateString(new Date());

        return users.filter((user) => {
            if (!user.reminderEnabled) return false;
            if (!user.lastSpendEntry) return true;
            return !isSameDateString(user.lastSpendEntry, today);
        });
    }

    async sendDailyReminder(user) {
        await EmailService.sendDailyReminderEmail({
            email: user.email,
            name: user.name || user.displayName || '',
        });
    }

    async runDailySpendReminders() {
        const users = await this.findUsersNeedingReminder();
        const results = [];

        for (const user of users) {
            try {
                await this.sendDailyReminder(user);
                results.push({ id: user.id, email: user.email, status: 'sent' });
            } catch (error) {
                console.error(`[ReminderService] failed sending reminder to ${user.id}`, error?.message || error);
                results.push({ id: user.id, email: user.email, status: 'failed', error: error?.message || 'unknown' });
            }
        }

        return {
            totalUsers: users.length,
            results,
        };
    }
}

module.exports = new ReminderService();
