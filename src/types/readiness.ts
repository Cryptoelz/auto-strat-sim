import { Asset } from '@/types/trading';

// ─── Readiness States ────────────────────────────────────────────────────────

export type ReadinessState =
  | 'NOT_READY'
  | 'TESTING_ONLY'
  | 'LIMITED_PAPER_READY'
  | 'PAPER_READY'
  | 'NEEDS_REVIEW'
  | 'REJECTED';

export const READINESS_STATE_META: Record<ReadinessState, { label: string; color: string; icon: string }> = {
  NOT_READY:            { label: 'Not Ready',            color: 'bg-muted text-muted-foreground',          icon: '⏸' },
  TESTING_ONLY:         { label: 'Testing Only',         color: 'bg-yellow-500/20 text-yellow-400',        icon: '🧪' },
  LIMITED_PAPER_READY:  { label: 'Limited Paper Ready',  color: 'bg-blue-500/20 text-blue-400',            icon: '🔒' },
  PAPER_READY:          { label: 'Paper Ready',          color: 'bg-green-500/20 text-green-400',          icon: '✅' },
  NEEDS_REVIEW:         { label: 'Needs Review',         color: 'bg-orange-500/20 text-orange-400',        icon: '👁' },
  REJECTED:             { label: 'Rejected',             color: 'bg-destructive/20 text-destructive',      icon: '❌' },
};

// ─── Scoring Components ──────────────────────────────────────────────────────

export interface ReadinessScoreComponent {
  id: string;
  label: string;
  score: number;       // 0-100
  weight: number;      // 0-1
  passed: boolean;
  details: string;
}

// ─── Validation Check ────────────────────────────────────────────────────────

export interface ValidationCheck {
  id: string;
  category: string;
  label: string;
  passed: boolean;
  severity: 'critical' | 'major' | 'minor';
  message: string;
}

// ─── Unresolved Issue ────────────────────────────────────────────────────────

export interface UnresolvedIssue {
  id: string;
  category: string;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  suggestedAction: string;
}

// ─── Domain Summary ──────────────────────────────────────────────────────────

export interface DomainReadinessSummary {
  domain: string;
  score: number;
  state: ReadinessState;
  strengths: string[];
  weaknesses: string[];
}

// ─── Promotion Recommendation ────────────────────────────────────────────────

export type PromotionRecommendation =
  | 'remain_experimental'
  | 'promote_stable_baseline'
  | 'approve_limited_paper'
  | 'approve_standard_paper'
  | 'restrict_and_retest'
  | 'reject_and_archive';

export const PROMOTION_LABELS: Record<PromotionRecommendation, string> = {
  remain_experimental:    'Remain Experimental',
  promote_stable_baseline: 'Promote to Stable Baseline',
  approve_limited_paper:  'Approve for Limited Paper Trading',
  approve_standard_paper: 'Approve for Standard Paper Trading',
  restrict_and_retest:    'Restrict & Retest',
  reject_and_archive:     'Reject & Archive',
};

// ─── Readiness Report ────────────────────────────────────────────────────────

export interface ReadinessReport {
  id: string;
  timestamp: number;
  readinessState: ReadinessState;
  overallScore: number;
  scoreComponents: ReadinessScoreComponent[];
  validationChecks: ValidationCheck[];
  strengths: string[];
  weaknesses: string[];
  majorRisks: string[];
  recommendedRestrictions: string[];
  recommendedActions: string[];
  unresolvedIssues: UnresolvedIssue[];
  domainSummaries: DomainReadinessSummary[];
  promotion: PromotionRecommendation;
  explanation: string;
  baselineVersion: string | null;
  candidateVersion: string | null;
}

// ─── Audit Entry ─────────────────────────────────────────────────────────────

export interface ReadinessAuditEntry {
  id: string;
  timestamp: number;
  readinessState: ReadinessState;
  overallScore: number;
  failedGates: string[];
  restrictionsApplied: string[];
  promotion: PromotionRecommendation;
  followUpRequired: boolean;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface ReadinessConfig {
  minReadinessScore: number;
  maxAllowedDrawdown: number;
  minRobustnessScore: number;
  maxOosDegradation: number;
  maxGovernanceCriticalEvents: number;
  maxExecutionIntegrityFailures: number;
  minLivePaperDurationMs: number;
  minNumberOfValidRuns: number;
}

export const DEFAULT_READINESS_CONFIG: ReadinessConfig = {
  minReadinessScore: 60,
  maxAllowedDrawdown: 20,
  minRobustnessScore: 50,
  maxOosDegradation: 30,
  maxGovernanceCriticalEvents: 3,
  maxExecutionIntegrityFailures: 5,
  minLivePaperDurationMs: 3600000, // 1 hour
  minNumberOfValidRuns: 3,
};
