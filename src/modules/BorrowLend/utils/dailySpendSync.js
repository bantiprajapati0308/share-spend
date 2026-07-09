import { dailySpendsApi } from '../../../services/api/dailySpendsApi';
import { addBorrowLendRecord, applyBorrowLendRepayment } from './borrowLendFirestore';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';

export const DAILY_SPEND_SYNC_CHOICES = {
    YES: 'yes',
    NO: 'no',
};

const DAILY_SPEND_CATEGORY_BY_KIND = {
    lend: {
        type: 'spend',
        categoryId: 'lent',
        categoryName: 'Lent',
        categoryIcon: '\uD83E\uDD1D',
    },
    borrow: {
        type: 'income',
        categoryId: 'borrowed',
        categoryName: 'Borrowed',
        categoryIcon: '\uD83D\uDCCB',
    },
    return: {
        type: 'income',
        categoryId: 'repayment',
        categoryName: 'Repayment',
        categoryIcon: '\u2705',
    },
    repay: {
        type: 'spend',
        categoryId: 'borrowed_pay',
        categoryName: 'Borrowed Pay',
        categoryIcon: '\uD83D\uDCB3',
    },
};

export const getBorrowLendDailySpendKind = ({ type, mode }) => {
    if (mode === 'return') return 'return';
    if (mode === 'repay') return 'repay';
    return type === TRANSACTION_TYPES.TOOK ? 'borrow' : 'lend';
};

export const buildDailySpendTransactionFromBorrowLend = ({
    kind,
    personName,
    amount,
    date,
    dueDate = null,
    description = '',
}) => {
    const category = DAILY_SPEND_CATEGORY_BY_KIND[kind];
    if (!category) throw new Error('Unsupported Borrow/Lend transaction type for Daily Spend sync');

    return {
        type: category.type,
        name: personName,
        amount,
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        category: category.categoryName,
        categoryIcon: category.categoryIcon,
        date,
        notes: description,
        paymentMethodId: null,
        ...(['lend', 'borrow'].includes(kind) && dueDate ? { dueDate } : {}),
    };
};

export const addBorrowLendTransactionToDailySpend = async (payload) => {
    const dailySpendTransaction = buildDailySpendTransactionFromBorrowLend(payload);
    const result = await dailySpendsApi.addTransaction(dailySpendTransaction);
    if (!result.success) throw new Error(result.error || 'Failed to add Daily Spend transaction');
    return result.data;
};

export const syncDailySpendTransactionToBorrowLend = async (newTransaction) => {
    const normalizedCategory = (newTransaction.category || '').toLowerCase();
    const personName = newTransaction.name || newTransaction.categoryName || 'Unknown';
    const dueDate = newTransaction.dueDate || null;
    const transactionDate = newTransaction.date || new Date().toISOString().split('T')[0];

    if (normalizedCategory === 'lent') {
        return addBorrowLendRecord({
            personName,
            amount: newTransaction.amount,
            type: TRANSACTION_TYPES.GAVE,
            date: transactionDate,
            dueDate,
            description: newTransaction.notes || '',
        });
    }

    if (normalizedCategory === 'borrowed') {
        return addBorrowLendRecord({
            personName,
            amount: newTransaction.amount,
            type: TRANSACTION_TYPES.TOOK,
            date: transactionDate,
            dueDate,
            description: newTransaction.notes || '',
        });
    }

    if (normalizedCategory === 'repayment') {
        return applyBorrowLendRepayment({
            personName,
            repaymentAmount: newTransaction.amount,
            type: TRANSACTION_TYPES.GAVE,
            date: transactionDate,
            description: newTransaction.notes || '',
        });
    }

    if (normalizedCategory === 'borrowed pay') {
        return applyBorrowLendRepayment({
            personName,
            repaymentAmount: newTransaction.amount,
            type: TRANSACTION_TYPES.TOOK,
            date: transactionDate,
            description: newTransaction.notes || '',
        });
    }

    return null;
};
