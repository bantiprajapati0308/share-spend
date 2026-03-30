import { db, auth } from '../../../firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';

/**
 * Manage user categories with CRUD operations
 * Stores categories in Firestore: users/{userId}/categories/{categoryId}
 */

export const useUserCategories = () => {
    const userId = auth.currentUser?.uid;

    if (!userId) {
        console.error('User not authenticated');
        return {};
    }

    const categoriesCollection = collection(db, 'users', userId, 'categories');

    /**
     * Fetch all categories for the user
     * @returns {Promise<Array>} - Array of category objects with id
     */
    const fetchCategories = async () => {
        try {
            const snapshot = await getDocs(categoriesCollection);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw error;
        }
    };

    /**
     * Fetch only enabled categories
     * @returns {Promise<Array>} - Array of enabled category objects
     */
    const fetchEnabledCategories = async () => {
        try {
            const q = query(categoriesCollection, where('isEnabled', '==', true));
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
        } catch (error) {
            console.error('Error fetching enabled categories:', error);
            throw error;
        }
    };

    /**
     * Add a new category
     * @param {string} name - Category name
     * @param {string} emoji - Category emoji
     * @param {string} type - Category type: 'spend' or 'income' (default: 'spend')
     * @returns {Promise<Object>} - Created category with id
     */
    const addCategory = async (name, emoji = '📝', type = 'spend') => {
        try {
            // Check if category name already exists
            const existing = query(
                categoriesCollection,
                where('name', '==', name)
            );
            const snapshot = await getDocs(existing);

            if (snapshot.docs.length > 0) {
                throw new Error(`Category "${name}" already exists`);
            }

            const newCategory = {
                name,
                emoji,
                type, // 'spend' or 'income'
                isEnabled: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(categoriesCollection, newCategory);

            return {
                id: docRef.id,
                ...newCategory,
            };
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    };

    /**
     * Update category details (name or emoji)
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Data to update { name, emoji }
     * @returns {Promise<void>}
     */
    const updateCategory = async (categoryId, updateData) => {
        try {
            const categoryRef = doc(categoriesCollection, categoryId);
            await updateDoc(categoryRef, {
                ...updateData,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating category:', error);
            throw error;
        }
    };

    /**
     * Disable a category (instead of deleting)
     * Category will not appear in dropdowns but data is preserved
     * @param {string} categoryId - Category ID
     * @returns {Promise<void>}
     */
    const disableCategory = async (categoryId) => {
        try {
            const categoryRef = doc(categoriesCollection, categoryId);
            await updateDoc(categoryRef, {
                isEnabled: false,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error disabling category:', error);
            throw error;
        }
    };

    /**
     * Enable a disabled category
     * @param {string} categoryId - Category ID
     * @returns {Promise<void>}
     */
    const enableCategory = async (categoryId) => {
        try {
            const categoryRef = doc(categoriesCollection, categoryId);
            await updateDoc(categoryRef, {
                isEnabled: true,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error enabling category:', error);
            throw error;
        }
    };

    /**
     * Check if category is used in any transactions
     * @param {string} categoryId - Category ID
     * @returns {Promise<boolean>} - True if category is used
     */
    const isCategoryUsed = async (categoryId) => {
        try {
            const dailySpendsCol = collection(db, 'users', userId, 'dailySpends');
            const q = query(dailySpendsCol, where('categoryId', '==', categoryId));
            const snapshot = await getDocs(q);
            return snapshot.docs.length > 0;
        } catch (error) {
            console.error('Error checking category usage:', error);
            throw error;
        }
    };

    /**
     * Delete a category only if not used in any transactions
     * @param {string} categoryId - Category ID
     * @returns {Promise<boolean>} - True if deleted, false if in use
     */
    const deleteCategory = async (categoryId) => {
        try {
            const isUsed = await isCategoryUsed(categoryId);
            if (isUsed) {
                throw new Error(
                    'This category is used in transactions. Disable it instead.'
                );
            }

            const categoryRef = doc(categoriesCollection, categoryId);
            await deleteDoc(categoryRef);
            return true;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    };

    return {
        fetchCategories,
        fetchEnabledCategories,
        addCategory,
        updateCategory,
        disableCategory,
        enableCategory,
        isCategoryUsed,
        deleteCategory,
    };
};

export default useUserCategories;
