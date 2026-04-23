/**
 * LLM Client Wrapper — services/llm.js
 *
 * CRITICAL FILE: This is the ONLY file that talks to the LLM.
 * Uses the OpenAI SDK with a configurable base URL.
 * Works for Groq, GLM-5.1, and OpenAI — only env vars change.
 *
 * Zero code changes needed to swap providers:
 *   Groq:   LLM_BASE_URL=https://api.groq.com/openai/v1
 *   GLM:    LLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
 *   OpenAI: LLM_BASE_URL=https://api.openai.com/v1
 */

const OpenAI = require('openai');
const { LLMError } = require('../utils/errors');
const { log } = require('../utils/logger');

// Load environment
require('dotenv').config();

const client = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
    baseURL: process.env.LLM_BASE_URL,
});

/**
 * Call the LLM with a system + user prompt via OpenAI-compatible chat completions.
 *
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userPrompt - User-level content/query
 * @param {object} [options]
 * @param {number} [options.temperature=0.2] - Lower = more consistent
 * @param {number} [options.maxTokens=4000] - Max response tokens
 * @param {boolean} [options.jsonMode=false] - Instruct model to return JSON only
 * @returns {Promise<string>} Raw text content of the LLM response
 * @throws {LLMError} On any provider/network/parse error
 */
async function callLLM(systemPrompt, userPrompt, options = {}) {
    const { temperature = 0.2, maxTokens = 4000, jsonMode = false } = options;

    const provider = process.env.LLM_PROVIDER || 'groq';
    const model = process.env.LLM_MODEL || 'llama-4-maverick-17b-128e-instruct';

    if (!process.env.LLM_API_KEY || process.env.LLM_API_KEY === 'your_groq_api_key_here') {
        throw new LLMError('LLM_API_KEY is not set in environment variables', provider, model, null);
    }

    log('LLM', `calling ${provider}/${model}`, {
        promptLength: systemPrompt.length + userPrompt.length,
        temperature,
        maxTokens,
        jsonMode,
    });

    const startTime = Date.now();

    try {
        const requestBody = {
            model,
            temperature,
            max_tokens: maxTokens,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
        };

        // Enable JSON mode if supported by the provider
        if (jsonMode) {
            requestBody.response_format = { type: 'json_object' };
        }

        const response = await client.chat.completions.create(requestBody);

        const responseText = response.choices[0].message.content;

        if (!responseText) {
            throw new LLMError('LLM returned empty response content', provider, model, response);
        }

        const elapsed = Date.now() - startTime;
        log('LLM', `response received in ${elapsed}ms`, { responseLength: responseText.length });

        return responseText;
    } catch (error) {
        if (error instanceof LLMError) throw error;

        const elapsed = Date.now() - startTime;
        log('LLM', `call failed after ${elapsed}ms`, { error: error.message });

        throw new LLMError(
            `LLM call failed: ${error.message}`,
            provider,
            model,
            error.response || null
        );
    }
}

module.exports = { callLLM };
