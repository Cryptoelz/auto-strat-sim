/**
 * Signal Path Diagnostics
 *
 * Full waterfall analysis of the live paper trading signal path for BTC & XRP
 * over the last 7 days, plus a live diagnostics widget driven by the in-app
 * decision log.
 *
 * Waterfall stages (per asset):
 *   Raw Signals → HTF Filter → Distance Filter → Confirmation →
 *   MPC (Market Participation Controller) → Governance → Executed Trades
 *
 * Goal: pinpoint exactly where signals are being suppressed so 0-trade
 * sessions can be diagnosed without guessing.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity, RefreshCw, ArrowDown, Filter, ShieldCheck, AlertTriangle,
  Search, Zap, Clock, CheckCircle2, XCircle, Hourglass,
} from 'lucide-react';
import { fetchCandles } from '@/lib/marketData';
import { calculateSMASeries, detectCrossover, calculateATRPercent } from '@/lib/indicators';
import { useTradingContext } from '@/contexts/TradingContext';
import { computeParticipation } from '@/lib/participationController';
import { Asset, Candle } from '@/types/trading';
import { cn } from '@/lib/utils';

const DIAG_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const LOOKBACK_DAYS = 7;
const LTF = '15m';
const HTF = '1h';
// 15m candles in 7d = 672 (+ buffer for SMA warmup)
const LTF_LIMIT = 7 * 24 * 4 + 60;
const HTF_LIMIT = 7 * 24 + 50;

type StageKey =
  | 'raw' | 'htf' | 'distance' | 'confirmation' | 'mpc' | 'governance' | 'executed';

interface StageRow {
  key: StageKey;
  label: string;
  count: number;
  blocked: number;
}

interface AssetWaterfall {
  asset: Asset;
  stages: StageRow[];
  topBlock: { stage: string; count: number } | null;
}

function emptyWaterfall(asset: Asset): AssetWaterfall {
  return {
    asset,
    stages: [
      { key: 'raw',          label: 'Raw Signals',     count: 0, blocked: 0 },
      { key: 'htf',          label: 'HTF Filter',      count: 0, blocked: 0 },
      { key: 'distance',     label: 'Distance Filter', count: 0, blocked: 0 },
      { key: 'confirmation', label: 'Confirmation',    count: 0, blocked: 0 },
      { key: 'mpc',          label: 'MPC',             count: 0, blocked: 0 },
      { key: 'governance',   label: 'Governance',      count: 0, blocked: 0 },
      { key: 'executed',     label: 'Executed Trades', count: 0, blocked: 0 },
    ],
    topBlock: null,
  };
}

/** Pure-data waterfall computation for one asset. */
function computeWaterfall(
  asset: Asset,
  ltf: Candle[],
  htf: Candle[],
  cfg: {
    fastSMA: number; slowSMA: number;
    minDistancePct: number; atrThreshold: number; atrPeriod: number;
  },
  gates: { mpcAllow: boolean; governanceAllow: boolean },
  executedCount: number,
  windowStart: number,
): AssetWaterfall {
  const wf = emptyWaterfall(asset);
  if (ltf.length < cfg.slowSMA + 2 || htf.length < cfg.slowSMA + 2) return wf;

  const fast = calculateSMASeries(ltf, cfg.fastSMA);
  const slow = calculateSMASeries(ltf, cfg.slowSMA);
  const htfFast = calculateSMASeries(htf, cfg.fastSMA);
  const htfSlow = calculateSMASeries(htf, cfg.slowSMA);

  let raw = 0, afterHTF = 0, afterDist = 0, afterConf = 0;

  for (let i = cfg.slowSMA + 1; i < ltf.length - 1; i++) {
    const c = ltf[i];
    if (c.timestamp < windowStart) continue;

    const cross = detectCrossover(fast[i], slow[i], fast[i - 1], slow[i - 1]);
    if (cross === 0) continue;
    raw++;

    // ---- HTF filter: find nearest HTF candle at-or-before this candle.
    const htfIdx = (() => {
      // binary-ish scan; candles are sorted by ts
      let lo = 0, hi = htf.length - 1, best = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (htf[mid].timestamp <= c.timestamp) { best = mid; lo = mid + 1; }
        else hi = mid - 1;
      }
      return best;
    })();
    if (htfIdx < 0) continue;
    const hf = htfFast[htfIdx], hs = htfSlow[htfIdx];
    const htfBullish = hf !== null && hs !== null && hf > hs;
    const htfBearish = hf !== null && hs !== null && hf < hs;
    const htfOK = (cross === 1 && htfBullish) || (cross === -1 && htfBearish);
    if (!htfOK) continue;
    afterHTF++;

    // ---- SMA distance filter.
    const f = fast[i] as number, s = slow[i] as number;
    const distPct = Math.abs((f - s) / s) * 100;
    if (distPct < cfg.minDistancePct) continue;
    afterDist++;

    // ---- 1-candle confirmation: next closed candle continues in direction
    //      AND volatility (ATR%) is above threshold at confirmation.
    const next = ltf[i + 1];
    const confirmsDir =
      (cross === 1 && next.close >= c.close) ||
      (cross === -1 && next.close <= c.close);
    const atrPctNext = calculateATRPercent(ltf.slice(0, i + 2), cfg.atrPeriod);
    const volOK = atrPctNext !== null && atrPctNext >= cfg.atrThreshold;
    if (!confirmsDir || !volOK) continue;
    afterConf++;
  }

  // Live gate snapshots (apply uniformly to confirmed signals — diagnostic view).
  const afterMPC = gates.mpcAllow ? afterConf : 0;
  const afterGov = gates.governanceAllow ? afterMPC : 0;

  wf.stages[0].count = raw;
  wf.stages[1].count = afterHTF;       wf.stages[1].blocked = raw - afterHTF;
  wf.stages[2].count = afterDist;      wf.stages[2].blocked = afterHTF - afterDist;
  wf.stages[3].count = afterConf;      wf.stages[3].blocked = afterDist - afterConf;
  wf.stages[4].count = afterMPC;       wf.stages[4].blocked = afterConf - afterMPC;
  wf.stages[5].count = afterGov;       wf.stages[5].blocked = afterMPC - afterGov;
  wf.stages[6].count = executedCount;  wf.stages[6].blocked = Math.max(0, afterGov - executedCount);

  // Identify dominant blocker.
  let top: { stage: string; count: number } | null = null;
  for (let k = 1; k < wf.stages.length; k++) {
    const st = wf.stages[k];
    if (st.blocked > 0 && (!top || st.blocked > top.count)) {
      top = { stage: st.label, count: st.blocked };
    }
  }
  wf.topBlock = top;

  return wf;
}

export function SignalPathDiagnostics() {
  const ctx = useTradingContext();
  const { strategyConfig, state, governanceConfig, decisionLog, blockedSignals, pendingCrossovers, signalConfirmStats } = ctx;

  const [ltfByAsset, setLtfByAsset] = useState<Record<Asset, Candle[]>>({} as any);
  const [htfByAsset, setHtfByAsset] = useState<Record<Asset, Candle[]>>({} as any);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ltfRes, htfRes] = await Promise.all([
        Promise.all(DIAG_ASSETS.map(a => fetchCandles(a, LTF, LTF_LIMIT))),
        Promise.all(DIAG_ASSETS.map(a => fetchCandles(a, HTF, HTF_LIMIT))),
      ]);
      const ltf: Record<Asset, Candle[]> = {} as any;
      const htf: Record<Asset, Candle[]> = {} as any;
      DIAG_ASSETS.forEach((a, i) => { ltf[a] = ltfRes[i]; htf[a] = htfRes[i]; });
      setLtfByAsset(ltf); setHtfByAsset(htf); setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Live-gate snapshots (used by the historical waterfall MPC/Governance stages).
  const mpcAllow = useMemo(() => {
    const part = computeParticipation({
      rollingProfitFactor: 1.0,
      regimeStability: 60,
      volatilityQuality: 60,
      signalRejectionRate: 0.4,
      tradeQuality: 60,
      drawdownPressure: 20,
      convictionAverage: 60,
      sampleSize: Math.min(state.trades.length, 30),
    });
    return part.riskMode !== 'preservation' && part.participationMultiplier >= 0.5;
  }, [state.trades.length]);

  const governanceAllow = useMemo(() => {
    if (governanceConfig.enabled === false) return true;
    return !state.isPaused;
  }, [governanceConfig.enabled, state.isPaused]);

  const windowStart = Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

  const waterfalls = useMemo<AssetWaterfall[]>(() => {
    return DIAG_ASSETS.map((asset) => {
      const ltf = ltfByAsset[asset] ?? [];
      const htf = htfByAsset[asset] ?? [];
      const executedCount = state.trades.filter(
        t => t.asset === asset && t.entryTime >= windowStart,
      ).length;
      return computeWaterfall(asset, ltf, htf, {
        fastSMA: strategyConfig.fastSMA,
        slowSMA: strategyConfig.slowSMA,
        minDistancePct: strategyConfig.filters.minSmaDistancePercent,
        atrThreshold: strategyConfig.filters.atrThreshold,
        atrPeriod: strategyConfig.filters.atrPeriod,
      }, { mpcAllow, governanceAllow }, executedCount, windowStart);
    });
  }, [ltfByAsset, htfByAsset, strategyConfig, state.trades, mpcAllow, governanceAllow, windowStart]);

  // Live widget figures (from in-session decision log).
  const live = useMemo(() => {
    const executed = decisionLog.filter(e =>
      e.action === 'opened_long' || e.action === 'opened_short' || e.action === 'flipped'
    ).length;
    const blocked = blockedSignals.length;
    const raw = executed + blocked;
    const byReason = new Map<string, number>();
    for (const b of blockedSignals) {
      const r = (b as { reason?: string }).reason ?? 'unknown';
      byReason.set(r, (byReason.get(r) ?? 0) + 1);
    }
    let topReason: { reason: string; count: number } | null = null;
    byReason.forEach((count, reason) => {
      if (!topReason || count > topReason.count) topReason = { reason, count };
    });
    return { raw, blocked, executed, topReason };
  }, [decisionLog, blockedSignals]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4 text-primary" />
          Signal Path Diagnostics
          <Badge variant="outline" className="ml-2 text-[10px]">7d · BTC + XRP</Badge>
          <Button
            variant="ghost" size="sm"
            className="ml-auto h-7 text-xs gap-1"
            onClick={loadHistory} disabled={loading}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            {loading ? 'Loading…' : 'Re-run'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Live diagnostics widget */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <LiveStat icon={Activity} label="Raw Signals (live)" value={live.raw} />
          <LiveStat icon={Filter} label="Blocked (live)" value={live.blocked} tone="warn" />
          <LiveStat icon={Zap} label="Executed (live)" value={live.executed} tone="good" />
          <LiveStat
            icon={AlertTriangle}
            label="Top Block Reason"
            value={live.topReason ? `${prettyReason(live.topReason.reason)} (${live.topReason.count})` : '—'}
            tone="warn"
            small
          />
        </div>

        {/* Distance-confirmation pipeline (post-crossover gate) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <LiveStat
            icon={Clock}
            label="Pending Crossovers"
            value={Object.values(pendingCrossovers).filter(Boolean).length}
          />
          <LiveStat
            icon={CheckCircle2}
            label="Dist. Confirmation Passed"
            value={signalConfirmStats.passed}
            tone="good"
          />
          <LiveStat
            icon={XCircle}
            label="Dist. Confirmation Failed"
            value={signalConfirmStats.failed}
            tone="warn"
          />
          <LiveStat
            icon={Hourglass}
            label="Expired Pending Signals"
            value={signalConfirmStats.expired}
            tone="warn"
          />
        </div>


        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Per-asset waterfalls */}
        <div className="grid gap-4 md:grid-cols-2">
          {waterfalls.map((wf) => (
            <WaterfallView key={wf.asset} wf={wf} loading={loading} />
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground">
          MPC / Governance stages are evaluated against the current live gate state — when
          either is closed it suppresses every confirmed signal in the window, surfacing
          why no trades fire even in healthy markets.
          {lastRun && <> Last run {new Date(lastRun).toLocaleTimeString()}.</>}
        </p>
      </CardContent>
    </Card>
  );
}

function LiveStat({
  icon: Icon, label, value, tone = 'neutral', small = false,
}: {
  icon: React.ElementType; label: string; value: string | number;
  tone?: 'neutral' | 'good' | 'warn'; small?: boolean;
}) {
  const toneClass =
    tone === 'good' ? 'text-trading-profit' :
    tone === 'warn' ? 'text-trading-warning' :
    'text-foreground';
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</span>
      </div>
      <div className={cn('font-semibold', small ? 'text-xs' : 'text-base', toneClass)}>
        {value}
      </div>
    </div>
  );
}

function WaterfallView({ wf, loading }: { wf: AssetWaterfall; loading: boolean }) {
  const max = wf.stages[0].count || 1;
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold">{wf.asset}</span>
        </div>
        {wf.topBlock ? (
          <Badge variant="outline" className="text-[10px] border-trading-warning/40 text-trading-warning">
            Biggest block: {wf.topBlock.stage} (−{wf.topBlock.count})
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">No blockers</Badge>
        )}
      </div>

      <div className="space-y-1.5">
        {wf.stages.map((s, idx) => (
          <div key={s.key}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {idx > 0 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                <span className={cn(s.key === 'executed' && 'font-semibold')}>{s.label}</span>
                {s.blocked > 0 && (
                  <span className="text-[10px] text-trading-warning">−{s.blocked}</span>
                )}
              </div>
              <span className={cn(
                'font-mono tabular-nums',
                s.key === 'executed' ? (s.count > 0 ? 'text-trading-profit' : 'text-trading-loss') : '',
              )}>
                {loading && wf.stages[0].count === 0 ? '…' : s.count}
              </span>
            </div>
            <Progress
              value={Math.min(100, (s.count / max) * 100)}
              className="h-1 mt-0.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function prettyReason(r: string): string {
  return r.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default SignalPathDiagnostics;
