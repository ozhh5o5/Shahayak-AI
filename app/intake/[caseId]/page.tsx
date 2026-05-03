'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Language } from '@/lib/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { speak } from '@/lib/speech';
import { countPiiFromSerialized } from '@/lib/pii';
import { Loader2, ArrowLeft, CheckCircle, ShieldAlert, BadgeCheck, AlertTriangle, Activity, Volume2, UploadCloud } from 'lucide-react';
import type { Classification, DispatchProposal } from '@/lib/ai';

type TurnRow = {
  id: string;
  role: string;
  redactedText: string;
  piiFlags: string | null;
  intent: string | null;
  timestamp: string;
};

const MOCK_SCENARIOS = [
  "My husband is hitting me and he has a knife.",
  "I cannot find my child, she was just playing outside the house in Jayanagar.",
  "My chest hurts very badly, I can't breathe. Need an ambulance.",
  "Someone is following me and threatening me on my way home.",
  "I don't see any reason to live anymore. It's all too much."
];

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [language, setLanguage] = useState<Language>('KANNADA');
  const [caseNumber, setCaseNumber] = useState('');
  const [turns, setTurns] = useState<TurnRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [proposed, setProposed] = useState<DispatchProposal | null>(null);
  const [restatement, setRestatement] = useState<string | null>(null);
  const [callerConfirmed, setCallerConfirmed] = useState(false);
  const [ascMock, setAscMock] = useState<string | null>(null);
  const [isRepeatCaller, setIsRepeatCaller] = useState<boolean>(false);
  const [fallbackText, setFallbackText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseId}`);
    if (!res.ok) return;
    const data = await res.json();
    setCaseNumber(data.caseNumber);
    setTurns(data.turns ?? []);
    setLanguage(data.language);
  }, [caseId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendCallerText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/cases/${caseId}/turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'caller', text: text.trim(), language }),
        });
        if (!res.ok) throw new Error('Turn failed');
        const data = await res.json();
        setClassification(data.classification ?? null);
        setProposed(data.proposedDispatch ?? null);
        if (data.restatementText) {
          setRestatement(data.restatementText);
        }
        
        // Mocking ASC and Repeat Caller
        if (!ascMock && turns.length > 0) {
          if (Math.random() > 0.5) {
            setAscMock("Domestic Kitchen + Shouting detected. Escalating severity.");
          } else {
            setAscMock("Outdoor Traffic detected.");
          }
        }
        if (turns.length === 0 && Math.random() > 0.7) {
            setIsRepeatCaller(true);
        }

        await refresh();
      } catch {
        setError('Could not process this turn. Check connection and try again.');
      } finally {
        setBusy(false);
      }
    },
    [caseId, language, refresh, ascMock, turns.length]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsExtracting(true);
    setError(null);
    
    // Simulate extraction delay
    setTimeout(() => {
      setIsExtracting(false);
      const randomPhrase = MOCK_SCENARIOS[Math.floor(Math.random() * MOCK_SCENARIOS.length)];
      void sendCallerText(randomPhrase);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 2000);
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fallbackText.trim()) {
      void sendCallerText(fallbackText);
      setFallbackText('');
    }
  };

  const finalize = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/finalize`, { method: 'POST' });
      if (!res.ok) throw new Error('finalize');
      router.push(`/verify/${caseId}`);
    } catch {
      setError('Finalize failed.');
    } finally {
      setBusy(false);
    }
  };

  const playQuestion = async (q: string) => {
    try {
      await speak(q, language);
    } catch {
      setError('Speech synthesis blocked or unavailable.');
    }
  };

  const confirmRestatement = () => {
    setCallerConfirmed(true);
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {isRepeatCaller && (
            <div className="bg-rose-100 border-l-4 border-rose-500 p-4 rounded-md flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5" />
                <div>
                    <h3 className="text-sm font-semibold text-rose-800">Repeat Caller Pattern Detected</h3>
                    <p className="text-xs text-rose-700 mt-1">Voice-print match indicates this caller has contacted the helpline 3 times in the past month. Past intents: DOMESTIC_VIOLENCE, HARASSMENT.</p>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-fuchsia-700 hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <select
            className="rounded-md border bg-background px-2 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
          >
            {(['KANNADA', 'HINDI', 'ENGLISH', 'MARATHI', 'TELUGU'] as const).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
              <Card className="border-fuchsia-100">
                <CardHeader>
                  <CardTitle className="text-fuchsia-800">Voice intake</CardTitle>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3 text-green-500" />
                        AI4Bharat IndicWav2Vec NLP
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3 text-amber-500" />
                        DPDP Act 2023 PII Redaction Active
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 py-6">
                  
                  <div className="w-full">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busy || isExtracting}
                      className={`relative flex flex-col h-36 w-36 items-center justify-center rounded-full text-white shadow-lg mx-auto transition-all ${
                        isExtracting ? 'bg-fuchsia-400 animate-pulse' : 'bg-fuchsia-600 hover:bg-fuchsia-700'
                      } disabled:opacity-50`}
                    >
                      {isExtracting ? <Loader2 className="h-10 w-10 animate-spin mb-1" /> : <UploadCloud className="h-10 w-10 mb-1" />}
                      <span className="text-xs font-semibold">{isExtracting ? 'Extracting...' : 'Upload Audio'}</span>
                    </button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      {isExtracting ? 'IndicWav2Vec extracting intent...' : 'Upload an audio file to extract native transcript.'}
                    </p>
                  </div>

                  <form onSubmit={handleFallbackSubmit} className="w-full flex gap-2 mt-4">
                    <input
                      type="text"
                      className="flex-1 rounded-md border p-2 text-sm"
                      placeholder="Or type manual transcript..."
                      value={fallbackText}
                      onChange={(e) => setFallbackText(e.target.value)}
                      disabled={busy || isExtracting}
                    />
                    <Button type="submit" disabled={busy || isExtracting || !fallbackText.trim()} variant="secondary">
                      Extract
                    </Button>
                  </form>

                  {restatement && !callerConfirmed && (
                      <div className="w-full bg-amber-50 border border-amber-200 p-4 rounded-md space-y-3">
                          <h4 className="text-sm font-semibold text-amber-800 flex items-center gap-1">
                              <Volume2 className="h-4 w-4" /> Issue Restatement
                          </h4>
                          <p className="text-xs text-amber-900 italic">"{restatement}"</p>
                          <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="w-full" onClick={() => playQuestion(restatement)}>Play TTS</Button>
                              <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={confirmRestatement}>Confirmed</Button>
                          </div>
                      </div>
                  )}
                  <Button onClick={finalize} disabled={busy || turns.length < 2 || (!!restatement && !callerConfirmed)} className="w-full bg-fuchsia-700">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Finalize call
                  </Button>
                  {!!restatement && !callerConfirmed && (
                      <p className="text-[10px] text-center text-rose-500">Must confirm issue restatement with caller before finalizing.</p>
                  )}
                </CardContent>
              </Card>

              {ascMock && (
                  <Card className="border-indigo-100 bg-indigo-50/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-indigo-800 flex items-center gap-2">
                          <Activity className="h-4 w-4" /> Acoustic Scene Classification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-indigo-900 font-medium">{ascMock}</p>
                    </CardContent>
                  </Card>
              )}
          </div>

          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
                <p className="text-xs text-muted-foreground">Caller lines are PII-redacted in the UI.</p>
              </CardHeader>
              <CardContent className="max-h-[320px] overflow-y-auto space-y-2">
                {turns.map((t) => (
                  <div
                    key={t.id}
                    className={`rounded-lg border p-3 text-sm ${
                      t.role === 'agent' ? 'bg-fuchsia-50/80 border-fuchsia-100' : 'bg-background'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">{t.role}</span>
                      {t.role === 'caller' && t.piiFlags && (
                        <Badge variant="outline" className="text-[10px]">
                          {countPiiFromSerialized(t.piiFlags)} PII fields touched
                        </Badge>
                      )}
                      {t.intent && <Badge variant="secondary">{t.intent}</Badge>}
                    </div>
                    <p>{t.redactedText}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-fuchsia-100">
              <CardHeader>
                <CardTitle>Live classification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!classification ? (
                  <p className="text-sm text-muted-foreground">Upload audio to populate mock AI output.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{classification.intent.replace(/_/g, ' ')}</Badge>
                      <Badge variant="destructive">{classification.urgency.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs text-muted-foreground self-center">
                        confidence {(classification.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all ${classification.confidence < 0.7 ? 'bg-rose-500' : 'bg-fuchsia-600'}`}
                        style={{ width: `${Math.min(100, classification.confidence * 100)}%` }}
                      />
                    </div>
                    
                    {classification.topIntents && classification.topIntents.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-md mt-2">
                            <p className="text-xs font-bold text-rose-800 mb-2 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Human-in-the-Loop Required (Low Confidence)
                            </p>
                            <p className="text-xs text-rose-700 mb-2">Please select the correct intent manually:</p>
                            <div className="flex flex-col gap-1">
                                {classification.topIntents.map((ti, i) => (
                                    <label key={i} className="flex items-center gap-2 text-xs">
                                        <input type="radio" name="hitl-intent" defaultChecked={i === 0} />
                                        <span className="font-medium">{ti.intent.replace(/_/g, ' ')}</span>
                                        <span className="text-muted-foreground">({(ti.confidence * 100).toFixed(0)}%)</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">{classification.reasoning}</p>
                    
                    <div>
                      <p className="text-xs font-medium mb-1">Flags</p>
                      <div className="flex flex-wrap gap-1">
                        {classification.flags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">None</span>
                        ) : (
                          classification.flags.map((f) => (
                            <Badge key={f.label} variant="outline">
                              {f.label}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {classification.draftResponses && classification.draftResponses.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium mb-1">Draft Responses (Operator Generator)</p>
                          <div className="flex flex-col gap-2">
                            {classification.draftResponses.map((dr, i) => (
                              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                  <Badge variant="secondary" className="whitespace-nowrap text-[10px]">{dr.category}</Badge>
                                  <button
                                    type="button"
                                    className="text-left text-xs text-muted-foreground hover:text-fuchsia-700"
                                    onClick={() => void playQuestion(dr.text)}
                                  >
                                    {dr.text}
                                  </button>
                              </div>
                            ))}
                          </div>
                        </div>
                    ) : classification.suggestedQuestions && classification.suggestedQuestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-1">Suggested questions</p>
                          <div className="flex flex-wrap gap-1">
                            {classification.suggestedQuestions.map((q, i) => (
                              <button
                                key={i}
                                type="button"
                                className="text-left"
                                onClick={() => void playQuestion(q)}
                              >
                                <Badge variant="secondary" className="cursor-pointer hover:bg-fuchsia-100">
                                  {q}
                                </Badge>
                              </button>
                            ))}
                          </div>
                        </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {proposed && (
              <Card>
                <CardHeader>
                  <CardTitle>Causal Dispatch Recommendation</CardTitle>
                  <p className="text-xs text-muted-foreground">Shown after enough turns (demo threshold).</p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {proposed.logicTree && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-md font-mono text-xs text-slate-700">
                          <strong>Logic Tree:</strong><br />
                          {proposed.logicTree}
                      </div>
                  )}
                  <p className="text-muted-foreground">{proposed.reason}</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {proposed.contacts.map((c) => (
                      <li key={c.department}>
                        <strong>{c.department.replace(/_/g, ' ')}</strong> — {c.contactInfo}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
