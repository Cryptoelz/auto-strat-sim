import { Asset, Candle, Signal, SignalType } from '@/types/trading';
import { calculateSMASeries, detectCrossover } from './indicators';

export interface SignalResult {
  signal: Signal;
  crossover: 1 | -1 | 0;
}

/**
 * Generate trading signal based on SMA crossover
 * Only uses CLOSED candles for signal generation
 */
export function generateSignal(
  asset: Asset,
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number
): SignalResult {
  // Use only closed candles (exclude the last one if it's still forming)
  const closedCandles = candles.slice(0, -1);

  if (closedCandles.length < slowPeriod + 1) {
    return {
      signal: {
        type: 'HOLD',
        asset,
        timestamp: Date.now(),
        price: candles[candles.length - 1]?.close || 0,
        smaFast: 0,
        smaSlow: 0,
      },
      crossover: 0,
    };
  }

  const fastSMA = calculateSMASeries(closedCandles, fastPeriod);
  const slowSMA = calculateSMASeries(closedCandles, slowPeriod);

  const currentIndex = closedCandles.length - 1;
  const previousIndex = currentIndex - 1;

  const fastCurrent = fastSMA[currentIndex];
  const slowCurrent = slowSMA[currentIndex];
  const fastPrevious = fastSMA[previousIndex];
  const slowPrevious = slowSMA[previousIndex];

  const crossover = detectCrossover(
    fastCurrent,
    slowCurrent,
    fastPrevious,
    slowPrevious
  );

  let type: SignalType = 'HOLD';
  if (crossover === 1) {
    type = 'BUY';
  } else if (crossover === -1) {
    type = 'SELL';
  }

  return {
    signal: {
      type,
      asset,
      timestamp: closedCandles[currentIndex].timestamp,
      price: closedCandles[currentIndex].close,
      smaFast: fastCurrent || 0,
      smaSlow: slowCurrent || 0,
    },
    crossover,
  };
}

/**
 * Check if we're in cooldown period
 */
export function isInCooldown(
  lastTradeTime: number,
  currentTime: number,
  cooldownCandles: number,
  candleIntervalMs: number
): boolean {
  const cooldownMs = cooldownCandles * candleIntervalMs;
  return currentTime - lastTradeTime < cooldownMs;
}

// 15 minute candle in milliseconds
export const CANDLE_INTERVAL_MS = 15 * 60 * 1000;
