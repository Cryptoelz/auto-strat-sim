import { Candle, SMAValues, MarketRegime } from '@/types/trading';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) return null;
  const closePrices = candles.slice(-period).map((c) => c.close);
  return closePrices.reduce((acc, price) => acc + price, 0) / period;
}

/**
 * Calculate SMA values for a series of candles
 */
export function calculateSMASeries(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = candles.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, c) => acc + c.close, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Get current SMA values (fast and slow)
 */
export function getCurrentSMAValues(candles: Candle[], fastPeriod: number, slowPeriod: number): SMAValues {
  return {
    fast: calculateSMA(candles, fastPeriod),
    slow: calculateSMA(candles, slowPeriod),
  };
}

/**
 * Detect crossover between two series
 */
export function detectCrossover(
  fastCurrent: number | null,
  slowCurrent: number | null,
  fastPrevious: number | null,
  slowPrevious: number | null
): 1 | -1 | 0 {
  if (fastCurrent === null || slowCurrent === null || fastPrevious === null || slowPrevious === null) return 0;
  if (fastPrevious <= slowPrevious && fastCurrent > slowCurrent) return 1;
  if (fastPrevious >= slowPrevious && fastCurrent < slowCurrent) return -1;
  return 0;
}

/**
 * Calculate Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period: number): number | null {
  if (candles.length < period + 1) return null;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) return null;

  // Use simple average for first ATR value, then EMA-like smoothing
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * Calculate ATR as percentage of price
 */
export function calculateATRPercent(candles: Candle[], period: number): number | null {
  const atr = calculateATR(candles, period);
  if (atr === null || candles.length === 0) return null;
  const currentPrice = candles[candles.length - 1].close;
  if (currentPrice === 0) return null;
  return (atr / currentPrice) * 100;
}

/**
 * Detect market regime based on SMA spread and ATR
 */
export function detectMarketRegime(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
  atrPeriod: number
): MarketRegime {
  if (candles.length < slowPeriod + 1) return 'sideways';

  const fast = calculateSMA(candles, fastPeriod);
  const slow = calculateSMA(candles, slowPeriod);
  const atr = calculateATR(candles, atrPeriod);
  const price = candles[candles.length - 1].close;

  if (fast === null || slow === null || atr === null || price === 0) return 'sideways';

  const smaSpread = Math.abs(fast - slow) / price;
  const atrRatio = atr / price;

  // If SMA spread is tight relative to ATR, market is sideways
  if (smaSpread < atrRatio * 0.3) return 'sideways';

  return fast > slow ? 'trending_bullish' : 'trending_bearish';
}
