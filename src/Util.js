export const getCurrencySymbol = (currency) => {
    console.log('currency: ', currency);
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
            return '';
    }
}
export const CURRENCY_ARRAY = [
    { value: 'INR', label: '₹' },
    { value: 'USD', label: '$' },
    { value: 'EUR', label: '€' },
    { value: 'GBP', label: '£' },
]