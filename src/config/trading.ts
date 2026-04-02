import { TradingConfig, TradingState, Asset } from '@/types/trading';

/**
 * Baseline v11 — Smarter Shorts (promoted from Candidate 23)
 *
 * Strategy: Multi-strategy (SMA Crossover 70% / Mean Reversion 30%)
 *   with adaptive regime-based allocation + long/short capability.
 * SMA: 10/30 crossover, 0.5% SMA distance (longs), 0.6% (shorts)
 * Shorts: ATR ≥0.35%, HTF bearish only, 1-candle confirmation, flip on opposite
 * Risk: 5% position size, asset-specific SL/TP (applied in execution),
 *   trailing stop (breakeven at +2%, 1% trail), cooldown 3 candles
 * Execution realism: 0.1% fees, 0.075% slippage, 1-candle delay
 * Alert thresholds: drawdown >3%, consecutive losses >3
 */
export const DEFAULT_CONFIG: TradingConfig = {
  timeframe: '15m',
  assets: ['BTCUSDT', 'XRPUSDT'],
  indicators: {
    fastSMA: 10,
    slowSMA: 30,
  },
  risk: {
    positionSizePercent: 5,
    stopLossPercent: 1.5,   // default; overridden per-asset in execution
    takeProfitPercent: 4.5, // default; overridden per-asset in execution
    cooldownCandles: 3,
  },
  fees: {
    makerPercent: 0.1,
    takerPercent: 0.1,
  },
  filters: {
    trendFilterEnabled: true,
    volatilityFilterEnabled: true,
    regimeFilterEnabled: true,
    smaDistanceFilterEnabled: true,
    higherTimeframe: '1h',
    atrPeriod: 14,
    atrThreshold: 0.5,
    slippagePercent: 0.075,
    minSmaDistancePercent: 1.0,
    maxDailyLossPercent: 5,
    maxConsecutiveLosses: 3,
    pauseCandlesAfterLossLimit: 10,
  },
};

/** Asset-specific risk profiles (Baseline v9) */
export const ASSET_RISK_PROFILES: Record<string, { stopLossPercent: number; takeProfitPercent: number }> = {
  BTCUSDT: { stopLossPercent: 1.0, takeProfitPercent: 4.0 },
  XRPUSDT: { stopLossPercent: 2.0, takeProfitPercent: 5.0 },
};

/** Trailing stop configuration (Baseline v9) */
export const TRAILING_STOP_CONFIG = {
  activationPercent: 2.0,  // move SL to breakeven at +2%
  trailPercent: 1.0,       // trail by 1%
};

/** Session alert thresholds */
export const SESSION_ALERT_THRESHOLDS = {
  maxDrawdownPercent: 3.0,
  maxConsecutiveLosses: 3,
  unusualTradeFrequencyPerHour: 10,
  unusualWinRateDropPercent: 20,
};

export const INITIAL_BALANCE = 10000;

export const ALL_ASSETS: Asset[] = ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'];

export const getInitialState = (): TradingState => ({
  balance: INITIAL_BALANCE,
  initialBalance: INITIAL_BALANCE,
  positions: {
    BTCUSDT: null,
    XRPUSDT: null,
    FETUSDT: null,
    XLMUSDT: null,
  },
  trades: [],
  lastSignal: {
    BTCUSDT: null,
    XRPUSDT: null,
    FETUSDT: null,
    XLMUSDT: null,
  },
  lastTradeTime: {
    BTCUSDT: 0,
    XRPUSDT: 0,
    FETUSDT: 0,
    XLMUSDT: 0,
  },
  isRunning: true,
  isPaused: false,
  pauseUntil: 0,
  pauseReason: null,
  dailyPnl: 0,
  dailyPnlDate: new Date().toISOString().slice(0, 10),
  consecutiveLosses: 0,
});

export const ASSET_INFO: Record<Asset, { name: string; symbol: string; color: string }> = {
  BTCUSDT: { name: 'Bitcoin', symbol: 'BTC', color: 'trading-btc' },
  XRPUSDT: { name: 'Ripple', symbol: 'XRP', color: 'trading-xrp' },
  FETUSDT: { name: 'Fetch.ai', symbol: 'FET', color: 'trading-fet' },
  XLMUSDT: { name: 'Stellar', symbol: 'XLM', color: 'trading-xlm' },
};

export const CANDLE_LIMIT = 100;
export const POLL_INTERVAL = 60000;
