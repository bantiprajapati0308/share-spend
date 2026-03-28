import { useState, useEffect } from 'react';

export const useLendingTransactions = () => {
    const [transactions, setTransactions] = useState([]);

    // Load transactions from localStorage
    useEffect(() => {
        const savedTransactions = localStorage.getItem('lendingTransactions');
        if (savedTransactions) {
            try {
                setTransactions(JSON.parse(savedTransactions));
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        }
    }, []);

    // Save transactions to localStorage
    useEffect(() => {
        localStorage.setItem('lendingTransactions', JSON.stringify(transactions));
    }, [transactions]);

    const addTransaction = (newTransaction) => {
        setTransactions([newTransaction, ...transactions]);
    };

    const deleteTransaction = (id) => {
        setTransactions(transactions.filter(t => t.id !== id));
    };

    const getTotalLent = () => {
        return transactions
            .filter(t => t.type === 'lent')
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    };

    const getTotalBorrowed = () => {
        return transactions
            .filter(t => t.type === 'borrowed')
            .reduce((sum, t) => sum + t.amount, 0)
            .toFixed(2);
    };

    const getNetBalance = () => {
        const lent = parseFloat(getTotalLent());
        const borrowed = parseFloat(getTotalBorrowed());
        return (lent - borrowed).toFixed(2);
    };

    const getFilteredTransactions = (filterType) => {
        if (filterType === 'all') return transactions;
        return transactions.filter(t => t.type === filterType);
    };

    return {
        transactions,
        addTransaction,
        deleteTransaction,
        getTotalLent,
        getTotalBorrowed,
        getNetBalance,
        getFilteredTransactions,
    };
};
