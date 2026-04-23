# TrialMatch AI (Trially) 🧬🧠

**Clinical Trial Eligibility Reasoning Agent**  
*A multi-agent AI pipeline for automated, criterion-by-criterion clinical trial eligibility assessment.*

---

## 🌟 Overview

TrialMatch AI (Trially) is a professional-grade clinical research tool designed to simplify the complex process of matching patients to clinical trials. Unlike simple search tools, Trially uses a **sequential 5-agent reasoning pipeline** to perform a granular, clinical-grade assessment of a patient's eligibility against every single criterion of a specific trial.

The system is grounded in real-world data from **ClinicalTrials.gov** and uses high-fidelity LLMs (Llama 4, GPT-4o, etc.) to provide logic-backed reasoning, reducing the manual workload for Clinical Research Coordinators.

---

## 🚀 Key Features

*   **Multi-Agent Reasoning Pipeline**: A structured 5-stage process ensures high accuracy and reduces hallucinations.
*   **Real-time ClinicalTrials.gov Integration**: Fetches the latest trial metadata and eligibility text using the Official REST API v2.
*   **Criterion-by-Criterion Analysis**: Generates specific "MEETS", "FAILS", or "UNCERTAIN" verdicts for every enlistment requirement.
*   **AI Chatbot Assistant**: An interactive chatbot grounded in the assessment state to answer follow-up questions about the patient-trial match.
*   **Provider-Agnostic LLM Layer**: Easily swap between Groq, OpenAI, or Z.ai (GLM) via environment variables.
*   **Production Hardened**: Built-in rate limiting, security headers (Helmet), Gzip compression, and structured JSON logging.

---

## 🏗 System Architecture

The core of Trially is its sequential pipeline:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ 1. Extractor    │    │ 2. Fetcher      │    │ 3. Parser       │
│ Free-text → JSON ├───► NCT ID → Metadata ├───► Raw Text → Array │
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐             │
│ 5. Briefer      │    │ 4. Reasoner     │             │
│ Results Synthesis ◄──┤ Logic Assessment ◄─────────────┘
└─────────────────┘    └─────────────────┘
```

1.  **Patient Extractor**: Transforms unstructured clinical notes into a structured patient profile.
2.  **Trial Fetcher**: Retrieves the exact trial data from ClinicalTrials.gov.
3.  **Criteria Parser**: Breaks down raw eligibility text into individual, assessable requirements.
4.  **Eligibility Reasoner**: (The Core) Evaluates the patient against every criterion with logic-backed reasoning.
5.  **Brief Generator**: Synthesizes a narrative coordinator brief and actionable next steps.

---

## 🛠 Tech Stack

*   **Frontend**: Next.js 14 (App/Pages), React, Tailwind CSS, Framer Motion.
*   **Backend**: Node.js, Express, OpenAI SDK (Client).
*   **LLMs**: Groq (Llama 4 Maverick), OpenAI (GPT-4o), BigModel (GLM 5.1).
*   **External API**: ClinicalTrials.gov REST API v2.
*   **DevOps**: Docker, Docker Compose, Npm Workspaces.

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 20+
- An API Key (Groq, OpenAI, or GLM)

### 1. Clone the repository
```bash
git clone https://github.com/pratyuuushhh101/trial-match-ai.git
cd trial-match-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `backend/.env` and `frontend/.env.local`:
```bash
# Example values in backend/.env
LLM_API_KEY=your_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-4-maverick-17b-128e-instruct
```

### 4. Run the Development Server
```bash
npm run dev
```
The frontend will be at `http://localhost:3000` and the backend at `http://localhost:3001`.

---

## 🐳 Docker Setup

For a production-ready containerized environment:
```bash
docker-compose -f docker-compose.production.yml up --build
```

---

## 🧪 Testing

Trially includes an integration test suite for the reasoning pipeline:
```bash
npm test --workspace=backend
```


