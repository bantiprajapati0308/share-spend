import apiClient from '../apiClient';

export const quickAddApi = {
    parse: (text) => apiClient.post('/api/quick-add/parse', { text }),
};
