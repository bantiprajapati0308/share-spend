import { categoriesApi } from '../services/api/categoriesApi';

/**
 * Trigger the server-side idempotent category seeder.
 * The server owns the authoritative PREDEFINED_CATEGORIES list and ignores any
 * request body — so we send none.  Safe to call multiple times.
 */
export const initializePredefinedCategories = async () => {
    try {
        const result = await categoriesApi.initializeCategories();
        if (!result.success) throw new Error(result.error);
        return {
            success: true,
            message: result.data?.message || 'Categories initialized',
            added: result.data?.added ?? 0,
        };
    } catch (error) {
        console.error('Error initializing predefined categories:', error);
        return { success: false, message: error.message };
    }
};

/**
 * Returns true when the user already has categories in the database.
 * A non-empty categories collection means seeding already ran.
 */
export const isUserCategoriesInitialized = async () => {
    try {
        const result = await categoriesApi.getCategories();
        return result.success && result.data.length > 0;
    } catch {
        return false;
    }
};

/**
 * Call the idempotent seeder only when the user has no categories yet.
 */
export const ensurePredefinedCategories = async () => {
    try {
        const initialized = await isUserCategoriesInitialized();
        if (initialized) return { success: true, message: 'Predefined categories already exist', alreadyInitialized: true };
        return await initializePredefinedCategories();
    } catch (error) {
        return { success: false, message: error.message };
    }
};

