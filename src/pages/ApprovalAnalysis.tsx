import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResearchHeader } from '@/components/research/ResearchUi';
import { useTradingContext } from '@/contexts/TradingContext';
import { useSpecialistAttribution } from '@/hooks/useSpecialistAttribution';
import {
  buildProposals, rejectionLeaderboard, summarise, approvalFunnel, perSpecialist, perAsset,
  counterfactuals, oracleReview, recommendations, validate, KNOWLEDGE_LINKS, assetLabel,
  ProposalRecord,
} from '@/lib/specialists/approvalAnalysis';
import {
  ShieldCheck, Gavel, Filter, Sparkles, Network, Lightbulb, CheckCircle2, AlertTriangle, Share2,
} from 'lucide-react';

const fmtTime = (ts: number) => new Date(ts).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

const statusTone = (s: string) =>
  s === 'Executed' ? 'border-success/40 bg-success/10 text-success'
  : s === 'Approved' ? 'border-primary/40 bg-primary/10 text-primary'
  : s === 'Hold' ? 'border-border bg-muted/40 text-muted-foreground'
  : 'border-destructive/40 bg-destructive/10 text-destructive';

function Metric({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function ApprovalAnalysis() {
  const { state } = useTradingContext();
  const { funnels, ledger, attemptLog, holdLog } = useSpecialistAttribution();
  const trades = state.trades ?? [];

  const records = useMemo(() => buildProposals(ledger, attemptLog, holdLog, trades), [ledger, attemptLog, holdLog, trades]);
  const rules = useMemo(() => rejectionLeaderboard(records), [records]);
  const summary = useMemo(() => summarise(records, rules), [records, rules]);
  const funnel = useMemo(() => approvalFunnel(funnels, records, trades), [funnels, records, trades]);
  const specialists = useMemo(() => perSpecialist(funnels, records, trades), [funnels, records, trades]);
  const assets = useMemo(() => perAsset(records, funnels), [records, funnels]);
  const counter = useMemo(() => counterfactuals(records, rules), [records, rules]);
  const oracle = useMemo(() => oracleReview(records, rules, specialists, assets), [records, rules, specialists, assets]);
  const recs = useMemo(() => recommendations(summary, rules, specialists, assets), [summary, rules, specialists, assets]);
  const validation = useMemo(() => validate(records, trades), [records, trades]);

  const [selected, setSelected] = useState<ProposalRecord | null>(null);
  const [stageFilter, setStageFilter] = useState<string | null>(null);

  const timeline = useMemo(() => {
    if (!stageFilter) return records.slice(0, 120);
    if (stageFilter === 'Approved') return records.filter((r) => r.decision === 'Approved');
    if (stageFilter === 'Executed') return records.filter((r) => r.executed);
    if (stageFilter === 'Proposals') return records.filter((r) => r.direction !== 'HOLD');
    return records.slice(0, 120);
  }, [records, stageFilter]);

  const maxStage = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-8">
      <ResearchHeader
        eyebrow="ATLAS OS™ · Evidence Layer"
        title="Approval Analysis™"
        subtitle="Why every proposed trade was approved or rejected — traceable from market to specialist to decision to outcome to lesson. Read-only research: no execution, no strategy edits, no parameter changes."
        flow
        activeStep="Evidence"
        actions={
          <>
            <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-trading-gold">Read-only</Badge>
            <Button asChild size="sm" variant="outline"><Link to="/specialist-board">Specialist Board</Link></Button>
          </>
        }
      />

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Gavel className="h-4 w-4 text-trading-gold" /> Executive Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Metric label="Total Proposals" value={summary.totalProposals} />
            <Metric label="Approved" value={summary.approved} />
            <Metric label="Rejected" value={summary.rejected} />
            <Metric label="Approval Rate" value={`${summary.approvalRate}%`} />
            <Metric label="Avg Confidence" value={summary.avgConfidence} />
            <Metric label="Most Common Rejection" value={summary.mostCommonReason.slice(0, 28)} hint={summary.mostCommonReason} />
            <Metric label="Most Restrictive Rule" value={summary.mostRestrictiveRule} />
            <Metric label="Least Restrictive Rule" value={summary.leastRestrictiveRule} />
            <Metric label="Proposal → Decision" value={`${(summary.avgDecisionMs / 1000).toFixed(1)}s`} hint="Average time from proposal to recorded decision" />
            <Metric label="Evidence Records" value={records.length} hint="Traceable decisions in the retained window" />
          </div>
          <div className="space-y-1.5 rounded-lg border border-trading-gold/25 bg-trading-gold/[0.05] p-3">
            {summary.headlines.map((h) => (
              <p key={h} className="text-[12.5px] leading-relaxed text-foreground">{h}</p>
            ))}
            <p className="border-t border-trading-gold/20 pt-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <span className="uppercase tracking-[0.16em] text-trading-gold/80">Institution verdict · </span>{summary.verdict}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="rules">Rejection Leaderboard</TabsTrigger>
          <TabsTrigger value="funnel">Approval Funnel</TabsTrigger>
          <TabsTrigger value="specialists">Per Specialist</TabsTrigger>
          <TabsTrigger value="assets">Per Asset</TabsTrigger>
          <TabsTrigger value="cost">Opportunity Cost</TabsTrigger>
          <TabsTrigger value="oracle">Oracle Review</TabsTrigger>
          <TabsTrigger value="graph">Knowledge Graph</TabsTrigger>
          <TabsTrigger value="recs">Recommendations</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Proposal Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Proposal Timeline</CardTitle>
              <p className="text-[12px] text-muted-foreground">
                {stageFilter ? `Filtered by stage: ${stageFilter}. ` : ''}Click any row for the complete decision evidence.
                {stageFilter && <button className="ml-2 underline" onClick={() => setStageFilter(null)}>clear</button>}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {timeline.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No proposals recorded yet. Run a paper trading session — every evaluated candle writes evidence here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Time</th><th className="px-3 py-2">Asset</th><th className="px-3 py-2">Specialist</th>
                        <th className="px-3 py-2">Direction</th><th className="px-3 py-2 text-right">Confidence</th>
                        <th className="px-3 py-2">Decision</th><th className="px-3 py-2">Reason</th><th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeline.map((r) => (
                        <tr key={r.id} onClick={() => setSelected(r)} className="cursor-pointer border-b border-border/30 hover:bg-muted/30">
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">{fmtTime(r.timestamp)}</td>
                          <td className="px-3 py-2 font-medium">{assetLabel(r.asset)}</td>
                          <td className="px-3 py-2">{r.specialistName}</td>
                          <td className="px-3 py-2">{r.direction}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{r.confidence}</td>
                          <td className="px-3 py-2">{r.decision}</td>
                          <td className="max-w-[380px] truncate px-3 py-2 text-muted-foreground" title={r.reason}>{r.reason}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className={statusTone(r.status)}>{r.status}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejection Leaderboard */}
        <TabsContent value="rules">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Filter className="h-4 w-4 text-trading-gold" /> Rejection Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.map((r, i) => (
                <div key={r.rule} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-medium">#{i + 1} {r.rule}</p>
                    <div className="flex gap-4 font-mono text-[12px] tabular-nums">
                      <span>{r.triggered} triggered</span>
                      <span className="text-muted-foreground">{r.percentage}%</span>
                      <span className="text-muted-foreground">conf lost {r.avgConfidenceLost}</span>
                      <span className="text-warning">opp. cost {r.opportunityCost}R</span>
                    </div>
                  </div>
                  <Progress value={r.percentage} className="mt-2 h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Funnel */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Approval Funnel</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {funnel.map((f) => (
                <button key={f.stage} onClick={() => setStageFilter(f.stage)}
                  className="w-full rounded-lg border border-border/60 bg-card/50 p-3 text-left transition-colors hover:border-trading-gold/40 hover:bg-trading-gold/[0.05]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium">{f.stage}</span>
                    <span className="font-mono text-sm tabular-nums text-trading-gold">{f.count}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/40">
                    <div className="h-1.5 rounded-full bg-trading-gold/70" style={{ width: `${Math.round((f.count / maxStage) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{f.note}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Specialist */}
        <TabsContent value="specialists">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Per Specialist Approval</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-[12px]">
                <thead className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Specialist</th><th className="px-3 py-2 text-right">Markets</th>
                    <th className="px-3 py-2 text-right">Signals</th><th className="px-3 py-2 text-right">Proposals</th>
                    <th className="px-3 py-2 text-right">Approved</th><th className="px-3 py-2 text-right">Rejected</th>
                    <th className="px-3 py-2 text-right">Executed</th><th className="px-3 py-2 text-right">Win Rate</th>
                    <th className="px-3 py-2 text-right">Avg Conf</th><th className="px-3 py-2">Top Rejection Rule</th>
                    <th className="px-3 py-2 text-right">Avg Hold</th><th className="px-3 py-2 text-right">Net Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {specialists.map((s) => (
                    <tr key={s.id} className="border-b border-border/30">
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.marketsExamined}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.signals}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.proposals}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.approved}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.rejected}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.executed}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.winRate}%</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.avgConfidence}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.topRule}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.avgHoldMinutes}m</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{s.netContribution}R</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Asset */}
        <TabsContent value="assets">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Per Asset Analysis</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {assets.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No market has been evaluated yet in the retained window.</p>
              ) : (
                <table className="w-full text-[12px]">
                  <thead className="border-b border-border/60 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Asset</th><th className="px-3 py-2 text-right">Signals</th>
                      <th className="px-3 py-2 text-right">Approvals</th><th className="px-3 py-2 text-right">Executions</th>
                      <th className="px-3 py-2 text-right">Rejections</th><th className="px-3 py-2">Top Blocking Rule</th>
                      <th className="px-3 py-2 text-right">Opportunity Cost</th><th className="px-3 py-2 text-right">Avg Conf</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.asset} className="border-b border-border/30">
                        <td className="px-3 py-2 font-medium">{assetLabel(a.asset)}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{a.signals}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{a.approvals}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{a.executions}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{a.rejections}</td>
                        <td className="px-3 py-2 text-muted-foreground">{a.topRule}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums text-warning">{a.opportunityCost}R</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{a.avgConfidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunity Cost */}
        <TabsContent value="cost">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Opportunity Cost — "If this rule had not existed…"</CardTitle>
              <p className="text-[12px] text-muted-foreground">Research estimate only. No trading behaviour changes as a result of this table.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {counter.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rule has blocked a proposal in the retained window, so there is no counterfactual to estimate.</p>
              ) : counter.map((c) => (
                <div key={c.rule} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <p className="text-[13px] font-medium">{c.rule}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{c.statement}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Metric label="Blocked" value={c.blocked} />
                    <Metric label="Potential Winners" value={c.potentialWinners} />
                    <Metric label="Potential Losers" value={c.potentialLosers} />
                    <Metric label="Expected Return" value={`${c.expectedReturn}R`} />
                    <Metric label="Expected Drawdown" value={`${c.expectedDrawdown}R`} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Oracle */}
        <TabsContent value="oracle">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-trading-gold" /> Oracle Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {oracle.map((o) => (
                <div key={o.question} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <p className="text-[13px] font-medium text-trading-gold">{o.question}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-foreground">{o.answer}</p>
                  {o.evidence.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-border/40 pt-2">
                      {o.evidence.map((e) => (
                        <li key={e} className="text-[11.5px] text-muted-foreground">· {e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Graph */}
        <TabsContent value="graph">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Network className="h-4 w-4 text-trading-gold" /> Knowledge Graph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {specialists.map((s) => (
                  <div key={s.id} className="rounded-lg border border-border/60 bg-card/50 p-3">
                    <p className="text-[12.5px] font-medium">{s.name}</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                      → markets {s.marketsExamined} → proposals {s.proposals} → blocked by {s.topRule} → approved {s.approved} → executed {s.executed}
                      {' '}→ lessons {(funnels[s.id]?.lessons ?? []).length}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border/40 pt-3">
                {KNOWLEDGE_LINKS.map((l) => (
                  <Button key={l.url} asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
                    <Link to={l.url}><Share2 className="h-3 w-3" aria-hidden="true" /> {l.label}</Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recs">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-trading-gold" /> Institution Recommendations</CardTitle>
              <p className="text-[12px] text-muted-foreground">Recommendations only — no automatic strategy changes are made.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {recs.map((r) => (
                <div key={r.title} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <div className="flex items-center gap-2">
                    {r.severity === 'high' ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      : r.severity === 'medium' ? <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      : <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    <p className="text-[13px] font-medium">{r.title}</p>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{r.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation */}
        <TabsContent value="validation">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-trading-gold" /> Traceability Validation</CardTitle>
              <p className="text-[12px] text-muted-foreground">Market → Specialist → Proposal → Approval Decision → Execution → Outcome → Lesson Learned.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {validation.map((v) => (
                <div key={v.stage} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/50 p-3">
                  <div>
                    <p className="text-[13px] font-medium">{v.stage}</p>
                    <p className="text-[11.5px] text-muted-foreground">{v.note}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{v.traceable}/{v.total}</span>
                    <Badge variant="outline" className={v.pass ? 'border-success/40 bg-success/10 text-success' : 'border-destructive/40 bg-destructive/10 text-destructive'}>
                      {v.pass ? 'Traceable' : 'Gap'}
                    </Badge>
                  </div>
                </div>
              ))}
              <p className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.05] p-3 text-[12px] leading-relaxed text-muted-foreground">
                Governance: read-only evidence module. No strategy edits, no execution, no parameter changes. Every rejection above carries an evidence-backed reason; no proposal is discarded without one.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Decision Evidence</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-[12.5px]">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Asset" value={assetLabel(selected.asset)} />
                <Metric label="Specialist" value={selected.specialistName} />
                <Metric label="Direction" value={selected.direction} />
                <Metric label="Confidence" value={selected.confidence} />
                <Metric label="Regime" value={selected.regime} />
                <Metric label="Expected Value" value={`${selected.expectedValue}R`} />
                <Metric label="Decision" value={selected.decision} />
                <Metric label="Status" value={selected.status} />
                <Metric label="Blocking Rule" value={selected.rule ?? '—'} />
                <Metric label="Decision Latency" value={`${(selected.decisionLatencyMs / 1000).toFixed(1)}s`} />
              </div>
              <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Reason</p>
                <p className="mt-1 leading-relaxed">{selected.reason}</p>
              </div>
              {selected.evidence.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Specialist Evidence</p>
                  <ul className="mt-1 space-y-1">
                    {selected.evidence.map((e) => <li key={e} className="text-muted-foreground">· {e}</li>)}
                  </ul>
                </div>
              )}
              {selected.lesson && (
                <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/[0.06] p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">Lesson Learned</p>
                  <p className="mt-1 leading-relaxed">{selected.lesson}</p>
                </div>
              )}
              <p className="font-mono text-[11px] text-muted-foreground">Recorded {fmtTime(selected.timestamp)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
