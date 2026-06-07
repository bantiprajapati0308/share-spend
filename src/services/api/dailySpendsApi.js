import apiClient from '../apiClient';

export const dailySpendsApi = {
    /**
     * Fetch transactions.
     * Pass { startDate, endDate } (YYYY-MM-DD strings) to let the server filter
     * by the `date` field — avoids loading the entire collection.
     * Pass { type } to filter by transaction type (legacy; not used when dates given).
     */
    getTransactions: ({ type, startDate, endDate } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (type && !startDate) params.set('type', type); // type only when no date range
        const qs = params.toString();
        return apiClient.get(`/api/daily-spends${qs ? `?${qs}` : ''}`);
    },
    addTransaction: (data) => apiClient.post('/api/daily-spends', data),
    updateTransaction: (id, data) => apiClient.put(`/api/daily-spends/${id}`, data),
    deleteTransaction: (id) => apiClient.delete(`/api/daily-spends/${id}`),
};
