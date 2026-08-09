/**
 * ATLAS Executive Intelligence™ Centre — advisory presentation layer.
 * Composes existing institutional engines only. No trading logic, no strategy
 * changes, no governance bypass. Everything here is derived and read-only.
 */

import { institutionScore } from '@/lib/institutionOS';
import { institutionIQ, institutionRecommendations, selfReview } from '@/lib/institutionIntelligence';
import { institutionPulse, pageContext, institutionForecast } from '@/lib/institutionLife';
import { memoryStats, allMemory } from '@/lib/institutionalMemory';
import { readinessSnapshot, forwardSample } from '@/lib/productionReadiness';
import { decisionQueue, centreSummary, QUEUE_STATUS_LABEL, type DecisionItem, type QueueStatus } from '@/lib/decisionCentre';
import { getExecutiveSummary } from '@/lib/maintenance';
import { dailyMetrics, TOTAL_VALIDATION_DAYS, recommendationFor } from '@/lib/institutionValidation';
import { eventStream, missionAlerts } from '@/lib/missionControl';

export const EI_VERSION = 'ATLAS OS™ Phase 4 · Executive Intelligence™ Centre v1.0';

export const EI_GOVERNANCE = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'Human Approval Required',
  'No Live Trading',
  'No Exchange Connectivity',
  'No Automatic Decisions',
];

export type Tone = 'healthy' | 'watch' | 'warning' | 'critical';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const toneFor = (score: number): Tone =>
  score >= 85 ? 'healthy' : score >= 72 ? 'watch' : score >= 60 ? 'warning' : 'critical';

/* ── Executive morning briefing ─────────────────────────────────── */

export interface BriefingReading {
  key: string;
  label: string;
  value: string;
  numeric: number;
  hint: string;
  tone: Tone;
  trend: 'up' | 'down' | 'flat';
  route: string;
}

export interface MorningBriefing {
  greeting: string;
  date: string;
  day: number;
  readings: BriefingReading[];
  recommendation: string;
  attention: string;
}

export function morningBriefing(day = TOTAL_VALIDATION_DAYS): MorningBriefing {
  const score = institutionScore();
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const maint = getExecutiveSummary();
  const mem = memoryStats();
  const pulse = institutionPulse();
  const fwd = forwardSample();
  const ctx = pageContext();
  const today = dailyMetrics(day);
  const yesterday = dailyMetrics(Math.max(1, day - 1));
  const rec = recommendationFor(day);

  const trend = (a: number, b: number): 'up' | 'down' | 'flat' =>
    a - b > 0.4 ? 'up' : b - a > 0.4 ? 'down' : 'flat';

  const fwdPct = clamp((fwd.daysElapsed / fwd.daysRequired) * 100);
  const research = clamp(score.components[0]?.score ?? 78);
  const confidence = clamp(pulse.signals.find((s) => s.key === 'confidence')?.score ?? 84);

  const readings: BriefingReading[] = [
    { key: 'score', label: "Today's Institution Score", value: `${score.total}`, numeric: score.total, hint: `Grade ${score.grade} · weighted composite`, tone: toneFor(score.total), trend: trend(today.iq, yesterday.iq), route: '/institution/score' },
    { key: 'iq', label: 'Institution IQ', value: `${iq.total}`, numeric: iq.total, hint: `${iq.band} · ${iq.grade}`, tone: toneFor(iq.total), trend: trend(today.iq, yesterday.iq), route: '/institution/iq' },
    { key: 'readiness', label: 'Production Readiness', value: `${snap.score}%`, numeric: snap.score, hint: `${snap.blockers.length} blocker(s) · human approval required`, tone: toneFor(snap.score), trend: trend(today.readiness, yesterday.readiness), route: '/production-readiness' },
    { key: 'health', label: 'Institution Health', value: `${maint.institutionHealth}`, numeric: maint.institutionHealth, hint: `${maint.modulesHealthy}/${maint.modulesChecked} modules healthy`, tone: toneFor(maint.institutionHealth), trend: maint.criticalIssues ? 'down' : 'flat', route: '/maintenance/health' },
    { key: 'portfolio', label: 'Portfolio Status', value: `PF ${fwd.profitFactor.toFixed(2)}`, numeric: Math.round(fwd.profitFactor * 100), hint: `Drawdown ${fwd.maxDrawdown.toFixed(1)}% · win rate ${fwd.winRate}%`, tone: fwd.profitFactor >= fwd.profitFactorRequired ? 'healthy' : 'watch', trend: fwd.profitFactor >= fwd.profitFactorRequired ? 'up' : 'flat', route: '/portfolio-manager' },
    { key: 'research', label: 'Research Status', value: `${research}`, numeric: research, hint: `${ctx.objects} knowledge objects · ${ctx.evidence} evidence links`, tone: toneFor(research), trend: trend(today.research, yesterday.research), route: '/research' },
    { key: 'forward', label: 'Forward Validation', value: `${fwdPct}%`, numeric: fwdPct, hint: `Day ${fwd.daysElapsed} of ${fwd.daysRequired} · ${fwd.trades}/${fwd.tradesRequired} trades`, tone: toneFor(fwdPct + 20), trend: 'up', route: '/forward-validation' },
    { key: 'confidence', label: 'Executive Confidence', value: `${confidence}%`, numeric: confidence, hint: 'Advisory confidence, deliberately below research confidence', tone: toneFor(confidence), trend: trend(today.confidence, yesterday.confidence), route: '/decision-centre' },
    { key: 'memory', label: 'Memory Growth', value: `${mem.total}`, numeric: mem.total, hint: `${mem.citations} citations · ${mem.citationRate}% cited`, tone: toneFor(mem.citationRate), trend: 'up', route: '/institution/memory' },
  ];

  return {
    greeting: 'Good Morning, Founder',
    date: new Date(today.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    day,
    readings,
    recommendation: `${rec.kind} — ${rec.next}`,
    attention:
      snap.blockers.length > 0
        ? `If today ended now, ${snap.blockers[0].title.toLowerCase()} is what deserves your attention.`
        : 'If today ended now, nothing would require your intervention — forward validation simply needs more days.',
  };
}

/* ── Today's focus ──────────────────────────────────────────────── */

export interface FocusItem {
  id: string;
  rank: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail: string;
  action: string;
  route: string;
}

export function todaysFocus(day = TOTAL_VALIDATION_DAYS): FocusItem[] {
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const summary = centreSummary();
  const maint = getExecutiveSummary();
  const mem = memoryStats();
  const recs = institutionRecommendations();

  const items: FocusItem[] = [];

  items.push({
    id: 'focus-forward',
    rank: 'HIGH',
    title: 'Continue Forward Validation',
    detail: `${Math.max(0, fwd.daysRequired - fwd.daysElapsed)} days remaining · ${Math.max(0, fwd.tradesRequired - fwd.trades)} trades short of the sample requirement.`,
    action: 'Let it run. Do not change parameters mid-sample.',
    route: '/forward-validation',
  });

  if (summary.highPriority > 0) {
    items.push({
      id: 'focus-decisions',
      rank: 'HIGH',
      title: `${summary.highPriority} high-priority decision(s) awaiting judgement`,
      detail: `Oldest item has waited ${summary.oldestWaitingHours} hours · mean confidence ${summary.decisionConfidence}%.`,
      action: 'Clear the oldest item first in the Executive Decision Centre.',
      route: '/decision-centre',
    });
  }

  if (snap.blockers.length > 0) {
    items.push({
      id: 'focus-blocker',
      rank: 'HIGH',
      title: snap.blockers[0].title,
      detail: snap.blockers[0].detail,
      action: 'Close the gate with evidence, never with an exception.',
      route: snap.blockers[0].evidence.to,
    });
  }

  items.push({
    id: 'focus-research',
    rank: 'MEDIUM',
    title: recs[0]?.title ?? 'Research Quality',
    detail: recs[0]?.rationale ?? 'Several research objects would benefit from additional counter-evidence.',
    action: recs[0]?.expected ?? 'Add supporting evidence before the next promotion review.',
    route: recs[0]?.to ?? '/institution/quality',
  });

  items.push({
    id: 'focus-maintenance',
    rank: maint.criticalIssues > 0 ? 'HIGH' : maint.warnings > 0 ? 'MEDIUM' : 'LOW',
    title: 'Maintenance Queue',
    detail: `${maint.warnings} warning(s), ${maint.criticalIssues} critical across ${maint.modulesChecked} modules · ${maint.autoRepairsToday} auto-repairs applied today.`,
    action: maint.warnings > 0 ? 'Confirm nothing in the repair queue needs manual escalation.' : 'No action required today.',
    route: '/maintenance',
  });

  items.push({
    id: 'focus-memory',
    rank: 'LOW',
    title: 'Memory Review',
    detail: `${mem.total} records · ${mem.citationRate}% carry citations. Nothing is ever deleted.`,
    action: 'No action required today.',
    route: '/institution/memory',
  });

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
  return items.sort((a, b) => order[a.rank] - order[b.rank]);
}

/* ── Executive insights ─────────────────────────────────────────── */

export interface ExecInsight {
  id: string;
  observation: string;
  evidence: string;
  evidenceRoute: string;
  risk: string;
  recommendation: string;
  confidence: number;
  tone: Tone;
}

export function executiveInsights(day = TOTAL_VALIDATION_DAYS): ExecInsight[] {
  const mem = memoryStats();
  const recent = allMemory().slice(0, 12).filter((m) => m.citations.length > 0).length;
  const fwd = forwardSample();
  const snap = readinessSnapshot();
  const review = selfReview();
  const iq = institutionIQ();

  return [
    {
      id: 'ins-research',
      observation: 'Research quality is improving.',
      evidence: `${recent} of the last 12 memories are citation-backed · overall citation rate ${mem.citationRate}% across ${mem.total} records.`,
      evidenceRoute: '/institution/memory',
      risk: 'Citation rate can fall quickly if research output accelerates faster than evidence collection.',
      recommendation: 'Continue unchanged. Keep every new conclusion attached to at least one citation.',
      confidence: clamp(70 + mem.citationRate * 0.25),
      tone: 'healthy',
    },
    {
      id: 'ins-portfolio',
      observation: `Forward validation is tracking ${fwd.profitFactor >= fwd.profitFactorRequired ? 'above' : 'below'} its promotion threshold.`,
      evidence: `PF ${fwd.profitFactor.toFixed(2)} vs ${fwd.profitFactorRequired.toFixed(2)} required · drawdown ${fwd.maxDrawdown.toFixed(1)}% vs ${fwd.drawdownLimit}% limit · ${fwd.trades} of ${fwd.tradesRequired} trades.`,
      evidenceRoute: '/forward-validation',
      risk: 'The sample is still small. A short losing sequence would move profit factor materially.',
      recommendation: 'Hold parameters constant until the full sample completes. Do not promote early.',
      confidence: clamp(55 + (fwd.trades / fwd.tradesRequired) * 40),
      tone: fwd.profitFactor >= fwd.profitFactorRequired ? 'healthy' : 'watch',
    },
    {
      id: 'ins-readiness',
      observation: `Production readiness is ${snap.score}% and remains advisory only.`,
      evidence: `${snap.blockers.length} blocker(s) outstanding · self-review overall ${review.overall} (${review.overallTrend}) · Institution IQ ${iq.total}.`,
      evidenceRoute: '/production-readiness',
      risk: 'Readiness scores rise faster than governance evidence, which can create false confidence.',
      recommendation: 'Treat readiness as a measurement, not a permission. Human approval remains required.',
      confidence: clamp(60 + snap.score * 0.3),
      tone: snap.blockers.length > 1 ? 'warning' : 'watch',
    },
  ];
}

/* ── What changed overnight ─────────────────────────────────────── */

export interface OvernightChange {
  id: string;
  when: string;
  kind: string;
  department: string;
  text: string;
  route: string;
}

export function overnightChanges(limit = 16, day = TOTAL_VALIDATION_DAYS): OvernightChange[] {
  return eventStream(limit, day).map((e) => ({
    id: e.id, when: e.when, kind: e.kind, department: e.department, text: e.text, route: e.route,
  }));
}

/* ── Today's decisions ──────────────────────────────────────────── */

export interface DecisionGroup {
  key: string;
  label: string;
  items: DecisionItem[];
}

const GROUPS: { key: string; label: string; statuses: QueueStatus[] }[] = [
  { key: 'attention', label: 'Needs attention', statuses: ['needs-evidence'] },
  { key: 'waiting', label: 'Waiting', statuses: ['waiting'] },
  { key: 'ready', label: 'Ready', statuses: ['ready', 'approved'] },
  { key: 'blocked', label: 'Blocked', statuses: ['deferred'] },
  { key: 'declined', label: 'Declined', statuses: ['declined'] },
];

export function todaysDecisions(): DecisionGroup[] {
  const q = decisionQueue();
  return GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    items: q.filter((d) => g.statuses.includes(d.status)),
  })).filter((g) => g.items.length > 0);
}

export const decisionStatusLabel = (s: QueueStatus) => QUEUE_STATUS_LABEL[s] ?? s;

/* ── Executive watchlist ────────────────────────────────────────── */

export interface WatchItem {
  key: string;
  label: string;
  health: number;
  confidence: number;
  trend: 'up' | 'down' | 'flat';
  alerts: number;
  note: string;
  route: string;
  tone: Tone;
}

export function executiveWatchlist(day = TOTAL_VALIDATION_DAYS): WatchItem[] {
  const score = institutionScore();
  const snap = readinessSnapshot();
  const maint = getExecutiveSummary();
  const mem = memoryStats();
  const summary = centreSummary();
  const fwd = forwardSample();
  const pulse = institutionPulse();
  const alerts = missionAlerts(day);
  const m = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 3));
  const iq = institutionIQ();

  const t = (a: number, b: number): 'up' | 'down' | 'flat' => (a - b > 0.5 ? 'up' : b - a > 0.5 ? 'down' : 'flat');
  const countAlerts = (dept: string) => alerts.filter((a) => a.department.toLowerCase().includes(dept)).length;

  const rows: Omit<WatchItem, 'tone'>[] = [
    { key: 'research', label: 'Research', health: clamp(score.components[0]?.score ?? 78), confidence: clamp(m.research), trend: t(m.research, prev.research), alerts: countAlerts('research'), note: 'Research pipeline confidence and validated output.', route: '/research' },
    { key: 'portfolio', label: 'Portfolio', health: clamp(fwd.profitFactor * 45), confidence: clamp(m.stability), trend: t(m.stability, prev.stability), alerts: 0, note: `PF ${fwd.profitFactor.toFixed(2)} · drawdown ${fwd.maxDrawdown.toFixed(1)}%.`, route: '/portfolio-manager' },
    { key: 'forward', label: 'Forward Validation', health: clamp((fwd.daysElapsed / fwd.daysRequired) * 100 + 25), confidence: clamp(55 + (fwd.trades / fwd.tradesRequired) * 40), trend: 'up', alerts: countAlerts('forward'), note: `Day ${fwd.daysElapsed} of ${fwd.daysRequired}.`, route: '/forward-validation' },
    { key: 'maintenance', label: 'Maintenance', health: maint.institutionHealth, confidence: clamp(maint.performanceScore), trend: maint.criticalIssues ? 'down' : 'flat', alerts: maint.warnings, note: `${maint.warnings} warning(s), ${maint.autoRepairsToday} auto-repairs today.`, route: '/maintenance' },
    { key: 'oracle', label: 'Oracle', health: clamp(iq.total), confidence: clamp(iq.total - 4), trend: 'flat', alerts: 0, note: 'Explainability engine answering executive questions.', route: '/oracle' },
    { key: 'memory', label: 'Memory', health: clamp(mem.citationRate), confidence: clamp(m.memoryQuality), trend: t(m.memoryQuality, prev.memoryQuality), alerts: 0, note: `${mem.total} records · ${mem.citations} citations.`, route: '/institution/memory' },
    { key: 'governance', label: 'Governance', health: clamp(pulse.signals.find((s) => s.key === 'governance')?.score ?? 92), confidence: clamp(summary.governanceHealth), trend: t(m.governance, prev.governance), alerts: countAlerts('decision'), note: `${summary.open} open decision(s) · human approval required.`, route: '/governance' },
    { key: 'trade-review', label: 'Trade Review', health: clamp(88), confidence: clamp(m.confidence), trend: t(m.confidence, prev.confidence), alerts: 0, note: `${m.tradeReviews} simulated trades fully audited.`, route: '/trade-review' },
    { key: 'daily', label: 'Institution Daily', health: clamp(snap.score + 12), confidence: clamp(m.readiness), trend: t(m.readiness, prev.readiness), alerts: 0, note: `Validation day ${day} briefing sealed as evidence.`, route: '/institution-daily' },
  ].map((r) => ({ ...r, tone: toneFor(r.health) }));

  return rows;
}

/* ── Institution pulse (animated) ───────────────────────────────── */

export interface PulseReading { key: string; label: string; score: number; note: string; route: string; tone: Tone }

export function pulseReadings(): PulseReading[] {
  const score = institutionScore();
  const iq = institutionIQ();
  const maint = getExecutiveSummary();
  const mem = memoryStats();
  const ctx = pageContext();
  const pulse = institutionPulse();
  const fwd = forwardSample();

  const get = (k: string, fallback: number) => clamp(pulse.signals.find((s) => s.key === k)?.score ?? fallback);

  return [
    { key: 'score', label: 'Score', score: score.total, note: `Grade ${score.grade}`, route: '/institution/score' },
    { key: 'health', label: 'Health', score: maint.institutionHealth, note: `${maint.modulesHealthy}/${maint.modulesChecked} modules healthy`, route: '/maintenance/health' },
    { key: 'knowledge', label: 'Knowledge', score: clamp(iq.total), note: `${ctx.objects} objects · ${ctx.relationships} links`, route: '/knowledge-graph' },
    { key: 'confidence', label: 'Confidence', score: get('confidence', 84), note: 'Executive advisory confidence', route: '/decision-centre' },
    { key: 'memory', label: 'Memory', score: clamp(mem.citationRate), note: `${mem.total} records retained`, route: '/institution/memory' },
    { key: 'research', label: 'Research', score: clamp(score.components[0]?.score ?? 78), note: `${ctx.evidence} evidence links`, route: '/research' },
    { key: 'governance', label: 'Governance', score: get('governance', 92), note: 'Human approval required', route: '/governance' },
    { key: 'portfolio', label: 'Portfolio', score: clamp(fwd.profitFactor * 45), note: `PF ${fwd.profitFactor.toFixed(2)}`, route: '/portfolio-manager' },
  ].map((r) => ({ ...r, tone: toneFor(r.score) }));
}

/* ── Founder actions ────────────────────────────────────────────── */

export const FOUNDER_ACTIONS: { label: string; to: string; note: string }[] = [
  { label: 'Founder Office', to: '/founders-office', note: 'Private executive workspace' },
  { label: 'Review Decisions', to: '/decision-centre', note: 'Executive decision queue' },
  { label: 'Institution Daily', to: '/institution-daily', note: "Today's validation briefing" },
  { label: 'Trade Review', to: '/trade-review', note: 'Full simulated audit trail' },
  { label: 'Production Readiness', to: '/production-readiness', note: 'Advisory governance gates' },
  { label: 'Forward Validation', to: '/forward-validation', note: 'Live validation programme' },
  { label: 'Mission Control', to: '/mission-control', note: 'Live operational centre' },
  { label: 'Oracle', to: '/oracle', note: 'Ask the institution anything' },
  { label: 'Analytics', to: '/institution/analytics', note: 'Institutional analytics' },
  { label: 'Memory', to: '/institution/memory', note: 'Permanent institutional memory' },
  { label: 'Audit Vault', to: '/audit-vault', note: 'Immutable institutional history' },
];

/* ── Executive forecast ─────────────────────────────────────────── */

export interface ForecastRow { label: string; now: number; d7: number; d30: number; d90: number; why: string; unit?: string }

export interface ForecastHorizon { horizon: '7 Days' | '30 Days' | '90 Days'; headline: string; why: string }

export function executiveForecast(): { rows: ForecastRow[]; horizons: ForecastHorizon[]; trajectory: string; drivers: string[] } {
  const iq = institutionIQ();
  const maint = getExecutiveSummary();
  const snap = readinessSnapshot();
  const mem = memoryStats();
  const pulse = institutionPulse();
  const fwd = forwardSample();
  const life = institutionForecast().slice(0, 3);

  const proj = (now: number, perDay: number) => ({
    d7: clamp(now + perDay * 7),
    d30: clamp(now + perDay * 30),
    d90: clamp(now + perDay * 90),
  });

  const mk = (label: string, now: number, perDay: number, why: string): ForecastRow => ({ label, now: clamp(now), ...proj(now, perDay), why });

  const rows: ForecastRow[] = [
    mk('Institution IQ', iq.total, 0.09, 'IQ grows with each citation-backed memory and each new explainable relationship. Growth is deliberately slow because evidence, not output, drives it.'),
    mk('Institution Health', maint.institutionHealth, 0.03, `Health is stable at ${maint.institutionHealth} with ${maint.warnings} open warning(s); nightly auto-repair clears most findings before they compound.`),
    mk('Production Readiness', snap.score, 0.16, `Readiness rises as forward-validation days accumulate. ${snap.blockers.length} blocker(s) remain and cannot be cleared by time alone.`),
    mk('Executive Confidence', clamp(pulse.signals.find((s) => s.key === 'confidence')?.score ?? 84), 0.06, 'Confidence tracks sample size. It will rise as the forward-validation trade count approaches the required sample.'),
    mk('Governance Health', clamp(pulse.signals.find((s) => s.key === 'governance')?.score ?? 92), 0.02, 'Governance is already near ceiling. It only improves by closing gates with evidence, and only a human can do that.'),
    mk('Memory Citation Rate', mem.citationRate, 0.05, `${mem.total} records are retained permanently; the citation rate improves as older uncited records are superseded by cited ones.`),
  ];

  const horizons: ForecastHorizon[] = [
    {
      horizon: '7 Days',
      headline: `Forward validation reaches day ${Math.min(fwd.daysRequired, fwd.daysElapsed + 7)} of ${fwd.daysRequired}.`,
      why: 'Nothing material changes in a week. The sample simply grows, and readiness moves with it.',
    },
    {
      horizon: '30 Days',
      headline: `Sample requirement close to satisfied · readiness approximately ${clamp(snap.score + 0.16 * 30)}%.`,
      why: `At the current rate the trade count passes ${fwd.tradesRequired} and the first genuine promotion review becomes possible.`,
    },
    {
      horizon: '90 Days',
      headline: `Institution IQ approximately ${clamp(iq.total + 0.09 * 90)} with a mature evidence base.`,
      why: 'Three months of unchanged parameters produces the longest clean sample the institution has ever held.',
    },
  ];

  return {
    rows,
    horizons,
    trajectory: 'Steady improvement with no structural risk. Every gain comes from evidence accumulation, not from parameter changes.',
    drivers: life.map((f) => `${f.title} — ${f.probability}% likely ${f.horizon}.`),
  };
}

/* ── ATLAS Advisor ──────────────────────────────────────────────── */

export interface Advisor { lines: string[]; confidence: number; tone: Tone }

export function atlasAdvisor(day = TOTAL_VALIDATION_DAYS): Advisor {
  const snap = readinessSnapshot();
  const summary = centreSummary();
  const fwd = forwardSample();
  const mem = memoryStats();
  const maint = getExecutiveSummary();

  const lines = ['Founder,'];

  if (summary.highPriority > 0) {
    lines.push(`${summary.highPriority} decision(s) carry high priority and have waited ${summary.oldestWaitingHours} hours.`);
    lines.push('Rule on the oldest item before anything else today.');
  } else if (maint.criticalIssues > 0) {
    lines.push(`${maint.criticalIssues} critical maintenance finding(s) are open across ${maint.modulesChecked} modules.`);
    lines.push('Review the auto-repair queue before reading anything else.');
  } else {
    lines.push('Nothing requires intervention today.');
  }

  lines.push(`Continue forward validation — day ${fwd.daysElapsed} of ${fwd.daysRequired}, ${fwd.trades} of ${fwd.tradesRequired} trades.`);
  lines.push('Do not change parameters. Changing them restarts the sample.');
  lines.push(`The evidence continues to improve: ${mem.total} memories retained, ${mem.citationRate}% citation-backed.`);
  lines.push(`Production readiness stands at ${snap.score}% and remains advisory. Only you can approve promotion.`);

  const confidence = clamp(72 + snap.score * 0.15 + mem.citationRate * 0.1 - summary.highPriority * 3);
  return { lines, confidence, tone: toneFor(confidence) };
}
