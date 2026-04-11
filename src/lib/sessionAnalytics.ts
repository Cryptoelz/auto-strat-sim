/**
 * Session Analytics Engine
 * Computes cross-session insights, comparisons, and plain-English reports.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import { Asset, Trade } from '@/types/trading';

export interface SessionSummary {
  id: string;
  label: string;
  date: string;
  durationMinutes: number;
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  profitFactor: number;
  longTrades: number;
  shortTrades: number;
  longPnl: number;
  shortPnl: number;
  longWinRate: number;
  shortWinRate: number;
  pnlByAsset: Record<string, number>;
  tradesByAsset: Record<string, number>;
  exitReasons: Record<string, number>;
  avgTradeSize: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
}

export interface ComparisonResult {
  sessionA: SessionSummary;
  sessionB: SessionSummary;
  pnlDelta: number;
  winRateDelta: number;
  drawdownDelta: number;
  profitFactorDelta: number;
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
}

export function summarizeSession(session: ArchivedSession): SessionSummary {
  const longTrades = session.trades.filter(t => t.direction === 'long');
  const shortTrades = session.trades.filter(t => t.direction === 'short');
  const longWins = longTrades.filter(t => t.pnl > 0).length;
  const shortWins = shortTrades.filter(t => t.pnl > 0).length;

  const pnlByAsset: Record<string, number> = {};
  const tradesByAsset: Record<string, number> = {};
  const exitReasons: Record<string, number> = {};

  for (const trade of session.trades) {
    const asset = trade.asset;
    pnlByAsset[asset] = (pnlByAsset[asset] || 0) + trade.pnl;
    tradesByAsset[asset] = (tradesByAsset[asset] || 0) + 1;
    const reason = trade.exitReason || 'unknown';
    exitReasons[reason] = (exitReasons[reason] || 0) + 1;
  }

  const sorted = [...session.trades].sort((a, b) => a.pnl - b.pnl);

  return {
    id: session.id,
    label: session.label || `Session ${new Date(session.startTime).toLocaleDateString()}`,
    date: new Date(session.startTime).toLocaleDateString(),
    durationMinutes: Math.round((session.endTime - session.startTime) / 60000),
    totalPnl: session.totalPnl,
    totalTrades: session.totalTrades,
    winRate: session.winRate,
    maxDrawdown: session.maxDrawdown,
    profitFactor: session.profitFactor,
    longTrades: longTrades.length,
    shortTrades: shortTrades.length,
    longPnl: longTrades.reduce((s, t) => s + t.pnl, 0),
    shortPnl: shortTrades.reduce((s, t) => s + t.pnl, 0),
    longWinRate: longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0,
    shortWinRate: shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0,
    pnlByAsset,
    tradesByAsset,
    exitReasons,
    avgTradeSize: session.trades.length > 0
      ? session.trades.reduce((s, t) => s + Math.abs(t.pnl), 0) / session.trades.length
      : 0,
    bestTrade: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    worstTrade: sorted.length > 0 ? sorted[0] : null,
  };
}

export function compareSessions(a: SessionSummary, b: SessionSummary): ComparisonResult {
  return {
    sessionA: a,
    sessionB: b,
    pnlDelta: b.totalPnl - a.totalPnl,
    winRateDelta: b.winRate - a.winRate,
    drawdownDelta: b.maxDrawdown - a.maxDrawdown,
    profitFactorDelta: b.profitFactor - a.profitFactor,
  };
}

export function findBestWorst(summaries: SessionSummary[]) {
  if (summaries.length === 0) return { best: null, worst: null };
  const sorted = [...summaries].sort((a, b) => a.totalPnl - b.totalPnl);
  return { best: sorted[sorted.length - 1], worst: sorted[0] };
}

export function generateInsights(summaries: SessionSummary[]): Insight[] {
  if (summaries.length === 0) return [{ type: 'neutral', message: 'No sessions to analyze yet.' }];

  const insights: Insight[] = [];
  const totalSessions = summaries.length;
  const profitable = summaries.filter(s => s.totalPnl > 0).length;
  const avgPnl = summaries.reduce((s, x) => s + x.totalPnl, 0) / totalSessions;
  const avgWinRate = summaries.reduce((s, x) => s + x.winRate, 0) / totalSessions;
  const avgDrawdown = summaries.reduce((s, x) => s + x.maxDrawdown, 0) / totalSessions;

  // Profitability trend
  const profitRate = (profitable / totalSessions) * 100;
  if (profitRate >= 70) {
    insights.push({ type: 'positive', message: `${profitRate.toFixed(0)}% of sessions are profitable — strong consistency.` });
  } else if (profitRate >= 50) {
    insights.push({ type: 'neutral', message: `${profitRate.toFixed(0)}% of sessions are profitable — room for improvement.` });
  } else {
    insights.push({ type: 'negative', message: `Only ${profitRate.toFixed(0)}% of sessions are profitable — review strategy filters.` });
  }

  // Average PnL
  insights.push({
    type: avgPnl >= 0 ? 'positive' : 'negative',
    message: `Average session PnL is ${avgPnl >= 0 ? '+' : ''}$${avgPnl.toFixed(2)}.`,
  });

  // Win rate
  if (avgWinRate >= 55) {
    insights.push({ type: 'positive', message: `Average win rate of ${avgWinRate.toFixed(1)}% is above the 55% threshold.` });
  } else if (avgWinRate >= 45) {
    insights.push({ type: 'neutral', message: `Average win rate of ${avgWinRate.toFixed(1)}% is marginal — check entry filters.` });
  } else {
    insights.push({ type: 'negative', message: `Average win rate of ${avgWinRate.toFixed(1)}% is low — signals may be too noisy.` });
  }

  // Drawdown
  if (avgDrawdown > 3) {
    insights.push({ type: 'negative', message: `Average max drawdown of ${avgDrawdown.toFixed(2)}% exceeds the 3% safety threshold.` });
  } else {
    insights.push({ type: 'positive', message: `Average max drawdown of ${avgDrawdown.toFixed(2)}% is within safe bounds.` });
  }

  // Long vs Short analysis
  const totalLong = summaries.reduce((s, x) => s + x.longTrades, 0);
  const totalShort = summaries.reduce((s, x) => s + x.shortTrades, 0);
  const longPnl = summaries.reduce((s, x) => s + x.longPnl, 0);
  const shortPnl = summaries.reduce((s, x) => s + x.shortPnl, 0);

  if (totalShort > 0) {
    if (shortPnl < 0 && longPnl > 0) {
      insights.push({ type: 'negative', message: `Shorts are net negative ($${shortPnl.toFixed(2)}) while longs are profitable ($${longPnl.toFixed(2)}). Consider tightening short entry filters.` });
    } else if (shortPnl > 0 && longPnl > 0) {
      insights.push({ type: 'positive', message: `Both longs (+$${longPnl.toFixed(2)}) and shorts (+$${shortPnl.toFixed(2)}) are contributing positively.` });
    }
  } else if (totalLong > 0) {
    insights.push({ type: 'neutral', message: `No short trades taken across ${totalSessions} sessions — short logic may be too restrictive.` });
  }

  // Exit reason analysis
  const allReasons: Record<string, number> = {};
  for (const s of summaries) {
    for (const [r, c] of Object.entries(s.exitReasons)) {
      allReasons[r] = (allReasons[r] || 0) + c;
    }
  }
  const totalExits = Object.values(allReasons).reduce((s, c) => s + c, 0);
  const stopLossCount = allReasons['stop_loss'] || 0;
  if (totalExits > 0 && stopLossCount / totalExits > 0.5) {
    insights.push({ type: 'negative', message: `${((stopLossCount / totalExits) * 100).toFixed(0)}% of exits are stop losses — entries may be poorly timed.` });
  }

  const tpCount = allReasons['take_profit'] || 0;
  if (totalExits > 0 && tpCount / totalExits > 0.4) {
    insights.push({ type: 'positive', message: `${((tpCount / totalExits) * 100).toFixed(0)}% of exits hit take profit — entry timing is solid.` });
  }

  // Improving or deteriorating
  if (summaries.length >= 3) {
    const recent = summaries.slice(0, 3);
    const older = summaries.slice(-3);
    const recentAvg = recent.reduce((s, x) => s + x.totalPnl, 0) / recent.length;
    const olderAvg = older.reduce((s, x) => s + x.totalPnl, 0) / older.length;
    if (recentAvg > olderAvg) {
      insights.push({ type: 'positive', message: 'Recent sessions show improving performance compared to earlier runs.' });
    } else if (recentAvg < olderAvg * 0.7) {
      insights.push({ type: 'negative', message: 'Recent sessions show declining performance — review recent config changes.' });
    }
  }

  return insights;
}
