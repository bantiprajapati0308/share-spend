import { useEffect, useMemo, useState } from 'react';
import { getTransactions } from '../../../../hooks/useDailySpends';
import useCategoryContext from '../../hooks/useCategoryContext';
import { buildDisabledCategoryLookup, filterTransactionsByDisabledCategories } from '../../utils/transactionVisibility';
import { formatLocalDate, getTransactionDateKey } from '../../utils/dateUtils';

const buildRangeGroups = (transactions, rangeStartDate, rangeEndDate) => {
    let startDate = rangeStartDate;
    let endDate = rangeEndDate;

    if (!startDate || !endDate) {
        if (transactions.length === 0) return [];

        const dates = transactions
            .filter(tx => tx.date || tx.createdAt)
            .map(tx => new Date(tx.date || tx.createdAt));

        startDate = new Date(Math.min(...dates));
        endDate = new Date(Math.max(...dates));
    }

    startDate = new Date(startDate);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(endDate);
    endDate.setHours(23, 59, 59, 999);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const daysPerGroup = Math.ceil(totalDays / 10);
    const ranges = [];
    let currentStart = new Date(startDate);

    while (currentStart < endDate && ranges.length < 10) {
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + daysPerGroup - 1);
        currentEnd.setHours(23, 59, 59, 999);

        const actualEnd = currentEnd > endDate ? endDate : currentEnd;
        const startDay = currentStart.getDate();
        const endDay = actualEnd.getDate();
        const month = currentStart.toLocaleString('default', { month: 'short' });

        ranges.push({
            label: startDay === endDay ? `${startDay} ${month}` : `${startDay}-${endDay} ${month}`,
            start: new Date(currentStart),
            end: new Date(actualEnd),
        });

        currentStart.setDate(currentStart.getDate() + daysPerGroup);
    }

    return ranges;
};

export function useReportData(startDate = null, endDate = null, preloadedTransactions = null) {
    const { categories } = useCategoryContext();
    const disabledLookup = useMemo(() => buildDisabledCategoryLookup(categories), [categories]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const applyData = (allData) => {
            let filteredData = allData;

            if (startDate && endDate) {
                const startDateStr = formatLocalDate(startDate);
                const endDateStr = formatLocalDate(endDate);
                filteredData = allData.filter(tx => {
                    const txDateStr = getTransactionDateKey(tx);
                    return txDateStr >= startDateStr && txDateStr <= endDateStr;
                });
            }

            setTransactions(filterTransactionsByDisabledCategories(filteredData, disabledLookup));
            setError(null);
        };

        if (preloadedTransactions !== null) {
            applyData(preloadedTransactions);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const startStr = formatLocalDate(startDate) || startDate;
                const endStr = formatLocalDate(endDate) || endDate;
                const allData = await getTransactions({ startDate: startStr, endDate: endStr });
                applyData(allData);
            } catch (err) {
                console.error('Error loading report data:', err);
                setError(err.message || 'Failed to load report data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [startDate, endDate, preloadedTransactions, disabledLookup]);

    const getWeeklyBreakdownData = (transactionType = 'spend') => {
        const ranges = buildRangeGroups(transactions, startDate, endDate);
        const labels = [];
        const categoriesWithData = new Set();
        let data = [];

        ranges.forEach(range => {
            const categoryAmounts = {};

            transactions
                .filter(tx => {
                    if (tx.type !== transactionType) return false;
                    const txDate = new Date(tx.date || tx.createdAt);
                    return txDate >= range.start && txDate <= range.end;
                })
                .forEach(tx => {
                    const amount = parseFloat(tx.amount) || 0;
                    if (amount <= 0) return;

                    const category = tx.category || 'Other';
                    categoryAmounts[category] = (categoryAmounts[category] || 0) + amount;
                    categoriesWithData.add(category);
                });

            Object.entries(categoryAmounts).forEach(([category, amount]) => {
                data.push({
                    date: range.label,
                    category,
                    amount,
                    sortKey: range.start.getTime(),
                });
            });

            if (!labels.includes(range.label)) labels.push(range.label);
        });

        data = data
            .sort((first, second) => first.sortKey - second.sortKey)
            .map(({ sortKey, ...item }) => item);

        return { data, labels, categories: Array.from(categoriesWithData) };
    };

    return {
        transactions,
        loading,
        error,
        getWeeklyBreakdownData,
    };
}
