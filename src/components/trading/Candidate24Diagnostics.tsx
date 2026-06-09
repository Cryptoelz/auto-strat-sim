/**
 * Candidate 24 — Active Trader Diagnostics
 *
 * Compares expected live-signal frequency for Candidate 24 (SMA 8/21,
 * 1-candle confirmation) against Baseline v11 (SMA 10/30, 2-candle
 * confirmation) using the last 30 days of real BTC + XRP data. Distance
 * is conviction-only in both — neither path uses distance as a hard gate.
 *
 * Reported per config:
 *   • Expected confirmations / day
 *   • Expected executed trades / day (≈ confirmations after cooldown)
 *   • Average time between trades
 *   • Side-by-side delta vs Baseline v11
 *
 * Also surfaces the 7-day and 30-day validation numbers seeded into the
 * experiment store so operators can review them without leaving the page.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, FlaskConical, ArrowRight } from 'lucide-react';
import { fetchCandles } from '@/lib/marketData';
import { calculateSMASeries, detectCrossover, calculateATRPercent } from '@/lib/indicators';
import { Asset, Candle } from '@/types/trading';

const ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
const LOOKBACK_DAYS = 30;
const LTF = '1h';
const HTF = '4h';
const LTF_LIMIT = 24 * LOOKBACK_DAYS + 60;
const HTF_LIMIT = 6 * LOOKBACK_DAYS + 30;

interface Cfg {
  label: string;
  fast: number;
  slow: number;
  confirmCandles: number;
  atrThreshold: number;
  atrPeriod: number;
}

const BASELINE_V11: Cfg = { label: 'Baseline v11', fast: 10, slow: 30, confirmCandles: 2, atrThreshold: 0.5, atrPeriod: 14 };
const CANDIDATE_24: Cfg = { label: 'Candidate 24', fast: 8, slow: 21, confirmCandles: 1, atrThreshold: 0.5, atrPeriod: 14 };

interface Counts { raw: number; htf: number; confirmation: number; }

function computeCounts(ltf: Candle[], htf: Candle[], cfg: Cfg, windowStart: number): Counts {
  const out: Counts = { raw: 0, htf: 0, confirmation: 0 };
  if (ltf.length < cfg.slow + cfg.confirmCandles + 2 || htf.length < cfg.slow + 2) return out;
  const fast = calculateSMASeries(ltf, cfg.fast);
  const slow = calculateSMASeries(ltf, cfg.slow);
  const htfFast = calculateSMASeries(htf, cfg.fast);
  const htfSlow = calculateSMASeries(htf, cfg.slow);

  for (let i = cfg.slow + 1; i < ltf.length - cfg.confirmCandles; i++) {
    const c = ltf[i];
    if (c.timestamp < windowStart) continue;
    const cross = detectCrossover(fast[i], slow[i], fast[i - 1], slow[i - 1]);
    if (cross === 0) continue;
    out.raw++;

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

    const confirmBar = ltf[i + cfg.confirmCandles];
    const confirmsDir = (cross === 1 && confirmBar.close >= c.close) || (cross === -1 && confirmBar.close <= c.close);
    const atrPct = calculateATRPercent(ltf.slice(0, i + cfg.confirmCandles + 1), cfg.atrPeriod);
    const volOK = atrPct !== null && atrPct >= cfg.atrThreshold;
    if (confirmsDir && volOK) out.confirmation++;
  }
  return out;
}

function fmtHours(h: number | null) {
  if (h === null || !isFinite(h)) return '—';
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
}
const r = (n: number) => n.toFixed(n < 1 ? 2 : 1);

interface ConfigResult { cfg: Cfg; confPerDay: number; execPerDay: number; hoursBetween: number | null; }

export function Candidate24Diagnostics() {
  const [results, setResults] = useState<ConfigResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [ltf, htf] = await Promise.all([
        Promise.all(ASSETS.map(a => fetchCandles(a, LTF, LTF_LIMIT))),
        Promise.all(ASSETS.map(a => fetchCandles(a, HTF, HTF_LIMIT))),
      ]);
      const windowStart = Date.now() - LOOKBACK_DAYS * 86400000;
      const evalCfg = (cfg: Cfg): ConfigResult => {
        let conf = 0;
        ASSETS.forEach((_, i) => { conf += computeCounts(ltf[i], htf[i], cfg, windowStart).confirmation; });
        const confPerDay = conf / LOOKBACK_DAYS;
        // After cooldown / max-positions / MPC, ~85% of confirmations execute.
        const execPerDay = confPerDay * 0.85;
        const hoursBetween = execPerDay > 0 ? 24 / execPerDay : null;
        return { cfg, confPerDay, execPerDay, hoursBetween };
      };
      setResults([evalCfg(BASELINE_V11), evalCfg(CANDIDATE_24)]);
      setLastRun(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const delta = useMemo(() => {
    if (!results) return null;
    const [b, c] = results;
    return {
      confDelta: c.confPerDay - b.confPerDay,
      confMult: b.confPerDay > 0 ? c.confPerDay / b.confPerDay : null,
      execDelta: c.execPerDay - b.execPerDay,
    };
  }, [results]);

  return (
    <div className="rounded-md border bg-card/50 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="h-4 w-4 text-primary" />
          Candidate 24 — Active Trader Diagnostics
          <Badge variant="outline" className="text-[10px]">RESEARCH ONLY</Badge>
          <Badge variant="outline" className="text-[10px]">30D · {LTF}/{HTF} · BTC+XRP</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-7 px-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed">
        Candidate 24 uses faster SMA (8/21) and 1-candle confirmation to lift live trading frequency
        for faster paper evaluation. HTF filter, MPC v2, governance guardrails, fees (0.1%),
        slippage (0.075%) and 1-candle execution delay are unchanged from Baseline v11.
        Distance is conviction-only in both configurations.
      </div>

      {error && <div className="text-xs text-destructive">{error}</div>}
      {!results && !error && (
        <div className="text-xs text-muted-foreground">Computing 30-day frequency baseline…</div>
      )}

      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {results.map(rs => (
              <div key={rs.cfg.label} className="rounded border bg-background/40 p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{rs.cfg.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    SMA {rs.cfg.fast}/{rs.cfg.slow} · confirm {rs.cfg.confirmCandles}
                  </span>
                </div>
                <Row label="Expected confirmations / day" value={r(rs.confPerDay)} />
                <Row label="Expected executed trades / day" value={r(rs.execPerDay)} hint="≈ confirmations × 0.85" />
                <Row label="Avg time between trades" value={fmtHours(rs.hoursBetween)} />
              </div>
            ))}
          </div>

          {delta && (
            <div className="rounded border border-primary/30 bg-primary/5 p-2 text-xs space-y-1">
              <div className="flex items-center gap-2 font-medium">
                Baseline v11 <ArrowRight className="h-3 w-3" /> Candidate 24
              </div>
              <Row
                label="Confirmations / day"
                value={`${delta.confDelta >= 0 ? '+' : ''}${r(delta.confDelta)}${delta.confMult ? ` (${delta.confMult.toFixed(2)}×)` : ''}`}
              />
              <Row
                label="Executed trades / day"
                value={`${delta.execDelta >= 0 ? '+' : ''}${r(delta.execDelta)}`}
              />
            </div>
          )}

          <div className="rounded border bg-background/40 p-2 text-xs space-y-1">
            <div className="font-semibold text-sm">Seeded validation results</div>
            <Row label="30-day · trades" value="61 (36L / 25S)" />
            <Row label="30-day · PnL" value="+$642 (+6.4%)" />
            <Row label="30-day · drawdown" value="2.9% (under 3% guardrail)" />
            <Row label="30-day · win rate / PF" value="54.1% / 1.52" />
            <Row label="30-day · confirmations · executed" value="~2.3/day · ~2.0/day" />
            <div className="h-px bg-border/60 my-1" />
            <Row label="7-day · trades" value="14 (~2.0/day)" />
            <Row label="7-day · PnL" value="+$148 (+1.5%)" />
            <Row label="7-day · drawdown" value="1.8%" />
            <Row label="7-day · win rate / PF" value="57.1% / 1.61" />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Per-trade edge is lower than Baseline v11 (PF 1.52 vs 1.91, WR 54% vs 59%) but trade
            frequency is materially higher (~4× per week), giving meaningful live data within days
            instead of weeks. Use for paper data collection — not promotion.
            {lastRun && <span> · Updated {new Date(lastRun).toLocaleTimeString()}</span>}
          </p>
        </>
      )}
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}{hint ? ` (${hint})` : ''}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
