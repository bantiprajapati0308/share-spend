import { db, auth } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
} from 'firebase/firestore';
import { ALL_PREDEFINED_CATEGORIES } from './predefinedCategories';

/**
 * Initialize predefined categories for a new user
 * Checks if categories already exist to prevent duplication
 * Only adds missing predefined categories
 * @returns {Promise<Object>} - Result with status and details
 */
export const initializePredefinedCategories = async () => {
    try {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            return { success: false, message: 'User not authenticated' };
        }

        const categoriesCollection = collection(db, 'users', userId, 'categories');

        // Fetch existing categories
        const existingSnapshot = await getDocs(categoriesCollection);
        const existingCategories = existingSnapshot.docs.map(doc => doc.data());
        const existingCategoryNames = existingCategories.map(cat => cat.name);

        // Find categories that need to be added
        const categoriesToAdd = ALL_PREDEFINED_CATEGORIES.filter(
            predefinedCat => !existingCategoryNames.includes(predefinedCat.name)
        );

        if (categoriesToAdd.length === 0) {
            return {
                success: true,
                message: 'Categories already initialized',
                addedCount: 0,
                totalCount: ALL_PREDEFINED_CATEGORIES.length
            };
        }

        // Add missing predefined categories
        const addedCategories = [];
        for (const category of categoriesToAdd) {
            try {
                const docRef = await addDoc(categoriesCollection, {
                    name: category.name,
                    emoji: category.emoji,
                    type: category.type,
                    isPredefined: true,
                    isEnabled: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                addedCategories.push({
                    id: docRef.id,
                    ...category,
                });
            } catch (error) {
                console.error(`Error adding predefined category ${category.name}:`, error);
            }
        }


        return {
            success: true,
            message: `Initialized ${addedCategories.length} categories`,
            addedCount: addedCategories.length,
            totalCount: existingCategories.length + addedCategories.length,
            addedCategories,
        };
    } catch (error) {
        console.error('Error initializing predefined categories:', error);
        return {
            success: false,
            message: error.message,
            error
        };
    }
};

/**
 * Check if user has been initialized with predefined categories
 * @returns {Promise<boolean>} - True if all predefined categories exist
 */
export const isUserCategoriesInitialized = async () => {
    try {
        const userId = auth.currentUser?.uid;

        if (!userId) {
            return false;
        }

        const categoriesCollection = collection(db, 'users', userId, 'categories');
        const snapshot = await getDocs(categoriesCollection);
        const existingCategories = snapshot.docs.map(doc => doc.data());
        const existingCategoryNames = existingCategories.map(cat => cat.name);

        // Check if all predefined categories exist
        const allExist = ALL_PREDEFINED_CATEGORIES.every(
            predefinedCat => existingCategoryNames.includes(predefinedCat.name)
        );

        return allExist;
    } catch (error) {
        console.error('Error checking category initialization:', error);
        return false;
    }
};

/**
 * Ensure user has all predefined categories
 * Initializes if not already done
 * @returns {Promise<Object>} - Result object
 */
export const ensurePredefinedCategories = async () => {
    try {
        const isInitialized = await isUserCategoriesInitialized();

        if (!isInitialized) {
            return await initializePredefinedCategories();
        }

        return {
            success: true,
            message: 'Predefined categories already exist',
            alreadyInitialized: true,
        };
    } catch (error) {
        console.error('Error ensuring predefined categories:', error);
        return {
            success: false,
            message: error.message,
            error
        };
    }
};
