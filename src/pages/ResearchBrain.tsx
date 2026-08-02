import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BRAIN_METRICS, MORNING_BRIEF, BRAIN_QUESTIONS, HYPOTHESES, EXPERIMENTS,
  KNOWLEDGE_TIMELINE, INSTITUTIONAL_MEMORY, OPPORTUNITY_RANKING, opportunityScore,
  ROADMAP, REFLECTIONS, LEARNING_SCORE, EXECUTIVE_RECOMMENDATION, GOVERNANCE_GUARANTEES,
  type RoadmapBucket, type Explain,
} from '@/lib/researchBrain';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  BrainCircuit, Sunrise, HelpCircle, Lightbulb, FlaskConical, History, Library,
  ListOrdered, Map as MapIcon, Sparkles, Gavel, Lock, ArrowRight, TrendingUp,
  TrendingDown, Minus, CheckCircle2, XCircle, Star, Clock, Search,
} from 'lucide-react';

const GOLD = 'text-trading-gold';

function SectionHeader({ n, icon: Icon, title, subtitle }: { n: number; icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-trading-gold/30 bg-trading-gold/10">
        <Icon className={`h-4 w-4 ${GOLD}`} />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Section {n}</p>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ModuleLinks({ links }: { links: { label: string; to: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) => (
        <Link key={l.to} to={l.to}>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary hover:bg-primary/15">
            {l.label} <ArrowRight className="ml-1 h-2.5 w-2.5" />
          </Badge>
        </Link>
      ))}
    </div>
  );
}

function EvidenceTree({ e }: { e: Explain }) {
  const rows: [string, string[]][] = [
    ['Evidence', e.evidence],
    ['Counter-evidence', e.counterEvidence],
    ['Required validation', e.requiredValidation],
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{e.reasoning}</p>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
        <Progress value={e.confidence} className="h-1.5 flex-1" />
        <span className="font-mono text-xs">{e.confidence}%</span>
      </div>
      {rows.map(([label, items]) => (
        <div key={label} className="border-l border-border/60 pl-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <ul className="mt-1 space-y-1">
            {items.map((i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className={GOLD}>•</span>
                <span className="text-foreground/85">{i}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ModuleLinks links={e.linkedModules} />
    </div>
  );
}

const BUCKETS: RoadmapBucket[] = ['Current', 'Next', 'Future', 'Completed', 'Deferred', 'Blocked'];
const BUCKET_STYLE: Record<RoadmapBucket, string> = {
  Current: 'border-primary/40 bg-primary/5',
  Next: 'border-trading-gold/40 bg-trading-gold/5',
  Future: 'border-border bg-card/40',
  Completed: 'border-trading-profit/40 bg-trading-profit/5',
  Deferred: 'border-muted bg-muted/20',
  Blocked: 'border-destructive/40 bg-destructive/5',
};

export default function ResearchBrain() {
  const [query, setQuery] = useState('');

  const timeline = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWLEDGE_TIMELINE;
    return KNOWLEDGE_TIMELINE.filter((k) =>
      [k.title, k.body, k.type, k.date].join(' ').toLowerCase().includes(q),
    );
  }, [query]);

  const ranked = useMemo(
    () => [...OPPORTUNITY_RANKING].map((o) => ({ ...o, score: opportunityScore(o) })).sort((a, b) => b.score - a.score),
    [],
  );

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-xl border border-trading-gold/25 bg-gradient-to-br from-card via-card to-primary/5 p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-24 h-48 w-48 rounded-full bg-trading-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-trading-gold/40 bg-trading-gold/10 shadow-[0_0_24px_-6px_hsl(var(--trading-gold))]">
              <BrainCircuit className={`h-6 w-6 ${GOLD}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Research Brain™</h1>
              <p className="text-sm text-muted-foreground">Institutional Research Intelligence Engine</p>
              <p className={`mt-1 text-xs italic ${GOLD}`}>“The platform thinks before the researcher does.”</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-[10px] text-primary">OBSERVATION ONLY</Badge>
            <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/5 text-[10px] text-trading-gold">RESEARCH ONLY</Badge>
            <Badge variant="outline" className="border-border text-[10px] text-muted-foreground">SIMULATION ONLY</Badge>
          </div>
        </div>
      </header>

      {/* Executive cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {BRAIN_METRICS.map((m) => {
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
          return (
            <Card key={m.key} className="border-border/60 bg-card/60 backdrop-blur transition-shadow hover:shadow-[0_0_28px_-14px_hsl(var(--primary))]">
              <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                <p className="mt-1 font-mono text-xl font-bold">{m.value}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <TrendIcon className="h-3 w-3" /> {m.delta}
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/80">{m.detail}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section 1 — Executive Thinking */}
      <section className="space-y-4">
        <SectionHeader n={1} icon={Sunrise} title="Executive Thinking" subtitle="What the Brain concluded overnight." />
        <Card className="border-trading-gold/25 bg-gradient-to-br from-card to-trading-gold/5">
          <CardContent className="space-y-4 p-6">
            <p className={`text-sm font-semibold tracking-widest ${GOLD}`}>{MORNING_BRIEF.greeting}</p>
            <p className="text-sm text-foreground/90">{MORNING_BRIEF.intro}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {MORNING_BRIEF.findings.map((f) => (
                <div key={f.label} className="rounded-lg border border-border/60 bg-background/40 p-3">
                  <p className="font-mono text-lg font-bold">{f.count}</p>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Highest value investigation</p>
              <p className="mt-1 text-base font-semibold">“{MORNING_BRIEF.highestValue}”</p>
              <p className="mt-1 text-xs text-muted-foreground">{MORNING_BRIEF.highestValueWhy}</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated research impact</span>
                <Badge className="bg-trading-gold/15 text-trading-gold hover:bg-trading-gold/20">{MORNING_BRIEF.impact}</Badge>
              </div>
            </div>
            <Accordion type="single" collapsible>
              <AccordionItem value="thinking" className="border-none">
                <AccordionTrigger className="py-2 text-xs text-muted-foreground">How I reached this</AccordionTrigger>
                <AccordionContent>
                  <ol className="space-y-1.5">
                    {MORNING_BRIEF.thinkingSteps.map((s, i) => (
                      <li key={s} className="flex gap-2 text-xs">
                        <span className="font-mono text-primary">{i + 1}.</span>
                        <span className="text-foreground/85">{s}</span>
                      </li>
                    ))}
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Section 2 — AI Generated Questions */}
      <section className="space-y-4">
        <SectionHeader n={2} icon={HelpCircle} title="AI Generated Questions" subtitle="Questions the Brain raised without being asked." />
        <div className="grid gap-3 lg:grid-cols-2">
          {BRAIN_QUESTIONS.map((q) => (
            <Card key={q.id} className="border-border/60 bg-card/60">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{q.question}</CardTitle>
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">{q.id}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="secondary" className="text-[10px]">{q.category}</Badge>
                  <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">value {q.value}</Badge>
                  <Badge variant="outline" className="text-[10px]">difficulty {q.difficulty}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{q.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="e" className="border-none">
                    <AccordionTrigger className="py-1 text-xs text-primary">Evidence tree</AccordionTrigger>
                    <AccordionContent><EvidenceTree e={q.explain} /></AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 — Hypothesis Generator */}
      <section className="space-y-4">
        <SectionHeader n={3} icon={Lightbulb} title="Hypothesis Generator" subtitle="Falsifiable statements proposed by the Brain." />
        <div className="grid gap-3 lg:grid-cols-2">
          {HYPOTHESES.map((h) => (
            <Card key={h.id} className={h.status === 'rejected' ? 'border-destructive/30 bg-destructive/5' : 'border-border/60 bg-card/60'}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={`font-mono text-[10px] ${GOLD} border-trading-gold/40`}>{h.id}</Badge>
                  <Badge variant="outline" className="text-[10px] capitalize">{h.status}</Badge>
                </div>
                <CardTitle className="pt-1 text-sm">{h.title}</CardTitle>
                <CardDescription className="text-xs">{h.statement}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                  <Progress value={h.confidence} className="h-1.5 flex-1" />
                  <span className="font-mono text-xs">{h.confidence}%</span>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-trading-profit">Supporting</p>
                    <ul className="mt-1 space-y-1">{h.supporting.map((s) => <li key={s} className="text-foreground/85">• {s}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-trading-loss">Counter</p>
                    <ul className="mt-1 space-y-1">{h.counter.map((s) => <li key={s} className="text-foreground/85">• {s}</li>)}</ul>
                  </div>
                </div>
                <div className="rounded-md border border-border/60 bg-background/40 p-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation required</p>
                  <p className="text-xs text-foreground/85">{h.validation.join(' → ')}</p>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated research gain</span>
                  <span className={`font-mono text-xs ${GOLD}`}>{h.gain}</span>
                </div>
                <ModuleLinks links={h.linked} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4 — Experiment Designer */}
      <section className="space-y-4">
        <SectionHeader n={4} icon={FlaskConical} title="Experiment Designer" subtitle="Every hypothesis becomes a proposed experiment. Proposal only." />
        <div className="grid gap-3 lg:grid-cols-2">
          {EXPERIMENTS.map((x) => (
            <Card key={x.id} className="border-border/60 bg-card/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{x.name}</CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">{x.id}</Badge>
                </div>
                <CardDescription className="text-xs">Derived from {x.hypothesisId} · Status: {x.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {x.modules.map((m) => <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>)}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[['Runtime', `${x.runtimeDays}d`], ['Cost', x.cost], ['Confidence', `${x.confidence}%`], ['Expected', x.expected]].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-border/60 bg-background/40 p-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
                      <p className="font-mono text-xs">{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation stages</p>
                  <p className="text-foreground/85">{x.stages.join(' → ')}</p>
                </div>
                <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" /> Proposal only — no execution, no parameter change.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 5 — Knowledge Evolution */}
      <section className="space-y-4">
        <SectionHeader n={5} icon={History} title="Knowledge Evolution" subtitle="Every discovery, rejection, paper, breakthrough and governance decision." />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search knowledge timeline…" className="pl-9" />
        </div>
        <div className="relative space-y-3 border-l border-border/60 pl-5">
          {timeline.map((k) => (
            <div key={k.id} className="relative">
              <span className="absolute -left-[26px] top-2 h-2.5 w-2.5 rounded-full border border-trading-gold/60 bg-trading-gold/40" />
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{k.type}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{k.date}</span>
                    <span className="text-sm font-medium">{k.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{k.body}</p>
                  {k.to && <div className="mt-2"><ModuleLinks links={[{ label: 'Open source module', to: k.to }]} /></div>}
                </CardContent>
              </Card>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-xs text-muted-foreground">No knowledge events match “{query}”.</p>}
        </div>
      </section>

      {/* Section 6 — Institutional Memory */}
      <section className="space-y-4">
        <SectionHeader n={6} icon={Library} title="Institutional Memory" subtitle="Lessons, not metrics. Memory grows automatically as evidence accumulates." />
        <div className="grid gap-3 md:grid-cols-2">
          {INSTITUTIONAL_MEMORY.map((l) => (
            <Card key={l.id} className="border-border/60 bg-card/60">
              <CardContent className="space-y-2 p-4">
                <p className="text-sm text-foreground/90">“{l.lesson}”</p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="secondary" className="text-[10px]">{l.domain}</Badge>
                  <span>{l.observations} observations</span>
                  <span>· reinforced {l.reinforced}×</span>
                  <span>· since {l.firstLearned}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={l.confidence} className="h-1.5 flex-1" />
                  <span className="font-mono text-[10px]">{l.confidence}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 — Opportunity Ranking */}
      <section className="space-y-4">
        <SectionHeader n={7} icon={ListOrdered} title="Research Opportunity Ranking" subtitle="Ranked by impact, confidence, time, evidence, novelty and strategic importance." />
        <Card className="border-border/60 bg-card/60">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-xs">
              <thead className="border-b border-border/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  {['#', 'Opportunity', 'Score', 'Impact', 'Conf.', 'Time', 'Evidence', 'Novelty', 'Strategic', ''].map((h) => (
                    <th key={h} className="p-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((o, i) => (
                  <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono">{i + 1}</td>
                    <td className="p-3 font-medium">{o.title}</td>
                    <td className={`p-3 font-mono font-bold ${i === 0 ? GOLD : ''}`}>{o.score}</td>
                    <td className="p-3 font-mono">{o.impact}</td>
                    <td className="p-3 font-mono">{o.confidence}%</td>
                    <td className="p-3 font-mono">{o.timeDays}d</td>
                    <td className="p-3 font-mono">{o.evidence}</td>
                    <td className="p-3 font-mono">{o.novelty}</td>
                    <td className="p-3 font-mono">{o.strategic}</td>
                    <td className="p-3"><Link to={o.to} className="text-primary hover:underline">Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      {/* Section 8 — Roadmap */}
      <section className="space-y-4">
        <SectionHeader n={8} icon={MapIcon} title="Research Roadmap" subtitle="Current, next, future, completed, deferred and blocked research." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {BUCKETS.map((b) => (
            <Card key={b} className={BUCKET_STYLE[b]}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">{b}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ROADMAP.filter((r) => r.bucket === b).map((r) => (
                  <div key={r.id} className="rounded-md border border-border/50 bg-background/40 p-2">
                    <p className="text-xs font-medium">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground">{r.note}</p>
                    {r.to && <Link to={r.to} className="text-[10px] text-primary hover:underline">Open module →</Link>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 9 — Self Reflection */}
      <section className="space-y-4">
        <SectionHeader n={9} icon={Sparkles} title="AI Self Reflection" subtitle="Once per simulated day the Brain evaluates its own research quality." />
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="border-trading-gold/30 bg-trading-gold/5 lg:col-span-1">
            <CardContent className="space-y-3 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall learning score</p>
              <div className="flex items-end gap-2">
                <span className={`font-mono text-4xl font-bold ${GOLD}`}>{LEARNING_SCORE.score}</span>
                <Badge variant="outline" className="mb-1 border-trading-gold/40 text-trading-gold">{LEARNING_SCORE.grade}</Badge>
              </div>
              {[['Prediction accuracy', LEARNING_SCORE.predictionAccuracy], ['Hypothesis hit rate', LEARNING_SCORE.hypothesisHitRate], ['Wasted effort', LEARNING_SCORE.wastedEffort]].map(([k, v]) => (
                <div key={k as string}>
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>{k}</span><span className="font-mono">{v}%</span></div>
                  <Progress value={v as number} className="h-1.5" />
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">{LEARNING_SCORE.note}</p>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            {REFLECTIONS.map((r) => {
              const map = {
                correct: { Icon: CheckCircle2, cls: 'border-trading-profit/40 bg-trading-profit/5', label: 'Correct prediction' },
                failed: { Icon: XCircle, cls: 'border-destructive/40 bg-destructive/5', label: 'Failed assumption' },
                valuable: { Icon: Star, cls: 'border-trading-gold/40 bg-trading-gold/5', label: 'Valuable discovery' },
                wasted: { Icon: Clock, cls: 'border-muted bg-muted/20', label: 'Wasted effort' },
              }[r.kind];
              return (
                <Card key={r.id} className={map.cls}>
                  <CardContent className="space-y-1 p-3">
                    <div className="flex items-center gap-2">
                      <map.Icon className="h-3.5 w-3.5" />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{map.label}</span>
                    </div>
                    <p className="text-xs font-medium">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">{r.body}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 10 — Executive Recommendation */}
      <section className="space-y-4">
        <SectionHeader n={10} icon={Gavel} title="Executive Recommendation" subtitle="One recommendation for today’s research programme." />
        <Card className="border-trading-gold/30 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs italic text-muted-foreground">“If I had one recommendation for today’s research programme…”</p>
            <p className={`text-lg font-semibold ${GOLD}`}>{EXECUTIVE_RECOMMENDATION.headline}</p>
            <p className="text-sm text-foreground/90">{EXECUTIVE_RECOMMENDATION.body}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p>
                <ul className="mt-1 space-y-1 text-xs">{EXECUTIVE_RECOMMENDATION.evidence.map((e) => <li key={e}>• {e}</li>)}</ul>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risks</p>
                <ul className="mt-1 space-y-1 text-xs">{EXECUTIVE_RECOMMENDATION.risks.map((e) => <li key={e}>• {e}</li>)}</ul>
              </div>
              <div className="rounded-lg border border-trading-profit/30 bg-trading-profit/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected benefit</p>
                <p className="mt-1 text-xs">{EXECUTIVE_RECOMMENDATION.benefit}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                  <Progress value={EXECUTIVE_RECOMMENDATION.confidence} className="h-1.5 flex-1" />
                  <span className="font-mono text-xs">{EXECUTIVE_RECOMMENDATION.confidence}%</span>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Required validation</p>
                <ul className="mt-1 space-y-1 text-xs">{EXECUTIVE_RECOMMENDATION.validation.map((e) => <li key={e}>• {e}</li>)}</ul>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <Lock className="mt-0.5 h-3.5 w-3.5 text-primary" />
              <p className="text-xs text-muted-foreground">{EXECUTIVE_RECOMMENDATION.governance}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/low-vol-coiler-v2"><Button size="sm" variant="outline">Open Low-Vol Coiler v2</Button></Link>
              <Link to="/quant-scientist"><Button size="sm" variant="outline">Open Quant Scientist</Button></Link>
              <Link to="/intelligence-network"><Button size="sm" variant="outline">Open Intelligence Network</Button></Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Governance */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-primary" /> Governance guarantees</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1.5 text-xs text-muted-foreground md:grid-cols-2">
            {GOVERNANCE_GUARANTEES.map((g) => <li key={g}>• {g}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
