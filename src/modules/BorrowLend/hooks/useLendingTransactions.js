import { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

export const useLendingTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch transactions from Firebase on mount
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
                orderBy('date', 'desc')
            );

            const snapshot = await getDocs(transactionsQuery);
            const data = snapshot.docs.map(document => ({
                id: document.id,
                ...document.data(),
                createdAt: document.data().createdAt?.toDate?.() || new Date(document.data().createdAt),
                date: document.data().date instanceof Date ? document.data().date : new Date(document.data().date),
                dueDate: document.data().dueDate ? (document.data().dueDate instanceof Date ? document.data().dueDate : new Date(document.data().dueDate)) : null,
            }));

            setTransactions(data);
        } catch (err) {
            console.error('Error fetching lending transactions:', err);
            setError(err.message);
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

            const dataToSave = {
                ...transactionData,
                createdAt: serverTimestamp(),
                userId: userId,
            };

            const docRef = await addDoc(
                collection(db, 'users', userId, 'borrowLend'),
                dataToSave
            );

            const newDoc = {
                id: docRef.id,
                ...dataToSave,
                createdAt: new Date(),
            };

            setTransactions([newDoc, ...transactions]);
            return newDoc;
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
            setTransactions(transactions.filter(t => t.id !== String(transactionId)));
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

    const getTotalGiven = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.GAVE)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getTotalTaken = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.TOOK)
            .reduce((sum, t) => sum + (t.amount || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getNetBalance = () => {
        const given = getTotalGiven();
        const taken = getTotalTaken();
        const balance = given - taken;
        return Math.round(balance * 100) / 100;
    };

    const getFilteredTransactions = (filterType) => {
        if (filterType === 'all') return transactions;
        return transactions.filter(t => t.type === filterType);
    };

    return {
        transactions,
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
