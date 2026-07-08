import apiClient from '../apiClient';

export const borrowLendApi = {
    getRecords: () => apiClient.get('/api/borrow-lend'),
    getPersonNames: (type) => {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        const qs = params.toString();
        return apiClient.get(`/api/borrow-lend/person-names${qs ? `?${qs}` : ''}`);
    },
    addRecord: (data) => apiClient.post('/api/borrow-lend', data),
    addRepayment: (data) => apiClient.post('/api/borrow-lend/repayment', data),
    updateContact: (id, data) => apiClient.patch(`/api/borrow-lend/${id}/contact`, data),
    archiveEntry: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/archive`, {}),
    unarchiveEntry: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/unarchive`, {}),
    toggleMarkDone: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/mark-done`, {}),
    deleteEntry: (uuid) => apiClient.delete(`/api/borrow-lend/entries/${uuid}`),
};
