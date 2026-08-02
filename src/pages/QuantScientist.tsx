import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Atom, Radar, Lightbulb, FileText, ClipboardList, Award, GitBranch,
  Users, Network, Trophy, HelpCircle, Gavel, ShieldCheck, Download,
  ExternalLink, Lock, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  LAB_STATS, SCAN_MODULES, CANDIDATES, HYPOTHESES, KIND_LABEL,
  PIPELINE_STAGES, BOARD_LABEL, GRAPH_NODES, GRAPH_EDGES,
  RANK_OPTIONS, rankHypotheses, overallScore, GOVERNANCE_RULES,
  type Hypothesis, type BoardOutcome, type RankKey, type GraphNode,
} from '@/lib/quantScientist';

const boardClass: Record<BoardOutcome, string> = {
  approved_for_validation: 'bg-success/15 text-success border-success/30',
  needs_more_evidence: 'bg-warning/15 text-warning border-warning/30',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  archive: 'bg-muted text-muted-foreground border-border',
  deferred: 'bg-primary/10 text-primary border-primary/30',
};

const gradeClass: Record<Hypothesis['grade'], string> = {
  'A+': 'bg-success/15 text-success border-success/30',
  A: 'bg-success/15 text-success border-success/30',
  B: 'bg-primary/10 text-primary border-primary/30',
  C: 'bg-warning/15 text-warning border-warning/30',
  D: 'bg-destructive/15 text-destructive border-destructive/30',
};

const nodeFill: Record<GraphNode['type'], string> = {
  discovery: 'hsl(var(--primary))',
  hypothesis: 'hsl(var(--success))',
  strategy: 'hsl(var(--warning))',
  regime: 'hsl(var(--muted-foreground))',
  paper: 'hsl(var(--primary))',
  validation: 'hsl(var(--warning))',
  specialist: 'hsl(var(--success))',
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

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{label}</span><span className="font-mono">{value}</span>
      </div>
      <Progress value={value} className="h-1.5" />
    </div>
  );
}

async function exportPaper(h: Hypothesis) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const M = 48, W = 595 - M * 2;
  let y = M;

  const line = (text: string, size = 10, bold = false, gap = 14) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const parts = doc.splitTextToSize(text, W) as string[];
    parts.forEach(p => {
      if (y > 780) { doc.addPage(); y = M; }
      doc.text(p, M, y); y += gap;
    });
  };
  const heading = (text: string) => { y += 8; line(text, 12, true, 16); };

  line('AI QUANT SCIENTIST™ — RESEARCH PAPER', 16, true, 22);
  line(h.title, 13, true, 18);
  line(`${h.id} · Confidence ${h.confidence}% · Novelty ${h.novelty} · Grade ${h.grade} · Board: ${BOARD_LABEL[h.board]}`, 9);
  line('Observation Only · Research Only · Simulation Only', 9);

  heading('Executive Summary'); line(h.paper.executiveSummary);
  heading('Background'); line(h.paper.background);
  heading('Problem Statement'); line(h.paper.problemStatement);
  heading('Hypothesis'); line(h.paper.hypothesis);
  heading('Supporting Evidence'); h.paper.supportingEvidence.forEach(e => line(`• ${e}`));
  heading('Counter Arguments'); h.paper.counterArguments.forEach(e => line(`• ${e}`));
  heading('Expected Metrics');
  h.paper.expectedMetrics.forEach(m => line(`• ${m.metric}: baseline ${m.baseline} → expected ${m.expected}`));
  heading('Validation Plan'); h.paper.validationPlan.forEach(e => line(`• ${e}`));
  heading('Known Risks'); h.paper.knownRisks.forEach(e => line(`• ${e}`));
  heading('Governance Status'); line(h.paper.governanceStatus);
  heading('Peer Review');
  h.reviews.forEach(r => line(`• ${r.reviewer} (${r.confidence}%, ${r.approval.replace(/_/g, ' ')}): ${r.summary}`));
  heading('References'); h.paper.references.forEach(r => line(`• ${r.label} — ${r.url}`));

  doc.save(`${h.id}-${h.title.replace(/\s+/g, '-')}.pdf`);
}

export default function QuantScientist() {
  const [selected, setSelected] = useState<Hypothesis | null>(null);
  const [rankKey, setRankKey] = useState<RankKey>('confidence');
  const [node, setNode] = useState<GraphNode | null>(null);

  const ranked = useMemo(() => rankHypotheses(rankKey), [rankKey]);
  const rankDesc = RANK_OPTIONS.find(r => r.key === rankKey)!;

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      {/* Section 1 — Research Laboratory */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Atom className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold sm:text-xl">AI Quant Scientist™</h1>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">v1</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Autonomous quantitative research laboratory — discovers, designs and validates new strategy ideas. Never trades, never allocates, never promotes.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 border-warning/40 text-[10px] text-warning">
          <Lock className="h-3 w-3" /> OBSERVATION · RESEARCH · SIMULATION ONLY
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {LAB_STATS.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className="pt-1 font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="discovery">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="discovery" className="text-xs">Discovery</TabsTrigger>
          <TabsTrigger value="hypotheses" className="text-xs">Hypotheses</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
          <TabsTrigger value="review" className="text-xs">Peer Review</TabsTrigger>
          <TabsTrigger value="graph" className="text-xs">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
          <TabsTrigger value="board" className="text-xs">Executive Board</TabsTrigger>
          <TabsTrigger value="governance" className="text-xs">Governance</TabsTrigger>
        </TabsList>

        {/* Section 2 — Discovery Engine */}
        <TabsContent value="discovery" className="space-y-4 pt-4">
          <SectionHeading icon={Radar} title="Discovery Engine" subtitle="Continuous scan of every research module. Each finding becomes a Research Candidate." />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Module Scan</CardTitle>
              <CardDescription className="text-xs">11 sources · 846 records indexed · last full pass 02:24</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SCAN_MODULES.map(m => (
                <Link key={m.module} to={m.url} className="flex items-center justify-between rounded-md border border-border p-2 text-xs transition-colors hover:border-primary/40">
                  <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-success" />{m.module}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{m.records} · {m.lastScan}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3 lg:grid-cols-2">
            {CANDIDATES.map(c => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{c.id}</Badge>
                    <Badge variant="outline" className="text-[10px]">{KIND_LABEL[c.kind]}</Badge>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">strength {c.strength}</span>
                  </div>
                  <CardTitle className="pt-1 text-sm">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{c.observation}</p>
                  <Progress value={c.strength} className="h-1.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {c.sources.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.links.map(l => (
                      <Link key={l.url} to={l.url}>
                        <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted">
                          <ExternalLink className="h-2.5 w-2.5" />{l.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sections 3, 4, 5, 6, 11 — Hypotheses */}
        <TabsContent value="hypotheses" className="space-y-4 pt-4">
          <SectionHeading icon={Lightbulb} title="Hypothesis Generator" subtitle="Each candidate becomes a fully specified hypothesis with paper, validation design, scores and explainability." />
          <div className="grid gap-3 lg:grid-cols-2">
            {HYPOTHESES.map(h => (
              <Card key={h.id} className="transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{h.id}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${gradeClass[h.grade]}`}>Grade {h.grade}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${boardClass[h.board]}`}>{BOARD_LABEL[h.board]}</Badge>
                    <Badge variant="outline" className="ml-auto text-[10px] capitalize">{h.priority} priority</Badge>
                  </div>
                  <CardTitle className="pt-1 text-sm">{h.title}</CardTitle>
                  <CardDescription className="text-xs">{h.problem}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-[10px] text-muted-foreground">Confidence</p><p className="font-mono text-sm">{h.confidence}%</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Novelty</p><p className="font-mono text-sm">{h.novelty}</p></div>
                    <div><p className="text-[10px] text-muted-foreground">Overall</p><p className="font-mono text-sm">{overallScore(h.scores)}</p></div>
                  </div>
                  <p className="text-xs"><span className="text-muted-foreground">Expected benefit: </span>{h.expectedBenefit}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(h)}>Open paper</Button>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => { void exportPaper(h); toast.success('Research paper exported'); }}>
                      <Download className="h-3 w-3" /> PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Section 7 — Pipeline */}
        <TabsContent value="pipeline" className="space-y-4 pt-4">
          <SectionHeading icon={GitBranch} title="Research Pipeline" subtitle="Idea → Hypothesis → Paper → Validation Proposal → Simulation → Peer Review → Championship Candidate → Approval Board → Production Path." />
          <Card>
            <CardContent className="space-y-4 p-4">
              {HYPOTHESES.map(h => {
                const idx = PIPELINE_STAGES.findIndex(s => s.id === h.stage);
                return (
                  <div key={h.id}>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[10px]">{h.id}</Badge>
                      <span className="text-xs font-medium">{h.title}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{PIPELINE_STAGES[idx].label}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {PIPELINE_STAGES.map((s, i) => (
                        <div key={s.id} className="flex-1" title={s.label}>
                          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-primary' : 'bg-muted'}`} />
                          <p className="mt-1 hidden text-[9px] text-muted-foreground lg:block">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <SectionHeading icon={ClipboardList} title="Validation Designer" subtitle="Experiments are proposed only. Nothing executes automatically." />
          <div className="grid gap-3 lg:grid-cols-2">
            {HYPOTHESES.map(h => (
              <Card key={h.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{h.title}</CardTitle>
                  <CardDescription className="text-xs">{h.validations.length} proposed experiments · fastest {h.fastestValidationDays}d</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {h.validations.map(v => (
                    <div key={v.type} className="rounded-md border border-border p-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{v.type}</Badge>
                        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{v.estRuntime}</span>
                      </div>
                      <p className="pt-1 text-xs">{v.design}</p>
                      <p className="text-[10px] text-muted-foreground">Data: {v.datasets}</p>
                      <p className="text-[10px] text-muted-foreground">Pass gate: {v.passGate}</p>
                    </div>
                  ))}
                  <Badge variant="outline" className="gap-1 border-warning/40 text-[10px] text-warning">
                    <Lock className="h-2.5 w-2.5" /> Proposal only — not executed
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Section 8 — Peer Review */}
        <TabsContent value="review" className="space-y-4 pt-4">
          <SectionHeading icon={Users} title="AI Peer Review" subtitle="Research Director looks for flaws, Risk Officer looks for hidden risk, CIO looks for portfolio value." />
          {HYPOTHESES.map(h => (
            <Card key={h.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px]">{h.id}</Badge>
                  <CardTitle className="text-sm">{h.title}</CardTitle>
                  <Badge variant="outline" className={`ml-auto text-[10px] ${boardClass[h.board]}`}>{BOARD_LABEL[h.board]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 lg:grid-cols-3">
                {h.reviews.map(r => (
                  <div key={r.reviewer} className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{r.reviewer}</span>
                      {r.approval === 'approve' && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                      {r.approval === 'approve_with_conditions' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                      {r.approval === 'reject' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">{r.confidence}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.summary}</p>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Concerns</p>
                      <ul className="list-inside list-disc text-[11px]">{r.concerns.map(c => <li key={c}>{c}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommendations</p>
                      <ul className="list-inside list-disc text-[11px]">{r.recommendations.map(c => <li key={c}>{c}</li>)}</ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Section 9 — Knowledge Graph */}
        <TabsContent value="graph" className="space-y-4 pt-4">
          <SectionHeading icon={Network} title="Knowledge Graph" subtitle="Discoveries, hypotheses, strategies, regimes, papers and validations. Click any node." />
          <Card>
            <CardContent className="overflow-x-auto p-4">
              <svg viewBox="0 0 840 380" className="h-[380px] w-full min-w-[720px]">
                {GRAPH_EDGES.map(e => {
                  const a = GRAPH_NODES.find(n => n.id === e.from)!;
                  const b = GRAPH_NODES.find(n => n.id === e.to)!;
                  return <line key={`${e.from}-${e.to}`} x1={a.x + 40} y1={a.y + 14} x2={b.x} y2={b.y + 14}
                    stroke="hsl(var(--border))" strokeWidth={1.5} />;
                })}
                {GRAPH_NODES.map(n => (
                  <g key={n.id} className="cursor-pointer" onClick={() => setNode(n)}>
                    <rect x={n.x - 40} y={n.y} width={80} height={28} rx={6}
                      fill="hsl(var(--card))" stroke={nodeFill[n.type]} strokeWidth={1.5} />
                    <text x={n.x} y={n.y + 18} textAnchor="middle" fontSize={11} fill="hsl(var(--foreground))">{n.label}</text>
                  </g>
                ))}
              </svg>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 10 — Ranking */}
        <TabsContent value="ranking" className="space-y-4 pt-4">
          <SectionHeading icon={Trophy} title="Research Ranking" subtitle="Rank the hypothesis queue by any executive dimension." />
          <div className="flex flex-wrap gap-2">
            {RANK_OPTIONS.map(o => (
              <Button key={o.key} size="sm" variant={rankKey === o.key ? 'default' : 'outline'}
                className="h-7 text-xs" onClick={() => setRankKey(o.key)}>{o.label}</Button>
            ))}
          </div>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {ranked.map((h, i) => (
                <button key={h.id} onClick={() => setSelected(h)}
                  className="flex w-full flex-wrap items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40">
                  <span className="font-mono text-sm text-muted-foreground">#{i + 1}</span>
                  <Badge variant="secondary" className="font-mono text-[10px]">{h.id}</Badge>
                  <span className="text-xs font-medium">{h.title}</span>
                  <Badge variant="outline" className={`text-[10px] ${gradeClass[h.grade]}`}>{h.grade}</Badge>
                  <span className="ml-auto font-mono text-xs text-primary">{rankDesc.describe(h)}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Section 12 — Executive Board */}
        <TabsContent value="board" className="space-y-4 pt-4">
          <SectionHeading icon={Gavel} title="Executive Board Decision" subtitle="Every completed paper receives a board outcome with links to supporting reports." />
          <div className="grid gap-3 lg:grid-cols-2">
            {HYPOTHESES.map(h => (
              <Card key={h.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{h.id}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${boardClass[h.board]}`}>{BOARD_LABEL[h.board]}</Badge>
                  </div>
                  <CardTitle className="pt-1 text-sm">{h.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{h.boardRationale}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.paper.references.map(r => (
                      <Link key={r.url} to={r.url}>
                        <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted">
                          <ExternalLink className="h-2.5 w-2.5" />{r.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Section 13 — Governance */}
        <TabsContent value="governance" className="space-y-4 pt-4">
          <SectionHeading icon={ShieldCheck} title="Governance" subtitle="Hard guarantees enforced by the module design." />
          <Card>
            <CardContent className="space-y-2 p-4">
              {GOVERNANCE_RULES.map(r => (
                <div key={r} className="flex items-start gap-2 text-xs">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0 text-warning" /><span>{r}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                Every recommendation remains advisory until manually validated through{' '}
                <Link to="/specialist-championship" className="text-primary underline">Championship</Link>,{' '}
                <Link to="/specialist-approval-board" className="text-primary underline">Approval Board</Link> and the{' '}
                <Link to="/allocation-production-path" className="text-primary underline">Allocation Production Path</Link>.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Paper + explainability dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />{selected.title}
                  <Badge variant="outline" className={`text-[10px] ${gradeClass[selected.grade]}`}>Grade {selected.grade}</Badge>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selected.id} · confidence {selected.confidence}% · novelty {selected.novelty} · board: {BOARD_LABEL[selected.board]}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-xs">Innovation Score</CardTitle></CardHeader>
                  <CardContent className="grid gap-2 sm:grid-cols-2">
                    <ScoreBar label="Innovation" value={selected.scores.innovation} />
                    <ScoreBar label="Originality" value={selected.scores.originality} />
                    <ScoreBar label="Research Quality" value={selected.scores.researchQuality} />
                    <ScoreBar label="Evidence Strength" value={selected.scores.evidenceStrength} />
                    <ScoreBar label="Validation Readiness" value={selected.scores.validationReadiness} />
                    <ScoreBar label="Commercial Value" value={selected.scores.commercialValue} />
                    <ScoreBar label="Executive Interest" value={selected.scores.executiveInterest} />
                    <div className="flex items-end">
                      <Badge variant="outline" className={`text-[10px] ${gradeClass[selected.grade]}`}>
                        Overall Research Grade {selected.grade} · {overallScore(selected.scores)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {([
                  ['Executive Summary', selected.paper.executiveSummary],
                  ['Background', selected.paper.background],
                  ['Problem Statement', selected.paper.problemStatement],
                  ['Hypothesis', selected.paper.hypothesis],
                ] as [string, string][]).map(([t, b]) => (
                  <div key={t}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t}</p>
                    <p className="pt-0.5">{b}</p>
                  </div>
                ))}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Supporting Evidence</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.paper.supportingEvidence.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Counter Arguments</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.paper.counterArguments.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected Metrics</p>
                  <div className="mt-1 overflow-hidden rounded-md border border-border">
                    {selected.paper.expectedMetrics.map(m => (
                      <div key={m.metric} className="flex items-center justify-between border-b border-border px-2 py-1.5 last:border-0">
                        <span>{m.metric}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{m.baseline} → <span className="text-primary">{m.expected}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation Plan</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.paper.validationPlan.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Known Risks</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.paper.knownRisks.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                </div>

                <Card className="border-warning/30 bg-warning/5">
                  <CardContent className="p-3">
                    <p className="text-[10px] uppercase tracking-wider text-warning">Governance Status</p>
                    <p className="pt-0.5">{selected.paper.governanceStatus}</p>
                  </CardContent>
                </Card>

                <Separator />
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-primary" />
                  <p className="text-xs font-semibold">Explainability — nothing is a black box</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why it exists</p><p className="pt-0.5">{selected.explain.whyExists}</p></div>
                  <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why this confidence</p><p className="pt-0.5">{selected.explain.confidenceRationale}</p></div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assumptions</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.explain.assumptions.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Data needed</p>
                    <ul className="list-inside list-disc pt-0.5">{selected.explain.dataNeeded.map(e => <li key={e}>{e}</li>)}</ul>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">References</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selected.paper.references.map(r => (
                      <Link key={r.url} to={r.url}>
                        <Badge variant="outline" className="gap-1 text-[10px] hover:bg-muted">
                          <ExternalLink className="h-2.5 w-2.5" />{r.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>

                <Button size="sm" className="gap-1" onClick={() => { void exportPaper(selected); toast.success('Research paper exported'); }}>
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Graph node dialog */}
      <Dialog open={!!node} onOpenChange={o => !o && setNode(null)}>
        <DialogContent className="max-w-md">
          {node && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-primary" />{node.label}
                </DialogTitle>
                <DialogDescription className="text-xs capitalize">{node.type.replace('_', ' ')}</DialogDescription>
              </DialogHeader>
              <p className="text-xs">{node.detail}</p>
              {node.url && (
                <Link to={node.url}>
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <ExternalLink className="h-3 w-3" /> Open source module
                  </Button>
                </Link>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
