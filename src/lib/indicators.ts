import { Candle, SMAValues } from '@/types/trading';

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(candles: Candle[], period: number): number | null {
  if (candles.length < period) {
    return null;
  }

  const closePrices = candles.slice(-period).map((c) => c.close);
  const sum = closePrices.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

/**
 * Calculate SMA values for a series of candles
 * Returns array of SMA values aligned with candles
 */
export function calculateSMASeries(
  candles: Candle[],
  period: number
): (number | null)[] {
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
export function getCurrentSMAValues(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number
): SMAValues {
  return {
    fast: calculateSMA(candles, fastPeriod),
    slow: calculateSMA(candles, slowPeriod),
  };
}

/**
 * Detect crossover between two series
 * Returns 1 for bullish crossover, -1 for bearish crossover, 0 for no crossover
 */
export function detectCrossover(
  fastCurrent: number | null,
  slowCurrent: number | null,
  fastPrevious: number | null,
  slowPrevious: number | null
): 1 | -1 | 0 {
  if (
    fastCurrent === null ||
    slowCurrent === null ||
    fastPrevious === null ||
    slowPrevious === null
  ) {
    return 0;
  }

  // Bullish crossover: fast crosses above slow
  if (fastPrevious <= slowPrevious && fastCurrent > slowCurrent) {
    return 1;
  }

  // Bearish crossover: fast crosses below slow
  if (fastPrevious >= slowPrevious && fastCurrent < slowCurrent) {
    return -1;
  }

  return 0;
}
