# SahayakAI — Multimodal Acoustic Triage Console

**Theme:** Theme 12 — AI for 1092 Helpline
**Project Name:** SahayakAI

## Overview
SahayakAI is an advanced, AI-powered operator console built for the 1092 women and child distress helpline. Standard IVR and translation APIs fail when dealing with panicked, code-switched, or silent callers. SahayakAI addresses this by using direct phonetic acoustic triage and zero-resource dialect NLP to understand distress calls natively without brittle translation layers. 

## Key Innovations
- **Multimodal Acoustic Triage:** Capable of classifying intent and urgency directly from uploaded audio files, including Acoustic Scene Classification (ASC) for non-verbal context.
- **Explainable Dispatch Logic:** Uses deterministic causal logic trees to propose dispatches, avoiding black-box AI decisions.
- **Human-In-The-Loop (HITL):** Automatically pauses auto-dispatch when confidence drops below 70%, routing the decision to a human operator with top probable intents highlighted.
- **Issue Restatement & Confirmation Loop:** The system generates a summary in the caller's language and requires verbal confirmation before any units are dispatched.
- **Privacy-First (DPDP Act 2023):** Real-time PII redaction at the transcription layer ensures no sensitive information is leaked or stored unencrypted.
- **Repeat Caller Linking:** Uses voice-print vectors to link current calls to past histories, allowing immediate escalation without requiring the victim to re-explain their trauma.

SahayakAI drastically reduces the cognitive load on 1092 operators, ensures accurate multi-agency coordination, and guarantees caller consent before action.
