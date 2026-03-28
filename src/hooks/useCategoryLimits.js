import { db, auth } from "../firebase";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";

// GET: Fetch all category limits for current user
export const getCategoryLimits = async () => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return [];
        }

        const limitsQuery = query(
            collection(db, "users", userId, "categoryLimits")
        );
        const snap = await getDocs(limitsQuery);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching category limits:", error);
        return [];
    }
};

// GET: Fetch limit for a specific category in a date range
export const getCategoryLimit = async (category, startDate, endDate) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.error("User not authenticated");
            return null;
        }

        const limitsQuery = query(
            collection(db, "users", userId, "categoryLimits"),
            where("category", "==", category),
            where("startDate", "<=", startDate),
            where("endDate", ">=", endDate)
        );
        const snap = await getDocs(limitsQuery);

        if (snap.docs.length > 0) {
            return {
                id: snap.docs[0].id,
                ...snap.docs[0].data(),
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching category limit:", error);
        return null;
    }
};

// POST: Add new category limit
export const addCategoryLimit = async (limitData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const docRef = await addDoc(
            collection(db, "users", userId, "categoryLimits"),
            {
                ...limitData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }
        );

        return {
            id: docRef.id,
            ...limitData,
        };
    } catch (error) {
        console.error("Error adding category limit:", error);
        throw error;
    }
};

// PUT: Update existing category limit
export const updateCategoryLimit = async (limitId, limitData) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const limitRef = doc(db, "users", userId, "categoryLimits", limitId);
        await updateDoc(limitRef, {
            ...limitData,
            updatedAt: serverTimestamp(),
        });

        return {
            id: limitId,
            ...limitData,
        };
    } catch (error) {
        console.error("Error updating category limit:", error);
        throw error;
    }
};

// DELETE: Remove category limit
export const deleteCategoryLimit = async (limitId) => {
    try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("User not authenticated");
        }

        const limitRef = doc(db, "users", userId, "categoryLimits", limitId);
        await deleteDoc(limitRef);
    } catch (error) {
        console.error("Error deleting category limit:", error);
        throw error;
    }
};
