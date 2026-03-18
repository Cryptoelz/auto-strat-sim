import { Asset } from './trading';
import { StrategyId } from './strategy';

// ─── Governance States ──────────────────────────────────────────────

export type GovernanceState = 'ACTIVE' | 'CAUTION' | 'RESTRICTED' | 'PAUSED' | 'LOCKED';

// ─── Health Score ───────────────────────────────────────────────────

export interface HealthScore {
  overall: number;              // 0-100
  pnlStability: number;
  drawdownLevel: number;
  signalQuality: number;
  tradeQuality: number;
  executionStability: number;
  dataQuality: number;
  adaptationStability: number;
  riskPressure: number;
  portfolioStress: number;
}

// ─── Governance Trigger ─────────────────────────────────────────────

export type GovernanceTriggerType =
  | 'daily_loss_limit'
  | 'portfolio_drawdown'
  | 'consecutive_losses'
  | 'excessive_flips'
  | 'volatility_spike'
  | 'data_integrity'
  | 'reconnect_errors'
  | 'adaptation_instability'
  | 'strategy_disagreement'
  | 'blocked_signals'
  | 'poor_recent_performance'
  | 'correlation_exposure'
  | 'manual_lock';

export interface GovernanceTrigger {
  type: GovernanceTriggerType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

// ─── Governance Transition ──────────────────────────────────────────

export interface GovernanceTransition {
  id: string;
  timestamp: number;
  fromState: GovernanceState;
  toState: GovernanceState;
  trigger: GovernanceTriggerType;
  healthScore: number;
  affectedStrategies: StrategyId[];
  affectedAssets: Asset[];
  restrictions: string[];
  explanation: string;
}

// ─── Governance Restrictions ────────────────────────────────────────

export interface GovernanceRestrictions {
  positionSizeMultiplier: number;       // 0-1
  convictionMultiplier: number;         // >1 raises bar
  blockedStrategies: StrategyId[];
  blockedAssets: Asset[];
  newEntriesAllowed: boolean;
  exitsAllowed: boolean;
  adaptationFrozen: boolean;
}

// ─── Recovery State ─────────────────────────────────────────────────

export interface RecoveryState {
  isRecovering: boolean;
  pauseStartTime: number;
  minimumPauseDuration: number;         // ms
  healthAtPause: number;
  currentHealth: number;
  recoveryThreshold: number;
  conditionsMet: string[];
  conditionsNeeded: string[];
  progress: number;                      // 0-100
}

// ─── Governance Config ──────────────────────────────────────────────

export interface GovernanceConfig {
  enabled: boolean;
  healthScoreThresholds: {
    caution: number;        // below this → CAUTION
    restricted: number;     // below this → RESTRICTED
    paused: number;         // below this → PAUSED
    locked: number;         // below this → LOCKED
  };
  dailyLossGovernanceLimit: number;     // percent
  drawdownGovernanceLimit: number;      // percent
  consecutiveLossGovernanceLimit: number;
  flipTradeGovernanceLimit: number;     // flips per N candles
  reconnectErrorLimit: number;
  minimumPauseCandles: number;
  recoveryHealthThreshold: number;
  governanceReduceSizePercent: number;  // e.g. 50 means halve
  governanceConvictionMultiplier: number; // e.g. 1.5 means +50%
  antiFlipWindow: number;               // candles to count flips
}

export const DEFAULT_GOVERNANCE_CONFIG: GovernanceConfig = {
  enabled: true,
  healthScoreThresholds: {
    caution: 65,
    restricted: 45,
    paused: 25,
    locked: 10,
  },
  dailyLossGovernanceLimit: 5,
  drawdownGovernanceLimit: 10,
  consecutiveLossGovernanceLimit: 5,
  flipTradeGovernanceLimit: 4,
  reconnectErrorLimit: 5,
  minimumPauseCandles: 10,
  recoveryHealthThreshold: 60,
  governanceReduceSizePercent: 50,
  governanceConvictionMultiplier: 1.5,
  antiFlipWindow: 20,
};

// ─── Full Governance Status ─────────────────────────────────────────

export interface GovernanceStatus {
  currentState: GovernanceState;
  healthScore: HealthScore;
  activeTriggers: GovernanceTrigger[];
  restrictions: GovernanceRestrictions;
  recovery: RecoveryState;
  transitions: GovernanceTransition[];
  manualReviewRequired: boolean;
  manualReviewReasons: string[];
  explanation: string;
}

// ─── Governance Report ──────────────────────────────────────────────

export interface GovernanceReport {
  totalTransitions: number;
  totalPausedPeriods: number;
  totalRestrictedPeriods: number;
  mainCauses: string[];
  averageHealthScore: number;
  interventionsThatReducedDrawdown: number;
  interventionsThatReducedOvertrading: number;
}
