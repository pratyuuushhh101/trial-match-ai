/**
 * Agent 4: Eligibility Reasoner (Core Agent)
 *
 * Assesses every criterion against the patient profile in a SINGLE LLM call
 * to preserve cross-criterion coherence.
 *
 * After receiving the response, validates that every criterion ID has a
 * corresponding assessment. If any are missing, re-queries for missing ones only.
 *
 * Writes to state.assessments.
 */

const { callLLM } = require('../services/llm');
const { buildReasoningPrompt } = require('../prompts/reasonCriterion.prompt');
const { ReasoningError } = require('../utils/errors');
const { log } = require('../utils/logger');

/**
 * @param {object} state - Shared pipeline state
 * @returns {object} Updated state with state.assessments populated
 */
async function eligibilityReasoner(state) {
    log('EligibilityReasoner', 'started', {
        criteriaCount: state.criteria.length,
        patientDiagnosis: state.patient.primaryDiagnosis,
    });

    const { system, user } = buildReasoningPrompt(state.patient, state.criteria);

    let rawResponse;
    let assessments;

    // Primary call — all criteria in one shot
    try {
        rawResponse = await callLLM(system, user, {
            jsonMode: true,
            temperature: 0.2,
            maxTokens: 6000,
        });
        assessments = parseJSON(rawResponse);
    } catch (firstError) {
        log('EligibilityReasoner', 'first attempt failed, retrying', { error: firstError.message });

        try {
            const retryUser = `${user}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a valid JSON array of assessment objects. No other text.`;
            rawResponse = await callLLM(system, retryUser, {
                jsonMode: true,
                temperature: 0.1,
                maxTokens: 6000,
            });
            assessments = parseJSON(rawResponse);
        } catch (retryError) {
            throw new ReasoningError(
                `Failed to complete eligibility reasoning after 2 attempts: ${retryError.message}`,
                rawResponse
            );
        }
    }

    if (!Array.isArray(assessments)) {
        throw new ReasoningError('LLM returned a non-array result for assessments', rawResponse);
    }

    // Validate and normalize assessments
    assessments = assessments.map(normalizeAssessment);

    // Check for missing criteria — every criterion ID must have a corresponding assessment
    const assessedIds = new Set(assessments.map(a => a.criterionId));
    const missingCriteria = state.criteria.filter(c => !assessedIds.has(c.id));

    if (missingCriteria.length > 0) {
        log('EligibilityReasoner', `${missingCriteria.length} criteria missing from response, re-querying`, {
            missingIds: missingCriteria.map(c => c.id),
        });

        try {
            const fillAssessments = await fetchMissingAssessments(state.patient, missingCriteria);
            assessments = assessments.concat(fillAssessments);
        } catch (fillError) {
            log('EligibilityReasoner', 'failed to fill missing assessments', { error: fillError.message });
            // Don't throw — proceed with what we have but log the gap
            state.meta.warnings.push(
                `Warning: ${missingCriteria.length} criteria could not be assessed (IDs: ${missingCriteria.map(c => c.id).join(', ')})`
            );
        }
    }

    // Sort by criterionId
    assessments.sort((a, b) => a.criterionId - b.criterionId);

    state.assessments = assessments;

    const verdictCounts = {
        MEETS: assessments.filter(a => a.verdict === 'MEETS').length,
        FAILS: assessments.filter(a => a.verdict === 'FAILS').length,
        UNCERTAIN: assessments.filter(a => a.verdict === 'UNCERTAIN').length,
    };

    log('EligibilityReasoner', 'completed', {
        totalAssessments: assessments.length,
        ...verdictCounts,
    });

    return state;
}

/**
 * Re-query the LLM for specific criteria that were missing from the initial response.
 */
async function fetchMissingAssessments(patient, missingCriteria) {
    const { system, user } = buildReasoningPrompt(patient, missingCriteria);

    const rawResponse = await callLLM(system, user, {
        jsonMode: true,
        temperature: 0.2,
        maxTokens: 3000,
    });

    const parsed = parseJSON(rawResponse);

    if (!Array.isArray(parsed)) {
        throw new ReasoningError('Fill-in response was not a JSON array', rawResponse);
    }

    return parsed.map(normalizeAssessment);
}

/**
 * Normalize an assessment object — ensure correct types and valid values.
 */
function normalizeAssessment(assessment) {
    const validVerdicts = ['MEETS', 'FAILS', 'UNCERTAIN'];
    const verdict = validVerdicts.includes(assessment.verdict)
        ? assessment.verdict
        : 'UNCERTAIN';

    return {
        criterionId: Number(assessment.criterionId),
        verdict,
        reasoning: String(assessment.reasoning || 'No reasoning provided'),
        action: verdict === 'MEETS' ? null : (assessment.action || null),
    };
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

module.exports = eligibilityReasoner;
