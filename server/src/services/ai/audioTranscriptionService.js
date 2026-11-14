const { generateText } = require('./geminiClient');

async function transcribeAudio(audio) {
    const response = await generateText({
        prompt: 'Transcribe the spoken words in this audio accurately. Preserve the original language, including Hindi, English, or Hinglish. Return only the transcript as plain text; do not summarize, translate, or infer missing words.',
        audio,
    });
    const transcript = response.output_text.trim();
    if (!transcript) {
        const error = new Error('Gemini returned an empty audio transcription');
        error.code = 'EMPTY_TRANSCRIPTION';
        throw error;
    }
    return transcript;
}

module.exports = { transcribeAudio };
