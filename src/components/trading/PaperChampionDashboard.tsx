import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Circle, Trophy, Flag, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { DualState, STRATEGY_CONFIGS, StrategyId, StrategyState } from '@/hooks/useDualPaperTrading';

// ─────────────────────────────────────────────────────────────────────────────
// Paper Champion Dashboard
//
// Tracks days running, trades completed, current leader, deltas, milestones,
// and weekly snapshots so leadership changes over time can be observed
// instead of trusting a single end-of-period winner.
// ─────────────────────────────────────────────────────────────────────────────

type Snapshot = {
  ts: number;
  weekIndex: number;            // weeks since startedAt
  baseline: SnapMetrics;
  candidate: SnapMetrics;
  leader: StrategyId | 'tie';
};
type SnapMetrics = {
  trades: number;
  netPnl: number;
  maxDd: number;
  pf: number;
  winRate: number;
  score: number;                // weighted champion score
};

const SNAP_STORAGE_KEY = 'dual-paper-weekly-snapshots-v1';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function metricsOf(s: StrategyState): SnapMetrics {
  const wins = s.trades.filter((t) => t.pnl > 0);
  const losses = s.trades.filter((t) => t.pnl <= 0);
  const gp = wins.reduce((a, t) => a + t.pnl, 0);
  const gl = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const pf = gl > 0 ? gp / gl : gp > 0 ? Infinity : 0;
  const netPnl = s.equity - s.initialBalance;
  return {
    trades: s.trades.length,
    netPnl,
    maxDd: s.maxDrawdownPct,
    pf,
    winRate: s.trades.length > 0 ? (wins.length / s.trades.length) * 100 : 0,
    score: 0,
  };
}

// Weighted champion score: PF 40% + Net PnL 40% + (-DD) 20%, normalised pairwise.
function scoreAndLeader(b: SnapMetrics, c: SnapMetrics): { bs: number; cs: number; leader: StrategyId | 'tie' } {
  const norm = (a: number, x: number) => {
    const m = Math.max(Math.abs(a), Math.abs(x), 1e-9);
    return [a / m, x / m] as const;
  };
  const [pfA, pfB] = norm(isFinite(b.pf) ? b.pf : 3, isFinite(c.pf) ? c.pf : 3);
  const [pnA, pnB] = norm(b.netPnl, c.netPnl);
  const [ddA, ddB] = norm(-b.maxDd, -c.maxDd);
  const bs = 0.4 * pfA + 0.4 * pnA + 0.2 * ddA;
  const cs = 0.4 * pfB + 0.4 * pnB + 0.2 * ddB;
  const leader: StrategyId | 'tie' = Math.abs(bs - cs) < 1e-6 ? 'tie' : cs > bs ? 'candidate_25' : 'baseline_v11';
  return { bs, cs, leader };
}

function loadSnaps(): Snapshot[] {
  try { return JSON.parse(localStorage.getItem(SNAP_STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveSnaps(s: Snapshot[]) {
  try { localStorage.setItem(SNAP_STORAGE_KEY, JSON.stringify(s.slice(-52))); } catch { /* quota */ }
}

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export function PaperChampionDashboard({ state }: { state: DualState }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnaps);

  const base = useMemo(() => metricsOf(state.strategies.baseline_v11), [state]);
  const cand = useMemo(() => metricsOf(state.strategies.candidate_25), [state]);
  const { bs, cs, leader } = scoreAndLeader(base, cand);
  base.score = bs; cand.score = cs;

  const daysRunning = state.startedAt ? (Date.now() - state.startedAt) / (24 * 60 * 60 * 1000) : 0;
  const tradesCompleted = base.trades + cand.trades;
  const minTrades = Math.min(base.trades, cand.trades);
  const championDeclared = daysRunning >= 30 && minTrades >= 20;

  // Weekly snapshot capture
  useEffect(() => {
    if (!state.startedAt || !state.isRunning) return;
    const weekIndex = Math.floor((Date.now() - state.startedAt) / WEEK_MS);
    const last = snapshots[snapshots.length - 1];
    if (last && last.weekIndex >= weekIndex) return;
    const snap: Snapshot = {
      ts: Date.now(),
      weekIndex,
      baseline: base,
      candidate: cand,
      leader,
    };
    const next = [...snapshots, snap];
    setSnapshots(next);
    saveSnaps(next);
  }, [state.lastTickTs, state.startedAt, state.isRunning, base, cand, leader, snapshots]);

  // Leadership changes across snapshots
  const leadershipChanges = useMemo(() => {
    let changes = 0;
    for (let i = 1; i < snapshots.length; i++) {
      if (snapshots[i].leader !== snapshots[i - 1].leader && snapshots[i].leader !== 'tie' && snapshots[i - 1].leader !== 'tie') {
        changes += 1;
      }
    }
    return changes;
  }, [snapshots]);

  const milestones = [
    { key: 'first', label: 'First Trade', achieved: tradesCompleted >= 1 },
    { key: 't10', label: '10 Trades (per strategy)', achieved: minTrades >= 10 },
    { key: 't20', label: '20 Trades (per strategy)', achieved: minTrades >= 20 },
    { key: 'd30', label: '30 Days Live', achieved: daysRunning >= 30 },
    { key: 'champ', label: 'Champion Declared', achieved: championDeclared },
  ];

  const leaderLabel = leader === 'tie' ? 'Tie' : STRATEGY_CONFIGS[leader].label;
  const pfDiff = (isFinite(cand.pf) ? cand.pf : 0) - (isFinite(base.pf) ? base.pf : 0);
  const pnlDiff = cand.netPnl - base.netPnl;
  const ddDiff = cand.maxDd - base.maxDd;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Paper Champion Dashboard
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Live leadership tracking with weekly snapshots. Champion is only declared after 30 days and ≥20 trades per strategy.
            </CardDescription>
          </div>
          <Badge className={championDeclared
            ? 'bg-trading-profit/15 text-trading-profit border-trading-profit/30'
            : ''}
            variant={championDeclared ? 'default' : 'outline'}>
            {championDeclared ? `Champion: ${leaderLabel}` : `Current Leader: ${leaderLabel}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Top metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Stat label="Days Running" value={daysRunning.toFixed(1)} icon={Calendar} />
          <Stat label="Trades Completed" value={String(tradesCompleted)} sub={`min ${minTrades}/strategy`} />
          <Stat label="Leadership Changes" value={String(leadershipChanges)} sub={`${snapshots.length} weekly snapshots`} />
          <Stat label="PF Difference" value={`${pfDiff >= 0 ? '+' : ''}${pfDiff.toFixed(2)}`} tone={pfDiff >= 0 ? 'profit' : 'loss'} sub="C25 − Base" />
          <Stat label="PnL Difference" value={fmtUsd(pnlDiff)} tone={pnlDiff >= 0 ? 'profit' : 'loss'} sub="C25 − Base" />
          <Stat label="DD Difference" value={`${ddDiff >= 0 ? '+' : ''}${ddDiff.toFixed(2)}pp`} tone={ddDiff <= 0 ? 'profit' : 'loss'} sub="C25 − Base" />
        </div>

        {/* Milestones */}
        <div>
          <div className="text-xs font-semibold mb-2 flex items-center gap-1.5"><Flag className="h-3.5 w-3.5" /> Milestones</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {milestones.map((m) => (
              <div key={m.key} className={`rounded-md border px-2.5 py-2 text-xs flex items-center gap-2 ${m.achieved ? 'border-trading-profit/40 bg-trading-profit/5' : 'border-border/60 bg-card/30'}`}>
                {m.achieved
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit shrink-0" />
                  : <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <span className={m.achieved ? '' : 'text-muted-foreground'}>{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly snapshots */}
        <div>
          <div className="text-xs font-semibold mb-2">Weekly Snapshots</div>
          {snapshots.length === 0 ? (
            <div className="text-xs text-muted-foreground border rounded-md p-4 text-center">
              No snapshots yet. The first weekly snapshot is recorded after 7 days of live paper trading.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Week</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs text-right">Base PnL</TableHead>
                    <TableHead className="text-xs text-right">Base PF</TableHead>
                    <TableHead className="text-xs text-right">Base DD</TableHead>
                    <TableHead className="text-xs text-right">C25 PnL</TableHead>
                    <TableHead className="text-xs text-right">C25 PF</TableHead>
                    <TableHead className="text-xs text-right">C25 DD</TableHead>
                    <TableHead className="text-xs">Leader</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {snapshots.slice().reverse().map((s, i, arr) => {
                    const prev = arr[i + 1];
                    const changed = prev && prev.leader !== s.leader && s.leader !== 'tie' && prev.leader !== 'tie';
                    return (
                      <TableRow key={s.ts}>
                        <TableCell>W{s.weekIndex + 1}</TableCell>
                        <TableCell className="tabular-nums">{new Date(s.ts).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtUsd(s.baseline.netPnl)}</TableCell>
                        <TableCell className="text-right tabular-nums">{isFinite(s.baseline.pf) ? s.baseline.pf.toFixed(2) : '∞'}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.baseline.maxDd.toFixed(2)}%</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtUsd(s.candidate.netPnl)}</TableCell>
                        <TableCell className="text-right tabular-nums">{isFinite(s.candidate.pf) ? s.candidate.pf.toFixed(2) : '∞'}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.candidate.maxDd.toFixed(2)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span>{s.leader === 'tie' ? 'Tie' : STRATEGY_CONFIGS[s.leader].label}</span>
                            {changed && (
                              <Badge variant="outline" className="text-[9px] px-1 gap-0.5">
                                {s.leader === 'candidate_25' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                flip
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
          Weekly snapshots prevent lucky short-term streaks from biasing the champion decision. Watch for stable leadership across multiple weeks before promoting.
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub, tone, icon: Icon }: { label: string; value: string; sub?: string; tone?: 'profit' | 'loss'; icon?: React.ElementType }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}{label}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${tone === 'profit' ? 'text-trading-profit' : tone === 'loss' ? 'text-trading-loss' : ''}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}
