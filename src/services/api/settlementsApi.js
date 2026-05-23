import apiClient from '../apiClient';

export const settlementsApi = {
    getTripSettlements: (tripId) => apiClient.get(`/api/settlements?tripId=${tripId}`),
    createSettlement: (data) => apiClient.post('/api/settlements', data),
    createBatchSettlements: (settlements) => apiClient.post('/api/settlements/batch', { settlements }),
    updateTripBalances: (tripId, calculatedBalances) =>
        apiClient.patch(`/api/settlements/trips/${tripId}/balances`, { calculatedBalances }),
};
