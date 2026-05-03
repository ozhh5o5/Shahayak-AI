# SahayakAI — 1092 Helpline Intake

AI-assisted intake for the 1092 helpline: transcribe, classify urgency, redact PII, and route to the right department with full explainability.

> **PanIIT AI for Bharat Hackathon** — Theme 12: AI for 1092 Helpline

SahayakAI is an operator console for India's 1092 women and child distress helpline. It allows uploading recorded audio or typing transcripts, stores raw and redacted data, runs AI-driven intent and urgency classification, and provides causal dispatch logic with a mandatory citizen confirmation loop.

## Setup & Running Instructions

1. **Prepare Environment**
   - Copy the `.env.example` file and rename it to `.env`.

2. **Install Dependencies**
   - Open your terminal in the project folder and run:
     `npm install`

3. **Initialize Database**
   - Run the following commands to prepare the local database:
     `npx prisma generate`
     `npx prisma db push`
     `npm run seed`

4. **Start Application**
   - To launch the platform, run:
     `npm run dev`
   - Open your browser to: **http://localhost:3000** (or the port shown in your terminal).

## Key Features

- **Audio Upload & Extraction**: Upload call recordings to extract transcripts and intents via simulated IndicWav2Vec processing.
- **PII Redaction**: Automatic redaction of sensitive names and addresses for DPDP Act 2023 compliance.
- **Acoustic Scene Classification (ASC)**: Detects background context (e.g., traffic, shouting) to elevate urgency.
- **Causal Dispatch Logic**: Explainable logic trees that show exactly why a specific department was recommended.
- **Confirmation Loop**: Native-language restatement that must be confirmed by the caller/operator before finalization.

## Tech Stack

- Next.js 16 (App Router)
- Prisma + SQLite
- Tailwind CSS + Tremor
- AI4Bharat IndicWav2Vec (Simulated)

---
*Hackathon Submission for PanIIT AI for Bharat*
