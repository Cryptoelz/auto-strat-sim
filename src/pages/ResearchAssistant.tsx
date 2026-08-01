import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  askAssistant, buildBriefing, getMetric, searchKnowledge,
  KNOWLEDGE, METRICS, MEMORY, SUGGESTED_QUESTIONS,
  type AssistantAnswer, type MetricExplanation,
} from '@/lib/researchAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Brain, Send, Search, Calculator, History, Link2, Sunrise, Moon,
  TrendingUp, TrendingDown, Minus, ArrowUpRight, Sparkles,
} from 'lucide-react';

const impactStyle = {
  positive: 'border-trading-profit/40 bg-trading-profit/5',
  negative: 'border-destructive/40 bg-destructive/5',
  neutral: 'border-muted-foreground/30 bg-muted/30',
} as const;

const categoryStyle: Record<string, string> = {
  governance: 'border-primary/40 bg-primary/10 text-primary',
  champion: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit',
  promotion: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
  improvement: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit',
  recommendation: 'border-muted-foreground/40 bg-muted text-muted-foreground',
  research: 'border-primary/30 bg-primary/5 text-primary',
};

function RelatedList({ ids }: { ids: string[] }) {
  const nodes = ids.map(id => KNOWLEDGE.find(k => k.id === id)).filter(Boolean);
  if (nodes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {nodes.map(n => (
        <Link key={n!.id} to={n!.route}>
          <Badge variant="outline" className="gap-1 text-[10px] hover:bg-accent">
            {n!.title} <ArrowUpRight className="h-3 w-3" />
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function MetricDialog({ metric, onClose }: { metric: MetricExplanation | null; onClose: () => void }) {
  const TrendIcon = metric?.trendVerdict === 'improving' ? TrendingUp
    : metric?.trendVerdict === 'declining' ? TrendingDown : Minus;
  return (
    <Dialog open={!!metric} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {metric && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {metric.label}
                <Badge variant="outline" className="font-mono">{metric.value}</Badge>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <TrendIcon className="h-3.5 w-3.5" /> Trend: {metric.trendVerdict}
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Calculation</h4>
              <p className="rounded-md border bg-muted/30 p-3 font-mono text-xs">{metric.calculation}</p>
            </section>

            <section className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Drivers</h4>
              {metric.drivers.map((d, i) => (
                <div key={i} className={`rounded-md border p-2.5 ${impactStyle[d.impact]}`}>
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className="text-xs text-muted-foreground">{d.detail}</div>
                </div>
              ))}
            </section>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Supporting evidence</h4>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {metric.evidence.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </section>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Historical trend</h4>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metric.trend}>
                    <XAxis dataKey="period" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                    <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-1">
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground">Related reports</h4>
              <RelatedList ids={metric.relatedIds} />
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ResearchAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);
  const [metricId, setMetricId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [briefKind, setBriefKind] = useState<'morning' | 'end-of-day'>('morning');

  const briefing = useMemo(() => buildBriefing(briefKind), [briefKind]);
  const searchHits = useMemo(() => (search.trim() ? searchKnowledge(search, 8) : []), [search]);
  const activeMetric = metricId ? getMetric(metricId) : null;

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setAnswer(askAssistant(text));
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Research Assistant</h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">PHASE 2</Badge>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Platform-wide intelligence layer over specialists, strategies, championship, validation, allocation,
            Portfolio AI Director, Mission Control, Observation Centre, governance, production path, journals and executive reports.
          </p>
        </div>
        <Badge variant="outline" className="border-trading-warning/40 bg-trading-warning/10 text-[10px] uppercase tracking-wider text-trading-warning">
          Observation · Research · Simulation only
        </Badge>
      </header>

      <Tabs defaultValue="ask" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ask"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Ask Anything</TabsTrigger>
          <TabsTrigger value="metrics"><Calculator className="mr-1.5 h-3.5 w-3.5" />Explain Metrics</TabsTrigger>
          <TabsTrigger value="memory"><History className="mr-1.5 h-3.5 w-3.5" />Executive Memory</TabsTrigger>
          <TabsTrigger value="knowledge"><Link2 className="mr-1.5 h-3.5 w-3.5" />Related Knowledge</TabsTrigger>
          <TabsTrigger value="briefing"><Sunrise className="mr-1.5 h-3.5 w-3.5" />Daily Briefing</TabsTrigger>
        </TabsList>

        {/* Ask Anything */}
        <TabsContent value="ask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ask anything about the research programme</CardTitle>
              <CardDescription>Answers are traced to indexed research artefacts, with links and clickable metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map(s => (
                  <Button key={s} size="sm" variant="outline" className="text-xs" onClick={() => ask(s)}>{s}</Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask(question); } }}
                  placeholder="e.g. Why did promotion probability fall?"
                  className="min-h-[60px]"
                />
                <Button className="self-end" onClick={() => ask(question)}>
                  <Send className="mr-1.5 h-4 w-4" /> Ask
                </Button>
              </div>

              {answer && (
                <div className="space-y-4 rounded-md border bg-card/50 p-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Question</div>
                    <div className="mt-0.5 text-sm font-medium">{answer.question}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Answer</div>
                      <Badge variant="outline" className="font-mono text-[10px]">confidence {answer.confidence}%</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium">{answer.headline}</p>
                  </div>
                  {answer.reasoning.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Reasoning</div>
                      <ul className="mt-1 space-y-1 text-sm">
                        {answer.reasoning.map((r, i) => <li key={i} className="text-muted-foreground">• {r}</li>)}
                      </ul>
                    </div>
                  )}
                  {answer.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {answer.metrics.map((m, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-[10px]">{m}</Badge>
                      ))}
                    </div>
                  )}
                  {answer.metricIds.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Explain a metric</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {answer.metricIds.map(id => {
                          const m = getMetric(id);
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
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Related knowledge</div>
                    <div className="mt-1"><RelatedList ids={answer.related.map(r => r.id)} /></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics */}
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
                <Progress value={Math.min(100, m.trend[m.trend.length - 1].value * (m.trend[0].value > 10 ? 1 : 40))} className="h-1.5" />
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{m.calculation}</p>
                <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">Explain this metric →</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Memory */}
        <TabsContent value="memory" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive memory timeline</CardTitle>
              <CardDescription>Governance events, champion changes, promotions, improvements and prior recommendations.</CardDescription>
            </CardHeader>
          </Card>
          <div className="relative space-y-3 border-l pl-6">
            {[...MEMORY].reverse().map(e => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[27px] top-2 h-2.5 w-2.5 rounded-full bg-primary" />
                <Card>
                  <CardContent className="space-y-2 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] uppercase ${categoryStyle[e.category]}`}>{e.category}</Badge>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                      <span className="text-sm font-semibold">{e.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.detail}</p>
                    {e.outcome && <p className="text-xs"><span className="text-muted-foreground">Outcome: </span>{e.outcome}</p>}
                    <RelatedList ids={e.relatedIds} />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Knowledge */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Knowledge index</CardTitle>
              <CardDescription>Every research artefact the assistant can cite, linked to its page.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search specialists, reports, journals, allocation…" className="pl-8" />
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(searchHits.length > 0 ? searchHits : KNOWLEDGE).map(n => (
              <Card key={n.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{n.title}</CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-wider">{n.domain}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{n.summary}</p>
                  {n.metrics && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(n.metrics).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="font-mono text-[10px]">{k} {v}</Badge>
                      ))}
                    </div>
                  )}
                  <Link to={n.route}>
                    <Button size="sm" variant="outline" className="h-7 text-xs">Open page <ArrowUpRight className="ml-1 h-3 w-3" /></Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Briefing */}
        <TabsContent value="briefing" className="space-y-4">
          <div className="flex gap-2">
            <Button size="sm" variant={briefKind === 'morning' ? 'default' : 'outline'} onClick={() => setBriefKind('morning')}>
              <Sunrise className="mr-1.5 h-4 w-4" /> Morning briefing
            </Button>
            <Button size="sm" variant={briefKind === 'end-of-day' ? 'default' : 'outline'} onClick={() => setBriefKind('end-of-day')}>
              <Moon className="mr-1.5 h-4 w-4" /> End-of-day briefing
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{briefing.headline}</CardTitle>
              <CardDescription>Generated {briefing.generatedAt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {briefing.sections.map(s => (
                  <div key={s.heading} className="rounded-md border bg-card/40 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.heading}</div>
                    <ul className="mt-1.5 space-y-1 text-xs">
                      {s.lines.map((l, i) => <li key={i}>• {l}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="text-xs uppercase tracking-wider text-primary">Focus</div>
                <p className="mt-1 text-sm">{briefing.focus}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MetricDialog metric={activeMetric} onClose={() => setMetricId(null)} />
    </div>
  );
}
