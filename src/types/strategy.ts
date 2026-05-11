import { Asset, Candle, SignalType, MarketRegime } from './trading';

// ─── Strategy Types ──────────────────────────────────────────────────

export type StrategyId = 'sma_crossover' | 'ema_crossover' | 'rsi_trend' | 'sniper' | 'sniper_v2';

export type StrategySelectionMode =
  | 'single'           // one active strategy
  | 'compare'          // run all side-by-side
  | 'best_overall'     // auto-pick best performer
  | 'best_per_asset'   // best strategy per asset
  | 'best_by_regime';  // best per market regime

export type StrategySwitchRule =
  | 'fixed'            // never switch
  | 'best_recent'      // switch to best over rolling window
  | 'by_regime'        // switch by market regime
  | 'rolling_perf';    // switch by rolling performance

export interface StrategySignal {
  type: SignalType;
  strategyId: StrategyId;
  asset: Asset;
  timestamp: number;
  price: number;
  confidence: number; // 0-100
  metadata: Record<string, number | string | null>;
}

export interface StrategyParams {
  // SMA crossover
  smaFast?: number;
  smaSlow?: number;
  // EMA crossover
  emaFast?: number;
  emaSlow?: number;
  // RSI
  rsiPeriod?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  // Sniper (ultra-selective trend continuation)
  sniperSmaFast?: number;
  sniperSmaSlow?: number;
  sniperHtfSma?: number;
  sniperLongDistance?: number;    // SMA distance threshold for longs (%)
  sniperShortDistance?: number;   // SMA distance threshold for shorts (%)
  sniperBreakoutLookback?: number;
  sniperAtrPeriod?: number;
  sniperConfirmStrength?: number; // 0-1 close position within bar range
  sniperMinAtrPct?: number;       // v2: minimum ATR % required
  sniperHtf4hSma?: number;        // v2: 4h higher-timeframe SMA period
  sniperVolumePercentile?: number;// v2: breakout candle strength percentile threshold (0-1)
  trailingStopPercent?: number;
  // Common
  stopLossPercent?: number;
  takeProfitPercent?: number;
  cooldownCandles?: number;
}

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  description: string;
  defaultParams: StrategyParams;
}

export interface StrategyPerformance {
  strategyId: StrategyId;
  asset: Asset;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  tradeCount: number;
  avgTrade: number;
  longCount: number;
  shortCount: number;
  byRegime: Record<MarketRegime, { trades: number; pnl: number; winRate: number }>;
}

export interface StrategyComparison {
  asset: Asset;
  strategies: StrategyPerformance[];
  bestOverall: StrategyId;
  bestByRegime: Record<MarketRegime, StrategyId>;
  bestLowDrawdown: StrategyId;
  bestHighWinRate: StrategyId;
  explanation: string;
}

export interface MultiStrategyConfig {
  selectionMode: StrategySelectionMode;
  switchRule: StrategySwitchRule;
  activeStrategies: StrategyId[];
  activeStrategyPerAsset: Record<Asset, StrategyId>;
  strategyParams: Record<StrategyId, StrategyParams>;
  rollingWindowCandles: number;
  minCandlesBeforeSwitch: number; // anti-churn
}

export const DEFAULT_MULTI_STRATEGY_CONFIG: MultiStrategyConfig = {
  selectionMode: 'compare',
  switchRule: 'fixed',
  activeStrategies: ['sma_crossover', 'ema_crossover', 'rsi_trend', 'sniper'],
  activeStrategyPerAsset: {
    BTCUSDT: 'sma_crossover',
    XRPUSDT: 'sma_crossover',
    FETUSDT: 'sma_crossover',
    XLMUSDT: 'sma_crossover',
    ETHUSDT: 'sma_crossover',
    SOLUSDT: 'sma_crossover',
  },
  strategyParams: {
    sma_crossover: { smaFast: 20, smaSlow: 50, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
    ema_crossover: { emaFast: 12, emaSlow: 26, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
    rsi_trend: { rsiPeriod: 14, rsiOverbought: 70, rsiOversold: 30, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
    sniper: {
      sniperSmaFast: 20,
      sniperSmaSlow: 50,
      sniperHtfSma: 100,
      sniperLongDistance: 0.8,
      sniperShortDistance: 0.9,
      sniperBreakoutLookback: 20,
      sniperAtrPeriod: 14,
      sniperConfirmStrength: 0.65,
      stopLossPercent: 1.2,
      takeProfitPercent: 6,
      trailingStopPercent: 1,
      cooldownCandles: 8,
    },
  },
  rollingWindowCandles: 100,
  minCandlesBeforeSwitch: 20,
};
