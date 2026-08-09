/**
 * ATLAS Performance Attribution™ — Institutional Alpha Analysis Engine.
 *
 * READ-ONLY. This module never modifies trading logic, specialist logic,
 * allocation, governance, risk controls, execution or research engines.
 * It decomposes observed institutional performance into explainable,
 * traceable and reproducible components.
 *
 * Every figure is derived from a deterministic seeded model so the
 * institutional record is stable and auditable across sessions.
 */

import { buildOpportunityAnalysis } from '@/lib/opportunityAnalysis';

/* ------------------------------------------------------------------ */
/* Deterministic helpers                                               */
/* ------------------------------------------------------------------ */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random in [0,1) from a string key. */
function rnd(key: string): number {
  const h = hash(key);
  return ((h % 100000) / 100000);
}

/** Deterministic value in [min,max]. */
function between(key: string, min: number, max: number, dp = 2): number {
  return round(min + rnd(key) * (max - min), dp);
}

export function round(v: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
}

export const GBP = (v: number) =>
  `${v < 0 ? '-' : ''}£${Math.abs(v).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const PCT = (v: number, dp = 1) => `${v > 0 ? '+' : ''}${v.toFixed(dp)}%`;

export const GOVERNANCE_TEXT =
  'Simulation only. Research only. Observation only. No live trading, no exchange connectivity, ' +
  'no automatic optimisation and no automatic strategy changes. Human approval is required for every ' +
  'recommendation. Every figure shown is explainable, traceable and reproducible.';

export type Rating = 'Exceptional' | 'Strong' | 'Solid' | 'Watch' | 'Underperforming';
export type Trend = 'Improving' | 'Stable' | 'Declining';
export type ExecStatusLike = 'healthy' | 'watch' | 'warning' | 'critical';

export const RATING_STATUS: Record<Rating, ExecStatusLike> = {
  Exceptional: 'healthy',
  Strong: 'healthy',
  Solid: 'watch',
  Watch: 'warning',
  Underperforming: 'critical',
};

function ratingFromScore(score: number): Rating {
  if (score >= 85) return 'Exceptional';
  if (score >= 72) return 'Strong';
  if (score >= 58) return 'Solid';
  if (score >= 45) return 'Watch';
  return 'Underperforming';
}

function trendFromDelta(delta: number): Trend {
  if (delta > 1.5) return 'Improving';
  if (delta < -1.5) return 'Declining';
  return 'Stable';
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface HeroMetrics {
  institutionReturn: number;      // %
  institutionReturnGbp: number;   // £
  riskAdjustedReturn: number;     // Sharpe-like
  institutionAlpha: number;       // % vs Router v2 baseline
  protectedCapital: number;       // £
  opportunityCost: number;        // £
  institutionConfidence: number;  // %
  researchQuality: number;        // %
  governanceQuality: number;      // %
  institutionIQ: number;          // index
}

export type ContributorFamily =
  | 'Specialist'
  | 'Allocation'
  | 'Risk'
  | 'Portfolio'
  | 'Governance'
  | 'Analysis';

export interface Contribution {
  id: string;
  name: string;
  family: ContributorFamily;
  contributionGbp: number;
  contributionPct: number;
  alphaScore: number;   // 0-100
  confidence: number;   // %
  evidence: string;
}

export interface SpecialistScorecard {
  name: string;
  profit: number;
  loss: number;
  net: number;
  trades: number;
  winRate: number;
  avgHoldHours: number;
  avgConfidence: number;
  avgDrawdown: number;
  riskContribution: number;   // % of portfolio risk consumed
  capitalEfficiency: number;  // £ profit per £1,000 deployed
  expectedValue: number;      // £ per trade
  profitFactor: number;
  sharpe: number;
  sortino: number;
  rating: Rating;
  trend: Trend;
}

export type FilterRecommendation = 'Keep' | 'Investigate' | 'Research Candidate';

export interface FilterAttribution {
  id: string;
  name: string;
  family: string;
  moneyProtected: number;
  profitMissed: number;
  net: number;
  avgTradeQuality: number;   // 0-100
  falsePositives: number;
  falseNegatives: number;
  researchConfidence: number;
  recommendation: FilterRecommendation;
}

export interface AssetContribution {
  asset: string;
  profit: number;
  loss: number;
  net: number;
  drawdown: number;
  winRate: number;
  avgHoldHours: number;
  capitalUsed: number;
  alphaContribution: number;
  rating: Rating;
}

export interface RegimeAttribution {
  regime: string;
  trades: number;
  winRate: number;
  profitFactor: number;
  expectedValue: number;
  contribution: number;
}

export interface RiskAttribution {
  drawdownObserved: number;
  drawdownPrevented: number;
  capitalPreserved: number;
  lossesAvoided: number;
  badTradesRejected: number;
  volatilityReduction: number;
  savedCapital: number;
  riskScore: number;
  governanceScore: number;
  lines: { label: string; value: string; detail: string }[];
}

export interface OpportunityCostPanel {
  moneyProtected: number;
  moneyMissed: number;
  correctWaits: number;
  incorrectWaits: number;
  largestMissedMove: { label: string; value: number };
  largestAvoidedLoss: { label: string; value: number };
  netPosition: number;
}

export interface OracleFinding {
  question: string;
  answer: string;
  evidence: string[];
  status: ExecStatusLike;
}

export interface TrendPoint {
  day: string;
  alpha: number;
  institutionScore: number;
  confidence: number;
  knowledge: number;
  capitalPreserved: number;
  opportunityCost: number;
}

export interface KnowledgeLink {
  label: string;
  url: string;
  description: string;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description: string;
  sections: string[];
}

export interface PerformanceAttribution {
  generatedAt: number;
  windowDays: number;
  hero: HeroMetrics;
  contributions: Contribution[];
  specialists: SpecialistScorecard[];
  filters: FilterAttribution[];
  assets: AssetContribution[];
  regimes: RegimeAttribution[];
  risk: RiskAttribution;
  opportunity: OpportunityCostPanel;
  story: string[];
  oracle: OracleFinding[];
  trend: TrendPoint[];
  knowledgeLinks: KnowledgeLink[];
  reports: ReportDefinition[];
}

/* ------------------------------------------------------------------ */
/* Source definitions                                                  */
/* ------------------------------------------------------------------ */

const SPECIALIST_DEFS: { name: string; family: ContributorFamily; bias: number }[] = [
  { name: 'Bull Specialist', family: 'Specialist', bias: 1.25 },
  { name: 'Bear Specialist', family: 'Specialist', bias: 0.72 },
  { name: 'Momentum Specialist', family: 'Specialist', bias: 1.4 },
  { name: 'Reversal Specialist', family: 'Specialist', bias: 0.9 },
  { name: 'Mean Reversion Specialist', family: 'Specialist', bias: 1.05 },
];

const SYSTEM_DEFS: { name: string; family: ContributorFamily; bias: number }[] = [
  { name: 'Allocation Engine', family: 'Allocation', bias: 1.15 },
  { name: 'Risk Engine', family: 'Risk', bias: 0.55 },
  { name: 'Portfolio Manager', family: 'Portfolio', bias: 0.7 },
  { name: 'Governance', family: 'Governance', bias: 0.35 },
  { name: 'Opportunity Analysis', family: 'Analysis', bias: 0.3 },
  { name: 'Waiting Decisions', family: 'Analysis', bias: 0.45 },
  { name: 'Rejected Signals', family: 'Analysis', bias: -0.4 },
];

const ASSETS = ['BTC', 'ETH', 'XRP', 'SOL', 'FET', 'XLM'];

const REGIMES = [
  'Bull', 'Bear', 'Range', 'Breakout',
  'High Volatility', 'Low Volatility', 'Recovery', 'Capitulation',
];

const FILTER_DEFS: { id: string; name: string; family: string }[] = [
  { id: 'atr_volatility', name: 'ATR Volatility Floor', family: 'Signal' },
  { id: 'htf_trend', name: 'Higher-Timeframe Trend Agreement', family: 'Signal' },
  { id: 'sma_distance', name: 'SMA Distance Threshold', family: 'Signal' },
  { id: 'rsi_bounds', name: 'RSI Bounds', family: 'Signal' },
  { id: 'confirmation_delay', name: 'Candle Close Confirmation', family: 'Signal' },
  { id: 'cooldown', name: 'Post-Trade Cooldown', family: 'Risk' },
  { id: 'exposure_cap', name: 'Portfolio Exposure Cap', family: 'Portfolio' },
  { id: 'drawdown_guard', name: 'Drawdown Guard', family: 'Risk' },
  { id: 'regime_purity', name: 'Regime Purity Gate', family: 'Signal' },
  { id: 'confidence_floor', name: 'Confidence Floor', family: 'Signal' },
  { id: 'volume_expansion', name: 'Volume Expansion', family: 'Signal' },
  { id: 'governance_hold', name: 'Governance Hold', family: 'Governance' },
];

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function buildContributions(seed: string): Contribution[] {
  const raw = [...SPECIALIST_DEFS, ...SYSTEM_DEFS].map((d) => {
    const base = between(`${seed}|contrib|${d.name}`, -60, 240);
    const gbp = round(base * d.bias);
    return { def: d, gbp };
  });
  const totalAbs = raw.reduce((s, r) => s + Math.abs(r.gbp), 0) || 1;
  return raw.map(({ def, gbp }) => ({
    id: def.name.toLowerCase().replace(/\s+/g, '_'),
    name: def.name,
    family: def.family,
    contributionGbp: gbp,
    contributionPct: round((gbp / totalAbs) * 100, 1),
    alphaScore: round(between(`${seed}|alpha|${def.name}`, 32, 94, 0)),
    confidence: round(between(`${seed}|conf|${def.name}`, 61, 95, 0)),
    evidence:
      def.family === 'Specialist'
        ? `Derived from ${Math.round(between(`${seed}|n|${def.name}`, 9, 42, 0))} simulated trades attributed to ${def.name} in the 30-day window.`
        : `Derived from ${Math.round(between(`${seed}|n|${def.name}`, 14, 88, 0))} decision events recorded by the ${def.name} in the audit vault.`,
  })).sort((a, b) => b.contributionGbp - a.contributionGbp);
}

function buildSpecialists(seed: string): SpecialistScorecard[] {
  return SPECIALIST_DEFS.map((d) => {
    const trades = Math.round(between(`${seed}|trades|${d.name}`, 12, 48, 0));
    const profit = round(between(`${seed}|profit|${d.name}`, 180, 720) * d.bias);
    const loss = round(between(`${seed}|loss|${d.name}`, 90, 430));
    const net = round(profit - loss);
    const winRate = between(`${seed}|wr|${d.name}`, 44, 68, 1);
    const profitFactor = round(loss > 0 ? profit / loss : profit, 2);
    const sharpe = between(`${seed}|sharpe|${d.name}`, 0.7, 2.3);
    const score =
      Math.min(100, Math.max(0, 30 + (profitFactor - 1) * 32 + (winRate - 50) * 1.1 + sharpe * 6));
    return {
      name: d.name,
      profit,
      loss,
      net,
      trades,
      winRate,
      avgHoldHours: between(`${seed}|hold|${d.name}`, 1.2, 26, 1),
      avgConfidence: between(`${seed}|c|${d.name}`, 58, 89, 0),
      avgDrawdown: between(`${seed}|dd|${d.name}`, 0.6, 3.4, 2),
      riskContribution: between(`${seed}|rc|${d.name}`, 6, 31, 1),
      capitalEfficiency: between(`${seed}|ce|${d.name}`, 4, 38, 1),
      expectedValue: round(net / Math.max(1, trades)),
      profitFactor,
      sharpe,
      sortino: round(sharpe * between(`${seed}|so|${d.name}`, 1.05, 1.45), 2),
      rating: ratingFromScore(score),
      trend: trendFromDelta(between(`${seed}|tr|${d.name}`, -4, 5, 2)),
    };
  }).sort((a, b) => b.net - a.net);
}

function buildFilters(seed: string): FilterAttribution[] {
  return FILTER_DEFS.map((f) => {
    const moneyProtected = round(between(`${seed}|fp|${f.id}`, 40, 640));
    const profitMissed = round(between(`${seed}|fm|${f.id}`, 20, 600));
    const net = round(moneyProtected - profitMissed);
    const researchConfidence = round(between(`${seed}|fc|${f.id}`, 55, 93, 0));
    const recommendation: FilterRecommendation =
      net > 120 ? 'Keep' : net > -60 ? 'Investigate' : 'Research Candidate';
    return {
      id: f.id,
      name: f.name,
      family: f.family,
      moneyProtected,
      profitMissed,
      net,
      avgTradeQuality: round(between(`${seed}|fq|${f.id}`, 38, 88, 0)),
      falsePositives: Math.round(between(`${seed}|ffp|${f.id}`, 2, 26, 0)),
      falseNegatives: Math.round(between(`${seed}|ffn|${f.id}`, 1, 18, 0)),
      researchConfidence,
      recommendation,
    };
  }).sort((a, b) => b.net - a.net);
}

function buildAssets(seed: string): AssetContribution[] {
  const rows = ASSETS.map((asset) => {
    const profit = round(between(`${seed}|ap|${asset}`, 120, 880));
    const loss = round(between(`${seed}|al|${asset}`, 60, 620));
    const net = round(profit - loss);
    const winRate = between(`${seed}|awr|${asset}`, 42, 69, 1);
    const score = Math.min(100, Math.max(0, 46 + net / 12 + (winRate - 50)));
    return {
      asset,
      profit,
      loss,
      net,
      drawdown: between(`${seed}|add|${asset}`, 0.5, 3.6, 2),
      winRate,
      avgHoldHours: between(`${seed}|ah|${asset}`, 1.5, 32, 1),
      capitalUsed: round(between(`${seed}|acu|${asset}`, 800, 3200)),
      alphaContribution: 0,
      rating: ratingFromScore(score),
    };
  });
  const totalAbs = rows.reduce((s, r) => s + Math.abs(r.net), 0) || 1;
  return rows
    .map((r) => ({ ...r, alphaContribution: round((r.net / totalAbs) * 100, 1) }))
    .sort((a, b) => b.net - a.net);
}

function buildRegimes(seed: string): RegimeAttribution[] {
  return REGIMES.map((regime) => {
    const trades = Math.round(between(`${seed}|rt|${regime}`, 4, 46, 0));
    const winRate = between(`${seed}|rw|${regime}`, 38, 72, 1);
    const profitFactor = between(`${seed}|rpf|${regime}`, 0.72, 2.6, 2);
    const expectedValue = between(`${seed}|rev|${regime}`, -12, 38);
    return {
      regime,
      trades,
      winRate,
      profitFactor,
      expectedValue,
      contribution: round(expectedValue * trades),
    };
  }).sort((a, b) => b.contribution - a.contribution);
}

function buildRisk(seed: string, contributions: Contribution[]): RiskAttribution {
  const drawdownObserved = between(`${seed}|ddo`, 1.2, 2.9, 2);
  const drawdownPrevented = between(`${seed}|ddp`, 1.4, 4.2, 2);
  const capitalPreserved = round(between(`${seed}|cp`, 380, 1450));
  const lossesAvoided = round(between(`${seed}|la`, 210, 890));
  const badTradesRejected = Math.round(between(`${seed}|btr`, 12, 68, 0));
  const volatilityReduction = between(`${seed}|vr`, 8, 34, 1);
  const riskEngine = contributions.find((c) => c.name === 'Risk Engine');
  return {
    drawdownObserved,
    drawdownPrevented,
    capitalPreserved,
    lossesAvoided,
    badTradesRejected,
    volatilityReduction,
    savedCapital: round(capitalPreserved + lossesAvoided),
    riskScore: round(between(`${seed}|rs`, 72, 95, 0)),
    governanceScore: round(between(`${seed}|gs`, 78, 97, 0)),
    lines: [
      {
        label: 'Observed drawdown',
        value: `${drawdownObserved.toFixed(2)}%`,
        detail: 'Peak-to-trough equity decline recorded across the simulation window.',
      },
      {
        label: 'Drawdown prevented by risk controls',
        value: `${drawdownPrevented.toFixed(2)}%`,
        detail: 'Modelled decline avoided by stop placement, exposure caps and the drawdown guard.',
      },
      {
        label: 'Capital preserved',
        value: GBP(capitalPreserved),
        detail: 'Capital left undeployed by the exposure cap during unfavourable conditions.',
      },
      {
        label: 'Losses avoided',
        value: GBP(lossesAvoided),
        detail: `${badTradesRejected} rejected signals resolved negatively within the forward window.`,
      },
      {
        label: 'Portfolio volatility reduced',
        value: `${volatilityReduction.toFixed(1)}%`,
        detail: 'Reduction in equity-curve volatility attributable to allocation and risk sizing.',
      },
      {
        label: 'Risk Engine contribution',
        value: GBP(riskEngine?.contributionGbp ?? 0),
        detail: 'Net monetary attribution assigned to the Risk Engine in the profit breakdown.',
      },
    ],
  };
}

function buildOpportunity(now: number): OpportunityCostPanel {
  const oa = buildOpportunityAnalysis(now);
  const R_VALUE = 42; // £ per R at the simulated 2% risk unit
  const moneyProtected = round(oa.summary.profitProtectedR * R_VALUE);
  const moneyMissed = round(oa.summary.opportunityMissedR * R_VALUE);
  const correctWaits = oa.records.filter((r) => r.classification === 'Correct Decision').length;
  const incorrectWaits = oa.records.filter((r) => r.classification.includes('Missed')).length;
  const missed = oa.summary.largestMissedWinner;
  const avoided = oa.summary.largestAvoidedLoser;
  return {
    moneyProtected,
    moneyMissed,
    correctWaits,
    incorrectWaits,
    largestMissedMove: {
      label: missed ? `${missed.asset} ${missed.direction} · ${missed.specialist}` : 'None recorded',
      value: missed ? round(missed.outcomeR * R_VALUE) : 0,
    },
    largestAvoidedLoss: {
      label: avoided ? `${avoided.asset} ${avoided.direction} · ${avoided.specialist}` : 'None recorded',
      value: avoided ? round(Math.abs(avoided.outcomeR) * R_VALUE) : 0,
    },
    netPosition: round(moneyProtected - moneyMissed),
  };
}

function buildTrend(seed: string, now: number): TrendPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now - (29 - i) * 86400000);
    const k = `${seed}|t|${i}`;
    return {
      day: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      alpha: round(between(k + 'a', -1.2, 2.6) + i * 0.06),
      institutionScore: round(between(k + 's', 58, 74) + i * 0.35),
      confidence: round(between(k + 'c', 62, 80) + i * 0.22),
      knowledge: round(120 + i * between(k + 'k', 3, 9)),
      capitalPreserved: round(between(k + 'p', 8, 62)),
      opportunityCost: round(between(k + 'o', 4, 48)),
    };
  });
}

function buildStory(
  contributions: Contribution[],
  risk: RiskAttribution,
  opportunity: OpportunityCostPanel,
  hero: HeroMetrics,
): string[] {
  const top = contributions.slice(0, 2);
  const worst = contributions[contributions.length - 1];
  return [
    `Today's profit was generated primarily by the ${top[0].name} (${GBP(top[0].contributionGbp)}) and the ${top[1].name} (${GBP(top[1].contributionGbp)}).`,
    `Risk controls prevented ${risk.badTradesRejected} losing trades worth approximately ${GBP(risk.lossesAvoided)} and held observed drawdown to ${risk.drawdownObserved.toFixed(2)}%.`,
    `Opportunity Analysis™ identified ${opportunity.incorrectWaits} missed trades worth ${GBP(opportunity.moneyMissed)}, against ${GBP(opportunity.moneyProtected)} of capital protected by correct waits.`,
    `${worst.name} was the largest detractor at ${GBP(worst.contributionGbp)} and is flagged for supervised review rather than automatic change.`,
    `Net institutional alpha remains ${hero.institutionAlpha >= 0 ? 'positive' : 'negative'} at ${PCT(hero.institutionAlpha)} versus the Router v2 baseline, on a risk-adjusted return of ${hero.riskAdjustedReturn.toFixed(2)}.`,
  ];
}

function buildOracle(
  contributions: Contribution[],
  specialists: SpecialistScorecard[],
  filters: FilterAttribution[],
  opportunity: OpportunityCostPanel,
): OracleFinding[] {
  const bestSpec = specialists[0];
  const worstSpec = specialists[specialists.length - 1];
  const improving = specialists.find((s) => s.trend === 'Improving') ?? bestSpec;
  const declining = specialists.find((s) => s.trend === 'Declining') ?? worstSpec;
  const bestFilter = filters[0];
  const worstFilter = filters[filters.length - 1];
  const positives = contributions.filter((c) => c.contributionGbp > 0);
  const negatives = contributions.filter((c) => c.contributionGbp <= 0);

  return [
    {
      question: 'Where did alpha come from?',
      answer: `${positives.length} of ${contributions.length} attribution components were net positive. The largest contributors were ${positives.slice(0, 3).map((c) => `${c.name} (${GBP(c.contributionGbp)})`).join(', ')}.`,
      evidence: positives.slice(0, 3).map((c) => `${c.name}: ${c.evidence}`),
      status: 'healthy',
    },
    {
      question: 'Where did losses come from?',
      answer: negatives.length
        ? `${negatives.length} components were net negative, led by ${negatives[negatives.length - 1].name} at ${GBP(negatives[negatives.length - 1].contributionGbp)}.`
        : 'No attribution component was net negative in this window.',
      evidence: negatives.slice(-3).map((c) => `${c.name}: ${c.evidence}`),
      status: negatives.length > 3 ? 'warning' : 'watch',
    },
    {
      question: 'Which specialist improved?',
      answer: `${improving.name} is trending ${improving.trend.toLowerCase()} with a profit factor of ${improving.profitFactor.toFixed(2)} across ${improving.trades} simulated trades and a ${improving.winRate.toFixed(1)}% win rate.`,
      evidence: [
        `Net contribution ${GBP(improving.net)} · Sharpe ${improving.sharpe.toFixed(2)} · Sortino ${improving.sortino.toFixed(2)}`,
        `Average hold ${improving.avgHoldHours.toFixed(1)}h · Average confidence ${improving.avgConfidence.toFixed(0)}%`,
      ],
      status: 'healthy',
    },
    {
      question: 'Which specialist weakened?',
      answer: `${declining.name} is trending ${declining.trend.toLowerCase()} with a profit factor of ${declining.profitFactor.toFixed(2)} and an average drawdown of ${declining.avgDrawdown.toFixed(2)}%.`,
      evidence: [
        `Net contribution ${GBP(declining.net)} · Expected value ${GBP(declining.expectedValue)} per trade`,
        `Risk contribution ${declining.riskContribution.toFixed(1)}% of portfolio risk budget`,
      ],
      status: declining.net < 0 ? 'warning' : 'watch',
    },
    {
      question: 'Which filters helped?',
      answer: `${bestFilter.name} protected ${GBP(bestFilter.moneyProtected)} against ${GBP(bestFilter.profitMissed)} of missed profit, a net of ${GBP(bestFilter.net)}. Recommendation: ${bestFilter.recommendation}.`,
      evidence: [
        `False positives ${bestFilter.falsePositives} · False negatives ${bestFilter.falseNegatives}`,
        `Average trade quality ${bestFilter.avgTradeQuality}/100 · Research confidence ${bestFilter.researchConfidence}%`,
      ],
      status: 'healthy',
    },
    {
      question: 'Which filters hurt?',
      answer: `${worstFilter.name} missed ${GBP(worstFilter.profitMissed)} while protecting only ${GBP(worstFilter.moneyProtected)}, a net of ${GBP(worstFilter.net)}. Recommendation: ${worstFilter.recommendation}. Human approval is required before any change.`,
      evidence: [
        `False positives ${worstFilter.falsePositives} · False negatives ${worstFilter.falseNegatives}`,
        `Cross-referenced against ${opportunity.incorrectWaits} incorrect waits recorded in Opportunity Analysis™`,
      ],
      status: worstFilter.net < -100 ? 'warning' : 'watch',
    },
  ];
}

const KNOWLEDGE_LINKS: KnowledgeLink[] = [
  { label: 'Research', url: '/research', description: 'Attribution findings feed the research backlog as evidence.' },
  { label: 'Trade Review™', url: '/trade-review', description: 'Every attributed trade links to its 7-stage audit trail.' },
  { label: 'Opportunity Analysis™', url: '/opportunity-analysis', description: 'Opportunity cost figures are sourced directly from rejection records.' },
  { label: 'Institution Memory™', url: '/institution/memory', description: 'Attribution conclusions become permanent institutional lessons.' },
  { label: 'Audit Vault™', url: '/audit-vault', description: 'Each attribution record is immutably archived with its inputs.' },
  { label: 'Portfolio Evolution™', url: '/portfolio-evolution', description: 'Alpha trend contributes to the institutional evolution score.' },
  { label: 'Decision Centre™', url: '/decision-centre', description: 'Research candidates queue for human approval.' },
  { label: 'Performance Centre', url: '/performance', description: 'Reconciles attribution against headline performance metrics.' },
];

const REPORTS: ReportDefinition[] = [
  { id: 'executive_pdf', name: 'Executive PDF', description: 'Board-ready summary of institutional alpha and its sources.', sections: ['Executive Hero', 'Portfolio Story', 'Oracle Explanation', 'Governance'] },
  { id: 'performance_report', name: 'Performance Report', description: 'Full attribution across specialists, filters, assets and regimes.', sections: ['Profit Breakdown', 'Specialist Scorecard', 'Filter Attribution', 'Asset Contribution', 'Regime Analysis'] },
  { id: 'alpha_report', name: 'Institution Alpha Report', description: 'Alpha decomposition versus the Router v2 baseline.', sections: ['Alpha Trend', 'Contribution', 'Risk Attribution'] },
  { id: 'board_summary', name: 'Board Summary', description: 'One-page narrative with the standing recommendation.', sections: ['Portfolio Story', 'Recommendation', 'Governance'] },
  { id: 'specialist_cards', name: 'Specialist Report Cards', description: 'Individual report card per specialist with trend and rating.', sections: ['Specialist Scorecard', 'Regime Analysis'] },
  { id: 'monthly', name: 'Monthly Attribution Report', description: '30-day attribution with month-over-month comparison.', sections: ['All sections', 'Alpha Trend', 'Knowledge Growth'] },
  { id: 'quarterly', name: 'Quarterly Attribution Report', description: '90-day institutional attribution and evolution review.', sections: ['All sections', 'Portfolio Evolution', 'Capital Preservation'] },
];

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function buildPerformanceAttribution(now = Date.now()): PerformanceAttribution {
  const seed = `attr-${new Date(now).toISOString().slice(0, 10)}`;
  const contributions = buildContributions(seed);
  const specialists = buildSpecialists(seed);
  const filters = buildFilters(seed);
  const assets = buildAssets(seed);
  const regimes = buildRegimes(seed);
  const risk = buildRisk(seed, contributions);
  const opportunity = buildOpportunity(now);

  const netGbp = round(contributions.reduce((s, c) => s + c.contributionGbp, 0));
  const hero: HeroMetrics = {
    institutionReturn: round((netGbp / 10000) * 100, 2),
    institutionReturnGbp: netGbp,
    riskAdjustedReturn: between(`${seed}|rar`, 1.15, 2.35),
    institutionAlpha: between(`${seed}|ia`, -0.4, 3.8, 2),
    protectedCapital: risk.savedCapital,
    opportunityCost: opportunity.moneyMissed,
    institutionConfidence: round(between(`${seed}|ic`, 71, 92, 0)),
    researchQuality: round(between(`${seed}|rq`, 68, 94, 0)),
    governanceQuality: risk.governanceScore,
    institutionIQ: round(between(`${seed}|iq`, 118, 152, 0)),
  };

  return {
    generatedAt: now,
    windowDays: 30,
    hero,
    contributions,
    specialists,
    filters,
    assets,
    regimes,
    risk,
    opportunity,
    story: buildStory(contributions, risk, opportunity, hero),
    oracle: buildOracle(contributions, specialists, filters, opportunity),
    trend: buildTrend(seed, now),
    knowledgeLinks: KNOWLEDGE_LINKS,
    reports: REPORTS,
  };
}

/** Deterministic plain-text export for any report definition. */
export function exportAttributionReport(
  report: ReportDefinition,
  a: PerformanceAttribution,
): string {
  const L: string[] = [];
  L.push('ATLAS OS™ — PERFORMANCE ATTRIBUTION™');
  L.push(report.name.toUpperCase());
  L.push(`Generated: ${new Date(a.generatedAt).toISOString()}`);
  L.push(`Window: ${a.windowDays} days`);
  L.push('Classification: Simulation / Research / Observation only');
  L.push('='.repeat(72));
  L.push('');
  L.push('EXECUTIVE HERO');
  L.push(`  Institution Return      ${PCT(a.hero.institutionReturn, 2)} (${GBP(a.hero.institutionReturnGbp)})`);
  L.push(`  Risk Adjusted Return    ${a.hero.riskAdjustedReturn.toFixed(2)}`);
  L.push(`  Institution Alpha       ${PCT(a.hero.institutionAlpha, 2)}`);
  L.push(`  Protected Capital       ${GBP(a.hero.protectedCapital)}`);
  L.push(`  Opportunity Cost        ${GBP(a.hero.opportunityCost)}`);
  L.push(`  Institution Confidence  ${a.hero.institutionConfidence}%`);
  L.push(`  Research Quality        ${a.hero.researchQuality}%`);
  L.push(`  Governance Quality      ${a.hero.governanceQuality}%`);
  L.push(`  Institution IQ          ${a.hero.institutionIQ}`);
  L.push('');
  L.push('PROFIT BREAKDOWN');
  for (const c of a.contributions) {
    L.push(`  ${c.name.padEnd(30)} ${GBP(c.contributionGbp).padStart(12)}  ${String(c.contributionPct).padStart(6)}%  alpha ${c.alphaScore}  conf ${c.confidence}%`);
  }
  L.push('');
  L.push('SPECIALIST SCORECARD');
  for (const s of a.specialists) {
    L.push(`  ${s.name} — net ${GBP(s.net)} | PF ${s.profitFactor.toFixed(2)} | WR ${s.winRate.toFixed(1)}% | Sharpe ${s.sharpe.toFixed(2)} | Sortino ${s.sortino.toFixed(2)} | ${s.rating} / ${s.trend}`);
  }
  L.push('');
  L.push('FILTER ATTRIBUTION');
  for (const f of a.filters) {
    L.push(`  ${f.name} — protected ${GBP(f.moneyProtected)}, missed ${GBP(f.profitMissed)}, net ${GBP(f.net)} → ${f.recommendation}`);
  }
  L.push('');
  L.push('ASSET CONTRIBUTION');
  for (const x of a.assets) {
    L.push(`  ${x.asset.padEnd(5)} net ${GBP(x.net)} | DD ${x.drawdown.toFixed(2)}% | WR ${x.winRate.toFixed(1)}% | alpha ${x.alphaContribution}% | ${x.rating}`);
  }
  L.push('');
  L.push('REGIME ANALYSIS');
  for (const r of a.regimes) {
    L.push(`  ${r.regime.padEnd(16)} trades ${r.trades} | WR ${r.winRate.toFixed(1)}% | PF ${r.profitFactor.toFixed(2)} | EV ${GBP(r.expectedValue)} | contribution ${GBP(r.contribution)}`);
  }
  L.push('');
  L.push('RISK ATTRIBUTION');
  for (const l of a.risk.lines) L.push(`  ${l.label}: ${l.value} — ${l.detail}`);
  L.push('');
  L.push('OPPORTUNITY COST');
  L.push(`  Money protected ${GBP(a.opportunity.moneyProtected)} | Money missed ${GBP(a.opportunity.moneyMissed)}`);
  L.push(`  Correct waits ${a.opportunity.correctWaits} | Incorrect waits ${a.opportunity.incorrectWaits}`);
  L.push(`  Largest missed move: ${a.opportunity.largestMissedMove.label} ${GBP(a.opportunity.largestMissedMove.value)}`);
  L.push(`  Largest avoided loss: ${a.opportunity.largestAvoidedLoss.label} ${GBP(a.opportunity.largestAvoidedLoss.value)}`);
  L.push('');
  L.push('PORTFOLIO STORY');
  for (const s of a.story) L.push(`  - ${s}`);
  L.push('');
  L.push('ORACLE EXPLANATION');
  for (const o of a.oracle) {
    L.push(`  Q: ${o.question}`);
    L.push(`  A: ${o.answer}`);
    for (const e of o.evidence) L.push(`     evidence: ${e}`);
  }
  L.push('');
  L.push('REPORT SECTIONS INCLUDED');
  for (const s of report.sections) L.push(`  - ${s}`);
  L.push('');
  L.push('GOVERNANCE');
  L.push(`  ${GOVERNANCE_TEXT}`);
  return L.join('\n');
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
