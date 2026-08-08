/**
 * Executive Decision Centre™ — deterministic, read-only advisory layer.
 *
 * This module NEVER trades, NEVER connects to an exchange, NEVER changes
 * allocations and NEVER approves itself. It only frames the decision an
 * executive has to make about the current promotion candidate.
 */

export const DECISION_VERSION = 'Executive Decision Centre™ v1.0';

export type DecisionState = 'pass' | 'pending' | 'blocked';
export type Recommendation = 'READY' | 'CONDITIONAL' | 'NOT READY';

export interface DecisionSnapshot {
  candidate: string;
  candidateRoute: string;
  recommendation: Recommendation;
  confidence: number;
  productionReadiness: number;
  humanApproval: 'Required' | 'Granted';
  deadlineDays: number;
  decisionRef: string;
  reviewedOn: string;
}

export interface DecisionFactor {
  id: string;
  label: string;
  weight: number;
  score: number;
  state: DecisionState;
  evidence: string;
  route: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  summary: string;
  upside: string;
  risk: string;
  recommended: boolean;
}

/** The single candidate currently in front of the board. */
export function decisionSnapshot(): DecisionSnapshot {
  const now = new Date();
  return {
    candidate: 'Adaptive Allocation v7',
    candidateRoute: '/allocation-lab-v2',
    recommendation: 'NOT READY',
    confidence: 84,
    productionReadiness: 53,
    humanApproval: 'Required',
    deadlineDays: 3,
    decisionRef: `EDC-${now.getFullYear()}-0147`,
    reviewedOn: now.toISOString().slice(0, 10),
  };
}

export function decisionFactors(): DecisionFactor[] {
  return [
    { id: 'research', label: 'Research Evidence', weight: 20, score: 88, state: 'pass', evidence: 'Confidence-weighted allocation, PF 2.11 across in-sample and out-of-sample windows.', route: '/allocation-lab-v2' },
    { id: 'forward', label: 'Forward Validation Runtime', weight: 20, score: 42, state: 'blocked', evidence: '26 of 60 required days elapsed on the live forward trial.', route: '/forward-validation' },
    { id: 'sample', label: 'Trade Sample Size', weight: 15, score: 58, state: 'pending', evidence: '29 of 50 required trades recorded since trial start.', route: '/champion-trial' },
    { id: 'drawdown', label: 'Drawdown Discipline', weight: 15, score: 91, state: 'pass', evidence: 'Peak drawdown 2.4% versus a 3.0% institutional ceiling.', route: '/forward-validation' },
    { id: 'stability', label: 'Stability & Degradation', weight: 10, score: 76, state: 'pending', evidence: 'Rolling 20-trade PF drifting 2.11 → 1.94; monitor before promotion.', route: '/champion-trial' },
    { id: 'governance', label: 'Governance & Certification', weight: 10, score: 82, state: 'pass', evidence: '59 certification checks green; two advisory items outstanding.', route: '/certification' },
    { id: 'operations', label: 'Operational Readiness', weight: 5, score: 64, state: 'pending', evidence: 'Maintenance auto-repair healthy, alerting runbook still draft.', route: '/maintenance' },
    { id: 'approval', label: 'Human Approval', weight: 5, score: 0, state: 'blocked', evidence: 'No signed executive authorisation on file. Cannot be automated.', route: '/production-readiness' },
  ];
}

export function decisionOptions(): DecisionOption[] {
  return [
    { id: 'extend', title: 'Extend Forward Trial', summary: 'Hold the candidate in forward validation for a further 34 days to complete the 60-day and 50-trade minimum.', upside: 'Completes the evidence base with no capital exposure.', risk: 'Delays promotion by roughly five weeks.', recommended: true },
    { id: 'conditional', title: 'Conditional Advance', summary: 'Advance to shadow allocation with zero capital while runtime accumulates.', upside: 'Operational rehearsal without financial risk.', risk: 'Consumes review bandwidth on an unproven sample.', recommended: false },
    { id: 'promote', title: 'Promote to Live Capital', summary: 'Authorise real capital deployment for Adaptive Allocation v7.', upside: 'Captures the observed 39% edge earlier.', risk: 'Two mandatory gates unmet — governance blocks this option today.', recommended: false },
    { id: 'reject', title: 'Return to Research', summary: 'Send the candidate back to the allocation lab for further iteration.', upside: 'Frees the trial slot for a stronger candidate.', risk: 'Discards 26 days of clean forward evidence.', recommended: false },
  ];
}

export function whyNotReady(): string[] {
  return [
    'Forward validation runtime is 26 of 60 required days — the governance minimum is not met.',
    'Trade sample is 29 of 50 — statistical confidence in the live result is still provisional.',
    'Rolling profit factor has drifted from 2.11 to 1.94 over the last 20 trades and has not stabilised.',
    'No signed human authorisation exists; ATLAS cannot and will not approve itself.',
  ];
}

export function whatMustImprove(): { action: string; owner: string; by: string }[] {
  return [
    { action: 'Complete 34 further forward-validation days without breaching the 3% drawdown ceiling.', owner: 'Portfolio Director', by: '34 days' },
    { action: 'Accumulate 21 additional qualifying trades across at least two market regimes.', owner: 'Research Brain', by: '30 days' },
    { action: 'Return rolling 20-trade profit factor above 2.00 for ten consecutive sessions.', owner: 'Chief Investment Officer', by: '21 days' },
    { action: 'Publish the production alerting runbook and rehearse one failover drill.', owner: 'Maintenance', by: '14 days' },
    { action: 'Obtain and file signed executive authorisation before any capital decision.', owner: 'Executive Board', by: 'Post-gates' },
  ];
}

export function decisionTimeline(): { date: string; event: string; state: DecisionState }[] {
  return [
    { date: 'Day 0', event: 'Adaptive Allocation v7 nominated by the Allocation Lab as research champion.', state: 'pass' },
    { date: 'Day 4', event: 'Forward validation trial opened; governance gates registered.', state: 'pass' },
    { date: 'Day 12', event: 'First stability review — profit factor 2.11, drawdown 1.6%.', state: 'pass' },
    { date: 'Day 19', event: 'Degradation detector raised a watch on rolling profit factor.', state: 'pending' },
    { date: 'Day 26', event: 'Executive review convened. Recommendation: NOT READY, extend trial.', state: 'blocked' },
    { date: 'Day 60', event: 'Earliest eligible promotion review, subject to all gates passing.', state: 'pending' },
  ];
}

export function confidenceTrend(): { day: string; confidence: number; readiness: number }[] {
  const base = [71, 74, 73, 77, 79, 78, 81, 83, 82, 84];
  const ready = [38, 41, 43, 44, 46, 47, 49, 51, 52, 53];
  return base.map((c, i) => ({ day: `D${(i + 1) * 3}`, confidence: c, readiness: ready[i] }));
}

export const DECISION_FORBIDDEN = [
  'Never places or routes a trade',
  'Never connects to an exchange or broker',
  'Never changes live allocations',
  'Never grants its own approval',
];

export const DECISION_PHILOSOPHY =
  'The Decision Centre exists to make one question unavoidable: should this candidate receive real capital today? ATLAS assembles the evidence, states its recommendation and its confidence, and stops. The signature is always human.';

/** Weighted decision score (0–100), derived from factor weights. */
export function decisionScore(factors = decisionFactors()): number {
  const total = factors.reduce((a, f) => a + f.weight, 0);
  return Math.round(factors.reduce((a, f) => a + f.score * f.weight, 0) / total);
}

export const DECISION_QUESTIONS = [
  'Can we promote Adaptive Allocation v7 today?',
  'What is the single biggest blocker?',
  'How confident is ATLAS in this recommendation?',
  'What happens if we do nothing?',
  'Who signs the final authorisation?',
];

export function answerDecisionQuestion(q: string, snap: DecisionSnapshot): string {
  switch (q) {
    case 'Can we promote Adaptive Allocation v7 today?':
      return `No. Production readiness is ${snap.productionReadiness}% and two mandatory governance gates — forward runtime and human approval — remain unmet. Promotion is blocked by design, not by preference.`;
    case 'What is the single biggest blocker?':
      return 'Forward validation runtime. 26 of the required 60 days have elapsed. Every other quantitative factor is either passing or within tolerance.';
    case 'How confident is ATLAS in this recommendation?':
      return `${snap.confidence}%. The recommendation to extend rather than promote is stable across all evaluated evidence; confidence in the underlying strategy edge is separate and currently rated high.`;
    case 'What happens if we do nothing?':
      return `The trial continues automatically. The decision returns to the board in ${snap.deadlineDays} days, and the earliest eligible promotion review remains Day 60.`;
    case 'Who signs the final authorisation?':
      return 'A named human executive. ATLAS produces the evidence pack and the advisory certificate; it holds no authority to authorise capital.';
    default:
      return 'No evidence-backed answer is on file for that question.';
  }
}
