import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useCalendarData } from '../hooks/useCalendarData';
import TimeSummaryDetailModal from './TimeSummaryDetailModal';
import { formatCurrencyINR, formatCurrencyCompact } from '../../../../Util';
import styles from '../styles/CalendarHeatmap.module.scss';

const LEVEL_LABELS = ['None', 'Low', 'Low-Med', 'Mid', 'High', 'Peak'];
const SWATCH_CLASSES = [
    styles.level0,
    styles.level1,
    styles.level2,
    styles.level3,
    styles.level4,
    styles.level5,
];

function toDateStr(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const formatRangeAmount = (amount) => formatCurrencyINR(Math.max(0, Math.round(amount)));

const buildLegendRanges = (maxAmount, secondMax) => {
    if (!maxAmount || maxAmount <= 0) {
        return ['0', 'No data yet', 'No data yet', 'No data yet', 'No data yet', 'No data yet'];
    }

    const referenceAmount = secondMax > 0 && secondMax < maxAmount ? secondMax : maxAmount;
    const lowMax = Math.max(1, Math.floor(referenceAmount * 0.2));
    const lowMedMax = Math.max(lowMax + 1, Math.floor(referenceAmount * 0.45));
    const midMax = Math.max(lowMedMax + 1, Math.floor(referenceAmount * 0.7));
    const peakMin = Math.max(midMax + 1, Math.ceil(maxAmount * 0.95));
    const highMax = Math.max(midMax + 1, peakMin - 1);

    return [
        '0',
        `${formatRangeAmount(1)} - ${formatRangeAmount(lowMax)}`,
        `${formatRangeAmount(lowMax + 1)} - ${formatRangeAmount(lowMedMax)}`,
        `${formatRangeAmount(lowMedMax + 1)} - ${formatRangeAmount(midMax)}`,
        `${formatRangeAmount(midMax + 1)} - ${formatRangeAmount(highMax)}`,
        `${formatRangeAmount(peakMin)}+`,
    ];
};

/**
 * CalendarHeatmap
 *
 * Renders a calendar grid where each day is colour-coded by total spend / income.
 * Clicking a day with transactions opens a TimeSummaryDetailModal.
 *
 * @param {Array}  transactions    - Full transaction list (from useMasterReportData)
 * @param {string} transactionType - 'spend' | 'income'
 * @param {Date}   startDate       - Range start (optional)
 * @param {Date}   endDate         - Range end   (optional)
 */
function CalendarHeatmap({ transactions, transactionType, startDate, endDate }) {
    const [modalState, setModalState] = useState({ show: false, title: '', txs: [] });

    const {
        calendarWeeks,
        maxAmount,
        secondMax,
        getDayData,
        getColorLevel,
        isInRange,
        isToday,
        DAY_NAMES,
    } = useCalendarData(transactions, transactionType, startDate, endDate);

    // Find the date string of the peak day (level 5 / max amount)
    const peakDateStr = React.useMemo(() => {
        let maxAmt = 0;
        let peakStr = null;
        calendarWeeks.flat().forEach(date => {
            const ds = toDateStr(date);
            const data = getDayData(ds);
            if (isInRange(ds) && data.total > maxAmt) {
                maxAmt = data.total;
                peakStr = ds;
            }
        });
        return peakStr;
    }, [calendarWeeks, getDayData, isInRange]);

    const legendRanges = React.useMemo(
        () => buildLegendRanges(maxAmount, secondMax),
        [maxAmount, secondMax]
    );

    const handleDayClick = (dateStr, dayData) => {
        if (!dayData || dayData.transactions.length === 0) return;
        const date = new Date(dateStr + 'T00:00:00');
        const formatted = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        setModalState({
            show: true,
            title: `${transactionType === 'income' ? 'Income' : 'Spends'} – ${formatted}`,
            txs: dayData.transactions,
        });
    };

    const activeDaysCount = calendarWeeks.flat().filter(d => {
        const ds = toDateStr(d);
        return isInRange(ds) && getDayData(ds).total > 0;
    }).length;

    const totalInRange = calendarWeeks.flat().reduce((sum, d) => {
        const ds = toDateStr(d);
        return isInRange(ds) ? sum + getDayData(ds).total : sum;
    }, 0);

    return (
        <div className={styles.calendarWrapper}>
            {/* Legend */}
            <div className={styles.legend}>
                <span className={styles.legendLabel}>
                    {transactionType === 'income' ? 'Income' : 'Spend'}:
                </span>
                {LEVEL_LABELS.map((label, i) => (
                    <OverlayTrigger
                        key={label}
                        placement="top"
                        trigger={['hover', 'focus', 'click']}
                        overlay={(
                            <Tooltip id={`calendar-legend-${transactionType}-${i}`}>
                                {label}: {legendRanges[i]}
                            </Tooltip>
                        )}
                    >
                        <button
                            type="button"
                            className={styles.legendItem}
                            aria-label={`${label} range ${legendRanges[i]}`}
                        >
                            <span className={`${styles.legendSwatch} ${SWATCH_CLASSES[i]}`} />
                            <span className={styles.legendText}>{label}</span>
                        </button>
                    </OverlayTrigger>
                ))}
            </div>

            {/* Day-name header row */}
            <div className={styles.calendarGrid}>
                {DAY_NAMES.map((name, i) => (
                    <div
                        key={name}
                        className={`${styles.dayHeader} ${(i === 0 || i === 6) ? styles.weekend : ''}`}
                    >
                        {name}
                    </div>
                ))}

                {/* Week rows */}
                {calendarWeeks.map((week, wi) =>
                    week.map((date, di) => {
                        const dateStr = toDateStr(date);
                        const inRange = isInRange(dateStr);
                        const level = inRange ? getColorLevel(dateStr) : 0;
                        const dayData = getDayData(dateStr);
                        const today = isToday(dateStr);
                        const isPeak = dateStr === peakDateStr;

                        const cellClass = [
                            styles.dayCell,
                            styles[`level${level}`],
                            !inRange ? styles.outOfRange : '',
                            (inRange && dayData.transactions.length > 0) ? styles.hasData : '',
                            today ? styles.today : '',
                        ].filter(Boolean).join(' ');

                        return (
                            <div
                                key={`${wi}-${di}`}
                                className={cellClass}
                                onClick={() => inRange && handleDayClick(dateStr, dayData)}
                                title={
                                    inRange && dayData.total > 0
                                        ? `${dateStr}: ${formatCurrencyINR(dayData.total)} (${dayData.transactions.length} tx)`
                                        : dateStr
                                }
                                role={inRange && dayData.transactions.length > 0 ? 'button' : undefined}
                                tabIndex={inRange && dayData.transactions.length > 0 ? 0 : undefined}
                                onKeyDown={e => {
                                    if ((e.key === 'Enter' || e.key === ' ') && inRange) {
                                        handleDayClick(dateStr, dayData);
                                    }
                                }}
                            >
                                {isPeak && inRange && maxAmount > 0 && (
                                    <span className={styles.peakBadge}>▲</span>
                                )}
                                <span className={styles.dateNum}>{date.getDate()}</span>
                                {inRange && dayData.total > 0 && (
                                    <span className={styles.amountBadge}>
                                        {formatCurrencyCompact(dayData.total)}
                                    </span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Summary bar */}
            <div className={styles.summaryBar}>
                <div className={styles.summaryItem}>
                    <span>Active days</span>
                    <strong>{activeDaysCount}</strong>
                </div>
                <div className={styles.summaryItem}>
                    <span>Total</span>
                    <strong>{formatCurrencyINR(totalInRange)}</strong>
                </div>
                {maxAmount > 0 && (
                    <div className={styles.summaryItem}>
                        <span>Peak day</span>
                        <strong>{formatCurrencyINR(maxAmount)}</strong>
                    </div>
                )}
                {activeDaysCount > 0 && (
                    <div className={styles.summaryItem}>
                        <span>Daily avg</span>
                        <strong>{formatCurrencyINR(totalInRange / activeDaysCount)}</strong>
                    </div>
                )}
            </div>

            {/* Day-detail modal – reuses TimeSummaryDetailModal */}
            <TimeSummaryDetailModal
                show={modalState.show}
                onHide={() => setModalState(s => ({ ...s, show: false }))}
                title={modalState.title}
                dateHide={true}
                transactions={modalState.txs}
                isIncome={transactionType === 'income'}
            />
        </div>
    );
}

CalendarHeatmap.propTypes = {
    transactions: PropTypes.array.isRequired,
    transactionType: PropTypes.oneOf(['spend', 'income']),
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
};

CalendarHeatmap.defaultProps = {
    transactionType: 'spend',
};

export default CalendarHeatmap;
