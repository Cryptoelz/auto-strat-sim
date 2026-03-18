import { Trade, TradingState, Asset, DecisionLogEntry } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';

// ─── Daily Summary ───────────────────────────────────────────────────

export interface DailySummary {
  date: string;
  totalTrades: number;
  longTrades: number;
  shortTrades: number;
  wins: number;
  losses: number;
  realizedPnl: number;
  unrealizedPnl: number;
  dailyReturnPercent: number;
  bestTrade: { asset: Asset; pnl: number } | null;
  worstTrade: { asset: Asset; pnl: number } | null;
  maxDrawdownReached: number;
  assetsTraded: Asset[];
  blockedSetups: number;
  topBlockReasons: { reason: string; count: number }[];
  commentary: string;
}

export interface SessionSummary {
  sessionStartTime: number;
  durationMs: number;
  totalAlerts: number;
  totalTrades: number;
  netPnl: number;
  unrealizedPnl: number;
  bestAsset: { asset: Asset; pnl: number } | null;
  worstAsset: { asset: Asset; pnl: number } | null;
  tradingStatus: 'active' | 'paused' | 'risk_locked' | 'stopped';
  portfolioEquity: number;
}

// ─── Generate Daily Summary ──────────────────────────────────────────

export function generateDailySummary(
  state: TradingState,
  blockedEntries: DecisionLogEntry[],
  unrealizedPnl: number,
  maxDrawdown: number,
  date?: string,
): DailySummary {
  const today = date || new Date().toISOString().slice(0, 10);
  
  const dayTrades = state.trades.filter(t => {
    const d = new Date(t.exitTime).toISOString().slice(0, 10);
    return d === today;
  });

  const longs = dayTrades.filter(t => t.direction === 'long');
  const shorts = dayTrades.filter(t => t.direction === 'short');
  const wins = dayTrades.filter(t => t.type === 'win');
  const losses = dayTrades.filter(t => t.type === 'loss');
  const realizedPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
  const dailyReturnPercent = state.initialBalance > 0
    ? (realizedPnl / state.initialBalance) * 100
    : 0;

  const assetsTraded = [...new Set(dayTrades.map(t => t.asset))] as Asset[];

  let bestTrade: DailySummary['bestTrade'] = null;
  let worstTrade: DailySummary['worstTrade'] = null;
  if (dayTrades.length > 0) {
    const sorted = [...dayTrades].sort((a, b) => b.pnl - a.pnl);
    bestTrade = { asset: sorted[0].asset, pnl: sorted[0].pnl };
    worstTrade = { asset: sorted[sorted.length - 1].asset, pnl: sorted[sorted.length - 1].pnl };
  }

  // Blocked setups for today
  const dayBlocked = blockedEntries.filter(e => {
    const d = new Date(e.timestamp).toISOString().slice(0, 10);
    return d === today;
  });

  const blockReasonCounts: Record<string, number> = {};
  dayBlocked.forEach(e => {
    const reason = e.filterBlocked || 'unknown';
    blockReasonCounts[reason] = (blockReasonCounts[reason] || 0) + 1;
  });
  const topBlockReasons = Object.entries(blockReasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const commentary = generateCommentary(dayTrades, dayBlocked, assetsTraded, realizedPnl, maxDrawdown);

  return {
    date: today,
    totalTrades: dayTrades.length,
    longTrades: longs.length,
    shortTrades: shorts.length,
    wins: wins.length,
    losses: losses.length,
    realizedPnl,
    unrealizedPnl,
    dailyReturnPercent,
    bestTrade,
    worstTrade,
    maxDrawdownReached: maxDrawdown,
    assetsTraded,
    blockedSetups: dayBlocked.length,
    topBlockReasons,
    commentary,
  };
}

// ─── Generate Commentary ─────────────────────────────────────────────

function generateCommentary(
  trades: Trade[],
  blocked: DecisionLogEntry[],
  assetsTraded: Asset[],
  realizedPnl: number,
  maxDrawdown: number,
): string {
  const parts: string[] = [];

  if (trades.length === 0) {
    parts.push('No trades were executed today.');
    if (blocked.length > 0) {
      parts.push(`However, ${blocked.length} potential setup(s) were blocked by filters, preventing overtrading.`);
    }
    return parts.join(' ');
  }

  // Most active asset
  const assetCounts: Record<string, number> = {};
  trades.forEach(t => { assetCounts[t.asset] = (assetCounts[t.asset] || 0) + 1; });
  const mostActive = Object.entries(assetCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostActive) {
    const info = ASSET_INFO[mostActive[0] as Asset];
    parts.push(`${info?.symbol || mostActive[0]} was the most active asset with ${mostActive[1]} trade(s).`);
  }

  // Long vs short bias
  const longs = trades.filter(t => t.direction === 'long').length;
  const shorts = trades.filter(t => t.direction === 'short').length;
  if (longs > shorts * 2) {
    parts.push('The session was heavily long-biased, suggesting bullish market conditions.');
  } else if (shorts > longs * 2) {
    parts.push('The session was heavily short-biased, suggesting bearish market conditions.');
  } else if (longs > 0 && shorts > 0) {
    parts.push('Trades were mixed between longs and shorts, suggesting choppy or transitional conditions.');
  }

  // Filter activity
  if (blocked.length > trades.length) {
    parts.push(`Filters prevented overtrading, blocking ${blocked.length} potential setup(s) vs ${trades.length} executed trade(s).`);
  }

  // Performance
  if (realizedPnl > 0) {
    parts.push(`Net positive day with $${realizedPnl.toFixed(2)} in realized profits.`);
  } else if (realizedPnl < 0) {
    parts.push(`Net negative day with -$${Math.abs(realizedPnl).toFixed(2)} in realized losses.`);
  }

  if (maxDrawdown > 5) {
    parts.push(`Maximum drawdown reached ${maxDrawdown.toFixed(1)}%, which is elevated.`);
  }

  // Win rate
  const wins = trades.filter(t => t.type === 'win').length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  if (winRate >= 60) {
    parts.push('Performance was driven by consistent trend-following with a high win rate.');
  } else if (winRate < 40) {
    parts.push('Low win rate suggests the strategy may have been fighting noise or whipsawing conditions.');
  }

  return parts.join(' ');
}

// ─── Session Summary ─────────────────────────────────────────────────

export function generateSessionSummary(
  state: TradingState,
  sessionStartTime: number,
  totalAlerts: number,
  unrealizedPnl: number,
): SessionSummary {
  const netPnl = state.trades.reduce((s, t) => s + t.pnl, 0);
  
  // Per-asset pnl
  const assetPnl: Record<string, number> = {};
  state.trades.forEach(t => {
    assetPnl[t.asset] = (assetPnl[t.asset] || 0) + t.pnl;
  });

  const assetEntries = Object.entries(assetPnl).sort((a, b) => b[1] - a[1]);
  const bestAsset = assetEntries.length > 0
    ? { asset: assetEntries[0][0] as Asset, pnl: assetEntries[0][1] }
    : null;
  const worstAsset = assetEntries.length > 1
    ? { asset: assetEntries[assetEntries.length - 1][0] as Asset, pnl: assetEntries[assetEntries.length - 1][1] }
    : null;

  let tradingStatus: SessionSummary['tradingStatus'] = 'stopped';
  if (state.isRunning && !state.isPaused) tradingStatus = 'active';
  else if (state.isPaused) tradingStatus = 'risk_locked';
  else if (!state.isRunning) tradingStatus = 'stopped';

  return {
    sessionStartTime,
    durationMs: Date.now() - sessionStartTime,
    totalAlerts,
    totalTrades: state.trades.length,
    netPnl,
    unrealizedPnl,
    bestAsset,
    worstAsset,
    tradingStatus,
    portfolioEquity: state.balance + unrealizedPnl,
  };
}
