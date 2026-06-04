import { dailySpendsApi } from '../services/api/dailySpendsApi';

const normalizeDate = (ts) => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts._seconds !== undefined) return new Date(ts._seconds * 1000);
    return new Date(ts);
};

// GET: Fetch transactions for current user.
// Pass { startDate, endDate } as YYYY-MM-DD strings to filter on the server —
// only the matching date range is read from Firestore.
export const getTransactions = async ({ startDate, endDate } = {}) => {
    try {
        const result = await dailySpendsApi.getTransactions({ startDate, endDate });
        if (!result.success) throw new Error(result.error);
        return result.data.map(d => ({ ...d, createdAt: normalizeDate(d.createdAt) }));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
};

// GET: Fetch transactions by type, optionally scoped to a date range.
export const getTransactionsByType = async (type, { startDate, endDate } = {}) => {
    try {
        const transactions = await getTransactions({ startDate, endDate });
        return transactions
            .filter(t => t.type === type)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
        console.error("Error fetching transactions by type:", error);
        return [];
    }
};

// POST: Add a new transaction.
// Returns { transaction, companion } where companion is non-null when
// the server auto-created a credit-card income entry.
export const addTransaction = async (transactionData) => {
    try {
        const result = await dailySpendsApi.addTransaction(transactionData);
        if (!result.success) throw new Error(result.error);
        const { _companion, ...primaryData } = result.data;
        return {
            transaction: { ...primaryData, createdAt: normalizeDate(primaryData.createdAt) },
            companion: _companion
                ? { ..._companion, createdAt: normalizeDate(_companion.createdAt) }
                : null,
        };
    } catch (error) {
        console.error('Error adding transaction:', error);
        throw error;
    }
};

// UPDATE: Update an existing transaction.
// Returns { transaction, companion, deletedCompanionId } to mirror the add shape.
export const updateTransaction = async (transactionId, transactionData) => {
    try {
        const result = await dailySpendsApi.updateTransaction(transactionId, transactionData);
        if (!result.success) throw new Error(result.error);
        const { _companion, _deletedCompanionId, ...primaryData } = result.data;
        return {
            transaction: { id: transactionId, ...transactionData },
            companion: _companion
                ? { ..._companion, createdAt: normalizeDate(_companion.createdAt) }
                : null,
            deletedCompanionId: _deletedCompanionId || null,
        };
    } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
    }
};

// DELETE: Remove a transaction (and its linked companion if any)
export const deleteTransaction = async (transactionId) => {
    try {
        const result = await dailySpendsApi.deleteTransaction(transactionId);
        if (!result.success) throw new Error(result.error);
        return result.data; // { deleted: true, deletedCompanionId: string | null }
    } catch (error) {
        console.error("Error deleting transaction:", error);
        throw error;
    }
};

// GET: Get transaction summary (spent vs income)
export const getTransactionSummary = async () => {
    try {
        const transactions = await getTransactions();
        const totalSpend = transactions
            .filter(t => t.type === 'spend')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const spendPercentage = totalIncome > 0 ? Math.round((totalSpend / totalIncome) * 100) : 0;

        return {
            totalSpend: totalSpend.toFixed(2),
            totalIncome: totalIncome.toFixed(2),
            spendPercentage,
            remaining: (totalIncome - totalSpend).toFixed(2),
            totalTransactions: transactions.length,
        };
    } catch (error) {
        console.error("Error getting transaction summary:", error);
        return {
            totalSpend: '0.00',
            totalIncome: '0.00',
            spendPercentage: 0,
            remaining: '0.00',
            totalTransactions: 0,
        };
    }
};

// GET: Get transactions for today
export const getTodayTransactions = async () => {
    try {
        const transactions = await getTransactions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            transactionDate.setHours(0, 0, 0, 0);
            return transactionDate.getTime() === today.getTime();
        });
    } catch (error) {
        console.error("Error getting today's transactions:", error);
        return [];
    }
};

// GET: Get transactions by category (for spend type)
export const getTransactionsByCategory = async () => {
    try {
        const transactions = await getTransactionsByType('spend');
        const categories = {};

        transactions.forEach(transaction => {
            const category = transaction.category || 'Other';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(transaction);
        });

        // Sort transactions in each category by date (newest first)
        Object.keys(categories).forEach(category => {
            categories[category].sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA;
            });
        });

        return categories;
    } catch (error) {
        console.error("Error getting transactions by category:", error);
        return {};
    }
};

// GET: Get transaction summary by date range
export const getTransactionsByDateRange = async (startDate, endDate) => {
    try {
        const transactions = await getTransactions();
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });
    } catch (error) {
        console.error("Error getting transactions by date range:", error);
        return [];
    }
};
