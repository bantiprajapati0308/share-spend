/**
 * Due Date Utility Functions for BorrowLend Module
 * Handles due date calculations, status determination, and filtering
 */

/**
 * Due status constants
 */
export const DUE_STATUS = {
    UPCOMING: 'upcoming',
    OVERDUE: 'overdue',
    ON_TIME: 'on_time',
    NO_DUE_DATE: 'no_due_date'
};

/**
 * Calculate the number of days between two dates
 * @param {string|Date} fromDate - Start date
 * @param {string|Date} toDate - End date  
 * @returns {number} Number of days (positive if toDate is in future, negative if in past)
 */
export const calculateDaysBetween = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Reset time to start of day for accurate day calculation
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);

    const timeDifference = to.getTime() - from.getTime();
    return Math.ceil(timeDifference / (1000 * 3600 * 24));
};

/**
 * Get due status for a transaction based on its due date
 * @param {string|Date|null} dueDate - The due date to check
 * @returns {Object} Status object with type, daysUntilDue, and isUrgent flag
 */
export const getDueStatus = (dueDate) => {
    if (!dueDate) {
        return {
            status: DUE_STATUS.NO_DUE_DATE,
            daysUntilDue: null,
            isUrgent: false,
            displayText: 'No due date'
        };
    }

    const today = new Date();
    const daysUntilDue = calculateDaysBetween(today, dueDate);

    if (daysUntilDue < 0) {
        // Due date has passed
        return {
            status: DUE_STATUS.OVERDUE,
            daysUntilDue: Math.abs(daysUntilDue),
            isUrgent: true,
            displayText: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue`
        };
    } else if (daysUntilDue >= 1 && daysUntilDue <= 7) {
        // Due within next 7 days
        return {
            status: DUE_STATUS.UPCOMING,
            daysUntilDue,
            isUrgent: daysUntilDue <= 2, // Mark as urgent if due in 1-2 days
            displayText: daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
        };
    } else {
        // Due date is more than 7 days away
        return {
            status: DUE_STATUS.ON_TIME,
            daysUntilDue,
            isUrgent: false,
            displayText: `Due in ${daysUntilDue} days`
        };
    }
};

/**
 * Filter transactions by due status with optional outstanding amount validation
 * @param {Array} transactions - Array of transactions
 * @param {string} statusFilter - The status to filter by
 * @param {Function} getOutstandingForPerson - Function to get outstanding amount for a person
 * @returns {Array} Filtered transactions
 */
export const filterTransactionsByDueStatus = (transactions, statusFilter, getOutstandingForPerson = null) => {
    if (!Array.isArray(transactions)) return [];

    return transactions.filter(transaction => {
        const dueStatus = getDueStatus(transaction.dueDate);

        // Check if status matches
        if (dueStatus.status !== statusFilter) {
            return false;
        }

        // If outstanding amount check is provided, validate it
        if (getOutstandingForPerson) {
            const outstandingAmount = getOutstandingForPerson(transaction.personName, transaction.type);
            // Only include if there's an outstanding amount > 0
            return outstandingAmount && outstandingAmount > 0;
        }

        // If no outstanding check, include all (backward compatibility)
        return true;
    }).map(transaction => {
        const dueStatus = getDueStatus(transaction.dueDate);
        return { ...transaction, dueStatus };
    });
};

/**
 * Get transactions that are upcoming (due in 1-7 days)
 * @param {Array} transactions - Array of transactions
 * @param {Function} getOutstandingForPerson - Function to get outstanding amount for a person
 * @returns {Array} Upcoming transactions
 */
export const getUpcomingTransactions = (transactions, getOutstandingForPerson = null) => {
    return filterTransactionsByDueStatus(transactions, DUE_STATUS.UPCOMING, getOutstandingForPerson);
};

/**
 * Get transactions that are overdue (past due date)
 * @param {Array} transactions - Array of transactions  
 * @param {Function} getOutstandingForPerson - Function to get outstanding amount for a person
 * @returns {Array} Overdue transactions
 */
export const getOverdueTransactions = (transactions, getOutstandingForPerson = null) => {
    return filterTransactionsByDueStatus(transactions, DUE_STATUS.OVERDUE, getOutstandingForPerson);
};

/**
 * Get transactions that have tracking-worthy due dates (upcoming or overdue)
 * AND have outstanding amounts > 0
 * @param {Array} transactions - Array of transactions
 * @param {Function} getOutstandingForPerson - Function to get outstanding amount for a person
 * @returns {Object} Object with upcoming and overdue transaction arrays
 */
export const getDueTrackingTransactions = (transactions, getOutstandingForPerson = null) => {
    if (!Array.isArray(transactions)) {
        return { upcoming: [], overdue: [] };
    }

    const upcoming = [];
    const overdue = [];

    transactions.forEach(transaction => {
        const dueStatus = getDueStatus(transaction.dueDate);

        // Only include if due status is tracking-worthy AND outstanding amount > 0
        if (dueStatus.status === DUE_STATUS.UPCOMING || dueStatus.status === DUE_STATUS.OVERDUE) {
            // Check if we have a function to get outstanding amount
            if (getOutstandingForPerson) {
                const outstandingAmount = getOutstandingForPerson(transaction.personName, transaction.type);

                // Only include if there's an outstanding amount
                if (outstandingAmount && outstandingAmount > 0) {
                    const transactionWithStatus = { ...transaction, dueStatus, outstandingAmount };

                    if (dueStatus.status === DUE_STATUS.UPCOMING) {
                        upcoming.push(transactionWithStatus);
                    } else if (dueStatus.status === DUE_STATUS.OVERDUE) {
                        overdue.push(transactionWithStatus);
                    }
                }
            } else {
                // Fallback: if no outstanding function provided, include all (for backward compatibility)
                const transactionWithStatus = { ...transaction, dueStatus };

                if (dueStatus.status === DUE_STATUS.UPCOMING) {
                    upcoming.push(transactionWithStatus);
                } else if (dueStatus.status === DUE_STATUS.OVERDUE) {
                    overdue.push(transactionWithStatus);
                }
            }
        }
    });

    // Sort by urgency (overdue first, then by days)
    upcoming.sort((a, b) => a.dueStatus.daysUntilDue - b.dueStatus.daysUntilDue);
    overdue.sort((a, b) => b.dueStatus.daysUntilDue - a.dueStatus.daysUntilDue);

    return { upcoming, overdue };
};

/**
 * Check if a transaction has a due date that needs tracking
 * @param {Object} transaction - Transaction object
 * @returns {boolean} True if transaction needs due tracking
 */
export const needsDueTracking = (transaction) => {
    if (!transaction || !transaction.dueDate) return false;

    const dueStatus = getDueStatus(transaction.dueDate);
    return dueStatus.status === DUE_STATUS.UPCOMING || dueStatus.status === DUE_STATUS.OVERDUE;
};

/**
 * Format due date for display
 * @param {string|Date} dueDate - Due date to format
 * @returns {string} Formatted date string
 */
export const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';

    const date = new Date(dueDate);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return date.toLocaleDateString('en-US', options);
};