/**
 * Seed / migrate the "Credit Card Spend" income category for ALL users.
 *
 * The category must live at:
 *   users/{uid}/categories/credit-card-spend   (fixed document ID)
 *
 * Per-user logic:
 *   1. Doc ID already correct  → skip (already migrated)
 *   2. Correct name, wrong ID  → delete old doc, recreate with fixed ID (migrate)
 *   3. Category missing        → create fresh with fixed ID
 *
 * Usage:
 *   node server/src/scripts/updateCategoryField.js [--dry-run]
 *
 * Add --dry-run to preview changes without writing to Firestore.
 */

require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

const isDryRun = process.argv.includes('--dry-run');

const CC_CATEGORY_ID = 'credit_card';
const CC_CATEGORY_NAME = 'Credit Card Spend';

const CC_CATEGORY_DATA = {
    name: CC_CATEGORY_NAME,
    emoji: '💳',
    type: 'income',
    isPredefined: true,
    isSystem: true,       // marks it as non-deletable on the server
    isEnabled: true,
};

async function seedCreditCardCategoryForAllUsers() {
    console.log('=== Credit Card Spend Category — Seed / Migrate ===');
    console.log(isDryRun ? '*** DRY RUN — no writes will happen ***' : '');
    console.log(`Target doc ID : ${CC_CATEGORY_ID}`);
    console.log(`Category name : ${CC_CATEGORY_NAME}\n`);

    const usersSnap = await db.collection('users').get();
    if (usersSnap.empty) {
        console.log('No users found.');
        return;
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    let totalUsers = 0;
    let totalCreated = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userEmail = userDoc.data().email || uid;
        totalUsers++;

        const catCol = db.collection('users').doc(uid).collection('categories');

        // Case 1: fixed-ID doc already exists → skip
        const fixedSnap = await catCol.doc(CC_CATEGORY_ID).get();
        if (fixedSnap.exists) {
            console.log(`  [SKIP]    ${userEmail} — already has correct doc ID`);
            totalSkipped++;
            continue;
        }

        // Case 2: category exists but with a different (auto-generated) ID → migrate
        const nameSnap = await catCol.where('name', '==', CC_CATEGORY_NAME).limit(1).get();
        if (!nameSnap.empty) {
            const oldDoc = nameSnap.docs[0];
            console.log(`  [MIGRATE] ${userEmail} — old ID: ${oldDoc.id} → ${CC_CATEGORY_ID}`);

            if (!isDryRun) {
                const batch = db.batch();
                // Create with fixed ID, preserve any existing fields the user may have customised
                batch.set(catCol.doc(CC_CATEGORY_ID), {
                    ...CC_CATEGORY_DATA,
                    ...oldDoc.data(),          // keep user overrides (e.g. renamed emoji)
                    name: CC_CATEGORY_NAME,    // enforce canonical name
                    isSystem: true,
                    updatedAt: now,
                    createdAt: oldDoc.data().createdAt || now,
                });
                batch.delete(oldDoc.ref);
                await batch.commit();
            }
            totalMigrated++;
            continue;
        }

        // Case 3: category missing entirely → create
        console.log(`  [CREATE]  ${userEmail} — adding fresh`);
        if (!isDryRun) {
            await catCol.doc(CC_CATEGORY_ID).set({ ...CC_CATEGORY_DATA, createdAt: now, updatedAt: now });
        }
        totalCreated++;
    }

    console.log('\n==============================');
    console.log(`Total users scanned : ${totalUsers}`);
    console.log(`Created             : ${totalCreated}`);
    console.log(`Migrated            : ${totalMigrated}`);
    console.log(`Skipped (up-to-date): ${totalSkipped}`);
    if (isDryRun) console.log('(Dry run — nothing was written)');
    console.log('==============================\n');
}

seedCreditCardCategoryForAllUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
