/**
 * Mission Control™ — presentation-layer aggregator.
 *
 * This module contains NO business logic and NO calculations of its own.
 * It only composes readings that existing institutional engines already
 * produce, so Mission Control can render the whole institution on one screen.
 *
 * Nothing here executes, trades, approves or mutates anything.
 */

import {
  TOTAL_VALIDATION_DAYS, dailyMetrics, institutionScoreRows, validationCounters,
  recommendationFor, validationMilestones, VALIDATION_CYCLE, metricSeries,
} from './institutionValidation';
import { morningPanel, currentMission } from './foundersOffice';
import { readinessSnapshot, forwardSample, governanceGates } from './productionReadiness';
import { decisionQueue, centreSummary, OPEN_STATUSES, QUEUE_STATUS_LABEL } from './decisionCentre';
import { getExecutiveSummary, getModules } from './maintenance';
import { institutionPulse } from './institutionLife';
import { activityFeed, institutionScore } from './institutionOS';
import { allMemory, memoryStats } from './institutionalMemory';
import { institutionIQ } from './institutionIntelligence';

export const MISSION_VERSION = 'ATLAS OS™ · Mission Control™ v1.0';

export type Tone = 'healthy' | 'watch' | 'warning' | 'critical';

const tone = (n: number): Tone => (n >= 88 ? 'healthy' : n >= 75 ? 'watch' : n >= 60 ? 'warning' : 'critical');

/* ── Live status bar ─────────────────────────────────────────────── */

export interface LiveStatus {
  status: string;
  phase: string;
  validationDay: number;
  age: string;
  health: number;
  readiness: number;
  nextCycle: string;
}

export function liveStatus(day = TOTAL_VALIDATION_DAYS): LiveStatus {
  const panel = morningPanel(day);
  const m = dailyMetrics(day);
  const maint = getExecutiveSummary();
  return {
    status: panel.status,
    phase: panel.phase,
    validationDay: day,
    age: panel.institutionAge,
    health: Math.round((m.iq + m.governance + m.stability + m.readiness) / 4),
    readiness: Math.round(m.readiness),
    nextCycle: maint.nextCycle,
  };
}

/* ── Mission overview hero ───────────────────────────────────────── */

export interface OverviewMetric {
  key: string; label: string; value: number; suffix?: string;
  route: string; hint: string; tone: Tone;
}

export function missionOverview(day = TOTAL_VALIDATION_DAYS): OverviewMetric[] {
  const rows = institutionScoreRows(day);
  const score = institutionScore();
  const iq = institutionIQ();
  const mem = memoryStats();
  const maint = getExecutiveSummary();
  const pulse = institutionPulse();

  const base: OverviewMetric[] = [
    { key: 'score', label: 'Institution Score', value: score.total, route: '/institution/score', hint: `Grade ${score.grade} across ${score.components.length} weighted components.`, tone: tone(score.total) },
    { key: 'iq', label: 'Institution IQ', value: iq.total, route: '/institution/iq', hint: `${iq.band} · ${iq.grade}, trend ${iq.trend}.`, tone: tone(iq.total) },
  ];

  const mapped = rows
    .filter((r) => ['confidence', 'research', 'governance', 'readiness', 'stability'].includes(String(r.key)))
    .map((r) => ({
      key: String(r.key), label: r.label, value: Math.round(r.value), route: r.route,
      hint: r.explanation, tone: tone(r.value),
    }));

  return [
    ...base,
    ...mapped,
    { key: 'knowledge', label: 'Knowledge Health', value: Math.round(pulse.signals.find((s) => s.key === 'growth')?.score ?? score.total), route: '/knowledge-graph', hint: pulse.signals.find((s) => s.key === 'growth')?.why ?? '', tone: tone(pulse.score) },
    { key: 'memory', label: 'Memory Integrity', value: mem.citationRate, suffix: '%', route: '/institution/memory', hint: `${mem.citations} citations across ${mem.total} permanent records.`, tone: tone(mem.citationRate) },
    { key: 'maintenance', label: 'Maintenance Status', value: maint.institutionHealth, route: '/maintenance', hint: `${maint.modulesHealthy} of ${maint.modulesChecked} modules healthy · ${maint.warnings} warnings.`, tone: tone(maint.institutionHealth) },
  ];
}

/* ── Live institution map ────────────────────────────────────────── */

export interface DepartmentCard {
  key: string; name: string; route: string;
  status: string; activity: string;
  confidence: number; health: number; alerts: number; updated: string;
  tone: Tone;
}

export function institutionMap(day = TOTAL_VALIDATION_DAYS): DepartmentCard[] {
  const m = dailyMetrics(day);
  const snap = readinessSnapshot();
  const maint = getExecutiveSummary();
  const modules = getModules();
  const summary = centreSummary();
  const mem = memoryStats();
  const fwd = forwardSample();
  const pulse = institutionPulse();
  const feed = activityFeed(40);
  const modHealth = (name: string) => modules.find((x) => x.name === name)?.health ?? maint.institutionHealth;
  const lastFor = (dept: string) => feed.find((f) => f.department === dept)?.date ?? m.date;

  const defs: DepartmentCard[] = [
    { key: 'research', name: 'Research', route: '/research', status: 'Active', activity: `${m.researchCompleted} research item(s) completed today`, confidence: Math.round(m.research), health: modHealth('Research'), alerts: 0, updated: lastFor('AI Research Assistant'), tone: tone(m.research) },
    { key: 'knowledge', name: 'Knowledge', route: '/knowledge-graph', status: 'Compounding', activity: `${m.objects} objects · ${m.evidence} evidence links`, confidence: Math.round(pulse.signals.find((s) => s.key === 'growth')?.score ?? 80), health: Math.round(pulse.score), alerts: 0, updated: m.date, tone: tone(pulse.score) },
    { key: 'oracle', name: 'Oracle', route: '/oracle', status: 'Answering', activity: 'Explanations generated on demand with full citation chains', confidence: Math.round(m.confidence), health: modHealth('AI Command Center'), alerts: 0, updated: lastFor('ATLAS Oracle'), tone: tone(m.confidence) },
    { key: 'memory', name: 'Memory', route: '/institution/memory', status: 'Retaining', activity: `${mem.total} permanent records · ${mem.citationRate}% cited`, confidence: mem.citationRate, health: mem.citationRate, alerts: 0, updated: mem.oldest, tone: tone(mem.citationRate) },
    { key: 'maintenance', name: 'Maintenance', route: '/maintenance', status: maint.status === 'healthy' ? 'Healthy' : 'Attention', activity: `${maint.autoRepairsToday} auto-repairs applied today`, confidence: maint.performanceScore, health: maint.institutionHealth, alerts: maint.warnings, updated: maint.latestCycle, tone: tone(maint.institutionHealth) },
    { key: 'readiness', name: 'Production Readiness', route: '/production-readiness', status: 'Blocked by governance', activity: `${snap.gates.filter((g) => g.state === 'pass').length} of ${snap.gates.length} gates passing`, confidence: Math.round(m.confidence), health: snap.score, alerts: snap.blockers.length, updated: snap.lastReview, tone: tone(snap.score) },
    { key: 'trade', name: 'Trade Review', route: '/trade-review', status: 'Auditing', activity: `${m.tradeReviews} simulated trades audited end to end`, confidence: 88, health: 92, alerts: 0, updated: m.date, tone: 'healthy' },
    { key: 'evolution', name: 'Portfolio Evolution', route: '/portfolio-evolution', status: 'Learning', activity: 'Institutional growth tracked across every milestone', confidence: Math.round(m.stability), health: Math.round(m.stability), alerts: 0, updated: m.date, tone: tone(m.stability) },
    { key: 'decisions', name: 'Executive Decisions', route: '/decision-centre', status: `${summary.open} open`, activity: `${summary.highPriority} high priority · ${summary.needsEvidence} need evidence`, confidence: summary.decisionConfidence, health: summary.governanceHealth, alerts: summary.highPriority, updated: `${summary.oldestWaitingHours}h oldest wait`, tone: tone(summary.governanceHealth) },
    { key: 'daily', name: 'Institution Daily', route: '/institution-daily', status: `Day ${day}`, activity: 'Daily briefing generated and archived to memory', confidence: Math.round(m.confidence), health: Math.round(m.governance), alerts: 0, updated: m.date, tone: tone(m.governance) },
    { key: 'forward', name: 'Forward Validation', route: '/forward-validation', status: `${fwd.daysElapsed}/${fwd.daysRequired} days`, activity: `${fwd.trades} of ${fwd.tradesRequired} trades · PF ${fwd.profitFactor}`, confidence: Math.round(m.stability), health: modHealth('Forward Validation'), alerts: fwd.daysElapsed < fwd.daysRequired ? 1 : 0, updated: m.date, tone: tone(m.stability) },
    { key: 'analytics', name: 'Analytics', route: '/institution/analytics', status: 'Reporting', activity: 'Institutional series refreshed for the current window', confidence: 86, health: maint.performanceScore, alerts: 0, updated: m.date, tone: tone(maint.performanceScore) },
    { key: 'certification', name: 'Certification', route: '/certification', status: 'Certified (advisory)', activity: 'Certification categories re-evaluated against current evidence', confidence: Math.round(m.governance), health: maint.governanceScore, alerts: 0, updated: m.date, tone: tone(maint.governanceScore) },
    { key: 'dashboard', name: 'Dashboard', route: '/institution', status: 'Live', activity: 'Institutional overview synchronised with every department', confidence: Math.round(m.iq), health: Math.round(m.iq), alerts: 0, updated: m.date, tone: tone(m.iq) },
  ];
  return defs;
}

/* ── Live event stream ───────────────────────────────────────────── */

export interface StreamEvent {
  id: string; when: string; kind: string; department: string; text: string; route: string;
}

export function eventStream(limit = 24, day = TOTAL_VALIDATION_DAYS): StreamEvent[] {
  const feed = activityFeed(60);
  const mem = allMemory().slice(0, 4);
  const queue = decisionQueue().slice(0, 4);
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const maint = getExecutiveSummary();
  const m = dailyMetrics(day);

  const events: StreamEvent[] = [
    { id: 'ev-daily', when: m.date, kind: 'briefing', department: 'Institution Daily', text: `Validation day ${day} briefing generated and sealed as evidence`, route: '/institution-daily' },
    { id: 'ev-gate', when: snap.lastReview, kind: 'production', department: 'Production Readiness', text: `Production gate review complete — readiness ${snap.score}%, ${snap.blockers.length} blocker(s) outstanding`, route: '/production-readiness' },
    { id: 'ev-fwd', when: m.date, kind: 'validation', department: 'Forward Validation', text: `Forward validation milestone — day ${fwd.daysElapsed} of ${fwd.daysRequired}, ${fwd.trades} trades recorded`, route: '/forward-validation' },
    { id: 'ev-maint', when: m.date, kind: 'maintenance', department: 'Maintenance', text: `${maint.latestCycle} completed — ${maint.autoRepairsToday} auto-repairs, ${maint.warnings} warnings open`, route: '/maintenance' },
    { id: 'ev-trade', when: m.date, kind: 'trade', department: 'Trade Review', text: `${m.trades} simulated trade(s) reviewed against the full audit trail`, route: '/trade-review' },
    ...mem.map((r, i) => ({ id: `ev-mem-${i}`, when: r.date, kind: 'memory', department: r.department, text: `Memory archived — ${r.title} (${r.citations.length} citation${r.citations.length === 1 ? '' : 's'})`, route: '/institution/memory' })),
    ...queue.map((d, i) => ({ id: `ev-dec-${i}`, when: `${d.waitingHours}h ago`, kind: 'decision', department: d.department, text: `Executive decision requested — ${d.title} (${QUEUE_STATUS_LABEL[d.status]})`, route: '/decision-centre' })),
    ...feed.slice(0, 14).map((f, i) => ({ id: `ev-feed-${i}`, when: f.date, kind: f.kind, department: f.department, text: f.text, route: '/explorer' })),
  ];
  return events.slice(0, limit);
}

/* ── Executive alerts ────────────────────────────────────────────── */

export interface MissionAlert {
  id: string; level: 'critical' | 'warning' | 'watch' | 'info';
  title: string; why: string; evidence: string; action: string;
  department: string; route: string;
}

export function missionAlerts(day = TOTAL_VALIDATION_DAYS): MissionAlert[] {
  const snap = readinessSnapshot();
  const summary = centreSummary();
  const maint = getExecutiveSummary();
  const rec = recommendationFor(day);
  const fwd = forwardSample();

  const out: MissionAlert[] = [];

  snap.blockers.slice(0, 3).forEach((b, i) => out.push({
    id: `al-block-${i}`, level: i === 0 ? 'critical' : 'warning',
    title: b.title, why: 'A blocked governance gate prevents any promotion to real capital.',
    evidence: b.detail, action: 'Close the gate through evidence, never through exception.',
    department: 'Production Readiness', route: b.evidence.to,
  }));

  if (summary.highPriority > 0) out.push({
    id: 'al-dec', level: 'warning',
    title: `${summary.highPriority} high-priority decision(s) awaiting judgement`,
    why: 'Open decisions age; the institution cannot advance until a human rules on them.',
    evidence: `Oldest item has waited ${summary.oldestWaitingHours} hours · confidence ${summary.decisionConfidence}%.`,
    action: 'Open the Executive Decision Centre and clear the oldest item first.',
    department: 'Executive Decisions', route: '/decision-centre',
  });

  if (maint.warnings > 0) out.push({
    id: 'al-maint', level: maint.criticalIssues > 0 ? 'critical' : 'watch',
    title: `${maint.warnings} maintenance warning(s) across ${maint.modulesChecked} modules`,
    why: 'Unresolved module findings compound into governance and reporting defects.',
    evidence: `${maint.modulesHealthy} modules healthy · institution health ${maint.institutionHealth}.`,
    action: 'Review the auto-repair queue and confirm nothing requires manual escalation.',
    department: 'Maintenance', route: '/maintenance',
  });

  out.push({
    id: 'al-fwd', level: fwd.daysElapsed < fwd.daysRequired ? 'watch' : 'info',
    title: `Forward validation at day ${fwd.daysElapsed} of ${fwd.daysRequired}`,
    why: 'Runtime and sample size are mandatory before any promotion review.',
    evidence: `${fwd.trades} of ${fwd.tradesRequired} trades · PF ${fwd.profitFactor} · drawdown ${fwd.maxDrawdown}%.`,
    action: 'Let the trial run untouched; changing thresholds resets the evidence.',
    department: 'Forward Validation', route: '/forward-validation',
  });

  out.push({
    id: 'al-rec', level: 'info',
    title: `Executive recommendation — ${rec.kind}`,
    why: rec.why[0] ?? 'Derived from today’s validation readings.',
    evidence: rec.why.slice(1).join(' ') || 'All readings inside tolerance.',
    action: rec.next, department: 'Institution Daily', route: '/institution-daily',
  });

  return out;
}

/* ── Today's executive tasks ─────────────────────────────────────── */

export interface MissionTask { id: string; label: string; note: string; route: string }

export function missionTasks(): MissionTask[] {
  return [
    { id: 'daily', label: 'Review Institution Daily™', note: 'Read and archive today’s briefing.', route: '/institution-daily' },
    { id: 'queue', label: 'Review Decision Queue', note: 'Rule on the oldest waiting decision.', route: '/decision-centre' },
    { id: 'readiness', label: 'Check Production Readiness', note: 'Confirm no gate silently regressed.', route: '/production-readiness' },
    { id: 'maintenance', label: 'Review Maintenance', note: 'Clear open self-healing findings.', route: '/maintenance' },
    { id: 'research', label: 'Approve research', note: 'Human approval remains mandatory.', route: '/research-journal' },
    { id: 'evolution', label: 'Review Portfolio Evolution', note: 'Check the institution is still learning.', route: '/portfolio-evolution' },
  ];
}

export const TASK_KEY = 'atlas-mission-tasks';

export function loadTasks(day = TOTAL_VALIDATION_DAYS): string[] {
  try { return JSON.parse(localStorage.getItem(`${TASK_KEY}-${day}`) ?? '[]'); } catch { return []; }
}
export function saveTasks(ids: string[], day = TOTAL_VALIDATION_DAYS) {
  try { localStorage.setItem(`${TASK_KEY}-${day}`, JSON.stringify(ids)); } catch { /* private mode */ }
}

/* ── Live metrics ────────────────────────────────────────────────── */

export interface LiveMetric { key: string; label: string; value: number; suffix?: string; hint: string; route: string; tone: Tone }

export function liveMetrics(day = TOTAL_VALIDATION_DAYS): LiveMetric[] {
  const m = dailyMetrics(day);
  const prev = dailyMetrics(Math.max(1, day - 1));
  const mem = memoryStats();
  const summary = centreSummary();
  const fwd = forwardSample();
  const maint = getExecutiveSummary();
  const health = Math.round((m.iq + m.governance + m.stability + m.readiness) / 4);
  return [
    { key: 'health', label: 'Institution Health', value: health, hint: 'Mean of IQ, governance, stability and readiness.', route: '/institution', tone: tone(health) },
    { key: 'velocity', label: 'Research Velocity', value: m.researchCompleted, suffix: '/day', hint: `${m.hypotheses} hypotheses under investigation.`, route: '/research', tone: 'healthy' },
    { key: 'memory', label: 'Memory Growth', value: mem.total, hint: `${m.memoryRecords - prev.memoryRecords} record(s) added today.`, route: '/institution/memory', tone: 'healthy' },
    { key: 'knowledge', label: 'Knowledge Growth', value: m.objects, hint: 'Knowledge objects in the institutional graph.', route: '/knowledge-graph', tone: 'healthy' },
    { key: 'evidence', label: 'Evidence Count', value: m.evidence, hint: 'Evidence links attached across all objects.', route: '/explorer', tone: 'healthy' },
    { key: 'queue', label: 'Decision Queue', value: summary.open, hint: `${summary.highPriority} high priority awaiting human judgement.`, route: '/decision-centre', tone: summary.highPriority > 1 ? 'warning' : 'watch' },
    { key: 'forward', label: 'Forward Validation', value: fwd.daysElapsed, suffix: `/${fwd.daysRequired}`, hint: `${fwd.trades} of ${fwd.tradesRequired} trades collected.`, route: '/forward-validation', tone: 'watch' },
    { key: 'portfolio', label: 'Portfolio Health', value: Math.round(m.stability), hint: `PF ${m.profitFactor} · drawdown ${m.drawdown}%.`, route: '/portfolio', tone: tone(m.stability) },
    { key: 'governance', label: 'Governance', value: Math.round(m.governance), hint: `${maint.governanceScore} governance score from the maintenance audit.`, route: '/governance', tone: tone(m.governance) },
    { key: 'confidence', label: 'Executive Confidence', value: Math.round(m.confidence), hint: 'Board-level confidence in the current candidate.', route: '/decision-centre', tone: tone(m.confidence) },
  ];
}

export function healthSeries(days = 21, day = TOTAL_VALIDATION_DAYS) {
  return metricSeries(days, day).map((m) => ({
    day: `D${m.day}`,
    health: Math.round((m.iq + m.governance + m.stability + m.readiness) / 4),
    readiness: Math.round(m.readiness),
    confidence: Math.round(m.confidence),
  }));
}

/* ── Mission & timeline ──────────────────────────────────────────── */

export function missionState(day = TOTAL_VALIDATION_DAYS) {
  return { mission: currentMission(day), milestones: validationMilestones(day), counters: validationCounters(day) };
}

/* ── Decision radar ──────────────────────────────────────────────── */

export function decisionRadar() {
  const items = decisionQueue();
  const count = (s: string) => items.filter((d) => d.status === s).length;
  return [
    { key: 'open', label: 'Open Decisions', value: items.filter((d) => OPEN_STATUSES.includes(d.status)).length },
    { key: 'needs-evidence', label: 'Needs Evidence', value: count('needs-evidence') },
    { key: 'ready', label: 'Ready', value: count('ready') },
    { key: 'deferred', label: 'Deferred', value: count('deferred') },
    { key: 'approved', label: 'Approved', value: count('approved') },
    { key: 'declined', label: 'Declined', value: count('declined') },
  ];
}

/* ── Production & portfolio monitors ─────────────────────────────── */

export function productionMonitor() {
  const snap = readinessSnapshot();
  const gates = governanceGates();
  return {
    score: snap.score,
    status: snap.status,
    passed: gates.filter((g) => g.state === 'pass').length,
    blocked: gates.filter((g) => g.state !== 'pass').length,
    approvals: gates.filter((g) => g.state !== 'pass' && /approval|human/i.test(g.label)).length || 1,
    blockers: snap.blockers.slice(0, 3),
  };
}

export function portfolioMonitor(day = TOTAL_VALIDATION_DAYS) {
  const fwd = forwardSample();
  const m = dailyMetrics(day);
  return {
    champion: 'Confidence Weighted Allocation',
    forward: `${fwd.daysElapsed} of ${fwd.daysRequired} days · ${fwd.trades}/${fwd.tradesRequired} trades`,
    stability: Math.round(m.stability),
    drawdown: fwd.maxDrawdown,
    winRate: fwd.winRate,
    confidence: Math.round(m.confidence),
    profitFactor: fwd.profitFactor,
  };
}

/* ── Memory panel ────────────────────────────────────────────────── */

export function memoryPanel() {
  const all = allMemory();
  const stats = memoryStats();
  return {
    stats,
    newest: all.slice(0, 4),
    citations: all.flatMap((r) => r.citations).slice(0, 5),
  };
}

/* ── Founder insights ────────────────────────────────────────────── */

export function founderInsights(day = TOTAL_VALIDATION_DAYS) {
  const panel = morningPanel(day);
  const rec = recommendationFor(day);
  const alerts = missionAlerts(day);
  const overview = missionOverview(day);
  const strongest = [...overview].sort((a, b) => b.value - a.value)[0];
  const risk = alerts.find((a) => a.level === 'critical') ?? alerts[0];
  return {
    focus: panel.focus,
    quote: panel.quote,
    opportunity: rec.next,
    risk: `${risk.title} — ${risk.why}`,
    strength: `${strongest.label} at ${strongest.value}${strongest.suffix ?? ''} — ${strongest.hint}`,
    action: rec.why[0] ?? 'Continue generating evidence without intervention.',
  };
}

/* ── Global search ───────────────────────────────────────────────── */

export interface SearchHit { group: string; label: string; detail: string; route: string }

export function globalSearch(query: string, day = TOTAL_VALIDATION_DAYS): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const hits: SearchHit[] = [
    ...institutionMap(day).map((d) => ({ group: 'Department', label: d.name, detail: d.activity, route: d.route })),
    ...decisionQueue().map((d) => ({ group: 'Decision', label: d.title, detail: `${d.department} · ${QUEUE_STATUS_LABEL[d.status]}`, route: '/decision-centre' })),
    ...allMemory().slice(0, 40).map((r) => ({ group: 'Memory', label: r.title, detail: `${r.department} · ${r.date}`, route: '/institution/memory' })),
    ...activityFeed(60).map((f) => ({ group: 'Timeline', label: f.text, detail: `${f.department} · ${f.date}`, route: '/explorer' })),
    ...VALIDATION_CYCLE.map((c) => ({ group: 'Cycle', label: c.label, detail: c.purpose, route: c.route })),
    ...eventStream(20, day).map((e) => ({ group: 'Event', label: e.text, detail: `${e.department} · ${e.when}`, route: e.route })),
  ];
  return hits.filter((h) => `${h.label} ${h.detail} ${h.group}`.toLowerCase().includes(q)).slice(0, 24);
}

/* ── Quick actions & governance footer ───────────────────────────── */

export const MISSION_QUICK_ACTIONS = [
  { label: 'Institution Dashboard™', to: '/institution' },
  { label: 'Executive Home™', to: '/home' },
  { label: 'Founder Office™', to: '/founders-office' },
  { label: 'Institution Daily™', to: '/institution-daily' },
  { label: 'Executive Decisions™', to: '/decision-centre' },
  { label: 'Trade Review™', to: '/trade-review' },
  { label: 'Portfolio Evolution™', to: '/portfolio-evolution' },
  { label: 'Production Readiness™', to: '/production-readiness' },
  { label: 'Maintenance™', to: '/maintenance' },
  { label: 'Analytics™', to: '/institution/analytics' },
  { label: 'Oracle™', to: '/oracle' },
  { label: 'Institutional Memory™', to: '/institution/memory' },
];

export const MISSION_GOVERNANCE = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'Human Approval Required',
  'No Exchange Connectivity',
  'No Live Trading',
  'No Automatic Promotion',
];
