import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GraphUpArrow, ArrowUp, ArrowDown, Dash } from 'react-bootstrap-icons';
import { formatCurrencyINR } from '../../../Util';
import { useTimeSummary } from '../hooks/useTimeSummary';
import TimeSummaryDetailModal from '../MasterReport/components/TimeSummaryDetailModal';
import styles from '../styles/TimeSummarySection.module.scss';

// ── Today's date mini-badge ─────────────────────────────────────────────────
const TODAY = new Date();
const TODAY_DAY = TODAY.getDate();
const TODAY_MONTH = TODAY.toLocaleString('default', { month: 'short' });

// ── Single period card (Today / Last 7 Days) ─────────────────────────────────
function SummaryCard({ label, subLabel, amount, pct, isIncome, txs, onOpen, isToday }) {
    let PctIcon = Dash;
    let pctClass = styles.pctNeutral;
    let pctLabel = '';

    if (pct > 0) {
        PctIcon = ArrowUp;
        // spend up = bad (red), income up = good (green)
        pctClass = isIncome ? styles.pctGood : styles.pctBad;
        pctLabel = `↑${Math.abs(pct)}%`;
    } else if (pct < 0) {
        PctIcon = ArrowDown;
        // spend down = good (green), income down = bad (red)
        pctClass = isIncome ? styles.pctBad : styles.pctGood;
        pctLabel = `↓${Math.abs(pct)}%`;
    } else {
        pctLabel = '0%';
    }

    const amountClass = isIncome ? styles.amountIncome : styles.amountSpend;
    const iconClass = isIncome ? styles.iconIncome : styles.iconSpend;

    return (
        <div className={styles.card} onClick={() => onOpen(txs, label, isIncome)}>
            <div className={`${styles.iconCircle} ${iconClass}`}>
                {isIncome ? '💰' : isToday ? (
                    <span className={styles.dateCircle}>
                        <span className={styles.dateDay}>{TODAY_DAY}</span>
                        <span className={styles.dateMonth}>{TODAY_MONTH}</span>
                    </span>
                ) : '📅'}
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardLabel}>{label}</div>
                <div className={`${styles.cardAmount} ${amountClass}`}>
                    {formatCurrencyINR(amount)}
                </div>
                <div className={styles.cardComparison}>
                    <span className={styles.vsLabel}>{subLabel}</span>
                    <span className={`${styles.pct} ${pctClass}`}>
                        <PctIcon size={9} />
                        {Math.abs(pct)}%
                    </span>
                </div>
            </div>
        </div>
    );
}

SummaryCard.propTypes = {
    label: PropTypes.string.isRequired,
    subLabel: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    pct: PropTypes.number.isRequired,
    isIncome: PropTypes.bool.isRequired,
    txs: PropTypes.array.isRequired,
    onOpen: PropTypes.func.isRequired,
    isToday: PropTypes.bool,
};

SummaryCard.defaultProps = {
    isToday: false,
};

// ── Main exported component ──────────────────────────────────────────────────
function TimeSummarySection({ transactions, selectedType }) {
    const isIncome = selectedType === 'income';

    const {
        todayData, thisWeekData,
        todaySpendPct, todayIncomePct,
        weekSpendPct, weekIncomePct,
    } = useTimeSummary(transactions);

    const [modal, setModal] = useState({ show: false, title: '', txs: [], isIncome: false });

    const openModal = (txs, title, inc) => setModal({ show: true, txs, title, isIncome: inc });
    const closeModal = () => setModal(m => ({ ...m, show: false }));

    const sectionTitle = isIncome ? 'Income Overview' : 'Spending Overview';

    const todayAmount = isIncome ? todayData.income : todayData.spent;
    const todayTxs = isIncome ? todayData.incomeTxs : todayData.spendTxs;
    const todayPct = isIncome ? todayIncomePct : todaySpendPct;

    const weekAmount = isIncome ? thisWeekData.income : thisWeekData.spent;
    const weekTxs = isIncome ? thisWeekData.incomeTxs : thisWeekData.spendTxs;
    const weekPct = isIncome ? weekIncomePct : weekSpendPct;

    const typeLabel = isIncome ? 'Income' : 'Spend';

    return (
        <div className={styles.wrapper}>
            <div className={styles.sectionTitle}>
                <GraphUpArrow size={13} className={styles.sectionIcon} />
                {sectionTitle}
            </div>
            <div className={styles.cards}>
                <SummaryCard
                    label={`Today ${typeLabel}`}
                    subLabel="vs yesterday"
                    amount={todayAmount}
                    pct={todayPct}
                    isIncome={isIncome}
                    txs={todayTxs}
                    onOpen={openModal}
                    isToday
                />
                <SummaryCard
                    label={`Last 7 Days ${typeLabel}`}
                    subLabel="vs prev 7 days"
                    amount={weekAmount}
                    pct={weekPct}
                    isIncome={isIncome}
                    txs={weekTxs}
                    onOpen={openModal}
                />
            </div>

            <TimeSummaryDetailModal
                show={modal.show}
                onHide={closeModal}
                title={modal.title}
                transactions={modal.txs}
                isIncome={modal.isIncome}
                dateHide={false}
            />
        </div>
    );
}

TimeSummarySection.propTypes = {
    transactions: PropTypes.array.isRequired,
    selectedType: PropTypes.oneOf(['spend', 'income']),
};

TimeSummarySection.defaultProps = {
    selectedType: 'spend',
};

export default TimeSummarySection;
