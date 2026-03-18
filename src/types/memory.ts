import { Asset, MarketRegime, Trade } from './trading';
import { StrategyId } from './strategy';

// ─── Memory Configuration ────────────────────────────────────────────

export type AdaptationMode = 'conservative' | 'balanced' | 'aggressive';

export interface MemoryConfig {
  memoryTradeWindow: number;             // default 10
  memoryTradeWindowLarge: number;        // default 20
  memoryCandleWindow: number;            // default 50
  confidenceDecayRate: number;           // 0-1, default 0.05
  adaptationStrength: number;            // 0-1, default 0.5
  maxConfidenceAdjustment: number;       // max +/- points, default 20
  lossStreakCautionThreshold: number;    // default 3
  drawdownCautionThreshold: number;      // percent, default 5
  adaptationMode: AdaptationMode;
  adaptationEnabled: boolean;
  persistMemoryAcrossSessions: boolean;
}

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  memoryTradeWindow: 10,
  memoryTradeWindowLarge: 20,
  memoryCandleWindow: 50,
  confidenceDecayRate: 0.05,
  adaptationStrength: 0.5,
  maxConfidenceAdjustment: 20,
  lossStreakCautionThreshold: 3,
  drawdownCautionThreshold: 5,
  adaptationMode: 'balanced',
  adaptationEnabled: true,
  persistMemoryAcrossSessions: false,
};

// ─── Market Condition Labels ─────────────────────────────────────────

export type MarketCondition =
  | 'trend_friendly'
  | 'choppy'
  | 'low_volatility'
  | 'high_volatility'
  | 'reversal_heavy'
  | 'breakout_heavy';

export type CautionLevel = 'low' | 'moderate' | 'high' | 'extreme';

// ─── Memory Categories ──────────────────────────────────────────────

export interface MarketMemory {
  recentRegimes: MarketRegime[];
  dominantRegime: MarketRegime;
  regimeStability: number;               // 0-100 how consistent
  recentConditions: MarketCondition[];
  dominantCondition: MarketCondition;
  avgVolatility: number;
  volatilityTrend: 'rising' | 'falling' | 'stable';
}

export interface StrategyMemoryEntry {
  strategyId: StrategyId;
  asset: Asset;
  confidence: number;                    // 0-100
  priorConfidence: number;
  recentWinRate: number;
  recentPnl: number;
  recentProfitFactor: number;
  recentDrawdown: number;
  regimeFit: number;                     // 0-100
  falseSignalRate: number;               // 0-100
  blockedCount: number;
  isOnCooldown: boolean;
}

export interface RiskMemory {
  consecutiveLosses: number;
  recentStopLossCount: number;
  currentDrawdownPercent: number;
  peakDrawdownPercent: number;
  repeatedBlockedEntries: number;
  equityCurveVolatility: number;         // std dev of recent equity changes
  stressLevel: CautionLevel;
}

export interface DecisionMemoryEntry {
  timestamp: number;
  asset: Asset;
  reason: string;
  category: 'low_conviction' | 'sideways' | 'weak_volatility' | 'risk_lock' | 'underperforming' | 'allocation_conflict';
}

export interface PortfolioMemory {
  recentAllocations: { asset: Asset; percent: number; timestamp: number }[];
  allocationBias: Record<Asset, number>; // -1 to 1
  recentEquityChanges: number[];
  avgRecentReturn: number;
}

// ─── Adaptation Output ───────────────────────────────────────────────

export interface AdaptationOutput {
  confidenceByAssetStrategy: StrategyMemoryEntry[];
  cautionLevel: CautionLevel;
  allocationBias: Record<Asset, number>;
  marketSummary: string;
  riskPressure: CautionLevel;
  isAdaptationActive: boolean;
  positionSizeMultiplier: number;        // 0.5-1.5
  tradeFrequencyMultiplier: number;      // 0.5-1.5
}

// ─── Adaptation Audit Entry ──────────────────────────────────────────

export interface AdaptationAuditEntry {
  id: string;
  timestamp: number;
  asset: Asset;
  strategyId: StrategyId;
  priorConfidence: number;
  updatedConfidence: number;
  memoryFactors: string[];
  cautionAdjustment: string;
  allocationAdjustment: string;
  explanation: string;
}

// ─── Full Memory State ───────────────────────────────────────────────

export interface AgentMemoryState {
  market: MarketMemory;
  strategies: StrategyMemoryEntry[];
  risk: RiskMemory;
  decisions: DecisionMemoryEntry[];
  portfolio: PortfolioMemory;
  adaptation: AdaptationOutput;
  auditLog: AdaptationAuditEntry[];
  config: MemoryConfig;
  lastUpdated: number;
}
