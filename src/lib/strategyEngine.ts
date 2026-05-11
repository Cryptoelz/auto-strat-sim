import { Candle, Asset, SignalType, MarketRegime } from '@/types/trading';
import {
  StrategyId, StrategyDefinition, StrategySignal, StrategyParams,
  StrategyPerformance, StrategyComparison, MultiStrategyConfig,
} from '@/types/strategy';
import {
  calculateSMASeries, calculateSMA, detectCrossover, calculateATR,
  calculateATRPercent, detectMarketRegime,
} from './indicators';

// ─── New Indicators: EMA & RSI ───────────────────────────────────────

export function calculateEMASeries(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length === 0) return result;
  const multiplier = 2 / (period + 1);
  let ema: number | null = null;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // Seed with SMA
      const sum = candles.slice(0, period).reduce((s, c) => s + c.close, 0);
      ema = sum / period;
      result.push(ema);
    } else {
      ema = (candles[i].close - ema!) * multiplier + ema!;
      result.push(ema);
    }
  }
  return result;
}

export function calculateEMA(candles: Candle[], period: number): number | null {
  const series = calculateEMASeries(candles, period);
  return series[series.length - 1] ?? null;
}

export function calculateRSISeries(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length < period + 1) {
    return candles.map(() => null);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const change = candles[i].close - candles[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }
  return result;
}

export function calculateRSI(candles: Candle[], period: number): number | null {
  const series = calculateRSISeries(candles, period);
  return series[series.length - 1] ?? null;
}

// ─── Strategy Registry ───────────────────────────────────────────────

export const STRATEGY_DEFINITIONS: StrategyDefinition[] = [
  {
    id: 'sma_crossover',
    name: 'SMA Crossover',
    description: 'Buy when fast SMA crosses above slow SMA, sell on reverse. Classic trend-following.',
    defaultParams: { smaFast: 20, smaSlow: 50, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
  },
  {
    id: 'ema_crossover',
    name: 'EMA Crossover',
    description: 'Buy when fast EMA crosses above slow EMA. Faster response to price changes than SMA.',
    defaultParams: { emaFast: 12, emaSlow: 26, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
  },
  {
    id: 'rsi_trend',
    name: 'RSI + Trend Filter',
    description: 'Long when RSI recovers from oversold in bullish trend, short when RSI falls from overbought in bearish trend.',
    defaultParams: { rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
  },
  {
    id: 'sniper',
    name: 'Sniper System',
    description: 'Ultra-selective high-conviction trend-continuation specialist. Requires aligned HTF trend, wide SMA distance, expanding ATR, structural breakout, and a strong confirmation candle close.',
    defaultParams: {
      sniperSmaFast: 20,
      sniperSmaSlow: 50,
      sniperHtfSma: 100,
      sniperLongDistance: 0.8,
      sniperShortDistance: 0.9,
      sniperBreakoutLookback: 20,
      sniperAtrPeriod: 14,
      sniperConfirmStrength: 0.65,
      stopLossPercent: 1.2,
      takeProfitPercent: 6,
      trailingStopPercent: 1,
      cooldownCandles: 8,
    },
  },
  {
    id: 'sniper_v2',
    name: 'Sniper System v2 (research)',
    description: 'Sniper v2 research branch: stricter HTF, ATR floor, wider SMA distances, longer breakout lookback, 4h confirmation, breakout strength percentile, and extended cooldown. Targets only the strongest directional expansions.',
    defaultParams: {
      sniperSmaFast: 20,
      sniperSmaSlow: 50,
      sniperHtfSma: 100,
      sniperHtf4hSma: 50,
      sniperLongDistance: 1.0,
      sniperShortDistance: 1.2,
      sniperBreakoutLookback: 35,
      sniperAtrPeriod: 14,
      sniperConfirmStrength: 0.65,
      sniperMinAtrPct: 0.6,
      sniperVolumePercentile: 0.5,
      stopLossPercent: 1.2,
      takeProfitPercent: 6,
      trailingStopPercent: 1,
      cooldownCandles: 12,
    },
  },
];

export function getStrategyDefinition(id: StrategyId): StrategyDefinition {
  return STRATEGY_DEFINITIONS.find(s => s.id === id)!;
}

// ─── Strategy Signal Generators ──────────────────────────────────────

function generateSMACrossoverSignal(
  asset: Asset, candles: Candle[], params: StrategyParams,
): StrategySignal {
  const fast = params.smaFast ?? 20;
  const slow = params.smaSlow ?? 50;
  const closed = candles.slice(0, -1);

  if (closed.length < slow + 1) {
    return holdSignal(asset, candles, 'sma_crossover', { smaFast: null, smaSlow: null });
  }

  const fastSeries = calculateSMASeries(closed, fast);
  const slowSeries = calculateSMASeries(closed, slow);
  const idx = closed.length - 1;
  const cross = detectCrossover(fastSeries[idx], slowSeries[idx], fastSeries[idx - 1], slowSeries[idx - 1]);

  let type: SignalType = 'HOLD';
  let confidence = 30;
  if (cross === 1) { type = 'BUY'; confidence = 70; }
  if (cross === -1) { type = 'SELL'; confidence = 70; }

  return {
    type, strategyId: 'sma_crossover', asset,
    timestamp: closed[idx].timestamp, price: closed[idx].close, confidence,
    metadata: { smaFast: fastSeries[idx], smaSlow: slowSeries[idx] },
  };
}

function generateEMACrossoverSignal(
  asset: Asset, candles: Candle[], params: StrategyParams,
): StrategySignal {
  const fast = params.emaFast ?? 12;
  const slow = params.emaSlow ?? 26;
  const closed = candles.slice(0, -1);

  if (closed.length < slow + 1) {
    return holdSignal(asset, candles, 'ema_crossover', { emaFast: null, emaSlow: null });
  }

  const fastSeries = calculateEMASeries(closed, fast);
  const slowSeries = calculateEMASeries(closed, slow);
  const idx = closed.length - 1;
  const cross = detectCrossover(fastSeries[idx], slowSeries[idx], fastSeries[idx - 1], slowSeries[idx - 1]);

  let type: SignalType = 'HOLD';
  let confidence = 30;
  if (cross === 1) { type = 'BUY'; confidence = 75; }
  if (cross === -1) { type = 'SELL'; confidence = 75; }

  return {
    type, strategyId: 'ema_crossover', asset,
    timestamp: closed[idx].timestamp, price: closed[idx].close, confidence,
    metadata: { emaFast: fastSeries[idx], emaSlow: slowSeries[idx] },
  };
}

function generateRSITrendSignal(
  asset: Asset, candles: Candle[], params: StrategyParams,
): StrategySignal {
  const rsiPeriod = params.rsiPeriod ?? 14;
  const overbought = params.rsiOverbought ?? 70;
  const oversold = params.rsiOversold ?? 30;
  const closed = candles.slice(0, -1);

  if (closed.length < rsiPeriod + 2) {
    return holdSignal(asset, candles, 'rsi_trend', { rsi: null, regime: null });
  }

  const rsiSeries = calculateRSISeries(closed, rsiPeriod);
  const idx = closed.length - 1;
  const rsiCurrent = rsiSeries[idx];
  const rsiPrev = rsiSeries[idx - 1];
  const regime = detectMarketRegime(closed, 20, 50, 14);

  if (rsiCurrent === null || rsiPrev === null) {
    return holdSignal(asset, candles, 'rsi_trend', { rsi: rsiCurrent, regime });
  }

  let type: SignalType = 'HOLD';
  let confidence = 30;

  // Long: RSI crosses up from oversold in bullish/sideways regime
  if (rsiPrev <= oversold && rsiCurrent > oversold && regime !== 'trending_bearish') {
    type = 'BUY';
    confidence = 65;
  }
  // Short: RSI crosses down from overbought in bearish/sideways regime
  if (rsiPrev >= overbought && rsiCurrent < overbought && regime !== 'trending_bullish') {
    type = 'SELL';
    confidence = 65;
  }

  return {
    type, strategyId: 'rsi_trend', asset,
    timestamp: closed[idx].timestamp, price: closed[idx].close, confidence,
    metadata: { rsi: rsiCurrent, regime },
  };
}

function holdSignal(asset: Asset, candles: Candle[], strategyId: StrategyId, metadata: Record<string, any>): StrategySignal {
  return {
    type: 'HOLD', strategyId, asset,
    timestamp: candles[candles.length - 1]?.timestamp ?? Date.now(),
    price: candles[candles.length - 1]?.close ?? 0,
    confidence: 0, metadata,
  };
}

// ─── Sniper System: ultra-selective trend continuation ───────────────

function generateSniperSignal(
  asset: Asset, candles: Candle[], params: StrategyParams,
): StrategySignal {
  const fastP = params.sniperSmaFast ?? 20;
  const slowP = params.sniperSmaSlow ?? 50;
  const htfP = params.sniperHtfSma ?? 100;
  const longDist = params.sniperLongDistance ?? 0.8;
  const shortDist = params.sniperShortDistance ?? 0.9;
  const lookback = params.sniperBreakoutLookback ?? 20;
  const atrP = params.sniperAtrPeriod ?? 14;
  const confirmStrength = params.sniperConfirmStrength ?? 0.65;

  const closed = candles.slice(0, -1);
  const minBars = Math.max(htfP, slowP, lookback, atrP) + 5;
  if (closed.length < minBars) {
    return holdSignal(asset, candles, 'sniper', { reason: 'insufficient_history' });
  }

  const idx = closed.length - 1;
  const last = closed[idx];
  const fastSeries = calculateSMASeries(closed, fastP);
  const slowSeries = calculateSMASeries(closed, slowP);
  const htfSeries = calculateSMASeries(closed, htfP);
  const fast = fastSeries[idx];
  const slow = slowSeries[idx];
  const htf = htfSeries[idx];
  if (fast === null || slow === null || htf === null) {
    return holdSignal(asset, candles, 'sniper', { reason: 'indicators_warmup' });
  }

  const price = last.close;
  const smaDistancePct = (Math.abs(fast - slow) / price) * 100;
  const atrNow = calculateATR(closed, atrP);
  const atrPrev = calculateATR(closed.slice(0, -3), atrP);
  const atrExpanding = atrNow !== null && atrPrev !== null && atrNow > atrPrev;
  const atrPct = atrNow !== null ? (atrNow / price) * 100 : 0;

  // Structural breakout uses prior N closed bars (excluding current confirmation bar)
  const window = closed.slice(-1 - lookback, -1);
  const recentHigh = window.reduce((m, c) => Math.max(m, c.high), -Infinity);
  const recentLow = window.reduce((m, c) => Math.min(m, c.low), Infinity);

  const range = Math.max(last.high - last.low, 1e-9);
  const closePos = (last.close - last.low) / range; // 0 = at low, 1 = at high
  const bullishBody = last.close > last.open;
  const bearishBody = last.close < last.open;

  const htfBullish = price > htf && fast > htf;
  const htfBearish = price < htf && fast < htf;
  const alignBull = fast > slow && htfBullish;
  const alignBear = fast < slow && htfBearish;

  const longBreakout = last.close > recentHigh;
  const shortBreakdown = last.close < recentLow;

  const baseMeta = {
    fast, slow, htf,
    smaDistancePct: Number(smaDistancePct.toFixed(3)),
    atrPct: Number(atrPct.toFixed(3)),
    atrExpanding: atrExpanding ? 1 : 0,
    recentHigh, recentLow,
    closePos: Number(closePos.toFixed(3)),
    lookback,
  };

  // LONG
  if (
    alignBull &&
    smaDistancePct >= longDist &&
    atrExpanding &&
    longBreakout &&
    bullishBody &&
    closePos >= confirmStrength
  ) {
    return {
      type: 'BUY', strategyId: 'sniper', asset,
      timestamp: last.timestamp, price: last.close,
      confidence: 92,
      metadata: { ...baseMeta, side: 'long', trigger: 'breakout_confirmation' },
    };
  }

  // SHORT
  if (
    alignBear &&
    smaDistancePct >= shortDist &&
    atrExpanding &&
    shortBreakdown &&
    bearishBody &&
    (1 - closePos) >= confirmStrength
  ) {
    return {
      type: 'SELL', strategyId: 'sniper', asset,
      timestamp: last.timestamp, price: last.close,
      confidence: 92,
      metadata: { ...baseMeta, side: 'short', trigger: 'breakdown_confirmation' },
    };
  }

  // Reasoning for rejection — useful for analytics/intelligence layer
  const rejections: string[] = [];
  if (!alignBull && !alignBear) rejections.push('no_htf_alignment');
  if (!atrExpanding) rejections.push('atr_not_expanding');
  if (smaDistancePct < Math.min(longDist, shortDist)) rejections.push('sma_distance_too_small');
  if (!longBreakout && !shortBreakdown) rejections.push('no_structural_break');
  if (closePos < confirmStrength && (1 - closePos) < confirmStrength) rejections.push('weak_confirmation_close');

  return {
    type: 'HOLD', strategyId: 'sniper', asset,
    timestamp: last.timestamp, price: last.close,
    confidence: 0,
    metadata: { ...baseMeta, rejections: rejections.join(',') || 'no_setup' },
  };
}

// ─── Sniper v2: stricter research branch ─────────────────────────────
function generateSniperV2Signal(
  asset: Asset, candles: Candle[], params: StrategyParams,
): StrategySignal {
  const fastP = params.sniperSmaFast ?? 20;
  const slowP = params.sniperSmaSlow ?? 50;
  const htfP = params.sniperHtfSma ?? 100;
  const htf4hP = (params.sniperHtf4hSma ?? 50) * 16; // ~4h proxy on 15m bars
  const longDist = params.sniperLongDistance ?? 1.0;
  const shortDist = params.sniperShortDistance ?? 1.2;
  const lookback = params.sniperBreakoutLookback ?? 35;
  const atrP = params.sniperAtrPeriod ?? 14;
  const confirmStrength = params.sniperConfirmStrength ?? 0.65;
  const minAtrPct = params.sniperMinAtrPct ?? 0.6;
  const volPct = params.sniperVolumePercentile ?? 0.5;

  const closed = candles.slice(0, -1);
  const minBars = Math.max(htfP, htf4hP, slowP, lookback, atrP) + 5;
  if (closed.length < minBars) {
    return holdSignal(asset, candles, 'sniper_v2', { reason: 'insufficient_history' });
  }

  const idx = closed.length - 1;
  const last = closed[idx];
  const fastSeries = calculateSMASeries(closed, fastP);
  const slowSeries = calculateSMASeries(closed, slowP);
  const htfSeries = calculateSMASeries(closed, htfP);
  const htf4hSeries = calculateSMASeries(closed, htf4hP);
  const fast = fastSeries[idx];
  const slow = slowSeries[idx];
  const htf = htfSeries[idx];
  const htf4h = htf4hSeries[idx];
  if (fast === null || slow === null || htf === null || htf4h === null) {
    return holdSignal(asset, candles, 'sniper_v2', { reason: 'indicators_warmup' });
  }

  const price = last.close;
  const smaDistancePct = (Math.abs(fast - slow) / price) * 100;
  const atrNow = calculateATR(closed, atrP);
  const atrPrev = calculateATR(closed.slice(0, -3), atrP);
  const atrExpanding = atrNow !== null && atrPrev !== null && atrNow > atrPrev;
  const atrPct = atrNow !== null ? (atrNow / price) * 100 : 0;

  const window = closed.slice(-1 - lookback, -1);
  const recentHigh = window.reduce((m, c) => Math.max(m, c.high), -Infinity);
  const recentLow = window.reduce((m, c) => Math.min(m, c.low), Infinity);

  const range = Math.max(last.high - last.low, 1e-9);
  const closePos = (last.close - last.low) / range;
  const bullishBody = last.close > last.open;
  const bearishBody = last.close < last.open;
  const lastBody = Math.abs(last.close - last.open);

  const bodies = window.map(c => Math.abs(c.close - c.open)).sort((a, b) => a - b);
  const threshIdx = Math.min(bodies.length - 1, Math.floor(bodies.length * volPct));
  const medianBody = bodies[threshIdx] ?? 0;
  const strongBody = lastBody >= medianBody;

  const htfBullish = price > htf && fast > htf && price > htf4h;
  const htfBearish = price < htf && fast < htf && price < htf4h;
  const alignBull = fast > slow && htfBullish;
  const alignBear = fast < slow && htfBearish;
  const longBreakout = last.close > recentHigh;
  const shortBreakdown = last.close < recentLow;
  const atrOk = atrPct >= minAtrPct;

  const baseMeta = {
    fast, slow, htf, htf4h,
    smaDistancePct: Number(smaDistancePct.toFixed(3)),
    atrPct: Number(atrPct.toFixed(3)),
    atrExpanding: atrExpanding ? 1 : 0,
    recentHigh, recentLow,
    closePos: Number(closePos.toFixed(3)),
    lookback,
    bodyPercentile: Number(volPct.toFixed(2)),
    strongBody: strongBody ? 1 : 0,
  };

  if (alignBull && smaDistancePct >= longDist && atrExpanding && atrOk &&
      longBreakout && bullishBody && closePos >= confirmStrength && strongBody) {
    return {
      type: 'BUY', strategyId: 'sniper_v2', asset,
      timestamp: last.timestamp, price: last.close, confidence: 94,
      metadata: { ...baseMeta, side: 'long', trigger: 'v2_breakout_confirmation' },
    };
  }
  if (alignBear && smaDistancePct >= shortDist && atrExpanding && atrOk &&
      shortBreakdown && bearishBody && (1 - closePos) >= confirmStrength && strongBody) {
    return {
      type: 'SELL', strategyId: 'sniper_v2', asset,
      timestamp: last.timestamp, price: last.close, confidence: 94,
      metadata: { ...baseMeta, side: 'short', trigger: 'v2_breakdown_confirmation' },
    };
  }

  const rejections: string[] = [];
  if (!alignBull && !alignBear) rejections.push('no_htf_alignment');
  if (!atrExpanding) rejections.push('atr_not_expanding');
  if (!atrOk) rejections.push('atr_pct_below_floor');
  if (smaDistancePct < Math.min(longDist, shortDist)) rejections.push('sma_distance_too_small');
  if (!longBreakout && !shortBreakdown) rejections.push('no_structural_break');
  if (closePos < confirmStrength && (1 - closePos) < confirmStrength) rejections.push('weak_confirmation_close');
  if (!strongBody) rejections.push('weak_breakout_strength');

  return {
    type: 'HOLD', strategyId: 'sniper_v2', asset,
    timestamp: last.timestamp, price: last.close, confidence: 0,
    metadata: { ...baseMeta, rejections: rejections.join(',') || 'no_setup' },
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────

export function generateStrategySignal(
  strategyId: StrategyId,
  asset: Asset,
  candles: Candle[],
  params: StrategyParams,
): StrategySignal {
  switch (strategyId) {
    case 'sma_crossover': return generateSMACrossoverSignal(asset, candles, params);
    case 'ema_crossover': return generateEMACrossoverSignal(asset, candles, params);
    case 'rsi_trend': return generateRSITrendSignal(asset, candles, params);
    case 'sniper': return generateSniperSignal(asset, candles, params);
    default: return holdSignal(asset, candles, strategyId, {});
  }
}

export function generateAllStrategySignals(
  asset: Asset,
  candles: Candle[],
  config: MultiStrategyConfig,
): StrategySignal[] {
  return config.activeStrategies.map(id =>
    generateStrategySignal(id, asset, candles, config.strategyParams[id]),
  );
}
