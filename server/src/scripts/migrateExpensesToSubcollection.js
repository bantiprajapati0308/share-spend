/**
 * Migration: moves all docs from the top-level `expenses` collection into
 * `trips/{tripId}/expenses/{docId}`.
 *
 * Run ONCE:  node src/scripts/migrateExpensesToSubcollection.js
 *
 * After verifying the app works, delete `expenses` from the Firebase console.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { db } = require('../config/firebase');

async function migrate() {
    console.log('Reading top-level expenses collection...');
    const snap = await db.collection('expenses').get();

    if (snap.empty) {
        console.log('No documents found in expenses. Nothing to migrate.');
        return;
    }

    console.log(`Found ${snap.size} documents. Migrating...`);

    const BATCH_SIZE = 400;
    let batch = db.batch();
    let count = 0;
    let skipped = 0;
    let batchCount = 0;

    for (const doc of snap.docs) {
        const data = doc.data();
        const tripId = data.tripId;

        if (!tripId) {
            console.warn(`  SKIP ${doc.id} — missing tripId`);
            skipped++;
            continue;
        }

        const destRef = db.collection('trips').doc(tripId).collection('expenses').doc(doc.id);
        batch.set(destRef, data, { merge: true });
        count++;

        if (count % BATCH_SIZE === 0) {
            await batch.commit();
            batchCount++;
            console.log(`  Committed batch ${batchCount} (${count} docs)`);
            batch = db.batch();
        }
    }

    if (count % BATCH_SIZE !== 0) {
        await batch.commit();
        console.log(`  Committed final batch (${count} docs total)`);
    }

    console.log(`\nDone. ${count} docs migrated. ${skipped} skipped.`);
    console.log('Delete the old "expenses" collection from the Firebase console once verified.');
}

migrate().catch((e) => { console.error(e); process.exit(1); });
