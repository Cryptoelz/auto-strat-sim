// AI Research Brain™ — institutional research intelligence layer.
// OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY.
// No exchange connectivity, no order placement, no strategy or allocation mutation.

export interface Explain {
  confidence: number;
  reasoning: string;
  evidence: string[];
  counterEvidence: string[];
  requiredValidation: string[];
  linkedModules: { label: string; to: string }[];
}

export interface BrainMetric {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'flat';
  detail: string;
}

export const BRAIN_METRICS: BrainMetric[] = [
  { key: 'iq', label: 'Research IQ', value: '138', delta: '+6 vs last week', trend: 'up', detail: 'Composite of hypothesis quality, validation rigour, prediction accuracy and knowledge reuse.' },
  { key: 'threads', label: 'Active Research Threads', value: '7', delta: '+2 opened', trend: 'up', detail: 'Investigations currently open across specialist, allocation and governance modules.' },
  { key: 'unsolved', label: 'Unsolved Questions', value: '11', delta: '-3 resolved', trend: 'down', detail: 'AI generated questions with no accepted explanation yet.' },
  { key: 'confidence', label: 'AI Confidence', value: '81%', delta: '+4 pts', trend: 'up', detail: 'Mean confidence across all live conclusions, weighted by evidence depth.' },
  { key: 'growth', label: 'Knowledge Growth', value: '+14 lessons', delta: '30-day window', trend: 'up', detail: 'Durable lessons added to institutional memory, excluding raw metric snapshots.' },
  { key: 'velocity', label: 'Research Velocity', value: '3.2 / day', delta: '+0.5', trend: 'up', detail: 'Validated research artefacts produced per simulated day.' },
];

export interface MorningBrief {
  greeting: string;
  intro: string;
  findings: { count: number; label: string; tone: 'info' | 'positive' | 'caution' }[];
  highestValue: string;
  highestValueWhy: string;
  impact: 'VERY HIGH' | 'HIGH' | 'MODERATE';
  thinkingSteps: string[];
}

export const MORNING_BRIEF: MorningBrief = {
  greeting: 'GOOD MORNING',
  intro: 'Overnight I analysed every research module — specialists, allocation labs, championship, governance and the forward validation trial.',
  findings: [
    { count: 3, label: 'unexplained behaviours', tone: 'caution' },
    { count: 2, label: 'improving specialists', tone: 'positive' },
    { count: 1, label: 'degrading relationship', tone: 'caution' },
    { count: 4, label: 'promising research directions', tone: 'info' },
  ],
  highestValue: 'Low-Vol Coiler activation timing',
  highestValueWhy:
    'LVC v2 fires 2.4 candles after compression persistence peaks. Shifting activation earlier is the single highest-leverage unexplored variable: it touches capture %, PF and the sideways regime gap simultaneously.',
  impact: 'VERY HIGH',
  thinkingSteps: [
    'Scanned 6 specialist modules for 30/90-day metric drift.',
    'Cross-referenced regime attribution against Specialist Championship Elo movement.',
    'Detected 1 weakening correlation: MS v2 ↔ Confidence Weighted allocation share.',
    'Ranked 11 open questions by expected research impact × confidence ÷ runtime cost.',
    'Selected the investigation with the largest unexplained variance and lowest runtime cost.',
  ],
};

export type Difficulty = 'Low' | 'Medium' | 'High';

export interface BrainQuestion {
  id: string;
  question: string;
  category: 'Behaviour' | 'Degradation' | 'Design' | 'Efficiency' | 'Regime';
  value: 'Very High' | 'High' | 'Moderate';
  difficulty: Difficulty;
  status: 'open' | 'investigating' | 'answered';
  explain: Explain;
}

export const BRAIN_QUESTIONS: BrainQuestion[] = [
  {
    id: 'Q-101',
    question: 'Why is Bull concentration increasing?',
    category: 'Behaviour',
    value: 'Very High',
    difficulty: 'Medium',
    status: 'investigating',
    explain: {
      confidence: 74,
      reasoning: 'Confidence Weighted allocation rewards recent strength; Trend Rider v1 has led three consecutive windows, compounding its share in bull-classified regimes.',
      evidence: [
        'TR v1 allocation share rose 34% → 47% over 30 days.',
        'Bull regime days: 41% of window vs 29% prior window.',
        'Championship Elo: TR v1 +38 over the same period.',
      ],
      counterEvidence: [
        'Regime classifier may be over-labelling bull; ATR expansion days overlap 18%.',
        'Concentration is still inside the 55% architecture cap.',
      ],
      requiredValidation: ['Regime label audit vs realised direction', 'Allocation cap sensitivity sweep at 40/45/50%'],
      linkedModules: [
        { label: 'Allocation Lab v2', to: '/allocation-lab-v2' },
        { label: 'Specialist Championship', to: '/specialist-championship' },
      ],
    },
  },
  {
    id: 'Q-102',
    question: 'Why did Momentum Scalper v2 weaken?',
    category: 'Degradation',
    value: 'High',
    difficulty: 'Medium',
    status: 'investigating',
    explain: {
      confidence: 69,
      reasoning: 'MS v2 activation gates require High Vol or ATR expansion. The last 30 days contained a prolonged low-volatility stretch, starving the strategy of qualifying setups and lowering sample quality.',
      evidence: ['Qualifying days fell from 19 → 11.', 'PF 1.56 → 1.38 on 22 trades.', 'Average ATR percentile 41 vs 63 prior.'],
      counterEvidence: ['Per-trade expectancy unchanged; the loss is frequency, not edge.'],
      requiredValidation: ['Sample-size adjusted PF confidence interval', 'Re-test with ATR expansion threshold −10%'],
      linkedModules: [
        { label: 'Momentum Scalper v2', to: '/momentum-scalper-v2' },
        { label: 'Forward Validation', to: '/forward-validation' },
      ],
    },
  },
  {
    id: 'Q-103',
    question: 'Can Trend Rider sizing become adaptive?',
    category: 'Design',
    value: 'Very High',
    difficulty: 'High',
    status: 'open',
    explain: {
      confidence: 62,
      reasoning: 'TR v1 uses fixed fractional sizing while its edge is strongly regime-conditional. Scaling size with trend persistence should raise PF without widening drawdown proportionally.',
      evidence: ['Top-quartile trend days produce 63% of TR v1 PnL.', 'Bottom-quartile days contribute −0.4R net.'],
      counterEvidence: ['Adaptive sizing historically increases drawdown clustering.', 'Risk architecture caps per-trade risk at 6%.'],
      requiredValidation: ['Monte Carlo of size ladder', 'Drawdown stress at 3% ceiling', '60-day forward simulation'],
      linkedModules: [
        { label: 'Strategies', to: '/strategies' },
        { label: 'Allocation Production Path', to: '/allocation-production-path' },
      ],
    },
  },
  {
    id: 'Q-104',
    question: 'What causes capital efficiency decay?',
    category: 'Efficiency',
    value: 'High',
    difficulty: 'High',
    status: 'open',
    explain: {
      confidence: 58,
      reasoning: 'Idle capital rises when all five specialists are simultaneously gated. Gate overlap — not individual selectivity — appears to be the dominant driver.',
      evidence: ['Idle capital 27% of days.', 'All-gated overlap occurs on 14% of candles.'],
      counterEvidence: ['Idle days show below-average realised opportunity; some idling is correct.'],
      requiredValidation: ['Gate overlap matrix', 'Counterfactual PnL of forced participation'],
      linkedModules: [
        { label: 'Trade Frequency Audit', to: '/trade-frequency' },
        { label: 'Portfolio Architecture', to: '/portfolio-architecture-review' },
      ],
    },
  },
  {
    id: 'Q-105',
    question: 'Does VCB perform differently after High Vol?',
    category: 'Regime',
    value: 'Moderate',
    difficulty: 'Low',
    status: 'open',
    explain: {
      confidence: 77,
      reasoning: 'Compression following a high-volatility shock is structurally different from drift compression: it resolves faster and with larger range expansion.',
      evidence: ['Post-HighVol VCB PF 1.91 vs 1.48 otherwise.', 'Average hold time 41% shorter.'],
      counterEvidence: ['Only 17 post-HighVol samples — below significance threshold.'],
      requiredValidation: ['Extend sample to 90 days', 'Bootstrap PF interval'],
      linkedModules: [
        { label: 'VCB v1', to: '/vcb-v1' },
        { label: 'Research', to: '/research' },
      ],
    },
  },
  {
    id: 'Q-106',
    question: 'Is Low-Vol Coiler activating too late?',
    category: 'Behaviour',
    value: 'Very High',
    difficulty: 'Medium',
    status: 'investigating',
    explain: {
      confidence: 71,
      reasoning: 'Activation currently confirms compression persistence over 10 candles. Peak compression occurs ~2.4 candles earlier, so the entry consistently forfeits the first leg of expansion.',
      evidence: ['Mean entry lag 2.4 candles behind compression trough.', 'Forfeited move 0.6% average.'],
      counterEvidence: ['Earlier entry raises false-breakout exposure in chop.'],
      requiredValidation: ['Lag sweep 0–4 candles', 'False-signal precision measurement'],
      linkedModules: [
        { label: 'Low-Vol Coiler v2', to: '/low-vol-coiler-v2' },
        { label: 'Specialist Approval Board', to: '/specialist-approval-board' },
      ],
    },
  },
];

export interface Hypothesis {
  id: string;
  title: string;
  statement: string;
  confidence: number;
  supporting: string[];
  counter: string[];
  validation: string[];
  gain: string;
  status: 'proposed' | 'queued' | 'under review' | 'rejected';
  linked: { label: string; to: string }[];
}

export const HYPOTHESES: Hypothesis[] = [
  {
    id: 'HYP-021',
    title: 'Adaptive Trend Rider sizing',
    statement: 'Adaptive Trend Rider sizing increases PF during Bull markets without breaching the 3% drawdown ceiling.',
    confidence: 66,
    supporting: ['63% of TR v1 PnL originates in top-quartile trend persistence days.', 'Fixed sizing under-allocates to the highest expectancy cohort.', 'Bull-regime win rate 61% vs 48% overall.'],
    counter: ['Adaptive sizing amplifies drawdown clustering in false trends.', 'Risk architecture caps per-trade risk at 6%.'],
    validation: ['Monte Carlo 5,000 paths', 'Stress test: Bear + High Vol', '60-day forward simulation', 'Governance review'],
    gain: 'PF 1.82 → est. 2.05',
    status: 'queued',
    linked: [{ label: 'Strategies', to: '/strategies' }, { label: 'Quant Scientist', to: '/quant-scientist' }],
  },
  {
    id: 'HYP-022',
    title: 'Early coil activation',
    statement: 'Advancing Low-Vol Coiler activation by 2 candles increases capture % without lowering precision below 75%.',
    confidence: 72,
    supporting: ['Mean entry lag 2.4 candles.', 'Forfeited first-leg move averages 0.6%.', 'Precision headroom: current 81.6%.'],
    counter: ['Chop regimes historically punish early compression entries.'],
    validation: ['Lag sweep 0–4', 'Precision floor test', 'Sideways stress scenario'],
    gain: 'Capture 64% → est. 71%',
    status: 'proposed',
    linked: [{ label: 'Low-Vol Coiler v2', to: '/low-vol-coiler-v2' }],
  },
  {
    id: 'HYP-023',
    title: 'Gate de-correlation',
    statement: 'Staggering specialist activation gates reduces idle capital by >8 pts with no drawdown increase.',
    confidence: 59,
    supporting: ['All-gated overlap on 14% of candles.', 'Idle capital 27% of days.'],
    counter: ['Forced participation on idle days was negative in a prior counterfactual.'],
    validation: ['Gate overlap matrix', 'Counterfactual PnL', 'DD ceiling test'],
    gain: 'Capital efficiency +8 pts',
    status: 'proposed',
    linked: [{ label: 'Portfolio Architecture', to: '/portfolio-architecture-review' }],
  },
  {
    id: 'HYP-024',
    title: 'Regime-purity concentration cap',
    statement: 'Capping single-specialist allocation at 40% reduces bull concentration risk with <3% PnL cost.',
    confidence: 64,
    supporting: ['TR v1 share reached 47%.', 'Concentration is the top-ranked risk radar item.'],
    counter: ['Capping the strongest specialist mechanically lowers expected PnL.'],
    validation: ['Cap sweep 40/45/50%', 'Sharpe-like score comparison'],
    gain: 'Concentration risk High → Moderate',
    status: 'under review',
    linked: [{ label: 'Allocation Lab v2', to: '/allocation-lab-v2' }],
  },
  {
    id: 'HYP-019',
    title: 'Volume-only breakout filter',
    statement: 'Volume expansion alone is sufficient to filter VCB breakouts.',
    confidence: 21,
    supporting: ['Simplifies the trigger stack.'],
    counter: ['Removing ATR expansion dropped PF 1.64 → 1.19 in simulation.', 'False signal rate doubled.'],
    validation: ['Closed — rejected on evidence.'],
    gain: 'None — negative',
    status: 'rejected',
    linked: [{ label: 'VCB v1', to: '/vcb-v1' }],
  },
];

export interface ExperimentProposal {
  id: string;
  hypothesisId: string;
  name: string;
  modules: string[];
  runtimeDays: number;
  stages: string[];
  cost: 'Low' | 'Medium' | 'High';
  confidence: number;
  expected: string;
  status: 'Proposal' | 'Awaiting review' | 'Deferred';
}

export const EXPERIMENTS: ExperimentProposal[] = [
  {
    id: 'EXP-041', hypothesisId: 'HYP-021', name: 'Adaptive TR sizing ladder',
    modules: ['Strategies', 'Backtest', 'Forward Validation', 'Governance'],
    runtimeDays: 60, stages: ['In-sample', 'Out-of-sample', 'Monte Carlo', 'Stress', 'Governance review'],
    cost: 'High', confidence: 66, expected: 'PF +0.23, DD +0.2%', status: 'Awaiting review',
  },
  {
    id: 'EXP-042', hypothesisId: 'HYP-022', name: 'Coil activation lag sweep',
    modules: ['Low-Vol Coiler v2', 'Backtest', 'Move Capture Audit'],
    runtimeDays: 21, stages: ['Parameter sweep', 'Precision floor', 'Sideways stress'],
    cost: 'Low', confidence: 72, expected: 'Capture +7 pts', status: 'Proposal',
  },
  {
    id: 'EXP-043', hypothesisId: 'HYP-023', name: 'Gate overlap de-correlation study',
    modules: ['Portfolio Architecture', 'Trade Frequency Audit', 'Allocation Lab v2'],
    runtimeDays: 30, stages: ['Overlap matrix', 'Counterfactual PnL', 'DD ceiling test'],
    cost: 'Medium', confidence: 59, expected: 'Idle capital −8 pts', status: 'Proposal',
  },
  {
    id: 'EXP-044', hypothesisId: 'HYP-024', name: 'Concentration cap sweep',
    modules: ['Allocation Lab v2', 'Champion Trial'],
    runtimeDays: 45, stages: ['Cap sweep', 'Sharpe-like comparison', 'Governance review'],
    cost: 'Medium', confidence: 64, expected: 'Concentration risk −1 tier', status: 'Deferred',
  },
];

export interface KnowledgeEvent {
  id: string;
  date: string;
  type: 'Discovery' | 'Rejected' | 'Paper' | 'Architecture' | 'Governance';
  title: string;
  body: string;
  to?: string;
}

export const KNOWLEDGE_TIMELINE: KnowledgeEvent[] = [
  { id: 'K-020', date: '2026-08-02', type: 'Discovery', title: 'Coil activation lag quantified', body: 'Mean 2.4-candle lag behind compression trough identified as the largest unexplained capture gap.', to: '/low-vol-coiler-v2' },
  { id: 'K-019', date: '2026-07-30', type: 'Governance', title: 'Router v2.1 promotion remains locked', body: 'Runtime 30 days and 20 trades not yet satisfied. Status stays Research.', to: '/router-v21' },
  { id: 'K-018', date: '2026-07-28', type: 'Architecture', title: 'Architecture declared Mature', body: 'Five-layer stack verified with redundancy in every layer except regime detection.', to: '/portfolio-architecture-review' },
  { id: 'K-017', date: '2026-07-26', type: 'Paper', title: 'Confidence Weighted Allocation promoted to champion candidate', body: 'PF 2.11 across the research window; entered Champion Forward Trial.', to: '/champion-trial' },
  { id: 'K-016', date: '2026-07-22', type: 'Rejected', title: 'HYP-019 volume-only breakout filter rejected', body: 'Removing ATR expansion cut PF 1.64 → 1.19 and doubled false signals.', to: '/vcb-v1' },
  { id: 'K-015', date: '2026-07-19', type: 'Discovery', title: 'MS v2 low-volatility decay', body: 'Weakness is frequency-driven, not edge-driven: per-trade expectancy unchanged.', to: '/momentum-scalper-v2' },
  { id: 'K-014', date: '2026-07-15', type: 'Paper', title: 'Low-Vol Coiler v2 approved as Specialist #5', body: 'Capture 64%, PF 1.74, diversification score satisfied.', to: '/specialist-approval-board' },
  { id: 'K-013', date: '2026-07-11', type: 'Architecture', title: 'Specialist roster declared complete', body: 'Readiness score 94; coverage map shows no critical regime gap.', to: '/specialist-approval-board' },
  { id: 'K-012', date: '2026-07-05', type: 'Discovery', title: 'XRP 1.8–2.99% band recovery opportunity', body: 'Sub-threshold moves in this band were profitable but unfilled; led to Router v2.1.', to: '/trade-frequency' },
];

export interface Lesson {
  id: string;
  lesson: string;
  domain: string;
  confidence: number;
  observations: number;
  firstLearned: string;
  reinforced: number;
}

export const INSTITUTIONAL_MEMORY: Lesson[] = [
  { id: 'L-01', lesson: 'VCB consistently performs best during Compression → Expansion transitions.', domain: 'Specialist behaviour', confidence: 88, observations: 46, firstLearned: '2026-06-12', reinforced: 7 },
  { id: 'L-02', lesson: 'Trend Rider dominates directional markets and contributes little in chop.', domain: 'Regime fit', confidence: 91, observations: 118, firstLearned: '2026-05-02', reinforced: 12 },
  { id: 'L-03', lesson: 'MS v2 weakens after prolonged low volatility — frequency collapses before edge does.', domain: 'Degradation', confidence: 79, observations: 31, firstLearned: '2026-07-19', reinforced: 3 },
  { id: 'L-04', lesson: 'Concentration above 45% in one specialist precedes drawdown clustering.', domain: 'Risk', confidence: 73, observations: 19, firstLearned: '2026-06-28', reinforced: 4 },
  { id: 'L-05', lesson: 'Threshold reductions recover PnL only where the sub-threshold band was already profitable.', domain: 'Frequency', confidence: 84, observations: 27, firstLearned: '2026-07-05', reinforced: 5 },
  { id: 'L-06', lesson: 'Gating improves PF but costs capital efficiency; the trade-off is non-linear past 25% idle.', domain: 'Architecture', confidence: 68, observations: 22, firstLearned: '2026-07-24', reinforced: 2 },
  { id: 'L-07', lesson: 'Small-sample PF changes below 25 trades are usually noise, not degradation.', domain: 'Method', confidence: 86, observations: 60, firstLearned: '2026-06-01', reinforced: 9 },
];

export interface OpportunityRank {
  id: string;
  title: string;
  impact: number;
  confidence: number;
  timeDays: number;
  evidence: number;
  novelty: number;
  strategic: number;
  to: string;
}

export const OPPORTUNITY_RANKING: OpportunityRank[] = [
  { id: 'OPP-1', title: 'Low-Vol Coiler activation timing', impact: 92, confidence: 72, timeDays: 21, evidence: 84, novelty: 70, strategic: 88, to: '/low-vol-coiler-v2' },
  { id: 'OPP-2', title: 'Adaptive Trend Rider sizing', impact: 88, confidence: 66, timeDays: 60, evidence: 79, novelty: 82, strategic: 90, to: '/strategies' },
  { id: 'OPP-3', title: 'Bull concentration cap', impact: 74, confidence: 64, timeDays: 45, evidence: 71, novelty: 48, strategic: 85, to: '/allocation-lab-v2' },
  { id: 'OPP-4', title: 'Gate de-correlation / idle capital', impact: 70, confidence: 59, timeDays: 30, evidence: 66, novelty: 76, strategic: 72, to: '/portfolio-architecture-review' },
  { id: 'OPP-5', title: 'VCB post-High-Vol behaviour', impact: 58, confidence: 77, timeDays: 14, evidence: 61, novelty: 55, strategic: 60, to: '/vcb-v1' },
  { id: 'OPP-6', title: 'MS v2 sample-size adjusted degradation test', impact: 52, confidence: 69, timeDays: 10, evidence: 74, novelty: 34, strategic: 58, to: '/momentum-scalper-v2' },
];

export function opportunityScore(o: OpportunityRank): number {
  const timeScore = Math.max(0, 100 - o.timeDays * 1.2);
  return Math.round(
    o.impact * 0.3 + o.confidence * 0.2 + timeScore * 0.15 + o.evidence * 0.15 + o.novelty * 0.1 + o.strategic * 0.1,
  );
}

export type RoadmapBucket = 'Current' | 'Next' | 'Future' | 'Completed' | 'Deferred' | 'Blocked';

export interface RoadmapItem {
  id: string;
  title: string;
  bucket: RoadmapBucket;
  note: string;
  to?: string;
}

export const ROADMAP: RoadmapItem[] = [
  { id: 'R-01', title: 'Champion Forward Trial (Confidence Weighted vs Dynamic v1)', bucket: 'Current', note: 'Day 34 of 60 · 31 of 50 trades', to: '/champion-trial' },
  { id: 'R-02', title: 'Low-Vol Coiler activation lag sweep', bucket: 'Current', note: 'Highest-value open investigation', to: '/low-vol-coiler-v2' },
  { id: 'R-03', title: 'Adaptive Trend Rider sizing study', bucket: 'Next', note: 'Awaiting board review of EXP-041', to: '/strategies' },
  { id: 'R-04', title: 'Gate overlap de-correlation', bucket: 'Next', note: 'Proposal drafted, unqueued', to: '/portfolio-architecture-review' },
  { id: 'R-05', title: 'Specialist #6 discovery cycle', bucket: 'Future', note: 'Blocked until roster gap re-emerges', to: '/specialist-discovery-v2' },
  { id: 'R-06', title: 'Cross-asset correlation regime layer', bucket: 'Future', note: 'Concept only', to: '/research' },
  { id: 'R-07', title: 'Low-Vol Coiler v2 approval', bucket: 'Completed', note: 'Specialist #5 approved', to: '/specialist-approval-board' },
  { id: 'R-08', title: 'Portfolio Architecture Review', bucket: 'Completed', note: 'Verdict: Mature', to: '/portfolio-architecture-review' },
  { id: 'R-09', title: 'Concentration cap sweep', bucket: 'Deferred', note: 'Deferred until trial completes to avoid confounding', to: '/allocation-lab-v2' },
  { id: 'R-10', title: 'Router v2.1 promotion', bucket: 'Blocked', note: 'Governance lock: 30 days runtime + 20 trades', to: '/router-v21' },
];

export interface Reflection {
  id: string;
  kind: 'correct' | 'failed' | 'valuable' | 'wasted';
  title: string;
  body: string;
}

export const REFLECTIONS: Reflection[] = [
  { id: 'SR-1', kind: 'correct', title: 'Predicted MS v2 frequency collapse', body: 'Forecast on 2026-07-12 that low-volatility persistence would cut MS v2 trade count by ~40%. Realised: −42%.' },
  { id: 'SR-2', kind: 'correct', title: 'Predicted challenger lead in Champion Trial', body: 'Assigned 72% probability to Confidence Weighted leading at day 30. Confirmed.' },
  { id: 'SR-3', kind: 'failed', title: 'Assumed threshold reduction generalises across assets', body: 'The −10% reduction recovered PnL on XRP but was neutral on BTC. Asset-specific band profitability matters more than the reduction size.' },
  { id: 'SR-4', kind: 'failed', title: 'Underestimated gating cost to capital efficiency', body: 'Expected idle capital ≤18%; realised 27%. Gate overlap was not modelled.' },
  { id: 'SR-5', kind: 'valuable', title: 'XRP sub-threshold band discovery', body: 'Directly produced Router v2.1 — the highest-yield discovery of the quarter.' },
  { id: 'SR-6', kind: 'wasted', title: 'Volume-only breakout filter exploration', body: '9 simulated days spent on a simplification that evidence already argued against. Should have been screened out at hypothesis stage.' },
];

export const LEARNING_SCORE = {
  score: 78,
  grade: 'B+',
  predictionAccuracy: 71,
  hypothesisHitRate: 58,
  wastedEffort: 12,
  note: 'Learning score is a self-assessment of research quality, not of trading performance.',
};

export const EXECUTIVE_RECOMMENDATION = {
  headline: 'Run the Low-Vol Coiler activation lag sweep before any allocation change.',
  body:
    'It is the cheapest experiment on the board (21 days, low cost) with the highest expected research impact, and it resolves an unexplained behaviour that currently contaminates capture-% comparisons across all five specialists. Every allocation study run before this is measured against a known-biased capture baseline.',
  evidence: [
    'Mean activation lag 2.4 candles behind the compression trough.',
    'Average forfeited first-leg move 0.6% per signal.',
    'LVC v2 precision headroom of 6.6 pts above the 75% floor.',
    'Capture % is an input to Confidence Weighted allocation — the bias propagates.',
  ],
  risks: [
    'Earlier activation may raise false-breakout exposure in chop regimes.',
    'Running concurrently with the Champion Trial risks confounding attribution.',
  ],
  benefit: 'Estimated capture 64% → 71%; removes a known bias from allocation inputs.',
  confidence: 72,
  validation: ['Lag sweep 0–4 candles', 'Precision floor ≥75%', 'Sideways stress scenario', 'Governance review before any parameter change'],
  governance: 'Proposal only. No parameter, allocation or strategy change is applied by this module.',
};

export const GOVERNANCE_GUARANTEES = [
  'Observation only — the Brain reads research artefacts and never writes to strategies.',
  'Research only — all outputs are proposals requiring human and board approval.',
  'Simulation only — every figure originates from simulated or historical research runs.',
  'No exchange connectivity, no private API keys, no order placement, ever.',
  'No allocation changes, no governance bypass, no automatic promotion.',
  'Every conclusion carries reasoning, evidence, counter-evidence and required validation.',
];
