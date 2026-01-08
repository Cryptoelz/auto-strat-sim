import { Asset, Trade } from '@/types/trading';

export interface OptimizationResult {
  fastSMA: number;
  slowSMA: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface WindowResult {
  windowIndex: number;
  inSampleStart: Date;
  inSampleEnd: Date;
  outOfSampleStart: Date;
  outOfSampleEnd: Date;
  optimalFastSMA: number;
  optimalSlowSMA: number;
  inSamplePnl: number;
  inSamplePnlPercent: number;
  inSampleWinRate: number;
  inSampleTrades: number;
  outOfSamplePnl: number;
  outOfSamplePnlPercent: number;
  outOfSampleWinRate: number;
  outOfSampleTrades: number;
  robustnessRatio: number;
}

export interface WalkForwardResult {
  windows: WindowResult[];
  totalInSamplePnl: number;
  totalOutOfSamplePnl: number;
  avgRobustnessRatio: number;
  consistencyScore: number;
  profitableWindows: number;
  totalWindows: number;
}

export interface BacktestConfig {
  assets: Asset[];
  startDate: Date;
  endDate: Date;
  timeframe: '5m' | '15m' | '1h' | '4h';
  fastSMA: number;
  slowSMA: number;
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  feePercent: number;
}

export interface BacktestTrade extends Trade {
  entryReason: 'signal';
}

export interface EquityPoint {
  timestamp: number;
  balance: number;
  drawdown: number;
}

export interface BacktestResult {
  trades: BacktestTrade[];
  finalBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  equityCurve: EquityPoint[];
  assetResults: Record<Asset, {
    trades: number;
    pnl: number;
    winRate: number;
  }>;
}

export interface SavedRun {
  id: string;
  name: string;
  savedAt: number;
  config: {
    assets: Asset[];
    startDate: string;
    endDate: string;
    timeframe: string;
    fastSMA: number;
    slowSMA: number;
    initialBalance: number;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  result: {
    finalBalance: number;
    totalPnl: number;
    totalPnlPercent: number;
    winRate: number;
    totalTrades: number;
    maxDrawdown: number;
    profitFactor: number;
    sharpeRatio: number;
  };
}
