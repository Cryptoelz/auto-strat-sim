import { Trade, TradingState, PerformanceMetrics } from '@/types/trading';

/**
 * Calculate performance metrics from trading history
 */
export function calculatePerformanceMetrics(state: TradingState): PerformanceMetrics {
  const { trades, balance, initialBalance } = state;

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.type === 'win').length;
  const losingTrades = trades.filter((t) => t.type === 'loss').length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalPnlPercent = ((balance - initialBalance) / initialBalance) * 100;

  // Calculate max drawdown
  const maxDrawdown = calculateMaxDrawdown(trades, initialBalance);

  // Generate equity curve
  const equityCurve = generateEquityCurve(trades, initialBalance);

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalPnl,
    totalPnlPercent,
    maxDrawdown,
    equityCurve,
  };
}

/**
 * Calculate maximum drawdown
 */
function calculateMaxDrawdown(trades: Trade[], initialBalance: number): number {
  if (trades.length === 0) return 0;

  let peak = initialBalance;
  let maxDrawdown = 0;
  let runningBalance = initialBalance;

  for (const trade of trades) {
    runningBalance += trade.pnl;

    if (runningBalance > peak) {
      peak = runningBalance;
    }

    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Generate equity curve data points
 */
function generateEquityCurve(
  trades: Trade[],
  initialBalance: number
): { timestamp: number; balance: number }[] {
  const curve: { timestamp: number; balance: number }[] = [
    { timestamp: trades[0]?.entryTime || Date.now(), balance: initialBalance },
  ];

  let runningBalance = initialBalance;

  for (const trade of trades) {
    runningBalance += trade.pnl;
    curve.push({
      timestamp: trade.exitTime,
      balance: runningBalance,
    });
  }

  return curve;
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format crypto amount
 */
export function formatCrypto(value: number, decimals: number = 6): string {
  return value.toFixed(decimals);
}
