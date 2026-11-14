import apiClient from '../apiClient';

export const aiAccessApi = {
    getAccess: () => apiClient.get('/api/ai-access'),
};
