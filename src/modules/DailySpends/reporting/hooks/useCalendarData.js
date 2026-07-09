import { useMemo, useCallback } from 'react';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Returns a YYYY-MM-DD string for a Date without timezone conversion.
 */
function toDateStr(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Returns the color intensity level (0–5) from an amount.
 * Uses secondMax as the normalization ceiling so one spike day
 * doesn't flatten every other day into level 1.
 * The absolute peak always gets level 5.
 */
function computeColorLevel(amount, maxAmount, secondMax) {
    if (!amount || amount <= 0 || maxAmount <= 0) return 0;
    // The absolute highest day is always peak
    if (amount >= maxAmount * 0.95) return 5;
    // Use 2nd highest as reference so remaining days spread across 1-4
    const ref = (secondMax > 0 && secondMax < maxAmount) ? secondMax : maxAmount;
    const ratio = amount / ref;
    if (ratio <= 0.2) return 1;
    if (ratio <= 0.45) return 2;
    if (ratio <= 0.70) return 3;
    return 4;
}

/**
 * useCalendarData
 *
 * Core business logic for the calendar heatmap.
 *
 * @param {Array}  transactions    - All transactions for the active report range
 * @param {string} transactionType - 'spend' | 'income'
 * @param {Date}   startDate       - Range start (optional; defaults to 30 days ago)
 * @param {Date}   endDate         - Range end   (optional; defaults to today)
 */
export function useCalendarData(transactions, transactionType, startDate, endDate) {
    // ── 1. Resolve effective date range ──────────────────────────────────────
    const effectiveStart = useMemo(() => {
        if (startDate) return new Date(startDate);
        const d = new Date();
        d.setDate(d.getDate() - 29);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [startDate]);

    const effectiveEnd = useMemo(() => {
        if (endDate) return new Date(endDate);
        const d = new Date();
        d.setHours(23, 59, 59, 999);
        return d;
    }, [endDate]);

    const effectiveStartStr = useMemo(() => toDateStr(effectiveStart), [effectiveStart]);
    const effectiveEndStr = useMemo(() => toDateStr(effectiveEnd), [effectiveEnd]);

    // ── 2. Build daily aggregation map ───────────────────────────────────────
    const dailyMap = useMemo(() => {
        const map = {};
        transactions
            .filter(tx => tx.type === transactionType)
            .forEach(tx => {
                const raw = tx.date || tx.createdAt;
                if (!raw) return;
                const dateStr = typeof raw === 'string' ? raw.split('T')[0] : toDateStr(raw);
                if (!map[dateStr]) {
                    map[dateStr] = { total: 0, transactions: [] };
                }
                const amt = parseFloat(tx.amount) || 0;
                if (amt > 0) {
                    map[dateStr].total += amt;
                    map[dateStr].transactions.push(tx);
                }
            });
        return map;
    }, [transactions, transactionType]);

    // ── 3. Find maximum AND second-highest amount in the selected range ─────
    const { maxAmount, secondMax } = useMemo(() => {
        const totals = Object.entries(dailyMap)
            .filter(([dateStr]) => dateStr >= effectiveStartStr && dateStr <= effectiveEndStr)
            .map(([, data]) => data.total)
            .sort((a, b) => b - a); // descending
        return {
            maxAmount: totals[0] ?? 0,
            secondMax: totals[1] ?? 0,
        };
    }, [dailyMap, effectiveStartStr, effectiveEndStr]);

    // ── 4. Generate calendar grid weeks ──────────────────────────────────────
    // Snap start back to nearest Sunday, end forward to nearest Saturday.
    const calendarWeeks = useMemo(() => {
        const gridStart = new Date(effectiveStart);
        gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // rewind to Sunday
        gridStart.setHours(0, 0, 0, 0);

        const gridEnd = new Date(effectiveEnd);
        gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay())); // advance to Saturday

        const weeks = [];
        const cursor = new Date(gridStart);

        while (cursor <= gridEnd) {
            const week = [];
            for (let d = 0; d < 7; d++) {
                week.push(new Date(cursor));
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(week);
        }
        return weeks;
    }, [effectiveStart, effectiveEnd]);

    // ── 5. Per-day helpers ────────────────────────────────────────────────────
    const getDayData = useCallback(
        (dateStr) => dailyMap[dateStr] || { total: 0, transactions: [] },
        [dailyMap]
    );

    const getColorLevel = useCallback(
        (dateStr) => {
            const data = dailyMap[dateStr];
            if (!data || data.total <= 0) return 0;
            return computeColorLevel(data.total, maxAmount, secondMax);
        },
        [dailyMap, maxAmount, secondMax]
    );

    const isInRange = useCallback(
        (dateStr) => dateStr >= effectiveStartStr && dateStr <= effectiveEndStr,
        [effectiveStartStr, effectiveEndStr]
    );

    const isToday = useCallback((dateStr) => toDateStr(new Date()) === dateStr, []);

    return {
        calendarWeeks,
        dailyMap,
        maxAmount,
        secondMax,
        effectiveStartStr,
        effectiveEndStr,
        getDayData,
        getColorLevel,
        isInRange,
        isToday,
        DAY_NAMES,
    };
}
