/**
 * Agent 2: Trial Fetcher
 *
 * Fetches trial data from ClinicalTrials.gov API. No LLM call.
 * Extracts title, status, eligibility criteria text, and phase.
 * Writes to state.trial.
 *
 * If trial is not in RECRUITING status: adds warning, continues.
 * If eligibility text is missing: throws (system cannot proceed without criteria).
 */

const { fetchTrial } = require('../services/clinicalTrials');
const { TriallyError } = require('../utils/errors');
const { log } = require('../utils/logger');

/**
 * @param {object} state - Shared pipeline state
 * @returns {object} Updated state with state.trial populated
 */
async function trialFetcher(state) {
    log('TrialFetcher', 'started', { trialId: state.raw.trialId });

    const data = await fetchTrial(state.raw.trialId);

    // Extract fields from the API response
    const protocolSection = data.protocolSection || {};
    const identificationModule = protocolSection.identificationModule || {};
    const statusModule = protocolSection.statusModule || {};
    const eligibilityModule = protocolSection.eligibilityModule || {};
    const designModule = protocolSection.designModule || {};

    const title = identificationModule.briefTitle || identificationModule.officialTitle || 'Unknown Trial';
    const status = statusModule.overallStatus || 'UNKNOWN';
    const eligibilityRaw = eligibilityModule.eligibilityCriteria || null;

    // phases is an array — join into comma-separated string
    const phasesArray = designModule.phases || [];
    const phase = phasesArray.length > 0 ? phasesArray.join(', ') : 'Not specified';

    // Write to state
    state.trial = {
        nctId: state.raw.trialId,
        title,
        phase,
        status,
        eligibilityRaw,
    };

    // Check status — warn if not recruiting but continue
    if (status !== 'RECRUITING') {
        const warning = `Trial ${state.raw.trialId} has status "${status}" (not RECRUITING). Eligibility assessment will proceed, but enrollment may not be possible.`;
        state.meta.warnings.push(warning);
        log('TrialFetcher', 'warning: trial not recruiting', { status });
    }

    // Check eligibility text — halt if missing
    if (!eligibilityRaw || eligibilityRaw.trim().length === 0) {
        throw new TriallyError(
            `Trial ${state.raw.trialId} has no eligibility criteria text listed`,
            'NO_ELIGIBILITY_TEXT',
            `The trial ${state.raw.trialId} does not have eligibility criteria listed on ClinicalTrials.gov. The system cannot proceed without eligibility criteria to assess.`
        );
    }

    log('TrialFetcher', 'completed', {
        title: title.slice(0, 60),
        status,
        phase,
        eligibilityLength: eligibilityRaw.length,
    });

    return state;
}

module.exports = trialFetcher;
