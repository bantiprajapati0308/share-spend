import { useState, useCallback, useRef } from 'react';
import { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit } from '../../../../hooks/useCategoryLimits';
import { getCategoryTotals } from '../../../../hooks/useCategoryBreakdown';
import { toast } from 'react-toastify';

/**
 * Custom hook to manage category limits
 * Handles separate spend and income limit operations
 * NO useEffect - lazy initialization pattern
 */
export const useLimitsManager = (startDate, endDate) => {
    const [limits, setLimits] = useState([]);
    const [categoryTotals, setCategoryTotals] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Track initialization to prevent duplicate API calls
    const initialized = useRef(false);
    const prevDatesRef = useRef(null);

    /**
     * Load all limits from database (called once on first use)
     */
    const loadLimits = useCallback(async () => {
        if (initialized.current) return; // Already loaded

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

    /**
     * Load category totals for date range
     * Only loads if dates actually changed
     */
    const loadCategoryTotals = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            // Check if dates actually changed (not just object reference change)
            const currentDates = `${startDate.toISOString()}-${endDate.toISOString()}`;
            if (prevDatesRef.current === currentDates) {
                return; // Dates haven't changed, skip API call
            }
            prevDatesRef.current = currentDates;

            const totals = await getCategoryTotals(startDate, endDate);
            setCategoryTotals(totals);
        } catch (err) {
            console.error('Error loading category totals:', err);
            toast.error('Failed to load category totals');
        }
    }, [startDate, endDate]);

    /**
     * Get limits filtered by type
     */
    const getLimitsByType = useCallback(
        (type) => {
            return limits.filter(limit => (limit.type || 'spend') === type);
        },
        [limits]
    );

    /**
     * Initialize data on demand (call from component manually)
     * Only loads once per component lifetime
     */
    const initialize = useCallback(async () => {
        // Load limits (only loads if not already initialized)
        await loadLimits();
        // Load category totals (respects date changes, prevents duplicate calls)
        await loadCategoryTotals();
    }, [loadLimits, loadCategoryTotals]);

    return {
        limits,
        categoryTotals,
        loading,
        error,
        getCategorySpent: useCallback(
            (category) => categoryTotals[category] || 0,
            [categoryTotals]
        ),
        getLimitsByType,
        addLimit: useCallback(
            async (limitData) => {
                try {
                    setError(null);
                    const newLimit = await addCategoryLimit(limitData);
                    setLimits(prev => [newLimit, ...prev]);
                    toast.success(`${limitData.type === 'income' ? 'Income' : 'Spending'} limit added successfully`);
                    return newLimit;
                } catch (err) {
                    console.error('Error adding limit:', err);
                    const errorMsg = err.message || 'Failed to add limit';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    throw err;
                }
            },
            []
        ),
        updateLimit: useCallback(
            async (limitId, limitData) => {
                try {
                    setError(null);
                    const updatedLimit = await updateCategoryLimit(limitId, limitData);
                    setLimits(prev =>
                        prev.map(limit =>
                            limit.id === limitId ? { ...updatedLimit, id: limitId } : limit
                        )
                    );
                    toast.success('Limit updated successfully');
                    return updatedLimit;
                } catch (err) {
                    console.error('Error updating limit:', err);
                    const errorMsg = err.message || 'Failed to update limit';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    throw err;
                }
            },
            []
        ),
        deleteLimit: useCallback(
            async (limitId) => {
                try {
                    setError(null);
                    await deleteCategoryLimit(limitId);
                    setLimits(prev => prev.filter(limit => limit.id !== limitId));
                    toast.success('Limit deleted successfully');
                } catch (err) {
                    console.error('Error deleting limit:', err);
                    const errorMsg = err.message || 'Failed to delete limit';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    throw err;
                }
            },
            []
        ),
        loadLimits,
        loadCategoryTotals,
        initialize, // Add this to component render
    };
};

export default useLimitsManager;
