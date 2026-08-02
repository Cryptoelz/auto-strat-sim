import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  buildDailyBrief, NARRATIVES, DISCOVERIES, OPPORTUNITIES, OPP_LABEL, RISK_STORIES,
  COMPANION_MESSAGES, TIMELINE, TIMELINE_LABEL, PRIORITY_QUEUE, ALERTS, INVESTIGATIONS,
  PENDING_DECISIONS, CALENDAR, GRAPH_NODES, GRAPH_EDGES, LEARNING_STATS, LEARNING_CURVE,
  INSTITUTIONAL_READINESS, PLATFORM_IDENTITY, GOVERNANCE_GUARANTEES, buildAuditBundle,
  type Explainability, type Discovery,
} from '@/lib/intelligenceNetwork';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Network, Sunrise, BookOpen, Share2, Compass, ShieldAlert, Bot, History, LayoutDashboard,
  Lightbulb, GraduationCap, Building2, Lock, Download, FileText, ArrowRight, AlertTriangle,
  CheckCircle2, CircleDot, TrendingUp, Gauge,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const toneRing: Record<string, string> = {
  positive: 'border-trading-profit/40 bg-trading-profit/5',
  neutral: 'border-border bg-card/40',
  info: 'border-primary/30 bg-primary/5',
  caution: 'border-trading-warning/40 bg-trading-warning/5',
  critical: 'border-destructive/40 bg-destructive/10',
};

function ConfidenceBadge({ value }: { value: number }) {
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      confidence {value}%
    </Badge>
  );
}

function ExplainBlock({ e }: { e: Explainability }) {
  const rows: [string, string | string[]][] = [
    ['Reasoning', e.reasoning],
    ['Evidence', e.evidence],
    ['Alternative explanations', e.alternatives],
    ['Known weaknesses', e.weaknesses],
    ['Required validation', e.requiredValidation],
    ['Historical comparison', e.historicalComparison],
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs text-muted-foreground">Confidence</span>
        <Progress value={e.confidence} className="h-1.5 flex-1" />
        <span className="font-mono text-xs">{e.confidence}%</span>
      </div>
      {rows.map(([label, body]) => (
        <div key={label}>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
          {Array.isArray(body) ? (
            <ul className="mt-1 space-y-0.5 text-xs">
              {body.map((b, i) => <li key={i}>• {b}</li>)}
            </ul>
          ) : (
            <p className="mt-1 text-xs">{body}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function LinkChips({ links }: { links: { label: string; url: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map(l => (
        <Link key={l.url + l.label} to={l.url}>
          <Badge variant="outline" className="cursor-pointer text-[10px] hover:bg-accent">
            {l.label} <ArrowRight className="ml-1 h-2.5 w-2.5" />
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export default function IntelligenceNetwork() {
  const brief = useMemo(() => buildDailyBrief(), []);
  const [activeDiscovery, setActiveDiscovery] = useState<Discovery | null>(null);
  const [graphFocus, setGraphFocus] = useState<string | null>(null);

  const focusEdges = graphFocus
    ? GRAPH_EDGES.filter(e => e.from === graphFocus || e.to === graphFocus)
    : GRAPH_EDGES;

  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 18;
    const line = (text: string, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      for (const t of doc.splitTextToSize(text, 175)) {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.text(t, 18, y);
        y += size * 0.55 + 2;
      }
    };
    line('CryptoTrader™ Intelligence Network — Daily Intelligence Brief', 15, true);
    line(`${brief.greeting} · ${brief.date}`, 10);
    y += 3;
    brief.blocks.forEach(b => {
      line(`${b.heading}${b.metric ? ` — ${b.metric}` : ''}`, 11, true);
      line(b.body, 9);
      y += 1;
    });
    line("Today's Recommended Investigations", 12, true);
    brief.investigations.forEach(i => line(`• ${i.title} — ${i.why}`, 9));
    y += 2;
    line('Risk Stories', 12, true);
    RISK_STORIES.forEach(r => {
      line(`${r.title} (confidence ${r.confidence}%)`, 10, true);
      r.paragraphs.forEach(p => line(p, 9));
      line(`Expected resolution: ${r.expectedResolution}`, 9);
    });
    y += 2;
    line('Governance', 12, true);
    GOVERNANCE_GUARANTEES.forEach(g => line(`• ${g}`, 9));
    doc.save('intelligence-network-brief.pdf');
  };

  const exportAudit = () => {
    const blob = new Blob([JSON.stringify(buildAuditBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'intelligence-network-audit.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Identity — Section 12 */}
      <header className="rounded-lg border bg-gradient-to-br from-primary/10 via-card to-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">CryptoTrader Intelligence Network™</h1>
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">V2</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{PLATFORM_IDENTITY.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORM_IDENTITY.mission.map(m => (
                <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
              ))}
            </div>
            <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
              {PLATFORM_IDENTITY.promises.map(p => <li key={p}>• {p}</li>)}
            </ul>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportPdf}><FileText className="mr-1.5 h-3.5 w-3.5" />PDF Brief</Button>
              <Button size="sm" variant="outline" onClick={exportAudit}><Download className="mr-1.5 h-3.5 w-3.5" />Audit Export</Button>
            </div>
            <Badge variant="outline" className="border-trading-warning/40 bg-trading-warning/10 text-[10px] text-trading-warning">
              <Lock className="mr-1 h-3 w-3" /> OBSERVATION · RESEARCH · SIMULATION ONLY
            </Badge>
          </div>
        </div>
      </header>

      <Tabs defaultValue="workspace" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="w-max">
            <TabsTrigger value="workspace"><LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />Workspace</TabsTrigger>
            <TabsTrigger value="brief"><Sunrise className="mr-1.5 h-3.5 w-3.5" />Daily Brief</TabsTrigger>
            <TabsTrigger value="narrative"><BookOpen className="mr-1.5 h-3.5 w-3.5" />Narratives</TabsTrigger>
            <TabsTrigger value="cross"><Share2 className="mr-1.5 h-3.5 w-3.5" />Cross-Module</TabsTrigger>
            <TabsTrigger value="opportunity"><Compass className="mr-1.5 h-3.5 w-3.5" />Opportunities</TabsTrigger>
            <TabsTrigger value="risk"><ShieldAlert className="mr-1.5 h-3.5 w-3.5" />Risk Stories</TabsTrigger>
            <TabsTrigger value="companion"><Bot className="mr-1.5 h-3.5 w-3.5" />Companion</TabsTrigger>
            <TabsTrigger value="timeline"><History className="mr-1.5 h-3.5 w-3.5" />Timeline</TabsTrigger>
            <TabsTrigger value="learning"><GraduationCap className="mr-1.5 h-3.5 w-3.5" />Learning</TabsTrigger>
            <TabsTrigger value="institutional"><Building2 className="mr-1.5 h-3.5 w-3.5" />Institutional</TabsTrigger>
            <TabsTrigger value="governance"><Lock className="mr-1.5 h-3.5 w-3.5" />Governance</TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* ---------------- Section 8 — Executive Workspace ---------------- */}
        <TabsContent value="workspace" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Morning Brief</CardTitle>
                <CardDescription>{brief.greeting} · {brief.date}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-2">
                {brief.blocks.slice(0, 6).map(b => (
                  <div key={b.key} className={`rounded-md border p-3 ${toneRing[b.tone]}`}>
                    <div className="text-xs font-semibold">{b.heading}</div>
                    {b.metric && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{b.metric}</div>}
                    <p className="mt-1 text-xs text-muted-foreground">{b.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Alerts</CardTitle>
                <CardDescription>Advisory only</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ALERTS.map(a => (
                  <div key={a.id} className={`rounded-md border p-2.5 ${toneRing[a.severity]}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <div>
                        <div className="text-xs font-medium">{a.title}</div>
                        <div className="text-[11px] text-muted-foreground">{a.detail}</div>
                        <LinkChips links={[a.link]} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Priority Queue</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {PRIORITY_QUEUE.map(p => (
                  <div key={p.id} className="rounded-md border bg-card/40 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">#{p.rank}</Badge>
                        <span className="text-sm font-medium">{p.title}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{p.effort}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.reason}</p>
                    <div className="mt-2"><LinkChips links={[p.link]} /></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Open Investigations</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {INVESTIGATIONS.map(i => (
                    <div key={i.id} className="rounded-md border bg-card/40 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{i.title}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">{i.status.replace('_', ' ')}</Badge>
                      </div>
                      <Progress value={i.progress} className="my-2 h-1.5" />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">{i.owner}</span>
                        <LinkChips links={[i.link]} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Pending Executive Decisions</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {PENDING_DECISIONS.map(d => (
                    <div key={d.id} className="rounded-md border bg-card/40 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{d.title}</span>
                        <ConfidenceBadge value={d.confidence} />
                      </div>
                      <p className="mt-1 text-xs">{d.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground"><span className="font-semibold">Advisory:</span> {d.recommendation}</p>
                      <div className="mt-2"><LinkChips links={[d.link]} /></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Knowledge Graph</CardTitle>
                <CardDescription>Click a node to filter its relationships.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {GRAPH_NODES.map(n => (
                    <Badge
                      key={n.id}
                      variant={graphFocus === n.id ? 'default' : 'outline'}
                      className="cursor-pointer text-[10px]"
                      onClick={() => setGraphFocus(graphFocus === n.id ? null : n.id)}
                    >
                      {n.label} <span className="ml-1 opacity-60">{n.group}</span>
                    </Badge>
                  ))}
                </div>
                <Separator />
                <ul className="space-y-1 text-xs">
                  {focusEdges.map((e, i) => {
                    const from = GRAPH_NODES.find(n => n.id === e.from)!;
                    const to = GRAPH_NODES.find(n => n.id === e.to)!;
                    return (
                      <li key={i} className="flex flex-wrap items-center gap-1.5">
                        <Link to={from.url} className="font-medium underline-offset-2 hover:underline">{from.label}</Link>
                        <span className="text-muted-foreground">— {e.label} →</span>
                        <Link to={to.url} className="font-medium underline-offset-2 hover:underline">{to.label}</Link>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Research Calendar</CardTitle></CardHeader>
              <CardContent className="space-y-1.5">
                {CALENDAR.map(c => (
                  <div key={c.day} className="flex items-center justify-between rounded-md border bg-card/40 px-3 py-2">
                    <div>
                      <div className="text-xs font-medium">{c.title}</div>
                      <div className="text-[10px] text-muted-foreground">{c.kind}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{c.day}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Research Feed · Latest Discoveries</CardTitle></CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {DISCOVERIES.map(d => (
                <button key={d.id} onClick={() => setActiveDiscovery(d)} className={`rounded-md border p-3 text-left transition hover:brightness-110 ${toneRing[d.severity]}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{d.id}</span>
                    <ConfidenceBadge value={d.confidence} />
                  </div>
                  <div className="mt-1 text-sm font-medium">{d.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{d.summary}</p>
                  <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{d.detected} · click to explain</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Section 1 — Daily Brief ---------------- */}
        <TabsContent value="brief" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{brief.greeting}</CardTitle>
              <CardDescription>{brief.date} · generated automatically each simulated morning</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {brief.blocks.map(b => (
                <div key={b.key} className={`rounded-md border p-3 ${toneRing[b.tone]}`}>
                  <div className="text-sm font-semibold">{b.heading}</div>
                  {b.metric && <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{b.metric}</div>}
                  <p className="mt-1.5 text-xs text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today's Recommended Investigations</CardTitle>
              <CardDescription>{brief.footer}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {brief.investigations.map(i => (
                <div key={i.id} className="rounded-md border bg-card/40 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">{i.id}</Badge>
                    <span className="text-sm font-medium">{i.title}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{i.why}</p>
                  <div className="mt-2"><LinkChips links={[i.link]} /></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Section 2 — Narratives ---------------- */}
        <TabsContent value="narrative" className="space-y-3">
          {NARRATIVES.map(n => (
            <Card key={n.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{n.headline}</CardTitle>
                  <ConfidenceBadge value={n.explain.confidence} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-dashed p-3">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Isolated signals</div>
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {n.fragments.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                  </div>
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-primary">Connected story</div>
                    <p className="mt-1 text-sm">{n.story}</p>
                  </div>
                </div>
                <Accordion type="single" collapsible>
                  <AccordionItem value="x" className="border-none">
                    <AccordionTrigger className="py-2 text-xs hover:no-underline">Evidence · reasoning · timeline · sources</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <ExplainBlock e={n.explain} />
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Timeline</div>
                        <ul className="mt-1 space-y-1 text-xs">
                          {n.timeline.map((t, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="w-24 shrink-0 font-mono text-[10px] text-muted-foreground">{t.at}</span>
                              <span>{t.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Supporting reports</div>
                        <div className="mt-1"><LinkChips links={n.reports} /></div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Related discoveries</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {n.related.map(r => {
                            const d = DISCOVERIES.find(x => x.id === r);
                            return d ? (
                              <Badge key={r} variant="outline" className="cursor-pointer text-[10px]" onClick={() => setActiveDiscovery(d)}>
                                {r} · {d.title}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---------------- Section 3 — Cross-Module ---------------- */}
        <TabsContent value="cross" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cross-Module Impact Maps</CardTitle>
              <CardDescription>Each discovery resolves to every module it touches. All links are clickable.</CardDescription>
            </CardHeader>
          </Card>
          <Accordion type="multiple" className="space-y-2">
            {DISCOVERIES.map(d => (
              <AccordionItem key={d.id} value={d.id} className={`rounded-md border px-3 ${toneRing[d.severity]}`}>
                <AccordionTrigger className="py-3 hover:no-underline">
                  <div className="flex flex-1 flex-wrap items-center gap-2 pr-3 text-left">
                    <Badge variant="outline" className="font-mono text-[10px]">{d.id}</Badge>
                    <span className="text-sm font-medium">{d.title}</span>
                    <ConfidenceBadge value={d.confidence} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-3">
                  <p className="text-xs text-muted-foreground">{d.summary}</p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {d.impacts.map(im => (
                      <div key={im.domain} className="rounded-md border bg-background/60 p-2.5">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{im.domain}</div>
                        <div className="mt-1"><LinkChips links={im.items} /></div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{im.note}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setActiveDiscovery(d)}>
                    <Lightbulb className="mr-1.5 h-3.5 w-3.5" /> Explain discovery
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </TabsContent>

        {/* ---------------- Section 4 — Opportunities ---------------- */}
        <TabsContent value="opportunity" className="grid gap-3 md:grid-cols-2">
          {OPPORTUNITIES.map(o => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">{OPP_LABEL[o.kind]}</Badge>
                  <ConfidenceBadge value={o.confidence} />
                </div>
                <CardTitle className="text-sm">{o.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="rounded-md border border-trading-profit/30 bg-trading-profit/5 p-2">
                  <span className="font-semibold">Expected benefit: </span>{o.benefit}
                </div>
                <div className="rounded-md border border-trading-warning/30 bg-trading-warning/5 p-2">
                  <span className="font-semibold">Expected risk: </span>{o.risk}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</div>
                  <ul className="mt-1 space-y-0.5">{o.evidence.map((e, i) => <li key={i} className="font-mono text-[11px]">• {e}</li>)}</ul>
                </div>
                <LinkChips links={[{ label: `Simulate in ${o.simulation.label}`, url: o.simulation.url }]} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---------------- Section 5 — Risk Stories ---------------- */}
        <TabsContent value="risk" className="space-y-3">
          {RISK_STORIES.map(r => (
            <Card key={r.id} className={toneRing[r.severity]}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <ConfidenceBadge value={r.confidence} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {r.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Origin</div>
                    <p className="mt-1 text-xs">{r.origin}</p>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected resolution</div>
                    <p className="mt-1 text-xs">{r.expectedResolution}</p>
                  </div>
                </div>
                <LinkChips links={r.links} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---------------- Section 6 — Companion ---------------- */}
        <TabsContent value="companion" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4" /> AI Research Companion</CardTitle>
              <CardDescription>The companion opens conversations on its own when it notices something. Advisory only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMPANION_MESSAGES.map(m => (
                <div key={m.id} className="flex gap-3">
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 rounded-lg rounded-tl-none border bg-card/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{m.opener}</span>
                      <ConfidenceBadge value={m.confidence} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{m.detail}</p>
                    <div className="mt-2"><LinkChips links={[m.link]} /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Section 7 — Timeline ---------------- */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive Timeline</CardTitle>
              <CardDescription>Every material event, chronologically, with source evidence.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-4 border-l pl-6">
                {TIMELINE.map(e => (
                  <div key={e.id} className="relative">
                    <CircleDot className="absolute -left-[31px] top-0.5 h-4 w-4 bg-background text-primary" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{e.when}</span>
                      <Badge variant="outline" className="text-[10px]">{TIMELINE_LABEL[e.kind]}</Badge>
                      <span className="text-sm font-medium">{e.title}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{e.detail}</p>
                    <div className="mt-1.5"><LinkChips links={e.evidence} /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Section 10 — Learning ---------------- */}
        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Continuous Learning</CardTitle>
              <CardDescription>The network scores itself. Learning improves advisory quality only — production is never altered.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {LEARNING_STATS.map(s => (
                <div key={s.key} className="rounded-md border bg-card/40 p-3">
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-0.5 text-2xl font-bold">{s.value}</div>
                  {s.pct !== undefined && <Progress value={s.pct} className="my-2 h-1.5" />}
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> Calibration over time</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={LEARNING_CURVE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="session" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis domain={[50, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Discovery accuracy" />
                  <Line type="monotone" dataKey="trust" stroke="hsl(var(--trading-profit))" strokeWidth={2} dot={false} name="Executive trust" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Section 11 — Institutional ---------------- */}
        <TabsContent value="institutional" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Institutional Readiness</CardTitle>
              <CardDescription>Preparedness of the research platform for institutional deployment.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 md:grid-cols-2">
              {INSTITUTIONAL_READINESS.map(r => (
                <div key={r.key} className={`rounded-md border p-3 ${r.status === 'ready' ? toneRing.positive : r.status === 'partial' ? toneRing.caution : toneRing.neutral}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{r.label}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Exports</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={exportPdf}><FileText className="mr-1.5 h-3.5 w-3.5" />Board PDF report</Button>
              <Button size="sm" variant="outline" onClick={exportAudit}><Download className="mr-1.5 h-3.5 w-3.5" />Compliance audit bundle (JSON)</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Sections 12/13 — Governance ---------------- */}
        <TabsContent value="governance" className="space-y-4">
          <Card className={toneRing.critical}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4" /> Governance Guarantees</CardTitle>
              <CardDescription>Hard-coded. The Intelligence Network has no execution surface of any kind.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {GOVERNANCE_GUARANTEES.map(g => (
                <div key={g} className="flex items-start gap-2 rounded-md border bg-background/60 p-2.5">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trading-profit" />
                  <span className="text-xs">{g}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Platform Identity</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-lg font-semibold">{PLATFORM_IDENTITY.name}</div>
              <div className="text-muted-foreground">{PLATFORM_IDENTITY.tagline}</div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {PLATFORM_IDENTITY.mission.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
              </div>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {PLATFORM_IDENTITY.promises.map(p => <li key={p}>• {p}</li>)}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Section 9 — Explainability dialog */}
      <Dialog open={!!activeDiscovery} onOpenChange={o => !o && setActiveDiscovery(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeDiscovery?.title}</DialogTitle>
            <DialogDescription>{activeDiscovery?.summary}</DialogDescription>
          </DialogHeader>
          {activeDiscovery && (
            <div className="space-y-4">
              <ExplainBlock e={activeDiscovery.explain} />
              <Separator />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Affected modules</div>
                <div className="mt-1.5 space-y-1.5">
                  {activeDiscovery.impacts.map(im => (
                    <div key={im.domain} className="text-xs">
                      <span className="font-semibold">{im.domain}: </span>
                      <span className="text-muted-foreground">{im.note}</span>
                      <div className="mt-1"><LinkChips links={im.items} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Advisory only. This explanation performs no action and cannot change allocations, parameters or promotion state.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
