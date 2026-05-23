import { categoriesApi } from '../services/api/categoriesApi';
import { ALL_PREDEFINED_CATEGORIES } from './predefinedCategories';

export const initializePredefinedCategories = async () => {
    try {
        const result = await categoriesApi.initializeCategories(
            ALL_PREDEFINED_CATEGORIES.map(c => ({
                name: c.name,
                emoji: c.emoji,
                type: c.type,
                isPredefined: true,
                isEnabled: true,
            }))
        );
        if (!result.success) throw new Error(result.error);
        return {
            success: true,
            message: result.data?.message || 'Categories initialized',
            addedCount: result.data?.addedCount ?? 0,
            totalCount: result.data?.totalCount ?? ALL_PREDEFINED_CATEGORIES.length,
            addedCategories: result.data?.addedCategories ?? [],
        };
    } catch (error) {
        console.error('Error initializing predefined categories:', error);
        return { success: false, message: error.message };
    }
};

export const isUserCategoriesInitialized = async () => {
    try {
        const result = await categoriesApi.getCategories();
        if (!result.success) return false;
        const existingNames = result.data.map(c => c.name);
        return ALL_PREDEFINED_CATEGORIES.every(c => existingNames.includes(c.name));
    } catch (error) {
        return false;
    }
};

export const ensurePredefinedCategories = async () => {
    try {
        const isInitialized = await isUserCategoriesInitialized();
        if (!isInitialized) return await initializePredefinedCategories();
        return { success: true, message: 'Predefined categories already exist', alreadyInitialized: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};
