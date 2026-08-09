/**
 * Executive Decision Centre™ — unified human-approval queue (advisory only).
 *
 * Presentation-layer data only. Nothing here executes, trades, changes
 * parameters, connects to an exchange, or approves production.
 * Executive actions are advisory records persisted on the reviewer's device.
 */

export const DECISION_CENTRE_VERSION = 'Executive Decision Centre™ v2.0';

export type QueueStatus =
  | 'waiting' | 'needs-evidence' | 'ready' | 'approved' | 'declined' | 'deferred';

export type Priority = 'high' | 'medium' | 'low';

export type ActionKind = 'approve' | 'decline' | 'evidence' | 'defer' | 'archive';

export const QUEUE_STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: 'Waiting',
  'needs-evidence': 'Needs Evidence',
  ready: 'Ready For Review',
  approved: 'Approved',
  declined: 'Declined',
  deferred: 'Deferred',
};

export const ACTION_LABEL: Record<ActionKind, string> = {
  approve: 'Approve',
  decline: 'Decline',
  evidence: 'Request More Evidence',
  defer: 'Defer',
  archive: 'Archive',
};

export interface EvidenceItem { date: string; label: string; detail: string; route: string }
export interface CounterArgument { claim: string; rebuttal: string }

export interface DecisionItem {
  id: string;
  title: string;
  type: string;
  department: string;
  priority: Priority;
  confidence: number;
  evidenceCount: number;
  supportingResearch: { label: string; route: string }[];
  benefit: string;
  risk: string;
  reviewer: string;
  waitingHours: number;
  status: QueueStatus;
  raisedOn: string;
  summary: string;
  background: string;
  evidenceTimeline: EvidenceItem[];
  graphLinks: { label: string; route: string }[];
  memory: { label: string; detail: string }[];
  forwardValidation: string;
  riskAssessment: { label: string; level: 'low' | 'moderate' | 'elevated'; note: string }[];
  counterArguments: CounterArgument[];
  confidenceTrend: number[];
  oracle: string;
  recommendation: string;
  answers: Record<string, string>;
  lesson: string;
}

const T = (d: number) => {
  const dt = new Date(Date.UTC(2026, 7, 9) - d * 86_400_000);
  return dt.toISOString().slice(0, 10);
};

export const EXEC_QUESTIONS = [
  'Why does ATLAS recommend this?',
  'What evidence is missing?',
  'What would improve confidence?',
  'Has this happened before?',
  'What memory supports this?',
  'Show related research.',
] as const;

/** Deterministic decision queue assembled from existing institutional modules. */
export function decisionQueue(): DecisionItem[] {
  return [
    {
      id: 'EDC-2026-0147',
      title: 'Promote Adaptive Allocation v7 to live capital',
      type: 'Promotion',
      department: 'Portfolio Director',
      priority: 'high',
      confidence: 84,
      evidenceCount: 34,
      supportingResearch: [
        { label: 'Allocation Lab v2', route: '/allocation-lab-v2' },
        { label: 'Champion Trial', route: '/champion-trial' },
        { label: 'Forward Validation', route: '/forward-validation' },
      ],
      benefit: 'Captures the observed 39% allocation edge roughly five weeks earlier.',
      risk: 'Two mandatory governance gates unmet; sample size still provisional.',
      reviewer: 'Executive Board',
      waitingHours: 74,
      status: 'needs-evidence',
      raisedOn: T(3),
      summary: 'Confidence Weighted Allocation is outperforming Dynamic Allocation v1 on every quantitative measure, but forward runtime and human authorisation remain unmet.',
      background: 'Adaptive Allocation v7 emerged from Allocation Lab v2 as research champion with PF 2.11 across in-sample and out-of-sample windows. It has held the champion trial slot for 26 days.',
      evidenceTimeline: [
        { date: T(60), label: 'Nominated as research champion', detail: 'Allocation Lab v2 confidence-weighted experiment, PF 2.11.', route: '/allocation-lab-v2' },
        { date: T(56), label: 'Forward trial opened', detail: 'Governance gates registered; 60-day minimum applied.', route: '/champion-trial' },
        { date: T(41), label: 'First stability review', detail: 'PF 2.11, drawdown 1.6% — within institutional ceiling.', route: '/forward-validation' },
        { date: T(20), label: 'Degradation watch raised', detail: 'Rolling 20-trade PF drifting 2.11 → 1.94.', route: '/self-review' },
        { date: T(3), label: 'Executive review convened', detail: 'Recommendation: NOT READY, extend trial.', route: '/production-readiness' },
      ],
      graphLinks: [
        { label: 'Node · Confidence Weighted Allocation', route: '/knowledge-graph' },
        { label: 'Node · Drawdown Discipline', route: '/knowledge-graph' },
      ],
      memory: [
        { label: 'MEM-0412', detail: 'Prior promotion at 31 days runtime degraded within two weeks.' },
        { label: 'MEM-0488', detail: 'Allocation candidates need ≥50 trades before PF stabilises.' },
      ],
      forwardValidation: '26 of 60 required days elapsed · 29 of 50 required trades · peak drawdown 2.4% against a 3.0% ceiling.',
      riskAssessment: [
        { label: 'Capital risk', level: 'elevated', note: 'Promotion would expose real capital on a provisional sample.' },
        { label: 'Model risk', level: 'moderate', note: 'Rolling profit factor has not re-stabilised above 2.00.' },
        { label: 'Operational risk', level: 'moderate', note: 'Alerting runbook still in draft.' },
      ],
      counterArguments: [
        { claim: 'The edge is large enough to promote early.', rebuttal: 'Edge size does not substitute for runtime; the 60-day gate exists to detect regime dependence.' },
        { claim: 'Drawdown discipline is excellent.', rebuttal: 'True, but the observation window has not yet included a sustained bear regime.' },
      ],
      confidenceTrend: [71, 74, 73, 77, 79, 78, 81, 83, 82, 84],
      oracle: 'ATLAS recommends extending the forward trial. Every quantitative factor except runtime and sample size is passing; promoting now would trade 34 days of free evidence for an unmeasured tail risk.',
      recommendation: 'Extend forward trial — do not promote today.',
      answers: {
        'Why does ATLAS recommend this?': 'Because the strategy edge is well evidenced (PF 2.11, DD 2.4%) but two mandatory governance gates remain open. The recommendation is to extend, not to promote.',
        'What evidence is missing?': '34 further forward-validation days, 21 additional qualifying trades, and a signed executive authorisation.',
        'What would improve confidence?': 'Ten consecutive sessions with rolling 20-trade PF above 2.00, plus trade coverage across a second market regime.',
        'Has this happened before?': 'Yes. MEM-0412 records a promotion at 31 days runtime that degraded within two weeks — the origin of the 60-day gate.',
        'What memory supports this?': 'MEM-0412 and MEM-0488 both argue for a full sample before allocation changes.',
        'Show related research.': 'Allocation Lab v2, Champion Trial and Forward Validation carry the full evidence chain.',
      },
      lesson: 'Runtime gates protect against regime-dependent edges that look excellent in a single window.',
    },
    {
      id: 'EDC-2026-0148',
      title: 'Admit Low-Vol Coiler v2 to the specialist roster',
      type: 'Specialist Admission',
      department: 'Research Brain',
      priority: 'medium',
      confidence: 77,
      evidenceCount: 21,
      supportingResearch: [
        { label: 'Low-Vol Coiler v2', route: '/low-vol-coiler-v2' },
        { label: 'Specialist Approval Board', route: '/specialist-approval-board' },
      ],
      benefit: 'Adds compression-regime coverage the current roster does not serve (PF 1.74).',
      risk: 'Overlaps 31% of entries with VCB v1, risking correlated exposure.',
      reviewer: 'Chief Investment Officer',
      waitingHours: 41,
      status: 'ready',
      raisedOn: T(2),
      summary: 'Discovery Lab v2 identified compression regimes as the largest uncovered opportunity. Low-Vol Coiler v2 fills it, subject to an overlap ruling against VCB v1.',
      background: 'Specialist #5 was discovered by Discovery Lab v2 and iterated to v2 after v1 failed the robustness audit on trade frequency.',
      evidenceTimeline: [
        { date: T(34), label: 'Opportunity identified', detail: 'Discovery Lab v2 ranked compression regimes highest by uncovered PnL.', route: '/discovery-lab-v2' },
        { date: T(26), label: 'v1 robustness audit failed', detail: 'Insufficient trade frequency across the validation window.', route: '/specialist-championship' },
        { date: T(12), label: 'v2 validation pack passed', detail: 'PF 1.74, DD 2.1%, 63% capture of compression breakouts.', route: '/low-vol-coiler-v2' },
        { date: T(2), label: 'Approval board review', detail: 'Recommended for admission with an overlap monitor.', route: '/specialist-approval-board' },
      ],
      graphLinks: [{ label: 'Node · Compression Regime', route: '/knowledge-graph' }, { label: 'Node · VCB v1 overlap', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0503', detail: 'Correlated specialists inflate portfolio drawdown more than they add PnL.' }],
      forwardValidation: '18 simulated days · 41 trades · PF 1.74 · DD 2.1%.',
      riskAssessment: [
        { label: 'Correlation risk', level: 'moderate', note: '31% entry overlap with VCB v1 requires an exposure cap.' },
        { label: 'Capital risk', level: 'low', note: 'Simulation only; roster admission changes no live allocation.' },
      ],
      counterArguments: [
        { claim: 'Overlap makes the specialist redundant.', rebuttal: 'The non-overlapping 69% covers the lowest-ATR decile that VCB v1 systematically skips.' },
      ],
      confidenceTrend: [62, 65, 68, 70, 71, 73, 74, 76, 76, 77],
      oracle: 'Admission is supported. Recommend admitting with a shared exposure cap against VCB v1 rather than declining on overlap alone.',
      recommendation: 'Approve admission with a correlated-exposure cap.',
      answers: {
        'Why does ATLAS recommend this?': 'It closes the largest uncovered regime with a PF of 1.74 and a drawdown well inside the institutional ceiling.',
        'What evidence is missing?': 'A dedicated correlation study against VCB v1 over a bear-regime window.',
        'What would improve confidence?': 'Twenty further compression-regime trades with the exposure cap applied.',
        'Has this happened before?': 'Yes. MEM-0503 records correlated specialists inflating portfolio drawdown.',
        'What memory supports this?': 'MEM-0503 on correlated specialist admission.',
        'Show related research.': 'Discovery Lab v2 and the Low-Vol Coiler v2 validation pack.',
      },
      lesson: 'Overlap is a sizing question before it is an admission question.',
    },
    {
      id: 'EDC-2026-0149',
      title: 'Publish the production alerting runbook',
      type: 'Operational',
      department: 'Maintenance',
      priority: 'medium',
      confidence: 91,
      evidenceCount: 12,
      supportingResearch: [{ label: 'Maintenance Reports', route: '/maintenance/reports' }, { label: 'System Health', route: '/system-health' }],
      benefit: 'Clears the last operational gate on the production readiness ladder.',
      risk: 'None material; documentation and one rehearsal drill only.',
      reviewer: 'Head of Operations',
      waitingHours: 118,
      status: 'waiting',
      raisedOn: T(5),
      summary: 'Auto-repair and predictive maintenance are healthy, but the alerting runbook remains a draft and blocks Gate 7 of production readiness.',
      background: 'Maintenance has run 41 consecutive clean cycles. The outstanding item is documentation plus one rehearsed failover drill.',
      evidenceTimeline: [
        { date: T(28), label: 'Gate 7 flagged', detail: 'Production Readiness Centre marked operational readiness as pending.', route: '/production-readiness' },
        { date: T(9), label: 'Draft runbook circulated', detail: 'Covers alert routing, escalation and silence windows.', route: '/maintenance/reports' },
        { date: T(5), label: 'Awaiting executive sign-off', detail: 'Drill scheduling requires an owner.', route: '/maintenance/settings' },
      ],
      graphLinks: [{ label: 'Node · Operational Readiness', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0377', detail: 'Undocumented escalation paths were the root cause of two prior recovery delays.' }],
      forwardValidation: 'Not applicable — operational governance item.',
      riskAssessment: [{ label: 'Operational risk', level: 'low', note: 'Approving unblocks a documentation gate only.' }],
      counterArguments: [{ claim: 'Auto-repair makes a runbook redundant.', rebuttal: 'Auto-repair covers known failure classes; the runbook exists for the unknown ones.' }],
      confidenceTrend: [80, 82, 84, 85, 86, 88, 89, 90, 90, 91],
      oracle: 'Low-risk, high-clearance item. Approving removes an operational blocker without touching capital or strategy.',
      recommendation: 'Approve and assign a drill owner.',
      answers: {
        'Why does ATLAS recommend this?': 'It clears an operational gate at effectively zero risk and raises production readiness by an estimated 6 points.',
        'What evidence is missing?': 'A completed failover drill record.',
        'What would improve confidence?': 'One rehearsed drill with timings logged.',
        'Has this happened before?': 'Yes — MEM-0377 records two recovery delays caused by undocumented escalation.',
        'What memory supports this?': 'MEM-0377 on escalation documentation.',
        'Show related research.': 'Maintenance Reports and System Health.',
      },
      lesson: 'Documentation gates are the cheapest readiness points available.',
    },
    {
      id: 'EDC-2026-0150',
      title: 'Retire Router v2 in favour of Router v2.1',
      type: 'Deprecation',
      department: 'Quant Research',
      priority: 'high',
      confidence: 68,
      evidenceCount: 26,
      supportingResearch: [{ label: 'Router v2.1', route: '/router-v21' }, { label: 'Trade Frequency Audit', route: '/trade-frequency' }],
      benefit: 'Recovers the sub-threshold move band worth an estimated 11% additional net PnL.',
      risk: 'Retiring the baseline removes the reference against which every specialist is measured.',
      reviewer: 'Chief Investment Officer',
      waitingHours: 29,
      status: 'needs-evidence',
      raisedOn: T(1),
      summary: 'Router v2.1 with -10% entry thresholds outperforms v2 on net PnL and capture, but has not yet run the 30-day, 20-trade governance minimum.',
      background: 'The Trade Frequency Opportunity Audit found profitable sub-threshold moves in the XRP 1.8–2.99% band, which motivated the v2.1 fork.',
      evidenceTimeline: [
        { date: T(48), label: 'Frequency audit completed', detail: 'Identified missed sub-threshold moves worth ~11% net PnL.', route: '/trade-frequency' },
        { date: T(44), label: 'Router v2.1 forked', detail: '-10% thresholds, all other logic unchanged.', route: '/router-v21' },
        { date: T(1), label: 'Comparison panel reviewed', detail: 'v2.1 ahead on PnL and capture, marginally behind on PF.', route: '/router-v21' },
      ],
      graphLinks: [{ label: 'Node · Router baseline', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0521', detail: 'Baselines should be retired only after a replacement completes full runtime.' }],
      forwardValidation: '14 of 30 required days · 12 of 20 required trades.',
      riskAssessment: [
        { label: 'Benchmark risk', level: 'elevated', note: 'Losing the v2 baseline breaks continuity in every comparison dashboard.' },
        { label: 'Model risk', level: 'moderate', note: 'Lower thresholds increase exposure to noise entries.' },
      ],
      counterArguments: [
        { claim: 'v2.1 strictly dominates v2.', rebuttal: 'Not on profit factor; the extra trades are marginally lower quality.' },
      ],
      confidenceTrend: [55, 58, 60, 59, 62, 64, 65, 66, 67, 68],
      oracle: 'Recommend declining retirement today and running v2 and v2.1 in parallel until the 30-day gate closes.',
      recommendation: 'Request more evidence — keep both routers running in parallel.',
      answers: {
        'Why does ATLAS recommend this?': 'The evidence favours v2.1 on capture but not decisively on quality, and the baseline has institutional value beyond its own performance.',
        'What evidence is missing?': '16 further runtime days and 8 further qualifying trades.',
        'What would improve confidence?': 'v2.1 holding a profit factor at or above v2 over a full 30-day window.',
        'Has this happened before?': 'Yes. MEM-0521 records the rule that baselines outlive their replacements by one full cycle.',
        'What memory supports this?': 'MEM-0521 on baseline retirement.',
        'Show related research.': 'Trade Frequency Audit and the Router v2.1 comparison panel.',
      },
      lesson: 'A baseline is infrastructure, not merely a competitor.',
    },
    {
      id: 'EDC-2026-0151',
      title: 'Raise portfolio drawdown ceiling from 3.0% to 3.5%',
      type: 'Governance Change',
      department: 'Governance',
      priority: 'low',
      confidence: 44,
      evidenceCount: 8,
      supportingResearch: [{ label: 'Governance', route: '/governance' }, { label: 'Risk Radar', route: '/institution/risk-radar' }],
      benefit: 'Would allow specialists to hold positions through normal volatility expansion.',
      risk: 'Weakens the single guardrail that has never been breached.',
      reviewer: 'Executive Board',
      waitingHours: 196,
      status: 'deferred',
      raisedOn: T(9),
      summary: 'A research request to loosen the drawdown ceiling. ATLAS does not support this change on the current evidence.',
      background: 'Raised after three specialists were stopped out during a single volatility expansion event.',
      evidenceTimeline: [
        { date: T(21), label: 'Volatility event', detail: 'Three specialists stopped within the same session.', route: '/institution/risk-radar' },
        { date: T(9), label: 'Change requested', detail: 'Proposal to raise the ceiling by 50bps.', route: '/governance' },
      ],
      graphLinks: [{ label: 'Node · Drawdown Ceiling', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0290', detail: 'Every historical loosening of a risk ceiling preceded a larger drawdown.' }],
      forwardValidation: 'Not applicable — governance parameter proposal.',
      riskAssessment: [{ label: 'Governance risk', level: 'elevated', note: 'Removes the institution\'s most reliable protective constraint.' }],
      counterArguments: [{ claim: 'The ceiling is causing premature exits.', rebuttal: 'Position sizing, not the ceiling, is the correct lever for volatility expansion.' }],
      confidenceTrend: [58, 55, 53, 51, 50, 48, 47, 46, 45, 44],
      oracle: 'ATLAS advises against this change. The correct response to volatility expansion is adaptive sizing, which already exists.',
      recommendation: 'Defer indefinitely — address via adaptive sizing instead.',
      answers: {
        'Why does ATLAS recommend this?': 'It does not. Confidence in the proposal is 44% and every supporting memory argues against loosening risk ceilings.',
        'What evidence is missing?': 'Evidence that the ceiling, rather than position sizing, caused the premature exits.',
        'What would improve confidence?': 'A controlled study isolating ceiling breaches from sizing-driven stops.',
        'Has this happened before?': 'Yes. MEM-0290 records that every past loosening preceded a larger drawdown.',
        'What memory supports this?': 'MEM-0290 on risk ceiling changes.',
        'Show related research.': 'Governance and Institutional Risk Radar.',
      },
      lesson: 'Guardrails that have never been breached are working, not restrictive.',
    },
    {
      id: 'EDC-2026-0146',
      title: 'Archive Participation Controller v1',
      type: 'Deprecation',
      department: 'Portfolio Director',
      priority: 'low',
      confidence: 93,
      evidenceCount: 15,
      supportingResearch: [{ label: 'Participation Controller', route: '/participation-controller' }],
      benefit: 'Removes a superseded controller from every active comparison surface.',
      risk: 'None; v1 is retained read-only in the archive.',
      reviewer: 'Portfolio Director',
      waitingHours: 0,
      status: 'approved',
      raisedOn: T(11),
      summary: 'MPC v2 Confidence Recovery has fully superseded v1 across every measured regime.',
      background: 'v2 improved recovery confidence by 22 points with no drawdown cost across the full validation window.',
      evidenceTimeline: [
        { date: T(30), label: 'v2 validation passed', detail: 'Confidence recovery improved 22 points.', route: '/participation-controller' },
        { date: T(11), label: 'Archive proposed', detail: 'v1 retained read-only for audit continuity.', route: '/participation-controller' },
        { date: T(8), label: 'Approved by Portfolio Director', detail: 'Archived with full lineage preserved.', route: '/institution/memory' },
      ],
      graphLinks: [{ label: 'Node · Participation Controller', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0455', detail: 'Superseded modules are archived, never deleted.' }],
      forwardValidation: 'Complete — 30 days, 64 trades.',
      riskAssessment: [{ label: 'Audit risk', level: 'low', note: 'Full lineage preserved in the archive.' }],
      counterArguments: [{ claim: 'v1 may still suit low-liquidity regimes.', rebuttal: 'v2 matched or exceeded v1 in all six measured regimes.' }],
      confidenceTrend: [84, 86, 87, 88, 89, 90, 91, 92, 92, 93],
      oracle: 'Straightforward supersession. Approved and archived with lineage intact.',
      recommendation: 'Approved — archived read-only.',
      answers: {
        'Why does ATLAS recommend this?': 'v2 dominated v1 in all six measured regimes with no drawdown cost.',
        'What evidence is missing?': 'Nothing outstanding.',
        'What would improve confidence?': 'Confidence is already 93%; no further evidence required.',
        'Has this happened before?': 'Yes — the same pattern applied to Router v1.',
        'What memory supports this?': 'MEM-0455 on archiving superseded modules.',
        'Show related research.': 'Participation Controller v2 validation.',
      },
      lesson: 'Supersession decisions are cheap when lineage is preserved.',
    },
    {
      id: 'EDC-2026-0145',
      title: 'Increase Momentum Scalper v2 risk allocation to 75%',
      type: 'Risk Allocation',
      department: 'Chief Investment Officer',
      priority: 'medium',
      confidence: 51,
      evidenceCount: 9,
      supportingResearch: [{ label: 'Momentum Scalper v2', route: '/momentum-scalper-v2' }],
      benefit: 'Would scale the strongest high-volatility specialist.',
      risk: 'Concentrates portfolio exposure in a single regime.',
      reviewer: 'Chief Investment Officer',
      waitingHours: 0,
      status: 'declined',
      raisedOn: T(14),
      summary: 'Declined. Regime concentration outweighed the incremental PnL benefit.',
      background: 'MS v2 reached PF 1.56 after activation gating, prompting a request to raise its risk share from 50% to 75% of Router risk.',
      evidenceTimeline: [
        { date: T(24), label: 'MS v2 gated validation', detail: 'PF improved 1.21 → 1.56 with activation gates.', route: '/momentum-scalper-v2' },
        { date: T(14), label: 'Risk increase requested', detail: '50% → 75% of Router risk.', route: '/portfolio-manager' },
        { date: T(12), label: 'Declined by CIO', detail: 'Regime concentration exceeds the exposure policy.', route: '/portfolio-manager' },
      ],
      graphLinks: [{ label: 'Node · Regime Concentration', route: '/knowledge-graph' }],
      memory: [{ label: 'MEM-0468', detail: 'Single-regime concentration above 60% has always increased portfolio drawdown.' }],
      forwardValidation: '22 days · 48 trades · PF 1.56.',
      riskAssessment: [{ label: 'Concentration risk', level: 'elevated', note: 'High-volatility regime exposure would reach 68%.' }],
      counterArguments: [{ claim: 'MS v2 is the best performer available.', rebuttal: 'Within one regime only; the portfolio is measured across all regimes.' }],
      confidenceTrend: [64, 62, 60, 58, 57, 55, 54, 53, 52, 51],
      oracle: 'Declined correctly. The proposal optimised a specialist at the portfolio\'s expense.',
      recommendation: 'Declined — retain 50% risk allocation.',
      answers: {
        'Why does ATLAS recommend this?': 'It recommended declining: specialist strength does not justify regime concentration above policy.',
        'What evidence is missing?': 'Evidence that concentration risk is compensated across a full cycle.',
        'What would improve confidence?': 'A cross-regime study showing stable portfolio drawdown at 75% allocation.',
        'Has this happened before?': 'Yes — MEM-0468 records the same pattern with Trend Rider v1.',
        'What memory supports this?': 'MEM-0468 on single-regime concentration.',
        'Show related research.': 'Momentum Scalper v2 validation pack.',
      },
      lesson: 'Optimising a specialist can quietly de-optimise the portfolio.',
    },
  ];
}

export const OPEN_STATUSES: QueueStatus[] = ['waiting', 'needs-evidence', 'ready', 'deferred'];

export interface CentreSummary {
  open: number; highPriority: number; needsEvidence: number;
  approvedToday: number; declinedToday: number;
  avgDecisionHours: number; governanceHealth: number; decisionConfidence: number;
  oldestWaitingHours: number; readyForProduction: number; highConfidence: number;
}

export function centreSummary(items = decisionQueue()): CentreSummary {
  const open = items.filter((d) => OPEN_STATUSES.includes(d.status));
  const closed = items.filter((d) => d.status === 'approved' || d.status === 'declined');
  const avgConf = Math.round(open.reduce((a, d) => a + d.confidence, 0) / Math.max(1, open.length));
  return {
    open: open.length,
    highPriority: open.filter((d) => d.priority === 'high').length,
    needsEvidence: open.filter((d) => d.status === 'needs-evidence').length,
    approvedToday: items.filter((d) => d.status === 'approved').length,
    declinedToday: items.filter((d) => d.status === 'declined').length,
    avgDecisionHours: Math.round(closed.reduce((a, d) => a + 62, 0) / Math.max(1, closed.length)),
    governanceHealth: 92,
    decisionConfidence: avgConf,
    oldestWaitingHours: Math.max(0, ...open.map((d) => d.waitingHours)),
    readyForProduction: open.filter((d) => d.status === 'ready').length,
    highConfidence: open.filter((d) => d.confidence >= 80).length,
  };
}

export interface HistoryStats {
  total: number; approvalRate: number; declineRate: number;
  avgConfidence: number; avgEvidence: number; departments: string[];
}

export function historyStats(items = decisionQueue()): HistoryStats {
  const closed = items.filter((d) => d.status === 'approved' || d.status === 'declined');
  return {
    total: items.length,
    approvalRate: Math.round((closed.filter((d) => d.status === 'approved').length / Math.max(1, closed.length)) * 100),
    declineRate: Math.round((closed.filter((d) => d.status === 'declined').length / Math.max(1, closed.length)) * 100),
    avgConfidence: Math.round(items.reduce((a, d) => a + d.confidence, 0) / items.length),
    avgEvidence: Math.round(items.reduce((a, d) => a + d.evidenceCount, 0) / items.length),
    departments: Array.from(new Set(items.map((d) => d.department))),
  };
}

/* ── Advisory action ledger (device-only, records nothing executable) ── */

export interface DecisionRecord {
  id: string;
  decisionId: string;
  action: ActionKind;
  reason: string;
  notes: string;
  reviewer: string;
  at: string;
}

const LEDGER_KEY = 'atlas.decision-centre.ledger.v1';

export function readLedger(): DecisionRecord[] {
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    return raw ? (JSON.parse(raw) as DecisionRecord[]) : [];
  } catch { return []; }
}

export function appendLedger(rec: Omit<DecisionRecord, 'id' | 'at'>): DecisionRecord[] {
  const next: DecisionRecord[] = [
    { ...rec, id: `REC-${Date.now()}`, at: new Date().toISOString() },
    ...readLedger(),
  ].slice(0, 200);
  try { localStorage.setItem(LEDGER_KEY, JSON.stringify(next)); } catch { /* storage full */ }
  return next;
}

export const CENTRE_GOVERNANCE = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Human Approval Required',
  'No Live Trading', 'No Strategy Changes', 'No Exchange Connectivity', 'No Automatic Approval',
];

export function institutionalLearning(items = decisionQueue()) {
  return items.slice(0, 5).map((d) => ({
    id: d.id,
    lesson: d.lesson,
    memory: d.memory[0]?.label ?? '—',
    knowledge: d.graphLinks[0]?.label ?? '—',
    related: d.supportingResearch[0] ?? { label: 'Research', route: '/research' },
  }));
}
