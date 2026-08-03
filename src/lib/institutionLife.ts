// ATLAS OS™ v3.0 — Living Institution Layer
// Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required
// No live trading · No API keys · No exchange connectivity · No strategy modification · No automatic allocation.
// Every value below is deterministically derived from the Institutional Knowledge Graph.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META,
  connections, outgoing, incoming, degree,
  type KnowledgeNode,
} from './knowledgeGraph';
import { dayOf, dateOfDay, TODAY_DAY } from './intelligenceExplorer';
import {
  DEPARTMENT_PROFILES, allDepartmentStats, departmentStats, institutionScore,
  collaborationLinks, slug, type DepartmentProfile,
} from './institutionOS';

export const LIFE_VERSION = 'ATLAS OS™ v3.0 · Living Institution';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
/** Deterministic pseudo-random in [0,1) from a string seed. */
export function seeded(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const pick = <T,>(arr: T[], seed: string): T => arr[Math.floor(seeded(seed) * arr.length) % arr.length];

const byDay = [...KNOWLEDGE_NODES].sort((a, b) => dayOf(a.created) - dayOf(b.created));

// ══════════════════════════════════════════════════════════
// FEATURE 1 — Institution Pulse™
// ══════════════════════════════════════════════════════════

export type PulseTone = 'excellent' | 'good' | 'moderate' | 'watch';

export interface PulseSignal {
  key: string;
  label: string;
  state: string;
  tone: PulseTone;
  score: number;
  why: string;
  to?: string;
}

const tone = (s: number): PulseTone => (s >= 85 ? 'excellent' : s >= 72 ? 'good' : s >= 58 ? 'moderate' : 'watch');

export function institutionPulse(): { headline: string; tone: PulseTone; score: number; signals: PulseSignal[] } {
  const score = institutionScore();
  const depts = allDepartmentStats();
  const recent = KNOWLEDGE_NODES.filter((n) => TODAY_DAY - dayOf(n.created) <= 30);
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked');
  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated');
  const open = KNOWLEDGE_NODES.filter((n) => n.status === 'open' || n.status === 'active');
  const conf = clamp(avg(KNOWLEDGE_NODES.map((n) => n.confidence)));
  const evid = clamp(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)));
  const collab = collaborationLinks();
  const strongCollab = clamp((collab.length / (DEPARTMENT_PROFILES.length * 3)) * 100);
  const promotionReady = KNOWLEDGE_NODES.filter((n) => n.promotionHistory.length > 0);
  const activityScore = clamp((recent.length / Math.max(1, KNOWLEDGE_NODES.length)) * 260);
  const growth = clamp((validated.length / Math.max(1, KNOWLEDGE_NODES.length)) * 190);
  const govRisk = clamp(100 - (blocked.length / Math.max(1, KNOWLEDGE_NODES.length)) * 320);
  const memory = clamp(avg(KNOWLEDGE_NODES.map((n) => (n.supportingEvidence.length + n.counterEvidence.length > 0 ? 100 : 55))));
  const promoScore = clamp((promotionReady.length / Math.max(1, KNOWLEDGE_NODES.length)) * 300);

  const signals: PulseSignal[] = [
    { key: 'health', label: 'Institution', state: score.total >= 85 ? 'Healthy' : score.total >= 70 ? 'Stable' : 'Needs attention', tone: tone(score.total), score: score.total,
      why: `Institution Score ${score.total} (${score.grade}) across ${score.components.length} weighted components.`, to: '/institution/score' },
    { key: 'activity', label: 'Research activity', state: activityScore >= 80 ? 'High' : activityScore >= 55 ? 'Steady' : 'Low', tone: tone(activityScore), score: activityScore,
      why: `${recent.length} research objects created in the last 30 simulated days.`, to: '/observatory' },
    { key: 'growth', label: 'Knowledge growth', state: growth >= 80 ? 'Accelerating' : growth >= 55 ? 'Compounding' : 'Flat', tone: tone(growth), score: growth,
      why: `${validated.length} of ${KNOWLEDGE_NODES.length} objects validated; ${KNOWLEDGE_EDGES.length} relationships mapped.`, to: '/knowledge-graph' },
    { key: 'governance', label: 'Governance risk', state: govRisk >= 85 ? 'Low' : govRisk >= 65 ? 'Contained' : 'Elevated', tone: tone(govRisk), score: govRisk,
      why: `${blocked.length} object(s) blocked by guardrails; every promotion remains human-approval gated.`, to: '/institution/decisions' },
    { key: 'confidence', label: 'Executive confidence', state: conf >= 78 ? 'Rising' : conf >= 62 ? 'Holding' : 'Softening', tone: tone(conf), score: conf,
      why: `Mean object confidence ${conf}% weighted evenly across all departments.`, to: '/boardroom' },
    { key: 'collab', label: 'Department collaboration', state: strongCollab >= 78 ? 'Strong' : strongCollab >= 50 ? 'Active' : 'Sparse', tone: tone(strongCollab), score: strongCollab,
      why: `${collab.length} cross-department relationships across ${DEPARTMENT_PROFILES.length} departments.`, to: '/institution/collaboration' },
    { key: 'promotion', label: 'Promotion readiness', state: promoScore >= 78 ? 'High' : promoScore >= 50 ? 'Moderate' : 'Early', tone: tone(promoScore), score: promoScore,
      why: `${promotionReady.length} objects carry promotion history; all remain advisory-only.`, to: '/institution/decisions' },
    { key: 'memory', label: 'Memory integrity', state: memory >= 88 ? 'Excellent' : memory >= 70 ? 'Good' : 'Partial', tone: tone(memory), score: memory,
      why: `${evid}% mean evidence score; every object retains a permanent audit trail.`, to: '/institution/history' },
    { key: 'workload', label: 'Department workload', state: open.length > 12 ? 'Heavy' : open.length > 6 ? 'Balanced' : 'Light', tone: tone(clamp(100 - open.length * 3)), score: clamp(100 - open.length * 3),
      why: `${open.length} open or active items distributed across ${depts.length} departments.`, to: '/institution/queue' },
  ];

  return {
    headline: score.total >= 85 ? 'Institution is Healthy' : score.total >= 70 ? 'Institution is Stable' : 'Institution requires attention',
    tone: tone(score.total),
    score: score.total,
    signals,
  };
}

// ══════════════════════════════════════════════════════════
// FEATURE 2 — Autonomous Department Cycle™
// ══════════════════════════════════════════════════════════

export type CycleKind = 'discovery' | 'design' | 'index' | 'measure' | 'schedule' | 'audit' | 'question' | 'approve' | 'review';

export interface CycleTask {
  id: string;
  department: string;
  short: string;
  kind: CycleKind;
  action: string;
  detail: string;
  objectId: string;
  objectTitle: string;
  day: number;
  date: string;
  output: string;
  status: 'running' | 'queued' | 'completed';
  confidence: number;
}

const CYCLE_BY_DEPT: Record<string, { kind: CycleKind; action: string; output: string }[]> = {
  'AI Research Brain': [
    { kind: 'discovery', action: 'Discovers unexplained behaviour in', output: 'Origin question' },
    { kind: 'question', action: 'Raises a research question about', output: 'Agenda item' },
  ],
  'AI Quant Scientist': [
    { kind: 'design', action: 'Designs a validation experiment for', output: 'Experiment design' },
    { kind: 'review', action: 'Peer-reviews the specification of', output: 'Peer review note' },
  ],
  'Portfolio AI Director': [
    { kind: 'measure', action: 'Measures simulated portfolio impact of', output: 'Impact measurement' },
  ],
  'AI Chief Investment Officer': [
    { kind: 'review', action: 'Prepares an executive read-out on', output: 'Executive note' },
  ],
  'Mission Control': [
    { kind: 'schedule', action: 'Schedules an investigation window for', output: 'Scheduled investigation' },
  ],
  'Executive Board': [
    { kind: 'approve', action: 'Approves or delays further research on', output: 'Advisory verdict' },
  ],
  'Autonomous Research Engine': [
    { kind: 'discovery', action: 'Runs an overnight scan across', output: 'Discovery candidate' },
  ],
  'AI Research Assistant': [
    { kind: 'index', action: 'Indexes new evidence attached to', output: 'Evidence index entry' },
  ],
  'ATLAS Oracle': [
    { kind: 'question', action: 'Generates follow-up questions from', output: 'Follow-up question' },
  ],
  Governance: [
    { kind: 'audit', action: 'Audits the evidence trail of', output: 'Governance audit record' },
  ],
};

/** Continuous simulated work per department, derived from the objects each department touches. */
export function departmentCycle(limit = 60): CycleTask[] {
  const tasks: CycleTask[] = [];
  for (const profile of DEPARTMENT_PROFILES) {
    const stats = departmentStats(profile.name);
    const pool = (stats.recent.length ? stats.recent : stats.owned).slice(0, 6);
    const templates = CYCLE_BY_DEPT[profile.name] ?? [{ kind: 'review' as CycleKind, action: 'Reviews', output: 'Research note' }];
    pool.forEach((node, i) => {
      const t = templates[i % templates.length];
      const r = seeded(`${profile.name}-${node.id}`);
      const day = Math.max(0, TODAY_DAY - Math.floor(r * 9));
      tasks.push({
        id: `CYC-${slug(profile.short)}-${node.id}`,
        department: profile.name,
        short: profile.short,
        kind: t.kind,
        action: t.action,
        detail: node.summary,
        objectId: node.id,
        objectTitle: node.title,
        day,
        date: dateOfDay(day),
        output: t.output,
        status: day >= TODAY_DAY ? 'running' : r > 0.72 ? 'queued' : 'completed',
        confidence: clamp(node.confidence),
      });
    });
  }
  return tasks.sort((a, b) => b.day - a.day || a.department.localeCompare(b.department)).slice(0, limit);
}

// ══════════════════════════════════════════════════════════
// FEATURE 3 — Institution Conversations™
// ══════════════════════════════════════════════════════════

export interface ConversationMessage {
  id: string;
  department: string;
  short: string;
  text: string;
  evidence: string[];
  objectId: string;
  day: number;
  date: string;
  stance: 'proposes' | 'challenges' | 'supports' | 'schedules' | 'defers';
}

export interface Conversation {
  id: string;
  topic: string;
  objectId: string;
  objectTitle: string;
  day: number;
  date: string;
  status: 'open' | 'resolved' | 'awaiting-approval';
  messages: ConversationMessage[];
}

/** Threads generated from objects with the richest evidence / governance context. */
export function conversations(limit = 14): Conversation[] {
  const candidates = [...KNOWLEDGE_NODES]
    .filter((n) => n.supportingEvidence.length + n.counterEvidence.length > 0)
    .sort((a, b) => (b.supportingEvidence.length + b.counterEvidence.length + degree(b.id)) - (a.supportingEvidence.length + a.counterEvidence.length + degree(a.id)))
    .slice(0, limit);

  return candidates.map((node) => {
    const day = Math.max(0, TODAY_DAY - Math.floor(seeded(`conv-${node.id}`) * 22));
    const supporting = node.supportingEvidence.slice(0, 2);
    const counter = node.counterEvidence.slice(0, 2);
    const contradiction = counter.length > 0;
    const owner = node.department;
    const mk = (department: string, short: string, text: string, stance: ConversationMessage['stance'], evidence: string[], offset: number): ConversationMessage => ({
      id: `MSG-${node.id}-${offset}`,
      department, short, text, evidence, objectId: node.id,
      day: Math.min(TODAY_DAY, day + offset), date: dateOfDay(Math.min(TODAY_DAY, day + offset)), stance,
    });

    const messages: ConversationMessage[] = [
      mk(owner, owner.split(' ').pop() ?? owner, `I believe ${node.id} deserves further promotion research — ${node.summary}`, 'proposes', supporting, 0),
      mk('Governance', 'Governance', contradiction
        ? `Evidence is insufficient. ${counter.length} counter-evidence item(s) remain unresolved on ${node.id}.`
        : `Evidence trail on ${node.id} is complete, but promotion stays locked pending human approval.`, 'challenges', counter.length ? counter : node.governanceHistory.slice(0, 2), 1),
      mk('ATLAS Oracle', 'Oracle', contradiction
        ? `I found a contradiction: supporting and counter evidence on ${node.id} disagree on ${node.type} durability.`
        : `No contradictions detected across ${degree(node.id)} relationships attached to ${node.id}.`, contradiction ? 'challenges' : 'supports', supporting.slice(0, 1), 2),
      mk('Mission Control', 'Mission', `Scheduling validation for ${node.id} in the next simulated research window.`, 'schedules', node.futureResearch.slice(0, 2), 3),
      mk('Executive Board', 'Board', contradiction
        ? `Awaiting board consensus — research continues, no allocation or strategy change is implied.`
        : `Advisory consensus forming. Human approval still required before any promotion.`, 'defers', node.promotionHistory.slice(0, 2), 4),
    ];

    return {
      id: `CONV-${node.id}`,
      topic: `${node.id} · ${node.title}`,
      objectId: node.id,
      objectTitle: node.title,
      day, date: dateOfDay(day),
      status: (contradiction ? 'open' : node.status === 'validated' ? 'awaiting-approval' : 'resolved') as Conversation['status'],
      messages,
    };
  }).sort((a, b) => b.day - a.day);
}

// ══════════════════════════════════════════════════════════
// FEATURE 4 — Institution Decisions™
// ══════════════════════════════════════════════════════════

export interface DecisionVote { department: string; vote: 'for' | 'against' | 'abstain'; rationale: string }

export interface InstitutionDecision {
  id: string;
  decision: string;
  objectId: string;
  objectTitle: string;
  departments: string[];
  supporting: string[];
  counter: string[];
  confidence: number;
  votes: DecisionVote[];
  reasoning: string[];
  outcome: 'Approved for further research' | 'Delayed pending evidence' | 'Blocked by governance' | 'Archived as lesson';
  day: number;
  date: string;
  linked: string[];
}

export function institutionDecisions(): InstitutionDecision[] {
  const pool = KNOWLEDGE_NODES.filter(
    (n) => n.promotionHistory.length > 0 || n.governanceHistory.length > 0 || n.status === 'validated' || n.status === 'blocked' || n.status === 'rejected',
  );

  return pool.map((node) => {
    const day = dayOf(node.created) + Math.floor(seeded(`dec-${node.id}`) * 12);
    const supporting = node.supportingEvidence;
    const counter = node.counterEvidence;
    const confidence = clamp((node.confidence * 0.6) + (node.evidenceScore * 0.4));
    const involved = Array.from(new Set([node.department, 'Governance', 'Executive Board', 'ATLAS Oracle']));
    const votes: DecisionVote[] = involved.map((d) => {
      const r = seeded(`vote-${node.id}-${d}`);
      const vote: DecisionVote['vote'] =
        node.status === 'blocked' || node.status === 'rejected' ? (d === 'Governance' ? 'against' : r > 0.6 ? 'abstain' : 'against')
          : confidence >= 70 ? (r > 0.86 ? 'abstain' : 'for')
            : r > 0.5 ? 'for' : 'abstain';
      return {
        department: d, vote,
        rationale: vote === 'for'
          ? `${d} finds the evidence trail sufficient for continued research (confidence ${confidence}%).`
          : vote === 'against'
            ? `${d} finds unresolved counter-evidence (${counter.length} item(s)) on ${node.id}.`
            : `${d} abstains — outcome does not fall inside its mandate.`,
      };
    });

    const outcome: InstitutionDecision['outcome'] =
      node.status === 'blocked' ? 'Blocked by governance'
        : node.status === 'rejected' ? 'Archived as lesson'
          : confidence >= 70 && counter.length === 0 ? 'Approved for further research'
            : 'Delayed pending evidence';

    return {
      id: `DEC-${node.id}`,
      decision: `${outcome.split(' ')[0]} — ${node.title}`,
      objectId: node.id,
      objectTitle: node.title,
      departments: involved,
      supporting, counter, confidence, votes,
      reasoning: [
        `${node.id} is a ${NODE_TYPE_META[node.type].label.toLowerCase()} owned by ${node.department}.`,
        `${supporting.length} supporting and ${counter.length} counter-evidence items were weighed.`,
        `Confidence ${node.confidence}% and evidence score ${node.evidenceScore}% produce a combined ${confidence}%.`,
        ...node.governanceHistory.slice(0, 2),
        'Outcome is advisory only — human approval is required and no allocation or strategy changes follow.',
      ],
      outcome,
      day, date: dateOfDay(Math.min(day, TODAY_DAY)),
      linked: connections(node.id).map((e) => (e.from === node.id ? e.to : e.from)).slice(0, 8),
    };
  }).sort((a, b) => b.day - a.day);
}

// ══════════════════════════════════════════════════════════
// FEATURE 5 — Knowledge Evolution™
// ══════════════════════════════════════════════════════════

export interface EvolutionVersion {
  version: string;
  day: number;
  date: string;
  label: string;
  confidence: number;
  evidence: number;
  relationships: number;
  note: string;
}

export interface KnowledgeEvolution {
  node: KnowledgeNode;
  versions: EvolutionVersion[];
  reuse: number;
  interactions: { department: string; count: number }[];
  promotionProgress: number;
  importance: number;
  confidenceTrend: { day: number; date: string; value: number }[];
}

export function knowledgeEvolution(id: string): KnowledgeEvolution | null {
  const node = NODE_BY_ID[id];
  if (!node) return null;
  const born = dayOf(node.created);
  const rel = degree(node.id);
  const stages = [
    { label: 'Created', note: node.summary },
    { label: 'Evidence attached', note: `${node.supportingEvidence.length} supporting item(s) recorded.` },
    { label: 'Relationships mapped', note: `${rel} relationship(s) connected in the Knowledge Graph.` },
    { label: 'Reviewed', note: node.governanceHistory[0] ?? 'Reviewed against institutional guardrails.' },
    { label: 'Current state', note: `Status ${node.status}; ${node.currentUsage.length} active usage reference(s).` },
  ];
  const span = Math.max(4, TODAY_DAY - born);
  const versions: EvolutionVersion[] = stages.map((s, i) => {
    const day = Math.min(TODAY_DAY, born + Math.round((span / (stages.length - 1)) * i));
    const p = i / (stages.length - 1);
    return {
      version: `v0.${i + 1}`,
      day, date: dateOfDay(day),
      label: s.label,
      confidence: clamp(node.confidence * (0.55 + 0.45 * p)),
      evidence: Math.round((node.supportingEvidence.length + node.counterEvidence.length) * (0.3 + 0.7 * p)),
      relationships: Math.round(rel * (0.25 + 0.75 * p)),
      note: s.note,
    };
  });

  const interactions = DEPARTMENT_PROFILES.map((d) => ({
    department: d.short,
    count: connections(node.id).filter((e) => {
      const other = NODE_BY_ID[e.from === node.id ? e.to : e.from];
      return other?.department === d.name;
    }).length + (node.department === d.name ? 2 : 0),
  })).filter((x) => x.count > 0);

  return {
    node,
    versions,
    reuse: node.currentUsage.length + outgoing(node.id).filter((e) => e.type === 'used-by' || e.type === 'feeds').length,
    interactions,
    promotionProgress: clamp(node.promotionHistory.length * 25 + (node.status === 'validated' ? 40 : 0) + node.confidence * 0.3),
    importance: clamp(rel * 6 + node.confidence * 0.4 + node.evidenceScore * 0.3),
    confidenceTrend: versions.map((v) => ({ day: v.day, date: v.date, value: v.confidence })),
  };
}

export function topEvolvingObjects(limit = 12): KnowledgeEvolution[] {
  return [...KNOWLEDGE_NODES]
    .sort((a, b) => degree(b.id) - degree(a.id))
    .slice(0, limit)
    .map((n) => knowledgeEvolution(n.id)!)
    .filter(Boolean);
}

// ══════════════════════════════════════════════════════════
// FEATURE 6 — Institution Forecast™
// ══════════════════════════════════════════════════════════

export interface ForecastItem {
  id: string;
  category: 'Discovery' | 'Promotion' | 'Rejection' | 'Knowledge growth' | 'Governance workload' | 'Department workload' | 'Evidence expansion';
  title: string;
  probability: number;
  horizon: string;
  reasoning: string[];
  linked: string[];
}

export function institutionForecast(): ForecastItem[] {
  const items: ForecastItem[] = [];
  const active = KNOWLEDGE_NODES.filter((n) => n.status === 'active' || n.status === 'open');
  const validated = KNOWLEDGE_NODES.filter((n) => n.status === 'validated');
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked');

  active.slice(0, 4).forEach((n) => items.push({
    id: `FC-DIS-${n.id}`, category: 'Discovery',
    title: `${n.id} produces a new discovery`,
    probability: clamp(40 + n.confidence * 0.35 + degree(n.id) * 3),
    horizon: 'next 14 simulated days',
    reasoning: [`${n.id} is ${n.status} with confidence ${n.confidence}%.`, `${degree(n.id)} relationships already feed this line of research.`, n.futureResearch[0] ?? 'Research agenda lists follow-up work on this object.'],
    linked: [n.id],
  }));

  validated.slice(0, 3).forEach((n) => items.push({
    id: `FC-PRM-${n.id}`, category: 'Promotion',
    title: `${n.id} reaches an advisory promotion review`,
    probability: clamp(30 + n.evidenceScore * 0.4 + n.promotionHistory.length * 12),
    horizon: 'next 30 simulated days',
    reasoning: [`Validated with evidence score ${n.evidenceScore}%.`, `${n.promotionHistory.length} promotion event(s) already on record.`, 'Promotion remains locked behind human approval.'],
    linked: [n.id],
  }));

  KNOWLEDGE_NODES.filter((n) => n.counterEvidence.length >= 2).slice(0, 3).forEach((n) => items.push({
    id: `FC-REJ-${n.id}`, category: 'Rejection',
    title: `${n.id} hypothesis line is rejected or reframed`,
    probability: clamp(25 + n.counterEvidence.length * 14 + (100 - n.confidence) * 0.25),
    horizon: 'next 21 simulated days',
    reasoning: [`${n.counterEvidence.length} counter-evidence items outweigh current support.`, `Confidence sits at ${n.confidence}%.`, 'Rejections are archived as institutional lessons, never deleted.'],
    linked: [n.id],
  }));

  items.push({
    id: 'FC-KG', category: 'Knowledge growth',
    title: `Knowledge base grows toward ${KNOWLEDGE_NODES.length + Math.round(active.length * 0.6)} objects`,
    probability: clamp(62 + active.length * 2),
    horizon: 'next 30 simulated days',
    reasoning: [`${active.length} objects are actively producing follow-up work.`, `${KNOWLEDGE_EDGES.length} relationships currently mapped.`, 'Growth is bounded by governance review capacity.'],
    linked: active.slice(0, 5).map((n) => n.id),
  });

  items.push({
    id: 'FC-GOV', category: 'Governance workload',
    title: `Governance reviews ${blocked.length + validated.length} items`,
    probability: clamp(70 + blocked.length * 5),
    horizon: 'next 30 simulated days',
    reasoning: [`${blocked.length} blocked and ${validated.length} validated objects require audit.`, 'Every promotion gate requires explicit human approval.'],
    linked: [...blocked, ...validated].slice(0, 6).map((n) => n.id),
  });

  allDepartmentStats().slice(0, 3).forEach((d) => items.push({
    id: `FC-WL-${slug(d.profile.name)}`, category: 'Department workload',
    title: `${d.profile.name} workload stays at ${d.workload} open items`,
    probability: clamp(55 + d.health * 0.3),
    horizon: 'next 14 simulated days',
    reasoning: [`Health rating ${d.rating} with ${d.owned.length} owned objects.`, `${d.open.length} open and ${d.blocked.length} blocked item(s).`],
    linked: d.owned.slice(0, 4).map((n) => n.id),
  }));

  items.push({
    id: 'FC-EVD', category: 'Evidence expansion',
    title: `Evidence base expands by ~${Math.round(KNOWLEDGE_NODES.reduce((s, n) => s + n.supportingEvidence.length, 0) * 0.18)} items`,
    probability: clamp(58 + avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)) * 0.3),
    horizon: 'next 30 simulated days',
    reasoning: ['Research Assistant indexes evidence continuously in simulation.', 'Every new relationship carries its own evidence trail.'],
    linked: KNOWLEDGE_NODES.slice(0, 4).map((n) => n.id),
  });

  return items.sort((a, b) => b.probability - a.probability);
}

// ══════════════════════════════════════════════════════════
// FEATURE 7 — Executive Briefing Room™
// ══════════════════════════════════════════════════════════

export interface BriefingSection { heading: string; lines: string[]; links?: { id: string; label: string }[] }

export function executiveBriefing(day = TODAY_DAY): { date: string; day: number; sections: BriefingSection[] } {
  const pulse = institutionPulse();
  const depts = allDepartmentStats();
  const decisions = institutionDecisions().slice(0, 5);
  const forecast = institutionForecast().slice(0, 5);
  const discoveries = byDay.filter((n) => day - dayOf(n.created) <= 7);
  const risky = KNOWLEDGE_NODES.filter((n) => n.counterEvidence.length > 0 || n.status === 'blocked')
    .sort((a, b) => b.counterEvidence.length - a.counterEvidence.length).slice(0, 5);
  const cycle = departmentCycle(80);

  const sections: BriefingSection[] = [
    { heading: "Today's discoveries", lines: discoveries.length ? discoveries.slice(0, 6).map((n) => `${n.id} · ${n.title} — ${n.summary}`) : ['No new objects created in the last 7 simulated days; departments consolidated existing evidence.'], links: discoveries.slice(0, 6).map((n) => ({ id: n.id, label: n.title })) },
    { heading: 'Highest-risk questions', lines: risky.map((n) => `${n.id} · ${n.title} — ${n.counterEvidence.length} counter-evidence item(s), status ${n.status}.`), links: risky.map((n) => ({ id: n.id, label: n.title })) },
    { heading: 'Recommended investigations', lines: forecast.map((f) => `${f.category}: ${f.title} (${f.probability}% — ${f.horizon}).`) },
    { heading: 'Department summaries', lines: depts.map((d) => `${d.profile.name}: ${d.owned.length} objects, workload ${d.workload}, health ${d.health} (${d.rating}).`) },
    { heading: 'Governance report', lines: [
      `${KNOWLEDGE_NODES.filter((n) => n.status === 'blocked').length} object(s) blocked by guardrails.`,
      `${decisions.filter((d) => d.outcome === 'Delayed pending evidence').length} decision(s) delayed pending evidence.`,
      'Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required.',
      'No live trading, no API keys, no exchange connectivity, no strategy modification, no automatic allocation.',
    ] },
    { heading: 'Promotion candidates', lines: KNOWLEDGE_NODES.filter((n) => n.promotionHistory.length > 0).slice(0, 6).map((n) => `${n.id} · ${n.title} — confidence ${n.confidence}%, evidence ${n.evidenceScore}% (advisory only).`) },
    { heading: 'Institution health', lines: pulse.signals.map((s) => `${s.label}: ${s.state} — ${s.why}`) },
    { heading: 'Knowledge growth', lines: [
      `${KNOWLEDGE_NODES.length} objects · ${KNOWLEDGE_EDGES.length} relationships.`,
      `${KNOWLEDGE_NODES.filter((n) => n.status === 'validated').length} validated · ${KNOWLEDGE_NODES.filter((n) => n.status === 'open' || n.status === 'active').length} in progress.`,
    ] },
    { heading: 'Research velocity', lines: [
      `${cycle.filter((c) => c.status === 'running').length} department tasks running now.`,
      `${cycle.filter((c) => c.status === 'queued').length} queued · ${cycle.filter((c) => c.status === 'completed').length} completed in the current cycle.`,
    ] },
  ];

  return { date: dateOfDay(day), day, sections };
}

// ══════════════════════════════════════════════════════════
// FEATURE 8 — Institution Observatory™
// ══════════════════════════════════════════════════════════

export interface ObservatoryPanel {
  key: string;
  title: string;
  items: { primary: string; secondary: string; objectId?: string; meta?: string }[];
  to?: string;
}

export function observatoryPanels(): ObservatoryPanel[] {
  const cycle = departmentCycle(80);
  const convs = conversations();
  const decisions = institutionDecisions();
  const recent = [...byDay].reverse();

  return [
    { key: 'departments', title: 'Active departments', to: '/institution/departments',
      items: allDepartmentStats().map((d) => ({ primary: d.profile.name, secondary: `${d.open.length} open · ${d.owned.length} owned`, meta: d.rating })) },
    { key: 'evidence', title: 'Newest evidence', to: '/explorer',
      items: recent.filter((n) => n.supportingEvidence.length).slice(0, 8).map((n) => ({ primary: n.supportingEvidence[0], secondary: `${n.id} · ${n.title}`, objectId: n.id })) },
    { key: 'discoveries', title: 'Latest discoveries', to: '/knowledge-graph',
      items: recent.filter((n) => n.type === 'discovery' || n.type === 'breakthrough').slice(0, 8).map((n) => ({ primary: n.title, secondary: n.summary, objectId: n.id, meta: n.created })) },
    { key: 'questions', title: 'Newest questions', to: '/oracle',
      items: recent.filter((n) => n.type === 'question' || n.status === 'open').slice(0, 8).map((n) => ({ primary: n.title, secondary: n.department, objectId: n.id })) },
    { key: 'validations', title: 'Latest validations', to: '/institution/queue',
      items: recent.filter((n) => n.type === 'validation' || n.status === 'validated').slice(0, 8).map((n) => ({ primary: n.title, secondary: `Evidence ${n.evidenceScore}% · confidence ${n.confidence}%`, objectId: n.id })) },
    { key: 'governance', title: 'Governance actions', to: '/institution/decisions',
      items: KNOWLEDGE_NODES.filter((n) => n.governanceHistory.length).slice(0, 8).map((n) => ({ primary: n.governanceHistory[0], secondary: `${n.id} · ${n.title}`, objectId: n.id })) },
    { key: 'approvals', title: 'Executive approvals', to: '/boardroom',
      items: decisions.slice(0, 8).map((d) => ({ primary: d.outcome, secondary: `${d.objectId} · ${d.objectTitle}`, objectId: d.objectId, meta: `${d.confidence}%` })) },
    { key: 'growth', title: 'Knowledge growth', to: '/institution/analytics',
      items: [
        { primary: `${KNOWLEDGE_NODES.length} objects`, secondary: 'Total institutional knowledge objects' },
        { primary: `${KNOWLEDGE_EDGES.length} relationships`, secondary: 'Explainable connections in the graph' },
        { primary: `${KNOWLEDGE_NODES.reduce((s, n) => s + n.supportingEvidence.length + n.counterEvidence.length, 0)} evidence links`, secondary: 'Supporting and counter evidence combined' },
      ] },
    { key: 'conversations', title: 'Recent conversations', to: '/institution/conversations',
      items: convs.slice(0, 8).map((c) => ({ primary: c.messages[0].text, secondary: `${c.topic} · ${c.messages.length} messages`, objectId: c.objectId, meta: c.date })) },
    { key: 'reports', title: 'Latest reports', to: '/briefing-room',
      items: KNOWLEDGE_NODES.filter((n) => n.type === 'report' || n.type === 'paper').slice(0, 8).map((n) => ({ primary: n.title, secondary: n.department, objectId: n.id })) },
    { key: 'cycle', title: 'Department cycle now running', to: '/institution/cycle',
      items: cycle.filter((c) => c.status === 'running').slice(0, 8).map((c) => ({ primary: `${c.short} — ${c.action} ${c.objectId}`, secondary: c.output, objectId: c.objectId, meta: c.date })) },
  ];
}

// ══════════════════════════════════════════════════════════
// FEATURE 9 — Research Genome™
// ══════════════════════════════════════════════════════════

export interface GenomeStrand {
  key: string;
  label: string;
  items: { id?: string; text: string }[];
}

export interface ResearchGenome {
  node: KnowledgeNode;
  strands: GenomeStrand[];
  risk: number;
  confidenceProfile: { label: string; value: number }[];
  influence: number;
  promotion: string[];
}

export function researchGenome(id: string): ResearchGenome | null {
  const node = NODE_BY_ID[id];
  if (!node) return null;
  const parents = incoming(node.id).map((e) => NODE_BY_ID[e.from]).filter(Boolean);
  const children = outgoing(node.id).map((e) => NODE_BY_ID[e.to]).filter(Boolean);
  const deps = connections(node.id).filter((e) => e.type === 'depends-on').map((e) => NODE_BY_ID[e.from === node.id ? e.to : e.from]).filter(Boolean);
  const validations = connections(node.id).filter((e) => e.type === 'validated-by' || e.type === 'rejected-by').map((e) => NODE_BY_ID[e.from === node.id ? e.to : e.from]).filter(Boolean);

  const strands: GenomeStrand[] = [
    { key: 'origin', label: 'Origin', items: [{ text: `${node.created} · created by ${node.owner} in ${node.department}` }, { text: node.summary }] },
    { key: 'parents', label: 'Parents', items: parents.length ? parents.map((p) => ({ id: p.id, text: `${p.id} · ${p.title}` })) : [{ text: 'Root object — no upstream parents.' }] },
    { key: 'discoveries', label: 'Supporting discoveries', items: children.filter((c) => c.type === 'discovery' || c.type === 'breakthrough').map((c) => ({ id: c.id, text: `${c.id} · ${c.title}` })) },
    { key: 'evidence', label: 'Supporting evidence', items: node.supportingEvidence.map((t) => ({ text: t })) },
    { key: 'counter', label: 'Counter evidence', items: node.counterEvidence.map((t) => ({ text: t })) },
    { key: 'deps', label: 'Dependencies', items: deps.length ? deps.map((d) => ({ id: d.id, text: `${d.id} · ${d.title}` })) : [{ text: 'No hard dependencies recorded.' }] },
    { key: 'reuse', label: 'Reuse chain', items: node.currentUsage.length ? node.currentUsage.map((t) => ({ text: t })) : [{ text: 'Not yet reused by another module.' }] },
    { key: 'validation', label: 'Validation chain', items: validations.length ? validations.map((v) => ({ id: v.id, text: `${v.id} · ${v.title}` })) : [{ text: 'No formal validation link recorded.' }] },
    { key: 'influence', label: 'Institution influence', items: children.slice(0, 8).map((c) => ({ id: c.id, text: `${c.id} · ${c.title}` })) },
    { key: 'promotion', label: 'Promotion history', items: node.promotionHistory.length ? node.promotionHistory.map((t) => ({ text: t })) : [{ text: 'No promotion events — advisory only.' }] },
  ];

  return {
    node,
    strands,
    risk: clamp(node.counterEvidence.length * 18 + (node.status === 'blocked' ? 35 : 0) + (100 - node.confidence) * 0.35),
    confidenceProfile: [
      { label: 'Stated confidence', value: node.confidence },
      { label: 'Evidence score', value: node.evidenceScore },
      { label: 'Relationship support', value: clamp(degree(node.id) * 9) },
      { label: 'Reuse', value: clamp(node.currentUsage.length * 22) },
      { label: 'Governance clearance', value: clamp(node.status === 'blocked' ? 25 : node.status === 'validated' ? 92 : 65) },
    ],
    influence: clamp(children.length * 11 + degree(node.id) * 5),
    promotion: node.promotionHistory,
  };
}

export function genomeCandidates(): KnowledgeNode[] {
  return [...KNOWLEDGE_NODES].sort((a, b) => degree(b.id) - degree(a.id));
}

// ══════════════════════════════════════════════════════════
// FEATURE 10 — Institution Health Monitor™
// ══════════════════════════════════════════════════════════

export interface HealthCheck {
  key: string;
  label: string;
  score: number;
  state: 'healthy' | 'watch' | 'issue';
  explanation: string;
  detail: string[];
  to?: string;
}

export function healthChecks(): HealthCheck[] {
  const depts = allDepartmentStats();
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked');
  const noEvidence = KNOWLEDGE_NODES.filter((n) => n.supportingEvidence.length === 0);
  const orphan = KNOWLEDGE_NODES.filter((n) => degree(n.id) === 0);
  const loads = depts.map((d) => d.owned.length);
  const balance = clamp(100 - (Math.max(...loads) - Math.min(...loads)) * 6);
  const stale = KNOWLEDGE_NODES.filter((n) => n.status !== 'validated' && TODAY_DAY - dayOf(n.created) > 60);
  const reuse = clamp(avg(KNOWLEDGE_NODES.map((n) => Math.min(100, n.currentUsage.length * 34))));
  const drift = clamp(100 - Math.abs(avg(KNOWLEDGE_NODES.map((n) => n.confidence)) - avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore))) * 3);
  const maturity = institutionScore().total;

  const mk = (key: string, label: string, score: number, explanation: string, detail: string[], to?: string): HealthCheck => ({
    key, label, score, state: score >= 80 ? 'healthy' : score >= 62 ? 'watch' : 'issue', explanation, detail, to,
  });

  return [
    mk('integrity', 'Knowledge integrity', clamp(100 - orphan.length * 8),
      `${orphan.length} object(s) have no relationships and cannot be traced through the graph.`,
      orphan.slice(0, 6).map((n) => `${n.id} · ${n.title}`), '/knowledge-graph'),
    mk('evidence', 'Evidence completeness', clamp(100 - noEvidence.length * 7),
      `${noEvidence.length} object(s) carry no supporting evidence yet.`,
      noEvidence.slice(0, 6).map((n) => `${n.id} · ${n.title}`), '/explorer'),
    mk('balance', 'Department balance', balance,
      `Workload spread between ${Math.min(...loads)} and ${Math.max(...loads)} owned objects per department.`,
      depts.map((d) => `${d.profile.name}: ${d.owned.length} owned · ${d.open.length} open`), '/institution/departments'),
    mk('bottleneck', 'Research bottlenecks', clamp(100 - stale.length * 9),
      `${stale.length} unvalidated object(s) older than 60 simulated days.`,
      stale.slice(0, 6).map((n) => `${n.id} · ${n.title} (${n.created})`), '/institution/queue'),
    mk('governance', 'Governance delays', clamp(100 - blocked.length * 14),
      `${blocked.length} object(s) currently blocked awaiting human approval.`,
      blocked.map((n) => `${n.id} · ${n.title} — ${n.governanceHistory[0] ?? 'Guardrail hold'}`), '/institution/decisions'),
    mk('drift', 'Confidence drift', drift,
      'Gap between stated confidence and measured evidence across the institution.',
      [`Mean confidence ${clamp(avg(KNOWLEDGE_NODES.map((n) => n.confidence)))}%`, `Mean evidence ${clamp(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)))}%`], '/institution/analytics'),
    mk('reuse', 'Reuse efficiency', reuse,
      'How often institutional knowledge is reused by other modules rather than re-derived.',
      KNOWLEDGE_NODES.filter((n) => n.currentUsage.length).slice(0, 6).map((n) => `${n.id} reused in ${n.currentUsage.length} place(s)`), '/institution/evolution'),
    mk('maturity', 'Institution maturity', maturity,
      `Composite Institution Score across governance, knowledge, velocity and confidence.`,
      institutionScore().components.map((c) => `${c.label}: ${c.score}`), '/institution/score'),
  ];
}

// ══════════════════════════════════════════════════════════
// Global page context (used by the shared page frame)
// ══════════════════════════════════════════════════════════

export interface PageContext {
  status: string;
  tone: PulseTone;
  objects: number;
  relationships: number;
  evidence: number;
  velocity: number;
}

export function pageContext(): PageContext {
  const pulse = institutionPulse();
  return {
    status: pulse.headline,
    tone: pulse.tone,
    objects: KNOWLEDGE_NODES.length,
    relationships: KNOWLEDGE_EDGES.length,
    evidence: KNOWLEDGE_NODES.reduce((s, n) => s + n.supportingEvidence.length + n.counterEvidence.length, 0),
    velocity: departmentCycle(80).filter((c) => c.status === 'running').length,
  };
}

export const LIFE_LINKS = [
  { to: '/observatory', label: 'Observatory™' },
  { to: '/institution/cycle', label: 'Department Cycle™' },
  { to: '/institution/conversations', label: 'Conversations™' },
  { to: '/institution/decisions', label: 'Decisions™' },
  { to: '/institution/evolution', label: 'Knowledge Evolution™' },
  { to: '/institution/forecast', label: 'Forecast™' },
  { to: '/briefing-room', label: 'Briefing Room™' },
  { to: '/institution/genome', label: 'Research Genome™' },
  { to: '/institution/health', label: 'Health Monitor™' },
];
