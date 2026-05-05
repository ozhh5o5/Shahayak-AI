# SahayakAI — Technical Documentation

## Architecture & Workflow

SahayakAI replaces the traditional, linear IVR process of the 1092 helpline with a parallelized, AI-driven triage system. The application runs entirely in the browser as a Single Page Application (SPA), with all data and classification logic embedded client-side.

### 1. Data Ingestion & PII Redaction
- **Input Channels:** Receives audio files via a dedicated upload interface (simulating recorded telephony data).
- **Processing Layer:** Simulates AI4Bharat IndicWav2Vec models to process multi-lingual, code-switched audio. Upon file upload, the system runs a 2-second extraction simulation and generates a distress scenario transcript.
- **Data Protection:** Implements real-time PII redaction (names, addresses, IDs) directly at the transcription layer, maintaining DPDP Act 2023 compliance. The AI and the human operators only interact with redacted text.

### 2. Intent & Urgency Classification
- **Mock AI Classifier:** A robust, rule-based system simulates the neural network output entirely in the browser.
- **Classes:**
  - Intent: `DOMESTIC_VIOLENCE`, `MISSING_CHILD`, `MEDICAL_EMERGENCY`, `MENTAL_HEALTH`, `CHILD_ABUSE`, etc.
  - Urgency: `IMMEDIATE`, `URGENT`, `STANDARD`, `INFORMATIONAL`.
- **Confidence Thresholding (HITL):** If the classification confidence is below 70%, the system halts automated dispatching and presents the top 3 potential intents to the operator for a Human-in-the-Loop resolution.

### 3. Non-Verbal Acoustic Scene Classification (ASC)
For calls where the victim cannot speak (due to proximity to an abuser, physical restraint, or panic):
- The system samples background audio context from the uploaded file.
- Mock algorithms identify scene signatures (e.g., *Outdoor Traffic*, *Domestic Kitchen + Shouting*).
- This non-verbal data acts as a secondary input to elevate the Urgency score autonomously.

### 4. Operator Console & Draft Responses
- To minimize cognitive load, the system suggests draft responses classified by purpose:
  - **Calming Scripts:** For panicked or suicidal callers.
  - **Information Gathering:** Targeted questions to fill in missing context.
  - **Safety Instructions:** Immediate protocol steps for ongoing emergencies.
- **Repeat Caller Linking:** The system simulates voice-print matching to detect repeat callers, surfacing their historical case trajectory immediately.

### 5. Causal Dispatch Logic & Restatement Loop
- **Causal Logic Tree:** The dispatch system uses a deterministic approach. Example: `Caller mentioned [violence] + acoustic scene [domestic] -> Dispatch: [POLICE + WPO]`. This guarantees explainability to operators and auditors.
- **Citizen Confirmation Loop:** Before any action is finalized, the system translates a summary back to the caller's preferred language, plays it via Text-To-Speech, and awaits verbal confirmation. This prevents misdispatch and guarantees agency for the citizen.

## Technology Stack
- **Framework:** Vite + React 18 + TypeScript (Single Page Application)
- **Styling:** Tailwind CSS, Lucide React icons
- **Charts:** Recharts
- **Routing:** React Router DOM
- **Data:** Embedded mock data (no server, no database)
- **Web APIs:** Web Speech API (SpeechSynthesis for restatement loop) and File API for audio ingestion.
- **Deployment:** Vercel (auto-detected Vite project)

## Mock Interfaces
*Note for evaluators:* Because running actual localized deep-learning models (like Wav2Vec) in a browser/hackathon sandbox is infeasible, the classification and ASC logic are mocked via TypeScript modules (`src/lib/ai.ts`). The UI and the architecture accurately demonstrate how the production platform would interface with these endpoints.
