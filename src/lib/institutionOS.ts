// ATLAS OS™ — Institutional Research Operating System
// Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required
// Every value is derived from the Institutional Knowledge Graph. Nothing is invented at runtime.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META,
  connections, outgoing, incoming, degree,
  type KnowledgeNode, type KnowledgeNodeType, type KnowledgeEdge, type NodeStatus,
} from './knowledgeGraph';
import { dayOf, dateOfDay, TODAY_DAY } from './intelligenceExplorer';

export const OS_VERSION = 'ATLAS OS™ v2.0 · Institutional Research Operating System';

export const OS_BADGES = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Read Only',
  'Human Approval Required', 'No Exchange Connectivity', 'No API Keys',
  'No Live Trading', 'No Strategy Modification', 'No Allocation Changes',
];

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ══════════════════════════════════════════════════════════
// Departments
// ══════════════════════════════════════════════════════════

export interface DepartmentProfile {
  name: string;
  short: string;
  link: string;
  purpose: string;
  responsibilities: string[];
}

export const DEPARTMENT_PROFILES: DepartmentProfile[] = [
  {
    name: 'AI Research Brain', short: 'Brain', link: '/research-brain',
    purpose: 'Decides what the institution should research next and keeps the research agenda coherent.',
    responsibilities: ['Raise origin questions', 'Generate and rank hypotheses', 'Design experiments', 'Maintain the research roadmap', 'Self-reflect on research quality'],
  },
  {
    name: 'AI Quant Scientist', short: 'Quant', link: '/quant-scientist',
    purpose: 'Designs, formalises and validates new quantitative strategy ideas.',
    responsibilities: ['Discovery scans', 'Strategy specification', 'Validation design', 'Research papers', 'Peer review'],
  },
  {
    name: 'Portfolio AI Director', short: 'Director', link: '/portfolio-ai-director',
    purpose: 'Owns how specialists cooperate and how simulated capital is allocated across regimes.',
    responsibilities: ['Allocation research', 'Portfolio architecture', 'Regime coverage', 'Scenario simulation', 'Allocation health monitoring'],
  },
  {
    name: 'AI Chief Investment Officer', short: 'CIO', link: '/cio',
    purpose: 'Provides proactive executive intelligence and advisory recommendations.',
    responsibilities: ['Executive feed', 'Daily briefing', 'Investigations', 'Executive alerts', 'Advisory recommendations'],
  },
  {
    name: 'Mission Control', short: 'Mission', link: '/mission-control',
    purpose: 'Turns institutional knowledge into the daily operating agenda.',
    responsibilities: ['Daily missions', 'Attention alerts', 'Research calendar', 'Prioritisation', 'End-of-day summary'],
  },
  {
    name: 'Executive Board', short: 'Board', link: '/boardroom',
    purpose: 'Reviews evidence and issues advisory promotion and governance verdicts for human approval.',
    responsibilities: ['Promotion review', 'Department votes', 'Executive verdicts', 'Institutional reporting', 'Capital-stage advisory'],
  },
  {
    name: 'Autonomous Research Engine', short: 'Engine', link: '/autonomous-research',
    purpose: 'Continuously scans the institution overnight and produces research without being asked.',
    responsibilities: ['Overnight scans', 'Discovery feed', 'Hypothesis drafting', 'Research score', 'Degradation detection'],
  },
  {
    name: 'AI Research Assistant', short: 'Assistant', link: '/research-assistant',
    purpose: 'Indexes and explains every institutional object and metric on demand.',
    responsibilities: ['Knowledge indexing', 'Metric explanation', 'Executive memory', 'Related knowledge', 'Daily briefing'],
  },
  {
    name: 'ATLAS Oracle', short: 'Oracle', link: '/oracle',
    purpose: 'Answers institutional questions using only evidence traced through the Knowledge Graph.',
    responsibilities: ['Reasoning chains', 'Relationship detection', 'Confidence attribution', 'Evidence retrieval', 'Follow-up research prompts'],
  },
  {
    name: 'Governance', short: 'Governance', link: '/governance',
    purpose: 'Enforces the permanent research-only guardrails and blocks anything that requires human approval.',
    responsibilities: ['Guardrail enforcement', 'Promotion locks', 'Blocked research register', 'Audit trail integrity', 'Human-approval gates'],
  },
];

export const PROFILE_BY_NAME: Record<string, DepartmentProfile> =
  Object.fromEntries(DEPARTMENT_PROFILES.map((d) => [d.name, d]));

export const PROFILE_BY_SLUG: Record<string, DepartmentProfile> =
  Object.fromEntries(DEPARTMENT_PROFILES.map((d) => [slug(d.name), d]));

/** Objects a department owns, plus objects it touched via governance/oracle roles. */
export function departmentNodes(name: string): KnowledgeNode[] {
  if (name === 'Governance') {
    return KNOWLEDGE_NODES.filter((n) => n.department === 'Governance' || n.governanceHistory.length > 0 || n.status === 'blocked');
  }
  if (name === 'ATLAS Oracle') {
    return KNOWLEDGE_NODES.filter((n) => n.department === 'ATLAS Oracle' || n.type === 'memory' || n.type === 'lesson');
  }
  return KNOWLEDGE_NODES.filter((n) => n.department === name);
}

export interface DepartmentStats {
  profile: DepartmentProfile;
  owned: KnowledgeNode[];
  workload: number;
  open: KnowledgeNode[];
  blocked: KnowledgeNode[];
  pending: KnowledgeNode[];
  validated: KnowledgeNode[];
  rejected: KnowledgeNode[];
  confidence: number;
  evidence: number;
  health: number;
  rating: string;
  impact: number;
  knowledgeProduced: { type: KnowledgeNodeType; count: number }[];
  recent: KnowledgeNode[];
  timeline: { day: number; date: string; node: KnowledgeNode }[];
  openQuestions: string[];
  reuse: number;
}

const RATINGS: [number, string][] = [[90, 'A+'], [84, 'A'], [78, 'A-'], [72, 'B+'], [66, 'B'], [58, 'B-'], [0, 'C']];

export function departmentStats(name: string): DepartmentStats {
  const profile = PROFILE_BY_NAME[name] ?? {
    name, short: name, link: '/institution', purpose: 'Institutional department.', responsibilities: [],
  };
  const owned = departmentNodes(name);
  const by = (s: NodeStatus) => owned.filter((n) => n.status === s);
  const confidence = clamp(avg(owned.map((n) => n.confidence)));
  const evidence = clamp(avg(owned.map((n) => n.evidenceScore)));
  const blocked = by('blocked');
  const open = by('open').concat(by('active'));
  const rejected = by('rejected');
  const validated = by('validated');
  const reuse = owned.reduce((s, n) => s + outgoing(n.id).length, 0);
  const impact = clamp((reuse / Math.max(1, KNOWLEDGE_EDGES.length)) * 260);
  const health = clamp(confidence * 0.45 + evidence * 0.35 + (validated.length / Math.max(1, owned.length)) * 30 - blocked.length * 3);
  const counts = new Map<KnowledgeNodeType, number>();
  owned.forEach((n) => counts.set(n.type, (counts.get(n.type) ?? 0) + 1));
  return {
    profile, owned,
    workload: open.length + blocked.length,
    open, blocked, pending: open, validated, rejected,
    confidence, evidence, health,
    rating: RATINGS.find(([t]) => health >= t)![1],
    impact,
    knowledgeProduced: [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    recent: [...owned].sort((a, b) => dayOf(b.created) - dayOf(a.created)).slice(0, 6),
    timeline: [...owned].sort((a, b) => dayOf(a.created) - dayOf(b.created)).map((n) => ({ day: dayOf(n.created), date: n.created, node: n })),
    openQuestions: owned.flatMap((n) => n.futureResearch).slice(0, 8),
    reuse,
  };
}

export function allDepartmentStats(): DepartmentStats[] {
  return DEPARTMENT_PROFILES.map((d) => departmentStats(d.name)).sort((a, b) => b.impact - a.impact);
}

// ══════════════════════════════════════════════════════════
// Collaboration
// ══════════════════════════════════════════════════════════

export type CollabRole = 'requested' | 'validated' | 'approved' | 'rejected' | 'depends';

const ROLE_OF: Partial<Record<string, CollabRole>> = {
  created: 'requested', feeds: 'requested', inspired: 'requested', 'derived-from': 'requested',
  'validated-by': 'validated', supports: 'validated',
  'promoted-to': 'approved', 'archived-as': 'approved',
  contradicts: 'rejected', 'rejected-by': 'rejected',
  'depends-on': 'depends', 'used-by': 'depends', superseded: 'depends', 'blocked-by': 'depends',
};

export interface CollabLink {
  from: string; to: string; count: number; strength: number;
  roles: Record<CollabRole, number>;
  edges: { edge: KnowledgeEdge; role: CollabRole; fromNode: KnowledgeNode; toNode: KnowledgeNode }[];
}

const deptOf = (n?: KnowledgeNode) =>
  n ? (PROFILE_BY_NAME[n.department] ? n.department : 'Governance') : undefined;

export function collaborationLinks(): CollabLink[] {
  const map = new Map<string, CollabLink>();
  for (const e of KNOWLEDGE_EDGES) {
    const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
    const da = deptOf(a), db = deptOf(b);
    if (!a || !b || !da || !db || da === db) continue;
    const key = `${da}→${db}`;
    const role = ROLE_OF[e.type] ?? 'depends';
    const link = map.get(key) ?? {
      from: da, to: db, count: 0, strength: 0,
      roles: { requested: 0, validated: 0, approved: 0, rejected: 0, depends: 0 }, edges: [],
    };
    link.count += 1;
    link.roles[role] += 1;
    link.edges.push({ edge: e, role, fromNode: a, toNode: b });
    link.strength = clamp(avg(link.edges.map((x) => x.edge.confidence)));
    map.set(key, link);
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export type CollabBand = 'strong' | 'weak' | 'none';
export const collabBand = (count: number): CollabBand => (count >= 4 ? 'strong' : count >= 1 ? 'weak' : 'none');

export function collaborationMatrix() {
  const links = collaborationLinks();
  const names = DEPARTMENT_PROFILES.map((d) => d.name);
  const cell = (a: string, b: string) => links.find((l) => l.from === a && l.to === b);
  return { names, links, cell };
}

// ══════════════════════════════════════════════════════════
// Institution dashboard metrics
// ══════════════════════════════════════════════════════════

const byType = (t: KnowledgeNodeType) => KNOWLEDGE_NODES.filter((n) => n.type === t);
const evidenceCount = KNOWLEDGE_NODES.reduce((s, n) => s + n.supportingEvidence.length + n.counterEvidence.length, 0);

export interface MetricCard {
  key: string; label: string; value: string; sub: string; score: number; unit?: string; to?: string;
}

export function institutionMetrics(): MetricCard[] {
  const conf = clamp(avg(KNOWLEDGE_NODES.map((n) => n.confidence)));
  const ev = clamp(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)));
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked').length;
  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated').length;
  const openThreads = KNOWLEDGE_NODES.filter((n) => n.status === 'open' || n.status === 'active').length;
  const promo = byType('promotion').length;
  const memory = byType('memory').length + byType('lesson').length;
  const last30 = KNOWLEDGE_NODES.filter((n) => dayOf(n.created) >= TODAY_DAY - 30).length;
  const iq = clamp(conf * 0.3 + ev * 0.3 + (KNOWLEDGE_EDGES.length / KNOWLEDGE_NODES.length) * 22 + (validated / KNOWLEDGE_NODES.length) * 22);
  const orphans = KNOWLEDGE_NODES.filter((n) => degree(n.id) === 0).length;

  return [
    { key: 'research-health', label: 'Research Health', value: `${clamp(conf + 3)}`, unit: '/100', sub: `${validated} validated of ${KNOWLEDGE_NODES.length} objects`, score: clamp(conf + 3), to: '/institution/analytics' },
    { key: 'knowledge-health', label: 'Knowledge Health', value: `${clamp(100 - orphans * 6)}`, unit: '/100', sub: `${KNOWLEDGE_EDGES.length} relationships · ${orphans} unlinked`, score: clamp(100 - orphans * 6), to: '/knowledge-graph' },
    { key: 'governance-health', label: 'Governance Health', value: `${clamp(96 - blocked * 4)}`, unit: '/100', sub: `${blocked} blocked · all guardrails enforced`, score: clamp(96 - blocked * 4), to: '/governance' },
    { key: 'executive-confidence', label: 'Executive Confidence', value: `${clamp(conf - 2)}`, unit: '%', sub: 'Advisory only · human approval required', score: clamp(conf - 2), to: '/boardroom' },
    { key: 'memory', label: 'Institutional Memory', value: `${memory}`, sub: 'Memory and lesson objects retained permanently', score: clamp(60 + memory * 5), to: '/institution/museum' },
    { key: 'evidence-integrity', label: 'Evidence Integrity', value: `${ev}`, unit: '/100', sub: `${evidenceCount} evidence links attached`, score: ev, to: '/institution/analytics' },
    { key: 'pipeline', label: 'Promotion Pipeline', value: `${promo}`, sub: 'Promotion decisions on the ladder', score: clamp(50 + promo * 9), to: '/promotion-board' },
    { key: 'threads', label: 'Open Research Threads', value: `${openThreads}`, sub: 'Active or open objects awaiting conclusions', score: clamp(100 - openThreads * 3), to: '/institution/queue' },
    { key: 'growth', label: 'Knowledge Growth', value: `+${last30}`, sub: 'New objects in the last 30 simulation days', score: clamp(40 + last30 * 6), to: '/institution/analytics' },
    { key: 'iq', label: 'Institution IQ', value: `${iq}`, unit: '/100', sub: 'Confidence × evidence × connectivity × validation', score: iq, to: '/institution/score' },
    { key: 'velocity', label: 'Research Velocity', value: `${(KNOWLEDGE_NODES.length / (TODAY_DAY / 7)).toFixed(1)}`, unit: '/wk', sub: 'Objects produced per simulation week', score: clamp((KNOWLEDGE_NODES.length / (TODAY_DAY / 7)) * 26), to: '/institution/analytics' },
    { key: 'age', label: 'Institution Age', value: `${TODAY_DAY}`, unit: ' days', sub: `Founded ${dateOfDay(1)} · simulation clock`, score: clamp(TODAY_DAY / 2), to: '/institution/history' },
  ];
}

// ══════════════════════════════════════════════════════════
// Activity feed
// ══════════════════════════════════════════════════════════

export interface ActivityItem {
  day: number; date: string; department: string; text: string; objectId: string; kind: string;
}

export function activityFeed(limit = 140): ActivityItem[] {
  const out: ActivityItem[] = [];
  for (const n of KNOWLEDGE_NODES) {
    const day = dayOf(n.created);
    out.push({ day, date: n.created, department: n.department, objectId: n.id, kind: n.type,
      text: `${n.department} recorded ${NODE_TYPE_META[n.type].label.toLowerCase()} ${n.id} — ${n.title}` });
    if (n.supportingEvidence.length) {
      out.push({ day, date: n.created, department: 'AI Research Assistant', objectId: n.id, kind: 'evidence',
        text: `Research Assistant indexed ${n.id} with ${n.supportingEvidence.length} supporting evidence links` });
    }
    n.governanceHistory.slice(0, 1).forEach((g) => out.push({ day, date: n.created, department: 'Governance', objectId: n.id, kind: 'governance', text: `Governance: ${g} (${n.id})` }));
    n.promotionHistory.slice(0, 1).forEach((p) => out.push({ day, date: n.created, department: 'Executive Board', objectId: n.id, kind: 'promotion', text: `Executive Board: ${p} (${n.id})` }));
  }
  for (const e of KNOWLEDGE_EDGES) {
    const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
    if (!a || !b) continue;
    const day = Math.max(dayOf(a.created), dayOf(b.created));
    out.push({ day, date: dateOfDay(day), department: 'ATLAS Oracle', objectId: a.id, kind: 'relationship',
      text: `Oracle created relationship — ${a.id} ${RELATIONSHIP_META[e.type].label.toLowerCase()} ${b.id} at ${e.confidence}% confidence` });
  }
  return out.sort((a, b) => b.day - a.day).slice(0, limit);
}

// ══════════════════════════════════════════════════════════
// Calendar
// ══════════════════════════════════════════════════════════

export type CalendarKind = 'research' | 'validation' | 'promotion' | 'governance' | 'executive' | 'memory';

export const CALENDAR_KINDS: { key: CalendarKind; label: string }[] = [
  { key: 'research', label: 'Research' },
  { key: 'validation', label: 'Validation' },
  { key: 'promotion', label: 'Promotion' },
  { key: 'governance', label: 'Governance' },
  { key: 'executive', label: 'Executive Review' },
  { key: 'memory', label: 'Memory Archive' },
];

const CAL_OF: Record<KnowledgeNodeType, CalendarKind> = {
  question: 'research', hypothesis: 'research', experiment: 'research', thread: 'research',
  discovery: 'research', breakthrough: 'research', paper: 'research', specialist: 'research',
  portfolio: 'research', allocation: 'research', architecture: 'research', risk: 'governance',
  validation: 'validation', promotion: 'promotion', governance: 'governance',
  recommendation: 'executive', report: 'executive', department: 'executive',
  lesson: 'memory', memory: 'memory', rejected: 'memory',
};

export interface CalendarEvent {
  day: number; date: string; kind: CalendarKind; department: string; objectId: string; title: string; confidence: number;
}

export function calendarEvents(): CalendarEvent[] {
  return KNOWLEDGE_NODES.map((n) => ({
    day: dayOf(n.created), date: n.created, kind: CAL_OF[n.type], department: n.department,
    objectId: n.id, title: n.title, confidence: n.confidence,
  })).sort((a, b) => a.day - b.day);
}

// ══════════════════════════════════════════════════════════
// Work queue
// ══════════════════════════════════════════════════════════

export type QueueColumn = 'Pending' | 'Researching' | 'Validation' | 'Governance' | 'Waiting' | 'Completed' | 'Archived';
export const QUEUE_COLUMNS: QueueColumn[] = ['Pending', 'Researching', 'Validation', 'Governance', 'Waiting', 'Completed', 'Archived'];

export interface QueueCard {
  id: string; title: string; column: QueueColumn; department: string; owner: string;
  confidence: number; evidence: number; priority: 'High' | 'Medium' | 'Low';
  dependencies: string[]; dueDay: number; type: KnowledgeNodeType;
}

function columnOf(n: KnowledgeNode): QueueColumn {
  if (n.status === 'archived' || n.type === 'memory') return 'Archived';
  if (n.status === 'rejected') return 'Completed';
  if (n.status === 'blocked') return 'Governance';
  if (n.status === 'validated') return 'Completed';
  if (n.type === 'validation') return 'Validation';
  if (n.type === 'question') return 'Pending';
  if (n.type === 'promotion' || n.type === 'governance') return 'Governance';
  if (incoming(n.id).some((e) => NODE_BY_ID[e.from]?.status === 'blocked')) return 'Waiting';
  return 'Researching';
}

export function workQueue(): QueueCard[] {
  return KNOWLEDGE_NODES.map((n) => ({
    id: n.id, title: n.title, column: columnOf(n), department: n.department, owner: n.owner,
    confidence: n.confidence, evidence: n.evidenceScore, type: n.type,
    priority: n.confidence >= 80 ? 'High' : n.confidence >= 68 ? 'Medium' : 'Low',
    dependencies: incoming(n.id).map((e) => e.from).slice(0, 4),
    dueDay: dayOf(n.created) + 14,
  }));
}

// ══════════════════════════════════════════════════════════
// Analytics
// ══════════════════════════════════════════════════════════

export interface SeriesPoint { day: number; date: string; value: number }
export interface AnalyticsChart {
  key: string; label: string; unit: string; description: string;
  data: SeriesPoint[] | { name: string; value: number; id?: string }[];
  kind: 'line' | 'bar';
  evidence: { id: string; label: string }[];
}

const cumulative = (pred: (n: KnowledgeNode) => boolean, weight: (n: KnowledgeNode) => number = () => 1): SeriesPoint[] => {
  const pts: SeriesPoint[] = [];
  let acc = 0;
  for (let d = 0; d <= TODAY_DAY; d += 7) {
    acc = KNOWLEDGE_NODES.filter((n) => pred(n) && dayOf(n.created) <= d).reduce((s, n) => s + weight(n), 0);
    pts.push({ day: d, date: dateOfDay(Math.max(1, d)), value: Math.round(acc) });
  }
  return pts;
};

export function analyticsCharts(): AnalyticsChart[] {
  const ev = (nodes: KnowledgeNode[]) => nodes.slice(0, 6).map((n) => ({ id: n.id, label: `${n.id} · ${n.title}` }));
  const confTrend: SeriesPoint[] = [];
  for (let d = 7; d <= TODAY_DAY; d += 7) {
    const upTo = KNOWLEDGE_NODES.filter((n) => dayOf(n.created) <= d);
    confTrend.push({ day: d, date: dateOfDay(d), value: clamp(avg(upTo.map((n) => n.confidence))) });
  }
  const riskTrend: SeriesPoint[] = [];
  for (let d = 7; d <= TODAY_DAY; d += 7) {
    const upTo = KNOWLEDGE_NODES.filter((n) => dayOf(n.created) <= d);
    riskTrend.push({ day: d, date: dateOfDay(d), value: upTo.filter((n) => n.type === 'risk' || n.status === 'blocked').length });
  }
  const perDept = DEPARTMENT_PROFILES.map((d) => ({ name: d.short, value: departmentNodes(d.name).length, id: slug(d.name) }));
  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated');
  const rejected = KNOWLEDGE_NODES.filter((n) => n.status === 'rejected' || n.type === 'rejected');

  return [
    { key: 'knowledge-growth', label: 'Knowledge Growth', unit: 'objects', kind: 'line', description: 'Cumulative institutional objects recorded in the Knowledge Graph.', data: cumulative(() => true), evidence: ev(KNOWLEDGE_NODES) },
    { key: 'evidence-growth', label: 'Evidence Growth', unit: 'links', kind: 'line', description: 'Cumulative supporting and counter-evidence links attached to objects.', data: cumulative(() => true, (n) => n.supportingEvidence.length + n.counterEvidence.length), evidence: ev([...KNOWLEDGE_NODES].sort((a, b) => b.evidenceScore - a.evidenceScore)) },
    { key: 'confidence-trend', label: 'Confidence Trend', unit: '%', kind: 'line', description: 'Institution-wide mean research confidence over the simulation clock.', data: confTrend, evidence: ev([...KNOWLEDGE_NODES].sort((a, b) => b.confidence - a.confidence)) },
    { key: 'department-productivity', label: 'Department Productivity', unit: 'objects', kind: 'bar', description: 'Objects owned per department.', data: perDept, evidence: [] },
    { key: 'research-velocity', label: 'Research Velocity', unit: 'objects/wk', kind: 'bar', description: 'Objects created per simulation week.', data: (() => {
      const buckets = new Map<number, number>();
      KNOWLEDGE_NODES.forEach((n) => { const w = Math.floor(dayOf(n.created) / 7); buckets.set(w, (buckets.get(w) ?? 0) + 1); });
      return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([w, v]) => ({ name: `W${w}`, value: v }));
    })(), evidence: [] },
    { key: 'validation-rate', label: 'Validation Rate', unit: 'objects', kind: 'line', description: 'Cumulative validated objects — the institution\'s proof output.', data: cumulative((n) => n.status === 'validated'), evidence: ev(validated) },
    { key: 'promotion-rate', label: 'Promotion Rate', unit: 'decisions', kind: 'line', description: 'Cumulative promotion decisions on the advisory ladder.', data: cumulative((n) => n.type === 'promotion'), evidence: ev(byType('promotion')) },
    { key: 'rejected-research', label: 'Rejected Research', unit: 'objects', kind: 'line', description: 'Research formally closed — retained permanently as institutional memory.', data: cumulative((n) => n.status === 'rejected' || n.type === 'rejected'), evidence: ev(rejected) },
    { key: 'memory-growth', label: 'Institution Memory Growth', unit: 'objects', kind: 'line', description: 'Cumulative memory and lesson objects archived.', data: cumulative((n) => n.type === 'memory' || n.type === 'lesson'), evidence: ev([...byType('memory'), ...byType('lesson')]) },
    { key: 'risk-trend', label: 'Risk Trend', unit: 'open risks', kind: 'line', description: 'Open risk objects and governance-blocked research over time.', data: riskTrend, evidence: ev([...byType('risk'), ...KNOWLEDGE_NODES.filter((n) => n.status === 'blocked')]) },
  ];
}

// ══════════════════════════════════════════════════════════
// Institution Score
// ══════════════════════════════════════════════════════════

export interface ScoreComponent { key: string; label: string; score: number; weight: number; explanation: string }

export function institutionScore(): { total: number; grade: string; components: ScoreComponent[] } {
  const conf = clamp(avg(KNOWLEDGE_NODES.map((n) => n.confidence)));
  const ev = clamp(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)));
  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated').length;
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked').length;
  const reuse = clamp((KNOWLEDGE_EDGES.length / KNOWLEDGE_NODES.length) * 42);
  const depts = allDepartmentStats();
  const efficiency = clamp(avg(depts.map((d) => d.health)));
  const memory = clamp(60 + (byType('memory').length + byType('lesson').length) * 6);
  const iq = clamp(conf * 0.3 + ev * 0.3 + reuse * 0.2 + (validated / KNOWLEDGE_NODES.length) * 20);

  const components: ScoreComponent[] = [
    { key: 'research-quality', label: 'Research Quality', score: clamp(conf + 2), weight: 0.15, explanation: `Mean research confidence across ${KNOWLEDGE_NODES.length} objects, adjusted for the ${validated} objects that reached validated status.` },
    { key: 'evidence-quality', label: 'Evidence Quality', score: ev, weight: 0.15, explanation: `Mean evidence score. ${evidenceCount} supporting and counter-evidence links are attached across the graph.` },
    { key: 'governance', label: 'Governance', score: clamp(96 - blocked * 4), weight: 0.12, explanation: `All ten permanent guardrails enforced. ${blocked} research objects are currently held behind human-approval gates.` },
    { key: 'knowledge-reuse', label: 'Knowledge Reuse', score: reuse, weight: 0.12, explanation: `${KNOWLEDGE_EDGES.length} relationships across ${KNOWLEDGE_NODES.length} objects — an average of ${(KNOWLEDGE_EDGES.length / KNOWLEDGE_NODES.length).toFixed(1)} connections per object.` },
    { key: 'department-efficiency', label: 'Department Efficiency', score: efficiency, weight: 0.12, explanation: `Mean department health across ${depts.length} departments, weighted by validated output and blocked workload.` },
    { key: 'institution-confidence', label: 'Institution Confidence', score: conf, weight: 0.1, explanation: 'Aggregate confidence the institution holds in its own current conclusions.' },
    { key: 'executive-confidence', label: 'Executive Confidence', score: clamp(conf - 2), weight: 0.1, explanation: 'Executive Board advisory confidence — deliberately below research confidence because every verdict requires human approval.' },
    { key: 'memory-health', label: 'Memory Health', score: memory, weight: 0.07, explanation: 'Nothing is ever deleted. Memory health reflects the volume and connectivity of archived lessons and memory objects.' },
    { key: 'institution-iq', label: 'Institution IQ', score: iq, weight: 0.07, explanation: 'Composite of confidence, evidence, connectivity and validation ratio — how well the institution converts questions into proven knowledge.' },
  ];
  const total = clamp(components.reduce((s, c) => s + c.score * c.weight, 0));
  const grade = total >= 90 ? 'A+' : total >= 84 ? 'A' : total >= 78 ? 'A-' : total >= 72 ? 'B+' : total >= 65 ? 'B' : 'C';
  return { total, grade, components };
}

// ══════════════════════════════════════════════════════════
// History
// ══════════════════════════════════════════════════════════

export type HistoryKind = 'version' | 'discovery' | 'breakthrough' | 'decision' | 'milestone' | 'memory' | 'birthday';

export interface HistoryEntry {
  day: number; date: string; kind: HistoryKind; title: string; detail: string; objectId?: string; department?: string;
}

export const PLATFORM_VERSIONS: HistoryEntry[] = [
  { day: 1, date: dateOfDay(1), kind: 'birthday', title: 'Institution founded', detail: 'ATLAS™ opened as a simulation-only research institution. Observation, research and read-only from day one.' },
  { day: 40, date: dateOfDay(40), kind: 'version', title: 'ATLAS™ v1.0 — Research OS', detail: 'Eight AI departments coordinated through the Consensus Engine and Intelligence Bus.' },
  { day: 76, date: dateOfDay(76), kind: 'version', title: 'Phase 2 — Institutional Knowledge Graph™', detail: 'Permanent reasoning memory: every object connected through explainable relationships.' },
  { day: 104, date: dateOfDay(104), kind: 'version', title: 'Phase 3 — Intelligence Explorer™', detail: 'Every research object received a permanent digital identity with Research Replay™ and Time Machine™.' },
  { day: 126, date: dateOfDay(126), kind: 'version', title: 'Phase 4 — ATLAS Oracle™', detail: 'Evidence-backed conversational reasoning over the Knowledge Graph.' },
  { day: 141, date: dateOfDay(141), kind: 'version', title: 'Phase 5 — Institutional Intelligence Layer', detail: 'Oracle Thinking™, Command Palette™, Executive Boardroom™ and the Institutional Digital Twin™.' },
  { day: TODAY_DAY, date: dateOfDay(TODAY_DAY), kind: 'version', title: 'ATLAS OS™ v2.0 — Institutional Operating System', detail: 'Departments, collaboration, calendar, work queues, analytics, score, history and museum.' },
];

export function institutionHistory(): HistoryEntry[] {
  const fromNodes: HistoryEntry[] = KNOWLEDGE_NODES
    .filter((n) => ['breakthrough', 'discovery', 'promotion', 'governance', 'memory', 'department'].includes(n.type))
    .map((n) => ({
      day: dayOf(n.created), date: n.created, objectId: n.id, department: n.department,
      kind: (n.type === 'breakthrough' ? 'breakthrough'
        : n.type === 'discovery' ? 'discovery'
        : n.type === 'memory' ? 'memory'
        : n.type === 'department' ? 'milestone' : 'decision') as HistoryKind,
      title: n.title, detail: n.summary,
    }));
  return [...PLATFORM_VERSIONS, ...fromNodes].sort((a, b) => a.day - b.day);
}

// ══════════════════════════════════════════════════════════
// Museum
// ══════════════════════════════════════════════════════════

export interface MuseumExhibit {
  node: KnowledgeNode; era: string; significance: number;
  relationships: number; departments: string[]; epitaph: string;
}

export function museumExhibits(): MuseumExhibit[] {
  return KNOWLEDGE_NODES.map((n) => {
    const rel = connections(n.id);
    const departments = [...new Set(rel.map((e) => NODE_BY_ID[e.from === n.id ? e.to : e.from]?.department).filter(Boolean) as string[])];
    const d = dayOf(n.created);
    const era = d <= 60 ? 'Founding Era' : d <= 110 ? 'Expansion Era' : d <= 145 ? 'Specialist Era' : 'Institutional Era';
    return {
      node: n, era, relationships: rel.length, departments,
      significance: clamp(n.confidence * 0.4 + n.evidenceScore * 0.3 + rel.length * 5),
      epitaph: n.status === 'rejected'
        ? 'Closed research, permanently retained. The institution keeps its failures so they are never repeated.'
        : n.status === 'validated'
          ? 'Validated knowledge still in active institutional use.'
          : 'Open research on permanent record.',
    };
  }).sort((a, b) => b.significance - a.significance);
}

export const MUSEUM_ERAS = ['Founding Era', 'Expansion Era', 'Specialist Era', 'Institutional Era'];

// ══════════════════════════════════════════════════════════
// Institution AI Guide
// ══════════════════════════════════════════════════════════

export interface GuideAnswer {
  title: string; body: string; bullets: string[];
  links: { label: string; to: string }[];
}

export function guideAnswer(query: string, contextId?: string): GuideAnswer {
  const q = query.trim().toLowerCase();
  const node = contextId ? NODE_BY_ID[contextId] : undefined;
  const idMatch = KNOWLEDGE_NODES.find((n) => q.includes(n.id.toLowerCase()))
    ?? KNOWLEDGE_NODES.find((n) => q.length > 3 && n.title.toLowerCase().includes(q));
  const target = idMatch ?? node;

  const linkFor = (n?: KnowledgeNode) => n ? [
    { label: 'Open in Explorer', to: `/explorer/${n.id}` },
    { label: 'Open in Oracle', to: '/oracle' },
    { label: 'Open Knowledge Graph', to: '/knowledge-graph' },
  ] : [
    { label: 'Open Institution', to: '/institution' },
    { label: 'Open Oracle', to: '/oracle' },
    { label: 'Open Knowledge Graph', to: '/knowledge-graph' },
  ];

  if (/depart|team|who owns/.test(q)) {
    const dept = DEPARTMENT_PROFILES.find((d) => q.includes(d.name.toLowerCase()) || q.includes(d.short.toLowerCase()));
    if (dept) {
      const s = departmentStats(dept.name);
      return {
        title: `${dept.name}`, body: `${dept.purpose} It currently owns ${s.owned.length} institutional objects with ${s.confidence}% mean confidence, an executive rating of ${s.rating} and a workload of ${s.workload} open items.`,
        bullets: [
          `Validated output: ${s.validated.length} objects`,
          `Blocked research: ${s.blocked.length} objects awaiting human approval`,
          `Institution impact: ${s.impact}/100 via ${s.reuse} downstream reuses`,
        ],
        links: [{ label: 'Open department', to: `/institution/departments/${slug(dept.name)}` }, { label: 'Collaboration map', to: '/institution/collaboration' }],
      };
    }
    const all = allDepartmentStats();
    return {
      title: 'Institution departments',
      body: `ATLAS operates ${all.length} departments. ${all[0].profile.name} currently carries the highest institution impact at ${all[0].impact}/100.`,
      bullets: all.slice(0, 6).map((d) => `${d.profile.name} — ${d.owned.length} objects · rating ${d.rating} · health ${d.health}`),
      links: [{ label: 'Open Departments', to: '/institution/departments' }],
    };
  }

  if (/contradict|conflict|disagree/.test(q)) {
    const conflicts = KNOWLEDGE_EDGES.filter((e) => e.type === 'contradicts' || e.type === 'rejected-by');
    return {
      title: 'Contradictions on record',
      body: `The Knowledge Graph holds ${conflicts.length} contradiction or rejection relationships. Contradictions are never deleted — they remain part of institutional memory.`,
      bullets: conflicts.slice(0, 6).map((e) => `${e.from} ${RELATIONSHIP_META[e.type].label.toLowerCase()} ${e.to} — ${e.note}`),
      links: [{ label: 'Open Knowledge Graph', to: '/knowledge-graph' }, { label: 'Open Museum', to: '/institution/museum' }],
    };
  }

  if (/score|iq|health of the institution|institution score/.test(q)) {
    const s = institutionScore();
    return {
      title: `Institution Score — ${s.total}/100 (${s.grade})`,
      body: 'The score is a weighted composite of nine institutional components. Every component is derived from the Knowledge Graph and is fully explainable.',
      bullets: s.components.map((c) => `${c.label}: ${c.score} (weight ${Math.round(c.weight * 100)}%)`),
      links: [{ label: 'Open Institution Score', to: '/institution/score' }],
    };
  }

  if (/timeline|history|when/.test(q)) {
    const h = institutionHistory().slice(-6).reverse();
    return {
      title: 'Institution timeline',
      body: `The institution is ${TODAY_DAY} simulation days old. The most recent institutional events are listed below.`,
      bullets: h.map((e) => `Day ${e.day} · ${e.date} — ${e.title}`),
      links: [{ label: 'Open History', to: '/institution/history' }, { label: 'Open Calendar', to: '/calendar' }],
    };
  }

  if (target) {
    const inc = incoming(target.id), out = outgoing(target.id);
    return {
      title: `${target.id} · ${target.title}`,
      body: `${target.summary} Owned by ${target.owner} in ${target.department}, carrying ${target.confidence}% confidence and an evidence score of ${target.evidenceScore}. It draws on ${inc.length} upstream objects and influences ${out.length} downstream objects.`,
      bullets: [
        ...target.supportingEvidence.slice(0, 3).map((e) => `Supporting: ${e}`),
        ...target.counterEvidence.slice(0, 2).map((e) => `Counter: ${e}`),
        `Status: ${target.status}`,
      ],
      links: linkFor(target),
    };
  }

  const metrics = institutionMetrics();
  return {
    title: 'Institutional overview',
    body: `ATLAS holds ${KNOWLEDGE_NODES.length} institutional objects connected by ${KNOWLEDGE_EDGES.length} explainable relationships across ${DEPARTMENT_PROFILES.length} departments. Ask about an object ID, a department, the institution score, contradictions or the timeline.`,
    bullets: metrics.slice(0, 5).map((m) => `${m.label}: ${m.value}${m.unit ?? ''} — ${m.sub}`),
    links: linkFor(),
  };
}

export const GUIDE_PROMPTS = [
  'Explain the institution score',
  'Summarise the AI Quant Scientist department',
  'Show contradictions on record',
  'Show the institution timeline',
  'Explain EXP-052',
];
