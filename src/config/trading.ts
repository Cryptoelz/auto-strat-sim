import { TradingConfig, TradingState, Asset } from '@/types/trading';

export const DEFAULT_CONFIG: TradingConfig = {
  timeframe: '15m',
  assets: ['BTCUSDT', 'XRPUSDT'],
  indicators: {
    fastSMA: 20,
    slowSMA: 50,
  },
  risk: {
    positionSizePercent: 6,
    stopLossPercent: 1.5,
    takeProfitPercent: 5,
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
    smaDistanceFilterEnabled: false,
    higherTimeframe: '1h',
    atrPeriod: 14,
    atrThreshold: 0.5,
    slippagePercent: 0.05,
    minSmaDistancePercent: 0.1,
    maxDailyLossPercent: 5,
    maxConsecutiveLosses: 5,
    pauseCandlesAfterLossLimit: 10,
  },
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
