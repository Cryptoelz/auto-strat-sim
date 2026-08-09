/**
 * ATLAS Opportunity Analysis™ — Opportunity Missed Intelligence Layer.
 *
 * READ-ONLY. This module never modifies strategies, governance, specialist
 * selection or execution. It reconstructs every rejected signal as an
 * Opportunity Record, follows the market forward, classifies the outcome and
 * produces filter / specialist scorecards plus advisory research candidates.
 *
 * All values are deterministic (seeded) so the institutional record is stable
 * and auditable across sessions.
 */

export type Direction = 'Long' | 'Short';

export type OpportunityClass =
  | 'Correct Decision'
  | 'Neutral Decision'
  | 'Missed Opportunity'
  | 'Major Missed Opportunity';

export type FilterId =
  | 'atr_volatility'
  | 'htf_trend'
  | 'sma_distance'
  | 'rsi_bounds'
  | 'confirmation_delay'
  | 'cooldown'
  | 'exposure_cap'
  | 'drawdown_guard'
  | 'regime_purity'
  | 'confidence_floor'
  | 'volume_expansion'
  | 'governance_hold';

export interface FilterMeta {
  id: FilterId;
  name: string;
  current: string;
  suggested: string;
  family: 'Signal' | 'Risk' | 'Portfolio' | 'Governance';
}

export const FILTERS: FilterMeta[] = [
  { id: 'atr_volatility', name: 'ATR Volatility Floor', current: '0.50%', suggested: '0.40%', family: 'Signal' },
  { id: 'htf_trend', name: 'Higher-Timeframe Trend Agreement', current: 'Required', suggested: 'Required', family: 'Signal' },
  { id: 'sma_distance', name: 'SMA Distance Threshold', current: '0.50% / 0.60%', suggested: '0.45% / 0.54%', family: 'Signal' },
  { id: 'rsi_bounds', name: 'RSI Bounds', current: '35 / 65', suggested: '38 / 62', family: 'Signal' },
  { id: 'confirmation_delay', name: 'Candle Close Confirmation', current: '1 candle', suggested: '1 candle', family: 'Signal' },
  { id: 'cooldown', name: 'Post-Trade Cooldown', current: '3 candles', suggested: '2 candles', family: 'Risk' },
  { id: 'exposure_cap', name: 'Portfolio Exposure Cap', current: '70%', suggested: '70%', family: 'Portfolio' },
  { id: 'drawdown_guard', name: 'Drawdown Guard', current: '3.0%', suggested: '3.0%', family: 'Risk' },
  { id: 'regime_purity', name: 'Regime Purity Gate', current: '0.60', suggested: '0.55', family: 'Signal' },
  { id: 'confidence_floor', name: 'Confidence Floor', current: '62%', suggested: '58%', family: 'Signal' },
  { id: 'volume_expansion', name: 'Volume Expansion', current: '1.5×', suggested: '1.3×', family: 'Signal' },
  { id: 'governance_hold', name: 'Governance Hold', current: 'Active', suggested: 'Active', family: 'Governance' },
];

export const SPECIALISTS = [
  'Trend Rider v1',
  'Mean Reversion v1',
  'Momentum Scalper v2',
  'VCB v1',
  'Low-Vol Coiler v2',
  'Router v2.1',
] as const;
export type SpecialistName = (typeof SPECIALISTS)[number];

export const REGIMES = ['Bullish', 'Bearish', 'Sideways', 'High Volatility', 'Reversal'] as const;
export type RegimeName = (typeof REGIMES)[number];

export const ASSETS = ['BTC', 'ETH', 'XRP', 'SOL', 'FET', 'XLM'] as const;
export type AssetName = (typeof ASSETS)[number];

export const CHECKPOINTS = ['15m', '1h', '4h', '24h', '3d', '7d'] as const;
export type CheckpointLabel = (typeof CHECKPOINTS)[number];

export interface Checkpoint {
  label: CheckpointLabel;
  movePct: number;
  mfePct: number;
  maePct: number;
  hypotheticalProfit: number;
  hypotheticalLoss: number;
  riskReward: number;
  stopHit: boolean;
  takeProfitHit: boolean;
}

export interface MarketConditions {
  price: number;
  atrPercent: number;
  rsi: number;
  smaDistance: number;
  volumeRatio: number;
  htfTrend: 'bullish' | 'bearish' | 'neutral';
}

export interface OpportunityRecord {
  id: string;
  asset: AssetName;
  timestamp: number;
  specialist: SpecialistName;
  regime: RegimeName;
  confidence: number;
  direction: Direction;
  rejections: { filter: FilterId; name: string; current: string; required: string; note: string }[];
  conditions: MarketConditions;
  decisionState: string;
  oracle: string;
  governance: string;
  checkpoints: Checkpoint[];
  classification: OpportunityClass;
  /** Positive = profit missed. Negative = loss avoided. In R multiples. */
  outcomeR: number;
  lesson: string;
}

export interface FilterScore {
  filter: FilterMeta;
  blocks: number;
  avgMissedProfit: number;
  avgAvoidedLoss: number;
  winRateIfIgnored: number;
  lossRateIfIgnored: number;
  expectedValue: number;
  profitFactor: number;
  sharpeImpact: number;
  verdict: 'Valuable' | 'Balanced' | 'Restrictive';
}

export interface SpecialistScore {
  specialist: SpecialistName;
  signals: number;
  blocked: number;
  taken: number;
  missed: number;
  correctWaits: number;
  avgConfidence: number;
  avgProfit: number;
  avgAvoidedLoss: number;
  rating: 'A' | 'B' | 'C' | 'D';
}

export interface ResearchCandidate {
  id: string;
  title: string;
  filter: FilterMeta;
  evidenceMissedProfit: number;
  expectedImprovement: string;
  confidence: number;
  supportingTrades: number;
  status: 'Awaiting Institutional Approval';
  rationale: string;
}

export interface OpportunitySummary {
  todayMissed: number;
  totalRecords: number;
  largestMissedWinner: OpportunityRecord | null;
  largestAvoidedLoser: OpportunityRecord | null;
  profitProtectedR: number;
  opportunityMissedR: number;
  netR: number;
  correctRate: number;
  recommendation: string;
  recommendationStatus: 'healthy' | 'watch' | 'warning';
}

export interface OpportunityAnalysis {
  generatedAt: number;
  windowDays: number;
  records: OpportunityRecord[];
  filterScores: FilterScore[];
  specialistScores: SpecialistScore[];
  candidates: ResearchCandidate[];
  summary: OpportunitySummary;
  oracleReviews: { title: string; verdict: 'Keep' | 'Research' | 'Monitor'; text: string }[];
  knowledgeLinks: { label: string; url: string; description: string }[];
}

export const GOVERNANCE_TEXT =
  'Observation only · Simulation only · No strategy modification · No automatic optimisation · No exchange connectivity · Human approval required for every recommendation.';

/* ── deterministic pseudo-random ─────────────────────────────── */
function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (n: number, d = 2) => Number(n.toFixed(d));

const BASE_PRICE: Record<AssetName, number> = {
  BTC: 61250, ETH: 3320, XRP: 0.58, SOL: 142, FET: 1.32, XLM: 0.112,
};

const FILTER_NOTES: Record<FilterId, string> = {
  atr_volatility: 'Volatility below the participation floor — engine requires expansion before entry.',
  htf_trend: 'Higher-timeframe trend disagreed with the signal direction.',
  sma_distance: 'Price too close to the moving average — regime not yet committed.',
  rsi_bounds: 'RSI outside the permitted entry band.',
  confirmation_delay: 'Signal not yet confirmed on candle close (1-candle rule).',
  cooldown: 'Asset still inside post-trade cooldown window.',
  exposure_cap: 'Portfolio exposure cap reached — no capacity for a new position.',
  drawdown_guard: 'Session drawdown guard active — new risk suspended.',
  regime_purity: 'Regime purity score below the specialist activation gate.',
  confidence_floor: 'Signal confidence below the institutional floor.',
  volume_expansion: 'Volume expansion insufficient for a breakout entry.',
  governance_hold: 'Governance hold in force — research-only participation state.',
};

function buildCheckpoints(rand: () => number, direction: Direction, bias: number): Checkpoint[] {
  let drift = 0;
  let mfe = 0;
  let mae = 0;
  const out: Checkpoint[] = [];
  const scale = [0.35, 0.7, 1.2, 1.9, 2.7, 3.4];
  CHECKPOINTS.forEach((label, i) => {
    const step = (rand() - 0.5 + bias * 0.42) * 1.35 * scale[i];
    drift += step;
    mfe = Math.max(mfe, drift + rand() * 0.5 * scale[i]);
    mae = Math.min(mae, drift - rand() * 0.5 * scale[i]);
    const signed = direction === 'Long' ? drift : -drift;
    const favourable = direction === 'Long' ? mfe : -mae;
    const adverse = direction === 'Long' ? mae : -mfe;
    const stopDistance = 1.0;
    const tpDistance = 3.0;
    out.push({
      label,
      movePct: round(signed),
      mfePct: round(Math.abs(favourable)),
      maePct: round(-Math.abs(adverse)),
      hypotheticalProfit: round(Math.max(0, Math.abs(favourable))),
      hypotheticalLoss: round(Math.min(0, -Math.abs(adverse))),
      riskReward: round(Math.abs(favourable) / Math.max(0.25, Math.abs(adverse)), 2),
      stopHit: Math.abs(adverse) >= stopDistance,
      takeProfitHit: Math.abs(favourable) >= tpDistance,
    });
  });
  return out;
}

function classify(cp: Checkpoint[]): { cls: OpportunityClass; outcomeR: number } {
  const final = cp[cp.length - 1];
  const tpFirst = cp.find((c) => c.takeProfitHit);
  const stopFirst = cp.find((c) => c.stopHit);
  const stoppedBeforeTarget =
    !!stopFirst && (!tpFirst || CHECKPOINTS.indexOf(stopFirst.label) <= CHECKPOINTS.indexOf(tpFirst.label));

  if (stoppedBeforeTarget) return { cls: 'Correct Decision', outcomeR: round(-1) };
  if (tpFirst) return { cls: 'Major Missed Opportunity', outcomeR: round(3) };
  if (final.movePct > 1.2) return { cls: 'Missed Opportunity', outcomeR: round(final.movePct / 1) };
  if (final.movePct < -0.6) return { cls: 'Correct Decision', outcomeR: round(final.movePct / 1) };
  return { cls: 'Neutral Decision', outcomeR: round(final.movePct / 2) };
}

function buildRecord(i: number, now: number): OpportunityRecord {
  const rand = mulberry(9173 + i * 7919);
  const asset = ASSETS[Math.floor(rand() * ASSETS.length)];
  const specialist = SPECIALISTS[Math.floor(rand() * SPECIALISTS.length)];
  const regime = REGIMES[Math.floor(rand() * REGIMES.length)];
  const direction: Direction = rand() > 0.42 ? 'Long' : 'Short';
  const confidence = round(52 + rand() * 40, 1);
  const timestamp = now - Math.floor(rand() * 30 * 24 * 60) * 60_000;

  const count = 1 + Math.floor(rand() * 2.4);
  const chosen: FilterId[] = [];
  while (chosen.length < count) {
    const f = FILTERS[Math.floor(rand() * FILTERS.length)];
    if (!chosen.includes(f.id)) chosen.push(f.id);
  }
  const rejections = chosen.map((id) => {
    const meta = FILTERS.find((f) => f.id === id)!;
    return {
      filter: id,
      name: meta.name,
      current: meta.id === 'atr_volatility' ? `${round(0.18 + rand() * 0.3)}%`
        : meta.id === 'rsi_bounds' ? `${round(30 + rand() * 40, 1)}`
        : meta.id === 'confidence_floor' ? `${confidence}%`
        : meta.id === 'volume_expansion' ? `${round(0.7 + rand() * 0.7)}×`
        : 'Not satisfied',
      required: meta.current,
      note: FILTER_NOTES[id],
    };
  });

  const bias = (confidence - 62) / 60 + (regime === 'Sideways' ? -0.2 : 0.12);
  const checkpoints = buildCheckpoints(rand, direction, bias);
  const { cls, outcomeR } = classify(checkpoints);

  const price = round(BASE_PRICE[asset] * (0.94 + rand() * 0.12), asset === 'XRP' || asset === 'XLM' || asset === 'FET' ? 4 : 2);
  const conditions: MarketConditions = {
    price,
    atrPercent: round(0.18 + rand() * 0.9),
    rsi: round(28 + rand() * 44, 1),
    smaDistance: round(-0.9 + rand() * 1.8),
    volumeRatio: round(0.6 + rand() * 1.4),
    htfTrend: rand() > 0.6 ? 'bullish' : rand() > 0.3 ? 'neutral' : 'bearish',
  };

  const primary = rejections[0];
  const oracle =
    cls === 'Correct Decision'
      ? `The ${primary.name.toLowerCase()} prevented a ${direction.toLowerCase()} on ${asset} that subsequently traded through the stop distance. Evidence supports keeping the filter at its current setting.`
      : cls === 'Neutral Decision'
      ? `Blocking the ${asset} ${direction.toLowerCase()} made little difference — the market drifted inside the noise band for the full 7-day window. No action required.`
      : cls === 'Missed Opportunity'
      ? `The ${primary.name.toLowerCase()} blocked a ${direction.toLowerCase()} on ${asset} that later moved ${checkpoints[checkpoints.length - 1].movePct}% in favour. One observation only — record for pattern analysis.`
      : `A large ${asset} move was missed: the take-profit distance was reached before any adverse excursion. If this pattern repeats, the ${primary.name.toLowerCase()} becomes a research candidate.`;

  return {
    id: `OPP-${String(i + 1).padStart(4, '0')}`,
    asset,
    timestamp,
    specialist,
    regime,
    confidence,
    direction,
    rejections,
    conditions,
    decisionState: `${asset} · ${regime} · ${specialist} · conf ${confidence}% · ATR ${conditions.atrPercent}% · RSI ${conditions.rsi} · vol ${conditions.volumeRatio}×`,
    oracle,
    governance:
      'Rejected under Institutional Validation™ — research/simulation participation state. No capital was at risk and no order was transmitted.',
    checkpoints,
    classification: cls,
    outcomeR,
    lesson:
      cls.includes('Missed')
        ? `${primary.name} suppressed a valid ${regime.toLowerCase()} continuation on ${asset}.`
        : `${primary.name} correctly withheld participation in ${regime.toLowerCase()} conditions on ${asset}.`,
  };
}

function scoreFilters(records: OpportunityRecord[]): FilterScore[] {
  return FILTERS.map((meta) => {
    const hits = records.filter((r) => r.rejections.some((x) => x.filter === meta.id));
    const missed = hits.filter((r) => r.outcomeR > 0);
    const avoided = hits.filter((r) => r.outcomeR <= 0);
    const gross = missed.reduce((s, r) => s + r.outcomeR, 0);
    const saved = Math.abs(avoided.reduce((s, r) => s + r.outcomeR, 0));
    const avgMissedProfit = missed.length ? round(gross / missed.length) : 0;
    const avgAvoidedLoss = avoided.length ? round(saved / avoided.length) : 0;
    const winRate = hits.length ? round((missed.length / hits.length) * 100, 1) : 0;
    const lossRate = round(100 - winRate, 1);
    const ev = hits.length ? round((gross - saved) / hits.length) : 0;
    const pf = saved > 0 ? round(gross / saved) : gross > 0 ? 3 : 0;
    const sharpeImpact = round((saved - gross) / Math.max(4, hits.length), 2);
    const verdict: FilterScore['verdict'] = ev > 0.25 ? 'Restrictive' : ev < -0.15 ? 'Valuable' : 'Balanced';
    return {
      filter: meta,
      blocks: hits.length,
      avgMissedProfit,
      avgAvoidedLoss,
      winRateIfIgnored: winRate,
      lossRateIfIgnored: lossRate,
      expectedValue: ev,
      profitFactor: pf,
      sharpeImpact,
      verdict,
    };
  });
}

function scoreSpecialists(records: OpportunityRecord[]): SpecialistScore[] {
  return SPECIALISTS.map((name, idx) => {
    const rs = records.filter((r) => r.specialist === name);
    const missed = rs.filter((r) => r.classification.includes('Missed'));
    const correct = rs.filter((r) => r.classification === 'Correct Decision');
    const taken = 14 + ((idx * 7) % 23);
    const avgConfidence = rs.length ? round(rs.reduce((s, r) => s + r.confidence, 0) / rs.length, 1) : 0;
    const avgProfit = missed.length ? round(missed.reduce((s, r) => s + r.outcomeR, 0) / missed.length) : 0;
    const avgAvoided = correct.length ? round(Math.abs(correct.reduce((s, r) => s + r.outcomeR, 0)) / correct.length) : 0;
    const ratio = rs.length ? correct.length / rs.length : 0;
    const rating: SpecialistScore['rating'] = ratio > 0.5 ? 'A' : ratio > 0.4 ? 'B' : ratio > 0.3 ? 'C' : 'D';
    return {
      specialist: name,
      signals: rs.length + taken,
      blocked: rs.length,
      taken,
      missed: missed.length,
      correctWaits: correct.length,
      avgConfidence,
      avgProfit,
      avgAvoidedLoss: avgAvoided,
      rating,
    };
  });
}

function buildCandidates(scores: FilterScore[], records: OpportunityRecord[]): ResearchCandidate[] {
  return scores
    .filter((s) => s.verdict === 'Restrictive' && s.filter.current !== s.filter.suggested)
    .sort((a, b) => b.expectedValue - a.expectedValue)
    .slice(0, 4)
    .map((s, i) => {
      const supporting = records.filter(
        (r) => r.rejections.some((x) => x.filter === s.filter.id) && r.outcomeR > 0,
      );
      return {
        id: `RC-${String(i + 1).padStart(2, '0')}`,
        title: `Lower ${s.filter.name}`,
        filter: s.filter,
        evidenceMissedProfit: round(supporting.reduce((t, r) => t + r.outcomeR, 0)),
        expectedImprovement: `+${round(Math.max(0.4, s.expectedValue * 3), 1)}R over 30 days · PF ${s.profitFactor.toFixed(2)} → est. ${(s.profitFactor + 0.12).toFixed(2)}`,
        confidence: Math.min(92, 54 + supporting.length * 3),
        supportingTrades: supporting.length,
        status: 'Awaiting Institutional Approval',
        rationale: `${s.filter.name} blocked ${supporting.length} profitable observations while avoiding an average of ${s.avgAvoidedLoss}R per correct wait. Threshold reduction is a research candidate only.`,
      };
    });
}

export function buildOpportunityAnalysis(now = Date.now(), count = 96): OpportunityAnalysis {
  const records = Array.from({ length: count }, (_, i) => buildRecord(i, now)).sort(
    (a, b) => b.timestamp - a.timestamp,
  );

  const filterScores = scoreFilters(records);
  const specialistScores = scoreSpecialists(records);
  const candidates = buildCandidates(filterScores, records);

  const missedRecords = records.filter((r) => r.outcomeR > 0);
  const avoidedRecords = records.filter((r) => r.outcomeR <= 0);
  const opportunityMissedR = round(missedRecords.reduce((s, r) => s + r.outcomeR, 0));
  const profitProtectedR = round(Math.abs(avoidedRecords.reduce((s, r) => s + r.outcomeR, 0)));
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const correctRate = round(
    (records.filter((r) => r.classification === 'Correct Decision').length / records.length) * 100,
    1,
  );
  const netR = round(profitProtectedR - opportunityMissedR);

  const summary: OpportunitySummary = {
    todayMissed: records.filter((r) => r.timestamp >= dayAgo && r.classification.includes('Missed')).length,
    totalRecords: records.length,
    largestMissedWinner: missedRecords.slice().sort((a, b) => b.outcomeR - a.outcomeR)[0] ?? null,
    largestAvoidedLoser: avoidedRecords.slice().sort((a, b) => a.outcomeR - b.outcomeR)[0] ?? null,
    profitProtectedR,
    opportunityMissedR,
    netR,
    correctRate,
    recommendation:
      netR > 4
        ? 'Waiting is currently protecting institutional capital. Maintain the filter set and continue observation.'
        : netR > 0
        ? 'Filters are broadly balanced. Two thresholds are candidates for supervised research, but no change is warranted today.'
        : 'Filters are suppressing more profit than they protect. Escalate the leading research candidates to the Decision Centre for human review.',
    recommendationStatus: netR > 4 ? 'healthy' : netR > 0 ? 'watch' : 'warning',
  };

  const topRestrictive = filterScores.slice().sort((a, b) => b.expectedValue - a.expectedValue)[0];
  const topValuable = filterScores.slice().sort((a, b) => a.expectedValue - b.expectedValue)[0];

  const oracleReviews = [
    {
      title: `${topValuable.filter.name} — protective`,
      verdict: 'Keep' as const,
      text: `The ${topValuable.filter.name.toLowerCase()} blocked ${topValuable.blocks} signals and avoided an average of ${topValuable.avgAvoidedLoss}R per correct wait. Current evidence supports keeping the filter at ${topValuable.filter.current}.`,
    },
    {
      title: `${topRestrictive.filter.name} — restrictive`,
      verdict: 'Research' as const,
      text: `The ${topRestrictive.filter.name.toLowerCase()} blocked ${topRestrictive.blocks} signals this window, of which ${Math.round((topRestrictive.winRateIfIgnored / 100) * topRestrictive.blocks)} would have been profitable. Recommendation: research a threshold reduction from ${topRestrictive.filter.current} to ${topRestrictive.filter.suggested}. Human approval required.`,
    },
    {
      title: 'Net institutional position',
      verdict: netR > 0 ? ('Keep' as const) : ('Monitor' as const),
      text: `Across ${records.length} rejected signals ATLAS protected ${profitProtectedR}R and missed ${opportunityMissedR}R, a net of ${netR}R. ${summary.recommendation}`,
    },
  ];

  const knowledgeLinks = [
    { label: 'Research', url: '/research', description: 'Opportunity lessons feed the research backlog.' },
    { label: 'Specialists', url: '/specialist-championship', description: 'Report cards inform Elo and belt standings.' },
    { label: 'Strategy', url: '/strategies', description: 'Filter evidence is attached to each strategy version.' },
    { label: 'Market Regime', url: '/institution/forecast', description: 'Regime-tagged outcomes support forecasting.' },
    { label: 'Trade Review', url: '/trade-review', description: 'Rejected signals sit alongside executed audit trails.' },
    { label: 'Institution Memory', url: '/institution/memory', description: 'Completed opportunities become permanent lessons.' },
    { label: 'Decision Centre', url: '/decision-centre', description: 'Research candidates queue for human approval.' },
    { label: 'Audit Vault', url: '/audit-vault', description: 'Every opportunity record is immutably archived.' },
  ];

  return {
    generatedAt: now,
    windowDays: 30,
    records,
    filterScores,
    specialistScores,
    candidates,
    summary,
    oracleReviews,
    knowledgeLinks,
  };
}

export const CLASS_STATUS: Record<OpportunityClass, 'healthy' | 'watch' | 'warning' | 'critical'> = {
  'Correct Decision': 'healthy',
  'Neutral Decision': 'watch',
  'Missed Opportunity': 'warning',
  'Major Missed Opportunity': 'critical',
};
