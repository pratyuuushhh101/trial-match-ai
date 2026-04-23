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
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { log } = require('./utils/logger');

const assessRoute = require('./routes/assess');
const chatRoute = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Production Middleware ─────────────────────────────────────────
app.use(helmet()); // Sets various security-related HTTP headers
app.use(compression()); // Gzip compression

// Rate Limiting: 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        userMessage: 'Too many requests from this IP. Please try again after 15 minutes.'
    }
});
app.use('/api/', limiter);

// ── CORS Configuration ────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json({ limit: '2mb' }));

// ── Health Check ───────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
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
        // Only include stack in dev
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ── Start Server ───────────────────────────────────────────────
if (require.main === module) {
    app.listen(PORT, () => {
        log('Server', `Trially backend running on port ${PORT}`, {
            provider: process.env.LLM_PROVIDER || 'not set',
            model: process.env.LLM_MODEL || 'not set',
            env: process.env.NODE_ENV || 'development',
        });
    });
}

module.exports = app;

