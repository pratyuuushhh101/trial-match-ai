/**
 * Prompt template for Agent 1 — Patient Extractor
 * Instructs the LLM to parse a free-text patient summary into canonical JSON.
 */

/**
 * Build the system + user prompt for patient data extraction.
 * @param {string} rawSummary - Free-text patient note (any clinical format)
 * @returns {{ system: string, user: string }}
 */
function buildExtractPatientPrompt(rawSummary) {
    const system = `You are a clinical data extraction specialist. Your job is to read a free-text patient summary (which may be a discharge note, referral letter, or EHR export) and extract structured data from it.

You MUST return ONLY a valid JSON object — no prose, no explanation, no markdown fences. Just raw JSON.

The JSON object MUST follow this exact schema:

{
  "primaryDiagnosis": "string — the primary cancer diagnosis or condition",
  "stage": "string or null — cancer stage if mentioned (e.g. 'Stage IV', 'Stage IIIB')",
  "comorbidities": ["array of strings — other medical conditions"],
  "currentMedications": [
    { "name": "string — medication name", "dose": "string or null — dosage if mentioned" }
  ],
  "priorTreatments": ["array of strings — previous treatments, surgeries, therapies with key details"],
  "keyLabValues": {
    "key": "value — lab test name as key, result as value (include units)"
  },
  "ecogScore": "number or null — ECOG performance status (0-4)",
  "age": "number or null",
  "sex": "string or null — 'male', 'female', or 'other'",
  "otherFlags": ["array of strings — any clinically relevant information not captured above"]
}

Rules:
- Extract ONLY what is explicitly stated in the patient summary. Do NOT infer or assume.
- If a field is not mentioned in the summary, use null for scalar fields and [] for arrays.
- For currentMedications, include dose if mentioned; otherwise set dose to null.
- For priorTreatments, include treatment name, duration, response, and reason for discontinuation if available.
- For keyLabValues, use descriptive keys (e.g. "AST", "ALT", "creatinine", "ECOG") and include units in the value.
- Include molecular profiling results (e.g. mutation status, PD-L1 expression) in otherFlags.
- Return ONLY the JSON object. No other text.`;

    const user = `Extract structured patient data from the following clinical summary:\n\n${rawSummary}`;

    return { system, user };
}

module.exports = { buildExtractPatientPrompt };
