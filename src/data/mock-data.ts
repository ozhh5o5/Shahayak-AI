import type { CaseStatus, DispatchDept, Intent, Language, Urgency } from '@/lib/enums';
import { redactPii, piiFlagsToJson } from '@/lib/pii';
import { buildDispatchContacts } from '@/lib/dispatch-registry';

export interface MockCase {
  id: string;
  caseNumber: string;
  callerPseudonym: string;
  language: Language;
  intent: Intent | null;
  urgency: Urgency | null;
  confidence: number | null;
  dispatchDept: DispatchDept | null;
  dispatchReason: string | null;
  reasoning: string | null;
  summary: string | null;
  verified: boolean;
  verifierNotes: string | null;
  verifiedAt: string | null;
  status: CaseStatus;
  createdAt: string;
  turns: MockTurn[];
  flags: { id: string; label: string; details: string | null }[];
  dispatches: { id: string; department: string; contactInfo: string; dispatchedAt: string; acknowledged: boolean }[];
}

export interface MockTurn {
  id: string;
  role: string;
  language: string;
  rawText: string;
  redactedText: string;
  piiFlags: string | null;
  intent: string | null;
  timestamp: string;
}

let nextId = 1;
function uid() { return `mock-${nextId++}`; }

type Spec = {
  intent: Intent; urgency: Urgency; status: CaseStatus; verified: boolean;
  dispatchDept: DispatchDept | null; snippets: string[];
  flags?: { label: string; details?: string }[];
  verifierNotes?: string | null; confidence?: number;
};

const specs: Spec[] = [
  { intent: 'DOMESTIC_VIOLENCE', urgency: 'IMMEDIATE', status: 'PENDING_VERIFICATION', verified: false, dispatchDept: 'POLICE', snippets: ['My husband beats me when he drinks. I live near Jayanagar 560041. Call Priya at 9876543210.', 'Dowry harassment continues. I fear for my child at Green Valley School.'], flags: [{ label: 'minor_involved', details: 'Child mentioned' }] },
  { intent: 'DOMESTIC_VIOLENCE', urgency: 'URGENT', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['He hit me with a stick. Bleeding from head. Need help immediately.'], flags: [{ label: 'weapon_mentioned' }], confidence: 0.91 },
  { intent: 'DOMESTIC_VIOLENCE', urgency: 'URGENT', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Mother-in-law and husband both abuse me. Near Koramangala.'], confidence: 0.88 },
  { intent: 'CHILD_ABUSE', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'CHILD_WELFARE', snippets: ['Teacher inappropriate touch at St. Mary School. Parent Anita 9988776655.'], flags: [{ label: 'minor_involved' }], confidence: 0.93 },
  { intent: 'CHILD_ABUSE', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'CHILD_WELFARE', snippets: ['My daughter told me someone at the school touched her. I need help for my daughter immediately.'], confidence: 0.93 },
  { intent: 'MISSING_CHILD', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Child missing since morning near Indiranagar. Last seen in blue uniform. Contact Ramesh 9123456789.'], confidence: 0.93 },
  { intent: 'MISSING_CHILD', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Cannot find my child. She was just playing outside the house in Jayanagar.'], confidence: 0.93 },
  { intent: 'MENTAL_HEALTH', urgency: 'STANDARD', status: 'PENDING_VERIFICATION', verified: false, dispatchDept: 'MENTAL_HEALTH_CARE', snippets: ['Something happened, I feel confused and need someone to talk.'], confidence: 0.42 },
  { intent: 'MENTAL_HEALTH', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'MENTAL_HEALTH_CARE', snippets: ['Suicide thoughts — no reason to live. Please help.'], confidence: 0.94 },
  { intent: 'MEDICAL_EMERGENCY', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'MEDICAL', snippets: ['Person unconscious, not breathing well. Pincode 560095. Call 9988776655.'], confidence: 0.92 },
  { intent: 'TRAFFICKING', urgency: 'IMMEDIATE', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Trafficked to another city, forced marriage. I escaped but fear being sold again.'], flags: [{ label: 'weapon_mentioned', details: 'Threat with blade mentioned' }], confidence: 0.9 },
  { intent: 'HARASSMENT', urgency: 'URGENT', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Stalking daily near office Koramangala. Same person follows after work.'], confidence: 0.86 },
  { intent: 'HARASSMENT', urgency: 'URGENT', status: 'DISPATCHED', verified: true, dispatchDept: 'POLICE', snippets: ['Someone is following me and threatening me on my way home.'], confidence: 0.86 },
  { intent: 'LEGAL_AID_REQUEST', urgency: 'STANDARD', status: 'CLOSED', verified: true, dispatchDept: 'LEGAL_AID', snippets: ['I need a lawyer to file FIR against my neighbor. What are my rights?'], confidence: 0.78 },
  { intent: 'INFORMATION_REQUEST', urgency: 'INFORMATIONAL', status: 'CLOSED', verified: true, dispatchDept: 'NONE', snippets: ['What are 1092 helpline hours and how to file a complaint in Bengaluru?'], confidence: 0.81 },
];

const langs: Language[] = ['KANNADA', 'HINDI', 'ENGLISH', 'MARATHI', 'TELUGU'];

function buildCase(spec: Spec, i: number): MockCase {
  const lang = langs[i % langs.length]!;
  const created = new Date();
  created.setDate(created.getDate() - Math.floor(Math.random() * 30));
  created.setHours(8 + (i % 10));
  const id = uid();
  const turns: MockTurn[] = [];
  const nTurns = 4 + (i % 6);
  for (let t = 0; t < nTurns; t++) {
    const isCaller = t % 2 === 0;
    const raw = isCaller
      ? spec.snippets[t % spec.snippets.length]! + ` Turn ${t}.`
      : `Agent: we are here to help. Can you share whether you are safe? (turn ${t})`;
    const { redactedText, piiFlags } = redactPii(raw);
    const ts = new Date(created);
    ts.setMinutes(ts.getMinutes() + t * 2);
    turns.push({
      id: uid(), role: isCaller ? 'caller' : 'agent', language: lang, rawText: raw,
      redactedText: isCaller ? redactedText : raw,
      piiFlags: isCaller ? piiFlagsToJson(piiFlags) : null,
      intent: isCaller ? spec.intent : null,
      timestamp: ts.toISOString(),
    });
  }
  const flags = (spec.flags ?? []).map(f => ({ id: uid(), label: f.label, details: f.details ?? null }));
  const dispatches: MockCase['dispatches'] = [];
  if (spec.status === 'DISPATCHED' && spec.dispatchDept && spec.dispatchDept !== 'NONE') {
    const depts = spec.intent === 'DOMESTIC_VIOLENCE'
      ? (['POLICE', 'WOMEN_PROTECTION_OFFICER'] as DispatchDept[])
      : [spec.dispatchDept];
    const contacts = buildDispatchContacts(depts, i);
    for (const c of contacts) {
      dispatches.push({ id: uid(), department: c.department, contactInfo: c.contactInfo, dispatchedAt: new Date().toISOString(), acknowledged: Math.random() > 0.7 });
    }
  }

  return {
    id, caseNumber: `1092-2026-${String(i + 1).padStart(5, '0')}`,
    callerPseudonym: `Caller-${String.fromCharCode(65 + (i % 26))}${i}`,
    language: lang, intent: spec.intent, urgency: spec.urgency,
    confidence: spec.confidence ?? 0.84, dispatchDept: spec.dispatchDept,
    dispatchReason: 'Seeded synthetic routing rationale.', reasoning: 'Mock AI reasoning from keyword rules.',
    summary: `Synthetic brief for ${spec.intent.replace(/_/g, ' ').toLowerCase()} — demo only.`,
    verified: spec.verified, verifierNotes: spec.verifierNotes ?? null,
    verifiedAt: spec.verified ? new Date().toISOString() : null,
    status: spec.status, createdAt: created.toISOString(), turns, flags, dispatches,
  };
}

export const MOCK_CASES: MockCase[] = specs.map((s, i) => buildCase(s, i));

// Mutable store for runtime intake cases
const runtimeCases: MockCase[] = [];

export function getAllCases(): MockCase[] {
  return [...MOCK_CASES, ...runtimeCases];
}

export function getCaseById(id: string): MockCase | undefined {
  return getAllCases().find(c => c.id === id);
}

export function createNewCase(language: Language): MockCase {
  const id = uid();
  const c: MockCase = {
    id, caseNumber: `1092-2026-${String(getAllCases().length + 1).padStart(5, '0')}`,
    callerPseudonym: `Caller-LIVE-${id.slice(-4)}`,
    language, intent: null, urgency: null, confidence: null,
    dispatchDept: null, dispatchReason: null, reasoning: null, summary: null,
    verified: false, verifierNotes: null, verifiedAt: null,
    status: 'INTAKE_IN_PROGRESS', createdAt: new Date().toISOString(),
    turns: [], flags: [], dispatches: [],
  };
  runtimeCases.push(c);
  return c;
}

export function addTurnToCase(caseId: string, turn: MockTurn) {
  const c = getCaseById(caseId);
  if (c) c.turns.push(turn);
}

export function updateCase(caseId: string, updates: Partial<MockCase>) {
  const c = getCaseById(caseId);
  if (c) Object.assign(c, updates);
}
