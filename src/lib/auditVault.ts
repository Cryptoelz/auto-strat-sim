/**
 * Audit Vault™ — ATLAS OS™ permanent institutional archive.
 *
 * Presentation-layer aggregator only. Every record below is composed from
 * existing engines (Institutional Memory, Knowledge Graph, Executive Decisions,
 * Trade Review, Certification, Institution History). No new business logic,
 * no execution, no strategy modification.
 */
import { allMemory, memoryStats, type MemoryRecord } from './institutionalMemory';
import { KNOWLEDGE_NODES, NODE_BY_ID, connections } from './knowledgeGraph';
import { institutionHistory } from './institutionOS';
import { decisionQueue, centreSummary, historyStats, readLedger, QUEUE_STATUS_LABEL } from './decisionCentre';
import { tradeLibrary, reviewHeader } from './tradeReview';
import { CERT_SUMMARY, OVERALL_VERDICT, CERTIFICATION_PCT } from './allocationCertification';

export const VAULT_VERSION = 'Audit Vault™ v1.0';

export const VAULT_GOVERNANCE = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Human Approval Required',
  'No Live Trading', 'No Exchange Connectivity', 'No Automatic Decisions',
];

export type VaultKind =
  | 'research' | 'evidence' | 'knowledge' | 'recommendation' | 'oracle'
  | 'decision' | 'trade' | 'maintenance' | 'validation' | 'readiness'
  | 'certification' | 'memory';

export const VAULT_KIND_META: Record<VaultKind, { label: string; tone: string }> = {
  research: { label: 'Research created', tone: 'text-sky-400' },
  evidence: { label: 'Evidence attached', tone: 'text-cyan-400' },
  knowledge: { label: 'Knowledge updated', tone: 'text-violet-400' },
  recommendation: { label: 'Recommendation issued', tone: 'text-amber-400' },
  oracle: { label: 'Oracle explanation', tone: 'text-primary' },
  decision: { label: 'Executive decision', tone: 'text-trading-gold' },
  trade: { label: 'Trade reviewed', tone: 'text-emerald-400' },
  maintenance: { label: 'Maintenance cycle', tone: 'text-muted-foreground' },
  validation: { label: 'Forward validation', tone: 'text-teal-400' },
  readiness: { label: 'Production readiness', tone: 'text-rose-400' },
  certification: { label: 'Certification', tone: 'text-trading-gold' },
  memory: { label: 'Memory archived', tone: 'text-foreground' },
};

export interface VaultLink { label: string; route: string }

export interface VaultRecord {
  id: string;
  kind: VaultKind;
  timestamp: number;
  date: string;
  title: string;
  summary: string;
  department: string;
  phase: string;
  status: string;
  confidence?: number;
  reviewer?: string;
  evidence: VaultLink[];
  knowledgeObjects: string[];
  memoryRecords: string[];
  oracle: string;
  relatedDecisions: string[];
  chart?: { label: string; series: number[] };
  notes: string;
  outcome: string;
}

function phaseFor(date: string): string {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 'Institutional Validation™';
  const y = new Date(date);
  if (y < new Date('2026-04-01')) return 'Phase 1 · Research OS';
  if (y < new Date('2026-06-15')) return 'Phase 2 · Living Institution™';
  return 'Phase 3 · Institutional Validation™';
}

const ts = (d: string) => {
  const t = new Date(d).getTime();
  return Number.isNaN(t) ? Date.now() : t;
};

/* ── Record assembly ─────────────────────────────────────── */

function fromKnowledge(): VaultRecord[] {
  return KNOWLEDGE_NODES.map((n) => {
    const linked = connections(n.id)
      .map((e) => (e.from === n.id ? e.to : e.from))
      .filter((id) => NODE_BY_ID[id]);
    const kind: VaultKind =
      n.type === 'hypothesis' || n.type === 'experiment' ? 'research'
        : n.type === 'governance' ? 'recommendation'
          : n.type === 'memory' ? 'memory'
            : 'knowledge';
    return {
      id: `AV-${n.id}`,
      kind,
      timestamp: ts(n.created),
      date: n.created,
      title: n.title,
      summary: n.summary,
      department: n.department,
      phase: phaseFor(n.created),
      status: n.status,
      confidence: n.confidence,
      reviewer: n.department,
      evidence: [{ label: `Explorer · ${n.id}`, route: `/explorer/${n.id}` }],
      knowledgeObjects: [n.id, ...linked.slice(0, 4)],
      memoryRecords: [`MEM-${n.id}`],
      oracle: `Retained with evidence score ${n.evidenceScore} and ${linked.length} relationships; the conclusion can be reconstructed from its cited objects.`,
      relatedDecisions: [],
      chart: { label: 'Confidence path', series: [Math.max(20, n.confidence - 24), Math.max(30, n.confidence - 12), n.confidence] },
      notes: n.counterEvidence[0] ?? n.supportingEvidence[0] ?? 'No executive note attached.',
      outcome: n.status === 'validated' ? 'Validated and retained' : n.status === 'rejected' ? 'Rejected — retained as failure record' : 'Open research',
    };
  });
}

function fromDecisions(): VaultRecord[] {
  return decisionQueue().map((d) => ({
    id: `AV-${d.id}`,
    kind: 'decision' as VaultKind,
    timestamp: ts(d.raisedOn),
    date: d.raisedOn,
    title: d.title,
    summary: d.summary,
    department: d.department,
    phase: phaseFor(d.raisedOn),
    status: QUEUE_STATUS_LABEL[d.status],
    confidence: d.confidence,
    reviewer: d.reviewer,
    evidence: [
      ...d.evidenceTimeline.map((e) => ({ label: `${e.date} · ${e.label}`, route: e.route })),
      ...d.supportingResearch,
    ],
    knowledgeObjects: d.graphLinks.map((g) => g.label),
    memoryRecords: d.memory.map((m) => m.label),
    oracle: d.oracle,
    relatedDecisions: [d.id],
    chart: { label: 'Confidence trend', series: d.confidenceTrend },
    notes: d.lesson,
    outcome: d.recommendation,
  }));
}

function fromTrades(): VaultRecord[] {
  return tradeLibrary().slice(0, 80).map((t) => ({
    id: `AV-${t.id}`,
    kind: 'trade' as VaultKind,
    timestamp: ts(t.date),
    date: t.date,
    title: `${t.asset} ${t.decision} · ${t.specialist}`,
    summary: `${t.portfolioVerdict}. Outcome ${t.outcome}, return ${t.actualReturn}% against expected ${t.expectedReturn}%.`,
    department: 'Trade Review',
    phase: phaseFor(t.date),
    status: t.outcome,
    confidence: t.confidence,
    reviewer: 'Portfolio Director',
    evidence: [...t.evidence, { label: 'Trade Review Centre™', route: '/trade-review' }],
    knowledgeObjects: t.knowledgeObjects,
    memoryRecords: [t.memoryRecord],
    oracle: t.oracleExplanation,
    relatedDecisions: [],
    chart: { label: 'Expected vs actual', series: [t.expectedReturn, t.actualReturn, t.drawdown] },
    notes: t.lessons[0] ?? 'No lesson recorded.',
    outcome: t.promotionEffect,
  }));
}

function fromHistory(): VaultRecord[] {
  return institutionHistory().map((h, i) => {
    const kind: VaultKind =
      h.kind === 'decision' ? 'decision'
        : h.kind === 'memory' ? 'memory'
          : h.kind === 'version' ? 'certification'
            : 'knowledge';
    return {
      id: `AV-HIST-${h.day}-${i}`,
      kind,
      timestamp: ts(h.date),
      date: h.date,
      title: h.title,
      summary: h.detail,
      department: h.department ?? 'Institution',
      phase: phaseFor(h.date),
      status: h.kind,
      evidence: h.objectId ? [{ label: `Explorer · ${h.objectId}`, route: `/explorer/${h.objectId}` }] : [{ label: 'Institution History™', route: '/institution/history' }],
      knowledgeObjects: h.objectId ? [h.objectId] : [],
      memoryRecords: [],
      oracle: 'Institutional milestone retained so later reviewers can see what changed and when.',
      relatedDecisions: [],
      notes: `Validation day ${h.day}.`,
      outcome: 'Archived to institutional history',
    };
  });
}

function fromMemory(): VaultRecord[] {
  return allMemory().slice(0, 120).map((m: MemoryRecord) => ({
    id: `AV-${m.id}`,
    kind: 'memory' as VaultKind,
    timestamp: m.timestamp,
    date: m.date,
    title: m.title,
    summary: m.body,
    department: m.department,
    phase: phaseFor(m.date),
    status: m.origin === 'recorded' ? 'recorded' : 'retained',
    confidence: m.confidence,
    evidence: m.citations.map((c) => ({ label: `${c.id} · ${c.label}`, route: `/institution/explain/${c.id}` })),
    knowledgeObjects: m.citations.map((c) => c.id),
    memoryRecords: [m.id],
    oracle: m.reasoning,
    relatedDecisions: [],
    notes: m.reasoning,
    outcome: 'Permanently retained in Institutional Memory™',
  }));
}

function operational(): VaultRecord[] {
  const cs = centreSummary();
  const today = new Date().toISOString().slice(0, 10);
  const rh = reviewHeader(tradeLibrary());
  return [
    {
      id: 'AV-CERT-001', kind: 'certification', timestamp: ts(today), date: today,
      title: `Institutional certification — ${OVERALL_VERDICT}`,
      summary: `${CERT_SUMMARY.pass} checks passed, ${CERT_SUMMARY.warning} warnings, ${CERT_SUMMARY.fail} failures across ${CERT_SUMMARY.total} institutional checks.`,
      department: 'Certification', phase: phaseFor(today), status: OVERALL_VERDICT,
      confidence: CERTIFICATION_PCT, reviewer: 'Certification Board',
      evidence: [{ label: 'Certification Centre', route: '/certification' }],
      knowledgeObjects: [], memoryRecords: [],
      oracle: 'Certification is advisory: it evidences institutional completeness, it does not authorise production.',
      relatedDecisions: [], notes: 'Human approval remains mandatory.',
      outcome: `${CERTIFICATION_PCT}% certified`,
    },
    {
      id: 'AV-READY-001', kind: 'readiness', timestamp: ts(today) - 864e5, date: today,
      title: 'Production readiness gate review',
      summary: `${cs.readyForProduction} candidate(s) ready for review, ${cs.needsEvidence} awaiting further evidence. Governance health ${cs.governanceHealth}.`,
      department: 'Production Readiness', phase: phaseFor(today), status: 'advisory',
      confidence: cs.decisionConfidence, reviewer: 'Executive Board',
      evidence: [{ label: 'Production Readiness Centre™', route: '/production-readiness' }],
      knowledgeObjects: [], memoryRecords: [],
      oracle: 'Two governance gates remain human-only; readiness cannot be satisfied by evidence alone.',
      relatedDecisions: [], notes: 'No live capital authorised.',
      outcome: 'Not authorised for live capital',
    },
    {
      id: 'AV-FWD-001', kind: 'validation', timestamp: ts(today) - 2 * 864e5, date: today,
      title: 'Forward validation checkpoint',
      summary: `Traceability ${rh.traceability}% across ${rh.totalReviewed} reviewed trades; ${rh.explainablePct}% fully explainable.`,
      department: 'Forward Validation', phase: phaseFor(today), status: 'running',
      confidence: rh.avgConfidence, reviewer: 'Portfolio Director',
      evidence: [{ label: 'Forward Validation', route: '/forward-validation' }],
      knowledgeObjects: [], memoryRecords: [],
      oracle: 'Forward evidence continues to accumulate; the promotion clock is unchanged.',
      relatedDecisions: [], notes: 'Simulation only.',
      outcome: 'Validation continuing',
    },
    {
      id: 'AV-MAINT-001', kind: 'maintenance', timestamp: ts(today) - 3 * 864e5, date: today,
      title: 'Autonomous maintenance cycle completed',
      summary: 'Module health, workflow integrity, governance audit and knowledge validation completed with no critical findings.',
      department: 'Maintenance', phase: phaseFor(today), status: 'healthy',
      reviewer: 'ATLAS AI Maintenance™',
      evidence: [{ label: 'ATLAS AI Maintenance™', route: '/maintenance' }],
      knowledgeObjects: [], memoryRecords: [],
      oracle: 'Maintenance findings are advisory; no repairs alter research conclusions.',
      relatedDecisions: [], notes: 'Auto-repair operates on presentation state only.',
      outcome: 'No critical findings',
    },
  ];
}

let cache: VaultRecord[] | null = null;

export function vaultRecords(): VaultRecord[] {
  if (cache) return cache;
  cache = [...fromKnowledge(), ...fromDecisions(), ...fromTrades(), ...fromHistory(), ...fromMemory(), ...operational()]
    .sort((a, b) => b.timestamp - a.timestamp);
  return cache;
}

/* ── Executive summary ───────────────────────────────────── */

export interface VaultSummary {
  auditHealth: number;
  archived: number;
  citationCoverage: number;
  evidenceCompleteness: number;
  decisions: number;
  memoryRecords: number;
  certification: string;
  auditConfidence: number;
}

export function vaultSummary(records = vaultRecords()): VaultSummary {
  const ms = memoryStats();
  const cited = records.filter((r) => r.evidence.length > 0).length;
  const complete = records.filter((r) => r.evidence.length > 0 && r.oracle && r.outcome).length;
  const conf = records.filter((r) => typeof r.confidence === 'number');
  const citationCoverage = Math.round((cited / Math.max(1, records.length)) * 100);
  const evidenceCompleteness = Math.round((complete / Math.max(1, records.length)) * 100);
  return {
    auditHealth: Math.round((citationCoverage + evidenceCompleteness + CERTIFICATION_PCT) / 3),
    archived: records.length,
    citationCoverage,
    evidenceCompleteness,
    decisions: records.filter((r) => r.kind === 'decision').length,
    memoryRecords: ms.total,
    certification: OVERALL_VERDICT,
    auditConfidence: Math.round(conf.reduce((s, r) => s + (r.confidence ?? 0), 0) / Math.max(1, conf.length)),
  };
}

/* ── Chain of evidence ───────────────────────────────────── */

export interface ChainLink { stage: string; label: string; detail: string; route: string }

export function chainOfEvidence(record: VaultRecord): ChainLink[] {
  const kg = record.knowledgeObjects[0];
  return [
    { stage: 'Research', label: record.department, detail: 'Research question opened and scoped by the owning department.', route: '/research' },
    { stage: 'Evidence', label: `${record.evidence.length} evidence links`, detail: record.evidence[0]?.label ?? 'Institutional evidence attached.', route: record.evidence[0]?.route ?? '/explorer' },
    { stage: 'Knowledge', label: kg ?? 'Knowledge Graph', detail: 'Conclusion connected into the Knowledge Graph with typed relationships.', route: kg ? `/explorer/${kg}` : '/knowledge-graph' },
    { stage: 'Recommendation', label: 'Institution recommendation', detail: record.oracle, route: '/oracle' },
    { stage: 'Decision', label: record.relatedDecisions[0] ?? 'Executive review', detail: 'Human executive judgement recorded — advisory only.', route: '/decision-centre' },
    { stage: 'Memory', label: record.memoryRecords[0] ?? 'Institutional Memory™', detail: 'Outcome retained permanently with its citations.', route: '/institution/memory' },
    { stage: 'Certification', label: OVERALL_VERDICT, detail: `Included in the institutional certification pack at ${CERTIFICATION_PCT}%.`, route: '/certification' },
  ];
}

/* ── Search ──────────────────────────────────────────────── */

export interface VaultFilters {
  query: string;
  kind: VaultKind | 'all';
  department: string;
  status: string;
  minConfidence: number;
}

export const DEFAULT_FILTERS: VaultFilters = { query: '', kind: 'all', department: 'all', status: 'all', minConfidence: 0 };

export function searchVault(records: VaultRecord[], f: VaultFilters): VaultRecord[] {
  const q = f.query.trim().toLowerCase();
  return records.filter((r) => {
    if (f.kind !== 'all' && r.kind !== f.kind) return false;
    if (f.department !== 'all' && r.department !== f.department) return false;
    if (f.status !== 'all' && r.status !== f.status) return false;
    if (f.minConfidence > 0 && (r.confidence ?? 0) < f.minConfidence) return false;
    if (!q) return true;
    return [r.id, r.title, r.summary, r.department, r.date, r.status, r.reviewer ?? '',
      ...r.knowledgeObjects, ...r.memoryRecords, ...r.relatedDecisions,
      ...r.evidence.map((e) => e.label)].join(' ').toLowerCase().includes(q);
  });
}

export function vaultDepartments(records = vaultRecords()): string[] {
  return Array.from(new Set(records.map((r) => r.department))).sort();
}

export function vaultStatuses(records = vaultRecords()): string[] {
  return Array.from(new Set(records.map((r) => r.status))).sort();
}

/* ── Audit insights ──────────────────────────────────────── */

export interface VaultInsights {
  mostActiveDepartment: { name: string; count: number };
  mostCitedEvidence: { id: string; count: number };
  avgConfidence: number;
  decisionTurnaround: number;
  lessonsArchived: number;
  evidenceGrowth: { month: string; records: number; evidence: number }[];
}

export function vaultInsights(records = vaultRecords()): VaultInsights {
  const deptCount = new Map<string, number>();
  const objCount = new Map<string, number>();
  records.forEach((r) => {
    deptCount.set(r.department, (deptCount.get(r.department) ?? 0) + 1);
    r.knowledgeObjects.forEach((o) => objCount.set(o, (objCount.get(o) ?? 0) + 1));
  });
  const topDept = [...deptCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['Institution', 0];
  const topObj = [...objCount.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
  const conf = records.filter((r) => typeof r.confidence === 'number');

  const byMonth = new Map<string, { records: number; evidence: number }>();
  records.forEach((r) => {
    const m = r.date.slice(0, 7);
    const cur = byMonth.get(m) ?? { records: 0, evidence: 0 };
    cur.records += 1;
    cur.evidence += r.evidence.length;
    byMonth.set(m, cur);
  });
  let cumR = 0; let cumE = 0;
  const evidenceGrowth = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => { cumR += v.records; cumE += v.evidence; return { month, records: cumR, evidence: cumE }; });

  return {
    mostActiveDepartment: { name: topDept[0], count: topDept[1] },
    mostCitedEvidence: { id: topObj[0], count: topObj[1] },
    avgConfidence: Math.round(conf.reduce((s, r) => s + (r.confidence ?? 0), 0) / Math.max(1, conf.length)),
    decisionTurnaround: centreSummary().avgDecisionHours,
    lessonsArchived: records.filter((r) => r.notes && r.notes !== 'No executive note attached.').length,
    evidenceGrowth,
  };
}

/* ── Exports (plain text ledgers, advisory only) ─────────── */

export type VaultExport =
  | 'Executive Audit Report' | 'Certification Appendix' | 'Institution History'
  | 'Decision Ledger' | 'Evidence Ledger' | 'Memory Ledger';

export const VAULT_EXPORTS: VaultExport[] = [
  'Executive Audit Report', 'Certification Appendix', 'Institution History',
  'Decision Ledger', 'Evidence Ledger', 'Memory Ledger',
];

export function buildExport(kind: VaultExport, records = vaultRecords()): string {
  const head = [`ATLAS OS™ · ${VAULT_VERSION}`, kind, `Generated ${new Date().toISOString()}`,
    VAULT_GOVERNANCE.join(' · '), ''.padEnd(70, '─'), ''];
  const s = vaultSummary(records);

  switch (kind) {
    case 'Executive Audit Report':
      return [...head,
        `Audit health: ${s.auditHealth}`, `Records archived: ${s.archived}`,
        `Citation coverage: ${s.citationCoverage}%`, `Evidence completeness: ${s.evidenceCompleteness}%`,
        `Executive decisions: ${s.decisions}`, `Memory records: ${s.memoryRecords}`,
        `Certification: ${s.certification}`, `Audit confidence: ${s.auditConfidence}`, '',
        'Most recent 40 records:', ''.padEnd(70, '─'),
        ...records.slice(0, 40).map((r) => `${r.date} · ${r.id} · ${VAULT_KIND_META[r.kind].label} · ${r.title} · ${r.department} · ${r.outcome}`),
      ].join('\n');
    case 'Certification Appendix':
      return [...head,
        `Verdict: ${OVERALL_VERDICT} (${CERTIFICATION_PCT}%)`,
        `Checks: ${CERT_SUMMARY.pass} pass · ${CERT_SUMMARY.warning} warning · ${CERT_SUMMARY.fail} fail · ${CERT_SUMMARY.notTested} not tested`, '',
        ...records.filter((r) => r.kind === 'certification' || r.kind === 'readiness')
          .map((r) => `${r.date} · ${r.id} · ${r.title} · ${r.outcome}`),
      ].join('\n');
    case 'Institution History':
      return [...head, ...institutionHistory().map((h) => `Day ${h.day} · ${h.date} · ${h.kind} · ${h.title} — ${h.detail}`)].join('\n');
    case 'Decision Ledger': {
      const hs = historyStats();
      return [...head,
        `Decisions: ${hs.total} · approval ${hs.approvalRate}% · decline ${hs.declineRate}% · avg confidence ${hs.avgConfidence} · avg evidence ${hs.avgEvidence}`, '',
        ...decisionQueue().map((d) => `${d.raisedOn} · ${d.id} · ${d.title} · ${d.department} · ${QUEUE_STATUS_LABEL[d.status]} · confidence ${d.confidence} · reviewer ${d.reviewer}`),
        '', 'Advisory executive actions recorded on this device:',
        ...(readLedger().length ? readLedger().map((r) => `${r.at} · ${r.decisionId} · ${r.action} · ${r.reviewer} · ${r.reason}`) : ['(none)']),
      ].join('\n');
    }
    case 'Evidence Ledger':
      return [...head, ...records.flatMap((r) => r.evidence.map((e) => `${r.date} · ${r.id} · ${e.label} · ${e.route}`))].join('\n');
    case 'Memory Ledger':
      return [...head, ...allMemory().map((m) => `${m.date} · ${m.id} · ${m.kind} · ${m.title} · ${m.department} · ${m.citations.length} citations`)].join('\n');
    default:
      return head.join('\n');
  }
}

export function downloadExport(kind: VaultExport, records = vaultRecords()): void {
  const blob = new Blob([buildExport(kind, records)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atlas-audit-vault-${kind.toLowerCase().replace(/\s+/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
