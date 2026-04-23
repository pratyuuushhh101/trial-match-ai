/**
 * Custom error classes for Trially
 * Every error carries a `code` string and a `userMessage` safe to return to the frontend.
 */

class TriallyError extends Error {
  constructor(message, code, userMessage) {
    super(message);
    this.name = 'TriallyError';
    this.code = code || 'TRIALMATCH_ERROR';
    this.userMessage = userMessage || 'An unexpected error occurred. Please try again.';
  }
}

class PatientExtractionError extends TriallyError {
  constructor(message, rawOutput) {
    super(
      message,
      'PATIENT_EXTRACTION_ERROR',
      'Failed to extract structured data from the patient summary. Please ensure the summary contains clinical information in a standard format.'
    );
    this.name = 'PatientExtractionError';
    this.rawOutput = rawOutput || null;
  }
}

class TrialNotFoundError extends TriallyError {
  constructor(nctId) {
    super(
      `Trial not found: ${nctId}`,
      'TRIAL_NOT_FOUND',
      `Could not find a clinical trial with ID "${nctId}" on ClinicalTrials.gov. Please verify the NCT ID and try again.`
    );
    this.name = 'TrialNotFoundError';
    this.nctId = nctId;
  }
}

class CriteriaParseError extends TriallyError {
  constructor(message, rawOutput) {
    super(
      message,
      'CRITERIA_PARSE_ERROR',
      'Failed to parse the trial eligibility criteria into individual items. The eligibility text may be in an unusual format.'
    );
    this.name = 'CriteriaParseError';
    this.rawOutput = rawOutput || null;
  }
}

class ReasoningError extends TriallyError {
  constructor(message, rawOutput) {
    super(
      message,
      'REASONING_ERROR',
      'Failed to complete the eligibility reasoning analysis. Please try again.'
    );
    this.name = 'ReasoningError';
    this.rawOutput = rawOutput || null;
  }
}

class LLMError extends TriallyError {
  constructor(message, provider, model, rawResponse) {
    super(
      message,
      'LLM_ERROR',
      'The AI reasoning service encountered an error. Please try again in a moment.'
    );
    this.name = 'LLMError';
    this.provider = provider || null;
    this.model = model || null;
    this.rawResponse = rawResponse || null;
  }
}

module.exports = {
  TriallyError,
  PatientExtractionError,
  TrialNotFoundError,
  CriteriaParseError,
  ReasoningError,
  LLMError,
};
