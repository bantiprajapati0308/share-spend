import PropTypes from 'prop-types';
import { useState } from 'react';
import {
    WalletFill, GraphUpArrow, ExclamationTriangleFill,
    CheckCircleFill, PiggyBankFill, InfoCircle, ChevronRight,
} from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/DualSummaryCards.module.scss';
import { formatCurrencyINR } from '../../../Util';
import { formatPercentage } from '../../../utils/helper';
import PaymentBreakdownModal from './PaymentBreakdownModal';

// ─── Ring / Donut chart ───────────────────────────────────────────────────────
const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

function RingChart({ percentage, isOverspent }) {
    const capped = Math.min(percentage, 100);
    const dashOffset = RING_C - (capped / 100) * RING_C;
    const trackColor = isOverspent ? '#fce4ec' : '#e8f5e9';
    const fillColor = isOverspent ? '#e91e63' : '#4caf50';

    return (
        <div className={styles.ringWrap}>
            <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true">
                <circle cx="55" cy="55" r={RING_R} fill="none" stroke={trackColor} strokeWidth="10" />
                <circle
                    cx="55" cy="55" r={RING_R}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth="10"
                    strokeDasharray={RING_C}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 55 55)"
                />
            </svg>
            <div className={styles.ringCenter}>
                <span className={`${styles.ringPct} ${isOverspent ? styles.ringOverspent : styles.ringSaving}`}>
                    {formatPercentage(percentage)}%
                </span>
                <span className={styles.ringOfIncome}>of income</span>
            </div>
        </div>
    );
}

RingChart.propTypes = {
    percentage: PropTypes.number.isRequired,
    isOverspent: PropTypes.bool.isRequired,
};

// ─── Mini summary card (Income / Expense) ────────────────────────────────────
function MiniCard({ icon, label, amount, accentClass, onClick }) {
    return (
        <button
            type="button"
            className={`${styles.miniCard} ${accentClass}`}
            onClick={onClick}
            aria-label={`View ${label} breakdown`}
        >
            <div className={styles.miniCardIcon}>{icon}</div>
            <div className={styles.miniCardBody}>
                <span className={styles.miniCardLabel}>{label}</span>
                <span className={styles.miniCardAmount}>
                    {formatCurrencyINR(amount, { decimals: 0 })}
                </span>
            </div>
            <ChevronRight size={13} className={styles.miniCardChevron} />
        </button>
    );
}

MiniCard.propTypes = {
    icon: PropTypes.node.isRequired,
    label: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    accentClass: PropTypes.string.isRequired,
    onClick: PropTypes.func,
};

// ─── Progress bar with split + tick marker ────────────────────────────────────
function ProgressSection({ totalIncome, totalSpend, isOverspent }) {
    // For overspent: income covers X% of total expense → green | red
    // For saving:    expense is X% of total income    → red   | light-green
    const splitPct = isOverspent
        ? Math.min((totalIncome / totalSpend) * 100, 100)
        : Math.min((totalSpend / totalIncome) * 100, 100);

    const leftLabel = isOverspent ? 'Income' : 'Expense';
    const rightLabel = isOverspent ? 'Expense' : 'Income';
    const leftAmt = isOverspent ? totalIncome : totalSpend;
    const rightAmt = isOverspent ? totalSpend : totalIncome;

    return (
        <div className={styles.progressSection}>
            {/* Labels row */}
            <div className={styles.progressLabels}>
                <div className={`${styles.progressLabelItem} ${isOverspent ? styles.incomeText : styles.expenseText}`}>
                    <span className={styles.progressLabelName}>{leftLabel}</span>
                    <span className={styles.progressLabelAmt}>
                        {formatCurrencyINR(leftAmt, { decimals: 0 })}
                    </span>
                </div>
                <div className={`${styles.progressLabelItem} ${styles.progressLabelRight} ${isOverspent ? styles.expenseText : styles.incomeText}`}>
                    <span className={styles.progressLabelName}>{rightLabel}</span>
                    <span className={styles.progressLabelAmt}>
                        {formatCurrencyINR(rightAmt, { decimals: 0 })}
                    </span>
                </div>
            </div>

            {/* Track */}
            <div className={styles.progressTrack}>
                {/* Left fill */}
                <div
                    className={`${styles.progressFill} ${isOverspent ? styles.fillGreen : styles.fillRed}`}
                    style={{ width: `${splitPct}%` }}
                />
                {/* Right fill */}
                <div
                    className={`${styles.progressFill} ${isOverspent ? styles.fillRed : styles.fillGreenLight}`}
                    style={{ width: `${100 - splitPct}%` }}
                />
                {/* Split tick */}
                <div className={styles.progressTick} style={{ left: `calc(${splitPct}% - 1px)` }}>
                    <div className={styles.progressTickArrow} />
                </div>
            </div>

            {/* Status label */}
            <p className={`${styles.progressStatus} ${isOverspent ? styles.expenseText : styles.incomeText}`}>
                {isOverspent ? 'Budget Crossed' : "You're Saving"}
            </p>
        </div>
    );
}

ProgressSection.propTypes = {
    totalIncome: PropTypes.number.isRequired,
    totalSpend: PropTypes.number.isRequired,
    isOverspent: PropTypes.bool.isRequired,
};

// ─── Main component ───────────────────────────────────────────────────────────
function DualSummaryCards({ totalSpend, totalIncome, spendPercentage, startDate, endDate }) {
    const savedAmount = totalIncome - totalSpend;
    const isOverspent = savedAmount < 0;
    const displayAmount = Math.abs(savedAmount);
    const diffPct = totalIncome > 0 ? Math.abs((savedAmount / totalIncome) * 100) : 0;

    const navigate = useNavigate();
    const [breakdownType, setBreakdownType] = useState(null);

    const handleViewTransactions = (type) => {
        setBreakdownType(null);
        navigate('/daily-expenses', { state: { filterType: type } });
    };

    const subBadgeText = isOverspent
        ? `${formatPercentage(diffPct)}% more than income`
        : `${formatPercentage(diffPct)}% of income`;

    return (
        <>
            <div className={styles.wrapper}>
                <div className={`${styles.card} ${isOverspent ? styles.cardOverspent : styles.cardSaving}`}>

                    {/* ── Top row: status badge + illustration ── */}
                    <div className={styles.topRow}>
                        <div className={`${styles.statusBadge} ${isOverspent ? styles.badgeOverspent : styles.badgeSaving}`}>
                            {isOverspent
                                ? <ExclamationTriangleFill size={13} />
                                : <CheckCircleFill size={13} />}
                            <span>{isOverspent ? "You're Over Budget" : "Great! You're Saving"}</span>
                        </div>
                        <div className={`${styles.illustration} ${isOverspent ? styles.illustrationOverspent : styles.illustrationSaving}`}>
                            {isOverspent ? <GraphUpArrow size={36} /> : <PiggyBankFill size={36} />}
                        </div>
                    </div>

                    {/* ── Middle row: main amount + ring chart ── */}
                    <div className={styles.mainRow}>
                        <div className={styles.mainLeft}>
                            <p className={`${styles.mainAmount} ${isOverspent ? styles.expenseText : styles.incomeText}`}>
                                {formatCurrencyINR(displayAmount, { decimals: 0 })}
                            </p>
                            <p className={styles.mainLabel}>
                                {isOverspent ? 'Overspent' : 'Saved'}
                                <InfoCircle size={13} className={styles.infoIcon} />
                            </p>
                            <span className={`${styles.subBadge} ${isOverspent ? styles.subBadgeOverspent : styles.subBadgeSaving}`}>
                                {subBadgeText}
                            </span>
                        </div>
                        <RingChart percentage={spendPercentage} isOverspent={isOverspent} />
                    </div>

                    {/* ── Mini cards: Income + Expense ── */}
                    <div className={styles.miniCards}>
                        <MiniCard
                            icon={<WalletFill size={18} color="#4caf50" />}
                            label="Income"
                            amount={totalIncome}
                            accentClass={styles.miniIncome}
                            onClick={() => setBreakdownType('income')}
                        />
                        <MiniCard
                            icon={<GraphUpArrow size={18} color="#e91e63" />}
                            label="Expense"
                            amount={totalSpend}
                            accentClass={styles.miniExpense}
                            onClick={() => setBreakdownType('spend')}
                        />
                    </div>

                    {/* ── Progress bar ── */}
                    <ProgressSection
                        totalIncome={totalIncome}
                        totalSpend={totalSpend}
                        isOverspent={isOverspent}
                    />
                </div>
            </div>

            {breakdownType && (
                <PaymentBreakdownModal
                    type={breakdownType}
                    startDate={startDate}
                    endDate={endDate}
                    onClose={() => setBreakdownType(null)}
                    onViewTransactions={() => handleViewTransactions(breakdownType)}
                />
            )}
        </>
    );
}

DualSummaryCards.propTypes = {
    totalSpend: PropTypes.number.isRequired,
    totalIncome: PropTypes.number.isRequired,
    spendPercentage: PropTypes.number,
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
};

export default DualSummaryCards;
