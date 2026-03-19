import {
  PromotionStore, PromotionEvaluation, PromotionCriterion, PromotionAuditEntry,
  StabilityCheck, PromotionConfig, PromotionStatus, DEFAULT_PROMOTION_CONFIG,
  DEFAULT_PROMOTION_STORE,
} from '@/types/promotion';
import { ExperimentRun, RunResult } from '@/types/experiment';

const STORAGE_KEY = 'promotion-store';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export function loadPromotionStore(): PromotionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...DEFAULT_PROMOTION_STORE };
  } catch { return { ...DEFAULT_PROMOTION_STORE }; }
}

export function savePromotionStore(store: PromotionStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ─── Evaluate Candidate ──────────────────────────────────────────────────────

export function evaluateCandidate(
  baseline: ExperimentRun,
  candidate: ExperimentRun,
  store: PromotionStore,
  config: PromotionConfig = DEFAULT_PROMOTION_CONFIG,
): { store: PromotionStore; evaluation: PromotionEvaluation } {
  const criteria = buildCriteria(baseline.result, candidate.result, config);
  const stability = buildStabilityChecks(candidate, config);
  const cooldownOk = checkCooldown(store, config);

  const passCount = criteria.filter(c => c.passed).length;
  const failCount = criteria.filter(c => !c.passed).length;
  const stabilityFails = stability.filter(s => !s.passed);
  const rejectionReasons: string[] = [];

  criteria.filter(c => !c.passed).forEach(c => rejectionReasons.push(c.explanation));
  stabilityFails.forEach(s => rejectionReasons.push(s.explanation));
  if (!cooldownOk) rejectionReasons.push('Cooldown period not satisfied — wait before promoting again.');

  let overallVerdict: 'promote' | 'reject' | 'inconclusive' = 'inconclusive';
  if (failCount === 0 && stabilityFails.length === 0 && cooldownOk) {
    overallVerdict = 'promote';
  } else if (failCount >= 3 || stabilityFails.length >= 2) {
    overallVerdict = 'reject';
  }

  const explanation = generateExplanation(overallVerdict, criteria, stability, cooldownOk, baseline, candidate);

  const evaluation: PromotionEvaluation = {
    id: uid(), timestamp: Date.now(),
    candidateRunId: candidate.id, baselineRunId: baseline.id,
    status: overallVerdict === 'promote' ? 'approved' : overallVerdict === 'reject' ? 'rejected' : 'under_review',
    criteria, passCount, failCount, overallVerdict, explanation, rejectionReasons,
    stabilityChecks: stability, cooldownSatisfied: cooldownOk,
    cooldownRemainingMs: cooldownOk ? 0 : getRemainingCooldown(store, config),
  };

  const audit = createAuditEntry('evaluation', evaluation);
  const updated: PromotionStore = {
    ...store,
    evaluations: [evaluation, ...store.evaluations].slice(0, 100),
    auditLog: [audit, ...store.auditLog].slice(0, 300),
  };
  savePromotionStore(updated);
  return { store: updated, evaluation };
}

// ─── Promote ─────────────────────────────────────────────────────────────────

export function promoteCandidate(
  store: PromotionStore, evaluationId: string
): PromotionStore {
  const ev = store.evaluations.find(e => e.id === evaluationId);
  if (!ev || ev.overallVerdict !== 'promote') return store;

  const audit = createAuditEntry('promotion', { ...ev, status: 'approved' as PromotionStatus });
  const updated: PromotionStore = {
    ...store,
    currentBaselineRunId: ev.candidateRunId,
    lastPromotionTimestamp: Date.now(),
    evaluations: store.evaluations.map(e =>
      e.id === evaluationId ? { ...e, status: 'approved' as PromotionStatus } : e
    ),
    auditLog: [audit, ...store.auditLog].slice(0, 300),
  };
  savePromotionStore(updated);
  return updated;
}

// ─── Reject ──────────────────────────────────────────────────────────────────

export function rejectCandidate(store: PromotionStore, evaluationId: string): PromotionStore {
  const ev = store.evaluations.find(e => e.id === evaluationId);
  if (!ev) return store;

  const audit = createAuditEntry('rejection', { ...ev, status: 'rejected' as PromotionStatus });
  const updated: PromotionStore = {
    ...store,
    evaluations: store.evaluations.map(e =>
      e.id === evaluationId ? { ...e, status: 'rejected' as PromotionStatus } : e
    ),
    auditLog: [audit, ...store.auditLog].slice(0, 300),
  };
  savePromotionStore(updated);
  return updated;
}

// ─── Criteria ────────────────────────────────────────────────────────────────

function buildCriteria(base: RunResult, cand: RunResult, cfg: PromotionConfig): PromotionCriterion[] {
  const c: PromotionCriterion[] = [];

  c.push({
    id: 'net_pnl', label: 'Net P&L', category: 'performance',
    baselineValue: base.netPnl, candidateValue: cand.netPnl,
    passed: cand.netPnl >= base.netPnl,
    explanation: cand.netPnl >= base.netPnl
      ? `Candidate P&L ($${cand.netPnl.toFixed(0)}) meets or exceeds baseline ($${base.netPnl.toFixed(0)}).`
      : `Candidate P&L ($${cand.netPnl.toFixed(0)}) is lower than baseline ($${base.netPnl.toFixed(0)}).`,
  });

  c.push({
    id: 'max_drawdown', label: 'Max Drawdown', category: 'risk',
    baselineValue: base.maxDrawdown, candidateValue: cand.maxDrawdown, threshold: cfg.maxAllowedDrawdown,
    passed: cand.maxDrawdown <= base.maxDrawdown || cand.maxDrawdown <= cfg.maxAllowedDrawdown,
    explanation: cand.maxDrawdown <= base.maxDrawdown
      ? `Drawdown ${cand.maxDrawdown.toFixed(1)}% is within baseline ${base.maxDrawdown.toFixed(1)}%.`
      : cand.maxDrawdown <= cfg.maxAllowedDrawdown
        ? `Drawdown ${cand.maxDrawdown.toFixed(1)}% exceeds baseline but within absolute limit.`
        : `Drawdown ${cand.maxDrawdown.toFixed(1)}% exceeds both baseline and ${cfg.maxAllowedDrawdown}% limit.`,
  });

  c.push({
    id: 'profit_factor', label: 'Profit Factor', category: 'performance',
    baselineValue: base.profitFactor, candidateValue: cand.profitFactor, threshold: cfg.minProfitFactor,
    passed: cand.profitFactor >= base.profitFactor && cand.profitFactor >= cfg.minProfitFactor,
    explanation: cand.profitFactor >= base.profitFactor
      ? `Profit factor ${cand.profitFactor.toFixed(2)} meets or exceeds baseline ${base.profitFactor.toFixed(2)}.`
      : `Profit factor ${cand.profitFactor.toFixed(2)} is below baseline ${base.profitFactor.toFixed(2)}.`,
  });

  c.push({
    id: 'win_rate', label: 'Win Rate', category: 'performance',
    baselineValue: base.winRate, candidateValue: cand.winRate, threshold: cfg.minWinRate,
    passed: cand.winRate >= cfg.minWinRate,
    explanation: cand.winRate >= cfg.minWinRate
      ? `Win rate ${cand.winRate.toFixed(1)}% meets minimum ${cfg.minWinRate}%.`
      : `Win rate ${cand.winRate.toFixed(1)}% is below minimum ${cfg.minWinRate}%.`,
  });

  c.push({
    id: 'robustness', label: 'Robustness Score', category: 'stability',
    baselineValue: base.robustnessScore, candidateValue: cand.robustnessScore, threshold: cfg.minRobustnessScore,
    passed: cand.robustnessScore >= base.robustnessScore && cand.robustnessScore >= cfg.minRobustnessScore,
    explanation: cand.robustnessScore >= base.robustnessScore
      ? `Robustness ${cand.robustnessScore.toFixed(0)} meets or exceeds baseline ${base.robustnessScore.toFixed(0)}.`
      : `Robustness ${cand.robustnessScore.toFixed(0)} is below baseline ${base.robustnessScore.toFixed(0)}.`,
  });

  c.push({
    id: 'total_return', label: 'Total Return', category: 'performance',
    baselineValue: base.totalReturn, candidateValue: cand.totalReturn,
    passed: cand.totalReturn >= base.totalReturn,
    explanation: cand.totalReturn >= base.totalReturn
      ? `Return ${cand.totalReturn.toFixed(1)}% meets or exceeds baseline ${base.totalReturn.toFixed(1)}%.`
      : `Return ${cand.totalReturn.toFixed(1)}% is below baseline ${base.totalReturn.toFixed(1)}%.`,
  });

  c.push({
    id: 'governance', label: 'Governance Stability', category: 'stability',
    baselineValue: base.governanceInterventions, candidateValue: cand.governanceInterventions,
    passed: cand.governanceInterventions <= base.governanceInterventions + 2,
    explanation: cand.governanceInterventions <= base.governanceInterventions + 2
      ? `Governance interventions (${cand.governanceInterventions}) acceptable.`
      : `Too many governance interventions (${cand.governanceInterventions}) vs baseline (${base.governanceInterventions}).`,
  });

  return c;
}

// ─── Stability Checks ────────────────────────────────────────────────────────

function buildStabilityChecks(candidate: ExperimentRun, cfg: PromotionConfig): StabilityCheck[] {
  const checks: StabilityCheck[] = [];

  checks.push({
    id: 'min_trades', label: 'Minimum Trade Count',
    value: candidate.result.tradeCount, required: cfg.minTrades,
    passed: candidate.result.tradeCount >= cfg.minTrades,
    explanation: candidate.result.tradeCount >= cfg.minTrades
      ? `${candidate.result.tradeCount} trades meet minimum ${cfg.minTrades}.`
      : `Only ${candidate.result.tradeCount} trades — need at least ${cfg.minTrades}.`,
  });

  checks.push({
    id: 'min_duration', label: 'Minimum Test Duration',
    value: candidate.duration, required: cfg.minTestDurationMs,
    passed: candidate.duration >= cfg.minTestDurationMs,
    explanation: candidate.duration >= cfg.minTestDurationMs
      ? `Test duration sufficient.`
      : `Test duration too short — need longer evaluation.`,
  });

  checks.push({
    id: 'failure_points', label: 'Failure Points',
    value: candidate.result.failurePointsDetected, required: 3,
    passed: candidate.result.failurePointsDetected <= 3,
    explanation: candidate.result.failurePointsDetected <= 3
      ? `${candidate.result.failurePointsDetected} failure points within tolerance.`
      : `${candidate.result.failurePointsDetected} failure points detected — too many for promotion.`,
  });

  const longPct = candidate.result.tradeCount > 0
    ? (candidate.result.longTradeCount / candidate.result.tradeCount) * 100 : 50;
  const balanced = longPct >= 20 && longPct <= 80;
  checks.push({
    id: 'trade_balance', label: 'Trade Direction Balance',
    value: longPct, required: 20,
    passed: balanced,
    explanation: balanced
      ? `Trade balance (${longPct.toFixed(0)}% long) is healthy.`
      : `Excessive reliance on ${longPct > 80 ? 'long' : 'short'} trades (${longPct.toFixed(0)}% long).`,
  });

  return checks;
}

// ─── Cooldown ────────────────────────────────────────────────────────────────

function checkCooldown(store: PromotionStore, cfg: PromotionConfig): boolean {
  if (!store.lastPromotionTimestamp) return true;
  return Date.now() - store.lastPromotionTimestamp >= cfg.cooldownPeriodMs;
}

function getRemainingCooldown(store: PromotionStore, cfg: PromotionConfig): number {
  if (!store.lastPromotionTimestamp) return 0;
  return Math.max(0, cfg.cooldownPeriodMs - (Date.now() - store.lastPromotionTimestamp));
}

// ─── Explanation ─────────────────────────────────────────────────────────────

function generateExplanation(
  verdict: 'promote' | 'reject' | 'inconclusive',
  criteria: PromotionCriterion[],
  stability: StabilityCheck[],
  cooldownOk: boolean,
  baseline: ExperimentRun,
  candidate: ExperimentRun,
): string {
  const passed = criteria.filter(c => c.passed).map(c => c.label);
  const failed = criteria.filter(c => !c.passed).map(c => c.label);

  if (verdict === 'promote') {
    return `Candidate "${candidate.name}" promoted over baseline "${baseline.name}" — all ${passed.length} criteria passed with stable results.`;
  }
  if (verdict === 'reject') {
    return `Candidate "${candidate.name}" rejected: failed on ${failed.join(', ')}. ${!cooldownOk ? 'Cooldown period not met.' : ''}`;
  }
  return `Candidate "${candidate.name}" is inconclusive — passed ${passed.length}/${criteria.length} criteria. Failed: ${failed.join(', ')}. Manual review recommended.`;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

function createAuditEntry(type: PromotionAuditEntry['type'], ev: PromotionEvaluation): PromotionAuditEntry {
  return {
    id: uid(), timestamp: Date.now(), type,
    candidateRunId: ev.candidateRunId, baselineRunId: ev.baselineRunId,
    status: ev.status, explanation: ev.explanation,
    metricsSnapshot: {
      passCount: ev.passCount, failCount: ev.failCount,
    },
  };
}

// ─── Set Baseline Directly ───────────────────────────────────────────────────

export function setPromotionBaseline(store: PromotionStore, runId: string): PromotionStore {
  const audit: PromotionAuditEntry = {
    id: uid(), timestamp: Date.now(), type: 'baseline_set',
    baselineRunId: runId, status: 'approved',
    explanation: `Baseline manually set to run ${runId}.`,
    metricsSnapshot: {},
  };
  const updated: PromotionStore = {
    ...store,
    currentBaselineRunId: runId,
    auditLog: [audit, ...store.auditLog].slice(0, 300),
  };
  savePromotionStore(updated);
  return updated;
}
