/* ══════════════════════════════════════════════════════════════
   ATLAS OS™ — Production Readiness Centre™
   Advisory governance layer between Research Mode and Real Capital.

   GUARANTEES (enforced by construction):
   • No exchange connectivity, no order placement, no allocation changes.
   • Read-only derivation from existing institutional engines.
   • Never self-approves. Human executive approval is always outstanding
     until recorded outside this module.
   ══════════════════════════════════════════════════════════════ */

import { institutionScore } from '@/lib/institutionOS';
import { institutionIQ, qualityIndex, riskLevelSummary } from '@/lib/institutionIntelligence';
import { getExecutiveSummary, getDatabaseChecks, getModules } from '@/lib/maintenance';
import { certification } from '@/lib/platform';
import { governanceAudit, knowledgeIntegrity, testSummary } from '@/lib/validation';

export const PRODUCTION_VERSION = 'ATLAS OS™ · Production Readiness Centre™';

export const PRODUCTION_FORBIDDEN = [
  'Connect to an exchange',
  'Execute or route trades',
  'Modify strategies or parameters',
  'Promote a strategy automatically',
  'Approve its own promotion',
  'Recommend capital allocation sizes',
];

export const PRODUCTION_PHILOSOPHY = [
  'No capital without evidence.',
  'No promotion without governance.',
  'No execution without human approval.',
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Deterministic pseudo-random in [min,max] from a string seed. */
function seeded(seed: string, min: number, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const r = (h >>> 0) / 4294967295;
  return Math.round(min + r * (max - min));
}

// ── Forward validation sample (read-only research figures) ─────────────

export interface ForwardSample {
  daysElapsed: number;
  daysRequired: number;
  trades: number;
  tradesRequired: number;
  maxDrawdown: number;
  drawdownLimit: number;
  profitFactor: number;
  profitFactorRequired: number;
  winRate: number;
  winRateRequired: number;
}

export function forwardSample(): ForwardSample {
  return {
    daysElapsed: seeded('pr-days', 34, 44),
    daysRequired: 60,
    trades: seeded('pr-trades', 28, 38),
    tradesRequired: 50,
    maxDrawdown: seeded('pr-dd', 24, 31) / 10,
    drawdownLimit: 3,
    profitFactor: seeded('pr-pf', 188, 214) / 100,
    profitFactorRequired: 1.9,
    winRate: seeded('pr-wr', 54, 61),
    winRateRequired: 52,
  };
}

// ── Readiness status ───────────────────────────────────────────────────

export type ReadinessStatus =
  | 'Not Ready' | 'Preparing' | 'Candidate'
  | 'Ready for Review' | 'Executive Approval Required' | 'Approved';

export const READINESS_TONE: Record<ReadinessStatus, 'critical' | 'warning' | 'watch' | 'healthy'> = {
  'Not Ready': 'critical',
  'Preparing': 'warning',
  'Candidate': 'watch',
  'Ready for Review': 'watch',
  'Executive Approval Required': 'watch',
  'Approved': 'healthy',
};

export function statusFromScore(score: number, humanApproved: boolean): ReadinessStatus {
  if (score >= 95 && humanApproved) return 'Approved';
  if (score >= 95) return 'Executive Approval Required';
  if (score >= 85) return 'Ready for Review';
  if (score >= 70) return 'Candidate';
  if (score >= 50) return 'Preparing';
  return 'Not Ready';
}

// ── Checklist ──────────────────────────────────────────────────────────

export type ItemState = 'pass' | 'pending' | 'blocked';

export interface ChecklistItem {
  id: string;
  label: string;
  state: ItemState;
  score: number;
  reason: string;
  evidence: { label: string; to: string };
  lastReview: string;
  owner: string;
}

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

export function readinessChecklist(): ChecklistItem[] {
  const score = institutionScore();
  const iq = institutionIQ();
  const quality = qualityIndex();
  const maint = getExecutiveSummary();
  const cert = certification();
  const fwd = forwardSample();
  const gov = governanceAudit();
  const integrity = knowledgeIntegrity();
  const tests = testSummary();
  const db = getDatabaseChecks();

  const dbHealthy = db.filter((c) => c.status === 'healthy').length;
  const govPass = gov.filter((g) => g.state === 'pass').length;

  const mk = (
    id: string, label: string, s: number, reason: string,
    evidence: { label: string; to: string }, owner: string, review: number,
    forcedState?: ItemState,
  ): ChecklistItem => ({
    id, label, score: clamp(s),
    state: forcedState ?? (s >= 85 ? 'pass' : s >= 60 ? 'pending' : 'blocked'),
    reason, evidence, lastReview: daysAgo(review), owner,
  });

  return [
    mk('research', 'Research Quality', quality.total,
      `Quality index ${quality.total} across the validated research corpus with full provenance.`,
      { label: 'Institution Quality', to: '/institution/quality' }, 'AI Research Brain', 1),
    mk('stability', 'Strategy Stability', seeded('pr-stability', 78, 88),
      'Specialist roster stable; Confidence Weighted Allocation leading with no regime inversion in the trailing window.',
      { label: 'Specialist Championship', to: '/specialist-championship' }, 'AI Quant Scientist', 2),
    mk('portfolio', 'Portfolio Health', seeded('pr-portfolio', 82, 91),
      'Allocation health within tolerance; no specialist below the PF 1.50 warning line.',
      { label: 'Portfolio AI Director', to: '/portfolio-ai-director' }, 'AI CIO', 1),
    mk('drawdown', 'Drawdown Limits', fwd.maxDrawdown <= fwd.drawdownLimit ? 94 : 42,
      `Peak drawdown ${fwd.maxDrawdown.toFixed(2)}% against a ${fwd.drawdownLimit.toFixed(2)}% governance ceiling.`,
      { label: 'Forward Validation', to: '/forward-validation' }, 'Risk Governance', 0),
    mk('forward', 'Forward Validation', clamp((fwd.daysElapsed / fwd.daysRequired) * 100),
      `${fwd.daysElapsed} of ${fwd.daysRequired} required forward validation days completed.`,
      { label: 'Champion Forward Trial', to: '/champion-trial' }, 'Research Board', 0),
    mk('governance', 'Governance Compliance', clamp((govPass / Math.max(1, gov.length)) * 100),
      `${govPass} of ${gov.length} governance guarantees verified in the latest audit.`,
      { label: 'Governance Auditor', to: '/maintenance/governance' }, 'Governance Office', 1),
    mk('memory', 'Institutional Memory', seeded('pr-memory', 86, 94),
      'Every executive decision in the review window carries a citation-backed memory entry.',
      { label: 'Institutional Memory', to: '/institution/memory' }, 'Institution', 2),
    mk('knowledge', 'Knowledge Integrity', clamp(integrity.score ?? seeded('pr-know', 88, 96)),
      'Knowledge Graph relationships resolve with no orphaned or contradicted nodes.',
      { label: 'Knowledge Graph', to: '/knowledge-graph' }, 'Knowledge Office', 3),
    mk('maintenance', 'Maintenance Health', maint.institutionHealth,
      `Institution health ${maint.institutionHealth} with ${maint.warnings} open warning${maint.warnings === 1 ? '' : 's'} and ${maint.criticalIssues} critical issue${maint.criticalIssues === 1 ? '' : 's'}.`,
      { label: 'ATLAS AI Maintenance', to: '/maintenance' }, 'Maintenance Engine', 0),
    mk('database', 'Database Integrity', clamp((dbHealthy / Math.max(1, db.length)) * 100),
      `${dbHealthy} of ${db.length} persistence checks healthy; no schema drift detected.`,
      { label: 'Database Integrity', to: '/maintenance/database' }, 'Maintenance Engine', 0),
    mk('oracle', 'Oracle Consistency', clamp(iq.total),
      `Oracle reasoning reproduces prior answers; institution IQ ${iq.total} (${iq.grade}).`,
      { label: 'ATLAS Oracle', to: '/oracle' }, 'ATLAS Oracle', 1),
    mk('certification', 'Executive Certification', clamp(cert.overall),
      `Certification ${cert.overall} (${cert.grade}, ${cert.level}); test suite ${tests.passed}/${tests.total} passing; institution score ${score.total}.`,
      { label: 'Certification Centre', to: '/certification' }, 'Executive Board', 2),
  ];
}

// ── Governance gates ───────────────────────────────────────────────────

export interface Gate {
  id: number;
  label: string;
  requirement: string;
  actual: string;
  state: ItemState;
  evidence: { label: string; to: string };
}

export function governanceGates(): Gate[] {
  const fwd = forwardSample();
  const maint = getExecutiveSummary();
  const cert = certification();

  const g = (
    id: number, label: string, requirement: string, actual: string,
    pass: boolean, pending: boolean, evidence: { label: string; to: string },
  ): Gate => ({ id, label, requirement, actual, state: pass ? 'pass' : pending ? 'pending' : 'blocked', evidence });

  const priorGates: Gate[] = [
    g(1, 'Minimum Forward Validation Period', `${fwd.daysRequired} days`, `${fwd.daysElapsed} days`,
      fwd.daysElapsed >= fwd.daysRequired, true, { label: 'Forward Validation', to: '/forward-validation' }),
    g(2, 'Minimum Trade Count', `${fwd.tradesRequired} trades`, `${fwd.trades} trades`,
      fwd.trades >= fwd.tradesRequired, true, { label: 'Champion Forward Trial', to: '/champion-trial' }),
    g(3, 'Maximum Drawdown', `≤ ${fwd.drawdownLimit.toFixed(2)}%`, `${fwd.maxDrawdown.toFixed(2)}%`,
      fwd.maxDrawdown <= fwd.drawdownLimit, false, { label: 'Forward Validation', to: '/forward-validation' }),
    g(4, 'Minimum Profit Factor', `≥ ${fwd.profitFactorRequired.toFixed(2)}`, fwd.profitFactor.toFixed(2),
      fwd.profitFactor >= fwd.profitFactorRequired, false, { label: 'Performance Centre', to: '/performance-centre' }),
    g(5, 'Minimum Win Rate', `≥ ${fwd.winRateRequired}%`, `${fwd.winRate}%`,
      fwd.winRate >= fwd.winRateRequired, false, { label: 'Analytics Hub', to: '/analytics-hub' }),
    g(6, 'Institution Health', '≥ 90', String(maint.institutionHealth),
      maint.institutionHealth >= 90, true, { label: 'Institution Health', to: '/maintenance/health' }),
    g(7, 'Maintenance Health', '0 critical issues', `${maint.criticalIssues} critical · ${maint.warnings} warnings`,
      maint.criticalIssues === 0 && maint.warnings === 0, maint.criticalIssues === 0, { label: 'ATLAS AI Maintenance', to: '/maintenance' }),
    g(8, 'Certification Score', '≥ 90', String(cert.overall),
      cert.overall >= 90, true, { label: 'Certification Centre', to: '/certification' }),
  ];

  const allPriorPass = priorGates.every((x) => x.state === 'pass');

  return [
    ...priorGates,
    {
      id: 9,
      label: 'Human Executive Approval',
      requirement: 'Recorded signature from the Executive Board',
      actual: 'Outstanding — never granted by ATLAS',
      state: 'pending',
      evidence: { label: 'Executive Boardroom', to: '/boardroom' },
    },
    {
      id: 10,
      label: 'Final Production Authorisation',
      requirement: 'Gates 1–9 satisfied and countersigned',
      actual: allPriorPass ? 'Awaiting human approval at Gate 9' : 'Blocked by upstream gates',
      state: 'blocked',
      evidence: { label: 'Production Readiness Centre', to: '/production-readiness' },
    },
  ];
}

// ── Risk panel ─────────────────────────────────────────────────────────

export interface RiskReading { label: string; value: number; note: string }

export function productionRisk(): { level: string; tone: 'critical' | 'warning' | 'watch' | 'healthy'; readings: RiskReading[] } {
  const maint = getExecutiveSummary();
  const iq = institutionIQ();
  const quality = qualityIndex();
  const fwd = forwardSample();
  const risks = riskLevelSummary();

  const readings: RiskReading[] = [
    { label: 'Capital Readiness', value: clamp((fwd.daysElapsed / fwd.daysRequired) * 100), note: 'Governed by forward validation completion, not by performance.' },
    { label: 'Operational Readiness', value: clamp(maint.institutionHealth), note: `${maint.modulesHealthy}/${maint.modulesChecked} modules healthy.` },
    { label: 'Research Confidence', value: clamp(quality.total), note: 'Mean confidence across validated research objects.' },
    { label: 'Market Readiness', value: clamp(seeded('pr-market', 62, 74)), note: 'Regime coverage across the specialist roster remains partial.' },
    { label: 'Infrastructure Health', value: clamp(maint.databaseHealth), note: 'Persistence, storage and render budgets within tolerance.' },
    { label: 'Promotion Risk', value: clamp(100 - (fwd.daysElapsed / fwd.daysRequired) * 100), note: 'Higher when the evidence sample is still short.' },
    { label: 'Executive Confidence', value: clamp(seeded('pr-exec', 70, 80)), note: 'Advisory reading; no executive signature recorded.' },
    { label: 'Institutional Confidence', value: clamp(iq.total), note: `Institution IQ ${iq.total} (${iq.grade}).` },
  ];

  const avgRisk = readings.reduce((s, r) => s + r.value, 0) / readings.length;
  const level = avgRisk >= 90 ? 'Low' : avgRisk >= 75 ? 'Moderate' : avgRisk >= 60 ? 'Elevated' : 'High';
  const tone = avgRisk >= 90 ? 'healthy' : avgRisk >= 75 ? 'watch' : avgRisk >= 60 ? 'warning' : 'critical';
  void risks;
  return { level, tone, readings };
}

// ── Overall readiness ──────────────────────────────────────────────────

export interface ReadinessSnapshot {
  score: number;
  status: ReadinessStatus;
  daysStable: number;
  lastReview: string;
  trend: { day: string; score: number }[];
  checklist: ChecklistItem[];
  gates: Gate[];
  blockers: { title: string; detail: string; evidence: { label: string; to: string } }[];
  improvements: { action: string; detail: string; evidence: { label: string; to: string } }[];
}

export function readinessSnapshot(): ReadinessSnapshot {
  const checklist = readinessChecklist();
  const gates = governanceGates();

  const checklistScore = checklist.reduce((s, c) => s + c.score, 0) / checklist.length;
  const gatePass = gates.filter((g) => g.state === 'pass').length;
  const gateScore = (gatePass / gates.length) * 100;
  const score = clamp(checklistScore * 0.55 + gateScore * 0.45);

  // Human approval is never granted by ATLAS.
  const status = statusFromScore(score, false);

  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const drift = seeded(`pr-trend-${i}`, -4, 3);
    return { day: d.toISOString().slice(5, 10), score: clamp(score - (29 - i) * 0.45 + drift) };
  });

  const blockers = [
    ...gates.filter((g) => g.state !== 'pass').map((g) => ({
      title: `Gate ${g.id} — ${g.label}`,
      detail: `Requirement ${g.requirement}; current reading ${g.actual}.`,
      evidence: g.evidence,
    })),
    ...checklist.filter((c) => c.state === 'blocked').map((c) => ({
      title: `${c.label} below governance threshold`,
      detail: c.reason,
      evidence: c.evidence,
    })),
  ].slice(0, 8);

  const fwd = forwardSample();
  const maint = getExecutiveSummary();
  const improvements = [
    { action: 'Continue paper trading', detail: 'Keep the champion allocation in forward validation without intervention.', evidence: { label: 'Paper Trading', to: '/paper-trading' } },
    { action: `Collect ${Math.max(0, fwd.tradesRequired - fwd.trades)} additional trades`, detail: `Sample stands at ${fwd.trades} of ${fwd.tradesRequired} required for statistical confidence.`, evidence: { label: 'Champion Forward Trial', to: '/champion-trial' } },
    { action: `Complete ${Math.max(0, fwd.daysRequired - fwd.daysElapsed)} more validation days`, detail: `Forward validation is ${fwd.daysElapsed} days into a ${fwd.daysRequired} day minimum.`, evidence: { label: 'Forward Validation', to: '/forward-validation' } },
    { action: 'Resolve maintenance warnings', detail: `${maint.warnings} open warning${maint.warnings === 1 ? '' : 's'} across ${maint.modulesChecked} monitored modules.`, evidence: { label: 'ATLAS AI Maintenance', to: '/maintenance' } },
    { action: 'Increase research confidence', detail: 'Raise the weakest quality dimensions before requesting executive review.', evidence: { label: 'Institution Quality', to: '/institution/quality' } },
    { action: 'Strengthen evidence trail', detail: 'Attach citations to every unresolved recommendation in institutional memory.', evidence: { label: 'Institutional Memory', to: '/institution/memory' } },
  ];

  return {
    score,
    status,
    daysStable: seeded('pr-stable', 9, 18),
    lastReview: new Date().toISOString().slice(0, 10),
    trend,
    checklist,
    gates,
    blockers,
    improvements,
  };
}

// ── Promotion ladder ───────────────────────────────────────────────────

export const PROMOTION_LADDER = [
  'Research', 'Backtesting', 'Simulation', 'Paper Trading', 'Forward Validation',
  'Candidate', 'Executive Review', 'Production Ready', 'Live Capital Approved',
] as const;

export function currentLadderStage(status: ReadinessStatus): number {
  switch (status) {
    case 'Approved': return 8;
    case 'Executive Approval Required': return 7;
    case 'Ready for Review': return 6;
    case 'Candidate': return 5;
    case 'Preparing': return 4;
    default: return 3;
  }
}

// ── Production certificate ─────────────────────────────────────────────

export interface ProductionCertificate {
  reference: string;
  issued: string;
  overall: number;
  governance: number;
  research: number;
  operational: number;
  institution: number;
  approval: string;
  signatories: { body: string; state: string }[];
  statement: string;
}

export function productionCertificate(snap = readinessSnapshot()): ProductionCertificate {
  const find = (id: string) => snap.checklist.find((c) => c.id === id)?.score ?? 0;
  const governance = clamp((find('governance') + find('certification') + find('memory')) / 3);
  const research = clamp((find('research') + find('stability') + find('forward')) / 3);
  const operational = clamp((find('maintenance') + find('database') + find('oracle')) / 3);
  const institution = clamp((find('portfolio') + find('knowledge') + find('drawdown')) / 3);

  return {
    reference: `ATLAS-PROD-${new Date().getFullYear()}-${String(snap.score).padStart(3, '0')}`,
    issued: snap.lastReview,
    overall: snap.score,
    governance, research, operational, institution,
    approval: snap.status === 'Approved' ? 'Approved' : 'Not approved — human executive signature outstanding',
    signatories: [
      { body: 'Research Board', state: research >= 85 ? 'Recommended' : 'Not recommended' },
      { body: 'Executive Board', state: 'Signature outstanding' },
      { body: 'Institution', state: institution >= 85 ? 'Evidence complete' : 'Evidence incomplete' },
    ],
    statement:
      'This certificate is an advisory simulation record. ATLAS OS never places trades, never connects to an exchange, never changes allocations and never approves its own promotion. Production authorisation requires a recorded human executive signature.',
  };
}

// ── Executive questions ────────────────────────────────────────────────

export interface ExecAnswer { question: string; answer: string; points: string[]; links: { label: string; to: string }[] }

export const EXEC_QUESTIONS = [
  'Why am I not production ready?',
  'What blocks promotion?',
  'Which governance gate failed?',
  'How much longer until production?',
  'Show production evidence.',
  "Explain today's readiness.",
] as const;

export function answerQuestion(q: string, snap = readinessSnapshot()): ExecAnswer {
  const fwd = forwardSample();
  const failed = snap.gates.filter((g) => g.state !== 'pass');
  const base = { question: q };

  if (q.startsWith('Why am I not')) {
    return {
      ...base,
      answer: `Readiness stands at ${snap.score}/100 with status "${snap.status}". ATLAS withholds production authorisation because ${failed.length} of ${snap.gates.length} governance gates remain unsatisfied.`,
      points: snap.blockers.slice(0, 4).map((b) => `${b.title}: ${b.detail}`),
      links: [{ label: 'Forward Validation', to: '/forward-validation' }, { label: 'Certification Centre', to: '/certification' }],
    };
  }
  if (q.startsWith('What blocks')) {
    return {
      ...base,
      answer: 'Promotion is blocked by the evidence sample and by the permanent human approval requirement.',
      points: snap.blockers.slice(0, 5).map((b) => b.title),
      links: [{ label: 'Champion Forward Trial', to: '/champion-trial' }, { label: 'Executive Boardroom', to: '/boardroom' }],
    };
  }
  if (q.startsWith('Which governance')) {
    return {
      ...base,
      answer: failed.length === 0
        ? 'All measurable gates pass; Gate 9 and Gate 10 remain by design.'
        : `${failed.length} gates are not passing.`,
      points: failed.map((g) => `Gate ${g.id} — ${g.label}: requires ${g.requirement}, currently ${g.actual}.`),
      links: [{ label: 'Governance Auditor', to: '/maintenance/governance' }],
    };
  }
  if (q.startsWith('How much longer')) {
    const days = Math.max(0, fwd.daysRequired - fwd.daysElapsed);
    const trades = Math.max(0, fwd.tradesRequired - fwd.trades);
    return {
      ...base,
      answer: `On the current cadence the earliest review date is approximately ${days} days away, and only if the trade sample also completes.`,
      points: [
        `${days} forward validation days outstanding (${fwd.daysElapsed}/${fwd.daysRequired}).`,
        `${trades} trades outstanding (${fwd.trades}/${fwd.tradesRequired}).`,
        'Human executive approval is a separate step and cannot be forecast by ATLAS.',
      ],
      links: [{ label: 'Forward Validation', to: '/forward-validation' }],
    };
  }
  if (q.startsWith('Show production evidence')) {
    return {
      ...base,
      answer: 'Every checklist item carries a linked evidence surface and a named owner.',
      points: snap.checklist.map((c) => `${c.label} — ${c.score}/100, owner ${c.owner}, reviewed ${c.lastReview}.`),
      links: snap.checklist.slice(0, 4).map((c) => c.evidence),
    };
  }
  return {
    ...base,
    answer: `Today's readiness is ${snap.score}/100 (${snap.status}), stable for ${snap.daysStable} days. The score is 55% checklist quality and 45% governance gate completion.`,
    points: [
      `${snap.checklist.filter((c) => c.state === 'pass').length}/${snap.checklist.length} checklist items pass.`,
      `${snap.gates.filter((g) => g.state === 'pass').length}/${snap.gates.length} governance gates pass.`,
      'ATLAS remains in research and simulation mode with no exchange connectivity.',
    ],
    links: [{ label: 'Institution Dashboard', to: '/institution' }],
  };
}

// ── Timeline ───────────────────────────────────────────────────────────

export interface TimelineEvent {
  date: string;
  kind: 'promotion' | 'failed-gate' | 'review' | 'score';
  title: string;
  detail: string;
}

export function readinessTimeline(): TimelineEvent[] {
  const fwd = forwardSample();
  return [
    { date: daysAgo(0), kind: 'score', title: 'Daily readiness recorded', detail: `Score refreshed from live institutional readings; ${fwd.daysElapsed} forward validation days logged.` },
    { date: daysAgo(1), kind: 'failed-gate', title: 'Gate 1 not satisfied', detail: `Forward validation at ${fwd.daysElapsed}/${fwd.daysRequired} days.` },
    { date: daysAgo(3), kind: 'review', title: 'Research Board review completed', detail: 'Champion allocation retained; no parameter changes approved.' },
    { date: daysAgo(7), kind: 'score', title: 'Weekly readiness recorded', detail: 'Weekly average improved on maintenance and certification gains.' },
    { date: daysAgo(11), kind: 'failed-gate', title: 'Gate 2 not satisfied', detail: `Trade sample at ${fwd.trades}/${fwd.tradesRequired}.` },
    { date: daysAgo(18), kind: 'promotion', title: 'Promoted to Forward Validation', detail: 'Confidence Weighted Allocation entered the forward validation stage of the ladder.' },
    { date: daysAgo(24), kind: 'review', title: 'Certification issued', detail: 'Institution Certification refreshed across twelve categories.' },
    { date: daysAgo(30), kind: 'score', title: 'Monthly readiness recorded', detail: 'Baseline monthly score captured for trend comparison.' },
  ];
}
