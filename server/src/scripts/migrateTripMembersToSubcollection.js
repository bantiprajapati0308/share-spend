/**
 * Migration: moves all docs from the top-level `tripMembers` collection into
 * `trips/{tripId}/members/{docId}` and also builds the `memberIndex` flat collection.
 *
 * Run ONCE:  node src/scripts/migrateTripMembersToSubcollection.js
 *
 * After verifying the app works, delete `tripMembers` from the Firebase console.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { db } = require('../config/firebase');

async function migrate() {
    console.log('Reading top-level tripMembers collection...');
    const snap = await db.collection('tripMembers').get();

    if (snap.empty) {
        console.log('No documents found in tripMembers. Nothing to migrate.');
        return;
    }

    console.log(`Found ${snap.size} documents. Migrating...`);

    const BATCH_SIZE = 200; // two writes per doc, stay under 500 limit
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

        // Write full data to subcollection (same doc ID)
        const destRef = db.collection('trips').doc(tripId).collection('members').doc(doc.id);
        batch.set(destRef, data, { merge: true });

        // Write lean index doc
        const indexRef = db.collection('memberIndex').doc(doc.id);
        batch.set(indexRef, {
            tripId,
            memberId: doc.id,
            userId: data.userId || null,
            email: data.email || null,
            role: data.role || 'member',
            status: data.status || 'active',
        }, { merge: true });

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
    console.log('Delete the old "tripMembers" collection from the Firebase console once verified.');
}

migrate().catch((e) => { console.error(e); process.exit(1); });
