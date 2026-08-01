import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Sparkles, AlertTriangle, ShieldCheck, Activity, FlaskConical,
  History, Rss, Gavel, ExternalLink, TrendingUp, TrendingDown, Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  DAILY_PACK, RESEARCH_TIMELINE, DISCOVERY_FEED, GOVERNANCE_GUARANTEES,
  SEVERITY_LABEL, VERDICT_LABEL, CATEGORY_LABEL,
  type Discovery, type Severity, type Verdict, type Hypothesis,
} from '@/lib/autonomousResearch';

const sevClass: Record<Severity, string> = {
  info: 'border-border text-muted-foreground',
  positive: 'border-success/40 text-success',
  warning: 'border-warning/40 text-warning',
  critical: 'border-destructive/40 text-destructive',
};

const verdictClass: Record<Verdict, string> = {
  confirmed: 'bg-success/15 text-success border-success/30',
  needs_more_data: 'bg-muted text-muted-foreground border-border',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  high_priority: 'bg-warning/15 text-warning border-warning/30',
};

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-md border border-border bg-muted/40 p-2"><Icon className="h-4 w-4 text-primary" /></div>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function DiscoveryCard({ d, onOpen }: { d: Discovery; onOpen: (d: Discovery) => void }) {
  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={sevClass[d.severity]}>{SEVERITY_LABEL[d.severity]}</Badge>
          <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABEL[d.category]}</Badge>
          <Badge variant="outline" className={`text-[10px] ${verdictClass[d.verdict]}`}>{VERDICT_LABEL[d.verdict]}</Badge>
          <span className="ml-auto text-[10px] text-muted-foreground">Day {d.day}</span>
        </div>
        <CardTitle className="pt-1 text-sm">{d.title}</CardTitle>
        <CardDescription className="text-xs">{d.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Confidence</span><span className="font-mono">{d.confidence}%</span>
          </div>
          <Progress value={d.confidence} className="h-1.5" />
        </div>
        <p className="text-xs"><span className="text-muted-foreground">Expected impact: </span>{d.expectedImpact}</p>
        <div className="flex flex-wrap gap-1.5">
          {d.links.map(l => (
            <Link key={l.url} to={l.url}>
              <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted">
                <ExternalLink className="h-2.5 w-2.5" />{l.label}
              </Badge>
            </Link>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="w-full" onClick={() => onOpen(d)}>Explain discovery</Button>
      </CardContent>
    </Card>
  );
}

function HypothesisCard({ h }: { h: Hypothesis }) {
  const [sim, setSim] = useState(false);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={
            h.status === 'validated' ? sevClass.positive : h.status === 'rejected' ? sevClass.critical : sevClass.info
          }>
            {h.status === 'validated' ? 'Validated' : h.status === 'rejected' ? 'Rejected' : 'Open'}
          </Badge>
          <span className="ml-auto font-mono text-[10px] text-muted-foreground">Confidence {h.confidence}%</span>
        </div>
        <CardTitle className="pt-1 text-sm leading-snug">{h.statement}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-medium text-success">Supporting evidence</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {h.supporting.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-medium text-destructive">Contradicting evidence</p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {h.contradicting.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        </div>
        <Progress value={h.confidence} className="h-1.5" />
        <Button size="sm" variant={sim ? 'outline' : 'default'} onClick={() => setSim(v => !v)}>
          <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
          {sim ? 'Hide simulation' : h.simulation.label}
        </Button>
        {sim && (
          <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
            {h.simulation.deltas.map(d => {
              const improved = d.betterHigher ? d.after > d.before : d.after < d.before;
              return (
                <div key={d.metric} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{d.metric}</span>
                  <span className="flex items-center gap-2 font-mono">
                    <span className="text-muted-foreground">{d.before}{d.unit}</span>
                    <span>→</span>
                    <span className={improved ? 'text-success' : 'text-destructive'}>{d.after}{d.unit}</span>
                    {improved ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                  </span>
                </div>
              );
            })}
            <p className="pt-1 text-[10px] text-muted-foreground">{h.simulation.note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AutonomousResearch() {
  const pack = DAILY_PACK;
  const [open, setOpen] = useState<Discovery | null>(null);
  const counts = useMemo(() => ({
    critical: pack.discoveries.filter(d => d.severity === 'critical').length,
    warning: pack.discoveries.filter(d => d.severity === 'warning').length,
    positive: pack.discoveries.filter(d => d.severity === 'positive').length,
  }), [pack.discoveries]);

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-2.5"><Bot className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-lg font-bold sm:text-xl">Autonomous Research Engine™</h1>
            <p className="text-xs text-muted-foreground">
              Continuously analyses the research ecosystem and produces new research without waiting for questions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" />Observation Only</Badge>
          <Badge variant="outline" className="text-[10px]">Research Only</Badge>
          <Badge variant="outline" className="text-[10px]">Simulation Only</Badge>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Research Day', value: String(pack.day), hint: 'Simulated cycle' },
          { label: 'Discoveries', value: String(pack.discoveries.length), hint: `${counts.positive} positive` },
          { label: 'Open Hypotheses', value: String(pack.hypotheses.filter(h => h.status === 'open').length), hint: `${pack.score.rejectedHypotheses} rejected` },
          { label: 'Research Score', value: `${pack.score.composite}`, hint: `Grade ${pack.score.grade}` },
          { label: 'Alerts', value: `${counts.critical + counts.warning}`, hint: `${counts.critical} critical` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="font-mono text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/25 bg-primary/5">
        <CardContent className="flex gap-3 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed">{pack.headline}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="daily" className="text-xs">Daily Pack</TabsTrigger>
          <TabsTrigger value="discoveries" className="text-xs">Discoveries</TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs">Hypotheses</TabsTrigger>
          <TabsTrigger value="overnight" className="text-xs">Overnight Report</TabsTrigger>
          <TabsTrigger value="score" className="text-xs">Research Score</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
          <TabsTrigger value="review" className="text-xs">Executive Review</TabsTrigger>
          <TabsTrigger value="governance" className="text-xs">Governance</TabsTrigger>
        </TabsList>

        {/* 1 — Daily pack */}
        <TabsContent value="daily" className="space-y-4">
          <SectionHeading icon={Activity} title="Autonomous Daily Research" subtitle="Every simulated research day the engine scans each module and assembles a Daily Research Pack." />
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {pack.modulesScanned.map(m => (
                  <div key={m.module} className="flex flex-wrap items-center gap-3 p-3">
                    <Badge variant="outline" className={
                      m.status === 'flag' ? sevClass.critical : m.status === 'signal' ? sevClass.warning : sevClass.positive
                    }>
                      {m.status === 'flag' ? 'Flag' : m.status === 'signal' ? 'Signal' : 'Clean'}
                    </Badge>
                    <Link to={m.url} className="text-xs font-medium hover:underline">{m.module}</Link>
                    <span className="flex-1 text-xs text-muted-foreground">{m.note}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2 — Discovery engine */}
        <TabsContent value="discoveries" className="space-y-4">
          <SectionHeading icon={Sparkles} title="Discovery Engine" subtitle="Automatic scans for performance, risk, correlation, degradation, efficiency, diversification, regime and promotion signals." />
          <div className="grid gap-4 md:grid-cols-2">
            {pack.discoveries.map(d => <DiscoveryCard key={d.id} d={d} onOpen={setOpen} />)}
          </div>
        </TabsContent>

        {/* 3 — Hypotheses */}
        <TabsContent value="hypotheses" className="space-y-4">
          <SectionHeading icon={FlaskConical} title="AI Hypothesis Generator" subtitle="Hypotheses are generated from discovery evidence. Simulations are hypothetical and never applied." />
          <div className="grid gap-4 md:grid-cols-2">
            {pack.hypotheses.map(h => <HypothesisCard key={h.id} h={h} />)}
          </div>
        </TabsContent>

        {/* 4 — Overnight */}
        <TabsContent value="overnight" className="space-y-4">
          <SectionHeading icon={Bot} title="Overnight Research Report" subtitle={pack.overnight.generatedAt} />
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { t: 'Biggest discovery', v: pack.overnight.biggestDiscovery, c: 'positive' as Severity },
              { t: 'Biggest risk', v: pack.overnight.biggestRisk, c: 'critical' as Severity },
              { t: 'Biggest improvement', v: pack.overnight.biggestImprovement, c: 'positive' as Severity },
              { t: 'Biggest regression', v: pack.overnight.biggestRegression, c: 'warning' as Severity },
            ].map(x => (
              <Card key={x.t}>
                <CardHeader className="pb-2">
                  <Badge variant="outline" className={`w-fit ${sevClass[x.c]}`}>{x.t}</Badge>
                </CardHeader>
                <CardContent><p className="text-xs leading-relaxed">{x.v}</p></CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">New unanswered questions</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-xs text-muted-foreground">{pack.overnight.openQuestions.map((q, i) => <li key={i}>• {q}</li>)}</ul></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Recommended investigations</CardTitle></CardHeader>
              <CardContent><ul className="space-y-2 text-xs text-muted-foreground">{pack.overnight.recommendedInvestigations.map((q, i) => <li key={i}>• {q}</li>)}</ul></CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Research confidence</span>
                <span className="font-mono">{pack.overnight.researchConfidence}%</span>
              </div>
              <Progress value={pack.overnight.researchConfidence} className="h-2" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5 — Score */}
        <TabsContent value="score" className="space-y-4">
          <SectionHeading icon={Activity} title="Research Score" subtitle="Quality of the intelligence generated on this research day." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { l: 'Discoveries', v: pack.score.discoveries },
              { l: 'Confirmed discoveries', v: pack.score.confirmedDiscoveries },
              { l: 'Rejected hypotheses', v: pack.score.rejectedHypotheses },
              { l: 'Composite', v: pack.score.composite },
            ].map(x => (
              <Card key={x.l}><CardContent className="p-4">
                <p className="text-[11px] text-muted-foreground">{x.l}</p>
                <p className="font-mono text-2xl font-bold">{x.v}</p>
              </CardContent></Card>
            ))}
          </div>
          <Card>
            <CardContent className="space-y-4 p-4">
              {[
                { l: 'Research quality', v: pack.score.researchQuality },
                { l: 'Novelty', v: pack.score.novelty },
                { l: 'Evidence strength', v: pack.score.evidenceStrength },
                { l: 'Executive usefulness', v: pack.score.executiveUsefulness },
              ].map(x => (
                <div key={x.l}>
                  <div className="mb-1 flex justify-between text-xs"><span>{x.l}</span><span className="font-mono">{x.v}</span></div>
                  <Progress value={x.v} className="h-1.5" />
                </div>
              ))}
              <Separator />
              <p className="text-xs text-muted-foreground">Overall research grade: <span className="font-mono font-bold text-foreground">{pack.score.grade}</span></p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6 — Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <SectionHeading icon={History} title="Research Timeline" subtitle="Every discovery, hypothesis, validation, rejection and confirmation, linked to source evidence." />
          <Card>
            <CardContent className="p-4">
              <div className="relative space-y-4 border-l border-border pl-5">
                {RESEARCH_TIMELINE.map(e => {
                  const src = pack.discoveries.find(d => d.id === e.sourceId);
                  return (
                    <div key={e.id} className="relative">
                      <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border border-primary bg-background" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase">{e.kind}</Badge>
                        <span className="text-xs font-medium">{e.title}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">Day {e.day}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                      {src && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-[11px]" onClick={() => setOpen(src)}>
                          View source evidence
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7 — Feed */}
        <TabsContent value="feed" className="space-y-4">
          <SectionHeading icon={Rss} title="Discovery Feed" subtitle="Live scrolling stream of engine output." />
          <Card>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px]">
                <div className="divide-y divide-border">
                  {DISCOVERY_FEED.map(f => (
                    <div key={f.id} className="flex items-start gap-3 p-3">
                      <Badge variant="outline" className={`shrink-0 text-[10px] ${sevClass[f.severity]}`}>{f.tag}</Badge>
                      <p className="flex-1 text-xs">{f.text}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{f.minutesAgo}m ago</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8 — Executive review */}
        <TabsContent value="review" className="space-y-4">
          <SectionHeading icon={Gavel} title="Executive Review" subtitle="Every discovery receives Research Director, CIO, Risk and Governance review before an executive verdict." />
          <div className="space-y-4">
            {pack.discoveries.map(d => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-sm">{d.title}</CardTitle>
                    <Badge variant="outline" className={`ml-auto text-[10px] ${verdictClass[d.verdict]}`}>{VERDICT_LABEL[d.verdict]}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {d.reviews.map(r => (
                    <div key={r.reviewer} className="rounded-md border border-border p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium">{r.reviewer}</span>
                        <Badge variant="outline" className={`text-[9px] ${
                          r.stance === 'support' ? sevClass.positive : r.stance === 'caution' ? sevClass.warning : sevClass.info
                        }`}>{r.stance}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.comment}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 10 — Governance */}
        <TabsContent value="governance" className="space-y-4">
          <SectionHeading icon={ShieldCheck} title="Governance" subtitle="Hard constraints on the engine. Everything it produces is advisory and fully traceable." />
          <Card className="border-success/30">
            <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
              {GOVERNANCE_GUARANTEES.map(g => (
                <div key={g} className="flex items-center gap-2 rounded-md border border-border p-2.5">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <span className="text-xs">{g}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                The Autonomous Research Engine operates strictly in observation, research and simulation mode. It cannot trade,
                execute, rebalance, alter allocations or parameters, promote a strategy, move capital or bypass any governance gate.
                Every discovery, hypothesis and simulation links back to the source module that produced its evidence.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 9 — Explain discovery */}
      <Dialog open={!!open} onOpenChange={o => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={sevClass[open.severity]}>{SEVERITY_LABEL[open.severity]}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{CATEGORY_LABEL[open.category]}</Badge>
                  <Badge variant="outline" className={`text-[10px] ${verdictClass[open.verdict]}`}>{VERDICT_LABEL[open.verdict]}</Badge>
                </div>
                <DialogTitle className="text-base">{open.title}</DialogTitle>
                <DialogDescription className="text-xs">{open.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-[11px] font-medium">Why it was found</p>
                  <p className="text-xs text-muted-foreground">{open.whyFound}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Evidence used</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">{open.evidence.map((e, i) => <li key={i}>• {e}</li>)}</ul>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Confidence calculation</p>
                  <p className="rounded-md border border-border bg-muted/30 p-2.5 font-mono text-[11px]">{open.confidenceCalc}</p>
                  <Progress value={open.confidence} className="mt-2 h-1.5" />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Supporting chart</p>
                  <div className="h-48 rounded-md border border-border p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={open.trend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Line type="monotone" dataKey="value" name="Observed" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="baseline" name="Baseline" stroke="hsl(var(--muted-foreground))" dot={false} strokeDasharray="4 4" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Historical comparison</p>
                  <p className="text-xs text-muted-foreground">{open.historicalComparison}</p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Related specialists</p>
                  <div className="flex flex-wrap gap-1.5">
                    {open.relatedSpecialists.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium">Related reports</p>
                  <div className="flex flex-wrap gap-1.5">
                    {open.links.map(l => (
                      <Link key={l.url} to={l.url} onClick={() => setOpen(null)}>
                        <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted">
                          <ExternalLink className="h-2.5 w-2.5" />{l.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Advisory output only — no allocation, parameter or governance change results from this discovery.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
