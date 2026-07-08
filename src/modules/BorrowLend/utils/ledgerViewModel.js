import { TRANSACTION_TYPES } from '../constants/transactionTypes';

export const normalizePaymentType = (value) => String(value || '').trim().toLowerCase();

export const isRepaymentPayment = (paymentType) => {
    const normalized = normalizePaymentType(paymentType);
    return normalized === 'repayment' || normalized === 'borrowed pay' || normalized.includes('repay');
};

export const formatLedgerDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const formatShortDateParts = (date) => {
    if (!date) return { day: '--', month: '---' };
    const value = new Date(date);
    return {
        day: value.toLocaleDateString('en-IN', { day: '2-digit' }),
        month: value.toLocaleDateString('en-IN', { month: 'short' }),
    };
};

export const getInitials = (name = '') => name.trim().charAt(0).toUpperCase() || '?';

export const getTransactionLabel = (transaction) => {
    const paymentType = normalizePaymentType(transaction.paymentType);
    if (paymentType === 'lent') return 'You Lent';
    if (paymentType === 'borrowed') return 'You Borrowed';
    if (paymentType === 'borrowed pay') return 'Money Repaid';
    if (paymentType === 'repayment') return 'Returned';
    return transaction.paymentType || 'Transaction';
};

export const getActionCopy = (kind) => {
    const map = {
        lend: {
            label: 'Lend Money',
            helper: 'You give money to someone',
            tone: 'lend',
        },
        borrow: {
            label: 'Borrow Money',
            helper: 'You take money from someone',
            tone: 'borrow',
        },
        return: {
            label: 'Money Returned',
            helper: 'Someone returns your money',
            tone: 'return',
        },
        repay: {
            label: 'Money Repaid',
            helper: 'You repay borrowed money',
            tone: 'repay',
        },
    };
    return map[kind] || map.lend;
};

export const buildPeopleLedger = (records) => {
    const peopleMap = new Map();

    records.forEach((record) => {
        const key = `${record.type}:${record.personName}`;
        if (!peopleMap.has(key)) {
            peopleMap.set(key, {
                id: record.id,
                key,
                personName: record.personName,
                mobileNumber: record.mobileNumber || '',
                email: record.email || '',
                type: record.type,
                totalLent: 0,
                totalBorrowed: 0,
                totalReturned: 0,
                remaining: 0,
                dueDate: null,
                transactionCount: 0,
                latestDate: null,
            });
        }

        const person = peopleMap.get(key);
        person.id = person.id || record.id;
        person.mobileNumber = person.mobileNumber || record.mobileNumber || '';
        person.email = person.email || record.email || '';
        const entries = Array.isArray(record.data) ? record.data : [];

        entries.forEach((entry) => {
            const paymentType = normalizePaymentType(entry.payment_type);
            const amount = Number(entry.amount || 0);
            const entryDate = entry.insert_date || entry.date;

            if (paymentType === 'lent') person.totalLent += amount;
            if (paymentType === 'borrowed') person.totalBorrowed += amount;
            if (isRepaymentPayment(paymentType)) person.totalReturned += amount;

            if ((paymentType === 'lent' || paymentType === 'borrowed') && entry.due_date) {
                const dueDate = new Date(entry.due_date);
                if (!person.dueDate || dueDate < person.dueDate) person.dueDate = dueDate;
            }

            if (entryDate) {
                const latestDate = new Date(entryDate);
                if (!person.latestDate || latestDate > person.latestDate) person.latestDate = latestDate;
            }

            person.transactionCount += 1;
        });

        const baseAmount = person.type === TRANSACTION_TYPES.GAVE ? person.totalLent : person.totalBorrowed;
        person.remaining = Math.max(baseAmount - person.totalReturned, 0);
    });

    return Array.from(peopleMap.values())
        .map((person) => {
            const isOverdue = person.remaining > 0 && person.dueDate && person.dueDate < new Date();
            let status = 'Pending';
            if (person.remaining <= 0) status = 'Settled';
            else if (person.totalReturned > 0) status = 'Partial';
            if (isOverdue) status = 'Overdue';

            return {
                ...person,
                status,
                subtitle: person.type === TRANSACTION_TYPES.GAVE ? 'You lent' : 'You borrowed',
            };
        })
        .sort((first, second) => {
            if (first.status === 'Settled' && second.status !== 'Settled') return 1;
            if (second.status === 'Settled' && first.status !== 'Settled') return -1;
            return (second.latestDate || 0) - (first.latestDate || 0);
        });
};

export const buildPersonTimeline = (expandedTransactions, person) => {
    if (!person) return [];

    const ledger = expandedTransactions
        .filter((transaction) =>
            transaction.personName === person.personName &&
            transaction.type === person.type
        )
        .sort((first, second) => new Date(first.date) - new Date(second.date));

    let runningBalance = 0;
    return ledger
        .map((transaction) => {
            const amount = Number(transaction.amount || 0);
            runningBalance += isRepaymentPayment(transaction.paymentType) ? -amount : amount;
            return { ...transaction, balanceAfter: Math.max(runningBalance, 0) };
        })
        .reverse();
};
