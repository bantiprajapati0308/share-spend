import apiClient from '../apiClient';

export const membersApi = {
    getMembers: (tripId) => apiClient.get(`/api/trips/${tripId}/members`),
    addMember: (tripId, data) => apiClient.post(`/api/trips/${tripId}/members`, data),
    deleteMember: (tripId, memberId) => apiClient.delete(`/api/trips/${tripId}/members/${memberId}`),
};

export const expensesApi = {
    getExpenses: (tripId) => apiClient.get(`/api/trips/${tripId}/expenses`),
    addExpense: (tripId, data) => apiClient.post(`/api/trips/${tripId}/expenses`, data),
    updateExpense: (tripId, expenseId, data) => apiClient.put(`/api/trips/${tripId}/expenses/${expenseId}`, data),
    deleteExpense: (tripId, expenseId) => apiClient.delete(`/api/trips/${tripId}/expenses/${expenseId}`),
};
