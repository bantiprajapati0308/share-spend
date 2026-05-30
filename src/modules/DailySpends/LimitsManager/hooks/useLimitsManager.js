import { useState, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit } from '../../../../hooks/useCategoryLimits';
import { toast } from 'react-toastify';

const toDateStr = (d) => (d instanceof Date ? d.toISOString().split('T')[0] : d ?? '');

/**
 * Custom hook to manage category limits.
 *
 * Transactions are read from the Redux store (written there by useDailyExpenses)
 * so no duplicate API call is made — categoryTotals is a pure useMemo derivation.
 *
 * @param {Date|null} startDate
 * @param {Date|null} endDate
 * @param {string}    transactionType - 'spend' | 'income'
 */
export const useLimitsManager = (startDate, endDate, transactionType = 'spend') => {
    // Read the already-loaded transactions from Redux — zero API cost
    const allTransactions = useSelector(state => state.dailySpends.transactions);

    const [limits, setLimits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const initialized = useRef(false);

    /**
     * Derive category totals from Redux transactions.
     * Re-runs automatically whenever transactions, dates, or type change —
     * no manual refresh needed.
     */
    const categoryTotals = useMemo(() => {
        if (!startDate || !endDate) return {};
        const startStr = toDateStr(startDate);
        const endStr = toDateStr(endDate);
        const totals = {};
        allTransactions.forEach(tx => {
            if (tx.type !== transactionType) return;
            const txDate = tx.date
                ?? (tx.createdAt ? new Date(tx.createdAt).toISOString().split('T')[0] : null);
            if (!txDate || txDate < startStr || txDate > endStr) return;
            const cat = tx.category || 'Other';
            totals[cat] = (totals[cat] || 0) + (parseFloat(tx.amount) || 0);
        });
        return totals;
    }, [allTransactions, startDate, endDate, transactionType]);

    /** Load category limits once. Subsequent calls are no-ops. */
    const loadLimits = useCallback(async () => {
        if (initialized.current) return;
        try {
            setLoading(true);
            setError(null);
            const data = await getCategoryLimits();
            setLimits(data);
            initialized.current = true;
        } catch (err) {
            console.error('Error loading limits:', err);
            setError(err.message);
            toast.error('Failed to load limits');
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        limits,
        categoryTotals,   // derived — no API call
        loading,
        error,
        loadLimits,       // only loads category limits, never transactions
        addLimit: useCallback(async (limitData) => {
            try {
                setError(null);
                const newLimit = await addCategoryLimit(limitData);
                setLimits(prev => [newLimit, ...prev]);
                toast.success(`${limitData.type === 'income' ? 'Income' : 'Spending'} limit added successfully`);
                return newLimit;
            } catch (err) {
                const msg = err.message || 'Failed to add limit';
                setError(msg);
                toast.error(msg);
                throw err;
            }
        }, []),
        updateLimit: useCallback(async (limitId, limitData) => {
            try {
                setError(null);
                const updated = await updateCategoryLimit(limitId, limitData);
                setLimits(prev =>
                    prev.map(l => l.id === limitId ? { ...updated, id: limitId } : l)
                );
                toast.success('Limit updated successfully');
                return updated;
            } catch (err) {
                const msg = err.message || 'Failed to update limit';
                setError(msg);
                toast.error(msg);
                throw err;
            }
        }, []),
        deleteLimit: useCallback(async (limitId) => {
            try {
                setError(null);
                await deleteCategoryLimit(limitId);
                setLimits(prev => prev.filter(l => l.id !== limitId));
                toast.success('Limit deleted successfully');
            } catch (err) {
                const msg = err.message || 'Failed to delete limit';
                setError(msg);
                toast.error(msg);
                throw err;
            }
        }, []),
    };
};

export default useLimitsManager;
