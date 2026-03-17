// Core trading types

export type Asset = 'BTCUSDT' | 'XRPUSDT' | 'FETUSDT' | 'XLMUSDT';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export type PositionDirection = 'long' | 'short';

export type MarketRegime = 'trending_bullish' | 'trending_bearish' | 'sideways';

export type TradeReason =
  | 'bullish_crossover'
  | 'bearish_crossover'
  | 'stop_loss'
  | 'take_profit'
  | 'flip_to_long'
  | 'flip_to_short';

export type FilterBlockReason =
  | 'trend_filter'
  | 'volatility_filter'
  | 'regime_filter'
  | 'cooldown_active'
  | 'insufficient_balance';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SMAValues {
  fast: number | null;
  slow: number | null;
}

export interface Signal {
  type: SignalType;
  asset: Asset;
  timestamp: number;
  price: number;
  smaFast: number;
  smaSlow: number;
}

export interface Position {
  id: string;
  asset: Asset;
  direction: PositionDirection;
  entryPrice: number;
  entryTime: number;
  size: number;
  stopLoss: number;
  takeProfit: number;
}

export interface Trade {
  id: string;
  asset: Asset;
  direction: PositionDirection;
  entryPrice: number;
  exitPrice: number;
  entryTime: number;
  exitTime: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  type: 'win' | 'loss';
  exitReason: TradeReason;
}

export interface AssetAnalytics {
  price: number | null;
  smaFast: number | null;
  smaSlow: number | null;
  htfTrend: 'bullish' | 'bearish' | 'neutral';
  atr: number | null;
  atrPercent: number | null;
  marketRegime: MarketRegime;
  signal: Signal | null;
  position: Position | null;
  unrealizedPnl: number | null;
  realizedPnl: number;
  filterBlocked: FilterBlockReason | null;
}

export interface TradingState {
  balance: number;
  initialBalance: number;
  positions: Record<Asset, Position | null>;
  trades: Trade[];
  lastSignal: Record<Asset, Signal | null>;
  lastTradeTime: Record<Asset, number>;
  isRunning: boolean;
}

export interface FilterConfig {
  trendFilterEnabled: boolean;
  volatilityFilterEnabled: boolean;
  regimeFilterEnabled: boolean;
  higherTimeframe: string;
  atrPeriod: number;
  atrThreshold: number;
  slippagePercent: number;
}

export interface TradingConfig {
  timeframe: string;
  assets: Asset[];
  indicators: {
    fastSMA: number;
    slowSMA: number;
  };
  risk: {
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
    cooldownCandles: number;
  };
  fees: {
    makerPercent: number;
    takerPercent: number;
  };
  filters: FilterConfig;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  equityCurve: { timestamp: number; balance: number }[];
}
