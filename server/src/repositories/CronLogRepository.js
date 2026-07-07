const { db, FieldValue } = require('../config/firebase');

const cronLogsCollection = db.collection('cronLogs');

class CronLogRepository {
    getLogRef(logId) {
        if (!logId) throw new Error('Log ID is required');
        return cronLogsCollection.doc(logId);
    }

    async updateCronLog(logId, data) {
        const ref = this.getLogRef(logId);
        const payload = {
            lastRun: FieldValue.serverTimestamp(),
            status: data.status,
            usersChecked: data.usersChecked ?? null,
            eligibleUsers: data.eligibleUsers ?? null,
            emailsSent: data.emailsSent ?? null,
            executionTime: data.executionTime ?? null,
            error: data.error ?? null,
            updatedAt: FieldValue.serverTimestamp(),
        };

        if (data.status === 'success' || data.status === 'partial_failure') {
            payload.lastSuccess = FieldValue.serverTimestamp();
        }

        await ref.set(payload, { merge: true });
    }
}

module.exports = new CronLogRepository();
