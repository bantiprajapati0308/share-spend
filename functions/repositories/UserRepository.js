const { db } = require('../config/firebase');

const usersCollection = db.collection('users');
const REMINDER_PAGE_SIZE = 500;

class UserRepository {
    async getUsersWithRemindersEnabled() {
        const users = [];
        let query = usersCollection
            .where('reminderEnabled', '==', true)
            .orderBy('__name__')
            .select('email', 'name', 'lastSpendEntry')
            .limit(REMINDER_PAGE_SIZE);

        while (query) {
            const snapshot = await query.get();
            if (snapshot.empty) break;

            snapshot.docs.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });

            const lastDoc = snapshot.docs[snapshot.docs.length - 1];
            query = snapshot.size < REMINDER_PAGE_SIZE
                ? null
                : usersCollection
                    .where('reminderEnabled', '==', true)
                    .orderBy('__name__')
                    .select('email', 'name', 'lastSpendEntry')
                    .startAfter(lastDoc)
                    .limit(REMINDER_PAGE_SIZE);
        }

        return users;
    }

    async updateLastSpendEntry(uid, lastSpendEntry) {
        if (!uid) throw new Error('User ID is required');
        const updates = { updatedAt: new Date(), lastSpendEntry };
        await usersCollection.doc(uid).set(updates, { merge: true });
    }
}

module.exports = new UserRepository();
