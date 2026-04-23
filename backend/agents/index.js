/**
 * Agent Orchestrator — agents/index.js
 *
 * Runs all 5 agents in sequence. No business logic here.
 * Passes state from one agent to the next.
 * Logs start/end time of each agent for performance monitoring.
 */

const { createInitialState, validateState } = require('../utils/stateSchema');
const { log } = require('../utils/logger');

const patientExtractor = require('./patientExtractor');
const trialFetcher = require('./trialFetcher');
const criteriaParser = require('./criteriaParser');
const eligibilityReasoner = require('./eligibilityReasoner');
const briefGenerator = require('./briefGenerator');

const AGENTS = [
    { name: 'patientExtractor', fn: patientExtractor, timingKey: 'patientExtractor' },
    { name: 'trialFetcher', fn: trialFetcher, timingKey: 'trialFetcher' },
    { name: 'criteriaParser', fn: criteriaParser, timingKey: 'criteriaParser' },
    { name: 'eligibilityReasoner', fn: eligibilityReasoner, timingKey: 'eligibilityReasoner' },
    { name: 'briefGenerator', fn: briefGenerator, timingKey: 'briefGenerator' },
];

/**
 * Run the full 5-agent eligibility assessment pipeline.
 *
 * @param {string} patientSummary - Free-text patient clinical summary
 * @param {string} trialId - NCT ID (e.g. 'NCT06745908')
 * @returns {object} Completed state object with all fields populated
 * @throws Any agent error propagates up
 */
async function runPipeline(patientSummary, trialId) {
    log('Orchestrator', 'pipeline started', { trialId });

    let state = createInitialState(patientSummary, trialId);

    for (const agent of AGENTS) {
        // Validate state before each agent
        validateState(state, agent.name);

        log('Orchestrator', `running ${agent.name}`);
        const agentStart = Date.now();

        state = await agent.fn(state);

        const agentDuration = Date.now() - agentStart;
        state.meta.agentTimings[agent.timingKey] = agentDuration;

        log('Orchestrator', `${agent.name} completed`, { duration: `${agentDuration}ms` });
    }

    state.meta.completedAt = new Date().toISOString();

    const totalDuration = Object.values(state.meta.agentTimings)
        .filter(v => v !== null)
        .reduce((sum, v) => sum + v, 0);

    log('Orchestrator', 'pipeline completed', {
        totalDuration: `${totalDuration}ms`,
        recommendation: state.brief.recommendation,
        warnings: state.meta.warnings.length,
    });

    return state;
}

module.exports = { runPipeline };
