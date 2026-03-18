/**
 * Extended backtest engine that also produces an audit log for every candle.
 * Re-exports the standard simulation with added diagnostics.
 */

import { Asset, Candle, MarketRegime, PositionDirection, TradeReason } from '@/types/trading';
import { BacktestTrade } from '@/types/backtest';
import {
  calculateSMASeries,
  detectCrossover,
  calculateATR,
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
import { BacktestEngineConfig } from './backtest-engine';

export interface AuditEntry {
  candleIndex: number;
  timestamp: number;
  price: number;
  fastSMA: number | null;
  slowSMA: number | null;
  atr: number | null;
  atrPercent: number | null;
  smaDistance: number | null;
  regime: MarketRegime;
  crossover: 1 | -1 | 0;
  signal: 'BUY' | 'SELL' | 'HOLD';
  filtersPass: boolean;
  filtersFailed: string[];
  action: string;
  positionState: string;
  realizedPnl: number;
  unrealizedPnl: number;
  balance: number;
  explanation: string;
}

export interface AuditBacktestResult {
  trades: BacktestTrade[];
  finalBalance: number;
  audit: AuditEntry[];
}

export function runAuditBacktest(
  candles: Candle[],
  asset: Asset,
  config: BacktestEngineConfig,
  initialBalance: number
): AuditBacktestResult {
  const trades: BacktestTrade[] = [];
  const audit: AuditEntry[] = [];
  let balance = initialBalance;
  let position: { direction: PositionDirection; entryPrice: number; entryTime: number; size: number; stopLoss: number; takeProfit: number } | null = null;
  let lastTradeCandle = -1;
  let consecutiveLosses = 0;
  let dailyPnl = 0;
  let dailyDate = '';
  let pauseUntilCandle = -1;
  let totalRealizedPnl = 0;

  const { fastSMA, slowSMA, feePercent } = config;
  const useFilters = config.enableFilters ?? false;
  const atrPeriod = config.atrPeriod ?? 14;
  const minAtrPercent = config.minAtrPercent ?? 0;
  const minSmaDistancePercent = config.minSmaDistancePercent ?? 0;
  const cooldownCandles = config.cooldownCandles ?? 0;
  const maxDailyLossPercent = config.maxDailyLossPercent ?? 0;
  const maxConsecutiveLosses = config.maxConsecutiveLosses ?? 0;

  if (candles.length < slowSMA + 2) {
    return { trades, finalBalance: balance, audit };
  }

  const fastSMAValues = calculateSMASeries(candles, fastSMA);
  const slowSMAValues = calculateSMASeries(candles, slowSMA);

  function closeTrade(
    pos: typeof position,
    exitPrice: number,
    exitTime: number,
    exitReason: TradeReason,
    candleIndex: number
  ): number {
    if (!pos) return 0;
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

    if (netPnl < 0) consecutiveLosses++;
    else consecutiveLosses = 0;

    const day = new Date(exitTime).toISOString().slice(0, 10);
    if (day !== dailyDate) { dailyDate = day; dailyPnl = 0; }
    dailyPnl += netPnl;
    balance += rawPnl - exitFee;
    totalRealizedPnl += netPnl;
    return netPnl;
  }

  function checkFiltersDetailed(candleIndex: number): { pass: boolean; failed: string[] } {
    const failed: string[] = [];
    if (!useFilters) return { pass: true, failed };

    if (candleIndex < pauseUntilCandle) {
      failed.push('risk_pause_active');
      return { pass: false, failed };
    }

    if (maxDailyLossPercent > 0) {
      const dailyLossPct = (Math.abs(Math.min(0, dailyPnl)) / initialBalance) * 100;
      if (dailyLossPct >= maxDailyLossPercent) {
        failed.push(`daily_loss_limit (${dailyLossPct.toFixed(1)}% >= ${maxDailyLossPercent}%)`);
        pauseUntilCandle = candleIndex + (cooldownCandles || 5);
      }
    }

    if (maxConsecutiveLosses > 0 && consecutiveLosses >= maxConsecutiveLosses) {
      failed.push(`consecutive_losses (${consecutiveLosses} >= ${maxConsecutiveLosses})`);
      pauseUntilCandle = candleIndex + (cooldownCandles || 5);
    }

    if (minAtrPercent > 0 && candleIndex >= atrPeriod + 1) {
      const slice = candles.slice(0, candleIndex + 1);
      const atrPct = calculateATRPercent(slice, atrPeriod);
      if (atrPct !== null && atrPct < minAtrPercent) {
        failed.push(`atr_too_low (${atrPct.toFixed(2)}% < ${minAtrPercent}%)`);
      }
    }

    if (minSmaDistancePercent > 0) {
      const slice = candles.slice(0, candleIndex + 1);
      const dist = calculateSMADistance(slice, fastSMA, slowSMA);
      if (dist !== null && dist < minSmaDistancePercent) {
        failed.push(`sma_distance_too_small (${dist.toFixed(3)}% < ${minSmaDistancePercent}%)`);
      }
    }

    if (candleIndex >= slowSMA + 5) {
      const slice = candles.slice(0, candleIndex + 1);
      const regime = detectMarketRegime(slice, fastSMA, slowSMA, atrPeriod);
      if (regime === 'sideways') {
        failed.push('sideways_regime');
      }
    }

    return { pass: failed.length === 0, failed };
  }

  // Main loop
  for (let i = slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const price = candle.close;

    const day = new Date(candle.timestamp).toISOString().slice(0, 10);
    if (day !== dailyDate) { dailyDate = day; dailyPnl = 0; }

    // Compute indicators
    const fSMA = fastSMAValues[i];
    const sSMA = slowSMAValues[i];
    const slice = candles.slice(0, i + 1);
    const atr = calculateATR(slice, atrPeriod);
    const atrPct = calculateATRPercent(slice, atrPeriod);
    const smaDist = calculateSMADistance(slice, fastSMA, slowSMA);
    const regime = i >= slowSMA + 5 ? detectMarketRegime(slice, fastSMA, slowSMA, atrPeriod) : 'sideways' as MarketRegime;

    const fastCurrent = fastSMAValues[i];
    const slowCurrent = slowSMAValues[i];
    const fastPrevious = fastSMAValues[i - 1];
    const slowPrevious = slowSMAValues[i - 1];
    const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);

    const signal = crossover === 1 ? 'BUY' : crossover === -1 ? 'SELL' : 'HOLD';

    let action = 'HOLD';
    let explanation = '';
    const filterCheck = checkFiltersDetailed(i);

    // Unrealized PnL
    let unrealizedPnl = 0;
    if (position) {
      unrealizedPnl = calculatePnl(position.direction, position.entryPrice, price, position.size);
    }

    // Check SL/TP
    if (position) {
      let sltpTriggered = false;
      if (position.direction === 'long') {
        if (candle.low <= position.stopLoss) {
          closeTrade(position, position.stopLoss, candle.timestamp, 'stop_loss', i);
          action = 'STOP_LOSS';
          explanation = `Closed LONG @ $${position.stopLoss.toFixed(2)} — stop loss triggered (low $${candle.low.toFixed(2)} <= SL $${position.stopLoss.toFixed(2)})`;
          position = null;
          lastTradeCandle = i;
          sltpTriggered = true;
        } else if (candle.high >= position.takeProfit) {
          closeTrade(position, position.takeProfit, candle.timestamp, 'take_profit', i);
          action = 'TAKE_PROFIT';
          explanation = `Closed LONG @ $${position.takeProfit.toFixed(2)} — take profit triggered`;
          position = null;
          lastTradeCandle = i;
          sltpTriggered = true;
        }
      } else {
        if (candle.high >= position.stopLoss) {
          closeTrade(position, position.stopLoss, candle.timestamp, 'stop_loss', i);
          action = 'STOP_LOSS';
          explanation = `Closed SHORT @ $${position.stopLoss.toFixed(2)} — stop loss triggered (high $${candle.high.toFixed(2)} >= SL $${position.stopLoss.toFixed(2)})`;
          position = null;
          lastTradeCandle = i;
          sltpTriggered = true;
        } else if (candle.low <= position.takeProfit) {
          closeTrade(position, position.takeProfit, candle.timestamp, 'take_profit', i);
          action = 'TAKE_PROFIT';
          explanation = `Closed SHORT @ $${position.takeProfit.toFixed(2)} — take profit triggered`;
          position = null;
          lastTradeCandle = i;
          sltpTriggered = true;
        }
      }

      if (!sltpTriggered) {
        // Flip logic
        if (crossover === 1 && position.direction === 'short') {
          closeTrade(position, price, candle.timestamp, 'flip_to_long', i);
          position = null;
          if (i !== lastTradeCandle && filterCheck.pass) {
            const posVal = balance * (config.positionSizePercent / 100);
            const fee = calculateFees(posVal, feePercent);
            const size = (posVal - fee) / price;
            if (size > 0 && posVal < balance) {
              balance -= fee;
              lastTradeCandle = i;
              position = { direction: 'long', entryPrice: price, entryTime: candle.timestamp, size, stopLoss: calculateStopLoss(price, config.stopLossPercent, 'long'), takeProfit: calculateTakeProfit(price, config.takeProfitPercent, 'long') };
              action = 'FLIP_TO_LONG';
              explanation = `Closed SHORT and opened LONG @ $${price.toFixed(2)} — bullish crossover confirmed. Regime: ${regime}.`;
            } else {
              action = 'CLOSE_SHORT';
              explanation = `Closed SHORT @ $${price.toFixed(2)} — bullish crossover, but insufficient balance to open long.`;
            }
          } else {
            action = 'CLOSE_SHORT';
            explanation = `Closed SHORT @ $${price.toFixed(2)} — bullish crossover.${filterCheck.failed.length > 0 ? ` Filters blocked new entry: ${filterCheck.failed.join(', ')}` : ''}`;
          }
        } else if (crossover === -1 && position.direction === 'long') {
          closeTrade(position, price, candle.timestamp, 'flip_to_short', i);
          position = null;
          if (i !== lastTradeCandle && filterCheck.pass) {
            const posVal = balance * (config.positionSizePercent / 100);
            const fee = calculateFees(posVal, feePercent);
            const size = (posVal - fee) / price;
            if (size > 0 && posVal < balance) {
              balance -= fee;
              lastTradeCandle = i;
              position = { direction: 'short', entryPrice: price, entryTime: candle.timestamp, size, stopLoss: calculateStopLoss(price, config.stopLossPercent, 'short'), takeProfit: calculateTakeProfit(price, config.takeProfitPercent, 'short') };
              action = 'FLIP_TO_SHORT';
              explanation = `Closed LONG and opened SHORT @ $${price.toFixed(2)} — bearish crossover confirmed. Regime: ${regime}.`;
            } else {
              action = 'CLOSE_LONG';
              explanation = `Closed LONG @ $${price.toFixed(2)} — bearish crossover, but insufficient balance to open short.`;
            }
          } else {
            action = 'CLOSE_LONG';
            explanation = `Closed LONG @ $${price.toFixed(2)} — bearish crossover.${filterCheck.failed.length > 0 ? ` Filters blocked new entry: ${filterCheck.failed.join(', ')}` : ''}`;
          }
        } else {
          action = 'HOLDING';
          explanation = `Holding ${position.direction.toUpperCase()} position. Unrealized PnL: $${unrealizedPnl.toFixed(2)}.`;
        }
      }
    } else {
      // No position
      if (i === lastTradeCandle) {
        action = 'COOLDOWN_SAME_CANDLE';
        explanation = 'Skipped — already traded on this candle.';
      } else if (cooldownCandles > 0 && i - lastTradeCandle < cooldownCandles && lastTradeCandle >= 0) {
        action = 'COOLDOWN';
        explanation = `Cooldown active (${i - lastTradeCandle}/${cooldownCandles} candles).`;
      } else if (crossover !== 0) {
        if (!filterCheck.pass) {
          action = 'BLOCKED';
          explanation = `Signal ${signal} blocked: ${filterCheck.failed.join(', ')}.`;
        } else {
          const dir: PositionDirection = crossover === 1 ? 'long' : 'short';

          // Extra regime check
          let regimeBlocked = false;
          if (useFilters && i >= slowSMA + 5) {
            if (dir === 'long' && regime === 'trending_bearish') {
              regimeBlocked = true;
              action = 'BLOCKED';
              explanation = `BUY signal blocked — regime is bearish, conflicting with long entry.`;
            }
            if (dir === 'short' && regime === 'trending_bullish') {
              regimeBlocked = true;
              action = 'BLOCKED';
              explanation = `SELL signal blocked — regime is bullish, conflicting with short entry.`;
            }
          }

          if (!regimeBlocked) {
            const posVal = balance * (config.positionSizePercent / 100);
            const fee = calculateFees(posVal, feePercent);
            const size = (posVal - fee) / price;
            if (size > 0 && posVal < balance) {
              balance -= fee;
              lastTradeCandle = i;
              position = { direction: dir, entryPrice: price, entryTime: candle.timestamp, size, stopLoss: calculateStopLoss(price, config.stopLossPercent, dir), takeProfit: calculateTakeProfit(price, config.takeProfitPercent, dir) };
              action = `OPEN_${dir.toUpperCase()}`;
              explanation = `Opened ${dir.toUpperCase()} @ $${price.toFixed(2)} — ${signal} signal confirmed. Regime: ${regime}. ATR: ${atrPct?.toFixed(2) ?? 'N/A'}%. SMA dist: ${smaDist?.toFixed(3) ?? 'N/A'}%.`;
            } else {
              action = 'INSUFFICIENT_BALANCE';
              explanation = `Signal ${signal} valid but insufficient balance to open position.`;
            }
          }
        }
      } else {
        action = 'NO_SIGNAL';
        explanation = 'No crossover signal — waiting.';
      }
    }

    // Recompute unrealized after position changes
    unrealizedPnl = position ? calculatePnl(position.direction, position.entryPrice, price, position.size) : 0;

    audit.push({
      candleIndex: i,
      timestamp: candle.timestamp,
      price,
      fastSMA: fSMA,
      slowSMA: sSMA,
      atr,
      atrPercent: atrPct,
      smaDistance: smaDist,
      regime,
      crossover,
      signal: signal as 'BUY' | 'SELL' | 'HOLD',
      filtersPass: filterCheck.pass,
      filtersFailed: filterCheck.failed,
      action,
      positionState: position ? `${position.direction.toUpperCase()} @ $${position.entryPrice.toFixed(2)}` : 'FLAT',
      realizedPnl: totalRealizedPnl,
      unrealizedPnl,
      balance,
      explanation,
    });
  }

  // Close remaining
  if (position && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    closeTrade(position, lastCandle.close, lastCandle.timestamp, 'bullish_crossover', candles.length - 1);
  }

  return { trades, finalBalance: balance, audit };
}
