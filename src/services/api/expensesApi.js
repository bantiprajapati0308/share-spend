import apiClient from '../apiClient';

export const membersApi = {
    getMembers: (tripId) => apiClient.get(`/api/trips/${tripId}/members`),
    getMembersBriefDetails: (tripId) => apiClient.get(`/api/trips/${tripId}/members/brief`),
    addMember: (tripId, data) => apiClient.post(`/api/trips/${tripId}/members`, data),
    resendInvite: (tripId, memberId) => apiClient.post(`/api/trips/${tripId}/members/${memberId}/resend`),
    deleteMember: (tripId, memberId) => apiClient.delete(`/api/trips/${tripId}/members/${memberId}`),
};

export const expensesApi = {
    getExpenses: (tripId) => apiClient.get(`/api/trips/${tripId}/expenses`),
    addExpense: (tripId, data) => apiClient.post(`/api/trips/${tripId}/expenses`, data),
    updateExpense: (tripId, expenseId, data) => apiClient.put(`/api/trips/${tripId}/expenses/${expenseId}`, data),
    deleteExpense: (tripId, expenseId) => apiClient.delete(`/api/trips/${tripId}/expenses/${expenseId}`),
};
