import apiClient from '../apiClient';

export const borrowLendApi = {
    getRecords: () => apiClient.get('/api/borrow-lend'),
    addRecord: (data) => apiClient.post('/api/borrow-lend', data),
    addRepayment: (data) => apiClient.post('/api/borrow-lend/repayment', data),
    archiveEntry: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/archive`, {}),
    unarchiveEntry: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/unarchive`, {}),
    toggleMarkDone: (uuid) => apiClient.patch(`/api/borrow-lend/entries/${uuid}/mark-done`, {}),
    deleteEntry: (uuid) => apiClient.delete(`/api/borrow-lend/entries/${uuid}`),
};
