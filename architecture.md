# TrialMatch AI — System Architecture

## Overview

TrialMatch AI is a 5-agent sequential reasoning pipeline that takes a patient summary and a ClinicalTrials.gov trial ID, then produces a structured, criterion-by-criterion eligibility assessment.

## Agent Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                        POST /api/assess                             │
│                { patientSummary, trialId }                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Agent 1: Extractor   │  Free-text → structured patient JSON
              │   (LLM call)           │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Agent 2: Fetcher     │  NCT ID → trial metadata + eligibility text
              │   (ClinicalTrials API) │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Agent 3: Parser      │  Raw eligibility text → criteria array
              │   (LLM call)           │
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Agent 4: Reasoner    │  Patient + criteria → assessments array
              │   (LLM call — core)    │  (single call, all criteria at once)
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Agent 5: Briefer     │  Assessments → coordinator brief
              │   (LLM + programmatic) │  (LLM for narrative, code for structure)
              └────────────┬───────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Response:            │
              │   { success, brief,    │
              │     state }            │
              └────────────────────────┘
```

## LLM Integration Layer

The LLM client (`services/llm.js`) uses the **OpenAI SDK** with a **configurable base URL**. This single implementation works for all providers via OpenAI-compatible chat completions format.

**Current configuration (development):**
- Provider: Groq
- Model: `llama-4-maverick-17b-128e-instruct`
- Base URL: `https://api.groq.com/openai/v1`

**Swap to any provider with zero code changes — only `.env` values change:**

| Provider | LLM_BASE_URL | LLM_MODEL |
|----------|-------------|-----------|
| Groq (current) | `https://api.groq.com/openai/v1` | `llama-4-maverick-17b-128e-instruct` |
| GLM-5.1 (production) | `https://open.bigmodel.cn/api/paas/v4` | `glm-5.1` |
| OpenAI (fallback) | `https://api.openai.com/v1` | `gpt-4o` |

**Implementation:**
```javascript
const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL,
});

// All calls go through:
client.chat.completions.create({ model, messages, temperature, max_tokens });
// Response extracted as: response.choices[0].message.content
```

## Shared State Object

A single JSON object flows through all 5 agents. Each agent reads its inputs and writes its outputs to this object. Schema is defined in `utils/stateSchema.js`.

```
state = {
  raw:         { patientSummary, trialId }           // Set at start, immutable
  patient:     { diagnosis, meds, labs, ... }         // Agent 1 output
  trial:       { nctId, title, eligibilityRaw, ... }  // Agent 2 output
  criteria:    [{ id, type, text }]                   // Agent 3 output
  assessments: [{ criterionId, verdict, reasoning }]  // Agent 4 output
  brief:       { recommendation, summary, questions }  // Agent 5 output
  meta:        { timings, warnings }                  // Orchestrator metadata
}
```

## ClinicalTrials.gov Integration

- **API:** REST API v2 — `GET https://clinicaltrials.gov/api/v2/studies/{nctId}`
- **Auth:** None required
- **Retry:** Exponential backoff, max 3 attempts (handles 503s)
- **Error:** 404 → `TrialNotFoundError`, missing eligibility text → pipeline halts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| LLM Client | OpenAI SDK with configurable base URL |
| Current Model | Groq / llama-4-maverick-17b-128e-instruct |
| Production Model | GLM-5.1 via Z.ai |
| Frontend | Next.js + React + Tailwind CSS |
| Trial Data | ClinicalTrials.gov REST API v2 |
| State | In-memory JSON — no database, stateless per session |

## Design Principles

1. **One agent, one job** — each agent does one thing and passes clean output forward
2. **No framework overhead** — hand-rolled pipeline, fully transparent and debuggable
3. **Provider-agnostic LLM** — swap model with env vars only, zero code changes
4. **Fail gracefully** — UNCERTAIN over guessing, warnings over crashes, clear errors over silent failures
