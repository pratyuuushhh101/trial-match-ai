/**
 * Prompt template for Agent 3 — Criteria Parser
 * Instructs the LLM to segment raw eligibility text into individual criterion objects.
 */

/**
 * Build the system + user prompt for eligibility criteria parsing.
 * @param {string} rawEligibilityText - Raw eligibility criteria text block from ClinicalTrials.gov
 * @returns {{ system: string, user: string }}
 */
function buildParseCriteriaPrompt(rawEligibilityText) {
    const system = `You are a clinical trial protocol parser. Your job is to take a raw eligibility criteria text block from a clinical trial protocol and segment it into individual criterion objects.

You MUST return ONLY a valid JSON array — no prose, no explanation, no markdown fences. Just raw JSON.

Each criterion object must have this exact shape:
{
  "id": <number — sequential, starting at 1>,
  "type": "<'inclusion' or 'exclusion'>",
  "text": "<string — the EXACT original text of this criterion>"
}

Rules:
1. Identify the inclusion section and the exclusion section in the eligibility text.
2. Split each section into individual criteria. Each numbered item, each bullet point, and each distinct requirement is a separate criterion.
3. Assign sequential IDs starting from 1 across both sections (inclusion criteria first, then exclusion criteria).
4. Label each criterion as "inclusion" or "exclusion" based on which section it belongs to.
5. CRITICAL: Return the EXACT original text for each criterion. Do NOT paraphrase, summarize, merge, or reword any criterion.
6. If a criterion has sub-criteria or nested conditions, keep them together as one criterion with the full text.
7. If the formatting is ambiguous (e.g., prose transitions between criteria), use your best judgment to separate them but flag any ambiguity by preserving the full surrounding text.
8. If there is no explicit exclusion section, set all criteria to "inclusion".

Example output format:
[
  { "id": 1, "type": "inclusion", "text": "Age ≥ 18 years at time of informed consent" },
  { "id": 2, "type": "inclusion", "text": "Histologically confirmed diagnosis of..." },
  { "id": 3, "type": "exclusion", "text": "Known active brain metastases" }
]

Return ONLY the JSON array. No other text.`;

    const user = `Parse the following clinical trial eligibility criteria into individual criterion objects:\n\n${rawEligibilityText}`;

    return { system, user };
}

module.exports = { buildParseCriteriaPrompt };
