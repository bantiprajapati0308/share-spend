import { useState, useEffect } from 'react';
import { getTransactions } from '../../../../hooks/useDailySpends';

/**
 * Custom hook for Master Report data management
 * Handles data fetching, processing, and calculations
 */
export function useMasterReportData() {
    const [transactions, setTransactions] = useState([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState({});
    const [monthlyBreakdown, setMonthlyBreakdown] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getTransactions();
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
    }, []);

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

    // Get monthly breakdown data by weeks for stacked bar chart
    // Shows top 6 categories by amount and groups rest as "Other"
    const getWeeklyBreakdownData = () => {
        const weeklyData = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Get the first and last day of the current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Define week ranges for the current month
        const weeks = [
            { label: 'Week 1', start: 1, end: 7 },
            { label: 'Week 2', start: 8, end: 14 },
            { label: 'Week 3', start: 15, end: 21 },
            { label: 'Week 4', start: 22, end: lastDayOfMonth.getDate() }
        ];

        // First pass: Calculate total amounts for each category to determine top categories
        const categoryTotals = {};

        weeks.forEach(week => {
            const weekStart = new Date(currentYear, currentMonth, week.start);
            const weekEnd = new Date(currentYear, currentMonth, Math.min(week.end, lastDayOfMonth.getDate()));

            // Skip future weeks
            if (weekStart > today) return;

            // Get transactions for this week
            const weekTransactions = transactions.filter(tx => {
                if (tx.type !== 'spend') return false;

                const txDate = new Date(tx.date || tx.createdAt);
                const txDay = txDate.getDate();
                const txMonth = txDate.getMonth();
                const txYear = txDate.getFullYear();

                return txYear === currentYear &&
                    txMonth === currentMonth &&
                    txDay >= week.start &&
                    txDay <= Math.min(week.end, lastDayOfMonth.getDate());
            });

            // Accumulate totals for each category
            weekTransactions.forEach(tx => {
                const category = tx.category || 'Other';
                categoryTotals[category] = (categoryTotals[category] || 0) + (parseFloat(tx.amount) || 0);
            });
        });

        // Sort categories by total amount (highest first) and get top 6
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .map(([category]) => category);

        const top6Categories = sortedCategories.slice(0, 6);
        const otherCategories = sortedCategories.slice(6);

        // Second pass: Process each week with top 6 + Other grouping
        weeks.forEach(week => {
            const weekStart = new Date(currentYear, currentMonth, week.start);
            const weekEnd = new Date(currentYear, currentMonth, Math.min(week.end, lastDayOfMonth.getDate()));

            // Skip future weeks
            if (weekStart > today) return;

            // Adjust end date if it's in the future
            if (weekEnd > today) {
                weekEnd.setTime(today.getTime());
            }

            // Get transactions for this week
            const weekTransactions = transactions.filter(tx => {
                if (tx.type !== 'spend') return false;

                const txDate = new Date(tx.date || tx.createdAt);
                const txDay = txDate.getDate();
                const txMonth = txDate.getMonth();
                const txYear = txDate.getFullYear();

                return txYear === currentYear &&
                    txMonth === currentMonth &&
                    txDay >= week.start &&
                    txDay <= Math.min(week.end, lastDayOfMonth.getDate());
            });

            // Group by category for this week (top 6 + Other)
            const categoryAmounts = {};
            let otherAmount = 0;

            weekTransactions.forEach(tx => {
                const category = tx.category || 'Other';
                const amount = parseFloat(tx.amount) || 0;

                if (top6Categories.includes(category)) {
                    categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
                } else {
                    otherAmount += amount;
                }
            });

            // Add "Other" category if there are other transactions
            if (otherAmount > 0 && otherCategories.length > 0) {
                categoryAmounts['Other'] = otherAmount;
            }

            // Create data entries for each category that has transactions in this week
            Object.entries(categoryAmounts).forEach(([category, amount]) => {
                weeklyData.push({
                    date: week.label, // Use week label for display
                    category,
                    amount
                });
            });
        });

        return weeklyData;
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
        getWeeklyBreakdownData, // Returns monthly data broken down by weeks (top 6 + Other)
        getUniqueCategories, // Returns top 6 categories + "Other" if applicable
        getTotalCategoriesCount, // Returns total number of original categories
        getOtherCategoriesList // Returns list of categories grouped into "Other"
    };
}