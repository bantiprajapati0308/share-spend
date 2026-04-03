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

    transactions.forEach(record => {
        const name = record.personName || 'Unknown';
        const recType = record.type || TRANSACTION_TYPES.GAVE;

        if (!grouped[name]) {
            grouped[name] = {
                personName: name,
                type: recType,
                data: [],
                firstDate: null,
                dueDate: null
            };
        }

        // Convert old / new structure to unified data entries
        let entries = [];

        if (Array.isArray(record.data)) {
            entries = record.data.map(entry => ({
                amount: Number(entry.amount || 0),
                insert_date: entry.insert_date || entry.date || '',
                due_date: entry.due_date || entry.dueDate || null,
                payment_type: entry.payment_type || (recType === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed'),
                description: entry.description || ''
            }));
        } else if (record.amount != null) {
            entries = [{
                amount: Number(record.amount || 0),
                insert_date: record.date || record.insert_date || '',
                due_date: record.due_date || record.dueDate || null,
                payment_type: recType === TRANSACTION_TYPES.GAVE ? 'Lent' : recType === TRANSACTION_TYPES.TOOK ? 'Borrowed' : 'Unknown',
                description: record.description || ''
            }];
        }

        grouped[name].data = grouped[name].data.concat(entries);

        // Determine firstDate and dueDate based on earliest entries
        grouped[name].data.forEach(entry => {
            const entryDate = entry.insert_date ? new Date(entry.insert_date) : null;
            if (entryDate && (!grouped[name].firstDate || entryDate < grouped[name].firstDate)) {
                grouped[name].firstDate = entryDate;
            }
            const entryDue = entry.due_date ? new Date(entry.due_date) : null;
            if (entryDue && (!grouped[name].dueDate || entryDue < grouped[name].dueDate)) {
                grouped[name].dueDate = entryDue;
            }
        });
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
export const getStatusColor = (typeOrStatus) => {
    if (typeOrStatus === TRANSACTION_TYPES.GAVE) {
        return { background: '#e8f5e9', color: '#2e7d32' };
    } else if (typeOrStatus === TRANSACTION_TYPES.TOOK) {
        return { background: '#ffebee', color: '#c62828' };
    } else if (typeOrStatus === 'Paid') {
        return { background: '#e8f5e9', color: '#1b5e20' };
    } else if (typeOrStatus === 'Partially Paid') {
        return { background: '#fff8e1', color: '#ff6f00' };
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

    return grouped.map(item => {
        const entries = Array.isArray(item.data) ? item.data : [];

        let totalLent = 0;
        let totalBorrowed = 0;
        let totalRepayment = 0;

        entries.forEach(entry => {
            const paymentType = (entry.payment_type || '').toLowerCase();
            const value = Number(entry.amount || 0);

            if (paymentType === 'lent') {
                totalLent += value;
            } else if (paymentType === 'borrowed') {
                totalBorrowed += value;
            } else if (paymentType === 'repayment' || paymentType === 'borrowed pay') {
                totalRepayment += value;
            }
        });

        const baseTotal = item.type === TRANSACTION_TYPES.GAVE ? totalLent : totalBorrowed;
        const remaining = Math.max(baseTotal - totalRepayment, 0);

        let derivedStatus = 'Pending';
        if (remaining <= 0 && baseTotal > 0) {
            derivedStatus = 'Paid';
        } else if (remaining > 0 && totalRepayment > 0) {
            derivedStatus = 'Partially Paid';
        }

        return {
            ...item,
            totalDays: calculateTotalDays(item.firstDate),
            displayAmount: remaining.toFixed(2),
            displayFirstDate: formatTransactionDate(item.firstDate),
            displayDueDate: formatTransactionDate(item.dueDate),
            status: derivedStatus,
            statusStyle: getStatusColor(derivedStatus),
            totalLent,
            totalBorrowed,
            totalRepayment,
            remaining
        };
    });
};
