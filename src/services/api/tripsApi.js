import apiClient from '../apiClient';

export const tripsApi = {
    getTrips: () => apiClient.get('/api/trips'),
    addTrip: (data) => apiClient.post('/api/trips', data),
    updateTrip: (tripId, data) => apiClient.put(`/api/trips/${tripId}`, data),
    deleteTrip: (tripId) => apiClient.delete(`/api/trips/${tripId}`),
};
