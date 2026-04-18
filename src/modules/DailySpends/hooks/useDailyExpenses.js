import { useState, useEffect, useMemo } from 'react';
import {
    getTransactions,
    getTransactionsByType,
    addTransaction,
    deleteTransaction,
    getTransactionSummary
} from '../../../hooks/useDailySpends';
import {
    addBorrowLendRecord,
    applyBorrowLendRepayment
} from '../../BorrowLend/utils/borrowLendFirestore';
import { TRANSACTION_TYPES } from '../../BorrowLend/constants/transactionTypes';

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
                // Sort by createdAt in descending order (most recent first)
                const sortedData = data.sort((a, b) => {
                    const dateA = a.createdAt || new Date(0);
                    const dateB = b.createdAt || new Date(0);
                    return new Date(dateB) - new Date(dateA);
                });
                setTransactions(sortedData);
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
            // Add to local state and maintain createdAt sorting
            const updatedTransactions = [result, ...transactions].sort((a, b) => {
                const dateA = a.createdAt || new Date(0);
                const dateB = b.createdAt || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            setTransactions(updatedTransactions);

            const normalizedCategory = (newTransaction.category || '').toLowerCase();
            const personName = newTransaction.name || newTransaction.categoryName || 'Unknown';
            const dueDate = newTransaction.dueDate || null;
            const transactionDate = newTransaction.date || new Date().toISOString().split('T')[0];

            if (normalizedCategory === 'lent') {
                await addBorrowLendRecord({
                    personName,
                    amount: newTransaction.amount,
                    type: TRANSACTION_TYPES.GAVE,
                    date: transactionDate,
                    dueDate,
                    description: newTransaction.notes || ''
                });
            } else if (normalizedCategory === 'borrowed') {
                await addBorrowLendRecord({
                    personName,
                    amount: newTransaction.amount,
                    type: TRANSACTION_TYPES.TOOK,
                    date: transactionDate,
                    dueDate,
                    description: newTransaction.notes || ''
                });
            } else if (normalizedCategory === 'repayment') {
                await applyBorrowLendRepayment({
                    personName,
                    repaymentAmount: newTransaction.amount,
                    type: TRANSACTION_TYPES.GAVE,
                    date: transactionDate,
                    description: newTransaction.notes || '',
                    normalizedCategory
                });
            } else if (normalizedCategory === 'borrowed pay') {
                await applyBorrowLendRepayment({
                    personName,
                    repaymentAmount: newTransaction.amount,
                    type: TRANSACTION_TYPES.TOOK,
                    date: transactionDate,
                    description: newTransaction.notes || '',
                    normalizedCategory
                });
            }


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
            // Sort by createdAt in descending order (most recent first)
            const sortedData = data.sort((a, b) => {
                const dateA = a.createdAt || new Date(0);
                const dateB = b.createdAt || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            setTransactions(sortedData);
        } catch (err) {
            console.error('Error refreshing transactions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // GET: Get top 3 categories for both spend and income types (Memoized for performance)
    const getTopCategories = useMemo(() => {
        try {
            const spendCategories = {};
            const incomeCategories = {};

            // Group transactions by type and category, count entries
            transactions.forEach(transaction => {
                const category = transaction.category || 'Other';
                const type = transaction.type;

                if (type === 'spend') {
                    spendCategories[category] = (spendCategories[category] || 0) + 1;
                } else if (type === 'income') {
                    incomeCategories[category] = (incomeCategories[category] || 0) + 1;
                }
            });

            // Sort and get top 5 for spend categories
            const topSpendCategories = Object.entries(spendCategories)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 5)
                .map(([category]) => (category));

            // Sort and get top 5 for income categories
            const topIncomeCategories = Object.entries(incomeCategories)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 5)
                .map(([category]) => (category));

            return {
                spend: topSpendCategories,
                income: topIncomeCategories
            };
        } catch (error) {
            console.error("Error getting top categories:", error);
            return {
                spend: [],
                income: []
            };
        }
    }, [transactions]); // Only recalculate when transactions change

    return {
        transactions,
        addTransaction: addTransactionHandler,
        deleteTransaction: deleteTransactionHandler,
        getTotalSpend,
        getTotalIncome,
        getSpendPercentage,
        getTransactionsByType: getTransactionsByTypeLocal,
        getExpensesByCategory,
        getTopCategories,
        refreshTransactions,
        loading,
        error,
    };
};
