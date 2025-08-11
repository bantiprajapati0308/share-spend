import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

// POST: Add expense to a trip
export const addExpense = async (tripId, expenseData) => {
    const userId = auth.currentUser.uid;
    return await addDoc(collection(db, "users", userId, "trips", tripId, "expenses"), expenseData);
};

// GET: Fetch all expenses for a trip
export const getExpenses = async (tripId) => {
    const userId = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "users", userId, "trips", tripId, "expenses"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// DELETE: Remove expense from a trip
export const deleteExpense = async (tripId, expenseId) => {
    const userId = auth.currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "trips", tripId, "expenses", expenseId));
};

// UPDATE: Update an existing expense
export const updateExpense = async (tripId, expenseId, expenseData) => {
    const userId = auth.currentUser.uid;
    await updateDoc(doc(db, "users", userId, "trips", tripId, "expenses", expenseId), expenseData);
};