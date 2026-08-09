/**
 * Trade Review Centre™ — deterministic, read-only institutional audit trail.
 *
 * Presentation layer only. This module NEVER places trades, NEVER connects to
 * an exchange, NEVER modifies strategies and NEVER changes allocations.
 * Every record below is a derived view over simulated research activity.
 */

export const TRADE_REVIEW_VERSION = 'Trade Review Centre™ v1.0';

export type TradeOutcome = 'win' | 'loss' | 'scratch';
export type TradeDecision = 'long' | 'short' | 'stand-aside';
export type PromotionStatus = 'research' | 'candidate' | 'promoted' | 'archived';

export const SPECIALISTS = [
  'Momentum Scalper v2',
  'Trend Rider v1',
  'Mean Reversion v1',
  'Low-Vol Coiler v2',
  'VCB v1',
  'Dynamic Allocation v1',
  'Confidence Weighted v2',
] as const;
export type Specialist = (typeof SPECIALISTS)[number];

/** Specialist family used for the performance comparison charts. */
export const SPECIALIST_FAMILY: Record<Specialist, string> = {
  'Momentum Scalper v2': 'Momentum',
  'Trend Rider v1': 'Trend',
  'Mean Reversion v1': 'Mean Reversion',
  'Low-Vol Coiler v2': 'Compression',
  'VCB v1': 'Breakout',
  'Dynamic Allocation v1': 'Allocation',
  'Confidence Weighted v2': 'Risk',
};

export const ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'XLM', 'FET'] as const;
export type ReviewAsset = (typeof ASSETS)[number];

export interface TimelineStage {
  stage:
    | 'Research'
    | 'Oracle'
    | 'Portfolio Director'
    | 'Risk Review'
    | 'Execution Simulation'
    | 'Outcome'
    | 'Institutional Memory';
  at: string;
  summary: string;
  route: string;
  state: 'pass' | 'pending' | 'blocked';
}

export interface TradeRecord {
  id: string;
  date: string;
  asset: ReviewAsset;
  decision: TradeDecision;
  outcome: TradeOutcome;
  confidence: number;
  risk: number;
  expectedReturn: number;
  actualReturn: number;
  drawdown: number;
  durationHours: number;
  specialist: Specialist;
  oracleVerdict: string;
  portfolioVerdict: string;
  status: PromotionStatus;
  explainable: boolean;
  memoryWritten: boolean;
  evidence: { label: string; route: string }[];
  knowledgeObjects: string[];
  oracleExplanation: string;
  memoryRecord: string;
  lessons: string[];
  confidenceChange: number;
  recommendationUpdate: string;
  promotionEffect: string;
  timeline: TimelineStage[];
}

/* ── deterministic pseudo-random ──────────────────────────── */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const round = (n: number, d = 2) => Number(n.toFixed(d));

const ORACLE_VIEWS = [
  'Regime alignment confirmed; volatility expansion supports participation.',
  'Compression resolved in signal direction with above-average volume.',
  'Counter-trend fade inside a mature range; confidence capped by regime purity.',
  'Higher-timeframe trend and specialist conviction agree.',
  'Signal accepted with reduced size — evidence base is thinner than usual.',
];
const PORTFOLIO_VIEWS = [
  'Approved at policy weight',
  'Approved at reduced weight',
  'Approved — exposure cap respected',
  'Approved with correlation offset',
];
const LESSONS = [
  'Confidence above 78 continues to correlate with positive expectancy.',
  'Holding beyond 3R in compression regimes erodes edge.',
  'Counter-trend entries need stricter volatility floors.',
  'Volume confirmation materially improves breakout follow-through.',
  'Exposure caps prevented correlated drawdown clustering.',
];

let cache: TradeRecord[] | null = null;

/** The full simulated trade library, deterministic across renders. */
export function tradeLibrary(): TradeRecord[] {
  if (cache) return cache;
  const r = rng(20260809);
  const out: TradeRecord[] = [];
  const today = new Date('2026-08-09T00:00:00Z').getTime();

  for (let i = 0; i < 84; i++) {
    const asset = ASSETS[Math.floor(r() * ASSETS.length)];
    const specialist = SPECIALISTS[Math.floor(r() * SPECIALISTS.length)];
    const confidence = Math.round(52 + r() * 44);
    const risk = round(0.8 + r() * 2.4);
    const decision: TradeDecision = r() > 0.22 ? (r() > 0.4 ? 'long' : 'short') : 'stand-aside';
    const winBias = confidence / 140 + 0.18;
    const roll = r();
    const outcome: TradeOutcome = decision === 'stand-aside' ? 'scratch' : roll < winBias ? 'win' : 'loss';
    const expectedReturn = round(risk * (1.4 + r() * 1.6));
    const actualReturn =
      outcome === 'win' ? round(expectedReturn * (0.55 + r() * 0.9))
      : outcome === 'loss' ? round(-risk * (0.6 + r() * 0.7))
      : 0;
    const drawdown = round(risk * (0.25 + r() * 0.8));
    const durationHours = round(1.5 + r() * 46, 1);
    const day = new Date(today - i * 86400000 * (0.4 + r() * 0.8));
    const date = day.toISOString().slice(0, 10);
    const id = `TR-2026-${String(1000 + i)}`;
    const status: PromotionStatus =
      confidence > 86 ? 'promoted' : confidence > 74 ? 'candidate' : r() > 0.9 ? 'archived' : 'research';
    const explainable = r() > 0.03;
    const memoryWritten = explainable && r() > 0.08;
    const oracleVerdict = confidence >= 75 ? 'Supportive' : confidence >= 62 ? 'Neutral' : 'Cautionary';
    const portfolioVerdict = PORTFOLIO_VIEWS[Math.floor(r() * PORTFOLIO_VIEWS.length)];

    const stamp = (h: number) => `${date} ${String(6 + h).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`;

    out.push({
      id, date, asset, decision, outcome, confidence, risk,
      expectedReturn, actualReturn, drawdown, durationHours, specialist,
      oracleVerdict, portfolioVerdict, status, explainable, memoryWritten,
      evidence: [
        { label: 'Research Journal entry', route: '/research-journal' },
        { label: 'Knowledge Graph object', route: '/knowledge-graph' },
        { label: 'Forward validation sample', route: '/forward-validation' },
        { label: 'Specialist championship record', route: '/specialist-championship' },
      ],
      knowledgeObjects: [
        `KO-REGIME-${asset}`,
        `KO-SPECIALIST-${specialist.split(' ')[0].toUpperCase()}`,
        `KO-RISK-POLICY-${Math.floor(r() * 9) + 1}`,
      ],
      oracleExplanation: ORACLE_VIEWS[Math.floor(r() * ORACLE_VIEWS.length)],
      memoryRecord: memoryWritten
        ? `Memory ${id} written with ${3 + Math.floor(r() * 4)} citations and linked to the ${SPECIALIST_FAMILY[specialist]} lineage.`
        : 'No memory record — trade pending evidence review.',
      lessons: [LESSONS[Math.floor(r() * LESSONS.length)], LESSONS[Math.floor(r() * LESSONS.length)]],
      confidenceChange: round((r() - 0.45) * 6, 1),
      recommendationUpdate:
        outcome === 'win'
          ? `Maintain ${SPECIALIST_FAMILY[specialist]} weighting; evidence strengthened.`
          : outcome === 'loss'
          ? `Tighten ${SPECIALIST_FAMILY[specialist]} activation filters before next review.`
          : 'No recommendation change — observation only.',
      promotionEffect:
        status === 'promoted' ? 'Contributed to promotion evidence pack'
        : status === 'candidate' ? 'Counted toward candidate trade minimum'
        : 'Research sample only',
      timeline: [
        { stage: 'Research', at: stamp(0), summary: `${specialist} produced a ${decision.toUpperCase()} hypothesis on ${asset}.`, route: '/research', state: 'pass' },
        { stage: 'Oracle', at: stamp(1), summary: `Oracle verdict ${oracleVerdict.toLowerCase()} at ${confidence}% confidence.`, route: '/oracle', state: 'pass' },
        { stage: 'Portfolio Director', at: stamp(2), summary: portfolioVerdict, route: '/portfolio-ai-director', state: 'pass' },
        { stage: 'Risk Review', at: stamp(3), summary: `Risk budget ${risk}% of equity, drawdown ceiling respected.`, route: '/governance', state: 'pass' },
        { stage: 'Execution Simulation', at: stamp(4), summary: 'Simulated fill with fees 0.1% and slippage 0.075% on confirmed close.', route: '/paper-trading', state: 'pass' },
        { stage: 'Outcome', at: stamp(6), summary: `${outcome.toUpperCase()} · ${actualReturn > 0 ? '+' : ''}${actualReturn}% versus ${expectedReturn}% expected.`, route: '/performance', state: outcome === 'loss' ? 'blocked' : 'pass' },
        { stage: 'Institutional Memory', at: stamp(7), summary: memoryWritten ? 'Written to institutional memory with citations.' : 'Awaiting evidence review.', route: '/institution/memory', state: memoryWritten ? 'pass' : 'pending' },
      ],
    });
  }
  cache = out.sort((a, b) => (a.date < b.date ? 1 : -1));
  return cache;
}

export interface ReviewHeader {
  totalReviewed: number;
  explainable: number;
  explainablePct: number;
  traceability: number;
  avgConfidence: number;
  avgRisk: number;
}

export function reviewHeader(trades: TradeRecord[]): ReviewHeader {
  const n = Math.max(1, trades.length);
  const explainable = trades.filter((t) => t.explainable).length;
  const memory = trades.filter((t) => t.memoryWritten).length;
  return {
    totalReviewed: trades.length,
    explainable,
    explainablePct: Math.round((explainable / n) * 100),
    traceability: Math.round(((explainable + memory) / (n * 2)) * 100),
    avgConfidence: Math.round(trades.reduce((s, t) => s + t.confidence, 0) / n),
    avgRisk: round(trades.reduce((s, t) => s + t.risk, 0) / n),
  };
}

export interface ReviewStats {
  trades: number;
  winRate: number;
  avgConfidence: number;
  avgRisk: number;
  avgHold: number;
  largestWin: number;
  largestLoss: number;
  consistency: number;
}

export function reviewStats(trades: TradeRecord[]): ReviewStats {
  const n = Math.max(1, trades.length);
  const decided = trades.filter((t) => t.outcome !== 'scratch');
  const wins = decided.filter((t) => t.outcome === 'win').length;
  const returns = trades.map((t) => t.actualReturn);
  const mean = returns.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(returns.reduce((s, v) => s + (v - mean) ** 2, 0) / n) || 1;
  return {
    trades: trades.length,
    winRate: decided.length ? Math.round((wins / decided.length) * 100) : 0,
    avgConfidence: Math.round(trades.reduce((s, t) => s + t.confidence, 0) / n),
    avgRisk: round(trades.reduce((s, t) => s + t.risk, 0) / n),
    avgHold: round(trades.reduce((s, t) => s + t.durationHours, 0) / n, 1),
    largestWin: round(Math.max(0, ...returns)),
    largestLoss: round(Math.min(0, ...returns)),
    consistency: Math.max(0, Math.min(100, Math.round(60 + (mean / sd) * 40))),
  };
}

export interface FamilyPerformance {
  family: string;
  trades: number;
  winRate: number;
  avgReturn: number;
  avgConfidence: number;
  avgRisk: number;
}

export function specialistPerformance(trades: TradeRecord[]): FamilyPerformance[] {
  const map = new Map<string, TradeRecord[]>();
  for (const t of trades) {
    const f = SPECIALIST_FAMILY[t.specialist];
    map.set(f, [...(map.get(f) ?? []), t]);
  }
  return [...map.entries()]
    .map(([family, rows]) => {
      const decided = rows.filter((t) => t.outcome !== 'scratch');
      const wins = decided.filter((t) => t.outcome === 'win').length;
      return {
        family,
        trades: rows.length,
        winRate: decided.length ? Math.round((wins / decided.length) * 100) : 0,
        avgReturn: round(rows.reduce((s, t) => s + t.actualReturn, 0) / rows.length),
        avgConfidence: Math.round(rows.reduce((s, t) => s + t.confidence, 0) / rows.length),
        avgRisk: round(rows.reduce((s, t) => s + t.risk, 0) / rows.length),
      };
    })
    .sort((a, b) => b.avgReturn - a.avgReturn);
}

export interface CoverageSummary {
  traceability: number;
  evidenceCoverage: number;
  memoryCoverage: number;
  explainability: number;
  recommendation: string;
}

export function executiveSummary(trades: TradeRecord[]): CoverageSummary {
  const n = Math.max(1, trades.length);
  const evidence = trades.filter((t) => t.evidence.length >= 3).length;
  const memory = trades.filter((t) => t.memoryWritten).length;
  const explain = trades.filter((t) => t.explainable).length;
  const evidenceCoverage = Math.round((evidence / n) * 100);
  const memoryCoverage = Math.round((memory / n) * 100);
  const explainability = Math.round((explain / n) * 100);
  const traceability = Math.round((evidenceCoverage + memoryCoverage + explainability) / 3);
  return {
    traceability,
    evidenceCoverage,
    memoryCoverage,
    explainability,
    recommendation:
      traceability >= 90
        ? 'Audit trail is institution-grade. Continue observation; no remediation required.'
        : traceability >= 80
        ? 'Audit trail is strong. Close the remaining memory gaps before the next promotion review.'
        : 'Audit trail is incomplete. Evidence and memory coverage must improve before any promotion decision.',
  };
}

export const TRADE_REVIEW_FORBIDDEN = [
  'No live trading',
  'No exchange connectivity',
  'No strategy modification',
  'No allocation changes',
  'No self-approval',
  'Human approval required',
];
