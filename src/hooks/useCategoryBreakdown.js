import { dailySpendsApi } from '../services/api/dailySpendsApi';

const toDateStr = (d) => d instanceof Date ? d.toISOString().split('T')[0] : d;

const fetchFiltered = async (type, startDateStr, endDateStr) => {
    const result = await dailySpendsApi.getTransactions(type);
    if (!result.success) throw new Error(result.error);
    return result.data.filter(exp => {
        const expDate = exp.date || (exp.createdAt ? new Date(exp.createdAt).toISOString().split('T')[0] : null);
        return expDate >= startDateStr && expDate <= endDateStr;
    });
};

/**
 * GET: Fetch expenses grouped by category for a specific date range
 * Returns object: { category: [expenses], ... }
 * Converts Date objects to YYYY-MM-DD strings for proper date filtering
 */
export const getExpensesByCategory = async (startDate, endDate) => {
    try {
        const startDateStr = toDateStr(startDate);
        const endDateStr = toDateStr(endDate);
        const filtered = await fetchFiltered('spend', startDateStr, endDateStr);
        const grouped = {};
        filtered.forEach(expense => {
            const category = expense.category || 'Other';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(expense);
        });
        return grouped;
    } catch (error) {
        console.error('Error fetching expenses by category:', error);
        return {};
    }
};

/**
 * GET: Calculate total spent per category for a date range
 * Returns object: { category: totalAmount, ... }
 * Converts Date objects to YYYY-MM-DD strings for proper date filtering
 * @param {Date|string} startDate - Start date for filtering
 * @param {Date|string} endDate - End date for filtering
 * @param {string} type - Transaction type: 'spend' or 'income' (default: 'spend')
 */
export const getCategoryTotals = async (startDate, endDate, type = 'spend') => {
    try {
        const startDateStr = toDateStr(startDate);
        const endDateStr = toDateStr(endDate);
        const filtered = await fetchFiltered(type, startDateStr, endDateStr);
        const totals = {};
        filtered.forEach(expense => {
            const category = expense.category || 'Other';
            totals[category] = (totals[category] || 0) + (parseFloat(expense.amount) || 0);
        });
        return totals;
    } catch (error) {
        console.error('Error fetching category totals:', error);
        return {};
    }
};

/**
 * GET: Get summary for a specific category
 * Returns: { category, totalSpent, limit, percentage, transactions: [] }
 */
export const getCategorySummary = async (category, startDate, endDate, limit = null) => {
    try {
        const startDateStr = toDateStr(startDate);
        const endDateStr = toDateStr(endDate);
        const filtered = await fetchFiltered('spend', startDateStr, endDateStr);
        const transactions = filtered.filter(t => (t.category || 'Other') === category);
        const totalSpent = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const percentage = limit ? Math.round((totalSpent / limit) * 100) : 0;
        return {
            category,
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            limit: limit ? parseFloat(limit.toFixed(2)) : null,
            percentage: Math.min(percentage, 100),
            transactions,
        };
    } catch (error) {
        console.error('Error fetching category summary:', error);
        return null;
    }
};

/**
 * GET: Get breakdown data with all categories and their limits
 */
export const getBreakdownData = async (startDate, endDate, categoryLimits) => {
    try {
        const categoryTotals = await getCategoryTotals(startDate, endDate);

        const breakdown = {};

        // Process limits first
        categoryLimits.forEach(limit => {
            breakdown[limit.category] = {
                category: limit.category,
                totalSpent: categoryTotals[limit.category] || 0,
                limit: limit.limit,
                percentage: Math.min(
                    Math.round(((categoryTotals[limit.category] || 0) / limit.limit) * 100),
                    100
                ),
            };
        });

        // Add categories without limits
        Object.entries(categoryTotals).forEach(([category, total]) => {
            if (!breakdown[category]) {
                breakdown[category] = {
                    category,
                    totalSpent: total,
                    limit: null,
                    percentage: 0,
                };
            }
        });

        return breakdown;
    } catch (error) {
        console.error("Error fetching breakdown data:", error);
        return {};
    }
};
