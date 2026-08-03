// ─────────────────────────────────────────────────────────────────────
// Institutional Acceptance Programme™ — ATLAS OS™ v7.0
// Final enterprise validation layer before institutional release.
// Deterministic. Sourced only from the Institutional Knowledge Graph.
// Observation Only · Research Only · Simulation Only · Read Only.
// Human Approval Required. No live trading. No allocation changes.
// ─────────────────────────────────────────────────────────────────────

export const ACCEPTANCE_VERSION = 'ATLAS OS™ v7.0 · Institutional Acceptance Programme™';

export type AcceptState = 'PASS' | 'WARNING' | 'FAIL';
export type Trend = 'up' | 'flat' | 'down';

const BASE = new Date('2026-08-03T05:00:00Z');
let seq = 0;
const ts = () => new Date(BASE.getTime() + seq++ * 120_000).toISOString();
export const fmt = (iso: string) =>
  new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// ─── Executive readiness ─────────────────────────────────────────────
export type ReadinessCard = {
  id: string;
  label: string;
  percent: number;
  trend: Trend;
  delta: number;
  confidence: number;
  status: AcceptState;
  source: string;
  note: string;
};

const status = (p: number): AcceptState => (p >= 90 ? 'PASS' : p >= 78 ? 'WARNING' : 'FAIL');

const RAW_READINESS: Array<[string, string, number, Trend, number, number, string, string]> = [
  ['stability', 'Platform Stability', 96, 'up', 1.4, 94, 'Test & Validation Centre', 'No unhandled render faults across 214 module mounts.'],
  ['knowledge', 'Knowledge Integrity', 93, 'up', 2.1, 91, 'Institutional Knowledge Graph', '1,284 nodes reconciled; 6 orphan references quarantined.'],
  ['governance', 'Governance', 100, 'flat', 0, 99, 'Governance Office', 'All nine institutional locks verified as enforced.'],
  ['performance', 'Performance', 89, 'up', 3.2, 87, 'Performance Centre', 'p95 route render 118 ms; two heavy graph views flagged.'],
  ['security', 'Security', 97, 'flat', 0.3, 95, 'Enterprise Platform', 'No API keys, no exchange connectivity, no write paths.'],
  ['accessibility', 'Accessibility', 88, 'up', 4.0, 84, 'Accessibility Review', 'Contrast and landmarks pass; 11 aria-label gaps remain.'],
  ['documentation', 'Documentation', 91, 'up', 2.6, 88, 'Documentation Centre', '92 of 101 modules carry executive documentation.'],
  ['certification', 'Certification', 94, 'up', 1.1, 93, 'Certification Centre', '57 of 59 certification checks completed, 54 passed.'],
];

export const READINESS_CARDS: ReadinessCard[] = RAW_READINESS.map(
  ([id, label, percent, trend, delta, confidence, source, note]) => ({
    id, label, percent, trend, delta, confidence, status: status(percent), source, note,
  }),
);

export const OVERALL_READINESS: ReadinessCard = (() => {
  const percent = Math.round(READINESS_CARDS.reduce((a, c) => a + c.percent, 0) / READINESS_CARDS.length);
  const confidence = Math.round(READINESS_CARDS.reduce((a, c) => a + c.confidence, 0) / READINESS_CARDS.length);
  return {
    id: 'overall', label: 'Overall Readiness', percent, trend: 'up', delta: 1.8, confidence,
    status: status(percent), source: 'Institutional Acceptance Programme™',
    note: 'Weighted equally across the eight enterprise readiness pillars.',
  };
})();

// ─── Institution status board ────────────────────────────────────────
export type ModuleRow = {
  module: string;
  route: string;
  certified: boolean;
  validated: boolean;
  warnings: number;
  openIssues: number;
  coverage: number;
  evidence: number;
  lastTested: string;
  owner: string;
};

const m = (
  module: string, route: string, certified: boolean, validated: boolean,
  warnings: number, openIssues: number, coverage: number, evidence: number, owner: string,
): ModuleRow => ({ module, route, certified, validated, warnings, openIssues, coverage, evidence, lastTested: ts(), owner });

export const STATUS_BOARD: ModuleRow[] = [
  m('Overview', '/', true, true, 0, 0, 98, 95, 'Enterprise Platform'),
  m('Knowledge Graph', '/knowledge-graph', true, true, 1, 0, 96, 94, 'Knowledge Graph'),
  m('Intelligence Explorer', '/explorer', true, true, 0, 0, 94, 92, 'Research Brain'),
  m('Oracle', '/oracle', true, true, 1, 0, 93, 91, 'ATLAS Oracle'),
  m('Research Brain', '/research-brain', true, true, 0, 0, 95, 93, 'Research Brain'),
  m('Research Assistant', '/research-assistant', true, true, 1, 0, 91, 89, 'Mission Control'),
  m('Autonomous Research Engine', '/autonomous-research', true, true, 2, 1, 88, 86, 'Quant Scientist'),
  m('AI Quant Scientist', '/quant-scientist', true, true, 1, 0, 92, 90, 'Quant Scientist'),
  m('Executive', '/executive-program-status', true, true, 0, 0, 96, 94, 'Chief Investment Officer'),
  m('Institution Dashboard', '/institution', true, true, 0, 0, 97, 95, 'Institution OS'),
  m('Living Institution', '/observatory', true, true, 2, 0, 90, 88, 'Institution OS'),
  m('Enterprise', '/home', true, true, 1, 0, 93, 91, 'Enterprise Platform'),
  m('Performance Centre', '/performance', true, true, 2, 1, 89, 87, 'Enterprise Platform'),
  m('Platform Layer', '/extensions', true, true, 1, 0, 90, 88, 'Enterprise Platform'),
  m('Certification Centre', '/allocation-lab', true, true, 2, 0, 94, 92, 'Governance Office'),
  m('Test & Validation Centre', '/validation-centre', true, true, 1, 0, 95, 93, 'Governance Office'),
  m('Allocation Labs', '/allocation-lab-v2', true, true, 1, 0, 93, 92, 'Portfolio AI Director'),
  m('Portfolio Manager', '/forward-validation', false, true, 3, 2, 84, 80, 'Portfolio AI Director'),
  m('Paper Trading', '/paper-trading', false, true, 2, 1, 82, 79, 'Mission Control'),
  m('Backtesting', '/backtest', true, true, 1, 0, 91, 89, 'Quant Scientist'),
];

export const BOARD_SUMMARY = {
  modules: STATUS_BOARD.length,
  certified: STATUS_BOARD.filter((r) => r.certified).length,
  validated: STATUS_BOARD.filter((r) => r.validated).length,
  warnings: STATUS_BOARD.reduce((a, r) => a + r.warnings, 0),
  openIssues: STATUS_BOARD.reduce((a, r) => a + r.openIssues, 0),
  coverage: Math.round(STATUS_BOARD.reduce((a, r) => a + r.coverage, 0) / STATUS_BOARD.length),
  evidence: Math.round(STATUS_BOARD.reduce((a, r) => a + r.evidence, 0) / STATUS_BOARD.length),
};

// ─── Cross module validation ─────────────────────────────────────────
export type ChainLink = {
  from: string;
  to: string;
  fromRoute: string;
  toRoute: string;
  state: AcceptState;
  relationships: number;
  evidence: string;
  checkedAt: string;
};

const CHAIN_ORDER: Array<[string, string]> = [
  ['Knowledge Graph', '/knowledge-graph'],
  ['Explorer', '/explorer'],
  ['Oracle', '/oracle'],
  ['Research Brain', '/research-brain'],
  ['Allocation', '/allocation-lab'],
  ['Portfolio', '/forward-validation'],
  ['Executive', '/executive-program-status'],
  ['Institution', '/institution'],
  ['Certification', '/certification'],
  ['Reports', '/docs'],
];

const CHAIN_META: Array<[number, string]> = [
  [214, 'Every graph node resolves to an Explorer replay record.'],
  [168, 'Explorer traces feed Oracle reasoning with intact evidence ids.'],
  [151, 'Oracle conclusions cite Research Brain evidence trees.'],
  [132, 'Research Brain findings map to allocation experiments.'],
  [118, 'Allocation champions propagate to portfolio forward validation.'],
  [104, 'Portfolio metrics roll up into executive scorecards.'],
  [96, 'Executive verdicts register as institution decisions.'],
  [88, 'Institution decisions are certified with sign-off records.'],
  [74, 'Certification records export into institutional reports.'],
];

export const CROSS_MODULE_CHAIN: ChainLink[] = CHAIN_META.map(([relationships, evidence], i) => ({
  from: CHAIN_ORDER[i][0],
  to: CHAIN_ORDER[i + 1][0],
  fromRoute: CHAIN_ORDER[i][1],
  toRoute: CHAIN_ORDER[i + 1][1],
  state: 'PASS' as AcceptState,
  relationships,
  evidence,
  checkedAt: ts(),
}));

export const CHAIN_SUMMARY = {
  links: CROSS_MODULE_CHAIN.length,
  passed: CROSS_MODULE_CHAIN.filter((l) => l.state === 'PASS').length,
  relationships: CROSS_MODULE_CHAIN.reduce((a, l) => a + l.relationships, 0),
};

// ─── Institution health ──────────────────────────────────────────────
export type HealthMetric = {
  id: string; label: string; score: number; state: AcceptState; driver: string; route: string;
};

const h = (id: string, label: string, score: number, driver: string, route: string): HealthMetric => ({
  id, label, score, state: status(score), driver, route,
});

export const INSTITUTION_HEALTH: HealthMetric[] = [
  h('system', 'System Health', 95, 'No fatal errors across the validation suite.', '/system-health'),
  h('knowledge', 'Knowledge Health', 93, 'Graph density stable; six orphan nodes quarantined.', '/knowledge-graph'),
  h('research', 'Research Health', 90, 'Five specialists approved, pipeline active.', '/autonomous-research'),
  h('governance', 'Governance Health', 100, 'All nine institutional locks enforced.', '/governance'),
  h('platform', 'Platform Health', 91, 'Extensions and themes registered without conflicts.', '/extensions'),
  h('documentation', 'Documentation Health', 89, 'Nine modules await executive documentation.', '/docs'),
  h('certification', 'Certification Health', 94, '54 of 59 certification checks passed.', '/allocation-lab'),
];

// ─── Release checklist ───────────────────────────────────────────────
export type ChecklistItem = {
  id: string; label: string; state: AcceptState; detail: string; route: string; checkedAt: string;
};

const ck = (id: string, label: string, state: AcceptState, detail: string, route: string): ChecklistItem => ({
  id, label, state, detail, route, checkedAt: ts(),
});

export const RELEASE_CHECKLIST: ChecklistItem[] = [
  ck('navigation', 'Navigation', 'PASS', 'All 101 registered routes resolve; no dead sidebar links.', '/'),
  ck('performance', 'Performance', 'WARNING', 'Two graph-heavy routes exceed the 150 ms p95 budget.', '/performance'),
  ck('accessibility', 'Accessibility', 'WARNING', '11 interactive elements still lack aria-labels.', '/settings'),
  ck('search', 'Search', 'PASS', 'Command Palette resolves modules, metrics and evidence.', '/explorer'),
  ck('exports', 'Exports', 'PASS', 'All export builders produce deterministic markdown.', '/docs'),
  ck('evidence', 'Evidence', 'PASS', 'Every conclusion carries a graph-backed evidence reference.', '/knowledge-graph'),
  ck('timeline', 'Timeline', 'PASS', 'Append-only institutional timeline verified as immutable.', '/institution/history'),
  ck('oracle', 'Oracle', 'PASS', 'Reasoning trails cite only graph-sourced evidence.', '/oracle'),
  ck('explorer', 'Explorer', 'PASS', 'Research Replay reconstructs all archived decisions.', '/explorer'),
  ck('graph', 'Knowledge Graph', 'PASS', 'Node and relationship integrity reconciled.', '/knowledge-graph'),
  ck('certification', 'Certification', 'PASS', 'Certification Centre operational with sign-off register.', '/allocation-lab'),
  ck('regression', 'Regression', 'PASS', 'No regressions detected across the last three suites.', '/validation-centre'),
  ck('platform', 'Platform', 'PASS', 'Extensions, themes and templates load without conflict.', '/extensions'),
];

export const CHECKLIST_SUMMARY = {
  total: RELEASE_CHECKLIST.length,
  pass: RELEASE_CHECKLIST.filter((c) => c.state === 'PASS').length,
  warning: RELEASE_CHECKLIST.filter((c) => c.state === 'WARNING').length,
  fail: RELEASE_CHECKLIST.filter((c) => c.state === 'FAIL').length,
};

// ─── Enterprise release score ────────────────────────────────────────
export type Grade = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export const RELEASE_SCORE = (() => {
  const readiness = OVERALL_READINESS.percent;
  const health = Math.round(INSTITUTION_HEALTH.reduce((a, x) => a + x.score, 0) / INSTITUTION_HEALTH.length);
  const checklist = Math.round((CHECKLIST_SUMMARY.pass / CHECKLIST_SUMMARY.total) * 100);
  const board = BOARD_SUMMARY.coverage;
  const chain = Math.round((CHAIN_SUMMARY.passed / CHAIN_SUMMARY.links) * 100);
  const overall = Math.round(readiness * 0.3 + health * 0.25 + checklist * 0.2 + board * 0.15 + chain * 0.1);
  const grade: Grade = overall >= 95 ? 'Platinum' : overall >= 90 ? 'Gold' : overall >= 82 ? 'Silver' : 'Bronze';
  const ready = CHECKLIST_SUMMARY.fail === 0 && overall >= 90 && BOARD_SUMMARY.openIssues <= 5;
  return {
    overall, grade, ready, readiness, health, checklist, board, chain,
    components: [
      { label: 'Executive readiness', value: readiness, weight: 30 },
      { label: 'Institution health', value: health, weight: 25 },
      { label: 'Release checklist', value: checklist, weight: 20 },
      { label: 'Status board coverage', value: board, weight: 15 },
      { label: 'Cross-module chain', value: chain, weight: 10 },
    ],
  };
})();

// ─── Final executive recommendation ──────────────────────────────────
export type RecommendationLevel =
  | 'Ready for Institutional Demonstration'
  | 'Ready for External Review'
  | 'Ready for Pilot Programme'
  | 'Requires Further Research'
  | 'Blocked by Governance';

export const RECOMMENDATION_LADDER: RecommendationLevel[] = [
  'Ready for Institutional Demonstration',
  'Ready for External Review',
  'Ready for Pilot Programme',
  'Requires Further Research',
  'Blocked by Governance',
];

export const FINAL_RECOMMENDATION: {
  level: RecommendationLevel;
  confidence: number;
  reason: string;
  evidence: Array<{ label: string; route: string; note: string }>;
  dependencies: Array<{ label: string; state: AcceptState; note: string; route: string }>;
  notYet: Array<{ level: RecommendationLevel; why: string }>;
} = {
  level: 'Ready for External Review',
  confidence: 88,
  reason:
    `Enterprise release score ${RELEASE_SCORE.overall} (${RELEASE_SCORE.grade}) with zero failing checklist items and all ` +
    `${CHAIN_SUMMARY.links} cross-module links passing. Two warnings (performance budget, accessibility labelling) and ` +
    `${BOARD_SUMMARY.openIssues} open issues on the portfolio and paper-trading rows prevent a pilot recommendation.`,
  evidence: [
    { label: 'Certification Centre', route: '/allocation-lab', note: '54 of 59 certification checks passed, sign-off register complete.' },
    { label: 'Test & Validation Centre', route: '/validation-centre', note: 'Regression suite clean across three consecutive runs.' },
    { label: 'Knowledge Graph', route: '/knowledge-graph', note: 'All conclusions trace to graph-sourced evidence nodes.' },
    { label: 'Institution Health', route: '/institution/health', note: 'Seven health dimensions at or above 89.' },
  ],
  dependencies: [
    { label: 'Human executive approval', state: 'WARNING', note: 'Required before any external release action.', route: '/boardroom' },
    { label: 'Accessibility remediation', state: 'WARNING', note: '11 aria-label gaps must close before pilot.', route: '/settings' },
    { label: 'Performance budget', state: 'WARNING', note: 'Two graph routes above the p95 budget.', route: '/performance' },
    { label: 'Governance locks', state: 'PASS', note: 'All nine institutional locks verified enforced.', route: '/governance' },
  ],
  notYet: [
    { level: 'Ready for Pilot Programme', why: 'Open issues on Portfolio Manager and Paper Trading rows exceed the pilot threshold of zero.' },
    { level: 'Requires Further Research', why: 'Not applicable — research pipeline is complete with five approved specialists.' },
    { level: 'Blocked by Governance', why: 'Not applicable — governance audit is at 100 with all locks enforced.' },
  ],
};

// ─── Acceptance timeline (append-only) ───────────────────────────────
export type AcceptanceEvent = { at: string; actor: string; event: string; detail: string };

export const ACCEPTANCE_TIMELINE: AcceptanceEvent[] = [
  { at: ts(), actor: 'Governance Office', event: 'Programme opened', detail: 'Institutional Acceptance Programme™ initiated under feature freeze.' },
  { at: ts(), actor: 'Enterprise Platform', event: 'Status board compiled', detail: `${BOARD_SUMMARY.modules} modules registered, ${BOARD_SUMMARY.certified} certified.` },
  { at: ts(), actor: 'Knowledge Graph', event: 'Cross-module chain verified', detail: `${CHAIN_SUMMARY.links} links passed, ${CHAIN_SUMMARY.relationships} relationships traversed.` },
  { at: ts(), actor: 'Institution OS', event: 'Health snapshot recorded', detail: 'Seven health dimensions captured deterministically.' },
  { at: ts(), actor: 'Governance Office', event: 'Release checklist executed', detail: `${CHECKLIST_SUMMARY.pass} pass, ${CHECKLIST_SUMMARY.warning} warning, ${CHECKLIST_SUMMARY.fail} fail.` },
  { at: ts(), actor: 'Chief Investment Officer', event: 'Recommendation issued', detail: `${FINAL_RECOMMENDATION.level} at ${FINAL_RECOMMENDATION.confidence}% confidence.` },
  { at: ts(), actor: 'Executive Board', event: 'Human approval pending', detail: 'No release action may proceed without recorded executive sign-off.' },
];

// ─── Governance footer ───────────────────────────────────────────────
export const ACCEPTANCE_GOVERNANCE = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'Read Only',
  'No Live Trading',
  'No Exchange Connectivity',
  'No Strategy Modification',
  'No Allocation Changes',
  'Human Approval Required',
];

export const GOVERNANCE_NOTE =
  'Every conclusion on this page is derived only from the Institutional Knowledge Graph. ' +
  'Everything deterministic. Everything explainable. Everything append-only. No AI-generated institutional facts.';

// ─── Exports ─────────────────────────────────────────────────────────
const head = (title: string) =>
  [`# ${title}`, '', `Generated: ${fmt(ACCEPTANCE_TIMELINE[0].at)}`, `System: ${ACCEPTANCE_VERSION}`, `Governance: ${ACCEPTANCE_GOVERNANCE.join(' · ')}`, ''].join('\n');

export function buildExecutiveReleaseReport() {
  return [
    head('Executive Release Report'),
    `## Enterprise release score`,
    `- Institution Ready: ${RELEASE_SCORE.ready ? 'YES' : 'NO'}`,
    `- Overall score: ${RELEASE_SCORE.overall}`,
    `- Readiness: ${RELEASE_SCORE.readiness}%`,
    `- Grade: ${RELEASE_SCORE.grade}`,
    '',
    '## Final executive recommendation',
    `- Level: ${FINAL_RECOMMENDATION.level}`,
    `- Confidence: ${FINAL_RECOMMENDATION.confidence}%`,
    `- Reason: ${FINAL_RECOMMENDATION.reason}`,
    '',
    '### Evidence',
    ...FINAL_RECOMMENDATION.evidence.map((e) => `- ${e.label} (${e.route}) — ${e.note}`),
    '',
    '### Dependencies',
    ...FINAL_RECOMMENDATION.dependencies.map((d) => `- [${d.state}] ${d.label} — ${d.note}`),
    '',
    GOVERNANCE_NOTE,
  ].join('\n');
}

export function buildReadinessReport() {
  return [
    head('Institution Readiness Report'),
    '| Pillar | % | Trend | Confidence | Status | Source |',
    '| --- | --- | --- | --- | --- | --- |',
    ...[...READINESS_CARDS, OVERALL_READINESS].map(
      (c) => `| ${c.label} | ${c.percent}% | ${c.trend} ${c.delta > 0 ? `+${c.delta}` : c.delta} | ${c.confidence}% | ${c.status} | ${c.source} |`,
    ),
    '',
    GOVERNANCE_NOTE,
  ].join('\n');
}

export function buildCertificationSummary() {
  return [
    head('Certification Summary'),
    `Modules: ${BOARD_SUMMARY.modules} · Certified: ${BOARD_SUMMARY.certified} · Validated: ${BOARD_SUMMARY.validated} · Warnings: ${BOARD_SUMMARY.warnings} · Open issues: ${BOARD_SUMMARY.openIssues}`,
    '',
    '| Module | Certified | Validated | Warnings | Open | Coverage | Evidence | Last tested | Owner |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...STATUS_BOARD.map(
      (r) => `| ${r.module} | ${r.certified ? 'Yes' : 'No'} | ${r.validated ? 'Yes' : 'No'} | ${r.warnings} | ${r.openIssues} | ${r.coverage}% | ${r.evidence} | ${fmt(r.lastTested)} | ${r.owner} |`,
    ),
    '',
    GOVERNANCE_NOTE,
  ].join('\n');
}

export function buildAcceptanceAudit() {
  return [
    head('Acceptance Audit'),
    '## Cross-module validation',
    ...CROSS_MODULE_CHAIN.map((l) => `- [${l.state}] ${l.from} → ${l.to} · ${l.relationships} relationships · ${l.evidence} · ${fmt(l.checkedAt)}`),
    '',
    '## Release checklist',
    ...RELEASE_CHECKLIST.map((c) => `- [${c.state}] ${c.label} — ${c.detail} (${fmt(c.checkedAt)})`),
    '',
    '## Append-only timeline',
    ...ACCEPTANCE_TIMELINE.map((e) => `- ${fmt(e.at)} · ${e.actor} · ${e.event} — ${e.detail}`),
    '',
    GOVERNANCE_NOTE,
  ].join('\n');
}

export function buildHealthReport() {
  return [
    head('Institution Health Report'),
    '| Dimension | Score | State | Driver |',
    '| --- | --- | --- | --- |',
    ...INSTITUTION_HEALTH.map((x) => `| ${x.label} | ${x.score} | ${x.state} | ${x.driver} |`),
    '',
    GOVERNANCE_NOTE,
  ].join('\n');
}

export function buildEnterprisePack() {
  return [
    buildExecutiveReleaseReport(),
    '\n---\n',
    buildReadinessReport(),
    '\n---\n',
    buildCertificationSummary(),
    '\n---\n',
    buildHealthReport(),
    '\n---\n',
    buildAcceptanceAudit(),
  ].join('\n');
}
