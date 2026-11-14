// Gemini model with image input and JSON mode support.
// This can be overridden by setting GEMINI_MODEL in the environment.
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Maximum input length sent to Gemini (configurable via env)
const MAX_INPUT_LENGTH = parseInt(process.env.GEMINI_MAX_INPUT_LENGTH || '2000', 10);

module.exports = {
    MODEL,
    MAX_INPUT_LENGTH,
};
