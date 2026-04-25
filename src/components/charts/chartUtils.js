/**
 * Fixed color palette to use for all charts
 */
const COLOR_PALETTE = ["#9e0142", "#66c2a5", "#5e4fa2", "#137fc1", "#d314c1", "#fc8d59", "#91bfdb", "#d73027", "#4575b4", "#f46d43", "#74add1", "#313695"];

/**
 * Generate colors for datasets using only the COLOR_PALETTE
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color strings
 */
export const generateColors = (count) => {
    const colors = [];

    // Generate colors based on count, repeating from index 0 when needed
    for (let i = 0; i < count; i++) {
        colors.push(COLOR_PALETTE[i % COLOR_PALETTE.length]);
    }

    return colors;
};

/**
 * Create gradient background for canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} colors - Array of color stops
 * @param {string} direction - Gradient direction ('vertical', 'horizontal')
 * @returns {CanvasGradient} Gradient object
 */
export const createGradient = (ctx, colors, direction = 'vertical') => {
    const gradient = direction === 'vertical'
        ? ctx.createLinearGradient(0, 0, 0, 400)
        : ctx.createLinearGradient(0, 0, 400, 0);

    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });

    return gradient;
};

/**
 * Format currency values for chart labels
 * @param {number} value - Numeric value
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = '₹') => {
    if (value >= 1000000) {
        return `${currency}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${currency}${(value / 1000).toFixed(1)}K`;
    } else {
        return `${currency}${value.toFixed(0)}`;
    }
};

/**
 * Format percentage values
 * @param {number} value - Numeric value
 * @param {number} total - Total value for percentage calculation
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, total) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return `${percentage}%`;
};

/**
 * Prepare data for stacked bar chart
 * @param {Array} rawData - Array of data objects
 * @param {Array} categories - Array of category names
 * @param {string} labelKey - Key for labels in data objects
 * @param {string} valueKey - Key for values in data objects
 * @returns {Object} Chart.js compatible data object
 */
export const prepareStackedBarData = (rawData, categories, labelKey = 'date', valueKey = 'amount') => {
    // Extract unique labels (e.g., dates)
    const labels = [...new Set(rawData.map(item => item[labelKey]))].sort();

    // Generate colors for all categories including "Other"
    const colors = generateColors(categories.length);

    // Create datasets for each category
    const datasets = categories.map((category, index) => {
        const data = labels.map(label => {
            const item = rawData.find(d => d[labelKey] === label && d.category === category);
            return item ? item[valueKey] : 0;
        });

        return {
            label: category,
            data,
            backgroundColor: colors[index],
            borderColor: colors[index],
            borderWidth: 1,
        };
    });

    return { labels, datasets };
};

/**
 * Prepare data for line chart
 * @param {Array} rawData - Array of data objects
 * @param {string} labelKey - Key for x-axis labels
 * @param {string} valueKey - Key for y-axis values
 * @param {Array} series - Array of series configurations
 * @returns {Object} Chart.js compatible data object
 */
export const prepareLineData = (rawData, labelKey = 'date', valueKey = 'amount', series = []) => {
    const labels = [...new Set(rawData.map(item => item[labelKey]))].sort();

    const datasets = series.map((serie, index) => {
        const data = labels.map(label => {
            const items = rawData.filter(d => d[labelKey] === label);
            return serie.aggregation === 'sum'
                ? items.reduce((sum, item) => sum + (item[valueKey] || 0), 0)
                : items.length > 0 ? items[0][valueKey] : 0;
        });

        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
        return {
            label: serie.label,
            data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.4,
            fill: serie.fill || false,
        };
    });

    return { labels, datasets };
};

/**
 * Prepare data for pie/donut chart
 * @param {Array} rawData - Array of data objects
 * @param {string} labelKey - Key for labels
 * @param {string} valueKey - Key for values
 * @returns {Object} Chart.js compatible data object
 */
export const preparePieData = (rawData, labelKey = 'category', valueKey = 'amount') => {
    const labels = rawData.map(item => item[labelKey]);
    const data = rawData.map(item => item[valueKey]);

    const datasets = [{
        data,
        backgroundColor: generateColors(data.length),
        borderColor: generateColors(data.length),
        borderWidth: 1,
    }];

    return { labels, datasets };
};

/**
 * Aggregate data by time period
 * @param {Array} data - Raw data array
 * @param {string} period - Time period ('day', 'week', 'month')
 * @param {string} dateKey - Key for date field
 * @param {string} valueKey - Key for value field
 * @returns {Array} Aggregated data
 */
export const aggregateByPeriod = (data, period = 'day', dateKey = 'date', valueKey = 'amount') => {
    const grouped = {};

    data.forEach(item => {
        const date = new Date(item[dateKey]);
        let key;

        switch (period) {
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            default: // day
                key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
            grouped[key] = { [dateKey]: key, [valueKey]: 0, count: 0 };
        }

        grouped[key][valueKey] += item[valueKey] || 0;
        grouped[key].count += 1;
    });

    return Object.values(grouped).sort((a, b) => a[dateKey].localeCompare(b[dateKey]));
};

/**
 * Calculate moving average
 * @param {Array} data - Array of numeric values
 * @param {number} window - Window size for moving average
 * @returns {Array} Array of moving averages
 */
export const calculateMovingAverage = (data, window = 7) => {
    const result = [];

    for (let i = 0; i < data.length; i++) {
        const start = Math.max(0, i - window + 1);
        const end = i + 1;
        const slice = data.slice(start, end);
        const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
        result.push(average);
    }

    return result;
}