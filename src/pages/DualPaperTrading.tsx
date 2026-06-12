import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, RotateCcw, Trophy, Activity } from 'lucide-react';
import { StrategyId, STRATEGY_CONFIGS, StrategyState, useDualPaperTrading } from '@/hooks/useDualPaperTrading';
import { PaperChampionDashboard } from '@/components/trading/PaperChampionDashboard';

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(2)}`;
const fmtUsdAbs = (n: number) => `$${n.toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const fmtPctAbs = (n: number) => `${n.toFixed(2)}%`;

function metricsFor(s: StrategyState) {
  const trades = s.trades;
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const netPnl = s.equity - s.initialBalance;
  const returnPct = (netPnl / s.initialBalance) * 100;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  return {
    netPnl,
    returnPct,
    equity: s.equity,
    maxDd: s.maxDrawdownPct,
    pf,
    trades: trades.length,
    winRate,
  };
}

function StrategyCard({ id, state }: { id: StrategyId; state: StrategyState }) {
  const m = metricsFor(state);
  const cfg = STRATEGY_CONFIGS[id];
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{cfg.label}</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            SMA {cfg.smaFast}/{cfg.smaSlow}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {cfg.confirmationCandles}-candle confirmation · {cfg.distanceHardGate > 0 ? `distance ≥${cfg.distanceHardGate}%` : 'distance as conviction'}
          {cfg.htfAlignmentMin > 0 && ` · HTF ≥${cfg.htfAlignmentMin}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Equity" value={fmtUsdAbs(m.equity)} />
          <Stat label="Net PnL" value={fmtUsd(m.netPnl)} tone={m.netPnl >= 0 ? 'profit' : 'loss'} sub={fmtPct(m.returnPct)} />
          <Stat label="Max DD" value={fmtPctAbs(m.maxDd)} tone="loss" />
          <Stat label="Profit Factor" value={isFinite(m.pf) ? m.pf.toFixed(2) : '∞'} />
          <Stat label="Trades" value={String(m.trades)} sub={`WR ${m.winRate.toFixed(1)}%`} />
          <Stat label="Open Positions" value={String(Object.values(state.positions).filter(Boolean).length)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone?: 'profit' | 'loss'; sub?: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${tone === 'profit' ? 'text-trading-profit' : tone === 'loss' ? 'text-trading-loss' : ''}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-muted-foreground tabular-nums">{sub}</div>}
    </div>
  );
}

function ComparisonCard({ base, cand }: { base: ReturnType<typeof metricsFor>; cand: ReturnType<typeof metricsFor> }) {
  const diff = {
    return: cand.returnPct - base.returnPct,
    dd: cand.maxDd - base.maxDd,
    trades: cand.trades - base.trades,
    winRate: cand.winRate - base.winRate,
    pf: (isFinite(cand.pf) ? cand.pf : 0) - (isFinite(base.pf) ? base.pf : 0),
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Comparison — Candidate 25 vs Baseline v11</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead className="h-8 text-xs">Metric</TableHead><TableHead className="h-8 text-xs text-right">Difference</TableHead></TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            <Diff label="Return" value={fmtPct(diff.return)} good={diff.return >= 0} />
            <Diff label="Max Drawdown" value={`${diff.dd >= 0 ? '+' : ''}${diff.dd.toFixed(2)}pp`} good={diff.dd <= 0} />
            <Diff label="Trade Count" value={`${diff.trades >= 0 ? '+' : ''}${diff.trades}`} good={diff.trades >= 0} />
            <Diff label="Win Rate" value={`${diff.winRate >= 0 ? '+' : ''}${diff.winRate.toFixed(2)}pp`} good={diff.winRate >= 0} />
            <Diff label="Profit Factor" value={`${diff.pf >= 0 ? '+' : ''}${diff.pf.toFixed(2)}`} good={diff.pf >= 0} />
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Diff({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <TableRow>
      <TableCell className="py-1.5 font-medium">{label}</TableCell>
      <TableCell className={`py-1.5 text-right tabular-nums ${good ? 'text-trading-profit' : 'text-trading-loss'}`}>{value}</TableCell>
    </TableRow>
  );
}

// Paper Champion: awarded after ≥20 trades EACH and ≥30 days live.
// Score = 0.4 * PF + 0.4 * netPnl + 0.2 * (-DD), normalised across the two.
function paperChampion(
  base: ReturnType<typeof metricsFor>,
  cand: ReturnType<typeof metricsFor>,
  daysElapsed: number,
): { eligible: boolean; winner: 'baseline_v11' | 'candidate_25' | null; reason: string; baseScore: number; candScore: number } {
  const minTrades = Math.min(base.trades, cand.trades);
  if (daysElapsed < 30 || minTrades < 20) {
    return {
      eligible: false, winner: null,
      reason: `Need ≥30 days live and ≥20 trades per strategy (currently ${daysElapsed.toFixed(1)}d, min ${minTrades} trades).`,
      baseScore: 0, candScore: 0,
    };
  }
  const norm = (a: number, b: number) => {
    const max = Math.max(Math.abs(a), Math.abs(b), 1e-9);
    return [a / max, b / max] as const;
  };
  const [pfA, pfB] = norm(isFinite(base.pf) ? base.pf : 3, isFinite(cand.pf) ? cand.pf : 3);
  const [pnA, pnB] = norm(base.netPnl, cand.netPnl);
  const [ddA, ddB] = norm(-base.maxDd, -cand.maxDd); // lower DD is better → negate
  const baseScore = 0.4 * pfA + 0.4 * pnA + 0.2 * ddA;
  const candScore = 0.4 * pfB + 0.4 * pnB + 0.2 * ddB;
  const winner = candScore >= baseScore ? 'candidate_25' : 'baseline_v11';
  return {
    eligible: true,
    winner,
    reason: `Weighted score — PF 40% · Net PnL 40% · DD 20%. Baseline ${baseScore.toFixed(3)} vs Candidate ${candScore.toFixed(3)}.`,
    baseScore, candScore,
  };
}

export default function DualPaperTrading() {
  const { state, start, pause, reset } = useDualPaperTrading();

  const baseMetrics = useMemo(() => metricsFor(state.strategies.baseline_v11), [state]);
  const candMetrics = useMemo(() => metricsFor(state.strategies.candidate_25), [state]);
  const daysElapsed = state.startedAt ? (Date.now() - state.startedAt) / (1000 * 60 * 60 * 24) : 0;
  const champion = paperChampion(baseMetrics, candMetrics, daysElapsed);

  const allTrades = useMemo(() => {
    const merged = [
      ...state.strategies.baseline_v11.trades,
      ...state.strategies.candidate_25.trades,
    ].sort((a, b) => b.exitTs - a.exitTs);
    return merged.slice(0, 50);
  }, [state]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold sm:text-xl">Dual Paper Trading</h1>
          <p className="text-xs text-muted-foreground">
            Baseline v11 and Candidate 25 running on the same live market feed (BTC + XRP, 15m). Separate portfolios, trade logs, and risk tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.isRunning ? (
            <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30 gap-1">
              <Activity className="h-3 w-3 animate-pulse" /> Live
            </Badge>
          ) : (
            <Badge variant="outline">Paused</Badge>
          )}
          {!state.isRunning ? (
            <Button size="sm" onClick={start}><Play className="h-3.5 w-3.5 mr-1" />Start</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={pause}><Pause className="h-3.5 w-3.5 mr-1" />Pause</Button>
          )}
          <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="h-3.5 w-3.5 mr-1" />Reset</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StrategyCard id="baseline_v11" state={state.strategies.baseline_v11} />
        <StrategyCard id="candidate_25" state={state.strategies.candidate_25} />
      </div>

      <ComparisonCard base={baseMetrics} cand={candMetrics} />

      <PaperChampionDashboard state={state} />

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Trades</TabsTrigger>
          <TabsTrigger value="baseline">Baseline Log</TabsTrigger>
          <TabsTrigger value="candidate">Candidate Log</TabsTrigger>
        </TabsList>
        <TabsContent value="recent">
          <TradeTable trades={allTrades} />
        </TabsContent>
        <TabsContent value="baseline">
          <TradeTable trades={state.strategies.baseline_v11.trades.slice(-50).reverse()} />
        </TabsContent>
        <TabsContent value="candidate">
          <TradeTable trades={state.strategies.candidate_25.trades.slice(-50).reverse()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeTable({ trades }: { trades: { id: string; strategy: StrategyId; asset: string; side: string; entryTs: number; exitTs: number; entryPrice: number; exitPrice: number; pnl: number; pnlPct: number; reason: string }[] }) {
  if (trades.length === 0) {
    return <div className="text-xs text-muted-foreground p-6 text-center border rounded-lg">No trades yet. Start the session to begin paper trading.</div>;
  }
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">When</TableHead>
            <TableHead className="text-xs">Strategy</TableHead>
            <TableHead className="text-xs">Asset</TableHead>
            <TableHead className="text-xs">Side</TableHead>
            <TableHead className="text-xs text-right">Entry</TableHead>
            <TableHead className="text-xs text-right">Exit</TableHead>
            <TableHead className="text-xs text-right">PnL</TableHead>
            <TableHead className="text-xs">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="text-xs">
          {trades.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="tabular-nums">{new Date(t.exitTs).toLocaleString()}</TableCell>
              <TableCell>{STRATEGY_CONFIGS[t.strategy].label}</TableCell>
              <TableCell>{t.asset.replace('USDT', '')}</TableCell>
              <TableCell><Badge variant="outline" className="text-[10px]">{t.side}</Badge></TableCell>
              <TableCell className="text-right tabular-nums">{t.entryPrice.toFixed(2)}</TableCell>
              <TableCell className="text-right tabular-nums">{t.exitPrice.toFixed(2)}</TableCell>
              <TableCell className={`text-right tabular-nums ${t.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                {fmtUsd(t.pnl)} ({fmtPct(t.pnlPct)})
              </TableCell>
              <TableCell className="text-muted-foreground">{t.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
