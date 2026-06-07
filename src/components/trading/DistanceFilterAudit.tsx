/**
 * Distance Filter Audit
 *
 * Investigates why the SMA Distance Filter is rejecting signals on BTC/XRP.
 * For every crossover that passed the HTF filter in the last 7 days we report:
 *
 *   • Timestamp + direction (LONG/SHORT)
 *   • Actual SMA distance (engine formula: |fast − slow| / price × 100)
 *   • Required threshold (config: minSmaDistancePercent)
 *   • Pass/fail margin
 *
 * Summary stats:
 *   • Avg distance among rejected signals
 *   • Avg distance among accepted signals
 *   • Engine-vs-dashboard parity check (price-denominator vs slow-SMA-denominator)
 *   • Unit-mismatch sanity check (% vs decimal)
 *
 * Goal: decide whether the threshold is simply too strict or whether a
 * calculation bug is silently inflating/deflating the distance value.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Ruler, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fetchCandles } from '@/lib/marketData';
import { calculateSMASeries, detectCrossover, calculateSMADistance } from '@/lib/indicators';
import { useTradingContext } from '@/contexts/TradingContext';
import { Asset, Candle } from '@/types/trading';
import { cn } from '@/lib/utils';

const AUDIT_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const LOOKBACK_DAYS = 7;
const LTF = '15m';
const HTF = '1h';
const LTF_LIMIT = 7 * 24 * 4 + 60;
const HTF_LIMIT = 7 * 24 + 50;

interface AuditRow {
  ts: number;
  side: 'LONG' | 'SHORT';
  /** Engine formula: |fast − slow| / price × 100  */
  distEnginePct: number;
  /** Dashboard formula used in SignalPathDiagnostics: |fast − slow| / slow × 100 */
  distDashPct: number;
  threshold: number;
  margin: number; // engine − threshold (negative = rejected)
  rejected: boolean;
  price: number;
  fast: number;
  slow: number;
}

interface AssetAudit {
  asset: Asset;
  rows: AuditRow[];
  rejected: AuditRow[];
  accepted: AuditRow[];
  avgRejected: number | null;
  avgAccepted: number | null;
  maxParityDelta: number; // largest |engine − dashboard| in pp
  unitMismatch: boolean;  // true if any distance value > 100 or < 0 (impossible as %)
}

function buildAudit(
  asset: Asset,
  ltf: Candle[],
  htf: Candle[],
  fastP: number,
  slowP: number,
  threshold: number,
  windowStart: number,
): AssetAudit {
  const rows: AuditRow[] = [];
  if (ltf.length < slowP + 2 || htf.length < slowP + 2) {
    return {
      asset, rows, rejected: [], accepted: [],
      avgRejected: null, avgAccepted: null, maxParityDelta: 0, unitMismatch: false,
    };
  }

  const fastSer = calculateSMASeries(ltf, fastP);
  const slowSer = calculateSMASeries(ltf, slowP);
  const htfFast = calculateSMASeries(htf, fastP);
  const htfSlow = calculateSMASeries(htf, slowP);

  for (let i = slowP + 1; i < ltf.length - 1; i++) {
    const c = ltf[i];
    if (c.timestamp < windowStart) continue;

    const cross = detectCrossover(fastSer[i], slowSer[i], fastSer[i - 1], slowSer[i - 1]);
    if (cross === 0) continue;

    // HTF gate — only include signals that PASSED HTF (matches Diagnostics).
    let lo = 0, hi = htf.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (htf[mid].timestamp <= c.timestamp) { best = mid; lo = mid + 1; } else hi = mid - 1;
    }
    if (best < 0) continue;
    const hf = htfFast[best], hs = htfSlow[best];
    const bullish = hf !== null && hs !== null && hf > hs;
    const bearish = hf !== null && hs !== null && hf < hs;
    const htfOK = (cross === 1 && bullish) || (cross === -1 && bearish);
    if (!htfOK) continue;

    const f = fastSer[i] as number;
    const s = slowSer[i] as number;
    const price = c.close;

    // Engine formula — exactly what runFilters → checkSMADistanceFilter calls.
    const distEngine = calculateSMADistance(ltf.slice(0, i + 1), fastP, slowP) ?? 0;
    // Dashboard formula used inside SignalPathDiagnostics waterfall.
    const distDash = Math.abs((f - s) / s) * 100;

    const rejected = distEngine < threshold;
    rows.push({
      ts: c.timestamp,
      side: cross === 1 ? 'LONG' : 'SHORT',
      distEnginePct: distEngine,
      distDashPct: distDash,
      threshold,
      margin: distEngine - threshold,
      rejected,
      price, fast: f, slow: s,
    });
  }

  const rejected = rows.filter(r => r.rejected);
  const accepted = rows.filter(r => !r.rejected);
  const avg = (xs: AuditRow[]) =>
    xs.length === 0 ? null : xs.reduce((a, r) => a + r.distEnginePct, 0) / xs.length;

  const maxParityDelta = rows.reduce(
    (m, r) => Math.max(m, Math.abs(r.distEnginePct - r.distDashPct)), 0,
  );
  const unitMismatch = rows.some(r =>
    r.distEnginePct < 0 || r.distEnginePct > 100 ||
    r.distDashPct   < 0 || r.distDashPct   > 100,
  );

  return {
    asset, rows, rejected, accepted,
    avgRejected: avg(rejected),
    avgAccepted: avg(accepted),
    maxParityDelta,
    unitMismatch,
  };
}

export function DistanceFilterAudit() {
  const { strategyConfig } = useTradingContext();
  const [ltfByAsset, setLtfByAsset] = useState<Record<Asset, Candle[]>>({} as Record<Asset, Candle[]>);
  const [htfByAsset, setHtfByAsset] = useState<Record<Asset, Candle[]>>({} as Record<Asset, Candle[]>);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ltfRes, htfRes] = await Promise.all([
        Promise.all(AUDIT_ASSETS.map(a => fetchCandles(a, LTF, LTF_LIMIT))),
        Promise.all(AUDIT_ASSETS.map(a => fetchCandles(a, HTF, HTF_LIMIT))),
      ]);
      const ltf = {} as Record<Asset, Candle[]>;
      const htf = {} as Record<Asset, Candle[]>;
      AUDIT_ASSETS.forEach((a, i) => { ltf[a] = ltfRes[i]; htf[a] = htfRes[i]; });
      setLtfByAsset(ltf); setHtfByAsset(htf); setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const windowStart = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const threshold = strategyConfig.filters.minSmaDistancePercent;

  const audits = useMemo<AssetAudit[]>(() => AUDIT_ASSETS.map(a =>
    buildAudit(
      a,
      ltfByAsset[a] ?? [],
      htfByAsset[a] ?? [],
      strategyConfig.fastSMA,
      strategyConfig.slowSMA,
      threshold,
      windowStart,
    ),
  ), [ltfByAsset, htfByAsset, strategyConfig, threshold, windowStart]);

  const anyParityDrift = audits.some(a => a.maxParityDelta > 0.05); // > 0.05pp
  const anyUnitMismatch = audits.some(a => a.unitMismatch);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" />
          Distance Filter Audit
          <Badge variant="outline" className="ml-2 text-[10px]">
            7d · threshold {threshold.toFixed(2)}%
          </Badge>
          <Button
            variant="ghost" size="sm"
            className="ml-auto h-7 text-xs gap-1"
            onClick={load} disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            {loading ? 'Loading…' : 'Re-run'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Integrity checks */}
        <div className="grid gap-2 md:grid-cols-2">
          <IntegrityRow
            ok={!anyParityDrift}
            label="Dashboard ↔ engine distance parity"
            detail={
              anyParityDrift
                ? `Mismatch up to ${Math.max(...audits.map(a => a.maxParityDelta)).toFixed(3)}pp — dashboard uses |Δ|/slowSMA, engine uses |Δ|/price.`
                : 'Engine and dashboard formulas agree within 0.05pp.'
            }
          />
          <IntegrityRow
            ok={!anyUnitMismatch}
            label="Unit check (% vs decimal)"
            detail={
              anyUnitMismatch
                ? 'Out-of-range value detected — possible decimal/percent mismatch.'
                : 'All distances within plausible percentage range (0–100%).'
            }
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {audits.map(a => (
            <AssetAuditView key={a.asset} audit={a} loading={loading} />
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground">
          Verdict: if avg rejected distance is close to threshold the filter is borderline
          (consider lowering); if rejected and accepted distributions barely differ the
          threshold is too strict for current volatility; large engine/dashboard delta
          indicates a calculation bug.
          {lastRun && <> Last run {new Date(lastRun).toLocaleTimeString()}.</>}
        </p>
      </CardContent>
    </Card>
  );
}

function IntegrityRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={cn(
      'rounded-md border p-2 flex items-start gap-2',
      ok ? 'border-trading-profit/30 bg-trading-profit/5' : 'border-trading-warning/40 bg-trading-warning/5',
    )}>
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-trading-profit mt-0.5" />
        : <AlertTriangle className="h-4 w-4 text-trading-warning mt-0.5" />}
      <div className="space-y-0.5">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground leading-snug">{detail}</div>
      </div>
    </div>
  );
}

function AssetAuditView({ audit, loading }: { audit: AssetAudit; loading: boolean }) {
  const { asset, rows, rejected, accepted, avgRejected, avgAccepted } = audit;
  const total = rows.length;

  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{asset}</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <Badge variant="outline">HTF-passed: {total}</Badge>
          <Badge variant="outline" className="border-destructive/40 text-destructive">
            Rejected: {rejected.length}
          </Badge>
          <Badge variant="outline" className="border-trading-profit/40 text-trading-profit">
            Accepted: {accepted.length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Avg rejected distance"
              value={avgRejected !== null ? `${avgRejected.toFixed(3)}%` : '—'}
              tone="warn" />
        <Stat label="Avg accepted distance"
              value={avgAccepted !== null ? `${avgAccepted.toFixed(3)}%` : '—'}
              tone="good" />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          Rejected signals (engine formula)
        </div>
        <ScrollArea className="h-[220px] pr-2">
          {loading && rejected.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4">Loading…</p>
          ) : rejected.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-4">No distance-filter rejections in window.</p>
          ) : (
            <table className="w-full text-[11px] font-mono tabular-nums">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1 pr-2 font-normal">When</th>
                  <th className="py-1 pr-2 font-normal">Side</th>
                  <th className="py-1 pr-2 font-normal text-right">Dist%</th>
                  <th className="py-1 pr-2 font-normal text-right">Need</th>
                  <th className="py-1 font-normal text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rejected.map(r => (
                  <tr key={r.ts} className="border-t border-border/30">
                    <td className="py-1 pr-2">{format(new Date(r.ts), 'MM/dd HH:mm')}</td>
                    <td className="py-1 pr-2">
                      <span className={r.side === 'LONG' ? 'text-trading-profit' : 'text-trading-loss'}>
                        {r.side}
                      </span>
                    </td>
                    <td className="py-1 pr-2 text-right">{r.distEnginePct.toFixed(3)}</td>
                    <td className="py-1 pr-2 text-right text-muted-foreground">{r.threshold.toFixed(2)}</td>
                    <td className={cn(
                      'py-1 text-right',
                      r.margin < 0 ? 'text-trading-loss' : 'text-trading-profit',
                    )}>
                      {r.margin >= 0 ? '+' : ''}{r.margin.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: {
  label: string; value: string; tone?: 'neutral' | 'good' | 'warn';
}) {
  const toneClass =
    tone === 'good' ? 'text-trading-profit' :
    tone === 'warn' ? 'text-trading-warning' : 'text-foreground';
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-semibold', toneClass)}>{value}</div>
    </div>
  );
}

export default DistanceFilterAudit;
