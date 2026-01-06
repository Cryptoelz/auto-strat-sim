import { TradingConfig, TradingState, Asset } from '@/types/trading';

export const DEFAULT_CONFIG: TradingConfig = {
  mode: 'manual',
  timeframe: '15m',
  assets: ['BTCUSDT', 'XRPUSDT'],
  indicators: {
    fastSMA: 20,
    slowSMA: 50,
  },
  risk: {
    positionSizePercent: 5,
    stopLossPercent: 2,
    takeProfitPercent: 4,
    cooldownCandles: 3,
  },
  fees: {
    makerPercent: 0.1,
    takerPercent: 0.1,
  },
};

export const INITIAL_BALANCE = 10000;

export const getInitialState = (): TradingState => ({
  balance: INITIAL_BALANCE,
  initialBalance: INITIAL_BALANCE,
  positions: {
    BTCUSDT: null,
    XRPUSDT: null,
  },
  trades: [],
  lastSignal: {
    BTCUSDT: null,
    XRPUSDT: null,
  },
  lastTradeTime: {
    BTCUSDT: 0,
    XRPUSDT: 0,
  },
  mode: 'manual',
  isRunning: false,
});

export const ASSET_INFO: Record<Asset, { name: string; symbol: string; color: string }> = {
  BTCUSDT: { name: 'Bitcoin', symbol: 'BTC', color: 'trading-btc' },
  XRPUSDT: { name: 'Ripple', symbol: 'XRP', color: 'trading-xrp' },
};

export const CANDLE_LIMIT = 100; // Number of candles to fetch
export const POLL_INTERVAL = 60000; // 1 minute polling
