import { format } from 'date-fns';
import { BacktestResult, SavedRun } from '@/types/backtest';

export type { SavedRun } from '@/types/backtest';

const SAVED_RUNS_KEY = 'backtest-saved-runs';

export function loadSavedRuns(): SavedRun[] {
  try {
    const saved = localStorage.getItem(SAVED_RUNS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveSavedRuns(runs: SavedRun[]) {
  localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(runs));
}

export function exportResultToCSV(result: BacktestResult, config: { fastSMA: number; slowSMA: number; timeframe: string }) {
  const lines: string[] = [];
  
  // Summary section
  lines.push('BACKTEST SUMMARY');
  lines.push(`Strategy,SMA ${config.fastSMA}/${config.slowSMA} ${config.timeframe}`);
  lines.push(`Final Balance,${result.finalBalance.toFixed(2)}`);
  lines.push(`Total P&L,${result.totalPnl.toFixed(2)}`);
  lines.push(`Return %,${result.totalPnlPercent.toFixed(2)}`);
  lines.push(`Win Rate %,${result.winRate.toFixed(2)}`);
  lines.push(`Total Trades,${result.totalTrades}`);
  lines.push(`Max Drawdown %,${result.maxDrawdown.toFixed(2)}`);
  lines.push(`Profit Factor,${result.profitFactor === Infinity ? 'Infinity' : result.profitFactor.toFixed(2)}`);
  lines.push(`Sharpe Ratio,${result.sharpeRatio.toFixed(2)}`);
  lines.push('');
  
  // Trade history section
  lines.push('TRADE HISTORY');
  lines.push('Asset,Type,Entry Time,Exit Time,Entry Price,Exit Price,Size,P&L,P&L %,Fees,Exit Reason');
  result.trades.forEach(trade => {
    lines.push([
      trade.asset,
      trade.type,
      new Date(trade.entryTime).toISOString(),
      new Date(trade.exitTime).toISOString(),
      trade.entryPrice.toFixed(4),
      trade.exitPrice.toFixed(4),
      trade.size.toFixed(6),
      trade.pnl.toFixed(2),
      trade.pnlPercent.toFixed(2),
      trade.fees.toFixed(2),
      trade.exitReason
    ].join(','));
  });
  
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backtest-${config.fastSMA}-${config.slowSMA}-${config.timeframe}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportComparisonToCSV(runs: SavedRun[]) {
  const lines: string[] = [];
  
  lines.push('STRATEGY COMPARISON');
  lines.push('Name,Assets,Start Date,End Date,Timeframe,Fast SMA,Slow SMA,Initial Balance,Position Size %,Stop Loss %,Take Profit %,Final Balance,Total P&L,Return %,Win Rate %,Total Trades,Max Drawdown %,Profit Factor,Sharpe Ratio,Saved At');
  
  runs.forEach(run => {
    lines.push([
      `"${run.name}"`,
      `"${run.config.assets.join(', ')}"`,
      format(new Date(run.config.startDate), 'yyyy-MM-dd'),
      format(new Date(run.config.endDate), 'yyyy-MM-dd'),
      run.config.timeframe,
      run.config.fastSMA,
      run.config.slowSMA,
      run.config.initialBalance,
      run.config.positionSizePercent,
      run.config.stopLossPercent,
      run.config.takeProfitPercent,
      run.result.finalBalance.toFixed(2),
      run.result.totalPnl.toFixed(2),
      run.result.totalPnlPercent.toFixed(2),
      run.result.winRate.toFixed(2),
      run.result.totalTrades,
      run.result.maxDrawdown.toFixed(2),
      run.result.profitFactor === Infinity ? 'Infinity' : run.result.profitFactor.toFixed(2),
      run.result.sharpeRatio.toFixed(2),
      format(new Date(run.savedAt), 'yyyy-MM-dd HH:mm')
    ].join(','));
  });
  
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backtest-comparison-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
