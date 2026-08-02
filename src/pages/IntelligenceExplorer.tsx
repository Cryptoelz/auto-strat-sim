import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import {
  KNOWLEDGE_NODES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META, STRENGTH_META,
  searchKnowledge, type KnowledgeNode,
} from '@/lib/knowledgeGraph';
import {
  EXPLORER_BADGES, EXPLORER_GUARANTEES, EXPORT_KINDS, DEFAULT_EXPLORER_ID, TODAY_DAY,
  institutionHealth, institutionSummary, lifeStages, evidenceItems, relationships,
  impactDimensions, departmentContributions, replayFrames, causeAndEffect, knowledgeDna,
  dependencyGroups, futureOpportunities, executiveCommentary, auditTrail, timeMachine,
  exportPayload, dateOfDay, dayOf, type ExportKind, type EvidenceStance,
} from '@/lib/intelligenceExplorer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Compass, Search, Lock, FileDown, Play, Pause, SkipBack, SkipForward, RotateCcw,
  ArrowRight, Clock, Activity, Link2, Sparkles, Network, Gauge, History, Building2,
  GitBranch, AlertTriangle, BookOpen, ShieldCheck, Rocket, ExternalLink,
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

function ConfBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
      <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.max(2, value)}%` }} />
    </div>
  );
}

function ObjectLink({ id, onOpen, note }: { id: string; onOpen: (id: string) => void; note?: string }) {
  const node = NODE_BY_ID[id];
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
          <span className="block truncate text-[10px] text-muted-foreground">{node.id} · {meta.label} · {node.status}{note ? ` · ${note}` : ''}</span>
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-trading-gold" />
    </button>
  );
}

const STANCE_META: Record<EvidenceStance, { label: string; cls: string }> = {
  supporting: { label: 'Supporting', cls: 'border-trading-success/40 bg-trading-success/10 text-trading-success' },
  counter: { label: 'Counter', cls: 'border-destructive/40 bg-destructive/10 text-destructive' },
  neutral: { label: 'Neutral', cls: 'border-border bg-muted/30 text-muted-foreground' },
  unknown: { label: 'Unknown', cls: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning' },
};

export default function IntelligenceExplorer() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const id = objectId && NODE_BY_ID[objectId] ? objectId : DEFAULT_EXPLORER_ID;
  const node = NODE_BY_ID[id];

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('identity');
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [machineDay, setMachineDay] = useState(TODAY_DAY);
  const topRef = useRef<HTMLDivElement>(null);

  const open = (next: string) => {
    navigate(`/explorer/${next}`);
    setTab('identity');
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hits = useMemo(() => searchKnowledge(query), [query]);
  const summary = useMemo(() => institutionSummary(node), [node]);
  const stages = useMemo(() => lifeStages(id), [id]);
  const evidence = useMemo(() => evidenceItems(node), [node]);
  const rels = useMemo(() => relationships(id), [id]);
  const impacts = useMemo(() => impactDimensions(node), [node]);
  const depts = useMemo(() => departmentContributions(node), [node]);
  const frames = useMemo(() => replayFrames(id), [id]);
  const ce = useMemo(() => causeAndEffect(id), [id]);
  const dna = useMemo(() => knowledgeDna(node), [node]);
  const deps = useMemo(() => dependencyGroups(id), [id]);
  const opps = useMemo(() => futureOpportunities(node), [node]);
  const commentary = useMemo(() => executiveCommentary(node), [node]);
  const audit = useMemo(() => auditTrail(node), [node]);
  const machine = useMemo(() => timeMachine(machineDay), [machineDay]);
  const health = useMemo(() => institutionHealth(), []);

  useEffect(() => { setFrameIdx(0); setPlaying(false); }, [id]);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setFrameIdx((i) => {
        if (i >= frames.length - 1) { setPlaying(false); return i; }
        return i + 1;
      });
    }, 1600 / speed);
    return () => clearInterval(t);
  }, [playing, speed, frames.length]);

  const exportPdf = (kind: ExportKind) => {
    const doc = new jsPDF();
    let y = 16;
    const line = (text: string, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      for (const l of doc.splitTextToSize(text, 178)) {
        if (y > 280) { doc.addPage(); y = 16; }
        doc.text(l, 16, y);
        y += size * 0.55 + 2;
      }
    };
    line('ATLAS Intelligence Explorer™', 16, true);
    line(`${kind} — ${node.id} · ${node.title}`, 12, true);
    line(`Generated ${new Date().toISOString()} — OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY / READ ONLY`, 8);
    y += 4;
    for (const block of exportPayload(kind, node)) {
      line(block.heading, 12, true);
      if (!block.lines.length) line('No records.', 9);
      for (const l of block.lines) line(`• ${l}`, 9);
      y += 3;
    }
    doc.save(`${node.id}-${kind.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const meta = NODE_TYPE_META[node.type];
  const frame = frames[Math.min(frameIdx, frames.length - 1)];

  return (
    <div ref={topRef} className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-trading-gold/[0.07] to-transparent">
        <div className="mx-auto max-w-[1400px] space-y-4 px-4 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-trading-gold/40 bg-trading-gold/10">
                <Compass className={`h-5 w-5 ${GOLD}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">ATLAS™ Phase 3</p>
                <h1 className="text-2xl font-semibold tracking-tight">Intelligence Explorer™</h1>
                <p className="text-xs text-muted-foreground">The complete digital biography of every research object. Nothing hidden, everything traceable.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EXPLORER_BADGES.map((b) => (
                <Badge key={b} variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">
                  <Lock className="mr-1 h-2.5 w-2.5" />{b}
                </Badge>
              ))}
            </div>
          </div>

          {/* Object identity header */}
          <Glass>
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-offset-0" style={{ background: `hsl(${meta.color})`, boxShadow: `0 0 18px hsl(${meta.color} / 0.6)` }} />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold">{node.title}</h2>
                    <p className="text-xs text-muted-foreground">{node.id} · {meta.label} · {node.owner}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">{node.status}</Badge>
                  {node.link && (
                    <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
                      <Link to={node.link}><ExternalLink className="mr-1 h-3 w-3" />Source module</Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
                    <Link to="/knowledge-graph"><Network className="mr-1 h-3 w-3" />Knowledge Graph</Link>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {[
                  { k: 'Confidence', v: `${node.confidence}%`, bar: node.confidence },
                  { k: 'Evidence Score', v: `${node.evidenceScore}`, bar: node.evidenceScore },
                  { k: 'Institution Health', v: `${health}`, bar: health },
                  { k: 'Department', v: node.department },
                  { k: 'Created', v: node.created },
                  { k: 'Last Updated', v: dateOfDay(TODAY_DAY) },
                  { k: 'Governance', v: 'Read Only · Locked' },
                ].map((m) => (
                  <div key={m.k} className="space-y-1 rounded-lg border border-border/40 bg-muted/20 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.k}</p>
                    <p className="text-xs font-medium">{m.v}</p>
                    {m.bar !== undefined && <ConfBar value={m.bar} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Glass>

          {/* Entry point search */}
          <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
            <Glass>
              <CardContent className="space-y-2 p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Open any object — question, hypothesis, experiment, validation, discovery, specialist, lesson, governance decision…"
                    className="h-9 pl-8 text-xs"
                  />
                </div>
                {query && (
                  <ScrollArea className="h-40">
                    <div className="space-y-1.5 pr-2">
                      {hits.length === 0 && <p className="p-2 text-xs text-muted-foreground">No institutional object matches that query.</p>}
                      {hits.map((h) => <ObjectLink key={h.node.id} id={h.node.id} onOpen={open} note={h.reason} />)}
                    </div>
                  </ScrollArea>
                )}
                {!query && (
                  <div className="flex flex-wrap gap-1.5">
                    {['Q-002', 'HYP-018', 'EXP-052', 'BRK-003', 'SPC-LVC', 'ALO-002', 'GOV-011', 'REC-021', 'LES-014', 'MEM-001'].map((q) => (
                      <button key={q} onClick={() => open(q)} className="rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px] transition-colors hover:border-trading-gold/40 hover:text-trading-gold">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Glass>
            <Glass>
              <CardContent className="p-3">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Section 15 · Exports</p>
                <div className="flex flex-wrap gap-1.5">
                  {EXPORT_KINDS.map((k) => (
                    <Button key={k} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => exportPdf(k)}>
                      <FileDown className="mr-1 h-3 w-3" />{k}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Glass>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <Tabs value={tab} onValueChange={setTab} className="space-y-5">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/30">
            <TabsTrigger value="identity" className="text-[11px]">Identity & Timeline</TabsTrigger>
            <TabsTrigger value="evidence" className="text-[11px]">Evidence & Relationships</TabsTrigger>
            <TabsTrigger value="impact" className="text-[11px]">Impact & Departments</TabsTrigger>
            <TabsTrigger value="replay" className="text-[11px]">Research Replay</TabsTrigger>
            <TabsTrigger value="dna" className="text-[11px]">Knowledge DNA</TabsTrigger>
            <TabsTrigger value="future" className="text-[11px]">Future & Commentary</TabsTrigger>
            <TabsTrigger value="audit" className="text-[11px]">Audit & Time Machine</TabsTrigger>
          </TabsList>

          {/* ── Identity & timeline ─────────────────────────── */}
          <TabsContent value="identity" className="space-y-6">
            <SectionHeader n={1} icon={Sparkles} title="Institution Summary" subtitle="Plain-English explanation of what this object is and why it exists." />
            <Glass>
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed text-foreground/90">{summary}</p>
              </CardContent>
            </Glass>

            <SectionHeader n={2} icon={Clock} title="Institution Timeline" subtitle="The complete life story — every stage opens its original artefact." />
            <Glass>
              <CardContent className="p-4">
                <div className="relative space-y-3 pl-6">
                  <span className="absolute left-[9px] top-2 bottom-2 w-px bg-gradient-to-b from-trading-gold/60 via-primary/40 to-transparent" />
                  {stages.map((s) => (
                    <div key={s.stage} className="relative">
                      <span className={`absolute -left-[19px] top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background ${s.reached ? 'bg-trading-gold' : 'bg-muted-foreground/40'}`} />
                      <div className={`rounded-lg border p-2.5 transition-colors ${s.reached ? 'border-border/50 bg-muted/20' : 'border-dashed border-border/40 bg-transparent opacity-60'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold">{s.stage}</p>
                          <span className="text-[10px] text-muted-foreground">Day {s.day} · {s.date}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-foreground/85">{s.label}</p>
                        <p className="text-[10px] text-muted-foreground">{s.detail}</p>
                        {s.nodeId && (
                          <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-[10px] text-trading-gold" onClick={() => open(s.nodeId!)}>
                            Open artefact <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Glass>
          </TabsContent>

          {/* ── Evidence & relationships ────────────────────── */}
          <TabsContent value="evidence" className="space-y-6">
            <SectionHeader n={3} icon={ShieldCheck} title="Evidence Explorer" subtitle="Supporting, counter, neutral and unknown evidence with source, module and impact." />
            <div className="grid gap-3 lg:grid-cols-2">
              {(['supporting', 'counter', 'neutral', 'unknown'] as EvidenceStance[]).map((stance) => {
                const items = evidence.filter((e) => e.stance === stance);
                return (
                  <Glass key={stance}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-sm">
                        <span>{STANCE_META[stance].label} Evidence</span>
                        <Badge variant="outline" className={`text-[10px] ${STANCE_META[stance].cls}`}>{items.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {items.length === 0 && <p className="text-xs text-muted-foreground">No {stance} evidence recorded.</p>}
                      {items.map((e) => (
                        <div key={e.id} className="space-y-1.5 rounded-lg border border-border/40 bg-muted/15 p-2.5">
                          <p className="text-xs font-medium">{e.statement}</p>
                          <p className="text-[10px] text-muted-foreground">{e.explanation}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{e.date}</span><span>·</span><span>{e.source}</span><span>·</span><span>{e.module}</span><span>·</span><span>Impact {e.impact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ConfBar value={e.confidence} />
                            <span className="shrink-0 text-[10px] text-muted-foreground">{e.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Glass>
                );
              })}
            </div>

            <SectionHeader n={4} icon={Link2} title="Relationship Explorer" subtitle="Every connection, typed and clickable — navigation is instant." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Object.entries(rels).map(([label, items]) => (
                <Glass key={label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{label}</CardTitle>
                    <CardDescription className="text-[10px]">{items.length} connection{items.length === 1 ? '' : 's'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {items.map((r) => (
                      <div key={r.edge.id} className="space-y-1">
                        <ObjectLink id={r.other.id} onOpen={open} note={`${r.direction} · ${STRENGTH_META[r.edge.strength].label} · ${r.edge.confidence}%`} />
                        <p className="pl-1 text-[10px] text-muted-foreground">{r.edge.note}</p>
                      </div>
                    ))}
                  </CardContent>
                </Glass>
              ))}
              {Object.keys(rels).length === 0 && (
                <Glass><CardContent className="p-4 text-xs text-muted-foreground">This object has no recorded relationships yet.</CardContent></Glass>
              )}
            </div>

            <SectionHeader n={10} icon={GitBranch} title="Institutional Dependencies" subtitle="Parents, children, siblings, parallel research, alternatives and rejected lines." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {deps.map((g) => (
                <Glass key={g.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{g.label}</CardTitle>
                    <CardDescription className="text-[10px]">{g.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {g.ids.length === 0 && <p className="text-xs text-muted-foreground">None recorded.</p>}
                    {g.ids.map((d) => <ObjectLink key={`${g.label}-${d}`} id={d} onOpen={open} />)}
                  </CardContent>
                </Glass>
              ))}
            </div>
          </TabsContent>

          {/* ── Impact & departments ────────────────────────── */}
          <TabsContent value="impact" className="space-y-6">
            <SectionHeader n={5} icon={Gauge} title="Impact Analysis" subtitle="Seven institutional impact dimensions, scored and explained." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {impacts.map((i) => (
                <Glass key={i.label}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{i.label}</p>
                      <span className={`text-sm font-semibold ${GOLD}`}>{i.score}</span>
                    </div>
                    <Progress value={i.score} className="h-1.5" />
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{i.note}</p>
                  </CardContent>
                </Glass>
              ))}
            </div>

            <SectionHeader n={6} icon={Building2} title="Department Contributions" subtitle="What every AI department contributed, with reasoning, evidence and timestamps." />
            <Glass>
              <CardContent className="space-y-2 p-4">
                {depts.map((d) => (
                  <div key={d.department} className={`rounded-lg border p-3 ${d.primary ? 'border-trading-gold/40 bg-trading-gold/5' : 'border-border/40 bg-muted/15'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold">{d.department}</p>
                        {d.primary && <Badge variant="outline" className="border-trading-gold/40 text-[9px] text-trading-gold">Owner</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{d.timestamp}</span>
                        <Button asChild size="sm" variant="ghost" className="h-6 px-2 text-[10px]">
                          <Link to={d.link}>Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs">{d.contribution}</p>
                    <p className="text-[10px] text-muted-foreground">{d.reasoning}</p>
                    <p className="text-[10px] text-muted-foreground">Evidence: {d.evidence}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <ConfBar value={d.confidence} />
                      <span className="shrink-0 text-[10px] text-muted-foreground">{d.confidence}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Glass>

            <SectionHeader n={8} icon={Activity} title="Cause & Effect" subtitle="Fully traceable causal chain in both directions." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ce.map((c) => (
                <Glass key={c.question}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{c.question}</CardTitle>
                    <CardDescription className="text-[10px]">{c.answer}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {c.items.length === 0 && <p className="text-xs text-muted-foreground">Nothing recorded.</p>}
                    {c.items.map((it, idx) => (
                      NODE_BY_ID[it.id] && it.label.startsWith(it.id)
                        ? <div key={`${it.id}-${idx}`} className="space-y-1"><ObjectLink id={it.id} onOpen={open} /><p className="pl-1 text-[10px] text-muted-foreground">{it.note}</p></div>
                        : <div key={`${it.id}-${idx}`} className="rounded-md border border-border/40 bg-muted/15 p-2"><p className="text-xs">{it.label}</p><p className="text-[10px] text-muted-foreground">{it.note}</p></div>
                    ))}
                  </CardContent>
                </Glass>
              ))}
            </div>
          </TabsContent>

          {/* ── Research replay ─────────────────────────────── */}
          <TabsContent value="replay" className="space-y-6">
            <SectionHeader n={7} icon={History} title="Research Replay™" subtitle="Animate through the entire research history, one stage at a time." />
            <Glass>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setFrameIdx((i) => Math.max(0, i - 1))}><SkipBack className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" className="h-8" onClick={() => setPlaying((p) => !p)}>
                    {playing ? <><Pause className="mr-1 h-3.5 w-3.5" />Pause</> : <><Play className="mr-1 h-3.5 w-3.5" />Play</>}
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setFrameIdx((i) => Math.min(frames.length - 1, i + 1))}><SkipForward className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => { setFrameIdx(0); setPlaying(false); }}><RotateCcw className="mr-1 h-3.5 w-3.5" />Restart</Button>
                  <div className="flex items-center gap-1">
                    {[0.5, 1, 2, 4].map((s) => (
                      <Button key={s} size="sm" variant={speed === s ? 'default' : 'outline'} className="h-8 px-2 text-[10px]" onClick={() => setSpeed(s)}>{s}×</Button>
                    ))}
                  </div>
                  <div className="flex min-w-[220px] flex-1 items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Jump to date</span>
                    <Slider
                      value={[frameIdx]}
                      min={0}
                      max={Math.max(0, frames.length - 1)}
                      step={1}
                      onValueChange={(v) => { setPlaying(false); setFrameIdx(v[0]); }}
                    />
                    <span className="shrink-0 text-[10px] text-muted-foreground">{frame ? frame.date : '—'}</span>
                  </div>
                </div>

                {frame && (
                  <div key={frame.day + frame.title} className="animate-fade-in rounded-lg border border-trading-gold/30 bg-trading-gold/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Day {frame.day} · {frame.date} · {frame.kind}</p>
                    <p className="mt-1 text-sm font-semibold">{frame.title}</p>
                    <p className="text-xs text-muted-foreground">{frame.detail}</p>
                    {frame.nodeId && (
                      <Button size="sm" variant="ghost" className="mt-1.5 h-6 px-2 text-[10px] text-trading-gold" onClick={() => open(frame.nodeId!)}>
                        Open artefact <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  {frames.map((f, i) => (
                    <button
                      key={`${f.day}-${f.title}`}
                      onClick={() => { setPlaying(false); setFrameIdx(i); }}
                      className={`flex w-full items-center gap-3 rounded-md border px-2.5 py-2 text-left transition-all ${i === frameIdx ? 'border-trading-gold/50 bg-trading-gold/10' : i < frameIdx ? 'border-border/40 bg-muted/20' : 'border-dashed border-border/30 opacity-60'}`}
                    >
                      <span className="w-16 shrink-0 text-[10px] text-muted-foreground">Day {f.day}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium">{f.title}</span>
                        <span className="block truncate text-[10px] text-muted-foreground">{f.detail}</span>
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase ${f.kind === 'failure' ? 'bg-destructive/15 text-destructive' : f.kind === 'breakthrough' ? 'bg-trading-gold/15 text-trading-gold' : 'bg-muted/40 text-muted-foreground'}`}>{f.kind}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Glass>
          </TabsContent>

          {/* ── Knowledge DNA ───────────────────────────────── */}
          <TabsContent value="dna" className="space-y-6">
            <SectionHeader n={9} icon={Sparkles} title="Knowledge DNA" subtitle="The unique fingerprint of this research object across eight institutional axes." />
            <div className="grid gap-3 lg:grid-cols-2">
              <Glass>
                <CardContent className="p-3">
                  <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dna} outerRadius="72%">
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                        <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Glass>
              <Glass>
                <CardContent className="space-y-2 p-4">
                  {dna.map((d) => (
                    <div key={d.axis} className="space-y-1 rounded-lg border border-border/40 bg-muted/15 p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{d.axis}</p>
                        <span className={`text-xs font-semibold ${GOLD}`}>{d.value}</span>
                      </div>
                      <ConfBar value={d.value} />
                      <p className="text-[10px] text-muted-foreground">{d.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Glass>
            </div>
          </TabsContent>

          {/* ── Future & commentary ─────────────────────────── */}
          <TabsContent value="future" className="space-y-6">
            <SectionHeader n={11} icon={Rocket} title="Future Opportunities" subtitle="Open questions, improvements, experiments and potential breakthroughs, ranked by expected research gain." />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {opps.map((o) => (
                <Glass key={o.title}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{o.kind}</Badge>
                      <span className="text-[10px] text-muted-foreground">Priority #{o.priority}</span>
                    </div>
                    <p className="text-xs font-medium">{o.title}</p>
                    <p className="text-[10px] text-muted-foreground">{o.rationale}</p>
                    <div className="flex items-center gap-2">
                      <ConfBar value={o.expectedGain} />
                      <span className="shrink-0 text-[10px] text-muted-foreground">Gain {o.expectedGain}</span>
                    </div>
                  </CardContent>
                </Glass>
              ))}
            </div>

            <SectionHeader n={12} icon={BookOpen} title="Executive Commentary" subtitle="Automatically generated institutional narrative — fully explainable." />
            <div className="grid gap-3 md:grid-cols-2">
              {commentary.map((c) => (
                <Glass key={c.heading}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{c.heading}</CardTitle></CardHeader>
                  <CardContent><p className="text-xs leading-relaxed text-foreground/85">{c.body}</p></CardContent>
                </Glass>
              ))}
            </div>
          </TabsContent>

          {/* ── Audit & time machine ────────────────────────── */}
          <TabsContent value="audit" className="space-y-6">
            <SectionHeader n={13} icon={AlertTriangle} title="Audit Trail" subtitle="Append-only chronological record. Nothing is ever deleted." />
            <Glass>
              <CardContent className="p-4">
                <ScrollArea className="h-[380px]">
                  <div className="space-y-1.5 pr-3">
                    {audit.map((a, i) => (
                      <div key={`${a.day}-${i}`} className="flex gap-3 rounded-md border border-border/40 bg-muted/15 p-2.5">
                        <span className="w-20 shrink-0 text-[10px] text-muted-foreground">Day {a.day}<br />{a.date}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-medium">{a.action}</span>
                          <span className="block text-[10px] text-muted-foreground">{a.detail}</span>
                          <span className="block text-[10px] text-muted-foreground">{a.actor}</span>
                        </span>
                        <Badge variant="outline" className="h-5 shrink-0 text-[9px]">{a.category}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Glass>

            <SectionHeader n={14} icon={History} title="Institutional Time Machine™" subtitle="Drag backwards to see only what the institution knew at that exact moment. No hindsight." />
            <Glass>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Slider value={[machineDay]} min={1} max={TODAY_DAY} step={1} onValueChange={(v) => setMachineDay(v[0])} className="min-w-[240px] flex-1" />
                  <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">Day {machine.day} · {machine.date}</Badge>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setMachineDay(TODAY_DAY)}>Restore today</Button>
                </div>
                <p className="text-xs text-muted-foreground">{machine.narrative}</p>
                <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
                  <div className="space-y-1.5">
                    {machine.byType.map((t) => (
                      <div key={t.type} className="flex items-center justify-between rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5">
                        <span className="text-[11px]">{t.type}</span>
                        <span className={`text-[11px] font-semibold ${GOLD}`}>{t.count}</span>
                      </div>
                    ))}
                    {machine.byType.length === 0 && <p className="text-xs text-muted-foreground">The institution held no recorded knowledge on this day.</p>}
                  </div>
                  <ScrollArea className="h-[320px]">
                    <div className="space-y-1.5 pr-3">
                      {machine.knownNodes
                        .slice()
                        .sort((a, b) => b.created.localeCompare(a.created))
                        .map((k: KnowledgeNode) => <ObjectLink key={k.id} id={k.id} onOpen={open} note={`known since ${k.created} (day ${dayOf(k.created)})`} />)}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Glass>
          </TabsContent>
        </Tabs>

        {/* Governance */}
        <div className="mt-8 space-y-3">
          <SectionHeader n={15} icon={Lock} title="Governance & Exports" subtitle="Read-only guarantees and institutional-quality PDF reporting." />
          <Glass className="border-trading-gold/25">
            <CardContent className="grid gap-2 p-4 md:grid-cols-2">
              {EXPLORER_GUARANTEES.map((g) => (
                <div key={g} className="flex items-start gap-2 rounded-md border border-border/40 bg-muted/15 p-2.5">
                  <Lock className={`mt-0.5 h-3 w-3 shrink-0 ${GOLD}`} />
                  <p className="text-[11px] text-muted-foreground">{g}</p>
                </div>
              ))}
            </CardContent>
          </Glass>
          <div className="flex flex-wrap gap-1.5">
            {EXPORT_KINDS.map((k) => (
              <Button key={`b-${k}`} size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => exportPdf(k)}>
                <FileDown className="mr-1 h-3 w-3" />Export {k}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
