import { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setTransactions, appendTransaction, patchTransaction, removeTransaction as removeTransactionRedux } from '../../../redux/dailySpendsSlice';
import {
    getTransactions,
    addTransaction,
    deleteTransaction,
    updateTransaction,
} from '../../../hooks/useDailySpends';
import { syncDailySpendTransactionToBorrowLend } from '../../BorrowLend/utils/dailySpendSync';
import useCategoryContext from './useCategoryContext';
import {
    buildDisabledCategoryLookup,
    filterTransactionsByDisabledCategories
} from '../utils/transactionVisibility';
import { formatLocalDate } from '../utils/dateUtils';

export const useDailyExpenses = (startDate = null, endDate = null) => {
    const dispatch = useDispatch();
    const [rawTransactions, setRawTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { categories } = useCategoryContext();

    const disabledCategoryLookup = useMemo(
        () => buildDisabledCategoryLookup(categories),
        [categories]
    );

    const transactions = useMemo(
        () => filterTransactionsByDisabledCategories(rawTransactions, disabledCategoryLookup),
        [rawTransactions, disabledCategoryLookup]
    );

    // Fetch transactions scoped to the current date range.
    // Waits for startDate/endDate to be set (loaded from settings) before firing.
    // Re-fetches automatically whenever the date range changes.
    useEffect(() => {
        if (!startDate || !endDate) {
            // Dates not yet loaded from settings — nothing to fetch.
            // Keep loading=true so FullScreenLoader stays visible.
            return;
        }
        setLoading(true);
        const fetchTransactions = async () => {
            try {
                setError(null);
                const startStr = formatLocalDate(startDate) || startDate;
                const endStr = formatLocalDate(endDate) || endDate;
                const data = await getTransactions({ startDate: startStr, endDate: endStr });
                const sortedData = data.sort((a, b) => {
                    const dateA = a.createdAt || new Date(0);
                    const dateB = b.createdAt || new Date(0);
                    return new Date(dateB) - new Date(dateA);
                });
                setRawTransactions(sortedData);
                dispatch(setTransactions(sortedData));
            } catch (err) {
                console.error('Error fetching transactions:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [startDate, endDate]); // eslint-disable-line react-hooks/exhaustive-deps

    const addTransactionHandler = async (newTransaction) => {
        try {
            const { transaction: result, companion } = await addTransaction(newTransaction);

            // Merge primary + optional companion income into local state
            const incoming = companion ? [result, companion] : [result];
            const updatedTransactions = [...incoming, ...rawTransactions].sort((a, b) => {
                const dateA = a.createdAt || new Date(0);
                const dateB = b.createdAt || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            setRawTransactions(updatedTransactions);
            dispatch(appendTransaction(result));
            if (companion) dispatch(appendTransaction(companion));

            await syncDailySpendTransactionToBorrowLend(newTransaction);

            return result;
        } catch (err) {
            console.error('Error adding transaction:', err);
            throw err;
        }
    };

    const deleteTransactionHandler = async (id) => {
        try {
            const { deletedCompanionId } = await deleteTransaction(id);
            const idsToRemove = new Set([id, ...(deletedCompanionId ? [deletedCompanionId] : [])]);
            setRawTransactions(rawTransactions.filter(t => !idsToRemove.has(t.id)));
            dispatch(removeTransactionRedux(id));
            if (deletedCompanionId) dispatch(removeTransactionRedux(deletedCompanionId));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            throw err;
        }
    };

    const updateTransactionHandler = async (id, updatedTransaction) => {
        try {
            const { transaction: result, companion, deletedCompanionId } = await updateTransaction(id, updatedTransaction);

            const patched = { ...rawTransactions.find(t => t.id === id), ...updatedTransaction, id };

            let newRaw = rawTransactions.map(t => t.id === id ? patched : t);
            dispatch(patchTransaction(patched));

            if (companion) {
                const companionExists = newRaw.some(t => t.id === companion.id);
                if (companionExists) {
                    // Patch in-place (amount/date changed while staying on credit card)
                    newRaw = newRaw.map(t => t.id === companion.id ? { ...t, ...companion } : t);
                    dispatch(patchTransaction({ ...companion }));
                } else {
                    // Newly created companion (payment switched to credit card)
                    newRaw = [companion, ...newRaw].sort((a, b) => {
                        const dateA = a.createdAt || new Date(0);
                        const dateB = b.createdAt || new Date(0);
                        return new Date(dateB) - new Date(dateA);
                    });
                    dispatch(appendTransaction(companion));
                }
            }

            if (deletedCompanionId) {
                // Payment switched away from credit card — remove companion
                newRaw = newRaw.filter(t => t.id !== deletedCompanionId);
                dispatch(removeTransactionRedux(deletedCompanionId));
            }

            setRawTransactions(newRaw);
            return result;
        } catch (err) {
            console.error('Error updating transaction:', err);
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
        if (!startDate || !endDate) return;
        try {
            setLoading(true);
            const startStr = formatLocalDate(startDate) || startDate;
            const endStr = formatLocalDate(endDate) || endDate;
            const data = await getTransactions({ startDate: startStr, endDate: endStr });
            const sortedData = data.sort((a, b) => {
                const dateA = a.createdAt || new Date(0);
                const dateB = b.createdAt || new Date(0);
                return new Date(dateB) - new Date(dateA);
            });
            setRawTransactions(sortedData);
            dispatch(setTransactions(sortedData));
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
            console.error('Error getting top categories:', error);
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
        updateTransaction: updateTransactionHandler,
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
