const { db } = require('../config/firebase');
const { normalizeDateString } = require('../utils/dateUtils');

const dailySpendCollection = (uid) => db.collection('users').doc(uid).collection('dailySpends');

class DailySpendRepository {
    async getTransaction(uid, id) {
        const snap = await dailySpendCollection(uid).doc(id).get();
        return snap.exists ? { id: snap.id, ...snap.data() } : null;
    }

    async getLatestSpendDate(uid) {
        const snapshot = await dailySpendCollection(uid)
            .where('type', '==', 'spend')
            .orderBy('date', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return normalizeDateString(snapshot.docs[0].data().date);
    }
}

module.exports = new DailySpendRepository();
