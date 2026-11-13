const { MODEL } = require('../../config/aiConfig');

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function generateJson({ prompt, schema, image = null }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        const error = new Error('AI service not configured');
        error.code = 'NO_API_KEY';
        throw error;
    }

    const promptWithSchema = `${prompt}\n\nReturn only a valid JSON object matching this schema:\n${JSON.stringify(schema)}`;
    const content = image
        ? [
            { type: 'text', text: promptWithSchema },
            {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.data}` },
            },
        ]
        : promptWithSchema;

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content }],
            response_format: { type: 'json_object' },
        }),
    });

    let result;
    try {
        result = await response.json();
    } catch (cause) {
        const error = new Error('Groq API returned an invalid response');
        error.code = 'GROQ_INVALID_RESPONSE';
        error.cause = cause;
        throw error;
    }

    if (!response.ok) {
        const error = new Error(result?.error?.message || `Groq API request failed (${response.status})`);
        error.code = 'GROQ_API_ERROR';
        error.status = response.status;
        throw error;
    }

    const outputText = result?.choices?.[0]?.message?.content;
    if (typeof outputText !== 'string' || !outputText.trim()) {
        const error = new Error('Groq API returned an empty response');
        error.code = 'GROQ_EMPTY_RESPONSE';
        throw error;
    }

    return { ...result, output_text: outputText };
}

module.exports = { generateJson };
