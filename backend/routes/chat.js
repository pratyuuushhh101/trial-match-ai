const express = require('express');
const router = express.Router();
const { callLLM } = require('../services/llm');
const { log } = require('../utils/logger');

router.post('/', async (req, res, next) => {
    try {
        const { state, message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const systemPrompt = `You are the Trially Chatbot, an expert Clinical Research Coordinator assistant.
You are helping a recruiter clarify eligibility details about a patient against a specific clinical trial.
You have access to the exact AI-generated reasoning pipeline for this patient. Use ONLY the enclosed JSON facts to answer.
Be concise, direct, helpful, and highly professional. Refuse to answer non-medical or non-trial-related queries.
If you don't know the answer based on the data provided, firmly state that it is not available in the context.

==== PIPELINE STATE DATA ====
${JSON.stringify({
            patient: state?.patient,
            trial: state?.trial,
            brief: state?.brief,
            assessments: state?.assessments?.slice(0, 10) // Limit to prevent giant context, or omit all if too large, but model is 128k context so we can include them!
        }, null, 2)}
==============================`;

        // We stringify the chat history into the user prompt since our callLLM uses a strict 2-message system/user API format.
        let userPrompt = "CHAT HISTORY:\n";
        for (const msg of history) {
            userPrompt += `${msg.role.toUpperCase()}: ${msg.content}\n\n`;
        }
        userPrompt += `USER: ${message}\n`;

        log('Chat', 'Handling chatbot user query', { queryLength: message.length });

        const answer = await callLLM(systemPrompt, userPrompt, {
            temperature: 0.3,
            maxTokens: 1000,
            jsonMode: false
        });

        res.json({ success: true, answer });
    } catch (err) {
        log('Chat', 'Error in chatbot route', { error: err.message });
        next(err);
    }
});

module.exports = router;
