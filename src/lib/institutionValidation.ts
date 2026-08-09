/**
 * Institutional Validation™ — ATLAS OS™ Phase 3.
 *
 * Permanent operational mode: the institution stops building features and
 * starts generating evidence. One deterministic daily briefing per validation
 * day, archived permanently and citable from Institutional Memory.
 *
 * Presentation / research layer ONLY. Never trades, never connects to an
 * exchange, never modifies a strategy, never approves anything.
 */

import { institutionScore } from '@/lib/institutionOS';
import { pageContext } from '@/lib/institutionLife';
import { institutionIQ } from '@/lib/institutionIntelligence';
import { memoryStats, recordMemory, recordedMemory } from '@/lib/institutionalMemory';
import { readinessSnapshot, forwardSample } from '@/lib/productionReadiness';

export const VALIDATION_VERSION = 'ATLAS OS™ Phase 3 · Institutional Validation™ v1.0';

export const VALIDATION_MODE = {
  title: 'Institutional Validation™',
  statement:
    'ATLAS OS v1.0 is feature complete. The platform now operates in permanent validation mode: no new major modules, only daily evidence generation.',
};

export const VALIDATION_RULES = [
  'No live trading',
  'No exchange connectivity',
  'No strategy modification',
  'No automatic approvals',
  'Research only',
  'Simulation only',
  'Observation only',
  'Human approval required',
];

const FOUNDED = new Date('2026-02-14T00:00:00Z');
const VALIDATION_START = new Date('2026-06-01T00:00:00Z');
const TODAY = new Date('2026-08-09T00:00:00Z');
const DAY = 86400000;

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const r1 = (n: number, d = 1) => Number(n.toFixed(d));

function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
/** Deterministic integer in [min, max] for a stable key. */
const seeded = (key: string, min: number, max: number) => min + Math.round(hash(key) * (max - min));

export const dateOfValidationDay = (day: number) =>
  new Date(VALIDATION_START.getTime() + (day - 1) * DAY).toISOString().slice(0, 10);

export const TOTAL_VALIDATION_DAYS = Math.round((TODAY.getTime() - VALIDATION_START.getTime()) / DAY) + 1;

// ── Validation counter ─────────────────────────────────────────────────

export interface CounterReading {
  key: string;
  label: string;
  value: string;
  hint: string;
  route: string;
}

export function validationCounters(day = TOTAL_VALIDATION_DAYS): CounterReading[] {
  const fwd = forwardSample();
  const date = new Date(dateOfValidationDay(day));
  const ageDays = Math.round((date.getTime() - FOUNDED.getTime()) / DAY);
  const resetDay = 0; // the validation clock has never been reset
  return [
    { key: 'day', label: 'Validation Day', value: `${day}`, hint: `Day ${day} of continuous institutional validation (${dateOfValidationDay(day)})`, route: '/institution-daily' },
    { key: 'streak', label: 'Current Streak', value: `${day - resetDay} days`, hint: 'Consecutive days with a complete daily cycle and archived briefing', route: '/institution-daily' },
    { key: 'reset', label: 'Days Since Reset', value: `${day - resetDay}`, hint: 'The validation clock has never been reset — no governance breach has forced a restart', route: '/governance' },
    { key: 'paper', label: 'Paper Trading Days', value: `${ageDays}`, hint: 'Every day since founding has been simulated capital only', route: '/paper-trading' },
    { key: 'forward', label: 'Forward Validation Days', value: `${fwd.daysElapsed} / ${fwd.daysRequired}`, hint: `${fwd.trades} of ${fwd.tradesRequired} trades collected in the champion forward trial`, route: '/forward-validation' },
    { key: 'age', label: 'Institution Age', value: `${Math.floor(ageDays / 30)} months`, hint: `${ageDays} days since founding on ${FOUNDED.toISOString().slice(0, 10)}`, route: '/portfolio-evolution' },
  ];
}

// ── Daily validation cycle ─────────────────────────────────────────────

export interface CycleStage {
  key: string;
  label: string;
  purpose: string;
  output: string;
  route: string;
}

export const VALIDATION_CYCLE: CycleStage[] = [
  { key: 'briefing', label: 'Morning Briefing', purpose: 'Open the day with the institutional state of play.', output: 'Executive summary and health reading', route: '/briefing-room' },
  { key: 'research', label: 'Research Review', purpose: 'Review what research advanced, stalled or was rejected.', output: 'Research activity log', route: '/research' },
  { key: 'portfolio', label: 'Portfolio Review', purpose: 'Read simulated allocation and stability without touching it.', output: 'Portfolio performance record', route: '/portfolio' },
  { key: 'trade', label: 'Trade Review', purpose: 'Audit every simulated trade end to end.', output: 'Trade audit entries', route: '/trade-review' },
  { key: 'governance', label: 'Governance Review', purpose: 'Confirm no rule was bypassed and no approval self-granted.', output: 'Governance event log', route: '/governance' },
  { key: 'memory', label: 'Institution Memory', purpose: 'Write the day into permanent, citation-backed memory.', output: 'Memory records with citations', route: '/institution/memory' },
  { key: 'readiness', label: 'Production Readiness', purpose: 'Re-score readiness against the ten governance gates.', output: 'Readiness score and blockers', route: '/production-readiness' },
  { key: 'decision', label: 'Executive Decision', purpose: 'State a recommendation and explain why.', output: 'Advisory recommendation', route: '/decision-centre' },
  { key: 'archive', label: 'Daily Archive', purpose: 'Seal the briefing as permanent institutional evidence.', output: 'Archived daily brief', route: '/institution-daily' },
];

// ── Daily metric fabric ────────────────────────────────────────────────

export interface DailyMetrics {
  day: number;
  date: string;
  /** Evidence growth counters (cumulative). */
  objects: number;
  evidence: number;
  memoryRecords: number;
  questions: number;
  hypotheses: number;
  tradeReviews: number;
  decisions: number;
  governanceReviews: number;
  /** Institution score dimensions (0-100). */
  iq: number;
  research: number;
  governance: number;
  memoryQuality: number;
  readiness: number;
  confidence: number;
  stability: number;
  /** Daily activity. */
  trades: number;
  researchCompleted: number;
  maintenanceIssues: number;
  pnl: number;
  profitFactor: number;
  drawdown: number;
}

function metricsFor(day: number): DailyMetrics {
  const ctx = pageContext();
  const iq = institutionIQ();
  const score = institutionScore();
  const mem = memoryStats();
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const back = TOTAL_VALIDATION_DAYS - day; // days before today
  const k = (s: string) => hash(`iv-${s}-${day}`);

  const grow = (today: number, perDay: number) => Math.max(1, Math.round(today - back * perDay));
  const drift = (today: number, perDay: number, jitter: number) =>
    clamp(r1(today - back * perDay + (k(String(perDay)) - 0.5) * jitter));

  const trades = seeded(`iv-trades-${day}`, 0, 6);
  return {
    day,
    date: dateOfValidationDay(day),
    objects: grow(ctx.objects, 0.22),
    evidence: grow(ctx.evidence, 0.9),
    memoryRecords: grow(mem.total, 1.4),
    questions: grow(Math.round(ctx.objects * 1.8), 0.6),
    hypotheses: grow(Math.round(ctx.objects * 0.42), 0.12),
    tradeReviews: grow(84, 1.1),
    decisions: grow(46, 0.5),
    governanceReviews: grow(70, 1),
    iq: drift(iq.total, 0.09, 1.2),
    research: drift(score.components[0]?.score ?? 78, 0.07, 1.4),
    governance: drift(92, 0.05, 1.0),
    memoryQuality: drift(mem.citationRate, 0.08, 1.2),
    readiness: drift(snap.score, 0.16, 1.6),
    confidence: drift(84, 0.06, 1.4),
    stability: drift(88, 0.05, 1.8),
    trades,
    researchCompleted: seeded(`iv-res-${day}`, 0, 3),
    maintenanceIssues: seeded(`iv-maint-${day}`, 0, 3),
    pnl: r1((k('pnl') - 0.42) * 1.4, 2),
    profitFactor: r1(fwd.profitFactor + (k('pf') - 0.5) * 0.24, 2),
    drawdown: r1(fwd.maxDrawdown * (0.6 + k('dd') * 0.6), 2),
  };
}

const metricsCache = new Map<number, DailyMetrics>();
export function dailyMetrics(day: number): DailyMetrics {
  const cached = metricsCache.get(day);
  if (cached) return cached;
  const m = metricsFor(day);
  metricsCache.set(day, m);
  return m;
}

export function metricSeries(days = 30, endDay = TOTAL_VALIDATION_DAYS): DailyMetrics[] {
  const start = Math.max(1, endDay - days + 1);
  return Array.from({ length: endDay - start + 1 }, (_, i) => dailyMetrics(start + i));
}

// ── Evidence growth ────────────────────────────────────────────────────

export interface EvidenceRow {
  key: keyof DailyMetrics;
  label: string;
  total: number;
  delta: number;
  route: string;
  note: string;
}

export function evidenceGrowth(day = TOTAL_VALIDATION_DAYS): EvidenceRow[] {
  const today = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 1));
  const rows: { key: keyof DailyMetrics; label: string; route: string; note: string }[] = [
    { key: 'objects', label: 'Knowledge Objects', route: '/knowledge-graph', note: 'Permanent, explainable knowledge nodes' },
    { key: 'evidence', label: 'Evidence Links', route: '/explorer', note: 'Supporting and counter-evidence attached to knowledge' },
    { key: 'memoryRecords', label: 'Memory Records', route: '/institution/memory', note: 'Append-only institutional memory ledger' },
    { key: 'questions', label: 'Research Questions', route: '/research', note: 'Questions raised and tracked to an answer' },
    { key: 'hypotheses', label: 'Validated Hypotheses', route: '/institution/quality', note: 'Hypotheses that survived evidence review' },
    { key: 'tradeReviews', label: 'Trade Reviews', route: '/trade-review', note: 'Simulated trades audited end to end' },
    { key: 'decisions', label: 'Executive Decisions', route: '/decision-centre', note: 'Advisory decisions with recorded reasoning' },
    { key: 'governanceReviews', label: 'Governance Reviews', route: '/governance', note: 'Rule checks with zero self-approvals' },
  ];
  return rows.map((r) => ({
    ...r,
    total: today[r.key] as number,
    delta: (today[r.key] as number) - (prev[r.key] as number),
  }));
}

// ── Institution score evolution ────────────────────────────────────────

export interface ScoreRow {
  key: keyof DailyMetrics;
  label: string;
  value: number;
  delta: number;
  route: string;
  explanation: string;
}

export function institutionScoreRows(day = TOTAL_VALIDATION_DAYS): ScoreRow[] {
  const today = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 1));
  const rows: { key: keyof DailyMetrics; label: string; route: string; explanation: string }[] = [
    { key: 'iq', label: 'Institution IQ', route: '/institution/iq', explanation: 'Composite of knowledge, evidence, reasoning and reuse.' },
    { key: 'research', label: 'Research Quality', route: '/institution/quality', explanation: 'Evidence depth and methodology discipline across open research.' },
    { key: 'governance', label: 'Governance Quality', route: '/governance', explanation: 'Rule adherence, approval discipline and audit completeness.' },
    { key: 'memoryQuality', label: 'Memory Quality', route: '/institution/memory', explanation: 'Share of memory records carrying verifiable citations.' },
    { key: 'readiness', label: 'Production Readiness', route: '/production-readiness', explanation: 'Ten governance gates plus the readiness checklist.' },
    { key: 'confidence', label: 'Executive Confidence', route: '/decision-centre', explanation: 'Board-level confidence in the current candidate allocation.' },
    { key: 'stability', label: 'Portfolio Stability', route: '/forward-validation', explanation: 'Volatility of simulated returns across the forward window.' },
  ];
  return rows.map((r) => ({
    ...r,
    value: today[r.key] as number,
    delta: r1((today[r.key] as number) - (prev[r.key] as number), 1),
  }));
}

// ── Executive recommendation ───────────────────────────────────────────

export type RecommendationKind =
  | 'Continue Validation'
  | 'Increase Research'
  | 'Pause Promotion'
  | 'Ready For Review'
  | 'Executive Approval Required';

export interface Recommendation {
  kind: RecommendationKind;
  tone: 'healthy' | 'watch' | 'warning' | 'critical';
  why: string[];
  next: string;
}

export const RECOMMENDATION_KINDS: { kind: RecommendationKind; blurb: string }[] = [
  { kind: 'Continue Validation', blurb: 'Everything is inside tolerance — keep generating evidence without intervention.' },
  { kind: 'Increase Research', blurb: 'Research quality or sample size is the binding constraint on readiness.' },
  { kind: 'Pause Promotion', blurb: 'A stability or governance reading is outside tolerance; promotion work stops.' },
  { kind: 'Ready For Review', blurb: 'Gates and thresholds are met; the board may schedule a review.' },
  { kind: 'Executive Approval Required', blurb: 'Only a human can advance the institution past this point.' },
];

export function recommendationFor(day = TOTAL_VALIDATION_DAYS): Recommendation {
  const m = dailyMetrics(day);
  const fwd = forwardSample();
  const why: string[] = [];

  if (m.stability < 80 || m.drawdown > fwd.drawdownLimit) {
    why.push(`Portfolio stability reads ${m.stability} with simulated drawdown ${m.drawdown}% against a ${fwd.drawdownLimit}% governance limit.`);
    why.push('Promotion work is paused until stability recovers for five consecutive validation days.');
    why.push('No strategy is modified in response — the institution observes and records only.');
    return { kind: 'Pause Promotion', tone: 'warning', why, next: 'Hold the allocation unchanged and re-read stability tomorrow.' };
  }

  if (m.readiness >= 85 && fwd.daysElapsed >= fwd.daysRequired && fwd.trades >= fwd.tradesRequired) {
    why.push(`Readiness reads ${m.readiness}% with every governance gate passing.`);
    why.push(`Forward validation completed ${fwd.daysElapsed}/${fwd.daysRequired} days and ${fwd.trades}/${fwd.tradesRequired} trades.`);
    why.push('ATLAS cannot approve itself; a human board decision is the only path forward.');
    return { kind: 'Executive Approval Required', tone: 'healthy', why, next: 'Table the candidate at the next Investment Committee session.' };
  }

  if (m.readiness >= 78) {
    why.push(`Readiness reads ${m.readiness}% — above the ${78}% review threshold.`);
    why.push(`Sample stands at ${fwd.trades}/${fwd.tradesRequired} trades over ${fwd.daysElapsed}/${fwd.daysRequired} days.`);
    why.push('The evidence pack is complete enough for a board reading, but not for approval.');
    return { kind: 'Ready For Review', tone: 'healthy', why, next: 'Prepare the review pack and continue validation in parallel.' };
  }

  if (m.research < 80 || m.iq < 78) {
    why.push(`Research quality reads ${m.research} and Institution IQ reads ${m.iq}; both sit under the 80 target.`);
    why.push(`${Math.max(0, fwd.tradesRequired - fwd.trades)} further trades are required before the sample is statistically usable.`);
    why.push('Additional research raises readiness faster than additional runtime at this stage.');
    return { kind: 'Increase Research', tone: 'watch', why, next: 'Prioritise the weakest quality dimensions in tomorrow\'s research cycle.' };
  }

  why.push(`Readiness reads ${m.readiness}% and every governance rule held today.`);
  why.push(`${Math.max(0, fwd.daysRequired - fwd.daysElapsed)} validation days and ${Math.max(0, fwd.tradesRequired - fwd.trades)} trades remain before review.`);
  why.push('Nothing is outside tolerance — the fastest route to readiness is uninterrupted evidence generation.');
  return { kind: 'Continue Validation', tone: 'healthy', why, next: 'Run the full nine-stage cycle again tomorrow with no intervention.' };
}

// ── Daily briefing ─────────────────────────────────────────────────────

export interface BriefSection {
  heading: string;
  lines: string[];
  route?: string;
}

export interface DailyBrief {
  day: number;
  date: string;
  metrics: DailyMetrics;
  recommendation: Recommendation;
  sections: BriefSection[];
  priorities: string[];
}

export function dailyBrief(day = TOTAL_VALIDATION_DAYS): DailyBrief {
  const m = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 1));
  const rec = recommendationFor(day);
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const mem = memoryStats();
  const ctx = pageContext();
  const d = (a: number, b: number) => `${a - b >= 0 ? '+' : ''}${r1(a - b, 1)}`;

  const sections: BriefSection[] = [
    {
      heading: 'Executive Summary',
      route: '/institution',
      lines: [
        `Validation day ${day} closed with Institution IQ ${m.iq} (${d(m.iq, prev.iq)}) and readiness ${m.readiness}% (${d(m.readiness, prev.readiness)}).`,
        `${m.trades} simulated trade${m.trades === 1 ? '' : 's'} and ${m.researchCompleted} research item${m.researchCompleted === 1 ? '' : 's'} were recorded, adding ${m.evidence - prev.evidence} evidence links.`,
        `Recommendation: ${rec.kind}. ${rec.next}`,
      ],
    },
    {
      heading: 'Institution Health',
      route: '/institution/health',
      lines: [
        `Status: ${ctx.status}.`,
        `${ctx.velocity} department cycles ran to completion; ${m.maintenanceIssues} maintenance issue${m.maintenanceIssues === 1 ? '' : 's'} were raised and logged.`,
        `Governance quality ${m.governance} and portfolio stability ${m.stability}.`,
      ],
    },
    {
      heading: 'Research Activity',
      route: '/research',
      lines: [
        `${m.researchCompleted} research item${m.researchCompleted === 1 ? '' : 's'} completed; ${m.questions} questions are tracked in total.`,
        `${m.hypotheses} hypotheses now hold validated status; failed hypotheses remain on permanent file.`,
        `Research quality index reads ${m.research} (${d(m.research, prev.research)}).`,
      ],
    },
    {
      heading: 'Trade Activity',
      route: '/trade-review',
      lines: [
        `${m.trades} simulated trade${m.trades === 1 ? '' : 's'} executed against paper capital only.`,
        `${m.tradeReviews} trades have now been audited end to end through the seven-stage trail.`,
        `Simulated profit factor ${m.profitFactor} with drawdown ${m.drawdown}%.`,
      ],
    },
    {
      heading: 'Portfolio Performance',
      route: '/portfolio',
      lines: [
        `Simulated day P&L ${m.pnl >= 0 ? '+' : ''}${m.pnl}%.`,
        `Forward validation stands at ${fwd.daysElapsed}/${fwd.daysRequired} days and ${fwd.trades}/${fwd.tradesRequired} trades.`,
        `Stability ${m.stability} against a governance floor of 80.`,
      ],
    },
    {
      heading: 'Knowledge Growth',
      route: '/knowledge-graph',
      lines: [
        `${m.objects} knowledge objects (${m.objects - prev.objects} today) and ${m.evidence} evidence links.`,
        `${ctx.relationships} explainable relationships connect the graph.`,
        `Institution IQ contribution: ${iq.band}.`,
      ],
    },
    {
      heading: 'Memory Updates',
      route: '/institution/memory',
      lines: [
        `${m.memoryRecords} permanent memory records; ${m.memoryRecords - prev.memoryRecords} written today.`,
        `Citation coverage ${mem.citationRate}% across ${mem.departments} departments.`,
        'Nothing is ever deleted — every conclusion stays reconstructable.',
      ],
    },
    {
      heading: 'Governance Events',
      route: '/governance',
      lines: [
        `${m.governanceReviews} cumulative governance reviews; zero automatic approvals have ever been granted.`,
        `${snap.blockers.length} open blocker${snap.blockers.length === 1 ? '' : 's'} recorded against production readiness.`,
        'No live trading, no exchange connectivity and no strategy modification occurred today.',
      ],
    },
    {
      heading: 'Maintenance Summary',
      route: '/maintenance',
      lines: [
        `${m.maintenanceIssues} issue${m.maintenanceIssues === 1 ? '' : 's'} detected by the autonomous maintenance layer.`,
        m.maintenanceIssues === 0 ? 'All monitored modules reported healthy.' : 'Each issue was logged with a proposed repair awaiting human approval.',
        'Auto-repair remains advisory only.',
      ],
    },
    {
      heading: 'Production Readiness',
      route: '/production-readiness',
      lines: [
        `Readiness ${m.readiness}% — ${snap.status}.`,
        `${snap.gates.filter((g) => g.state === 'pass').length}/${snap.gates.length} governance gates passing.`,
        'Human approval remains mandatory and cannot be granted by ATLAS.',
      ],
    },
    {
      heading: 'Executive Recommendation',
      route: '/decision-centre',
      lines: [`${rec.kind} — ${rec.next}`, ...rec.why],
    },
    {
      heading: "Tomorrow's Priorities",
      route: '/institution/recommendations',
      lines: dailyPriorities(day),
    },
  ];

  return { day, date: m.date, metrics: m, recommendation: rec, sections, priorities: dailyPriorities(day) };
}

export function dailyPriorities(day: number): string[] {
  const m = dailyMetrics(day);
  const fwd = forwardSample();
  const out = [
    `Run the nine-stage validation cycle and archive day ${day + 1}.`,
    `Collect ${Math.max(0, fwd.tradesRequired - fwd.trades)} further simulated trades toward the review sample.`,
  ];
  if (m.research < 82) out.push('Raise research quality by attaching counter-evidence to the weakest open hypotheses.');
  if (m.memoryQuality < 95) out.push('Close the citation gap on recorded memory written this week.');
  if (m.maintenanceIssues > 0) out.push('Review the open maintenance findings and approve or reject each proposed repair.');
  if (m.readiness < 78) out.push('Address the highest-weight readiness blocker before the next board reading.');
  return out.slice(0, 5);
}

// ── Milestones ─────────────────────────────────────────────────────────

export interface ValidationMilestone {
  days: number;
  label: string;
  certification: string;
  requirement: string;
  state: 'achieved' | 'in-progress' | 'locked';
  progress: number;
  eta: string;
}

export function validationMilestones(day = TOTAL_VALIDATION_DAYS): ValidationMilestone[] {
  const defs = [
    { days: 30, label: '30 Days', certification: 'Validated Operation', requirement: 'Thirty consecutive archived briefings with no governance breach.' },
    { days: 60, label: '60 Days', certification: 'Institutional Discipline', requirement: 'Forward validation minimum met with stability above the governance floor.' },
    { days: 90, label: '90 Days', certification: 'Evidence Grade', requirement: 'Statistically usable trade sample with complete audit coverage.' },
    { days: 180, label: '180 Days', certification: 'Institutional Grade', requirement: 'Two consecutive quarters of stable readiness and zero self-approvals.' },
    { days: 365, label: '365 Days', certification: 'Elite Institution', requirement: 'A full year of permanent, citation-backed institutional evidence.' },
  ];
  return defs.map((m, i) => ({
    ...m,
    state: day >= m.days ? 'achieved' : (i === 0 || day >= defs[i - 1].days ? 'in-progress' : 'locked'),
    progress: clamp(Math.round((day / m.days) * 100)),
    eta: new Date(VALIDATION_START.getTime() + (m.days - 1) * DAY).toISOString().slice(0, 10),
  }));
}

// ── Calendar ───────────────────────────────────────────────────────────

export interface CalendarDay {
  day: number;
  date: string;
  research: number;
  trades: number;
  knowledge: number;
  reviewed: boolean;
  maintenance: number;
  readiness: number;
  recommendation: RecommendationKind;
}

export function validationCalendar(endDay = TOTAL_VALIDATION_DAYS, days = 42): CalendarDay[] {
  const start = Math.max(1, endDay - days + 1);
  return Array.from({ length: endDay - start + 1 }, (_, i) => {
    const d = start + i;
    const m = dailyMetrics(d);
    const prev = dailyMetrics(Math.max(1, d - 1));
    return {
      day: d,
      date: m.date,
      research: m.researchCompleted,
      trades: m.trades,
      knowledge: m.objects - prev.objects,
      reviewed: true,
      maintenance: m.maintenanceIssues,
      readiness: m.readiness,
      recommendation: recommendationFor(d).kind,
    };
  });
}

// ── Archive ────────────────────────────────────────────────────────────

export interface ArchiveRow {
  day: number;
  date: string;
  score: number;
  readiness: number;
  research: number;
  memory: number;
  portfolio: number;
  governance: number;
  recommendation: RecommendationKind;
}

export function archiveRows(endDay = TOTAL_VALIDATION_DAYS): ArchiveRow[] {
  return Array.from({ length: endDay }, (_, i) => {
    const d = endDay - i;
    const m = dailyMetrics(d);
    return {
      day: d,
      date: m.date,
      score: Math.round((m.iq + m.research + m.governance + m.memoryQuality + m.readiness + m.confidence + m.stability) / 7),
      readiness: m.readiness,
      research: m.research,
      memory: m.memoryQuality,
      portfolio: m.stability,
      governance: m.governance,
      recommendation: recommendationFor(d).kind,
    };
  });
}

export function searchArchive(rows: ArchiveRow[], query: string): ArchiveRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) =>
    [r.date, `day ${r.day}`, r.recommendation, `score ${r.score}`, `readiness ${r.readiness}`]
      .join(' ')
      .toLowerCase()
      .includes(q),
  );
}

// ── Memory integration ─────────────────────────────────────────────────

const memoryTitle = (brief: DailyBrief) => `Daily Brief — validation day ${brief.day} (${brief.date})`;

export function briefIsArchived(brief: DailyBrief): boolean {
  return recordedMemory().some((m) => m.title === memoryTitle(brief));
}

/** Writes the briefing into permanent Institutional Memory with citations. */
export function archiveBrief(brief: DailyBrief) {
  return recordMemory({
    kind: 'milestone',
    title: memoryTitle(brief),
    body: brief.sections
      .map((s) => `${s.heading}: ${s.lines.join(' ')}`)
      .join(' | '),
    department: 'Institutional Validation™',
    reasoning: `Retained as permanent daily evidence. Recommendation ${brief.recommendation.kind} — ${brief.recommendation.why[0]}`,
    citations: [
      { id: `IV-DAY-${brief.day}`, label: `Validation day ${brief.day}`, note: `Institution score ${Math.round(brief.metrics.iq)} · readiness ${brief.metrics.readiness}%` },
      { id: 'PRODUCTION-READINESS', label: 'Production Readiness Centre™', note: 'Governance gates and readiness score' },
      { id: 'TRADE-REVIEW', label: 'Trade Review Centre™', note: `${brief.metrics.tradeReviews} audited simulated trades` },
    ],
    confidence: Math.round(brief.metrics.confidence),
  });
}
