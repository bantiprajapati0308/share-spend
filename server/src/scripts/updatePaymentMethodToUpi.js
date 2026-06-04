/**
 * Update paymentMethodId to 'upi' for a specific user's transactions.
 *
 * By default updates ALL transactions that have no paymentMethodId set (null / missing).
 * You can also target a specific paymentMethodId to overwrite (e.g. migrate 'bank' → 'upi').
 *
 * Usage:
 *   node server/src/scripts/updatePaymentMethodToUpi.js [--dry-run] [--from=<OLD_PM_ID>]
 *
 * Options:
 *   --from=<id>     Only update transactions that currently have this paymentMethodId
 *                   Omit to target transactions with null / missing paymentMethodId
 *   --dry-run       Preview changes without writing to Firestore
 *
 * Examples:
 *   # Set paymentMethodId='upi' where it is currently null/missing:
 *   node server/src/scripts/updatePaymentMethodToUpi.js
 *
 *   # Set paymentMethodId='upi' where it was previously 'bank_transfer':
 *   node server/src/scripts/updatePaymentMethodToUpi.js --from=bank_transfer
 *
 *   # Dry-run preview:
 *   node server/src/scripts/updatePaymentMethodToUpi.js --dry-run
 */

require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

// ── Config — set the target user UID here ────────────────────────────────────
const TARGET_UID = '2gQ7efVCFdWu7bP4T2YJ3BHlc7J2'; // <-- paste the Firebase UID here

// ── Parse CLI args ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

const fromArg = args.find(a => a.startsWith('--from='));
const isDryRun = args.includes('--dry-run');

if (!TARGET_UID || TARGET_UID === 'REPLACE_WITH_USER_UID') {
    console.error('ERROR: Please set TARGET_UID in the script before running.');
    process.exit(1);
}

const FROM_PM_ID = fromArg ? fromArg.split('=')[1].trim() : null;
const TARGET_PM_ID = 'upi';
const BATCH_LIMIT = 400; // Firestore batch max is 500; stay under it

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('=== Update paymentMethodId → upi ===');
    console.log(isDryRun ? '*** DRY RUN — no writes will happen ***\n' : '');
    console.log(`User UID     : ${TARGET_UID}`);
    console.log(`Match filter : paymentMethodId ${FROM_PM_ID ? `=== "${FROM_PM_ID}"` : 'is null / missing'}`);
    console.log(`Set to       : "${TARGET_PM_ID}"\n`);

    // Verify the user exists
    const userSnap = await db.collection('users').doc(TARGET_UID).get();
    if (!userSnap.exists) {
        console.error(`ERROR: No user document found for UID "${TARGET_UID}"`);
        process.exit(1);
    }
    console.log(`User found   : ${userSnap.data().email || TARGET_UID}\n`);

    const spendsColl = db.collection('users').doc(TARGET_UID).collection('dailySpends');

    // Build the query
    let query;
    if (FROM_PM_ID) {
        query = spendsColl.where('paymentMethodId', '==', FROM_PM_ID);
    } else {
        // Firestore can't query for null directly with '=='; fetch all and filter in-memory
        query = spendsColl;
    }

    const snap = await query.get();
    if (snap.empty) {
        console.log('No transactions found for this user.');
        return;
    }

    // Filter to matching docs
    const toUpdate = snap.docs.filter(doc => {
        const pm = doc.data().paymentMethodId;
        if (FROM_PM_ID) return pm === FROM_PM_ID;
        return pm === null || pm === undefined || pm === '';
    });

    console.log(`Transactions scanned : ${snap.size}`);
    console.log(`Transactions matched : ${toUpdate.length}\n`);

    if (toUpdate.length === 0) {
        console.log('Nothing to update.');
        return;
    }

    if (isDryRun) {
        console.log('DRY RUN — would update the following transaction IDs:');
        toUpdate.forEach(doc => {
            const d = doc.data();
            console.log(`  [${doc.id}] type=${d.type} name="${d.name}" amount=${d.amount} date=${d.date} pmId="${d.paymentMethodId ?? 'null'}"`);
        });
        console.log(`\nTotal: ${toUpdate.length} transaction(s) would be updated.`);
        return;
    }

    // Commit in batches
    let updated = 0;
    for (let i = 0; i < toUpdate.length; i += BATCH_LIMIT) {
        const chunk = toUpdate.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();
        chunk.forEach(doc => batch.update(doc.ref, { paymentMethodId: TARGET_PM_ID }));
        await batch.commit();
        updated += chunk.length;
        console.log(`  Committed batch: ${updated}/${toUpdate.length}`);
    }

    console.log(`\nDone. Updated ${updated} transaction(s) to paymentMethodId="${TARGET_PM_ID}".`);
}

run().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
