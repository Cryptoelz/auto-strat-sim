import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
  EXEC_CARDS, DEPARTMENTS, BOARD_CONSENSUS, INTELLIGENCE_BUS, PROPOSALS,
  LIVE_FEED, INSTITUTIONAL_MEMORY, EXECUTIVE_CALENDAR, AGREEMENT_MAP,
  EXECUTIVE_RECOMMENDATION, REPORTS, GOVERNANCE_GUARANTEES, searchAtlas,
  type Proposal, type AtlasExplain, type AgreementEdge, type ReportSpec,
} from '@/lib/atlas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Globe2, ArrowRight, Users, Radio, Library, CalendarDays, Network, Sparkles,
  Search, FileDown, Lock, CheckCircle2, XCircle, MinusCircle, Activity, Gavel, Building2,
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

function ExplainBlock({ e }: { e: AtlasExplain }) {
  const rows: { label: string; items: string[] }[] = [
    { label: 'Supporting evidence', items: e.evidence },
    { label: 'Counter evidence', items: e.counterEvidence },
    { label: 'Weaknesses', items: e.weaknesses },
    { label: 'Required validation', items: e.requiredValidation },
    { label: 'Departments supporting', items: e.supporting },
    { label: 'Departments opposing', items: e.opposing.length ? e.opposing : ['None'] },
  ];
  return (
    <div className="space-y-3 text-xs">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Why</p>
        <p className="mt-1 text-foreground/90">{e.why}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="rounded-md border border-border/50 bg-muted/20 p-2.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{r.label}</p>
            <ul className="mt-1 space-y-1">
              {(r.items.length ? r.items : ['None recorded']).map((i) => (
                <li key={i} className="flex gap-1.5 text-foreground/80"><span className={GOLD}>·</span>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-border/50 bg-muted/20 p-2.5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Historical comparison</p>
        <p className="mt-1 text-foreground/80">{e.historicalComparison}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence</span>
        <Progress value={e.confidence} className="h-1.5 w-40" />
        <span className={`font-mono ${GOLD}`}>{e.confidence}%</span>
      </div>
    </div>
  );
}

function voteIcon(v: string) {
  if (v === 'Supported') return <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit" />;
  if (v === 'Rejected') return <XCircle className="h-3.5 w-3.5 text-trading-loss" />;
  return <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />;
}

function levelClass(level: AgreementEdge['level']) {
  if (level === 'Green') return 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit';
  if (level === 'Amber') return 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning';
  return 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss';
}

function exportReport(spec: ReportSpec) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const M = 54;
  let y = M;
  doc.setFontSize(20); doc.text('ATLAS\u2122', M, y); y += 18;
  doc.setFontSize(10); doc.text('Institutional AI Research Operating System \u2014 Powered by CryptoTrader\u2122', M, y); y += 26;
  doc.setFontSize(15); doc.text(spec.name, M, y); y += 16;
  doc.setFontSize(9); doc.text(`Cadence: ${spec.cadence}`, M, y); y += 14;
  doc.text(doc.splitTextToSize(spec.description, 500), M, y); y += 26;

  doc.setFontSize(12); doc.text('Executive Recommendation', M, y); y += 14;
  doc.setFontSize(9);
  doc.text(doc.splitTextToSize(EXECUTIVE_RECOMMENDATION.title, 500), M, y); y += 14;
  doc.text(doc.splitTextToSize(EXECUTIVE_RECOMMENDATION.reason, 500), M, y); y += 34;

  doc.setFontSize(12); doc.text('Sections', M, y); y += 14;
  doc.setFontSize(9);
  spec.sections.forEach((s) => { doc.text(`\u2022 ${s}`, M, y); y += 12; });
  y += 14;

  doc.setFontSize(12); doc.text('Department Status', M, y); y += 14;
  doc.setFontSize(9);
  DEPARTMENTS.forEach((d) => {
    if (y > 700) { doc.addPage(); y = M; }
    doc.text(`${d.name} \u2014 ${d.status} | Health ${d.health} | Confidence ${d.confidence}%`, M, y); y += 12;
    doc.text(doc.splitTextToSize(`Recommendation: ${d.recommendation}`, 480), M + 12, y); y += 16;
  });

  if (y > 620) { doc.addPage(); y = M; }
  y += 10;
  doc.setFontSize(12); doc.text('Governance Attestations', M, y); y += 14;
  doc.setFontSize(9);
  GOVERNANCE_GUARANTEES.forEach((g) => { doc.text(`\u2713 ${g}`, M, y); y += 12; });
  y += 10;
  doc.text('Advisory output only. No exchange connectivity. No live trading. Human approval required.', M, y);
  doc.save(`ATLAS-${spec.id}-report.pdf`);
}

export default function Atlas() {
  const [query, setQuery] = useState('');
  const [openProposal, setOpenProposal] = useState<Proposal | null>(null);
  const [openEdge, setOpenEdge] = useState<AgreementEdge | null>(null);
  const results = useMemo(() => searchAtlas(query), [query]);

  return (
    <div className="container mx-auto space-y-10 p-4 sm:p-6">
      {/* Header */}
      <header className="rounded-xl border border-trading-gold/30 bg-gradient-to-br from-trading-gold/10 via-background to-primary/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-trading-gold/40 bg-trading-gold/10">
              <Globe2 className={`h-6 w-6 ${GOLD}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ATLAS™</h1>
              <p className="text-sm text-muted-foreground">Institutional AI Research Operating System</p>
              <p className="text-xs text-muted-foreground">Powered by CryptoTrader™</p>
              <p className={`mt-2 text-xs font-medium tracking-wide ${GOLD}`}>One Brain • Every Department • One Decision</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['Observation Only', 'Research Only', 'Simulation Only'].map((t) => (
              <Badge key={t} variant="outline" className="border-trading-gold/30 bg-trading-gold/5 text-[10px] text-trading-gold">{t}</Badge>
            ))}
          </div>
        </div>
      </header>

      {/* 1 Executive Command Centre */}
      <section className="space-y-4">
        <SectionHeader n={1} icon={Building2} title="Executive Command Centre" subtitle="Every card links to the module that generated the information." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXEC_CARDS.map((c) => (
            <Link key={c.key} to={c.to}>
              <Card className="h-full border-border/50 bg-card/50 backdrop-blur transition-colors hover:border-trading-gold/40">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.label}</p>
                  <p className={`mt-1 text-xl font-bold ${c.tone === 'positive' ? 'text-trading-profit' : c.tone === 'caution' ? 'text-trading-warning' : 'text-foreground'}`}>{c.value}</p>
                  <p className="text-[11px] text-muted-foreground">{c.delta}</p>
                  <p className="mt-2 text-[11px] text-foreground/70">{c.detail}</p>
                  <p className={`mt-2 flex items-center gap-1 text-[10px] ${GOLD}`}>{c.source}<ArrowRight className="h-3 w-3" /></p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 2 Morning Meeting */}
      <section className="space-y-4">
        <SectionHeader n={2} icon={Users} title="Executive Morning Meeting" subtitle="Every simulated research day, all eight AI departments report and one board consensus is formed." />
        <Card className="border-trading-gold/30 bg-trading-gold/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Executive Board Consensus</CardTitle>
            <CardDescription className="text-xs">{BOARD_CONSENSUS.statement}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Progress value={BOARD_CONSENSUS.agreement} className="h-2 w-48" />
              <span className={`font-mono ${GOLD}`}>{BOARD_CONSENSUS.agreement}% agreement</span>
              <Badge variant="outline" className="text-[10px]">{BOARD_CONSENSUS.supported.length} supported</Badge>
              <Badge variant="outline" className="text-[10px]">{BOARD_CONSENSUS.rejected.length} rejected</Badge>
              <Badge variant="outline" className="text-[10px]">{BOARD_CONSENSUS.abstained.length} abstained</Badge>
            </div>
            <p className="text-muted-foreground">{BOARD_CONSENSUS.rationale}</p>
          </CardContent>
        </Card>
        <Accordion type="single" collapsible className="rounded-lg border border-border/50">
          {DEPARTMENTS.map((d) => (
            <AccordionItem key={d.id} value={d.id} className="px-3">
              <AccordionTrigger className="text-sm hover:no-underline">
                <span className="flex flex-1 items-center justify-between gap-3 pr-3">
                  <span>{d.name}</span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                    <span className={`font-mono text-xs ${GOLD}`}>{d.confidence}%</span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-xs">
                <p><span className="text-muted-foreground">Overnight summary: </span>{d.overnight}</p>
                <p><span className="text-muted-foreground">Biggest opportunity: </span>{d.opportunity}</p>
                <p><span className="text-muted-foreground">Biggest risk: </span>{d.risk}</p>
                <div className="rounded-md border border-border/50 bg-muted/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Evidence</p>
                  <ul className="mt-1 space-y-1">{d.evidence.map((e) => <li key={e} className="flex gap-1.5"><span className={GOLD}>·</span>{e}</li>)}</ul>
                </div>
                <p><span className="text-muted-foreground">Recommended investigation: </span>{d.recommendedInvestigation}</p>
                <Link to={d.to} className={`inline-flex items-center gap-1 text-[11px] ${GOLD}`}>Open {d.name}<ArrowRight className="h-3 w-3" /></Link>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* 3 Intelligence Bus */}
      <section className="space-y-4">
        <SectionHeader n={3} icon={Network} title="Intelligence Bus" subtitle="The complete, traceable reasoning path behind today's recommendation." />
        <div className="space-y-2">
          {INTELLIGENCE_BUS.map((s, i) => (
            <div key={s.dept} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-trading-gold/40 bg-trading-gold/10 text-[11px] font-mono text-trading-gold">{i + 1}</div>
                {i < INTELLIGENCE_BUS.length - 1 && <div className="h-8 w-px bg-trading-gold/30" />}
              </div>
              <Card className="flex-1 border-border/50 bg-card/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <Link to={s.to} className="text-sm font-medium hover:underline">{s.dept}</Link>
                    <p className="text-xs text-muted-foreground">{s.output}</p>
                  </div>
                  <span className={`font-mono text-xs ${GOLD}`}>{s.confidence}%</span>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Department status */}
      <section className="space-y-4">
        <SectionHeader n={4} icon={Activity} title="Department Status" subtitle="Live health, confidence, current investigation and recommendation per department." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <Card key={d.id} className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">{d.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><span className="w-20 text-muted-foreground">Health</span><Progress value={d.health} className="h-1.5 flex-1" /><span className="font-mono">{d.health}</span></div>
                <div className="flex items-center gap-2"><span className="w-20 text-muted-foreground">Confidence</span><Progress value={d.confidence} className="h-1.5 flex-1" /><span className="font-mono">{d.confidence}%</span></div>
                <p><span className="text-muted-foreground">Investigating: </span>{d.investigation}</p>
                <p><span className="text-muted-foreground">Recommends: </span>{d.recommendation}</p>
                <p className="text-muted-foreground">Last update {d.lastUpdate}</p>
                <Link to={d.to} className={`inline-flex items-center gap-1 text-[11px] ${GOLD}`}>Open module<ArrowRight className="h-3 w-3" /></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 5 Consensus engine */}
      <section className="space-y-4">
        <SectionHeader n={5} icon={Gavel} title="Executive Consensus Engine" subtitle="Select any vote to open reasoning, evidence, counter evidence, weaknesses and required validation." />
        <div className="grid gap-3 lg:grid-cols-2">
          {PROPOSALS.map((p) => (
            <Card key={p.id} className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{p.title}</CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px]">{p.id}</Badge>
                </div>
                <CardDescription className="text-xs">{p.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Progress value={p.consensus} className="h-2 flex-1" />
                  <span className={`font-mono ${GOLD}`}>{p.consensus}% consensus</span>
                </div>
                <div className="space-y-1">
                  {p.votes.map((v) => (
                    <button key={v.dept} onClick={() => setOpenProposal(p)} className="flex w-full items-start gap-2 rounded-md border border-border/40 bg-muted/20 p-2 text-left transition-colors hover:border-trading-gold/40">
                      {voteIcon(v.vote)}
                      <span className="flex-1">
                        <span className="font-medium">{v.dept}</span>
                        <span className="text-muted-foreground"> — {v.vote}</span>
                        <span className="block text-muted-foreground">{v.note}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 6 Live feed */}
      <section className="space-y-4">
        <SectionHeader n={6} icon={Radio} title="Live Intelligence Feed" subtitle="Institutional activity across every department — simulation only." />
        <Card className="border-border/50 bg-card/50">
          <CardContent className="divide-y divide-border/40 p-0">
            {LIVE_FEED.map((f, i) => (
              <Link key={i} to={f.to} className="flex items-start gap-3 p-3 transition-colors hover:bg-muted/30">
                <span className="font-mono text-[11px] text-muted-foreground">{f.time}</span>
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${f.tone === 'positive' ? 'bg-trading-profit' : f.tone === 'caution' ? 'bg-trading-warning' : 'bg-primary'}`} />
                <span className="flex-1 text-xs">
                  <span className="font-medium">{f.dept}</span>
                  <span className="block text-muted-foreground">{f.text}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* 7 Institutional memory */}
      <section className="space-y-4">
        <SectionHeader n={7} icon={Library} title="Institutional Memory" subtitle="Durable knowledge — discoveries, rejected ideas, breakthroughs, decisions and lessons." />
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTITUTIONAL_MEMORY.map((m) => (
            <Link key={m.title} to={m.to}>
              <Card className="h-full border-border/50 bg-card/50 transition-colors hover:border-trading-gold/40">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="border-trading-gold/30 text-[10px] text-trading-gold">{m.kind}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{m.date}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* 8 Calendar */}
      <section className="space-y-4">
        <SectionHeader n={8} icon={CalendarDays} title="Executive Calendar" subtitle="Every module calendar merged into one institutional schedule." />
        <Card className="border-border/50 bg-card/50">
          <CardContent className="divide-y divide-border/40 p-0">
            {EXECUTIVE_CALENDAR.map((c, i) => (
              <Link key={i} to={c.to} className="flex flex-wrap items-center gap-3 p-3 transition-colors hover:bg-muted/30">
                <span className="w-20 font-mono text-[11px] text-muted-foreground">{c.day}</span>
                <span className="flex-1 text-xs font-medium">{c.label}</span>
                <span className="text-[11px] text-muted-foreground">{c.source}</span>
                <Badge variant="outline" className="text-[10px]">{c.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* 9 Agreement map */}
      <section className="space-y-4">
        <SectionHeader n={9} icon={Network} title="Cross-Department Agreement Map" subtitle="Green agreement, amber tension, red disagreement. Select an edge for evidence." />
        <div className="space-y-2">
          {AGREEMENT_MAP.map((e, i) => (
            <button key={i} onClick={() => setOpenEdge(e)} className="w-full rounded-lg border border-border/50 bg-card/50 p-3 text-left transition-colors hover:border-trading-gold/40">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-medium">{e.from}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{e.to}</span>
                <Badge variant="outline" className={`ml-auto text-[10px] ${levelClass(e.level)}`}>{e.level}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{e.topic}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 10 Executive recommendation */}
      <section className="space-y-4">
        <SectionHeader n={10} icon={Sparkles} title="Executive Recommendation" subtitle="If ATLAS™ could recommend one investigation today..." />
        <Card className="border-trading-gold/40 bg-gradient-to-br from-trading-gold/10 to-background">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{EXECUTIVE_RECOMMENDATION.title}</CardTitle>
            <CardDescription className="text-xs">{EXECUTIVE_RECOMMENDATION.reason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p><span className="text-muted-foreground">Expected research gain: </span>{EXECUTIVE_RECOMMENDATION.expectedGain}</p>
            <div className="flex flex-wrap gap-1.5">
              {EXECUTIVE_RECOMMENDATION.sourceDepartments.map((d) => (
                <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
              ))}
            </div>
            <Badge variant="outline" className="border-trading-warning/40 bg-trading-warning/10 text-[10px] text-trading-warning">
              <Lock className="mr-1 h-3 w-3" />Human approval required — advisory only
            </Badge>
            <Separator />
            <ExplainBlock e={EXECUTIVE_RECOMMENDATION.explain} />
          </CardContent>
        </Card>
      </section>

      {/* 11 Search */}
      <section className="space-y-4">
        <SectionHeader n={11} icon={Search} title="Executive Search" subtitle="One search across strategies, specialists, hypotheses, papers, validation, promotion, governance, knowledge graph, memory and reports." />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the entire research organisation..." className="max-w-xl" />
        {query && (
          <div className="space-y-1">
            {results.length === 0 && <p className="text-xs text-muted-foreground">No institutional records matched “{query}”.</p>}
            {results.map((r) => (
              <Link key={r.title} to={r.to} className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-card/50 p-2.5 text-xs transition-colors hover:border-trading-gold/40">
                <span className="font-medium">{r.title}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{r.category}</Badge>
                  <ArrowRight className={`h-3 w-3 ${GOLD}`} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 12 Reports */}
      <section className="space-y-4">
        <SectionHeader n={12} icon={FileDown} title="Institutional Reports" subtitle="Executive reporting suite with PDF export." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {REPORTS.map((r) => (
            <Card key={r.id} className="flex flex-col border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{r.name}</CardTitle>
                <CardDescription className="text-[11px]">{r.cadence}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-3 text-xs">
                <p className="text-muted-foreground">{r.description}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => exportReport(r)}>
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />Export PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 13 Governance */}
      <section className="space-y-4">
        <SectionHeader n={13} icon={Lock} title="Governance Guarantees" subtitle="Hard-coded and non-negotiable across ATLAS™." />
        <Card className="border-trading-gold/30 bg-trading-gold/5">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {GOVERNANCE_GUARANTEES.map((g) => (
              <div key={g} className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit" />{g}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Dialogs */}
      <Dialog open={!!openProposal} onOpenChange={(o) => !o && setOpenProposal(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{openProposal?.title}</DialogTitle>
            <DialogDescription className="text-xs">{openProposal?.summary}</DialogDescription>
          </DialogHeader>
          {openProposal && <ExplainBlock e={openProposal.explain} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openEdge} onOpenChange={(o) => !o && setOpenEdge(null)}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{openEdge?.from} ↔ {openEdge?.to}</DialogTitle>
            <DialogDescription className="text-xs">{openEdge?.topic}</DialogDescription>
          </DialogHeader>
          {openEdge && (
            <div className="space-y-3 text-xs">
              {([['Supporting evidence', openEdge.supporting], ['Counter evidence', openEdge.counter], ['Validation required', openEdge.validation]] as const).map(([label, items]) => (
                <div key={label} className="rounded-md border border-border/50 bg-muted/20 p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                  <ul className="mt-1 space-y-1">
                    {(items.length ? items : ['None recorded']).map((i) => <li key={i} className="flex gap-1.5"><span className={GOLD}>·</span>{i}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
