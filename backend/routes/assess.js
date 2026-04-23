/**
 * POST /api/assess — Main API Route
 *
 * Validates input, calls the orchestrator pipeline, returns the result.
 * Adds X-Response-Time header for demo purposes.
 */

const express = require('express');
const { runPipeline } = require('../agents/index');

const router = express.Router();

router.post('/', async (req, res, next) => {
    const startTime = Date.now();

    try {
        const { patientSummary, trialId } = req.body;

        // Input validation
        if (!patientSummary || typeof patientSummary !== 'string' || patientSummary.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: patientSummary',
                userMessage: 'Please provide a patient summary to analyze.',
            });
        }

        if (!trialId || typeof trialId !== 'string' || trialId.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: trialId',
                userMessage: 'Please provide a clinical trial NCT ID.',
            });
        }

        // Run the full 5-agent pipeline
        const state = await runPipeline(patientSummary.trim(), trialId.trim());

        // Add response time header
        const responseTime = Date.now() - startTime;
        res.set('X-Response-Time', `${responseTime}ms`);

        return res.json({
            success: true,
            brief: state.brief,
            state,
        });
    } catch (error) {
        // Add response time even on error
        const responseTime = Date.now() - startTime;
        res.set('X-Response-Time', `${responseTime}ms`);

        next(error);
    }
});

module.exports = router;
