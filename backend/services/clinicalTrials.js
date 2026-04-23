/**
 * ClinicalTrials.gov API Wrapper — services/clinicalTrials.js
 *
 * Wraps all calls to the ClinicalTrials.gov REST API v2.
 * No API key required. Implements exponential backoff retry (max 3 attempts).
 */

const { TrialNotFoundError, TriallyError } = require('../utils/errors');
const { log } = require('../utils/logger');

const BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Fetch a clinical trial by NCT ID from ClinicalTrials.gov.
 *
 * @param {string} nctId - NCT ID (e.g. 'NCT06745908')
 * @returns {Promise<object>} Full trial JSON object from the API
 * @throws {TrialNotFoundError} if the NCT ID is invalid or the trial doesn't exist
 * @throws {TriallyError} if the API is unreachable after retries
 */
async function fetchTrial(nctId) {
    const url = `${BASE_URL}/${nctId}?format=json`;

    log('TrialFetcher', `fetching trial ${nctId}`, { url });

    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            // 404 — trial does not exist, no retry
            if (response.status === 404) {
                throw new TrialNotFoundError(nctId);
            }

            // 503 or other server errors — retry with backoff
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                lastError = new TriallyError(
                    `ClinicalTrials.gov API returned ${response.status}: ${errorText}`,
                    'CLINICAL_TRIALS_API_ERROR',
                    `ClinicalTrials.gov is temporarily unavailable. Please try again in a moment.`
                );

                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
                    log('TrialFetcher', `retry ${attempt}/${MAX_RETRIES} after ${delay}ms`, {
                        status: response.status,
                    });
                    await sleep(delay);
                    continue;
                }

                throw lastError;
            }

            const data = await response.json();

            log('TrialFetcher', `trial fetched successfully`, {
                nctId,
                title: data?.protocolSection?.identificationModule?.briefTitle?.slice(0, 60),
            });

            return data;
        } catch (error) {
            // Don't retry TrialNotFoundError
            if (error instanceof TrialNotFoundError) throw error;

            lastError = error;

            if (attempt < MAX_RETRIES) {
                const delay = Math.pow(2, attempt) * 1000;
                log('TrialFetcher', `retry ${attempt}/${MAX_RETRIES} after ${delay}ms`, {
                    error: error.message,
                });
                await sleep(delay);
                continue;
            }
        }
    }

    // All retries exhausted
    if (lastError instanceof TriallyError) throw lastError;
    throw new TriallyError(
        `Failed to fetch trial ${nctId} after ${MAX_RETRIES} attempts: ${lastError?.message}`,
        'CLINICAL_TRIALS_API_ERROR',
        'Could not reach ClinicalTrials.gov. Please check your internet connection and try again.'
    );
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { fetchTrial };
