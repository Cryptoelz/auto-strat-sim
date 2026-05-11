/**
 * Trading Analytics Hub
 * Cross-session aggregates for Baseline v11 evaluation: per-asset metrics,
 * regime estimation, blocked trade analysis, equity-over-time, CSV export,
 * and plain-English insights.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import { Trade, Asset, MarketRegime } from '@/types/trading';
import { SessionSummary } from '@/lib/sessionAnalytics';

export interface AssetMetrics {
  asset: string;
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  avgPnl: number;
  longTrades: number;
  shortTrades: number;
  longPnl: number;
  shortPnl: number;
}

export interface RegimeMetrics {
  regime: MarketRegime;
  label: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export interface BlockedTradeMetric {
  reason: string;
  count: number;
  percent: number;
}

export interface EquityPoint {
  index: number;
  timestamp: number;
  date: string;
  balance: number;
  drawdown: number;
  sessionId: string;
}

export interface SessionPnlPoint {
  label: string;
  pnl: number;
  cumulative: number;
  drawdown: number;
}

/** Aggregate per-asset metrics across all trades from all sessions. */
export function computeAssetMetrics(sessions: ArchivedSession[]): AssetMetrics[] {
  const buckets = new Map<string, Trade[]>();
  for (const s of sessions) {
    for (const t of s.trades) {
      if (!buckets.has(t.asset)) buckets.set(t.asset, []);
      buckets.get(t.asset)!.push(t);
    }
  }
  const out: AssetMetrics[] = [];
  for (const [asset, trades] of buckets) {
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const longs = trades.filter(t => t.direction === 'long');
    const shorts = trades.filter(t => t.direction === 'short');
    out.push({
      asset,
      trades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      pnl: trades.reduce((s, t) => s + t.pnl, 0),
      grossProfit,
      grossLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      avgPnl: trades.length > 0 ? trades.reduce((s, t) => s + t.pnl, 0) / trades.length : 0,
      longTrades: longs.length,
      shortTrades: shorts.length,
      longPnl: longs.reduce((s, t) => s + t.pnl, 0),
      shortPnl: shorts.reduce((s, t) => s + t.pnl, 0),
    });
  }
  return out.sort((a, b) => b.pnl - a.pnl);
}

/**
 * Estimate the prevailing regime for a trade using direction + outcome:
 *  - long wins, short losses → trending_bullish
 *  - short wins, long losses → trending_bearish
 *  - mixed (stop-out etc.) → sideways
 * This is a heuristic since per-trade regime isn't archived.
 */
export function classifyTradeRegime(t: Trade): MarketRegime {
  const won = t.pnl > 0;
  if (t.direction === 'long' && won) return 'trending_bullish';
  if (t.direction === 'short' && won) return 'trending_bearish';
  if (t.direction === 'long' && !won) return 'sideways';
  return 'sideways';
}

export function computeRegimeMetrics(sessions: ArchivedSession[]): RegimeMetrics[] {
  const buckets: Record<MarketRegime, Trade[]> = {
    trending_bullish: [],
    trending_bearish: [],
    sideways: [],
  };
  for (const s of sessions) for (const t of s.trades) buckets[classifyTradeRegime(t)].push(t);
  const labels: Record<MarketRegime, string> = {
    trending_bullish: 'Bullish',
    trending_bearish: 'Bearish',
    sideways: 'Sideways',
  };
  return (Object.keys(buckets) as MarketRegime[]).map(r => {
    const trades = buckets[r];
    const wins = trades.filter(t => t.pnl > 0);
    return {
      regime: r,
      label: labels[r],
      trades: trades.length,
      wins: wins.length,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      pnl: trades.reduce((s, t) => s + t.pnl, 0),
    };
  });
}

/** Aggregate exit-reason / blocked-trade frequencies across sessions. */
export function computeBlockedTradeMetrics(sessions: ArchivedSession[]): BlockedTradeMetric[] {
  const counts: Record<string, number> = {};
  for (const s of sessions) {
    for (const t of s.trades) {
      const reason = t.exitReason || 'unknown';
      counts[reason] = (counts[reason] || 0) + 1;
    }
  }
  const total = Object.values(counts).reduce((s, c) => s + c, 0);
  return Object.entries(counts)
    .map(([reason, count]) => ({
      reason: reason.replace(/_/g, ' '),
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Cumulative equity curve across all archived sessions, ordered oldest → newest. */
export function computeEquityCurve(sessions: ArchivedSession[]): EquityPoint[] {
  const ordered = [...sessions].sort((a, b) => a.startTime - b.startTime);
  const points: EquityPoint[] = [];
  let running = ordered[0]?.initialBalance ?? 10000;
  let peak = running;
  let i = 0;
  for (const s of ordered) {
    const sorted = [...s.trades].sort((a, b) => a.exitTime - b.exitTime);
    for (const t of sorted) {
      running += t.pnl;
      peak = Math.max(peak, running);
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      points.push({
        index: i++,
        timestamp: t.exitTime,
        date: new Date(t.exitTime).toLocaleDateString(),
        balance: running,
        drawdown: dd,
        sessionId: s.id,
      });
    }
  }
  return points;
}

/** Per-session PnL series with cumulative + running drawdown. */
export function computeSessionPnlSeries(summaries: SessionSummary[]): SessionPnlPoint[] {
  const ordered = [...summaries].reverse(); // oldest first for chart
  let cumulative = 0;
  let peak = 0;
  return ordered.map(s => {
    cumulative += s.totalPnl;
    peak = Math.max(peak, cumulative);
    const drawdown = peak > 0 ? ((peak - cumulative) / peak) * 100 : 0;
    return { label: s.date, pnl: s.totalPnl, cumulative, drawdown };
  });
}

/** Export a session report as CSV (single session or all). */
export function exportSessionReportCsv(sessions: ArchivedSession[]): string {
  const headers = [
    'session_id', 'start', 'end', 'trades', 'pnl', 'win_rate', 'max_dd', 'profit_factor',
    'long_trades', 'short_trades', 'trade_id', 'asset', 'direction', 'entry_price',
    'exit_price', 'pnl_$', 'pnl_%', 'exit_reason',
  ];
  const rows: string[] = [headers.join(',')];
  for (const s of sessions) {
    const meta = [
      s.id,
      new Date(s.startTime).toISOString(),
      new Date(s.endTime).toISOString(),
      s.totalTrades,
      s.totalPnl.toFixed(2),
      s.winRate.toFixed(2),
      s.maxDrawdown.toFixed(2),
      s.profitFactor === Infinity ? 'Inf' : s.profitFactor.toFixed(2),
      s.longTrades,
      s.shortTrades,
    ];
    if (s.trades.length === 0) {
      rows.push([...meta, '', '', '', '', '', '', '', ''].join(','));
      continue;
    }
    for (const t of s.trades) {
      rows.push([
        ...meta,
        t.id,
        t.asset,
        t.direction,
        t.entryPrice,
        t.exitPrice,
        t.pnl.toFixed(2),
        t.pnlPercent.toFixed(2),
        t.exitReason,
      ].join(','));
    }
  }
  return rows.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Plain-English AI-style insight bullets for the operator dashboard. */
export function generateHubInsights(
  sessions: ArchivedSession[],
  summaries: SessionSummary[],
  assets: AssetMetrics[],
  regimes: RegimeMetrics[],
): string[] {
  const out: string[] = [];
  if (sessions.length === 0) return ['No archived sessions yet. Run a paper trading session to populate analytics.'];

  const totalPnl = summaries.reduce((s, x) => s + x.totalPnl, 0);
  const avgDd = summaries.reduce((s, x) => s + x.maxDrawdown, 0) / summaries.length;
  const profitable = summaries.filter(s => s.totalPnl > 0).length;

  out.push(
    totalPnl >= 0
      ? `Baseline v11 is net profitable across ${sessions.length} sessions with $${totalPnl.toFixed(2)} cumulative PnL.`
      : `Baseline v11 is currently net negative across ${sessions.length} sessions ($${totalPnl.toFixed(2)} cumulative).`
  );
  out.push(`${profitable}/${sessions.length} sessions ended profitable. Average max drawdown is ${avgDd.toFixed(2)}% — ${avgDd < 3 ? 'within' : 'above'} the 3% safety target.`);

  const bestAsset = assets[0];
  const worstAsset = assets[assets.length - 1];
  if (bestAsset && worstAsset && bestAsset.asset !== worstAsset.asset) {
    out.push(`${bestAsset.asset} is the strongest performer (+$${bestAsset.pnl.toFixed(2)}, ${bestAsset.winRate.toFixed(0)}% WR). ${worstAsset.asset} is the weakest ($${worstAsset.pnl.toFixed(2)}).`);
  }

  const bullish = regimes.find(r => r.regime === 'trending_bullish')!;
  const bearish = regimes.find(r => r.regime === 'trending_bearish')!;
  const sideways = regimes.find(r => r.regime === 'sideways')!;
  const dominant = [bullish, bearish, sideways].sort((a, b) => b.trades - a.trades)[0];
  out.push(`Most trades occurred in ${dominant.label.toLowerCase()} conditions (${dominant.trades} trades, ${dominant.winRate.toFixed(0)}% WR).`);
  if (sideways.pnl < 0 && (bullish.pnl > 0 || bearish.pnl > 0)) {
    out.push(`Sideways regimes are net negative ($${sideways.pnl.toFixed(2)}). Consider tighter entry filters in low-volatility chop.`);
  }

  const longPnl = summaries.reduce((s, x) => s + x.longPnl, 0);
  const shortPnl = summaries.reduce((s, x) => s + x.shortPnl, 0);
  if (longPnl > 0 && shortPnl > 0) {
    out.push(`Long and short books are both contributing positively (longs +$${longPnl.toFixed(2)}, shorts +$${shortPnl.toFixed(2)}) — system is well-balanced.`);
  } else if (longPnl > 0 && shortPnl < 0) {
    out.push(`Longs are profitable (+$${longPnl.toFixed(2)}) but shorts are dragging ($${shortPnl.toFixed(2)}). Review short entry filters.`);
  } else if (shortPnl > 0 && longPnl < 0) {
    out.push(`Shorts are profitable (+$${shortPnl.toFixed(2)}) but longs are dragging ($${longPnl.toFixed(2)}). Review long entry filters.`);
  }

  if (summaries.length >= 3) {
    const recent = summaries.slice(0, 3).reduce((s, x) => s + x.totalPnl, 0) / 3;
    const older = summaries.slice(-3).reduce((s, x) => s + x.totalPnl, 0) / 3;
    if (recent > older * 1.2) out.push('Recent sessions are improving vs. earlier runs — system stability is trending up.');
    else if (recent < older * 0.7) out.push('Recent sessions are underperforming earlier runs — check for regime shift or config drift.');
  }

  return out;
}
