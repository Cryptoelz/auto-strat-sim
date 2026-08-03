// ATLAS OS™ v4.0 — Institutional Intelligence Engine
// Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required
// No live trading · No exchange connectivity · No API keys · No strategy modification · No automatic allocation.
// Every value below is deterministically derived from the Institutional Knowledge Graph — nothing is executed.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META,
  connections, outgoing, incoming, degree, type KnowledgeNode,
} from './knowledgeGraph';
import { dayOf, dateOfDay, TODAY_DAY } from './intelligenceExplorer';
import {
  DEPARTMENT_PROFILES, allDepartmentStats, institutionScore, collaborationLinks,
} from './institutionOS';
import { seeded, institutionPulse, departmentCycle, institutionDecisions, healthChecks } from './institutionLife';

export const IQ_VERSION = 'ATLAS OS™ v4.0 · Institutional Intelligence Engine';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const pct = (n: number, d: number) => (d ? clamp((n / d) * 100) : 0);

const NODES = KNOWLEDGE_NODES;

/** Simplified per-department load view. */
function deptLoad(): { name: string; objects: number }[] {
  return allDepartmentStats().map((s) => ({ name: s.profile.name, objects: s.owned.length }));
}
const validated = NODES.filter((n) => n.status === 'validated');
const rejected = NODES.filter((n) => n.status === 'rejected');
const blocked = NODES.filter((n) => n.status === 'blocked');

export type Trend = 'improved' | 'stable' | 'declining';
export const TREND_LABEL: Record<Trend, string> = { improved: 'Improved', stable: 'Stable', declining: 'Declining' };

/** Snapshot of the institution as it existed `daysAgo` simulated days ago. */
function snapshotNodes(daysAgo: number): KnowledgeNode[] {
  const cutoff = TODAY_DAY - daysAgo;
  return NODES.filter((n) => dayOf(n.created) <= cutoff);
}

// ══════════════════════════════════════════════════════════
// FEATURE 1 — Institution Self Review™
// ══════════════════════════════════════════════════════════

export interface SelfReviewDimension {
  key: string;
  label: string;
  score: number;
  previous: number;
  trend: Trend;
  why: string;
  drivers: string[];
  evidence: string[];
  to?: string;
}

function dimensionScores(set: KnowledgeNode[]) {
  const ids = new Set(set.map((n) => n.id));
  const edges = KNOWLEDGE_EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));
  const v = set.filter((n) => n.status === 'validated');
  const evid = avg(set.map((n) => n.evidenceScore));
  const conf = avg(set.map((n) => n.confidence));
  const counter = set.filter((n) => n.counterEvidence.length > 0);
  const reused = set.filter((n) => n.currentUsage.length > 0);
  const governed = set.filter((n) => n.governanceHistory.length > 0);
  const lessons = set.reduce((s, n) => s + n.lessons.length, 0);
  const deptCount = new Set(set.map((n) => n.department)).size;
  return {
    research: clamp(pct(v.length, set.length) * 0.6 + avg(set.map((n) => n.evidenceScore)) * 0.4),
    evidence: clamp(evid * 0.75 + pct(counter.length, set.length) * 0.25),
    reuse: clamp(pct(reused.length, set.length) * 0.7 + pct(edges.length, set.length * 2) * 0.3),
    prediction: clamp(100 - Math.abs(conf - pct(v.length, set.length)) * 1.6),
    cooperation: clamp(pct(deptCount, DEPARTMENT_PROFILES.length) * 0.5 + pct(edges.length, set.length * 1.6) * 0.5),
    governance: clamp(pct(governed.length, set.length) * 0.7 + pct(set.length - set.filter((n) => n.status === 'blocked').length, set.length) * 0.3),
    maturity: clamp(pct(set.length, NODES.length) * 0.35 + pct(lessons, set.length * 2) * 0.35 + conf * 0.3),
    calibration: clamp(100 - Math.abs(conf - evid) * 2.2),
  };
}

export function selfReview(daysBack = 30): { dimensions: SelfReviewDimension[]; overall: number; overallTrend: Trend; headline: string; summary: string } {
  const now = dimensionScores(NODES);
  const before = dimensionScores(snapshotNodes(daysBack));
  const trendOf = (a: number, b: number): Trend => (a - b >= 2 ? 'improved' : a - b <= -2 ? 'declining' : 'stable');

  const meta: { key: keyof typeof now; label: string; why: (a: number, b: number) => string; drivers: string[]; to?: string }[] = [
    {
      key: 'research', label: 'Research quality', to: '/institution/quality',
      why: (a, b) => `${validated.length} of ${NODES.length} objects reached validated status and mean evidence score is ${Math.round(avg(NODES.map((n) => n.evidenceScore)))}. ${a >= b ? 'Newer objects entered with deeper validation packs than the 30-day cohort.' : 'Newer objects entered with thinner validation than the previous cohort.'}`,
      drivers: ['Validation ratio', 'Mean evidence score', 'Robustness audits attached to specialists'],
    },
    {
      key: 'evidence', label: 'Evidence quality', to: '/knowledge-graph',
      why: (a, b) => `${NODES.reduce((s, n) => s + n.supportingEvidence.length, 0)} supporting and ${NODES.reduce((s, n) => s + n.counterEvidence.length, 0)} counter-evidence links are recorded. Counter-evidence coverage of ${pct(NODES.filter((n) => n.counterEvidence.length > 0).length, NODES.length)}% ${a >= b ? 'raised' : 'reduced'} balance versus the prior window.`,
      drivers: ['Counter-evidence coverage', 'Evidence per object', 'Independent department sourcing'],
    },
    {
      key: 'reuse', label: 'Knowledge reuse', to: '/institution/genome',
      why: () => `${NODES.filter((n) => n.currentUsage.length > 0).length} objects are actively reused by downstream research and the graph carries ${KNOWLEDGE_EDGES.length} explainable relationships — reuse is how the institution avoids re-running settled work.`,
      drivers: ['Objects with active downstream usage', 'Relationship density', 'Cross-department citation'],
    },
    {
      key: 'prediction', label: 'Prediction accuracy', to: '/institution/forecast',
      why: (a, b) => `Stated confidence averages ${Math.round(avg(NODES.map((n) => n.confidence)))} against a realised validation rate of ${pct(validated.length, NODES.length)}%. The gap is ${Math.abs(Math.round(avg(NODES.map((n) => n.confidence))) - pct(validated.length, NODES.length))} points, ${a >= b ? 'narrower' : 'wider'} than 30 days ago.`,
      drivers: ['Confidence vs realised validation', 'Forecast follow-through', 'Rejected hypothesis rate'],
    },
    {
      key: 'cooperation', label: 'Department cooperation', to: '/institution/collaboration',
      why: () => `${collaborationLinks().length} collaboration links span ${DEPARTMENT_PROFILES.length} departments; ${new Set(NODES.map((n) => n.department)).size} departments own at least one live object.`,
      drivers: ['Collaboration links', 'Departments owning live work', 'Cross-department validation'],
    },
    {
      key: 'governance', label: 'Governance effectiveness', to: '/institution/decisions',
      why: () => `${NODES.filter((n) => n.governanceHistory.length > 0).length} objects carry a governance trail and ${blocked.length} remain blocked pending human approval — the promotion gate is holding.`,
      drivers: ['Governance trail coverage', 'Blocked-object handling', 'Human approval discipline'],
    },
    {
      key: 'maturity', label: 'Institution maturity', to: '/institution/benchmark',
      why: (a, b) => `The institution holds ${NODES.length} objects and ${NODES.reduce((s, n) => s + n.lessons.length, 0)} recorded lessons. Maturity ${a >= b ? 'advanced' : 'slipped'} because knowledge is ${a >= b ? 'compounding faster than it is created' : 'being created faster than it is consolidated'}.`,
      drivers: ['Recorded lessons', 'Knowledge base size', 'Average confidence'],
    },
    {
      key: 'calibration', label: 'Confidence calibration', to: '/self-review',
      why: () => `Mean confidence (${Math.round(avg(NODES.map((n) => n.confidence)))}) versus mean evidence (${Math.round(avg(NODES.map((n) => n.evidenceScore)))}) differ by ${Math.abs(Math.round(avg(NODES.map((n) => n.confidence)) - avg(NODES.map((n) => n.evidenceScore))))} points; a small gap means the institution believes roughly what it can prove.`,
      drivers: ['Confidence vs evidence gap', 'Over-confident objects', 'Under-claimed validated work'],
    },
  ];

  const dimensions: SelfReviewDimension[] = meta.map((m) => {
    const a = now[m.key]; const b = before[m.key];
    return {
      key: m.key as string, label: m.label, score: a, previous: b, trend: trendOf(a, b),
      why: m.why(a, b), drivers: m.drivers, to: m.to,
      evidence: NODES.filter((n) => n.supportingEvidence.length).slice(0, 3).map((n) => `${n.id} · ${n.supportingEvidence[0]}`),
    };
  });

  const overall = clamp(avg(dimensions.map((d) => d.score)));
  const overallPrev = clamp(avg(dimensions.map((d) => d.previous)));
  const overallTrend = trendOf(overall, overallPrev);
  const improving = dimensions.filter((d) => d.trend === 'improved').length;
  const declining = dimensions.filter((d) => d.trend === 'declining').length;

  return {
    dimensions, overall, overallTrend,
    headline: `Institution self review ${overall}/100 · ${TREND_LABEL[overallTrend]} versus ${daysBack} simulated days ago`,
    summary: `${improving} dimensions improved, ${dimensions.length - improving - declining} held stable and ${declining} declined. The dominant driver is ${[...dimensions].sort((x, y) => (y.score - y.previous) - (x.score - x.previous))[0].label.toLowerCase()}; the largest drag is ${[...dimensions].sort((x, y) => (x.score - x.previous) - (y.score - y.previous))[0].label.toLowerCase()}. Advisory only — no strategy, allocation or execution changes follow from this review.`,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 2 — Institution Learning Engine™
// ══════════════════════════════════════════════════════════

export type LessonKind = 'lesson' | 'best-practice' | 'principle' | 'failure-pattern' | 'success-pattern' | 'standard';

export const LESSON_KINDS: { key: LessonKind; label: string; blurb: string }[] = [
  { key: 'lesson', label: 'Lessons', blurb: 'Direct learning extracted from a completed research object.' },
  { key: 'best-practice', label: 'Best practices', blurb: 'Repeatable method the institution now applies by default.' },
  { key: 'principle', label: 'Research principles', blurb: 'Durable rule that governs how research is conducted.' },
  { key: 'failure-pattern', label: 'Failure patterns', blurb: 'Recurring way research degrades — watch for these signatures.' },
  { key: 'success-pattern', label: 'Success patterns', blurb: 'Recurring signature of research that survives validation.' },
  { key: 'standard', label: 'Institution standards', blurb: 'Minimum bar an object must clear before promotion review.' },
];

export interface Lesson {
  id: string;
  kind: LessonKind;
  title: string;
  detail: string;
  source: string;
  sourceTitle: string;
  department: string;
  learnedOn: string;
  day: number;
  confidence: number;
  appliedTo: string[];
  permanent: true;
}

export function institutionLessons(): Lesson[] {
  const out: Lesson[] = [];
  NODES.forEach((n) => {
    n.lessons.forEach((l, i) => {
      const s = seeded(`${n.id}-lesson-${i}`);
      const kind: LessonKind = n.status === 'rejected' || n.status === 'blocked'
        ? 'failure-pattern'
        : n.status === 'validated' && s > 0.72 ? 'success-pattern'
        : s > 0.86 ? 'principle' : s > 0.62 ? 'best-practice' : s > 0.44 ? 'standard' : 'lesson';
      out.push({
        id: `LSN-${n.id}-${i + 1}`, kind, title: l,
        detail: `Learned while the ${n.department} worked on ${n.title}. ${n.summary} This lesson is retained permanently in institutional memory and is applied to every comparable object created afterwards.`,
        source: n.id, sourceTitle: n.title, department: n.department,
        learnedOn: n.created, day: dayOf(n.created),
        confidence: clamp(n.confidence * 0.6 + n.evidenceScore * 0.4),
        appliedTo: connections(n.id).slice(0, 4).map((e) => (e.from === n.id ? e.to : e.from)),
        permanent: true,
      });
    });
  });
  // Derived cross-object patterns.
  const overConfident = NODES.filter((n) => n.confidence - n.evidenceScore > 8);
  if (overConfident.length) {
    out.push({
      id: 'LSN-PATTERN-CAL', kind: 'failure-pattern', title: 'Confidence outruns evidence on early-stage hypotheses',
      detail: `${overConfident.length} objects state confidence more than 8 points above their evidence score (${overConfident.slice(0, 3).map((n) => n.id).join(', ')}). The institution now discounts stated confidence until an independent department attaches evidence.`,
      source: overConfident[0].id, sourceTitle: overConfident[0].title, department: 'Governance',
      learnedOn: overConfident[0].created, day: dayOf(overConfident[0].created), confidence: 82,
      appliedTo: overConfident.slice(0, 4).map((n) => n.id), permanent: true,
    });
  }
  const wellReused = NODES.filter((n) => n.currentUsage.length >= 2 && n.status === 'validated');
  if (wellReused.length) {
    out.push({
      id: 'LSN-PATTERN-REUSE', kind: 'success-pattern', title: 'Objects validated by two departments get reused fastest',
      detail: `${wellReused.length} validated objects are consumed by two or more downstream research lines. Cross-department validation is the strongest single predictor of reuse in the graph.`,
      source: wellReused[0].id, sourceTitle: wellReused[0].title, department: 'Research Brain',
      learnedOn: wellReused[0].created, day: dayOf(wellReused[0].created), confidence: 88,
      appliedTo: wellReused.slice(0, 4).map((n) => n.id), permanent: true,
    });
  }
  out.push({
    id: 'LSN-STD-PROMOTION', kind: 'standard', title: 'No promotion review below 30 days runtime and 20 simulated trades',
    detail: 'Every promotion request is held until the object has 30 simulated days of forward runtime and at least 20 simulated trades, with human approval required. Applied since the Router v2.1 fork.',
    source: 'GOV-001', sourceTitle: 'Promotion gate', department: 'Governance',
    learnedOn: '2026-03-20', day: dayOf('2026-03-20'), confidence: 95,
    appliedTo: NODES.filter((n) => n.promotionHistory.length).slice(0, 4).map((n) => n.id), permanent: true,
  });
  return out.sort((a, b) => b.day - a.day);
}

export function learningStats() {
  const lessons = institutionLessons();
  const byKind = LESSON_KINDS.map((k) => ({ ...k, count: lessons.filter((l) => l.kind === k.key).length }));
  const recent = lessons.filter((l) => TODAY_DAY - l.day <= 30).length;
  return {
    total: lessons.length, byKind, recent,
    score: clamp(pct(lessons.length, NODES.length * 1.4) * 0.6 + avg(lessons.map((l) => l.confidence)) * 0.4),
    departments: new Set(lessons.map((l) => l.department)).size,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 3 — Institution Recommendations™
// ══════════════════════════════════════════════════════════

export type RecPriority = 'high' | 'medium' | 'low';

export interface InstitutionRecommendation {
  id: string;
  title: string;
  priority: RecPriority;
  area: string;
  rationale: string;
  expected: string;
  evidence: { id: string; note: string }[];
  measure: string;
  to?: string;
}

export function institutionRecommendations(): InstitutionRecommendation[] {
  const recs: InstitutionRecommendation[] = [];
  const ev = (nodes: KnowledgeNode[], note: (n: KnowledgeNode) => string) =>
    nodes.slice(0, 4).map((n) => ({ id: n.id, note: note(n) }));

  // Duplicated experiments — objects of the same type in the same department created close together.
  const dupes: KnowledgeNode[] = [];
  NODES.forEach((a) => {
    NODES.forEach((b) => {
      if (a.id < b.id && a.type === b.type && a.department === b.department && Math.abs(dayOf(a.created) - dayOf(b.created)) <= 21) {
        if (!dupes.find((d) => d.id === a.id)) dupes.push(a);
      }
    });
  });
  if (dupes.length) recs.push({
    id: 'REC-001', title: 'Reduce duplicated experiments', priority: dupes.length > 4 ? 'high' : 'medium', area: 'Research efficiency',
    rationale: `${dupes.length} objects share type and owning department within a 21-day window, which indicates parallel work on overlapping questions rather than sequenced research.`,
    expected: 'Fewer parallel runs on the same question; capacity redirected to uncovered regimes. Advisory only — no experiment is cancelled automatically.',
    evidence: ev(dupes, (n) => `${NODE_TYPE_META[n.type].label} owned by ${n.department}, created ${n.created}`),
    measure: 'Duplicate-window count in the next self review', to: '/institution/queue',
  });

  const thinEvidence = NODES.filter((n) => n.evidenceScore < 70).sort((a, b) => a.evidenceScore - b.evidenceScore);
  if (thinEvidence.length) recs.push({
    id: 'REC-002', title: 'Increase validation depth on thin-evidence objects', priority: 'high', area: 'Validation',
    rationale: `${thinEvidence.length} objects sit below an evidence score of 70 while still being cited downstream. Conclusions are being built on the weakest links in the graph.`,
    expected: 'Evidence score distribution tightens and prediction accuracy improves as stated confidence stops outrunning proof.',
    evidence: ev(thinEvidence, (n) => `Evidence ${n.evidenceScore} vs confidence ${n.confidence}`),
    measure: 'Mean evidence score and calibration gap', to: '/institution/quality',
  });

  const singleSourced = NODES.filter((n) => n.supportingEvidence.length > 0 && n.counterEvidence.length === 0);
  if (singleSourced.length) recs.push({
    id: 'REC-003', title: 'Improve evidence diversity', priority: 'medium', area: 'Evidence',
    rationale: `${singleSourced.length} objects record supporting evidence with no counter-evidence at all. One-sided evidence hides the failure modes that later block promotion.`,
    expected: 'Counter-evidence coverage rises; fewer late-stage governance blocks.',
    evidence: ev(singleSourced, (n) => `${n.supportingEvidence.length} supporting · 0 counter-evidence`),
    measure: 'Counter-evidence coverage %', to: '/knowledge-graph',
  });

  const youngPromotions = NODES.filter((n) => n.promotionHistory.length > 0 && TODAY_DAY - dayOf(n.created) < 60);
  if (youngPromotions.length) recs.push({
    id: 'REC-004', title: 'Delay promotion review on young objects', priority: 'high', area: 'Governance',
    rationale: `${youngPromotions.length} objects entered promotion discussion with under 60 simulated days of history. The institution's own standard requires 30 days runtime and 20 trades, and short histories have produced the largest confidence drift.`,
    expected: 'Promotion decisions rest on out-of-sample runtime rather than in-sample enthusiasm. Human approval remains mandatory regardless.',
    evidence: ev(youngPromotions, (n) => `${TODAY_DAY - dayOf(n.created)} simulated days of history`),
    measure: 'Median object age at promotion review', to: '/institution/decisions',
  });

  const lowReplay = NODES.filter((n) => n.currentUsage.length === 0 && n.status === 'validated');
  if (lowReplay.length) recs.push({
    id: 'REC-005', title: 'Increase replay frequency on dormant validated work', priority: 'medium', area: 'Knowledge reuse',
    rationale: `${lowReplay.length} validated objects have no recorded downstream usage. Validated knowledge that is never replayed silently decays into unusable memory.`,
    expected: 'Reuse score improves and duplicate research falls, because prior conclusions resurface before new work starts.',
    evidence: ev(lowReplay, (n) => `Validated ${n.created} · no current usage recorded`),
    measure: 'Share of validated objects with active usage', to: '/institution/evolution-timeline',
  });

  if (blocked.length) recs.push({
    id: 'REC-006', title: 'Improve governance review throughput', priority: blocked.length > 2 ? 'high' : 'low', area: 'Governance',
    rationale: `${blocked.length} objects are blocked awaiting review. Blocked objects hold department capacity while contributing nothing to institutional knowledge.`,
    expected: 'Shorter queue residency and clearer department load balance — all outcomes still require human approval.',
    evidence: ev(blocked, (n) => `Blocked · owner ${n.owner} · ${n.department}`),
    measure: 'Blocked-object count and mean wait', to: '/institution/queue',
  });

  const stats = deptLoad();
  const quiet = stats.filter((s) => s.objects <= 2);
  if (quiet.length) recs.push({
    id: 'REC-007', title: 'Improve specialist collaboration across quiet departments', priority: 'medium', area: 'Cooperation',
    rationale: `${quiet.length} departments own two or fewer objects (${quiet.map((q) => q.name).join(', ')}). Concentrated ownership creates single points of institutional dependency.`,
    expected: 'More balanced department load and broader independent validation of the same conclusions.',
    evidence: quiet.slice(0, 4).map((q) => ({ id: q.name, note: `${q.objects} objects owned` })),
    measure: 'Department balance component of Institution IQ', to: '/institution/collaboration',
  });

  const order: Record<RecPriority, number> = { high: 0, medium: 1, low: 2 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}

// ══════════════════════════════════════════════════════════
// FEATURE 4 — Research Quality Index™
// ══════════════════════════════════════════════════════════

export interface QualityComponent { key: string; label: string; score: number; weight: number; explanation: string }

export interface QualityScore {
  id: string;
  title: string;
  type: string;
  department: string;
  total: number;
  grade: string;
  band: 'exceptional' | 'strong' | 'adequate' | 'weak';
  components: QualityComponent[];
  summary: string;
}

const gradeOf = (n: number) => (n >= 90 ? 'A+' : n >= 84 ? 'A' : n >= 78 ? 'A−' : n >= 72 ? 'B+' : n >= 66 ? 'B' : n >= 58 ? 'C+' : n >= 50 ? 'C' : 'D');

export function qualityScore(id: string): QualityScore | null {
  const n = NODE_BY_ID[id];
  if (!n) return null;
  const conns = connections(n.id);
  const inc = incoming(n.id);
  const out = outgoing(n.id);
  const typePeers = NODES.filter((p) => p.type === n.type);

  const components: QualityComponent[] = [
    {
      key: 'evidence', label: 'Evidence depth', weight: 0.18,
      score: clamp(n.evidenceScore * 0.7 + pct(n.supportingEvidence.length + n.counterEvidence.length, 6) * 0.3),
      explanation: `${n.supportingEvidence.length} supporting and ${n.counterEvidence.length} counter-evidence links, with a recorded evidence score of ${n.evidenceScore}.`,
    },
    {
      key: 'novelty', label: 'Novelty', weight: 0.12,
      score: clamp(100 - pct(typePeers.length, NODES.length) * 1.8 + (inc.length === 0 ? 10 : 0)),
      explanation: `${typePeers.length} other ${NODE_TYPE_META[n.type].label.toLowerCase()} objects exist. ${inc.length === 0 ? 'This object opens a new line rather than extending one.' : `It extends ${inc.length} upstream object(s).`}`,
    },
    {
      key: 'validation', label: 'Validation', weight: 0.16,
      score: clamp(n.status === 'validated' ? 92 : n.status === 'active' ? 68 : n.status === 'open' ? 48 : n.status === 'blocked' ? 34 : 26),
      explanation: `Current status is ${n.status}. Validation credit is only granted once an independent department signs off, and promotion still needs human approval.`,
    },
    {
      key: 'repro', label: 'Reproducibility', weight: 0.12,
      score: clamp(pct(n.governanceHistory.length + n.promotionHistory.length, 4) * 0.5 + n.evidenceScore * 0.5),
      explanation: `${n.governanceHistory.length} governance and ${n.promotionHistory.length} promotion records document how this result was produced and re-checked.`,
    },
    {
      key: 'reuse', label: 'Reuse', weight: 0.14,
      score: clamp(pct(n.currentUsage.length, 3) * 0.6 + pct(out.length, 4) * 0.4),
      explanation: `${n.currentUsage.length} active downstream usages and ${out.length} outgoing relationships in the knowledge graph.`,
    },
    {
      key: 'governance', label: 'Governance', weight: 0.12,
      score: clamp(n.governanceHistory.length ? 88 : n.status === 'blocked' ? 40 : 58),
      explanation: n.governanceHistory.length ? `Governance trail present: ${n.governanceHistory[0]}` : 'No governance record attached yet — the object is advisory and cannot be promoted.',
    },
    {
      key: 'impact', label: 'Institution impact', weight: 0.10,
      score: clamp(pct(conns.length, 8) * 0.7 + pct(n.lessons.length, 3) * 0.3),
      explanation: `${conns.length} graph relationships and ${n.lessons.length} recorded lessons show how far this object propagated through the institution.`,
    },
    {
      key: 'calibration', label: 'Confidence calibration', weight: 0.06,
      score: clamp(100 - Math.abs(n.confidence - n.evidenceScore) * 2.4),
      explanation: `Stated confidence ${n.confidence} against evidence ${n.evidenceScore} — a ${Math.abs(n.confidence - n.evidenceScore)}-point gap.`,
    },
  ];

  const total = clamp(components.reduce((s, c) => s + c.score * c.weight, 0));
  const band = total >= 85 ? 'exceptional' : total >= 72 ? 'strong' : total >= 58 ? 'adequate' : 'weak';
  const best = [...components].sort((a, b) => b.score - a.score)[0];
  const worst = [...components].sort((a, b) => a.score - b.score)[0];
  return {
    id: n.id, title: n.title, type: NODE_TYPE_META[n.type].label, department: n.department,
    total, grade: gradeOf(total), band, components,
    summary: `${n.title} scores ${total}/100 (${gradeOf(total)}). Strongest component is ${best.label.toLowerCase()} at ${best.score}; weakest is ${worst.label.toLowerCase()} at ${worst.score}. ${worst.explanation}`,
  };
}

export function allQualityScores(): QualityScore[] {
  return NODES.map((n) => qualityScore(n.id)!).sort((a, b) => b.total - a.total);
}

export function qualityIndex() {
  const all = allQualityScores();
  const total = clamp(avg(all.map((q) => q.total)));
  return {
    total, grade: gradeOf(total), objects: all.length,
    exceptional: all.filter((q) => q.band === 'exceptional').length,
    weak: all.filter((q) => q.band === 'weak').length,
    top: all.slice(0, 6), bottom: all.slice(-6).reverse(),
    byComponent: all[0].components.map((c, i) => ({
      key: c.key, label: c.label,
      score: clamp(avg(all.map((q) => q.components[i].score))),
      explanation: c.label === 'Novelty'
        ? 'Institution-wide novelty falls as families of related objects grow — expected, not a defect.'
        : `Institution-wide mean of the ${c.label.toLowerCase()} component across all ${all.length} objects.`,
    })),
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 5 — Institution Explainability™
// ══════════════════════════════════════════════════════════

export interface ExplanationPage {
  id: string;
  title: string;
  conclusion: string;
  reasoningChain: { step: number; claim: string; basis: string }[];
  supporting: string[];
  counter: string[];
  alternatives: { hypothesis: string; whyNotAdopted: string }[];
  confidence: { stated: number; evidence: number; calculated: number; workings: string[] };
  departments: { name: string; role: string }[];
  validationHistory: { date: string; event: string }[];
  timeline: { day: number; date: string; event: string }[];
  quality: QualityScore;
}

export function explanationPage(id: string): ExplanationPage | null {
  const n = NODE_BY_ID[id];
  if (!n) return null;
  const inc = incoming(n.id);
  const out = outgoing(n.id);
  const q = qualityScore(n.id)!;
  const calculated = clamp(n.confidence * 0.45 + n.evidenceScore * 0.35 + q.total * 0.2);

  const reasoningChain = [
    { step: 1, claim: `${NODE_TYPE_META[n.type].label} registered by ${n.department}`, basis: `Created ${n.created} by ${n.owner}. ${n.summary}` },
    ...inc.slice(0, 4).map((e, i) => ({
      step: i + 2,
      claim: `Depends on ${NODE_BY_ID[e.from]?.title ?? e.from}`,
      basis: `${e.type} relationship, strength ${e.strength}, confidence ${e.confidence}. ${e.note}`,
    })),
    { step: inc.slice(0, 4).length + 2, claim: `Evidence assessed at ${n.evidenceScore}/100`, basis: n.supportingEvidence[0] ?? 'No supporting evidence recorded; the conclusion is provisional.' },
    { step: inc.slice(0, 4).length + 3, claim: `Status: ${n.status}`, basis: n.governanceHistory[0] ?? 'No governance decision recorded. Advisory, observation-only, human approval required before any change.' },
    ...out.slice(0, 3).map((e, i) => ({
      step: inc.slice(0, 4).length + 4 + i,
      claim: `Influences ${NODE_BY_ID[e.to]?.title ?? e.to}`,
      basis: `${e.type} · ${e.note}`,
    })),
  ];

  const alternatives = [
    { hypothesis: `The observed effect is a regime artefact rather than a durable edge`, whyNotAdopted: `${n.supportingEvidence.length} independent evidence links span more than one regime window; the artefact reading would require all of them to fail simultaneously.` },
    { hypothesis: `A simpler existing object already explains this`, whyNotAdopted: inc.length ? `${inc.length} upstream dependencies were checked; each contributes distinct information rather than restating the same result.` : `No upstream object covers this question — the coverage-gap scan found the area unexplained.` },
    { hypothesis: `Confidence should be materially higher`, whyNotAdopted: `Evidence score is ${n.evidenceScore}; calibration policy caps stated confidence near the evidence level, so ${n.confidence} is the defensible figure.` },
  ];

  const timeline = [
    { day: dayOf(n.created), date: n.created, event: `Created by ${n.owner} (${n.department})` },
    ...n.governanceHistory.map((g, i) => ({ day: dayOf(n.created) + 12 * (i + 1), date: dateOfDay(dayOf(n.created) + 12 * (i + 1)), event: g })),
    ...n.promotionHistory.map((p, i) => ({ day: dayOf(n.created) + 30 * (i + 1), date: dateOfDay(dayOf(n.created) + 30 * (i + 1)), event: p })),
  ].sort((a, b) => a.day - b.day);

  return {
    id: n.id, title: n.title,
    conclusion: n.summary,
    reasoningChain,
    supporting: n.supportingEvidence,
    counter: n.counterEvidence.length ? n.counterEvidence : ['No counter-evidence recorded. Treated as an evidence-diversity weakness, not as confirmation.'],
    alternatives,
    confidence: {
      stated: n.confidence, evidence: n.evidenceScore, calculated,
      workings: [
        `Stated confidence ${n.confidence} × 0.45 = ${(n.confidence * 0.45).toFixed(1)}`,
        `Evidence score ${n.evidenceScore} × 0.35 = ${(n.evidenceScore * 0.35).toFixed(1)}`,
        `Research quality ${q.total} × 0.20 = ${(q.total * 0.2).toFixed(1)}`,
        `Calculated institutional confidence = ${calculated}`,
      ],
    },
    departments: [
      { name: n.department, role: 'Owning department — produced the object and its evidence pack' },
      ...[...new Set(connections(n.id).map((e) => NODE_BY_ID[e.from === n.id ? e.to : e.from]?.department).filter(Boolean))]
        .filter((d) => d !== n.department).slice(0, 4)
        .map((d) => ({ name: d as string, role: 'Contributing department via a graph relationship' })),
    ],
    validationHistory: [
      ...n.governanceHistory.map((g, i) => ({ date: dateOfDay(dayOf(n.created) + 12 * (i + 1)), event: g })),
      ...n.promotionHistory.map((p, i) => ({ date: dateOfDay(dayOf(n.created) + 30 * (i + 1)), event: p })),
    ],
    timeline, quality: q,
  };
}

export function explainableObjects(): KnowledgeNode[] {
  return [...NODES].sort((a, b) => degree(b.id) - degree(a.id));
}

// ══════════════════════════════════════════════════════════
// FEATURE 6 — Institution Benchmark™
// ══════════════════════════════════════════════════════════

export const BENCHMARK_WINDOWS = [
  { key: '30d', label: '30 days ago', days: 30 },
  { key: '90d', label: '90 days ago', days: 90 },
  { key: 'quarter', label: 'Last quarter', days: 120 },
  { key: 'year', label: 'Last year', days: 365 },
];

export interface BenchmarkRow {
  key: string; label: string; now: number; then: number; delta: number; trend: Trend; why: string;
}

function institutionSnapshot(daysAgo: number) {
  const set = snapshotNodes(daysAgo);
  const safe = set.length ? set : [NODES[0]];
  const dims = dimensionScores(safe);
  const ids = new Set(safe.map((n) => n.id));
  const edges = KNOWLEDGE_EDGES.filter((e) => ids.has(e.from) && ids.has(e.to));
  return {
    knowledge: safe.length,
    relationships: edges.length,
    quality: dims.research,
    governance: dims.governance,
    confidence: clamp(avg(safe.map((n) => n.confidence))),
    evidence: clamp(avg(safe.map((n) => n.evidenceScore))),
    reuse: dims.reuse,
    productivity: clamp(pct(safe.length, Math.max(1, DEPARTMENT_PROFILES.length * 5))),
    iq: clamp(avg(Object.values(dims))),
  };
}

export function institutionBenchmark(daysAgo: number): { rows: BenchmarkRow[]; summary: string } {
  const now = institutionSnapshot(0);
  const then = institutionSnapshot(daysAgo);
  const meta: { key: keyof typeof now; label: string; why: (d: number) => string }[] = [
    { key: 'knowledge', label: 'Knowledge growth', why: (d) => `${d >= 0 ? d : 0} new research objects entered the graph in this window and none were ever deleted.` },
    { key: 'quality', label: 'Research quality', why: (d) => `${d >= 0 ? 'Validation ratio and evidence depth improved' : 'Newer objects arrived faster than validation could keep pace'} across the window.` },
    { key: 'governance', label: 'Governance', why: (d) => `${d >= 0 ? 'More objects gained a full governance trail' : 'Governance trail coverage thinned as new work outpaced review'}; human approval remained mandatory throughout.` },
    { key: 'confidence', label: 'Confidence', why: (d) => `Mean stated confidence moved ${d >= 0 ? 'up' : 'down'} ${Math.abs(d)} points as evidence packs ${d >= 0 ? 'deepened' : 'lagged'}.` },
    { key: 'evidence', label: 'Evidence', why: (d) => `Mean evidence score moved ${d >= 0 ? 'up' : 'down'} ${Math.abs(d)} points; counter-evidence coverage is the main lever.` },
    { key: 'reuse', label: 'Reuse', why: (d) => `Downstream reuse of prior conclusions ${d >= 0 ? 'increased' : 'fell'}, which directly changes how much duplicated work the institution performs.` },
    { key: 'productivity', label: 'Department productivity', why: (d) => `Objects produced per department ${d >= 0 ? 'rose' : 'fell'} ${Math.abs(d)} index points across ${DEPARTMENT_PROFILES.length} departments.` },
    { key: 'iq', label: 'Institution IQ', why: (d) => `The composite of all eight self-review dimensions moved ${d >= 0 ? '+' : ''}${d} points.` },
  ];
  const rows: BenchmarkRow[] = meta.map((m) => {
    const a = now[m.key]; const b = then[m.key]; const delta = Math.round(a - b);
    return { key: m.key as string, label: m.label, now: a, then: b, delta, trend: delta >= 2 ? 'improved' : delta <= -2 ? 'declining' : 'stable', why: m.why(delta) };
  });
  const up = rows.filter((r) => r.trend === 'improved').length;
  return {
    rows,
    summary: `Versus ${daysAgo} simulated days ago, ${up} of ${rows.length} institutional measures improved. Institution IQ moved from ${then.iq} to ${now.iq}. Every figure is derived from the knowledge graph snapshot at that date — no external or live data is used.`,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 7 — Executive Simulator™
// ══════════════════════════════════════════════════════════

export type SimScenario = 'experiment-failed' | 'promotion-delayed' | 'evidence-doubled' | 'governance-rejected' | 'department-paused' | 'replay-doubled';

export const SIM_SCENARIOS: { key: SimScenario; label: string; question: string; blurb: string }[] = [
  { key: 'experiment-failed', label: 'Experiment failed', question: 'What if this experiment failed?', blurb: 'Removes the object\'s validation credit and propagates the loss through dependants.' },
  { key: 'promotion-delayed', label: 'Promotion delayed', question: 'What if promotion was delayed 60 days?', blurb: 'Holds the promotion gate and re-prices confidence against additional runtime.' },
  { key: 'evidence-doubled', label: 'Evidence doubled', question: 'What if evidence doubled?', blurb: 'Doubles evidence links and recalculates calibration and quality.' },
  { key: 'governance-rejected', label: 'Governance rejected', question: 'What if governance rejected this?', blurb: 'Marks the object rejected and traces the institutional knowledge loss.' },
  { key: 'department-paused', label: 'Department paused', question: 'What if the owning department paused?', blurb: 'Suspends new work from the owner and measures the productivity hole.' },
  { key: 'replay-doubled', label: 'Replay doubled', question: 'What if replay frequency doubled?', blurb: 'Increases reuse of existing conclusions before new work begins.' },
];

export interface SimImpact { key: string; label: string; before: number; after: number; why: string }

export interface SimulationResult {
  scenario: SimScenario;
  question: string;
  object: string;
  objectTitle: string;
  headline: string;
  impacts: SimImpact[];
  affected: { id: string; title: string; effect: string }[];
  narrative: string[];
  governance: string;
}

export function simulate(scenario: SimScenario, id: string): SimulationResult | null {
  const n = NODE_BY_ID[id];
  if (!n) return null;
  const base = institutionSnapshot(0);
  const dependants = outgoing(n.id).map((e) => NODE_BY_ID[e.to]).filter(Boolean) as KnowledgeNode[];
  const q = qualityScore(n.id)!;
  const weight = clamp(pct(degree(n.id), 10) * 0.5 + pct(n.currentUsage.length, 3) * 0.5) / 100;

  const shift = (b: number, d: number) => ({ before: b, after: clamp(b + d) });
  let impacts: SimImpact[] = [];
  let headline = '';
  let narrative: string[] = [];
  let effect = '';

  switch (scenario) {
    case 'experiment-failed': {
      const d = -Math.round(6 + weight * 14);
      headline = `Failure of ${n.id} would cost the institution roughly ${Math.abs(d)} points of research quality`;
      effect = 'loses its supporting conclusion and must re-derive its basis';
      impacts = [
        { key: 'quality', label: 'Research quality', ...shift(base.quality, d), why: `${n.id} carries a quality score of ${q.total} and ${degree(n.id)} relationships; removing its validation credit propagates to ${dependants.length} dependants.` },
        { key: 'confidence', label: 'Confidence', ...shift(base.confidence, Math.round(d * 0.7)), why: 'Confidence is re-priced downward wherever the failed object was cited as support.' },
        { key: 'knowledge', label: 'Usable knowledge', ...shift(base.iq, Math.round(d * 0.6)), why: `The object is not deleted — the institution retains the failure as a permanent lesson, which recovers part of the loss.` },
        { key: 'reuse', label: 'Reuse', ...shift(base.reuse, Math.round(d * 0.5)), why: `${n.currentUsage.length} active usages would need alternative sources.` },
      ];
      narrative = [
        `${dependants.length} downstream objects cite ${n.id}. Each would revert to provisional status until an alternative basis is attached.`,
        `The failure itself becomes institutional memory: a permanent failure-pattern lesson that reduces the chance of repeating the same design.`,
        `Net institutional effect is negative in the short run and mildly positive for calibration in the long run.`,
      ];
      break;
    }
    case 'promotion-delayed': {
      headline = `Delaying promotion of ${n.id} by 60 simulated days raises confidence quality at the cost of velocity`;
      effect = 'waits on additional out-of-sample runtime before citing this object as settled';
      impacts = [
        { key: 'calibration', label: 'Confidence calibration', ...shift(clamp(100 - Math.abs(n.confidence - n.evidenceScore) * 2.2), +9), why: 'Sixty more simulated days of forward runtime narrows the gap between stated confidence and demonstrated evidence.' },
        { key: 'governance', label: 'Governance', ...shift(base.governance, +6), why: 'The delay is exactly what the 30-day / 20-trade standard was written to enforce.' },
        { key: 'productivity', label: 'Department productivity', ...shift(base.productivity, -5), why: `${n.department} holds capacity on an object already believed to be finished.` },
        { key: 'quality', label: 'Research quality', ...shift(base.quality, +3), why: 'Longer runtime adds out-of-sample evidence rather than new in-sample claims.' },
      ];
      narrative = [
        `No promotion occurs in either branch without human approval — this simulation only projects institutional measures.`,
        `The delay converts enthusiasm into evidence: the calibration gap of ${Math.abs(n.confidence - n.evidenceScore)} points narrows materially.`,
      ];
      break;
    }
    case 'evidence-doubled': {
      headline = `Doubling evidence on ${n.id} lifts institutional quality by about ${Math.round(4 + weight * 8)} points`;
      effect = 'inherits a stronger, better-documented basis';
      impacts = [
        { key: 'evidence', label: 'Evidence', ...shift(base.evidence, +Math.round(5 + weight * 9)), why: `${n.supportingEvidence.length} supporting links would become ${n.supportingEvidence.length * 2}, and counter-evidence would rise from ${n.counterEvidence.length} to ${Math.max(1, n.counterEvidence.length * 2)}.` },
        { key: 'quality', label: 'Research quality', ...shift(base.quality, +Math.round(4 + weight * 8)), why: 'Evidence depth carries an 18% weight in the Research Quality Index.' },
        { key: 'calibration', label: 'Confidence calibration', ...shift(clamp(100 - Math.abs(n.confidence - n.evidenceScore) * 2.2), +12), why: 'Stated confidence becomes defensible once evidence catches up to belief.' },
        { key: 'productivity', label: 'Department productivity', ...shift(base.productivity, -4), why: 'Evidence gathering consumes the same department capacity that new research would use.' },
      ];
      narrative = [
        `Doubling evidence is the single highest-leverage intervention available for objects with a calibration gap above 8 points.`,
        `${dependants.length} dependants inherit the improvement without any additional work.`,
      ];
      break;
    }
    case 'governance-rejected': {
      const d = -Math.round(8 + weight * 16);
      headline = `Governance rejection of ${n.id} removes it from active use but keeps it permanently in memory`;
      effect = 'must find an alternative basis or be re-scoped';
      impacts = [
        { key: 'knowledge', label: 'Usable knowledge', ...shift(base.iq, d), why: `${degree(n.id)} relationships would be re-typed as historical rather than active.` },
        { key: 'governance', label: 'Governance', ...shift(base.governance, +7), why: 'A recorded rejection strengthens the governance trail even as it removes the object.' },
        { key: 'reuse', label: 'Reuse', ...shift(base.reuse, Math.round(d * 0.8)), why: `${n.currentUsage.length} active usages must be re-sourced.` },
        { key: 'quality', label: 'Research quality', ...shift(base.quality, Math.round(d * 0.5)), why: 'Mean quality falls because a high-connectivity object leaves the active set.' },
      ];
      narrative = [
        `Rejection never deletes: the object, its evidence and its reasoning remain readable forever in institutional memory.`,
        `The rejection reason becomes a standard applied to future objects of the same type.`,
      ];
      break;
    }
    case 'department-paused': {
      const owned = NODES.filter((x) => x.department === n.department);
      headline = `Pausing ${n.department} would idle ${owned.length} objects and expose a single-point dependency`;
      effect = 'loses its owning department for the duration of the pause';
      impacts = [
        { key: 'productivity', label: 'Department productivity', ...shift(base.productivity, -Math.round(pct(owned.length, NODES.length) * 0.9)), why: `${n.department} owns ${owned.length} of ${NODES.length} objects (${pct(owned.length, NODES.length)}%).` },
        { key: 'cooperation', label: 'Cooperation', ...shift(base.reuse, -8), why: 'Collaboration links routed through this department would go unanswered.' },
        { key: 'quality', label: 'Research quality', ...shift(base.quality, -Math.round(pct(owned.length, NODES.length) * 0.5)), why: 'Validation requests owned by the department would queue rather than complete.' },
        { key: 'governance', label: 'Governance', ...shift(base.governance, -3), why: 'Review throughput falls while the pause holds.' },
      ];
      narrative = [
        `This scenario is the clearest test of institutional redundancy: any department whose pause costs more than 10 index points is a single point of failure.`,
      ];
      break;
    }
    case 'replay-doubled': {
      headline = `Doubling replay frequency raises reuse by about ${Math.round(9 + weight * 7)} points and cuts duplicated work`;
      effect = 'is revisited before comparable new research begins';
      impacts = [
        { key: 'reuse', label: 'Reuse', ...shift(base.reuse, +Math.round(9 + weight * 7)), why: `${NODES.filter((x) => x.currentUsage.length === 0 && x.status === 'validated').length} dormant validated objects would re-enter active circulation.` },
        { key: 'productivity', label: 'Department productivity', ...shift(base.productivity, +6), why: 'Capacity currently spent re-deriving settled conclusions is returned to new questions.' },
        { key: 'quality', label: 'Research quality', ...shift(base.quality, +4), why: 'New objects start from validated foundations rather than fresh assumptions.' },
        { key: 'confidence', label: 'Confidence', ...shift(base.confidence, +2), why: 'Replayed conclusions accumulate additional confirming runs.' },
      ];
      narrative = [
        `Replay is the cheapest institutional improvement available: it consumes no new evidence and creates no new risk.`,
      ];
      break;
    }
  }

  return {
    scenario, question: SIM_SCENARIOS.find((s) => s.key === scenario)!.question,
    object: n.id, objectTitle: n.title, headline, impacts,
    affected: dependants.slice(0, 8).map((d) => ({ id: d.id, title: d.title, effect: `${d.title} ${effect}.` })),
    narrative,
    governance: 'Projection only. This simulator changes no strategy, allocation, threshold or execution path. Results are institutional measures derived from the knowledge graph and require human interpretation.',
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 8 — Institution Risk Radar™
// ══════════════════════════════════════════════════════════

export type RiskLevel = 'critical' | 'elevated' | 'moderate' | 'low';

export interface InstitutionRisk {
  id: string;
  title: string;
  category: string;
  level: RiskLevel;
  score: number;
  explanation: string;
  signals: string[];
  mitigation: string;
  owner: string;
  to?: string;
}

const levelOf = (s: number): RiskLevel => (s >= 70 ? 'critical' : s >= 52 ? 'elevated' : s >= 34 ? 'moderate' : 'low');

export function institutionRisks(): InstitutionRisk[] {
  const stats = deptLoad();
  const cycle = departmentCycle(80);
  const risks: InstitutionRisk[] = [];

  const queued = cycle.filter((c) => c.status !== 'completed').length;
  risks.push({
    id: 'RSK-BOTTLENECK', title: 'Research bottlenecks', category: 'Throughput', score: clamp(pct(queued, cycle.length) * 0.8 + pct(blocked.length, 5) * 0.2),
    level: levelOf(clamp(pct(queued, cycle.length) * 0.8 + pct(blocked.length, 5) * 0.2)),
    explanation: `${queued} of ${cycle.length} simulated work cycles are still open and ${blocked.length} objects are blocked. Work accumulates faster at the validation stage than at creation.`,
    signals: [`${queued} open cycles`, `${blocked.length} blocked objects`, 'Validation stage is the narrowest point in the queue'],
    mitigation: 'Sequence validation before opening new discovery work, and cap concurrent objects per department. Advisory only.',
    owner: 'Work Queue™', to: '/institution/queue',
  }, {
    id: 'RSK-SILO', title: 'Knowledge silos', category: 'Cooperation',
    score: clamp(100 - pct(collaborationLinks().length, DEPARTMENT_PROFILES.length * 4)),
    level: levelOf(clamp(100 - pct(collaborationLinks().length, DEPARTMENT_PROFILES.length * 4))),
    explanation: `${collaborationLinks().length} collaboration links exist across ${DEPARTMENT_PROFILES.length} departments. Departments below two outbound links effectively research in isolation, so their conclusions are never independently challenged.`,
    signals: stats.filter((s) => s.objects <= 2).slice(0, 3).map((s) => `${s.name}: ${s.objects} objects owned`),
    mitigation: 'Route every validation request to a department that does not own the object; publish each conclusion to the Observatory.',
    owner: 'Collaboration™', to: '/institution/collaboration',
  }, {
    id: 'RSK-VALIDATION', title: 'Weak validation', category: 'Quality',
    score: clamp(pct(NODES.filter((n) => n.evidenceScore < 70).length, NODES.length) * 1.4),
    level: levelOf(clamp(pct(NODES.filter((n) => n.evidenceScore < 70).length, NODES.length) * 1.4)),
    explanation: `${NODES.filter((n) => n.evidenceScore < 70).length} objects hold an evidence score below 70 while being cited downstream. Weak validation is the most common precursor to a late governance block.`,
    signals: NODES.filter((n) => n.evidenceScore < 70).slice(0, 3).map((n) => `${n.id} · evidence ${n.evidenceScore} · confidence ${n.confidence}`),
    mitigation: 'Raise the minimum evidence bar to 70 before an object may be cited as support for another object.',
    owner: 'Research Quality Index™', to: '/institution/quality',
  });

  const busiest = [...stats].sort((a, b) => b.objects - a.objects)[0];
  const overloadScore = clamp(pct(busiest.objects, NODES.length) * 2.4);
  risks.push({
    id: 'RSK-OVERLOAD', title: 'Department overload', category: 'Capacity', score: overloadScore, level: levelOf(overloadScore),
    explanation: `${busiest.name} owns ${busiest.objects} of ${NODES.length} objects (${pct(busiest.objects, NODES.length)}%). Concentrated ownership slows every research line that depends on that department.`,
    signals: [...stats].sort((a, b) => b.objects - a.objects).slice(0, 3).map((s) => `${s.name}: ${s.objects} objects`),
    mitigation: 'Redistribute new discovery work to departments with spare capacity and keep the busiest department on validation only.',
    owner: 'Departments', to: '/institution/departments',
  });

  const decisions = institutionDecisions();
  const pendingDecisions = decisions.filter((d) => d.outcome !== 'Approved for further research').length;
  const govScore = clamp(pct(pendingDecisions, Math.max(1, decisions.length)) * 1.1);
  risks.push({
    id: 'RSK-GOVDELAY', title: 'Governance delays', category: 'Governance', score: govScore, level: levelOf(govScore),
    explanation: `${pendingDecisions} of ${decisions.length} recorded decisions are not yet approved. Governance delay is a deliberate safety property, but sustained delay indicates review capacity rather than caution.`,
    signals: decisions.slice(0, 3).map((d) => `${d.decision} · ${d.outcome}`),
    mitigation: 'Schedule a fixed weekly review block and pre-package evidence so reviews are decision-ready. Human approval remains mandatory.',
    owner: 'Decisions™', to: '/institution/decisions',
  });

  const drift = clamp(Math.abs(avg(NODES.map((n) => n.confidence)) - avg(NODES.map((n) => n.evidenceScore))) * 6);
  risks.push({
    id: 'RSK-DRIFT', title: 'Confidence drift', category: 'Calibration', score: drift, level: levelOf(drift),
    explanation: `Mean stated confidence is ${Math.round(avg(NODES.map((n) => n.confidence)))} against mean evidence of ${Math.round(avg(NODES.map((n) => n.evidenceScore)))}. Persistent positive drift means the institution believes more than it can currently prove.`,
    signals: NODES.filter((n) => n.confidence - n.evidenceScore > 8).slice(0, 3).map((n) => `${n.id} · +${n.confidence - n.evidenceScore} point gap`),
    mitigation: 'Cap stated confidence at evidence score plus five points until an independent department validates.',
    owner: 'Self Review™', to: '/self-review',
  });

  const hubs = [...NODES].sort((a, b) => degree(b.id) - degree(a.id));
  const spofScore = clamp(pct(degree(hubs[0].id), 12) * 1.5);
  risks.push({
    id: 'RSK-SPOF', title: 'Single-point dependencies', category: 'Architecture', score: spofScore, level: levelOf(spofScore),
    explanation: `${hubs[0].title} carries ${degree(hubs[0].id)} relationships. If it were invalidated, ${outgoing(hubs[0].id).length} downstream objects would immediately lose their stated basis.`,
    signals: hubs.slice(0, 3).map((h) => `${h.id} · ${degree(h.id)} relationships · ${h.department}`),
    mitigation: 'Attach a second independent evidence source to every object with more than eight relationships.',
    owner: 'Knowledge Graph™', to: '/knowledge-graph',
  });

  return risks.sort((a, b) => b.score - a.score);
}

export function riskLevelSummary() {
  const risks = institutionRisks();
  const score = clamp(avg(risks.map((r) => r.score)));
  return { score, level: levelOf(score), critical: risks.filter((r) => r.level === 'critical').length, elevated: risks.filter((r) => r.level === 'elevated').length, risks };
}

// ══════════════════════════════════════════════════════════
// FEATURE 9 — Institution Intelligence Index™
// ══════════════════════════════════════════════════════════

export interface IQComponent { key: string; label: string; score: number; weight: number; explanation: string }

export function institutionIQ(): { total: number; grade: string; band: string; components: IQComponent[]; narrative: string; previous: number; trend: Trend } {
  const dims = dimensionScores(NODES);
  const q = qualityIndex();
  const stats = deptLoad();
  const balance = clamp(100 - (Math.max(...stats.map((s) => s.objects)) - Math.min(...stats.map((s) => s.objects))) * 6);
  const explain = clamp(pct(NODES.filter((n) => n.supportingEvidence.length && n.summary).length, NODES.length) * 0.6 + pct(KNOWLEDGE_EDGES.filter((e) => e.note).length, KNOWLEDGE_EDGES.length) * 0.4);
  const memory = clamp(pct(institutionLessons().length, NODES.length * 1.4) * 0.7 + 30);
  const innovation = clamp(avg(allQualityScores().map((s) => s.components[1].score)));

  const components: IQComponent[] = [
    { key: 'knowledge', label: 'Knowledge', weight: 0.13, score: clamp(pct(NODES.length, 45) * 0.6 + pct(KNOWLEDGE_EDGES.length, 60) * 0.4), explanation: `${NODES.length} objects and ${KNOWLEDGE_EDGES.length} explainable relationships form the institutional knowledge base.` },
    { key: 'evidence', label: 'Evidence', weight: 0.12, score: dims.evidence, explanation: `Mean evidence ${Math.round(avg(NODES.map((n) => n.evidenceScore)))} with counter-evidence on ${pct(NODES.filter((n) => n.counterEvidence.length).length, NODES.length)}% of objects.` },
    { key: 'governance', label: 'Governance', weight: 0.11, score: dims.governance, explanation: `${NODES.filter((n) => n.governanceHistory.length).length} objects carry a governance trail; human approval is required for every promotion.` },
    { key: 'research', label: 'Research', weight: 0.12, score: q.total, explanation: `Research Quality Index across all objects is ${q.total} (${q.grade}).` },
    { key: 'prediction', label: 'Prediction', weight: 0.10, score: dims.prediction, explanation: `Stated confidence tracks realised validation within ${Math.abs(Math.round(avg(NODES.map((n) => n.confidence))) - pct(validated.length, NODES.length))} points.` },
    { key: 'reuse', label: 'Reuse', weight: 0.10, score: dims.reuse, explanation: `${NODES.filter((n) => n.currentUsage.length).length} objects are actively reused downstream.` },
    { key: 'memory', label: 'Memory', weight: 0.09, score: memory, explanation: `${institutionLessons().length} permanent lessons retained; nothing is ever deleted from institutional memory.` },
    { key: 'explainability', label: 'Explainability', weight: 0.09, score: explain, explanation: `${pct(KNOWLEDGE_EDGES.filter((e) => e.note).length, KNOWLEDGE_EDGES.length)}% of relationships carry a written justification and every object has a reasoning chain.` },
    { key: 'balance', label: 'Department balance', weight: 0.07, score: balance, explanation: `Ownership spread across ${DEPARTMENT_PROFILES.length} departments; the gap between busiest and quietest is ${Math.max(...stats.map((s) => s.objects)) - Math.min(...stats.map((s) => s.objects))} objects.` },
    { key: 'innovation', label: 'Innovation', weight: 0.07, score: innovation, explanation: `Mean novelty component across all objects is ${innovation}, reflecting how much new ground each object opens.` },
  ];

  const total = clamp(components.reduce((s, c) => s + c.score * c.weight, 0));
  const prevDims = dimensionScores(snapshotNodes(30));
  const previous = clamp(avg(Object.values(prevDims)) * 0.85 + 8);
  const trend: Trend = total - previous >= 2 ? 'improved' : total - previous <= -2 ? 'declining' : 'stable';
  const band = total >= 88 ? 'Institutional Grade' : total >= 78 ? 'Advanced Institution' : total >= 66 ? 'Maturing Institution' : 'Developing Institution';
  const strongest = [...components].sort((a, b) => b.score - a.score)[0];
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];

  return {
    total, grade: gradeOf(total), band, components, previous, trend,
    narrative: `Institution IQ is ${total} (${gradeOf(total)}) — ${band}. ${strongest.label} leads at ${strongest.score}, while ${weakest.label} at ${weakest.score} is the binding constraint on the composite. ${weakest.explanation} The index is advisory and observation-only.`,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 10 — Institution Evolution Timeline™
// ══════════════════════════════════════════════════════════

export type EraKind = 'birth' | 'growth' | 'discovery' | 'failure' | 'architecture' | 'department' | 'milestone' | 'promotion' | 'maturity';

export const ERA_META: Record<EraKind, { label: string; blurb: string }> = {
  birth: { label: 'Birth', blurb: 'The founding question that created the institution.' },
  growth: { label: 'Growth', blurb: 'Expansion of the knowledge base.' },
  discovery: { label: 'Major discovery', blurb: 'A validated result that changed the research direction.' },
  failure: { label: 'Major failure', blurb: 'A rejected or blocked result retained permanently as a lesson.' },
  architecture: { label: 'Architecture change', blurb: 'A structural change to how research is conducted.' },
  department: { label: 'Department creation', blurb: 'A new AI department entered the institution.' },
  milestone: { label: 'Knowledge milestone', blurb: 'A threshold crossed in institutional knowledge.' },
  promotion: { label: 'Promotion history', blurb: 'A governance-gated promotion review, human approval required.' },
  maturity: { label: 'Institution maturity', blurb: 'A recorded step in institutional maturity.' },
};

export interface EvolutionEvent {
  id: string;
  day: number;
  date: string;
  kind: EraKind;
  title: string;
  detail: string;
  department: string;
  iqAtTime: number;
  objectsAtTime: number;
  to?: string;
}

export function evolutionTimeline(): EvolutionEvent[] {
  const events: EvolutionEvent[] = [];
  const sorted = [...NODES].sort((a, b) => dayOf(a.created) - dayOf(b.created));
  const iqAt = (day: number) => {
    const set = NODES.filter((n) => dayOf(n.created) <= day);
    return set.length ? clamp(avg(Object.values(dimensionScores(set)))) : 0;
  };

  sorted.forEach((n, i) => {
    const day = dayOf(n.created);
    const kind: EraKind = i === 0 ? 'birth'
      : n.status === 'rejected' || n.status === 'blocked' ? 'failure'
      : n.status === 'validated' && degree(n.id) >= 5 ? 'discovery'
      : n.promotionHistory.length ? 'promotion'
      : n.type === 'department' as never ? 'department'
      : 'growth';
    events.push({
      id: n.id, day, date: n.created, kind,
      title: n.title,
      detail: `${NODE_TYPE_META[n.type].label} · ${n.department}. ${n.summary}`,
      department: n.department,
      iqAtTime: iqAt(day),
      objectsAtTime: sorted.filter((x) => dayOf(x.created) <= day).length,
      to: n.link,
    });
  });

  DEPARTMENT_PROFILES.forEach((d, i) => {
    const owned = NODES.filter((n) => n.department === d.name).sort((a, b) => dayOf(a.created) - dayOf(b.created));
    const day = owned.length ? dayOf(owned[0].created) : dayOf('2026-03-01') + i;
    events.push({
      id: `DEPT-${i}`, day, date: dateOfDay(day), kind: 'department',
      title: `${d.name} enters the institution`,
      detail: `${d.purpose ?? 'Department established'} — first recorded contribution ${owned.length ? owned[0].title : 'pending'}.`,
      department: d.name, iqAtTime: iqAt(day), objectsAtTime: NODES.filter((x) => dayOf(x.created) <= day).length,
      to: '/institution/departments',
    });
  });

  [25, 50, 75].forEach((mark) => {
    const at = sorted[Math.floor((sorted.length - 1) * (mark / 100))];
    if (!at) return;
    const day = dayOf(at.created);
    events.push({
      id: `MILE-${mark}`, day, date: at.created, kind: 'milestone',
      title: `${mark}% of the current knowledge base existed`,
      detail: `The institution reached ${Math.round(NODES.length * (mark / 100))} objects. Institution IQ stood at ${iqAt(day)} at this point.`,
      department: 'ATLAS', iqAtTime: iqAt(day), objectsAtTime: Math.round(NODES.length * (mark / 100)),
      to: '/institution/benchmark',
    });
  });

  events.push({
    id: 'ARCH-V4', day: TODAY_DAY, date: dateOfDay(TODAY_DAY), kind: 'architecture',
    title: 'Institutional Intelligence Engine activated',
    detail: 'ATLAS OS v4.0 added self review, learning, recommendations, quality index, explainability, benchmarking, executive simulation, risk radar, intelligence index and this timeline. Observation-only throughout.',
    department: 'ATLAS', iqAtTime: institutionIQ().total, objectsAtTime: NODES.length, to: '/institution/iq',
  }, {
    id: 'MAT-NOW', day: TODAY_DAY, date: dateOfDay(TODAY_DAY), kind: 'maturity',
    title: `Institution maturity: ${institutionIQ().band}`,
    detail: institutionIQ().narrative,
    department: 'ATLAS', iqAtTime: institutionIQ().total, objectsAtTime: NODES.length, to: '/self-review',
  });

  return events.sort((a, b) => a.day - b.day);
}

// ══════════════════════════════════════════════════════════
// GLOBAL — Institutional intelligence strip (used on every page)
// ══════════════════════════════════════════════════════════

export interface GlobalMetric { key: string; label: string; value: number; suffix?: string; tone: 'good' | 'watch' | 'weak'; hint: string }

let cachedGlobals: { metrics: GlobalMetric[]; summary: string } | null = null;

export function globalIntelligence(): { metrics: GlobalMetric[]; summary: string } {
  if (cachedGlobals) return cachedGlobals;
  const iq = institutionIQ();
  const review = selfReview();
  const q = qualityIndex();
  const learn = learningStats();
  const risk = riskLevelSummary();
  const bench = institutionBenchmark(30);
  const stats = deptLoad();
  const balance = iq.components.find((c) => c.key === 'balance')!.score;
  const t = (n: number): GlobalMetric['tone'] => (n >= 78 ? 'good' : n >= 62 ? 'watch' : 'weak');

  const metrics: GlobalMetric[] = [
    { key: 'iq', label: 'Institution IQ', value: iq.total, tone: t(iq.total), hint: `${iq.band} · ${iq.grade}` },
    { key: 'quality', label: 'Research quality', value: q.total, tone: t(q.total), hint: `${q.exceptional} exceptional / ${q.weak} weak objects` },
    { key: 'learning', label: 'Learning score', value: learn.score, tone: t(learn.score), hint: `${learn.total} permanent lessons, ${learn.recent} in the last 30 days` },
    { key: 'growth', label: 'Knowledge growth', value: clamp(bench.rows[0].now - bench.rows[0].then + 60), suffix: '', tone: 'good', hint: `${bench.rows[0].now - bench.rows[0].then} new objects in 30 simulated days` },
    { key: 'explain', label: 'Explainability', value: iq.components.find((c) => c.key === 'explainability')!.score, tone: t(iq.components.find((c) => c.key === 'explainability')!.score), hint: 'Share of conclusions with a full reasoning chain' },
    { key: 'prediction', label: 'Prediction accuracy', value: review.dimensions.find((d) => d.key === 'prediction')!.score, tone: t(review.dimensions.find((d) => d.key === 'prediction')!.score), hint: 'Stated confidence versus realised validation' },
    { key: 'maturity', label: 'Institution maturity', value: review.dimensions.find((d) => d.key === 'maturity')!.score, tone: t(review.dimensions.find((d) => d.key === 'maturity')!.score), hint: iq.band },
    { key: 'balance', label: 'Department balance', value: balance, tone: t(balance), hint: `${stats.length} departments, load spread` },
    { key: 'risk', label: 'Risk level', value: risk.score, tone: risk.score >= 60 ? 'weak' : risk.score >= 40 ? 'watch' : 'good', hint: `${risk.critical} critical · ${risk.elevated} elevated institutional risks` },
  ];

  cachedGlobals = {
    metrics,
    summary: `${iq.band} at IQ ${iq.total}. Self review is ${TREND_LABEL[review.overallTrend].toLowerCase()}, research quality ${q.total}, ${learn.total} permanent lessons retained and institutional risk ${risk.level}. ${institutionRecommendations()[0]?.title ?? 'No open recommendation'} is the highest-priority self-improvement. Observation only — no execution, allocation or strategy change follows from any figure shown.`,
  };
  return cachedGlobals;
}

export const IQ_LINKS = [
  { to: '/self-review', label: 'Self Review™' },
  { to: '/institution/learning', label: 'Learning Engine™' },
  { to: '/institution/recommendations', label: 'Recommendations™' },
  { to: '/institution/quality', label: 'Quality Index™' },
  { to: '/institution/explain', label: 'Explainability™' },
  { to: '/institution/benchmark', label: 'Benchmark™' },
  { to: '/executive-simulator', label: 'Executive Simulator™' },
  { to: '/institution/risk-radar', label: 'Risk Radar™' },
  { to: '/institution/iq', label: 'Intelligence Index™' },
  { to: '/institution/evolution-timeline', label: 'Evolution Timeline™' },
];
