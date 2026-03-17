import { Trade, TradingState, PerformanceMetrics } from '@/types/trading';

export function calculatePerformanceMetrics(state: TradingState): PerformanceMetrics {
  const { trades, balance, initialBalance } = state;

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.type === 'win');
  const losses = trades.filter((t) => t.type === 'loss');
  const winningTrades = wins.length;
  const losingTrades = losses.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalPnlPercent = ((balance - initialBalance) / initialBalance) * 100;

  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const maxDrawdown = calculateMaxDrawdown(trades, initialBalance);
  const equityCurve = generateEquityCurve(trades, initialBalance);

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    totalPnl,
    totalPnlPercent,
    maxDrawdown,
    avgWin,
    avgLoss,
    profitFactor,
    equityCurve,
  };
}

function calculateMaxDrawdown(trades: Trade[], initialBalance: number): number {
  if (trades.length === 0) return 0;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let runningBalance = initialBalance;

  for (const trade of trades) {
    runningBalance += trade.pnl;
    if (runningBalance > peak) peak = runningBalance;
    const drawdown = ((peak - runningBalance) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return maxDrawdown;
}

function generateEquityCurve(trades: Trade[], initialBalance: number): { timestamp: number; balance: number }[] {
  const curve = [{ timestamp: trades[0]?.entryTime || Date.now(), balance: initialBalance }];
  let runningBalance = initialBalance;

  for (const trade of trades) {
    runningBalance += trade.pnl;
    curve.push({ timestamp: trade.exitTime, balance: runningBalance });
  }

  return curve;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatCrypto(value: number, decimals: number = 6): string {
  return value.toFixed(decimals);
}
