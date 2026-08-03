import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import {
  boardroomKpis, executiveBrief, boardVotes, healthMonitor, knowledgePulse,
  INSTITUTIONAL_BADGES, LAYER_VERSION, type Light,
} from '@/lib/institutional';
import { NODE_BY_ID } from '@/lib/knowledgeGraph';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Landmark, Lock, FileDown, ChevronDown, Sparkles, Compass, Share2, AlertTriangle,
  Lightbulb, Target, Gauge, ArrowRight,
} from 'lucide-react';

const LIGHT_CLASS: Record<Light, string> = {
  green: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit',
  amber: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
  red: 'border-destructive/40 bg-destructive/10 text-destructive',
};

function Glass({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Card className={`border-border/50 bg-card/40 shadow-lg backdrop-blur transition-colors hover:border-trading-gold/25 ${className}`}>{children}</Card>;
}

export default function ExecutiveBoardroomPage() {
  const navigate = useNavigate();
  const kpis = useMemo(() => boardroomKpis(), []);
  const brief = useMemo(() => executiveBrief(), []);
  const votes = useMemo(() => boardVotes(), []);
  const health = useMemo(() => healthMonitor(), []);
  const pulse = useMemo(() => knowledgePulse(), []);
  const [openVote, setOpenVote] = useState<string | null>(votes[0]?.department ?? null);

  const exportPdf = (kind: string) => {
    const doc = new jsPDF();
    let y = 16;
    const line = (t: string, size = 9) => {
      doc.setFontSize(size);
      for (const w of doc.splitTextToSize(t, 180) as string[]) {
        if (y > 280) { doc.addPage(); y = 16; }
        doc.text(w, 14, y); y += size * 0.5 + 1.4;
      }
    };
    doc.setFontSize(15); doc.text(`ATLAS™ Executive Boardroom — ${kind}`, 14, y); y += 8;
    line(`${LAYER_VERSION} · ${brief.date} (institutional day ${brief.day})`, 8);
    line('OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY / READ ONLY / HUMAN APPROVAL REQUIRED', 8);
    y += 3;
    line('Institutional KPIs', 12);
    kpis.forEach((k) => line(`• ${k.label}: ${k.value}${k.unit} — ${k.detail}`));
    y += 3;
    line("Today's Executive Brief", 12);
    line(brief.summary);
    line(`• Highest priority investigation: ${brief.priorityInvestigation.id} · ${brief.priorityInvestigation.title} — ${brief.priorityInvestigation.why}`);
    line(`• Highest risk: ${brief.highestRisk.id} · ${brief.highestRisk.title} — ${brief.highestRisk.why}`);
    line(`• Largest discovery: ${brief.largestDiscovery.id} · ${brief.largestDiscovery.title} — ${brief.largestDiscovery.why}`);
    line(`• Research bottleneck: ${brief.bottleneck.id} · ${brief.bottleneck.title} — ${brief.bottleneck.why}`);
    line(`• Recommended action: ${brief.recommendedAction}`);
    line(`• Expected research gain: ${brief.expectedGain} · Confidence ${brief.confidence}%`);
    line(`• Supporting departments: ${brief.departments.join(', ')}`);
    y += 3;
    line('Board Decisions', 12);
    votes.forEach((v) => line(`• ${v.department} — ${v.vote.toUpperCase()} (${v.confidence}%): ${v.position}`));
    y += 3;
    line('Institution Health', 12);
    health.forEach((h) => line(`• ${h.label}: ${h.score} (${h.light}) — ${h.diagnostics[0]}`));
    y += 3;
    line('Knowledge Pulse', 12);
    pulse.forEach((p) => line(`• ${p.label}: ${p.value} total · +${p.today} today · +${p.week} week · +${p.month} month`));
    y += 3;
    line('Governance', 12);
    line(INSTITUTIONAL_BADGES.join(' · '));
    doc.save(`atlas-boardroom-${kind.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success(`${kind} exported`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <header className="relative overflow-hidden rounded-2xl border border-trading-gold/25 bg-gradient-to-br from-background via-card/60 to-background p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-trading-gold/10 blur-3xl" />
        <div className="relative space-y-3">
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] tracking-widest text-trading-gold">
            PHASE 5 · INSTITUTIONAL INTELLIGENCE LAYER
          </Badge>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            <Landmark className="h-7 w-7 text-trading-gold" /> Executive Boardroom™
          </h1>
          <p className="text-sm font-medium text-trading-gold">Strategic Intelligence Centre</p>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Daily executive intelligence for institutional leadership, generated entirely from the Institutional
            Knowledge Graph. Every figure is simulated, advisory and requires human approval.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {INSTITUTIONAL_BADGES.map((b) => (
              <Badge key={b} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                <Lock className="mr-1 h-2.5 w-2.5" />{b}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Institutional KPIs</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {kpis.map((k) => (
            <Glass key={k.key} className="animate-fade-in">
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</p>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${k.light === 'green' ? 'bg-trading-profit' : k.light === 'amber' ? 'bg-trading-warning' : 'bg-destructive'}`} />
                </div>
                <p className="font-mono text-2xl font-semibold">{k.value}{k.unit}</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, k.value)}%` }} />
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">{k.detail}</p>
              </CardContent>
            </Glass>
          ))}
        </div>
      </section>

      {/* Brief */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Today's Executive Brief</h2>
        <Glass className="border-trading-gold/25">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{brief.date} · Institutional day {brief.day}</CardTitle>
            <CardDescription className="text-[11px]">Regenerated every simulated day from recorded institutional evidence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <p className="text-sm leading-relaxed text-foreground/90">{brief.summary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { icon: Target, label: 'Highest Priority Investigation', item: brief.priorityInvestigation },
                { icon: AlertTriangle, label: 'Highest Risk', item: brief.highestRisk },
                { icon: Lightbulb, label: 'Largest Discovery', item: brief.largestDiscovery },
                { icon: Gauge, label: 'Research Bottleneck', item: brief.bottleneck },
              ].map(({ icon: Icon, label, item }) => (
                <button key={label} onClick={() => navigate(`/explorer/${item.id}`)}
                  className="group rounded-lg border border-border/50 bg-muted/15 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-trading-gold/40">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Icon className="h-3 w-3" /> {label}
                  </p>
                  <p className="mt-1 text-xs font-semibold transition-colors group-hover:text-trading-gold">{item.id} · {item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{item.why}</p>
                </button>
              ))}
            </div>
            <Separator className="bg-border/50" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Recommended Action</p><p className="text-xs">{brief.recommendedAction}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Expected Research Gain</p><p className="text-xs">{brief.expectedGain}</p></div>
              <div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Confidence · Departments</p><p className="text-xs">{brief.confidence}% · {brief.departments.join(', ')}</p></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => navigate('/oracle')}><Sparkles className="h-3 w-3" /> Open Oracle</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => navigate(`/explorer/${brief.priorityInvestigation.id}`)}><Compass className="h-3 w-3" /> Open Explorer</Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => navigate('/knowledge-graph')}><Share2 className="h-3 w-3" /> Open Knowledge Graph</Button>
              <Button size="sm" className="h-7 gap-1.5 text-[11px]" onClick={() => exportPdf('Board Report')}><FileDown className="h-3 w-3" /> Export Board Report</Button>
            </div>
          </CardContent>
        </Glass>
      </section>

      {/* Board decisions */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Board Decisions</h2>
        <p className="text-xs text-muted-foreground">Advisory department votes derived from each department's recorded evidence. Expand any vote for its rationale.</p>
        <div className="grid gap-2.5 md:grid-cols-2">
          {votes.map((v) => (
            <Collapsible key={v.department} open={openVote === v.department} onOpenChange={(o) => setOpenVote(o ? v.department : null)}>
              <Glass className={openVote === v.department ? 'border-trading-gold/40' : ''}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="text-left">
                      <p className="text-xs font-semibold">{v.department}</p>
                      <p className="text-[10px] text-muted-foreground">{v.evidenceIds.length} evidence objects · {v.confidence}% confidence</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${LIGHT_CLASS[v.vote]}`}>{v.vote.toUpperCase()}</Badge>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openVote === v.department ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-2 px-4 pb-4 pt-0">
                    <p className="text-[11px] font-medium">{v.position}</p>
                    {v.rationale.map((r, i) => (
                      <p key={i} className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5 text-[11px] text-muted-foreground">{r}</p>
                    ))}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {v.evidenceIds.map((id) => (
                        <button key={id} onClick={() => navigate(`/explorer/${id}`)}
                          className="rounded-full border border-border/50 bg-muted/20 px-2 py-0.5 text-[10px] transition-colors hover:border-trading-gold/40 hover:text-trading-gold">
                          {id} · {NODE_BY_ID[id]?.title}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Glass>
            </Collapsible>
          ))}
        </div>
      </section>

      {/* Exports */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Executive Exports</h2>
        <div className="flex flex-wrap gap-1.5">
          {['Executive Brief', 'Board Pack', 'Institution Summary', 'Knowledge Graph', 'Relationship Report', 'Oracle Report', 'Audit Pack', 'Timeline Replay', 'Research Book'].map((k) => (
            <Button key={k} size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => exportPdf(k)}>
              <FileDown className="h-3 w-3" /> {k} PDF
            </Button>
          ))}
        </div>
      </section>

      <Glass className="border-primary/25">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4 text-primary" /> Governance</CardTitle>
          <CardDescription className="text-[11px]">{LAYER_VERSION}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1.5 pb-5">
          {INSTITUTIONAL_BADGES.map((g) => (
            <Badge key={g} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">{g}</Badge>
          ))}
          <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px]" onClick={() => navigate('/digital-twin')}>
            Open Institutional Digital Twin™ <ArrowRight className="h-3 w-3" />
          </Button>
        </CardContent>
      </Glass>
    </div>
  );
}
