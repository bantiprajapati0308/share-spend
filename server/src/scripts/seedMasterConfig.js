/**
 * Seed / sync script for Firestore appConfig/masterConfig document.
 *
 * Run from the server/ directory:
 *   node src/scripts/seedMasterConfig.js
 *
 * Behaviour:
 *   - If document does not exist → create it.
 *   - If document exists and data matches → skip (already up to date).
 *   - If document exists but data differs → update only the changed fields.
 */

const { db, FieldValue } = require('../config/firebase');

const PAYMENT_METHODS = [
    { id: 'cash', value: 'cash', label: 'Cash' },
    { id: 'upi', value: 'upi', label: 'Online Banking' },
    { id: 'credit_card', value: 'credit_card', label: 'Credit Card' },
];

// Deep-equal comparison for plain JSON-serialisable values
function deepEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

async function seed() {
    const ref = db.collection('appConfig').doc('masterConfig');
    const snap = await ref.get();

    if (!snap.exists) {
        await ref.set({
            paymentMethods: PAYMENT_METHODS,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log('[seedMasterConfig] Created successfully.');
        return;
    }

    // Document exists — compare field by field
    const existing = snap.data();
    const updates = {};

    if (!deepEqual(existing.paymentMethods, PAYMENT_METHODS)) {
        console.log('[seedMasterConfig] paymentMethods changed:');
        console.log('  DB  :', JSON.stringify(existing.paymentMethods, null, 2));
        console.log('  New :', JSON.stringify(PAYMENT_METHODS, null, 2));
        updates.paymentMethods = PAYMENT_METHODS;
    }

    if (Object.keys(updates).length === 0) {
        console.log('[seedMasterConfig] Document is already up to date — no changes needed.');
        return;
    }

    updates.updatedAt = FieldValue.serverTimestamp();
    await ref.update(updates);
    console.log(`[seedMasterConfig] Updated ${Object.keys(updates).filter(k => k !== 'updatedAt').join(', ')} successfully.`);
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('[seedMasterConfig] Error:', err);
        process.exit(1);
    });

