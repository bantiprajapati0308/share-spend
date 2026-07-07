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
            .select('email', 'name', 'displayName', 'lastSpendEntry')
            .get();

        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    async getUserById(uid) {
        const doc = await usersCollection.doc(uid).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }

    async getUserCollectionSample(limit = 20) {
        const snapshot = await usersCollection.limit(limit).get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
}

module.exports = new UserRepository();
