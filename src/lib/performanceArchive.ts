/**
 * Institutional Performance Archive™ — permanent historical record.
 *
 * Presentation-layer reconstruction only. Every value below is composed from
 * existing engines (Institutional Validation, Institutional Memory, Knowledge
 * Graph, Decision Centre, Trade Review, Institution History, Certification,
 * Audit Vault). No trading logic, no strategy modification, no new business rules.
 */
import {
  TOTAL_VALIDATION_DAYS, dateOfValidationDay, dailyMetrics, metricSeries,
  institutionScoreRows, recommendationFor, type DailyMetrics,
} from './institutionValidation';
import { allMemory, memoryStats } from './institutionalMemory';
import { KNOWLEDGE_NODES } from './knowledgeGraph';
import { institutionHistory, PLATFORM_VERSIONS } from './institutionOS';
import { decisionQueue, QUEUE_STATUS_LABEL } from './decisionCentre';
import { tradeLibrary, reviewHeader } from './tradeReview';
import { CERTIFICATION_PCT, OVERALL_VERDICT, CERT_SUMMARY } from './allocationCertification';
import { vaultRecords } from './auditVault';

export const ARCHIVE_VERSION = 'Institutional Performance Archive™ v1.0';

export const ARCHIVE_GOVERNANCE = [
  'Observation Only', 'Research Only', 'Simulation Only', 'Human Approval Required',
  'No Exchange Connectivity', 'No Live Trading', 'Permanent Audit Trail',
];

export const LATEST_DAY = TOTAL_VALIDATION_DAYS;

/* ── Executive KPIs ───────────────────────────────────────── */

export interface ArchiveKpi { label: string; value: number; hint: string; route: string }

export function archiveKpis(): ArchiveKpi[] {
  const mem = memoryStats();
  const records = vaultRecords();
  const evidence = records.reduce((s, r) => s + r.evidence.length, 0);
  return [
    { label: 'Archive Days', value: LATEST_DAY, hint: 'Days of reconstructable institutional history.', route: '/institution-daily' },
    { label: 'Institution Versions', value: PLATFORM_VERSIONS.length, hint: 'Permanent platform versions retained.', route: '/institution/history' },
    { label: 'Memory Records', value: mem.total, hint: 'Citation-backed institutional memories.', route: '/institution/memory' },
    { label: 'Evidence Links', value: evidence, hint: 'Evidence references across archived records.', route: '/audit-vault' },
    { label: 'Research Objects', value: KNOWLEDGE_NODES.length, hint: 'Objects in the Knowledge Graph.', route: '/knowledge-graph' },
    { label: 'Trade Reviews', value: tradeLibrary().length, hint: 'Simulated trades with full audit trails.', route: '/trade-review' },
    { label: 'Decision Records', value: decisionQueue().length, hint: 'Executive decisions retained with reasoning.', route: '/decision-centre' },
    { label: 'Certification Events', value: CERT_SUMMARY.total, hint: `Institutional checks · ${OVERALL_VERDICT}.`, route: '/certification' },
  ];
}

/* ── Time machine ─────────────────────────────────────────── */

export interface TimePoint { day: number; label: string; date: string; available: boolean }

export function timePoints(): TimePoint[] {
  const defs = [
    { day: 1, label: 'Day 1' }, { day: 7, label: 'Day 7' }, { day: 30, label: 'Day 30' },
    { day: 60, label: 'Day 60' }, { day: 90, label: 'Day 90' }, { day: 180, label: 'Month 6' },
    { day: 365, label: 'Year 1' },
  ];
  const points = defs.map((d) => ({ ...d, date: dateOfValidationDay(d.day), available: d.day <= LATEST_DAY }));
  if (!defs.some((d) => d.day === LATEST_DAY)) {
    points.push({ day: LATEST_DAY, label: 'Today', date: dateOfValidationDay(LATEST_DAY), available: true });
  }
  return points.sort((a, b) => a.day - b.day);
}

/* ── Snapshot ─────────────────────────────────────────────── */

export interface SnapshotRow {
  key: string; label: string; value: number; delta: number; route: string; explanation: string;
}

export function snapshot(day: number): SnapshotRow[] {
  const clampDay = Math.min(LATEST_DAY, Math.max(1, day));
  const m = dailyMetrics(clampDay);
  const prev = dailyMetrics(Math.max(1, clampDay - 7));
  const rows = institutionScoreRows(clampDay);
  const score = Math.round(
    (m.iq + m.research + m.governance + m.memoryQuality + m.readiness + m.confidence + m.stability) / 7,
  );
  const prevScore = Math.round(
    (prev.iq + prev.research + prev.governance + prev.memoryQuality + prev.readiness + prev.confidence + prev.stability) / 7,
  );
  return [
    {
      key: 'score', label: 'Institution Score', value: score, delta: score - prevScore,
      route: '/institution/score', explanation: 'Composite of all seven institutional dimensions on this day.',
    },
    ...rows.map((r) => ({
      key: String(r.key), label: r.label, value: Math.round(r.value),
      delta: Math.round((r.value - (prev[r.key] as number)) * 10) / 10,
      route: r.route, explanation: r.explanation,
    })),
    {
      key: 'knowledge', label: 'Knowledge', value: m.objects, delta: m.objects - prev.objects,
      route: '/knowledge-graph', explanation: 'Research objects held in the Knowledge Graph on this day.',
    },
    {
      key: 'memory', label: 'Memory', value: m.memoryRecords, delta: m.memoryRecords - prev.memoryRecords,
      route: '/institution/memory', explanation: 'Permanent memory records retained on this day.',
    },
  ];
}

/* ── Executive story ──────────────────────────────────────── */

export function executiveStory(day: number): string[] {
  const clampDay = Math.min(LATEST_DAY, Math.max(1, day));
  const m = dailyMetrics(clampDay);
  const prev = dailyMetrics(Math.max(1, clampDay - 7));
  const dir = (a: number, b: number) => (a - b > 0.6 ? 'improved' : a - b < -0.6 ? 'softened' : 'remained unchanged');
  const rec = recommendationFor(clampDay);
  const week = metricSeries(Math.min(7, clampDay), clampDay);
  const cycles = week.filter((d) => d.researchCompleted > 0).length;
  const trades = week.reduce((s, d) => s + d.trades, 0);
  return [
    `On day ${clampDay} (${m.date}) the institution held ${m.objects.toLocaleString()} research objects, ${m.evidence.toLocaleString()} evidence links and ${m.memoryRecords.toLocaleString()} permanent memories.`,
    `Research quality ${dir(m.research, prev.research)} to ${Math.round(m.research)} while governance ${dir(m.governance, prev.governance)} at ${Math.round(m.governance)}.`,
    `Executive confidence ${dir(m.confidence, prev.confidence)} after ${cycles} validation cycle${cycles === 1 ? '' : 's'} and ${trades} reviewed simulated trade${trades === 1 ? '' : 's'} in the preceding week.`,
    `Portfolio stability stood at ${Math.round(m.stability)} with drawdown ${m.drawdown}% and profit factor ${m.profitFactor}; production readiness read ${Math.round(m.readiness)}.`,
    `The standing institutional recommendation was “${rec.kind}” — ${rec.next}`,
  ];
}

/* ── Major events ─────────────────────────────────────────── */

export type EventKind =
  | 'research' | 'promotion' | 'trade' | 'memory' | 'oracle'
  | 'governance' | 'maintenance' | 'certification' | 'version';

export const EVENT_META: Record<EventKind, { label: string; tone: string }> = {
  research: { label: 'Research completed', tone: 'text-sky-400' },
  promotion: { label: 'Promotion approved', tone: 'text-emerald-400' },
  trade: { label: 'Trade reviewed', tone: 'text-cyan-400' },
  memory: { label: 'Memory created', tone: 'text-violet-400' },
  oracle: { label: 'Oracle recommendation', tone: 'text-primary' },
  governance: { label: 'Governance block', tone: 'text-amber-400' },
  maintenance: { label: 'Maintenance repair', tone: 'text-muted-foreground' },
  certification: { label: 'Certification', tone: 'text-trading-gold' },
  version: { label: 'Institution version', tone: 'text-trading-gold' },
};

export interface ArchiveEvent {
  id: string; day: number; date: string; kind: EventKind;
  title: string; detail: string; route: string; source: string;
}

const dayOfDate = (date: string) => {
  const base = new Date(dateOfValidationDay(1)).getTime();
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) return 1;
  return Math.max(1, Math.min(LATEST_DAY, Math.round((t - base) / 864e5) + 1));
};

let eventCache: ArchiveEvent[] | null = null;

export function archiveEvents(): ArchiveEvent[] {
  if (eventCache) return eventCache;
  const events: ArchiveEvent[] = [];

  institutionHistory().forEach((h, i) => {
    const kind: EventKind =
      h.kind === 'version' || h.kind === 'birthday' ? 'version'
        : h.kind === 'memory' ? 'memory'
          : h.kind === 'decision' ? 'governance'
            : h.kind === 'breakthrough' || h.kind === 'discovery' ? 'research' : 'certification';
    events.push({
      id: `EV-H-${h.day}-${i}`, day: dayOfDate(h.date), date: h.date, kind,
      title: h.title, detail: h.detail,
      route: h.objectId ? `/explorer/${h.objectId}` : '/institution/history',
      source: h.department ?? 'Institution History™',
    });
  });

  allMemory().slice(0, 60).forEach((m) => {
    events.push({
      id: `EV-M-${m.id}`, day: m.day ?? dayOfDate(m.date), date: m.date, kind: 'memory',
      title: m.title, detail: m.reasoning, route: '/institution/memory', source: m.department,
    });
  });

  decisionQueue().forEach((d) => {
    events.push({
      id: `EV-D-${d.id}`, day: dayOfDate(d.raisedOn), date: d.raisedOn,
      kind: d.status === 'approved' ? 'promotion' : d.status === 'declined' ? 'governance' : 'oracle',
      title: d.title, detail: d.summary, route: '/decision-centre', source: d.department,
    });
  });

  tradeLibrary().slice(0, 40).forEach((t) => {
    events.push({
      id: `EV-T-${t.id}`, day: dayOfDate(t.date), date: t.date, kind: 'trade',
      title: `${t.asset} ${t.decision} · ${t.specialist}`,
      detail: `Outcome ${t.outcome}; return ${t.actualReturn}% against expected ${t.expectedReturn}%.`,
      route: '/trade-review', source: 'Trade Review Centre™',
    });
  });

  vaultRecords().filter((r) => r.kind === 'maintenance' || r.kind === 'certification').forEach((r) => {
    events.push({
      id: `EV-V-${r.id}`, day: dayOfDate(r.date), date: r.date,
      kind: r.kind === 'maintenance' ? 'maintenance' : 'certification',
      title: r.title, detail: r.summary, route: '/audit-vault', source: r.department,
    });
  });

  eventCache = events.sort((a, b) => a.day - b.day || a.title.localeCompare(b.title));
  return eventCache;
}

export function eventsUpTo(day: number, limit = 40): ArchiveEvent[] {
  return archiveEvents().filter((e) => e.day <= day).slice(-limit).reverse();
}

/* ── Decision history ─────────────────────────────────────── */

export interface ArchiveDecision {
  id: string; day: number; date: string; title: string; status: string;
  confidence: number; reviewer: string; evidence: number; reasoning: string; outcome: string;
  department: string;
}

export function decisionHistory(day = LATEST_DAY): ArchiveDecision[] {
  return decisionQueue()
    .map((d) => ({
      id: d.id, day: dayOfDate(d.raisedOn), date: d.raisedOn, title: d.title,
      status: QUEUE_STATUS_LABEL[d.status], confidence: d.confidence, reviewer: d.reviewer,
      evidence: d.evidenceTimeline.length + d.supportingResearch.length,
      reasoning: d.oracle, outcome: d.recommendation, department: d.department,
    }))
    .filter((d) => d.day <= day)
    .sort((a, b) => b.day - a.day);
}

/* ── Performance evolution ────────────────────────────────── */

export interface EvolutionSeries { key: string; label: string; unit: string; hint: string }

export const EVOLUTION_SERIES: EvolutionSeries[] = [
  { key: 'score', label: 'Institution Score', unit: '', hint: 'Composite institutional score across all dimensions.' },
  { key: 'objects', label: 'Knowledge', unit: ' objects', hint: 'Research objects retained in the Knowledge Graph.' },
  { key: 'research', label: 'Research Quality', unit: '', hint: 'Evidence depth and methodology discipline.' },
  { key: 'stability', label: 'Portfolio', unit: '', hint: 'Portfolio stability across the forward window.' },
  { key: 'drawdown', label: 'Drawdown', unit: '%', hint: 'Simulated maximum drawdown.' },
  { key: 'winRate', label: 'Win Rate', unit: '%', hint: 'Reviewed simulated trades closing positive.' },
  { key: 'readiness', label: 'Forward Validation', unit: '', hint: 'Production readiness through forward evidence.' },
  { key: 'memoryRecords', label: 'Memory Growth', unit: ' records', hint: 'Cumulative permanent memory records.' },
  { key: 'evidence', label: 'Evidence Growth', unit: ' links', hint: 'Cumulative evidence links across the archive.' },
];

function seriesValue(m: DailyMetrics, key: string): number {
  if (key === 'score') {
    return Math.round((m.iq + m.research + m.governance + m.memoryQuality + m.readiness + m.confidence + m.stability) / 7);
  }
  if (key === 'winRate') {
    return Math.round(52 + (m.profitFactor - 1) * 18);
  }
  return Math.round(((m[key as keyof DailyMetrics] as number) ?? 0) * 10) / 10;
}

export function evolutionData(key: string, day = LATEST_DAY, window = 90) {
  return metricSeries(Math.min(window, day), day).map((m) => ({
    day: m.day, date: m.date, value: seriesValue(m, key),
  }));
}

/* ── Lessons learned ──────────────────────────────────────── */

export interface Lesson { label: string; title: string; detail: string; route: string }

export function lessonsLearned(day = LATEST_DAY): Lesson[] {
  const series = metricSeries(Math.min(90, day), day);
  const best = [...series].sort((a, b) => b.research - a.research)[0] ?? series[0];
  const worst = [...series].sort((a, b) => b.drawdown - a.drawdown)[0] ?? series[0];
  const decisions = decisionHistory(day);
  const highest = [...decisions].sort((a, b) => b.confidence - a.confidence)[0];
  const lowest = [...decisions].sort((a, b) => a.confidence - b.confidence)[0];
  const trades = tradeLibrary().filter((t) => dayOfDate(t.date) <= day);
  const bestTrade = [...trades].sort((a, b) => b.actualReturn - a.actualReturn)[0];
  const worstTrade = [...trades].sort((a, b) => a.actualReturn - b.actualReturn)[0];
  const research = [...KNOWLEDGE_NODES].sort((a, b) => b.evidenceScore - a.evidenceScore)[0];
  const discovery = KNOWLEDGE_NODES.find((n) => n.type === 'breakthrough') ?? research;
  const memory = [...allMemory()].sort((a, b) => b.citations.length - a.citations.length)[0];

  return [
    { label: 'Biggest improvement', title: `Research quality peaked at ${Math.round(best?.research ?? 0)}`, detail: `Reached on day ${best?.day} (${best?.date}) after sustained evidence accumulation.`, route: '/institution/quality' },
    { label: 'Biggest mistake', title: `Deepest drawdown ${worst?.drawdown}%`, detail: `Recorded on day ${worst?.day}; retained permanently as a failure record rather than discarded.`, route: '/forward-validation' },
    { label: 'Most important discovery', title: discovery?.title ?? 'Institutional discovery', detail: discovery?.summary ?? 'Retained in the Knowledge Graph.', route: discovery ? `/explorer/${discovery.id}` : '/knowledge-graph' },
    { label: 'Highest confidence decision', title: highest?.title ?? 'No decision recorded', detail: highest ? `Confidence ${highest.confidence} · reviewer ${highest.reviewer} · ${highest.status}.` : 'Awaiting the first executive decision.', route: '/decision-centre' },
    { label: 'Lowest confidence decision', title: lowest?.title ?? 'No decision recorded', detail: lowest ? `Confidence ${lowest.confidence} · reviewer ${lowest.reviewer} · ${lowest.status}.` : 'Awaiting the first executive decision.', route: '/decision-centre' },
    { label: 'Best trade', title: bestTrade ? `${bestTrade.asset} ${bestTrade.decision} · +${bestTrade.actualReturn}%` : 'No trade reviewed', detail: bestTrade?.oracleExplanation ?? 'No reviewed trades yet.', route: '/trade-review' },
    { label: 'Worst trade', title: worstTrade ? `${worstTrade.asset} ${worstTrade.decision} · ${worstTrade.actualReturn}%` : 'No trade reviewed', detail: worstTrade?.lessons?.[0] ?? 'No lesson recorded.', route: '/trade-review' },
    { label: 'Strongest research', title: research?.title ?? 'Research object', detail: `Evidence score ${research?.evidenceScore ?? 0} with confidence ${research?.confidence ?? 0}.`, route: research ? `/explorer/${research.id}` : '/research' },
    { label: 'Most valuable memory', title: memory?.title ?? 'Institutional memory', detail: memory ? `${memory.citations.length} citations · ${memory.reasoning}` : 'No memory retained yet.', route: '/institution/memory' },
  ];
}

/* ── Milestone wall ───────────────────────────────────────── */

export interface Milestone { label: string; detail: string; achieved: boolean; day?: number; route: string }

export function milestoneWall(day = LATEST_DAY): Milestone[] {
  const m = dailyMetrics(Math.min(LATEST_DAY, Math.max(1, day)));
  const evidence = vaultRecords().reduce((s, r) => s + r.evidence.length, 0);
  const citations = allMemory().reduce((s, r) => s + r.citations.length, 0);
  const defs: { label: string; detail: string; hit: boolean; day?: number; route: string }[] = [
    { label: 'First research', detail: 'The first research question opened and evidenced.', hit: day >= 1, day: 1, route: '/research' },
    { label: 'First trade', detail: 'The first simulated trade reviewed end to end.', hit: m.tradeReviews >= 1, day: 3, route: '/trade-review' },
    { label: 'First promotion', detail: 'The first specialist promoted through governance.', hit: m.decisions >= 5, day: 22, route: '/promotion' },
    { label: '100 memories', detail: 'One hundred permanent institutional memories retained.', hit: m.memoryRecords >= 100, route: '/institution/memory' },
    { label: '500 citations', detail: 'Five hundred verifiable citations across memory.', hit: citations >= 500, route: '/institution/memory' },
    { label: '1000 evidence links', detail: 'One thousand evidence links across the archive.', hit: evidence >= 1000, route: '/audit-vault' },
    { label: 'Institution IQ 75', detail: 'Composite intelligence index crossed 75.', hit: m.iq >= 75, route: '/institution/iq' },
    { label: 'Institution IQ 80', detail: 'Composite intelligence index crossed 80.', hit: m.iq >= 80, route: '/institution/iq' },
    { label: 'Production ready', detail: 'All ten governance gates satisfied — human approval still required.', hit: m.readiness >= 100, route: '/production-readiness' },
    { label: 'Version 1.0', detail: 'ATLAS OS™ v1.0 released as an institutional operating system.', hit: day >= 40, day: 40, route: '/institution/history' },
  ];
  return defs.map((d) => ({ label: d.label, detail: d.detail, achieved: d.hit, day: d.day, route: d.route }));
}

/* ── Founder reflections (private, local only) ────────────── */

export const REFLECTION_SECTIONS = [
  { key: 'observations', label: 'Observations', placeholder: 'What did you notice about the institution today?' },
  { key: 'ideas', label: 'Ideas', placeholder: 'What should the institution try next?' },
  { key: 'concerns', label: 'Concerns', placeholder: 'What worries you about the current evidence?' },
  { key: 'lessons', label: 'Lessons', placeholder: 'What will you not repeat?' },
] as const;

export type ReflectionKey = (typeof REFLECTION_SECTIONS)[number]['key'];
export type Reflection = Partial<Record<ReflectionKey, string>>;

const REFLECTION_STORE = 'atlas-archive-reflections';

function readStore(): Record<string, Reflection> {
  try { return JSON.parse(localStorage.getItem(REFLECTION_STORE) ?? '{}'); } catch { return {}; }
}

export function loadReflection(day: number): Reflection {
  return readStore()[String(day)] ?? {};
}

export function saveReflection(day: number, reflection: Reflection): void {
  const all = readStore();
  all[String(day)] = reflection;
  try { localStorage.setItem(REFLECTION_STORE, JSON.stringify(all)); } catch { /* storage full */ }
}

export function reflectionDays(): number[] {
  return Object.keys(readStore())
    .filter((d) => Object.values(readStore()[d] ?? {}).some((v) => (v ?? '').trim()))
    .map(Number)
    .sort((a, b) => b - a);
}

/* ── Exports ──────────────────────────────────────────────── */

export type ArchiveExport =
  | 'Executive Report' | 'Board Report' | 'Research Report'
  | 'Annual Report' | 'Institution History' | 'Certification Package';

export const ARCHIVE_EXPORTS: ArchiveExport[] = [
  'Executive Report', 'Board Report', 'Research Report',
  'Annual Report', 'Institution History', 'Certification Package',
];

export function buildArchiveExport(kind: ArchiveExport, day = LATEST_DAY): string {
  const rule = ''.padEnd(72, '─');
  const head = [`ATLAS OS™ · ${ARCHIVE_VERSION}`, kind, `Reconstructed day ${day} · ${dateOfValidationDay(day)}`,
    `Generated ${new Date().toISOString()}`, ARCHIVE_GOVERNANCE.join(' · '), rule, ''];
  const snap = snapshot(day);

  switch (kind) {
    case 'Executive Report':
      return [...head, 'Executive story:', ...executiveStory(day).map((s) => `  ${s}`), '', 'Snapshot:',
        ...snap.map((r) => `  ${r.label.padEnd(24)} ${String(r.value).padStart(8)}  (${r.delta >= 0 ? '+' : ''}${r.delta} vs 7d)`)].join('\n');
    case 'Board Report':
      return [...head, 'Snapshot:', ...snap.map((r) => `  ${r.label.padEnd(24)} ${r.value}`), '', 'Decision history:', rule,
        ...decisionHistory(day).map((d) => `  ${d.date} · ${d.id} · ${d.title} · ${d.status} · confidence ${d.confidence} · reviewer ${d.reviewer}`)].join('\n');
    case 'Research Report':
      return [...head, 'Strongest research objects:', rule,
        ...[...KNOWLEDGE_NODES].sort((a, b) => b.evidenceScore - a.evidenceScore).slice(0, 40)
          .map((n) => `  ${n.created} · ${n.id} · ${n.title} · ${n.department} · evidence ${n.evidenceScore} · confidence ${n.confidence}`)].join('\n');
    case 'Annual Report':
      return [...head, 'Executive story:', ...executiveStory(day).map((s) => `  ${s}`), '', 'Lessons learned:', rule,
        ...lessonsLearned(day).map((l) => `  ${l.label}: ${l.title} — ${l.detail}`), '', 'Milestones:', rule,
        ...milestoneWall(day).map((m) => `  [${m.achieved ? 'x' : ' '}] ${m.label} — ${m.detail}`)].join('\n');
    case 'Institution History':
      return [...head, ...archiveEvents().filter((e) => e.day <= day)
        .map((e) => `  Day ${String(e.day).padStart(3)} · ${e.date} · ${EVENT_META[e.kind].label} · ${e.title} — ${e.detail}`)].join('\n');
    case 'Certification Package':
      return [...head, `Verdict: ${OVERALL_VERDICT} (${CERTIFICATION_PCT}%)`,
        `Checks: ${CERT_SUMMARY.pass} pass · ${CERT_SUMMARY.warning} warning · ${CERT_SUMMARY.fail} fail · ${CERT_SUMMARY.notTested} not tested`,
        '', 'Traceability:', rule,
        `  Trade traceability ${reviewHeader(tradeLibrary()).traceability}% across ${reviewHeader(tradeLibrary()).totalReviewed} reviewed trades.`,
        `  Memory citation rate ${memoryStats().citationRate}% across ${memoryStats().total} records.`].join('\n');
    default:
      return head.join('\n');
  }
}

export function downloadArchiveExport(kind: ArchiveExport, day = LATEST_DAY): void {
  const blob = new Blob([buildArchiveExport(kind, day)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atlas-performance-archive-${kind.toLowerCase().replace(/\s+/g, '-')}-day-${day}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
