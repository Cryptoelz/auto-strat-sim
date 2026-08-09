import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid,
  ExecStatusPill, ExecGovernanceFooter, ExecEmptyState, toExecStatus,
} from '@/components/executive/ExecUi';
import {
  ClipboardList, Search, History, Brain, Users, BarChart3, Filter,
  FileCheck2, Ban, Play, Pause, RotateCcw, ChevronRight, Link2, BookMarked,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import {
  tradeLibrary, reviewHeader, reviewStats, specialistPerformance, executiveSummary,
  ASSETS, SPECIALISTS, SPECIALIST_FAMILY, TRADE_REVIEW_FORBIDDEN, TRADE_REVIEW_VERSION,
  type TradeRecord,
} from '@/lib/tradeReview';

const OUTCOME_TONE = { win: 'healthy', loss: 'critical', scratch: 'watch' } as const;
const STATE_TONE = { pass: 'healthy', pending: 'watch', blocked: 'critical' } as const;

function Pct({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums text-trading-gold">{value}%</span>
      </div>
      <Progress value={value} className="mt-2 h-1.5" />
    </div>
  );
}

export default function TradeReviewCentre() {
  const all = useMemo(() => tradeLibrary(), []);

  const [query, setQuery] = useState('');
  const [asset, setAsset] = useState('all');
  const [outcome, setOutcome] = useState('all');
  const [specialist, setSpecialist] = useState('all');
  const [status, setStatus] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [maxRisk, setMaxRisk] = useState(4);
  const [memoryOnly, setMemoryOnly] = useState(false);
  const [since, setSince] = useState('');

  const trades = useMemo(
    () =>
      all.filter((t) => {
        if (asset !== 'all' && t.asset !== asset) return false;
        if (outcome !== 'all' && t.outcome !== outcome) return false;
        if (specialist !== 'all' && t.specialist !== specialist) return false;
        if (status !== 'all' && t.status !== status) return false;
        if (t.confidence < minConfidence) return false;
        if (t.risk > maxRisk) return false;
        if (memoryOnly && !t.memoryWritten) return false;
        if (since && t.date < since) return false;
        if (query) {
          const q = query.toLowerCase();
          if (!(`${t.id} ${t.asset} ${t.specialist} ${t.oracleExplanation}`.toLowerCase().includes(q))) return false;
        }
        return true;
      }),
    [all, asset, outcome, specialist, status, minConfidence, maxRisk, memoryOnly, since, query],
  );

  const [selectedId, setSelectedId] = useState(all[0]?.id ?? '');
  const selected: TradeRecord | undefined =
    trades.find((t) => t.id === selectedId) ?? trades[0];

  const header = useMemo(() => reviewHeader(all), [all]);
  const stats = useMemo(() => reviewStats(trades), [trades]);
  const families = useMemo(() => specialistPerformance(all), [all]);
  const summary = useMemo(() => executiveSummary(all), [all]);

  /* Executive replay of the selected trade's decision chain */
  const [replayStep, setReplayStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setReplayStep(0); setPlaying(false); }, [selected?.id]);
  useEffect(() => {
    if (!playing || !selected) return;
    const id = window.setInterval(() => {
      setReplayStep((s) => {
        if (s >= selected.timeline.length - 1) { setPlaying(false); return s; }
        return s + 1;
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, [playing, selected]);

  return (
    <OsPage
      title="Trade Review Centre™"
      subtitle="The institutional audit trail for every simulated trade — from research hypothesis through oracle reasoning, portfolio approval and risk review to permanent institutional memory."
      department="Review & Audit"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Trade Review Centre™' }]}
    >
      {/* 1 — Executive header */}
      <ExecMetricGrid cols={5}>
        <ExecMetric label="Total Trades Reviewed" value={header.totalReviewed} numeric={header.totalReviewed} hint="Simulated records under audit" />
        <ExecMetric label="Explainable Trades" value={`${header.explainablePct}%`} hint={`${header.explainable} of ${header.totalReviewed} fully reasoned`} status={toExecStatus(header.explainablePct >= 90 ? 'healthy' : 'watch')} />
        <ExecMetric label="Institutional Traceability" value={`${header.traceability}%`} hint="Evidence plus memory linkage" status={toExecStatus(header.traceability >= 85 ? 'healthy' : 'watch')} />
        <ExecMetric label="Average Confidence" value={`${header.avgConfidence}%`} hint="Across all reviewed decisions" />
        <ExecMetric label="Average Risk" value={`${header.avgRisk}%`} hint="Simulated equity at risk per trade" />
      </ExecMetricGrid>

      {/* 9 — Search & filters */}
      <ExecCard>
        <ExecCardHeader title="Search & Filters" icon={Filter} hint={`${trades.length} of ${all.length} records`} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trade, asset, specialist" className="h-8 pl-8 text-[12px]" aria-label="Search trades" />
          </label>
          <select value={asset} onChange={(e) => setAsset(e.target.value)} aria-label="Asset" className="h-8 rounded-md border border-border bg-background px-2 text-[12px]">
            <option value="all">All assets</option>
            {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} aria-label="Outcome" className="h-8 rounded-md border border-border bg-background px-2 text-[12px]">
            <option value="all">All outcomes</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="scratch">Stand aside</option>
          </select>
          <select value={specialist} onChange={(e) => setSpecialist(e.target.value)} aria-label="Specialist" className="h-8 rounded-md border border-border bg-background px-2 text-[12px]">
            <option value="all">All specialists</option>
            {SPECIALISTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Promotion status" className="h-8 rounded-md border border-border bg-background px-2 text-[12px]">
            <option value="all">All promotion states</option>
            <option value="research">Research</option>
            <option value="candidate">Candidate</option>
            <option value="promoted">Promoted</option>
            <option value="archived">Archived</option>
          </select>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            Min confidence
            <input type="range" min={0} max={95} value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="flex-1 accent-[hsl(var(--trading-gold))]" />
            <span className="w-8 font-mono tabular-nums text-foreground">{minConfidence}</span>
          </label>
          <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
            Max risk
            <input type="range" min={0.8} max={4} step={0.1} value={maxRisk} onChange={(e) => setMaxRisk(Number(e.target.value))} className="flex-1 accent-[hsl(var(--trading-gold))]" />
            <span className="w-8 font-mono tabular-nums text-foreground">{maxRisk}%</span>
          </label>
          <div className="flex items-center gap-3">
            <Input type="date" value={since} onChange={(e) => setSince(e.target.value)} aria-label="From date" className="h-8 text-[12px]" />
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground">
              <input type="checkbox" checked={memoryOnly} onChange={(e) => setMemoryOnly(e.target.checked)} className="accent-[hsl(var(--trading-gold))]" />
              Memory only
            </label>
          </div>
        </div>
      </ExecCard>

      {/* 2 — Trade library */}
      <ExecCard>
        <ExecCardHeader title="Trade Library" icon={ClipboardList} hint="Select a record to open its audit trail" />
        {trades.length === 0 ? (
          <ExecEmptyState icon={Search} title="No trades match these filters" description="Relax the confidence, risk or date filters to widen the audit sample." secondary="The library holds every simulated record; filters are presentation only." />
        ) : (
          <div className="exec-scroll max-h-[460px] overflow-auto rounded-lg border border-border/50">
            <table className="w-full text-[11.5px]">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr className="text-left uppercase tracking-[0.14em] text-[9.5px] text-muted-foreground">
                  {['Trade ID', 'Date', 'Asset', 'Decision', 'Result', 'Confidence', 'Specialist', 'Oracle', 'Portfolio', 'Status'].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-border/50 px-3 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      'cursor-pointer border-b border-border/30 transition-colors duration-150 hover:bg-trading-gold/5',
                      selected?.id === t.id && 'bg-trading-gold/10',
                    )}
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-trading-gold">{t.id}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-muted-foreground">{t.date}</td>
                    <td className="px-3 py-2 font-medium">{t.asset}</td>
                    <td className="px-3 py-2 uppercase tracking-wide text-muted-foreground">{t.decision}</td>
                    <td className="px-3 py-2"><ExecStatusPill status={toExecStatus(OUTCOME_TONE[t.outcome])} label={t.outcome === 'scratch' ? 'Stand aside' : t.outcome === 'win' ? 'Win' : 'Loss'} /></td>
                    <td className="px-3 py-2 font-mono tabular-nums">{t.confidence}%</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{t.specialist}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.oracleVerdict}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{t.portfolioVerdict}</td>
                    <td className="px-3 py-2 capitalize text-muted-foreground">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ExecCard>

      {selected && (
        <>
          {/* 3 + 5 — Timeline and executive replay */}
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <ExecCard>
              <ExecCardHeader
                title={`Trade Timeline · ${selected.id}`}
                icon={History}
                action={
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setPlaying((p) => !p)}>
                      {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? 'Pause' : 'Replay'}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => { setReplayStep(0); setPlaying(false); }}>
                      <RotateCcw className="h-3.5 w-3.5" /> Reset
                    </Button>
                  </div>
                }
              />
              <ol className="relative space-y-3 border-l border-trading-gold/25 pl-5">
                {selected.timeline.map((s, i) => (
                  <li
                    key={s.stage}
                    className={cn(
                      'relative transition-all duration-150',
                      i > replayStep ? 'opacity-35' : 'opacity-100',
                    )}
                  >
                    <span className={cn('absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full', i <= replayStep ? 'bg-trading-gold' : 'bg-border')} aria-hidden="true" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-foreground">{s.stage}</span>
                      <ExecStatusPill status={toExecStatus(STATE_TONE[s.state])} />
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{s.at}</span>
                      <Link to={s.route} className="exec-link inline-flex items-center gap-0.5 text-[10px] uppercase tracking-[0.14em] text-trading-gold">
                        Open <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <p className="exec-measure mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{s.summary}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-border/40 pt-3 text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                Executive replay · step {Math.min(replayStep + 1, selected.timeline.length)} of {selected.timeline.length}
              </p>
            </ExecCard>

            {/* 4 — Trade detail */}
            <ExecCard>
              <ExecCardHeader title="Trade Detail" icon={FileCheck2} hint={selected.status.toUpperCase()} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {[
                  ['Asset', selected.asset],
                  ['Decision', selected.decision.toUpperCase()],
                  ['Confidence', `${selected.confidence}%`],
                  ['Risk', `${selected.risk}%`],
                  ['Expected Return', `${selected.expectedReturn}%`],
                  ['Actual Return', `${selected.actualReturn > 0 ? '+' : ''}${selected.actualReturn}%`],
                  ['Drawdown', `${selected.drawdown}%`],
                  ['Duration', `${selected.durationHours}h`],
                  ['Specialist', selected.specialist],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{k}</p>
                    <p className="mt-1 font-mono text-[12.5px] tabular-nums text-foreground">{v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-4 border-t border-border/40 pt-4">
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Oracle Explanation</p>
                  <p className="exec-measure mt-1 text-[12px] leading-relaxed text-foreground">{selected.oracleExplanation}</p>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Supporting Evidence</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selected.evidence.map((e) => (
                      <Link key={e.label} to={e.route} className="exec-chip inline-flex items-center gap-1 border border-trading-gold/30 bg-trading-gold/5 text-[10.5px] text-trading-gold">
                        <Link2 className="h-3 w-3" /> {e.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Knowledge Objects</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selected.knowledgeObjects.map((k) => (
                      <span key={k} className="rounded-md border border-border/50 bg-muted/20 px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground">{k}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Memory Record</p>
                  <p className="exec-measure mt-1 text-[12px] leading-relaxed text-muted-foreground">{selected.memoryRecord}</p>
                </div>
              </div>
            </ExecCard>
          </div>

          {/* 6 — Institutional learning */}
          <ExecCard>
            <ExecCardHeader title="Institutional Learning" icon={Brain} hint={`Derived from ${selected.id}`} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Lessons Learned</p>
                <ul className="mt-1.5 space-y-1.5">
                  {selected.lessons.map((l, i) => (
                    <li key={i} className="text-[11.5px] leading-relaxed text-foreground">· {l}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Confidence Change</p>
                <p className={cn('mt-1.5 font-mono text-lg tabular-nums', selected.confidenceChange >= 0 ? 'text-exec-healthy' : 'text-exec-critical')}>
                  {selected.confidenceChange >= 0 ? '+' : ''}{selected.confidenceChange} pts
                </p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Recommendation Update</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{selected.recommendationUpdate}</p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Memory Written</p>
                <div className="mt-1.5"><ExecStatusPill status={toExecStatus(selected.memoryWritten ? 'healthy' : 'watch')} label={selected.memoryWritten ? 'Written' : 'Pending'} /></div>
                <Link to="/institution/memory" className="exec-link mt-2 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] text-trading-gold">
                  <BookMarked className="h-3 w-3" /> Institutional Memory
                </Link>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Promotion Effects</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{selected.promotionEffect}</p>
              </div>
            </div>
          </ExecCard>
        </>
      )}

      {/* 7 — Specialist performance */}
      <ExecCard>
        <ExecCardHeader title="Specialist Performance" icon={Users} hint="Momentum · Trend · Mean Reversion · Compression · Breakout · Allocation · Risk" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={families} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="family" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="winRate" name="Win rate %" radius={[4, 4, 0, 0]}>
                  {families.map((f) => (
                    <Cell key={f.family} fill={f.winRate >= 55 ? 'hsl(var(--trading-gold))' : 'hsl(var(--muted-foreground))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="exec-scroll overflow-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left uppercase tracking-[0.14em] text-[9.5px] text-muted-foreground">
                  {['Family', 'Trades', 'Win rate', 'Avg return', 'Avg conf.', 'Avg risk'].map((h) => (
                    <th key={h} className="border-b border-border/50 px-2 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.family} className="border-b border-border/30">
                    <td className="px-2 py-2 font-medium text-foreground">{f.family}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{f.trades}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-trading-gold">{f.winRate}%</td>
                    <td className={cn('px-2 py-2 font-mono tabular-nums', f.avgReturn >= 0 ? 'text-exec-healthy' : 'text-exec-critical')}>{f.avgReturn}%</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{f.avgConfidence}%</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{f.avgRisk}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExecCard>

      {/* 8 — Institutional statistics */}
      <ExecCard>
        <ExecCardHeader title="Institutional Statistics" icon={BarChart3} hint={`Current filter · ${trades.length} records`} />
        <ExecMetricGrid cols={4}>
          <ExecMetric label="Trades" value={stats.trades} size="sm" />
          <ExecMetric label="Win Rate" value={`${stats.winRate}%`} size="sm" status={toExecStatus(stats.winRate >= 55 ? 'healthy' : 'watch')} />
          <ExecMetric label="Average Confidence" value={`${stats.avgConfidence}%`} size="sm" />
          <ExecMetric label="Average Risk" value={`${stats.avgRisk}%`} size="sm" />
          <ExecMetric label="Average Holding Time" value={`${stats.avgHold}h`} size="sm" />
          <ExecMetric label="Largest Win" value={`+${stats.largestWin}%`} size="sm" status="healthy" />
          <ExecMetric label="Largest Loss" value={`${stats.largestLoss}%`} size="sm" status="critical" />
          <ExecMetric label="Consistency" value={`${stats.consistency}`} size="sm" hint="Return stability index" />
        </ExecMetricGrid>
      </ExecCard>

      {/* 10 — Executive summary */}
      <ExecCard>
        <ExecCardHeader title="Executive Summary" icon={FileCheck2} hint={TRADE_REVIEW_VERSION} />
        <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
          <div className="space-y-4">
            <Pct label="Institutional Traceability" value={summary.traceability} />
            <Pct label="Evidence Coverage" value={summary.evidenceCoverage} />
            <Pct label="Memory Coverage" value={summary.memoryCoverage} />
            <Pct label="Explainability" value={summary.explainability} />
          </div>
          <div className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.04] p-4">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-trading-gold">Recommendation</p>
            <p className="exec-measure mt-2 text-[13px] leading-relaxed text-foreground">{summary.recommendation}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Advisory only. Nothing on this page executes, modifies or approves anything — promotion remains a human decision taken in the{' '}
              <Link to="/decision-centre" className="exec-link text-trading-gold">Executive Decision Centre™</Link>.
            </p>
          </div>
        </div>
      </ExecCard>

      {/* Hard limits */}
      <ExecCard>
        <ExecCardHeader title="Hard Limits" icon={Ban} hint="Governance guarantees" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TRADE_REVIEW_FORBIDDEN.map((f) => (
            <div key={f} className="rounded-md border border-exec-critical/30 bg-exec-critical/5 px-3 py-2 text-[11.5px] text-muted-foreground">{f}</div>
          ))}
        </div>
      </ExecCard>

      <ExecGovernanceFooter badges={['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required']} />
    </OsPage>
  );
}
