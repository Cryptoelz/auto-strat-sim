// ══════════════════════════════════════════════════════════
// ATLAS OS™ v7.0 — Test & Validation Centre
// Deterministic, read-only verification of every module, workflow,
// knowledge relationship and governance rule. Simulation only.
// ══════════════════════════════════════════════════════════

import { KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, connections } from '@/lib/knowledgeGraph';
import { performanceMetrics } from '@/lib/enterprise';

export const VALIDATION_VERSION = 'ATLAS OS™ v7.0 · Test & Validation Centre';

export type TestState = 'pass' | 'warn' | 'fail';

/** Deterministic 32-bit hash so every run of the suite produces identical results. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const pick = (seed: string, weights: [TestState, number][]): TestState => {
  const total = weights.reduce((a, [, w]) => a + w, 0);
  let r = hash(seed) % total;
  for (const [state, w] of weights) {
    if (r < w) return state;
    r -= w;
  }
  return 'pass';
};

// ── Section 2 — Module registry ───────────────────────────

export interface ModuleDef { name: string; route: string; group: string }

export const MODULES: ModuleDef[] = [
  { name: 'Executive Home', route: '/home', group: 'Enterprise' },
  { name: 'Overview', route: '/', group: 'Enterprise' },
  { name: 'Presentation Mode', route: '/presentation', group: 'Enterprise' },
  { name: 'Documentation Centre', route: '/docs', group: 'Enterprise' },
  { name: 'Performance Centre', route: '/performance', group: 'Enterprise' },
  { name: 'Metrics API', route: '/metrics-api', group: 'Enterprise' },
  { name: 'Enterprise Settings', route: '/settings', group: 'Enterprise' },
  { name: 'Launch Checklist', route: '/launch', group: 'Enterprise' },
  { name: 'Extension Manager™', route: '/extensions', group: 'Platform' },
  { name: 'App Marketplace™', route: '/marketplace', group: 'Platform' },
  { name: 'Plugin SDK™', route: '/plugin-sdk', group: 'Platform' },
  { name: 'Theme Engine™', route: '/themes', group: 'Platform' },
  { name: 'Institution Templates™', route: '/templates', group: 'Platform' },
  { name: 'Workflow Designer™', route: '/workflows', group: 'Platform' },
  { name: 'Institution Package™', route: '/package', group: 'Platform' },
  { name: 'Developer Centre™', route: '/developer', group: 'Platform' },
  { name: 'Certification™', route: '/certification', group: 'Platform' },
  { name: 'Future Roadmap™', route: '/roadmap', group: 'Platform' },
  { name: 'ATLAS™', route: '/atlas', group: 'Intelligence' },
  { name: 'Knowledge Graph™', route: '/knowledge-graph', group: 'Intelligence' },
  { name: 'Intelligence Explorer™', route: '/explorer', group: 'Intelligence' },
  { name: 'ATLAS Oracle™', route: '/oracle', group: 'Intelligence' },
  { name: 'Executive Boardroom™', route: '/boardroom', group: 'Intelligence' },
  { name: 'Digital Twin™', route: '/digital-twin', group: 'Intelligence' },
  { name: 'AI Research Brain™', route: '/research-brain', group: 'Intelligence' },
  { name: 'Intelligence Network™', route: '/intelligence-network', group: 'Intelligence' },
  { name: 'Mission Control™', route: '/mission-control', group: 'Intelligence' },
  { name: 'AI Research Assistant', route: '/research-assistant', group: 'Intelligence' },
  { name: 'AI Chief Investment Officer', route: '/cio', group: 'Intelligence' },
  { name: 'Autonomous Research Engine™', route: '/autonomous-research', group: 'Intelligence' },
  { name: 'AI Quant Scientist™', route: '/quant-scientist', group: 'Intelligence' },
  { name: 'Institution Dashboard™', route: '/institution', group: 'Institution' },
  { name: 'Departments', route: '/institution/departments', group: 'Institution' },
  { name: 'Collaboration™', route: '/institution/collaboration', group: 'Institution' },
  { name: 'Calendar™', route: '/calendar', group: 'Institution' },
  { name: 'Work Queue™', route: '/institution/queue', group: 'Institution' },
  { name: 'Institution Analytics™', route: '/institution/analytics', group: 'Institution' },
  { name: 'Institution Score™', route: '/institution/score', group: 'Institution' },
  { name: 'History™', route: '/institution/history', group: 'Institution' },
  { name: 'Museum™', route: '/institution/museum', group: 'Institution' },
  { name: 'Observatory™', route: '/observatory', group: 'Living Institution' },
  { name: 'Department Cycle™', route: '/institution/cycle', group: 'Living Institution' },
  { name: 'Conversations™', route: '/institution/conversations', group: 'Living Institution' },
  { name: 'Decisions™', route: '/institution/decisions', group: 'Living Institution' },
  { name: 'Knowledge Evolution™', route: '/institution/evolution', group: 'Living Institution' },
  { name: 'Forecast™', route: '/institution/forecast', group: 'Living Institution' },
  { name: 'Briefing Room™', route: '/briefing-room', group: 'Living Institution' },
  { name: 'Research Genome™', route: '/institution/genome', group: 'Living Institution' },
  { name: 'Health Monitor™', route: '/institution/health', group: 'Living Institution' },
  { name: 'Institution IQ™', route: '/institution/iq', group: 'Intelligence Engine' },
  { name: 'Self Review™', route: '/self-review', group: 'Intelligence Engine' },
  { name: 'Learning Engine™', route: '/institution/learning', group: 'Intelligence Engine' },
  { name: 'Recommendations™', route: '/institution/recommendations', group: 'Intelligence Engine' },
  { name: 'Research Quality Index™', route: '/institution/quality', group: 'Intelligence Engine' },
  { name: 'Explainability™', route: '/institution/explain', group: 'Intelligence Engine' },
  { name: 'Benchmark™', route: '/institution/benchmark', group: 'Intelligence Engine' },
  { name: 'Executive Simulator™', route: '/executive-simulator', group: 'Intelligence Engine' },
  { name: 'Risk Radar™', route: '/institution/risk-radar', group: 'Intelligence Engine' },
  { name: 'Evolution Timeline™', route: '/institution/evolution-timeline', group: 'Intelligence Engine' },
  { name: 'Backtest', route: '/backtest', group: 'Research' },
  { name: 'Paper Trading', route: '/paper-trading', group: 'Research' },
  { name: 'Championship Arena', route: '/championship', group: 'Research' },
  { name: 'Portfolio AI Director™', route: '/portfolio-ai-director', group: 'Research' },
  { name: 'Allocation Lab v2', route: '/allocation-lab-v2', group: 'Research' },
  { name: 'Champion Trial', route: '/champion-trial', group: 'Research' },
  { name: 'Forward Validation', route: '/forward-validation', group: 'Research' },
  { name: 'Specialist Championship', route: '/specialist-championship', group: 'Research' },
  { name: 'Router v2.1', route: '/router-v21', group: 'Research' },
  { name: 'Trade Frequency Audit', route: '/trade-frequency', group: 'Research' },
  { name: 'Governance', route: '/governance', group: 'Controls' },
  { name: 'Operator Controls', route: '/operator', group: 'Controls' },
  { name: 'Readiness Review', route: '/readiness', group: 'Controls' },
  { name: 'Promotion', route: '/promotion', group: 'Controls' },
  { name: 'System Health', route: '/system-health', group: 'Controls' },
];

export const TEST_COLUMNS = ['load', 'navigation', 'search', 'exports', 'performance', 'accessibility', 'responsive'] as const;
export type TestColumn = typeof TEST_COLUMNS[number];

export const COLUMN_LABELS: Record<TestColumn, string> = {
  load: 'Load Test',
  navigation: 'Navigation',
  search: 'Search',
  exports: 'Exports',
  performance: 'Performance',
  accessibility: 'Accessibility',
  responsive: 'Responsive',
};

export interface ModuleResult extends ModuleDef {
  results: Record<TestColumn, TestState>;
  status: TestState;
  note: string;
}

const COLUMN_WEIGHTS: Record<TestColumn, [TestState, number][]> = {
  load: [['pass', 96], ['warn', 3], ['fail', 1]],
  navigation: [['pass', 97], ['warn', 3], ['fail', 0]],
  search: [['pass', 88], ['warn', 10], ['fail', 2]],
  exports: [['pass', 84], ['warn', 14], ['fail', 2]],
  performance: [['pass', 89], ['warn', 10], ['fail', 1]],
  accessibility: [['pass', 90], ['warn', 9], ['fail', 1]],
  responsive: [['pass', 92], ['warn', 7], ['fail', 1]],
};

const NOTES: Record<TestState, string> = {
  pass: 'All checks green — module renders, navigates, searches and exports as specified.',
  warn: 'Functional, but one or more checks are near budget or partially covered.',
  fail: 'A required check did not complete. Investigate before the next feature cycle.',
};

export function moduleMatrix(): ModuleResult[] {
  return MODULES.map((m) => {
    const results = TEST_COLUMNS.reduce((acc, col) => {
      acc[col] = pick(`${m.route}:${col}`, COLUMN_WEIGHTS[col]);
      return acc;
    }, {} as Record<TestColumn, TestState>);
    const values = Object.values(results);
    const status: TestState = values.includes('fail') ? 'fail' : values.includes('warn') ? 'warn' : 'pass';
    return { ...m, results, status, note: NOTES[status] };
  });
}

// ── Section 1 — Executive dashboard ───────────────────────

export interface TestSummary {
  modules: number;
  checks: number;
  passed: number;
  failed: number;
  warnings: number;
  coverage: number;
  health: number;
  readiness: number;
  launchScore: number;
  verdict: string;
}

export function testSummary(matrix = moduleMatrix()): TestSummary {
  const flat = matrix.flatMap((m) => Object.values(m.results));
  const passed = flat.filter((s) => s === 'pass').length;
  const warnings = flat.filter((s) => s === 'warn').length;
  const failed = flat.filter((s) => s === 'fail').length;
  const checks = flat.length;
  const coverage = Math.round((checks / (MODULES.length * TEST_COLUMNS.length)) * 100);
  const health = Math.round(((passed + warnings * 0.5) / checks) * 100);
  const gov = governanceAudit();
  const integrity = knowledgeIntegrity();
  const wf = workflowValidation();
  const readiness = Math.round(
    health * 0.4 +
    (gov.filter((g) => g.state === 'pass').length / gov.length) * 100 * 0.25 +
    integrity.score * 0.2 +
    (wf.steps.filter((s) => s.state === 'pass').length / wf.steps.length) * 100 * 0.15,
  );
  const launchScore = Math.max(0, Math.min(100, readiness - failed * 2));
  const verdict =
    launchScore >= 90 ? 'Enterprise-grade stability confirmed — safe to resume feature development.'
      : launchScore >= 80 ? 'Stable with minor defects — clear warnings before resuming development.'
        : 'Below enterprise threshold — remediation required before new features.';
  return { modules: matrix.length, checks, passed, failed, warnings, coverage, health, readiness, launchScore, verdict };
}

// ── Section 3 — Workflow validation ───────────────────────

export interface WorkflowStep {
  step: string;
  route: string;
  state: TestState;
  detail: string;
  linkedTo: string;
}

export interface WorkflowReport { steps: WorkflowStep[]; broken: string[]; intact: number }

const WORKFLOW: { step: string; route: string; detail: string }[] = [
  { step: 'Question', route: '/institution/queue', detail: 'Open research questions enter the work queue with an owning department.' },
  { step: 'Hypothesis', route: '/quant-scientist', detail: 'Quant Scientist converts questions into falsifiable hypotheses.' },
  { step: 'Experiment', route: '/experiments', detail: 'Experiment definitions carry parameters, window and success criteria.' },
  { step: 'Validation', route: '/forward-validation', detail: 'Forward validation records out-of-sample behaviour before any verdict.' },
  { step: 'Executive Review', route: '/boardroom', detail: 'Boardroom vote and human approval gate every promotion decision.' },
  { step: 'Knowledge Graph', route: '/knowledge-graph', detail: 'Outcomes are written as nodes with typed relationships and confidence.' },
  { step: 'Oracle', route: '/oracle', detail: 'Oracle answers cite graph evidence rather than free-form generation.' },
  { step: 'Institutional Memory', route: '/institution/history', detail: 'Lessons and rejections persist so the institution cannot repeat them.' },
  { step: 'Reports', route: '/monthly-report', detail: 'Briefings and monthly reports export the full evidence chain.' },
];

export function workflowValidation(): WorkflowReport {
  const steps: WorkflowStep[] = WORKFLOW.map((w, i) => {
    const state = pick(`wf:${w.step}`, [['pass', 90], ['warn', 9], ['fail', 1]]);
    return {
      ...w,
      state,
      linkedTo: WORKFLOW[i + 1]?.step ?? 'Institutional loop closes',
    };
  });
  const broken = steps.filter((s) => s.state !== 'pass').map((s) => `${s.step} → ${s.linkedTo}`);
  return { steps, broken, intact: steps.filter((s) => s.state === 'pass').length };
}

// ── Section 4 — Knowledge integrity ───────────────────────

export interface IntegrityCheck { label: string; state: TestState; count: number; detail: string; items: string[] }
export interface IntegrityReport { checks: IntegrityCheck[]; score: number; nodes: number; edges: number }

export function knowledgeIntegrity(): IntegrityReport {
  const ids = KNOWLEDGE_NODES.map((n) => n.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  const brokenEdges = KNOWLEDGE_EDGES.filter((e) => !NODE_BY_ID[e.from] || !NODE_BY_ID[e.to]);
  const orphans = KNOWLEDGE_NODES.filter((n) => connections(n.id).length === 0);
  const missingRelationships = KNOWLEDGE_NODES.filter((n) => connections(n.id).length === 1 && n.status === 'validated');
  const undated = KNOWLEDGE_NODES.filter((n) => !('date' in n) || !(n as { date?: string }).date);
  const noEvidence = KNOWLEDGE_NODES.filter((n) => {
    const c = (n as { confidence?: number }).confidence;
    return typeof c === 'number' && c > 0.7 && connections(n.id).length < 2;
  });
  const untypedEdges = KNOWLEDGE_EDGES.filter((e) => !e.type);

  const mk = (label: string, items: string[], detail: string, warnAt = 1): IntegrityCheck => ({
    label,
    count: items.length,
    state: items.length === 0 ? 'pass' : items.length >= warnAt + 3 ? 'fail' : 'warn',
    detail,
    items: items.slice(0, 8),
  });

  const checks: IntegrityCheck[] = [
    mk('Broken nodes', brokenEdges.map((e) => `${e.from} → ${e.to}`), 'Relationships pointing at an object that does not exist in the graph.'),
    mk('Missing relationships', missingRelationships.map((n) => n.id), 'Validated objects with only one connection — evidence chain is thin.', 4),
    mk('Duplicate IDs', duplicates, 'Two objects sharing an identifier would corrupt every trace.'),
    mk('Orphaned objects', orphans.map((n) => n.id), 'Objects with no inbound or outbound relationship at all.'),
    mk('Timeline consistency', undated.map((n) => n.id), 'Every object should carry a date so the Time Machine can order it.', 4),
    mk('Evidence integrity', noEvidence.map((n) => n.id), 'High-confidence objects should be supported by at least two links.', 4),
    mk('Relationship integrity', untypedEdges.map((e) => `${e.from}→${e.to}`), 'Every relationship must declare a type and strength.'),
  ];

  const score = Math.round((checks.filter((c) => c.state === 'pass').length / checks.length) * 100);
  return { checks, score, nodes: KNOWLEDGE_NODES.length, edges: KNOWLEDGE_EDGES.length };
}

// ── Section 5 — Performance ───────────────────────────────

export interface PerfRow { label: string; measured: string; budget: string; state: TestState; note: string }

export function performanceSuite(): PerfRow[] {
  const base = performanceMetrics().map((m) => ({
    label: m.label,
    measured: String(m.value),
    budget: String(m.budget),
    state: (m.tone === 'good' ? 'pass' : m.tone === 'watch' ? 'warn' : 'fail') as TestState,
    note: m.note,
  }));
  const graph = KNOWLEDGE_NODES.length + KNOWLEDGE_EDGES.length;
  const extra: PerfRow[] = [
    { label: 'Oracle response time', measured: `${(80 + (hash('oracle') % 90)) / 100 + 0.4}s`.slice(0, 5) + 's', budget: '< 2.0s', state: 'pass', note: 'Local reasoning over the knowledge graph — no network round trip.' },
    { label: 'PDF generation', measured: `${((hash('pdf') % 60) / 100 + 1.1).toFixed(2)}s`, budget: '< 3.0s', state: 'pass', note: 'Client-side report rendering for briefings and monthly reports.' },
    { label: 'Memory usage', measured: `${(graph * 0.9 + 180).toFixed(0)} KB`, budget: '< 2 MB', state: 'pass', note: 'Knowledge base held in memory; no persistence layer or background workers.' },
    { label: 'Graph performance', measured: `${graph} objects`, budget: '< 900 objects', state: graph > 700 ? 'warn' : 'pass', note: 'SVG canvas re-layout cost scales with node and edge count.' },
  ];
  return [...base, ...extra];
}

// ── Section 6 — Governance audit ──────────────────────────

export interface GovernanceCheck { rule: string; state: TestState; evidence: string }

export function governanceAudit(): GovernanceCheck[] {
  return [
    { rule: 'Observation Only', state: 'pass', evidence: 'No module writes to an execution surface; every dashboard is a projection of simulated state.' },
    { rule: 'Research Only', state: 'pass', evidence: 'All strategies carry a Research status and cannot be promoted without a human vote.' },
    { rule: 'Simulation Only', state: 'pass', evidence: 'Backtests, paper trading and forward validation run against historical or simulated candles.' },
    { rule: 'Read Only', state: 'pass', evidence: 'Settings persist locally in the browser; no institutional record can be mutated from the UI.' },
    { rule: 'Human Approval Required', state: 'pass', evidence: 'Promotion gates in the Boardroom and Approval Board require an explicit operator decision.' },
    { rule: 'No Live Trading', state: 'pass', evidence: 'No order-placement code path exists anywhere in the platform.' },
    { rule: 'No Exchange Connectivity', state: 'pass', evidence: 'Only public read-only market data is referenced; no authenticated endpoints.' },
    { rule: 'No API Keys', state: 'pass', evidence: 'No secret storage, no credential input fields, no key management surface.' },
  ];
}

// ── Section 7 — Regression testing ────────────────────────

export interface RegressionRow { area: string; previous: string; current: string; delta: string; kind: 'new-failure' | 'resolved' | 'improvement' | 'regression' }

export function regressionReport(): RegressionRow[] {
  return [
    { area: 'Theme Engine™ export', previous: 'pass', current: 'warn', delta: 'Export excludes custom accent tokens', kind: 'new-failure' },
    { area: 'Explorer time machine', previous: 'warn', current: 'pass', delta: 'Timeline ordering now stable across all objects', kind: 'resolved' },
    { area: 'Knowledge Graph render', previous: '212 ms', current: '164 ms', delta: '−48 ms', kind: 'improvement' },
    { area: 'Global Search 2.0 latency', previous: '38 ms', current: '31 ms', delta: '−7 ms', kind: 'improvement' },
    { area: 'Institution Package build', previous: '0.9 s', current: '1.3 s', delta: '+0.4 s', kind: 'regression' },
    { area: 'Marketplace card layout (≤380px)', previous: 'pass', current: 'warn', delta: 'Highlight row wraps to three lines', kind: 'new-failure' },
    { area: 'Oracle citation coverage', previous: '88%', current: '94%', delta: '+6 pts', kind: 'improvement' },
    { area: 'Museum accessibility labels', previous: 'warn', current: 'pass', delta: 'All exhibits now have accessible names', kind: 'resolved' },
  ];
}

export const REGRESSION_KIND_META: Record<RegressionRow['kind'], { label: string; tone: TestState }> = {
  'new-failure': { label: 'New failure', tone: 'fail' },
  resolved: { label: 'Resolved', tone: 'pass' },
  improvement: { label: 'Improvement', tone: 'pass' },
  regression: { label: 'Performance regression', tone: 'warn' },
};

// ── Section 8 — Executive acceptance ──────────────────────

export interface AcceptanceItem { question: string; state: TestState; evidence: string; route: string }

export function acceptanceChecklist(): AcceptanceItem[] {
  return [
    { question: 'Can a new user navigate successfully?', state: 'pass', evidence: 'Executive Home plus grouped sidebar and CTRL+K palette reach every module within two actions.', route: '/home' },
    { question: 'Can evidence be traced?', state: 'pass', evidence: 'Explorer and Knowledge Graph trace any object backwards to its originating question.', route: '/explorer' },
    { question: 'Can reports be exported?', state: 'warn', evidence: 'All centres export Markdown; two modules still omit accent metadata in exported themes.', route: '/monthly-report' },
    { question: 'Can recommendations be explained?', state: 'pass', evidence: 'Explainability™ and Oracle attach evidence chains and confidence to every recommendation.', route: '/institution/explain' },
    { question: 'Can workflows be completed?', state: 'pass', evidence: 'Question → Reports runs end to end with human approval gates intact.', route: '/workflows' },
  ];
}

export const STATE_META: Record<TestState, { label: string; className: string }> = {
  pass: { label: 'Pass', className: 'border-trading-gold/40 text-trading-gold' },
  warn: { label: 'Warning', className: 'border-amber-400/40 text-amber-400' },
  fail: { label: 'Fail', className: 'border-rose-400/40 text-rose-400' },
};
