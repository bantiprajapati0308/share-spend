import apiClient from '../apiClient';

export const audioTranscriptionApi = {
    transcribe: (audio) => apiClient.post('/api/quick-add/transcribe', { audio }),
};
