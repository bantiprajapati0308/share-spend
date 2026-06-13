import PropTypes from 'prop-types';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    WalletFill, GraphUpArrow, ExclamationTriangleFill,
    CheckCircleFill, PiggyBankFill, InfoCircle, ChevronRight,
    CreditCard2Front,
} from 'react-bootstrap-icons';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/DualSummaryCards.module.scss';
import { formatCurrencyINR } from '../../../Util';
import { formatPercentage } from '../../../utils/helper';
import PaymentBreakdownModal from './PaymentBreakdownModal';
import useCategoryContext from '../hooks/useCategoryContext';
import {
    buildDisabledCategoryLookup,
    filterTransactionsByDisabledCategories,
} from '../utils/transactionVisibility';

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

// ─── Progress bar (3 segments: Red = Personal Funds, Yellow = CC, Green = Savings) ──
function ProgressSection({ cashIncome, cashExpenses, creditCardExpenses }) {
    // Use max(income, totalSpent) as denominator so all three segments always render
    // proportionally — yellow never gets squeezed to 0 when red alone exceeds income.
    const totalSpent = cashExpenses + creditCardExpenses;
    const denominator = Math.max(cashIncome, totalSpent) || 1;
    const redPct = (cashExpenses / denominator) * 100;
    const yellowPct = (creditCardExpenses / denominator) * 100;
    const greenPct = Math.max(0, ((cashIncome - totalSpent) / denominator) * 100);
    const isOverspent = totalSpent > cashIncome;
    const hasCreditCard = creditCardExpenses > 0;

    return (
        <div className={styles.progressSection}>
            {/* Labels row */}
            <div className={styles.progressLabels}>
                <div className={`${styles.progressLabelItem} ${styles.incomeText}`}>
                    <span className={styles.progressLabelName}>Income</span>
                    <span className={styles.progressLabelAmt}>
                        {formatCurrencyINR(cashIncome, { decimals: 0 })}
                    </span>
                </div>
                <div className={`${styles.progressLabelItem} ${styles.progressLabelRight} ${isOverspent ? styles.expenseText : styles.incomeText}`}>
                    <span className={styles.progressLabelName}>Total Spent</span>
                    <span className={styles.progressLabelAmt}>
                        {formatCurrencyINR(cashExpenses + creditCardExpenses, { decimals: 0 })}
                    </span>
                </div>
            </div>

            {/* 3-segment track: Red (personal) | Yellow (CC) | Green (savings) */}
            <div className={styles.progressTrack}>
                {redPct > 0 && (
                    <div
                        className={`${styles.progressFill} ${styles.fillRed}`}
                        style={{ width: `${redPct}%` }}
                    />
                )}
                {yellowPct > 0 && (
                    <div
                        className={`${styles.progressFill} ${styles.fillYellow}`}
                        style={{ width: `${yellowPct}%` }}
                    />
                )}
                {greenPct > 0 && (
                    <div
                        className={`${styles.progressFill} ${styles.fillGreen}`}
                        style={{ width: `${greenPct}%` }}
                    />
                )}
            </div>

            {/* CC legend — only shown when credit card spending exists */}
            {hasCreditCard && (
                <div className={styles.progressLegend}>
                    <span className={`${styles.legendDot} ${styles.legendDotRed}`} />
                    <span className={styles.legendLabel}>(Online Banking + Cash)</span>
                    <span className={`${styles.legendDot} ${styles.legendDotYellow}`} />
                    <span className={styles.legendLabel}>Credit Card</span>
                    {!isOverspent && (
                        <>
                            <span className={`${styles.legendDot} ${styles.legendDotGreen}`} />
                            <span className={styles.legendLabel}>Savings</span>
                        </>
                    )}
                </div>
            )}

            {/* Status label */}
            <p className={`${styles.progressStatus} ${isOverspent ? styles.expenseText : styles.incomeText}`}>
                {isOverspent ? 'Budget Crossed' : "You're Saving"}
            </p>
        </div>
    );
}

ProgressSection.propTypes = {
    cashIncome: PropTypes.number.isRequired,
    cashExpenses: PropTypes.number.isRequired,
    creditCardExpenses: PropTypes.number.isRequired,
};

// ─── Main component ───────────────────────────────────────────────────────────
function DualSummaryCards({ startDate, endDate }) {
    const rawTransactions = useSelector(state => state.dailySpends.transactions);
    const { categories } = useCategoryContext();

    // All financial values are derived directly from the Redux store — no useEffect.
    const {
        cashIncome,
        cashExpenses,
        creditCardExpenses,
        actualSavings,
        totalOverspent,
        isOverspent,
        spendPercentage,
    } = useMemo(() => {
        const disabledLookup = buildDisabledCategoryLookup(categories);
        const txns = filterTransactionsByDisabledCategories(rawTransactions, disabledLookup);

        const ci = txns
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const ce = txns
            .filter(t => t.type === 'spend' && t.paymentMethodId !== 'credit_card')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const ccExp = txns
            .filter(t => t.type === 'spend' && t.paymentMethodId === 'credit_card')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalSpent = ce + ccExp;
        return {
            cashIncome: ci,
            cashExpenses: ce,
            creditCardExpenses: ccExp,
            actualSavings: totalSpent <= ci ? ci - totalSpent : 0,
            totalOverspent: totalSpent > ci ? totalSpent - ci : 0,
            isOverspent: totalSpent > ci,
            spendPercentage: ci > 0 ? (totalSpent / ci) * 100 : 0,
        };
    }, [rawTransactions, categories]);

    const displayAmount = isOverspent ? totalOverspent : actualSavings;
    const diffPct = cashIncome > 0 ? (displayAmount / cashIncome) * 100 : 0;
    const totalExpense = cashExpenses + creditCardExpenses;

    const navigate = useNavigate();
    const [breakdownType, setBreakdownType] = useState(null);

    const handleViewTransactions = (type) => {
        setBreakdownType(null);
        navigate('/daily-expenses', { state: { filterType: type } });
    };

    const subBadgeText = isOverspent
        ? `${formatPercentage(diffPct)}% over budget`
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
                                <OverlayTrigger
                                    placement="top"
                                    overlay={
                                        <Tooltip id="summary-info-tooltip">
                                            {isOverspent
                                                ? `Your total overspending is ${formatCurrencyINR(totalOverspent, { decimals: 0 })}${creditCardExpenses > 0 ? `, including ${formatCurrencyINR(creditCardExpenses, { decimals: 0 })} on credit card` : ''}.`
                                                : `You have ${formatCurrencyINR(actualSavings, { decimals: 0 })} left from your income after all expenses this period. Keep it up!`}
                                        </Tooltip>
                                    }
                                >
                                    <span className={styles.infoIconWrap}>
                                        <InfoCircle size={13} className={styles.infoIcon} />
                                    </span>
                                </OverlayTrigger>
                            </p>
                            {creditCardExpenses > 0 && (
                                <button
                                    type="button"
                                    className={styles.ccInline}
                                    onClick={() => setBreakdownType('spend')}
                                    aria-label="View Credit Card breakdown"
                                >
                                    <CreditCard2Front size={12} color="#2196f3" />
                                    <span>+ {formatCurrencyINR(creditCardExpenses, { decimals: 0 })} credit card</span>
                                </button>
                            )}
                            <span className={`${styles.subBadge} ${isOverspent ? styles.subBadgeOverspent : styles.subBadgeSaving}`}>
                                {subBadgeText}
                            </span>
                        </div>
                        <RingChart percentage={spendPercentage} isOverspent={isOverspent} />
                    </div>

                    {/* ── Mini cards: Income + Expense (2-up row) ── */}
                    <div className={styles.miniCards}>
                        <MiniCard
                            icon={<WalletFill size={18} color="#4caf50" />}
                            label="Income"
                            amount={cashIncome}
                            accentClass={styles.miniIncome}
                            onClick={() => setBreakdownType('income')}
                        />
                        <MiniCard
                            icon={<GraphUpArrow size={18} color="#e91e63" />}
                            label="Expense"
                            amount={totalExpense}
                            accentClass={styles.miniExpense}
                            onClick={() => setBreakdownType('spend')}
                        />
                    </div>

                    {/* ── Progress bar (3-segment) ── */}
                    <ProgressSection
                        cashIncome={cashIncome}
                        cashExpenses={cashExpenses}
                        creditCardExpenses={creditCardExpenses}
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
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
};

export default DualSummaryCards;
