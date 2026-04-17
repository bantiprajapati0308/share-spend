/**
 * BorrowLend Table Renderers
 * Clean, professional renderers for displaying grouped lending/borrowing data
 * Minimal design with subtle indicators and professional styling
 */

import { formatCurrencyINR, getCurrencySymbol } from '../../../Util';
import styles from '../styles/BorrowLendTable.module.scss';

/**
 * Get due date status with clean styling
 * @param {string} dueDate - Due date string
 * @returns {Object} Status info with styling
 */
const getDueDateStatus = (dueDate) => {
    if (!dueDate || dueDate === '-') {
        return { status: 'normal', class: 'normal' };
    }

    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'overdue', class: 'overdue', daysOverdue: Math.abs(diffDays) };
    } else if (diffDays <= 7) {
        return { status: 'upcoming', class: 'upcoming', daysLeft: diffDays };
    } else {
        return { status: 'normal', class: 'normal' };
    }
};

/**
 * Format duration with clean styling
 * @param {number} totalDays - Total days
 * @returns {JSX.Element} Formatted duration element
 */
const formatDuration = (totalDays) => {
    const days = Math.floor(totalDays);
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;

    if (months > 0) {
        return (
            <div className={styles.daysCount}>
                <span className={styles.daysNumber}>{months}</span>
                <span className={styles.daysLabel}>mo</span>
                {remainingDays > 0 && (
                    <>
                        <span className={styles.daysNumber}>{remainingDays}</span>
                        <span className={styles.daysLabel}>d</span>
                    </>
                )}
            </div>
        );
    } else {
        return (
            <div className={styles.daysCount}>
                <span className={styles.daysNumber}>{days}</span>
                <span className={styles.daysLabel}>{days === 1 ? 'day' : 'days'}</span>
            </div>
        );
    }
};

/**
 * Get clean status text
 * @param {string} status - Status string
 * @returns {string} Clean status text
 */
const getStatusText = (status) => {
    switch (status.toLowerCase()) {
        case 'paid':
            return 'Paid';
        case 'partially paid':
            return 'Partial';
        case 'pending':
        default:
            return 'Pending';
    }
};

/**
 * Create clean renderer for aggregated lending/borrowing transactions
 * @param {string} currency - Currency symbol
 * @param {Function} onRowClick - Callback when clicking on row with multiple transactions
 * @returns {Function} Row render function
 */
export const createEnhancedBorrowLendRenderer = (currency, onRowClick = null) => {
    const RowRenderer = (item, index) => {
        const {
            personName,
            displayAmount,
            displayFirstDate,
            displayDueDate,
            totalDays,
            status,
            data
        } = item;

        // Calculate transaction count
        const transactionCount = data ? data.length : 1;
        const isMultipleTransactions = data.length > 1;

        // Get due date status
        const dueDateStatus = getDueDateStatus(displayDueDate);

        const handleRowClick = () => {
            if (isMultipleTransactions && onRowClick) {
                onRowClick(data, personName, status);
            }
        };

        return (
            <tr
                key={index}
                onClick={handleRowClick}
                style={{
                    cursor: isMultipleTransactions ? 'pointer' : 'default'
                }}
                title={isMultipleTransactions ? `Click to view ${transactionCount} transactions` : undefined}
            >
                {/* Clean Person Cell */}
                <td className={styles.personCell}>
                    <div className={styles.personName}>
                        <span>{personName}</span>
                        {isMultipleTransactions && (
                            <div className={styles.transactionBadge} title={`${transactionCount} transactions`}>
                                {transactionCount}
                            </div>
                        )}
                    </div>
                </td>

                {/* Clean Amount Cell */}
                <td className={styles.amountCell}>
                    {formatCurrencyINR(displayAmount)}
                </td>

                {/* Clean Date Cell */}
                <td className={styles.dateCell}>
                    {displayFirstDate}
                </td>

                {/* Clean Due Date Cell */}
                <td className={`${styles.dueDateCell} ${styles[dueDateStatus.class]}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{displayDueDate}</span>
                        {dueDateStatus.status === 'overdue' && dueDateStatus.daysOverdue && (
                            <small style={{ color: '#dc3545', fontWeight: '500' }}>
                                ({dueDateStatus.daysOverdue}d ago)
                            </small>
                        )}
                        {dueDateStatus.status === 'upcoming' && dueDateStatus.daysLeft <= 3 && (
                            <small style={{ color: '#fd7e14', fontWeight: '500' }}>
                                ({dueDateStatus.daysLeft}d left)
                            </small>
                        )}
                    </div>
                </td>

                {/* Clean Duration Cell */}
                <td className={styles.daysCell}>
                    {formatDuration(totalDays)}
                </td>

                {/* Clean Status Cell */}
                <td className={`${styles.statusCell} ${styles[status.toLowerCase().replace(' ', '')]}`}>
                    <div className={styles.statusBadge}>
                        <span>{getStatusText(status)}</span>
                    </div>
                </td>
            </tr>
        );
    };

    RowRenderer.displayName = 'CleanBorrowLendTableRow';
    return RowRenderer;
};
export const tableIcon = (type) => {
    return (type === 'repayment' || type === 'borrowed pay') ? (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-clock-history" viewBox="0 0 16 16">
        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
    </svg>)
}

// Keep original renderer for backward compatibility
export const createBorrowLendTableRenderer = (currency, onRowClick = null) => {
    return createEnhancedBorrowLendRenderer(currency, onRowClick);
};

/**
 * Export all renderers as a bundle
 */
export const createBorrowLendRenderers = () => ({
    createBorrowLendTableRenderer,
    createEnhancedBorrowLendRenderer
});

export default createBorrowLendRenderers;
