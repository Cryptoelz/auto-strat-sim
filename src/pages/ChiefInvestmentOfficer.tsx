import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FEED, ALERTS, RECOMMENDATIONS, METRICS, KNOWLEDGE, INVESTIGATION_PROMPTS,
  buildDailyBrief, investigate, memoryTimeline, sortedFeed,
  type Severity, type Investigation, type FeedItem, type Recommendation,
} from '@/lib/cio';
import { MetricExplainDialog } from '@/components/cio/MetricExplainDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Landmark, AlertTriangle, TriangleAlert, CheckCircle2, Info, Send, Calculator,
  ArrowUpRight, Sunrise, Moon, Bell, Lightbulb, History, FlaskConical, ShieldCheck, X,
} from 'lucide-react';

const SEV = {
  high: { label: 'High Priority', icon: AlertTriangle, chip: 'border-destructive/40 bg-destructive/10 text-destructive', edge: 'border-l-destructive' },
  medium: { label: 'Medium Priority', icon: TriangleAlert, chip: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning', edge: 'border-l-trading-warning' },
  low: { label: 'Positive', icon: CheckCircle2, chip: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit', edge: 'border-l-trading-profit' },
  info: { label: 'Informational', icon: Info, chip: 'border-primary/40 bg-primary/10 text-primary', edge: 'border-l-primary' },
} as const satisfies Record<Severity, { label: string; icon: React.ElementType; chip: string; edge: string }>;

const healthState = {
  good: 'text-trading-profit',
  watch: 'text-trading-warning',
  risk: 'text-destructive',
} as const;

function ConfidenceChip({ value }: { value: number }) {
  return <Badge variant="outline" className="font-mono text-[10px]">confidence {value}%</Badge>;
}

export default function ChiefInvestmentOfficer() {
  const navigate = useNavigate();
  const [metricId, setMetricId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [briefKind, setBriefKind] = useState<'morning' | 'end-of-day'>('morning');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Investigation | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [simulation, setSimulation] = useState<Recommendation | null>(null);
  const [tab, setTab] = useState('feed');

  const brief = useMemo(() => buildDailyBrief(briefKind), [briefKind]);
  const feed = useMemo(() => sortedFeed(filter), [filter]);
  const alerts = useMemo(() => ALERTS.filter(a => !dismissed.includes(a.id)), [dismissed]);
  const memory = useMemo(() => memoryTimeline(), []);

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setAnswer(investigate(text));
    setTab('investigate');
  };

  const openFeed = (item: FeedItem) => navigate(item.ctaRoute);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Chief Investment Officer™</h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">PHASE 1</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Proactive executive intelligence across specialists, allocation, championship, validation, governance and
            the production path. Every statement is evidenced, confidence-scored, and clearly separated into
            observation and recommendation.
          </p>
        </div>
        <Badge variant="outline" className="border-trading-warning/40 bg-trading-warning/10 text-[10px] uppercase tracking-wider text-trading-warning">
          <ShieldCheck className="mr-1 h-3 w-3" /> Observation · Research · Simulation only
        </Badge>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="feed"><Bell className="mr-1.5 h-3.5 w-3.5" />Intelligence Feed</TabsTrigger>
          <TabsTrigger value="briefing"><Sunrise className="mr-1.5 h-3.5 w-3.5" />Daily Briefing</TabsTrigger>
          <TabsTrigger value="investigate"><Send className="mr-1.5 h-3.5 w-3.5" />Investigation</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />Alerts</TabsTrigger>
          <TabsTrigger value="recommendations"><Lightbulb className="mr-1.5 h-3.5 w-3.5" />Recommendations</TabsTrigger>
          <TabsTrigger value="metrics"><Calculator className="mr-1.5 h-3.5 w-3.5" />Explain Everything</TabsTrigger>
          <TabsTrigger value="memory"><History className="mr-1.5 h-3.5 w-3.5" />Executive Memory</TabsTrigger>
        </TabsList>

        {/* 1 · Executive Intelligence Feed */}
        <TabsContent value="feed" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(['all', 'high', 'medium', 'low', 'info'] as const).map(f => (
              <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="text-xs capitalize"
                onClick={() => setFilter(f)}>
                {f === 'all' ? 'All signals' : SEV[f].label}
              </Button>
            ))}
          </div>
          {feed.map(item => {
            const s = SEV[item.severity];
            const Icon = s.icon;
            return (
              <Card key={item.id} className={`border-l-4 ${s.edge}`}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] uppercase tracking-wider ${s.chip}`}>
                      <Icon className="h-3 w-3" /> {s.label}
                    </Badge>
                    <ConfidenceChip value={item.confidence} />
                    <Badge variant="secondary" className="text-[10px]">Impact: {item.impact}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  {item.reason && (
                    <p className="text-xs"><span className="text-muted-foreground">Reason: </span>{item.reason}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {item.sources.map(src => (
                      <Badge key={src} variant="outline" className="text-[10px]">{src}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => openFeed(item)}>
                      {item.ctaLabel} <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                    {item.metricIds.map(id => {
                      const m = METRICS.find(x => x.id === id);
                      return m ? (
                        <Button key={id} size="sm" variant="secondary" className="h-8 text-xs" onClick={() => setMetricId(id)}>
                          <Calculator className="mr-1 h-3 w-3" /> {m.label}
                        </Button>
                      ) : null;
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* 2 · Daily Executive Briefing */}
        <TabsContent value="briefing" className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={briefKind === 'morning' ? 'default' : 'outline'} onClick={() => setBriefKind('morning')}>
              <Sunrise className="mr-1.5 h-4 w-4" /> Morning Brief
            </Button>
            <Button size="sm" variant={briefKind === 'end-of-day' ? 'default' : 'outline'} onClick={() => setBriefKind('end-of-day')}>
              <Moon className="mr-1.5 h-4 w-4" /> End-of-Day Brief
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{briefKind === 'morning' ? 'Morning Brief' : 'End-of-Day Brief'}</CardTitle>
              <CardDescription>Generated {brief.generatedAt} · simulated session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-1 text-sm">
                {brief.summary.map((l, i) => <li key={i} className="text-muted-foreground">• {l}</li>)}
              </ul>
              <Separator />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border bg-card/40 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's priorities</div>
                  <ul className="mt-1.5 space-y-1 text-xs">
                    {brief.priorities.map((p, i) => <li key={i}>{i + 1}. {p}</li>)}
                  </ul>
                </div>
                <div className="space-y-3">
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider text-destructive">Biggest risk</div>
                      <ConfidenceChip value={brief.biggestRisk.confidence} />
                    </div>
                    <div className="mt-1 text-sm font-medium">{brief.biggestRisk.title}</div>
                    <p className="text-xs text-muted-foreground">{brief.biggestRisk.detail}</p>
                  </div>
                  <div className="rounded-md border border-trading-profit/30 bg-trading-profit/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider text-trading-profit">Biggest opportunity</div>
                      <ConfidenceChip value={brief.biggestOpportunity.confidence} />
                    </div>
                    <div className="mt-1 text-sm font-medium">{brief.biggestOpportunity.title}</div>
                    <p className="text-xs text-muted-foreground">{brief.biggestOpportunity.detail}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border bg-card/40 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promotion outlook</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-2xl">{brief.promotionOutlook.probability}%</span>
                    <Progress value={brief.promotionOutlook.probability} className="h-2 flex-1" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{brief.promotionOutlook.verdict}</p>
                  <p className="mt-1 text-xs"><span className="text-muted-foreground">Blocker: </span>{brief.promotionOutlook.blocker}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{brief.promotionOutlook.earliest}</p>
                </div>
                <div className="rounded-md border bg-card/40 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Research health</div>
                  <div className="mt-2 space-y-1">
                    {brief.researchHealth.map(h => (
                      <div key={h.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{h.label}</span>
                        <span className={`font-mono ${healthState[h.state]}`}>{h.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="text-xs uppercase tracking-wider text-primary">Executive summary</div>
                <p className="mt-1 text-sm leading-relaxed">{brief.executiveSummary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3 · AI Investigation Mode */}
        <TabsContent value="investigate" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Investigation mode</CardTitle>
              <CardDescription>
                Answers are drawn from indexed research artefacts only. Where evidence is absent the CIO declines to answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {INVESTIGATION_PROMPTS.map(p => (
                  <Button key={p} size="sm" variant="outline" className="text-xs" onClick={() => ask(p)}>{p}</Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask(question); } }}
                  placeholder="e.g. Why is promotion blocked?"
                  className="min-h-[60px]"
                />
                <Button className="self-end" onClick={() => ask(question)}>
                  <Send className="mr-1.5 h-4 w-4" /> Investigate
                </Button>
              </div>

              {answer && (
                <div className="space-y-4 rounded-md border bg-card/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Summary</div>
                      <p className="mt-1 text-sm font-medium">{answer.summary}</p>
                    </div>
                    <ConfidenceChip value={answer.confidence} />
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Evidence</div>
                    <ul className="mt-1 space-y-1 text-xs text-muted-foreground">
                      {answer.evidence.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-md border bg-muted/30 p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Observation</div>
                      <p className="text-xs">{answer.observation}</p>
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5">
                      <div className="text-[10px] uppercase tracking-wider text-primary">Recommendation (advisory only)</div>
                      <p className="text-xs">{answer.recommendation}</p>
                    </div>
                  </div>

                  {answer.metricIds.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Explain a metric</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {answer.metricIds.map(id => {
                          const m = METRICS.find(x => x.id === id);
                          return m ? (
                            <Button key={id} size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setMetricId(id)}>
                              <Calculator className="mr-1 h-3 w-3" /> {m.label}
                            </Button>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Linked research</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {answer.related.map(n => (
                        <Link key={n.id} to={n.route}>
                          <Badge variant="outline" className="gap-1 text-[10px] hover:bg-accent">
                            {n.title} <ArrowUpRight className="h-3 w-3" />
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Suggested investigation</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {answer.suggested.map(s => (
                        <Button key={s} size="sm" variant="ghost" className="h-7 text-xs" onClick={() => ask(s)}>{s} →</Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4 · Executive Alerts */}
        <TabsContent value="alerts" className="space-y-3">
          {alerts.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">All alerts dismissed for this session.</CardContent></Card>
          )}
          {alerts.map(a => {
            const s = SEV[a.severity];
            const Icon = s.icon;
            return (
              <Card key={a.id} className={`border-l-4 ${s.edge}`}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`gap-1 text-[10px] uppercase tracking-wider ${s.chip}`}>
                      <Icon className="h-3 w-3" /> {a.severity === 'low' ? 'Low' : s.label}
                    </Badge>
                    <ConfidenceChip value={a.confidence} />
                  </div>
                  <p className="text-sm font-semibold">{a.title}</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {a.evidence.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => ask(a.investigationQuestion)}>Open Investigation</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDismissed(d => [...d, a.id])}>
                      <X className="mr-1 h-3.5 w-3.5" /> Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {dismissed.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setDismissed([])}>Restore dismissed alerts</Button>
          )}
        </TabsContent>

        {/* 5 · Executive Recommendations */}
        <TabsContent value="recommendations" className="space-y-3">
          {RECOMMENDATIONS.map(r => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  {r.recommendation}
                  <ConfidenceChip value={r.confidence} />
                </CardTitle>
                <CardDescription>Advisory only — the CIO cannot apply this change.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-md border bg-muted/30 p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reason</div>
                    <p className="text-xs">{r.reason}</p>
                  </div>
                  <div className="rounded-md border border-trading-profit/30 bg-trading-profit/5 p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-trading-profit">Potential benefit</div>
                    <p className="text-xs">{r.benefit}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setSimulation(r)}>
                    <FlaskConical className="mr-1.5 h-3.5 w-3.5" /> Run Simulation
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => ask(r.recommendation)}>View Evidence</Button>
                  <Link to={r.primaryRoute}>
                    <Button size="sm" variant="outline">{r.primaryLabel} <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 6 · Explain Everything */}
        <TabsContent value="metrics" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {METRICS.map(m => (
            <Card key={m.id} className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setMetricId(m.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  {m.label}
                  <span className="font-mono text-lg">{m.value}</span>
                </CardTitle>
                <CardDescription className="text-xs">Trend: {m.trendVerdict} · {m.drivers.length} drivers</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-xs text-muted-foreground">{m.calculation}</p>
                <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">Explain this metric →</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* 7 · Executive Memory */}
        <TabsContent value="memory" className="space-y-3">
          <div className="relative space-y-3 border-l pl-6">
            {memory.map(e => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[27px] top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                <Card>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">{e.category}</Badge>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                      <span className="text-sm font-semibold">{e.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.detail}</p>
                    {e.outcome && <p className="text-xs"><span className="text-muted-foreground">Outcome: </span>{e.outcome}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {e.relatedIds.map(id => {
                        const n = KNOWLEDGE.find(k => k.id === id);
                        return n ? (
                          <Link key={id} to={n.route}>
                            <Badge variant="outline" className="gap-1 text-[10px] hover:bg-accent">
                              {n.title} <ArrowUpRight className="h-3 w-3" />
                            </Badge>
                          </Link>
                        ) : null;
                      })}
                    </div>

                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 8 / 9 · Personality + governance footer */}
      <Card className="border-trading-warning/30 bg-trading-warning/5">
        <CardContent className="flex flex-wrap items-center gap-3 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-trading-warning" />
          <span>
            The CIO reports observations and advisory recommendations only. It cannot modify strategies, allocations,
            parameters, promotion state, capital or execution, and it will decline to answer where evidence is absent.
          </span>
        </CardContent>
      </Card>

      <MetricExplainDialog metricId={metricId} onClose={() => setMetricId(null)} />

      <Dialog open={!!simulation} onOpenChange={o => !o && setSimulation(null)}>
        <DialogContent className="max-w-xl">
          {simulation && (
            <>
              <DialogHeader>
                <DialogTitle>Simulated outcome — {simulation.recommendation}</DialogTitle>
                <DialogDescription>
                  Hypothetical projection on historical research data. No allocation, parameter or governance state is changed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {simulation.simulation.map(row => (
                  <div key={row.label} className="rounded-md border p-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <span className="font-mono text-xs">
                        <span className="text-muted-foreground">{row.before}</span> → <span className="text-primary">{row.after}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{row.note}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border bg-muted/30 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Supporting evidence</div>
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {simulation.evidence.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
