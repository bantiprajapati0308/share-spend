import apiClient from '../apiClient';

export const authApi = {
    getProfile: () => apiClient.get('/api/auth/profile'),
    createOrUpdateProfile: (data) => apiClient.post('/api/auth/profile', data),
    updateProfile: (data) => apiClient.put('/api/auth/profile', data),
    updateLastLogin: () => apiClient.patch('/api/auth/last-login', {}),
    register: (data) => apiClient.post('/api/auth/register', data),
    forgotPassword: (email) => apiClient.post('/api/auth/forgot-password', { email }),
    sendVerification: () => apiClient.post('/api/auth/send-verification', {}),
};
