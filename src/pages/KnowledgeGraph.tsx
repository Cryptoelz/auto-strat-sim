import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META, STRENGTH_META,
  EXEC_CARDS, KNOWLEDGE_HEATMAP, TIMELINE_STAGES, DISCOVERY_CHAIN, FAILURE_CHAIN, EXAMPLE_CHAIN,
  EVOLUTION_STAGES, GOVERNANCE_GUARANTEES, searchKnowledge, trace, impactAnalysis, explainNode,
  connections, type KnowledgeNode,
} from '@/lib/knowledgeGraph';
import { KnowledgeGraphCanvas } from '@/components/knowledge/KnowledgeGraphCanvas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Network, Search, Lock, FileDown, ArrowRight, ArrowLeft, Sparkles, Flame, XCircle,
  GitBranch, Clock, Activity, Link2, ExternalLink, Brain,
} from 'lucide-react';

const GOLD = 'text-trading-gold';
const BADGES = ['Observation Only', 'Research Only', 'Simulation Only', 'Human Approval Required'];

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

function NodeChip({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const node = NODE_BY_ID[id];
  if (!node) return null;
  const meta = NODE_TYPE_META[node.type];
  return (
    <button
      onClick={() => onSelect(id)}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 text-left transition-colors hover:border-trading-gold/40 hover:bg-muted/40"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: `hsl(${meta.color})` }} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-medium">{node.title}</span>
          <span className="block text-[10px] text-muted-foreground">{node.id} · {meta.label} · {node.status}</span>
        </span>
      </span>
      <span className="shrink-0 text-[10px] text-muted-foreground">{node.confidence}%</span>
    </button>
  );
}

function ChainView({ ids, onSelect }: { ids: string[]; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-1.5">
      {ids.map((id, i) => (
        <div key={id}>
          <NodeChip id={id} onSelect={onSelect} />
          {i < ids.length - 1 && (
            <div className="flex items-center gap-2 pl-3 pt-1 text-[10px] text-muted-foreground">
              <span className="h-3 w-px bg-trading-gold/40" />
              {(() => {
                const edge = KNOWLEDGE_EDGES.find(
                  (e) => (e.from === ids[i + 1] && e.to === id) || (e.from === id && e.to === ids[i + 1]),
                );
                return edge ? `${RELATIONSHIP_META[edge.type].label} · ${STRENGTH_META[edge.strength].label} · ${edge.confidence}%` : 'Connected';
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function KnowledgeGraph() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [explainId, setExplainId] = useState<string | null>(null);
  const [traceDir, setTraceDir] = useState<'back' | 'forward'>('back');
  const [view, setView] = useState('network');

  const hits = useMemo(() => searchKnowledge(query), [query]);
  const node = selectedId ? NODE_BY_ID[selectedId] : null;
  const traceSteps = useMemo(() => (selectedId ? trace(selectedId, traceDir, 6) : []), [selectedId, traceDir]);
  const impact = useMemo(() => (selectedId ? impactAnalysis(selectedId) : null), [selectedId]);
  const explanation = useMemo(() => (explainId ? explainNode(explainId) : null), [explainId]);

  const highlightIds = useMemo(() => {
    if (query && hits.length) return hits.map((h) => h.node.id);
    return [];
  }, [query, hits]);

  const exportPdf = (kind: string) => {
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
    line('Institutional Knowledge Graph™', 16, true);
    line(kind, 12, true);
    line(`Generated ${new Date().toISOString()} — OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY`, 8);
    y += 4;

    if (kind === 'Evidence Tree PDF' && node) {
      line(`Root: ${node.id} — ${node.title}`, 11, true);
      trace(node.id, 'back', 6).slice(1).forEach((s) => line(`${'  '.repeat(s.depth)}↳ ${RELATIONSHIP_META[s.edge!.type].label} → ${s.node.id} ${s.node.title} (${s.edge!.confidence}%)`));
    } else if (kind === 'Discovery Timeline PDF') {
      TIMELINE_STAGES.forEach((s) => {
        line(s.stage, 11, true);
        s.nodeIds.forEach((id) => line(`  • ${id} — ${NODE_BY_ID[id].title} (${NODE_BY_ID[id].status})`));
      });
    } else if (kind === 'Relationship Report PDF') {
      KNOWLEDGE_EDGES.forEach((e) => line(`${e.from} → ${e.to} · ${RELATIONSHIP_META[e.type].label} · ${STRENGTH_META[e.strength].label} · ${e.confidence}% — ${e.note}`, 9));
    } else if (kind === 'Executive Summary PDF') {
      EXEC_CARDS.forEach((c) => line(`${c.label}: ${c.value} — ${c.detail}`));
      y += 4;
      line('Primary open chain', 11, true);
      EXAMPLE_CHAIN.forEach((id) => line(`  • ${id} — ${NODE_BY_ID[id].title}`));
    } else if (kind === 'Audit Pack PDF') {
      line('Governance guarantees', 11, true);
      GOVERNANCE_GUARANTEES.forEach((g) => line(`  • ${g}`));
      y += 3;
      line('Nodes', 11, true);
      KNOWLEDGE_NODES.forEach((k) => line(`${k.id} · ${NODE_TYPE_META[k.type].label} · ${k.status} · conf ${k.confidence}% · ${k.title}`, 8));
      y += 3;
      line('Relationships', 11, true);
      KNOWLEDGE_EDGES.forEach((e) => line(`${e.from} → ${e.to} · ${RELATIONSHIP_META[e.type].label} · ${e.confidence}%`, 8));
    } else {
      KNOWLEDGE_NODES.forEach((k) => line(`${k.id} · ${NODE_TYPE_META[k.type].label} · ${k.status} · ${k.title}`, 9));
      y += 3;
      line('Relationships', 11, true);
      KNOWLEDGE_EDGES.forEach((e) => line(`${e.from} → ${e.to} · ${RELATIONSHIP_META[e.type].label}`, 8));
    }
    doc.save(`${kind.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  return (
    <div className="container mx-auto space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-xl border border-trading-gold/25 bg-card/50 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-trading-gold/30 bg-trading-gold/10">
              <Network className={`h-5 w-5 ${GOLD}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Institutional Knowledge Graph™</h1>
              <p className="text-sm text-muted-foreground">The permanent reasoning map of the institution.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BADGES.map((b) => (
              <Badge key={b} variant="outline" className="border-trading-gold/40 bg-trading-gold/5 text-[10px] text-trading-gold">
                <Lock className="mr-1 h-2.5 w-2.5" />{b}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Executive overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXEC_CARDS.map((c) => (
          <Card key={c.key} className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
              <p className={`mt-1 text-2xl font-bold ${GOLD}`}>{c.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{c.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global search */}
      <Card className="border-trading-gold/20 bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the institutional knowledge..."
              className="h-12 border-trading-gold/25 bg-background/60 pl-10 text-sm"
            />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Searches questions, hypotheses, experiments, threads, validation, forward trials, specialists, papers, reports,
            institutional memory, governance, lessons, breakthroughs, rejected ideas, portfolio and allocation research,
            promotion decisions and architecture.
          </p>
          {query && (
            <div className="mt-3 space-y-1.5">
              {hits.length === 0 && <p className="text-xs text-muted-foreground">No knowledge objects matched.</p>}
              {hits.map((h) => (
                <div key={h.node.id} className="flex items-center gap-2">
                  <div className="flex-1"><NodeChip id={h.node.id} onSelect={setSelectedId} /></div>
                  <span className="w-32 shrink-0 text-right text-[10px] text-muted-foreground">{h.reason}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graph / timeline */}
      <div className="space-y-3">
        <SectionHeader n={1} icon={Network} title="Knowledge Network" subtitle="Every research object connected through explainable relationships. Click any node to open its full record." />
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="network">Network View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="space-y-3">
            <KnowledgeGraphCanvas selectedId={selectedId} highlightIds={highlightIds} onSelect={setSelectedId} />
            <div className="grid gap-3 lg:grid-cols-2">
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Node types</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2 pb-4">
                  {Object.entries(NODE_TYPE_META).map(([k, m]) => (
                    <span key={k} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px]">
                      <span className="h-2 w-2 rounded-full" style={{ background: `hsl(${m.color})` }} />{m.label}
                    </span>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Relationships &amp; knowledge strength</CardTitle></CardHeader>
                <CardContent className="space-y-2 pb-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(RELATIONSHIP_META).map(([k, m]) => (
                      <span key={k} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px]">
                        <span className="h-0.5 w-4 rounded" style={{ background: `hsl(${m.color})` }} />{m.label}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(STRENGTH_META).map(([k, m]) => (
                      <span key={k} className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px]">
                        <span className="w-5 rounded bg-trading-gold" style={{ height: m.width }} />{m.label}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                {TIMELINE_STAGES.map((s, i) => (
                  <div key={s.stage} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-trading-gold/40 text-[10px] text-trading-gold">{i + 1}</span>
                      <p className="text-xs font-semibold">{s.stage}</p>
                    </div>
                    <div className="space-y-1.5">
                      {s.nodeIds.map((id) => <NodeChip key={id} id={id} onSelect={setSelectedId} />)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cause & effect */}
      <div className="space-y-3">
        <SectionHeader n={2} icon={GitBranch} title="Cause &amp; Effect Mode" subtitle="Select any node, then trace backwards to its origin or forwards to everything it produced." />
        <Card className="border-border/50 bg-card/50">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={traceDir === 'back' ? 'default' : 'outline'} onClick={() => setTraceDir('back')}>
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Trace backwards
              </Button>
              <Button size="sm" variant={traceDir === 'forward' ? 'default' : 'outline'} onClick={() => setTraceDir('forward')}>
                <ArrowRight className="mr-1.5 h-3.5 w-3.5" />Trace forwards
              </Button>
              {!selectedId && (
                <span className="text-xs text-muted-foreground">
                  No node selected — <button className={`underline ${GOLD}`} onClick={() => setSelectedId('PRT-004')}>start from Portfolio PF</button>
                </span>
              )}
            </div>
            {selectedId && (
              <div className="space-y-1.5">
                {traceSteps.map((s) => (
                  <div key={`${s.node.id}-${s.depth}`} style={{ paddingLeft: s.depth * 16 }}>
                    <div className="flex items-center gap-2">
                      {s.edge && <span className="text-[10px] text-muted-foreground">{RELATIONSHIP_META[s.edge.type].label} ↓</span>}
                    </div>
                    <NodeChip id={s.node.id} onSelect={setSelectedId} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chains */}
      <div className="space-y-3">
        <SectionHeader n={3} icon={Sparkles} title="Discovery &amp; Failure Chains" subtitle="Nothing is deleted. Successes and failures both remain permanently connected." />
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Example Chain</CardTitle><CardDescription className="text-[11px]">Low-Vol Coiler → Institutional Memory</CardDescription></CardHeader>
            <CardContent><ChainView ids={EXAMPLE_CHAIN} onSelect={setSelectedId} /></CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Discovery Chain</CardTitle><CardDescription className="text-[11px]">Question → Breakthrough → Memory</CardDescription></CardHeader>
            <CardContent><ChainView ids={DISCOVERY_CHAIN} onSelect={setSelectedId} /></CardContent>
          </Card>
          <Card className="border-trading-loss/25 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><XCircle className="h-3.5 w-3.5 text-trading-loss" />Failure Chain</CardTitle><CardDescription className="text-[11px]">Failures become institutional knowledge</CardDescription></CardHeader>
            <CardContent><ChainView ids={FAILURE_CHAIN} onSelect={setSelectedId} /></CardContent>
          </Card>
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-3">
        <SectionHeader n={4} icon={Flame} title="Knowledge Heatmap" subtitle="Where institutional knowledge is densest, fastest growing and most valuable." />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {KNOWLEDGE_HEATMAP.map((g) => (
            <Card key={g.label} className="border-border/50 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">{g.label}</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {g.items.map((i) => (
                  <button key={i.id + i.label} onClick={() => setSelectedId(i.id)} className="flex w-full items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-left hover:border-trading-gold/40">
                    <span className="min-w-0 truncate text-[11px]">{i.label}</span>
                    <span className={`shrink-0 text-[10px] ${GOLD}`}>{i.metric}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Knowledge evolution */}
      <div className="space-y-3">
        <SectionHeader n={5} icon={Clock} title="Knowledge Evolution" subtitle="How every idea travels from birth to permanent historical record." />
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              {EVOLUTION_STAGES.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className="animate-fade-in rounded-full border border-trading-gold/35 bg-trading-gold/10 px-3 py-1.5 text-[11px] text-trading-gold"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    {s}
                  </div>
                  {i < EVOLUTION_STAGES.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              ))}
            </div>
            <Progress value={100} className="mt-4 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Exports */}
      <div className="space-y-3">
        <SectionHeader n={6} icon={FileDown} title="Institutional Exports" subtitle="Every export is a read-only research artefact." />
        <div className="flex flex-wrap gap-2">
          {['Knowledge Graph PDF', 'Evidence Tree PDF', 'Discovery Timeline PDF', 'Relationship Report PDF', 'Executive Summary PDF', 'Audit Pack PDF'].map((k) => (
            <Button key={k} size="sm" variant="outline" className="border-trading-gold/30" onClick={() => exportPdf(k)}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" />{k}
            </Button>
          ))}
        </div>
        {!selectedId && <p className="text-[10px] text-muted-foreground">Select a node first for a node-specific Evidence Tree PDF.</p>}
      </div>

      {/* Governance */}
      <Card className="border-trading-gold/25 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Lock className={`h-4 w-4 ${GOLD}`} />Governance</CardTitle>
          <CardDescription className="text-[11px]">Hard guarantees enforced across the Institutional Knowledge Graph™.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {GOVERNANCE_GUARANTEES.map((g) => (
            <Badge key={g} variant="outline" className="border-trading-gold/30 bg-trading-gold/5 text-[10px] text-trading-gold">{g}</Badge>
          ))}
        </CardContent>
      </Card>

      {/* Node drawer */}
      <Sheet open={!!node} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
          {node && (
            <ScrollArea className="h-full">
              <div className="space-y-4 p-6">
                <SheetHeader className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ background: `hsl(${NODE_TYPE_META[node.type].color})` }} />
                    <Badge variant="outline" className="text-[10px]">{NODE_TYPE_META[node.type].label}</Badge>
                    <Badge variant="outline" className="text-[10px]">{node.status}</Badge>
                    <Badge variant="outline" className="border-trading-gold/30 text-[10px] text-trading-gold">Read only</Badge>
                  </div>
                  <SheetTitle className="text-base">{node.title}</SheetTitle>
                  <SheetDescription className="text-xs">{node.id} · created {node.created} · {node.summary}</SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</p>
                    <p className="text-lg font-bold">{node.confidence}%</p>
                    <Progress value={node.confidence} className="mt-1 h-1.5" />
                  </div>
                  <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Evidence score</p>
                    <p className="text-lg font-bold">{node.evidenceScore}</p>
                    <Progress value={node.evidenceScore} className="mt-1 h-1.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Research owner</p><p>{node.owner}</p></div>
                  <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Department</p><p>{node.department}</p></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="border-trading-gold/30" onClick={() => setExplainId(node.id)}>
                    <Brain className="mr-1.5 h-3.5 w-3.5" />Explain This
                  </Button>
                  {node.link && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={node.link}><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Open source module</Link>
                    </Button>
                  )}
                </div>

                <Separator />

                {([
                  ['Supporting evidence', node.supportingEvidence],
                  ['Counter evidence', node.counterEvidence],
                  ['Lessons learned', node.lessons],
                  ['Promotion history', node.promotionHistory],
                  ['Governance history', node.governanceHistory],
                  ['Current usage', node.currentUsage],
                ] as [string, string[]][]).map(([label, items]) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {(items.length ? items : ['None recorded']).map((i) => (
                        <li key={i} className="rounded border border-border/40 bg-muted/20 px-2 py-1">{i}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                <Separator />

                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Dependencies &amp; relationships</p>
                  <div className="mt-1 space-y-1">
                    {connections(node.id).map((c) => {
                      const otherId = c.from === node.id ? c.to : c.from;
                      return (
                        <button key={c.id} onClick={() => setSelectedId(otherId)} className="flex w-full items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5 text-left hover:border-trading-gold/40">
                          <span className="min-w-0 truncate text-[11px]">
                            <Link2 className="mr-1 inline h-3 w-3 text-muted-foreground" />
                            {c.from === node.id ? '→' : '←'} {NODE_BY_ID[otherId].title}
                          </span>
                          <span className="shrink-0 text-[10px]" style={{ color: `hsl(${RELATIONSHIP_META[c.type].color})` }}>
                            {RELATIONSHIP_META[c.type].label} · {STRENGTH_META[c.strength].label} · {c.confidence}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {impact && (
                  <>
                    <Separator />
                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <Activity className="h-3 w-3" />Impact analysis
                      </p>
                      <div className="mt-1 grid gap-2 sm:grid-cols-2">
                        {([
                          ['Affected modules', impact.modules],
                          ['Affected specialists', impact.specialists],
                          ['Affected reports', impact.reports],
                          ['Affected experiments', impact.experiments],
                          ['Affected portfolio studies', impact.portfolioStudies],
                          ['Affected promotions', impact.promotions],
                          ['Affected governance decisions', impact.governance],
                          ['Affected executive recommendations', impact.recommendations],
                        ] as [string, string[]][]).map(([label, items]) => (
                          <div key={label} className="rounded-md border border-border/40 bg-muted/20 p-2">
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                            <ul className="mt-1 space-y-0.5 text-[11px]">
                              {(items.length ? items : ['None']).map((i) => <li key={i}>{i}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Explain dialog */}
      <Dialog open={!!explainId} onOpenChange={(o) => !o && setExplainId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {explanation && explainId && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">Explain: {NODE_BY_ID[explainId].title}</DialogTitle>
                <DialogDescription className="text-xs">{explanation.summary}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-xs">
                <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Reasoning</p>
                  <p className="mt-1">{explanation.reasoning}</p>
                </div>
                {([
                  ['History', explanation.history],
                  ['Supporting evidence', explanation.supporting],
                  ['Counter evidence', explanation.counter],
                  ['Future research', explanation.futureResearch],
                  ['Governance impact', explanation.governanceImpact],
                  ['Dependencies', explanation.dependencies],
                ] as [string, string[]][]).map(([label, items]) => (
                  <div key={label} className="rounded-md border border-border/50 bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <ul className="mt-1 space-y-1">
                      {(items.length ? items : ['None recorded']).map((i) => <li key={i}>• {i}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
