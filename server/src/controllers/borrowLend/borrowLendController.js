const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, notFound, badRequest } = require('../../utils/response');
const { v4: uuidv4 } = require('uuid');

const col = (uid) => db.collection('users').doc(uid).collection('borrowLend');

/**
 * Find the document containing an entry with the given UUID.
 * Fast path: uses array-contains on the denormalized `entryUuids` field (written by
 * addRecord / addRepayment for all new entries).
 * Fallback: full collection scan for legacy documents that pre-date the `entryUuids` field.
 */
const findDocByEntryUuid = async (uid, uuid) => {
    // Fast path — O(1) Firestore read when entryUuids field exists
    const fast = await col(uid).where('entryUuids', 'array-contains', uuid).limit(1).get();
    if (!fast.empty) return fast.docs[0];

    // Fallback — legacy documents without entryUuids
    const snap = await col(uid).get();
    for (const docSnap of snap.docs) {
        const entries = docSnap.data().data || [];
        if (entries.some((e) => e.uuid === uuid)) return docSnap;
    }
    return null;
};

// GET /api/borrow-lend
const getRecords = async (req, res) => {
    try {
        const snap = await col(req.uid).orderBy('createdAt', 'desc').get();
        ok(res, snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/borrow-lend  (gave / took)
const addRecord = async (req, res) => {
    try {
        const { personName, amount, type, date, dueDate, description, payment_type } = req.body;
        if (!personName || amount == null || !type) return badRequest(res, 'personName, amount, type required');

        const normalizedPaymentType = payment_type || (type === 'gave' ? 'Lent' : 'Borrowed');
        const entry = {
            uuid: uuidv4(),
            amount: Number(amount),
            insert_date: date || new Date().toISOString().split('T')[0],
            due_date: dueDate || null,
            payment_type: normalizedPaymentType,
            description: description || '',
        };

        // Find existing doc for this person+type combo
        const existing = await col(req.uid).where('personName', '==', personName).where('type', '==', type).get();

        if (!existing.empty) {
            const existingDoc = existing.docs[0];
            const currentData = existingDoc.data().data || [];
            await existingDoc.ref.update({
                data: [...currentData, entry],
                entryUuids: FieldValue.arrayUnion(entry.uuid),
            });
            return ok(res, { id: existingDoc.id, entry }, 201);
        }

        const ref = await col(req.uid).add({
            userId: req.uid,
            personName,
            type,
            createdAt: FieldValue.serverTimestamp(),
            data: [entry],
            entryUuids: [entry.uuid],
        });
        ok(res, { id: ref.id, entry }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/borrow-lend/repayment
const addRepayment = async (req, res) => {
    try {
        const { personName, repaymentAmount, date, description, type } = req.body;
        if (!personName || repaymentAmount == null || !type) return badRequest(res, 'personName, repaymentAmount, type required');

        const paymentType = type === 'took' ? 'borrowed pay' : 'Repayment';
        const entry = {
            uuid: uuidv4(),
            amount: Number(repaymentAmount),
            insert_date: date || new Date().toISOString().split('T')[0],
            due_date: null,
            payment_type: paymentType,
            description: description || '',
        };

        const snap = await col(req.uid).where('personName', '==', personName).where('type', '==', type).get();

        if (!snap.empty) {
            const docSnap = snap.docs[0];
            const currentData = docSnap.data().data || [];
            await docSnap.ref.update({
                data: [...currentData, entry],
                entryUuids: FieldValue.arrayUnion(entry.uuid),
            });
            return ok(res, { id: docSnap.id, entry }, 201);
        }

        // Fallback: create new doc
        const ref = await col(req.uid).add({
            userId: req.uid,
            personName,
            type,
            createdAt: FieldValue.serverTimestamp(),
            data: [entry],
            entryUuids: [entry.uuid],
        });
        ok(res, { id: ref.id, entry }, 201);
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/borrow-lend/entries/:uuid/archive
const archiveEntry = async (req, res) => {
    try {
        const docSnap = await findDocByEntryUuid(req.uid, req.params.uuid);
        if (!docSnap) return notFound(res, 'Entry not found');

        const entries = (docSnap.data().data || []).map((e) =>
            e.uuid === req.params.uuid ? { ...e, archived: true, archivedAt: new Date().toISOString() } : e
        );
        await docSnap.ref.update({ data: entries });
        ok(res, { archived: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/borrow-lend/entries/:uuid/unarchive
const unarchiveEntry = async (req, res) => {
    try {
        const docSnap = await findDocByEntryUuid(req.uid, req.params.uuid);
        if (!docSnap) return notFound(res, 'Entry not found');

        const entries = (docSnap.data().data || []).map((e) => {
            if (e.uuid !== req.params.uuid) return e;
            const { archived, archivedAt, ...rest } = e;
            return rest;
        });
        await docSnap.ref.update({ data: entries });
        ok(res, { unarchived: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// PATCH /api/borrow-lend/entries/:uuid/mark-done
const toggleMarkDone = async (req, res) => {
    try {
        const docSnap = await findDocByEntryUuid(req.uid, req.params.uuid);
        if (!docSnap) return notFound(res, 'Entry not found');

        const entries = (docSnap.data().data || []).map((e) => {
            if (e.uuid !== req.params.uuid) return e;
            const isDone = !e.markAsDone;
            return { ...e, markAsDone: isDone, markedDoneAt: isDone ? new Date().toISOString() : null };
        });
        await docSnap.ref.update({ data: entries });
        ok(res, { toggled: true });
    } catch (e) {
        fail(res, e.message);
    }
};

// DELETE /api/borrow-lend/entries/:uuid
const deleteEntry = async (req, res) => {
    try {
        const docSnap = await findDocByEntryUuid(req.uid, req.params.uuid);
        if (!docSnap) return notFound(res, 'Entry not found');

        const filtered = (docSnap.data().data || []).filter((e) => e.uuid !== req.params.uuid);

        if (filtered.length === 0) {
            await docSnap.ref.delete();
        } else {
            await docSnap.ref.update({ data: filtered });
        }
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getRecords, addRecord, addRepayment, archiveEntry, unarchiveEntry, toggleMarkDone, deleteEntry };
