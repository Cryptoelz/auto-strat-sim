// ATLAS AI Maintenance™ — deterministic autonomous operations engine.
// Observation / Diagnostics / Simulation only. Never executes trades or mutates strategy logic.

export type HealthStatus = 'healthy' | 'watch' | 'warning' | 'critical' | 'running';

export const STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  warning: 'Warning',
  critical: 'Critical',
  running: 'Maintenance Running',
};

// Deterministic pseudo-random generator so every render/report is stable.
function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
function rnd(seed: string, min: number, max: number, decimals = 0): number {
  const v = min + hash(seed) * (max - min);
  const p = Math.pow(10, decimals);
  return Math.round(v * p) / p;
}
function pick<T>(seed: string, arr: T[]): T {
  return arr[Math.floor(hash(seed) * arr.length) % arr.length];
}

export function statusFromScore(score: number): HealthStatus {
  if (score >= 92) return 'healthy';
  if (score >= 84) return 'watch';
  if (score >= 70) return 'warning';
  return 'critical';
}

// ── Modules ────────────────────────────────────────────────────────────

export interface ModuleHealth {
  id: string;
  name: string;
  route: string;
  group: string;
  health: number;
  performance: number;
  errors: number;
  warnings: number;
  brokenLinks: number;
  lastChecked: string;
  dependencies: string[];
  status: HealthStatus;
  note: string;
}

const MODULE_DEFS: { name: string; route: string; group: string; deps: string[] }[] = [
  { name: 'AI Command Center', route: '/command-center', group: 'Intelligence', deps: ['Router', 'Governance', 'Alerts'] },
  { name: 'Portfolio', route: '/portfolio', group: 'Capital', deps: ['Allocation Lab', 'Router'] },
  { name: 'Research', route: '/research', group: 'Research', deps: ['Experiments', 'Knowledge Graph'] },
  { name: 'Promotion', route: '/promotion', group: 'Governance', deps: ['Readiness', 'Approval Board'] },
  { name: 'Router', route: '/router-v21', group: 'Execution', deps: ['Governance', 'Operator Controls'] },
  { name: 'Governance', route: '/governance', group: 'Governance', deps: ['Operator Controls', 'Alerts'] },
  { name: 'Observation Center', route: '/observation-center', group: 'Operations', deps: ['Forward Validation'] },
  { name: 'Operator Controls', route: '/operator', group: 'Operations', deps: ['Governance'] },
  { name: 'Alerts', route: '/alerts', group: 'Operations', deps: ['System Health'] },
  { name: 'Experiments', route: '/experiments', group: 'Research', deps: ['Research', 'Promotion'] },
  { name: 'Approval Board', route: '/specialist-approval-board', group: 'Governance', deps: ['Promotion', 'Readiness'] },
  { name: 'Research Freeze', route: '/freeze', group: 'Governance', deps: ['Promotion'] },
  { name: 'Readiness', route: '/readiness', group: 'Governance', deps: ['Experiments'] },
  { name: 'System Health', route: '/system-health', group: 'Operations', deps: ['Alerts'] },
  { name: 'Allocation Lab', route: '/allocation-lab', group: 'Capital', deps: ['Forward Validation', 'Portfolio'] },
  { name: 'Forward Validation', route: '/forward-validation', group: 'Capital', deps: ['Allocation Lab'] },
];

const NOTES = [
  'All diagnostics nominal. No operator action required.',
  'Render budget approaching soft limit on wide viewports.',
  'Dependency latency elevated during cycle peak.',
  'One deprecated cross-reference detected and queued for repair.',
  'Cache warm-up slower than baseline on first load.',
];

export function getModules(): ModuleHealth[] {
  return MODULE_DEFS.map((m, i) => {
    const health = rnd(`h${m.name}`, 78, 100);
    const perf = rnd(`p${m.name}`, 74, 100);
    return {
      id: m.name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name: m.name,
      route: m.route,
      group: m.group,
      health,
      performance: perf,
      errors: health < 84 ? rnd(`e${m.name}`, 1, 3) : 0,
      warnings: rnd(`w${m.name}`, 0, health > 92 ? 1 : 4),
      brokenLinks: health < 88 ? rnd(`b${m.name}`, 0, 2) : 0,
      lastChecked: `${rnd(`c${m.name}`, 1, 58)} min ago`,
      dependencies: m.deps,
      status: statusFromScore(health),
      note: pick(`n${m.name}${i}`, NOTES),
    };
  });
}

// ── Executive summary ──────────────────────────────────────────────────

export interface ExecutiveSummary {
  institutionHealth: number;
  status: HealthStatus;
  modulesChecked: number;
  modulesHealthy: number;
  warnings: number;
  criticalIssues: number;
  autoRepairsToday: number;
  manualReviews: number;
  performanceScore: number;
  securityScore: number;
  governanceScore: number;
  knowledgeScore: number;
  accessibilityScore: number;
  uiConsistencyScore: number;
  databaseHealth: number;
  latestCycle: string;
  nextCycle: string;
}

export function getExecutiveSummary(): ExecutiveSummary {
  const modules = getModules();
  const avg = Math.round(modules.reduce((s, m) => s + m.health, 0) / modules.length);
  const warnings = modules.reduce((s, m) => s + m.warnings, 0);
  const critical = modules.filter((m) => m.status === 'critical').length;
  return {
    institutionHealth: avg,
    status: statusFromScore(avg),
    modulesChecked: modules.length,
    modulesHealthy: modules.filter((m) => m.status === 'healthy').length,
    warnings,
    criticalIssues: critical,
    autoRepairsToday: getRepairs().filter((r) => r.appliedToday).length,
    manualReviews: modules.filter((m) => m.status === 'warning' || m.status === 'critical').length,
    performanceScore: rnd('perf-score', 86, 97),
    securityScore: rnd('sec-score', 90, 99),
    governanceScore: rnd('gov-score', 88, 99),
    knowledgeScore: rnd('kn-score', 85, 97),
    accessibilityScore: rnd('a11y-score', 84, 96),
    uiConsistencyScore: rnd('ui-score', 88, 98),
    databaseHealth: rnd('db-score', 87, 98),
    latestCycle: 'Today 04:00 UTC — Cycle #1,284',
    nextCycle: 'Tonight 04:00 UTC — Cycle #1,285',
  };
}

// ── Cycle ──────────────────────────────────────────────────────────────

export interface CycleStep {
  step: string;
  detail: string;
  durationMs: number;
  status: 'complete' | 'running' | 'queued';
}

export function getCycleSteps(): CycleStep[] {
  const names: [string, string][] = [
    ['Check Modules', '16 modules inspected across 5 groups'],
    ['Validate Workflows', '8 institutional workflows traced end to end'],
    ['Check Database', 'Record integrity, references and storage scanned'],
    ['Validate Governance', 'Promotion, freeze and guardrail rules verified'],
    ['Run Performance Tests', 'Load, query, memory and render budgets measured'],
    ['Validate Knowledge', 'Oracle, evidence links and explanations cross-checked'],
    ['Run Auto Repairs', 'Safe repairs only — no trading state touched'],
    ['Generate Reports', 'Daily, weekly and executive packs compiled'],
    ['Notify Operator', 'Findings routed to Alerts and Operator Controls'],
  ];
  return names.map(([step, detail], i) => ({
    step,
    detail,
    durationMs: rnd(`cyc${step}`, 220, 4200),
    status: i < 7 ? 'complete' : i === 7 ? 'running' : 'queued',
  }));
}

// ── Workflows ──────────────────────────────────────────────────────────

export interface WorkflowCheck {
  id: string;
  name: string;
  steps: string[];
  brokenAt: string | null;
  issue: string | null;
  issueType: 'broken' | 'missing-step' | 'dead-end' | 'missing-approval' | 'invalid-transition' | null;
  status: HealthStatus;
  integrity: number;
}

const WORKFLOW_DEFS: { name: string; steps: string[] }[] = [
  { name: 'Research to Production', steps: ['Research', 'Validation', 'Promotion', 'Freeze', 'Portfolio', 'Allocation', 'Observation', 'System Health'] },
  { name: 'Specialist Lifecycle', steps: ['Discovery', 'Spec', 'Validation Pack', 'Robustness Audit', 'Approval Board', 'Championship'] },
  { name: 'Allocation Promotion Ladder', steps: ['Allocation Lab', 'Forward Validation', 'Champion Trial', 'Production Path'] },
  { name: 'Governance Escalation', steps: ['Guardrail Trigger', 'Governance State', 'Operator Review', 'Alert', 'Audit Trail'] },
  { name: 'Experiment Registration', steps: ['Experiment', 'Run Snapshot', 'Journal Entry', 'Knowledge Graph'] },
  { name: 'Reporting Chain', steps: ['Session Analytics', 'Weekly Review', 'Monthly Report', 'Executive Home'] },
  { name: 'Maintenance Cycle', steps: ['Modules', 'Workflows', 'Database', 'Governance', 'Performance', 'Knowledge', 'Repairs', 'Reports'] },
  { name: 'Knowledge Feedback Loop', steps: ['Oracle', 'Explainability', 'Recommendations', 'Learning Engine'] },
];

export function getWorkflows(): WorkflowCheck[] {
  return WORKFLOW_DEFS.map((w) => {
    const integrity = rnd(`wf${w.name}`, 82, 100);
    const broken = integrity < 92;
    const idx = Math.floor(hash(`wfi${w.name}`) * w.steps.length);
    const type = pick(`wft${w.name}`, ['missing-step', 'dead-end', 'missing-approval', 'invalid-transition'] as const);
    const messages: Record<string, string> = {
      'missing-step': 'Intermediate validation step is not reachable from the previous stage.',
      'dead-end': 'Stage has no forward navigation to the next workflow node.',
      'missing-approval': 'Transition proceeds without a recorded human approval record.',
      'invalid-transition': 'Transition skips a mandatory governance gate.',
    };
    return {
      id: w.name.toLowerCase().replace(/[^a-z]+/g, '-'),
      name: w.name,
      steps: w.steps,
      brokenAt: broken ? w.steps[idx] : null,
      issue: broken ? messages[type] : null,
      issueType: broken ? type : null,
      status: statusFromScore(integrity),
      integrity,
    };
  });
}

// ── Governance audit ───────────────────────────────────────────────────

export interface GovernanceCheck {
  area: string;
  rule: string;
  result: 'pass' | 'warn' | 'fail';
  finding: string;
}

export function getGovernanceAudit(): GovernanceCheck[] {
  const defs: [string, string, string][] = [
    ['Promotion rules', 'Promotion requires 30 days runtime and 20 trades', 'All candidates respect the minimum runtime gate.'],
    ['Promotion rules', 'No promotion without an Approval Board record', 'Every promoted item carries a signed board record.'],
    ['Freeze rules', 'Research freeze blocks parameter mutation', 'Freeze state enforced on all frozen presets.'],
    ['Freeze rules', 'Frozen strategies cannot re-enter optimisation', 'One optimisation request was correctly rejected.'],
    ['Guardrails', 'Drawdown guardrail active on all live simulations', 'Guardrail thresholds present and enforced.'],
    ['Guardrails', 'Consecutive-loss limiter present', 'Limiter configured at 3 consecutive losses.'],
    ['Human approvals', 'Champion changes require operator sign-off', 'One champion change awaits countersignature.'],
    ['Human approvals', 'Autonomy level respected by all agents', 'All agents operate within the declared autonomy level.'],
    ['Risk controls', 'Position sizing bounded by ATR tiering', 'Sizing bounds verified across all assets.'],
    ['Risk controls', 'Portfolio exposure caps enforced', 'Exposure caps verified against portfolio state.'],
    ['Emergency policies', 'Emergency halt reachable in one action', 'Halt control reachable from Operator Controls.'],
    ['Emergency policies', 'Halt state persists across reloads', 'Persistence verified in simulation.'],
    ['Version control', 'Every strategy fork has a version record', 'All forks carry parent lineage.'],
    ['Version control', 'Archived versions remain readable', 'Archive integrity verified.'],
    ['Audit trails', 'Every decision has a plain-English reason', 'Explainability coverage complete.'],
    ['Audit trails', 'Audit entries are append-only', 'No mutation detected on historical entries.'],
    ['Unlocked champions', 'No champion is unlocked without review', 'One champion is unlocked pending review.'],
  ];
  return defs.map(([area, rule, finding], i) => {
    const r = hash(`gv${rule}`);
    const result: GovernanceCheck['result'] = r > 0.9 ? 'fail' : r > 0.76 ? 'warn' : 'pass';
    return { area, rule, result, finding: i >= 0 ? finding : finding };
  });
}

// ── Database integrity ─────────────────────────────────────────────────

export interface DbCheck {
  category: string;
  found: number;
  severity: 'info' | 'warn' | 'critical';
  detail: string;
  repairable: boolean;
}

export function getDatabaseChecks(): DbCheck[] {
  const defs: [string, string, boolean][] = [
    ['Duplicate records', 'Duplicate experiment snapshots created by repeated runs.', true],
    ['Orphaned records', 'Trade journal entries pointing at removed sessions.', true],
    ['Broken references', 'Knowledge edges referencing archived research nodes.', true],
    ['Missing IDs', 'Preset versions saved before the ID migration.', true],
    ['Invalid relationships', 'Allocation rows linked to a retired specialist.', false],
    ['Corrupt data', 'Unparseable payloads in the local storage cache.', true],
    ['Unused assets', 'Chart snapshots no longer referenced by any report.', true],
  ];
  return defs.map(([category, detail, repairable]) => {
    const found = rnd(`db${category}`, 0, 9);
    return {
      category,
      found,
      severity: found === 0 ? 'info' : found > 6 ? 'critical' : 'warn',
      detail,
      repairable,
    };
  });
}

export function getStorageUsage() {
  const usedKb = rnd('storage', 1400, 4100);
  return { usedKb, quotaKb: 5120, percent: Math.round((usedKb / 5120) * 100) };
}

// ── Knowledge validator ────────────────────────────────────────────────

export interface KnowledgeFinding {
  source: string;
  type: 'contradiction' | 'missing-evidence' | 'duplicate' | 'outdated';
  count: number;
  coverage: number;
  detail: string;
}

export function getKnowledgeFindings(): KnowledgeFinding[] {
  const defs: [string, KnowledgeFinding['type'], string][] = [
    ['Oracle knowledge', 'contradiction', 'Two Oracle answers disagree on the Router v2.1 threshold delta.'],
    ['Research history', 'missing-evidence', 'Research conclusions without a linked validation run.'],
    ['Experiment history', 'duplicate', 'Experiment records describing the same configuration snapshot.'],
    ['Promotion history', 'missing-evidence', 'Promotion decisions missing an attached robustness report.'],
    ['Cross references', 'outdated', 'Cross-references pointing at superseded module versions.'],
    ['Evidence links', 'missing-evidence', 'Evidence links resolving to removed report artefacts.'],
    ['AI explanations', 'outdated', 'Explanations generated before the latest governance rule change.'],
  ];
  return defs.map(([source, type, detail]) => ({
    source,
    type,
    count: rnd(`kf${source}`, 0, 6),
    coverage: rnd(`kc${source}`, 82, 100),
    detail,
  }));
}

// ── Performance ────────────────────────────────────────────────────────

export interface PerfMetric {
  metric: string;
  value: number;
  unit: string;
  budget: number;
  status: HealthStatus;
}

export function getPerfMetrics(): PerfMetric[] {
  const defs: [string, string, number, number, number][] = [
    ['Average page load', 'ms', 380, 1600, 1200],
    ['Slowest query', 'ms', 40, 420, 300],
    ['Memory usage', 'MB', 120, 380, 320],
    ['Render time (p95)', 'ms', 24, 190, 120],
    ['Bundle parse time', 'ms', 90, 460, 400],
    ['Slow API calls', 'calls', 0, 7, 3],
  ];
  return defs.map(([metric, unit, min, max, budget]) => {
    const value = rnd(`pm${metric}`, min, max, unit === 'calls' ? 0 : 0);
    const ratio = value / budget;
    return {
      metric,
      value,
      unit,
      budget,
      status: ratio < 0.7 ? 'healthy' : ratio < 0.95 ? 'watch' : ratio < 1.2 ? 'warning' : 'critical',
    };
  });
}

export interface HeavyPage {
  page: string;
  route: string;
  components: number;
  weightKb: number;
  renderMs: number;
}

export function getHeavyPages(): HeavyPage[] {
  const defs: [string, string][] = [
    ['Specialist Allocation Lab', '/allocation-lab'],
    ['Release Candidate Centre', '/release-candidate'],
    ['Institution Dashboard™', '/institution'],
    ['Knowledge Graph™', '/knowledge-graph'],
    ['Executive Home', '/home'],
    ['Backtest', '/backtest'],
  ];
  return defs.map(([page, route]) => ({
    page,
    route,
    components: rnd(`hc${page}`, 18, 96),
    weightKb: rnd(`hw${page}`, 90, 420),
    renderMs: rnd(`hr${page}`, 30, 210),
  })).sort((a, b) => b.renderMs - a.renderMs);
}

export function getPerfTrend() {
  return Array.from({ length: 14 }, (_, i) => ({
    day: `D-${13 - i}`,
    score: rnd(`pt${i}`, 82, 98),
    loadMs: rnd(`pl${i}`, 520, 1180),
  }));
}

// ── Auto repair ────────────────────────────────────────────────────────

export interface RepairAction {
  id: string;
  action: string;
  category: string;
  target: string;
  safe: true;
  appliedToday: boolean;
  status: 'applied' | 'available' | 'blocked';
  explanation: string;
}

export function getRepairs(): RepairAction[] {
  const defs: [string, string, string, string][] = [
    ['Fix broken links', 'Navigation', 'Knowledge Graph → Research', 'Rewrites a stale internal route to its current path.'],
    ['Clear stale cache', 'Cache', 'Session analytics cache', 'Drops cached payloads older than the retention window.'],
    ['Repair navigation', 'Navigation', 'Specialist Lifecycle workflow', 'Restores the forward link on a dead-end stage.'],
    ['Repair indexes', 'Database', 'Experiment index', 'Rebuilds the lookup index after record churn.'],
    ['Update timestamps', 'Database', 'Module health register', 'Normalises last-checked timestamps to UTC.'],
    ['Rebuild search indexes', 'Search', 'Command palette index', 'Re-indexes module and route metadata.'],
    ['Remove duplicate temporary records', 'Database', 'Temporary run snapshots', 'Deletes duplicated scratch records only.'],
    ['Prune unused assets', 'Storage', 'Orphaned chart snapshots', 'Removes assets no longer referenced by any report.'],
  ];
  return defs.map(([action, category, target, explanation], i) => {
    const r = hash(`rp${action}`);
    return {
      id: `repair-${i}`,
      action,
      category,
      target,
      safe: true as const,
      appliedToday: r > 0.45,
      status: r > 0.45 ? 'applied' : r > 0.2 ? 'available' : 'blocked',
      explanation,
    };
  });
}

export const REPAIR_FORBIDDEN = [
  'Strategies',
  'Trades',
  'Research results',
  'Portfolio allocations',
  'Promotions',
  'Anything affecting trading decisions',
];

// ── Predictive maintenance ─────────────────────────────────────────────

export interface Prediction {
  id: string;
  headline: string;
  area: string;
  horizonDays: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export function getPredictions(): Prediction[] {
  const defs: [string, string, string][] = [
    ['Specialist Allocation Lab will likely become slow within 14 days', 'Performance', 'Split the validation suite into lazily-loaded tabs before the next release.'],
    ['Governance Escalation workflow contains increasing technical debt', 'Workflow', 'Consolidate duplicate escalation branches into a single guarded transition.'],
    ['Release Candidate Centre is growing beyond recommended page size', 'UI', 'Extract the change log and release history into separate route segments.'],
    ['Research database fragmentation is increasing', 'Database', 'Schedule a compaction pass in the next weekly maintenance cycle.'],
    ['Knowledge evidence coverage is trending downward', 'Knowledge', 'Require an evidence link before new research conclusions are recorded.'],
    ['Local storage will approach its quota within 21 days', 'Storage', 'Enable automatic pruning of archived session snapshots.'],
    ['Command palette index rebuild time is rising', 'Search', 'Cache the route metadata index between maintenance cycles.'],
  ];
  return defs.map(([headline, area, recommendation], i) => {
    const c = rnd(`pr${headline}`, 58, 96);
    return {
      id: `pred-${i}`,
      headline,
      area,
      horizonDays: rnd(`ph${headline}`, 5, 45),
      confidence: c,
      severity: c > 85 ? 'high' : c > 70 ? 'medium' : 'low',
      recommendation,
    };
  });
}

// ── Reports ────────────────────────────────────────────────────────────

export interface MaintenanceReport {
  id: string;
  kind: 'Daily' | 'Weekly' | 'Monthly Executive' | 'Quarterly Institution Health';
  period: string;
  summary: string;
  issuesFound: number;
  repairsCompleted: number;
  warnings: number;
  trend: string;
  recommendations: string[];
}

export function getReports(): MaintenanceReport[] {
  const kinds: MaintenanceReport['kind'][] = ['Daily', 'Weekly', 'Monthly Executive', 'Quarterly Institution Health'];
  const periods = ['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days'];
  const summaries = [
    'The institution completed its maintenance cycle with no critical failures. Health remains within the healthy band.',
    'Weekly health held steady. Performance was the main contributor to lost points, driven by two heavy pages.',
    'Monthly health improved as auto repairs cleared a backlog of stale references and duplicate scratch records.',
    'Quarterly review shows a maturing platform: governance and security scores are stable, knowledge coverage is the growth area.',
  ];
  return kinds.map((kind, i) => ({
    id: `report-${i}`,
    kind,
    period: periods[i],
    summary: summaries[i],
    issuesFound: rnd(`ri${kind}`, 3, 40),
    repairsCompleted: rnd(`rr${kind}`, 2, 32),
    warnings: rnd(`rw${kind}`, 1, 18),
    trend: pick(`rt${kind}`, ['Improving', 'Stable', 'Slightly declining']),
    recommendations: [
      'Prioritise the highest-severity predictive finding before the next cycle.',
      'Close the outstanding governance countersignature.',
      'Schedule a database compaction pass.',
      'Re-check knowledge evidence coverage after the next research run.',
    ].slice(0, 2 + (i % 3)),
  }));
}

export function renderReportMarkdown(r: MaintenanceReport, s: ExecutiveSummary): string {
  return [
    `# ATLAS AI Maintenance™ — ${r.kind} Report`,
    ``,
    `Period: ${r.period}`,
    `Institution Health: ${s.institutionHealth} (${STATUS_LABEL[s.status]})`,
    ``,
    `## Executive Summary`,
    r.summary,
    ``,
    `## Issues Found`,
    `- Total issues: ${r.issuesFound}`,
    `- Warnings: ${r.warnings}`,
    `- Critical: ${s.criticalIssues}`,
    ``,
    `## Repairs Completed`,
    `- Safe automatic repairs: ${r.repairsCompleted}`,
    `- Forbidden domains untouched: ${REPAIR_FORBIDDEN.join(', ')}`,
    ``,
    `## Performance Trend`,
    `- Trend: ${r.trend}`,
    `- Performance score: ${s.performanceScore}`,
    ``,
    `## Recommendations`,
    ...r.recommendations.map((x) => `- ${x}`),
    ``,
    `Observation / Diagnostics / Simulation only. No live trading.`,
  ].join('\n');
}

// ── Settings ───────────────────────────────────────────────────────────

export interface MaintenanceSettings {
  schedule: 'hourly' | 'every-6h' | 'daily' | 'weekly';
  autoRepairs: boolean;
  repairNavigation: boolean;
  repairCache: boolean;
  repairDatabase: boolean;
  repairSearch: boolean;
  notifyWarnings: boolean;
  notifyCritical: boolean;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  healthWarningThreshold: number;
  healthCriticalThreshold: number;
  performanceBudgetMs: number;
  memoryBudgetMb: number;
}

export const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  schedule: 'daily',
  autoRepairs: true,
  repairNavigation: true,
  repairCache: true,
  repairDatabase: true,
  repairSearch: true,
  notifyWarnings: true,
  notifyCritical: true,
  dailyReport: true,
  weeklyReport: true,
  monthlyReport: true,
  healthWarningThreshold: 84,
  healthCriticalThreshold: 70,
  performanceBudgetMs: 1200,
  memoryBudgetMb: 320,
};

export const MAINTENANCE_SETTINGS_KEY = 'atlas-maintenance-settings';

// ── Assistant ──────────────────────────────────────────────────────────

export function answerMaintenanceQuestion(q: string): string {
  const s = getExecutiveSummary();
  const modules = getModules();
  const query = q.toLowerCase();
  const worst = [...modules].sort((a, b) => a.health - b.health)[0];
  const heavy = getHeavyPages()[0];

  if (query.includes('health') && (query.includes('why') || query.includes('only') || query.includes('score'))) {
    const lost = 100 - s.institutionHealth;
    return `Institution Health is ${s.institutionHealth}. The ${lost} lost points break down as: performance ${100 - s.performanceScore}, knowledge coverage ${100 - s.knowledgeScore}, accessibility ${100 - s.accessibilityScore}, database ${100 - s.databaseHealth}. The single largest contributor is ${worst.name} at ${worst.health} health — ${worst.note}`;
  }
  if (query.includes('attention') || query.includes('which module')) {
    const needy = modules.filter((m) => m.status !== 'healthy').sort((a, b) => a.health - b.health).slice(0, 4);
    if (!needy.length) return 'No module currently needs attention — every module is inside the healthy band.';
    return `These modules need attention:\n${needy.map((m) => `• ${m.name} — health ${m.health}, ${m.warnings} warning(s), ${m.errors} error(s). ${m.note}`).join('\n')}`;
  }
  if (query.includes('repair')) {
    const applied = getRepairs().filter((r) => r.appliedToday);
    return `I applied ${applied.length} safe repairs today:\n${applied.map((r) => `• ${r.action} on ${r.target} — ${r.explanation}`).join('\n')}\nI did not touch strategies, trades, research results, portfolio allocations or promotions.`;
  }
  if (query.includes('warning')) {
    const w = modules.filter((m) => m.warnings > 0);
    return `There are ${s.warnings} open warnings across ${w.length} modules. The heaviest are ${w.sort((a, b) => b.warnings - a.warnings).slice(0, 3).map((m) => `${m.name} (${m.warnings})`).join(', ')}.`;
  }
  if (query.includes('fix first') || query.includes('priority') || query.includes('should i')) {
    const p = getPredictions().sort((a, b) => b.confidence - a.confidence)[0];
    return `Fix ${worst.name} first — it has the lowest health score (${worst.health}) and ${worst.errors} error(s). After that, act on the highest-confidence prediction: "${p.headline}" (${p.confidence}% confidence). Recommended action: ${p.recommendation}`;
  }
  if (query.includes('performance') || query.includes('slow')) {
    const bad = getPerfMetrics().sort((a, b) => b.value / b.budget - a.value / a.budget)[0];
    return `The biggest performance issue is "${bad.metric}" at ${bad.value}${bad.unit} against a budget of ${bad.budget}${bad.unit}. The heaviest page is ${heavy.page} (${heavy.components} components, ${heavy.renderMs}ms render, ${heavy.weightKb}KB). Splitting that page into lazily-loaded sections would recover most of the deficit.`;
  }
  if (query.includes('governance')) {
    const audit = getGovernanceAudit();
    const bad = audit.filter((a) => a.result !== 'pass');
    return `Governance score is ${s.governanceScore}. ${audit.length - bad.length} of ${audit.length} rules pass. Outstanding: ${bad.map((b) => b.rule).join('; ') || 'none'}.`;
  }
  if (query.includes('database') || query.includes('data')) {
    const db = getDatabaseChecks().filter((d) => d.found > 0);
    return `Database health is ${s.databaseHealth}. Open findings: ${db.map((d) => `${d.category} (${d.found})`).join(', ') || 'none'}. ${db.filter((d) => d.repairable).length} of these are safely auto-repairable.`;
  }
  if (query.includes('cycle') || query.includes('next')) {
    return `The latest maintenance cycle was ${s.latestCycle}. The next cycle is scheduled for ${s.nextCycle}. Each cycle runs nine stages, ending with operator notification.`;
  }
  return `Institution Health is ${s.institutionHealth} (${STATUS_LABEL[s.status]}) across ${s.modulesChecked} modules, with ${s.warnings} warnings and ${s.criticalIssues} critical issues. Ask me about health, modules needing attention, today's repairs, warnings, performance, governance, the database, or what to fix first.`;
}

export const MAINTENANCE_SUGGESTIONS = [
  'Why is Institution Health only 92?',
  'Which modules need attention?',
  'What did you repair today?',
  "Show today's warnings.",
  'What should I fix first?',
  'Explain the biggest performance issue.',
];
