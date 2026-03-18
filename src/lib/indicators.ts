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
 * Calculate SMA slope (rate of change over last N candles)
 * Returns slope as percent per candle
 */
export function calculateSMASlope(candles: Candle[], period: number, lookback: number = 5): number | null {
  if (candles.length < period + lookback) return null;
  
  const currentSMA = calculateSMA(candles, period);
  const pastCandles = candles.slice(0, -lookback);
  const pastSMA = calculateSMA(pastCandles, period);
  
  if (currentSMA === null || pastSMA === null || pastSMA === 0) return null;
  
  return ((currentSMA - pastSMA) / pastSMA) * 100;
}

/**
 * Calculate SMA distance as percentage of price
 */
export function calculateSMADistance(candles: Candle[], fastPeriod: number, slowPeriod: number): number | null {
  const fast = calculateSMA(candles, fastPeriod);
  const slow = calculateSMA(candles, slowPeriod);
  if (fast === null || slow === null) return null;
  const price = candles[candles.length - 1]?.close;
  if (!price || price === 0) return null;
  return (Math.abs(fast - slow) / price) * 100;
}

/**
 * Detect market regime based on SMA slopes and separation
 * Uses slope direction of both SMAs + their distance to classify regime
 */
export function detectMarketRegime(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
  atrPeriod: number
): MarketRegime {
  if (candles.length < slowPeriod + 5) return 'sideways';

  const fast = calculateSMA(candles, fastPeriod);
  const slow = calculateSMA(candles, slowPeriod);
  const fastSlope = calculateSMASlope(candles, fastPeriod, 5);
  const slowSlope = calculateSMASlope(candles, slowPeriod, 5);
  const atr = calculateATR(candles, atrPeriod);
  const price = candles[candles.length - 1].close;

  if (fast === null || slow === null || atr === null || price === 0) return 'sideways';

  const smaSpread = Math.abs(fast - slow) / price;
  const atrRatio = atr / price;

  // If SMA spread is tight relative to ATR, market is sideways
  if (smaSpread < atrRatio * 0.3) return 'sideways';

  // Use slopes for confirmation
  if (fastSlope !== null && slowSlope !== null) {
    // BULLISH: fast > slow AND both slopes positive (or at least fast positive)
    if (fast > slow && fastSlope > 0 && slowSlope > -0.05) return 'trending_bullish';
    // BEARISH: fast < slow AND both slopes negative (or at least fast negative)
    if (fast < slow && fastSlope < 0 && slowSlope < 0.05) return 'trending_bearish';
    // Mixed slopes = sideways even if SMAs are separated
    if (Math.abs(fastSlope) < 0.02 && Math.abs(slowSlope) < 0.02) return 'sideways';
  }

  // Fallback to simple position-based detection
  return fast > slow ? 'trending_bullish' : 'trending_bearish';
}
