const { db, FieldValue } = require('../../config/firebase');
const { ok, fail } = require('../../utils/response');

const col = (uid) => db.collection('users').doc(uid).collection('dailySpends');
const catCol = (uid) => db.collection('users').doc(uid).collection('categories');

/** Shared ID for the credit-card payment method and its companion income category. */
const CREDIT_CARD_ID = 'credit_card';

/** Fetches the credit-card-spend income category from the user's own categories collection. */
const getCreditCardCategory = async (uid) => {
    const snap = await catCol(uid).doc(CREDIT_CARD_ID).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Builds the companion income entry data for a credit-card spend transaction.
 * The `creditCardSpendId` field links the companion to its parent for cleanup on delete.
 */
const buildCreditCardIncome = (spendBody, spendId, category) => ({
    type: 'income',
    name: spendBody.name,
    amount: spendBody.amount,
    categoryId: CREDIT_CARD_ID,
    categoryName: category.name,
    category: category.name,
    categoryIcon: category.emoji || '💳',
    date: spendBody.date,
    notes: '',
    paymentMethodId: null,
    creditCardSpendId: spendId,
    isCreditCardCompanion: true,
});

// GET /api/daily-spends?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&type=spend|income]
const getTransactions = async (req, res) => {
    try {
        const { type, startDate, endDate } = req.query;

        let query = col(req.uid);
        let docs;

        if (startDate && endDate) {
            const startBound = startDate;
            const endBound = `${endDate}T23:59:59.999`;
            const snap = await query
                .where('date', '>=', startBound)
                .where('date', '<=', endBound)
                .get();
            docs = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        } else if (type) {
            // Legacy: type-only filter (composite index: type ASC, createdAt DESC)
            const snap = await query
                .where('type', '==', type)
                .orderBy('createdAt', 'desc')
                .get();
            docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } else {
            // No filter — full collection ordered by creation time (fallback / admin use)
            const snap = await query.orderBy('createdAt', 'desc').get();
            docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }

        ok(res, docs);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/daily-spends
const addTransaction = async (req, res) => {
    try {
        const now = FieldValue.serverTimestamp();
        const data = { ...req.body, userId: req.uid, createdAt: now, updatedAt: now };
        const ref = await col(req.uid).add(data);

        // When a credit-card spend is added, auto-create a companion income entry
        // so the credit card liability is reflected in the current month's income.
        let companion = null;
        if (req.body.type === 'spend' && req.body.paymentMethodId === CREDIT_CARD_ID) {
            const ccCategory = await getCreditCardCategory(req.uid);
            if (ccCategory) {
                const companionData = {
                    ...buildCreditCardIncome(req.body, ref.id, ccCategory),
                    userId: req.uid,
                    createdAt: now,
                    updatedAt: now,
                };
                const companionRef = await col(req.uid).add(companionData);
                companion = { id: companionRef.id, ...buildCreditCardIncome(req.body, ref.id, ccCategory) };
            }
        }

        ok(res, { id: ref.id, ...req.body, ...(companion && { _companion: companion }) }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PUT /api/daily-spends/:id
// Syncs the companion credit-card income entry (if any) automatically:
//   - Still credit card  → patch companion amount + date
//   - Switched away      → delete companion
//   - Switched to CC     → create new companion
const updateTransaction = async (req, res) => {
    try {
        const now = FieldValue.serverTimestamp();
        const ref = col(req.uid).doc(req.params.id);
        await ref.update({ ...req.body, updatedAt: now });

        const isNowCreditCard =
            req.body.type === 'spend' && req.body.paymentMethodId === CREDIT_CARD_ID;

        // Look up any existing companion linked to this spend
        const companionSnap = await col(req.uid)
            .where('creditCardSpendId', '==', req.params.id)
            .limit(1)
            .get();
        const hasCompanion = !companionSnap.empty;

        let _companion = null;
        let _deletedCompanionId = null;

        if (isNowCreditCard && hasCompanion) {
            // Patch companion — keep amount and date in sync with the spend
            const companionRef = companionSnap.docs[0].ref;
            const patch = { amount: req.body.amount, date: req.body.date, updatedAt: now };
            await companionRef.update(patch);
            _companion = { id: companionSnap.docs[0].id, ...companionSnap.docs[0].data(), ...patch };

        } else if (isNowCreditCard && !hasCompanion) {
            // Payment method switched to credit card — create companion
            const ccCategory = await getCreditCardCategory(req.uid);
            if (ccCategory) {
                const companionData = {
                    ...buildCreditCardIncome(req.body, req.params.id, ccCategory),
                    userId: req.uid,
                    createdAt: now,
                    updatedAt: now,
                };
                const companionRef = await col(req.uid).add(companionData);
                _companion = { id: companionRef.id, ...buildCreditCardIncome(req.body, req.params.id, ccCategory) };
            }

        } else if (!isNowCreditCard && hasCompanion) {
            // Payment method switched away from credit card — delete companion
            _deletedCompanionId = companionSnap.docs[0].id;
            await companionSnap.docs[0].ref.delete();
        }

        ok(res, {
            id: req.params.id,
            ...req.body,
            ...(_companion && { _companion }),
            ...(_deletedCompanionId && { _deletedCompanionId }),
        });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/daily-spends/:id
// Also deletes the linked companion income entry (if any) created for credit-card spends.
const deleteTransaction = async (req, res) => {
    try {
        const spendRef = col(req.uid).doc(req.params.id);

        // Find companion income linked to this spend (at most one)
        const companionSnap = await col(req.uid)
            .where('creditCardSpendId', '==', req.params.id)
            .limit(1)
            .get();

        const batch = db.batch();
        batch.delete(spendRef);
        let deletedCompanionId = null;
        if (!companionSnap.empty) {
            deletedCompanionId = companionSnap.docs[0].id;
            batch.delete(companionSnap.docs[0].ref);
        }

        await batch.commit();
        ok(res, { deleted: true, deletedCompanionId });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getTransactions, addTransaction, updateTransaction, deleteTransaction };
