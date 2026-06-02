/**
 * One-time seed script for Firestore appConfig/masterConfig document.
 *
 * Run once from the server/ directory:
 *   node scripts/seedMasterConfig.js
 *
 * It is idempotent — safe to re-run; skips if the document already exists.
 */

const { db, FieldValue } = require('../config/firebase');

const PAYMENT_METHODS = [
    { id: 'cash', value: 'cash', label: 'Cash' },
    { id: 'upi', value: 'upi', label: 'UPI' },
    { id: 'credit_card', value: 'credit_card', label: 'Credit Card' },
    { id: 'debit_card', value: 'debit_card', label: 'Debit Card' },
    { id: 'net_banking', value: 'net_banking', label: 'Net Banking' },
];

async function seed() {
    const ref = db.collection('appConfig').doc('masterConfig');
    const snap = await ref.get();

    if (snap.exists) {
        console.log('[seedMasterConfig] Document already exists — skipping.');
        return;
    }

    await ref.set({
        paymentMethods: PAYMENT_METHODS,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('[seedMasterConfig] Seeded successfully.');
}

seed()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('[seedMasterConfig] Error:', err);
        process.exit(1);
    });
