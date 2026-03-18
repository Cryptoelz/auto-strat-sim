import { Trade, TradingState, TradingConfig } from '@/types/trading';
import { PortfolioConfig } from '@/types/portfolio';
import { ASSET_INFO } from '@/config/trading';
import { DailySummary } from './dailySummary';
import { TradingAlert } from './alerts';

// ─── CSV Export ──────────────────────────────────────────────────────

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = [
    'ID', 'Asset', 'Direction', 'Entry Price', 'Exit Price',
    'Entry Time', 'Exit Time', 'Size', 'Fees', 'PnL', 'PnL %',
    'Type', 'Exit Reason',
  ];

  const rows = trades.map(t => [
    t.id,
    t.asset,
    t.direction,
    t.entryPrice.toFixed(6),
    t.exitPrice.toFixed(6),
    new Date(t.entryTime).toISOString(),
    new Date(t.exitTime).toISOString(),
    t.size.toFixed(8),
    t.fees.toFixed(4),
    t.pnl.toFixed(4),
    t.pnlPercent.toFixed(4),
    t.type,
    t.exitReason,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportAlertsToCSV(alerts: TradingAlert[]): string {
  const headers = ['Timestamp', 'Severity', 'Category', 'Asset', 'Event', 'Explanation', 'Action Taken'];
  const rows = alerts.map(a => [
    new Date(a.timestamp).toISOString(),
    a.severity,
    a.category,
    a.asset || '-',
    a.eventType,
    `"${a.explanation.replace(/"/g, '""')}"`,
    a.actionTaken ? 'Yes' : 'No',
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function exportDailySummaryToCSV(summaries: DailySummary[]): string {
  const headers = [
    'Date', 'Total Trades', 'Long', 'Short', 'Wins', 'Losses',
    'Realized PnL', 'Daily Return %', 'Max Drawdown', 'Blocked Setups',
    'Assets Traded', 'Commentary',
  ];
  const rows = summaries.map(s => [
    s.date,
    s.totalTrades,
    s.longTrades,
    s.shortTrades,
    s.wins,
    s.losses,
    s.realizedPnl.toFixed(2),
    s.dailyReturnPercent.toFixed(2),
    s.maxDrawdownReached.toFixed(2),
    s.blockedSetups,
    s.assetsTraded.map(a => ASSET_INFO[a]?.symbol || a).join('+'),
    `"${s.commentary.replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// ─── JSON Export ─────────────────────────────────────────────────────

export function exportSessionJSON(
  state: TradingState,
  config: TradingConfig,
  portfolioConfig: PortfolioConfig,
  alerts: TradingAlert[],
  summaries: DailySummary[],
): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    simulation: true,
    config: {
      timeframe: config.timeframe,
      assets: config.assets,
      indicators: config.indicators,
      risk: config.risk,
      fees: config.fees,
      filters: config.filters,
    },
    portfolioConfig,
    state: {
      balance: state.balance,
      initialBalance: state.initialBalance,
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      pauseReason: state.pauseReason,
      dailyPnl: state.dailyPnl,
      consecutiveLosses: state.consecutiveLosses,
    },
    trades: state.trades,
    alerts,
    dailySummaries: summaries,
    metrics: {
      totalTrades: state.trades.length,
      wins: state.trades.filter(t => t.type === 'win').length,
      losses: state.trades.filter(t => t.type === 'loss').length,
      netPnl: state.trades.reduce((s, t) => s + t.pnl, 0),
      winRate: state.trades.length > 0
        ? (state.trades.filter(t => t.type === 'win').length / state.trades.length) * 100
        : 0,
    },
  }, null, 2);
}

// ─── Download Helper ─────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
