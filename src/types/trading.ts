// Core trading types

export type Asset = 'BTCUSDT' | 'XRPUSDT' | 'FETUSDT' | 'XLMUSDT';

export type SignalType = 'BUY' | 'SELL' | 'HOLD';

export type PositionDirection = 'long' | 'short';

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
  exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'flip';
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
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
  maxDrawdown: number;
  equityCurve: { timestamp: number; balance: number }[];
}
