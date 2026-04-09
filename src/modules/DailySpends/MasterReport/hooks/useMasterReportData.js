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

    // Get transactions for a specific category
    const getCategoryTransactions = (categoryName) => {
        return categoryBreakdown[categoryName]?.transactions || [];
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
            incomeTransactionCount: getIncomeTransactionCount()
        },
        getCategoryTransactions
    };
}