import apiClient from '../apiClient';

export const quickAddApi = {
    parse: (text, image = null) => apiClient.post('/api/quick-add/parse', { text, image }),
};
