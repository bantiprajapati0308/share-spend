/**
 * Format large numbers to readable format (e.g., 10000 -> 10k)
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatLargeNumber = (num, decimals = 1) => {
    if (!num) return '0';

    const absNum = Math.abs(num);

    if (absNum >= 1000000) {
        return (num / 1000000).toFixed(decimals) + 'M';
    }
    if (absNum >= 1000) {
        return (num / 1000).toFixed(decimals) + 'k';
    }

    return num.toFixed(decimals);
};

/**
 * Format number with thousand separators (e.g., 10000 -> 10,000)
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumberWithCommas = (num) => {
    if (!num) return '0';
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
