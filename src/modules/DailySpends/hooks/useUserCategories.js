import { categoriesApi } from '../../../services/api/categoriesApi';

export const useUserCategories = () => {
    const fetchCategories = async () => {
        const result = await categoriesApi.getCategories();
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const fetchEnabledCategories = async () => {
        const result = await categoriesApi.getCategories();
        if (!result.success) throw new Error(result.error);
        return result.data.filter(c => c.isEnabled !== false);
    };

    const addCategory = async (name, emoji = '📝', type = 'spend') => {
        const result = await categoriesApi.addCategory({ name, emoji, type, isEnabled: true });
        if (!result.success) throw new Error(result.error);
        return result.data;
    };

    const updateCategory = async (categoryId, updateData) => {
        const result = await categoriesApi.updateCategory(categoryId, updateData);
        if (!result.success) throw new Error(result.error);
    };

    const disableCategory = async (categoryId) => {
        const result = await categoriesApi.updateCategory(categoryId, { isEnabled: false });
        if (!result.success) throw new Error(result.error);
    };

    const enableCategory = async (categoryId) => {
        const result = await categoriesApi.updateCategory(categoryId, { isEnabled: true });
        if (!result.success) throw new Error(result.error);
    };

    const isCategoryUsed = async () => false; // server handles this check on delete

    const deleteCategory = async (categoryId) => {
        const result = await categoriesApi.deleteCategory(categoryId);
        if (!result.success) throw new Error(result.error || 'This category is used in transactions. Disable it instead.');
        return true;
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
