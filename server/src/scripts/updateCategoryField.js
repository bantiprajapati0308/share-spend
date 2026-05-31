/**
 * Update a specific field on a category (matched by name) across ALL users.
 *
 * Usage:
 *   node server/src/scripts/updateCategoryField.js <categoryName> <field> <value>
 *
 * Examples:
 *   node server/src/scripts/updateCategoryField.js "Grocery" emoji "🛍️"
 *   node server/src/scripts/updateCategoryField.js "Rent" isEnabled false
 *   node server/src/scripts/updateCategoryField.js "Salary" type "income"
 *   node server/src/scripts/updateCategoryField.js "Personal" limit 3000
 *
 * Allowed fields: name, emoji, type, isEnabled, isPredefined
 *
 * Add --dry-run flag to preview changes without writing to Firestore:
 *   node server/src/scripts/updateCategoryField.js "Grocery" emoji "🛍️" --dry-run
 */

require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

const ALLOWED_FIELDS = ['name', 'emoji', 'type', 'isEnabled', 'isPredefined'];

const [categoryName, field, rawValue, flag] = process.argv.slice(2);
const isDryRun = flag === '--dry-run' || process.argv.includes('--dry-run');

if (!categoryName || !field || rawValue === undefined) {
    console.error('Usage: node updateCategoryField.js <categoryName> <field> <value> [--dry-run]');
    console.error('Allowed fields:', ALLOWED_FIELDS.join(', '));
    process.exit(1);
}

if (!ALLOWED_FIELDS.includes(field)) {
    console.error(`Invalid field "${field}". Allowed: ${ALLOWED_FIELDS.join(', ')}`);
    process.exit(1);
}

// Parse value to correct type (boolean, number, or string).
function parseValue(v) {
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (!isNaN(v) && v.trim() !== '') return Number(v);
    return v;
}

const newValue = parseValue(rawValue);

async function updateCategoryForAllUsers() {
    console.log(`\nField   : ${field}`);
    console.log(`Category: "${categoryName}"`);
    console.log(`New value: ${JSON.stringify(newValue)}`);
    console.log(isDryRun ? '*** DRY RUN — no writes will happen ***\n' : '');

    // Get all user documents.
    const usersSnap = await db.collection('users').get();

    if (usersSnap.empty) {
        console.log('No users found.');
        return;
    }

    let totalUsers = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userEmail = userDoc.data().email || uid;

        // Find category by name for this user.
        const catSnap = await db
            .collection('users').doc(uid)
            .collection('categories')
            .where('name', '==', categoryName)
            .get();

        totalUsers++;

        if (catSnap.empty) {
            console.log(`  [SKIP] ${userEmail} — category "${categoryName}" not found`);
            totalSkipped++;
            continue;
        }

        for (const catDoc of catSnap.docs) {
            const currentValue = catDoc.data()[field];
            if (currentValue === newValue) {
                console.log(`  [SKIP] ${userEmail} — already "${newValue}"`);
                totalSkipped++;
                continue;
            }

            console.log(`  [${isDryRun ? 'DRY' : 'UPDATE'}] ${userEmail} — ${field}: "${currentValue}" → "${newValue}"`);

            if (!isDryRun) {
                await catDoc.ref.update({
                    [field]: newValue,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            totalUpdated++;
        }
    }

    console.log('\n==============================');
    console.log(`Total users scanned : ${totalUsers}`);
    console.log(`Categories updated  : ${totalUpdated}`);
    console.log(`Skipped             : ${totalSkipped}`);
    if (isDryRun) console.log('(Dry run — nothing was written)');
    console.log('==============================\n');
}

updateCategoryForAllUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
