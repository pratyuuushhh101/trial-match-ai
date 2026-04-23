/**
 * Agent 1: Patient Extractor
 *
 * Receives raw free-text patient summary.
 * Calls LLM to extract structured patient profile.
 * Writes to state.patient.
 *
 * Retry logic: if LLM returns malformed JSON, retries once with explicit JSON-only instruction.
 * Throws PatientExtractionError after two failures.
 */

const { callLLM } = require('../services/llm');
const { buildExtractPatientPrompt } = require('../prompts/extractPatient.prompt');
const { PatientExtractionError } = require('../utils/errors');
const { log } = require('../utils/logger');

/**
 * @param {object} state - Shared pipeline state
 * @returns {object} Updated state with state.patient populated
 */
async function patientExtractor(state) {
    log('PatientExtractor', 'started');

    const { system, user } = buildExtractPatientPrompt(state.raw.patientSummary);

    let rawResponse;
    let parsed;

    // First attempt
    try {
        rawResponse = await callLLM(system, user, { jsonMode: true, temperature: 0.1 });
        parsed = parseJSON(rawResponse);
    } catch (firstError) {
        log('PatientExtractor', 'first attempt failed, retrying with explicit JSON instruction', {
            error: firstError.message,
        });

        // Retry once with an explicit instruction
        try {
            const retryUser = `${user}\n\nIMPORTANT: Your previous response was not valid JSON. You MUST return ONLY a valid JSON object with no additional text, no markdown fences, no explanations. Return the raw JSON object only.`;
            rawResponse = await callLLM(system, retryUser, { jsonMode: true, temperature: 0.0 });
            parsed = parseJSON(rawResponse);
        } catch (retryError) {
            log('PatientExtractor', 'retry failed', { error: retryError.message });
            throw new PatientExtractionError(
                `Failed to extract patient data after 2 attempts: ${retryError.message}`,
                rawResponse
            );
        }
    }

    // Populate state.patient with extracted data, using defaults for missing fields
    state.patient = {
        primaryDiagnosis: parsed.primaryDiagnosis || null,
        stage: parsed.stage || null,
        comorbidities: Array.isArray(parsed.comorbidities) ? parsed.comorbidities : [],
        currentMedications: Array.isArray(parsed.currentMedications) ? parsed.currentMedications : [],
        priorTreatments: Array.isArray(parsed.priorTreatments) ? parsed.priorTreatments : [],
        keyLabValues: (parsed.keyLabValues && typeof parsed.keyLabValues === 'object') ? parsed.keyLabValues : {},
        ecogScore: parsed.ecogScore != null ? Number(parsed.ecogScore) : null,
        age: parsed.age != null ? Number(parsed.age) : null,
        sex: parsed.sex || null,
        otherFlags: Array.isArray(parsed.otherFlags) ? parsed.otherFlags : [],
    };

    log('PatientExtractor', 'completed', {
        diagnosis: state.patient.primaryDiagnosis,
        age: state.patient.age,
        criteriaCount: Object.keys(state.patient.keyLabValues).length,
    });

    return state;
}

/**
 * Attempt to parse JSON from LLM response, stripping markdown fences if present.
 */
function parseJSON(text) {
    let cleaned = text.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    return JSON.parse(cleaned);
}

module.exports = patientExtractor;
