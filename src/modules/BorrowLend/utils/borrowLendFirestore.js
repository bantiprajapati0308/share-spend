/**
 * BorrowLend Firestore helpers for DailySpends integration
 */

import { db, auth } from '../../../firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

const getUserBorrowLendCollection = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return collection(db, 'users', userId, 'borrowLend');
};

export const addBorrowLendRecord = async ({ personName, amount, type, date, dueDate = null, description = '', payment_type = '' }) => {
    try {
        const normalizedType = type || TRANSACTION_TYPES.GAVE;
        const normalizedPaymentType = payment_type || (normalizedType === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed');
        const insertDate = date || new Date().toISOString().split('T')[0];

        // Find existing record by user+personName+type
        const personQuery = query(
            getUserBorrowLendCollection(),
            where('personName', '==', personName),
            where('type', '==', normalizedType)
        );

        const snapshot = await getDocs(personQuery);

        const entry = {
            amount,
            insert_date: insertDate,
            due_date: dueDate || null,
            payment_type: normalizedPaymentType,
            description
        };

        if (!snapshot.empty) {
            const existingDoc = snapshot.docs[0];
            await updateDoc(doc(db, 'users', auth.currentUser.uid, 'borrowLend', existingDoc.id), {
                data: arrayUnion(entry)
            });
            return { id: existingDoc.id, ...existingDoc.data(), data: [...(existingDoc.data().data || []), entry] };
        }

        const initialPayload = {
            userId: auth.currentUser.uid,
            personName,
            type: normalizedType,
            createdAt: serverTimestamp(),
            data: [entry]
        };

        const docRef = await addDoc(getUserBorrowLendCollection(), initialPayload);
        return { id: docRef.id, ...initialPayload };
    } catch (error) {
        console.error('Error adding BorrowLend record:', error);
        throw error;
    }
};

export const applyBorrowLendRepayment = async ({ personName, repaymentAmount, date, description = '' }) => {
    try {
        const normalizedDate = date || new Date().toISOString().split('T')[0];

        // Prefer to apply repayment to borrowed records (you owe someone) if exists, otherwise to lent records.
        const lookupType = TRANSACTION_TYPES.TOOK;
        const altType = TRANSACTION_TYPES.GAVE;

        const primaryQuery = query(
            getUserBorrowLendCollection(),
            where('personName', '==', personName),
            where('type', '==', lookupType)
        );

        let snapshot = await getDocs(primaryQuery);

        if (snapshot.empty) {
            const altQuery = query(
                getUserBorrowLendCollection(),
                where('personName', '==', personName),
                where('type', '==', altType)
            );
            snapshot = await getDocs(altQuery);
        }

        if (!snapshot.empty) {
            const docRef = snapshot.docs[0];
            const recordType = docRef.data().type;
            const paymentType = recordType === TRANSACTION_TYPES.TOOK ? 'Borrowed Repayment' : 'Repayment';
            const entry = {
                amount: repaymentAmount,
                insert_date: normalizedDate,
                due_date: null,
                payment_type: paymentType,
                description,
            };

            await updateDoc(doc(db, 'users', auth.currentUser.uid, 'borrowLend', docRef.id), {
                data: arrayUnion(entry)
            });

            return {
                id: docRef.id,
                ...docRef.data(),
                data: [...(docRef.data().data || []), entry]
            };
        }

        // If no matching entry exists, create a new one as repayment adjustment
        return addBorrowLendRecord({
            personName,
            amount: repaymentAmount,
            type: TRANSACTION_TYPES.TOOK,
            date: normalizedDate,
            dueDate: null,
            description: `${description} (Repayment adjustment)`,
            payment_type: 'Repayment'
        });
    } catch (error) {
        console.error('Error applying BorrowLend repayment:', error);
        throw error;
    }
};
