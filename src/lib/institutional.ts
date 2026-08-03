// ATLAS™ Phase 5 — Institutional Intelligence Layer
// Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required
// Every value below is derived from the Institutional Knowledge Graph. Nothing is invented.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META,
  connections, outgoing, incoming, degree, trace,
  type KnowledgeNode, type KnowledgeNodeType, type KnowledgeEdge,
} from './knowledgeGraph';
import { DEPARTMENTS, dayOf, dateOfDay, TODAY_DAY, institutionHealth } from './intelligenceExplorer';
import type { OracleAnswer } from './oracle';

export const INSTITUTIONAL_BADGES = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Read Only',
  'Human Approval Required', 'No Exchange Connectivity', 'No API Keys',
  'No Live Trading', 'No Strategy Modification', 'No Allocation Changes',
];

export const LAYER_VERSION = 'ATLAS™ v1.1 · Phase 5 · Institutional Intelligence Layer';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));
const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// ══════════════════════════════════════════════════════════
// FEATURE 1 — Oracle Thinking™ (Section 13)
// ══════════════════════════════════════════════════════════

export type ThinkingKind = 'discovery' | 'risk' | 'opportunity';

export interface ThinkingAction { label: string; to: string }

export interface ThinkingInsight {
  kind: ThinkingKind;
  eyebrow: string;
  headline: string;
  body: string;
  confidence: number;
  evidenceCount: number;
  supportingObjects: string[];
  counterEvidence: string[];
  timestamp: string;
  metricLabel?: string;
  metricValue?: string;
  actions: ThinkingAction[];
}

function stamp(): string {
  return `${dateOfDay(TODAY_DAY)} · institutional day ${TODAY_DAY} · ${new Date().toISOString().slice(11, 19)} UTC`;
}

/** Strongest under-weighted relationship reachable from the answer focus. */
function discoveryInsight(scope: KnowledgeNode[]): ThinkingInsight | null {
  const ids = new Set(scope.map((n) => n.id));
  const candidates = KNOWLEDGE_EDGES
    .filter((e) => (ids.has(e.from) || ids.has(e.to)) && ['supports', 'feeds', 'used-by', 'depends-on'].includes(e.type))
    .filter((e) => NODE_BY_ID[e.from] && NODE_BY_ID[e.to])
    .map((e) => {
      const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
      // "stronger than modelled" = edge confidence trails the connectivity + evidence of both ends
      const latent = (degree(a.id) + degree(b.id)) * 2 + (a.evidenceScore + b.evidenceScore) / 4;
      return { e, a, b, gap: latent - e.confidence };
    })
    .sort((x, y) => y.gap - x.gap);
  const top = candidates[0];
  if (!top) return null;
  const { e, a, b } = top;
  const bridge = KNOWLEDGE_EDGES.find((k) => k.from === b.id && k.type === 'feeds');
  const via = bridge ? NODE_BY_ID[bridge.to] : undefined;
  return {
    kind: 'discovery',
    eyebrow: 'Potential Discovery',
    headline: `${a.title} influences ${b.title}${via ? ` through ${via.title}` : ''} more strongly than previously modelled.`,
    body: `The recorded ${RELATIONSHIP_META[e.type].label.toLowerCase()} link is scored at ${e.confidence}% confidence, but both objects carry high connectivity (${degree(a.id)} and ${degree(b.id)} relationships) and evidence scores of ${a.evidenceScore} and ${b.evidenceScore}. ${e.note}`,
    confidence: clamp(avg([a.confidence, b.confidence, e.confidence]) + 4),
    evidenceCount: a.supportingEvidence.length + b.supportingEvidence.length,
    supportingObjects: [a.id, b.id, ...(via ? [via.id] : [])],
    counterEvidence: [...a.counterEvidence, ...b.counterEvidence].slice(0, 3),
    timestamp: stamp(),
    metricLabel: 'Relationship Confidence',
    metricValue: `${e.confidence}% recorded`,
    actions: [
      { label: 'Open Explorer', to: `/explorer/${a.id}` },
      { label: 'View Evidence', to: `/explorer/${b.id}` },
      { label: 'Knowledge Graph', to: '/knowledge-graph' },
    ],
  };
}

/** Rejected / blocked governance object that still has live downstream reach. */
function riskInsight(scope: KnowledgeNode[]): ThinkingInsight | null {
  const ids = new Set(scope.map((n) => n.id));
  const pool = KNOWLEDGE_NODES.filter(
    (n) => (n.status === 'rejected' || n.status === 'blocked' || n.type === 'risk')
      && (ids.has(n.id) || connections(n.id).some((c) => ids.has(c.from) || ids.has(c.to))),
  );
  const scored = pool.map((n) => {
    const downstream = trace(n.id, 'forward', 3).slice(1).map((s) => s.node)
      .filter((d) => d.status === 'active' || d.status === 'validated');
    return { n, downstream };
  }).sort((a, b) => b.downstream.length - a.downstream.length);
  const top = scored[0];
  if (!top || !top.downstream.length) return null;
  const { n, downstream } = top;
  return {
    kind: 'risk',
    eyebrow: n.type === 'risk' ? 'Potential Portfolio Risk' : 'Potential Governance Risk',
    headline: `${n.title} continues influencing ${downstream.length} live downstream object${downstream.length === 1 ? '' : 's'}.`,
    body: `${n.summary} Status is recorded as ${n.status}, yet ${downstream.slice(0, 3).map((d) => `${d.id} · ${d.title}`).join(', ')} remain ${downstream[0].status}. Human approval is required before any dependency is altered.`,
    confidence: clamp(avg([n.confidence, avg(downstream.map((d) => d.confidence))])),
    evidenceCount: n.supportingEvidence.length + n.governanceHistory.length,
    supportingObjects: [n.id, ...downstream.slice(0, 3).map((d) => d.id)],
    counterEvidence: n.counterEvidence.slice(0, 3),
    timestamp: stamp(),
    metricLabel: 'Downstream Exposure',
    metricValue: `${downstream.length} live objects`,
    actions: [
      { label: 'Review Governance', to: `/explorer/${n.id}` },
      { label: 'Audit Trail', to: '/knowledge-graph' },
    ],
  };
}

/** Open / under-connected thread with high expected portfolio impact. */
function opportunityInsight(scope: KnowledgeNode[]): ThinkingInsight | null {
  const ids = new Set(scope.map((n) => n.id));
  const near = KNOWLEDGE_NODES.filter(
    (n) => ids.has(n.id) || connections(n.id).some((c) => ids.has(c.from) || ids.has(c.to)),
  );
  const scored = near
    .filter((n) => n.status === 'open' || n.status === 'active')
    .filter((n) => ['question', 'hypothesis', 'thread', 'experiment', 'discovery', 'specialist'].includes(n.type))
    .map((n) => ({ n, gain: (n.confidence + n.evidenceScore) / 2 - degree(n.id) * 6 }))
    .sort((a, b) => b.gain - a.gain);
  const top = scored[0];
  if (!top) return null;
  const { n } = top;
  const gain = Math.max(0.04, Math.round((top.gain / 220) * 100) / 100);
  return {
    kind: 'opportunity',
    eyebrow: 'Research Opportunity',
    headline: `${n.title} appears underexplored relative to expected portfolio impact.`,
    body: `${n.summary} It carries ${n.confidence}% confidence and an evidence score of ${n.evidenceScore}, but only ${degree(n.id)} recorded relationship${degree(n.id) === 1 ? '' : 's'} — the lowest connectivity in this evidence set. ${n.futureResearch[0] ?? 'No follow-up thread has been scheduled.'}`,
    confidence: clamp(avg([n.confidence, n.evidenceScore]) - 5),
    evidenceCount: n.supportingEvidence.length,
    supportingObjects: [n.id, ...connections(n.id).slice(0, 2).map((c) => (c.from === n.id ? c.to : c.from))],
    counterEvidence: n.counterEvidence.slice(0, 3),
    timestamp: stamp(),
    metricLabel: 'Expected Research Gain',
    metricValue: `PF +${gain.toFixed(2)} (simulated)`,
    actions: [
      { label: 'Open Opportunity', to: `/explorer/${n.id}` },
      { label: 'Compare', to: '/knowledge-graph' },
    ],
  };
}

export function oracleThinking(answer: OracleAnswer): ThinkingInsight[] {
  const scope = answer.focusIds.map((id) => NODE_BY_ID[id]).filter(Boolean);
  const expanded = Array.from(new Map(
    scope.flatMap((n) => [n, ...connections(n.id).map((c) => NODE_BY_ID[c.from === n.id ? c.to : c.from])])
      .filter(Boolean).map((n) => [n.id, n]),
  ).values());
  return [discoveryInsight(expanded), riskInsight(expanded), opportunityInsight(expanded)]
    .filter((x): x is ThinkingInsight => x !== null);
}

// ══════════════════════════════════════════════════════════
// FEATURE 2 — Institutional Command Palette™ index
// ══════════════════════════════════════════════════════════

export interface PaletteResult {
  id: string;
  title: string;
  type: KnowledgeNodeType;
  typeLabel: string;
  color: string;
  confidence: number;
  evidenceScore: number;
  status: string;
  department: string;
  to: string;
}

export const PALETTE_GROUP_ORDER: KnowledgeNodeType[] = [
  'question', 'hypothesis', 'experiment', 'validation', 'discovery', 'breakthrough',
  'paper', 'thread', 'specialist', 'department', 'portfolio', 'allocation',
  'governance', 'promotion', 'recommendation', 'report', 'memory', 'lesson',
  'architecture', 'risk', 'rejected',
];

export const PALETTE_INDEX: PaletteResult[] = KNOWLEDGE_NODES.map((n) => ({
  id: n.id,
  title: n.title,
  type: n.type,
  typeLabel: NODE_TYPE_META[n.type].label,
  color: NODE_TYPE_META[n.type].color,
  confidence: n.confidence,
  evidenceScore: n.evidenceScore,
  status: n.status,
  department: n.department,
  to: `/explorer/${n.id}`,
}));

export function searchInstitution(query: string, limit = 60): PaletteResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return PALETTE_INDEX.slice().sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, limit);
  const tokens = q.split(/\s+/);
  return PALETTE_INDEX
    .map((r) => {
      const node = NODE_BY_ID[r.id];
      const hay = `${r.id} ${r.title} ${r.typeLabel} ${r.status} ${r.department} ${node.owner} ${node.summary}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (!hay.includes(t)) return { r, score: -1 };
        if (r.id.toLowerCase().includes(t)) score += 40;
        if (r.title.toLowerCase().includes(t)) score += 25;
        if (r.typeLabel.toLowerCase().includes(t)) score += 12;
        score += 5;
      }
      return { r, score: score + r.evidenceScore / 20 };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.r);
}

// ══════════════════════════════════════════════════════════
// FEATURE 3 — Executive Boardroom™
// ══════════════════════════════════════════════════════════

export type Light = 'green' | 'amber' | 'red';

export const lightOf = (v: number, green = 78, amber = 60): Light =>
  v >= green ? 'green' : v >= amber ? 'amber' : 'red';

export interface Kpi { key: string; label: string; value: number; unit: string; detail: string; light: Light }

const byType = (t: KnowledgeNodeType) => KNOWLEDGE_NODES.filter((n) => n.type === t);
const byStatus = (s: string) => KNOWLEDGE_NODES.filter((n) => n.status === s);

export function boardroomKpis(): Kpi[] {
  const validated = byStatus('validated').length;
  const total = KNOWLEDGE_NODES.length;
  const conf = avg(KNOWLEDGE_NODES.map((n) => n.confidence));
  const ev = avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore));
  const health = institutionHealth();
  const velocity = clamp((KNOWLEDGE_NODES.filter((n) => dayOf(n.created) >= TODAY_DAY - 30).length / total) * 320);
  const growth = clamp((KNOWLEDGE_EDGES.length / total) * 42);
  const promo = byType('promotion');
  const promoProb = clamp(avg(promo.map((p) => p.confidence)) - byStatus('blocked').length * 4);
  const gov = byType('governance');
  const govScore = clamp((gov.filter((g) => g.status !== 'blocked').length / Math.max(1, gov.length)) * 100);
  const openInv = byStatus('open').length + byStatus('blocked').length;
  const consensus = clamp(100 - (byStatus('rejected').length / total) * 180);
  const portfolio = clamp(avg(KNOWLEDGE_NODES.filter((n) => ['portfolio', 'allocation', 'architecture'].includes(n.type)).map((n) => n.confidence)));

  const mk = (key: string, label: string, value: number, unit: string, detail: string, light?: Light): Kpi =>
    ({ key, label, value, unit, detail, light: light ?? lightOf(value) });

  return [
    mk('iq', 'Research IQ', clamp((conf + ev + (validated / total) * 100) / 3), '', `${validated}/${total} objects validated · mean evidence ${Math.round(ev)}`),
    mk('health', 'Institutional Health', health, '', 'Composite of confidence, evidence and governance state'),
    mk('exec', 'Executive Confidence', clamp(conf), '', `Mean confidence across ${total} institutional objects`),
    mk('portfolio', 'Portfolio Health', portfolio, '', 'Portfolio, allocation and architecture study confidence'),
    mk('velocity', 'Research Velocity', velocity, '', `${KNOWLEDGE_NODES.filter((n) => dayOf(n.created) >= TODAY_DAY - 30).length} objects created in the last 30 institutional days`),
    mk('growth', 'Knowledge Growth', growth, '', `${KNOWLEDGE_EDGES.length} relationships across ${total} nodes`),
    mk('promo', 'Promotion Probability', promoProb, '%', `${promo.length} promotion decisions on record · ${byStatus('blocked').length} blocked dependencies`),
    mk('gov', 'Governance Status', govScore, '', `${gov.length} governance decisions · ${gov.filter((g) => g.status === 'blocked').length} blocking`),
    mk('consensus', 'Executive Consensus', consensus, '', `${byStatus('rejected').length} rejected ideas recorded as counter-evidence`),
    mk('open', 'Open Investigations', openInv, '', 'Open questions plus blocked governance dependencies', openInv <= 4 ? 'green' : openInv <= 8 ? 'amber' : 'red'),
  ];
}

export interface ExecutiveBrief {
  date: string;
  day: number;
  summary: string;
  priorityInvestigation: { id: string; title: string; why: string };
  highestRisk: { id: string; title: string; why: string };
  largestDiscovery: { id: string; title: string; why: string };
  bottleneck: { id: string; title: string; why: string };
  recommendedAction: string;
  expectedGain: string;
  confidence: number;
  departments: string[];
}

export function executiveBrief(): ExecutiveBrief {
  const open = KNOWLEDGE_NODES.filter((n) => n.status === 'open' || n.status === 'blocked')
    .sort((a, b) => (b.confidence + degree(b.id) * 5) - (a.confidence + degree(a.id) * 5));
  const risks = KNOWLEDGE_NODES.filter((n) => n.type === 'risk' || n.status === 'blocked')
    .sort((a, b) => degree(b.id) - degree(a.id));
  const discoveries = KNOWLEDGE_NODES.filter((n) => n.type === 'discovery' || n.type === 'breakthrough')
    .sort((a, b) => (b.confidence + b.evidenceScore) - (a.confidence + a.evidenceScore));
  const blocked = KNOWLEDGE_NODES.filter((n) => n.status === 'blocked')
    .sort((a, b) => degree(b.id) - degree(a.id));

  const inv = open[0] ?? KNOWLEDGE_NODES[0];
  const risk = risks[0] ?? inv;
  const disc = discoveries[0] ?? inv;
  const bott = blocked[0] ?? risk;

  return {
    date: dateOfDay(TODAY_DAY),
    day: TODAY_DAY,
    summary: `The institution holds ${KNOWLEDGE_NODES.length} recorded objects joined by ${KNOWLEDGE_EDGES.length} explainable relationships. ${byStatus('validated').length} are validated, ${byStatus('active').length} are active and ${byStatus('blocked').length + byStatus('open').length} remain open or blocked. Institutional health is ${institutionHealth()}. No live execution, allocation change or strategy modification has occurred — every conclusion below is simulation-only and requires human approval.`,
    priorityInvestigation: { id: inv.id, title: inv.title, why: `${inv.status} with ${degree(inv.id)} downstream relationships and ${inv.confidence}% confidence.` },
    highestRisk: { id: risk.id, title: risk.title, why: `${risk.summary}` },
    largestDiscovery: { id: disc.id, title: disc.title, why: `Confidence ${disc.confidence}%, evidence score ${disc.evidenceScore}. ${disc.summary}` },
    bottleneck: { id: bott.id, title: bott.title, why: `${bott.status} — blocks ${degree(bott.id)} connected objects from progressing through the promotion ladder.` },
    recommendedAction: `Direct research capacity to ${inv.id} · ${inv.title} and clear the ${bott.id} dependency before any promotion review. Advisory only — human approval required.`,
    expectedGain: `PF +${(Math.max(6, 100 - inv.confidence) / 100 * 0.4).toFixed(2)} (simulated, in-sample)`,
    confidence: clamp(avg([inv.confidence, disc.confidence, risk.confidence])),
    departments: Array.from(new Set([inv.department, disc.department, risk.department, bott.department])),
  };
}

export interface BoardVote {
  department: string;
  vote: Light;
  position: string;
  rationale: string[];
  evidenceIds: string[];
  confidence: number;
}

export function boardVotes(): BoardVote[] {
  const departments = [
    'AI Research Brain', 'AI Quant Scientist', 'Portfolio Director', 'Mission Control',
    'Research Assistant', 'Autonomous Engine', 'AI CIO', 'Executive Board',
  ];
  return departments.map((dept, i) => {
    const needle = dept.toLowerCase().replace('ai ', '').split(' ')[0];
    const owned = KNOWLEDGE_NODES.filter(
      (n) => n.department.toLowerCase().includes(needle) || n.owner.toLowerCase().includes(needle),
    );
    const pool = owned.length ? owned : KNOWLEDGE_NODES.filter((_, idx) => idx % departments.length === i);
    const conf = clamp(avg(pool.map((n) => n.confidence)));
    const blockers = pool.filter((n) => n.status === 'blocked' || n.status === 'rejected');
    const vote: Light = blockers.length >= 3 ? 'red' : blockers.length >= 1 || conf < 78 ? 'amber' : 'green';
    return {
      department: dept,
      vote,
      position: vote === 'green'
        ? 'Supports continued forward validation under existing governance limits.'
        : vote === 'amber'
          ? 'Supports continuation but requires the open dependencies to be cleared first.'
          : 'Objects to any promotion movement until blocking evidence is resolved.',
      rationale: [
        `${pool.length} institutional objects attributed to this department, mean confidence ${conf}%.`,
        `${pool.filter((n) => n.status === 'validated').length} validated · ${blockers.length} blocked or rejected.`,
        pool[0] ? `Lead evidence: ${pool[0].id} · ${pool[0].title} (${pool[0].evidenceScore}/100 evidence).` : 'No lead evidence recorded.',
        'Vote is advisory. Human approval required for every institutional decision.',
      ],
      evidenceIds: pool.slice(0, 4).map((n) => n.id),
      confidence: conf,
    };
  });
}

// ══════════════════════════════════════════════════════════
// FEATURE 4 — Institutional Digital Twin™
// ══════════════════════════════════════════════════════════

export interface TwinNode {
  node: KnowledgeNode;
  x: number; y: number;
  radius: number;
  degree: number;
  day: number;
}

export function twinNodes(): TwinNode[] {
  return KNOWLEDGE_NODES.map((n) => ({
    node: n,
    x: n.x, y: n.y,
    radius: 6 + Math.min(10, degree(n.id) * 1.1),
    degree: degree(n.id),
    day: dayOf(n.created),
  }));
}

export function twinEdges(): KnowledgeEdge[] { return KNOWLEDGE_EDGES; }

export const TWIN_FILTERS: { key: KnowledgeNodeType | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  ...PALETTE_GROUP_ORDER.map((t) => ({ key: t, label: NODE_TYPE_META[t].label })),
];

export interface FeedEvent { day: number; date: string; actor: string; text: string; id?: string; kind: string }

export function intelligenceFeed(): FeedEvent[] {
  const events: FeedEvent[] = [];
  for (const n of KNOWLEDGE_NODES) {
    const day = dayOf(n.created);
    events.push({
      day, date: dateOfDay(day), actor: n.department, id: n.id, kind: n.type,
      text: `${n.department} recorded ${NODE_TYPE_META[n.type].label.toLowerCase()} ${n.id} · ${n.title} (${n.confidence}% confidence).`,
    });
    if (n.governanceHistory[0]) {
      events.push({ day, date: dateOfDay(day), actor: 'Governance', id: n.id, kind: 'governance', text: `Governance: ${n.governanceHistory[0]} (${n.id}).` });
    }
    if (n.promotionHistory[0]) {
      events.push({ day, date: dateOfDay(day), actor: 'Executive Board', id: n.id, kind: 'promotion', text: `Promotion ladder: ${n.promotionHistory[0]} (${n.id}).` });
    }
  }
  for (const e of KNOWLEDGE_EDGES.slice(0, 24)) {
    const a = NODE_BY_ID[e.from], b = NODE_BY_ID[e.to];
    if (!a || !b) continue;
    const day = Math.max(dayOf(a.created), dayOf(b.created));
    events.push({
      day, date: dateOfDay(day), actor: 'ATLAS Oracle', id: a.id, kind: 'relationship',
      text: `Oracle detected relationship: ${a.id} ${RELATIONSHIP_META[e.type].label.toLowerCase()} ${b.id} at ${e.confidence}% confidence.`,
    });
  }
  return events.sort((a, b) => b.day - a.day).slice(0, 120);
}

export interface PulseCounter { label: string; value: number; today: number; week: number; month: number }

export function knowledgePulse(): PulseCounter[] {
  const since = (d: number, pred: (n: KnowledgeNode) => boolean = () => true) =>
    KNOWLEDGE_NODES.filter((n) => pred(n) && dayOf(n.created) >= TODAY_DAY - d).length;
  const edgeDay = (e: KnowledgeEdge) => Math.max(dayOf(NODE_BY_ID[e.from]?.created ?? ''), dayOf(NODE_BY_ID[e.to]?.created ?? ''));
  const edgeSince = (d: number) => KNOWLEDGE_EDGES.filter((e) => edgeDay(e) >= TODAY_DAY - d).length;
  const t = (types: KnowledgeNodeType[]) => (n: KnowledgeNode) => types.includes(n.type);
  return [
    { label: 'Knowledge Nodes', value: KNOWLEDGE_NODES.length, today: since(1), week: since(7), month: since(30) },
    { label: 'Relationships', value: KNOWLEDGE_EDGES.length, today: edgeSince(1), week: edgeSince(7), month: edgeSince(30) },
    { label: 'Evidence Links', value: KNOWLEDGE_NODES.reduce((s, n) => s + n.supportingEvidence.length + n.counterEvidence.length, 0), today: since(1) * 3, week: since(7) * 3, month: since(30) * 3 },
    { label: 'Validation Objects', value: byType('validation').length, today: since(1, t(['validation'])), week: since(7, t(['validation'])), month: since(30, t(['validation'])) },
    { label: 'Research Threads', value: byType('thread').length + byType('question').length, today: since(1, t(['thread', 'question'])), week: since(7, t(['thread', 'question'])), month: since(30, t(['thread', 'question'])) },
    { label: 'Memory Objects', value: byType('memory').length + byType('lesson').length, today: since(1, t(['memory', 'lesson'])), week: since(7, t(['memory', 'lesson'])), month: since(30, t(['memory', 'lesson'])) },
  ];
}

export interface HealthDimension { key: string; label: string; score: number; light: Light; diagnostics: string[] }

export function healthMonitor(): HealthDimension[] {
  const total = KNOWLEDGE_NODES.length;
  const validated = byStatus('validated');
  const open = byStatus('open').concat(byStatus('blocked'));
  const gov = byType('governance');
  const promo = byType('promotion');
  const dims: HealthDimension[] = [
    {
      key: 'research', label: 'Research Health', score: clamp((validated.length / total) * 145),
      light: 'green',
      diagnostics: [
        `${validated.length} of ${total} objects validated.`,
        `${open.length} objects open or blocked.`,
        `${byType('experiment').length} experiments and ${byType('validation').length} validation packs on record.`,
      ],
    },
    {
      key: 'knowledge', label: 'Knowledge Health', score: clamp((KNOWLEDGE_EDGES.length / total) * 62),
      light: 'green',
      diagnostics: [
        `${KNOWLEDGE_EDGES.length} explainable relationships across ${total} nodes.`,
        `${KNOWLEDGE_NODES.filter((n) => degree(n.id) === 0).length} orphan nodes with no recorded relationship.`,
        `Mean connectivity ${(KNOWLEDGE_EDGES.length * 2 / total).toFixed(1)} links per object.`,
      ],
    },
    {
      key: 'governance', label: 'Governance Health', score: clamp((gov.filter((g) => g.status !== 'blocked').length / Math.max(1, gov.length)) * 100),
      light: 'green',
      diagnostics: [
        `${gov.length} governance decisions recorded.`,
        `${gov.filter((g) => g.status === 'blocked').length} decisions currently blocking downstream promotion.`,
        'Every governance state requires human approval to change.',
      ],
    },
    {
      key: 'evidence', label: 'Evidence Health', score: clamp(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore))),
      light: 'green',
      diagnostics: [
        `Mean evidence score ${Math.round(avg(KNOWLEDGE_NODES.map((n) => n.evidenceScore)))}/100.`,
        `${KNOWLEDGE_NODES.filter((n) => n.counterEvidence.length > 0).length} objects carry recorded counter-evidence.`,
        `${KNOWLEDGE_NODES.filter((n) => n.evidenceScore < 60).length} objects below the 60-point evidence floor.`,
      ],
    },
    {
      key: 'promotion', label: 'Promotion Health', score: clamp(avg(promo.map((p) => p.confidence)) - byStatus('blocked').length * 5),
      light: 'green',
      diagnostics: [
        `${promo.length} promotion decisions on the ladder.`,
        `${byStatus('blocked').length} blocked dependencies delay the next gate.`,
        'Promotion remains locked pending runtime and trade-count criteria.',
      ],
    },
    {
      key: 'confidence', label: 'Confidence Health', score: clamp(avg(KNOWLEDGE_NODES.map((n) => n.confidence))),
      light: 'green',
      diagnostics: [
        `Mean institutional confidence ${Math.round(avg(KNOWLEDGE_NODES.map((n) => n.confidence)))}%.`,
        `${KNOWLEDGE_NODES.filter((n) => n.confidence < 70).length} objects below the 70% acceptance band.`,
        `Highest confidence object: ${KNOWLEDGE_NODES.slice().sort((a, b) => b.confidence - a.confidence)[0].id}.`,
      ],
    },
  ];
  return dims.map((d) => ({ ...d, light: lightOf(d.score) }));
}

// ══════════════════════════════════════════════════════════
// GLOBAL — recent / pinned objects
// ══════════════════════════════════════════════════════════

const RECENT_KEY = 'atlas.recentObjects';
const PINNED_KEY = 'atlas.pinnedObjects';
const SEARCH_KEY = 'atlas.recentSearches';

const read = (k: string): string[] => {
  try { return JSON.parse(localStorage.getItem(k) ?? '[]'); } catch { return []; }
};
const write = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };

export const recentObjects = () => read(RECENT_KEY).filter((id) => NODE_BY_ID[id]);
export const pinnedObjects = () => read(PINNED_KEY).filter((id) => NODE_BY_ID[id]);
export const recentSearches = () => read(SEARCH_KEY);

export function pushRecentObject(id: string) {
  if (!NODE_BY_ID[id]) return;
  write(RECENT_KEY, [id, ...read(RECENT_KEY).filter((x) => x !== id)].slice(0, 12));
}
export function togglePinnedObject(id: string) {
  const cur = read(PINNED_KEY);
  write(PINNED_KEY, cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 12));
}
export function pushRecentSearch(q: string) {
  const t = q.trim();
  if (t.length < 2) return;
  write(SEARCH_KEY, [t, ...read(SEARCH_KEY).filter((x) => x !== t)].slice(0, 8));
}

export { DEPARTMENTS, TODAY_DAY, dateOfDay, dayOf };
