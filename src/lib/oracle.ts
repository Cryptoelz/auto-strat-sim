// ATLAS Oracle™ — institutional conversational intelligence.
// READ ONLY / OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY.
// Every answer is derived exclusively from the Institutional Knowledge Graph.
// No invented facts, no fabricated evidence, no live connectivity.

import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META,
  connections, outgoing, incoming, trace, searchKnowledge, degree,
  type KnowledgeNode, type KnowledgeNodeType, type RelationshipType,
} from './knowledgeGraph';
import { DEPARTMENTS, dayOf, dateOfDay } from './intelligenceExplorer';

export const ORACLE_BADGES = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required',
];

export const ORACLE_GUARANTEES = [
  'No Exchange Connectivity',
  'No API Keys',
  'No Live Trading',
  'No Strategy Modification',
  'No Allocation Changes',
  'Every answer cites source objects',
  'Contradictory evidence is never hidden',
];

export const KNOWLEDGE_GRAPH_VERSION = 'KG v3.2';
export const INSTITUTION_VERSION = 'ATLAS™ v1.0 · Phase 4';

export const EXAMPLE_QUESTIONS = [
  'Why is Portfolio PF falling?',
  'Explain Confidence Weighted Allocation.',
  'Show everything connected to Low-Vol Coiler.',
  'Why was Volume Breakout rejected?',
  'Which specialist has the highest evidence score?',
  "Explain today's Executive Recommendation.",
  'Show all discoveries created by AI Quant Scientist.',
  'Why is Executive Consensus only 74%?',
  'What produced Institutional Memory MEM-001?',
  'Show the entire history of Confidence Weighted Allocation.',
];

export interface SuggestedCard { id: string; title: string; description: string; query: string }

export const SUGGESTED_CARDS: SuggestedCard[] = [
  { id: 'exec-rec', title: "Today's Executive Recommendation", description: 'The single standing recommendation and its blockers.', query: "Explain today's Executive Recommendation." },
  { id: 'discovery', title: "Today's Biggest Discovery", description: 'Highest-impact discovery currently on the feed.', query: "Show today's biggest discovery." },
  { id: 'influential', title: 'Most Influential Specialist', description: 'Specialist with the widest downstream footprint.', query: 'Which specialist is the most influential?' },
  { id: 'high-conf', title: 'Highest Confidence Discovery', description: 'Best-evidenced object in the institution.', query: 'Which discovery has the highest confidence?' },
  { id: 'timeline', title: 'Institutional Timeline', description: 'Every material event in chronological order.', query: 'Show the institutional timeline.' },
  { id: 'promotion', title: 'Promotion History', description: 'All promotion decisions and their gates.', query: 'Show the promotion history.' },
  { id: 'growth', title: 'Knowledge Growth', description: 'How institutional knowledge has compounded.', query: 'Show knowledge growth.' },
  { id: 'rejected', title: 'Rejected Ideas', description: 'What failed, and what it taught the institution.', query: 'Show all rejected ideas.' },
  { id: 'breakthrough', title: 'Breakthrough Timeline', description: 'Breakthroughs and the work that produced them.', query: 'Show the breakthrough timeline.' },
  { id: 'open', title: 'Open Questions', description: 'Unresolved research questions still in play.', query: 'Show all open questions.' },
  { id: 'velocity', title: 'Research Velocity', description: 'Rate of validated output across the organisation.', query: 'What is our research velocity?' },
  { id: 'heatmap', title: 'Knowledge Heatmap', description: 'Where knowledge is dense and where it is thin.', query: 'Show the knowledge heatmap.' },
];

export const EXPLAIN_MODES = [
  { id: 'simply', label: 'Explain Simply' },
  { id: 'technically', label: 'Explain Technically' },
  { id: 'executives', label: 'Explain for Executives' },
  { id: 'mathematics', label: 'Explain Mathematics' },
  { id: 'evidence', label: 'Explain Evidence' },
  { id: 'governance', label: 'Explain Governance' },
  { id: 'timeline', label: 'Explain Timeline' },
  { id: 'new', label: "Explain Like I'm New" },
] as const;

export type ExplainMode = typeof EXPLAIN_MODES[number]['id'];

export const ORACLE_EXPORTS = [
  'Oracle Report', 'Executive Summary', 'Evidence Tree', 'Timeline',
  'Knowledge Graph', 'Audit Pack', 'Institutional Summary', 'Relationship Report',
] as const;
export type OracleExport = typeof ORACLE_EXPORTS[number];

// ─── Types ───────────────────────────────────────────────────────────

export interface EvidenceGroup { type: KnowledgeNodeType; label: string; ids: string[] }
export interface ChainStage { stage: string; id?: string; title: string; detail: string }
export interface RelationshipGroup { type: RelationshipType; label: string; items: { id: string; note: string; confidence: number }[] }
export interface TimelineEvent { day: number; date: string; id: string; stage: string; title: string; detail: string }
export interface DeptContribution { key: string; name: string; percent: number; note: string }
export interface ReuseGroup { label: string; items: string[] }

export interface OracleAnswer {
  auditId: string;
  question: string;
  resolvedQuestion: string;
  interpretation: string;
  focusIds: string[];
  found: boolean;
  summary: string[];
  evidence: EvidenceGroup[];
  chain: ChainStage[];
  confidence: {
    overall: number;
    evidenceStrength: number;
    counterEvidence: string[];
    missingValidation: string[];
    openQuestions: string[];
    unknowns: string[];
    caveat?: string;
  };
  relationships: RelationshipGroup[];
  timeline: TimelineEvent[];
  departments: DeptContribution[];
  reuse: ReuseGroup[];
  relatedQuestions: string[];
  generated: string;
  evidenceScore: number;
}

// ─── Question interpretation ─────────────────────────────────────────

const CONTEXT_TOKENS = [' that', ' it ', ' this', 'those', 'them', 'the above'];

export function needsContext(q: string): boolean {
  const l = ` ${q.toLowerCase()} `;
  return CONTEXT_TOKENS.some((t) => l.includes(t));
}

const ALIASES: { match: RegExp; ids: string[] }[] = [
  { match: /low[- ]?vol|coiler|lvc/i, ids: ['SPC-LVC'] },
  { match: /confidence weighted|allocation model|cwa/i, ids: ['ALO-002'] },
  { match: /portfolio pf|pf falling|profit factor/i, ids: ['PRT-004'] },
  { match: /volume breakout|rejected clone|rej-002/i, ids: ['REJ-002'] },
  { match: /vcb|compression breakout/i, ids: ['SPC-VCB'] },
  { match: /momentum scalper|ms v2|ms2/i, ids: ['SPC-MS2'] },
  { match: /consensus|executive recommendation|recommendation/i, ids: ['REC-021'] },
  { match: /quant scientist/i, ids: ['DPT-QUANT'] },
  { match: /research brain/i, ids: ['DPT-BRAIN'] },
  { match: /governance|gate|locked/i, ids: ['GOV-011'] },
  { match: /router|threshold|frequency/i, ids: ['HYP-014'] },
  { match: /champion trial|trial/i, ids: ['TRL-001'] },
  { match: /activation lag|discovery/i, ids: ['DIS-007'] },
  { match: /breakthrough/i, ids: ['BRK-003'] },
  { match: /memory|mem-001/i, ids: ['MEM-001'] },
];

const byType = (t: KnowledgeNodeType) => KNOWLEDGE_NODES.filter((n) => n.type === t);
const topBy = (nodes: KnowledgeNode[], key: (n: KnowledgeNode) => number) =>
  [...nodes].sort((a, b) => key(b) - key(a));

interface Intent { test: RegExp; label: string; resolve: () => string[] }

const INTENTS: Intent[] = [
  { test: /biggest discovery|today'?s discovery/i, label: 'Highest-impact discovery', resolve: () => topBy(byType('discovery').concat(byType('breakthrough')), (n) => n.evidenceScore + degree(n.id) * 3).slice(0, 2).map((n) => n.id) },
  { test: /most influential specialist|influential/i, label: 'Specialist ranked by downstream footprint', resolve: () => topBy(byType('specialist'), (n) => degree(n.id) * 10 + n.evidenceScore).slice(0, 3).map((n) => n.id) },
  { test: /highest (confidence|evidence)/i, label: 'Objects ranked by confidence and evidence score', resolve: () => topBy(KNOWLEDGE_NODES.filter((n) => n.type !== 'department'), (n) => n.confidence + n.evidenceScore).slice(0, 4).map((n) => n.id) },
  { test: /institutional timeline|timeline of the institution/i, label: 'Full institutional timeline', resolve: () => topBy(KNOWLEDGE_NODES, (n) => -dayOf(n.created)).slice(0, 14).map((n) => n.id) },
  { test: /promotion history|promotions/i, label: 'Promotion and governance decisions', resolve: () => byType('promotion').concat(byType('governance')).map((n) => n.id) },
  { test: /knowledge growth|compound/i, label: 'Knowledge accumulation across object types', resolve: () => topBy(KNOWLEDGE_NODES.filter((n) => n.type !== 'department'), (n) => dayOf(n.created)).slice(0, 12).map((n) => n.id) },
  { test: /rejected/i, label: 'Rejected ideas and the lessons they produced', resolve: () => byType('rejected').concat(byType('lesson')).map((n) => n.id) },
  { test: /breakthrough/i, label: 'Breakthroughs and their originating work', resolve: () => byType('breakthrough').concat(byType('paper')).map((n) => n.id) },
  { test: /open question/i, label: 'Unresolved research questions', resolve: () => KNOWLEDGE_NODES.filter((n) => n.type === 'question' || n.status === 'open').map((n) => n.id) },
  { test: /velocity/i, label: 'Validated research output over time', resolve: () => KNOWLEDGE_NODES.filter((n) => ['experiment', 'validation', 'discovery'].includes(n.type)).map((n) => n.id) },
  { test: /heatmap|dense|thin/i, label: 'Knowledge density by connectivity', resolve: () => topBy(KNOWLEDGE_NODES, (n) => degree(n.id)).slice(0, 10).map((n) => n.id) },
  { test: /all discoveries/i, label: 'All recorded discoveries', resolve: () => byType('discovery').map((n) => n.id) },
];

export function resolveFocus(question: string, contextIds: string[] = []): { ids: string[]; interpretation: string } {
  const q = question.trim();
  if (!q) return { ids: contextIds, interpretation: 'No question supplied.' };

  for (const intent of INTENTS) {
    if (intent.test.test(q)) {
      const ids = intent.resolve().filter((id) => NODE_BY_ID[id]);
      if (ids.length) return { ids, interpretation: intent.label };
    }
  }

  const aliasIds = ALIASES.filter((a) => a.match.test(q)).flatMap((a) => a.ids);
  const explicit = (q.toUpperCase().match(/[A-Z]{3}-[0-9A-Z]{3}/g) || []).filter((id) => NODE_BY_ID[id]);
  const hits = searchKnowledge(q).map((h) => h.node.id);
  const merged = Array.from(new Set([...explicit, ...aliasIds, ...hits])).slice(0, 6);

  if (merged.length) {
    return {
      ids: merged,
      interpretation: `Matched ${merged.length} institutional object${merged.length === 1 ? '' : 's'} by identifier, title, evidence and summary text.`,
    };
  }
  if (needsContext(q) && contextIds.length) {
    return { ids: contextIds, interpretation: 'Resolved from conversation context (previous answer focus).' };
  }
  return { ids: [], interpretation: 'No institutional object matched this question.' };
}

// ─── Answer construction ─────────────────────────────────────────────

function neighbourhood(ids: string[]): KnowledgeNode[] {
  const set = new Map<string, KnowledgeNode>();
  for (const id of ids) {
    const node = NODE_BY_ID[id];
    if (!node) continue;
    set.set(id, node);
    for (const step of trace(id, 'back', 3).slice(1)) set.set(step.node.id, step.node);
    for (const step of trace(id, 'forward', 3).slice(1)) set.set(step.node.id, step.node);
  }
  return Array.from(set.values());
}

const CHAIN_ORDER: { stage: string; types: KnowledgeNodeType[] }[] = [
  { stage: 'Question', types: ['question'] },
  { stage: 'Hypothesis', types: ['hypothesis'] },
  { stage: 'Experiment', types: ['experiment'] },
  { stage: 'Validation', types: ['validation'] },
  { stage: 'Discovery', types: ['discovery'] },
  { stage: 'Breakthrough', types: ['breakthrough'] },
  { stage: 'Promotion', types: ['promotion', 'governance'] },
  { stage: 'Institutional Memory', types: ['memory', 'lesson'] },
];

const EVIDENCE_ORDER: KnowledgeNodeType[] = [
  'question', 'hypothesis', 'experiment', 'validation', 'discovery', 'breakthrough',
  'promotion', 'governance', 'specialist', 'department', 'portfolio', 'allocation',
  'memory', 'lesson', 'report', 'paper', 'risk', 'architecture', 'rejected', 'thread', 'recommendation',
];

let auditCounter = 0;

export function askOracle(question: string, contextIds: string[] = []): OracleAnswer {
  const { ids, interpretation } = resolveFocus(question, contextIds);
  const resolvedQuestion = !ids.length || !needsContext(question) || ids === contextIds
    ? question
    : question;
  auditCounter += 1;
  const auditId = `ORC-${String(Date.now()).slice(-6)}-${String(auditCounter).padStart(3, '0')}`;
  const generated = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  if (!ids.length) {
    return {
      auditId, question, resolvedQuestion, interpretation, focusIds: [], found: false,
      summary: ['No institutional evidence currently exists.'],
      evidence: [], chain: [],
      confidence: { overall: 0, evidenceStrength: 0, counterEvidence: [], missingValidation: [], openQuestions: [], unknowns: ['The Oracle will not answer beyond recorded institutional knowledge.'], caveat: 'This conclusion requires additional validation.' },
      relationships: [], timeline: [], departments: [], reuse: [],
      relatedQuestions: EXAMPLE_QUESTIONS.slice(0, 5),
      generated, evidenceScore: 0,
    };
  }

  const focus = ids.map((id) => NODE_BY_ID[id]).filter(Boolean);
  const primary = focus[0];
  const scope = neighbourhood(ids);

  // Section 2 — evidence
  const evidence: EvidenceGroup[] = EVIDENCE_ORDER
    .map((type) => ({ type, label: NODE_TYPE_META[type].label, ids: scope.filter((n) => n.type === type).map((n) => n.id) }))
    .filter((g) => g.ids.length);

  // Section 3 — reasoning chain
  const chain: ChainStage[] = CHAIN_ORDER.map(({ stage, types }) => {
    const hit = scope.find((n) => types.includes(n.type));
    return hit
      ? { stage, id: hit.id, title: hit.title, detail: `${hit.id} · ${hit.status} · ${hit.confidence}% confidence` }
      : { stage, title: 'No recorded object at this stage', detail: 'Stage not represented in the current evidence set.' };
  });

  // Section 4 — confidence
  const overall = Math.round(focus.reduce((s, n) => s + n.confidence, 0) / focus.length);
  const evidenceStrength = Math.round(focus.reduce((s, n) => s + n.evidenceScore, 0) / focus.length);
  const counterEvidence = Array.from(new Set(
    focus.flatMap((n) => n.counterEvidence).concat(
      KNOWLEDGE_EDGES.filter((e) => (ids.includes(e.from) || ids.includes(e.to)) && (e.type === 'contradicts' || e.type === 'rejected-by'))
        .map((e) => `${RELATIONSHIP_META[e.type].label}: ${e.note} (${e.confidence}%)`),
    ),
  ));
  const missingValidation = scope.filter((n) => n.status === 'blocked' || n.status === 'open')
    .map((n) => `${n.id} · ${n.title} (${n.status})`);
  const openQuestions = scope.filter((n) => n.type === 'question' && n.status !== 'validated')
    .map((n) => `${n.id} · ${n.title}`);
  const unknowns = Array.from(new Set(focus.flatMap((n) => n.futureResearch))).slice(0, 6);
  const caveat = overall < 70 || evidenceStrength < 65 ? 'This conclusion requires additional validation.' : undefined;

  // Section 5 — relationships
  const relMap = new Map<RelationshipType, { id: string; note: string; confidence: number }[]>();
  for (const id of ids) {
    for (const edge of connections(id)) {
      const other = edge.from === id ? edge.to : edge.from;
      if (!NODE_BY_ID[other]) continue;
      const list = relMap.get(edge.type) || [];
      if (!list.some((l) => l.id === other)) list.push({ id: other, note: edge.note, confidence: edge.confidence });
      relMap.set(edge.type, list);
    }
  }
  const relationships: RelationshipGroup[] = Array.from(relMap.entries())
    .map(([type, items]) => ({ type, label: RELATIONSHIP_META[type].label, items }))
    .sort((a, b) => b.items.length - a.items.length);

  // Section 6 — timeline
  const stageOf = (n: KnowledgeNode) => CHAIN_ORDER.find((c) => c.types.includes(n.type))?.stage || NODE_TYPE_META[n.type].label;
  const timeline: TimelineEvent[] = scope
    .map((n) => ({ day: dayOf(n.created), date: n.created, id: n.id, stage: stageOf(n), title: n.title, detail: `${n.owner} · ${n.department} · ${n.status}` }))
    .sort((a, b) => a.day - b.day);

  // Section 7 — department contributions
  const deptWeights = DEPARTMENTS.map((d) => {
    const owned = scope.filter((n) => n.department.toLowerCase().includes(d.name.toLowerCase().replace('ai ', '')) || n.owner.toLowerCase().includes(d.name.toLowerCase().replace('ai ', '')));
    const raw = owned.length * 10 + owned.reduce((s, n) => s + n.evidenceScore, 0) / 10;
    return { key: d.key, name: d.name, raw, count: owned.length };
  });
  const totalRaw = deptWeights.reduce((s, d) => s + d.raw, 0) || 1;
  const departments: DeptContribution[] = deptWeights
    .map((d) => ({ key: d.key, name: d.name, percent: Math.round((d.raw / totalRaw) * 100), note: d.count ? `${d.count} contributing object${d.count === 1 ? '' : 's'} in this evidence set` : 'No direct contribution recorded' }))
    .sort((a, b) => b.percent - a.percent);

  // Section 8 — knowledge reuse
  const forwardIds = ids.flatMap((id) => trace(id, 'forward', 4).slice(1).map((s) => s.node));
  const uniqFwd = Array.from(new Map(forwardIds.map((n) => [n.id, n])).values());
  const reuseOf = (label: string, types: KnowledgeNodeType[]) => ({
    label,
    items: uniqFwd.filter((n) => types.includes(n.type)).map((n) => `${n.id} · ${n.title}`),
  });
  const reuse: ReuseGroup[] = [
    reuseOf('Portfolio Studies', ['portfolio', 'architecture']),
    reuseOf('Specialists', ['specialist']),
    reuseOf('Executive Recommendations', ['recommendation', 'report']),
    reuseOf('Research Threads', ['thread', 'hypothesis']),
    reuseOf('Validation Packs', ['validation', 'experiment']),
    reuseOf('Champion Trial', ['allocation']),
    reuseOf('Institutional Memory', ['memory', 'lesson']),
  ].map((g) => ({ ...g, items: g.items.length ? g.items : ['No recorded reuse.'] }));

  // Section 1 — executive summary (built only from recorded facts)
  const strongestUp = outgoing(primary.id).sort((a, b) => b.confidence - a.confidence)[0];
  const strongestDown = incoming(primary.id).sort((a, b) => b.confidence - a.confidence)[0];
  const summary = [
    `${primary.id} · ${primary.title} is a ${NODE_TYPE_META[primary.type].label.toLowerCase()} owned by ${primary.owner} (${primary.department}). It is currently ${primary.status}, carrying ${primary.confidence}% confidence and an evidence score of ${primary.evidenceScore}. ${primary.summary}`,
    strongestUp
      ? `Upstream, it ${RELATIONSHIP_META[strongestUp.type].label.toLowerCase()} ${strongestUp.to} · ${NODE_BY_ID[strongestUp.to]?.title} at ${strongestUp.confidence}% confidence. ${strongestDown ? `Downstream, ${strongestDown.from} · ${NODE_BY_ID[strongestDown.from]?.title} depends on it (${RELATIONSHIP_META[strongestDown.type].label}, ${strongestDown.confidence}%).` : 'Nothing downstream currently depends on it.'} The evidence set spans ${scope.length} institutional objects across ${evidence.length} object types.`
      : `This is an origin object with no upstream dependency. The evidence set spans ${scope.length} institutional objects across ${evidence.length} object types.`,
    counterEvidence.length
      ? `Disagreement is on record: ${counterEvidence.length} counter-evidence item${counterEvidence.length === 1 ? '' : 's'} are attached, and ${missingValidation.length} object${missingValidation.length === 1 ? ' remains' : 's remain'} blocked or open. ${caveat || 'Confidence remains within the institutional acceptance band, but human approval is still required.'}`
      : `No contradictory evidence is recorded against this conclusion. ${missingValidation.length} object${missingValidation.length === 1 ? ' remains' : 's remain'} blocked or open. ${caveat || 'Advisory only — human approval is required before any action.'}`,
  ];

  // Section 11 — related questions
  const relatedQuestions = Array.from(new Set([
    ...primary.futureResearch.map((f) => (f.endsWith('?') ? f : `${f}?`)),
    counterEvidence.length ? 'What evidence contradicts this?' : 'What would falsify this conclusion?',
    missingValidation.length ? 'Should promotion remain locked?' : 'What experiments remain?',
    `Show everything connected to ${primary.title.split(' ').slice(0, 3).join(' ')}.`,
    `Show the entire history of ${primary.id}.`,
  ])).slice(0, 6);

  return {
    auditId, question, resolvedQuestion, interpretation, focusIds: ids, found: true,
    summary, evidence, chain,
    confidence: { overall, evidenceStrength, counterEvidence, missingValidation, openQuestions, unknowns, caveat },
    relationships, timeline, departments, reuse, relatedQuestions,
    generated, evidenceScore: evidenceStrength,
  };
}

// ─── Explain Further ─────────────────────────────────────────────────

export function explainFurther(mode: ExplainMode, answer: OracleAnswer): { heading: string; lines: string[] } {
  if (!answer.found) {
    return { heading: 'No institutional evidence', lines: ['No institutional evidence currently exists for this question.'] };
  }
  const node = NODE_BY_ID[answer.focusIds[0]];
  const meta = NODE_TYPE_META[node.type];
  switch (mode) {
    case 'simply':
      return { heading: 'Explain Simply', lines: [
        `${node.title} is a ${meta.label.toLowerCase()} the institution has been studying.`,
        `Right now it is ${node.status}, and the research team is ${node.confidence}% confident in it.`,
        node.summary,
      ] };
    case 'technically':
      return { heading: 'Explain Technically', lines: [
        `Object ${node.id} · type=${node.type} · status=${node.status} · confidence=${node.confidence} · evidenceScore=${node.evidenceScore}.`,
        `Graph degree ${degree(node.id)} across ${connections(node.id).length} typed relationships.`,
        ...connections(node.id).slice(0, 6).map((e) => `${e.from} —${RELATIONSHIP_META[e.type].label}(${e.strength}, ${e.confidence}%)→ ${e.to}: ${e.note}`),
      ] };
    case 'executives':
      return { heading: 'Explain for Executives', lines: answer.summary };
    case 'mathematics':
      return { heading: 'Explain Mathematics', lines: [
        `Overall confidence = mean(node confidence over ${answer.focusIds.length} focus object(s)) = ${answer.confidence.overall}%.`,
        `Evidence strength = mean(node evidence score) = ${answer.confidence.evidenceStrength}/100.`,
        `Evidence breadth = ${answer.evidence.reduce((s, g) => s + g.ids.length, 0)} objects across ${answer.evidence.length} object types.`,
        `Counter-evidence weight = ${answer.confidence.counterEvidence.length} recorded item(s); blocked/open objects = ${answer.confidence.missingValidation.length}.`,
      ] };
    case 'evidence':
      return { heading: 'Explain Evidence', lines: [
        ...node.supportingEvidence.map((s) => `Supporting — ${s}`),
        ...(node.counterEvidence.length ? node.counterEvidence.map((s) => `Counter — ${s}`) : ['Counter — none recorded.']),
      ] };
    case 'governance':
      return { heading: 'Explain Governance', lines: [
        ...(node.governanceHistory.length ? node.governanceHistory : ['No governance decisions recorded against this object.']),
        ...(node.promotionHistory.length ? node.promotionHistory : []),
        'Advisory only — observation, research and simulation only. Human approval required.',
      ] };
    case 'timeline':
      return { heading: 'Explain Timeline', lines: answer.timeline.slice(0, 12).map((t) => `${t.date} · ${t.stage} · ${t.id} — ${t.title}`) };
    case 'new':
    default:
      return { heading: "Explain Like I'm New", lines: [
        'The institution works in stages: a question becomes a hypothesis, the hypothesis becomes an experiment, the experiment is validated, and validated work becomes a discovery or a specialist.',
        `${node.title} sits at the "${meta.label}" stage. It came from ${outgoing(node.id).length} earlier object(s) and feeds ${incoming(node.id).length} later one(s).`,
        'Nothing here trades. Every conclusion is advisory and needs a human to approve it.',
      ] };
  }
}

// ─── Exports ─────────────────────────────────────────────────────────

export function oracleExportPayload(kind: OracleExport, answer: OracleAnswer): { heading: string; lines: string[] }[] {
  const base = [{ heading: 'Question', lines: [answer.resolvedQuestion, `Interpretation: ${answer.interpretation}`] }];
  switch (kind) {
    case 'Executive Summary':
      return [...base, { heading: 'Executive Summary', lines: answer.summary }];
    case 'Evidence Tree':
      return [...base, ...answer.evidence.map((g) => ({ heading: g.label, lines: g.ids.map((id) => `${id} · ${NODE_BY_ID[id]?.title}`) }))];
    case 'Timeline':
      return [...base, { heading: 'Timeline', lines: answer.timeline.map((t) => `${t.date} · ${t.stage} · ${t.id} — ${t.title}`) }];
    case 'Knowledge Graph':
      return [...base, ...answer.relationships.map((r) => ({ heading: r.label, lines: r.items.map((i) => `${i.id} · ${NODE_BY_ID[i.id]?.title} (${i.confidence}%) — ${i.note}`) }))];
    case 'Relationship Report':
      return [...base, ...answer.relationships.map((r) => ({ heading: r.label, lines: r.items.map((i) => `${i.id} — ${i.note}`) }))];
    case 'Audit Pack':
      return [
        ...base,
        { heading: 'Audit', lines: [`Audit ID: ${answer.auditId}`, `Generated: ${answer.generated}`, `Institution: ${INSTITUTION_VERSION}`, `Knowledge Graph: ${KNOWLEDGE_GRAPH_VERSION}`] },
        { heading: 'Confidence', lines: [`Overall ${answer.confidence.overall}%`, `Evidence strength ${answer.confidence.evidenceStrength}/100`, ...answer.confidence.counterEvidence] },
        { heading: 'Governance', lines: ORACLE_BADGES.concat(ORACLE_GUARANTEES) },
      ];
    case 'Institutional Summary':
      return [
        ...base,
        { heading: 'Executive Summary', lines: answer.summary },
        { heading: 'Department Contributions', lines: answer.departments.map((d) => `${d.name} — ${d.percent}%`) },
        { heading: 'Knowledge Reuse', lines: answer.reuse.flatMap((r) => [`${r.label}:`, ...r.items]) },
      ];
    case 'Oracle Report':
    default:
      return [
        ...base,
        { heading: 'Executive Summary', lines: answer.summary },
        { heading: 'Reasoning Chain', lines: answer.chain.map((c) => `${c.stage}: ${c.title}`) },
        ...answer.evidence.map((g) => ({ heading: `Evidence · ${g.label}`, lines: g.ids.map((id) => `${id} · ${NODE_BY_ID[id]?.title}`) })),
        { heading: 'Confidence Analysis', lines: [
          `Overall confidence ${answer.confidence.overall}%`,
          `Evidence strength ${answer.confidence.evidenceStrength}/100`,
          ...(answer.confidence.counterEvidence.length ? answer.confidence.counterEvidence.map((c) => `Counter — ${c}`) : ['No counter evidence recorded.']),
          ...answer.confidence.missingValidation.map((m) => `Missing validation — ${m}`),
        ] },
        { heading: 'Timeline', lines: answer.timeline.map((t) => `${t.date} · ${t.id} — ${t.title}`) },
        { heading: 'Governance', lines: ORACLE_BADGES.concat(ORACLE_GUARANTEES) },
      ];
  }
}

export { dateOfDay };
