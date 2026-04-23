/**
 * Frontend API client — the only file that makes HTTP requests.
 * All API calls go through here.
 */

/**
 * Submit a patient summary and trial ID for eligibility analysis.
 * @param {string} patientSummary - Free-text patient clinical summary
 * @param {string} trialId - NCT ID (e.g. 'NCT06745908')
 * @returns {Promise<{ success: boolean, brief: object, state: object }>}
 * @throws {Error} if response is not ok, with error message from backend
 */
export async function analyzeEligibility(patientSummary, trialId) {
    const response = await fetch('/api/assess', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientSummary, trialId }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.userMessage || `Server error: ${response.status}`);
    }

    return data;
}

/**
 * Ask the chatbot a question regarding the current state.
 * @param {object} state - Full Trially state
 * @param {string} message - User query
 * @param {Array} history - Previous Q&A
 * @returns {Promise<string>} Chatbot reply string
 */
export async function askChatbot(state, message, history) {
    const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, message, history }),
    });

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.userMessage || errData.error || 'Failed to reach chatbot.');
    }

    const data = await res.json();
    if (!data.success) {
        throw new Error(data.userMessage || data.error);
    }

    return data.answer;
}
