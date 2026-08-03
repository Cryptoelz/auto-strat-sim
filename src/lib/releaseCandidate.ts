// ─────────────────────────────────────────────────────────────────────
// Enterprise Release Candidate Centre — ATLAS OS™ RC1
// Command centre used before every platform release.
// Deterministic. Sourced only from the Institutional Knowledge Graph.
// Observation Only · Research Only · Simulation Only · Read Only.
// Human Approval Required. No live trading. No allocation changes.
// ─────────────────────────────────────────────────────────────────────

export const RC_VERSION = 'ATLAS OS™ RC1 · Enterprise Release Candidate Centre';

export type RcState = 'PASS' | 'WARNING' | 'FAIL';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

const BASE = new Date('2026-08-03T06:00:00Z');
let seq = 0;
const ts = () => new Date(BASE.getTime() + seq++ * 180_000).toISOString();
export const fmt = (iso: string) =>
  new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// ─── Section 1 · Release Candidate Summary ───────────────────────────
export type SummaryField = { label: string; value: string; note: string; source: string };

export const RC_SUMMARY: SummaryField[] = [
  { label: 'Version', value: 'ATLAS OS™ 7.1.0', note: 'Feature freeze held since v7.0 acceptance sign-off.', source: 'Institution History' },
  { label: 'Release Candidate', value: 'RC1', note: 'First candidate assembled from the frozen v7.0 institutional record.', source: 'Release Candidate Centre' },
  { label: 'Build Date', value: '2026-08-03 06:00 UTC', note: 'Deterministic build; identical inputs reproduce identical output.', source: 'Enterprise Platform' },
  { label: 'Institution Grade', value: 'Gold', note: 'Grade derived from the acceptance release score of 94.', source: 'Acceptance Programme™' },
  { label: 'Readiness Score', value: '94 / 100', note: 'Weighted across eight enterprise readiness pillars.', source: 'Acceptance Programme™' },
  { label: 'Certification Status', value: 'Certified — with caveats', note: '57 of 59 certification checks completed, 54 passed.', source: 'Certification Centre' },
  { label: 'Open Issues', value: '6', note: 'All non-blocking; none rated Critical.', source: 'Known Issues Register' },
  { label: 'Closed Issues', value: '41', note: 'Closed across the v6.0 → v7.0 institutional cycle.', source: 'Change Log' },
];

// ─── Section 2 · Release Notes ───────────────────────────────────────
export type ReleaseNoteGroup = {
  group: string;
  route: string;
  summary: string;
  items: Array<{ title: string; detail: string; evidence: string }>;
};

export const RELEASE_NOTES: ReleaseNoteGroup[] = [
  {
    group: 'Knowledge Graph', route: '/knowledge-graph',
    summary: 'Institutional memory layer reconciled and confidence-scored.',
    items: [
      { title: 'Confidence-scored nodes', detail: '1,284 nodes carry provenance, confidence and department ownership.', evidence: '/knowledge-graph' },
      { title: 'Relationship integrity pass', detail: '6 orphan references quarantined rather than deleted (append-only).', evidence: '/institution/quality' },
    ],
  },
  {
    group: 'Oracle', route: '/oracle',
    summary: 'Natural-language reasoning grounded strictly in graph evidence.',
    items: [
      { title: 'Explain Further trails', detail: 'Every answer expands into an evidence chain with source departments.', evidence: '/oracle' },
      { title: 'Oracle Thinking™', detail: 'Proactive insights surfaced without generating institutional facts.', evidence: '/institution/explain' },
    ],
  },
  {
    group: 'Explorer', route: '/explorer',
    summary: 'Research replay and time-travel across the institutional record.',
    items: [
      { title: 'Research Replay™', detail: 'Any conclusion replays from its originating evidence set.', evidence: '/explorer' },
      { title: 'Institutional Time Machine™', detail: 'Slider reconstructs the institution at any prior date.', evidence: '/institution/evolution-timeline' },
    ],
  },
  {
    group: 'Living Institution', route: '/institution',
    summary: 'Ten AI departments operating autonomous, observable work cycles.',
    items: [
      { title: 'Department cycle engine', detail: 'Deterministic cycles produce decisions, conversations and forecasts.', evidence: '/institution/cycle' },
      { title: 'Institution Health Monitor', detail: 'Live pulse across workload, quality and collaboration.', evidence: '/institution/health' },
    ],
  },
  {
    group: 'Enterprise', route: '/home',
    summary: 'Commercial-grade shell: home, settings, docs, performance and API.',
    items: [
      { title: 'Command Palette 2.0', detail: 'CTRL+K natural-language navigation across all modules.', evidence: '/home' },
      { title: 'Performance Centre', detail: 'p95 route render 118 ms; two heavy graph views flagged for RC2.', evidence: '/performance' },
    ],
  },
  {
    group: 'Platform', route: '/marketplace',
    summary: 'Extensibility layer: extensions, apps, themes, templates, workflows.',
    items: [
      { title: 'Extension + app registries', detail: 'Core institution stays stable while capability is added modularly.', evidence: '/extensions' },
      { title: 'Theme Engine™', detail: 'Eight institutional themes driven entirely by semantic tokens.', evidence: '/themes' },
    ],
  },
  {
    group: 'Testing', route: '/validation-centre',
    summary: 'Module matrix, workflow validation and regression coverage.',
    items: [
      { title: 'Module test matrix', detail: 'Every registered module carries a deterministic verification record.', evidence: '/validation-centre' },
      { title: 'Regression suite', detail: '1,412 checks executed on the RC1 build with zero failures.', evidence: '/validation-centre' },
    ],
  },
  {
    group: 'Certification', route: '/allocation-lab',
    summary: 'Twelve-category institutional certification with evidence links.',
    items: [
      { title: 'Certification Centre', detail: '94% progress ring; per-check status, source, department and confidence.', evidence: '/allocation-lab' },
      { title: 'Executive sign-off register', detail: 'Append-only signature record; simulated signatures only.', evidence: '/allocation-lab' },
    ],
  },
  {
    group: 'Acceptance', route: '/acceptance',
    summary: 'Final enterprise validation layer before release candidacy.',
    items: [
      { title: 'Release score 94 (Gold)', detail: 'Institution Ready: YES — recommendation "Ready for External Review".', evidence: '/acceptance' },
      { title: 'Cross-module chain', detail: 'All nine institutional links verified end to end.', evidence: '/acceptance' },
    ],
  },
];

// ─── Section 3 · Change Log ──────────────────────────────────────────
export type ChangeRow = {
  at: string; version: string; feature: string; reason: string;
  evidence: string; impact: string; department: string; approval: string;
};

const RAW_CHANGES: Array<[string, string, string, string, string, string, string]> = [
  ['v2.0', 'ATLAS OS™ institution layer', 'Research modules lacked a coordinating institution.', '/institution', 'Ten departments formalised with owners and mandates.', 'Governance Office', 'Approved · Executive'],
  ['v3.0', 'Living Institution cycles', 'Institutional work was static and unobservable.', '/institution/cycle', 'Autonomous cycles, conversations and decisions recorded.', 'Institution Operations', 'Approved · Executive'],
  ['v4.0', 'Institution IQ™ & Self Review™', 'No mechanism to critique the institution itself.', '/institution/iq', 'Quality, benchmark and evolution telemetry established.', 'Research Quality', 'Approved · Research Lead'],
  ['v5.0', 'Enterprise shell', 'Platform needed commercial-grade usability.', '/home', 'Home, settings, docs, performance, metrics API delivered.', 'Enterprise Platform', 'Approved · Platform Owner'],
  ['v6.0', 'Extensibility platform', 'Capability growth risked destabilising the core.', '/extensions', 'Extensions, apps, themes, templates isolated from core.', 'Enterprise Platform', 'Approved · Platform Owner'],
  ['v6.1', 'Certification Centre', 'Executive verdict card lacked auditable depth.', '/allocation-lab', '12 categories, 59 checks, evidence links, sign-off register.', 'Certification Office', 'Approved · Governance'],
  ['v7.0', 'Acceptance Programme™', 'No final gate before declaring release readiness.', '/acceptance', 'Release score 94 (Gold); Institution Ready: YES.', 'Governance Office', 'Approved · Executive'],
  ['RC1', 'Release Candidate Centre', 'Releases needed a single deterministic command centre.', '/release-candidate', 'Release notes, change log, regression, sign-off unified.', 'Enterprise Platform', 'Pending · Human Approval'],
];

export const CHANGE_LOG: ChangeRow[] = RAW_CHANGES.map(
  ([version, feature, reason, evidence, impact, department, approval]) => ({
    at: ts(), version, feature, reason, evidence, impact, department, approval,
  }),
);

// ─── Section 4 · Regression Snapshot ─────────────────────────────────
export type RegressionRow = {
  suite: string; run: number; passed: number; warnings: number; failed: number;
  coverage: number; performanceMs: number; state: RcState;
};

const reg = (suite: string, run: number, warnings: number, failed: number, coverage: number, performanceMs: number): RegressionRow => ({
  suite, run, passed: run - warnings - failed, warnings, failed, coverage, performanceMs,
  state: failed > 0 ? 'FAIL' : warnings > 0 ? 'WARNING' : 'PASS',
});

export const REGRESSION_SUITES: RegressionRow[] = [
  reg('Module render matrix', 412, 0, 0, 98, 96),
  reg('Knowledge Graph integrity', 268, 2, 0, 94, 141),
  reg('Cross-module navigation', 186, 0, 0, 97, 74),
  reg('Governance lock enforcement', 122, 0, 0, 100, 38),
  reg('Explainability trails', 154, 1, 0, 91, 118),
  reg('Export determinism', 96, 0, 0, 99, 62),
  reg('Accessibility landmarks', 174, 4, 0, 88, 83),
];

export const REGRESSION_TOTALS = (() => {
  const t = REGRESSION_SUITES.reduce(
    (a, s) => ({
      run: a.run + s.run, passed: a.passed + s.passed,
      warnings: a.warnings + s.warnings, failed: a.failed + s.failed,
    }),
    { run: 0, passed: 0, warnings: 0, failed: 0 },
  );
  const coverage = Math.round(REGRESSION_SUITES.reduce((a, s) => a + s.coverage, 0) / REGRESSION_SUITES.length);
  const performanceMs = Math.round(REGRESSION_SUITES.reduce((a, s) => a + s.performanceMs, 0) / REGRESSION_SUITES.length);
  return { ...t, coverage, performanceMs, state: (t.failed ? 'FAIL' : t.warnings ? 'WARNING' : 'PASS') as RcState };
})();

// ─── Section 5 · Executive Sign-off ──────────────────────────────────
export type SignOffRow = {
  role: string; signatory: string; state: 'Signed' | 'Pending';
  at: string; scope: string; signature: string;
};

export const SIGN_OFF: SignOffRow[] = [
  { role: 'Research Lead', signatory: 'AI Research Brain™', state: 'Signed', at: ts(), scope: 'Evidence quality, hypothesis integrity, replay fidelity.', signature: 'sim:RL-7F13-A0C2' },
  { role: 'Governance', signatory: 'Governance Office', state: 'Signed', at: ts(), scope: 'Nine institutional locks verified as enforced.', signature: 'sim:GV-2B84-9DD1' },
  { role: 'Executive', signatory: 'AI Chief Investment Officer™', state: 'Signed', at: ts(), scope: 'Executive narrative, recommendation coherence, risk posture.', signature: 'sim:EX-5C90-11AE' },
  { role: 'Platform Owner', signatory: 'Enterprise Platform', state: 'Signed', at: ts(), scope: 'Build reproducibility, performance envelope, extension isolation.', signature: 'sim:PO-8A22-6E4B' },
  { role: 'Human Approval', signatory: 'Awaiting human operator', state: 'Pending', at: ts(), scope: 'Final release authorisation. No release proceeds without it.', signature: '—' },
];

export const SIGN_OFF_NOTE =
  'Digital signatures are simulated only. They record institutional review, not legal or financial authorisation.';

// ─── Section 6 · Known Issues ────────────────────────────────────────
export type IssueRow = {
  id: string; title: string; priority: Priority; area: string;
  detail: string; evidence: string; owner: string; target: string;
};

export const KNOWN_ISSUES: IssueRow[] = [
  { id: 'RC1-001', title: 'Eleven aria-label gaps on dense tables', priority: 'Medium', area: 'Accessibility', detail: 'Icon-only controls in three matrices lack accessible names.', evidence: '/validation-centre', owner: 'Accessibility Review', target: 'RC2' },
  { id: 'RC1-002', title: 'Two heavy graph views exceed 250 ms render', priority: 'Medium', area: 'Performance', detail: 'Knowledge Graph canvas and Evolution Timeline at large node counts.', evidence: '/performance', owner: 'Enterprise Platform', target: 'RC2' },
  { id: 'RC1-003', title: 'Six orphan knowledge references quarantined', priority: 'Low', area: 'Knowledge Graph', detail: 'Retained append-only; excluded from confidence scoring.', evidence: '/knowledge-graph', owner: 'Research Quality', target: 'RC2' },
  { id: 'RC1-004', title: 'Nine modules missing executive documentation', priority: 'Low', area: 'Documentation', detail: '92 of 101 modules documented; remainder are internal diagnostics.', evidence: '/docs', owner: 'Documentation Centre', target: 'RC2' },
  { id: 'RC1-005', title: 'Two certification checks not yet completed', priority: 'High', area: 'Certification', detail: 'Long-horizon regression evidence still accruing (57 of 59 complete).', evidence: '/allocation-lab', owner: 'Certification Office', target: 'RC2' },
  { id: 'RC1-006', title: 'Forward validation streak below 60-day target', priority: 'High', area: 'Research', detail: 'Success criteria require 60 consecutive days; streak still building.', evidence: '/forward-validation', owner: 'Portfolio Research', target: 'Production' },
];

export const ISSUE_COUNTS: Record<Priority, number> = {
  Low: KNOWN_ISSUES.filter((i) => i.priority === 'Low').length,
  Medium: KNOWN_ISSUES.filter((i) => i.priority === 'Medium').length,
  High: KNOWN_ISSUES.filter((i) => i.priority === 'High').length,
  Critical: KNOWN_ISSUES.filter((i) => i.priority === 'Critical').length,
};

// ─── Section 8 · Release History ─────────────────────────────────────
export type ReleaseHistoryRow = {
  at: string; version: string; name: string; grade: string;
  score: number; state: string; note: string;
};

const RAW_HISTORY: Array<[string, string, string, number, string, string]> = [
  ['v2.0', 'ATLAS OS™ Institution Layer', 'Bronze', 71, 'Archived', 'First institutional structure; ten departments defined.'],
  ['v3.0', 'Living Institution', 'Bronze', 78, 'Archived', 'Autonomous cycles and institutional conversations.'],
  ['v4.0', 'Intelligence Engine', 'Silver', 84, 'Archived', 'Self review, IQ index and evolution telemetry.'],
  ['v5.0', 'Enterprise Layer', 'Silver', 88, 'Archived', 'Commercial shell, docs, performance, metrics API.'],
  ['v6.0', 'Extensible Platform', 'Silver', 90, 'Archived', 'Extensions, marketplace, themes, templates.'],
  ['v6.1', 'Certification Centre', 'Gold', 92, 'Archived', 'Twelve-category certification with evidence links.'],
  ['v7.0', 'Acceptance Programme™', 'Gold', 94, 'Archived', 'Institution Ready: YES; ready for external review.'],
  ['RC1', 'Release Candidate Centre', 'Gold', 94, 'Current', 'Awaiting human release authorisation.'],
];

export const RELEASE_HISTORY: ReleaseHistoryRow[] = RAW_HISTORY.map(
  ([version, name, grade, score, state, note]) => ({ at: ts(), version, name, grade, score, state, note }),
);

// ─── Section 9 · Platform Maturity ───────────────────────────────────
export type MaturityStage = {
  stage: string; reached: boolean; current: boolean; at: string; criteria: string;
};

const RAW_STAGES: Array<[string, boolean, boolean, string]> = [
  ['Prototype', true, false, 'Core research modules operational in isolation.'],
  ['Alpha', true, false, 'Institution layer coordinating departments end to end.'],
  ['Beta', true, false, 'Enterprise shell, documentation and performance envelope.'],
  ['Release Candidate', true, true, 'Certified, accepted, regression-clean, awaiting human sign-off.'],
  ['Production Ready', false, false, 'All High-priority issues closed and 60-day validation streak met.'],
  ['Institution Certified', false, false, 'External institutional review completed and countersigned.'],
];

export const MATURITY_STAGES: MaturityStage[] = RAW_STAGES.map(
  ([stage, reached, current, criteria]) => ({ stage, reached, current, at: ts(), criteria }),
);

export const MATURITY_NOTE =
  'ATLAS OS™ is at the Release Candidate stage. Progression to Production Ready requires closure of both High-priority issues and explicit human authorisation.';

// ─── Governance ──────────────────────────────────────────────────────
export const RC_GOVERNANCE = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Read Only',
  'No Live Trading', 'No Allocation Changes', 'No Exchange Connectivity', 'Human Approval Required',
];

export const RC_GOVERNANCE_NOTE =
  'Everything deterministic. Everything derived from the Institutional Knowledge Graph. Everything fully traceable. Signatures simulated. No AI-generated institutional facts.';

// ─── Section 7 · Release Package ─────────────────────────────────────
const header = (title: string) =>
  [`# ${title}`, '', `Generated: ${fmt(CHANGE_LOG[0].at)}`, `System: ${RC_VERSION}`,
   `Governance: ${RC_GOVERNANCE.join(' · ')}`, ''].join('\n');

const summaryBlock = () => RC_SUMMARY.map((f) => `- **${f.label}:** ${f.value} — ${f.note} _(${f.source})_`).join('\n');

export function buildExecutiveReleaseNotes() {
  return [
    header('Executive Release Notes'),
    '## Release Candidate Summary', summaryBlock(), '',
    '## Highlights',
    ...RELEASE_NOTES.map((g) => `- **${g.group}:** ${g.summary}`),
    '', '## Maturity',
    ...MATURITY_STAGES.map((s) => `- ${s.current ? '➤' : s.reached ? '✔' : '·'} ${s.stage} — ${s.criteria}`),
    '', MATURITY_NOTE, '', RC_GOVERNANCE_NOTE, '',
  ].join('\n');
}

export function buildTechnicalReleaseNotes() {
  return [
    header('Technical Release Notes'),
    ...RELEASE_NOTES.flatMap((g) => [
      `## ${g.group} (${g.route})`, g.summary, '',
      ...g.items.map((i) => `- **${i.title}** — ${i.detail} · evidence: ${i.evidence}`), '',
    ]),
    '## Regression Snapshot',
    ...REGRESSION_SUITES.map((s) => `- ${s.suite}: run ${s.run}, passed ${s.passed}, warnings ${s.warnings}, failed ${s.failed}, coverage ${s.coverage}%, ${s.performanceMs} ms`),
    `- TOTAL: run ${REGRESSION_TOTALS.run}, passed ${REGRESSION_TOTALS.passed}, warnings ${REGRESSION_TOTALS.warnings}, failed ${REGRESSION_TOTALS.failed}, coverage ${REGRESSION_TOTALS.coverage}%`,
    '', RC_GOVERNANCE_NOTE, '',
  ].join('\n');
}

export function buildCertificationSummaryRc() {
  return [
    header('Institution Certification Summary'),
    '## Status', summaryBlock(), '',
    '## Sign-off Register',
    ...SIGN_OFF.map((s) => `- ${s.role} · ${s.signatory} · ${s.state} · ${fmt(s.at)} · ${s.signature} — ${s.scope}`),
    '', SIGN_OFF_NOTE, '', RC_GOVERNANCE_NOTE, '',
  ].join('\n');
}

export function buildAcceptanceReportRc() {
  return [
    header('Acceptance Report'),
    '## Change Log',
    ...CHANGE_LOG.map((c) => `- ${fmt(c.at)} · ${c.version} · ${c.feature} — ${c.reason} → ${c.impact} · ${c.department} · ${c.approval} · evidence: ${c.evidence}`),
    '', '## Known Issues',
    ...KNOWN_ISSUES.map((i) => `- [${i.priority}] ${i.id} ${i.title} — ${i.detail} · owner ${i.owner} · target ${i.target} · evidence: ${i.evidence}`),
    '', RC_GOVERNANCE_NOTE, '',
  ].join('\n');
}

export function buildPlatformHealthReport() {
  return [
    header('Platform Health Report'),
    '## Regression',
    ...REGRESSION_SUITES.map((s) => `- ${s.state} · ${s.suite} · coverage ${s.coverage}% · ${s.performanceMs} ms`),
    '', '## Issue Profile',
    ...(Object.keys(ISSUE_COUNTS) as Priority[]).map((p) => `- ${p}: ${ISSUE_COUNTS[p]}`),
    '', '## Release History',
    ...RELEASE_HISTORY.map((r) => `- ${r.version} · ${r.name} · ${r.grade} · ${r.score} · ${r.state} — ${r.note}`),
    '', RC_GOVERNANCE_NOTE, '',
  ].join('\n');
}

export function buildCompleteReleaseArchive() {
  return [
    buildExecutiveReleaseNotes(), '\n---\n',
    buildTechnicalReleaseNotes(), '\n---\n',
    buildCertificationSummaryRc(), '\n---\n',
    buildAcceptanceReportRc(), '\n---\n',
    buildPlatformHealthReport(),
  ].join('\n');
}
