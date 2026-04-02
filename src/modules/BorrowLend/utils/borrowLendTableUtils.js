/**
 * BorrowLend Table Utilities
 * Handles grouping, aggregation, and calculation of lending/borrowing data
 */

import { TRANSACTION_TYPES, TRANSACTION_STATUS } from '../constants/transactionTypes';

/**
 * Group transactions by person name and aggregate amounts
 * @param {Array} transactions - List of transactions from Firebase
 * @returns {Array} Grouped and aggregated transactions
 */
export const groupTransactionsByName = (transactions) => {
    const grouped = {};

    transactions.forEach(transaction => {
        const name = transaction.personName;

        if (!grouped[name]) {
            grouped[name] = {
                personName: name,
                totalAmount: 0,
                firstDate: null,
                dueDate: null,
                type: transaction.type,
                transactions: []
            };
        }

        // Sum amounts
        grouped[name].totalAmount += transaction.amount;

        // Store first date (earliest transaction)
        if (!grouped[name].firstDate) {
            grouped[name].firstDate = new Date(transaction.date);
            grouped[name].dueDate = transaction.dueDate ? new Date(transaction.dueDate) : null;
        } else {
            const currentDate = new Date(transaction.date);
            if (currentDate < grouped[name].firstDate) {
                grouped[name].firstDate = currentDate;
                if (transaction.dueDate) {
                    grouped[name].dueDate = new Date(transaction.dueDate);
                }
            }
        }

        grouped[name].transactions.push(transaction);
    });

    return Object.values(grouped);
};

/**
 * Calculate total days between transaction date and now
 * @param {Date} startDate - Transaction date
 * @param {Date} endDate - End date (optional, defaults to today)
 * @returns {number} Total days
 */
export const calculateTotalDays = (startDate, endDate = null) => {
    if (!startDate) return 0;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    // Reset time to midnight to get exact day count
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatTransactionDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Get status label for transaction
 * @param {string} type - Transaction type (GAVE or TOOK)
 * @returns {string} Status label
 */
export const getTransactionStatus = (type) => {
    return TRANSACTION_STATUS[type] || type;
};

/**
 * Get status color based on type
 * @param {string} type - Transaction type
 * @returns {Object} Style object with color
 */
export const getStatusColor = (type) => {
    if (type === TRANSACTION_TYPES.GAVE) {
        return { background: '#e8f5e9', color: '#2e7d32' };
    } else if (type === TRANSACTION_TYPES.TOOK) {
        return { background: '#ffebee', color: '#c62828' };
    }
    return { background: '#f5f5f5', color: '#666' };
};

/**
 * Prepare aggregated data for table display
 * @param {Array} transactions - List of transactions
 * @returns {Array} Prepared data for table
 */
export const prepareAggregatedTableData = (transactions) => {
    const grouped = groupTransactionsByName(transactions);

    return grouped.map(item => ({
        ...item,
        totalDays: calculateTotalDays(item.firstDate),
        displayAmount: item.totalAmount.toFixed(2),
        displayFirstDate: formatTransactionDate(item.firstDate),
        displayDueDate: formatTransactionDate(item.dueDate),
        status: getTransactionStatus(item.type),
        statusStyle: getStatusColor(item.type)
    }));
};
