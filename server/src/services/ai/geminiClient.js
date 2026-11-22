const { MODEL } = require('../../config/aiConfig');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function logTokenUsage(usageLabel, usageMetadata = {}) {
    if (!usageLabel) return;
    const inputTokens = usageMetadata.promptTokenCount;
    const outputTokens = usageMetadata.candidatesTokenCount;
    console.info(
        `[${usageLabel}] Gemini token usage:`,
        `input=${Number.isFinite(inputTokens) ? inputTokens : 'unavailable'}`,
        `output=${Number.isFinite(outputTokens) ? outputTokens : 'unavailable'}`
    );
}

async function generateContent(parts, generationConfig, usageLabel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = new Error('Gemini API key is not configured');
        error.code = 'NO_API_KEY';
        throw error;
    }

    let response;
    try {
        response = await fetch(`${GEMINI_API_URL}/${encodeURIComponent(MODEL)}:generateContent`, {
            method: 'POST',
            headers: {
                'x-goog-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig,
            }),
        });
    } catch (error) {
        logTokenUsage(usageLabel);
        throw error;
    }

    let result;
    try {
        result = await response.json();
    } catch (cause) {
        logTokenUsage(usageLabel);
        const error = new Error('Gemini API returned an invalid response');
        error.code = 'GEMINI_INVALID_RESPONSE';
        error.cause = cause;
        throw error;
    }

    logTokenUsage(usageLabel, result?.usageMetadata);

    if (!response.ok) {
        const error = new Error(result?.error?.message || `Gemini API request failed (${response.status})`);
        error.code = 'GEMINI_API_ERROR';
        error.status = response.status;
        throw error;
    }

    const outputText = result?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter((text) => typeof text === 'string')
        .join('');
    if (typeof outputText !== 'string' || !outputText.trim()) {
        const blockReason = result?.promptFeedback?.blockReason;
        const error = new Error(blockReason
            ? `Gemini did not generate a response (${blockReason})`
            : 'Gemini API returned an empty response');
        error.code = 'GEMINI_EMPTY_RESPONSE';
        throw error;
    }

    return { ...result, output_text: outputText };
}

async function generateJson({ prompt, schema, image = null, usageLabel = null }) {
    const parts = [{ text: prompt }];
    if (image) {
        parts.push({
            inlineData: {
                mimeType: image.mimeType,
                data: image.data,
            },
        });
    }

    return generateContent(parts, {
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
        temperature: 0.2,
    }, usageLabel);
}

module.exports = { generateJson };
