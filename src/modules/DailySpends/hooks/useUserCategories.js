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
        return result.data.filter(c => c.isEnable !== false);
    };

    const addCategory = async (name, emoji = '📝', type = 'spend') => {
        // id and noDeletable are assigned server-side; isEnable defaults to true in the controller.
        const result = await categoriesApi.addCategory({ name, emoji, type });
        if (!result.success) throw new Error(result.error);
        return result.data; // { id, name, emoji, type, noDeletable: false, isEnable: true }
    };

    const updateCategory = async (categoryId, updateData) => {
        const result = await categoriesApi.updateCategory(categoryId, updateData);
        if (!result.success) throw new Error(result.error);
    };

    const disableCategory = async (categoryId) => {
        const result = await categoriesApi.updateCategory(categoryId, { isEnable: false });
        if (!result.success) throw new Error(result.error);
    };

    const enableCategory = async (categoryId) => {
        const result = await categoriesApi.updateCategory(categoryId, { isEnable: true });
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
