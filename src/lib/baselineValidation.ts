/**
 * Baseline Validation
 * Compares newly-added assets (ETH, SOL) against the established
 * Baseline v11 reference set (BTC, XRP) across PnL, drawdown, profit
 * factor, long-vs-short quality, and per-regime performance.
 *
 * Pulls all data from archived paper-trading sessions — no live trading
 * is required. This is the gate for promoting ETH/SOL allocation.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import { Trade, Asset, MarketRegime } from '@/types/trading';
import { classifyTradeRegime } from '@/lib/analyticsHub';

export const REFERENCE_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT'];
export const CANDIDATE_ASSETS: Asset[] = ['ETHUSDT', 'SOLUSDT'];

export interface DirectionQuality {
  trades: number;
  winRate: number;
  pnl: number;
  avgPnl: number;
  profitFactor: number;
}

export interface RegimeQuality {
  regime: MarketRegime;
  label: string;
  trades: number;
  winRate: number;
  pnl: number;
}

export interface AssetBaselineReport {
  asset: Asset;
  trades: number;
  pnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  longs: DirectionQuality;
  shorts: DirectionQuality;
  regimes: RegimeQuality[];
  /** Per-asset starting equity used for drawdown calc. */
  startingEquity: number;
}

export interface BaselineDelta {
  metric: 'pnl' | 'profitFactor' | 'winRate' | 'maxDrawdown' | 'longPnl' | 'shortPnl';
  reference: number;
  candidate: number;
  delta: number;
  /** Whether the candidate is at least as healthy as the reference. */
  passes: boolean;
  note: string;
}

export interface BaselineValidationResult {
  candidate: Asset;
  candidateReport: AssetBaselineReport;
  referenceReport: AssetBaselineReport; // aggregated BTC+XRP
  deltas: BaselineDelta[];
  /** 'pass' / 'watch' / 'fail' based on delta health and sample size. */
  verdict: 'pass' | 'watch' | 'fail' | 'insufficient_data';
  verdictReason: string;
  /** Operator-facing plain-English summary. */
  summary: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function tradesForAssets(sessions: ArchivedSession[], assets: Asset[]): Trade[] {
  const set = new Set<string>(assets);
  return sessions.flatMap(s => s.trades.filter(t => set.has(t.asset)));
}

function profitFactor(trades: Trade[]): number {
  const gp = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const gl = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  return gl > 0 ? gp / gl : gp > 0 ? 99 : 0;
}

function directionQuality(trades: Trade[]): DirectionQuality {
  const wins = trades.filter(t => t.pnl > 0).length;
  const pnl = trades.reduce((s, t) => s + t.pnl, 0);
  return {
    trades: trades.length,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    pnl,
    avgPnl: trades.length > 0 ? pnl / trades.length : 0,
    profitFactor: profitFactor(trades),
  };
}

function regimeQuality(trades: Trade[]): RegimeQuality[] {
  const labels: Record<MarketRegime, string> = {
    trending_bullish: 'Bullish',
    trending_bearish: 'Bearish',
    sideways: 'Sideways',
  };
  const out: RegimeQuality[] = [];
  for (const r of ['trending_bullish', 'trending_bearish', 'sideways'] as MarketRegime[]) {
    const subset = trades.filter(t => classifyTradeRegime(t) === r);
    const wins = subset.filter(t => t.pnl > 0).length;
    out.push({
      regime: r,
      label: labels[r],
      trades: subset.length,
      winRate: subset.length > 0 ? (wins / subset.length) * 100 : 0,
      pnl: subset.reduce((s, t) => s + t.pnl, 0),
    });
  }
  return out;
}

/** Per-trade running drawdown from chronological PnL stream. */
function maxDrawdownPercent(trades: Trade[], startingEquity: number): number {
  if (trades.length === 0 || startingEquity <= 0) return 0;
  const ordered = [...trades].sort((a, b) => a.exitTime - b.exitTime);
  let equity = startingEquity;
  let peak = startingEquity;
  let maxDd = 0;
  for (const t of ordered) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }
  return maxDd;
}

// ─── Reports ────────────────────────────────────────────────────────

export function buildAssetReport(
  sessions: ArchivedSession[],
  assets: Asset[],
  startingEquity = 10000,
): AssetBaselineReport {
  const trades = tradesForAssets(sessions, assets);
  const wins = trades.filter(t => t.pnl > 0).length;
  return {
    asset: assets[0],
    trades: trades.length,
    pnl: trades.reduce((s, t) => s + t.pnl, 0),
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    profitFactor: profitFactor(trades),
    maxDrawdownPercent: maxDrawdownPercent(trades, startingEquity),
    longs: directionQuality(trades.filter(t => t.direction === 'long')),
    shorts: directionQuality(trades.filter(t => t.direction === 'short')),
    regimes: regimeQuality(trades),
    startingEquity,
  };
}

function deltaPasses(metric: BaselineDelta['metric'], ref: number, cand: number): { passes: boolean; note: string } {
  switch (metric) {
    case 'maxDrawdown':
      // candidate should not exceed reference by more than 1.5x
      return {
        passes: cand <= Math.max(ref * 1.5, ref + 1),
        note: cand <= ref ? 'Lower or equal drawdown vs baseline.' :
              cand <= ref * 1.5 ? 'Slightly higher drawdown — acceptable.' :
              'Drawdown materially worse than baseline.',
      };
    case 'profitFactor':
      return {
        passes: cand >= Math.max(ref * 0.75, 1.0),
        note: cand >= ref ? 'Profit factor matches or beats baseline.' :
              cand >= 1 ? 'Profit factor below baseline but still positive.' :
              'Profit factor below 1 — losing strategy on this asset.',
      };
    case 'winRate':
      return {
        passes: cand >= ref - 5,
        note: cand >= ref ? 'Win rate is in line with baseline.' :
              cand >= ref - 5 ? 'Win rate slightly below baseline.' :
              'Win rate materially below baseline.',
      };
    default: // pnl / longPnl / shortPnl
      return {
        passes: cand >= 0 && cand >= ref * 0.5,
        note: cand >= ref ? 'Matches or beats baseline contribution.' :
              cand >= 0 ? 'Positive PnL but below baseline contribution.' :
              'Negative PnL — not yet ready for full allocation.',
      };
  }
}

function makeDelta(
  metric: BaselineDelta['metric'],
  reference: number,
  candidate: number,
): BaselineDelta {
  const { passes, note } = deltaPasses(metric, reference, candidate);
  return { metric, reference, candidate, delta: candidate - reference, passes, note };
}

export function validateCandidate(
  sessions: ArchivedSession[],
  candidate: Asset,
  startingEquity = 10000,
): BaselineValidationResult {
  const candidateReport = buildAssetReport(sessions, [candidate], startingEquity);
  // Reference = aggregate BTC + XRP (split equity proportional to each)
  const referenceReport = buildAssetReport(sessions, REFERENCE_ASSETS, startingEquity);

  const deltas: BaselineDelta[] = [
    makeDelta('pnl', referenceReport.pnl, candidateReport.pnl),
    makeDelta('profitFactor', referenceReport.profitFactor, candidateReport.profitFactor),
    makeDelta('winRate', referenceReport.winRate, candidateReport.winRate),
    makeDelta('maxDrawdown', referenceReport.maxDrawdownPercent, candidateReport.maxDrawdownPercent),
    makeDelta('longPnl', referenceReport.longs.pnl, candidateReport.longs.pnl),
    makeDelta('shortPnl', referenceReport.shorts.pnl, candidateReport.shorts.pnl),
  ];

  let verdict: BaselineValidationResult['verdict'];
  let verdictReason: string;
  if (candidateReport.trades < 10) {
    verdict = 'insufficient_data';
    verdictReason = `Only ${candidateReport.trades} ${candidate} trades archived. Need at least 10 to validate.`;
  } else {
    const passing = deltas.filter(d => d.passes).length;
    if (passing >= 5) {
      verdict = 'pass';
      verdictReason = `${passing}/6 baseline checks pass. Candidate behaves like a baseline asset.`;
    } else if (passing >= 3) {
      verdict = 'watch';
      verdictReason = `${passing}/6 baseline checks pass. Keep allocation conservative and re-evaluate.`;
    } else {
      verdict = 'fail';
      verdictReason = `Only ${passing}/6 checks pass. Reduce allocation or disable until edge appears.`;
    }
  }

  const summary =
    verdict === 'pass' ? `${candidate} validates against the Baseline v11 reference set.` :
    verdict === 'watch' ? `${candidate} partially validates — keep the conservative 10–30% starting weight.` :
    verdict === 'fail' ? `${candidate} fails baseline validation. Consider cutting allocation.` :
    `Not enough data yet to validate ${candidate}.`;

  return { candidate, candidateReport, referenceReport, deltas, verdict, verdictReason, summary };
}

export function validateAllCandidates(
  sessions: ArchivedSession[],
  startingEquity = 10000,
): BaselineValidationResult[] {
  return CANDIDATE_ASSETS.map(a => validateCandidate(sessions, a, startingEquity));
}
