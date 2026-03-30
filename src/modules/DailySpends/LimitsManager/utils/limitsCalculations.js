/**
 * Utility functions for limits calculations
 * Handles percentage calculations, status determination, and formatting
 */

/**
 * Calculate the percentage of limit spent
 * @param {number} spent - Amount spent
 * @param {number} limit - Limit amount
 * @returns {number} Percentage (capped at 100)
 */
export const calculateLimitPercentage = (spent, limit) => {
    if (limit === 0) return 0;
    return Math.min(Math.round((spent / limit) * 100), 100);
};

/**
 * Calculate remaining amount available in limit
 * @param {number} spent - Amount spent
 * @param {number} limit - Limit amount
 * @returns {number} Remaining amount
 */
export const calculateRemaining = (spent, limit) => {
    return Math.max(limit - spent, 0);
};

/**
 * Calculate amount over limit (if any)
 * @param {number} spent - Amount spent
 * @param {number} limit - Limit amount
 * @returns {number} Amount over limit (0 if under limit)
 */
export const calculateOverLimit = (spent, limit) => {
    return Math.max(spent - limit, 0);
};

/**
 * Determine status badge color based on percentage
 * @param {number} percentage - Percentage of limit used
 * @returns {string} Bootstrap color variant
 */
export const getStatusVariant = (percentage) => {
    if (percentage > 100) return 'danger';
    if (percentage > 80) return 'warning';
    if (percentage > 50) return 'info';
    return 'success';
};

/**
 * Determine status text based on percentage
 * @param {number} percentage - Percentage of limit used
 * @returns {string} Status text
 */
export const getStatusText = (percentage) => {
    if (percentage > 100) return 'Over Limit';
    if (percentage > 80) return 'Caution';
    if (percentage > 50) return 'On Track';
    return 'Good';
};

/**
 * Format currency value
 * @param {number} value - Value to format
 * @returns {string} Formatted currency
 */
export const formatCurrency = (value) => {
    return `$${parseFloat(value || 0).toFixed(2)}`;
};

/**
 * Calculate health score for a limit (0-100)
 * Based on how close to limit without exceeding
 * @param {number} percentage - Percentage of limit used
 * @returns {number} Health score
 */
export const calculateHealthScore = (percentage) => {
    if (percentage > 100) {
        // Penalty for exceeding limit
        return Math.max(0, 100 - (percentage - 100));
    }
    // Score is inverse of percentage (closer to limit = lower score but still good)
    return Math.min(100, 100 - percentage + 100);
};

/**
 * Sort limits by status (over limit first, then by percentage)
 * @param {Array} limits - Array of limit objects
 * @param {Object} categoryTotals - Map of category: spent amount
 * @returns {Array} Sorted limits
 */
export const sortLimitsByUrgency = (limits, categoryTotals) => {
    return [...limits].sort((a, b) => {
        const spentA = categoryTotals[a.category] || 0;
        const spentB = categoryTotals[b.category] || 0;
        const percentageA = calculateLimitPercentage(spentA, a.limit);
        const percentageB = calculateLimitPercentage(spentB, b.limit);

        // Over limit comes first
        if ((percentageA > 100) !== (percentageB > 100)) {
            return (percentageB > 100) - (percentageA > 100);
        }

        // Then sort by percentage (highest first)
        return percentageB - percentageA;
    });
};

/**
 * Get summary statistics for limits
 * @param {Array} limits - Array of limit objects
 * @param {Object} categoryTotals - Map of category: spent amount
 * @returns {Object} Summary statistics
 */
export const getLimitsSummary = (limits, categoryTotals) => {
    if (!limits.length) {
        return {
            totalLimits: 0,
            totalBudget: 0,
            totalSpent: 0,
            overLimitCount: 0,
            averageUsage: 0,
        };
    }

    const summary = limits.reduce(
        (acc, limit) => {
            const spent = categoryTotals[limit.category] || 0;
            const percentage = calculateLimitPercentage(spent, limit.limit);

            return {
                totalLimits: acc.totalLimits + 1,
                totalBudget: acc.totalBudget + limit.limit,
                totalSpent: acc.totalSpent + spent,
                overLimitCount: acc.overLimitCount + (percentage > 100 ? 1 : 0),
                totalPercentage: acc.totalPercentage + percentage,
            };
        },
        {
            totalLimits: 0,
            totalBudget: 0,
            totalSpent: 0,
            overLimitCount: 0,
            totalPercentage: 0,
        }
    );

    return {
        ...summary,
        averageUsage: Math.round(summary.totalPercentage / summary.totalLimits),
    };
};

/**
 * Validate limit input
 * @param {string} categoryName - Category name
 * @param {string|number} limitAmount - Limit amount
 * @returns {Object} Validation result {isValid, error}
 */
export const validateLimitInput = (categoryName, limitAmount) => {
    if (!categoryName) {
        return { isValid: false, error: 'Please select a category' };
    }

    if (!limitAmount || limitAmount === '') {
        return { isValid: false, error: 'Please enter a limit amount' };
    }

    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
        return { isValid: false, error: 'Limit must be a valid positive number' };
    }

    if (amount > 999999) {
        return { isValid: false, error: 'Limit amount is too large' };
    }

    return { isValid: true };
};
