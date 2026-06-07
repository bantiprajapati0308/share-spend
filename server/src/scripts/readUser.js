/**
 * Read user details from Firestore by email address.
 *
 * Usage:
 *   node server/src/scripts/readUser.js <email>
 *
 * Example:
 *   node server/src/scripts/readUser.js john@example.com
 */

// Reuse the existing firebase config so credentials are loaded the same way.
require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

const email = process.argv[2];

if (!email) {
    console.error('Usage: node readUser.js <email>');
    process.exit(1);
}

async function readUserByEmail(email) {
    // Search the top-level users collection for a matching email field.
    const snap = await db.collection('users').where('email', '==', email).get();

    if (snap.empty) {
        console.log(`No user found with email: ${email}`);
        return;
    }

    for (const doc of snap.docs) {
        const uid = doc.id;
        const profile = doc.data();

        // Fetch subcollections in parallel for a complete picture.
        const [categoriesSnap, limitsSnap, dailySpendsSnap] = await Promise.all([
            db.collection('users').doc(uid).collection('categories').get(),
            db.collection('users').doc(uid).collection('categoryLimits').get(),
            db.collection('users').doc(uid).collection('dailySpends').orderBy('date', 'desc').limit(5).get(),
        ]);

        console.log('\n==============================');
        console.log('USER PROFILE');
        console.log('==============================');
        console.log('UID           :', uid);
        console.log('Email         :', profile.email);
        console.log('Display Name  :', profile.displayName || profile.username || '—');
        console.log('First Name    :', profile.firstName || '—');
        console.log('Last Name     :', profile.lastName || '—');
        console.log('Auth Provider :', profile.authProvider || '—');
        console.log('Categories Seeded:', profile.categoriesSeeded ?? false);
        console.log('Created At    :', profile.createdAt?.toDate?.() ?? '—');
        console.log('Last Login    :', profile.lastLoginAt?.toDate?.() ?? '—');

        console.log('\n--- Categories (' + categoriesSnap.size + ') ---');
        categoriesSnap.forEach((d) => {
            const c = d.data();
            console.log(`  [${c.type}] ${c.emoji || ''} ${c.name} — enabled: ${c.isEnabled}, predefined: ${c.isPredefined}`);
        });

        console.log('\n--- Category Limits (' + limitsSnap.size + ') ---');
        limitsSnap.forEach((d) => {
            const l = d.data();
            console.log(`  [${l.type}] ${l.category} — limit: ${l.limit}, predefined: ${l.isPredefined}`);
        });

        console.log('\n--- Last 5 Transactions ---');
        if (dailySpendsSnap.empty) {
            console.log('  (no transactions)');
        } else {
            dailySpendsSnap.forEach((d) => {
                const t = d.data();
                console.log(`  ${t.date} [${t.type}] ${t.category} — ₹${t.amount} | ${t.description || '—'}`);
            });
        }

        console.log('\n==============================\n');
    }
}

readUserByEmail(email)
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
