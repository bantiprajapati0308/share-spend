import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { addBorrowLendRecord } from '../utils/borrowLendFirestore';


const expandTransactionsFromRecords = (records) => {
    const expanded = [];

    records.forEach(record => {
        const entries = Array.isArray(record.data) ? record.data : [];

        entries.forEach((entry, idx) => {
            expanded.push({
                id: entry.uuid || `${record.id}-${idx}`, // Use UUID as primary identifier, fallback to composite ID
                uuid: entry.uuid,
                docId: record.id,
                personName: record.personName,
                type: record.type,
                amount: Number(entry.amount || 0),
                date: entry.insert_date || '',
                dueDate: entry.due_date || null,
                description: entry.description || '',
                paymentType: entry.payment_type || (record.type === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed'),
            });
        });
    });

    return expanded.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const useLendingTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = auth.currentUser?.uid;
            if (!userId) {
                console.error('User not authenticated');
                setTransactions([]);
                return;
            }

            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend'),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(transactionsQuery);
            const data = snapshot.docs.map((document) => document.data());
            console.log('Fetched and normalized transactions:', data);
            setTransactions(data);
        } catch (err) {
            console.error('Error fetching lending transactions:', err);
            setError(err.message || 'Failed to load records');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transactionData) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            await addBorrowLendRecord({
                personName: transactionData.personName,
                amount: transactionData.amount,
                type: transactionData.type,
                date: transactionData.date,
                dueDate: transactionData.dueDate,
                description: transactionData.description,
            });

            await fetchTransactions();
        } catch (err) {
            console.error('Error adding lending transaction:', err);
            throw err;
        }
    };

    const deleteTransaction = async (entryUuid) => {
        console.log('Attempting to delete entry with UUID:', entryUuid);
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            // Find the document containing the entry with the given UUID
            const transactionsQuery = query(
                collection(db, 'users', userId, 'borrowLend')
            );

            const snapshot = await getDocs(transactionsQuery);
            let documentFound = null;
            let entryIndex = -1;

            // Search through all documents to find the one containing the UUID
            snapshot.docs.forEach(document => {
                const data = document.data();
                if (Array.isArray(data.data)) {
                    const index = data.data.findIndex(entry => entry.uuid === entryUuid);
                    if (index !== -1) {
                        documentFound = document;
                        entryIndex = index;
                    }
                }
            });

            if (!documentFound) {
                throw new Error(`Entry with UUID ${entryUuid} not found`);
            }

            const docData = documentFound.data();
            const updatedDataArray = [...docData.data];

            // Remove the entry with the matching UUID
            updatedDataArray.splice(entryIndex, 1);

            // If this was the last entry, delete the entire document
            if (updatedDataArray.length === 0) {
                await deleteDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id));
                console.log('Deleted entire document as it was the last entry');
            } else {
                // Update the document with the modified data array
                await updateDoc(doc(db, 'users', userId, 'borrowLend', documentFound.id), {
                    data: updatedDataArray
                });
                console.log('Updated document with entry removed');
            }

            await fetchTransactions();
            return true;
        } catch (err) {
            console.error('Error deleting lending transaction entry:', {
                error: err.message,
                code: err.code,
                fullError: err
            });
            throw err;
        }
    };

    const computeRecordTotals = (record) => {
        const entries = Array.isArray(record.data) ? record.data : [];

        let totalLent = 0;
        let totalBorrowed = 0;
        let totalRepayment = 0;

        entries.forEach(entry => {
            const paymentType = (entry.payment_type || '').toLowerCase();
            const value = Number(entry.amount || 0);
            if (paymentType === 'lent') totalLent += value;
            else if (paymentType === 'borrowed') totalBorrowed += value;
            else if (paymentType === 'repayment' || paymentType === 'borrowed repayment') totalRepayment += value;
        });

        const outstanding = record.type === TRANSACTION_TYPES.GAVE
            ? Math.max(totalLent - totalRepayment, 0)
            : Math.max(totalBorrowed - totalRepayment, 0);

        return { totalLent, totalBorrowed, totalRepayment, outstanding, entries };
    };

    const getTotalGiven = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.GAVE)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getTotalTaken = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.TOOK)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getNetBalance = () => {
        const given = getTotalGiven();
        const taken = getTotalTaken();
        return Math.round((given - taken) * 100) / 100;
    };

    const expandedTransactions = useMemo(() => expandTransactionsFromRecords(transactions), [transactions]);

    const getFilteredTransactions = (filterType) => {
        if (filterType === 'all') return expandedTransactions;
        return expandedTransactions.filter(t => t.type === filterType);
    };

    return {
        transactions,
        expandedTransactions,
        addTransaction,
        deleteTransaction,
        getTotalGiven,
        getTotalTaken,
        getNetBalance,
        getFilteredTransactions,
        loading,
        error,
        refreshTransactions: fetchTransactions,
    };
};
