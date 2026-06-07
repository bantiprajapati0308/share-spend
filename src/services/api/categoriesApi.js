import apiClient from '../apiClient';

export const categoriesApi = {
    getCategories: (enabledOnly = false) =>
        apiClient.get(enabledOnly ? '/api/categories?enabled=true' : '/api/categories'),
    addCategory: (data) => apiClient.post('/api/categories', data),
    updateCategory: (id, data) => apiClient.put(`/api/categories/${id}`, data),
    deleteCategory: (id) => apiClient.delete(`/api/categories/${id}`),
    initializeCategories: (categories) => apiClient.post('/api/categories/initialize', { categories }),
};

export const categoryLimitsApi = {
    getCategoryLimits: () => apiClient.get('/api/category-limits'),
    addCategoryLimit: (data) => apiClient.post('/api/category-limits', data),
    updateCategoryLimit: (id, data) => apiClient.put(`/api/category-limits/${id}`, data),
    deleteCategoryLimit: (id) => apiClient.delete(`/api/category-limits/${id}`),
};

export const settingsApi = {
    getDateRange: () => apiClient.get('/api/settings/date-range'),
    saveDateRange: (startDate, endDate) => apiClient.put('/api/settings/date-range', { startDate, endDate }),
};
