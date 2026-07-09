const { db, FieldValue } = require('../../config/firebase');
const { ok, fail, notFound, badRequest } = require('../../utils/response');
const { v4: uuidv4 } = require('uuid');

const col = (uid) => db.collection('users').doc(uid).collection('borrowLend');

const normalizeContactValue = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
};

const normalizeRecord = (docSnap) => {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        mobileNumber: data.mobileNumber || '',
        email: data.email || '',
        ...data,
    };
};

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
        ok(res, snap.docs.map(normalizeRecord));
    } catch (e) {
        fail(res, e.message);
    }
};

// GET /api/borrow-lend/person-names?type=gave|took
const getPersonNames = async (req, res) => {
    try {
        const { type } = req.query;
        const validTypes = new Set(['gave', 'took']);

        let query = col(req.uid);
        if (type && validTypes.has(type)) {
            query = query.where('type', '==', type);
        }

        const snap = await query.select('personName', 'mobileNumber', 'email', 'type').get();
        const peopleByName = new Map();

        snap.docs.forEach((doc) => {
            const data = doc.data();
            const personName = String(data.personName || '').trim();
            if (!personName) return;

            const key = personName.toLowerCase();
            const current = peopleByName.get(key);
            const next = {
                id: doc.id,
                personName,
                mobileNumber: data.mobileNumber || '',
                email: data.email || '',
                type: data.type || type || '',
            };

            if (!current) {
                peopleByName.set(key, next);
                return;
            }

            peopleByName.set(key, {
                ...current,
                mobileNumber: current.mobileNumber || next.mobileNumber,
                email: current.email || next.email,
            });
        });

        const people = Array.from(peopleByName.values())
            .sort((a, b) => a.personName.localeCompare(b.personName));

        ok(res, people);
    } catch (e) {
        fail(res, e.message);
    }
};

// POST /api/borrow-lend  (gave / took)
const addRecord = async (req, res) => {
    try {
        const { personName, amount, type, date, dueDate, description, payment_type, mobileNumber, email } = req.body;
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
            const updatePayload = {
                data: [...currentData, entry],
                entryUuids: FieldValue.arrayUnion(entry.uuid),
            };
            if (mobileNumber !== undefined) updatePayload.mobileNumber = normalizeContactValue(mobileNumber);
            if (email !== undefined) updatePayload.email = normalizeContactValue(email);
            await existingDoc.ref.update(updatePayload);
            return ok(res, { id: existingDoc.id, entry }, 201);
        }

        const ref = await col(req.uid).add({
            userId: req.uid,
            personName,
            mobileNumber: normalizeContactValue(mobileNumber),
            email: normalizeContactValue(email),
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
            mobileNumber: '',
            email: '',
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

// PATCH /api/borrow-lend/:id/contact
const updateContact = async (req, res) => {
    try {
        const { id } = req.params;
        const { mobileNumber, email } = req.body;
        if (!id) return badRequest(res, 'Record ID is required');

        const ref = col(req.uid).doc(id);
        const docSnap = await ref.get();
        if (!docSnap.exists) return notFound(res, 'Borrow/Lend record not found');

        const updatePayload = {};
        if (mobileNumber !== undefined) updatePayload.mobileNumber = normalizeContactValue(mobileNumber);
        if (email !== undefined) updatePayload.email = normalizeContactValue(email);

        if (Object.keys(updatePayload).length === 0) {
            return badRequest(res, 'mobileNumber or email is required');
        }

        await ref.update(updatePayload);
        ok(res, { id, ...updatePayload });
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
            await docSnap.ref.update({
                data: filtered,
                entryUuids: filtered.map((entry) => entry.uuid).filter(Boolean),
            });
        }
        ok(res, { deleted: true });
    } catch (e) {
        fail(res, e.message);
    }
};

module.exports = { getRecords, getPersonNames, addRecord, addRepayment, updateContact, deleteEntry };
