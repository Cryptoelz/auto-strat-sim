import { useEffect, useMemo, useState } from 'react';
import { loadSessionHistory } from '@/lib/sessionHistory';
import {
  computeConfidence,
  scanOpportunities,
  generateRecommendations,
  generateInsights,
  answerOperatorQuestion,
  getSuggestedQuestions,
  type OperatorAnswer,
} from '@/lib/commandCenter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Sparkles, ShieldCheck, TrendingUp, TrendingDown, AlertTriangle,
  Compass, Brain, Activity, Gauge, MessageSquare, Send,
} from 'lucide-react';

const bandColor: Record<string, string> = {
  strong: 'text-success border-success/40 bg-success/10',
  healthy: 'text-primary border-primary/40 bg-primary/10',
  cautious: 'text-warning border-warning/40 bg-warning/10',
  weak: 'text-destructive border-destructive/40 bg-destructive/10',
};

const severityColor: Record<string, string> = {
  positive: 'border-success/40 bg-success/5',
  info: 'border-primary/30 bg-primary/5',
  caution: 'border-warning/40 bg-warning/5',
  critical: 'border-destructive/40 bg-destructive/10',
  warning: 'border-warning/40 bg-warning/5',
  neutral: 'border-muted-foreground/30 bg-muted/30',
};

export default function CommandCenter() {
  const [sessions, setSessions] = useState(() => loadSessionHistory());
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<OperatorAnswer | null>(null);

  useEffect(() => {
    const onStorage = () => setSessions(loadSessionHistory());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const confidence = useMemo(() => computeConfidence(sessions), [sessions]);
  const opportunities = useMemo(() => scanOpportunities(sessions), [sessions]);
  const recommendations = useMemo(() => generateRecommendations(sessions), [sessions]);
  const insights = useMemo(() => generateInsights(sessions), [sessions]);
  const suggested = getSuggestedQuestions();

  const ask = (q: string) => {
    const text = q.trim();
    if (!text) return;
    setQuestion(text);
    setAnswer(answerOperatorQuestion(text, sessions));
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Command Center</h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
              INTELLIGENCE LAYER
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain-English intelligence over archived sessions, regimes and per-trade context. Every recommendation is explainable.
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {sessions.length} archived session{sessions.length === 1 ? '' : 's'} ·{' '}
          {sessions.reduce((s, x) => s + x.trades.length, 0)} trades
        </div>
      </header>

      {/* Confidence */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4" /> System Confidence
            </CardTitle>
            <CardDescription>{confidence.summary}</CardDescription>
          </div>
          <div className={`rounded-lg border px-4 py-2 text-right ${bandColor[confidence.band]}`}>
            <div className="text-3xl font-bold leading-none">{confidence.overall}</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider">{confidence.band}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {confidence.factors.map(f => (
              <div key={f.key} className="rounded-md border bg-card/30 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.label}</span>
                  <span className="text-xs text-muted-foreground">weight {(f.weight * 100).toFixed(0)}%</span>
                </div>
                <Progress value={f.score} className="my-2 h-1.5" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{f.detail}</span>
                  <span className="font-mono">{f.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ask" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ask"><MessageSquare className="mr-1.5 h-3.5 w-3.5" />Ask</TabsTrigger>
          <TabsTrigger value="opportunities"><Compass className="mr-1.5 h-3.5 w-3.5" />Opportunities</TabsTrigger>
          <TabsTrigger value="recommendations"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Recommendations</TabsTrigger>
          <TabsTrigger value="insights"><Brain className="mr-1.5 h-3.5 w-3.5" />Insights</TabsTrigger>
        </TabsList>

        {/* Ask */}
        <TabsContent value="ask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operator Questions</CardTitle>
              <CardDescription>Ask in plain English. The engine routes to the relevant analytics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {suggested.map(s => (
                  <Button key={s} size="sm" variant="outline" className="text-xs" onClick={() => ask(s)}>
                    {s}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ask(question); }
                  }}
                  placeholder="e.g. Why did performance change this week?"
                  className="min-h-[60px]"
                />
                <Button onClick={() => ask(question)} className="self-end">
                  <Send className="mr-1.5 h-4 w-4" /> Ask
                </Button>
              </div>

              {answer && (
                <div className="rounded-md border bg-card/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Question</div>
                  <div className="mt-1 text-sm font-medium">{answer.question}</div>
                  <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Answer</div>
                  <p className="mt-1 text-sm">{answer.summary}</p>
                  {answer.sections.length > 0 && (
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {answer.sections.map((s, i) => (
                        <div key={i} className="rounded-md border bg-background p-3">
                          <div className="text-xs font-semibold">{s.heading}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{s.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {answer.metrics.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {answer.metrics.map((m, i) => (
                        <Badge key={i} variant="outline" className="font-mono text-[10px]">{m}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities" className="space-y-3">
          {opportunities.length === 0 && (
            <Card><CardContent className="py-6 text-sm text-muted-foreground">
              No opportunities detected yet. Run more sessions to populate the scanner.
            </CardContent></Card>
          )}
          {opportunities.map(o => {
            const Icon = o.kind === 'improving' ? TrendingUp :
                         o.kind === 'deteriorating' ? TrendingDown :
                         o.kind === 'anomaly' ? AlertTriangle :
                         o.kind === 'regime_shift' ? Activity : Sparkles;
            return (
              <Card key={o.id} className={severityColor[o.severity]}>
                <CardContent className="flex items-start gap-3 py-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{o.title}</div>
                      {o.metric && <Badge variant="outline" className="font-mono text-[10px]">{o.metric}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{o.detail}</p>
                    <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider">{o.kind.replace('_', ' ')}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-3">
          <Accordion type="multiple" className="space-y-2">
            {recommendations.map(r => (
              <AccordionItem key={r.id} value={r.id} className={`rounded-md border px-3 ${severityColor[r.severity]}`}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <Badge variant="outline" className="text-[10px] uppercase">{r.severity}</Badge>
                    <span className="text-sm font-medium">{r.action}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Why</div>
                    <p className="mt-1 text-sm">{r.rationale}</p>
                  </div>
                  {r.metrics.length > 0 && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">Supporting metrics</div>
                      <ul className="mt-1 space-y-0.5 text-xs">
                        {r.metrics.map((m, i) => <li key={i} className="font-mono">• {m}</li>)}
                      </ul>
                    </div>
                  )}
                  {r.contextTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.contextTags.map(t => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* Insights */}
        <TabsContent value="insights" className="grid gap-3 md:grid-cols-2">
          {([
            ['System Health', insights.systemHealth, ShieldCheck],
            ['Market Conditions', insights.market, Activity],
            ['Regime Analysis', insights.regime, Compass],
            ['Allocation', insights.allocation, TrendingUp],
            ['Risk Warnings', insights.risk, AlertTriangle],
            ['Strategy Commentary', insights.strategy, Brain],
          ] as const).map(([title, items, Icon]) => (
            <Card key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4" /> {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs">
                  {items.length === 0
                    ? <li className="text-muted-foreground">No data.</li>
                    : items.map((line, i) => <li key={i}>• {line}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
