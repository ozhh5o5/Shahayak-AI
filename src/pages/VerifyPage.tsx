import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { DispatchDept, Intent, Urgency } from '@/lib/enums';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getCaseById, updateCase } from '@/data/mock-data';
import { buildDispatchContacts } from '@/lib/dispatch-registry';

const INTENTS: Intent[] = ['DOMESTIC_VIOLENCE','CHILD_ABUSE','MISSING_CHILD','MEDICAL_EMERGENCY','MENTAL_HEALTH','TRAFFICKING','HARASSMENT','LEGAL_AID_REQUEST','INFORMATION_REQUEST','OTHER'];
const URGENCIES: Urgency[] = ['IMMEDIATE','URGENT','STANDARD','INFORMATIONAL'];
const DEPTS: DispatchDept[] = ['POLICE','CHILD_WELFARE','MEDICAL','WOMEN_PROTECTION_OFFICER','MENTAL_HEALTH_CARE','LEGAL_AID','COMMUNITY_ESCALATION','NONE'];

export default function VerifyPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const c = getCaseById(caseId!);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent>((c?.intent as Intent) ?? 'OTHER');
  const [urgency, setUrgency] = useState<Urgency>((c?.urgency as Urgency) ?? 'STANDARD');
  const [dispatchDept, setDispatchDept] = useState<DispatchDept>((c?.dispatchDept as DispatchDept) ?? 'NONE');
  const [notes, setNotes] = useState(c?.verifierNotes ?? '');
  const [selectedDepts, setSelectedDepts] = useState<DispatchDept[]>(c?.dispatchDept && c.dispatchDept !== 'NONE' ? [c.dispatchDept as DispatchDept] : []);

  if (!c) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Case not found.</div>;

  const toggleDept = (d: DispatchDept) => setSelectedDepts(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const verifyAndDispatch = () => {
    setBusy(true);
    const depts = selectedDepts.length > 0 ? selectedDepts : [dispatchDept];
    const contacts = buildDispatchContacts(depts, 0);
    const dispatches = contacts.map(ct => ({ id: `disp-${Date.now()}-${ct.department}`, department: ct.department, contactInfo: ct.contactInfo, dispatchedAt: new Date().toISOString(), acknowledged: false }));
    updateCase(caseId!, {
      intent, urgency, dispatchDept, verified: true, verifierNotes: notes,
      verifiedAt: new Date().toISOString(), status: 'DISPATCHED', dispatches,
    });
    setBusy(false);
    navigate(`/cases/${caseId}`);
  };

  const escalate = () => {
    updateCase(caseId!, { status: 'ESCALATED' });
    navigate(`/cases/${caseId}`);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/" className="text-sm text-fuchsia-700 hover:underline inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <Card className="border-fuchsia-100">
          <CardHeader>
            <CardTitle>Operator verification</CardTitle>
            <p className="text-sm text-muted-foreground">Review AI reasoning, override if needed, then dispatch.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Case brief</Label><p className="mt-1 text-sm rounded-md border bg-background p-3 leading-relaxed">{c.summary || '—'}</p></div>
            <div><Label>Model reasoning</Label><p className="mt-1 text-xs text-muted-foreground leading-relaxed">{c.reasoning || '—'}</p>
              {c.confidence != null && <Badge variant="outline" className="mt-2">Confidence {(c.confidence * 100).toFixed(0)}%</Badge>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label htmlFor="intent">Intent</Label>
                <select id="intent" className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={intent} onChange={e => setIntent(e.target.value as Intent)}>
                  {INTENTS.map(i => <option key={i} value={i}>{i.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div><Label htmlFor="urgency">Urgency</Label>
                <select id="urgency" className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={urgency} onChange={e => setUrgency(e.target.value as Urgency)}>
                  {URGENCIES.map(u => <option key={u} value={u}>{u.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div><Label htmlFor="dept">Primary dispatch</Label>
                <select id="dept" className="mt-1 w-full rounded-md border bg-background px-2 py-2 text-sm" value={dispatchDept} onChange={e => setDispatchDept(e.target.value as DispatchDept)}>
                  {DEPTS.map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Dispatch rows to create</Label><p className="text-xs text-muted-foreground mb-2">Toggle departments for multi-agency demo routing.</p>
              <div className="flex flex-wrap gap-2">
                {DEPTS.filter(d => d !== 'NONE').map(d => (
                  <button key={d} type="button" onClick={() => toggleDept(d)} className={`rounded-full border px-3 py-1 text-xs ${selectedDepts.includes(d) ? 'bg-fuchsia-600 text-white border-fuchsia-600' : 'bg-background'}`}>{d.replace(/_/g,' ')}</button>
                ))}
              </div>
            </div>
            <div><Label htmlFor="notes">Verifier notes</Label>
              <Textarea id="notes" className="mt-1" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Audit notes, overrides, coordination…" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700" disabled={busy} onClick={verifyAndDispatch}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Verify &amp; dispatch
              </Button>
              <Button variant="destructive" type="button" disabled={busy} onClick={escalate}>Escalate</Button>
              <Link to={`/cases/${caseId}`}><Button variant="outline" type="button">Case file</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
