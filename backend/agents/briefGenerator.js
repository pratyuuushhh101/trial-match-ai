/**
 * Agent 5: Brief Generator
 *
 * Synthesizes the assessment array into a final coordinator brief.
 * The criteria table is NOT built here — it's built on the frontend
 * by joining state.criteria and state.assessments.
 *
 * Calls LLM only for narrative sections: recommendation, summary, openQuestions.
 * Disclaimer is hardcoded.
 */

const { callLLM } = require('../services/llm');
const { buildBriefPrompt } = require('../prompts/generateBrief.prompt');
const { log } = require('../utils/logger');

const DISCLAIMER = 'Trially is a research coordination tool. All eligibility assessments must be reviewed by a qualified physician before any enrollment decision. This tool does not constitute medical advice.';

/**
 * @param {object} state - Shared pipeline state
 * @returns {object} Updated state with state.brief populated
 */
async function briefGenerator(state) {
    log('BriefGenerator', 'started', {
        assessmentCount: state.assessments.length,
    });

    const { system, user } = buildBriefPrompt(state.patient, state.trial, state.assessments);

    let rawResponse;
    let briefData;

    try {
        rawResponse = await callLLM(system, user, { jsonMode: true, temperature: 0.2 });
        briefData = parseJSON(rawResponse);
    } catch (firstError) {
        log('BriefGenerator', 'first attempt failed, retrying', { error: firstError.message });

        try {
            const retryUser = `${user}\n\nIMPORTANT: Return ONLY a valid JSON object with keys: recommendation, summary, openQuestions. No other text.`;
            rawResponse = await callLLM(system, retryUser, { jsonMode: true, temperature: 0.1 });
            briefData = parseJSON(rawResponse);
        } catch (retryError) {
            // Fallback: build a minimal brief programmatically
            log('BriefGenerator', 'LLM failed, building fallback brief programmatically');
            briefData = buildFallbackBrief(state.assessments);
        }
    }

    // Validate and normalize recommendation
    const validRecommendations = ['LIKELY_ELIGIBLE', 'LIKELY_INELIGIBLE', 'REQUIRES_REVIEW'];
    let recommendation = briefData.recommendation;
    if (!validRecommendations.includes(recommendation)) {
        // Infer from assessments
        recommendation = inferRecommendation(state.assessments);
    }

    state.brief = {
        recommendation,
        summary: briefData.summary || 'Eligibility assessment completed. Please review the criterion-by-criterion analysis below.',
        openQuestions: Array.isArray(briefData.openQuestions) ? briefData.openQuestions : [],
        disclaimer: DISCLAIMER,
    };

    log('BriefGenerator', 'completed', {
        recommendation: state.brief.recommendation,
        openQuestions: state.brief.openQuestions.length,
    });

    return state;
}

/**
 * Infer recommendation from assessment verdicts when LLM doesn't give a valid one.
 */
function inferRecommendation(assessments) {
    const hasFails = assessments.some(a => a.verdict === 'FAILS');
    const hasUncertain = assessments.some(a => a.verdict === 'UNCERTAIN');

    if (hasFails) return 'LIKELY_INELIGIBLE';
    if (hasUncertain) return 'REQUIRES_REVIEW';
    return 'LIKELY_ELIGIBLE';
}

/**
 * Build a minimal brief when LLM fails entirely.
 */
function buildFallbackBrief(assessments) {
    const meets = assessments.filter(a => a.verdict === 'MEETS').length;
    const fails = assessments.filter(a => a.verdict === 'FAILS').length;
    const uncertain = assessments.filter(a => a.verdict === 'UNCERTAIN').length;

    return {
        recommendation: inferRecommendation(assessments),
        summary: `Assessment completed: ${meets} criteria met, ${fails} criteria failed, ${uncertain} criteria uncertain out of ${assessments.length} total.`,
        openQuestions: assessments
            .filter(a => a.verdict === 'UNCERTAIN' || a.verdict === 'FAILS')
            .map(a => `Criterion ${a.criterionId}: ${a.action || a.reasoning}`),
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

module.exports = briefGenerator;
