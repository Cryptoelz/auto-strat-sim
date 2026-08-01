/**
 * Autonomous Research Engine™ v1
 * Observation / Research / Simulation ONLY.
 * The engine never trades, executes, rebalances, promotes or alters allocations.
 * Every output is advisory and traceable back to a source module.
 */

export type Severity = 'info' | 'positive' | 'warning' | 'critical';
export type Verdict = 'confirmed' | 'needs_more_data' | 'rejected' | 'high_priority';

export type DiscoveryCategory =
  | 'performance'
  | 'risk'
  | 'correlation'
  | 'degradation'
  | 'emerging'
  | 'capital_efficiency'
  | 'diversification'
  | 'regime'
  | 'promotion'
  | 'relationship';

export interface SourceLink {
  label: string;
  url: string;
}

export interface ReviewLine {
  reviewer: 'Research Director' | 'CIO' | 'Risk' | 'Governance';
  comment: string;
  stance: 'support' | 'neutral' | 'caution';
}

export interface TrendPoint {
  day: string;
  value: number;
  baseline: number;
}

export interface Discovery {
  id: string;
  day: number;
  title: string;
  category: DiscoveryCategory;
  severity: Severity;
  description: string;
  confidence: number; // 0-100
  evidence: string[];
  expectedImpact: string;
  links: SourceLink[];
  whyFound: string;
  confidenceCalc: string;
  historicalComparison: string;
  relatedSpecialists: string[];
  trend: TrendPoint[];
  reviews: ReviewLine[];
  verdict: Verdict;
}

export interface Hypothesis {
  id: string;
  statement: string;
  supporting: string[];
  contradicting: string[];
  confidence: number;
  status: 'open' | 'validated' | 'rejected';
  simulation: {
    label: string;
    deltas: { metric: string; before: number; after: number; unit: string; betterHigher: boolean }[];
    note: string;
  };
}

export interface TimelineEntry {
  id: string;
  day: number;
  kind: 'discovery' | 'hypothesis' | 'validation' | 'rejection' | 'confirmation';
  title: string;
  detail: string;
  sourceId: string;
}

export interface FeedItem {
  id: string;
  tag: 'NEW' | 'WARNING' | 'DISCOVERY' | 'CONFIRMED';
  text: string;
  minutesAgo: number;
  severity: Severity;
}

export interface ResearchScore {
  discoveries: number;
  confirmedDiscoveries: number;
  rejectedHypotheses: number;
  researchQuality: number;
  novelty: number;
  evidenceStrength: number;
  executiveUsefulness: number;
  composite: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
}

export interface OvernightReport {
  generatedAt: string;
  biggestDiscovery: string;
  biggestRisk: string;
  biggestImprovement: string;
  biggestRegression: string;
  openQuestions: string[];
  recommendedInvestigations: string[];
  researchConfidence: number;
}

export interface DailyPack {
  day: number;
  dateLabel: string;
  modulesScanned: { module: string; url: string; status: 'clean' | 'signal' | 'flag'; note: string }[];
  headline: string;
  discoveries: Discovery[];
  hypotheses: Hypothesis[];
  overnight: OvernightReport;
  score: ResearchScore;
}

// ─── Modules scanned each research day ───────────────────────────────────────

const MODULES: DailyPack['modulesScanned'] = [
  { module: 'Specialists', url: '/strategies', status: 'signal', note: 'MS v2 activation rate down 6% week-over-week.' },
  { module: 'Championship', url: '/specialist-championship', status: 'signal', note: 'TR v1 holds Gold belt; VCB v1 gained 34 Elo.' },
  { module: 'Allocation Studio', url: '/allocation-lab-v2', status: 'clean', note: 'Confidence Weighted allocation stable at 2.11 PF.' },
  { module: 'Portfolio AI Director', url: '/portfolio-ai-director', status: 'clean', note: 'Board confidence 87, unchanged overnight.' },
  { module: 'AI CIO', url: '/cio', status: 'flag', note: 'Bull Trend concentration alert still open (42% vs 35%).' },
  { module: 'Mission Control', url: '/mission-control', status: 'signal', note: '2 of 5 daily missions relate to promotion blockers.' },
  { module: 'Observation Centre', url: '/observation-center', status: 'flag', note: 'Capital efficiency 0.71 — below 0.80 target.' },
  { module: 'Promotion Gates', url: '/promotion-board', status: 'flag', note: '4 of 6 gates passed; runtime gate incomplete.' },
  { module: 'Production Path', url: '/allocation-production-path', status: 'signal', note: 'Stage 2 of 5; forecast probability 58%.' },
  { module: 'Executive Memory', url: '/research-assistant', status: 'clean', note: '3 new events logged in the last 24h.' },
  { module: 'Research Journal', url: '/journal', status: 'clean', note: 'LVC v2 approval entry indexed.' },
  { module: 'Validation Reports', url: '/forward-validation', status: 'signal', note: 'Success streak 12/60 days; MS v2 drift flagged.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkTrend(start: number, end: number, base: number): TrendPoint[] {
  const n = 14;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const wobble = Math.sin(i * 1.7) * (Math.abs(end - start) * 0.08);
    return {
      day: `D${i + 1}`,
      value: +(start + (end - start) * t + wobble).toFixed(3),
      baseline: +base.toFixed(3),
    };
  });
}

// ─── Discoveries ─────────────────────────────────────────────────────────────

const DISCOVERIES: Discovery[] = [
  {
    id: 'disc-01',
    day: 24,
    title: 'Trend Rider correlation with VCB v1 fell 8%',
    category: 'correlation',
    severity: 'positive',
    description:
      'Rolling 30-day return correlation between Trend Rider v1 and VCB v1 dropped from 0.46 to 0.38, improving the effective diversification of the specialist book.',
    confidence: 84,
    evidence: [
      'Rolling 30d correlation series: 0.46 → 0.38 across the last 12 sessions.',
      'VCB v1 traded 9 compression breakouts while TR v1 was flat or in cash.',
      'Overlap Detector reports shared-signal rate down from 31% to 23%.',
    ],
    expectedImpact: 'Diversification Score +3.1 pts; portfolio DD contribution −0.2%.',
    links: [
      { label: 'Specialist Allocation Lab v2', url: '/allocation-lab-v2' },
      { label: 'Specialist Championship', url: '/specialist-championship' },
      { label: 'VCB v1', url: '/vcb-v1' },
    ],
    whyFound:
      'The correlation scanner compares every specialist pair on a rolling 30-day window and raises a discovery when the change exceeds 5% and persists for 5+ sessions.',
    confidenceCalc:
      'Base 60 (statistical move) +12 (persistence ≥5 sessions) +8 (corroborated by Overlap Detector) +4 (sample ≥ 40 trades) = 84.',
    historicalComparison: 'Previous comparable decoupling (MR v1 vs TR v1, Day 6) held for 19 days before partially reverting.',
    relatedSpecialists: ['Trend Rider v1', 'VCB v1'],
    trend: mkTrend(0.46, 0.38, 0.45),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Clean, persistent signal with an independent second source. Worth tracking to day 30.' },
      { reviewer: 'CIO', stance: 'support', comment: 'Improves the diversification story ahead of the promotion review.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'Correlation gains are regime-sensitive; do not bank the DD benefit yet.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'Advisory only — no allocation change authorised on this evidence.' },
    ],
    verdict: 'confirmed',
  },
  {
    id: 'disc-02',
    day: 24,
    title: 'Momentum Scalper v2 showing early degradation',
    category: 'degradation',
    severity: 'warning',
    description:
      'MS v2 profit factor slid from 1.56 to 1.41 over the trailing 20 trades, driven almost entirely by high-volatility sessions that failed to follow through.',
    confidence: 76,
    evidence: [
      'Trailing-20 PF: 1.56 → 1.41 (−9.6%).',
      'Activation rate down 6% week-over-week; false positives up from 18% to 24%.',
      'Average hold time shortened 22%, suggesting earlier stop-outs.',
    ],
    expectedImpact: 'If sustained, portfolio PF −0.06 and Forward Validation streak reset risk.',
    links: [
      { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' },
      { label: 'Forward Validation', url: '/forward-validation' },
    ],
    whyFound:
      'The degradation scanner flags any specialist whose trailing-20 PF drops more than 8% while its activation precision also falls.',
    confidenceCalc: 'Base 55 (PF drop) +10 (precision decline) +7 (hold-time shift) +4 (consistent across 2 assets) = 76.',
    historicalComparison: 'MS v1 showed an identical pattern 9 days before its sideways-regime collapse.',
    relatedSpecialists: ['Momentum Scalper v2'],
    trend: mkTrend(1.56, 1.41, 1.5),
    reviews: [
      { reviewer: 'Research Director', stance: 'caution', comment: 'Sample is small but the pattern matches a known failure mode.' },
      { reviewer: 'CIO', stance: 'caution', comment: 'Escalate to the watchlist; this is the weakest link in the roster.' },
      { reviewer: 'Risk', stance: 'caution', comment: 'Recommend a research-only exposure review if PF breaches 1.35.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'No de-allocation permitted without 30 trades of evidence.' },
    ],
    verdict: 'high_priority',
  },
  {
    id: 'disc-03',
    day: 23,
    title: 'VCB v1 now contributes positively in all five regimes',
    category: 'performance',
    severity: 'positive',
    description:
      'For the first time since inception, VCB v1 posted a positive contribution in Sideways and Low-Vol alongside its established Bull, Bear and High-Vol edge.',
    confidence: 81,
    evidence: [
      'Regime contribution table now positive in 5/5 buckets.',
      'Sideways PF 1.18 (was 0.94); Low-Vol PF 1.27 (was 1.02).',
      '67% move-capture maintained while adding 11 sideways trades.',
    ],
    expectedImpact: 'Raises VCB weight candidacy in the Confidence Weighted model by ~3%.',
    links: [
      { label: 'VCB v1', url: '/vcb-v1' },
      { label: 'Portfolio Architecture Review', url: '/portfolio-architecture-review' },
    ],
    whyFound: 'The regime scanner recalculates per-regime contribution nightly and raises a discovery on a full-coverage flip.',
    confidenceCalc: 'Base 58 (regime flip) +13 (two regimes, not one) +6 (capture maintained) +4 (no DD increase) = 81.',
    historicalComparison: 'Trend Rider v1 achieved full-regime coverage on Day 11 and retained it for 13 consecutive days.',
    relatedSpecialists: ['VCB v1'],
    trend: mkTrend(1.02, 1.27, 1.0),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Genuine breadth improvement, not a single-trade artefact.' },
      { reviewer: 'CIO', stance: 'support', comment: 'Strengthens the case that the roster is complete.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'Sideways sample is only 11 trades — treat as provisional.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'Observation logged; weighting unchanged.' },
    ],
    verdict: 'needs_more_data',
  },
  {
    id: 'disc-04',
    day: 23,
    title: 'Capital efficiency improving but still below target',
    category: 'capital_efficiency',
    severity: 'info',
    description:
      'Deployed-capital ratio rose from 0.66 to 0.71 as VCB and LVC v2 activation windows widened, yet remains under the 0.80 programme target.',
    confidence: 72,
    evidence: [
      'Average deployed capital 71% vs 66% two weeks ago.',
      'Idle-capital days down from 9 to 6 per 30-day window.',
      'Observation Centre still flags efficiency as the sole amber metric.',
    ],
    expectedImpact: 'Closing the gap to 0.80 would add an estimated +1.4% net PnL over 30 days.',
    links: [
      { label: 'Observation Centre', url: '/observation-center' },
      { label: 'Allocation Production Path', url: '/allocation-production-path' },
    ],
    whyFound: 'Efficiency tracker compares deployed vs available capital nightly against the 0.80 target band.',
    confidenceCalc: 'Base 55 (trend) +10 (two-week persistence) +7 (idle-day corroboration) = 72.',
    historicalComparison: 'Efficiency last exceeded 0.80 during the Day 4-8 high-vol cluster.',
    relatedSpecialists: ['VCB v1', 'Low-Vol Coiler v2'],
    trend: mkTrend(0.66, 0.71, 0.8),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Direction is right; magnitude is not yet decisive.' },
      { reviewer: 'CIO', stance: 'neutral', comment: 'Keep on the executive watchlist until 0.78+.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'Higher deployment must not come from concentration.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'No capital movement authorised.' },
    ],
    verdict: 'needs_more_data',
  },
  {
    id: 'disc-05',
    day: 22,
    title: 'Bull Trend concentration remains the binding promotion blocker',
    category: 'promotion',
    severity: 'critical',
    description:
      'Bull-regime exposure sits at 42% against a 35% governance limit, and it is the single gate preventing the Confidence Weighted allocation advancing past Stage 2.',
    confidence: 90,
    evidence: [
      'Concentration 42% vs 35% cap for 11 consecutive sessions.',
      'Promotion Forecast attributes 17 points of lost probability to this gate.',
      '4 of 6 promotion gates pass; this and runtime are outstanding.',
    ],
    expectedImpact: 'Resolving it would lift modelled promotion probability from 58% to roughly 75%.',
    links: [
      { label: 'Allocation Production Path', url: '/allocation-production-path' },
      { label: 'Promotion Review Board', url: '/promotion-board' },
      { label: 'AI CIO', url: '/cio' },
    ],
    whyFound: 'The promotion scanner cross-references open gates with the forecast model and ranks by probability impact.',
    confidenceCalc: 'Base 70 (hard governance breach) +12 (11-session persistence) +8 (forecast attribution) = 90.',
    historicalComparison: 'A similar Bear-regime breach on Day 9 cleared naturally within 6 sessions as the regime rotated.',
    relatedSpecialists: ['Trend Rider v1', 'Momentum Scalper v2'],
    trend: mkTrend(0.4, 0.42, 0.35),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Unambiguous and reproducible; the highest-value item on the board.' },
      { reviewer: 'CIO', stance: 'support', comment: 'This is the number one executive priority.' },
      { reviewer: 'Risk', stance: 'caution', comment: 'Breach is structural, not incidental — regime rotation alone may not clear it.' },
      { reviewer: 'Governance', stance: 'caution', comment: 'Gate stays locked. No promotion path until exposure is inside the cap.' },
    ],
    verdict: 'high_priority',
  },
  {
    id: 'disc-06',
    day: 22,
    title: 'Low-Vol Coiler v2 activates earlier than its specification predicted',
    category: 'relationship',
    severity: 'info',
    description:
      'LVC v2 is firing on average 3.2 candles before the modelled compression-persistence threshold, an unexpected relationship between BB-width percentile and ATR decay.',
    confidence: 68,
    evidence: [
      'Mean activation lead of 3.2 candles across 27 signals.',
      'Early activations carry a marginally higher PF (1.79 vs 1.71).',
      'No corresponding rise in false breakouts.',
    ],
    expectedImpact: 'Suggests the persistence parameter is conservative; a research-only sensitivity sweep is warranted.',
    links: [
      { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' },
      { label: 'Specialist Discovery Lab v2', url: '/specialist-discovery-v2' },
    ],
    whyFound: 'The relationship scanner compares realised signal timing against specification-modelled timing for every specialist.',
    confidenceCalc: 'Base 50 (timing anomaly) +10 (27-signal sample) +8 (PF corroboration) = 68.',
    historicalComparison: 'VCB v1 showed a 1.8-candle lead in its first validation window that later normalised.',
    relatedSpecialists: ['Low-Vol Coiler v2'],
    trend: mkTrend(1.71, 1.79, 1.7),
    reviews: [
      { reviewer: 'Research Director', stance: 'neutral', comment: 'Interesting but not yet actionable; needs a controlled sweep.' },
      { reviewer: 'CIO', stance: 'neutral', comment: 'Low executive urgency.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'Earlier entries slightly widen stop distance — monitor.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'Parameter changes require a full validation cycle.' },
    ],
    verdict: 'needs_more_data',
  },
  {
    id: 'disc-07',
    day: 21,
    title: 'Router v2.1 edge over Router v2 not statistically separable yet',
    category: 'performance',
    severity: 'info',
    description:
      'The −10% threshold fork leads on net PnL but the difference sits inside the noise band given the current trade count.',
    confidence: 63,
    evidence: [
      'PnL difference +5.8% with a modelled ±6.4% noise band.',
      'Only 23 of the required 30 runtime days completed.',
      'PF difference +0.04 — inside single-trade sensitivity.',
    ],
    expectedImpact: 'No allocation implication until the trade-count gate is met.',
    links: [
      { label: 'Router v2.1', url: '/router-v21' },
      { label: 'Champion Trial', url: '/champion-trial' },
    ],
    whyFound: 'The A/B scanner tests every challenger-control pair against its own noise band each night.',
    confidenceCalc: 'Base 45 (directional lead) +10 (consistent sign) +8 (no DD penalty) = 63.',
    historicalComparison: 'Dynamic Allocation v1 needed 41 days before its lead became separable.',
    relatedSpecialists: ['Router v2', 'Router v2.1'],
    trend: mkTrend(2.1, 5.8, 6.4),
    reviews: [
      { reviewer: 'Research Director', stance: 'neutral', comment: 'Correctly withheld — the sample cannot support a verdict.' },
      { reviewer: 'CIO', stance: 'neutral', comment: 'Hold the challenger narrative until day 30.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'No added risk observed.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'Promotion remains locked per the v2.1 charter.' },
    ],
    verdict: 'needs_more_data',
  },
  {
    id: 'disc-08',
    day: 21,
    title: 'Regime detector shifted to Bull-leaning three sessions early',
    category: 'regime',
    severity: 'warning',
    description:
      'The regime classifier flipped to Bull while HTF trend confirmation was still pending, briefly widening specialist activation before reverting.',
    confidence: 70,
    evidence: [
      'Classifier flip at session 19 vs HTF confirmation at session 22.',
      'Three specialists activated during the unconfirmed window.',
      'Net effect was flat, but exposure momentarily reached 46%.',
    ],
    expectedImpact: 'Adds transient concentration risk; contributes to the Bull-exposure blocker.',
    links: [
      { label: 'Portfolio Architecture Review', url: '/portfolio-architecture-review' },
      { label: 'Observation Centre', url: '/observation-center' },
    ],
    whyFound: 'The regime scanner reconciles classifier state against HTF confirmation and flags divergences over 2 sessions.',
    confidenceCalc: 'Base 52 (divergence) +10 (3-session gap) +8 (exposure spike corroboration) = 70.',
    historicalComparison: 'A 2-session divergence on Day 13 produced a similar, self-correcting exposure spike.',
    relatedSpecialists: ['Trend Rider v1', 'Momentum Scalper v2', 'VCB v1'],
    trend: mkTrend(0.38, 0.46, 0.35),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Reproducible and mechanically explainable.' },
      { reviewer: 'CIO', stance: 'caution', comment: 'Feeds directly into the top promotion blocker.' },
      { reviewer: 'Risk', stance: 'caution', comment: 'Transient 46% exposure exceeded the cap — must be logged.' },
      { reviewer: 'Governance', stance: 'caution', comment: 'Logged as a governance observation; no automated response.' },
    ],
    verdict: 'confirmed',
  },
  {
    id: 'disc-09',
    day: 20,
    title: 'Mean Reversion v1 emerging as the strongest sideways contributor',
    category: 'emerging',
    severity: 'positive',
    description:
      'MR v1 has quietly taken the sideways-regime lead from VCB v1, with a 1.62 PF over the last 30 sideways sessions.',
    confidence: 74,
    evidence: [
      'Sideways PF 1.62 vs VCB 1.18 over the same window.',
      'Regime-specific Elo up 46 points.',
      'Drawdown contribution unchanged at 0.6%.',
    ],
    expectedImpact: 'Supports a modest research-only weight tilt toward MR v1 in sideways regimes.',
    links: [
      { label: 'Specialist Championship', url: '/specialist-championship' },
      { label: 'Specialist Allocation Lab v2', url: '/allocation-lab-v2' },
    ],
    whyFound: 'The emerging-specialist scanner ranks regime-specific Elo deltas over rolling 30-session windows.',
    confidenceCalc: 'Base 55 (Elo delta) +11 (PF gap) +8 (no DD cost) = 74.',
    historicalComparison: 'VCB v1 made a comparable regime takeover on Day 14 that persisted 9 days.',
    relatedSpecialists: ['Mean Reversion v1', 'VCB v1'],
    trend: mkTrend(1.31, 1.62, 1.4),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Well-evidenced regime leadership change.' },
      { reviewer: 'CIO', stance: 'support', comment: 'Useful counterweight to the Bull concentration issue.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'No incremental drawdown observed.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'Advisory only; Allocation Studio unchanged.' },
    ],
    verdict: 'confirmed',
  },
  {
    id: 'disc-10',
    day: 20,
    title: 'Diversification Score improved to 78 on lower shared-signal rate',
    category: 'diversification',
    severity: 'positive',
    description:
      'Shared-signal overlap across the five-specialist roster fell to 23%, lifting the Diversification Score from 74 to 78.',
    confidence: 79,
    evidence: [
      'Overlap 31% → 23% across 12 sessions.',
      'Diversification Score 74 → 78.',
      'No specialist pair now exceeds the 60% rejection threshold.',
    ],
    expectedImpact: 'Improves portfolio readiness and marginally lowers modelled tail drawdown.',
    links: [
      { label: 'Specialist Approval Board', url: '/specialist-approval-board' },
      { label: 'Specialist Discovery Lab v2', url: '/specialist-discovery-v2' },
    ],
    whyFound: 'The diversification scanner recomputes the pairwise overlap matrix nightly.',
    confidenceCalc: 'Base 60 (score move) +12 (matrix-wide, not pairwise) +7 (persistence) = 79.',
    historicalComparison: 'Score last sat at 78 on Day 12, before MS v2 activation widened.',
    relatedSpecialists: ['Trend Rider v1', 'Mean Reversion v1', 'Momentum Scalper v2', 'VCB v1', 'Low-Vol Coiler v2'],
    trend: mkTrend(74, 78, 75),
    reviews: [
      { reviewer: 'Research Director', stance: 'support', comment: 'Consistent with the TR/VCB decoupling discovery.' },
      { reviewer: 'CIO', stance: 'support', comment: 'Directly strengthens portfolio readiness.' },
      { reviewer: 'Risk', stance: 'neutral', comment: 'Tail-risk benefit is modelled, not observed.' },
      { reviewer: 'Governance', stance: 'neutral', comment: 'No action required.' },
    ],
    verdict: 'confirmed',
  },
];

// ─── Hypotheses ──────────────────────────────────────────────────────────────

const HYPOTHESES: Hypothesis[] = [
  {
    id: 'hyp-01',
    statement: 'Reducing Trend Rider v1 by 4% may improve diversification without material PnL loss.',
    supporting: [
      'TR v1 accounts for 42% of Bull-regime exposure — the binding promotion blocker.',
      'TR/VCB correlation has fallen 8%, so redistributed weight is less duplicative.',
      'Diversification Score is already trending up on lower overlap.',
    ],
    contradicting: [
      'TR v1 holds the Gold belt at 1742 Elo and is the top PnL contributor.',
      'Reducing the strongest specialist historically cost 1.1% net PnL in the Day-9 sweep.',
    ],
    confidence: 71,
    status: 'open',
    simulation: {
      label: 'Simulate −4% Trend Rider weight',
      deltas: [
        { metric: 'Profit Factor', before: 2.11, after: 2.06, unit: '', betterHigher: true },
        { metric: 'Max Drawdown', before: 2.8, after: 2.5, unit: '%', betterHigher: false },
        { metric: 'Bull Concentration', before: 42, after: 36, unit: '%', betterHigher: false },
        { metric: 'Diversification', before: 78, after: 83, unit: '', betterHigher: true },
        { metric: 'Promotion Probability', before: 58, after: 71, unit: '%', betterHigher: true },
      ],
      note: 'Simulation only. No allocation is changed and no governance gate is bypassed.',
    },
  },
  {
    id: 'hyp-02',
    statement: 'Momentum Scalper v2 is becoming regime-specific rather than broadly degrading.',
    supporting: [
      'PF holds at 1.58 in confirmed High-Vol but falls to 1.12 in unconfirmed Bull.',
      'Activation precision decline is concentrated in the early-flip window.',
      'Hold-time compression appears only in the unconfirmed regime bucket.',
    ],
    contradicting: [
      'Trailing-20 PF fell across both assets, not just one regime.',
      'MS v1 showed the same signature before a genuine collapse.',
    ],
    confidence: 66,
    status: 'open',
    simulation: {
      label: 'Simulate HTF-confirmed activation only',
      deltas: [
        { metric: 'MS v2 Profit Factor', before: 1.41, after: 1.59, unit: '', betterHigher: true },
        { metric: 'MS v2 Trades / Day', before: 2.4, after: 1.6, unit: '', betterHigher: true },
        { metric: 'Portfolio PF', before: 2.11, after: 2.14, unit: '', betterHigher: true },
        { metric: 'Max Drawdown', before: 2.8, after: 2.6, unit: '%', betterHigher: false },
      ],
      note: 'Research sweep only. No parameter is written to the live specialist.',
    },
  },
  {
    id: 'hyp-03',
    statement: 'VCB v1 is becoming an independent all-regime contributor rather than a specialist.',
    supporting: [
      'Positive contribution in 5/5 regimes for the first time.',
      'Correlation to every other specialist now below 0.40.',
      'Capture rate held at 67% while breadth widened.',
    ],
    contradicting: [
      'Sideways and Low-Vol samples are 11 and 14 trades respectively.',
      'Its edge in those regimes is thinner than the dedicated specialists.',
    ],
    confidence: 62,
    status: 'open',
    simulation: {
      label: 'Simulate VCB as an all-regime core sleeve',
      deltas: [
        { metric: 'Profit Factor', before: 2.11, after: 2.09, unit: '', betterHigher: true },
        { metric: 'Regime Coverage', before: 4, after: 5, unit: '/5', betterHigher: true },
        { metric: 'Capital Efficiency', before: 0.71, after: 0.78, unit: '', betterHigher: true },
        { metric: 'Max Drawdown', before: 2.8, after: 2.9, unit: '%', betterHigher: false },
      ],
      note: 'Hypothetical structure only. The Allocation Studio is untouched.',
    },
  },
  {
    id: 'hyp-04',
    statement: 'Low-Vol Coiler v2 activation window opens earlier than its specification requires.',
    supporting: [
      'Mean 3.2-candle activation lead across 27 signals.',
      'Early activations show a marginally higher PF (1.79 vs 1.71).',
      'No increase in false breakouts at the earlier trigger.',
    ],
    contradicting: [
      'Earlier entries widen the ATR stop distance by roughly 8%.',
      'The sample spans only two of the four validated assets.',
    ],
    confidence: 58,
    status: 'open',
    simulation: {
      label: 'Simulate −2 candle persistence requirement',
      deltas: [
        { metric: 'LVC v2 Profit Factor', before: 1.74, after: 1.78, unit: '', betterHigher: true },
        { metric: 'LVC v2 Capture', before: 64, after: 69, unit: '%', betterHigher: true },
        { metric: 'LVC v2 Max Drawdown', before: 3.4, after: 3.8, unit: '%', betterHigher: false },
        { metric: 'Trades / Week', before: 3.1, after: 4.0, unit: '', betterHigher: true },
      ],
      note: 'Sensitivity sweep only. Requires a full validation cycle before any change.',
    },
  },
  {
    id: 'hyp-05',
    statement: 'Capital efficiency can reach 0.80 through wider low-vol coverage rather than larger positions.',
    supporting: [
      'Idle-capital days fell from 9 to 6 as LVC v2 and VCB widened activation.',
      'Efficiency rose 0.66 → 0.71 with no increase in position size.',
      'Low-vol sessions still account for 6 of the remaining idle days.',
    ],
    contradicting: [
      'Remaining idle days cluster in unclassifiable chop where no specialist qualifies.',
      'Forcing coverage there previously cost PF in the LVC v1 validation.',
    ],
    confidence: 64,
    status: 'validated',
    simulation: {
      label: 'Simulate widened low-vol coverage',
      deltas: [
        { metric: 'Capital Efficiency', before: 0.71, after: 0.79, unit: '', betterHigher: true },
        { metric: 'Net PnL (30d)', before: 8.4, after: 9.7, unit: '%', betterHigher: true },
        { metric: 'Profit Factor', before: 2.11, after: 2.04, unit: '', betterHigher: true },
        { metric: 'Max Drawdown', before: 2.8, after: 2.9, unit: '%', betterHigher: false },
      ],
      note: 'Advisory simulation. Capital is never moved by this engine.',
    },
  },
  {
    id: 'hyp-06',
    statement: 'Router v2.1 threshold reduction adds trade frequency without a drawdown penalty.',
    supporting: [
      'Trades per week up 18% with drawdown flat at 2.6%.',
      'Sub-threshold capture improved in the XRP 1.8-2.99% band as predicted.',
    ],
    contradicting: [
      'PnL lead of 5.8% sits inside the ±6.4% noise band.',
      'Only 23 of 30 required runtime days completed.',
    ],
    confidence: 55,
    status: 'rejected',
    simulation: {
      label: 'Simulate a further −10% threshold cut',
      deltas: [
        { metric: 'Trades / Week', before: 11.8, after: 14.2, unit: '', betterHigher: true },
        { metric: 'Profit Factor', before: 1.92, after: 1.74, unit: '', betterHigher: true },
        { metric: 'Max Drawdown', before: 2.6, after: 3.5, unit: '%', betterHigher: false },
        { metric: 'Win Rate', before: 54, after: 49, unit: '%', betterHigher: true },
      ],
      note: 'Rejected: the simulated PF and drawdown cost outweighs the frequency gain.',
    },
  },
];

// ─── Timeline ────────────────────────────────────────────────────────────────

const TIMELINE: TimelineEntry[] = [
  { id: 'tl-01', day: 24, kind: 'discovery', title: 'TR/VCB correlation fell 8%', detail: 'Raised by the correlation scanner and corroborated by the Overlap Detector.', sourceId: 'disc-01' },
  { id: 'tl-02', day: 24, kind: 'confirmation', title: 'Correlation discovery confirmed', detail: 'Research Director and CIO both supported; Risk neutral.', sourceId: 'disc-01' },
  { id: 'tl-03', day: 24, kind: 'discovery', title: 'MS v2 degradation flagged', detail: 'Trailing-20 PF fell 9.6% with precision decline.', sourceId: 'disc-02' },
  { id: 'tl-04', day: 24, kind: 'hypothesis', title: 'MS v2 may be regime-specific, not degrading', detail: 'Split-regime PF evidence generated automatically.', sourceId: 'hyp-02' },
  { id: 'tl-05', day: 23, kind: 'discovery', title: 'VCB positive in all five regimes', detail: 'Sideways and Low-Vol contribution flipped positive.', sourceId: 'disc-03' },
  { id: 'tl-06', day: 23, kind: 'validation', title: 'Capital efficiency hypothesis validated', detail: 'Wider low-vol coverage explains the 0.66 → 0.71 move.', sourceId: 'hyp-05' },
  { id: 'tl-07', day: 22, kind: 'discovery', title: 'Bull concentration confirmed as binding blocker', detail: '42% vs 35% cap for 11 sessions; 17 points of lost probability.', sourceId: 'disc-05' },
  { id: 'tl-08', day: 22, kind: 'hypothesis', title: 'Trim Trend Rider by 4%', detail: 'Generated in response to the concentration blocker.', sourceId: 'hyp-01' },
  { id: 'tl-09', day: 22, kind: 'discovery', title: 'LVC v2 activates 3.2 candles early', detail: 'Timing anomaly detected against specification model.', sourceId: 'disc-06' },
  { id: 'tl-10', day: 21, kind: 'rejection', title: 'Further Router threshold cut rejected', detail: 'Simulated PF 1.92 → 1.74 with drawdown up 0.9%.', sourceId: 'hyp-06' },
  { id: 'tl-11', day: 21, kind: 'discovery', title: 'Regime detector flipped three sessions early', detail: 'Transient exposure spike to 46% recorded.', sourceId: 'disc-08' },
  { id: 'tl-12', day: 20, kind: 'discovery', title: 'MR v1 takes sideways leadership', detail: 'Regime Elo up 46 points with PF 1.62.', sourceId: 'disc-09' },
  { id: 'tl-13', day: 20, kind: 'confirmation', title: 'Diversification Score confirmed at 78', detail: 'Overlap matrix-wide improvement, no pair above threshold.', sourceId: 'disc-10' },
];

// ─── Feed ────────────────────────────────────────────────────────────────────

const FEED: FeedItem[] = [
  { id: 'f-01', tag: 'NEW', text: 'Trend Rider correlation with VCB reduced by 8%.', minutesAgo: 6, severity: 'positive' },
  { id: 'f-02', tag: 'WARNING', text: 'Momentum Scalper v2 trailing-20 profit factor down to 1.41.', minutesAgo: 19, severity: 'warning' },
  { id: 'f-03', tag: 'NEW', text: 'Capital efficiency improving — 0.66 → 0.71.', minutesAgo: 42, severity: 'info' },
  { id: 'f-04', tag: 'DISCOVERY', text: 'VCB v1 now contributes positively in all five regimes.', minutesAgo: 78, severity: 'positive' },
  { id: 'f-05', tag: 'WARNING', text: 'Bull Trend concentration 42% — governance cap is 35%.', minutesAgo: 121, severity: 'critical' },
  { id: 'f-06', tag: 'NEW', text: 'Low-Vol Coiler v2 activating 3.2 candles ahead of specification.', minutesAgo: 165, severity: 'info' },
  { id: 'f-07', tag: 'CONFIRMED', text: 'Diversification Score confirmed at 78 (from 74).', minutesAgo: 210, severity: 'positive' },
  { id: 'f-08', tag: 'DISCOVERY', text: 'Mean Reversion v1 has taken sideways-regime leadership.', minutesAgo: 264, severity: 'positive' },
  { id: 'f-09', tag: 'WARNING', text: 'Regime classifier flipped Bull three sessions before HTF confirmation.', minutesAgo: 305, severity: 'warning' },
  { id: 'f-10', tag: 'NEW', text: 'Router v2.1 lead of 5.8% remains inside the noise band.', minutesAgo: 360, severity: 'info' },
];

// ─── Score & overnight report ────────────────────────────────────────────────

const SCORE: ResearchScore = {
  discoveries: 10,
  confirmedDiscoveries: 4,
  rejectedHypotheses: 1,
  researchQuality: 84,
  novelty: 71,
  evidenceStrength: 79,
  executiveUsefulness: 88,
  composite: 81,
  grade: 'A',
};

const OVERNIGHT: OvernightReport = {
  generatedAt: 'Research Day 24 — 06:00 simulated',
  biggestDiscovery: 'Trend Rider and VCB v1 have decoupled by 8%, lifting the Diversification Score to 78 and materially improving the portfolio readiness case.',
  biggestRisk: 'Bull Trend concentration at 42% against a 35% governance cap remains the binding promotion blocker and is structural rather than incidental.',
  biggestImprovement: 'Capital efficiency rose from 0.66 to 0.71 on wider low-vol coverage, cutting idle-capital days from nine to six per 30-day window.',
  biggestRegression: 'Momentum Scalper v2 trailing-20 profit factor slid from 1.56 to 1.41 with activation precision falling from 82% to 76%.',
  openQuestions: [
    'Is MS v2 degrading outright, or only in the unconfirmed-Bull window?',
    'Will the TR/VCB decoupling persist past 30 sessions, or revert as it did on Day 6?',
    'Can capital efficiency reach 0.80 without adding Bull-regime exposure?',
    'Does the LVC v2 activation lead hold on BTC and ETH, or only the two sampled assets?',
  ],
  recommendedInvestigations: [
    'Run a regime-split PF study on MS v2 across confirmed vs unconfirmed Bull sessions.',
    'Sensitivity sweep of the Trend Rider weight between −2% and −6% for concentration relief.',
    'Extend the LVC v2 activation-timing study to all four validated assets.',
    'Model whether the early regime flip alone explains the 46% transient exposure spike.',
  ],
  researchConfidence: 82,
};

// ─── Daily pack ──────────────────────────────────────────────────────────────

export const DAILY_PACK: DailyPack = {
  day: 24,
  dateLabel: 'Research Day 24',
  modulesScanned: MODULES,
  headline:
    'Twelve modules scanned overnight. Diversification improved on TR/VCB decoupling, while Bull concentration remains the single binding promotion blocker and MS v2 shows early degradation.',
  discoveries: DISCOVERIES,
  hypotheses: HYPOTHESES,
  overnight: OVERNIGHT,
  score: SCORE,
};

export const RESEARCH_TIMELINE = TIMELINE;
export const DISCOVERY_FEED = FEED;

export const GOVERNANCE_GUARANTEES = [
  'Never changes allocations',
  'Never changes parameters',
  'Never promotes strategies',
  'Never executes trades',
  'Never moves capital',
];

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: 'Info',
  positive: 'Positive',
  warning: 'Warning',
  critical: 'Critical',
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  confirmed: 'Confirmed',
  needs_more_data: 'Needs More Data',
  rejected: 'Rejected',
  high_priority: 'High Priority',
};

export const CATEGORY_LABEL: Record<DiscoveryCategory, string> = {
  performance: 'Performance',
  risk: 'Risk',
  correlation: 'Correlation',
  degradation: 'Degradation',
  emerging: 'Emerging Specialist',
  capital_efficiency: 'Capital Efficiency',
  diversification: 'Diversification',
  regime: 'Regime Shift',
  promotion: 'Promotion Blocker',
  relationship: 'Unexpected Relationship',
};
