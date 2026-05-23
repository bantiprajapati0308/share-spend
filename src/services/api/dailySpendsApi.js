import apiClient from '../apiClient';

export const dailySpendsApi = {
    getTransactions: (type) =>
        apiClient.get(type ? `/api/daily-spends?type=${type}` : '/api/daily-spends'),
    addTransaction: (data) => apiClient.post('/api/daily-spends', data),
    updateTransaction: (id, data) => apiClient.put(`/api/daily-spends/${id}`, data),
    deleteTransaction: (id) => apiClient.delete(`/api/daily-spends/${id}`),
};
