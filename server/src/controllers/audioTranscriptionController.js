const { ok, fail, badRequest } = require('../utils/response');
const { transcribeAudio } = require('../services/ai/audioTranscriptionService');

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/aac',
    'audio/flac',
]);

const transcribe = async (req, res) => {
    try {
        const { audio } = req.body || {};
        if (!audio || typeof audio.data !== 'string' || typeof audio.mimeType !== 'string') {
            return badRequest(res, 'Record an audio description first');
        }

        const mimeType = audio.mimeType.split(';')[0].trim().toLowerCase();
        if (!ALLOWED_AUDIO_TYPES.has(mimeType)) {
            return badRequest(res, 'Use a supported audio recording format');
        }
        if (!/^[A-Za-z0-9+/]+={0,2}$/.test(audio.data)) {
            return badRequest(res, 'The audio data is invalid');
        }

        const audioBuffer = Buffer.from(audio.data, 'base64');
        if (!audioBuffer.length || audioBuffer.length > MAX_AUDIO_BYTES) {
            return badRequest(res, 'Audio recording must be smaller than 2 MB');
        }

        const transcript = await transcribeAudio({
            data: audioBuffer.toString('base64'),
            mimeType,
        });
        return ok(res, { transcript });
    } catch (err) {
        console.error('[audioTranscriptionController] Error transcribing audio:', err?.message || err);
        if (err.code === 'NO_API_KEY') {
            return fail(res, 'AI service is not configured. Please contact your application owner.', 503);
        }
        if (err.code === 'EMPTY_TRANSCRIPTION') {
            return fail(res, 'No speech could be recognized. Try recording again.', 422);
        }
        const providerMessage = String(err.message || '').toLowerCase();
        const billingOrQuotaIssue = /billing|free tier|project unavailable|no credits|quota exceeded|exceeded.*quota|billing account|resource exhausted/.test(providerMessage);
        if (billingOrQuotaIssue) {
            return fail(res, 'AI transcription is unavailable because of a billing or quota issue. Please contact your application owner.', 503);
        }
        if (err.status === 429) {
            return fail(res, 'AI transcription is temporarily rate-limited. Please try again later.', 503);
        }
        if (['GEMINI_API_ERROR', 'GEMINI_INVALID_RESPONSE', 'GEMINI_EMPTY_RESPONSE'].includes(err.code)) {
            return fail(res, 'AI generation failed while transcribing audio. Please try again.', 502);
        }
        return fail(res, 'AI generation failed while transcribing audio. Please try again.', 500);
    }
};

module.exports = { transcribe };
