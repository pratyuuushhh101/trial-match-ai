/**
 * server.js — Express App Entry Point
 *
 * Boots the Express server. Registers middleware and routes.
 * Exports the app instance for testing.
 *
 * GET  /           → health check
 * POST /api/assess → runs the full 5-agent pipeline
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { log } = require('./utils/logger');

const assessRoute = require('./routes/assess');
const chatRoute = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Health Check ───────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/assess', assessRoute);
app.use('/api/chat', chatRoute);

// ── Global Error Handler ───────────────────────────────────────
app.use((err, req, res, next) => {
    log('Server', 'error', {
        code: err.code || 'UNKNOWN',
        message: err.message,
        name: err.name,
    });

    const statusCode = err.code === 'TRIAL_NOT_FOUND' ? 404
        : err.code === 'PATIENT_EXTRACTION_ERROR' ? 422
            : err.code === 'CRITERIA_PARSE_ERROR' ? 422
                : err.code === 'REASONING_ERROR' ? 500
                    : err.code === 'LLM_ERROR' ? 502
                        : err.code === 'NO_ELIGIBILITY_TEXT' ? 422
                            : 500;

    res.status(statusCode).json({
        success: false,
        error: err.code || 'INTERNAL_ERROR',
        userMessage: err.userMessage || 'An unexpected error occurred. Please try again.',
    });
});

// ── Start Server ───────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => {
        log('Server', `Trially backend running on port ${PORT}`, {
            provider: process.env.LLM_PROVIDER || 'claude',
            model: process.env.LLM_MODEL || 'not set',
            env: process.env.NODE_ENV || 'development',
        });
    });
}

module.exports = app;
