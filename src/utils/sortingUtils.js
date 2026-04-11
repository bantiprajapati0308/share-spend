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
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA; // Newest first
            });

        case SORT_TYPES.DATE_OLDEST:
            return sortedExpenses.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateA - dateB; // Oldest first
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