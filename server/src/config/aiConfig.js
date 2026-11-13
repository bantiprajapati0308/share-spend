// Groq model with image input and JSON mode support.
// This can be overridden by setting GROQ_MODEL in the environment.
const MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

// Maximum input length sent to Groq (configurable via env)
const MAX_INPUT_LENGTH = parseInt(process.env.GROQ_MAX_INPUT_LENGTH || '2000', 10);

module.exports = {
    MODEL,
    MAX_INPUT_LENGTH,
};
