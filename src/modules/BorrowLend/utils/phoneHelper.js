export const stripPhoneNumber = (value = '') => String(value).trim().replace(/\D/g, '');

export const normalizeIndianMobileNumber = (value = '') => {
    let digits = stripPhoneNumber(value);

    if (digits.length === 10) {
        digits = `91${digits}`;
    }

    return digits;
};

export const isValidIndianMobileNumber = (value = '') => {
    const normalized = normalizeIndianMobileNumber(value);
    return /^91[6-9]\d{9}$/.test(normalized);
};
