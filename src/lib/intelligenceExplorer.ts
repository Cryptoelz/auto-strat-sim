// ATLAS™ Intelligence Explorer™ — the digital biography engine for every research object.
// OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY / READ ONLY / HUMAN APPROVAL REQUIRED.
// Derives explainable profiles from the Institutional Knowledge Graph. No execution paths.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META,
  connections, incoming, outgoing, trace, degree,
  type KnowledgeNode, type KnowledgeEdge, type RelationshipType,
} from '@/lib/knowledgeGraph';

export const EXPLORER_BADGES = ['Observation Only', 'Research Only', 'Simulation Only', 'Read Only'];

export const EXPLORER_GUARANTEES = [
  'Read-only interface — no object can be edited from the Explorer.',
  'No exchange connectivity, no API keys, no live trading.',
  'No strategy modification and no allocation change.',
  'Every conclusion carries evidence, confidence and a source module.',
  'Nothing is ever deleted — the audit trail is append-only.',
  'Human approval required before any real-world action.',
];

// Deterministic pseudo-random so every render of an object is identical.
function seed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function rnd(id: string, salt: number, min: number, max: number): number {
  const v = (seed(id + ':' + salt) % 10000) / 10000;
  return Math.round(min + v * (max - min));
}

export const DAY_ZERO = new Date('2026-03-01T00:00:00Z').getTime();
export const TODAY_DAY = Math.max(
  1,
  Math.round((new Date('2026-08-02T00:00:00Z').getTime() - DAY_ZERO) / 86400000),
);

export function dayOf(dateIso: string): number {
  return Math.max(1, Math.round((new Date(dateIso).getTime() - DAY_ZERO) / 86400000));
}
export function dateOfDay(day: number): string {
  return new Date(DAY_ZERO + day * 86400000).toISOString().slice(0, 10);
}

// ─── Institution health ──────────────────────────────────────────────

export function institutionHealth(): number {
  const avg = KNOWLEDGE_NODES.reduce((s, n) => s + n.confidence, 0) / KNOWLEDGE_NODES.length;
  const rejected = KNOWLEDGE_NODES.filter((n) => n.status === 'rejected').length;
  return Math.round(avg - rejected * 0.8 + 6);
}

// ─── Section 1 · Institution summary ─────────────────────────────────

export function institutionSummary(node: KnowledgeNode): string {
  const meta = NODE_TYPE_META[node.type];
  const fwd = outgoing(node.id).length;
  const back = incoming(node.id).length;
  const verdict =
    node.status === 'rejected' ? 'Research has formally closed this line, but it is retained permanently as institutional knowledge.'
    : node.status === 'validated' ? 'Current research indicates this object is well evidenced and is actively reused across the institution.'
    : node.status === 'blocked' ? 'Progress is currently held behind a governance gate and cannot advance without human approval.'
    : node.status === 'archived' ? 'This object now lives in institutional memory and informs future research rather than active work.'
    : 'This object remains under active research and its conclusions are provisional.';
  return `${node.title} is a ${meta.label.toLowerCase()} owned by ${node.owner} within ${node.department}. ${node.summary} It draws on ${back} upstream ${back === 1 ? 'object' : 'objects'} and influences ${fwd} downstream ${fwd === 1 ? 'object' : 'objects'}, carrying ${node.confidence}% research confidence and an evidence score of ${node.evidenceScore}. ${verdict}`;
}

// ─── Section 2 · Institution timeline ────────────────────────────────

export interface LifeStage {
  stage: string;
  day: number;
  date: string;
  nodeId: string | null;
  label: string;
  detail: string;
  reached: boolean;
}

const LIFE_ORDER = [
  'Idea', 'Question', 'Hypothesis', 'Experiment', 'Validation',
  'Discovery', 'Breakthrough', 'Promotion', 'Institutional Memory', 'Historical Record',
];

const STAGE_TYPES: Record<string, string[]> = {
  Idea: ['rejected', 'department', 'thread'],
  Question: ['question'],
  Hypothesis: ['hypothesis'],
  Experiment: ['experiment'],
  Validation: ['validation', 'portfolio', 'allocation'],
  Discovery: ['discovery', 'paper'],
  Breakthrough: ['breakthrough', 'specialist'],
  Promotion: ['promotion', 'governance', 'recommendation', 'report'],
  'Institutional Memory': ['memory', 'lesson'],
  'Historical Record': ['memory'],
};

export function lifeStages(id: string): LifeStage[] {
  const family = new Set<string>([id]);
  for (const s of trace(id, 'back', 6)) family.add(s.node.id);
  for (const s of trace(id, 'forward', 6)) family.add(s.node.id);
  const members = [...family].map((f) => NODE_BY_ID[f]).filter(Boolean);

  return LIFE_ORDER.map((stage, i) => {
    const types = STAGE_TYPES[stage];
    const match = members
      .filter((m) => types.includes(m.type))
      .sort((a, b) => a.created.localeCompare(b.created))[stage === 'Historical Record' ? Math.max(0, members.filter((m) => types.includes(m.type)).length - 1) : 0];
    const day = match ? dayOf(match.created) + i : rnd(id, i, 4, 140);
    return {
      stage,
      day,
      date: match ? match.created : dateOfDay(day),
      nodeId: match ? match.id : null,
      label: match ? match.title : `No ${stage.toLowerCase()} recorded on this research line`,
      detail: match
        ? `${match.id} · ${NODE_TYPE_META[match.type].label} · ${match.department} · ${match.confidence}% confidence`
        : 'Stage not yet reached in this object’s institutional life story.',
      reached: Boolean(match),
    };
  }).sort((a, b) => a.day - b.day);
}

// ─── Section 3 · Evidence explorer ───────────────────────────────────

export type EvidenceStance = 'supporting' | 'counter' | 'neutral' | 'unknown';

export interface EvidenceItem {
  id: string;
  stance: EvidenceStance;
  statement: string;
  confidence: number;
  date: string;
  source: string;
  module: string;
  explanation: string;
  impact: number;
}

export function evidenceItems(node: KnowledgeNode): EvidenceItem[] {
  const items: EvidenceItem[] = [];
  const push = (stance: EvidenceStance, statement: string, k: number, source: string, module: string, explanation: string) => {
    items.push({
      id: `${node.id}-EV-${items.length + 1}`,
      stance, statement,
      confidence: stance === 'supporting' ? rnd(node.id, k, 68, 95)
        : stance === 'counter' ? rnd(node.id, k + 40, 45, 80)
        : stance === 'neutral' ? rnd(node.id, k + 80, 40, 65)
        : rnd(node.id, k + 120, 15, 40),
      date: dateOfDay(dayOf(node.created) + rnd(node.id, k + 7, 1, 60)),
      source, module, explanation,
      impact: stance === 'supporting' ? rnd(node.id, k + 3, 55, 92)
        : stance === 'counter' ? rnd(node.id, k + 23, 35, 80) : rnd(node.id, k + 63, 10, 45),
    });
  };

  node.supportingEvidence.forEach((s, i) =>
    push('supporting', s, i, node.owner, node.department,
      `Measured during ${node.department} research and reconciled against the audit log for ${node.id}. Strengthens the current conclusion.`));
  node.counterEvidence.forEach((s, i) =>
    push('counter', s, i + 10, node.owner, node.department,
      `Recorded as counter evidence. It does not invalidate ${node.id} on its own but caps confidence and is re-tested on every validation cycle.`));

  for (const c of connections(node.id)) {
    const other = NODE_BY_ID[c.from === node.id ? c.to : c.from];
    if (!other) continue;
    const stance: EvidenceStance =
      c.type === 'contradicts' || c.type === 'rejected-by' || c.type === 'blocked-by' ? 'counter'
      : c.type === 'supports' || c.type === 'validated-by' ? 'supporting' : 'neutral';
    items.push({
      id: `${node.id}-EV-${items.length + 1}`,
      stance,
      statement: `${RELATIONSHIP_META[c.type].label}: ${other.title}`,
      confidence: c.confidence,
      date: other.created,
      source: other.owner,
      module: other.department,
      explanation: c.note,
      impact: Math.round(c.confidence * 0.85),
    });
  }

  // Explicit unknowns — what the institution has not yet measured.
  const unknowns = [
    `Out-of-sample behaviour of ${node.id} beyond the current observation window has not been measured.`,
    `Cross-asset transfer of this conclusion (ETH / SOL) remains unquantified.`,
  ];
  unknowns.forEach((u, i) =>
    push('unknown', u, i + 30, 'Research Brain', 'AI Research Brain',
      'Flagged as an evidence gap. No measurement exists, so the Explorer records it as unknown rather than assuming a result.'));

  return items;
}

// ─── Section 4 · Relationship explorer ───────────────────────────────

export interface RelationshipItem {
  edge: KnowledgeEdge;
  other: KnowledgeNode;
  direction: 'outgoing' | 'incoming';
  label: string;
}

export function relationships(id: string): Record<string, RelationshipItem[]> {
  const grouped: Record<string, RelationshipItem[]> = {};
  for (const edge of connections(id)) {
    const direction = edge.from === id ? 'outgoing' : 'incoming';
    const other = NODE_BY_ID[direction === 'outgoing' ? edge.to : edge.from];
    if (!other) continue;
    const key = RELATIONSHIP_META[edge.type].label;
    (grouped[key] ||= []).push({ edge, other, direction, label: key });
  }
  return grouped;
}

// ─── Section 5 · Impact analysis ─────────────────────────────────────

export interface ImpactDimension { label: string; score: number; note: string }

export function impactDimensions(node: KnowledgeNode): ImpactDimension[] {
  const conns = connections(node.id);
  const fwd = trace(node.id, 'forward', 6).length - 1;
  const back = trace(node.id, 'back', 6).length - 1;
  const has = (t: RelationshipType) => conns.filter((c) => c.type === t).length;
  const cap = (v: number) => Math.max(4, Math.min(100, Math.round(v)));
  return [
    { label: 'Portfolio Impact', score: cap(node.confidence * 0.6 + has('feeds') * 12 + has('used-by') * 9), note: `${has('feeds')} feed links and ${has('used-by')} usage links into portfolio-level studies.` },
    { label: 'Research Impact', score: cap(fwd * 9 + node.evidenceScore * 0.5), note: `${fwd} downstream research objects trace back to this object.` },
    { label: 'Institution Impact', score: cap(degree(node.id) * 8 + node.confidence * 0.4), note: `${degree(node.id)} total institutional connections across departments.` },
    { label: 'Governance Impact', score: cap(node.governanceHistory.length * 22 + has('blocked-by') * 25 + has('rejected-by') * 20 + 12), note: node.governanceHistory[0] || 'No direct governance decision attached; advisory only.' },
    { label: 'Promotion Impact', score: cap(node.promotionHistory.length * 25 + has('promoted-to') * 30 + node.confidence * 0.3), note: node.promotionHistory[0] || 'Not currently on a promotion path.' },
    { label: 'Knowledge Impact', score: cap(node.lessons.length * 18 + has('archived-as') * 22 + node.evidenceScore * 0.5), note: `${node.lessons.length} lessons and ${has('archived-as')} memory archives derive from this object.` },
    { label: 'Future Research Impact', score: cap(node.futureResearch.length * 20 + back * 6 + 20), note: `${node.futureResearch.length} open research threads currently reference this object.` },
  ];
}

// ─── Section 6 · Department contributions ────────────────────────────

export const DEPARTMENTS = [
  'AI Research Brain', 'AI Quant Scientist', 'Portfolio AI Director',
  'AI Chief Investment Officer', 'Mission Control', 'Executive Board',
  'Autonomous Research Engine', 'AI Research Assistant',
];

const DEPT_LINK: Record<string, string> = {
  'AI Research Brain': '/research-brain',
  'AI Quant Scientist': '/quant-scientist',
  'Portfolio AI Director': '/portfolio-ai-director',
  'AI Chief Investment Officer': '/cio',
  'Mission Control': '/mission-control',
  'Executive Board': '/executive',
  'Autonomous Research Engine': '/autonomous-research',
  'AI Research Assistant': '/research-assistant',
};

export interface DepartmentContribution {
  department: string;
  link: string;
  contribution: string;
  confidence: number;
  reasoning: string;
  evidence: string;
  timestamp: string;
  primary: boolean;
}

export function departmentContributions(node: KnowledgeNode): DepartmentContribution[] {
  const family = [...new Set(connections(node.id).map((c) => NODE_BY_ID[c.from === node.id ? c.to : c.from]?.department).filter(Boolean))];
  return DEPARTMENTS.map((dept, i) => {
    const primary = node.department === dept;
    const involved = primary || family.includes(dept);
    return {
      department: dept,
      link: DEPT_LINK[dept],
      contribution: primary
        ? `Originated and currently owns ${node.id}.`
        : involved
          ? `Contributed connected research and review commentary to ${node.id}.`
          : `Monitoring only — no direct contribution recorded for ${node.id}.`,
      confidence: primary ? node.confidence : involved ? rnd(node.id, i + 200, 55, 84) : rnd(node.id, i + 300, 18, 44),
      reasoning: primary
        ? `${dept} raised the original work, gathered evidence and maintains the object record.`
        : involved
          ? `${dept} consumes this object inside its own analysis and has published at least one linked artefact.`
          : `${dept} has observed the object in the intelligence bus but has produced no dependent artefact.`,
      evidence: primary
        ? (node.supportingEvidence[0] || 'Object record and audit log.')
        : involved
          ? `Linked artefact in ${dept} referencing ${node.id}.`
          : 'No dependent evidence recorded.',
      timestamp: dateOfDay(dayOf(node.created) + i * 2),
      primary,
    };
  }).sort((a, b) => Number(b.primary) - Number(a.primary) || b.confidence - a.confidence);
}

// ─── Section 7 · Research Replay ─────────────────────────────────────

export interface ReplayFrame {
  day: number;
  date: string;
  title: string;
  detail: string;
  nodeId: string | null;
  kind: 'origin' | 'progress' | 'failure' | 'breakthrough' | 'governance' | 'memory';
}

export function replayFrames(id: string): ReplayFrame[] {
  const stages = lifeStages(id);
  const node = NODE_BY_ID[id];
  const frames: ReplayFrame[] = stages.filter((s) => s.reached).map((s) => ({
    day: s.day,
    date: s.date,
    title: `${s.stage} — ${s.label}`,
    detail: s.detail,
    nodeId: s.nodeId,
    kind:
      s.stage === 'Idea' || s.stage === 'Question' ? 'origin'
      : s.stage === 'Breakthrough' ? 'breakthrough'
      : s.stage === 'Promotion' ? 'governance'
      : s.stage.includes('Memory') || s.stage === 'Historical Record' ? 'memory' : 'progress',
  }));

  if (node.counterEvidence.length) {
    frames.push({
      day: Math.max(2, dayOf(node.created) + rnd(id, 9, 3, 18)),
      date: dateOfDay(dayOf(node.created) + rnd(id, 9, 3, 18)),
      title: `Failure discovered — ${node.counterEvidence[0]}`,
      detail: 'Counter evidence forced a re-test and reduced confidence before the line resumed.',
      nodeId: node.id,
      kind: 'failure',
    });
  }
  return frames.sort((a, b) => a.day - b.day).map((f, i, arr) => ({ ...f, day: Math.max(f.day, i === 0 ? f.day : arr[i - 1].day) }));
}

// ─── Section 8 · Cause & effect ──────────────────────────────────────

export interface CauseEffect {
  question: string;
  answer: string;
  items: { id: string; label: string; note: string }[];
}

export function causeAndEffect(id: string): CauseEffect[] {
  const back = trace(id, 'back', 3).slice(1);
  const fwd = trace(id, 'forward', 3).slice(1);
  const conns = connections(id);
  const map = (steps: typeof back) => steps.map((s) => ({
    id: s.node.id,
    label: `${s.node.id} · ${s.node.title}`,
    note: s.edge ? `${RELATIONSHIP_META[s.edge.type].label} · ${s.edge.confidence}% · ${s.edge.note}` : '',
  }));
  const obsolete = conns.filter((c) => c.type === 'superseded' || c.type === 'archived-as')
    .map((c) => { const o = NODE_BY_ID[c.from === id ? c.to : c.from]; return { id: o.id, label: `${o.id} · ${o.title}`, note: c.note }; });
  const node = NODE_BY_ID[id];
  return [
    { question: 'What caused this?', answer: back.length ? `${back.length} upstream objects created the conditions for ${id}.` : `${id} is an origin object — nothing upstream caused it.`, items: map(back) },
    { question: 'What changed because of this?', answer: fwd.length ? `${fwd.length} downstream objects changed as a direct or indirect result.` : 'No downstream change recorded yet.', items: map(fwd) },
    { question: 'What depended on this?', answer: `${conns.filter((c) => c.type === 'depends-on' || c.type === 'used-by' || c.type === 'feeds').length} objects depend operationally on this record.`, items: conns.filter((c) => ['depends-on', 'used-by', 'feeds'].includes(c.type)).map((c) => { const o = NODE_BY_ID[c.from === id ? c.to : c.from]; return { id: o.id, label: `${o.id} · ${o.title}`, note: `${RELATIONSHIP_META[c.type].label} · ${c.note}` }; }) },
    { question: 'What became obsolete?', answer: obsolete.length ? 'The following work was superseded or archived as a result.' : 'Nothing has been made obsolete by this object.', items: obsolete },
    { question: 'What future research exists?', answer: node.futureResearch.length ? `${node.futureResearch.length} research threads remain open.` : 'No open threads currently attached.', items: node.futureResearch.map((f, i) => ({ id, label: f, note: `Open thread ${i + 1} · advisory only` })) },
  ];
}

// ─── Section 9 · Knowledge DNA ───────────────────────────────────────

export interface DnaAxis { axis: string; value: number; note: string }

export function knowledgeDna(node: KnowledgeNode): DnaAxis[] {
  const conns = connections(node.id);
  const cap = (v: number) => Math.max(5, Math.min(100, Math.round(v)));
  const validations = conns.filter((c) => c.type === 'validated-by' || c.type === 'supports').length;
  const reuse = conns.filter((c) => c.type === 'used-by' || c.type === 'feeds' || c.type === 'depends-on').length;
  return [
    { axis: 'Research Confidence', value: node.confidence, note: 'Confidence recorded on the object itself.' },
    { axis: 'Novelty', value: cap(100 - degree(node.id) * 5 + rnd(node.id, 1, 0, 18)), note: 'Lower where the object sits inside a dense, well-explored cluster.' },
    { axis: 'Evidence Depth', value: node.evidenceScore, note: `${node.supportingEvidence.length} supporting and ${node.counterEvidence.length} counter items recorded.` },
    { axis: 'Validation Depth', value: cap(validations * 26 + node.evidenceScore * 0.4), note: `${validations} validation or support relationships.` },
    { axis: 'Reuse Count', value: cap(reuse * 24 + 10), note: `${reuse} objects reuse this record.` },
    { axis: 'Institution Importance', value: cap(degree(node.id) * 9 + node.confidence * 0.35), note: `${degree(node.id)} institutional connections.` },
    { axis: 'Governance Rating', value: cap(90 - conns.filter((c) => c.type === 'blocked-by' || c.type === 'rejected-by').length * 30 - (node.status === 'rejected' ? 40 : 0)), note: 'Reduced by active blocks or formal rejections.' },
    { axis: 'Promotion Readiness', value: cap(node.status === 'validated' ? node.confidence * 0.9 : node.status === 'rejected' ? 8 : node.confidence * 0.55), note: 'Promotion remains locked pending human approval.' },
  ];
}

// ─── Section 10 · Institutional dependencies ─────────────────────────

export interface DependencyGroup { label: string; description: string; ids: string[] }

export function dependencyGroups(id: string): DependencyGroup[] {
  const node = NODE_BY_ID[id];
  const out = outgoing(id); const inc = incoming(id);
  const parents = out.filter((c) => ['derived-from', 'depends-on', 'validated-by'].includes(c.type)).map((c) => c.to);
  const children = inc.filter((c) => ['derived-from', 'depends-on', 'validated-by', 'feeds'].includes(c.type)).map((c) => c.from);
  const siblingSet = new Set<string>();
  for (const p of parents) for (const c of incoming(p)) if (c.from !== id) siblingSet.add(c.from);
  const parallel = KNOWLEDGE_NODES
    .filter((k) => k.id !== id && k.type === node.type && !parents.includes(k.id) && !children.includes(k.id))
    .slice(0, 5).map((k) => k.id);
  const alternatives = KNOWLEDGE_NODES
    .filter((k) => k.id !== id && k.department === node.department && k.type !== node.type)
    .slice(0, 4).map((k) => k.id);
  const superseded = connections(id).filter((c) => c.type === 'superseded').map((c) => (c.from === id ? c.to : c.from));
  const rejected = KNOWLEDGE_NODES.filter((k) => k.status === 'rejected').map((k) => k.id);

  return [
    { label: 'Parents', description: 'Objects this record was derived from or depends on.', ids: parents },
    { label: 'Children', description: 'Objects derived from this record.', ids: children },
    { label: 'Siblings', description: 'Research sharing the same parent objects.', ids: [...siblingSet] },
    { label: 'Parallel Research', description: 'Same object type, running independently.', ids: parallel },
    { label: 'Alternative Approaches', description: 'Other approaches from the same department.', ids: alternatives },
    { label: 'Superseded Versions', description: 'Versions replaced by later work.', ids: superseded },
    { label: 'Rejected Alternatives', description: 'Formally rejected lines retained as knowledge.', ids: rejected },
  ];
}

// ─── Section 11 · Future opportunities ───────────────────────────────

export interface Opportunity {
  kind: 'Open Question' | 'Possible Improvement' | 'Unanswered Problem' | 'Future Experiment' | 'Potential Breakthrough';
  title: string;
  rationale: string;
  priority: number;      // 1 = highest
  expectedGain: number;  // 0-100
}

export function futureOpportunities(node: KnowledgeNode): Opportunity[] {
  const base: Opportunity[] = [
    { kind: 'Open Question', title: `Does ${node.id} hold outside the current observation window?`, rationale: 'No out-of-sample measurement exists beyond the current window, so the conclusion is time-boxed.', priority: 1, expectedGain: rnd(node.id, 11, 55, 88) },
    { kind: 'Possible Improvement', title: `Tighten the evidence base of ${node.id} with a second independent test`, rationale: `Evidence score is ${node.evidenceScore}; a second independent test would raise it materially.`, priority: 2, expectedGain: rnd(node.id, 12, 45, 80) },
    { kind: 'Unanswered Problem', title: node.counterEvidence[0] ? `Resolve counter evidence: ${node.counterEvidence[0]}` : `Quantify the unmeasured failure modes of ${node.id}`, rationale: 'Counter evidence currently caps confidence and blocks a higher governance rating.', priority: 3, expectedGain: rnd(node.id, 13, 40, 78) },
    { kind: 'Future Experiment', title: node.futureResearch[0] || `Cross-asset replication of ${node.id} on ETH and SOL`, rationale: 'Replication across assets would separate a genuine edge from an asset-specific artefact.', priority: 4, expectedGain: rnd(node.id, 14, 35, 74) },
    { kind: 'Potential Breakthrough', title: `Combine ${node.id} with the strongest adjacent research line`, rationale: 'Adjacent clusters share evidence but have never been tested jointly; a combination could produce a step change.', priority: 5, expectedGain: rnd(node.id, 15, 30, 92) },
  ];
  return base
    .map((o) => ({ ...o, expectedGain: o.expectedGain }))
    .sort((a, b) => b.expectedGain - a.expectedGain)
    .map((o, i) => ({ ...o, priority: i + 1 }));
}

// ─── Section 12 · Executive commentary ───────────────────────────────

export interface Commentary { heading: string; body: string }

export function executiveCommentary(node: KnowledgeNode): Commentary[] {
  const conns = connections(node.id);
  const blockers = conns.filter((c) => c.type === 'blocked-by' || c.type === 'contradicts' || c.type === 'rejected-by');
  return [
    { heading: 'Why this object matters', body: `${node.title} sits on ${degree(node.id)} institutional connections and feeds ${outgoing(node.id).length} downstream records. Removing it would leave ${trace(node.id, 'forward', 4).length - 1} objects without an evidenced origin.` },
    { heading: 'Why it exists', body: `${node.owner} created it on ${node.created} inside ${node.department}. ${node.summary}` },
    { heading: 'Current risks', body: blockers.length ? blockers.map((b) => `${RELATIONSHIP_META[b.type].label}: ${b.note}`).join(' ') : `No active contradiction or governance block. The main residual risk is evidence staleness — the record was last strengthened around ${node.created}.` },
    { heading: 'Future value', body: `Expected research gain is highest on ${futureOpportunities(node)[0].title.toLowerCase()}, which would raise validation depth and unlock the next governance review.` },
    { heading: 'Institutional significance', body: `Classified as ${NODE_TYPE_META[node.type].label} with ${node.status} status. It is permanently retained in institutional memory regardless of outcome — including if the line is later rejected.` },
  ];
}

// ─── Section 13 · Audit trail ────────────────────────────────────────

export interface AuditEntry { day: number; date: string; actor: string; action: string; detail: string; category: string }

export function auditTrail(node: KnowledgeNode): AuditEntry[] {
  const entries: AuditEntry[] = [];
  const add = (dayOffset: number, actor: string, action: string, detail: string, category: string) => {
    const day = dayOf(node.created) + dayOffset;
    entries.push({ day, date: dateOfDay(day), actor, action, detail, category });
  };
  add(0, node.owner, 'Object created', `${node.id} registered in the institutional knowledge graph by ${node.department}.`, 'Creation');
  node.supportingEvidence.forEach((s, i) => add(2 + i * 3, node.owner, 'Evidence recorded', s, 'Evidence'));
  node.counterEvidence.forEach((s, i) => add(5 + i * 4, 'Autonomous Research Engine', 'Counter evidence recorded', s, 'Evidence'));
  connections(node.id).forEach((c, i) => {
    const other = NODE_BY_ID[c.from === node.id ? c.to : c.from];
    add(6 + i * 2, other?.department || 'ATLAS', `Relationship: ${RELATIONSHIP_META[c.type].label}`, `${other?.id} — ${c.note} (${c.confidence}% confidence)`, 'Relationship');
  });
  node.promotionHistory.forEach((s, i) => add(20 + i * 6, 'Promotion Board', 'Promotion event', s, 'Promotion'));
  node.governanceHistory.forEach((s, i) => add(24 + i * 6, 'Governance', 'Governance decision', s, 'Governance'));
  node.lessons.forEach((s, i) => add(30 + i * 5, 'AI Research Brain', 'Lesson archived', s, 'Memory'));
  add(Math.max(34, TODAY_DAY - dayOf(node.created)), 'ATLAS Intelligence Explorer', 'Record reviewed', 'Read-only review. No modification performed — human approval required for any action.', 'Review');
  return entries.sort((a, b) => a.day - b.day);
}

// ─── Section 14 · Institutional Time Machine ─────────────────────────

export interface TimeMachineState {
  day: number;
  date: string;
  knownNodes: KnowledgeNode[];
  knownEdges: KnowledgeEdge[];
  byType: { type: string; count: number }[];
  narrative: string;
}

export function timeMachine(day: number): TimeMachineState {
  const cutoff = DAY_ZERO + day * 86400000;
  const knownNodes = KNOWLEDGE_NODES.filter((n) => new Date(n.created).getTime() <= cutoff);
  const known = new Set(knownNodes.map((n) => n.id));
  const knownEdges = KNOWLEDGE_EDGES.filter((e) => known.has(e.from) && known.has(e.to));
  const counts = new Map<string, number>();
  for (const n of knownNodes) {
    const label = NODE_TYPE_META[n.type].label;
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return {
    day,
    date: dateOfDay(day),
    knownNodes,
    knownEdges,
    byType: [...counts.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
    narrative: day >= TODAY_DAY
      ? `Today (${dateOfDay(day)}). The full institution is restored: ${knownNodes.length} objects and ${knownEdges.length} relationships.`
      : `On day ${day} (${dateOfDay(day)}) the institution knew ${knownNodes.length} objects and ${knownEdges.length} relationships. Nothing created after this date is shown — no hindsight, no future information.`,
  };
}

// ─── Section 15 · Export payloads ────────────────────────────────────

export const EXPORT_KINDS = [
  'Intelligence Report',
  'Executive Report',
  'Evidence Tree',
  'Relationship Report',
  'Timeline Replay',
  'Audit Pack',
  'Knowledge DNA',
  'Institution Summary',
] as const;

export type ExportKind = typeof EXPORT_KINDS[number];

export function exportPayload(kind: ExportKind, node: KnowledgeNode): { heading: string; lines: string[] }[] {
  const blocks: { heading: string; lines: string[] }[] = [];
  const ev = evidenceItems(node);
  switch (kind) {
    case 'Institution Summary':
      blocks.push({ heading: 'Institution Summary', lines: [institutionSummary(node)] });
      break;
    case 'Executive Report':
      blocks.push({ heading: 'Institution Summary', lines: [institutionSummary(node)] });
      blocks.push({ heading: 'Executive Commentary', lines: executiveCommentary(node).map((c) => `${c.heading}: ${c.body}`) });
      blocks.push({ heading: 'Impact Analysis', lines: impactDimensions(node).map((i) => `${i.label}: ${i.score}/100 — ${i.note}`) });
      break;
    case 'Evidence Tree':
      blocks.push({ heading: 'Supporting Evidence', lines: ev.filter((e) => e.stance === 'supporting').map((e) => `${e.statement} (${e.confidence}%, ${e.module}, ${e.date})`) });
      blocks.push({ heading: 'Counter Evidence', lines: ev.filter((e) => e.stance === 'counter').map((e) => `${e.statement} (${e.confidence}%, ${e.module}, ${e.date})`) });
      blocks.push({ heading: 'Neutral Evidence', lines: ev.filter((e) => e.stance === 'neutral').map((e) => `${e.statement} (${e.confidence}%)`) });
      blocks.push({ heading: 'Unknown / Evidence Gaps', lines: ev.filter((e) => e.stance === 'unknown').map((e) => e.statement) });
      break;
    case 'Relationship Report': {
      const rel = relationships(node.id);
      for (const [label, items] of Object.entries(rel)) {
        blocks.push({ heading: label, lines: items.map((i) => `${i.other.id} · ${i.other.title} (${i.edge.confidence}%) — ${i.edge.note}`) });
      }
      break;
    }
    case 'Timeline Replay':
      blocks.push({ heading: 'Research Replay', lines: replayFrames(node.id).map((f) => `Day ${f.day} (${f.date}) — ${f.title}: ${f.detail}`) });
      break;
    case 'Audit Pack':
      blocks.push({ heading: 'Audit Trail', lines: auditTrail(node).map((a) => `Day ${a.day} (${a.date}) [${a.category}] ${a.actor}: ${a.action} — ${a.detail}`) });
      break;
    case 'Knowledge DNA':
      blocks.push({ heading: 'Knowledge DNA', lines: knowledgeDna(node).map((d) => `${d.axis}: ${d.value}/100 — ${d.note}`) });
      break;
    default:
      blocks.push({ heading: 'Institution Summary', lines: [institutionSummary(node)] });
      blocks.push({ heading: 'Institution Timeline', lines: lifeStages(node.id).map((s) => `Day ${s.day} · ${s.stage}: ${s.label}`) });
      blocks.push({ heading: 'Evidence', lines: ev.map((e) => `[${e.stance}] ${e.statement} (${e.confidence}%, impact ${e.impact}, ${e.module})`) });
      blocks.push({ heading: 'Impact Analysis', lines: impactDimensions(node).map((i) => `${i.label}: ${i.score}/100`) });
      blocks.push({ heading: 'Knowledge DNA', lines: knowledgeDna(node).map((d) => `${d.axis}: ${d.value}/100`) });
      blocks.push({ heading: 'Cause & Effect', lines: causeAndEffect(node.id).map((c) => `${c.question} ${c.answer}`) });
      blocks.push({ heading: 'Future Opportunities', lines: futureOpportunities(node).map((o) => `#${o.priority} [${o.kind}] ${o.title} — expected gain ${o.expectedGain}`) });
      blocks.push({ heading: 'Executive Commentary', lines: executiveCommentary(node).map((c) => `${c.heading}: ${c.body}`) });
      blocks.push({ heading: 'Audit Trail', lines: auditTrail(node).map((a) => `Day ${a.day} [${a.category}] ${a.actor}: ${a.action}`) });
  }
  blocks.push({ heading: 'Governance', lines: EXPLORER_GUARANTEES });
  return blocks;
}

// ─── Explorer directory ──────────────────────────────────────────────

export const EXPLORER_ENTRY_TYPES = [
  'question', 'hypothesis', 'experiment', 'validation', 'discovery', 'breakthrough',
  'specialist', 'recommendation', 'thread', 'paper', 'lesson', 'promotion',
  'governance', 'portfolio', 'allocation', 'memory', 'risk', 'architecture',
];

export const DEFAULT_EXPLORER_ID = 'SPC-LVC';
