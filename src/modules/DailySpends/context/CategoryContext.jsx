import { createContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUserCategories } from '../hooks/useUserCategories';

/**
 * Global category context to manage category state across the application
 * Prevents the need to fetch categories on every component mount
 * Ensures real-time updates when new categories are added
 */
export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const { fetchCategories: fetchAllCategories, addCategory: dbAddCategory } = useUserCategories();

    /**
     * Initialize categories - called once when app starts
     * Uses lazy initialization to avoid multiple fetches
     */
    const initializeCategories = useCallback(async () => {
        if (isInitialized) return;

        try {
            setLoading(true);
            setError(null);
            const data = await fetchAllCategories();
            setCategories(data);
            setIsInitialized(true);
        } catch (err) {
            console.error('Error initializing categories:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [fetchAllCategories, isInitialized]);

    /**
     * Fetch enabled categories of a specific type
     * Returns from state instantly if available
     */
    const getCategoriesByType = useCallback((type) => {
        if (!categories.length) return [];
        return categories.filter(
            cat => cat.isEnabled && cat.type === type
        );
    }, [categories]);

    /**
     * Get all enabled categories
     */
    const getEnabledCategories = useCallback(() => {
        return categories.filter(cat => cat.isEnabled);
    }, [categories]);

    /**
     * Add a new category and update state immediately
     * This prevents the need for page refresh
     */
    const addNewCategory = useCallback(async (name, emoji, type) => {
        try {
            setError(null);
            const newCategory = await dbAddCategory(name, emoji, type);

            // Update state immediately for instant UI update
            setCategories(prev => [newCategory, ...prev]);

            return newCategory;
        } catch (err) {
            console.error('Error adding category:', err);
            setError(err.message);
            throw err;
        }
    }, [dbAddCategory]);

    /**
     * Update category in state after database update
     */
    const updateCategoryInState = useCallback((categoryId, updateData) => {
        setCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId ? { ...cat, ...updateData } : cat
            )
        );
    }, []);

    /**
     * Remove category from state
     */
    const removeCategoryFromState = useCallback((categoryId) => {
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }, []);

    const value = {
        // State
        categories,
        loading,
        error,
        isInitialized,

        // Methods
        initializeCategories,
        getCategoriesByType,
        getEnabledCategories,
        addNewCategory,
        updateCategoryInState,
        removeCategoryFromState,
    };

    return (
        <CategoryContext.Provider value={value}>
            {children}
        </CategoryContext.Provider>
    );
};

CategoryProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

