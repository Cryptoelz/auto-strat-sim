// ─── Promotion Types ─────────────────────────────────────────────────────────

export type PromotionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'archived';

export interface PromotionCriterion {
  id: string;
  label: string;
  passed: boolean;
  baselineValue: number;
  candidateValue: number;
  threshold?: number;
  explanation: string;
  category: 'performance' | 'risk' | 'stability' | 'regime';
}

export interface PromotionEvaluation {
  id: string;
  timestamp: number;
  candidateRunId: string;
  baselineRunId: string;
  status: PromotionStatus;
  criteria: PromotionCriterion[];
  passCount: number;
  failCount: number;
  overallVerdict: 'promote' | 'reject' | 'inconclusive';
  explanation: string;
  rejectionReasons: string[];
  stabilityChecks: StabilityCheck[];
  cooldownSatisfied: boolean;
  cooldownRemainingMs: number;
}

export interface StabilityCheck {
  id: string;
  label: string;
  passed: boolean;
  value: number;
  required: number;
  explanation: string;
}

export interface PromotionAuditEntry {
  id: string;
  timestamp: number;
  type: 'evaluation' | 'promotion' | 'rejection' | 'cooldown_block' | 'baseline_set';
  candidateRunId?: string;
  baselineRunId?: string;
  status: PromotionStatus;
  explanation: string;
  metricsSnapshot: Record<string, number>;
}

export interface PromotionConfig {
  minTrades: number;
  minTestDurationMs: number;
  maxAllowedDrawdown: number;
  minProfitFactor: number;
  minWinRate: number;
  minRobustnessScore: number;
  cooldownPeriodMs: number;
  maxOosDegradationPercent: number;
  minRegimePassCount: number;
}

export const DEFAULT_PROMOTION_CONFIG: PromotionConfig = {
  minTrades: 30,
  minTestDurationMs: 600_000, // 10 min simulated
  maxAllowedDrawdown: 20,
  minProfitFactor: 1.0,
  minWinRate: 35,
  minRobustnessScore: 40,
  cooldownPeriodMs: 300_000, // 5 min cooldown
  maxOosDegradationPercent: 30,
  minRegimePassCount: 2,
};

export interface PromotionStore {
  evaluations: PromotionEvaluation[];
  auditLog: PromotionAuditEntry[];
  lastPromotionTimestamp: number | null;
  currentBaselineRunId: string | null;
}

export const DEFAULT_PROMOTION_STORE: PromotionStore = {
  evaluations: [],
  auditLog: [],
  lastPromotionTimestamp: null,
  currentBaselineRunId: null,
};
