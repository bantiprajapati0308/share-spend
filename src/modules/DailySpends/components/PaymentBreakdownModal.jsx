import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { formatCurrencyINR } from '../../../Util';
import { formatPercentage } from '../../../utils/helper';
import { usePaymentBreakdown } from '../hooks/usePaymentBreakdown';
import styles from '../styles/PaymentBreakdownModal.module.scss';

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
                        <i className={isIncome ? 'bi bi-wallet-fill' : 'bi bi-graph-up-arrow'} />
                    </div>
                    <div className={styles.headerText}>
                        <h2 className={styles.headerTitle}>
                            {isIncome ? 'Income Breakdown' : 'Expense Breakdown'}
                        </h2>
                        <p className={styles.headerDate}>{formatDateRange()}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
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
                        <i className={isIncome ? 'bi bi-cash-stack' : 'bi bi-bag-fill'} />
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
                                    <i className={`bi ${row.icon}`} />
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
                                <i className="bi bi-chevron-right" style={{ color: '#ccc', fontSize: '0.8rem', marginLeft: '0.5rem' }} />
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
                    <i className="bi bi-clock-history" style={{ marginRight: '0.5rem' }} />
                    View {isIncome ? 'Income' : 'Expense'} Transactions
                    <i className="bi bi-chevron-right" style={{ marginLeft: '0.5rem' }} />
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
