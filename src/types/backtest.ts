import { Asset, Trade } from '@/types/trading';

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
