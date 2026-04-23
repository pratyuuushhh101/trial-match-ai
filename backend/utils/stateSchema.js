/**
 * Shared state object schema for Trially pipeline.
 *
 * Every agent reads from and writes to this object.
 * This is the single most important data structure in the system.
 */

/**
 * Create a fresh state object with all fields initialized.
 * @param {string} patientSummary - Raw free-text patient note
 * @param {string} trialId - NCT ID e.g. 'NCT04280705'
 * @returns {object} Initial state object
 */
function createInitialState(patientSummary, trialId) {
    return {
        // ── RAW INPUTS (set at pipeline start, never modified) ──
        raw: {
            patientSummary: patientSummary,
            trialId: trialId,
        },

        // ── AGENT 1 OUTPUT ──
        patient: {
            primaryDiagnosis: null,
            stage: null,
            comorbidities: [],
            currentMedications: [],      // [{ name: string, dose: string|null }]
            priorTreatments: [],
            keyLabValues: {},            // { [key]: string|number }
            ecogScore: null,
            age: null,
            sex: null,
            otherFlags: [],
        },

        // ── AGENT 2 OUTPUT ──
        trial: {
            nctId: null,
            title: null,
            phase: null,
            status: null,
            eligibilityRaw: null,
        },

        // ── AGENT 3 OUTPUT ──
        criteria: [],                  // [{ id: number, type: 'inclusion'|'exclusion', text: string }]

        // ── AGENT 4 OUTPUT ──
        assessments: [],               // [{ criterionId: number, verdict: 'MEETS'|'FAILS'|'UNCERTAIN', reasoning: string, action: string|null }]

        // ── AGENT 5 OUTPUT ──
        brief: {
            recommendation: null,       // 'LIKELY_ELIGIBLE' | 'LIKELY_INELIGIBLE' | 'REQUIRES_REVIEW'
            summary: null,
            openQuestions: [],
            disclaimer: null,
        },

        // ── METADATA (set by orchestrator) ──
        meta: {
            startedAt: new Date().toISOString(),
            completedAt: null,
            agentTimings: {
                patientExtractor: null,
                trialFetcher: null,
                criteriaParser: null,
                eligibilityReasoner: null,
                briefGenerator: null,
            },
            warnings: [],
        },
    };
}

/**
 * Validate that required fields are populated at specific pipeline stages.
 * Called before each agent runs to ensure its inputs are present.
 * @param {object} state - The shared state object
 * @param {string} stage - Which agent is about to run
 * @throws {Error} if required fields are missing
 */
function validateState(state, stage) {
    if (!state || !state.raw) {
        throw new Error('State object is missing or malformed');
    }

    switch (stage) {
        case 'patientExtractor':
            if (!state.raw.patientSummary || state.raw.patientSummary.trim().length === 0) {
                throw new Error('Patient summary is required but was empty');
            }
            break;

        case 'trialFetcher':
            if (!state.raw.trialId || state.raw.trialId.trim().length === 0) {
                throw new Error('Trial ID is required but was empty');
            }
            break;

        case 'criteriaParser':
            if (!state.trial || !state.trial.eligibilityRaw) {
                throw new Error('Trial eligibility text is required for criteria parsing but was not found. The trial may not have eligibility criteria listed.');
            }
            break;

        case 'eligibilityReasoner':
            if (!state.patient) {
                throw new Error('Patient data object is required for eligibility reasoning');
            }
            if (!state.criteria || state.criteria.length === 0) {
                throw new Error('Parsed criteria are required for eligibility reasoning but were not found');
            }
            break;

        case 'briefGenerator':
            if (!state.assessments || state.assessments.length === 0) {
                throw new Error('Assessments are required for brief generation but were not found');
            }
            break;

        default:
            break;
    }
}

module.exports = {
    createInitialState,
    validateState,
};
