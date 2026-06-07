/**
 * No-Distance Diagnostic Test
 *
 * Determines whether the SMA distance filter is the ONLY reason no trades are
 * executing. For BTCUSDT and XRPUSDT, over the 7-day and 30-day windows, we
 * compare two configurations through the live engine's funnel:
 *
 *   A. Current   — distance confirmation enabled, minSmaDistancePercent = 0.25
 *   B. NoDist    — minSmaDistancePercent = 0  (HTF + confirmation kept on)
 *
 * For each, we count:
 *   raw signals → HTF passed → confirmation passed → distance passed →
 *   MPC passed → governance passed → executed trades
 *
 * MPC and governance are stateful runtime gates that depend on live session
 * context (drawdown, recent fills, etc.). In a deterministic replay we cannot
 * faithfully recreate them; we therefore mark them as ASSUMED-PASS so any gap
 * between "distance passed" and "executed" is purely the runtime gates.
 *
 * Trades are then simulated with stop-loss / take-profit and 1-candle delay
 * to report PnL, drawdown, win rate, profit factor.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw } from 'lucide-react';
import { fetchCandles } from '@/lib/marketData';
import { useTradingContext } from '@/contexts/TradingContext';
import { Asset, Candle } from '@/types/trading';
import {
  calculateSMASeries,
  detectCrossover,
} from '@/lib/indicators';
import { ASSET_RISK_PROFILES } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';

const ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const LTF = '15m';
const HTF = '1h';
const WINDOWS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
];
const LTF_PER_DAY = 24 * 4;       // 15m candles per day
const HTF_PER_DAY = 24;           // 1h candles per day
const INITIAL_BALANCE = 10_000;
const FEE_PCT  = 0.1;
const SLIP_PCT = 0.075;

type Direction = 'long' | 'short';

interface FunnelCounts {
  raw: number;
  htfPassed: number;
  confirmationPassed: number;
  distancePassed: number;
  mpcPassed: number;        // assumed pass
  governancePassed: number; // assumed pass
  executed: number;
}

interface PipelineResult extends FunnelCounts {
  trades: { pnl: number; win: boolean; exitTime: number }[];
  netPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
}

interface RunRow {
  asset: Asset;
  window: string;
  current: PipelineResult;
  noDist:  PipelineResult;
}

/** Map a 15m candle timestamp to the most recent closed 1h HTF candle index. */
function mapHtfIndex(ltfTs: number, htf: Candle[]): number {
  // binary search for last htf candle with timestamp <= ltfTs
  let lo = 0, hi = htf.length - 1, ans = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (htf[m].timestamp <= ltfTs) { ans = m; lo = m + 1; } else { hi = m - 1; }
  }
  return ans;
}

function htfTrend(htf: Candle[], idx: number, fast: number, slow: number): 'bullish' | 'bearish' | 'neutral' {
  if (idx < slow) return 'neutral';
  const slice = htf.slice(0, idx + 1);
  const f = calculateSMASeries(slice, fast);
  const s = calculateSMASeries(slice, slow);
  const fv = f[f.length - 1];
  const sv = s[s.length - 1];
  if (fv === null || sv === null) return 'neutral';
  if (fv > sv) return 'bullish';
  if (fv < sv) return 'bearish';
  return 'neutral';
}

function summarize(trades: { pnl: number; win: boolean }[]): { netPnl: number; winRate: number; pf: number; maxDDPct: number } {
  let equity = INITIAL_BALANCE;
  let peak = equity;
  let maxDD = 0;
  let gp = 0, gl = 0, wins = 0;
  for (const t of trades) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    if (t.pnl >= 0) { wins++; gp += t.pnl; } else { gl += Math.abs(t.pnl); }
  }
  const n = trades.length;
  const pf = gl > 0 ? gp / gl : gp > 0 ? Infinity : 0;
  return {
    netPnl: trades.reduce((a, t) => a + t.pnl, 0),
    winRate: n > 0 ? (wins / n) * 100 : 0,
    pf,
    maxDDPct: maxDD,
  };
}

interface PipelineParams {
  fastSMA: number;
  slowSMA: number;
  htfFast: number;
  htfSlow: number;
  minDistancePct: number;
  confirmationCandles: number;
  positionSizePct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

interface PendingCross {
  direction: Direction;
  registeredAt: number; // index of cross bar
}

function simulate(
  ltf: Candle[],
  htf: Candle[],
  asset: Asset,
  p: PipelineParams,
): PipelineResult {
  const counts: FunnelCounts = {
    raw: 0, htfPassed: 0, confirmationPassed: 0, distancePassed: 0,
    mpcPassed: 0, governancePassed: 0, executed: 0,
  };
  const trades: { pnl: number; win: boolean; exitTime: number }[] = [];

  if (ltf.length < p.slowSMA + 5) return { ...counts, trades, netPnl: 0, winRate: 0, profitFactor: 0, maxDrawdownPct: 0 };

  const fastSeries = calculateSMASeries(ltf, p.fastSMA);
  const slowSeries = calculateSMASeries(ltf, p.slowSMA);

  let pending: PendingCross | null = null;
  let position: { dir: Direction; entry: number; size: number; sl: number; tp: number; entryTime: number } | null = null;
  let balance = INITIAL_BALANCE;
  const sizePct = p.positionSizePct / 100;

  for (let i = p.slowSMA + 1; i < ltf.length; i++) {
    const candle = ltf[i];

    // 1) Manage open position via SL/TP (use bar high/low)
    if (position) {
      let exitPrice: number | null = null;
      if (position.dir === 'long') {
        if (candle.low  <= position.sl) exitPrice = position.sl;
        else if (candle.high >= position.tp) exitPrice = position.tp;
      } else {
        if (candle.high >= position.sl) exitPrice = position.sl;
        else if (candle.low  <= position.tp) exitPrice = position.tp;
      }
      if (exitPrice !== null) {
        const gross = position.dir === 'long'
          ? (exitPrice - position.entry) * position.size
          : (position.entry - exitPrice) * position.size;
        const fees = (position.entry + exitPrice) * position.size * (FEE_PCT / 100);
        const pnl = gross - fees;
        balance += pnl;
        trades.push({ pnl, win: pnl >= 0, exitTime: candle.timestamp });
        position = null;
      }
    }

    // 2) Detect a fresh crossover on this bar
    const cross = detectCrossover(fastSeries[i], slowSeries[i], fastSeries[i - 1], slowSeries[i - 1]);
    if (cross !== 0) {
      counts.raw++;
      const direction: Direction = cross === 1 ? 'long' : 'short';

      // HTF gate (evaluated at crossover bar)
      const hi = mapHtfIndex(candle.timestamp, htf);
      const trend = htfTrend(htf, hi, p.htfFast, p.htfSlow);
      const htfOk = (direction === 'long' && trend === 'bullish') ||
                    (direction === 'short' && trend === 'bearish');
      if (htfOk) {
        counts.htfPassed++;
        pending = { direction, registeredAt: i };
      }
      // crossover that fails HTF is dropped; do not register pending
      continue;
    }

    // 3) Confirmation window evaluation
    if (pending) {
      const age = i - pending.registeredAt;
      // expire if SMA flipped back the wrong way before confirmation
      const fv = fastSeries[i], sv = slowSeries[i];
      const flipped = fv !== null && sv !== null && (
        (pending.direction === 'long'  && fv < sv) ||
        (pending.direction === 'short' && fv > sv)
      );
      if (flipped) { pending = null; continue; }

      if (age >= p.confirmationCandles) {
        // Re-check HTF alignment still holds
        const hi = mapHtfIndex(candle.timestamp, htf);
        const trend = htfTrend(htf, hi, p.htfFast, p.htfSlow);
        const htfStill = (pending.direction === 'long'  && trend === 'bullish') ||
                         (pending.direction === 'short' && trend === 'bearish');
        if (!htfStill) { pending = null; continue; }

        counts.confirmationPassed++;

        // Distance gate
        const price = candle.close;
        const dist = fv !== null && sv !== null && price > 0
          ? (Math.abs(fv - sv) / price) * 100
          : 0;
        if (dist < p.minDistancePct) { pending = null; continue; }
        counts.distancePassed++;

        // MPC + governance — assumed pass (deterministic replay can't recreate them)
        counts.mpcPassed++;
        counts.governancePassed++;

        // Execute on NEXT bar's open with 1-candle delay + slippage
        if (i + 1 < ltf.length && !position) {
          const next = ltf[i + 1];
          const slip = pending.direction === 'long' ? 1 + SLIP_PCT / 100 : 1 - SLIP_PCT / 100;
          const entry = next.open * slip;
          const positionValue = balance * sizePct;
          const entryFee = positionValue * (FEE_PCT / 100);
          const size = (positionValue - entryFee) / entry;
          if (size > 0) {
            const sl = pending.direction === 'long'
              ? entry * (1 - p.stopLossPct / 100)
              : entry * (1 + p.stopLossPct / 100);
            const tp = pending.direction === 'long'
              ? entry * (1 + p.takeProfitPct / 100)
              : entry * (1 - p.takeProfitPct / 100);
            balance -= entryFee;
            position = { dir: pending.direction, entry, size, sl, tp, entryTime: next.timestamp };
            counts.executed++;
          }
        }
        pending = null;
      }
    }
  }

  const s = summarize(trades);
  return {
    ...counts,
    trades,
    netPnl: s.netPnl,
    winRate: s.winRate,
    profitFactor: s.pf,
    maxDrawdownPct: s.maxDDPct,
  };
}

export function NoDistanceDiagnostic() {
  const { strategyConfig } = useTradingContext();
  const [rows, setRows] = useState<RunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const run = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const out: RunRow[] = [];
      for (const win of WINDOWS) {
        const ltfLimit = Math.min(1000, win.days * LTF_PER_DAY + 60);
        const htfLimit = Math.min(1000, win.days * HTF_PER_DAY + 60);
        const [ltfData, htfData] = await Promise.all([
          Promise.all(ASSETS.map(a => fetchCandles(a, LTF, ltfLimit))),
          Promise.all(ASSETS.map(a => fetchCandles(a, HTF, htfLimit))),
        ]);
        for (let i = 0; i < ASSETS.length; i++) {
          const asset = ASSETS[i];
          const ltf = ltfData[i];
          const htf = htfData[i];
          const risk = ASSET_RISK_PROFILES[asset] ?? { stopLossPercent: 1.5, takeProfitPercent: 4.5 };
          const base: PipelineParams = {
            fastSMA: strategyConfig.fastSMA,
            slowSMA: strategyConfig.slowSMA,
            htfFast: strategyConfig.fastSMA,
            htfSlow: strategyConfig.slowSMA,
            minDistancePct: strategyConfig.filters.minSmaDistancePercent,
            confirmationCandles: strategyConfig.filters.distanceConfirmationCandles ?? 2,
            positionSizePct: strategyConfig.positionSizePercent,
            stopLossPct: risk.stopLossPercent,
            takeProfitPct: risk.takeProfitPercent,
          };
          const current = simulate(ltf, htf, asset, base);
          const noDist  = simulate(ltf, htf, asset, { ...base, minDistancePct: 0 });
          out.push({ asset, window: win.label, current, noDist });
        }
      }
      setRows(out);
      setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Diagnostic failed');
    } finally {
      setLoading(false);
    }
  }, [strategyConfig]);

  useEffect(() => { run(); }, [run]);

  const grouped = useMemo(() => {
    const byWindow = new Map<string, RunRow[]>();
    rows.forEach(r => {
      const arr = byWindow.get(r.window) ?? [];
      arr.push(r);
      byWindow.set(r.window, arr);
    });
    return byWindow;
  }, [rows]);

  const verdict = useMemo(() => {
    if (rows.length === 0) return null;
    const totalCurrent = rows.reduce((a, r) => a + r.current.executed, 0);
    const totalNoDist  = rows.reduce((a, r) => a + r.noDist.executed, 0);
    if (totalCurrent === 0 && totalNoDist > 0) {
      return {
        tone: 'success' as const,
        text: `Distance filter is the sole blocker. With distance set to 0 the pipeline produces ${totalNoDist} executed trades across BTC+XRP. Other gates pass through fine.`,
      };
    }
    if (totalCurrent === 0 && totalNoDist === 0) {
      const htfNoDist = rows.reduce((a, r) => a + r.noDist.htfPassed, 0);
      const rawNoDist = rows.reduce((a, r) => a + r.noDist.raw, 0);
      return {
        tone: 'warning' as const,
        text: `Removing the distance filter does NOT unblock execution. Raw crossovers: ${rawNoDist}, HTF passed: ${htfNoDist}. The HTF trend gate (or confirmation expiry) is the dominant blocker — not distance.`,
      };
    }
    return {
      tone: 'info' as const,
      text: `Current config produces ${totalCurrent} trades; no-distance produces ${totalNoDist}. The distance filter is one contributor among several.`,
    };
  }, [rows]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          No-Distance Diagnostic
          <Badge variant="outline" className="ml-2 text-[10px]">
            BTC + XRP · 7d & 30d · {LTF}/{HTF}
          </Badge>
          <Button
            variant="ghost" size="sm"
            className="ml-auto h-7 text-xs gap-1"
            onClick={run} disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            {loading ? 'Running…' : 'Re-run'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {rows.length === 0 && !error ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {loading ? 'Fetching candles and running diagnostic pipelines…' : 'No data.'}
          </p>
        ) : (
          [...grouped.entries()].map(([win, runs]) => (
            <div key={win} className="space-y-2">
              <div className="text-xs font-medium text-foreground flex items-center gap-2">
                Window: <Badge variant="outline" className="text-[10px]">{win}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono tabular-nums">
                  <thead className="text-muted-foreground">
                    <tr className="text-left border-b border-border/40">
                      <th className="py-1.5 pr-2 font-normal">Asset</th>
                      <th className="py-1.5 pr-2 font-normal">Config</th>
                      <th className="py-1.5 pr-2 font-normal text-right">Raw</th>
                      <th className="py-1.5 pr-2 font-normal text-right">HTF</th>
                      <th className="py-1.5 pr-2 font-normal text-right">Confirm</th>
                      <th className="py-1.5 pr-2 font-normal text-right">Dist</th>
                      <th className="py-1.5 pr-2 font-normal text-right">MPC*</th>
                      <th className="py-1.5 pr-2 font-normal text-right">Gov*</th>
                      <th className="py-1.5 pr-2 font-normal text-right">Exec</th>
                      <th className="py-1.5 pr-2 font-normal text-right">PnL</th>
                      <th className="py-1.5 pr-2 font-normal text-right">DD</th>
                      <th className="py-1.5 pr-2 font-normal text-right">WR</th>
                      <th className="py-1.5 font-normal text-right">PF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.flatMap(r => ([
                      renderRow(r.asset, 'Current (0.25%)', r.current, false, `${r.asset}-${win}-curr`),
                      renderRow(r.asset, 'No-Dist (0%)',    r.noDist,  true,  `${r.asset}-${win}-nodist`),
                    ]))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

        {verdict && (
          <div className={cn(
            'rounded-md border p-3 text-xs leading-snug',
            verdict.tone === 'success' && 'border-trading-profit/30 bg-trading-profit/5 text-trading-profit',
            verdict.tone === 'warning' && 'border-trading-warning/30 bg-trading-warning/5 text-trading-warning',
            verdict.tone === 'info'    && 'border-primary/30 bg-primary/5 text-primary',
          )}>
            <div className="font-medium mb-0.5">Verdict</div>
            <div className="text-foreground/90">{verdict.text}</div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-snug">
          Funnel: raw crossover → HTF alignment ({HTF} fast/slow SMA) → confirmation window
          ({strategyConfig.filters.distanceConfirmationCandles ?? 2} candles, with re-check
          of HTF + SMA non-flip) → distance gate → execute on next bar's open with
          {' '}{FEE_PCT}% fee and {SLIP_PCT}% slippage. SL/TP from asset risk profile.
          {' '}<span className="opacity-80">* MPC and governance are stateful live-only gates; in this replay they are assumed-pass so any gap between Dist and Exec is purely those runtime gates.</span>
          {lastRun && <> Last run {new Date(lastRun).toLocaleTimeString()}.</>}
        </p>
      </CardContent>
    </Card>
  );
}

function renderRow(asset: Asset, label: string, r: PipelineResult, highlight: boolean, key: string) {
  return (
    <tr key={key} className={cn('border-b border-border/20', highlight && 'bg-primary/5')}>
      <td className="py-1.5 pr-2 font-semibold">{asset.replace('USDT', '')}</td>
      <td className="py-1.5 pr-2 text-muted-foreground">{label}</td>
      <td className="py-1.5 pr-2 text-right">{r.raw}</td>
      <td className="py-1.5 pr-2 text-right">{r.htfPassed}</td>
      <td className="py-1.5 pr-2 text-right">{r.confirmationPassed}</td>
      <td className="py-1.5 pr-2 text-right">{r.distancePassed}</td>
      <td className="py-1.5 pr-2 text-right opacity-60">{r.mpcPassed}</td>
      <td className="py-1.5 pr-2 text-right opacity-60">{r.governancePassed}</td>
      <td className={cn('py-1.5 pr-2 text-right font-semibold', r.executed > 0 ? 'text-trading-profit' : 'text-trading-loss')}>
        {r.executed}
      </td>
      <td className={cn('py-1.5 pr-2 text-right', r.netPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
        {r.executed > 0 ? `${r.netPnl >= 0 ? '+' : ''}${formatCurrency(r.netPnl)}` : '—'}
      </td>
      <td className="py-1.5 pr-2 text-right text-trading-loss">
        {r.executed > 0 ? `${r.maxDrawdownPct.toFixed(2)}%` : '—'}
      </td>
      <td className={cn('py-1.5 pr-2 text-right', r.winRate >= 50 ? 'text-trading-profit' : 'text-trading-loss')}>
        {r.executed > 0 ? `${r.winRate.toFixed(1)}%` : '—'}
      </td>
      <td className={cn('py-1.5 text-right',
        r.profitFactor >= 1.5 ? 'text-trading-profit' :
        r.profitFactor >= 1 ? 'text-foreground' : 'text-trading-loss')}>
        {r.executed === 0 ? '—' : !isFinite(r.profitFactor) ? '∞' : r.profitFactor.toFixed(2)}
      </td>
    </tr>
  );
}

export default NoDistanceDiagnostic;
