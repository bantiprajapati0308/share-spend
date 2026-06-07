import { useContext, useEffect, useRef } from 'react';
import { CategoryContext } from '../context/CategoryContext.jsx';

/**
 * Custom hook to access and use category context
 * Handles initialization on first use - not on every component mount
 * Prevents unnecessary re-renders and API calls
 */
export const useCategoryContext = () => {
    const context = useContext(CategoryContext);
    const initializeRef = useRef(false);

    if (!context) {
        throw new Error('useCategoryContext must be used within CategoryProvider');
    }

    // Initialize categories only once when first needed
    useEffect(() => {
        if (!initializeRef.current && !context.isInitialized && !context.loading) {
            initializeRef.current = true;
            context.initializeCategories();
        }
    }, [context]);

    return context;
};

export default useCategoryContext;
