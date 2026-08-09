/**
 * ATLAS OS™ — Founder's Office™
 * Private executive workspace. Presentation layer only: it reads existing
 * institutional metrics and stores founder-private notes/checklists locally.
 * It never controls trading, governance or production approval.
 */
import {
  TOTAL_VALIDATION_DAYS, dailyMetrics, dateOfValidationDay, institutionScoreRows,
  validationMilestones, dailyPriorities, metricSeries,
} from '@/lib/institutionValidation';
import { memoryStats } from '@/lib/institutionalMemory';
import { institutionIQ } from '@/lib/institutionIntelligence';
import { readinessSnapshot } from '@/lib/productionReadiness';

export const FOUNDER_VERSION = "ATLAS OS™ · Founder's Office™ v1.0";

export const FOUNDER_RULES = [
  'This page never controls trading and never connects to an exchange.',
  'It never changes governance rules or thresholds.',
  'It never approves production promotion.',
  'Presentation layer only — every number is read from existing institutional evidence.',
  'Journal entries are private to the founder and stored on this device only.',
];

export const FOUNDER_PROMISE = [
  'ATLAS exists to make disciplined, evidence-based decisions.',
  'No shortcuts.',
  'No emotion.',
  'No unmanaged risk.',
  'Research before action.',
  'Evidence before confidence.',
  'Governance before production.',
  'Human judgement remains the final authority.',
];

const QUOTES = [
  'The institution improves through disciplined evidence, not emotion.',
  'Patience is a position. Evidence is the edge.',
  'A strategy without an audit trail is a story, not a system.',
  'Compounding knowledge precedes compounding capital.',
  'The market rewards process long before it rewards conviction.',
  'Slow governance is cheaper than fast regret.',
  'Every archived day is a permanent asset of the institution.',
];

const FOCUS = [
  'Protect readiness quality — depth over speed.',
  'Grow the trade sample without loosening any gate.',
  'Convert observations into citation-backed memory.',
  'Close the oldest outstanding executive decision.',
  'Review specialist stability before adding anything new.',
  'Archive today, then step away from the screen.',
  'Ask the harder question about the current champion.',
];

const pick = <T,>(arr: T[], day: number) => arr[day % arr.length];

export interface MorningPanel {
  greeting: string;
  date: string;
  weekday: string;
  validationDay: number;
  institutionAge: string;
  phase: string;
  status: string;
  focus: string;
  quote: string;
}

export function morningPanel(day = TOTAL_VALIDATION_DAYS): MorningPanel {
  const iso = dateOfValidationDay(day);
  const d = new Date(iso);
  const months = Math.floor(day / 30.44);
  return {
    greeting: 'Good Morning, Founder',
    date: d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
    validationDay: day,
    institutionAge: `${months} month${months === 1 ? '' : 's'} · ${day} days`,
    phase: 'Phase 3 — Institutional Validation™',
    status: 'Research · Simulation · Observation only',
    focus: pick(FOCUS, day),
    quote: pick(QUOTES, day),
  };
}

export interface TodayMetric {
  key: string;
  label: string;
  value: string;
  delta: number;
  route: string;
  explanation: string;
}

export function todaysInstitution(day = TOTAL_VALIDATION_DAYS): TodayMetric[] {
  const rows = institutionScoreRows(day);
  const today = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 1));
  const mem = memoryStats();
  const health = Math.round(
    (today.iq + today.governance + today.stability + today.readiness) / 4,
  );
  const prevHealth = Math.round((prev.iq + prev.governance + prev.stability + prev.readiness) / 4);

  const scored: TodayMetric[] = rows
    .filter((r) => r.key !== 'memoryQuality')
    .map((r) => ({
      key: String(r.key),
      label: r.label,
      value: `${r.value}`,
      delta: r.delta,
      route: r.route,
      explanation: r.explanation,
    }));

  return [
    {
      key: 'health', label: 'Institution Health', value: `${health}`, delta: health - prevHealth,
      route: '/institution', explanation: 'Mean of IQ, governance, stability and readiness.',
    },
    ...scored,
    {
      key: 'memory', label: 'Memory Growth', value: `${mem.total}`, delta: today.memoryRecords - prev.memoryRecords,
      route: '/institution/memory', explanation: 'Permanent citation-backed records in the institutional ledger.',
    },
  ];
}

// ── Priorities ─────────────────────────────────────────────────────────

export interface Priority { id: string; label: string; route?: string; note: string }

export function foundersPriorities(day = TOTAL_VALIDATION_DAYS): Priority[] {
  const base: Priority[] = [
    { id: 'daily', label: 'Review Institution Daily™', route: '/institution-daily', note: "Read today's briefing and archive it to memory." },
    { id: 'readiness', label: 'Review Production Readiness™', route: '/production-readiness', note: 'Confirm no gate has silently regressed.' },
    { id: 'trades', label: 'Review Trade Review™', route: '/trade-review', note: 'Audit the newest simulated trades end to end.' },
    { id: 'evolution', label: 'Review Portfolio Evolution™', route: '/portfolio-evolution', note: 'Check the institution is still learning, not just running.' },
    { id: 'research', label: 'Approve research', route: '/research-journal', note: 'Human approval remains mandatory for every promotion.' },
    { id: 'maintenance', label: 'Review Maintenance', route: '/maintenance', note: 'Clear open self-healing findings before they compound.' },
    { id: 'notes', label: 'Executive notes', note: "Write today's observation into the founder's journal." },
  ];
  const rotation = dailyPriorities(day).slice(0, 2).map((p, i) => ({
    id: `rot-${i}`, label: p, route: '/institution-daily', note: 'Rotating priority derived from today’s validation cycle.',
  }));
  return [...base, ...rotation];
}

// ── Mission ────────────────────────────────────────────────────────────

export interface Mission {
  name: string;
  progress: number;
  week: number;
  daysElapsed: number;
  daysRemaining: number;
  objectives: string[];
  milestones: { label: string; progress: number; state: string; eta: string }[];
}

export function currentMission(day = TOTAL_VALIDATION_DAYS): Mission {
  const target = 90;
  const elapsed = Math.min(day, target);
  return {
    name: '90-Day Validation',
    progress: Math.round((elapsed / target) * 100),
    week: Math.ceil(day / 7),
    daysElapsed: day,
    daysRemaining: Math.max(0, target - day),
    objectives: [
      'Archive a briefing every single validation day without a gap.',
      'Grow the forward trade sample under unchanged thresholds.',
      'Keep every memory record citation-backed.',
      'Resolve production blockers through evidence, not exception.',
    ],
    milestones: validationMilestones(day).map((m) => ({
      label: `${m.label} · ${m.certification}`, progress: m.progress, state: m.state, eta: m.eta,
    })),
  };
}

// ── Executive decisions ────────────────────────────────────────────────

export interface DecisionItem { group: string; title: string; detail: string; route: string; state: string }

export function executiveDecisions(day = TOTAL_VALIDATION_DAYS): DecisionItem[] {
  const snap = readinessSnapshot();
  const m = dailyMetrics(day);
  return [
    { group: 'Outstanding Decisions', title: 'Adaptive Allocation v7 promotion', detail: 'Recommendation remains NOT READY — runtime and sample below gate.', route: '/decision-centre', state: 'Awaiting founder' },
    { group: 'Pending Reviews', title: 'Champion Forward Trial checkpoint', detail: 'Confidence Weighted vs Dynamic Allocation v1 — weekly review due.', route: '/champion-trial', state: 'Due this week' },
    { group: 'Governance Approvals', title: 'Specialist Approval Board queue', detail: 'Specialist candidates awaiting human sign-off before any allocation.', route: '/governance', state: 'Human required' },
    { group: 'Certification Tasks', title: 'Institutional certification refresh', detail: 'Re-run the certification categories against the current evidence set.', route: '/certification', state: 'Scheduled' },
    { group: 'Production Blockers', title: `Readiness at ${snap.score}% — gates 9 and 10 blocked`, detail: `Stability ${m.stability} · confidence ${m.confidence}. Blockers clear through evidence only.`, route: '/production-readiness', state: 'Blocked' },
  ];
}

// ── Creative vision ────────────────────────────────────────────────────

export const CREATIVE_VISION = {
  mission: 'Build an institution that turns disciplined research into durable, compounding freedom.',
  vision: 'ATLAS becomes the quiet engine behind a creative studio that never has to compromise its work for money.',
  objectives: [
    { title: 'Fund Pulse Of Africa Studio', blurb: 'A self-funded studio with the runway to say no to the wrong projects.' },
    { title: 'Grow Chronicles of Zuri', blurb: 'Give the story the time, craft and scale it deserves.' },
    { title: 'Build sustainable creative freedom', blurb: 'Income that is patient, governed and independent of any single client.' },
    { title: 'Create institutional intelligence', blurb: 'Knowledge that outlives any one strategy, market or year.' },
  ],
};

// ── Quick access ───────────────────────────────────────────────────────

export const QUICK_ACCESS = [
  { label: 'Institution Daily™', to: '/institution-daily', blurb: 'Daily executive briefing' },
  { label: 'Production Readiness™', to: '/production-readiness', blurb: 'Ten governance gates' },
  { label: 'Trade Review™', to: '/trade-review', blurb: 'Full simulated audit trail' },
  { label: 'Portfolio Evolution™', to: '/portfolio-evolution', blurb: 'How the institution learned' },
  { label: 'Executive Decision™', to: '/decision-centre', blurb: 'Candidate decisions' },
  { label: 'Institution Dashboard™', to: '/institution', blurb: 'Institutional overview' },
  { label: 'Oracle™', to: '/oracle', blurb: 'Ask the institution' },
  { label: 'Institutional Memory™', to: '/institution/memory', blurb: 'Permanent ledger' },
];

// ── Weekly scoreboard ──────────────────────────────────────────────────

export interface ScoreboardRow { label: string; value: string; delta: number; route: string; hint: string }

export function weeklyScoreboard(day = TOTAL_VALIDATION_DAYS): ScoreboardRow[] {
  const today = dailyMetrics(day);
  const weekAgo = dailyMetrics(Math.max(1, day - 7));
  const week = metricSeries(7, day);
  const sum = (k: 'researchCompleted' | 'trades') => week.reduce((a, m) => a + m[k], 0);
  const r1 = (n: number) => Number(n.toFixed(1));
  return [
    { label: 'Validation Days', value: `${Math.min(7, day)}`, delta: 0, route: '/institution-daily', hint: 'Briefings produced in the current week.' },
    { label: 'Research Completed', value: `${sum('researchCompleted')}`, delta: 0, route: '/research-journal', hint: 'Research items closed this week.' },
    { label: 'Trade Reviews', value: `${today.tradeReviews - weekAgo.tradeReviews}`, delta: 0, route: '/trade-review', hint: 'Simulated trades audited end to end.' },
    { label: 'Knowledge Growth', value: `+${today.objects - weekAgo.objects}`, delta: today.objects - weekAgo.objects, route: '/knowledge-graph', hint: 'New knowledge objects added.' },
    { label: 'Memory Growth', value: `+${today.memoryRecords - weekAgo.memoryRecords}`, delta: today.memoryRecords - weekAgo.memoryRecords, route: '/institution/memory', hint: 'New permanent memory records.' },
    { label: 'Institution IQ Change', value: `${r1(today.iq)}`, delta: r1(today.iq - weekAgo.iq), route: '/institution/iq', hint: 'Composite intelligence movement.' },
    { label: 'Readiness Change', value: `${r1(today.readiness)}`, delta: r1(today.readiness - weekAgo.readiness), route: '/production-readiness', hint: 'Production readiness movement.' },
  ];
}

// ── Monthly reflection ─────────────────────────────────────────────────

export interface Reflection { heading: string; body: string }

export function monthlyReflection(day = TOTAL_VALIDATION_DAYS): Reflection[] {
  const today = dailyMetrics(day);
  const monthAgo = dailyMetrics(Math.max(1, day - 30));
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const mem = memoryStats();
  const d = (a: number, b: number) => Number((a - b).toFixed(1));
  return [
    { heading: 'What improved', body: `Institution IQ moved ${d(today.iq, monthAgo.iq) >= 0 ? 'up' : 'down'} to ${iq.total} (${iq.grade}) and the permanent ledger grew to ${mem.total} records at ${mem.citationRate}% citation coverage. Evidence volume, not feature count, drove the change.` },
    { heading: 'What was learned', body: 'Specialists behave far better when their activation regime is explicit. Gating by volatility and trend produced more of the improvement this month than any parameter change did.' },
    { heading: 'What remains difficult', body: `Sample size. Readiness sits at ${snap.score}% and the final gates stay blocked because runtime and trade count — not quality — are the binding constraints. Patience is the only legitimate fix.` },
    { heading: 'Biggest achievement', body: 'Every simulated trade this month carries a complete, replayable audit trail from research question to memory record. That is institutional, not personal, knowledge.' },
    { heading: 'Biggest opportunity', body: 'Confidence-weighted allocation continues to lead on evidence quality. Its forward trial is the highest-value thing the institution is currently running.' },
    { heading: 'Recommended focus next month', body: 'Add zero new modules. Archive every day, grow the forward sample under unchanged thresholds, and let the gates clear themselves on evidence.' },
  ];
}

// ── Private local storage (journal + checklist) ────────────────────────

export const JOURNAL_SECTIONS = [
  { key: 'observations', label: "Today's observations", placeholder: 'What did you actually see today?' },
  { key: 'ideas', label: 'Ideas', placeholder: 'Unfiltered — capture it now, judge it later.' },
  { key: 'concerns', label: 'Concerns', placeholder: 'What is quietly worrying you?' },
  { key: 'lessons', label: 'Lessons', placeholder: 'What would you tell yourself a month ago?' },
  { key: 'opportunities', label: 'Opportunities', placeholder: 'What is the institution not yet exploiting?' },
  { key: 'weekly', label: 'Weekly goals', placeholder: 'Three things that would make this week count.' },
  { key: 'monthly', label: 'Monthly goals', placeholder: 'What must be true by month end?' },
  { key: 'decisions', label: 'Strategic decisions', placeholder: 'Decisions taken, and the reasoning behind them.' },
] as const;

export type JournalKey = (typeof JOURNAL_SECTIONS)[number]['key'];
export type Journal = Partial<Record<JournalKey, string>>;

const JOURNAL_PREFIX = 'atlas.founder.journal.';
const CHECK_PREFIX = 'atlas.founder.checklist.';

function safeRead(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeWrite(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

export function loadJournal(day: number): Journal {
  const raw = safeRead(`${JOURNAL_PREFIX}${day}`);
  if (!raw) return {};
  try { return JSON.parse(raw) as Journal; } catch { return {}; }
}

export function saveJournal(day: number, journal: Journal) {
  safeWrite(`${JOURNAL_PREFIX}${day}`, JSON.stringify(journal));
}

export function loadChecklist(day: number): string[] {
  const raw = safeRead(`${CHECK_PREFIX}${day}`);
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

export function saveChecklist(day: number, ids: string[]) {
  safeWrite(`${CHECK_PREFIX}${day}`, JSON.stringify(ids));
}

export function journalDaysWritten(): number {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(JOURNAL_PREFIX)) n++;
    }
  } catch { /* ignore */ }
  return n;
}
