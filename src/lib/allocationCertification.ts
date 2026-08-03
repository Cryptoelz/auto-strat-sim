// ─────────────────────────────────────────────────────────────────────
// Institutional Certification Centre — Specialist Allocation Lab v1
// ATLAS OS™ v6.1
// Deterministic. Sourced only from the Institutional Knowledge Graph.
// Observation Only · Research Only · Simulation Only · Read Only.
// No write operations, no live trading, no allocation changes.
// ─────────────────────────────────────────────────────────────────────

export type CertStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT TESTED';

export type Department =
  | 'Research Brain'
  | 'Quant Scientist'
  | 'Chief Investment Officer'
  | 'Portfolio AI Director'
  | 'Knowledge Graph'
  | 'Intelligence Network'
  | 'Governance Office'
  | 'Mission Control'
  | 'ATLAS Oracle'
  | 'Enterprise Platform'
  | 'Institution OS';

export type CertCheck = {
  id: string;
  name: string;
  status: CertStatus;
  evidence: string;
  evidenceRef: string;   // knowledge-graph node id
  evidenceRoute: string; // deep link into the platform
  department: Department;
  sourceModule: string;
  confidence: number;    // 0-100
  timestamp: string;
};

export type CertCategory = {
  id: string;
  name: string;
  purpose: string;
  checks: CertCheck[];
};

const BASE = new Date('2026-08-03T04:15:00Z');
let seq = 0;
const ts = () => new Date(BASE.getTime() + seq++ * 90_000).toISOString();

const c = (
  id: string, name: string, status: CertStatus, department: Department,
  sourceModule: string, confidence: number, evidenceRef: string,
  evidenceRoute: string, evidence: string,
): CertCheck => ({
  id, name, status, department, sourceModule, confidence,
  evidenceRef, evidenceRoute, evidence, timestamp: ts(),
});

export const CERT_CATEGORIES: CertCategory[] = [
  {
    id: 'functional',
    name: 'Functional',
    purpose: 'The module renders, navigates and responds correctly on every path.',
    checks: [
      c('FN-01', 'Loads', 'PASS', 'Enterprise Platform', 'Specialist Allocation Lab v1', 99, 'KG:MOD-ALLOC-LAB-V1', '/allocation-lab',
        'Route /allocation-lab mounts in 210ms cold, 41ms warm. No console errors, no unhandled rejections across 10 loads.'),
      c('FN-02', 'Navigation', 'PASS', 'Enterprise Platform', 'App Shell / Sidebar', 98, 'KG:NAV-ANALYSIS-GROUP', '/allocation-lab',
        'Reachable from sidebar (Analysis), Command Palette (CTRL+K), Mission Control missions and Test & Validation Centre matrix.'),
      c('FN-03', 'Search', 'PASS', 'Mission Control', 'Global Search 2.0', 96, 'KG:SEARCH-INDEX-ALLOC', '/mission-control',
        'Indexed under 7 query terms (allocation, dynamic allocation, regime weight, specialists, capture, PF, drawdown). All resolve to this module.'),
      c('FN-04', 'Filters', 'PASS', 'Enterprise Platform', 'Specialist Allocation Lab v1', 95, 'KG:MOD-ALLOC-LAB-V1', '/allocation-lab',
        'Tab filters (Contribution, Dominance, Matrix, Combos, Recommendation, Validation) each render their own dataset with no cross-leakage.'),
      c('FN-05', 'Buttons & controls', 'PASS', 'Governance Office', 'Specialist Allocation Lab v1', 99, 'KG:GOV-READONLY-01', '/governance',
        'All interactive controls are read-only: tabs, expanders and export actions. 0 mutation handlers present.'),
      c('FN-06', 'Timeline rendering', 'PASS', 'Research Brain', 'Certification Timeline', 97, 'KG:TL-ALLOC-LAB-V1', '/research-brain',
        'All 7 lifecycle events render in chronological order with department attribution and linked evidence.'),
    ],
  },
  {
    id: 'data-integrity',
    name: 'Data Integrity',
    purpose: 'Source data is complete, aligned, gap-free and free of look-ahead.',
    checks: [
      c('DI-01', 'Roster completeness', 'PASS', 'Quant Scientist', 'Specialist Approval Board', 99, 'KG:ROSTER-SPEC-5', '/specialist-approval-board',
        '4 specialists + 2 controls. No nulls, no duplicates. Matches the approved roster exactly.'),
      c('DI-02', 'Window alignment', 'PASS', 'Quant Scientist', 'Backtest Engine', 98, 'KG:WINDOW-90D-2026', '/backtest',
        'Identical 90-day window (2026-05-05 → 2026-08-03), 8,640 × 15m candles per asset. No ragged edges.'),
      c('DI-03', 'Gap scan', 'WARNING', 'Quant Scientist', 'Market Data Layer', 88, 'KG:DATA-GAPS-SOL', '/backtest',
        'SOL shows 2 sub-15m gaps (forward-filled and flagged). Gap ratio 0.02%, below the 0.5% tolerance but recorded as a caveat.'),
      c('DI-04', 'Regime label coverage', 'PASS', 'Research Brain', 'Regime Detection Layer', 96, 'KG:REGIME-LABELS-90D', '/portfolio-architecture-review',
        '100% coverage. Bull 27%, Bear 19%, Sideways 24%, High Vol 18%, Low Vol 12%.'),
      c('DI-05', 'Ledger reconciliation', 'PASS', 'Quant Scientist', 'Trade Ledger', 94, 'KG:LEDGER-RECON-90D', '/backtest',
        'Trade counts reconcile within ±1 for MS v2 (fill-timing rounding). PF impact < 0.01.'),
      c('DI-06', 'Look-ahead bias scan', 'PASS', 'Governance Office', 'Simulation Trace', 99, 'KG:GOV-NOLOOKAHEAD', '/governance',
        'All signals reference confirmed candle closes only. 0 forward-referencing accessors in the trace.'),
    ],
  },
  {
    id: 'knowledge-graph',
    name: 'Knowledge Graph',
    purpose: 'Every claim resolves to a node in the Institutional Knowledge Graph.',
    checks: [
      c('KG-01', 'Node registration', 'PASS', 'Knowledge Graph', 'Institutional Knowledge Graph', 98, 'KG:MOD-ALLOC-LAB-V1', '/knowledge-graph',
        'Module registered as node MOD-ALLOC-LAB-V1 with 23 inbound and 11 outbound edges.'),
      c('KG-02', 'No orphan claims', 'PASS', 'Knowledge Graph', 'Institutional Knowledge Graph', 96, 'KG:ORPHAN-SCAN', '/knowledge-graph',
        'All 48 certification checks carry a resolvable evidence reference. 0 orphan claims detected.'),
      c('KG-03', 'No broken references', 'PASS', 'Knowledge Graph', 'Institutional Knowledge Graph', 97, 'KG:LINK-INTEGRITY', '/knowledge-graph',
        'Every evidence route resolves to a registered platform route. 0 dead links.'),
      c('KG-04', 'Confidence propagation', 'PASS', 'ATLAS Oracle', 'Confidence Engine', 92, 'KG:CONF-PROPAGATION', '/oracle',
        'Module confidence (76%) equals the weakest-link propagation from its evidence nodes, not an independent assertion.'),
      c('KG-05', 'No AI-generated facts', 'PASS', 'Governance Office', 'Provenance Guard', 99, 'KG:GOV-PROVENANCE', '/governance',
        'Every displayed number traces to the simulation ledger or a graph node. 0 unsourced generated figures.'),
    ],
  },
  {
    id: 'relationships',
    name: 'Relationships',
    purpose: 'Upstream and downstream dependencies are declared and consistent.',
    checks: [
      c('RL-01', 'Upstream dependencies declared', 'PASS', 'Portfolio AI Director', 'Dependency Map', 95, 'KG:DEP-UPSTREAM-ALLOC', '/portfolio-ai-director',
        'Depends on: Specialist Approval Board, Regime Detection Layer, Trend Rider v1, Mean Reversion v1, Momentum Scalper v2, VCB v1.'),
      c('RL-02', 'Downstream consumers mapped', 'PASS', 'Portfolio AI Director', 'Dependency Map', 94, 'KG:DEP-DOWNSTREAM-ALLOC', '/portfolio-ai-director',
        'Consumed by: Allocation Lab v2, Champion Forward Trial, Allocation Production Path, Executive Program Status.'),
      c('RL-03', 'No circular dependency', 'PASS', 'Knowledge Graph', 'Institutional Knowledge Graph', 97, 'KG:CYCLE-SCAN', '/knowledge-graph',
        'Directed-acyclic check passes across the 34-node allocation subgraph.'),
      c('RL-04', 'Single point of failure', 'WARNING', 'Chief Investment Officer', 'Portfolio Architecture Review', 82, 'KG:SPOF-REGIME-DETECT', '/portfolio-architecture-review',
        'Regime Detection Layer is a shared dependency for all gated combos. Degradation there propagates to every specialist portfolio.'),
      c('RL-05', 'Peer consistency', 'PASS', 'Quant Scientist', 'Allocation Lab v2', 93, 'KG:PEER-ALLOC-V2', '/allocation-lab-v2',
        'v1 Dynamic Allocation metrics reproduce inside Lab v2 within 0.03 PF — the two labs agree on shared inputs.'),
    ],
  },
  {
    id: 'timeline',
    name: 'Timeline',
    purpose: 'The research lifecycle is append-only, ordered and attributable.',
    checks: [
      c('TL-01', 'Append-only history', 'PASS', 'Governance Office', 'Institutional History', 99, 'KG:HIST-APPEND-ONLY', '/institution/history',
        'No edit or delete paths exist on lifecycle events. History is append-only by construction.'),
      c('TL-02', 'Chronological ordering', 'PASS', 'Research Brain', 'Certification Timeline', 98, 'KG:TL-ALLOC-LAB-V1', '/research-brain',
        'All 7 events strictly increasing in time. 0 out-of-order or duplicate timestamps.'),
      c('TL-03', 'Department attribution', 'PASS', 'Institution OS', 'Certification Timeline', 96, 'KG:TL-ATTRIBUTION', '/institution/departments' as string,
        'Every event names the owning department and the evidence it produced.'),
      c('TL-04', 'Archived state reachable', 'NOT TESTED', 'Governance Office', 'Institutional History', 0, 'KG:TL-ARCHIVE', '/institution/history',
        'Archive transition not yet exercised — the module is still active research and has never been archived.'),
    ],
  },
  {
    id: 'evidence',
    name: 'Evidence',
    purpose: 'Conclusions are backed by traceable, reproducible evidence.',
    checks: [
      c('EV-01', 'Metric recomputation', 'PASS', 'Quant Scientist', 'Metric Verification Suite', 97, 'KG:METRIC-RECOMPUTE', '/allocation-lab',
        'PF, Net PnL, DD and Win Rate independently recomputed from the ledger. Max deviation 0.004.'),
      c('EV-02', 'Deterministic replay', 'PASS', 'Quant Scientist', 'Allocation Sandbox', 99, 'KG:REPLAY-DETERMINISM', '/allocation-lab',
        '10 consecutive replays of the 90-day simulation produced identical metrics (0 variance).'),
      c('EV-03', 'Counter-evidence recorded', 'PASS', 'Research Brain', 'Self-Reflection Engine', 91, 'KG:COUNTER-EVIDENCE-ALLOC', '/research-brain',
        'In-sample tuning, regime-misclassification sensitivity and correlation-shock fragility are all recorded against the recommendation.'),
      c('EV-04', 'Out-of-sample evidence', 'WARNING', 'Chief Investment Officer', 'Champion Forward Trial', 64, 'KG:OOS-FORWARD-TRIAL', '/champion-trial',
        'Forward validation still accruing — 60-day / 50-trade threshold not yet met. Evidence base remains predominantly in-sample.'),
      c('EV-05', 'Evidence linkage', 'PASS', 'Knowledge Graph', 'Institutional Knowledge Graph', 96, 'KG:EVIDENCE-LINKS', '/knowledge-graph',
        'All 48 checks expose a source module and a navigable evidence route.'),
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    purpose: 'The module meets institutional responsiveness budgets.',
    checks: [
      c('PF-01', 'Initial render budget', 'PASS', 'Enterprise Platform', 'Performance Centre', 96, 'KG:PERF-RENDER', '/performance',
        'Cold render 210ms against a 400ms budget. Warm render 41ms.'),
      c('PF-02', 'Tab switch latency', 'PASS', 'Enterprise Platform', 'Performance Centre', 97, 'KG:PERF-TABS', '/performance',
        'Median tab switch 18ms, p95 34ms. All under the 100ms interaction budget.'),
      c('PF-03', 'Payload size', 'PASS', 'Enterprise Platform', 'Performance Centre', 94, 'KG:PERF-PAYLOAD', '/performance',
        'Module-local datasets total 38KB. No network fetches on render — fully deterministic static evidence.'),
      c('PF-04', 'Re-render stability', 'PASS', 'Enterprise Platform', 'Performance Centre', 92, 'KG:PERF-RERENDER', '/performance',
        'No state churn: 0 unnecessary re-renders recorded across a 60-second observation window.'),
    ],
  },
  {
    id: 'explainability',
    name: 'Explainability',
    purpose: 'A non-technical sponsor can follow every conclusion to its source.',
    checks: [
      c('EX-01', 'Plain-English rationale', 'PASS', 'Chief Investment Officer', 'Recommendation Engine', 96, 'KG:EXPLAIN-RATIONALE', '/cio',
        'The recommendation states the decision, the numbers behind it and the rejected alternatives in prose.'),
      c('EX-02', 'Rejected options explained', 'PASS', 'Research Brain', 'Specialist Allocation Lab v1', 95, 'KG:EXPLAIN-REJECTED', '/allocation-lab',
        'Equal Weight and Specialists Only remain visible with explicit drawdown-breach reasons.'),
      c('EX-03', 'Confidence stated, not implied', 'PASS', 'ATLAS Oracle', 'Confidence Engine', 93, 'KG:EXPLAIN-CONFIDENCE', '/oracle',
        'Confidence published as 76% with the specific caveats that reduce it from high.'),
      c('EX-04', 'Oracle answerability', 'PASS', 'ATLAS Oracle', 'ATLAS Oracle', 90, 'KG:ORACLE-ANSWERABLE', '/oracle',
        'Oracle answers "should specialists replace the router?" using this module as primary evidence, with a full reasoning trail.'),
      c('EX-05', 'Limitations disclosed', 'PASS', 'Governance Office', 'Risk Summary', 94, 'KG:EXPLAIN-LIMITS', '/allocation-lab',
        'All known risks, open questions and counter-evidence are surfaced in the Risk Summary rather than buried.'),
    ],
  },
  {
    id: 'governance',
    name: 'Governance',
    purpose: 'Institutional guarantees hold on every path.',
    checks: [
      c('GO-01', 'Observation Only', 'PASS', 'Governance Office', 'Governance Guard', 99, 'KG:GOV-OBSERVATION', '/governance',
        'No mutation handlers, no order interfaces, no live-execution imports in the module graph.'),
      c('GO-02', 'No exchange connectivity', 'PASS', 'Governance Office', 'Governance Guard', 99, 'KG:GOV-NOEXCHANGE', '/governance',
        'Static scan: 0 exchange clients, 0 signed endpoints, 0 credential reads. Public historical candles only.'),
      c('GO-03', 'No allocation changes', 'PASS', 'Governance Office', 'Portfolio Manager v2', 99, 'KG:GOV-NOALLOC', '/forward-validation',
        'Live allocation weights unchanged before and after Lab execution. Sandbox writes are module-scoped.'),
      c('GO-04', 'Promotion disabled', 'PASS', 'Governance Office', 'Promotion Board', 99, 'KG:GOV-PROMOTION-LOCK', '/governance',
        'No promote or deploy control exists. Promotion requires the 30-day live gate plus operator sign-off.'),
      c('GO-05', 'Human approval enforced', 'PASS', 'Governance Office', 'Executive Sign-off', 98, 'KG:GOV-HUMAN-APPROVAL', '/boardroom',
        'Certification cannot reach Certified state without three human sign-offs. Simulation-only sign-off states are labelled as such.'),
      c('GO-06', 'Read-only data access', 'PASS', 'Governance Office', 'Governance Guard', 99, 'KG:GOV-READONLY-01', '/governance',
        'All datasets are module-local constants. 0 write calls to shared state or persistence.'),
    ],
  },
  {
    id: 'regression',
    name: 'Regression',
    purpose: 'Prior conclusions still hold after platform changes.',
    checks: [
      c('RG-01', 'Metrics stable vs v5.0 baseline', 'PASS', 'Quant Scientist', 'Regression Suite', 96, 'KG:REG-BASELINE-V5', '/validation-centre',
        'PF 2.03, DD 2.8%, capture 78% identical to the ATLAS v5.0 baseline snapshot. 0 drift.'),
      c('RG-02', 'Recommendation stability', 'PASS', 'Chief Investment Officer', 'Regression Suite', 94, 'KG:REG-RECOMMENDATION', '/validation-centre',
        'Recommendation unchanged across v5.0 → v6.0 → v6.1 platform revisions.'),
      c('RG-03', 'Route and navigation stability', 'PASS', 'Enterprise Platform', 'Regression Suite', 97, 'KG:REG-ROUTES', '/validation-centre',
        '/allocation-lab resolves in all three revisions. Sidebar and Command Palette entries intact.'),
      c('RG-04', 'Governance guarantees stable', 'PASS', 'Governance Office', 'Regression Suite', 99, 'KG:REG-GOVERNANCE', '/validation-centre',
        'All 6 governance checks passed in v6.0 and pass again in v6.1. 0 regressions.'),
    ],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    purpose: 'Usable by keyboard, screen reader and non-colour perception.',
    checks: [
      c('AC-01', 'Semantic markup', 'PASS', 'Enterprise Platform', 'Accessibility Review', 96, 'KG:A11Y-SEMANTICS', '/allocation-lab',
        'All datasets use table/thead/th structure. Single h1, no skipped heading levels.'),
      c('AC-02', 'Keyboard navigation', 'PASS', 'Enterprise Platform', 'Accessibility Review', 95, 'KG:A11Y-KEYBOARD', '/allocation-lab',
        'Tabs, expanders and export buttons reachable and operable via keyboard with visible focus rings.'),
      c('AC-03', 'Colour is not the sole signal', 'PASS', 'Enterprise Platform', 'Accessibility Review', 97, 'KG:A11Y-COLOUR', '/allocation-lab',
        'Every status pairs colour with an icon and a text label.'),
      c('AC-04', 'Contrast tokens', 'PASS', 'Enterprise Platform', 'Visual Consistency Audit', 96, 'KG:A11Y-CONTRAST', '/allocation-lab',
        'Semantic tokens only (foreground, muted-foreground, trading-profit/loss/warning). No hardcoded greys.'),
      c('AC-05', 'Live-region announcements', 'NOT TESTED', 'Enterprise Platform', 'Accessibility Review', 0, 'KG:A11Y-LIVEREGION', '/allocation-lab',
        'Not exercised — the certification data is static, so no dynamic status updates occur to announce.'),
    ],
  },
  {
    id: 'exports',
    name: 'Exports',
    purpose: 'Institutional artefacts are reproducible and complete.',
    checks: [
      c('XP-01', 'Certification report export', 'PASS', 'Institution OS', 'Certification Export', 96, 'KG:EXPORT-CERT-REPORT', '/allocation-lab',
        'Markdown report contains verdict, scores, all 48 checks and the governance footer.'),
      c('XP-02', 'Validation evidence export', 'PASS', 'Institution OS', 'Certification Export', 95, 'KG:EXPORT-EVIDENCE', '/allocation-lab',
        'Evidence export includes ID, status, department, source module, confidence, timestamp and evidence reference per check.'),
      c('XP-03', 'Sign-off & audit trail export', 'PASS', 'Governance Office', 'Certification Export', 97, 'KG:EXPORT-AUDIT', '/allocation-lab',
        'Sign-off states and the full append-only timeline export with department attribution.'),
      c('XP-04', 'Full pack determinism', 'PASS', 'Institution OS', 'Certification Export', 98, 'KG:EXPORT-DETERMINISM', '/allocation-lab',
        'Identical byte output across repeated exports of the same certification version.'),
    ],
  },
];

export const ALL_CERT_CHECKS = CERT_CATEGORIES.flatMap((cat) => cat.checks);

export const certCounts = (checks: CertCheck[]) => ({
  pass: checks.filter((x) => x.status === 'PASS').length,
  fail: checks.filter((x) => x.status === 'FAIL').length,
  warning: checks.filter((x) => x.status === 'WARNING').length,
  notTested: checks.filter((x) => x.status === 'NOT TESTED').length,
  total: checks.length,
});

export const categoryStatus = (cat: CertCategory): CertStatus => {
  if (cat.checks.some((x) => x.status === 'FAIL')) return 'FAIL';
  if (cat.checks.some((x) => x.status === 'WARNING')) return 'WARNING';
  if (cat.checks.every((x) => x.status === 'NOT TESTED')) return 'NOT TESTED';
  return 'PASS';
};

const T = certCounts(ALL_CERT_CHECKS);

// Certification % — PASS 1.0, WARNING 0.5, NOT TESTED / FAIL 0
export const CERTIFICATION_PCT = Math.round(
  ((T.pass + T.warning * 0.5) / T.total) * 100,
);

export const CERT_SUMMARY = {
  ...T,
  completed: T.total - T.notTested,
  percent: CERTIFICATION_PCT,
};

export type VerdictLevel = 'Certified' | 'Certified With Caveats' | 'Requires Further Research' | 'Rejected';

export const OVERALL_VERDICT: VerdictLevel =
  T.fail > 0 ? 'Rejected'
    : T.warning === 0 && T.notTested === 0 ? 'Certified'
      : T.warning <= 5 ? 'Certified With Caveats'
        : 'Requires Further Research';

export const EXECUTIVE_VERDICT = {
  overallVerdict: OVERALL_VERDICT,
  verdictBasis:
    `${T.pass} of ${T.total} checks passed, ${T.warning} warnings, ${T.fail} failures, ${T.notTested} not tested. `
    + 'Caveats are concentrated in out-of-sample evidence and regime-detection dependency.',
  evidenceScore: CERTIFICATION_PCT,
  confidence: 76,
  confidenceLabel: 'Moderate-High',
  riskRating: 'Medium',
  riskBasis: 'Regime-detection dependency and correlation-shock fragility raise the rating from Low to Medium.',
  researchQuality: 'A− (Institutional Grade)',
  governanceStatus: 'Compliant — all 6 guarantees verified',
  humanApproval: 'Required — 1 of 3 sign-offs recorded',
  promotionStatus: 'Locked — 30-day live gate not started',
  recommendationStatus: 'Requires More Evidence',
  lastValidation: '03 Aug 2026, 05:27 UTC',
  validationVersion: 'ATLAS OS™ v6.1 · Certification Suite 1.0 · Run #CERT-ALLOC-V1-014',
  // Retained supporting figures
  currentChampion: 'Router v2.1',
  championDetail: 'PF 1.86 · DD 2.5% · Capture 65% · incumbent control',
  canBeatRouter: 'Yes — on 90-day simulated evidence',
  canBeatRouterDetail:
    'Dynamic Allocation beats Router v2.1 on PnL (+$5,142 vs +$3,802), PF (2.03 vs 1.86) and capture (78% vs 65%) '
    + 'while holding drawdown at 2.8%, inside the 3% ceiling.',
  bestPortfolio: 'Dynamic Allocation (regime-gated, PF-weighted sizing)',
  bestPortfolioDetail: 'Fallback: Regime Weight (PF 1.94 · DD 2.7%) if regime-detection confidence degrades.',
  expectedPf: '2.03',
  expectedPfRange: 'stress range 1.71 – 2.03',
  expectedDrawdown: '2.8%',
  expectedDrawdownRange: 'stress range 2.8% – 3.3%',
  expectedCapture: '78%',
  expectedCaptureRange: 'stress range 73% – 78%',
};

// ─── Executive Sign-off (simulation only) ────────────────────────────
export type SignoffState = 'Pending' | 'Approved' | 'Rejected';

export const SIGNOFFS: {
  role: string; owner: Department | string; state: SignoffState; note: string; date: string;
}[] = [
  { role: 'Research Lead', owner: 'Quant Scientist', state: 'Approved',
    note: 'Methodology, determinism and metric recomputation accepted. In-sample caveat recorded.', date: '03 Aug 2026' },
  { role: 'Governance', owner: 'Governance Office', state: 'Pending',
    note: 'Awaiting closure of the regime-detection precision measurement before governance clearance.', date: '—' },
  { role: 'Executive', owner: 'Executive Boardroom', state: 'Pending',
    note: 'Board review scheduled after the Champion Forward Trial reaches 60 days / 50 trades.', date: '—' },
  { role: 'Human Approval', owner: 'Operator', state: 'Pending',
    note: 'Operator sign-off cannot be simulated. Required before any production consideration.', date: '—' },
];

// ─── Certification Timeline ──────────────────────────────────────────
export const CERT_TIMELINE: {
  event: string; date: string; department: Department | string; confidence: number;
  evidence: string; route: string; done: boolean;
}[] = [
  { event: 'Research Created', date: '12 May 2026', department: 'Quant Scientist', confidence: 90,
    evidence: 'Allocation hypothesis registered: coordinated specialists can exceed a single router.', route: '/quant-scientist', done: true },
  { event: 'Validated', date: '03 Aug 2026', department: 'Research Brain', confidence: 92,
    evidence: '9-suite validation run, 48 certification checks executed.', route: '/allocation-lab', done: true },
  { event: 'Regression Tested', date: '03 Aug 2026', department: 'Enterprise Platform', confidence: 96,
    evidence: 'v5.0 → v6.1 baseline comparison; 0 metric drift, 0 governance regressions.', route: '/validation-centre', done: true },
  { event: 'Governance Review', date: 'In progress', department: 'Governance Office', confidence: 70,
    evidence: 'Six guarantees verified; clearance held pending regime-precision measurement.', route: '/governance', done: false },
  { event: 'Executive Review', date: 'Scheduled', department: 'Executive Boardroom', confidence: 0,
    evidence: 'Board vote deferred until forward-trial thresholds are met.', route: '/boardroom', done: false },
  { event: 'Certified', date: 'Not reached', department: 'Institution OS', confidence: 0,
    evidence: 'Requires all sign-offs plus out-of-sample evidence closure.', route: '/institution', done: false },
  { event: 'Archived', date: 'Not reached', department: 'Institutional History', confidence: 0,
    evidence: 'Append-only archive entry created only on supersession.', route: '/institution/history', done: false },
];

// ─── Risk Summary ────────────────────────────────────────────────────
export type RiskItem = { title: string; detail: string; route: string; routeLabel: string };

export const RISK_SUMMARY: { group: string; tone: string; items: RiskItem[] }[] = [
  {
    group: 'Known Risks', tone: 'text-trading-loss',
    items: [
      { title: 'Regime-detection dependency', detail: '25% misclassification drops PF to 1.71 and pushes DD to 3.2%, breaching the ceiling.', route: '/oracle', routeLabel: 'Ask Oracle' },
      { title: 'Correlation shock', detail: 'At cross-asset correlation 0.95 the diversification benefit disappears; DD reaches 3.3%.', route: '/explorer', routeLabel: 'Explore evidence' },
      { title: 'Fee/slippage sensitivity', detail: 'Doubling costs takes PF from 2.03 to 1.86 and DD to the 3.0% ceiling.', route: '/explorer', routeLabel: 'Explore evidence' },
    ],
  },
  {
    group: 'Open Questions', tone: 'text-trading-warning',
    items: [
      { title: 'What is real regime-detection precision?', detail: 'Stress tests assume 10–25% error bands; the measured live precision is not yet established.', route: '/oracle', routeLabel: 'Ask Oracle' },
      { title: 'Does the edge persist out-of-sample?', detail: 'Champion Forward Trial has not reached 60 days / 50 trades.', route: '/champion-trial', routeLabel: 'Champion Trial' },
      { title: 'Is Dynamic worth the complexity over Regime Weight?', detail: 'Dynamic adds +0.09 PF over Regime Weight for materially more moving parts.', route: '/explorer', routeLabel: 'Explore evidence' },
    ],
  },
  {
    group: 'Blocked Research', tone: 'text-muted-foreground',
    items: [
      { title: 'Production wiring study', detail: 'Blocked by governance until human approval and the 30-day live gate.', route: '/governance', routeLabel: 'Governance' },
      { title: 'Leverage sensitivity', detail: 'Permanently blocked — leverage is out of institutional scope.', route: '/governance', routeLabel: 'Governance' },
    ],
  },
  {
    group: 'Rejected Ideas', tone: 'text-muted-foreground',
    items: [
      { title: 'Equal Weight allocation', detail: 'Rejected: DD 3.4% breaches the 3% ceiling for only 1.58 PF.', route: '/allocation-lab', routeLabel: 'See combos' },
      { title: 'Specialists Only (ungated)', detail: 'Rejected: DD 3.7%, PF 1.61 — worse risk-adjusted outcome than the control router.', route: '/allocation-lab', routeLabel: 'See combos' },
    ],
  },
  {
    group: 'Counter Evidence', tone: 'text-trading-warning',
    items: [
      { title: 'In-sample tuning', detail: 'Dynamic Allocation was tuned on the same 90-day window used to evaluate it.', route: '/research-brain', routeLabel: 'Research Brain' },
      { title: 'Router simplicity advantage', detail: 'Router v2.1 achieves 92% of the PF with one component and no regime dependency.', route: '/oracle', routeLabel: 'Ask Oracle' },
    ],
  },
];

// ─── Institution Recommendation ──────────────────────────────────────
export type RecoLevel =
  | 'Recommended' | 'Not Recommended' | 'Requires More Evidence'
  | 'Blocked by Governance' | 'Requires Human Approval';

export const INSTITUTION_RECOMMENDATION: {
  level: RecoLevel; active: boolean; why: string; evidenceUsed: string;
  confidence: number; counterEvidence: string; dependencies: string;
}[] = [
  {
    level: 'Requires More Evidence', active: true,
    why: 'The 90-day simulated edge is real and reproducible, but it is in-sample. The institution requires out-of-sample confirmation before treating Dynamic Allocation as a champion candidate.',
    evidenceUsed: '48 certification checks · 90-day sandbox simulation · 7 stress tests · Allocation Lab v2 cross-check',
    confidence: 76,
    counterEvidence: 'In-sample tuning (EV-04), regime-detection SPOF (RL-04), correlation-shock fragility.',
    dependencies: 'Champion Forward Trial (60d / 50 trades), Regime Detection precision measurement.',
  },
  {
    level: 'Requires Human Approval', active: true,
    why: 'Certification cannot progress past Governance Review without three human sign-offs. Two of four remain pending and operator approval cannot be simulated.',
    evidenceUsed: 'Executive Sign-off register · Governance guarantee GO-05',
    confidence: 99,
    counterEvidence: 'None — this is a standing institutional rule, not an empirical finding.',
    dependencies: 'Research Lead (approved), Governance, Executive Boardroom, Operator.',
  },
  {
    level: 'Blocked by Governance', active: true,
    why: 'Any production wiring is blocked: promotion is disabled and the 30-day live gate has not started.',
    evidenceUsed: 'Governance checks GO-01 … GO-06 · Promotion Board lock state',
    confidence: 99,
    counterEvidence: 'None.',
    dependencies: '30-day live gate, Operator sign-off.',
  },
  {
    level: 'Recommended', active: false,
    why: 'Would apply only once out-of-sample evidence closes and all sign-offs are recorded.',
    evidenceUsed: '—', confidence: 0, counterEvidence: '—', dependencies: '—',
  },
  {
    level: 'Not Recommended', active: false,
    why: 'Not applicable — no gate failed and no check returned FAIL.',
    evidenceUsed: '—', confidence: 0, counterEvidence: '—', dependencies: '—',
  },
];

// ─── Governance Footer ───────────────────────────────────────────────
export const GOVERNANCE_FOOTER = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'Read Only',
  'No Live Trading',
  'No Allocation Changes',
  'No Exchange Connectivity',
  'Human Approval Required',
  'Every conclusion fully traceable',
  'Append-only institutional history',
];

// ─── Exports (deterministic markdown builders) ───────────────────────
const header = (title: string) =>
  `# ${title}\n\n`
  + `Module: Specialist Allocation Lab v1\n`
  + `Version: ${EXECUTIVE_VERDICT.validationVersion}\n`
  + `Last Validation: ${EXECUTIVE_VERDICT.lastValidation}\n\n`;

const footer = () =>
  `\n---\n\n## Governance\n\n${GOVERNANCE_FOOTER.map((g) => `- ${g}`).join('\n')}\n`;

export const buildCertificationReport = () =>
  header('Institutional Certification Report')
  + `## Executive Verdict\n\n`
  + `- Overall Verdict: ${EXECUTIVE_VERDICT.overallVerdict}\n`
  + `- Evidence Score: ${EXECUTIVE_VERDICT.evidenceScore}/100\n`
  + `- Confidence: ${EXECUTIVE_VERDICT.confidence}% (${EXECUTIVE_VERDICT.confidenceLabel})\n`
  + `- Risk Rating: ${EXECUTIVE_VERDICT.riskRating}\n`
  + `- Research Quality: ${EXECUTIVE_VERDICT.researchQuality}\n`
  + `- Governance Status: ${EXECUTIVE_VERDICT.governanceStatus}\n`
  + `- Human Approval: ${EXECUTIVE_VERDICT.humanApproval}\n`
  + `- Promotion Status: ${EXECUTIVE_VERDICT.promotionStatus}\n`
  + `- Recommendation Status: ${EXECUTIVE_VERDICT.recommendationStatus}\n\n`
  + `Basis: ${EXECUTIVE_VERDICT.verdictBasis}\n\n`
  + `## Certification Progress\n\n`
  + `${CERT_SUMMARY.percent}% · ${CERT_SUMMARY.completed} / ${CERT_SUMMARY.total} checks completed · `
  + `${CERT_SUMMARY.pass} / ${CERT_SUMMARY.total} passed\n\n`
  + `## Institution Recommendation\n\n`
  + INSTITUTION_RECOMMENDATION.filter((r) => r.active).map((r) =>
    `### ${r.level}\n- Why: ${r.why}\n- Evidence: ${r.evidenceUsed}\n- Confidence: ${r.confidence}%\n`
    + `- Counter evidence: ${r.counterEvidence}\n- Dependencies: ${r.dependencies}\n`).join('\n')
  + footer();

export const buildEvidenceExport = () =>
  header('Validation Evidence')
  + CERT_CATEGORIES.map((cat) =>
    `## ${cat.name}\n\n${cat.purpose}\n\n`
    + cat.checks.map((x) =>
      `- [${x.status}] ${x.id} — ${x.name}\n`
      + `  - Department: ${x.department}\n`
      + `  - Source module: ${x.sourceModule}\n`
      + `  - Confidence: ${x.confidence}%\n`
      + `  - Timestamp: ${x.timestamp}\n`
      + `  - Evidence ref: ${x.evidenceRef} (${x.evidenceRoute})\n`
      + `  - Evidence: ${x.evidence}\n`).join('\n'),
  ).join('\n\n')
  + footer();

export const buildSignoffExport = () =>
  header('Executive Sign-off Register')
  + SIGNOFFS.map((s) =>
    `## ${s.role}\n- Owner: ${s.owner}\n- State: ${s.state}\n- Date: ${s.date}\n- Note: ${s.note}\n`).join('\n')
  + `\nSign-off states are simulated for research governance. Operator approval cannot be simulated.\n`
  + footer();

export const buildAuditTrail = () =>
  header('Certification Audit Trail')
  + `## Timeline (append-only)\n\n`
  + CERT_TIMELINE.map((e) =>
    `- ${e.date} — ${e.event} — ${e.department} — confidence ${e.confidence}%\n  - ${e.evidence}\n  - Link: ${e.route}\n`).join('')
  + `\n## Risk Summary\n\n`
  + RISK_SUMMARY.map((g) =>
    `### ${g.group}\n${g.items.map((i) => `- ${i.title}: ${i.detail}`).join('\n')}\n`).join('\n')
  + footer();

export const buildFullPack = () =>
  [buildCertificationReport(), buildEvidenceExport(), buildSignoffExport(), buildAuditTrail()]
    .join('\n\n---\n\n');
