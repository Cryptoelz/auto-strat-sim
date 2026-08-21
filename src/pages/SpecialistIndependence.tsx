import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResearchHeader } from '@/components/research/ResearchUi';
import { useSpecialistAttribution } from '@/hooks/useSpecialistAttribution';
import {
  analyseIndependence, storeIndependenceReport, loadIndependenceReports,
  SPECIALIST_NAMES, KNOWLEDGE_GRAPH_LINKS, PairMetrics,
} from '@/lib/specialists/independence';
import { SPECIALIST_IDS } from '@/lib/specialists/stats';
import { SpecialistId } from '@/lib/specialists/types';
import {
  Fingerprint, ShieldCheck, Sparkles, AlertTriangle, Network, Gauge, Lightbulb, Share2, Save,
} from 'lucide-react';

const SHORT: Record<SpecialistId, string> = {
  trend: 'Trend', momentum: 'Momentum', mean_reversion: 'Mean Rev', volatility: 'Volatility', breakout: 'Breakout',
};

const ratingTone = (r: string) =>
  r === 'Excellent' ? 'border-success/40 bg-success/10 text-success'
  : r === 'Strong' ? 'border-primary/40 bg-primary/10 text-primary'
  : r === 'Adequate' ? 'border-border bg-muted/40 text-foreground/80'
  : r === 'Monitor' ? 'border-warning/40 bg-warning/10 text-warning'
  : 'border-destructive/40 bg-destructive/10 text-destructive';

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function SpecialistIndependence() {
  const { funnels, stats, ledger } = useSpecialistAttribution();
  const report = useMemo(() => analyseIndependence(ledger, funnels, stats), [ledger, funnels, stats]);
  const [saved, setSaved] = useState(() => loadIndependenceReports());

  const pairLookup = useMemo(() => {
    const m = new Map<string, PairMetrics>();
    report.pairs.forEach((p) => { m.set(`${p.a}|${p.b}`, p); m.set(`${p.b}|${p.a}`, p); });
    return m;
  }, [report.pairs]);

  const healthTone = report.researchHealth === 'Healthy'
    ? 'border-success/40 bg-success/10 text-success'
    : report.researchHealth === 'Watch'
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-destructive/40 bg-destructive/10 text-destructive';

  return (
    <div className="rsch-page container mx-auto p-4 sm:p-6 space-y-6">
      <ResearchHeader
        eyebrow="Institutional Diversity Analysis"
        title="Specialist Independence Score™"
        subtitle="Measure how independently every specialist thinks."
        flow
        activeStep="Analysis"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[10px]">READ-ONLY RESEARCH</Badge>
        <Badge variant="outline" className="text-[10px]">Observation only · no strategy or execution changes</Badge>
        <Badge variant="outline" className={`text-[10px] ${healthTone}`}>Research Health: {report.researchHealth}</Badge>
        <Badge variant="outline" className="text-[10px]">{report.rounds} comparison rounds</Badge>
      </div>

      {/* ── Executive hero ── */}
      <Card className="border-primary/25 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fingerprint className="h-4 w-4 text-primary" /> Institution Independence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="font-mono text-5xl font-bold text-primary">{report.institutionIndependence}%</p>
              <p className="text-xs text-muted-foreground">Institution Independence Score</p>
            </div>
            <div className="min-w-[220px] flex-1">
              <Progress value={report.institutionIndependence} className="h-2" />
              <p className="mt-2 text-xs text-muted-foreground">{report.recommendation}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Diversity Score" value={`${report.diversityScore}%`} sub="avg specialist independence" />
            <Metric label="Signal Diversity" value={`${report.signalDiversity}%`} sub="100 − avg correlation" />
            <Metric label="Agreement Rate" value={`${report.agreementRate}%`} sub="identical signals" />
            <Metric label="Unique Opportunities" value={`${report.uniqueOpportunities}`} sub="solo ideas" />
            <Metric label="Correlation Risk" value={`${report.correlationRisk}%`} sub="avg pairwise similarity" />
            <Metric label="Research Health" value={report.researchHealth} sub={`${report.rounds} rounds`} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scorecard">
        <TabsList className="flex-wrap">
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="matrix">Pairwise Matrix</TabsTrigger>
          <TabsTrigger value="diversity">Signal Diversity</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="overlap">Overlap</TabsTrigger>
          <TabsTrigger value="discovery">Discovery Index</TabsTrigger>
          <TabsTrigger value="oracle">Oracle</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
        </TabsList>

        {/* ── Scorecard ── */}
        <TabsContent value="scorecard" className="mt-4 space-y-3">
          {report.specialists.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">Contribution {s.contribution}% of institutional ideas</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] ${ratingTone(s.institutionRating)}`}>{s.institutionRating}</Badge>
                    <div className="text-right">
                      <p className="font-mono text-2xl font-semibold text-primary">{s.independenceScore}%</p>
                      <p className="text-[10px] text-muted-foreground">Independence</p>
                    </div>
                  </div>
                </div>
                <Progress value={s.independenceScore} className="mt-3 h-1.5" />
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-7">
                  {[
                    ['Seen', s.seen], ['Proposed', s.proposed], ['Approved', s.approved], ['Executed', s.executed],
                    ['Unique', s.uniqueOpportunities], ['Shared', s.sharedOpportunities], ['Duplicated', s.duplicatedOpportunities],
                  ].map(([l, v]) => (
                    <div key={l as string} className="rounded-md border border-border/40 bg-muted/20 p-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{l}</p>
                      <p className="font-mono text-sm font-semibold">{v as number}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Pairwise matrix ── */}
        <TabsContent value="matrix" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Network className="h-4 w-4 text-primary" /> Signal Correlation Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-left font-medium text-muted-foreground">Specialist</th>
                        {SPECIALIST_IDS.map((id) => (
                          <th key={id} className="p-2 text-center font-medium text-muted-foreground">{SHORT[id]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SPECIALIST_IDS.map((row) => (
                        <tr key={row}>
                          <td className="whitespace-nowrap p-2 font-medium text-foreground/80">{SHORT[row]}</td>
                          {SPECIALIST_IDS.map((col) => {
                            if (row === col) {
                              return <td key={col} className="p-1"><div className="rounded-md border border-border/30 bg-muted/30 px-2 py-3 text-center text-muted-foreground">—</div></td>;
                            }
                            const p = pairLookup.get(`${row}|${col}`);
                            const c = p?.correlation ?? 0;
                            const alpha = (0.12 + (c / 100) * 0.7).toFixed(2);
                            const bg = c >= 65
                              ? `hsl(var(--trading-loss) / ${alpha})`
                              : `hsl(var(--trading-profit) / ${alpha})`;
                            return (
                              <td key={col} className="p-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-default rounded-md border border-border/40 px-2 py-3 text-center" style={{ background: bg }}>
                                      <div className="font-mono text-sm font-semibold">{c}%</div>
                                      <div className="text-[10px] text-muted-foreground">{p?.sharedTrades ?? 0} shared</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">
                                    <div className="font-medium">{SPECIALIST_NAMES[row]} vs {SPECIALIST_NAMES[col]}</div>
                                    <div>Correlation: {c}% · Agreement: {p?.agreementRate ?? 0}%</div>
                                    <div>Shared trades: {p?.sharedTrades ?? 0} · Different: {p?.differentTrades ?? 0}</div>
                                    <div>Unique ideas: {p?.uniqueIdeas ?? 0} · Conflict rate: {p?.conflictRate ?? 0}%</div>
                                    <div>Observed rounds: {p?.rounds ?? 0}</div>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Green = high independence (excellent). Red = high similarity (warning, ≥65%).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pair Detail</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    {['Pair', 'Correlation', 'Agreement', 'Shared', 'Different', 'Unique Ideas', 'Conflict'].map((h) => (
                      <th key={h} className="p-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.pairs.map((p) => (
                    <tr key={`${p.a}-${p.b}`} className="border-b border-border/30">
                      <td className="p-2 font-medium">{SHORT[p.a]} vs {SHORT[p.b]}</td>
                      <td className={`p-2 font-mono ${p.correlation >= 65 ? 'text-destructive' : 'text-success'}`}>{p.correlation}%</td>
                      <td className="p-2 font-mono">{p.agreementRate}%</td>
                      <td className="p-2 font-mono">{p.sharedTrades}</td>
                      <td className="p-2 font-mono">{p.differentTrades}</td>
                      <td className="p-2 font-mono">{p.uniqueIdeas}</td>
                      <td className="p-2 font-mono">{p.conflictRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Signal diversity ── */}
        <TabsContent value="diversity" className="mt-4 grid gap-3 md:grid-cols-2">
          {report.specialists.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{s.name}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-xs">
                {[
                  ['Unique', s.uniquePct, 'bg-success'],
                  ['Shared', s.sharedPct, 'bg-primary'],
                  ['Duplicated', s.duplicatedPct, 'bg-destructive'],
                ].map(([label, value, tone]) => (
                  <div key={label as string}>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono">{value as number}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                      <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${value as number}%` }} />
                    </div>
                  </div>
                ))}
                <p className="pt-1 text-[11px] text-muted-foreground">
                  {s.proposed} proposals · participation {s.participationRate}% · avg confidence {s.avgConfidence}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Personality ── */}
        <TabsContent value="personality" className="mt-4 grid gap-3 md:grid-cols-2">
          {report.specialists.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" /> {s.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {s.personality.map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Derived from observed behaviour: participation {s.participationRate}%, avg confidence {s.avgConfidence},
                  originality {s.uniquePct}% across {report.rounds} rounds.
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Overlap ── */}
        <TabsContent value="overlap" className="mt-4 space-y-3">
          {report.overlaps.length === 0 && (
            <p className="text-xs text-muted-foreground">No observations yet.</p>
          )}
          {report.overlaps.map((o) => (
            <Card key={`${o.a}-${o.b}`} className={o.severity === 'critical' ? 'border-destructive/40' : o.severity === 'warning' ? 'border-warning/40' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{SPECIALIST_NAMES[o.a]} · {SPECIALIST_NAMES[o.b]}</p>
                  <Badge variant="outline" className={`text-[10px] ${o.severity === 'critical' ? 'border-destructive/40 bg-destructive/10 text-destructive' : o.severity === 'warning' ? 'border-warning/40 bg-warning/10 text-warning' : 'border-success/40 bg-success/10 text-success'}`}>
                    Similarity {o.similarity}%
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{o.reason}</p>
                <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  {o.evidence.map((e) => <li key={e}>• {e}</li>)}
                </ul>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Lightbulb className="h-4 w-4 text-primary" /> Research Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.recommendations.map((r) => (
                <div key={r.title} className="rounded-md border border-border/50 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{r.title}</p>
                    <Badge variant="outline" className="text-[10px] uppercase">{r.priority}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">Evidence: {r.evidence}</p>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-muted-foreground">
                Recommendations are advisory. Full institutional approval is required before any architecture change.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Discovery index ── */}
        <TabsContent value="discovery" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Gauge className="h-4 w-4 text-primary" /> Unique Discovery Index</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[11px] text-muted-foreground">
                High-quality ideas (positive expected value, confidence ≥ 55) that no other specialist proposed in the same round.
              </p>
              {report.specialists.map((s) => {
                const max = Math.max(...report.specialists.map((x) => x.discoveryIndex), 1);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs">{s.name}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(s.discoveryIndex / max) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-xs">{s.discoveryIndex}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Oracle ── */}
        <TabsContent value="oracle" className="mt-4 space-y-3">
          {report.oracle.map((o) => (
            <Card key={o.question}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-primary">{o.question}</p>
                <p className="mt-1 text-sm">{o.answer}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Evidence: {o.evidence}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Knowledge graph ── */}
        <TabsContent value="graph" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><Share2 className="h-4 w-4 text-primary" /> Linked Institutional Modules</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {KNOWLEDGE_GRAPH_LINKS.map((l) => (
                <Button key={l.url} asChild variant="outline" size="sm" className="text-xs">
                  <Link to={l.url}>{l.label}</Link>
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Stored Independence Reports</CardTitle>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setSaved(storeIndependenceReport(report))}>
                <Save className="mr-1 h-3 w-3" /> Store report
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {saved.length === 0 && <p className="text-xs text-muted-foreground">No reports stored yet.</p>}
              {saved.map((r) => (
                <div key={r.id} className="rounded-md border border-border/50 bg-muted/20 p-3 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono">{r.id}</span>
                    <span className="text-muted-foreground">{new Date(r.generatedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Independence {r.institutionIndependence}% · Diversity {r.diversityScore}% · Correlation risk {r.correlationRisk}% · {r.researchHealth}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Executive summary ── */}
      <Card className="border-primary/25">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-primary" /> Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{report.summary}</p>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5" />
            Governance: observation and research only. No automatic optimisation, strategy, execution or connectivity changes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
