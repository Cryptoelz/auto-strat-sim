import { Asset, MarketRegime, Trade } from './trading';
import { StrategyId } from './strategy';

// ─── Agent Configuration ─────────────────────────────────────────────

export interface AgentConfig {
  minConvictionScore: number;            // 0-100, default 40
  recentPerformanceWindow: number;       // last N trades, default 10
  strategyCooldownCandles: number;       // candles to bench underperformer, default 30
  confidenceDecayEnabled: boolean;
  convictionPositionScalingEnabled: boolean;
  basePositionSizePercent: number;       // default 5
  maxPositionSizePercent: number;        // default 15
  allowMultiAssetAllocation: boolean;
  maxSimultaneousPositions: number;      // default 3
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  minConvictionScore: 40,
  recentPerformanceWindow: 10,
  strategyCooldownCandles: 30,
  confidenceDecayEnabled: true,
  convictionPositionScalingEnabled: true,
  basePositionSizePercent: 5,
  maxPositionSizePercent: 15,
  allowMultiAssetAllocation: true,
  maxSimultaneousPositions: 3,
};

// ─── Agent Actions ───────────────────────────────────────────────────

export type AgentAction =
  | 'OPEN_LONG'
  | 'OPEN_SHORT'
  | 'CLOSE_POSITION'
  | 'HOLD_POSITION'
  | 'DO_NOTHING';

// ─── Conviction Score ────────────────────────────────────────────────

export interface ConvictionScore {
  asset: Asset;
  strategyId: StrategyId;
  total: number;                         // 0-100
  signalStrength: number;
  regimeAlignment: number;
  volatilityQuality: number;
  trendQuality: number;
  recentPerformance: number;
  drawdownPenalty: number;
  filterStatus: number;                  // 0 = blocked, full points = passed
  eligible: boolean;
  disqualifyReason: string | null;
}

// ─── Recent Performance Snapshot ─────────────────────────────────────

export interface RecentPerformanceSnapshot {
  strategyId: StrategyId;
  asset: Asset;
  windowSize: number;
  tradeCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  maxDrawdown: number;
  isUnderperforming: boolean;
  cooldownRemaining: number;             // candles left
}

// ─── Agent Decision ──────────────────────────────────────────────────

export interface AgentDecision {
  asset: Asset;
  strategyId: StrategyId;
  action: AgentAction;
  convictionScore: number;
  allocationPercent: number;
  allocationAmount: number;
  explanation: string;
  timestamp: number;
}

// ─── Audit Log Entry ─────────────────────────────────────────────────

export interface AgentAuditEntry {
  id: string;
  timestamp: number;
  asset: Asset;
  strategyId: StrategyId;
  signalType: string;
  regime: MarketRegime;
  volatilityCondition: 'low' | 'moderate' | 'high';
  convictionScore: number;
  recentPerfScore: number;
  riskState: string;
  selectedAction: AgentAction;
  allocationPercent: number;
  explanation: string;
}

// ─── Agent State ─────────────────────────────────────────────────────

export interface AgentState {
  decisions: AgentDecision[];
  auditLog: AgentAuditEntry[];
  convictionScores: ConvictionScore[];
  recentPerformance: RecentPerformanceSnapshot[];
  topOpportunity: AgentDecision | null;
  noTradeReason: string | null;
  isActive: boolean;
  riskState: 'normal' | 'elevated' | 'critical';
}
