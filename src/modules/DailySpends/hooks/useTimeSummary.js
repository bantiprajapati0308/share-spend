import { useMemo } from 'react';
import { formatLocalDate } from '../utils/dateUtils';

/**
 * Derives Today and Last-7-Days spend/income summaries — plus
 * percentage-change vs the previous period — from an already-loaded
 * transactions array.  No extra API calls needed.
 *
 * @param {Array} transactions - The date-range-filtered transactions from useDailyExpenses.
 * @returns {{ todayData, thisWeekData, yesterdayData, lastWeekData }}
 */
export function useTimeSummary(transactions = []) {
    return useMemo(() => {
        const todayStr = formatLocalDate(new Date());

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatLocalDate(yesterday);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        lastWeekEnd.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 13);
        lastWeekStart.setHours(0, 0, 0, 0);

        const summarise = (txList) => {
            const spend = txList.filter(t => t.type === 'spend');
            const income = txList.filter(t => t.type === 'income');
            return {
                spent: spend.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
                income: income.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
                spendCount: spend.length,
                incomeCount: income.length,
                spendTxs: spend,
                incomeTxs: income,
            };
        };

        const txDate = (t) => new Date(t.date || t.createdAt);
        const txDateStr = (t) => formatLocalDate(t.date || t.createdAt);

        const todayData = summarise(transactions.filter(t => txDateStr(t) === todayStr));
        const yesterdayData = summarise(transactions.filter(t => txDateStr(t) === yesterdayStr));
        const thisWeekData = summarise(transactions.filter(t => { const d = txDate(t); return d >= weekStart; }));
        const lastWeekData = summarise(transactions.filter(t => { const d = txDate(t); return d >= lastWeekStart && d <= lastWeekEnd; }));

        const pct = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            todayData,
            yesterdayData,
            thisWeekData,
            lastWeekData,
            todaySpendPct: pct(todayData.spent, yesterdayData.spent),
            todayIncomePct: pct(todayData.income, yesterdayData.income),
            weekSpendPct: pct(thisWeekData.spent, lastWeekData.spent),
            weekIncomePct: pct(thisWeekData.income, lastWeekData.income),
        };
    }, [transactions]);
}
