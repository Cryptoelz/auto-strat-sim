/**
 * Institutional Memory™ — ATLAS OS v2.0 "The Living Institution".
 *
 * A permanent, append-only memory ledger. Everything the institution learns,
 * decides, asks or answers is retained with its citations so that any decision
 * remains explainable years later.
 *
 * Governance: research / observation / simulation only. Memory is a record —
 * it never executes, modifies a strategy or approves anything.
 */
import { KNOWLEDGE_NODES, NODE_BY_ID, connections, type KnowledgeNode } from './knowledgeGraph';
import { institutionHistory } from './institutionOS';

const STORE_KEY = 'atlas-institutional-memory-v1';

export type MemoryKind =
  | 'research'
  | 'experiment'
  | 'hypothesis-failed'
  | 'governance'
  | 'promotion'
  | 'specialist'
  | 'confidence'
  | 'question'
  | 'milestone';

export interface MemoryCitation {
  id: string;
  label: string;
  note: string;
}

export interface MemoryRecord {
  id: string;
  timestamp: number;
  /** Simulation day when the memory originates from institutional history. */
  day?: number;
  date: string;
  kind: MemoryKind;
  title: string;
  body: string;
  department: string;
  /** Why the institution retained this memory. */
  reasoning: string;
  citations: MemoryCitation[];
  /** Recorded = written this session; retained = permanent institutional record. */
  origin: 'seeded' | 'recorded';
  confidence?: number;
}

export const MEMORY_KIND_META: Record<MemoryKind, { label: string; tone: string }> = {
  research: { label: 'Completed research', tone: 'text-sky-400' },
  experiment: { label: 'Successful experiment', tone: 'text-emerald-400' },
  'hypothesis-failed': { label: 'Failed hypothesis', tone: 'text-rose-400' },
  governance: { label: 'Governance decision', tone: 'text-amber-400' },
  promotion: { label: 'Promotion history', tone: 'text-trading-gold' },
  specialist: { label: 'Specialist performance', tone: 'text-violet-400' },
  confidence: { label: 'Confidence evolution', tone: 'text-cyan-400' },
  question: { label: 'Executive question', tone: 'text-foreground' },
  milestone: { label: 'Institutional milestone', tone: 'text-muted-foreground' },
};

// ── Seeded memory (derived deterministically from institutional evidence) ──

function citationsFor(node: KnowledgeNode): MemoryCitation[] {
  const linked = connections(node.id)
    .map((e) => NODE_BY_ID[e.from === node.id ? e.to : e.from])
    .filter(Boolean)
    .slice(0, 3)
    .map((n) => ({ id: n.id, label: n.title, note: `${n.type} · confidence ${n.confidence}` }));
  return [{ id: node.id, label: node.title, note: `${node.type} · evidence ${node.evidenceScore}` }, ...linked];
}

function kindForNode(node: KnowledgeNode): MemoryKind {
  if (node.status === 'rejected') return 'hypothesis-failed';
  switch (node.type) {
    case 'experiment': return 'experiment';
    case 'governance': return 'governance';
    case 'promotion': return 'promotion';
    case 'specialist': return 'specialist';
    case 'hypothesis': return 'research';
    default: return node.status === 'validated' ? 'research' : 'milestone';
  }
}

function reasoningFor(node: KnowledgeNode): string {
  if (node.status === 'rejected') {
    return `Retained as a failure record so the hypothesis is never re-run unknowingly. ${node.counterEvidence[0] ?? 'Counter-evidence is on permanent file.'}`;
  }
  if (node.status === 'validated') {
    return `Retained as validated institutional knowledge; ${node.supportingEvidence.length} supporting evidence links and ${connections(node.id).length} relationships keep the conclusion reconstructable.`;
  }
  return `Retained as open research so later reviewers can see what was known at the time (confidence ${node.confidence}, evidence ${node.evidenceScore}).`;
}

let seededCache: MemoryRecord[] | null = null;

export function seededMemory(): MemoryRecord[] {
  if (seededCache) return seededCache;

  const fromNodes: MemoryRecord[] = KNOWLEDGE_NODES.map((n) => ({
    id: `MEM-${n.id}`,
    timestamp: new Date(n.created).getTime(),
    date: n.created,
    kind: kindForNode(n),
    title: n.title,
    body: n.summary,
    department: n.department,
    reasoning: reasoningFor(n),
    citations: citationsFor(n),
    origin: 'seeded' as const,
    confidence: n.confidence,
  }));

  const confidence: MemoryRecord[] = KNOWLEDGE_NODES
    .filter((n) => n.promotionHistory.length > 0)
    .map((n) => ({
      id: `MEM-CONF-${n.id}`,
      timestamp: new Date(n.created).getTime() + 36e5,
      date: n.created,
      kind: 'confidence' as MemoryKind,
      title: `Confidence evolution — ${n.title}`,
      body: n.promotionHistory.join(' → '),
      department: n.department,
      reasoning: `Confidence moved to ${n.confidence} as evidence quality reached ${n.evidenceScore}. Each step is retained so the trajectory is explainable.`,
      citations: citationsFor(n),
      origin: 'seeded' as const,
      confidence: n.confidence,
    }));

  const fromHistory: MemoryRecord[] = institutionHistory().map((h, i) => ({
    id: `MEM-HIST-${h.day}-${i}`,
    timestamp: new Date(h.date).getTime(),
    day: h.day,
    date: h.date,
    kind: 'milestone' as MemoryKind,
    title: h.title,
    body: h.detail,
    department: h.department ?? 'Institution',
    reasoning: 'Retained as institutional history: the milestone changed how the institution operates and remains part of every later explanation.',
    citations: h.objectId && NODE_BY_ID[h.objectId] ? citationsFor(NODE_BY_ID[h.objectId]) : [],
    origin: 'seeded' as const,
  }));

  seededCache = [...fromNodes, ...confidence, ...fromHistory].sort((a, b) => b.timestamp - a.timestamp);
  return seededCache;
}

// ── Recorded memory (permanent, persisted locally) ──

export function recordedMemory(): MemoryRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MemoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordMemory(entry: Omit<MemoryRecord, 'id' | 'timestamp' | 'date' | 'origin'>): MemoryRecord {
  const now = Date.now();
  const record: MemoryRecord = {
    ...entry,
    id: `MEM-REC-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: now,
    date: new Date(now).toISOString().slice(0, 10),
    origin: 'recorded',
  };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([record, ...recordedMemory()].slice(0, 500)));
  } catch {
    /* memory is best-effort in restricted storage environments */
  }
  return record;
}

export function forgetRecordedMemory(id: string): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(recordedMemory().filter((m) => m.id !== id)));
  } catch { /* ignore */ }
}

export function allMemory(): MemoryRecord[] {
  return [...recordedMemory(), ...seededMemory()].sort((a, b) => b.timestamp - a.timestamp);
}

export function searchMemory(query: string, kind?: MemoryKind | 'all'): MemoryRecord[] {
  const q = query.trim().toLowerCase();
  return allMemory().filter((m) => {
    if (kind && kind !== 'all' && m.kind !== kind) return false;
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.body.toLowerCase().includes(q) ||
      m.department.toLowerCase().includes(q) ||
      m.citations.some((c) => c.id.toLowerCase().includes(q) || c.label.toLowerCase().includes(q))
    );
  });
}

export interface MemoryStats {
  total: number;
  recorded: number;
  citations: number;
  citationRate: number;
  oldest: string;
  byKind: { kind: MemoryKind; label: string; count: number }[];
  departments: number;
}

export function memoryStats(): MemoryStats {
  const all = allMemory();
  const cited = all.filter((m) => m.citations.length > 0).length;
  const byKind = (Object.keys(MEMORY_KIND_META) as MemoryKind[])
    .map((kind) => ({ kind, label: MEMORY_KIND_META[kind].label, count: all.filter((m) => m.kind === kind).length }))
    .filter((k) => k.count > 0)
    .sort((a, b) => b.count - a.count);
  return {
    total: all.length,
    recorded: all.filter((m) => m.origin === 'recorded').length,
    citations: all.reduce((s, m) => s + m.citations.length, 0),
    citationRate: all.length ? Math.round((cited / all.length) * 100) : 0,
    oldest: all.length ? all[all.length - 1].date : '—',
    byKind,
    departments: new Set(all.map((m) => m.department)).size,
  };
}
