/**
 * BorrowLend Table Renderers
 * Creates render functions for displaying grouped lending/borrowing data
 */

import { getCurrencySymbol } from '../../../Util';

/**
 * Create renderer for aggregated lending/borrowing transactions
 * @param {string} currency - Currency symbol
 * @param {Function} onRowClick - Callback when clicking on row with multiple transactions
 * @returns {Function} Row render function
 */
export const createBorrowLendTableRenderer = (currency, onRowClick = null) => {
    const RowRenderer = (item, index) => {
        const { personName, displayAmount, displayFirstDate, displayDueDate, totalDays, status, statusStyle, transactions } = item;

        // Calculate transaction count
        const transactionCount = transactions ? transactions.length : 1;
        const isMultipleTransactions = transactionCount > 1;

        const handleRowClick = () => {
            if (isMultipleTransactions && onRowClick) {
                onRowClick(item);
            }
        };

        return (
            <tr
                key={index}
                onClick={handleRowClick}
                style={{
                    cursor: isMultipleTransactions ? 'pointer' : 'default',
                    transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    if (isMultipleTransactions) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                }}
                title={isMultipleTransactions ? 'Click to view all transactions' : undefined}
            >
                <td style={{ fontWeight: 500, color: '#1565c0', background: '#e3f2fd', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{personName}</span>
                        {isMultipleTransactions && (
                            <span
                                style={{
                                    display: 'inline-block',
                                    backgroundColor: '#1565c0',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    lineHeight: '24px',
                                    textAlign: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    marginLeft: '8px',
                                    flexShrink: 0
                                }}
                                title={`${transactionCount} transactions grouped`}
                            >
                                {transactionCount}
                            </span>
                        )}
                    </div>
                </td>
                <td style={{ fontWeight: 500, color: '#2e7d32', background: '#e8f5e9' }}>
                    {getCurrencySymbol(currency)}{displayAmount}
                </td>
                <td style={{ color: '#555', background: '#f9f9f9' }}>
                    {displayFirstDate}
                </td>
                <td style={{ color: '#555', background: '#f9f9f9' }}>
                    {displayDueDate}
                </td>
                <td style={{ textAlign: 'center', color: '#666', fontWeight: 500, background: '#fff3e0' }}>
                    {totalDays} day{totalDays !== 1 ? 's' : ''}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 500, ...statusStyle, borderRadius: '4px' }}>
                    {status}
                </td>
            </tr>
        );
    };
    RowRenderer.displayName = 'BorrowLendTableRow';
    return RowRenderer;
};

/**
 * Export all renderers as a bundle
 */
export const createBorrowLendRenderers = () => ({
    createBorrowLendTableRenderer
});

export default createBorrowLendRenderers;
