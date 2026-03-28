import { useState, useEffect } from 'react';
import {
    getTransactions,
    getTransactionsByType,
    addTransaction,
    deleteTransaction,
    getTransactionSummary
} from '../../../hooks/useDailySpends';

export const useDailyExpenses = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all transactions from Firebase on mount
    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getTransactions();
                setTransactions(data);
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const addTransactionHandler = async (newTransaction) => {
        try {
            const result = await addTransaction(newTransaction);
            // Add to local state immediately
            setTransactions([result, ...transactions]);
            return result;
        } catch (err) {
            console.error('Error adding transaction:', err);
            throw err;
        }
    };

    const deleteTransactionHandler = async (id) => {
        try {
            await deleteTransaction(id);
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            throw err;
        }
    };

    const getTotalSpend = () => {
        return transactions
            .filter(t => t.type === 'spend')
            .reduce((sum, t) => sum + (t.amount || 0), 0)
            .toFixed(2);
    };

    const getTotalIncome = () => {
        return transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0)
            .toFixed(2);
    };

    const getSpendPercentage = () => {
        const spend = parseFloat(getTotalSpend());
        const income = parseFloat(getTotalIncome());
        if (income === 0) return 0;
        return Math.round((spend / income) * 100);
    };

    const getTransactionsByTypeLocal = (type) => {
        return transactions.filter(t => t.type === type);
    };

    const getExpensesByCategory = () => {
        const categories = {};
        transactions
            .filter(t => t.type === 'spend')
            .forEach(transaction => {
                categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
            });
        return categories;
    };

    const refreshTransactions = async () => {
        try {
            setLoading(true);
            const data = await getTransactions();
            setTransactions(data);
        } catch (err) {
            console.error('Error refreshing transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        transactions,
        addTransaction: addTransactionHandler,
        deleteTransaction: deleteTransactionHandler,
        getTotalSpend,
        getTotalIncome,
        getSpendPercentage,
        getTransactionsByType: getTransactionsByTypeLocal,
        getExpensesByCategory,
        refreshTransactions,
        loading,
        error,
    };
};
