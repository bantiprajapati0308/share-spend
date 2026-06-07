import apiClient from '../apiClient';

export const appConfigApi = {
    getPaymentMethods: () => apiClient.get('/api/app-config/payment-methods'),
};
