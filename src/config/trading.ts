import { TradingConfig, TradingState, Asset } from '@/types/trading';

export const DEFAULT_CONFIG: TradingConfig = {
  timeframe: '15m',
  assets: ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'],
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
});

export const ASSET_INFO: Record<Asset, { name: string; symbol: string; color: string }> = {
  BTCUSDT: { name: 'Bitcoin', symbol: 'BTC', color: 'trading-btc' },
  XRPUSDT: { name: 'Ripple', symbol: 'XRP', color: 'trading-xrp' },
  FETUSDT: { name: 'Fetch.ai', symbol: 'FET', color: 'trading-fet' },
  XLMUSDT: { name: 'Stellar', symbol: 'XLM', color: 'trading-xlm' },
};

export const CANDLE_LIMIT = 100;
export const POLL_INTERVAL = 60000;
