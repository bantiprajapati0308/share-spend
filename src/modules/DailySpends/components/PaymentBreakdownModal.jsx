import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { formatCurrencyINR } from '../../../Util';
import { formatPercentage } from '../../../utils/helper';
import { usePaymentBreakdown } from '../hooks/usePaymentBreakdown';
import styles from '../styles/PaymentBreakdownModal.module.scss';
import { GraphUpArrow, WalletFill, XLg, ChevronRight, ClockHistory, CashStack, CreditCard2Front } from 'react-bootstrap-icons';

const PM_ICONS = {
    cash: <CashStack size={20} />,
    upi: (
        <svg width="22" height="18" viewBox="0 0 30 24" fill="none">
            <polygon points="8,0 16,16 0,16" fill="#FF6B00" />
            <polygon points="22,24 14,8 30,8" fill="#00A651" />
        </svg>
    ),
    credit_card: <CreditCard2Front size={20} />,
};

function PaymentBreakdownModal({ type, startDate, endDate, onClose, onViewTransactions }) {
    const { rows, total } = usePaymentBreakdown(type);
    const isIncome = type === 'income';

    // Close on Escape key
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const formatDateRange = () => {
        if (!startDate || !endDate) return '';
        const fmt = (d) =>
            new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${fmt(startDate)} - ${fmt(endDate)}`;
    };

    return (
        <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                {/* Handle bar */}
                <div className={styles.handle} />

                {/* Header */}
                <div className={styles.header}>
                    <div className={`${styles.headerIcon} ${isIncome ? styles.incomeIcon : styles.expenseIcon}`}>
                        {isIncome ? <WalletFill color='white' /> : <GraphUpArrow color='white' />}
                    </div>
                    <div className={styles.headerText}>
                        <h2 className={styles.headerTitle}>
                            {isIncome ? 'Income Breakdown' : 'Expense Breakdown'}
                        </h2>
                        <p className={styles.headerDate}>{formatDateRange()}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <XLg />
                    </button>
                </div>

                {/* Total Banner */}
                <div className={`${styles.totalBanner} ${isIncome ? styles.incomeBanner : styles.expenseBanner}`}>
                    <div>
                        <p className={styles.totalLabel}>
                            {isIncome ? 'Total Income' : 'Total Expense'}
                        </p>
                        <p className={`${styles.totalAmount} ${isIncome ? styles.incomeAmount : styles.expenseAmount}`}>
                            {formatCurrencyINR(total, { decimals: 0 })}
                        </p>
                    </div>
                    <div className={styles.bannerIllustration}>
                        {isIncome ? <WalletFill size={24} color="#4caf50" /> : <GraphUpArrow size={24} color="#e91e63" />}

                    </div>
                </div>

                {/* Rows */}
                <div className={styles.rowList}>
                    {rows.length === 0 ? (
                        <p className={styles.emptyText}>No transactions in this period.</p>
                    ) : (
                        rows.map(row => (
                            <div key={row.paymentMethodId} className={styles.row}>
                                <div
                                    className={styles.rowIcon}
                                    style={{ background: `${row.color}1a`, color: row.color }}
                                >
                                    {PM_ICONS[row.paymentMethodId] ?? <CreditCard2Front size={20} />}
                                </div>
                                <div className={styles.rowBody}>
                                    <div className={styles.rowTop}>
                                        <span className={styles.rowLabel}>{row.label}</span>
                                        <span className={styles.rowAmount}>
                                            {formatCurrencyINR(row.amount, { decimals: 0 })}
                                        </span>
                                    </div>
                                    <p className={styles.rowSubtext}>
                                        {formatPercentage(row.percentage)}% of total {isIncome ? 'income' : 'expense'}
                                    </p>
                                    <div className={styles.rowBar}>
                                        <div
                                            className={styles.rowBarFill}
                                            style={{
                                                width: `${Math.min(row.percentage, 100)}%`,
                                                background: row.color,
                                            }}
                                        />
                                    </div>
                                </div>
                                <ChevronRight style={{ color: '#ccc', fontSize: '0.8rem', marginLeft: '0.5rem' }} />
                            </div>
                        ))
                    )}
                </div>

                {/* Footer summary */}
                {rows.length > 0 && (
                    <div className={styles.footer}>
                        <div className={styles.footerRow}>
                            <span className={styles.footerLeft}>100% Total</span>
                            <span className={`${styles.footerRight} ${isIncome ? styles.incomeAmount : styles.expenseAmount}`}>
                                {formatCurrencyINR(total, { decimals: 0 })}
                            </span>
                        </div>
                        <p className={styles.footerSub}>
                            {isIncome ? 'Total Income' : 'Total Expense'}
                        </p>
                    </div>
                )}

                {/* CTA */}
                <button
                    className={`${styles.viewBtn} ${isIncome ? styles.viewBtnIncome : styles.viewBtnExpense}`}
                    onClick={onViewTransactions}
                >
                    <ClockHistory style={{ marginRight: '0.5rem' }} />
                    View {isIncome ? 'Income' : 'Expense'} Transactions
                    <ChevronRight style={{ marginLeft: '0.5rem' }} />
                </button>
            </div>
        </div>
    );
}

PaymentBreakdownModal.propTypes = {
    type: PropTypes.oneOf(['income', 'spend']).isRequired,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    onClose: PropTypes.func.isRequired,
    onViewTransactions: PropTypes.func,
};

export default PaymentBreakdownModal;
