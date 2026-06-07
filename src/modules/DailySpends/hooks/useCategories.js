import { useState, useEffect } from 'react';

const PREDEFINED_CATEGORIES = [
    { value: 'Food', label: 'Food', emoji: '🍔', isPredefined: true },
    { value: 'Transport', label: 'Transport', emoji: '🚗', isPredefined: true },
    { value: 'Entertainment', label: 'Entertainment', emoji: '🎬', isPredefined: true },
    { value: 'Shopping', label: 'Shopping', emoji: '🛍️', isPredefined: true },
    { value: 'Utilities', label: 'Utilities', emoji: '💡', isPredefined: true },
    { value: 'Health', label: 'Health', emoji: '🏥', isPredefined: true },
    { value: 'Other', label: 'Other', emoji: '📝', isPredefined: true }
];

const STORAGE_KEY = 'expenseCategories';

export const useCategories = () => {
    const [customCategories, setCustomCategories] = useState([]);
    const [allCategories, setAllCategories] = useState(PREDEFINED_CATEGORIES);

    // Load custom categories from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setCustomCategories(parsed);
                updateAllCategories(parsed);
            } catch (error) {
                console.error('Failed to load categories:', error);
            }
        }
    }, []);

    const updateAllCategories = (custom) => {
        const combined = [...PREDEFINED_CATEGORIES, ...custom];
        setAllCategories(combined);
    };

    // Add a new custom category with duplicate checking
    const addCategory = (categoryName, emoji = '📌') => {
        // Check if category already exists (case-insensitive)
        const exists = allCategories.some(
            cat => cat.value.toLowerCase() === categoryName.toLowerCase()
        );

        if (exists) {
            return {
                success: false,
                error: `Category "${categoryName}" already exists!`
            };
        }

        // Validate category name
        if (!categoryName.trim()) {
            return {
                success: false,
                error: 'Category name cannot be empty!'
            };
        }

        if (categoryName.length > 30) {
            return {
                success: false,
                error: 'Category name must be 30 characters or less!'
            };
        }

        const newCategory = {
            value: categoryName,
            label: categoryName,
            emoji: emoji,
            isPredefined: false,
            createdAt: new Date().toISOString()
        };

        const updated = [...customCategories, newCategory];
        setCustomCategories(updated);
        updateAllCategories(updated);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return {
            success: true,
            message: `Category "${categoryName}" added successfully!`
        };
    };

    // Delete a custom category (not predefined)
    const deleteCategory = (categoryValue) => {
        const category = customCategories.find(cat => cat.value === categoryValue);

        if (!category) {
            return {
                success: false,
                error: 'Category not found!'
            };
        }

        const updated = customCategories.filter(cat => cat.value !== categoryValue);
        setCustomCategories(updated);
        updateAllCategories(updated);

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        return {
            success: true,
            message: `Category "${categoryValue}" deleted successfully!`
        };
    };

    // Get all categories formatted for react-select
    const getCategoriesForSelect = () => {
        return allCategories.map(cat => ({
            ...cat,
            label: `${cat.emoji} ${cat.label}`,
            icon: cat.emoji
        }));
    };

    // Get category by value (to find emoji, etc.)
    const getCategoryByValue = (value) => {
        return allCategories.find(cat => cat.value === value);
    };

    return {
        allCategories,
        customCategories,
        predefinedCategories: PREDEFINED_CATEGORIES,
        addCategory,
        deleteCategory,
        getCategoriesForSelect,
        getCategoryByValue
    };
};

export default useCategories;
