/* ══════════════════════════════════════════════════════════════
   ATLAS OS™ — Executive Demonstration™ (Sprint 6)
   PRESENTATION LAYER ONLY.
   This module reads existing institutional data and composes an
   executive narrative. It never mutates state, scores, governance,
   memory, analytics, trading or simulation behaviour.
   ══════════════════════════════════════════════════════════════ */

import {
  institutionMetrics, institutionScore, analyticsCharts, allDepartmentStats,
  type SeriesPoint,
} from '@/lib/institutionOS';
import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, GOVERNANCE_GUARANTEES, EVOLUTION_STAGES,
} from '@/lib/knowledgeGraph';
import { institutionIQ, qualityIndex, learningStats } from '@/lib/institutionIntelligence';
import { memoryStats } from '@/lib/institutionalMemory';
import { getExecutiveSummary } from '@/lib/maintenance';
import { testSummary } from '@/lib/validation';

export const DEMO_VERSION = 'ATLAS OS™ v1.1 · Executive Demonstration™';

export type DemoDuration = 5 | 10 | 15;

export const DEMO_DURATIONS: { minutes: DemoDuration; label: string; blurb: string }[] = [
  { minutes: 5, label: '5 minutes', blurb: 'Boardroom briefing — headline position and governance posture.' },
  { minutes: 10, label: '10 minutes', blurb: 'Investor session — evidence, analytics and institutional memory.' },
  { minutes: 15, label: '15 minutes', blurb: 'Full institutional walkthrough — every department, in depth.' },
];

export interface DemoMetric { label: string; value: string; sub: string }
export interface DemoLink { label: string; to: string }

export interface DemoChapter {
  id: string;
  title: string;
  kicker: string;
  /** Weight used to distribute the selected duration across chapters. */
  weight: number;
  /** Executive narrative — spoken register. */
  narrative: string;
  whyExists: string;
  whatItMeasures: string;
  whyExecutivesCare: string;
  howItConnects: string;
  metrics: DemoMetric[];
  points: string[];
  chart?: { label: string; unit: string; data: { name: string; value: number }[] };
  links: DemoLink[];
}

const pct = (n: number) => `${Math.round(n)}%`;
const num = (n: number) => n.toLocaleString('en-GB');

function seriesFor(key: string): { label: string; unit: string; data: { name: string; value: number }[] } | undefined {
  const chart = analyticsCharts().find((c) => c.key === key);
  if (!chart) return undefined;
  const raw = chart.data as (SeriesPoint | { name: string; value: number })[];
  const data = raw.map((p) =>
    'name' in p ? { name: p.name, value: p.value } : { name: p.date.slice(5), value: p.value });
  return { label: chart.label, unit: chart.unit, data: data.slice(-14) };
}

/** Builds the nine-chapter executive story from live institutional readings. */
export function demoChapters(): DemoChapter[] {
  const score = institutionScore();
  const iq = institutionIQ();
  const metrics = institutionMetrics();
  const mem = memoryStats();
  const maint = getExecutiveSummary();
  const tests = testSummary();
  const quality = qualityIndex();
  const learning = learningStats();
  const depts = allDepartmentStats();

  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated').length;
  const rejected = KNOWLEDGE_NODES.filter((n) => n.status === 'rejected').length;
  const avgConfidence = Math.round(
    KNOWLEDGE_NODES.reduce((s, n) => s + n.confidence, 0) / Math.max(1, KNOWLEDGE_NODES.length));
  const avgEvidence = Math.round(
    KNOWLEDGE_NODES.reduce((s, n) => s + n.evidenceScore, 0) / Math.max(1, KNOWLEDGE_NODES.length));
  const headline = metrics.slice(0, 3);

  return [
    {
      id: 'institution',
      title: 'The Institution',
      kicker: 'Chapter One',
      weight: 1.15,
      narrative:
        'ATLAS OS is not a dashboard. It is a research institution rendered in software — with departments, a constitution, a permanent memory and an intelligence that compounds. Everything you are about to see is one continuous chain of reasoning.',
      whyExists: 'A single institutional identity so that every department, score and decision has one accountable centre of gravity.',
      whatItMeasures: 'Institution Score, Institution IQ, governance posture and the breadth of accumulated knowledge.',
      whyExecutivesCare: 'It answers the first boardroom question in one number: is this organisation improving, and can it prove it?',
      howItConnects: 'Every subsequent chapter is a component of these two headline indices.',
      metrics: [
        { label: 'Institution Score', value: `${score.total}`, sub: `Grade ${score.grade}` },
        { label: 'Institution IQ', value: `${iq.total}`, sub: `${iq.band} · ${iq.grade}` },
        { label: 'Departments', value: `${depts.length}`, sub: 'Autonomous AI departments' },
        { label: 'Governance', value: `${GOVERNANCE_GUARANTEES.length}`, sub: 'Standing guarantees' },
      ],
      points: [
        ...headline.map((m) => `${m.label}: ${m.value} — ${m.sub}`),
        `Simulation and research only — no exchange connectivity, no API keys, no live capital.`,
      ],
      links: [{ label: 'Institution Dashboard', to: '/institution' }, { label: 'Institution IQ', to: '/institution/iq' }],
    },
    {
      id: 'knowledge',
      title: 'Knowledge Graph',
      kicker: 'Chapter Two',
      weight: 1.1,
      narrative:
        'Beneath the institution sits a typed knowledge graph. Every question, hypothesis, experiment, rejection and promotion is an object; every claim carries evidence and a confidence value; every relationship is traceable in both directions.',
      whyExists: 'To make institutional knowledge structural rather than anecdotal — nothing survives without a citation.',
      whatItMeasures: 'Object count, relationship density, evidence strength and stated confidence.',
      whyExecutivesCare: 'It is the audit trail. Any conclusion in this presentation can be traced to its originating evidence in two clicks.',
      howItConnects: 'Research writes into it, Analytics measures it, Oracle answers from it, Memory preserves it.',
      metrics: [
        { label: 'Objects', value: num(KNOWLEDGE_NODES.length), sub: 'Typed knowledge nodes' },
        { label: 'Relationships', value: num(KNOWLEDGE_EDGES.length), sub: 'Directed, typed edges' },
        { label: 'Evidence Score', value: pct(avgEvidence), sub: 'Institution-wide mean' },
        { label: 'Confidence', value: pct(avgConfidence), sub: 'Institution-wide mean' },
      ],
      points: [
        `${validated} objects validated, ${rejected} formally rejected and retained as negative knowledge.`,
        `Quality index ${quality.total} (${quality.grade}) across ${quality.objects} scored objects.`,
        'Confidence is calculated from evidence, never asserted.',
      ],
      chart: seriesFor('knowledge-growth'),
      links: [{ label: 'Knowledge Graph', to: '/knowledge-graph' }, { label: 'Intelligence Explorer', to: '/explorer' }],
    },
    {
      id: 'research',
      title: 'Research',
      kicker: 'Chapter Three',
      weight: 1.1,
      narrative:
        'Research follows one lifecycle, without exception: question, hypothesis, experiment, simulation, validation, review. A strategy cannot skip a stage, and a favourable result is not a verdict until it has survived out-of-sample forward validation.',
      whyExists: 'To convert market curiosity into falsifiable, reproducible institutional findings.',
      whatItMeasures: 'Lifecycle throughput, evidence attached per stage, and validation survival rates.',
      whyExecutivesCare: 'It is the difference between a backtest and a defensible conclusion.',
      howItConnects: 'Every research outcome — positive or negative — is written to the Knowledge Graph and Memory.',
      metrics: [
        { label: 'Lifecycle Stages', value: `${EVOLUTION_STAGES.length}`, sub: 'Mandatory, ordered' },
        { label: 'Validated', value: num(validated), sub: 'Survived out-of-sample' },
        { label: 'Rejected', value: num(rejected), sub: 'Preserved as evidence' },
        { label: 'Workflow Integrity', value: pct(tests.health), sub: 'Chain verified end-to-end' },
      ],
      points: [
        EVOLUTION_STAGES.join(' → '),
        'Simulation only: virtual execution with modelled fees, slippage and confirmed-close delay.',
        'Rejections are first-class knowledge — the institution cannot repeat a failed line of enquiry.',
      ],
      chart: seriesFor('evidence-growth'),
      links: [{ label: 'Experiments', to: '/experiments' }, { label: 'Forward Validation', to: '/forward-validation' }],
    },
    {
      id: 'analytics',
      title: 'Analytics',
      kicker: 'Chapter Four',
      weight: 1,
      narrative:
        'Analytics is where the institution watches itself grow. Knowledge, evidence and confidence are tracked as time series, departmental contribution is measured, and learning is scored rather than assumed.',
      whyExists: 'To detect institutional growth or stagnation early, using the same rigour applied to strategies.',
      whatItMeasures: 'Growth curves, confidence trend, departmental output and learning velocity.',
      whyExecutivesCare: 'It shows whether the organisation is compounding — the only sustainable competitive asset.',
      howItConnects: 'Analytics reads the graph and feeds the IQ index and executive recommendations.',
      metrics: [
        { label: 'Confidence Trend', value: pct(avgConfidence), sub: 'Rising with evidence' },
        { label: 'Departments', value: `${depts.length}`, sub: 'All reporting' },
        { label: 'Lessons Learned', value: `${learning.total}`, sub: `${learning.recent} in last 30 days` },
        { label: 'Learning Score', value: `${Math.round(learning.score)}`, sub: 'Adaptation index' },
      ],
      points: [
        `Quality components averaged across ${quality.objects} objects; ${quality.exceptional} rated exceptional.`,
        `Institution IQ ${iq.total} versus ${iq.previous} in the prior window — ${iq.trend}.`,
        'Every chart is backed by named evidence objects, not aggregate estimates.',
      ],
      chart: seriesFor('confidence-trend'),
      links: [{ label: 'Analytics Hub', to: '/institution/analytics' }, { label: 'Institution Learning', to: '/institution/learning' }],
    },
    {
      id: 'governance',
      title: 'Governance',
      kicker: 'Chapter Five',
      weight: 1,
      narrative:
        'Governance is the institution’s constitution, and it is deliberately restrictive. Promotion requires evidence thresholds, runtime and human approval. Nothing self-promotes, nothing trades, nothing escapes the audit log.',
      whyExists: 'To guarantee that intelligence never outruns oversight.',
      whatItMeasures: 'Rule coverage, promotion gates, approval events and audit completeness.',
      whyExecutivesCare: 'It is the risk answer: capability is bounded by policy, and the boundary is enforced in code.',
      howItConnects: 'Every promotion, allocation and recommendation passes this gate before reaching memory.',
      metrics: [
        { label: 'Guarantees', value: `${GOVERNANCE_GUARANTEES.length}`, sub: 'Always enforced' },
        { label: 'Governance Score', value: `${maint.governanceScore}`, sub: 'Audited nightly' },
        { label: 'Approval', value: 'Human', sub: 'Required for every promotion' },
        { label: 'Live Trading', value: 'Disabled', sub: 'Structurally, not by setting' },
      ],
      points: GOVERNANCE_GUARANTEES.slice(0, 6),
      links: [{ label: 'Governance', to: '/governance' }, { label: 'Promotion Board', to: '/promotion-board' }],
    },
    {
      id: 'memory',
      title: 'Institutional Memory',
      kicker: 'Chapter Six',
      weight: 1,
      narrative:
        'Most organisations forget. ATLAS does not. Executive conversations, reasoning, decisions and rejected ideas are written to a permanent, citation-backed ledger that survives every session.',
      whyExists: 'To make institutional knowledge independent of the people and sessions that produced it.',
      whatItMeasures: 'Records held, citation rate, contributing departments and retention depth.',
      whyExecutivesCare: 'It removes key-person risk and makes historical reasoning re-examinable years later.',
      howItConnects: 'Memory cites the Knowledge Graph and supplies the Oracle with historical context.',
      metrics: [
        { label: 'Records', value: num(mem.total), sub: `${mem.recorded} added in-session` },
        { label: 'Citations', value: num(mem.citations), sub: `${mem.citationRate}% cited` },
        { label: 'Departments', value: `${mem.departments}`, sub: 'Contributing' },
        { label: 'Retention', value: 'Permanent', sub: `Oldest ${mem.oldest}` },
      ],
      points: [
        'Executive conversations are preserved with their supporting evidence, not just their conclusions.',
        'Historical reasoning can be replayed exactly as it stood on the day it was recorded.',
        'Nothing is silently overwritten — corrections are appended as new records.',
      ],
      links: [{ label: 'Institutional Memory', to: '/institution/memory' }, { label: 'Institution History', to: '/institution/history' }],
    },
    {
      id: 'maintenance',
      title: 'Maintenance',
      kicker: 'Chapter Seven',
      weight: 0.9,
      narrative:
        'The institution maintains itself. Every night it inspects its own modules, workflows, knowledge integrity and performance, repairs what it safely can, and escalates the rest to a human with a written explanation.',
      whyExists: 'To keep an institution of this size operable without a standing engineering rota.',
      whatItMeasures: 'Module health, warnings, automated repairs and monitoring coverage.',
      whyExecutivesCare: 'Operational reliability is the precondition for trusting anything else in the presentation.',
      howItConnects: 'Maintenance findings become recommendations, which enter the same governance gate.',
      metrics: [
        { label: 'Institution Health', value: `${maint.institutionHealth}`, sub: `${maint.modulesHealthy}/${maint.modulesChecked} modules healthy` },
        { label: 'Warnings', value: `${maint.warnings}`, sub: `${maint.criticalIssues} critical` },
        { label: 'Auto Repairs', value: `${maint.autoRepairsToday}`, sub: 'Applied today' },
        { label: 'Next Cycle', value: '04:00', sub: 'UTC, nightly' },
      ],
      points: [
        maint.latestCycle,
        'Auto-repair is bounded: presentation and integrity fixes only, never research or governance data.',
        'The Executive Assistant explains every finding in plain English before any action is proposed.',
      ],
      links: [{ label: 'AI Maintenance', to: '/maintenance' }, { label: 'Institution Health', to: '/institution/health' }],
    },
    {
      id: 'certification',
      title: 'Certification',
      kicker: 'Chapter Eight',
      weight: 0.9,
      narrative:
        'Before ATLAS presents itself, it certifies itself. Modules are tested across load, navigation, search, exports, performance, accessibility and responsiveness, and the result is published — including the failures.',
      whyExists: 'To hold the platform to the same evidentiary standard it applies to strategies.',
      whatItMeasures: 'Test coverage, pass rate, readiness score and executive-grade consistency.',
      whyExecutivesCare: 'It converts “it looks finished” into a measured, reproducible readiness position.',
      howItConnects: 'Certification gates the release candidate and the acceptance programme.',
      metrics: [
        { label: 'Readiness', value: `${tests.readiness}`, sub: `Launch score ${tests.launchScore}` },
        { label: 'Checks', value: num(tests.checks), sub: `${tests.modules} modules` },
        { label: 'Passed', value: num(tests.passed), sub: `${tests.warnings} warnings · ${tests.failed} failed` },
        { label: 'Accessibility', value: `${maint.accessibilityScore}`, sub: `UI consistency ${maint.uiConsistencyScore}` },
      ],
      points: [
        tests.verdict,
        `Coverage ${tests.coverage}% across the certified module set.`,
        'Documentation, architecture and accessibility are certified alongside functionality.',
      ],
      links: [{ label: 'Certification Centre', to: '/certification' }, { label: 'Validation Centre', to: '/validation-centre' }],
    },
    {
      id: 'roadmap',
      title: 'Roadmap',
      kicker: 'Chapter Nine',
      weight: 0.85,
      narrative:
        'ATLAS has moved from a research tool, to an operating system, to a living institution. What follows is deeper autonomy under unchanged governance — the institution gets cleverer, the constitution does not loosen.',
      whyExists: 'To set expectations honestly: what is delivered, what is running, and what is still a hypothesis.',
      whatItMeasures: 'Phase completion, current work and the stated future vision.',
      whyExecutivesCare: 'It distinguishes shipped capability from ambition — a distinction most demonstrations blur.',
      howItConnects: 'Each roadmap phase is itself an object in the Knowledge Graph with its own evidence.',
      metrics: [
        { label: 'Completed', value: 'Phases 1–7', sub: 'OS, intelligence, certification' },
        { label: 'Current', value: 'Phase 8', sub: 'The Living Institution™' },
        { label: 'Next', value: 'Phase 9', sub: 'Executive Demonstration & autonomy' },
        { label: 'Governance', value: 'Unchanged', sub: 'Research and simulation only' },
      ],
      points: [
        'Completed — Knowledge Graph, Oracle, Analytics, Governance, Memory, Maintenance, Certification.',
        'Current — self-review, narrative reporting and predictive forecasting under human approval.',
        'Future vision — an institution that proposes its own research agenda and defends it with evidence.',
      ],
      links: [{ label: 'Future Roadmap', to: '/roadmap' }, { label: 'Institution Evolution', to: '/institution/evolution' }],
    },
  ];
}

export interface DemoSummary {
  status: string;
  findings: string[];
  strengths: string[];
  opportunities: string[];
  nextSteps: string[];
}

/** Closing executive summary — a reading of existing indices, not a new calculation. */
export function demoSummary(): DemoSummary {
  const score = institutionScore();
  const iq = institutionIQ();
  const mem = memoryStats();
  const maint = getExecutiveSummary();
  const tests = testSummary();
  const quality = qualityIndex();

  return {
    status: `Institution Score ${score.total} (${score.grade}) · Institution IQ ${iq.total} (${iq.band}) · Health ${maint.institutionHealth} · Readiness ${tests.readiness}`,
    findings: [
      `${num(KNOWLEDGE_NODES.length)} knowledge objects and ${num(KNOWLEDGE_EDGES.length)} typed relationships underpin every conclusion presented.`,
      `${mem.citationRate}% of institutional memory records carry explicit citations.`,
      `Certification recorded ${tests.passed} passing checks with ${tests.failed} failures and ${tests.warnings} warnings.`,
      `Quality index ${quality.total} (${quality.grade}); ${quality.weak} objects flagged for strengthening.`,
    ],
    strengths: [
      'Complete evidence traceability from question to promotion to permanent memory.',
      'Governance enforced structurally — research and simulation only, human approval required.',
      'Self-maintaining operations with nightly inspection and bounded automated repair.',
      'Specialist research portfolio validated out-of-sample before any promotion verdict.',
    ],
    opportunities: [
      `${maint.warnings} open maintenance warnings await executive review.`,
      `${quality.weak} knowledge objects sit below the quality threshold and need further evidence.`,
      'Forward-validation windows remain the binding constraint on promotion velocity.',
    ],
    nextSteps: [
      'Review the open recommendations and approve or decline each with recorded reasoning.',
      'Continue forward validation to the 60-day, 50-trade governance threshold.',
      'Export the executive report and circulate with the certification appendix.',
    ],
  };
}
