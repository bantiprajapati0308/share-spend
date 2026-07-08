import { isValidIndianMobileNumber, normalizeIndianMobileNumber } from './phoneHelper';

export const validateWhatsAppMobileNumber = (value) => {
    const normalized = normalizeIndianMobileNumber(value);

    if (!normalized || !isValidIndianMobileNumber(normalized)) {
        return {
            isValid: false,
            normalized,
            error: 'Please enter a valid mobile number.',
        };
    }

    return {
        isValid: true,
        normalized,
        error: '',
    };
};
