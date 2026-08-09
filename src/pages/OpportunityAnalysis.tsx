import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  buildOpportunityAnalysis, CLASS_STATUS, GOVERNANCE_TEXT,
  OpportunityRecord, OpportunityClass, CHECKPOINTS,
} from '@/lib/opportunityAnalysis';
import { ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecStatusPill } from '@/components/executive/ExecUi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Binoculars, BrainCircuit, CheckCircle2, Filter, GraduationCap, Link2,
  Lock, Microscope, ShieldCheck, Target, TrendingDown, TrendingUp,
} from 'lucide-react';

const CLASSES: OpportunityClass[] = [
  'Correct Decision', 'Neutral Decision', 'Missed Opportunity', 'Major Missed Opportunity',
];

const fmtTime = (t: number) =>
  new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function RecordRow({ r, active, onSelect }: { r: OpportunityRecord; active: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-lg border p-3 text-left transition-colors ${
        active ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
        <ExecStatusPill status={CLASS_STATUS[r.classification]} label={r.classification} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{r.asset}</span>
        <Badge variant="outline" className="text-[10px]">{r.direction}</Badge>
        <span className="text-xs text-muted-foreground">{r.specialist} · {r.regime}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {fmtTime(r.timestamp)} · blocked by {r.rejections.map((x) => x.name).join(', ')}
      </p>
    </button>
  );
}

export default function OpportunityAnalysis() {
  const analysis = useMemo(() => buildOpportunityAnalysis(Date.UTC(2026, 7, 9, 16, 0, 0)), []);
  const [filterClass, setFilterClass] = useState<OpportunityClass | 'All'>('All');
  const [selectedId, setSelectedId] = useState(analysis.records[0]?.id ?? '');

  const visible = filterClass === 'All'
    ? analysis.records
    : analysis.records.filter((r) => r.classification === filterClass);
  const selected = analysis.records.find((r) => r.id === selectedId) ?? visible[0] ?? null;

  const restrictive = [...analysis.filterScores].sort((a, b) => b.expectedValue - a.expectedValue).slice(0, 10);
  const valuable = [...analysis.filterScores].sort((a, b) => a.expectedValue - b.expectedValue).slice(0, 10);
  const s = analysis.summary;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-6 sm:p-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-3 w-3" /> Observation Only</Badge>
          <Badge variant="outline" className="text-[10px]">Simulation Only</Badge>
          <Badge variant="outline" className="text-[10px]">Human Approval Required</Badge>
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
          <Binoculars className="h-7 w-7 text-trading-gold" aria-hidden="true" />
          Opportunity Analysis™
        </h1>
        <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
          Every trade rejected by ATLAS is analysed to determine whether waiting protected capital or caused a
          missed opportunity.
        </p>
      </header>

      <ExecMetricGrid cols={6}>
        <ExecMetric label="Missed Today" value={s.todayMissed} status={s.todayMissed > 2 ? 'warning' : 'healthy'} hint="Rejected signals that later paid" />
        <ExecMetric label="Records (30d)" value={s.totalRecords} hint="Opportunity records created" />
        <ExecMetric label="Profit Protected" value={`${s.profitProtectedR}R`} status="healthy" hint="Losses avoided by waiting" />
        <ExecMetric label="Opportunity Missed" value={`${s.opportunityMissedR}R`} status="warning" hint="Profit suppressed by filters" />
        <ExecMetric label="Net Position" value={`${s.netR}R`} status={s.recommendationStatus} hint="Protected minus missed" />
        <ExecMetric label="Correct Waits" value={`${s.correctRate}%`} status={s.correctRate > 45 ? 'healthy' : 'watch'} hint="Rejections that avoided losses" />
      </ExecMetricGrid>

      <div className="grid gap-4 lg:grid-cols-3">
        <ExecCard>
          <ExecCardHeader title="Largest Missed Winner" icon={TrendingUp} />
          {s.largestMissedWinner && (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{s.largestMissedWinner.asset} {s.largestMissedWinner.direction} · {s.largestMissedWinner.outcomeR}R</p>
              <p className="text-xs text-muted-foreground">{s.largestMissedWinner.specialist} · {s.largestMissedWinner.regime}</p>
              <p className="text-[11px] text-muted-foreground">{s.largestMissedWinner.lesson}</p>
            </div>
          )}
        </ExecCard>
        <ExecCard>
          <ExecCardHeader title="Largest Avoided Loser" icon={TrendingDown} />
          {s.largestAvoidedLoser && (
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{s.largestAvoidedLoser.asset} {s.largestAvoidedLoser.direction} · {Math.abs(s.largestAvoidedLoser.outcomeR)}R saved</p>
              <p className="text-xs text-muted-foreground">{s.largestAvoidedLoser.specialist} · {s.largestAvoidedLoser.regime}</p>
              <p className="text-[11px] text-muted-foreground">{s.largestAvoidedLoser.lesson}</p>
            </div>
          )}
        </ExecCard>
        <ExecCard>
          <ExecCardHeader title="Institution Recommendation" icon={ShieldCheck} action={<ExecStatusPill status={s.recommendationStatus} />} />
          <p className="text-sm leading-relaxed text-muted-foreground">{s.recommendation}</p>
        </ExecCard>
      </div>

      <Tabs defaultValue="records">
        <TabsList className="flex-wrap">
          <TabsTrigger value="records">Opportunity Records</TabsTrigger>
          <TabsTrigger value="filters">Filter Scorecard</TabsTrigger>
          <TabsTrigger value="specialists">Specialist Report Card</TabsTrigger>
          <TabsTrigger value="oracle">Oracle Review</TabsTrigger>
          <TabsTrigger value="learning">Learning Engine</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
        </TabsList>

        {/* ── Records ─────────────────────────────────── */}
        <TabsContent value="records" className="mt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {(['All', ...CLASSES] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={filterClass === c ? 'default' : 'outline'}
                onClick={() => setFilterClass(c as OpportunityClass | 'All')}
              >
                {c}
                <span className="ml-2 text-[10px] opacity-70">
                  {c === 'All' ? analysis.records.length : analysis.records.filter((r) => r.classification === c).length}
                </span>
              </Button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
            <ExecCard className="p-0">
              <ScrollArea className="h-[720px] p-3">
                <div className="space-y-2">
                  {visible.map((r) => (
                    <RecordRow key={r.id} r={r} active={selected?.id === r.id} onSelect={() => setSelectedId(r.id)} />
                  ))}
                </div>
              </ScrollArea>
            </ExecCard>

            {selected && (
              <ExecCard className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selected.asset} {selected.direction} · {selected.id}</h2>
                    <p className="text-xs text-muted-foreground">
                      {fmtTime(selected.timestamp)} · {selected.specialist} · {selected.regime} · confidence {selected.confidence}%
                    </p>
                  </div>
                  <ExecStatusPill status={CLASS_STATUS[selected.classification]} label={selected.classification} />
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]">Rejection Reasons</h3>
                  <div className="space-y-2">
                    {selected.rejections.map((x) => (
                      <div key={x.filter} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <p className="text-sm font-medium">{x.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Current <span className="font-mono text-foreground">{x.current}</span> · Required{' '}
                          <span className="font-mono text-foreground">{x.required}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{x.note}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]">Market Conditions at Rejection</h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      ['Price', selected.conditions.price.toLocaleString()],
                      ['ATR %', `${selected.conditions.atrPercent}%`],
                      ['RSI', String(selected.conditions.rsi)],
                      ['SMA Distance', `${selected.conditions.smaDistance}%`],
                      ['Volume', `${selected.conditions.volumeRatio}×`],
                      ['HTF Trend', selected.conditions.htfTrend],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-lg border bg-card p-2">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</p>
                        <p className="font-mono text-sm">{v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 rounded-lg border bg-muted/30 p-2 font-mono text-[11px] text-muted-foreground">
                    Decision state snapshot — {selected.decisionState}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em]">Forward Market Follow-Up</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-xs">
                      <thead>
                        <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                          <th className="py-2">Checkpoint</th><th>Move %</th><th>MFE</th><th>MAE</th>
                          <th>Hypo. Profit</th><th>Hypo. Loss</th><th>R:R</th><th>SL Hit</th><th>TP Hit</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono tabular-nums">
                        {selected.checkpoints.map((c) => (
                          <tr key={c.label} className="border-b last:border-0">
                            <td className="py-1.5 font-sans font-medium">{c.label}</td>
                            <td className={c.movePct >= 0 ? 'text-exec-healthy' : 'text-exec-critical'}>{c.movePct}%</td>
                            <td>{c.mfePct}%</td>
                            <td>{c.maePct}%</td>
                            <td className="text-exec-healthy">+{c.hypotheticalProfit}%</td>
                            <td className="text-exec-critical">{c.hypotheticalLoss}%</td>
                            <td>{c.riskReward}</td>
                            <td>{c.stopHit ? 'Yes' : '—'}</td>
                            <td>{c.takeProfitHit ? 'Yes' : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Checkpoints: {CHECKPOINTS.join(' · ')} after rejection.
                  </p>
                </div>

                <Separator />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <BrainCircuit className="h-3.5 w-3.5 text-trading-gold" /> Oracle Explanation
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selected.oracle}</p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      <ShieldCheck className="h-3.5 w-3.5 text-trading-gold" /> Governance Explanation
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selected.governance}</p>
                  </div>
                </div>
              </ExecCard>
            )}
          </div>
        </TabsContent>

        {/* ── Filter scorecard ────────────────────────── */}
        <TabsContent value="filters" className="mt-4 space-y-4">
          {[
            { title: 'Top 10 Most Restrictive Filters', icon: Filter, rows: restrictive },
            { title: 'Top 10 Most Valuable Filters', icon: ShieldCheck, rows: valuable },
          ].map((block) => (
            <ExecCard key={block.title}>
              <ExecCardHeader title={block.title} icon={block.icon} hint="Ranked by expected value of blocking" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-xs">
                  <thead>
                    <tr className="border-b text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-2">Filter</th><th>Blocks</th><th>Avg Missed</th><th>Avg Avoided</th>
                      <th>Win % if ignored</th><th>Loss % if ignored</th><th>EV</th><th>PF</th><th>Sharpe Δ</th><th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {block.rows.map((f) => (
                      <tr key={f.filter.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <p className="font-medium">{f.filter.name}</p>
                          <p className="text-[10px] text-muted-foreground">{f.filter.family} · {f.filter.current}</p>
                        </td>
                        <td className="font-mono">{f.blocks}</td>
                        <td className="font-mono text-exec-warning">{f.avgMissedProfit}R</td>
                        <td className="font-mono text-exec-healthy">{f.avgAvoidedLoss}R</td>
                        <td className="font-mono">{f.winRateIfIgnored}%</td>
                        <td className="font-mono">{f.lossRateIfIgnored}%</td>
                        <td className="font-mono">{f.expectedValue}R</td>
                        <td className="font-mono">{f.profitFactor}</td>
                        <td className="font-mono">{f.sharpeImpact}</td>
                        <td>
                          <ExecStatusPill
                            status={f.verdict === 'Valuable' ? 'healthy' : f.verdict === 'Balanced' ? 'watch' : 'warning'}
                            label={f.verdict}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ExecCard>
          ))}
        </TabsContent>

        {/* ── Specialists ─────────────────────────────── */}
        <TabsContent value="specialists" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analysis.specialistScores.map((sp) => (
              <ExecCard key={sp.specialist}>
                <ExecCardHeader
                  title={sp.specialist}
                  icon={Target}
                  action={<ExecStatusPill status={sp.rating === 'A' ? 'healthy' : sp.rating === 'B' ? 'watch' : sp.rating === 'C' ? 'warning' : 'critical'} label={`Rating ${sp.rating}`} />}
                />
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {[
                    ['Signals generated', sp.signals],
                    ['Signals blocked', sp.blocked],
                    ['Trades taken', sp.taken],
                    ['Missed opportunities', sp.missed],
                    ['Correct waits', sp.correctWaits],
                    ['Avg confidence', `${sp.avgConfidence}%`],
                    ['Avg missed profit', `${sp.avgProfit}R`],
                    ['Avg avoided loss', `${sp.avgAvoidedLoss}R`],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex items-center justify-between gap-2 border-b border-border/50 py-1">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-mono tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>
              </ExecCard>
            ))}
          </div>
        </TabsContent>

        {/* ── Oracle ──────────────────────────────────── */}
        <TabsContent value="oracle" className="mt-4 space-y-3">
          {analysis.oracleReviews.map((o) => (
            <ExecCard key={o.title}>
              <ExecCardHeader
                title={o.title}
                icon={BrainCircuit}
                action={<ExecStatusPill status={o.verdict === 'Keep' ? 'healthy' : o.verdict === 'Research' ? 'warning' : 'watch'} label={o.verdict} />}
              />
              <p className="max-w-[68ch] text-sm leading-relaxed text-muted-foreground">{o.text}</p>
            </ExecCard>
          ))}
        </TabsContent>

        {/* ── Learning engine ─────────────────────────── */}
        <TabsContent value="learning" className="mt-4 space-y-3">
          <ExecCard>
            <ExecCardHeader title="Learning Engine" icon={GraduationCap} hint="Recommendations only — never auto-applied" />
            <p className="max-w-[68ch] text-sm text-muted-foreground">
              ATLAS never modifies trading rules automatically. Each pattern with sufficient evidence becomes a
              research candidate requiring full institutional approval via the Decision Centre.
            </p>
          </ExecCard>
          {analysis.candidates.map((c) => (
            <ExecCard key={c.id}>
              <ExecCardHeader title={`${c.id} · ${c.title}`} icon={Microscope} action={<ExecStatusPill status="warning" label={c.status} />} />
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Threshold</p>
                  <p className="font-mono text-sm">{c.filter.current} → {c.filter.suggested}</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidence (missed profit)</p>
                  <p className="font-mono text-sm">{c.evidenceMissedProfit}R</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Confidence</p>
                  <p className="font-mono text-sm">{c.confidence}%</p>
                </div>
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Supporting trades</p>
                  <p className="font-mono text-sm">{c.supportingTrades}</p>
                </div>
              </div>
              <p className="mt-3 max-w-[68ch] text-sm text-muted-foreground">{c.rationale}</p>
              <p className="mt-2 text-xs text-muted-foreground">Expected improvement: {c.expectedImprovement}</p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to="/decision-centre">Send to Decision Centre for approval</Link>
              </Button>
            </ExecCard>
          ))}
        </TabsContent>

        {/* ── Knowledge graph ─────────────────────────── */}
        <TabsContent value="knowledge" className="mt-4">
          <ExecCard>
            <ExecCardHeader title="Institutional Lesson Links" icon={Link2} hint="Every completed opportunity becomes a permanent lesson" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {analysis.knowledgeLinks.map((l) => (
                <Link key={l.label} to={l.url} className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40">
                  <p className="flex items-center gap-2 text-sm font-medium"><CheckCircle2 className="h-3.5 w-3.5 text-trading-gold" />{l.label}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{l.description}</p>
                </Link>
              ))}
            </div>
          </ExecCard>
        </TabsContent>
      </Tabs>

      <p className="rounded-lg border border-dashed p-3 text-[11px] leading-relaxed text-muted-foreground">
        <Lock className="mr-1.5 inline h-3 w-3" />
        {GOVERNANCE_TEXT}
      </p>
    </div>
  );
}
