import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query, where } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

// GET: Fetch all transactions for current user
export const getTransactions = async () => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return [];
        }

        const transactionsQuery = query(
            collection(db, "users", userId, "dailySpends"),
            orderBy("createdAt", "desc")
        );
        const snap = await getDocs(transactionsQuery);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));
    } catch (error) {
        console.error("Error fetching transactions:", error);
        return [];
    }
};

// GET: Fetch transactions by type (spend/income)
export const getTransactionsByType = async (type) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return [];
        }

        const transactionsQuery = query(
            collection(db, "users", userId, "dailySpends"),
            where("type", "==", type)
        );
        const snap = await getDocs(transactionsQuery);
        const transactions = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
        }));

        // Sort by date (newest first)
        return transactions.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
        });
    } catch (error) {
        console.error("Error fetching transactions by type:", error);
        return [];
    }
};

// POST: Add a new transaction
export const addTransaction = async (transactionData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const dataToSave = {
            ...transactionData,
            createdAt: serverTimestamp(),
            userId: userId,
        };

        const docRef = await addDoc(collection(db, "users", userId, "dailySpends"), dataToSave);
        return { id: docRef.id, ...dataToSave };
    } catch (error) {
        console.error("Error adding transaction:", error);
        throw error;
    }
};

// UPDATE: Update an existing transaction
export const updateTransaction = async (transactionId, transactionData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const transactionRef = doc(db, "users", userId, "dailySpends", transactionId);
        await updateDoc(transactionRef, {
            ...transactionData,
            updatedAt: serverTimestamp(),
        });
        return { id: transactionId, ...transactionData };
    } catch (error) {
        console.error("Error updating transaction:", error);
        throw error;
    }
};

// DELETE: Remove a transaction
export const deleteTransaction = async (transactionId) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }
        await deleteDoc(doc(db, "users", userId, "dailySpends", transactionId));
        return true;
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
