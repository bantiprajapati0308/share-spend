// Default currency for the application
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';

// Format currency with INR locale and symbol
export const formatCurrencyINR = (amount, options = {}) => {
    const {
        showSymbol = true,
        decimals = 0,
        locale = 'en-IN'
    } = options;

    const formattedAmount = Number(amount).toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return showSymbol ? `${DEFAULT_CURRENCY_SYMBOL}${formattedAmount}` : formattedAmount;
};

export const getCurrencySymbol = (currency = DEFAULT_CURRENCY) => {
    switch (currency) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'INR':
            return '₹';
        case 'GBP':
            return '£';
        default:
            return DEFAULT_CURRENCY_SYMBOL;
    }
}

export const getGradientColor = (currentValue, minValue, maxValue) => {
    // Return default black if no gradient needed
    if (maxValue <= minValue) {
        return '#000';
    }

    // Calculate ratio between 0 and 1
    const ratio = (currentValue - minValue) / (maxValue - minValue);

    // Calculate gradient from red (lowest) to green (highest)
    const red = Math.round(255 - (ratio * 160)); // 255 to 55
    const green = Math.round(55 + (ratio * 160)); // 55 to 255

    return `rgb(${red}, ${green}, 55)`;
};

export const CURRENCY_ARRAY = [
    { value: 'INR', label: '₹' },
    { value: 'USD', label: '$' },
    { value: 'EUR', label: '€' },
    { value: 'GBP', label: '£' },
]