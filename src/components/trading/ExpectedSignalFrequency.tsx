/**
 * Expected Signal Frequency
 *
 * Computes a historical 30-day baseline (per-day rates and average inter-event
 * spacing) for raw signals, HTF passes, confirmations, and executed trades, so
 * operators have a realistic expectation of how often the strategy should
 * trade. A healthy idle system should look like the baseline; only a large
 * negative drift indicates a real problem.
 *
 * Note: to stay within Binance's 1000-candle REST limit while covering a full
 * 30-day window, this baseline is computed on 1h candles (720 over 30d) +
 * 4h HTF candles. It is an approximation of the live strategy's evaluation
 * cadence — exact intraday rates on shorter timeframes will be proportionally
 * higher.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CalendarClock } from 'lucide-react';
import { fetchCandles } from '@/lib/marketData';
import { calculateSMASeries, detectCrossover, calculateATRPercent } from '@/lib/indicators';
import { useTradingContext } from '@/contexts/TradingContext';
import { Asset, Candle } from '@/types/trading';

const ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const LOOKBACK_DAYS = 30;
const LTF = '1h';
const HTF = '4h';
const LTF_LIMIT = 24 * LOOKBACK_DAYS + 60; // 720 + warmup
const HTF_LIMIT = 6 * LOOKBACK_DAYS + 30;  // 180 + warmup

interface Counts { raw: number; htf: number; confirmation: number; }

function computeCounts(
  ltf: Candle[],
  htf: Candle[],
  cfg: { fastSMA: number; slowSMA: number; atrThreshold: number; atrPeriod: number },
  windowStart: number,
): Counts {
  const out: Counts = { raw: 0, htf: 0, confirmation: 0 };
  if (ltf.length < cfg.slowSMA + 2 || htf.length < cfg.slowSMA + 2) return out;
  const fast = calculateSMASeries(ltf, cfg.fastSMA);
  const slow = calculateSMASeries(ltf, cfg.slowSMA);
  const htfFast = calculateSMASeries(htf, cfg.fastSMA);
  const htfSlow = calculateSMASeries(htf, cfg.slowSMA);

  for (let i = cfg.slowSMA + 1; i < ltf.length - 1; i++) {
    const c = ltf[i];
    if (c.timestamp < windowStart) continue;
    const cross = detectCrossover(fast[i], slow[i], fast[i - 1], slow[i - 1]);
    if (cross === 0) continue;
    out.raw++;

    // HTF lookup
    let lo = 0, hi = htf.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (htf[mid].timestamp <= c.timestamp) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0) continue;
    const hf = htfFast[best], hs = htfSlow[best];
    const htfOK = (cross === 1 && hf !== null && hs !== null && hf > hs)
      || (cross === -1 && hf !== null && hs !== null && hf < hs);
    if (!htfOK) continue;
    out.htf++;

    const next = ltf[i + 1];
    const confirmsDir = (cross === 1 && next.close >= c.close) || (cross === -1 && next.close <= c.close);
    const atrPctNext = calculateATRPercent(ltf.slice(0, i + 2), cfg.atrPeriod);
    const volOK = atrPctNext !== null && atrPctNext >= cfg.atrThreshold;
    if (confirmsDir && volOK) out.confirmation++;
  }
  return out;
}

function fmtRate(n: number) { return n.toFixed(n < 1 ? 2 : 1); }
function fmtHours(h: number | null) {
  if (h === null || !isFinite(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}

export function ExpectedSignalFrequency() {
  const { strategyConfig, state } = useTradingContext();
  const [byAsset, setByAsset] = useState<Record<Asset, Counts> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ltfRes, htfRes] = await Promise.all([
        Promise.all(ASSETS.map(a => fetchCandles(a, LTF, LTF_LIMIT))),
        Promise.all(ASSETS.map(a => fetchCandles(a, HTF, HTF_LIMIT))),
      ]);
      const windowStart = Date.now() - LOOKBACK_DAYS * 86400000;
      const result = {} as Record<Asset, Counts>;
      ASSETS.forEach((a, i) => {
        result[a] = computeCounts(ltfRes[i], htfRes[i], {
          fastSMA: strategyConfig.fastSMA,
          slowSMA: strategyConfig.slowSMA,
          atrThreshold: strategyConfig.filters.atrThreshold,
          atrPeriod: strategyConfig.filters.atrPeriod,
        }, windowStart);
      });
      setByAsset(result);
      setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally { setLoading(false); }
  }, [strategyConfig.fastSMA, strategyConfig.slowSMA, strategyConfig.filters.atrThreshold, strategyConfig.filters.atrPeriod]);

  useEffect(() => { load(); }, [load]);

  const totals = useMemo(() => {
    if (!byAsset) return null;
    const sum = { raw: 0, htf: 0, confirmation: 0 };
    ASSETS.forEach(a => {
      sum.raw += byAsset[a].raw;
      sum.htf += byAsset[a].htf;
      sum.confirmation += byAsset[a].confirmation;
    });
    const windowStart = Date.now() - LOOKBACK_DAYS * 86400000;
    const executed = state.trades.filter(t => t.entryTime >= windowStart).length;
    return { ...sum, executed };
  }, [byAsset, state.trades]);

  const perDay = totals && {
    raw: totals.raw / LOOKBACK_DAYS,
    htf: totals.htf / LOOKBACK_DAYS,
    confirmation: totals.confirmation / LOOKBACK_DAYS,
    executed: totals.executed / LOOKBACK_DAYS,
  };

  const hoursBetweenConf = perDay && perDay.confirmation > 0 ? 24 / perDay.confirmation : null;
  const hoursBetweenExec = perDay && perDay.executed > 0
    ? 24 / perDay.executed
    : (perDay && perDay.confirmation > 0 ? 24 / perDay.confirmation : null);

  return (
    <div className="rounded-md border bg-card/50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="h-4 w-4 text-primary" />
          Expected Signal Frequency
          <Badge variant="outline" className="text-[10px]">30D BASELINE · {LTF}/{HTF}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && <div className="text-xs text-destructive">{error}</div>}

      {!perDay && !error && (
        <div className="text-xs text-muted-foreground">Computing 30-day baseline…</div>
      )}

      {perDay && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <Stat label="Raw signals / day" value={fmtRate(perDay.raw)} />
            <Stat label="HTF passes / day" value={fmtRate(perDay.htf)} />
            <Stat label="Confirmations / day" value={fmtRate(perDay.confirmation)} />
            <Stat
              label="Executed trades / day"
              value={fmtRate(perDay.executed)}
              hint={perDay.executed === 0 ? 'no live trades in window' : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <Spacing label="Avg time between confirmed signals" value={fmtHours(hoursBetweenConf)} />
            <Spacing
              label="Avg time between executed trades"
              value={fmtHours(hoursBetweenExec)}
              hint={perDay.executed === 0 ? 'estimated from confirmations' : undefined}
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Based on the last {LOOKBACK_DAYS} days of {ASSETS.join(' + ')} on {LTF} candles
            (HTF {HTF}) with the current SMA / ATR settings. Use this to judge whether a
            quiet live session is normal or anomalous — long gaps between signals are expected
            with trend-following crossovers.
            {lastRun && <span> · Updated {new Date(lastRun).toLocaleTimeString()}</span>}
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded border bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function Spacing({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 pb-1">
      <span className="text-muted-foreground">{label}{hint ? ` (${hint})` : ''}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
