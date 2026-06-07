import { categoryLimitsApi } from '../services/api/categoriesApi';

// GET: Fetch all category limits for current user
export const getCategoryLimits = async () => {
    try {
        const result = await categoryLimitsApi.getCategoryLimits();
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error fetching category limits:", error);
        return [];
    }
};

// GET: Fetch limit for a specific category in a date range (client-side filter)
// Pass `allLimits` when you already have the list to avoid a redundant API call.
export const getCategoryLimit = async (category, startDate, endDate, allLimits = null) => {
    try {
        const limits = allLimits ?? (await (async () => {
            const result = await categoryLimitsApi.getCategoryLimits();
            if (!result.success) throw new Error(result.error);
            return result.data;
        })());
        const match = limits.find(l =>
            l.category === category &&
            l.startDate <= startDate &&
            l.endDate >= endDate
        );
        return match || null;
    } catch (error) {
        console.error("Error fetching category limit:", error);
        return null;
    }
};

// POST: Add new category limit
export const addCategoryLimit = async (limitData) => {
    try {
        const result = await categoryLimitsApi.addCategoryLimit(limitData);
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error adding category limit:", error);
        throw error;
    }
};

// PUT: Update existing category limit
export const updateCategoryLimit = async (limitId, limitData) => {
    try {
        const result = await categoryLimitsApi.updateCategoryLimit(limitId, limitData);
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (error) {
        console.error("Error updating category limit:", error);
        throw error;
    }
};

// DELETE: Remove category limit
export const deleteCategoryLimit = async (limitId) => {
    try {
        const result = await categoryLimitsApi.deleteCategoryLimit(limitId);
        if (!result.success) throw new Error(result.error);
    } catch (error) {
        console.error("Error deleting category limit:", error);
        throw error;
    }
};

