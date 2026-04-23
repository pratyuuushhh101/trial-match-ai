/**
 * Agent 3: Criteria Parser
 *
 * Takes raw eligibility text block and segments it into
 * individual criterion objects using the LLM.
 * Writes to state.criteria.
 */

const { callLLM } = require('../services/llm');
const { buildParseCriteriaPrompt } = require('../prompts/parseCriteria.prompt');
const { CriteriaParseError } = require('../utils/errors');
const { log } = require('../utils/logger');

/**
 * @param {object} state - Shared pipeline state
 * @returns {object} Updated state with state.criteria populated
 */
async function criteriaParser(state) {
    log('CriteriaParser', 'started', {
        eligibilityTextLength: state.trial.eligibilityRaw.length,
    });

    const { system, user } = buildParseCriteriaPrompt(state.trial.eligibilityRaw);

    let rawResponse;
    let parsed;

    try {
        rawResponse = await callLLM(system, user, { jsonMode: true, temperature: 0.1 });
        parsed = parseJSON(rawResponse);
    } catch (firstError) {
        log('CriteriaParser', 'first attempt failed, retrying', { error: firstError.message });

        try {
            const retryUser = `${user}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a valid JSON array of criterion objects. No other text.`;
            rawResponse = await callLLM(system, retryUser, { jsonMode: true, temperature: 0.0 });
            parsed = parseJSON(rawResponse);
        } catch (retryError) {
            throw new CriteriaParseError(
                `Failed to parse criteria after 2 attempts: ${retryError.message}`,
                rawResponse
            );
        }
    }

    // Validate the parsed result
    if (!Array.isArray(parsed)) {
        throw new CriteriaParseError('LLM returned a non-array result for criteria parsing', rawResponse);
    }

    if (parsed.length === 0) {
        throw new CriteriaParseError('LLM returned an empty criteria array', rawResponse);
    }

    // Validate each criterion object
    const validatedCriteria = parsed.map((item, index) => {
        if (!item.text || typeof item.text !== 'string') {
            throw new CriteriaParseError(
                `Criterion at index ${index} is missing required "text" field`,
                rawResponse
            );
        }

        return {
            id: item.id || index + 1,
            type: (item.type === 'exclusion') ? 'exclusion' : 'inclusion',
            text: item.text.trim(),
        };
    });

    state.criteria = validatedCriteria;

    log('CriteriaParser', 'completed', {
        totalCriteria: validatedCriteria.length,
        inclusion: validatedCriteria.filter(c => c.type === 'inclusion').length,
        exclusion: validatedCriteria.filter(c => c.type === 'exclusion').length,
    });

    return state;
}

/**
 * Parse JSON from LLM response, stripping markdown fences if present.
 */
function parseJSON(text) {
    let cleaned = text.trim();

    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(cleaned);
}

module.exports = criteriaParser;
