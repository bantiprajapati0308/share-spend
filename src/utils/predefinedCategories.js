/**
 * Predefined categories for all users
 * These categories are automatically initialized for new users and cannot be deleted
 * Each category includes name, emoji, and type (spend/income)
 */

export const PREDEFINED_SPEND_CATEGORIES = [
    { name: 'Grocery', emoji: '🛒', type: 'spend', isPredefined: true },
    { name: 'Rent', emoji: '🏠', type: 'spend', isPredefined: true },
    { name: 'Transportation', emoji: '🚗', type: 'spend', isPredefined: true },
    { name: 'EMIs', emoji: '💳', type: 'spend', isPredefined: true },
    { name: 'Investment', emoji: '📈', type: 'spend', isPredefined: true },
    { name: 'Personal', emoji: '👤', type: 'spend', isPredefined: true },
    { name: 'Friend Spent', emoji: '👫', type: 'spend', isPredefined: true },
    { name: 'Lent', emoji: '🤝', type: 'spend', isPredefined: true },
    { name: 'Borrowed Pay', emoji: '💳', type: 'spend', isPredefined: true },
    { name: 'Credit Cards Bill', emoji: '💰', type: 'spend', isPredefined: true },
];

export const PREDEFINED_INCOME_CATEGORIES = [
    { name: 'Salary', emoji: '💼', type: 'income', isPredefined: true },
    { name: 'Bonus', emoji: '🎉', type: 'income', isPredefined: true },
    { name: 'Borrowed', emoji: '📋', type: 'income', isPredefined: true },
    { name: 'Repayment', emoji: '✅', type: 'income', isPredefined: true, isEnabled: true },
];

export const NON_DELETABLE_CATEGORIES = ['Repayment', 'Borrowed', 'Lent', 'Borrowed Pay'];
export const ALL_PREDEFINED_CATEGORIES = [
    ...PREDEFINED_SPEND_CATEGORIES,
    ...PREDEFINED_INCOME_CATEGORIES,
];

/**
 * Get all predefined categories of a specific type
 * @param {string} type - 'spend' or 'income'
 * @returns {Array} Array of predefined categories
 */
export const getPredefinedCategoriesByType = (type) => {
    if (type === 'spend') {
        return PREDEFINED_SPEND_CATEGORIES;
    } else if (type === 'income') {
        return PREDEFINED_INCOME_CATEGORIES;
    }
    return [];
};

/**
 * Check if a category is predefined
 * @param {string} categoryName - Category name to check
 * @returns {boolean} True if category is predefined
 */
export const isPredefinedCategory = (categoryName) => {
    return ALL_PREDEFINED_CATEGORIES.some(cat => cat.name === categoryName);
};

/**
 * Get predefined category by name
 * @param {string} categoryName - Category name to find
 * @returns {Object|null} Category object or null if not found
 */
export const getPredefinedCategory = (categoryName) => {
    return ALL_PREDEFINED_CATEGORIES.find(cat => cat.name === categoryName) || null;
};
