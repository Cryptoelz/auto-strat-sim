import { Candle, FilterBlockReason, FilterConfig, MarketRegime, SignalType, TradingState } from '@/types/trading';
import { calculateSMA, calculateATRPercent, calculateSMADistance } from './indicators';

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
  if (htfCandles.length < slowPeriod) return true;
  
  const fast = calculateSMA(htfCandles, fastPeriod);
  const slow = calculateSMA(htfCandles, slowPeriod);
  
  if (fast === null || slow === null) return true;
  
  if (signalType === 'BUY') return fast > slow;
  if (signalType === 'SELL') return fast < slow;
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
  if (atrPercent === null) return true;
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
 * Check SMA distance filter: minimum separation required
 */
export function checkSMADistanceFilter(
  candles: Candle[],
  fastPeriod: number,
  slowPeriod: number,
  minDistancePercent: number
): boolean {
  const distance = calculateSMADistance(candles, fastPeriod, slowPeriod);
  if (distance === null) return true;
  return distance >= minDistancePercent;
}

/**
 * Check daily loss limit
 */
export function checkDailyLossLimit(
  state: TradingState,
  maxDailyLossPercent: number
): boolean {
  if (maxDailyLossPercent <= 0) return true;
  const today = new Date().toISOString().slice(0, 10);
  if (state.dailyPnlDate !== today) return true; // new day, no losses yet
  const dailyLossPercent = (Math.abs(Math.min(0, state.dailyPnl)) / state.initialBalance) * 100;
  return dailyLossPercent < maxDailyLossPercent;
}

/**
 * Check consecutive losses
 */
export function checkConsecutiveLosses(
  state: TradingState,
  maxConsecutiveLosses: number
): boolean {
  if (maxConsecutiveLosses <= 0) return true;
  return state.consecutiveLosses < maxConsecutiveLosses;
}

/**
 * Check if agent is in loss-limit pause
 */
export function checkLossPause(state: TradingState): boolean {
  if (!state.isPaused) return true;
  if (Date.now() >= state.pauseUntil) return true;
  return false;
}

/**
 * Run all filters and return result
 */
export function runFilters(
  signalType: SignalType,
  candles: Candle[],
  htfCandles: Candle[],
  regime: MarketRegime,
  config: FilterConfig,
  state: TradingState,
  fastPeriod: number,
  slowPeriod: number
): FilterResult {
  if (signalType === 'HOLD') return { allowed: true, reason: null };

  // Check loss pause first
  if (!checkLossPause(state)) {
    return { allowed: false, reason: state.consecutiveLosses >= config.maxConsecutiveLosses ? 'consecutive_loss_pause' : 'daily_loss_pause' };
  }

  // Check daily loss limit
  if (!checkDailyLossLimit(state, config.maxDailyLossPercent)) {
    return { allowed: false, reason: 'daily_loss_pause' };
  }

  // Check consecutive losses
  if (!checkConsecutiveLosses(state, config.maxConsecutiveLosses)) {
    return { allowed: false, reason: 'consecutive_loss_pause' };
  }

  if (config.trendFilterEnabled) {
    if (!checkTrendFilter(htfCandles, fastPeriod, slowPeriod, signalType)) {
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

  if (config.smaDistanceFilterEnabled) {
    if (!checkSMADistanceFilter(candles, fastPeriod, slowPeriod, config.minSmaDistancePercent)) {
      return { allowed: false, reason: 'sma_distance_filter' };
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
