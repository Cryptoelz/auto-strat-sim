/**
 * Shared trading calculation utilities.
 * Single source of truth for PnL, drawdown, equity, and position calculations.
 */
import { Asset, TradingState } from '@/types/trading';

/** Compute unrealized PnL for a single position */
export function computePositionPnl(
  entryPrice: number,
  currentPrice: number,
  size: number,
  direction: 'long' | 'short',
): number {
  return direction === 'long'
    ? (currentPrice - entryPrice) * size
    : (entryPrice - currentPrice) * size;
}

/** Compute total unrealized PnL across all positions */
export function computeUnrealizedPnl(
  positions: TradingState['positions'],
  prices: Record<Asset, number | null>,
): number {
  let total = 0;
  for (const [asset, pos] of Object.entries(positions)) {
    if (!pos || !prices[asset as Asset]) continue;
    total += computePositionPnl(pos.entryPrice, prices[asset as Asset]!, pos.size, pos.direction);
  }
  return total;
}

/** Compute total equity (balance + unrealized PnL) */
export function computeEquity(
  balance: number,
  positions: TradingState['positions'],
  prices: Record<Asset, number | null>,
): number {
  return balance + computeUnrealizedPnl(positions, prices);
}

/** Compute realized PnL from trade history */
export function computeRealizedPnl(trades: TradingState['trades']): number {
  return trades.reduce((sum, t) => sum + t.pnl, 0);
}

/** Compute drawdown percentage from peak equity */
export function computeDrawdown(currentEquity: number, peakEquity: number): number {
  if (peakEquity <= 0) return 0;
  return Math.max(0, ((peakEquity - currentEquity) / peakEquity) * 100);
}

/** Compute total return percentage */
export function computeTotalReturn(currentEquity: number, initialBalance: number): number {
  if (initialBalance <= 0) return 0;
  return ((currentEquity - initialBalance) / initialBalance) * 100;
}

/** Compute daily PnL from trades */
export function computeDailyPnl(trades: TradingState['trades']): number {
  const today = new Date().toISOString().slice(0, 10);
  return trades
    .filter(t => new Date(t.exitTime).toISOString().slice(0, 10) === today)
    .reduce((s, t) => s + t.pnl, 0);
}

/** Compute trade statistics */
export function computeTradeStats(trades: TradingState['trades']) {
  const total = trades.length;
  const wins = trades.filter(t => t.type === 'win').length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const longTrades = trades.filter(t => t.direction === 'long').length;
  const shortTrades = trades.filter(t => t.direction === 'short').length;
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  return { total, wins, winRate, longTrades, shortTrades, grossProfit, grossLoss, profitFactor };
}
