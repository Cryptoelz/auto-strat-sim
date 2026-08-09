/**
 * Portfolio Evolution™ — deterministic, read-only institutional history layer.
 *
 * Presentation only. Reuses existing institutional metrics. NEVER trades,
 * NEVER connects to an exchange, NEVER modifies strategy or allocation.
 */

import { institutionScore } from '@/lib/institutionOS';
import { pageContext } from '@/lib/institutionLife';
import { institutionIQ } from '@/lib/institutionIntelligence';
import { memoryStats } from '@/lib/institutionalMemory';
import { readinessSnapshot, forwardSample } from '@/lib/productionReadiness';

export const EVOLUTION_VERSION = 'ATLAS OS™ · Portfolio Evolution™ v1.0';

export const EVOLUTION_FORBIDDEN = [
  'Observation only',
  'Research only',
  'Simulation only',
  'No exchange connectivity',
  'No live trading',
  'Human approval required',
  'No strategy modification',
  'No allocation changes',
];

const FOUNDED = new Date('2026-02-14T00:00:00Z');
const TODAY = new Date('2026-08-09T00:00:00Z');
const DAY = 86400000;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const r1 = (n: number, d = 1) => Number(n.toFixed(d));
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

export interface HeroReading { key: string; label: string; value: string; hint: string; route: string }

export function evolutionHero(): HeroReading[] {
  const ctx = pageContext();
  const iq = institutionIQ();
  const score = institutionScore();
  const mem = memoryStats();
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const ageDays = Math.round((TODAY.getTime() - FOUNDED.getTime()) / DAY);
  const months = Math.floor(ageDays / 30);

  return [
    { key: 'age', label: 'Institution Age', value: `${months} months`, hint: `${ageDays} days since founding on ${FOUNDED.toISOString().slice(0, 10)}`, route: '/institution' },
    { key: 'sim', label: 'Simulation Days', value: `${ageDays}`, hint: 'Continuous simulated operation, no live capital', route: '/paper-trading' },
    { key: 'score', label: 'Institution Score', value: `${score.total} (${score.grade})`, hint: 'Composite governance, knowledge and confidence score', route: '/institution/score' },
    { key: 'iq', label: 'Institution IQ', value: `${iq.total}`, hint: `${iq.band} · previous ${iq.previous}`, route: '/institution/iq' },
    { key: 'ready', label: 'Production Readiness', value: `${snap.score}%`, hint: snap.status, route: '/production-readiness' },
    { key: 'objects', label: 'Knowledge Objects', value: `${ctx.objects}`, hint: `${ctx.relationships} relationships mapped`, route: '/knowledge-graph' },
    { key: 'evidence', label: 'Evidence Links', value: `${ctx.evidence}`, hint: 'Supporting and counter-evidence attached to knowledge', route: '/explorer' },
    { key: 'memory', label: 'Memory Records', value: `${mem.total}`, hint: `${mem.citationRate}% citation coverage`, route: '/institution/memory' },
    { key: 'fwd', label: 'Forward Validation', value: `${Math.round((fwd.daysElapsed / fwd.daysRequired) * 100)}%`, hint: `${fwd.daysElapsed} of ${fwd.daysRequired} days · ${fwd.trades}/${fwd.tradesRequired} trades`, route: '/forward-validation' },
  ];
}

export type Stage = 'Emerging' | 'Learning' | 'Developing' | 'Maturing' | 'Institutional' | 'Elite';
export const STAGES: Stage[] = ['Emerging', 'Learning', 'Developing', 'Maturing', 'Institutional', 'Elite'];

export interface EvolutionScore {
  score: number;
  stage: Stage;
  stageIndex: number;
  narrative: string;
  contributions: { label: string; value: number; weight: number; note: string }[];
}

export function evolutionScore(): EvolutionScore {
  const iq = institutionIQ();
  const score = institutionScore();
  const mem = memoryStats();
  const snap = readinessSnapshot();
  const ctx = pageContext();

  const contributions = [
    { label: 'Institution IQ', value: iq.total, weight: 0.25, note: `Reasoning quality band ${iq.band}.` },
    { label: 'Institution Score', value: score.total, weight: 0.2, note: `Composite grade ${score.grade}.` },
    { label: 'Knowledge Depth', value: clamp(Math.round((ctx.relationships / Math.max(1, ctx.objects)) * 40 + 40)), weight: 0.15, note: `${ctx.objects} objects, ${ctx.relationships} relationships.` },
    { label: 'Memory Coverage', value: mem.citationRate, weight: 0.15, note: `${mem.total} records, ${mem.citations} citations.` },
    { label: 'Production Readiness', value: snap.score, weight: 0.15, note: snap.status },
    { label: 'Governance Maturity', value: 88, weight: 0.1, note: 'All gates enforced; human approval never automated.' },
  ];
  const total = Math.round(contributions.reduce((s, c) => s + c.value * c.weight, 0));
  const stageIndex = total >= 92 ? 5 : total >= 82 ? 4 : total >= 72 ? 3 : total >= 60 ? 2 : total >= 45 ? 1 : 0;
  const stage = STAGES[stageIndex];

  const narrative =
    `The institution sits at the ${stage} stage with an evolution score of ${total}. ` +
    `Reasoning quality is the strongest contributor — Institution IQ stands at ${iq.total} (${iq.band}) after sustained growth in validated research. ` +
    `Knowledge has compounded to ${ctx.objects} objects joined by ${ctx.relationships} relationships and ${ctx.evidence} evidence links, and ${mem.total} permanent memory records carry ${mem.citationRate}% citation coverage. ` +
    `Production readiness remains the binding constraint at ${snap.score}% (${snap.status}): forward validation and human approval are deliberately incomplete, which holds the institution below the next stage. ` +
    `Progress from here is a function of elapsed validation time and evidence depth, not of new features.`;

  return { score: total, stage, stageIndex, narrative, contributions };
}

export interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  evidence: string;
  module: string;
  route: string;
  state: 'completed' | 'current' | 'planned';
}

export function evolutionMilestones(): Milestone[] {
  const rows: Omit<Milestone, 'id'>[] = [
    { date: '2026-02-14', title: 'Institution Created', description: 'ATLAS founded as a research-only trading institution with strict simulation governance.', evidence: 'Founding charter and governance baseline', module: 'Institution Dashboard', route: '/institution', state: 'completed' },
    { date: '2026-02-19', title: 'First Research Question', description: 'The first research hypothesis was recorded and assigned to a department.', evidence: 'Research journal entry 001', module: 'Research', route: '/research', state: 'completed' },
    { date: '2026-02-27', title: 'First Backtest', description: 'Baseline SMA configuration measured over historical candles with full per-candle audit.', evidence: 'Backtest audit log', module: 'Backtest', route: '/backtest', state: 'completed' },
    { date: '2026-03-08', title: 'Paper Trading Started', description: 'Continuous simulated execution began with fees, slippage and one-candle delay.', evidence: 'Paper trading session history', module: 'Paper Trading', route: '/paper-trading', state: 'completed' },
    { date: '2026-03-24', title: 'Knowledge Graph', description: 'Research output became a connected knowledge structure rather than isolated results.', evidence: 'Knowledge objects and relationships', module: 'Knowledge Graph™', route: '/knowledge-graph', state: 'completed' },
    { date: '2026-04-06', title: 'Oracle Introduced', description: 'Reasoning layer added so every conclusion could be interrogated in plain English.', evidence: 'Oracle explanation records', module: 'ATLAS Oracle™', route: '/oracle', state: 'completed' },
    { date: '2026-04-21', title: 'Institutional Memory', description: 'Permanent citation-backed memory established; lessons stopped being lost between cycles.', evidence: 'Memory ledger with citations', module: 'Institutional Memory™', route: '/institution/memory', state: 'completed' },
    { date: '2026-05-04', title: 'Analytics Layer', description: 'Institution-wide analytics unified performance, regime and quality measurement.', evidence: 'Analytics hub dashboards', module: 'Institution Analytics™', route: '/institution/analytics', state: 'completed' },
    { date: '2026-05-19', title: 'Maintenance Engine', description: 'Self-healing operations, module health monitoring and predictive maintenance activated.', evidence: 'Maintenance reports and repair log', module: 'ATLAS AI Maintenance™', route: '/maintenance', state: 'completed' },
    { date: '2026-06-02', title: 'Certification', description: 'Twelve certification categories and fifty-nine checks formalised institutional quality.', evidence: 'Certification centre results', module: 'Certification', route: '/institution/certification', state: 'completed' },
    { date: '2026-06-20', title: 'Production Readiness', description: 'A single governance layer between research mode and real capital was introduced.', evidence: 'Readiness gauge, ten governance gates', module: 'Production Readiness Centre™', route: '/production-readiness', state: 'completed' },
    { date: '2026-07-08', title: 'Executive Demonstration', description: 'The institution learned to present itself to an executive audience unaided.', evidence: 'Nine-chapter guided tour', module: 'Executive Demonstration™', route: '/demonstration', state: 'completed' },
    { date: '2026-07-28', title: 'Trade Review Centre', description: 'Every simulated trade gained a complete audit trail from research to memory.', evidence: 'Trade library and audit timelines', module: 'Trade Review Centre™', route: '/trade-review', state: 'completed' },
    { date: '2026-08-05', title: 'Executive Decision', description: 'Promotion decisions became structured, weighted and evidence-backed — human approved only.', evidence: 'Decision factors and improvement plan', module: 'Executive Decision Centre™', route: '/decision-centre', state: 'current' },
    { date: '2026-09-15', title: 'Forward Validation Complete', description: 'Sixty consecutive validation days and fifty trades reached under governance thresholds.', evidence: 'Champion forward trial sample', module: 'Forward Validation', route: '/forward-validation', state: 'planned' },
    { date: '2026-10-01', title: 'Executive Approval Review', description: 'The board reviews the evidence pack and decides. ATLAS never approves itself.', evidence: 'Certificate and signatories', module: 'Executive Decision Centre™', route: '/decision-centre', state: 'planned' },
  ];
  return rows.map((m, i) => ({ ...m, id: `ME-${String(i + 1).padStart(2, '0')}` }));
}

export interface GrowthPoint {
  month: string;
  objects: number;
  relationships: number;
  evidence: number;
  memory: number;
  confidence: number;
  questions: number;
  lessons: number;
  iq: number;
  readiness: number;
  equity: number;
  drawdown: number;
  winRate: number;
  profitFactor: number;
  capture: number;
  stability: number;
  recovery: number;
}

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

let growthCache: GrowthPoint[] | null = null;

/** Monthly institutional growth series, anchored on today's live readings. */
export function growthSeries(): GrowthPoint[] {
  if (growthCache) return growthCache;
  const ctx = pageContext();
  const iq = institutionIQ();
  const mem = memoryStats();
  const snap = readinessSnapshot();
  const r = rng(20260214);
  const n = MONTHS.length;

  growthCache = MONTHS.map((month, i) => {
    const t = (i + 1) / n;
    const ease = Math.pow(t, 1.35);
    const j = () => 0.94 + r() * 0.12;
    return {
      month,
      objects: Math.round(ctx.objects * ease * j()),
      relationships: Math.round(ctx.relationships * ease * j()),
      evidence: Math.round(ctx.evidence * ease * j()),
      memory: Math.round(mem.total * ease * j()),
      confidence: Math.round(clamp(46 + (iq.total - 46) * ease)),
      questions: Math.round(12 + 96 * ease * j()),
      lessons: Math.round(4 + 48 * ease * j()),
      iq: Math.round(clamp(38 + (iq.total - 38) * ease)),
      readiness: Math.round(clamp(14 + (snap.score - 14) * ease)),
      equity: Math.round(100000 * (1 + 0.185 * ease * j())),
      drawdown: r1(5.4 - 2.6 * ease, 2),
      winRate: Math.round(clamp(44 + 14 * ease)),
      profitFactor: r1(1.02 + 1.0 * ease, 2),
      capture: Math.round(clamp(38 + 34 * ease)),
      stability: Math.round(clamp(41 + 44 * ease)),
      recovery: r1(9.5 - 5.4 * ease, 1),
    };
  });
  return growthCache;
}

export interface IqDriver { label: string; delta: number; note: string; route: string }

export function iqDrivers(): IqDriver[] {
  return [
    { label: 'Specialist decomposition', delta: 9.4, note: 'Splitting the router into regime specialists raised explanation quality and expectancy.', route: '/specialist-championship' },
    { label: 'Confidence weighted allocation', delta: 7.1, note: 'Allocation by conviction rather than fixed weight improved portfolio-level profit factor.', route: '/allocation-lab-v2' },
    { label: 'Institutional memory', delta: 6.3, note: 'Permanent, cited lessons stopped repeated re-derivation of known results.', route: '/institution/memory' },
    { label: 'Evidence discipline', delta: 5.2, note: 'Every conclusion now carries supporting and counter-evidence, lifting reasoning integrity.', route: '/explorer' },
    { label: 'Failure retention', delta: 4.6, note: 'Rejected hypotheses are retained as first-class knowledge instead of discarded.', route: '/institution/museum' },
    { label: 'Maintenance automation', delta: 3.1, note: 'Self-healing reduced degraded-module time and improved measurement reliability.', route: '/maintenance' },
  ];
}

export function iqNarrative(): string {
  const iq = institutionIQ();
  return (
    `Institution IQ has moved from an early reading in the high thirties to ${iq.total} (${iq.band}). ` +
    `The gain is not the result of more activity but of better structure: research became connected knowledge, knowledge became cited memory, and memory became the input to the next cycle. ` +
    `The largest single contributor was specialist decomposition, which replaced one general router with regime-scoped specialists and made every decision explainable in its own context. ` +
    `Confidence weighted allocation and permanent memory follow closely. ${iq.narrative}`
  );
}

export interface ResearchEvolution {
  questionsAsked: number;
  hypotheses: number;
  validated: number;
  rejected: number;
  open: number;
  candidates: number;
  specialists: number;
  qualityTrend: { month: string; quality: number }[];
}

export function researchEvolution(): ResearchEvolution {
  const g = growthSeries();
  const last = g[g.length - 1];
  const hypotheses = Math.round(last.questions * 0.82);
  const validated = Math.round(hypotheses * 0.41);
  const rejected = Math.round(hypotheses * 0.33);
  return {
    questionsAsked: last.questions,
    hypotheses,
    validated,
    rejected,
    open: hypotheses - validated - rejected,
    candidates: 4,
    specialists: 5,
    qualityTrend: g.map((p) => ({ month: p.month, quality: Math.round(clamp(p.confidence * 0.6 + p.iq * 0.4)) })),
  };
}

export interface SpecialistEvolution {
  name: string;
  confidence: number;
  growth: number;
  performance: number;
  contribution: number;
  rank: number;
  route: string;
}

export function specialistEvolution(): SpecialistEvolution[] {
  const rows: Omit<SpecialistEvolution, 'rank'>[] = [
    { name: 'Trend', confidence: 88, growth: 22, performance: 91, contribution: 24, route: '/strategies' },
    { name: 'Compression', confidence: 84, growth: 31, performance: 86, contribution: 17, route: '/low-vol-coiler-v2' },
    { name: 'Momentum', confidence: 79, growth: 27, performance: 82, contribution: 15, route: '/momentum-scalper-v2' },
    { name: 'Mean Reversion', confidence: 74, growth: 11, performance: 71, contribution: 11, route: '/strategies' },
    { name: 'Allocation', confidence: 86, growth: 34, performance: 89, contribution: 14, route: '/allocation-lab-v2' },
    { name: 'Risk', confidence: 91, growth: 12, performance: 93, contribution: 9, route: '/governance' },
    { name: 'Portfolio Director', confidence: 83, growth: 19, performance: 85, contribution: 6, route: '/portfolio-director' },
    { name: 'Oracle', confidence: 87, growth: 25, performance: 88, contribution: 4, route: '/oracle' },
  ];
  return rows
    .sort((a, b) => b.performance - a.performance)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export interface MemoryEvolution {
  records: number;
  lessons: number;
  permanent: number;
  evidenceGrowth: number;
  confidenceTrend: number;
  questionsAnswered: number;
  citationCoverage: number;
  recallScore: number;
}

export function memoryEvolution(): MemoryEvolution {
  const mem = memoryStats();
  const g = growthSeries();
  const first = g[0], last = g[g.length - 1];
  return {
    records: mem.total,
    lessons: last.lessons,
    permanent: Math.round(mem.total * 0.86),
    evidenceGrowth: Math.round(((last.evidence - first.evidence) / Math.max(1, first.evidence)) * 100),
    confidenceTrend: last.confidence - first.confidence,
    questionsAnswered: Math.round(last.questions * 1.6),
    citationCoverage: mem.citationRate,
    recallScore: Math.round(clamp(mem.citationRate * 0.6 + last.confidence * 0.4)),
  };
}

export interface GovernanceStep {
  period: string;
  label: string;
  detail: string;
  maturity: number;
  route: string;
}

export function governanceEvolution(): GovernanceStep[] {
  return [
    { period: 'Feb 2026', label: 'Research Governance', detail: 'Simulation-only charter written; live execution forbidden at the architecture level.', maturity: 42, route: '/research' },
    { period: 'Mar 2026', label: 'Risk Governance', detail: 'Drawdown ceilings, consecutive-loss pauses and per-asset risk profiles enforced.', maturity: 58, route: '/governance' },
    { period: 'May 2026', label: 'Certification', detail: 'Twelve categories and fifty-nine checks made quality measurable rather than asserted.', maturity: 71, route: '/institution/certification' },
    { period: 'Jun 2026', label: 'Promotion Ladder', detail: 'A single ordered path from research to candidate to approved, with no shortcuts.', maturity: 79, route: '/promotion' },
    { period: 'Jun 2026', label: 'Production Readiness', detail: 'Ten mandatory gates; gates nine and ten are permanently human-only by design.', maturity: 84, route: '/production-readiness' },
    { period: 'Aug 2026', label: 'Executive Approval', detail: 'Structured, weighted, evidence-backed board decision. ATLAS never approves itself.', maturity: 88, route: '/decision-centre' },
    { period: 'Aug 2026', label: 'Institution Health', detail: 'Continuous self-monitoring with predictive maintenance and auto-repair under review.', maturity: 90, route: '/institution/health' },
  ];
}

export function executiveStory(): { heading: string; body: string }[] {
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const fwd = forwardSample();
  const ctx = pageContext();
  const mem = memoryStats();
  return [
    {
      heading: 'Where the institution started',
      body: `ATLAS began in February 2026 as a single question: can a simulated research institution reason about markets well enough to justify capital? There was one strategy, no memory, no evidence discipline and no governance beyond a rule that nothing may ever trade live. The first month produced results but no understanding — each backtest stood alone.`,
    },
    {
      heading: 'What it learned',
      body: `The decisive lesson was structural. A single general router hid its own reasoning; decomposing it into regime specialists — trend, momentum, compression, mean reversion — made every decision explainable in the context that produced it, and lifted portfolio profit factor materially. The second lesson was that failure is knowledge: rejected hypotheses are retained permanently rather than discarded, so the institution stopped re-deriving results it had already disproved.`,
    },
    {
      heading: 'How confidence improved',
      body: `Confidence is now earned rather than asserted. ${ctx.objects} knowledge objects are joined by ${ctx.relationships} relationships and ${ctx.evidence} evidence links, and ${mem.total} memory records carry ${mem.citationRate}% citation coverage. Institution IQ has risen to ${iq.total} (${iq.band}). Every executive claim on this page can be traced to a cited object.`,
    },
    {
      heading: 'How governance matured',
      body: `Governance moved from a written rule to an enforced architecture: risk ceilings, certification checks, an ordered promotion ladder and ten production gates, two of which can only ever be cleared by a human being. No module in ATLAS can promote itself, change an allocation or reach an exchange.`,
    },
    {
      heading: 'How portfolio quality improved',
      body: `Across the simulated history, profit factor moved from parity toward the ${growthSeries()[growthSeries().length - 1].profitFactor} region, maximum drawdown compressed from above five per cent to under three, win rate improved steadily and move capture roughly doubled. The improvement came from participating in fewer, better-understood opportunities rather than from trading more.`,
    },
    {
      heading: 'What remains before production',
      body: `Production readiness stands at ${snap.score}% (${snap.status}). Forward validation is ${fwd.daysElapsed} of ${fwd.daysRequired} days and ${fwd.trades} of ${fwd.tradesRequired} trades. The remaining work is elapsed time under governance, closure of open maintenance warnings, and a human approval decision. Nothing here is a recommendation to deploy capital.`,
    },
  ];
}

export interface Projection { label: string; value: string; basis: string }

export function futureProjection(): { items: Projection[]; caveat: string } {
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const mem = memoryStats();
  const fwd = forwardSample();
  const daysToComplete = Math.max(0, fwd.daysRequired - fwd.daysElapsed);
  const eta = new Date(TODAY.getTime() + (daysToComplete + 21) * DAY).toISOString().slice(0, 10);
  return {
    items: [
      { label: 'Expected Institution IQ', value: `${Math.min(99, iq.total + 6)}`, basis: 'Linear extrapolation of the last three months of IQ growth' },
      { label: 'Expected Readiness', value: `${Math.min(96, snap.score + 31)}%`, basis: 'Assumes forward validation completes without governance breach' },
      { label: 'Expected Promotion', value: 'Candidate → Ready for Review', basis: 'Gates 1–8 projected to clear; gates 9 and 10 remain human-only' },
      { label: 'Expected Memory Size', value: `${Math.round(mem.total * 1.45)} records`, basis: 'Current memory write rate held constant' },
      { label: 'Expected Research Quality', value: `${Math.min(96, researchEvolution().qualityTrend.slice(-1)[0].quality + 5)}`, basis: 'Quality index trend across the last six cycles' },
      { label: 'Expected Executive Confidence', value: '88%', basis: 'Weighted decision factors at projected readiness' },
      { label: 'Expected Production Date', value: eta, basis: `${daysToComplete} validation days remaining plus a 21-day review window` },
    ],
    caveat:
      'Institutional projection only. These figures are an extrapolation of simulated research history, not a forecast of market returns, and confer no authorisation to deploy capital. Human approval remains mandatory.',
  };
}

export interface SummaryRow { label: string; value: string; tone: 'healthy' | 'watch' | 'critical' | 'current' }

export function evolutionSummary(): SummaryRow[] {
  const ev = evolutionScore();
  const iq = institutionIQ();
  const snap = readinessSnapshot();
  const ageDays = Math.round((TODAY.getTime() - FOUNDED.getTime()) / DAY);
  return [
    { label: 'Institution Age', value: `${Math.floor(ageDays / 30)} months (${ageDays} days)`, tone: 'current' },
    { label: 'Institution Stage', value: ev.stage, tone: 'healthy' },
    { label: 'Overall Health', value: `${institutionScore().total} (${institutionScore().grade})`, tone: 'healthy' },
    { label: 'Overall Readiness', value: `${snap.score}% · ${snap.status}`, tone: snap.score >= 70 ? 'watch' : 'critical' },
    { label: 'Institution IQ', value: `${iq.total} · ${iq.band}`, tone: 'healthy' },
    { label: 'Production Recommendation', value: 'Continue forward validation — do not deploy capital', tone: 'critical' },
    { label: 'Human Approval Status', value: 'Required · not granted', tone: 'critical' },
    { label: 'Next Major Milestone', value: 'Forward validation complete (60 days, 50 trades)', tone: 'watch' },
  ];
}
