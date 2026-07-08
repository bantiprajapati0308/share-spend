import { borrowLendApi } from '../../../services/api/borrowLendApi';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

export const addBorrowLendRecord = async ({ personName, amount, type, date, dueDate = null, description = '', payment_type = '', mobileNumber = '', email = '' }) => {
    const normalizedType = type || TRANSACTION_TYPES.GAVE;
    const normalizedPaymentType = payment_type || (normalizedType === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed');
    const insertDate = date || new Date().toISOString().split('T')[0];

    const result = await borrowLendApi.addRecord({
        personName,
        amount,
        type: normalizedType,
        date: insertDate,
        dueDate: dueDate || null,
        description,
        payment_type: normalizedPaymentType,
        mobileNumber,
        email,
    });
    if (!result.success) throw new Error(result.error || 'Failed to add record');
    return result.data;
};

export const applyBorrowLendRepayment = async ({ personName, repaymentAmount, date, description = '', type }) => {
    const result = await borrowLendApi.addRepayment({
        personName,
        repaymentAmount,
        date: date || new Date().toISOString().split('T')[0],
        description,
        type,
    });
    if (!result.success) throw new Error(result.error || 'Failed to add repayment');
    return result.data;
};


