/**
 * Firestore Migration: Category Schema v1 → v2
 *
 * For each user this script:
 *   1. Migrates every existing category doc:
 *        - isEnabled  → isEnable  (field rename)
 *        - isPredefined + systemId removed (replaced by noDeletable)
 *        - noDeletable added (derived from PREDEFINED_CATEGORIES)
 *        - id field added if missing (= Firestore doc ID)
 *   2. Re-keys predefined categories that still have auto-generated IDs
 *      to their canonical stable ID (e.g. "Lent" doc → id "lent").
 *      The old doc is deleted and a new one is written under the stable ID.
 *      All fields are preserved.
 *   3. Seeds any predefined categories missing entirely for that user.
 *
 * Run once:
 *   node server/scripts/migrateCategorySchema.js
 *
 * Safe to re-run — already-migrated docs are detected and skipped.
 */

const admin = require('firebase-admin');
const { db } = require('../config/firebase');

// ─── Canonical list (mirrors categoriesController.js PREDEFINED_CATEGORIES) ──
const PREDEFINED_CATEGORIES = [
    { id: 'grocery', name: 'Grocery', emoji: '🛒', type: 'spend', noDeletable: false },
    { id: 'rent', name: 'Rent', emoji: '🏠', type: 'spend', noDeletable: false },
    { id: 'transportation', name: 'Transportation', emoji: '🚗', type: 'spend', noDeletable: false },
    { id: 'emis', name: 'EMIs', emoji: '💳', type: 'spend', noDeletable: false },
    { id: 'investment', name: 'Investment', emoji: '📈', type: 'spend', noDeletable: false },
    { id: 'personal', name: 'Personal', emoji: '👤', type: 'spend', noDeletable: false },
    { id: 'friend_spent', name: 'Friend Spent', emoji: '👫', type: 'spend', noDeletable: false },
    { id: 'lent', name: 'Lent', emoji: '🤝', type: 'spend', noDeletable: true },
    { id: 'borrowed_pay', name: 'Borrowed Pay', emoji: '💳', type: 'spend', noDeletable: true },
    { id: 'credit_cards_bill', name: 'Credit Cards Bill', emoji: '💰', type: 'spend', noDeletable: false },
    { id: 'credit_card', name: 'Credit Card Spends', emoji: '💳', type: 'income', noDeletable: true },
    { id: 'salary', name: 'Salary', emoji: '💼', type: 'income', noDeletable: false },
    { id: 'bonus', name: 'Bonus', emoji: '🎉', type: 'income', noDeletable: false },
    { id: 'borrowed', name: 'Borrowed', emoji: '📋', type: 'income', noDeletable: true },
    { id: 'repayment', name: 'Repayment', emoji: '✅', type: 'income', noDeletable: true },
];

// name → canonical entry  (for re-keying docs by name lookup)
const BY_NAME = new Map(PREDEFINED_CATEGORIES.map(c => [c.name, c]));

// ─────────────────────────────────────────────────────────────────────────────

function normalizeDoc(docId, data, canonical) {
    const updates = {};
    const del = admin.firestore.FieldValue.delete();

    // 1. isEnabled → isEnable
    if ('isEnabled' in data && !('isEnable' in data)) {
        updates.isEnable = data.isEnabled;
        updates.isEnabled = del;
    } else if (!('isEnable' in data)) {
        updates.isEnable = true; // default
    }

    // 2. Remove stale fields
    if ('isPredefined' in data) updates.isPredefined = del;
    if ('systemId' in data) updates.systemId = del;

    // 3. Add noDeletable if missing
    if (!('noDeletable' in data)) {
        updates.noDeletable = canonical ? canonical.noDeletable : false;
    }

    // 4. Add id field if missing
    if (!('id' in data)) {
        updates.id = docId;
    }

    return updates;
}

async function migrateUser(uid) {
    const colRef = db.collection('users').doc(uid).collection('categories');
    const snap = await colRef.get();

    const existingIds = new Set(snap.docs.map(d => d.id));
    const existingNames = new Set(snap.docs.map(d => d.data().name));

    // We can't mix create/delete of the same doc in one batch, so we use two passes:
    //   pass1 batch: in-place updates + deletes of old auto-ID docs
    //   pass2 batch: writes of new stable-ID docs
    const batch1 = db.batch();
    const batch2 = db.batch();
    let updated = 0, rekeyed = 0, seeded = 0;

    // ── Pass A: migrate / re-key existing docs ─────────────────────────────
    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const canonical = BY_NAME.get(data.name);
        const stableId = canonical?.id;

        const needsRekey = stableId && docSnap.id !== stableId && !existingIds.has(stableId);

        if (needsRekey) {
            // Delete old auto-ID doc
            batch1.delete(docSnap.ref);

            // Compute clean field set for the new stable-ID doc
            const cleanData = { ...data };
            delete cleanData.isEnabled;
            delete cleanData.isPredefined;
            delete cleanData.systemId;
            cleanData.id = stableId;
            cleanData.isEnable = data.isEnabled !== undefined ? data.isEnabled : (data.isEnable !== undefined ? data.isEnable : true);
            cleanData.noDeletable = canonical.noDeletable;

            batch2.set(colRef.doc(stableId), cleanData);
            rekeyed++;
        } else {
            // In-place field migration
            const updates = normalizeDoc(docSnap.id, data, canonical);
            if (Object.keys(updates).length > 0) {
                batch1.update(docSnap.ref, updates);
                updated++;
            }
        }
    }

    // ── Pass B: seed missing predefined categories ─────────────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    for (const cat of PREDEFINED_CATEGORIES) {
        // Skip if already present by stable ID or by name (will be rekeyed above)
        if (existingIds.has(cat.id) || existingNames.has(cat.name)) continue;
        batch2.set(colRef.doc(cat.id), {
            id: cat.id, name: cat.name, emoji: cat.emoji,
            type: cat.type, noDeletable: cat.noDeletable,
            isEnable: true, createdAt: now, updatedAt: now,
        });
        seeded++;
    }

    if (updated > 0 || rekeyed > 0) await batch1.commit();
    if (rekeyed > 0 || seeded > 0) await batch2.commit();

    return { updated, rekeyed, seeded };
}

async function run() {
    console.log('Starting category schema migration…\n');
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} user(s).\n`);

    let totalUpdated = 0, totalRekeyed = 0, totalSeeded = 0;

    for (const userDoc of usersSnap.docs) {
        const { updated, rekeyed, seeded } = await migrateUser(userDoc.id);
        console.log(`uid=${userDoc.id}: in-place=${updated}, re-keyed=${rekeyed}, seeded=${seeded}`);
        totalUpdated += updated;
        totalRekeyed += rekeyed;
        totalSeeded += seeded;
    }

    console.log(`\nDone. in-place=${totalUpdated}, re-keyed=${totalRekeyed}, seeded=${totalSeeded}`);
    process.exit(0);
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
