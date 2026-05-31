/**
 * Find users with incomplete profile details.
 * Checks for missing: email, displayName/username.
 * Use --not-seeded flag to also flag users where categoriesSeeded is false.
 *
 * Usage:
 *   node server/src/scripts/findIncompleteUsers.js
 *
 * Optional flags:
 *   --no-email       Show only users missing email
 *   --no-name        Show only users missing displayName/username
 *   --not-seeded     Show only users where categoriesSeeded is false/missing
 *
 * Examples:
 *   node server/src/scripts/findIncompleteUsers.js
 *   node server/src/scripts/findIncompleteUsers.js --no-email
 *   node server/src/scripts/findIncompleteUsers.js --not-seeded
 */

require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

const args = process.argv.slice(2);
const filterNoEmail = args.includes('--no-email');
const filterNoName = args.includes('--no-name');
const filterNotSeeded = args.includes('--not-seeded');

function isEmpty(val) {
    return val === undefined || val === null || String(val).trim() === '';
}

async function findIncompleteUsers() {
    const usersSnap = await db.collection('users').get();

    if (usersSnap.empty) {
        console.log('No users found in Firestore.');
        return;
    }

    const results = [];

    for (const doc of usersSnap.docs) {
        const uid = doc.id;
        const u = doc.data();

        const issues = [];

        // Core fields — email always required; displayName (Google) or username (email/password).
        if (isEmpty(u.email)) issues.push('missing email');
        if (isEmpty(u.displayName) && isEmpty(u.username)) issues.push('missing displayName/username');

        // categoriesSeeded is a system flag — only checked when --not-seeded is passed.
        if (filterNotSeeded && !u.categoriesSeeded) issues.push('categoriesSeeded=false');

        if (issues.length === 0) continue;

        // Apply filters if any flag was passed
        if (filterNoEmail && !issues.includes('missing email')) continue;
        if (filterNoName && !issues.includes('missing displayName/username')) continue;

        results.push({ uid, u, issues });
    }

    if (results.length === 0) {
        console.log('\n✅ All users have complete profiles.\n');
        return;
    }

    console.log(`\nFound ${results.length} user(s) with incomplete profiles:\n`);
    console.log('='.repeat(60));

    for (const { uid, u, issues } of results) {
        console.log(`UID           : ${uid}`);
        console.log(`Email         : ${u.email || '(missing)'}`);
        console.log(`Display Name  : ${u.displayName || u.username || '(missing)'}`);
        console.log(`First Name    : ${u.firstName || '(missing)'}`);
        console.log(`Auth Provider : ${u.authProvider || '(missing)'}`);
        console.log(`Cat. Seeded   : ${u.categoriesSeeded ?? false}`);
        console.log(`Created At    : ${u.createdAt?.toDate?.() ?? '(missing)'}`);
        console.log(`Issues        : ${issues.join(', ')}`);
        console.log('-'.repeat(60));
    }

    console.log(`\nTotal incomplete: ${results.length} / ${usersSnap.size} users\n`);
}

findIncompleteUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
