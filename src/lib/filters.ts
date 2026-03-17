import { Candle, FilterBlockReason, FilterConfig, MarketRegime, SignalType } from '@/types/trading';
import { calculateSMA, calculateATRPercent, detectMarketRegime } from './indicators';

export interface FilterResult {
  allowed: boolean;
  reason: FilterBlockReason | null;
}

/**
 * Check trend filter: higher timeframe SMA alignment
 */
export function checkTrendFilter(
  htfCandles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
  signalType: SignalType
): boolean {
  if (htfCandles.length < slowPeriod) return true; // Not enough data, allow
  
  const fast = calculateSMA(htfCandles, fastPeriod);
  const slow = calculateSMA(htfCandles, slowPeriod);
  
  if (fast === null || slow === null) return true;
  
  if (signalType === 'BUY') return fast > slow;   // Only long when HTF bullish
  if (signalType === 'SELL') return fast < slow;   // Only short when HTF bearish
  return true;
}

/**
 * Check volatility filter: ATR above threshold
 */
export function checkVolatilityFilter(
  candles: Candle[],
  atrPeriod: number,
  atrThreshold: number
): boolean {
  const atrPercent = calculateATRPercent(candles, atrPeriod);
  if (atrPercent === null) return true; // Not enough data, allow
  return atrPercent >= atrThreshold;
}

/**
 * Check market regime filter
 */
export function checkRegimeFilter(
  regime: MarketRegime,
  signalType: SignalType
): boolean {
  if (regime === 'sideways') return false;
  if (signalType === 'BUY' && regime === 'trending_bearish') return false;
  if (signalType === 'SELL' && regime === 'trending_bullish') return false;
  return true;
}

/**
 * Run all filters and return result
 */
export function runFilters(
  signalType: SignalType,
  candles: Candle[],
  htfCandles: Candle[],
  regime: MarketRegime,
  config: FilterConfig
): FilterResult {
  if (signalType === 'HOLD') return { allowed: true, reason: null };

  if (config.trendFilterEnabled) {
    // Use same SMA periods for HTF trend check
    if (!checkTrendFilter(htfCandles, 20, 50, signalType)) {
      return { allowed: false, reason: 'trend_filter' };
    }
  }

  if (config.volatilityFilterEnabled) {
    if (!checkVolatilityFilter(candles, config.atrPeriod, config.atrThreshold)) {
      return { allowed: false, reason: 'volatility_filter' };
    }
  }

  if (config.regimeFilterEnabled) {
    if (!checkRegimeFilter(regime, signalType)) {
      return { allowed: false, reason: 'regime_filter' };
    }
  }

  return { allowed: true, reason: null };
}

/**
 * Get higher timeframe trend direction
 */
export function getHTFTrend(
  htfCandles: Candle[],
  fastPeriod: number,
  slowPeriod: number
): 'bullish' | 'bearish' | 'neutral' {
  if (htfCandles.length < slowPeriod) return 'neutral';
  
  const fast = calculateSMA(htfCandles, fastPeriod);
  const slow = calculateSMA(htfCandles, slowPeriod);
  
  if (fast === null || slow === null) return 'neutral';
  if (fast > slow) return 'bullish';
  if (fast < slow) return 'bearish';
  return 'neutral';
}
