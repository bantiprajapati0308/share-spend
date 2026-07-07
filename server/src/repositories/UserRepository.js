const { db, FieldValue } = require('../config/firebase');

const usersCollection = db.collection('users');

class UserRepository {
    getUserRef(uid) {
        if (!uid) throw new Error('UID is required');
        return usersCollection.doc(uid);
    }

    async getUser(uid) {
        const ref = this.getUserRef(uid);
        const snap = await ref.get();
        return snap.exists ? { id: snap.id, ...snap.data() } : null;
    }

    async updateLastSpendEntry(uid, lastSpendEntry) {
        const ref = this.getUserRef(uid);
        await ref.set({ lastSpendEntry, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }

    async getUsersWithRemindersEnabled() {
        const snapshot = await usersCollection
            .where('reminderEnabled', '==', true)
            .select('email', 'name', 'lastSpendEntry')
            .get();

        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
}

module.exports = new UserRepository();
