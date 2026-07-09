import { useState, useEffect, useMemo } from 'react';
import { borrowLendApi } from '../../../services/api/borrowLendApi';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import { deleteEntryByUuid } from '../utils/firebaseOperations';


const expandTransactionsFromRecords = (records) => {
    const expanded = [];

    records.forEach(record => {
        const entries = Array.isArray(record.data) ? record.data : [];

        entries.forEach((entry, idx) => {
            expanded.push({
                id: entry.uuid || `${record.id}-${idx}`, // Use UUID as primary identifier, fallback to composite ID
                uuid: entry.uuid,
                docId: record.id,
                personName: record.personName,
                type: record.type,
                amount: Number(entry.amount || 0),
                date: entry.insert_date || '',
                dueDate: entry.due_date || null,
                description: entry.description || '',
                paymentType: entry.payment_type || (record.type === TRANSACTION_TYPES.GAVE ? 'Lent' : 'Borrowed'),
            });
        });
    });

    return expanded.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const normalizePaymentType = (paymentType) =>
    String(paymentType || '').trim().toLowerCase();

const isRepaymentPaymentType = (paymentType) => {
    const normalized = normalizePaymentType(paymentType);
    return (
        normalized === 'repayment' ||
        normalized === 'borrowed pay' ||
        normalized.includes('repay')
    );
};

export const useLendingTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await borrowLendApi.getRecords();
            if (!result.success) throw new Error(result.error);
            setTransactions(result.data);
        } catch (err) {
            console.error('Error fetching lending transactions:', err);
            setError(err.message || 'Failed to load records');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (entryUuid) => {
        return deleteEntryByUuid(entryUuid, fetchTransactions);
    };

    const computeRecordTotals = (record) => {
        const entries = Array.isArray(record.data) ? record.data : [];

        let totalLent = 0;
        let totalBorrowed = 0;
        let totalRepayment = 0;

        entries.forEach(entry => {
            const paymentType = normalizePaymentType(entry.payment_type);
            const value = Number(entry.amount || 0);
            if (paymentType === 'lent') totalLent += value;
            else if (paymentType === 'borrowed') totalBorrowed += value;
            else if (isRepaymentPaymentType(paymentType)) totalRepayment += value;
        });

        const outstanding = record.type === TRANSACTION_TYPES.GAVE
            ? Math.max(totalLent - totalRepayment, 0)
            : Math.max(totalBorrowed - totalRepayment, 0);

        return { totalLent, totalBorrowed, totalRepayment, outstanding, entries };
    };

    const getTotalGiven = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.GAVE)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const getTotalTaken = () => {
        const total = transactions
            .filter(t => t.type === TRANSACTION_TYPES.TOOK)
            .reduce((sum, t) => sum + (computeRecordTotals(t).outstanding || 0), 0);
        return Math.round(total * 100) / 100;
    };

    const expandedTransactions = useMemo(() => expandTransactionsFromRecords(transactions), [transactions]);

    return {
        transactions,
        expandedTransactions,
        deleteTransaction,
        getTotalGiven,
        getTotalTaken,
        loading,
        error,
        refreshTransactions: fetchTransactions,
    };
};
