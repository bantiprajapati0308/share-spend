import { useState, useEffect } from 'react';
import { getTransactions } from '../../../../hooks/useDailySpends';

/**
 * Custom hook for Master Report data management
 * Handles data fetching, processing, and calculations
 * @param {Date} startDate - Start date for filtering (optional)
 * @param {Date} endDate - End date for filtering (optional)
 */
export function useMasterReportData(startDate = null, endDate = null) {
    const [transactions, setTransactions] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState({});
    const [monthlyBreakdown, setMonthlyBreakdown] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const allData = await getTransactions();

                // Filter data by date range if provided
                let filteredData = allData;
                if (startDate && endDate) {
                    const startDateStr = startDate.toISOString().split('T')[0];
                    const endDateStr = endDate.toISOString().split('T')[0];

                    filteredData = allData.filter(tx => {
                        const txDateStr = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
                        return txDateStr >= startDateStr && txDateStr <= endDateStr;
                    });
                }

                const data = filteredData;
                setTransactions(data);

                // Process category breakdown
                const categoryBreak = {};
                const monthlyBreak = {};

                data.forEach(tx => {
                    if (tx.type === 'spend') {
                        const category = tx.category || 'Other';
                        if (!categoryBreak[category]) {
                            categoryBreak[category] = { amount: 0, count: 0, transactions: [] };
                        }
                        categoryBreak[category].amount += parseFloat(tx.amount) || 0;
                        categoryBreak[category].count += 1;
                        categoryBreak[category].transactions.push(tx);

                        // Monthly breakdown
                        const date = new Date(tx.date || tx.createdAt);
                        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        if (!monthlyBreak[monthKey]) {
                            monthlyBreak[monthKey] = { amount: 0, count: 0 };
                        }
                        monthlyBreak[monthKey].amount += parseFloat(tx.amount) || 0;
                        monthlyBreak[monthKey].count += 1;
                    }
                });

                setCategoryBreakdown(categoryBreak);
                setMonthlyBreakdown(monthlyBreak);
                setError(null);
            } catch (err) {
                console.error('Error loading master report data:', err);
                setError(err.message || 'Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate]);

    // Helper calculations
    const getTotalSpent = () => {
        return transactions
            .filter(tx => tx.type === 'spend')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getTotalIncome = () => {
        return transactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
    };

    const getAverageTransaction = () => {
        const spends = transactions.filter(tx => tx.type === 'spend');
        return spends.length > 0 ? getTotalSpent() / spends.length : 0;
    };

    const getTopCategory = () => {
        let top = { category: 'N/A', amount: 0 };
        Object.entries(categoryBreakdown).forEach(([cat, data]) => {
            if (data.amount > top.amount) {
                top = { category: cat, amount: data.amount };
            }
        });
        return top;
    };

    const getSpendTransactionCount = () => {
        return transactions.filter(tx => tx.type === 'spend').length;
    };

    const getIncomeTransactionCount = () => {
        return transactions.filter(tx => tx.type === 'income').length;
    };

    // Time-based calculations
    const getTodayData = () => {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const todayTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date || tx.createdAt);
            return txDate.toISOString().split('T')[0] === todayString;
        });

        const spent = todayTransactions
            .filter(tx => tx.type === 'spend')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        const income = todayTransactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        const spendCount = todayTransactions.filter(tx => tx.type === 'spend').length;
        const incomeCount = todayTransactions.filter(tx => tx.type === 'income').length;

        return { spent, income, spendCount, incomeCount, transactions: todayTransactions };
    };

    const getThisWeekData = () => {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Last 7 days (including today)
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weekTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date || tx.createdAt);
            return txDate >= sevenDaysAgo && txDate <= today;
        });

        const spent = weekTransactions
            .filter(tx => tx.type === 'spend')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        const income = weekTransactions
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

        const spendCount = weekTransactions.filter(tx => tx.type === 'spend').length;
        const incomeCount = weekTransactions.filter(tx => tx.type === 'income').length;

        return { spent, income, spendCount, incomeCount, transactions: weekTransactions };
    };

    // Get transactions for a specific category
    const getCategoryTransactions = (categoryName) => {
        return categoryBreakdown[categoryName]?.transactions || [];
    };

    // Get breakdown data by dynamic date ranges for stacked bar chart
    // Creates max 10 bars based on the date range provided or all transactions
    // Includes all categories that have amount > 0 for the given transaction type
    const getWeeklyBreakdownData = (rangeStartDate = null, rangeEndDate = null, transactionType = 'spend') => {
        let breakdownData = [];
        let orderedLabels = [];
        let categoriesWithData = new Set();

        // Determine the date range to use
        let startDate = rangeStartDate;
        let endDate = rangeEndDate;

        // If no range provided, use all transactions' date range
        if (!startDate || !endDate) {
            if (transactions.length === 0) return [];

            const dates = transactions
                .filter(tx => tx.date || tx.createdAt)
                .map(tx => new Date(tx.date || tx.createdAt));

            startDate = new Date(Math.min(...dates));
            endDate = new Date(Math.max(...dates));
        }

        // Ensure dates are at the beginning of the day
        startDate = new Date(startDate);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(endDate);
        endDate.setHours(23, 59, 59, 999);

        // Calculate total days in range
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        // Calculate days per group (max 10 groups)
        const daysPerGroup = Math.ceil(totalDays / 10);

        // Create date ranges for each group
        const dateRanges = [];
        let currentStart = new Date(startDate);
        let groupIndex = 0;

        while (currentStart < endDate && groupIndex < 10) {
            const currentEnd = new Date(currentStart);
            currentEnd.setDate(currentEnd.getDate() + daysPerGroup - 1);
            currentEnd.setHours(23, 59, 59, 999);

            // Cap the end date to the range end date
            const actualEnd = currentEnd > endDate ? endDate : currentEnd;

            const startDay = currentStart.getDate();
            const endDay = actualEnd.getDate();
            const month = currentStart.toLocaleString('default', { month: 'short' });

            const label = startDay === endDay
                ? `${startDay} ${month}`
                : `${startDay}-${endDay} ${month}`;

            dateRanges.push({
                label,
                start: new Date(currentStart),
                end: new Date(actualEnd)
            });

            // Move to next group
            currentStart.setDate(currentStart.getDate() + daysPerGroup);
            groupIndex++;
        }

        // First pass: Calculate total amounts for each category across all date ranges
        // We'll collect all categories with data > 0 in any range

        // Second pass: Process each date range with top 6 + Other grouping
        dateRanges.forEach(range => {
            // Get transactions within this date range
            const rangeTransactions = transactions.filter(tx => {
                if (tx.type !== transactionType) return false;
                const txDate = new Date(tx.date || tx.createdAt);
                return txDate >= range.start && txDate <= range.end;
            });

            // Group by category for this date range (no 'Other', all categories with data)
            const categoryAmounts = {};

            rangeTransactions.forEach(tx => {
                const category = tx.category || 'Other';
                const amount = parseFloat(tx.amount) || 0;
                if (amount > 0) {
                    categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
                    categoriesWithData.add(category);
                }
            });

            // Create data entries for each category that has transactions in this range
            Object.entries(categoryAmounts).forEach(([category, amount]) => {
                breakdownData.push({
                    date: range.label,
                    category,
                    amount,
                    _sortKey: range.start.getTime() // Attach numeric sort key
                });
            });
            // Collect label in order if not already present
            if (!orderedLabels.includes(range.label)) {
                orderedLabels.push(range.label);
            }
        });

        // Sort breakdownData by the numeric start date
        breakdownData = breakdownData.sort((a, b) => a._sortKey - b._sortKey);
        // Remove the _sortKey before returning
        breakdownData = breakdownData.map(({ _sortKey, ...rest }) => rest);
        // Only include categories that have at least some data in any range
        return { data: breakdownData, labels: orderedLabels, categories: Array.from(categoriesWithData) };
    };

    // Get top 6 categories plus "Other" if applicable
    const getUniqueCategories = () => {
        // Calculate total amounts for each category
        const categoryTotals = {};

        transactions
            .filter(tx => tx.type === 'spend')
            .forEach(tx => {
                const category = tx.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(tx.amount) || 0);
            });

        // Sort categories by total amount (highest first) and get top 6
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([category]) => category);

        const top6Categories = sortedCategories.slice(0, 6);
        const hasOtherCategories = sortedCategories.length > 6;

        // Return top 6 categories + "Other" if there are more categories
        return hasOtherCategories ? [...top6Categories, 'Other'] : top6Categories;
    };

    // Get total number of original categories (for display purposes)
    const getTotalCategoriesCount = () => {
        const categories = new Set();
        transactions
            .filter(tx => tx.type === 'spend')
            .forEach(tx => {
                categories.add(tx.category || 'Other');
            });
        return categories.size;
    };

    // Get categories that are grouped into "Other"
    const getOtherCategoriesList = () => {
        // Calculate total amounts for each category
        const categoryTotals = {};

        transactions
            .filter(tx => tx.type === 'spend')
            .forEach(tx => {
                const category = tx.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(tx.amount) || 0);
            });

        // Sort categories by total amount (highest first)
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([category]) => category);

        // Return categories beyond top 6
        return sortedCategories.slice(6);
    };

    return {
        transactions,
        categoryBreakdown,
        monthlyBreakdown,
        loading,
        error,
        calculations: {
            totalSpent: getTotalSpent(),
            totalIncome: getTotalIncome(),
            averageTransaction: getAverageTransaction(),
            topCategory: getTopCategory(),
            spendTransactionCount: getSpendTransactionCount(),
            incomeTransactionCount: getIncomeTransactionCount(),
            today: getTodayData(),
            thisWeek: getThisWeekData()
        },
        getCategoryTransactions,
        getWeeklyBreakdownData: (transactionType = 'spend') => getWeeklyBreakdownData(startDate, endDate, transactionType), // Returns { data, labels, categories } for correct x-axis order
        getUniqueCategories, // Returns top 6 categories + "Other" if applicable
        getTotalCategoriesCount, // Returns total number of original categories
        getOtherCategoriesList // Returns list of categories grouped into "Other"
    };
}