// Category emoji mapping
export const CATEGORY_EMOJIS = {
    'Food': '🍔',
    'Transport': '🚗',
    'Health': '🏥',
    'Entertainment': '🎮',
    'Education': '📚',
    'Shopping': '🛍️',
    'Other': '📝'
};

/**
 * Format category name with emoji for display
 * @param {string} category - Plain category name
 * @returns {string} - Formatted category with emoji
 */
export const formatCategoryWithEmoji = (category) => {
    const emoji = CATEGORY_EMOJIS[category] || '📝';
    return `${emoji} ${category}`;
};

/**
 * Extract plain category name (remove emoji if present)
 * @param {string} category - Category name with or without emoji
 * @returns {string} - Plain category name
 */
export const extractCategoryName = (category) => {
    // Remove emoji and whitespace from the beginning
    return category.replace(/^[^\s]*\s+/, '').trim();
};
