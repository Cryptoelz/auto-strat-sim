import { useState, useCallback } from 'react';
import { Asset, Candle, Trade } from '@/types/trading';
import { calculateSMASeries, detectCrossover } from '@/lib/indicators';

const BINANCE_API = 'https://api.binance.com/api/v3';

export interface BacktestConfig {
  assets: Asset[];
  startDate: Date;
  endDate: Date;
  timeframe: '5m' | '15m' | '1h' | '4h';
  fastSMA: number;
  slowSMA: number;
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
}

export interface BacktestTrade extends Trade {
  entryReason: 'signal';
}

export interface EquityPoint {
  timestamp: number;
  balance: number;
  drawdown: number;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  finalBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  equityCurve: EquityPoint[];
  assetResults: Record<Asset, {
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

// Timeframe to milliseconds mapping
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
  const limit = 1000; // Binance max limit

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
      
      // Move start time to after the last candle
      currentStart = candles[candles.length - 1].timestamp + TIMEFRAME_MS[interval];
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching candles for ${asset}:`, error);
      break;
    }
  }

  return allCandles;
}

function runBacktestSimulation(
  candles: Candle[],
  asset: Asset,
  config: BacktestConfig,
  initialBalance: number
): { trades: BacktestTrade[]; finalBalance: number } {
  const trades: BacktestTrade[] = [];
  let balance = initialBalance;
  let position: { entryPrice: number; size: number; entryTime: number; stopLoss: number; takeProfit: number } | null = null;

  if (candles.length < config.slowSMA + 1) {
    return { trades, finalBalance: balance };
  }

  const fastSMA = calculateSMASeries(candles, config.fastSMA);
  const slowSMA = calculateSMASeries(candles, config.slowSMA);

  for (let i = config.slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const currentPrice = candle.close;
    
    const fastCurrent = fastSMA[i];
    const slowCurrent = slowSMA[i];
    const fastPrevious = fastSMA[i - 1];
    const slowPrevious = slowSMA[i - 1];

    // Check stop loss / take profit for existing position
    if (position) {
      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      
      let shouldClose = false;
      let exitReason: 'stop_loss' | 'take_profit' | 'signal' = 'signal';

      // Check if price hit stop loss (using candle low)
      if (candle.low <= position.stopLoss) {
        shouldClose = true;
        exitReason = 'stop_loss';
      }
      // Check if price hit take profit (using candle high)
      else if (candle.high >= position.takeProfit) {
        shouldClose = true;
        exitReason = 'take_profit';
      }
      // Check for sell signal
      else {
        const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);
        if (crossover === -1) {
          shouldClose = true;
          exitReason = 'signal';
        }
      }

      if (shouldClose) {
        const exitPrice = exitReason === 'stop_loss' 
          ? position.stopLoss 
          : exitReason === 'take_profit' 
            ? position.takeProfit 
            : currentPrice;
        
        const grossPnl = (exitPrice - position.entryPrice) * position.size;
        const fee = position.size * exitPrice * (config.feePercent / 100);
        const entryFee = position.size * position.entryPrice * (config.feePercent / 100);
        const totalFees = fee + entryFee;
        const netPnl = grossPnl - fee;
        const pnlPercentFinal = (netPnl / (position.entryPrice * position.size)) * 100;

        trades.push({
          id: `bt-${asset}-${position.entryTime}`,
          asset,
          type: netPnl >= 0 ? 'win' : 'loss',
          entryPrice: position.entryPrice,
          exitPrice,
          entryTime: position.entryTime,
          exitTime: candle.timestamp,
          pnl: netPnl,
          pnlPercent: pnlPercentFinal / 100,
          size: position.size,
          fees: totalFees,
          exitReason,
          entryReason: 'signal',
        });

        balance += netPnl;
        position = null;
      }
    }

    // Check for buy signal (only if no position)
    if (!position) {
      const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);
      
      if (crossover === 1) {
        const positionValue = balance * (config.positionSizePercent / 100);
        const fee = positionValue * (config.feePercent / 100);
        const size = (positionValue - fee) / currentPrice;
        
        if (size > 0 && positionValue < balance) {
          position = {
            entryPrice: currentPrice,
            size,
            entryTime: candle.timestamp,
            stopLoss: currentPrice * (1 - config.stopLossPercent / 100),
            takeProfit: currentPrice * (1 + config.takeProfitPercent / 100),
          };
          balance -= fee; // Entry fee
        }
      }
    }
  }

  // Close any remaining position at the end
  if (position && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const grossPnl = (exitPrice - position.entryPrice) * position.size;
    const fee = position.size * exitPrice * (config.feePercent / 100);
    const entryFee = position.size * position.entryPrice * (config.feePercent / 100);
    const totalFees = fee + entryFee;
    const netPnl = grossPnl - fee;
    const pnlPercent = (netPnl / (position.entryPrice * position.size)) * 100;

    trades.push({
      id: `bt-${asset}-${position.entryTime}`,
      asset,
      type: netPnl >= 0 ? 'win' : 'loss',
      entryPrice: position.entryPrice,
      exitPrice,
      entryTime: position.entryTime,
      exitTime: lastCandle.timestamp,
      pnl: netPnl,
      pnlPercent: pnlPercent / 100,
      size: position.size,
      fees: totalFees,
      exitReason: 'signal',
      entryReason: 'signal',
    });

    balance += netPnl;
  }

  return { trades, finalBalance: balance };
}

export function useBacktest() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async (config: BacktestConfig) => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);
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

      for (let i = 0; i < config.assets.length; i++) {
        const asset = config.assets[i];
        setProgress(((i + 0.5) / config.assets.length) * 100);

        const candles = await fetchHistoricalCandles(asset, config.timeframe, startTime, endTime);
        
        if (candles.length === 0) {
          console.warn(`No candles fetched for ${asset}`);
          continue;
        }

        const { trades, finalBalance } = runBacktestSimulation(candles, asset, config, balancePerAsset);
        
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

      // Calculate overall statistics
      const winningTrades = allTrades.filter(t => t.type === 'win');
      const losingTrades = allTrades.filter(t => t.type === 'loss');
      const totalPnl = totalBalance - config.initialBalance;
      const totalPnlPercent = (totalPnl / config.initialBalance) * 100;

      // Calculate max drawdown and build equity curve
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

      // Calculate profit factor
      const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

      // Calculate average win/loss
      const averageWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
        : 0;
      const averageLoss = losingTrades.length > 0 
        ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length 
        : 0;

      // Simple Sharpe ratio approximation (using daily returns would be more accurate)
      const returns = allTrades.map(t => t.pnlPercent);
      const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
      const stdDev = returns.length > 1 
        ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
        : 0;
      const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

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