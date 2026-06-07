export const formatAmount = (value, type = 'INDIAN') => { //accepts format as, 'COMPACT', 'INDIAN'
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    const numValue = Number(value);

    if (type === 'COMPACT') {
        if (Math.abs(numValue) >= 1000000) {
            return (numValue / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (Math.abs(numValue) >= 1000) {
            return (numValue / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return numValue.toString();
    }

    // Default INDIAN format
    return numValue.toLocaleString('en-IN');
}

export const formatPercentage = (value, decimal = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    const numValue = Number(value);
    const formatted = numValue.toFixed(decimal);

    // Remove trailing zeros and decimal point if not needed
    return formatted.replace(/\.?0+$/, '');
}