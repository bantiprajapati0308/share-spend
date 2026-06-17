import apiClient from '../apiClient';

export const tripsApi = {
    getTrips: () => apiClient.get('/api/trips'),
    addTrip: (data) => apiClient.post('/api/trips', data),
    updateTrip: (tripId, data) => apiClient.put(`/api/trips/${tripId}`, data),
    deleteTrip: (tripId) => apiClient.delete(`/api/trips/${tripId}`),

    // Invite management (trip-scoped, owner only)
    getInvitesForTrip: (tripId) => apiClient.get(`/api/trips/${tripId}/invites`),
    createInvite: (tripId, email) => apiClient.post(`/api/trips/${tripId}/invites`, { email }),

    // Registered trip members (user accounts)
    getTripMembers: (tripId) => apiClient.get(`/api/trips/${tripId}/trip-members`),
    removeTripMember: (tripId, memberId) => apiClient.delete(`/api/trips/${tripId}/trip-members/${memberId}`),
};
