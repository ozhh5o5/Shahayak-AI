import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, ShieldAlert, ClipboardCheck, Truck, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { getAllCases, createNewCase } from '@/data/mock-data';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function urgencyBadgeVariant(u: string | null) {
  if (u === 'IMMEDIATE') return 'destructive' as const;
  if (u === 'URGENT') return 'default' as const;
  return 'secondary' as const;
}

const COLORS = ['#e11d48', '#ea580c', '#d97706', '#64748b'];

export default function Dashboard() {
  const navigate = useNavigate();
  const cases = getAllCases();
  const today = new Date(); today.setHours(0,0,0,0);
  const casesToday = cases.filter(c => new Date(c.createdAt) >= today).length;
  const immediateToday = cases.filter(c => c.urgency === 'IMMEDIATE' && new Date(c.createdAt) >= today).length;
  const pendingVerification = cases.filter(c => c.status === 'PENDING_VERIFICATION').length;
  const dispatchedTotal = cases.filter(c => c.status === 'DISPATCHED').length;

  const urgencyCounts: Record<string, number> = {};
  cases.forEach(c => { if (c.urgency) urgencyCounts[c.urgency] = (urgencyCounts[c.urgency] ?? 0) + 1; });
  const donutData = Object.entries(urgencyCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const matrix: Record<string, Record<string, number>> = {};
  cases.forEach(c => {
    if (c.intent && c.urgency) {
      if (!matrix[c.intent]) matrix[c.intent] = {};
      matrix[c.intent][c.urgency] = (matrix[c.intent][c.urgency] ?? 0) + 1;
    }
  });

  const recent = [...cases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  const handleNewCall = () => {
    const c = createNewCase('KANNADA');
    navigate(`/intake/${c.id}`);
  };

  const intents = Object.keys(matrix).sort();
  const urgencies = ['IMMEDIATE', 'URGENT', 'STANDARD', 'INFORMATIONAL'];

  return (
    <main className="min-h-screen bg-gradient-to-b from-fuchsia-50/80 to-background">
      <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-fuchsia-700 tracking-tight">SahayakAI</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              AI-assisted intake for India&apos;s 1092 helpline — voice in Kannada, Hindi, English, Marathi, and
              Telugu; mock classification; PII redaction; dispatch registry. Operator-in-the-loop by design.
            </p>
            <p className="text-xs text-fuchsia-600 mt-2 font-medium">PanIIT AI for Bharat — Theme 12</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/cases"><Button variant="outline">All cases</Button></Link>
            <Button onClick={handleNewCall} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">Start new call</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-fuchsia-100">
            <CardHeader className="pb-2"><CardDescription>Cases today</CardDescription><CardTitle className="text-3xl tabular-nums">{casesToday}</CardTitle></CardHeader>
            <CardContent><Phone className="h-5 w-5 text-fuchsia-500" /></CardContent>
          </Card>
          <Card className="border-rose-100 bg-rose-50/50">
            <CardHeader className="pb-2"><CardDescription>Immediate (today)</CardDescription><CardTitle className="text-3xl tabular-nums text-rose-700">{immediateToday}</CardTitle></CardHeader>
            <CardContent><ShieldAlert className="h-5 w-5 text-rose-600" /></CardContent>
          </Card>
          <Card className="border-amber-100">
            <CardHeader className="pb-2"><CardDescription>Pending verification</CardDescription><CardTitle className="text-3xl tabular-nums">{pendingVerification}</CardTitle></CardHeader>
            <CardContent><ClipboardCheck className="h-5 w-5 text-amber-600" /></CardContent>
          </Card>
          <Card className="border-fuchsia-100">
            <CardHeader className="pb-2"><CardDescription>Dispatched (total)</CardDescription><CardTitle className="text-3xl tabular-nums">{dispatchedTotal}</CardTitle></CardHeader>
            <CardContent><Truck className="h-5 w-5 text-fuchsia-600" /></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Urgency distribution</CardTitle><CardDescription>All seeded + live cases</CardDescription></CardHeader>
            <CardContent>
              {donutData.length === 0 ? <p className="text-sm text-muted-foreground">No urgency data yet.</p> : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {donutData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Intent × urgency heatmap</CardTitle><CardDescription>Counts across the demo dataset</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              {intents.length === 0 ? <p className="text-sm text-muted-foreground">No classified cases yet.</p> : (
                <table className="w-full text-sm border-collapse">
                  <thead><tr><th className="text-left p-2 border bg-muted/50">Intent</th>
                    {urgencies.map(u => <th key={u} className="p-2 border bg-muted/50 text-center whitespace-nowrap">{u.slice(0,3)}</th>)}
                  </tr></thead>
                  <tbody>
                    {intents.map(intent => (
                      <tr key={intent}>
                        <td className="p-2 border font-medium whitespace-nowrap">{intent.replace(/_/g, ' ')}</td>
                        {urgencies.map(u => <td key={u} className="p-2 border text-center tabular-nums">{matrix[intent]?.[u] ?? '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-600" />Recent intakes</CardTitle>
            <CardDescription>Latest 10 cases</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (<p className="text-muted-foreground text-sm">No cases yet.</p>) : (
              recent.map(c => (
                <Link key={c.id} to={`/cases/${c.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="font-semibold">{c.caseNumber}</p>
                    <p className="text-xs text-muted-foreground">{c.callerPseudonym} · {format(new Date(c.createdAt), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.intent && <Badge variant="outline">{c.intent.replace(/_/g, ' ')}</Badge>}
                    {c.urgency && <Badge variant={urgencyBadgeVariant(c.urgency)}>{c.urgency.replace(/_/g, ' ')}</Badge>}
                    <Badge variant="secondary">{c.status.replace(/_/g, ' ')}</Badge>
                    {(c.confidence ?? 0) > 0 && <span className="text-xs text-muted-foreground">conf {(c.confidence ?? 0).toFixed(2)}</span>}
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
