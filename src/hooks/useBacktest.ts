import { useState, useCallback } from 'react';
import { Asset, Candle } from '@/types/trading';
import { BacktestConfig, BacktestTrade, BacktestResult, EquityPoint } from '@/types/backtest';
import { runBacktestSimulation, BacktestEngineConfig } from '@/lib/backtest-engine';
import { runAuditBacktest, AuditEntry } from '@/lib/backtest-audit';

const BINANCE_API = 'https://api.binance.com/api/v3';

const TIMEFRAME_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

async function fetchHistoricalCandles(
  asset: Asset,
  interval: string,
  startTime: number,
  endTime: number
): Promise<Candle[]> {
  const allCandles: Candle[] = [];
  let currentStart = startTime;
  const limit = 1000;

  while (currentStart < endTime) {
    try {
      const response = await fetch(
        `${BINANCE_API}/klines?symbol=${asset}&interval=${interval}&startTime=${currentStart}&endTime=${endTime}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch candles: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.length === 0) break;

      const candles: Candle[] = data.map((candle: (string | number)[]) => ({
        timestamp: Number(candle[0]),
        open: parseFloat(candle[1] as string),
        high: parseFloat(candle[2] as string),
        low: parseFloat(candle[3] as string),
        close: parseFloat(candle[4] as string),
        volume: parseFloat(candle[5] as string),
      }));

      allCandles.push(...candles);
      currentStart = candles[candles.length - 1].timestamp + TIMEFRAME_MS[interval];
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching candles for ${asset}:`, error);
      break;
    }
  }

  return allCandles;
}

export function useBacktest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async (config: BacktestConfig) => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);
    setAuditLog([]);
    setError(null);

    try {
      const startTime = config.startDate.getTime();
      const endTime = config.endDate.getTime();
      
      const allTrades: BacktestTrade[] = [];
      let totalBalance = config.initialBalance;
      const balancePerAsset = config.initialBalance / config.assets.length;

      const assetResults: Record<Asset, { trades: number; pnl: number; winRate: number }> = {
        BTCUSDT: { trades: 0, pnl: 0, winRate: 0 },
        XRPUSDT: { trades: 0, pnl: 0, winRate: 0 },
        FETUSDT: { trades: 0, pnl: 0, winRate: 0 },
        XLMUSDT: { trades: 0, pnl: 0, winRate: 0 },
      };

      const engineConfig: BacktestEngineConfig = {
        fastSMA: config.fastSMA,
        slowSMA: config.slowSMA,
        positionSizePercent: config.positionSizePercent,
        stopLossPercent: config.stopLossPercent,
        takeProfitPercent: config.takeProfitPercent,
        feePercent: config.feePercent,
        enableFilters: true,
        atrPeriod: 14,
        minAtrPercent: 0.5,
        minSmaDistancePercent: 0.1,
        cooldownCandles: 3,
        maxDailyLossPercent: 5,
        maxConsecutiveLosses: 5,
      };

      const allAudit: AuditEntry[] = [];

      for (let i = 0; i < config.assets.length; i++) {
        const asset = config.assets[i];
        setProgress(((i + 0.5) / config.assets.length) * 100);

        const candles = await fetchHistoricalCandles(asset, config.timeframe, startTime, endTime);
        
        if (candles.length === 0) {
          console.warn(`No candles fetched for ${asset}`);
          continue;
        }

        // Use audit engine to get both trades and audit log
        const { trades, finalBalance, audit } = runAuditBacktest(candles, asset, engineConfig, balancePerAsset);
        allAudit.push(...audit);
        
        allTrades.push(...trades);
        totalBalance += (finalBalance - balancePerAsset);

        const assetWins = trades.filter(t => t.type === 'win').length;
        assetResults[asset] = {
          trades: trades.length,
          pnl: trades.reduce((sum, t) => sum + t.pnl, 0),
          winRate: trades.length > 0 ? (assetWins / trades.length) * 100 : 0,
        };

        setProgress(((i + 1) / config.assets.length) * 100);
      }

      setAuditLog(allAudit);

      // Calculate overall statistics
      const winningTrades = allTrades.filter(t => t.type === 'win');
      const losingTrades = allTrades.filter(t => t.type === 'loss');
      const totalPnl = totalBalance - config.initialBalance;
      const totalPnlPercent = (totalPnl / config.initialBalance) * 100;

      // Build equity curve and calculate max drawdown
      let peak = config.initialBalance;
      let maxDrawdown = 0;
      let runningBalance = config.initialBalance;
      const equityCurve: EquityPoint[] = [
        { timestamp: config.startDate.getTime(), balance: config.initialBalance, drawdown: 0 }
      ];
      
      allTrades.sort((a, b) => a.exitTime - b.exitTime);
      for (const trade of allTrades) {
        runningBalance += trade.pnl;
        if (runningBalance > peak) peak = runningBalance;
        const drawdown = ((peak - runningBalance) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        
        equityCurve.push({
          timestamp: trade.exitTime,
          balance: runningBalance,
          drawdown,
        });
      }

      // Profit factor
      const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

      // Average win/loss
      const averageWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
        : 0;
      const averageLoss = losingTrades.length > 0 
        ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
        : 0;

      // Risk-adjusted metrics
      const returns = allTrades.map(t => t.pnlPercent);
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const stdDev = returns.length > 1 
        ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
        : 0;
      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

      const negativeReturns = returns.filter(r => r < 0);
      const downsideDeviation = negativeReturns.length > 1
        ? Math.sqrt(negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length)
        : 0;
      const sortinoRatio = downsideDeviation > 0 ? (avgReturn / downsideDeviation) * Math.sqrt(252) : 0;

      const testPeriodDays = (config.endDate.getTime() - config.startDate.getTime()) / (1000 * 60 * 60 * 24);
      const annualizedReturn = testPeriodDays > 0 ? (totalPnlPercent / testPeriodDays) * 365 : 0;
      const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

      setResult({
        trades: allTrades,
        finalBalance: totalBalance,
        totalPnl,
        totalPnlPercent,
        winRate: allTrades.length > 0 ? (winningTrades.length / allTrades.length) * 100 : 0,
        totalTrades: allTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        maxDrawdown,
        sharpeRatio,
        sortinoRatio,
        calmarRatio,
        profitFactor,
        averageWin,
        averageLoss,
        equityCurve,
        assetResults,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during backtesting');
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    isRunning,
    progress,
    result,
    error,
    runBacktest,
    reset,
  };
}
