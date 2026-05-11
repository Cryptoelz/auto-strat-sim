import { Asset, MarketRegime, FilterBlockReason } from './trading';

// ─── Allocation Modes ────────────────────────────────────────────────
export type AllocationMode =
  | 'equal'              // split evenly across enabled assets
  | 'fixed'              // fixed % per asset (user-configurable)
  | 'signal_weighted'    // weight by opportunity score
  | 'volatility_adjusted'; // inverse-ATR weighting

// ─── Portfolio Configuration ─────────────────────────────────────────
export interface PortfolioConfig {
  allocationMode: AllocationMode;
  maxPortfolioExposurePercent: number;   // max % of equity in positions
  maxAssetExposurePercent: number;       // max % of equity in any single asset
  maxSimultaneousPositions: number;      // 1 or 2
  maxPortfolioDailyLossPercent: number;  // portfolio-level daily loss cap
  maxPortfolioDrawdownPercent: number;   // drawdown pause threshold
  fixedAllocations: Record<Asset, number>; // used when mode = 'fixed', percents
  correlationExposureCap: number;        // max combined when correlated (0-100)
}

export const DEFAULT_PORTFOLIO_CONFIG: PortfolioConfig = {
  // Fixed allocation by default — careful diversification preserving Baseline v11
  // stability. BTC anchor, ETH secondary, XRP legacy, SOL small probe.
  allocationMode: 'fixed',
  maxPortfolioExposurePercent: 20,
  maxAssetExposurePercent: 15,
  maxSimultaneousPositions: 2,
  maxPortfolioDailyLossPercent: 5,
  maxPortfolioDrawdownPercent: 10,
  fixedAllocations: {
    BTCUSDT: 40,
    XRPUSDT: 20,
    FETUSDT: 0,
    XLMUSDT: 0,
    ETHUSDT: 30,
    SOLUSDT: 10,
  },
  correlationExposureCap: 15,
};

// ─── Opportunity Score ───────────────────────────────────────────────
export interface OpportunityScore {
  asset: Asset;
  total: number;            // 0-100 composite
  crossoverStrength: number;
  smaDistanceScore: number;
  regimeScore: number;
  volatilityScore: number;
  recentPerformance: number;
  eligible: boolean;
  disqualifyReason: string | null;
}

// ─── Allocation Decision ─────────────────────────────────────────────
export interface AllocationDecision {
  asset: Asset;
  allocatedPercent: number;   // % of equity allocated
  allocatedAmount: number;    // $ allocated
  reason: string;             // human-readable explanation
  score: OpportunityScore;
  skippedInFavorOf: Asset | null;
}

// ─── Portfolio Trade Log ─────────────────────────────────────────────
export interface PortfolioTradeLog {
  id: string;
  timestamp: number;
  asset: Asset;
  score: number;
  allocationAmount: number;
  allocationReason: string;
  positionSide: 'long' | 'short' | null;
  action: 'entry' | 'exit' | 'skip' | 'blocked';
  pnl: number | null;
  skippedAsset: Asset | null;
  explanation: string;
}

// ─── Portfolio State ─────────────────────────────────────────────────
export interface PortfolioState {
  totalEquity: number;
  cashAvailable: number;
  allocatedCapital: number;
  exposureByAsset: Record<Asset, number>;
  portfolioRealizedPnl: number;
  portfolioUnrealizedPnl: number;
  portfolioDrawdown: number;
  peakEquity: number;
  activeAllocationMode: AllocationMode;
  scores: OpportunityScore[];
  decisions: AllocationDecision[];
  tradeLogs: PortfolioTradeLog[];
  drawdownPaused: boolean;
  drawdownPauseReason: string | null;
}
