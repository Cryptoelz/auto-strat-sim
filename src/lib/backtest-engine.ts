/**
 * Core backtest simulation engine with full long/short support and filter integration.
 * Used by useBacktest, StrategyOptimizer, and WalkForwardAnalysis.
 */

import { Asset, Candle, PositionDirection, TradeReason } from '@/types/trading';
import { BacktestTrade } from '@/types/backtest';
import {
  calculateSMASeries,
  detectCrossover,
  calculateATRPercent,
  calculateSMADistance,
  detectMarketRegime,
} from './indicators';
import {
  calculateStopLoss,
  calculateTakeProfit,
  calculateFees,
  calculatePnl,
} from './riskManager';

export interface BacktestEngineConfig {
  fastSMA: number;
  slowSMA: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
  // Filter settings (optional — disabled by default for optimizer speed)
  enableFilters?: boolean;
  atrPeriod?: number;
  minAtrPercent?: number;
  minSmaDistancePercent?: number;
  cooldownCandles?: number;
  maxDailyLossPercent?: number;
  maxConsecutiveLosses?: number;
}

interface OpenPosition {
  direction: PositionDirection;
  entryPrice: number;
  entryTime: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
}

export interface BacktestEngineResult {
  trades: BacktestTrade[];
  finalBalance: number;
}

export interface QuickBacktestResult {
  pnl: number;
  wins: number;
  losses: number;
  maxDrawdown: number;
  longWins: number;
  longLosses: number;
  shortWins: number;
  shortLosses: number;
}

/**
 * Full backtest simulation with long/short, filters, flip logic, risk controls.
 * Executes on confirmed candle close only.
 */
export function runBacktestSimulation(
  candles: Candle[],
  asset: Asset,
  config: BacktestEngineConfig,
  initialBalance: number
): BacktestEngineResult {
  const trades: BacktestTrade[] = [];
  let balance = initialBalance;
  let position: OpenPosition | null = null;
  let lastTradeCandle = -1; // Prevent duplicate trades on same candle
  let consecutiveLosses = 0;
  let dailyPnl = 0;
  let dailyDate = '';
  let pauseUntilCandle = -1;

  const { fastSMA, slowSMA, feePercent } = config;
  const useFilters = config.enableFilters ?? false;
  const atrPeriod = config.atrPeriod ?? 14;
  const minAtrPercent = config.minAtrPercent ?? 0;
  const minSmaDistancePercent = config.minSmaDistancePercent ?? 0;
  const cooldownCandles = config.cooldownCandles ?? 0;
  const maxDailyLossPercent = config.maxDailyLossPercent ?? 0;
  const maxConsecutiveLosses = config.maxConsecutiveLosses ?? 0;

  if (candles.length < slowSMA + 2) {
    return { trades, finalBalance: balance };
  }

  const fastSMAValues = calculateSMASeries(candles, fastSMA);
  const slowSMAValues = calculateSMASeries(candles, slowSMA);

  function closeTrade(
    pos: OpenPosition,
    exitPrice: number,
    exitTime: number,
    exitReason: TradeReason,
    candleIndex: number
  ): number {
    const exitFee = calculateFees(pos.size * exitPrice, feePercent);
    const rawPnl = calculatePnl(pos.direction, pos.entryPrice, exitPrice, pos.size);
    const netPnl = rawPnl - exitFee;
    const entryFee = calculateFees(pos.size * pos.entryPrice, feePercent);
    const totalFees = entryFee + exitFee;

    const pnlPercent = pos.direction === 'long'
      ? ((exitPrice - pos.entryPrice) / pos.entryPrice) * 100
      : ((pos.entryPrice - exitPrice) / pos.entryPrice) * 100;

    trades.push({
      id: `bt-${asset}-${pos.entryTime}-${candleIndex}`,
      asset,
      direction: pos.direction,
      type: netPnl >= 0 ? 'win' : 'loss',
      entryPrice: pos.entryPrice,
      exitPrice,
      entryTime: pos.entryTime,
      exitTime,
      pnl: netPnl,
      pnlPercent: pnlPercent / 100,
      size: pos.size,
      fees: totalFees,
      exitReason,
      entryReason: 'signal',
    });

    // Update risk tracking
    if (netPnl < 0) {
      consecutiveLosses++;
    } else {
      consecutiveLosses = 0;
    }

    // Daily P&L tracking
    const day = new Date(exitTime).toISOString().slice(0, 10);
    if (day !== dailyDate) {
      dailyDate = day;
      dailyPnl = 0;
    }
    dailyPnl += netPnl;

    balance += rawPnl - exitFee;
    return netPnl;
  }

  function openTrade(
    direction: PositionDirection,
    price: number,
    time: number,
    candleIndex: number
  ): OpenPosition | null {
    const positionValue = balance * (config.positionSizePercent / 100);
    const entryFee = calculateFees(positionValue, feePercent);
    const size = (positionValue - entryFee) / price;

    if (size <= 0 || positionValue >= balance) return null;

    balance -= entryFee; // Deduct entry fee immediately
    lastTradeCandle = candleIndex;

    return {
      direction,
      entryPrice: price,
      entryTime: time,
      size,
      stopLoss: calculateStopLoss(price, config.stopLossPercent, direction),
      takeProfit: calculateTakeProfit(price, config.takeProfitPercent, direction),
    };
  }

  function checkStopLossTakeProfit(pos: OpenPosition, candle: Candle): { triggered: boolean; exitPrice: number; reason: TradeReason } {
    if (pos.direction === 'long') {
      if (candle.low <= pos.stopLoss) {
        return { triggered: true, exitPrice: pos.stopLoss, reason: 'stop_loss' };
      }
      if (candle.high >= pos.takeProfit) {
        return { triggered: true, exitPrice: pos.takeProfit, reason: 'take_profit' };
      }
    } else {
      // Short: SL is above entry, TP is below entry
      if (candle.high >= pos.stopLoss) {
        return { triggered: true, exitPrice: pos.stopLoss, reason: 'stop_loss' };
      }
      if (candle.low <= pos.takeProfit) {
        return { triggered: true, exitPrice: pos.takeProfit, reason: 'take_profit' };
      }
    }
    return { triggered: false, exitPrice: 0, reason: 'stop_loss' };
  }

  function checkFilters(candleIndex: number): boolean {
    if (!useFilters) return true;

    // Risk pause
    if (candleIndex < pauseUntilCandle) return false;

    // Daily loss limit
    if (maxDailyLossPercent > 0) {
      const dailyLossPct = (Math.abs(Math.min(0, dailyPnl)) / initialBalance) * 100;
      if (dailyLossPct >= maxDailyLossPercent) {
        pauseUntilCandle = candleIndex + (config.cooldownCandles ?? 5);
        return false;
      }
    }

    // Consecutive losses
    if (maxConsecutiveLosses > 0 && consecutiveLosses >= maxConsecutiveLosses) {
      pauseUntilCandle = candleIndex + (config.cooldownCandles ?? 5);
      return false;
    }

    // ATR volatility filter
    if (minAtrPercent > 0 && candleIndex >= atrPeriod + 1) {
      const slice = candles.slice(0, candleIndex + 1);
      const atrPct = calculateATRPercent(slice, atrPeriod);
      if (atrPct !== null && atrPct < minAtrPercent) return false;
    }

    // SMA distance filter
    if (minSmaDistancePercent > 0) {
      const slice = candles.slice(0, candleIndex + 1);
      const dist = calculateSMADistance(slice, fastSMA, slowSMA);
      if (dist !== null && dist < minSmaDistancePercent) return false;
    }

    // Regime filter: block trades in sideways markets
    if (candleIndex >= slowSMA + 5) {
      const slice = candles.slice(0, candleIndex + 1);
      const regime = detectMarketRegime(slice, fastSMA, slowSMA, atrPeriod);
      if (regime === 'sideways') return false;
    }

    return true;
  }

  // Main simulation loop
  for (let i = slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const currentPrice = candle.close;

    // Reset daily P&L tracker on new day
    const day = new Date(candle.timestamp).toISOString().slice(0, 10);
    if (day !== dailyDate) {
      dailyDate = day;
      dailyPnl = 0;
    }

    // 1. Check SL/TP for existing position
    if (position) {
      const sltp = checkStopLossTakeProfit(position, candle);
      if (sltp.triggered) {
        closeTrade(position, sltp.exitPrice, candle.timestamp, sltp.reason, i);
        position = null;
        lastTradeCandle = i; // Prevent opening on same candle as SL/TP close
      }
    }

    // 2. Detect crossover signal
    const fastCurrent = fastSMAValues[i];
    const slowCurrent = slowSMAValues[i];
    const fastPrevious = fastSMAValues[i - 1];
    const slowPrevious = slowSMAValues[i - 1];
    const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);

    // 3. Handle position management
    if (position) {
      // Check for signal-based exit or flip
      if (crossover === 1 && position.direction === 'short') {
        // Bearish→Bullish crossover while short: close short, flip to long
        closeTrade(position, currentPrice, candle.timestamp, 'flip_to_long', i);
        position = null;
        if (i !== lastTradeCandle && checkFilters(i)) {
          position = openTrade('long', currentPrice, candle.timestamp, i);
        }
      } else if (crossover === -1 && position.direction === 'long') {
        // Bullish→Bearish crossover while long: close long, flip to short
        closeTrade(position, currentPrice, candle.timestamp, 'flip_to_short', i);
        position = null;
        if (i !== lastTradeCandle && checkFilters(i)) {
          position = openTrade('short', currentPrice, candle.timestamp, i);
        }
      }
    } else {
      // No position — check for new entry
      if (i === lastTradeCandle) continue; // Prevent duplicate on same candle
      if (cooldownCandles > 0 && i - lastTradeCandle < cooldownCandles && lastTradeCandle >= 0) continue;

      if (crossover !== 0 && checkFilters(i)) {
        const direction: PositionDirection = crossover === 1 ? 'long' : 'short';

        // Extra regime check: don't go long in bearish regime, don't go short in bullish
        if (useFilters && i >= slowSMA + 5) {
          const slice = candles.slice(0, i + 1);
          const regime = detectMarketRegime(slice, fastSMA, slowSMA, atrPeriod);
          if (direction === 'long' && regime === 'trending_bearish') continue;
          if (direction === 'short' && regime === 'trending_bullish') continue;
        }

        position = openTrade(direction, currentPrice, candle.timestamp, i);
      }
    }
  }

  // Close any remaining position at the last candle
  if (position && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    closeTrade(position, lastCandle.close, lastCandle.timestamp, 'bullish_crossover', candles.length - 1);
  }

  return { trades, finalBalance: balance };
}

/**
 * Quick backtest for optimizer/walk-forward — lighter weight, still supports long+short.
 * Filters are disabled for speed; only SMA crossover + SL/TP.
 */
export function runQuickBacktest(
  candles: Candle[],
  fastSMA: number,
  slowSMA: number,
  positionSizePercent: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  initialBalance: number,
  feePercent: number = 0.1
): QuickBacktestResult {
  let balance = initialBalance;
  let longWins = 0, longLosses = 0, shortWins = 0, shortLosses = 0;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let position: { direction: PositionDirection; entryPrice: number; size: number; stopLoss: number; takeProfit: number } | null = null;

  if (candles.length < slowSMA + 2) {
    return { pnl: 0, wins: 0, losses: 0, maxDrawdown: 0, longWins: 0, longLosses: 0, shortWins: 0, shortLosses: 0 };
  }

  const fastSMAValues = calculateSMASeries(candles, fastSMA);
  const slowSMAValues = calculateSMASeries(candles, slowSMA);
  const feeFraction = feePercent / 100;

  function closePos(exitPrice: number) {
    if (!position) return;
    const rawPnl = calculatePnl(position.direction, position.entryPrice, exitPrice, position.size);
    const exitFee = position.size * exitPrice * feeFraction;
    const entryFee = position.size * position.entryPrice * feeFraction;
    const netPnl = rawPnl - exitFee - entryFee;

    if (netPnl >= 0) {
      position.direction === 'long' ? longWins++ : shortWins++;
    } else {
      position.direction === 'long' ? longLosses++ : shortLosses++;
    }

    balance += rawPnl - exitFee;
    if (balance > peak) peak = balance;
    const dd = ((peak - balance) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;

    position = null;
  }

  for (let i = slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const price = candle.close;
    const fastCurr = fastSMAValues[i];
    const slowCurr = slowSMAValues[i];
    const fastPrev = fastSMAValues[i - 1];
    const slowPrev = slowSMAValues[i - 1];

    // Check SL/TP
    if (position) {
      if (position.direction === 'long') {
        if (candle.low <= position.stopLoss) { closePos(position.stopLoss); }
        else if (candle.high >= position.takeProfit) { closePos(position.takeProfit); }
      } else {
        if (candle.high >= position.stopLoss) { closePos(position.stopLoss); }
        else if (candle.low <= position.takeProfit) { closePos(position.takeProfit); }
      }
    }

    const crossover = detectCrossover(fastCurr, slowCurr, fastPrev, slowPrev);

    if (position) {
      // Flip logic
      if (crossover === 1 && position.direction === 'short') {
        closePos(price);
        const posVal = balance * (positionSizePercent / 100);
        const fee = posVal * feeFraction;
        const size = (posVal - fee) / price;
        if (size > 0 && posVal < balance) {
          balance -= fee;
          position = { direction: 'long', entryPrice: price, size, stopLoss: calculateStopLoss(price, stopLossPercent, 'long'), takeProfit: calculateTakeProfit(price, takeProfitPercent, 'long') };
        }
      } else if (crossover === -1 && position.direction === 'long') {
        closePos(price);
        const posVal = balance * (positionSizePercent / 100);
        const fee = posVal * feeFraction;
        const size = (posVal - fee) / price;
        if (size > 0 && posVal < balance) {
          balance -= fee;
          position = { direction: 'short', entryPrice: price, size, stopLoss: calculateStopLoss(price, stopLossPercent, 'short'), takeProfit: calculateTakeProfit(price, takeProfitPercent, 'short') };
        }
      }
    } else if (crossover !== 0) {
      const dir: PositionDirection = crossover === 1 ? 'long' : 'short';
      const posVal = balance * (positionSizePercent / 100);
      const fee = posVal * feeFraction;
      const size = (posVal - fee) / price;
      if (size > 0 && posVal < balance) {
        balance -= fee;
        position = { direction: dir, entryPrice: price, size, stopLoss: calculateStopLoss(price, stopLossPercent, dir), takeProfit: calculateTakeProfit(price, takeProfitPercent, dir) };
      }
    }
  }

  // Close remaining
  if (position && candles.length > 0) {
    closePos(candles[candles.length - 1].close);
  }

  return {
    pnl: balance - initialBalance,
    wins: longWins + shortWins,
    losses: longLosses + shortLosses,
    maxDrawdown,
    longWins,
    longLosses,
    shortWins,
    shortLosses,
  };
}
