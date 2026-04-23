/**
 * Prompt template for Agent 5 — Brief Generator
 * Instructs the LLM to write narrative sections only.
 * The structured criteria table is built programmatically — not by the LLM.
 */

/**
 * Build the system + user prompt for generating the coordinator brief narrative.
 * @param {object} patient - Structured patient profile
 * @param {object} trial - Trial metadata
 * @param {Array} assessments - Array of assessment objects from Agent 4
 * @returns {{ system: string, user: string }}
 */
function buildBriefPrompt(patient, trial, assessments) {
    const system = `You are a clinical trial coordination assistant. You will receive a patient profile, trial metadata, and a completed array of eligibility criterion assessments. Your job is to write the narrative sections of an eligibility brief for a research coordinator.

You MUST return ONLY a valid JSON object — no prose, no explanation, no markdown fences. Just raw JSON.

The JSON object MUST follow this exact schema:

{
  "recommendation": "<LIKELY_ELIGIBLE | LIKELY_INELIGIBLE | REQUIRES_REVIEW>",
  "summary": "<string — 2-3 sentence executive summary of the eligibility assessment>",
  "openQuestions": ["<array of strings — specific questions for physician review>"]
}

─── RECOMMENDATION RULES ───

LIKELY_ELIGIBLE: Use when ALL criteria have MEETS verdicts, or when only 1-2 criteria are UNCERTAIN with minor issues and all others are MEETS.

LIKELY_INELIGIBLE: Use when ANY criterion has a FAILS verdict that does not have a plausible waiver path.

REQUIRES_REVIEW: Use when there are UNCERTAIN verdicts that could meaningfully affect eligibility, or when a FAILS verdict has a potential waiver path. This is the appropriate recommendation when the patient appears likely eligible but specific items need physician confirmation.

─── SUMMARY RULES ───

- Write exactly 2-3 sentences
- Reference the specific decisive criteria by number
- State the overall picture: how many criteria are met, how many are uncertain, how many fail
- Be specific about what needs resolution

─── OPEN QUESTIONS RULES ───

- Generate one question per UNCERTAIN or FAILS assessment
- Each question must be specific and actionable — something a physician can answer directly
- Reference the criterion number and the specific data gap
- Do NOT generate questions for MEETS criteria

Return ONLY the JSON object. No other text.`;

    const meetsCount = assessments.filter(a => a.verdict === 'MEETS').length;
    const failsCount = assessments.filter(a => a.verdict === 'FAILS').length;
    const uncertainCount = assessments.filter(a => a.verdict === 'UNCERTAIN').length;

    const user = `PATIENT: ${patient.primaryDiagnosis || 'Unknown'}, ${patient.age || 'Unknown'} years old, ${patient.sex || 'Unknown'}
TRIAL: ${trial.title || trial.nctId} (${trial.phase || 'Unknown phase'})

ASSESSMENT SUMMARY: ${meetsCount} MEETS, ${failsCount} FAILS, ${uncertainCount} UNCERTAIN out of ${assessments.length} total criteria.

FULL ASSESSMENTS:
${JSON.stringify(assessments, null, 2)}

Generate the recommendation, executive summary, and open questions.`;

    return { system, user };
}

module.exports = { buildBriefPrompt };
