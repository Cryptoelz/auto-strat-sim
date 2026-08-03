import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META, type KnowledgeNode,
} from '@/lib/knowledgeGraph';
import {
  ORACLE_BADGES, ORACLE_GUARANTEES, EXAMPLE_QUESTIONS, SUGGESTED_CARDS, EXPLAIN_MODES,
  ORACLE_EXPORTS, INSTITUTION_VERSION, KNOWLEDGE_GRAPH_VERSION,
  askOracle, explainFurther, oracleExportPayload,
  type OracleAnswer, type ExplainMode, type OracleExport,
} from '@/lib/oracle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { oracleThinking } from '@/lib/institutional';
import {
  Sparkles, Send, Lock, FileDown, ExternalLink, Network, Gauge, Clock, Building2,
  Recycle, HelpCircle, MessageSquare, ShieldCheck, ArrowRight, BookOpen, Search,
  Lightbulb, AlertTriangle, Zap,
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

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-border/50 bg-card/40 shadow-lg backdrop-blur transition-colors hover:border-trading-gold/25 ${className}`}>
      {children}
    </Card>
  );
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.max(2, value)}%` }} />
      </div>
    </div>
  );
}

function ObjectChip({ id, note, onOpen }: { id: string; note?: string; onOpen: (id: string) => void }) {
  const node: KnowledgeNode | undefined = NODE_BY_ID[id];
  if (!node) return null;
  const meta = NODE_TYPE_META[node.type];
  return (
    <button
      onClick={() => onOpen(id)}
      className="group flex w-full items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 text-left transition-all hover:translate-x-0.5 hover:border-trading-gold/40 hover:bg-muted/40"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `hsl(${meta.color})` }} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium">{node.title}</span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {node.id} · {meta.label} · {node.status} · {node.confidence}%{note ? ` · ${note}` : ''}
          </span>
        </span>
      </span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

interface Turn { question: string; answer: OracleAnswer }

export default function AtlasOracle() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [explain, setExplain] = useState<{ heading: string; lines: string[] } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const current = turns[turns.length - 1]?.answer;
  const contextIds = useMemo(() => turns[turns.length - 1]?.answer.focusIds ?? [], [turns]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (current) answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [current?.auditId]);

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const answer = askOracle(q, contextIds);
    setTurns((t) => [...t, { question: q, answer }]);
    setExplain(null);
    setInput('');
    inputRef.current?.focus();
  };

  const openObject = (id: string) => navigate(`/explorer/${id}`);

  const runExport = (kind: OracleExport) => {
    if (!current) return;
    const sections = oracleExportPayload(kind, current);
    const doc = new jsPDF();
    let y = 16;
    doc.setFontSize(15);
    doc.text(`ATLAS Oracle™ — ${kind}`, 14, y); y += 7;
    doc.setFontSize(9);
    doc.text(`${INSTITUTION_VERSION} · ${KNOWLEDGE_GRAPH_VERSION} · Audit ${current.auditId} · ${current.generated}`, 14, y); y += 5;
    doc.text('OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY / READ ONLY', 14, y); y += 8;
    for (const s of sections) {
      if (y > 270) { doc.addPage(); y = 16; }
      doc.setFontSize(11);
      doc.text(s.heading, 14, y); y += 6;
      doc.setFontSize(8.5);
      for (const line of s.lines) {
        for (const wrapped of doc.splitTextToSize(`• ${line}`, 180) as string[]) {
          if (y > 282) { doc.addPage(); y = 16; }
          doc.text(wrapped, 16, y); y += 4.4;
        }
      }
      y += 4;
    }
    doc.save(`atlas-oracle-${kind.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success(`${kind} exported`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-2xl border border-trading-gold/25 bg-gradient-to-br from-background via-card/60 to-background p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-trading-gold/10 blur-3xl" />
        <div className="relative space-y-3">
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] tracking-widest text-trading-gold">
            PHASE 4 · INSTITUTIONAL CONVERSATIONAL INTELLIGENCE
          </Badge>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            <Sparkles className={`h-7 w-7 ${GOLD}`} />
            ATLAS Oracle™
          </h1>
          <p className={`text-sm font-medium ${GOLD}`}>Ask the Institution Anything</p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Search every question, hypothesis, experiment, validation, discovery, specialist, governance decision,
            research report and institutional memory using natural language. Every answer is generated exclusively
            from the Institutional Knowledge Graph, cites its source objects and shows its confidence.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ORACLE_BADGES.map((b) => (
              <Badge key={b} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                <Lock className="mr-1 h-2.5 w-2.5" />{b}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Main input */}
      <Glass className="mx-auto max-w-4xl">
        <CardContent className="space-y-3 p-5">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder="Ask anything about the institution..."
            className="min-h-[92px] resize-none border-border/60 bg-background/60 text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">
              Read-only reasoning over {Object.keys(NODE_BY_ID).length} institutional objects · Enter to ask
            </p>
            <Button size="sm" onClick={() => ask(input)} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Ask the Oracle
            </Button>
          </div>
          <Separator className="bg-border/50" />
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-trading-gold/40 hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Glass>

      {/* Suggested questions */}
      <section className="space-y-3">
        <SectionHeader n={0} icon={Search} title="Suggested Questions" subtitle="Each card executes its institutional query immediately." />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTED_CARDS.map((c) => (
            <button key={c.id} onClick={() => ask(c.query)} className="text-left">
              <Card className="h-full border-border/50 bg-card/40 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-trading-gold/40">
                <CardContent className="space-y-1 p-3.5">
                  <p className="text-xs font-semibold">{c.title}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{c.description}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {current && (
        <div ref={answerRef} className="space-y-8">
          <Separator className="bg-trading-gold/20" />
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Oracle answer · {current.auditId}</p>
            <h2 className="text-xl font-semibold tracking-tight">{current.resolvedQuestion}</h2>
            <p className="text-[11px] text-muted-foreground">{current.interpretation}</p>
          </div>

          {!current.found ? (
            <Glass>
              <CardContent className="space-y-2 p-6">
                <p className="text-sm font-semibold text-destructive">No institutional evidence currently exists.</p>
                <p className="text-xs text-muted-foreground">
                  The Oracle will not invent facts or fabricate reasoning. Try one of the suggested questions, or ask
                  about a recorded object such as a specialist, experiment, governance decision or institutional memory.
                </p>
              </CardContent>
            </Glass>
          ) : (
            <>
              {/* 1 Executive summary */}
              <section className="space-y-3">
                <SectionHeader n={1} icon={BookOpen} title="Executive Summary" subtitle="Plain-English answer built only from recorded institutional facts." />
                <Glass>
                  <CardContent className="space-y-3 p-5">
                    {current.summary.map((p, i) => (
                      <p key={i} className="text-sm leading-relaxed text-foreground/90">{p}</p>
                    ))}
                    {current.confidence.caveat && (
                      <p className="rounded-md border border-trading-warning/30 bg-trading-warning/10 px-3 py-2 text-xs text-trading-warning">
                        {current.confidence.caveat}
                      </p>
                    )}
                  </CardContent>
                </Glass>
              </section>

              {/* 2 Evidence */}
              <section className="space-y-3">
                <SectionHeader n={2} icon={ShieldCheck} title="Evidence" subtitle="Every supporting institutional object. Each opens the Intelligence Explorer." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {current.evidence.map((g) => (
                    <Glass key={g.type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs">{g.label}</CardTitle>
                        <CardDescription className="text-[10px]">{g.ids.length} object{g.ids.length === 1 ? '' : 's'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1.5 pb-4">
                        {g.ids.map((id) => <ObjectChip key={id} id={id} onOpen={openObject} />)}
                      </CardContent>
                    </Glass>
                  ))}
                </div>
              </section>

              {/* 3 Reasoning chain */}
              <section className="space-y-3">
                <SectionHeader n={3} icon={Network} title="Reasoning Chain" subtitle="Question → Hypothesis → Experiment → Validation → Discovery → Breakthrough → Promotion → Memory." />
                <Glass>
                  <CardContent className="space-y-2 p-5">
                    {current.chain.map((c, i) => (
                      <div key={c.stage} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold ${c.id ? 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold' : 'border-border/50 bg-muted/20 text-muted-foreground'}`}>
                            {i + 1}
                          </div>
                          {i < current.chain.length - 1 && <div className="my-1 h-6 w-px bg-border/60" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-1">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.stage}</p>
                          {c.id ? (
                            <button onClick={() => openObject(c.id!)} className="group text-left">
                              <p className="text-xs font-medium transition-colors group-hover:text-trading-gold">{c.title}</p>
                              <p className="text-[10px] text-muted-foreground">{c.detail}</p>
                            </button>
                          ) : (
                            <>
                              <p className="text-xs font-medium text-muted-foreground">{c.title}</p>
                              <p className="text-[10px] text-muted-foreground">{c.detail}</p>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Glass>
              </section>

              {/* 4 Confidence */}
              <section className="space-y-3">
                <SectionHeader n={4} icon={Gauge} title="Confidence Analysis" subtitle="Confidence, evidence strength, counter evidence and what is still unknown." />
                <div className="grid gap-3 lg:grid-cols-3">
                  <Glass>
                    <CardContent className="space-y-4 p-5">
                      <Meter value={current.confidence.overall} label="Overall Confidence" />
                      <Meter value={current.confidence.evidenceStrength} label="Evidence Strength" />
                      <p className="text-[10px] text-muted-foreground">
                        Derived as the mean confidence and evidence score across {current.focusIds.length} focus object{current.focusIds.length === 1 ? '' : 's'}.
                      </p>
                    </CardContent>
                  </Glass>
                  {[
                    { title: 'Counter Evidence', items: current.confidence.counterEvidence, empty: 'No contradictory evidence recorded.' },
                    { title: 'Missing Validation', items: current.confidence.missingValidation, empty: 'No blocked or open dependencies.' },
                    { title: 'Open Questions', items: current.confidence.openQuestions, empty: 'No unresolved questions attached.' },
                    { title: 'Unknowns', items: current.confidence.unknowns, empty: 'No open research threads recorded.' },
                  ].map((b) => (
                    <Glass key={b.title}>
                      <CardHeader className="pb-2"><CardTitle className="text-xs">{b.title}</CardTitle></CardHeader>
                      <CardContent className="space-y-1.5 pb-4">
                        {(b.items.length ? b.items : [b.empty]).map((t, i) => (
                          <p key={i} className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground">{t}</p>
                        ))}
                      </CardContent>
                    </Glass>
                  ))}
                </div>
              </section>

              {/* 5 Relationships */}
              <section className="space-y-3">
                <SectionHeader n={5} icon={ArrowRight} title="Institutional Relationships" subtitle="Typed, confidence-scored links to the rest of the institution." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {current.relationships.map((r) => (
                    <Glass key={r.type}>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${RELATIONSHIP_META[r.type].color})` }} />
                          {r.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5 pb-4">
                        {r.items.map((i) => <ObjectChip key={i.id} id={i.id} note={`${i.confidence}%`} onOpen={openObject} />)}
                      </CardContent>
                    </Glass>
                  ))}
                </div>
              </section>

              {/* 6 Timeline */}
              <section className="space-y-3">
                <SectionHeader n={6} icon={Clock} title="Timeline" subtitle="Every related event in chronological order." />
                <Glass>
                  <CardContent className="p-5">
                    <ScrollArea className="max-h-[380px] pr-3">
                      <div className="space-y-2">
                        {current.timeline.map((t) => (
                          <button key={t.id} onClick={() => openObject(t.id)} className="group flex w-full items-start gap-3 rounded-md border border-border/40 bg-muted/15 px-3 py-2 text-left transition-colors hover:border-trading-gold/40">
                            <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">{t.date}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-medium transition-colors group-hover:text-trading-gold">{t.title}</span>
                              <span className="block text-[10px] text-muted-foreground">{t.stage} · {t.id} · {t.detail}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Glass>
              </section>

              {/* 7 Departments */}
              <section className="space-y-3">
                <SectionHeader n={7} icon={Building2} title="Department Contributions" subtitle="Which AI departments produced the evidence behind this answer." />
                <Glass>
                  <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                    {current.departments.map((d) => (
                      <div key={d.key} className="space-y-1">
                        <Meter value={d.percent} label={d.name} />
                        <p className="text-[10px] text-muted-foreground">{d.note}</p>
                      </div>
                    ))}
                  </CardContent>
                </Glass>
              </section>

              {/* 8 Knowledge reuse */}
              <section className="space-y-3">
                <SectionHeader n={8} icon={Recycle} title="Knowledge Reuse" subtitle="Everywhere this research is reused downstream." />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {current.reuse.map((r) => (
                    <Glass key={r.label}>
                      <CardHeader className="pb-2"><CardTitle className="text-xs">{r.label}</CardTitle></CardHeader>
                      <CardContent className="space-y-1.5 pb-4">
                        {r.items.map((i, idx) => (
                          <p key={idx} className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5 text-[11px] text-muted-foreground">{i}</p>
                        ))}
                      </CardContent>
                    </Glass>
                  ))}
                </div>
              </section>

              {/* 9 Explain further */}
              <section className="space-y-3">
                <SectionHeader n={9} icon={HelpCircle} title="Explain Further" subtitle="Re-frame the same evidence for a different audience." />
                <Glass>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex flex-wrap gap-1.5">
                      {EXPLAIN_MODES.map((m) => (
                        <Button key={m.id} size="sm" variant="outline" className="h-7 text-[11px]"
                          onClick={() => setExplain(explainFurther(m.id as ExplainMode, current))}>
                          {m.label}
                        </Button>
                      ))}
                    </div>
                    {explain && (
                      <div className="space-y-1.5 rounded-lg border border-trading-gold/25 bg-trading-gold/5 p-4">
                        <p className={`text-xs font-semibold ${GOLD}`}>{explain.heading}</p>
                        {explain.lines.map((l, i) => (
                          <p key={i} className="text-[11px] leading-relaxed text-muted-foreground">{l}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Glass>
              </section>

              {/* 13 Oracle Thinking */}
              <section className="space-y-3">
                <SectionHeader n={13} icon={Sparkles} title="Oracle Thinking™" subtitle="Autonomous intelligence surfaced while answering — derived only from recorded institutional knowledge." />
                <p className="text-sm font-medium text-trading-gold">While answering your question I found...</p>
                <div className="grid gap-3 lg:grid-cols-3">
                  {thinking.map((t) => {
                    const Icon = t.kind === 'discovery' ? Lightbulb : t.kind === 'risk' ? AlertTriangle : Zap;
                    const tone = t.kind === 'risk'
                      ? 'border-destructive/30 hover:border-destructive/50'
                      : t.kind === 'opportunity'
                        ? 'border-primary/30 hover:border-primary/50'
                        : 'border-trading-gold/30 hover:border-trading-gold/50';
                    return (
                      <Card key={t.kind} className={`bg-card/40 shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 ${tone}`}>
                        <CardContent className="space-y-3 p-5">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${t.kind === 'risk' ? 'text-destructive' : t.kind === 'opportunity' ? 'text-primary' : 'text-trading-gold'}`} />
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.eyebrow}</p>
                          </div>
                          <p className="text-sm font-semibold leading-snug">{t.headline}</p>
                          <p className="text-[11px] leading-relaxed text-muted-foreground">{t.body}</p>
                          <Meter value={t.confidence} label="Confidence" />
                          {t.metricLabel && (
                            <div className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5">
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t.metricLabel}</p>
                              <p className="text-xs font-medium">{t.metricValue}</p>
                            </div>
                          )}
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Supporting Objects · {t.evidenceCount} evidence items</p>
                            {t.supportingObjects.map((id) => <ObjectChip key={id} id={id} onOpen={openObject} />)}
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Counter Evidence</p>
                            {(t.counterEvidence.length ? t.counterEvidence : ['No contradictory evidence recorded against this insight.']).map((c, i) => (
                              <p key={i} className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5 text-[10px] text-muted-foreground">{c}</p>
                            ))}
                          </div>
                          <p className="text-[10px] text-muted-foreground">Institutional timestamp: {t.timestamp}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {t.actions.map((a) => (
                              <Button key={a.label} size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => navigate(a.to)}>
                                {a.label}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {!thinking.length && (
                    <p className="text-xs text-muted-foreground">No additional institutional intelligence surfaced for this evidence set.</p>
                  )}
                </div>
              </section>

              {/* 11 Related questions */}
              <section className="space-y-3">
                <SectionHeader n={11} icon={MessageSquare} title="Related Questions" subtitle="Intelligent follow-ups derived from open threads and disagreement." />
                <div className="flex flex-wrap gap-1.5">
                  {current.relatedQuestions.map((q) => (
                    <button key={q} onClick={() => ask(q)}
                      className="rounded-full border border-border/50 bg-muted/20 px-3 py-1.5 text-[11px] transition-colors hover:border-trading-gold/40 hover:text-trading-gold">
                      {q}
                    </button>
                  ))}
                </div>
              </section>

              {/* 12 Exports */}
              <section className="space-y-3">
                <SectionHeader n={12} icon={FileDown} title="Institutional Exports" subtitle="Board-ready PDF packs generated from this answer's evidence." />
                <div className="flex flex-wrap gap-1.5">
                  {ORACLE_EXPORTS.map((k) => (
                    <Button key={k} size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => runExport(k)}>
                      <FileDown className="h-3 w-3" /> Export {k}
                    </Button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Footer */}
          <Glass className="border-trading-gold/25">
            <CardContent className="grid gap-3 p-5 text-[11px] sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Institution Version', INSTITUTION_VERSION],
                ['Knowledge Graph Version', KNOWLEDGE_GRAPH_VERSION],
                ['Evidence Score', `${current.evidenceScore}/100`],
                ['Confidence', `${current.confidence.overall}%`],
                ['Generated', current.generated],
                ['Audit ID', current.auditId],
                ['Simulation Status', 'Simulation Only · No live execution'],
                ['Governance', 'Read Only · Observation Only · Research Only · Human Approval Required'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </CardContent>
          </Glass>
        </div>
      )}

      {/* 10 Conversation memory */}
      <section className="space-y-3">
        <SectionHeader n={10} icon={MessageSquare} title="Conversation Memory" subtitle='The Oracle carries context — follow-ups using "that" or "it" resolve to the previous answer.' />
        <Glass>
          <CardContent className="space-y-2 p-5">
            {turns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No conversation yet. Ask a question above to begin the session transcript.</p>
            ) : (
              <>
                {turns.map((t, i) => (
                  <div key={t.answer.auditId} className="rounded-md border border-border/40 bg-muted/15 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Turn {i + 1} · {t.answer.auditId}</p>
                    <p className="text-xs font-medium">{t.question}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Focus: {t.answer.focusIds.length ? t.answer.focusIds.join(', ') : 'none'} · Confidence {t.answer.confidence.overall}%
                    </p>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setTurns([]); setExplain(null); }}>
                  Clear conversation
                </Button>
              </>
            )}
          </CardContent>
        </Glass>
      </section>

      {/* Governance */}
      <Glass className="border-primary/25">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-primary" /> Governance Guarantees
          </CardTitle>
          <CardDescription className="text-[11px]">
            ATLAS Oracle™ is permanently read only. It reasons over recorded institutional knowledge and never acts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 pb-5">
          {[...ORACLE_BADGES, ...ORACLE_GUARANTEES].map((g) => (
            <Badge key={g} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">{g}</Badge>
          ))}
        </CardContent>
      </Glass>
    </div>
  );
}
