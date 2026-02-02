import { db, auth } from "../firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// Get all members for a trip
export const getMembers = async (tripId) => {
    const userId = auth.currentUser.uid;
    const snap = await getDocs(collection(db, "users", userId, "trips", tripId, "members"));
    return snap.docs.map(doc => doc.data().name);
};

// Get all expenses for a trip
export const getExpenses = async (tripId) => {
    const userId = auth.currentUser.uid;
    const expensesQuery = query(
        collection(db, "users", userId, "trips", tripId, "expenses"),
        orderBy("createdAt", "desc")
    );
    const snap = await getDocs(expensesQuery);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};