import { db, auth } from "../firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

/**
 * GET: Fetch expenses grouped by category for a specific date range
 * Returns object: { category: [expenses], ... }
 * Converts Date objects to YYYY-MM-DD strings for proper date filtering
 */
export const getExpensesByCategory = async (startDate, endDate) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return {};
        }

        // Convert Date objects to YYYY-MM-DD strings for date filtering
        const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

        // Query all spend transactions (date filtering done client-side to avoid composite index)
        const expensesQuery = query(
            collection(db, "users", userId, "dailySpends"),
            where("type", "==", "spend"),
            orderBy("date", "desc")
        );

        const snap = await getDocs(expensesQuery);
        const expenses = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Filter by date range on client side
        const filteredExpenses = expenses.filter(exp => {
            const expDate = exp.date || exp.createdAt?.toISOString?.().split('T')[0];
            return expDate >= startDateStr && expDate <= endDateStr;
        });

        // Group by category
        const grouped = {};
        filteredExpenses.forEach(expense => {
            const category = expense.category || "Other";
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(expense);
        });

        return grouped;
    } catch (error) {
        console.error("Error fetching expenses by category:", error);
        return {};
    }
};

/**
 * GET: Calculate total spent per category for a date range
 * Returns object: { category: totalAmount, ... }
 * Converts Date objects to YYYY-MM-DD strings for proper date filtering
 * @param {Date|string} startDate - Start date for filtering
 * @param {Date|string} endDate - End date for filtering
 * @param {string} type - Transaction type: 'spend' or 'income' (default: 'spend')
 */
export const getCategoryTotals = async (startDate, endDate, type = 'spend') => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return {};
        }

        // Convert Date objects to YYYY-MM-DD strings for date filtering
        const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

        // Query transactions of specified type
        const expensesQuery = query(
            collection(db, "users", userId, "dailySpends"),
            where("type", "==", type)
        );

        const snap = await getDocs(expensesQuery);
        const expenses = snap.docs.map(doc => doc.data());

        // Filter by date range on client side
        const filteredExpenses = expenses.filter(exp => {
            const expDate = exp.date || exp.createdAt?.toISOString?.().split('T')[0];
            return expDate >= startDateStr && expDate <= endDateStr;
        });

        const totals = {};
        filteredExpenses.forEach(expense => {
            const category = expense.category || "Other";
            const amount = parseFloat(expense.amount) || 0;
            totals[category] = (totals[category] || 0) + amount;
        });

        return totals;
    } catch (error) {
        console.error("Error fetching category totals:", error);
        return {};
    }
};

/**
 * GET: Get summary for a specific category
 * Returns: { category, totalSpent, limit, percentage, transactions: [] }
 */
export const getCategorySummary = async (category, startDate, endDate, limit = null) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return null;
        }

        // Convert Date objects to YYYY-MM-DD strings for date filtering
        const startDateStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
        const endDateStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;

        // Query by category only (date filtering done client-side to avoid composite index)
        const expensesQuery = query(
            collection(db, "users", userId, "dailySpends"),
            where("type", "==", "spend"),
            where("category", "==", category),
            orderBy("date", "desc")
        );

        const snap = await getDocs(expensesQuery);
        let transactions = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        // Filter by date range on client side
        transactions = transactions.filter(tx => {
            const txDate = tx.date || tx.createdAt?.toISOString?.().split('T')[0];
            return txDate >= startDateStr && txDate <= endDateStr;
        });

        const totalSpent = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const percentage = limit ? Math.round((totalSpent / limit) * 100) : 0;

        return {
            category,
            totalSpent: parseFloat(totalSpent.toFixed(2)),
            limit: limit ? parseFloat(limit.toFixed(2)) : null,
            percentage: Math.min(percentage, 100),
            transactions,
        };
    } catch (error) {
        console.error("Error fetching category summary:", error);
        return null;
    }
};

/**
 * GET: Get breakdown data with all categories and their limits
 */
export const getBreakdownData = async (startDate, endDate, categoryLimits) => {
    try {
        const categoryTotals = await getCategoryTotals(startDate, endDate);

        const breakdown = {};

        // Process limits first
        categoryLimits.forEach(limit => {
            breakdown[limit.category] = {
                category: limit.category,
                totalSpent: categoryTotals[limit.category] || 0,
                limit: limit.limit,
                percentage: Math.min(
                    Math.round(((categoryTotals[limit.category] || 0) / limit.limit) * 100),
                    100
                ),
            };
        });

        // Add categories without limits
        Object.entries(categoryTotals).forEach(([category, total]) => {
            if (!breakdown[category]) {
                breakdown[category] = {
                    category,
                    totalSpent: total,
                    limit: null,
                    percentage: 0,
                };
            }
        });

        return breakdown;
    } catch (error) {
        console.error("Error fetching breakdown data:", error);
        return {};
    }
};
