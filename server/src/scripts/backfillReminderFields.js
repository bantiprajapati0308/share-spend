const { db, FieldValue } = require('../config/firebase');
const { yesterdayDateString } = require('../utils/dateUtils');

async function main() {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
        console.log('No users found in Firestore.');
        return;
    }

    const yesterday = yesterdayDateString();
    let updatedCount = 0;
    let skippedCount = 0;

    for (const doc of usersSnapshot.docs) {
        const data = doc.data();
        const updates = {};

        if (data.reminderEnabled === undefined || data.reminderEnabled === null) {
            updates.reminderEnabled = true;
        }
        if (!data.lastSpendEntry) {
            updates.lastSpendEntry = yesterday;
        }

        if (Object.keys(updates).length > 0) {
            updates.updatedAt = FieldValue.serverTimestamp();
            await db.collection('users').doc(doc.id).update(updates);
            updatedCount += 1;
            console.log(`Updated ${doc.id}:`, updates);
        } else {
            skippedCount += 1;
        }
    }

    console.log(`\nBackfill complete. Updated: ${updatedCount}, Skipped: ${skippedCount}, Total: ${usersSnapshot.size}`);
}

main().catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
});
