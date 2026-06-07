/**
 * Context Intelligence Layer
 * Turns archived per-trade context (regime, volatility, conviction, strategy,
 * exit reason) into actionable matrices, heatmaps, failure patterns and
 * plain-English insights for adaptive allocation research.
 *
 * All analytics here PREFER archived context (Baseline v11.1+). Trades that
 * pre-date per-trade capture are skipped from context-only analyses but
 * remain visible in the legacy regime/asset views in analyticsHub.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import { Trade, MarketRegime, VolatilityLevel, PositionDirection } from '@/types/trading';

// ─── Shared types ───────────────────────────────────────────────────

export interface MatrixCell {
  row: string;
  col: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
}

export interface ConditionInsight {
  label: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
}

export interface ConvictionBin {
  range: string;
  min: number;
  max: number;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
}

export interface FailurePattern {
  description: string;
  trades: number;
  pnl: number;
  lossRate: number;
  severity: 'low' | 'medium' | 'high';
}

const REGIME_LABEL: Record<MarketRegime, string> = {
  trending_bullish: 'Bullish',
  trending_bearish: 'Bearish',
  sideways: 'Sideways',
};

const VOL_LABEL: Record<VolatilityLevel, string> = {
  low: 'Low Vol',
  moderate: 'Mod Vol',
  high: 'High Vol',
};

// ─── Helpers ────────────────────────────────────────────────────────

function flattenTrades(sessions: ArchivedSession[]): Trade[] {
  const out: Trade[] = [];
  for (const s of sessions) for (const t of s.trades) out.push(t);
  return out;
}

function summarize(trades: Trade[]): Omit<MatrixCell, 'row' | 'col'> {
  const wins = trades.filter(t => t.pnl > 0).length;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    trades: trades.length,
    wins,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    pnl,
    avgPnl: trades.length > 0 ? pnl / trades.length : 0,
  };
}

/** Classify exit reason into "continuation" (held until SL/TP) vs "crossover" (flipped by opposite signal). */
export function classifyExitStyle(t: Trade): 'continuation' | 'crossover' | 'forced' {
  switch (t.exitReason) {
    case 'take_profit':
    case 'stop_loss':
      return 'continuation';
    case 'flip_to_long':
    case 'flip_to_short':
    case 'bullish_crossover':
    case 'bearish_crossover':
      return 'crossover';
    default:
      return 'forced';
  }
}

// ─── Matrices ───────────────────────────────────────────────────────

/** Regime × Direction (long/short) heatmap. */
export function regimeDirectionMatrix(sessions: ArchivedSession[]): MatrixCell[] {
  const trades = flattenTrades(sessions).filter(t => t.entryRegime);
  const rows: MarketRegime[] = ['trending_bullish', 'trending_bearish', 'sideways'];
  const cols: PositionDirection[] = ['long', 'short'];
  const out: MatrixCell[] = [];
  for (const r of rows) {
    for (const c of cols) {
      const subset = trades.filter(t => t.entryRegime === r && t.direction === c);
      out.push({ row: REGIME_LABEL[r], col: c.toUpperCase(), ...summarize(subset) });
    }
  }
  return out;
}

/** Strategy × Regime heatmap (will fill out as more strategies are added). */
export function strategyRegimeMatrix(sessions: ArchivedSession[]): MatrixCell[] {
  const trades = flattenTrades(sessions).filter(t => t.entryRegime && t.strategySource);
  const strategies = Array.from(new Set(trades.map(t => t.strategySource!))).sort();
  const rows: MarketRegime[] = ['trending_bullish', 'trending_bearish', 'sideways'];
  const out: MatrixCell[] = [];
  for (const strat of strategies) {
    for (const r of rows) {
      const subset = trades.filter(t => t.strategySource === strat && t.entryRegime === r);
      out.push({ row: strat, col: REGIME_LABEL[r], ...summarize(subset) });
    }
  }
  return out;
}

/** Volatility × Asset heatmap. */
export function volatilityAssetMatrix(sessions: ArchivedSession[]): MatrixCell[] {
  const trades = flattenTrades(sessions).filter(t => t.entryVolatilityLevel);
  const assets = Array.from(new Set(trades.map(t => t.asset))).sort();
  const rows: VolatilityLevel[] = ['low', 'moderate', 'high'];
  const out: MatrixCell[] = [];
  for (const v of rows) {
    for (const a of assets) {
      const subset = trades.filter(t => t.entryVolatilityLevel === v && t.asset === a);
      out.push({ row: VOL_LABEL[v], col: a, ...summarize(subset) });
    }
  }
  return out;
}

/** Continuation vs Crossover performance broken down by regime. */
export function continuationVsCrossoverByRegime(sessions: ArchivedSession[]): MatrixCell[] {
  const trades = flattenTrades(sessions).filter(t => t.entryRegime);
  const rows: MarketRegime[] = ['trending_bullish', 'trending_bearish', 'sideways'];
  const styles: Array<'continuation' | 'crossover'> = ['continuation', 'crossover'];
  const out: MatrixCell[] = [];
  for (const r of rows) {
    for (const style of styles) {
      const subset = trades.filter(t => t.entryRegime === r && classifyExitStyle(t) === style);
      out.push({ row: REGIME_LABEL[r], col: style === 'continuation' ? 'Continuation' : 'Crossover', ...summarize(subset) });
    }
  }
  return out;
}

// ─── Conviction bins ────────────────────────────────────────────────

const CONVICTION_BINS: Array<{ range: string; min: number; max: number }> = [
  { range: '0–25', min: 0, max: 25 },
  { range: '25–50', min: 25, max: 50 },
  { range: '50–75', min: 50, max: 75 },
  { range: '75–100', min: 75, max: 101 },
];

export function convictionRangeMetrics(sessions: ArchivedSession[]): ConvictionBin[] {
  const trades = flattenTrades(sessions).filter(t => t.convictionScore != null);
  return CONVICTION_BINS.map(b => {
    const subset = trades.filter(t => t.convictionScore! >= b.min && t.convictionScore! < b.max);
    const s = summarize(subset);
    return { ...b, trades: s.trades, wins: s.wins, winRate: s.winRate, pnl: s.pnl, avgPnl: s.avgPnl };
  });
}

// ─── Distance bands (post-promotion: distance is a conviction factor) ──

export interface DistanceBin {
  range: string;
  contribution: number; // +0/+5/+10/+15
  min: number;
  max: number;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
}

const DISTANCE_BINS: Array<Omit<DistanceBin, 'trades' | 'wins' | 'winRate' | 'pnl' | 'avgPnl'>> = [
  { range: '< 0.05%',    contribution: 0,  min: 0,     max: 0.05 },
  { range: '0.05–0.15%', contribution: 5,  min: 0.05,  max: 0.15 },
  { range: '0.15–0.25%', contribution: 10, min: 0.15,  max: 0.25 },
  { range: '≥ 0.25%',    contribution: 15, min: 0.25,  max: Infinity },
];

export function distanceBandMetrics(sessions: ArchivedSession[]): DistanceBin[] {
  const trades = flattenTrades(sessions).filter(t => t.entrySmaDistance != null);
  return DISTANCE_BINS.map(b => {
    const subset = trades.filter(t => {
      const d = Math.abs(t.entrySmaDistance!);
      return d >= b.min && d < b.max;
    });
    const s = summarize(subset);
    return { ...b, trades: s.trades, wins: s.wins, winRate: s.winRate, pnl: s.pnl, avgPnl: s.avgPnl };
  });
}

// ─── Best / worst / dangerous ───────────────────────────────────────

/** Strongest regimes ranked by avgPnl (min sample required). */
export function strongestRegimes(sessions: ArchivedSession[], minTrades = 3): ConditionInsight[] {
  const trades = flattenTrades(sessions).filter(t => t.entryRegime);
  const rows: MarketRegime[] = ['trending_bullish', 'trending_bearish', 'sideways'];
  return rows
    .map(r => {
      const subset = trades.filter(t => t.entryRegime === r);
      return { label: REGIME_LABEL[r], ...summarize(subset) };
    })
    .filter(x => x.trades >= minTrades)
    .sort((a, b) => b.avgPnl - a.avgPnl);
}

/** Weakest conditions for a given direction (regime × volatility combos). */
export function weakestForDirection(
  sessions: ArchivedSession[],
  direction: PositionDirection,
  minTrades = 2,
): ConditionInsight[] {
  const trades = flattenTrades(sessions).filter(
    t => t.direction === direction && t.entryRegime && t.entryVolatilityLevel,
  );
  const buckets = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = `${REGIME_LABEL[t.entryRegime!]} · ${VOL_LABEL[t.entryVolatilityLevel!]}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(t);
  }
  return Array.from(buckets.entries())
    .map(([label, arr]) => ({ label, ...summarize(arr) }))
    .filter(x => x.trades >= minTrades)
    .sort((a, b) => a.avgPnl - b.avgPnl)
    .slice(0, 5);
}

/** Detect recurring failure patterns across regime/volatility/direction/exit. */
export function detectFailurePatterns(sessions: ArchivedSession[], minTrades = 3): FailurePattern[] {
  const trades = flattenTrades(sessions).filter(t => t.entryRegime && t.entryVolatilityLevel);
  const buckets = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = `${t.direction.toUpperCase()} in ${REGIME_LABEL[t.entryRegime!]} (${VOL_LABEL[t.entryVolatilityLevel!]}) → ${t.exitReason.replace(/_/g, ' ')}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(t);
  }
  const patterns: FailurePattern[] = [];
  for (const [description, arr] of buckets) {
    if (arr.length < minTrades) continue;
    const losses = arr.filter(t => t.pnl <= 0).length;
    const lossRate = (losses / arr.length) * 100;
    const pnl = arr.reduce((s, t) => s + t.pnl, 0);
    if (lossRate < 60 || pnl >= 0) continue;
    const severity: FailurePattern['severity'] =
      lossRate >= 85 ? 'high' : lossRate >= 70 ? 'medium' : 'low';
    patterns.push({ description, trades: arr.length, pnl, lossRate, severity });
  }
  return patterns.sort((a, b) => a.pnl - b.pnl).slice(0, 8);
}

/** Short, operator-friendly warnings for the most dangerous conditions. */
export function dangerousConditions(sessions: ArchivedSession[]): string[] {
  const patterns = detectFailurePatterns(sessions, 3);
  const warnings: string[] = [];
  for (const p of patterns.slice(0, 4)) {
    warnings.push(
      `⚠ ${p.description}: ${p.trades} trades, ${p.lossRate.toFixed(0)}% loss rate, $${p.pnl.toFixed(2)} cumulative.`
    );
  }
  // Add long/short specific worst conditions
  const worstLong = weakestForDirection(sessions, 'long', 2)[0];
  if (worstLong && worstLong.avgPnl < 0) {
    warnings.push(`⚠ Worst LONG context: ${worstLong.label} — ${worstLong.trades} trades, avg ${worstLong.avgPnl.toFixed(2)} per trade.`);
  }
  const worstShort = weakestForDirection(sessions, 'short', 2)[0];
  if (worstShort && worstShort.avgPnl < 0) {
    warnings.push(`⚠ Worst SHORT context: ${worstShort.label} — ${worstShort.trades} trades, avg ${worstShort.avgPnl.toFixed(2)} per trade.`);
  }
  return warnings;
}

// ─── Plain-English insights ─────────────────────────────────────────

export function generateContextInsights(sessions: ArchivedSession[]): string[] {
  const trades = flattenTrades(sessions);
  const archived = trades.filter(t => t.entryRegime != null);
  const out: string[] = [];

  if (archived.length === 0) {
    return ['No archived per-trade context yet. Start a paper trading session — Baseline v11.1+ captures regime, volatility, SMA distance, ATR%, conviction and governance state on every trade.'];
  }

  out.push(`Context Intelligence is operating on ${archived.length} archived trades (of ${trades.length} total).`);

  // Strongest regime
  const reg = strongestRegimes(sessions, 3);
  const best = reg[0];
  const worst = reg[reg.length - 1];
  if (best && best.avgPnl > 0) {
    out.push(`Strongest regime: ${best.label} — avg $${best.avgPnl.toFixed(2)} per trade across ${best.trades} trades (${best.winRate.toFixed(0)}% WR).`);
  }
  if (worst && worst.avgPnl < 0 && best && worst.label !== best.label) {
    out.push(`Weakest regime: ${worst.label} — avg $${worst.avgPnl.toFixed(2)} per trade (${worst.winRate.toFixed(0)}% WR). Consider reducing allocation in this regime.`);
  }

  // Continuation vs crossover
  const cvc = continuationVsCrossoverByRegime(sessions);
  const cont = cvc.filter(c => c.col === 'Continuation');
  const cross = cvc.filter(c => c.col === 'Crossover');
  const contPnl = cont.reduce((s, x) => s + x.pnl, 0);
  const crossPnl = cross.reduce((s, x) => s + x.pnl, 0);
  if (Math.abs(contPnl - crossPnl) > 5) {
    if (contPnl > crossPnl) {
      out.push(`Continuation exits (SL/TP) outperform flips overall (+$${contPnl.toFixed(2)} vs $${crossPnl.toFixed(2)}). The system extracts more value letting trades reach targets than from reversal flips.`);
    } else {
      out.push(`Crossover flips outperform SL/TP exits (+$${crossPnl.toFixed(2)} vs $${contPnl.toFixed(2)}). Targets may be too far or stops too tight — consider tighter TP.`);
    }
  }

  // Volatility insight
  const vol = volatilityAssetMatrix(sessions);
  const byVol = new Map<string, { trades: number; pnl: number }>();
  for (const c of vol) {
    const cur = byVol.get(c.row) ?? { trades: 0, pnl: 0 };
    cur.trades += c.trades; cur.pnl += c.pnl;
    byVol.set(c.row, cur);
  }
  const volRanked = Array.from(byVol.entries())
    .filter(([, v]) => v.trades >= 3)
    .sort((a, b) => b[1].pnl - a[1].pnl);
  if (volRanked.length >= 2) {
    const [topVol, bottomVol] = [volRanked[0], volRanked[volRanked.length - 1]];
    out.push(`Volatility edge: ${topVol[0]} produces the best PnL (+$${topVol[1].pnl.toFixed(2)} over ${topVol[1].trades} trades) while ${bottomVol[0]} trails ($${bottomVol[1].pnl.toFixed(2)}). Bias position size toward ${topVol[0]} conditions.`);
  }

  // Conviction insight
  const conv = convictionRangeMetrics(sessions).filter(c => c.trades >= 3);
  if (conv.length >= 2) {
    const top = [...conv].sort((a, b) => b.avgPnl - a.avgPnl)[0];
    out.push(`Best conviction band: ${top.range} — avg $${top.avgPnl.toFixed(2)} per trade across ${top.trades} trades (${top.winRate.toFixed(0)}% WR). Consider gating new entries below this band.`);
  } else if (archived.filter(t => t.convictionScore != null).length === 0) {
    out.push(`No conviction scores captured yet — the unified engine doesn't write conviction on every trade. Wire the agent decision engine into paper execution to unlock conviction-band analysis.`);
  }

  // Failure pattern warning
  const failures = detectFailurePatterns(sessions, 3);
  if (failures.length > 0) {
    const f = failures[0];
    out.push(`Top recurring failure: "${f.description}" — ${f.trades} trades, ${f.lossRate.toFixed(0)}% lose rate, $${f.pnl.toFixed(2)} cumulative. This is the highest-priority context to filter out.`);
  }

  return out;
}
