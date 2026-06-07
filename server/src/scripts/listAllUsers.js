/**
 * List all users with their profile summary and total record counts
 * across every subcollection (categories, categoryLimits, dailySpends,
 * borrowLend, settings, trips).
 *
 * Usage:
 *   node server/src/scripts/listAllUsers.js
 *
 * Optional flags:
 *   --sort-email     Sort by email (default: sort by createdAt)
 *   --sort-spends    Sort by dailySpends count descending
 */

require('../config/firebase');

const admin = require('firebase-admin');
const db = admin.firestore();

const args = process.argv.slice(2);
const sortBy = args.includes('--sort-email') ? 'email'
    : args.includes('--sort-spends') ? 'spends'
        : 'createdAt';

const SUBCOLLECTIONS = ['categories', 'categoryLimits', 'dailySpends', 'borrowLend', 'settings', 'trips'];

async function getSubcollectionCounts(uid) {
    const counts = await Promise.all(
        SUBCOLLECTIONS.map((sub) =>
            db.collection('users').doc(uid).collection(sub).count().get()
                .then((snap) => snap.data().count)
                .catch(() => 0)   // subcollection may not exist for older users
        )
    );
    return Object.fromEntries(SUBCOLLECTIONS.map((sub, i) => [sub, counts[i]]));
}

async function listAllUsers() {
    const usersSnap = await db.collection('users').get();

    if (usersSnap.empty) {
        console.log('No users found in Firestore.');
        return;
    }

    console.log(`\nFetching counts for ${usersSnap.size} user(s)...\n`);

    // Fetch all users + their counts in parallel.
    const rows = await Promise.all(
        usersSnap.docs.map(async (doc) => {
            const uid = doc.id;
            const u = doc.data();
            const counts = await getSubcollectionCounts(uid);
            const total = Object.values(counts).reduce((s, c) => s + c, 0);
            return { uid, u, counts, total };
        })
    );

    // Sort
    if (sortBy === 'email') {
        rows.sort((a, b) => (a.u.email || '').localeCompare(b.u.email || ''));
    } else if (sortBy === 'spends') {
        rows.sort((a, b) => b.counts.dailySpends - a.counts.dailySpends);
    } else {
        rows.sort((a, b) => {
            const tA = a.u.createdAt?.toMillis?.() ?? 0;
            const tB = b.u.createdAt?.toMillis?.() ?? 0;
            return tA - tB;
        });
    }

    // ── Header ──────────────────────────────────────────────────────────────
    const COL = { uid: 28, email: 32, name: 20, cat: 6, lim: 6, spends: 7, borrow: 7, sets: 5, trips: 6, total: 6 };

    const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);
    const lpad = (s, n) => String(s ?? '').padStart(n);

    console.log(
        pad('UID', COL.uid) + ' ' +
        pad('Email', COL.email) + ' ' +
        pad('Name', COL.name) + ' ' +
        lpad('Cats', COL.cat) + ' ' +
        lpad('Limits', COL.lim) + ' ' +
        lpad('Spends', COL.spends) + ' ' +
        lpad('Borrow', COL.borrow) + ' ' +
        lpad('Settings', COL.sets) + ' ' +
        lpad('Trips', COL.trips) + ' ' +
        lpad('Total', COL.total)
    );
    console.log('─'.repeat(COL.uid + COL.email + COL.name + COL.cat + COL.lim + COL.spends + COL.borrow + COL.sets + COL.trips + COL.total + 10));

    // ── Rows ─────────────────────────────────────────────────────────────────
    let grandTotal = 0;
    for (const { uid, u, counts, total } of rows) {
        const name = u.displayName || u.username || u.firstName || '—';
        console.log(
            pad(uid, COL.uid) + ' ' +
            pad(u.email || '(no email)', COL.email) + ' ' +
            pad(name, COL.name) + ' ' +
            lpad(counts.categories, COL.cat) + ' ' +
            lpad(counts.categoryLimits, COL.lim) + ' ' +
            lpad(counts.dailySpends, COL.spends) + ' ' +
            lpad(counts.borrowLend, COL.borrow) + ' ' +
            lpad(counts.settings, COL.sets) + ' ' +
            lpad(counts.trips, COL.trips) + ' ' +
            lpad(total, COL.total)
        );
        grandTotal += total;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    console.log('─'.repeat(COL.uid + COL.email + COL.name + COL.cat + COL.lim + COL.spends + COL.borrow + COL.sets + COL.trips + COL.total + 10));
    console.log(`Total users: ${rows.length}   Grand total records: ${grandTotal}\n`);
}

listAllUsers()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err.message);
        process.exit(1);
    });
