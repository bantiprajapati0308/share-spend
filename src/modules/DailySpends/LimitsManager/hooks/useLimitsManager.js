import { useState, useCallback, useEffect } from 'react';
import { getCategoryLimits, addCategoryLimit, updateCategoryLimit, deleteCategoryLimit } from '../../../../hooks/useCategoryLimits';
import { getCategoryTotals } from '../../../../hooks/useCategoryBreakdown';
import { toast } from 'react-toastify';

/**
 * Custom hook to manage category limits
 * Handles separate spend and income limit operations
 */
export const useLimitsManager = (startDate, endDate) => {
    const [limits, setLimits] = useState([]);
    const [categoryTotals, setCategoryTotals] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Load all limits from database
     */
    const loadLimits = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCategoryLimits();
            setLimits(data);
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
     */
    const loadCategoryTotals = useCallback(async () => {
        if (!startDate || !endDate) return;

        try {
            const totals = await getCategoryTotals(startDate, endDate);
            setCategoryTotals(totals);
        } catch (err) {
            console.error('Error loading category totals:', err);
            toast.error('Failed to load category totals');
        }
    }, [startDate, endDate]);

    /**
     * Add new limit to database
     */
    const addLimit = useCallback(
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
    );

    /**
     * Update existing limit
     */
    const updateLimit = useCallback(
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
    );

    /**
     * Delete limit from database
     */
    const deleteLimit = useCallback(
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
    );

    /**
     * Get amount spent for a category
     */
    const getCategorySpent = useCallback(
        (category) => {
            return categoryTotals[category] || 0;
        },
        [categoryTotals]
    );

    /**
     * Get limits filtered by type
     */
    const getLimitsByType = useCallback(
        (type) => {
            return limits.filter(limit => (limit.type || 'spend') === type);
        },
        [limits]
    );

    // Load limits and totals on component mount
    useEffect(() => {
        loadLimits();
        loadCategoryTotals();
    }, [loadLimits, loadCategoryTotals]);

    return {
        limits,
        categoryTotals,
        loading,
        error,
        getCategorySpent,
        getLimitsByType,
        addLimit,
        updateLimit,
        deleteLimit,
        loadLimits,
        loadCategoryTotals,
    };
};

export default useLimitsManager;
