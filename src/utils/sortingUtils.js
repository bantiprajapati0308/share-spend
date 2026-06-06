/**
 * Utility functions for sorting expenses and other data
 */

export const SORT_TYPES = {
    DATE_NEWEST: 'date-newest',
    LATEST_ENTRY: 'latest-entry',
    HIGHEST_AMOUNT: 'highest-amount',
    DATE_OLDEST: 'date-oldest',
    LOWEST_AMOUNT: 'lowest-amount',
    ALPHABETICAL: 'alphabetical'
};

/**
 * Resolve a sortable timestamp from a transaction.
 * - If date contains a time component (e.g. '2026-06-04T14:30'), use it directly.
 * - If date is date-only (e.g. '2026-06-04'), combine it with createdAt time as tiebreaker.
 * - Falls back to createdAt alone if date is missing.
 */
const resolveSortDate = (tx) => {
    const raw = tx.date;
    if (raw && raw.includes('T')) {
        // Full datetime stored in date field — most precise
        return new Date(raw);
    }
    if (raw) {
        // Date-only field — use createdAt for same-day ordering
        const createdAt = tx.createdAt ? new Date(tx.createdAt) : null;
        const base = new Date(raw + 'T00:00:00');
        if (createdAt && !isNaN(createdAt)) {
            // Keep the calendar date from `date`, use createdAt time-of-day as tiebreaker
            base.setHours(createdAt.getHours(), createdAt.getMinutes(), createdAt.getSeconds(), createdAt.getMilliseconds());
        }
        return base;
    }
    return tx.createdAt ? new Date(tx.createdAt) : new Date(0);
};

/**
 * Sort expenses based on the selected sort type
 * @param {Array} expenses - Array of expense objects
 * @param {string} sortType - Sort type from SORT_TYPES
 * @returns {Array} Sorted array of expenses
 */
export const sortExpenses = (expenses, sortType) => {
    if (!expenses || expenses.length === 0) return [];

    const sortedExpenses = [...expenses];

    switch (sortType) {
        case SORT_TYPES.DATE_NEWEST:
            return sortedExpenses.sort((a, b) => {
                return resolveSortDate(b) - resolveSortDate(a); // Newest first
            });

        case SORT_TYPES.DATE_OLDEST:
            return sortedExpenses.sort((a, b) => {
                return resolveSortDate(a) - resolveSortDate(b); // Oldest first
            });

        case SORT_TYPES.LATEST_ENTRY:
            return sortedExpenses.sort((a, b) => {
                const createdA = new Date(a.createdAt || a.date);
                const createdB = new Date(b.createdAt || b.date);
                return createdB - createdA; // Latest entry first
            });

        case SORT_TYPES.HIGHEST_AMOUNT:
            return sortedExpenses.sort((a, b) => {
                const amountA = parseFloat(a.amount) || 0;
                const amountB = parseFloat(b.amount) || 0;
                return amountB - amountA; // Highest first
            });

        case SORT_TYPES.LOWEST_AMOUNT:
            return sortedExpenses.sort((a, b) => {
                const amountA = parseFloat(a.amount) || 0;
                const amountB = parseFloat(b.amount) || 0;
                return amountA - amountB; // Lowest first
            });

        case SORT_TYPES.ALPHABETICAL:
            return sortedExpenses.sort((a, b) => {
                const nameA = (a.name || a.description || '').toLowerCase();
                const nameB = (b.name || b.description || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });

        default:
            return sortedExpenses;
    }
};

/**
 * Get display text for sort type
 * @param {string} sortType - Sort type from SORT_TYPES
 * @returns {string} Display text
 */
export const getSortDisplayText = (sortType) => {
    const sortTexts = {
        [SORT_TYPES.DATE_NEWEST]: 'By Date (Newest First)',
        [SORT_TYPES.DATE_OLDEST]: 'By Date (Oldest First)',
        [SORT_TYPES.LATEST_ENTRY]: 'Latest Entry',
        [SORT_TYPES.HIGHEST_AMOUNT]: 'Highest Amount',
        [SORT_TYPES.LOWEST_AMOUNT]: 'Lowest Amount',
        [SORT_TYPES.ALPHABETICAL]: 'Alphabetical (A-Z)'
    };

    return sortTexts[sortType] || 'Unknown Sort';
};

/**
 * Sort any array of objects by a specific field 
 * @param {Array} data - Array of objects to sort
 * @param {string} field - Field to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortByField = (data, field, direction = 'asc') => {
    if (!data || data.length === 0) return [];

    return [...data].sort((a, b) => {
        let valueA = a[field];
        let valueB = b[field];

        // Handle different data types
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (typeof valueA === 'number') {
            return direction === 'asc' ? valueA - valueB : valueB - valueA;
        }

        if (valueA instanceof Date || (typeof valueA === 'string' && !isNaN(Date.parse(valueA)))) {
            const dateA = new Date(valueA);
            const dateB = new Date(valueB);
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Default string comparison
        if (direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
};