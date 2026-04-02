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
        const { personName, displayAmount, displayFirstDate, displayDueDate, totalDays, status, statusStyle, data } = item;
        console.log(item, "item")
        // Calculate transaction count
        const transactionCount = data ? data.length : 1;
        const isMultipleTransactions = data.length > 1;

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
export const tableIcon = (type) => {
    return type === 'Repayment' ? (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
        <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
        <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
        <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
    </svg>)
}
/**
 * Export all renderers as a bundle
 */
export const createBorrowLendRenderers = () => ({
    createBorrowLendTableRenderer
});

export default createBorrowLendRenderers;
