// Core trading types

export type Asset = 'BTCUSDT' | 'XRPUSDT' | 'FETUSDT' | 'XLMUSDT' | 'ETHUSDT' | 'SOLUSDT';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export type PositionDirection = 'long' | 'short';

export type MarketRegime = 'trending_bullish' | 'trending_bearish' | 'sideways';

export type VolatilityLevel = 'low' | 'moderate' | 'high';

/** Per-trade context captured at entry (snapshot of conditions). */
export interface EntryContext {
  regime?: MarketRegime;
  volatilityLevel?: VolatilityLevel;
  atrPercent?: number;
  smaDistance?: number;
  strategySource?: string;
  governanceState?: string;
  convictionScore?: number;
}

/** Per-trade context captured at exit (snapshot of conditions). */
export interface ExitContext {
  regime?: MarketRegime;
  volatilityLevel?: VolatilityLevel;
}

export type TradeReason =
  | 'bullish_crossover'
  | 'bearish_crossover'
  | 'stop_loss'
  | 'take_profit'
  | 'flip_to_long'
  | 'flip_to_short'
  | 'daily_loss_limit'
  | 'consecutive_loss_limit';

export type FilterBlockReason =
  | 'trend_filter'
  | 'volatility_filter'
  | 'regime_filter'
  | 'sma_distance_filter'
  | 'cooldown_active'
  | 'insufficient_balance'
  | 'daily_loss_pause'
  | 'consecutive_loss_pause';

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
  // Captured snapshot at entry (used to attribute the resulting trade)
  entryRegime?: MarketRegime;
  entryVolatilityLevel?: VolatilityLevel;
  entryAtrPercent?: number;
  entrySmaDistance?: number;
  strategySource?: string;
  governanceState?: string;
  convictionScore?: number;
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
  // Archived market/strategy context (since baseline v11.1)
  entryRegime?: MarketRegime;
  exitRegime?: MarketRegime;
  entryVolatilityLevel?: VolatilityLevel;
  exitVolatilityLevel?: VolatilityLevel;
  entryAtrPercent?: number;
  entrySmaDistance?: number;
  strategySource?: string;
  governanceState?: string;
  convictionScore?: number;
}

export interface DecisionLogEntry {
  id: string;
  timestamp: number;
  asset: Asset;
  action: 'opened_long' | 'opened_short' | 'closed_long' | 'closed_short' | 'flipped' | 'blocked' | 'risk_pause';
  explanation: string;
  signal?: SignalType;
  regime?: MarketRegime;
  filterBlocked?: FilterBlockReason;
}

export interface AssetAnalytics {
  price: number | null;
  smaFast: number | null;
  smaSlow: number | null;
  smaDistance: number | null;
  smaFastSlope: number | null;
  smaSlowSlope: number | null;
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
  isPaused: boolean;
  pauseUntil: number;
  pauseReason: string | null;
  dailyPnl: number;
  dailyPnlDate: string;
  consecutiveLosses: number;
}

export interface FilterConfig {
  trendFilterEnabled: boolean;
  volatilityFilterEnabled: boolean;
  regimeFilterEnabled: boolean;
  smaDistanceFilterEnabled: boolean;
  higherTimeframe: string;
  atrPeriod: number;
  atrThreshold: number;
  slippagePercent: number;
  minSmaDistancePercent: number;
  maxDailyLossPercent: number;
  maxConsecutiveLosses: number;
  pauseCandlesAfterLossLimit: number;
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
  longTrades: number;
  shortTrades: number;
  longWinRate: number;
  shortWinRate: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  currentEquity: number;
  equityCurve: { timestamp: number; balance: number }[];
}
