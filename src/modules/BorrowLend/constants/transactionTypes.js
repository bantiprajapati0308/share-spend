/**
 * Centralized Transaction Type Constants for Borrow/Lend Module
 * Using consistent IDs across all components
 */

export const TRANSACTION_TYPES = {
    GAVE: 'gave',      // Money you gave away (Lend Money)
    TOOK: 'took',      // Money you received (Borrow Money)
};

export const TRANSACTION_TYPE_LABELS = {
    [TRANSACTION_TYPES.GAVE]: 'Lend Money',
    [TRANSACTION_TYPES.TOOK]: 'Borrow Money',
};

export const TRANSACTION_TYPE_EMOJIS = {
    [TRANSACTION_TYPES.GAVE]: '💰',
    [TRANSACTION_TYPES.TOOK]: '💸',
};

export const TRANSACTION_STATUS = {
    [TRANSACTION_TYPES.GAVE]: 'You Lent',
    [TRANSACTION_TYPES.TOOK]: 'You Owe',
};

/**
 * Get all transaction type options for dropdown/radio buttons
 */
export const getTransactionTypeOptions = () => [
    {
        id: TRANSACTION_TYPES.GAVE,
        label: TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.GAVE],
        emoji: TRANSACTION_TYPE_EMOJIS[TRANSACTION_TYPES.GAVE],
    },
    {
        id: TRANSACTION_TYPES.TOOK,
        label: TRANSACTION_TYPE_LABELS[TRANSACTION_TYPES.TOOK],
        emoji: TRANSACTION_TYPE_EMOJIS[TRANSACTION_TYPES.TOOK],
    },
];

/**
 * Get label for transaction type
 */
export const getTransactionTypeLabel = (type) => {
    return TRANSACTION_TYPE_LABELS[type] || type;
};

/**
 * Get emoji for transaction type
 */
export const getTransactionTypeEmoji = (type) => {
    return TRANSACTION_TYPE_EMOJIS[type] || '';
};

/**
 * Get status label for transaction type
 */
export const getTransactionStatus = (type) => {
    return TRANSACTION_STATUS[type] || type;
};
