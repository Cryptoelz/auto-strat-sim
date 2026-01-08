import { Asset, Trade } from '@/types/trading';

/**
 * Result from a single parameter optimization test
 * Contains performance metrics for a specific SMA combination
 */
export interface OptimizationResult {
  /** Fast SMA period used in this test */
  fastSMA: number;
  /** Slow SMA period used in this test */
  slowSMA: number;
  /** Total profit/loss in USD */
  totalPnl: number;
  /** Total profit/loss as a percentage of initial balance */
  totalPnlPercent: number;
  /** Percentage of winning trades (0-100) */
  winRate: number;
  /** Total number of trades executed */
  totalTrades: number;
  /** Ratio of gross profits to gross losses */
  profitFactor: number;
  /** Maximum peak-to-trough decline as a percentage */
  maxDrawdown: number;
  /** Risk-adjusted return metric (annualized return / volatility) */
  sharpeRatio: number;
}

/**
 * Result from a single walk-forward analysis window
 * Contains both in-sample (optimization) and out-of-sample (validation) results
 */
export interface WindowResult {
  /** Zero-based index of this window in the analysis */
  windowIndex: number;
  /** Start date of the in-sample (training) period */
  inSampleStart: Date;
  /** End date of the in-sample (training) period */
  inSampleEnd: Date;
  /** Start date of the out-of-sample (testing) period */
  outOfSampleStart: Date;
  /** End date of the out-of-sample (testing) period */
  outOfSampleEnd: Date;
  /** Optimal fast SMA found during in-sample optimization */
  optimalFastSMA: number;
  /** Optimal slow SMA found during in-sample optimization */
  optimalSlowSMA: number;
  /** Profit/loss during in-sample period in USD */
  inSamplePnl: number;
  /** Profit/loss during in-sample period as percentage */
  inSamplePnlPercent: number;
  /** Win rate during in-sample period (0-100) */
  inSampleWinRate: number;
  /** Number of trades during in-sample period */
  inSampleTrades: number;
  /** Profit/loss during out-of-sample period in USD */
  outOfSamplePnl: number;
  /** Profit/loss during out-of-sample period as percentage */
  outOfSamplePnlPercent: number;
  /** Win rate during out-of-sample period (0-100) */
  outOfSampleWinRate: number;
  /** Number of trades during out-of-sample period */
  outOfSampleTrades: number;
  /** Ratio of out-of-sample to in-sample performance (measures overfitting) */
  robustnessRatio: number;
}

/**
 * Aggregate results from a complete walk-forward analysis
 * Summarizes performance across all analysis windows
 */
export interface WalkForwardResult {
  /** Array of results from each individual window */
  windows: WindowResult[];
  /** Combined P&L from all in-sample periods */
  totalInSamplePnl: number;
  /** Combined P&L from all out-of-sample periods */
  totalOutOfSamplePnl: number;
  /** Average robustness ratio across all windows */
  avgRobustnessRatio: number;
  /** Score indicating strategy consistency (0-100) */
  consistencyScore: number;
  /** Number of windows with positive out-of-sample P&L */
  profitableWindows: number;
  /** Total number of windows in the analysis */
  totalWindows: number;
}

/**
 * Configuration parameters for running a backtest
 * Defines the strategy settings, date range, and risk management rules
 */
export interface BacktestConfig {
  /** Trading pairs to include in the backtest */
  assets: Asset[];
  /** Start date for historical data */
  startDate: Date;
  /** End date for historical data */
  endDate: Date;
  /** Candle timeframe for price data */
  timeframe: '5m' | '15m' | '1h' | '4h';
  /** Fast SMA period for crossover signals */
  fastSMA: number;
  /** Slow SMA period for crossover signals */
  slowSMA: number;
  /** Starting account balance in USD */
  initialBalance: number;
  /** Percentage of balance to risk per trade */
  positionSizePercent: number;
  /** Stop loss distance as percentage from entry */
  stopLossPercent: number;
  /** Take profit distance as percentage from entry */
  takeProfitPercent: number;
  /** Trading fee as percentage per trade */
  feePercent: number;
}

/**
 * Extended trade interface for backtest-specific data
 * Includes the reason for trade entry
 */
export interface BacktestTrade extends Trade {
  /** Reason for entering the trade (always 'signal' in backtests) */
  entryReason: 'signal';
}

/**
 * Single point on the equity curve
 * Tracks portfolio value and drawdown over time
 */
export interface EquityPoint {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Portfolio balance at this point in USD */
  balance: number;
  /** Current drawdown from peak as percentage */
  drawdown: number;
}

/**
 * Complete results from a backtest run
 * Contains all performance metrics, trades, and equity curve data
 */
export interface BacktestResult {
  /** Array of all trades executed during the backtest */
  trades: BacktestTrade[];
  /** Final portfolio balance in USD */
  finalBalance: number;
  /** Total profit/loss in USD */
  totalPnl: number;
  /** Total profit/loss as percentage of initial balance */
  totalPnlPercent: number;
  /** Percentage of winning trades (0-100) */
  winRate: number;
  /** Total number of trades executed */
  totalTrades: number;
  /** Number of profitable trades */
  winningTrades: number;
  /** Number of losing trades */
  losingTrades: number;
  /** Maximum peak-to-trough decline as percentage */
  maxDrawdown: number;
  /** Risk-adjusted return (return / volatility) */
  sharpeRatio: number;
  /** Downside risk-adjusted return (return / downside volatility) */
  sortinoRatio: number;
  /** Annual return divided by max drawdown */
  calmarRatio: number;
  /** Ratio of gross profits to gross losses */
  profitFactor: number;
  /** Average profit on winning trades in USD */
  averageWin: number;
  /** Average loss on losing trades in USD */
  averageLoss: number;
  /** Time series of portfolio value and drawdown */
  equityCurve: EquityPoint[];
  /** Performance breakdown by individual asset */
  assetResults: Record<Asset, {
    /** Number of trades for this asset */
    trades: number;
    /** Total P&L for this asset in USD */
    pnl: number;
    /** Win rate for this asset (0-100) */
    winRate: number;
  }>;
}

/**
 * Saved backtest run for later comparison
 * Stores configuration and key results for strategy comparison
 */
export interface SavedRun {
  /** Unique identifier for this saved run */
  id: string;
  /** Display name (e.g., "SMA 20/50 15m") */
  name: string;
  /** Unix timestamp when the run was saved */
  savedAt: number;
  /** Configuration used for this backtest */
  config: {
    /** Trading pairs included */
    assets: Asset[];
    /** Start date as ISO string */
    startDate: string;
    /** End date as ISO string */
    endDate: string;
    /** Candle timeframe */
    timeframe: string;
    /** Fast SMA period */
    fastSMA: number;
    /** Slow SMA period */
    slowSMA: number;
    /** Starting balance in USD */
    initialBalance: number;
    /** Position size as percentage */
    positionSizePercent: number;
    /** Stop loss as percentage */
    stopLossPercent: number;
    /** Take profit as percentage */
    takeProfitPercent: number;
  };
  /** Key performance metrics from the backtest */
  result: {
    /** Final balance in USD */
    finalBalance: number;
    /** Total P&L in USD */
    totalPnl: number;
    /** Total P&L as percentage */
    totalPnlPercent: number;
    /** Win rate (0-100) */
    winRate: number;
    /** Total trades executed */
    totalTrades: number;
    /** Max drawdown as percentage */
    maxDrawdown: number;
    /** Profit factor ratio */
    profitFactor: number;
    /** Sharpe ratio */
    sharpeRatio: number;
  };
}
