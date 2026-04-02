import { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { addBorrowLendRecord } from '../utils/borrowLendFirestore';

// Normalize a record from Firestore to unified structure:
const normalizeRecord = (docId, data) => {
    const personName = data.personName || 'Unknown';
    const type = data.type || TRANSACTION_TYPES.GAVE;

    const entries = [];

    if (Array.isArray(data.data) && data.data.length) {
        data.data.forEach((entry) => {
            entries.push({
                amount: Number(entry.amount || 0),
                insert_date: entry.insert_date || entry.date || '',
                due_date: entry.due_date || entry.dueDate || null,
                payment_type: entry.payment_type || (type === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed'),
                description: entry.description || '',
            });
        });
    } else if (data.amount != null) {
        entries.push({
            amount: Number(data.amount || 0),
            insert_date: data.date || data.insert_date || new Date().toISOString().split('T')[0],
            due_date: data.dueDate || data.due_date || null,
            payment_type: type === TRANSACTION_TYPES.GAVE ? 'Lent' : type === TRANSACTION_TYPES.TOOK ? 'Borrowed' : 'Unknown',
            description: data.description || '',
        });
    }

    return {
        id: docId,
        userId: data.userId || auth.currentUser?.uid || '',
        personName,
        type,
        data: entries,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
    };
};

const expandTransactionsFromRecords = (records) => {
    const expanded = [];

    records.forEach(record => {
        const entries = Array.isArray(record.data) ? record.data : [];

        entries.forEach((entry, idx) => {
            expanded.push({
                id: `${record.id}-${idx}`,
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
            const normalized = snapshot.docs.map((document) => normalizeRecord(document.id, document.data()));

            setTransactions(normalized);
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

    const deleteTransaction = async (transactionId) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User not authenticated');
            }

            await deleteDoc(doc(db, 'users', userId, 'borrowLend', String(transactionId)));
            await fetchTransactions();
            return true;
        } catch (err) {
            console.error('Error deleting lending transaction:', {
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
