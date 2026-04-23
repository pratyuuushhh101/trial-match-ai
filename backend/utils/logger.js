/**
 * Structured logger for Trially
 * - Development: colored, human-readable output
 * - Production: JSON lines to stdout
 */

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
};

const AGENT_COLORS = {
    PatientExtractor: COLORS.cyan,
    TrialFetcher: COLORS.blue,
    CriteriaParser: COLORS.magenta,
    EligibilityReasoner: COLORS.yellow,
    BriefGenerator: COLORS.green,
    Orchestrator: COLORS.bright,
    Server: COLORS.dim,
};

function formatDevLog(agentName, event, data) {
    const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const color = AGENT_COLORS[agentName] || COLORS.reset;
    const prefix = `${COLORS.dim}${timestamp}${COLORS.reset} ${color}[${agentName}]${COLORS.reset}`;

    let message = `${prefix} ${event}`;
    if (data !== undefined && data !== null) {
        if (typeof data === 'object') {
            const summary = JSON.stringify(data, null, 0);
            // Truncate long objects for readability
            message += ` ${COLORS.dim}${summary.length > 200 ? summary.slice(0, 200) + '...' : summary}${COLORS.reset}`;
        } else {
            message += ` ${COLORS.dim}${data}${COLORS.reset}`;
        }
    }
    return message;
}

/**
 * Log an event from an agent or system component.
 * @param {string} agentName - Name of the agent or component
 * @param {string} event - What happened (e.g. 'started', 'completed', 'error')
 * @param {*} [data] - Optional data payload
 */
function log(agentName, event, data) {
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
        console.log(formatDevLog(agentName, event, data));
    } else {
        // Production: structured JSON lines
        const entry = {
            timestamp: new Date().toISOString(),
            agent: agentName,
            event,
        };
        if (data !== undefined && data !== null) {
            entry.data = data;
        }
        console.log(JSON.stringify(entry));
    }
}

module.exports = { log };
