# SahayakAI — 1092 Helpline Intake

AI-assisted intake for the 1092 helpline: transcribe, classify urgency, redact PII, and route to the right department with full explainability.

> **PanIIT AI for Bharat Hackathon** — Theme 12: AI for 1092 Helpline

SahayakAI is an operator console for India's 1092 women and child distress helpline. It captures multilingual audio uploads, stores raw and redacted transcripts, runs mock-first intent and urgency classification with explainable reasoning, proposes synthetic dispatch targets, and requires an operator verification step before any dispatch is created.

## Setup Instructions (Step-by-Step)

1. **Clone the project**: Download or clone the repository to your local machine.
2. **Install Dependencies**: Open your terminal in the project folder and run: `npm install`
3. **Start Application**: Run `npm run dev` to launch the console.

Open **http://localhost:5173** in your browser.

> **No database required!** All data is embedded as mock data in the client bundle.

## Demo Flow

1. Open the dashboard and click **Start new call**.
2. Upload an audio file (any `.mp3`/`.wav`). The system simulates IndicWav2Vec extraction and generates a distress scenario.
3. Review the redacted transcript, predicted intent, urgency, confidence, reasoning, and follow-up prompts.
4. Finalize the case and show the operator verification step with notes.
5. Dispatch the verified case to a suggested synthetic department and review the resulting audit trail.

## Tech Stack

- **Frontend:** Vite + React 18 + TypeScript
- **Styling:** Tailwind CSS + Lucide React icons
- **Charts:** Recharts
- **Routing:** React Router DOM
- **Data:** Embedded mock data (no server, no database)
- **Deployment:** Vercel (zero config)

## Key Features

- Audio file upload with simulated IndicWav2Vec NLP extraction.
- PII redaction on transcripts before downstream review.
- Explainable mock-first classification for intent, urgency, confidence, and risk flags.
- Human-in-the-Loop (HITL) for low-confidence classifications.
- Issue Restatement & Confirmation Loop with Text-to-Speech.
- Acoustic Scene Classification (ASC) simulation.
- Repeat Caller voice-print linking simulation.
- Causal dispatch logic tree for auditable decision-making.
- Mandatory human verification before dispatch.

## Documentation

See [DOCUMENTATION.md](DOCUMENTATION.md) and [DESCRIPTION.md](DESCRIPTION.md).

## Build & Deploy

1. Run `npm install`
2. Run `npm run build` → output goes to `dist/`
3. Push to GitHub → Import into Vercel → Auto-detected as Vite → Deploys flawlessly.

## License

Hackathon submission
