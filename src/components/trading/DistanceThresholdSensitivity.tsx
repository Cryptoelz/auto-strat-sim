/**
 * Distance Threshold Sensitivity Analysis
 *
 * Re-runs the backtest engine across BTC + XRP for the last 30 days at 15m
 * candles with the SMA Distance filter swept across:
 *
 *   1.00% (current default) · 0.75% · 0.50% · 0.25% · 0.10%
 *
 * For each threshold we report:
 *   • trade count
 *   • win rate
 *   • profit factor
 *   • max drawdown (from running equity curve)
 *   • net PnL
 *
 * Goal: find the lowest threshold that produces meaningful participation
 * without significantly deteriorating PF, WR, or DD.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sliders, TrendingUp } from 'lucide-react';
import { fetchCandles } from '@/lib/marketData';
import { runBacktestSimulation } from '@/lib/backtest-engine';
import { useTradingContext } from '@/contexts/TradingContext';
import { Asset, Candle } from '@/types/trading';
import { BacktestTrade } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';

const ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const TIMEFRAME = '15m';
const LOOKBACK_DAYS = 30;
const CANDLE_LIMIT = LOOKBACK_DAYS * 24 * 4 + 60;
const INITIAL_BALANCE = 10_000;
const THRESHOLDS = [1.0, 0.75, 0.5, 0.25, 0.1];

interface ThresholdResult {
  threshold: number;
  trades: number;
  wins: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  netPnl: number;
}

function summarize(trades: BacktestTrade[], threshold: number): ThresholdResult {
  const sorted = [...trades].sort((a, b) => a.exitTime - b.exitTime);
  let equity = INITIAL_BALANCE * ASSETS.length; // aggregated starting equity
  let peak = equity;
  let maxDD = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let wins = 0;

  for (const t of sorted) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDD) maxDD = dd;
    if (t.pnl >= 0) { wins++; grossProfit += t.pnl; } else { grossLoss += Math.abs(t.pnl); }
  }

  const total = sorted.length;
  const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const netPnl = sorted.reduce((s, t) => s + t.pnl, 0);

  return {
    threshold,
    trades: total,
    wins,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    profitFactor: pf,
    maxDrawdownPct: maxDD,
    netPnl,
  };
}

export function DistanceThresholdSensitivity() {
  const { strategyConfig } = useTradingContext();
  const [candlesByAsset, setCandlesByAsset] = useState<Record<Asset, Candle[]>>({} as Record<Asset, Candle[]>);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const results = await Promise.all(ASSETS.map(a => fetchCandles(a, TIMEFRAME, CANDLE_LIMIT)));
      const map = {} as Record<Asset, Candle[]>;
      ASSETS.forEach((a, i) => { map[a] = results[i]; });
      setCandlesByAsset(map);
      setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load candles');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const results = useMemo<ThresholdResult[]>(() => {
    if (ASSETS.some(a => !candlesByAsset[a] || candlesByAsset[a].length < strategyConfig.slowSMA + 5)) {
      return [];
    }
    return THRESHOLDS.map(th => {
      const allTrades: BacktestTrade[] = [];
      for (const asset of ASSETS) {
        const res = runBacktestSimulation(
          candlesByAsset[asset],
          asset,
          {
            fastSMA: strategyConfig.fastSMA,
            slowSMA: strategyConfig.slowSMA,
            positionSizePercent: strategyConfig.positionSizePercent,
            stopLossPercent: strategyConfig.stopLossPercent,
            takeProfitPercent: strategyConfig.takeProfitPercent,
            feePercent: strategyConfig.filters.feePercent ?? 0.1,
            enableFilters: true,
            atrPeriod: strategyConfig.filters.atrPeriod,
            minAtrPercent: 0, // isolate distance filter effect
            minSmaDistancePercent: th,
            cooldownCandles: 0,
            maxDailyLossPercent: 0,
            maxConsecutiveLosses: 0,
          },
          INITIAL_BALANCE,
        );
        allTrades.push(...res.trades);
      }
      return summarize(allTrades, th);
    });
  }, [candlesByAsset, strategyConfig]);

  // Highlight the lowest threshold that keeps PF ≥ 90% of best PF and DD within +20% of best DD.
  const recommended = useMemo(() => {
    if (results.length === 0) return null;
    const eligible = results.filter(r => r.trades >= 5 && r.profitFactor > 0);
    if (eligible.length === 0) return null;
    const bestPF = Math.max(...eligible.map(r => isFinite(r.profitFactor) ? r.profitFactor : 0));
    const bestDD = Math.min(...eligible.map(r => r.maxDrawdownPct));
    const candidates = eligible.filter(r =>
      (isFinite(r.profitFactor) ? r.profitFactor : 0) >= bestPF * 0.9 &&
      r.maxDrawdownPct <= bestDD * 1.2 + 0.5,
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((min, r) => r.threshold < min.threshold ? r : min);
  }, [results]);

  const currentThreshold = strategyConfig.filters.minSmaDistancePercent;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          Distance Threshold Sensitivity
          <Badge variant="outline" className="ml-2 text-[10px]">
            BTC + XRP · {LOOKBACK_DAYS}d · {TIMEFRAME}
          </Badge>
          <Button
            variant="ghost" size="sm"
            className="ml-auto h-7 text-xs gap-1"
            onClick={load} disabled={loading}
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

        {results.length === 0 && !error ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {loading ? 'Loading candles and running 5 backtests…' : 'Insufficient candle history.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono tabular-nums">
              <thead className="text-muted-foreground">
                <tr className="text-left border-b border-border/40">
                  <th className="py-2 pr-3 font-normal">Threshold</th>
                  <th className="py-2 pr-3 font-normal text-right">Trades</th>
                  <th className="py-2 pr-3 font-normal text-right">WR</th>
                  <th className="py-2 pr-3 font-normal text-right">PF</th>
                  <th className="py-2 pr-3 font-normal text-right">DD</th>
                  <th className="py-2 font-normal text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const isCurrent = Math.abs(r.threshold - currentThreshold) < 1e-6;
                  const isRecommended = recommended && r.threshold === recommended.threshold;
                  return (
                    <tr
                      key={r.threshold}
                      className={cn(
                        'border-b border-border/20',
                        isRecommended && 'bg-trading-profit/10',
                        isCurrent && !isRecommended && 'bg-primary/5',
                      )}
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{r.threshold.toFixed(2)}%</span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/40 text-primary">
                              current
                            </Badge>
                          )}
                          {isRecommended && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-trading-profit/50 text-trading-profit">
                              suggested
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right">{r.trades}</td>
                      <td className={cn(
                        'py-2 pr-3 text-right',
                        r.winRate >= 50 ? 'text-trading-profit' : 'text-trading-loss',
                      )}>
                        {r.trades > 0 ? `${r.winRate.toFixed(1)}%` : '—'}
                      </td>
                      <td className={cn(
                        'py-2 pr-3 text-right',
                        r.profitFactor >= 1.5 ? 'text-trading-profit' :
                        r.profitFactor >= 1 ? 'text-foreground' : 'text-trading-loss',
                      )}>
                        {r.trades === 0 ? '—' : !isFinite(r.profitFactor) ? '∞' : r.profitFactor.toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 text-right text-trading-loss">
                        {r.trades > 0 ? `${r.maxDrawdownPct.toFixed(2)}%` : '—'}
                      </td>
                      <td className={cn(
                        'py-2 text-right font-semibold',
                        r.netPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss',
                      )}>
                        {r.trades > 0 ? `${r.netPnl >= 0 ? '+' : ''}${formatCurrency(r.netPnl)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {recommended && (
          <div className="rounded-md border border-trading-profit/30 bg-trading-profit/5 p-3 flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-trading-profit mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <div className="font-medium text-trading-profit">
                Suggested threshold: {recommended.threshold.toFixed(2)}%
              </div>
              <div className="text-muted-foreground leading-snug">
                Lowest tested threshold that maintains profit factor within 10% of the best result
                and drawdown within ~20% of the best. Produces {recommended.trades} trades over the
                last {LOOKBACK_DAYS} days with WR {recommended.winRate.toFixed(1)}% and net PnL{' '}
                {recommended.netPnl >= 0 ? '+' : ''}{formatCurrency(recommended.netPnl)}.
              </div>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Engine formula: |fastSMA − slowSMA| / price × 100. Other filters (HTF trend, regime,
          consecutive losses) remain at current strategy settings; only ATR is held at 0 to
          isolate the distance filter's effect.
          {lastRun && <> Last run {new Date(lastRun).toLocaleTimeString()}.</>}
        </p>
      </CardContent>
    </Card>
  );
}

export default DistanceThresholdSensitivity;
