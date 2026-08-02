/**
 * AI Quant Scientist™ v1
 * Observation / Research / Simulation ONLY.
 * Never trades, never allocates, never promotes, never writes to Portfolio Manager.
 * Every hypothesis is advisory and must pass the existing governance pipeline.
 */

export interface QsLink { label: string; url: string }

export type ScanModule =
  | 'Specialists' | 'Championship' | 'Validation Reports' | 'Allocation Studio'
  | 'Portfolio AI Director' | 'CIO' | 'Autonomous Research Engine'
  | 'Executive Memory' | 'Journals' | 'Promotion History' | 'Regime Database';

export type DiscoveryKind =
  | 'recurring_weakness' | 'hidden_relationship' | 'behavioural_overlap'
  | 'parameter_sensitivity' | 'regime_transition' | 'diversification'
  | 'capital_inefficiency' | 'correlation_shift' | 'timing_anomaly' | 'risk_asymmetry';

export const KIND_LABEL: Record<DiscoveryKind, string> = {
  recurring_weakness: 'Recurring Weakness',
  hidden_relationship: 'Hidden Relationship',
  behavioural_overlap: 'Behavioural Overlap',
  parameter_sensitivity: 'Parameter Sensitivity',
  regime_transition: 'Regime Transition',
  diversification: 'Diversification',
  capital_inefficiency: 'Capital Inefficiency',
  correlation_shift: 'Correlation Shift',
  timing_anomaly: 'Timing Anomaly',
  risk_asymmetry: 'Risk Asymmetry',
};

export interface ResearchCandidate {
  id: string;
  kind: DiscoveryKind;
  title: string;
  sources: ScanModule[];
  observation: string;
  strength: number; // 0-100
  links: QsLink[];
}

export type PipelineStage =
  | 'idea' | 'hypothesis' | 'paper' | 'validation_proposal'
  | 'simulation' | 'peer_review' | 'championship_candidate'
  | 'approval_board' | 'production_path';

export const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'idea', label: 'Idea' },
  { id: 'hypothesis', label: 'Hypothesis' },
  { id: 'paper', label: 'Research Paper' },
  { id: 'validation_proposal', label: 'Validation Proposal' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'peer_review', label: 'Peer Review' },
  { id: 'championship_candidate', label: 'Championship Candidate' },
  { id: 'approval_board', label: 'Approval Board' },
  { id: 'production_path', label: 'Production Path' },
];

export type ValidationType =
  | 'Historical Validation' | 'Cross Asset Validation' | 'Monte Carlo'
  | 'Stress Test' | 'Walk Forward' | 'Regime Isolation'
  | 'Parameter Sensitivity' | 'Out-of-Sample';

export interface ValidationProposal {
  type: ValidationType;
  design: string;
  datasets: string;
  passGate: string;
  estRuntime: string;
}

export interface Scores {
  innovation: number;
  originality: number;
  researchQuality: number;
  evidenceStrength: number;
  validationReadiness: number;
  commercialValue: number;
  executiveInterest: number;
}

export interface PeerReview {
  reviewer: 'Research Director' | 'Risk Officer' | 'CIO';
  summary: string;
  confidence: number;
  approval: 'approve' | 'approve_with_conditions' | 'reject';
  concerns: string[];
  recommendations: string[];
}

export type BoardOutcome =
  | 'approved_for_validation' | 'needs_more_evidence' | 'rejected' | 'archive' | 'deferred';

export const BOARD_LABEL: Record<BoardOutcome, string> = {
  approved_for_validation: 'Approved for Validation',
  needs_more_evidence: 'Needs More Evidence',
  rejected: 'Rejected',
  archive: 'Archive',
  deferred: 'Deferred',
};

export interface Paper {
  executiveSummary: string;
  background: string;
  problemStatement: string;
  hypothesis: string;
  supportingEvidence: string[];
  counterArguments: string[];
  expectedMetrics: { metric: string; baseline: string; expected: string }[];
  validationPlan: string[];
  knownRisks: string[];
  governanceStatus: string;
  references: QsLink[];
}

export interface Explainability {
  whyExists: string;
  supporting: string[];
  contradicting: string[];
  assumptions: string[];
  dataNeeded: string[];
  confidenceRationale: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  candidateId: string;
  createdDay: number;
  problem: string;
  supporting: string[];
  contradicting: string[];
  expectedBenefit: string;
  expectedRisks: string[];
  confidence: number;
  novelty: number;
  priority: 'high' | 'medium' | 'low';
  stage: PipelineStage;
  scores: Scores;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  validations: ValidationProposal[];
  reviews: PeerReview[];
  board: BoardOutcome;
  boardRationale: string;
  paper: Paper;
  explain: Explainability;
  fastestValidationDays: number;
  riskScore: number;
  links: QsLink[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'discovery' | 'hypothesis' | 'strategy' | 'regime' | 'paper' | 'validation' | 'specialist';
  x: number;
  y: number;
  detail: string;
  url?: string;
}

export interface GraphEdge { from: string; to: string }

// ─── Section 2 — Discovery Engine ────────────────────────────────────────────

export const SCAN_MODULES: { module: ScanModule; url: string; records: number; lastScan: string }[] = [
  { module: 'Specialists', url: '/strategies', records: 5, lastScan: '02:14' },
  { module: 'Championship', url: '/specialist-championship', records: 148, lastScan: '02:15' },
  { module: 'Validation Reports', url: '/forward-validation', records: 36, lastScan: '02:16' },
  { module: 'Allocation Studio', url: '/allocation-lab-v2', records: 12, lastScan: '02:17' },
  { module: 'Portfolio AI Director', url: '/portfolio-ai-director', records: 24, lastScan: '02:18' },
  { module: 'CIO', url: '/cio', records: 18, lastScan: '02:19' },
  { module: 'Autonomous Research Engine', url: '/autonomous-research', records: 31, lastScan: '02:20' },
  { module: 'Executive Memory', url: '/research-assistant', records: 64, lastScan: '02:21' },
  { module: 'Journals', url: '/journal', records: 87, lastScan: '02:22' },
  { module: 'Promotion History', url: '/promotion-board', records: 9, lastScan: '02:23' },
  { module: 'Regime Database', url: '/research', records: 412, lastScan: '02:24' },
];

export const CANDIDATES: ResearchCandidate[] = [
  {
    id: 'RC-01', kind: 'recurring_weakness',
    title: 'Compression exits fire before expansion completes',
    sources: ['Validation Reports', 'Journals', 'Specialists'],
    observation: 'VCB v1 and LVC v2 both close 38% of winners inside the first expansion candle; the median unrealised move continues a further 0.9R after exit.',
    strength: 84,
    links: [{ label: 'VCB v1', url: '/vcb-v1' }, { label: 'LVC v2', url: '/low-vol-coiler-v2' }],
  },
  {
    id: 'RC-02', kind: 'hidden_relationship',
    title: 'Regime-confidence and specialist PF are near-linear above 0.62',
    sources: ['Regime Database', 'Allocation Studio', 'Portfolio AI Director'],
    observation: 'Across 412 regime windows, specialist PF rises ~0.11 per +0.10 regime confidence once confidence exceeds 0.62, then plateaus.',
    strength: 79,
    links: [{ label: 'Allocation Lab v2', url: '/allocation-lab-v2' }],
  },
  {
    id: 'RC-03', kind: 'behavioural_overlap',
    title: 'MS v2 and VCB v1 share 41% of entry candles in High Vol',
    sources: ['Championship', 'Specialists'],
    observation: 'Entry-timestamp overlap climbs from 12% (all regimes) to 41% in High Vol, concentrating risk exactly when position sizing is largest.',
    strength: 72,
    links: [{ label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' }, { label: 'VCB v1', url: '/vcb-v1' }],
  },
  {
    id: 'RC-04', kind: 'parameter_sensitivity',
    title: 'Router thresholds are the single most sensitive parameter in the stack',
    sources: ['Promotion History', 'Validation Reports'],
    observation: 'A -10% threshold change moved Router capture by +7.4pp with only -0.03 PF; the response curve is still steep at -20%.',
    strength: 76,
    links: [{ label: 'Router v2.1', url: '/router-v21' }, { label: 'Trade Frequency Audit', url: '/trade-frequency' }],
  },
  {
    id: 'RC-05', kind: 'regime_transition',
    title: 'Transition candles are unowned by every specialist',
    sources: ['Regime Database', 'Autonomous Research Engine'],
    observation: 'The 6-12 candle window between Low Vol and High Vol shows 0.31% of total PnL captured while representing 8.4% of realised range.',
    strength: 81,
    links: [{ label: 'Autonomous Research', url: '/autonomous-research' }],
  },
  {
    id: 'RC-06', kind: 'capital_inefficiency',
    title: 'Capital efficiency stuck at 0.71 due to idle Sideways days',
    sources: ['CIO', 'Portfolio AI Director', 'Executive Memory'],
    observation: '29% of days deploy under 20% of allocated capital; nearly all are Sideways/Low-Vol classified.',
    strength: 88,
    links: [{ label: 'CIO', url: '/cio' }, { label: 'Portfolio AI Director', url: '/portfolio-ai-director' }],
  },
  {
    id: 'RC-07', kind: 'correlation_shift',
    title: 'Specialist correlation rises to 0.58 during drawdown clusters',
    sources: ['Championship', 'Validation Reports'],
    observation: 'Pairwise return correlation averages 0.21 but spikes to 0.58 inside the worst 5% of portfolio days — diversification fails when needed most.',
    strength: 83,
    links: [{ label: 'Specialist Championship', url: '/specialist-championship' }],
  },
  {
    id: 'RC-08', kind: 'timing_anomaly',
    title: 'PF collapses in the 00:00-04:00 UTC block',
    sources: ['Journals', 'Validation Reports'],
    observation: 'Aggregate PF is 1.94 outside the block and 1.06 inside it, on 14% of trades.',
    strength: 68,
    links: [{ label: 'Analytics Hub', url: '/analytics-hub' }],
  },
  {
    id: 'RC-09', kind: 'risk_asymmetry',
    title: 'Losses are 1.4x more clustered than wins',
    sources: ['Validation Reports', 'Journals'],
    observation: 'Loss runs of 3+ occur 1.4x more often than win runs of 3+, implying exploitable state dependence in sizing.',
    strength: 70,
    links: [{ label: 'Forward Validation', url: '/forward-validation' }],
  },
  {
    id: 'RC-10', kind: 'diversification',
    title: 'No specialist owns mean-reverting High Vol',
    sources: ['Specialists', 'Allocation Studio'],
    observation: 'High Vol + negative autocorrelation windows carry 11% of range and are covered only incidentally by MR v1 at 6% weight.',
    strength: 74,
    links: [{ label: 'Specialist Approval Board', url: '/specialist-approval-board' }],
  },
];

// ─── Section 3-6 — Hypotheses ────────────────────────────────────────────────

function scoresOf(s: Scores) { return s; }

export const HYPOTHESES: Hypothesis[] = [
  {
    id: 'HYP-01',
    title: 'Adaptive Compression Momentum',
    candidateId: 'RC-01',
    createdDay: 1,
    problem: 'Compression specialists exit at the first expansion candle and forfeit ~0.9R of the move they were designed to capture.',
    supporting: [
      'VCB v1 median unrealised continuation after exit is +0.9R across 214 trades.',
      'LVC v2 capture improved from 58% to 64% purely by loosening exit timing on XRP/SOL.',
      'Expansion candles cluster: 71% of first-expansion candles are followed by a same-direction candle.',
    ],
    contradicting: [
      'Holding through expansion raised max adverse excursion by 0.4R in the LVC v2 audit.',
      'Bear regimes show expansion reversal rate of 39%, materially worse than Bull.',
    ],
    expectedBenefit: 'Capture +6-9pp on compression specialists with PF held flat or better.',
    expectedRisks: ['Wider MAE and higher DD tail', 'Increased hold time reduces trades/day'],
    confidence: 78, novelty: 71, priority: 'high',
    stage: 'peer_review',
    scores: scoresOf({ innovation: 78, originality: 70, researchQuality: 84, evidenceStrength: 82, validationReadiness: 88, commercialValue: 80, executiveInterest: 85 }),
    grade: 'A',
    validations: [
      { type: 'Historical Validation', design: 'Re-run VCB v1 and LVC v2 with ATR-adaptive trailing exit over 90d.', datasets: 'BTC/ETH/SOL/XRP 15m, 90d', passGate: 'Capture +5pp, PF ≥ prior, DD ≤ 4%', estRuntime: '2 days' },
      { type: 'Walk Forward', design: '6 folds, 60d in-sample / 15d out-of-sample.', datasets: 'BTC/ETH 15m, 18 months', passGate: 'OOS PF ≥ 1.45 in ≥5 folds', estRuntime: '4 days' },
      { type: 'Regime Isolation', design: 'Segment by Bull/Bear/Sideways/High-Low Vol.', datasets: 'Regime Database', passGate: 'No regime PF < 1.10', estRuntime: '1 day' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'Well-evidenced and cheap to test; exit logic is the least explored surface in the stack.', confidence: 80, approval: 'approve', concerns: ['Exit change interacts with the 1-candle confirmation rule'], recommendations: ['Isolate exit change from any entry change', 'Report MAE/MFE deltas explicitly'] },
      { reviewer: 'Risk Officer', summary: 'Benefit is real but the DD tail widens; needs a hard trailing floor.', confidence: 66, approval: 'approve_with_conditions', concerns: ['MAE +0.4R', 'Bear reversal rate 39%'], recommendations: ['Cap adaptive hold in Bear regimes', 'Keep breakeven move at +2% profit'] },
      { reviewer: 'CIO', summary: 'Directly attacks capture, the weakest portfolio-level metric. High value per unit of research effort.', confidence: 84, approval: 'approve', concerns: ['Fewer trades/day may reduce diversification'], recommendations: ['Track capital efficiency alongside capture'] },
    ],
    board: 'approved_for_validation',
    boardRationale: 'Strong evidence, low implementation risk, direct line to the capture gap flagged by the CIO. Approved for validation design only — no parameter changes.',
    paper: {
      executiveSummary: 'Compression specialists systematically exit at the onset of expansion, forfeiting an estimated 0.9R per winning trade. An ATR-adaptive exit is hypothesised to recover 6-9pp of capture without degrading profit factor.',
      background: 'VCB v1 and Low-Vol Coiler v2 were both approved as specialists on the strength of entry quality. Neither has had its exit logic independently validated; both inherited a fixed 3R target with a 1.5R trail.',
      problemStatement: 'Aggregate portfolio capture sits below the 70% executive target while profit factor is comfortably above gate. The binding constraint is exit timing, not entry selectivity.',
      hypothesis: 'Replacing the fixed trail with an ATR-expansion-adaptive trail will increase realised capture by 6-9pp with profit factor held at or above current levels and drawdown under 4%.',
      supportingEvidence: [
        'Median post-exit continuation of +0.9R across 214 VCB v1 trades.',
        'LVC v1 → v2 capture gain of 6pp came entirely from exit-side changes.',
        '71% same-direction follow-through on first expansion candles.',
      ],
      counterArguments: [
        'Adaptive holds increased MAE by 0.4R in the LVC v2 audit.',
        'Bear-regime expansion reversal rate of 39% may invert the edge.',
        'Longer holds reduce trade count, which weakens statistical power per unit time.',
      ],
      expectedMetrics: [
        { metric: 'Capture', baseline: '64%', expected: '70-73%' },
        { metric: 'Profit Factor', baseline: '1.74', expected: '1.70-1.85' },
        { metric: 'Max Drawdown', baseline: '3.1%', expected: '3.2-3.9%' },
        { metric: 'Avg Hold', baseline: '4.2h', expected: '5.6-6.4h' },
      ],
      validationPlan: [
        'Historical validation on BTC/ETH/SOL/XRP over 90 days.',
        'Walk-forward across 6 folds with strict out-of-sample separation.',
        'Regime isolation with a hard floor of PF ≥ 1.10 per regime.',
        'Monte Carlo resampling of trade sequence for drawdown distribution.',
      ],
      knownRisks: ['Drawdown tail widening', 'Regime-dependent inversion in Bear', 'Reduced trade frequency'],
      governanceStatus: 'Research Only. No parameter change is authorised. Any adoption must pass Championship, Specialist Approval Board and the Allocation Production Path.',
      references: [
        { label: 'VCB v1', url: '/vcb-v1' },
        { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' },
        { label: 'Move Capture Audit', url: '/move-capture' },
      ],
    },
    explain: {
      whyExists: 'The Discovery Engine flagged RC-01 after finding the same exit-timing signature in two independently validated specialists.',
      supporting: ['214-trade continuation study', 'LVC v1→v2 capture delta', 'Expansion follow-through rate'],
      contradicting: ['MAE widening', 'Bear reversal rate'],
      assumptions: ['Historical expansion behaviour persists', 'Fee/slippage model of 0.1%/0.075% remains representative', 'No change to the 1-candle confirmation rule'],
      dataNeeded: ['15m OHLCV for 4 assets, 18 months', 'Per-trade MAE/MFE series', 'Regime labels per candle'],
      confidenceRationale: 'Base 60 from two-source corroboration, +12 for sample size above 200 trades, +10 for a prior successful exit-side change, -4 for regime-dependent counter-evidence = 78.',
    },
    fastestValidationDays: 2, riskScore: 42,
    links: [{ label: 'VCB v1', url: '/vcb-v1' }, { label: 'LVC v2', url: '/low-vol-coiler-v2' }],
  },
  {
    id: 'HYP-02',
    title: 'Regime Confidence Scaling',
    candidateId: 'RC-02',
    createdDay: 2,
    problem: 'Allocation treats regime confidence as a gate rather than a continuous variable, discarding information above the 0.62 threshold.',
    supporting: [
      'Near-linear PF response of +0.11 per +0.10 confidence between 0.62 and 0.90 across 412 windows.',
      'Confidence Weighted Allocation already outperformed Dynamic Allocation (2.11 PF vs 1.86).',
      'Champion Trial challenger lead is concentrated in high-confidence days.',
    ],
    contradicting: [
      'Response plateaus above 0.90, so upper-range scaling adds little.',
      'Confidence estimates are themselves model outputs and may be overfit to Bull windows.',
    ],
    expectedBenefit: 'PF +0.08 to +0.15 at portfolio level with no change to specialist logic.',
    expectedRisks: ['Amplifies Bull concentration', 'Confidence model error propagates into sizing'],
    confidence: 74, novelty: 64, priority: 'high',
    stage: 'validation_proposal',
    scores: scoresOf({ innovation: 66, originality: 58, researchQuality: 86, evidenceStrength: 85, validationReadiness: 82, commercialValue: 88, executiveInterest: 90 }),
    grade: 'A',
    validations: [
      { type: 'Cross Asset Validation', design: 'Apply continuous scaling curve per asset independently.', datasets: 'BTC/ETH/SOL/XRP, 90d', passGate: 'PF gain in ≥3 of 4 assets', estRuntime: '2 days' },
      { type: 'Out-of-Sample', design: 'Fit curve on months 1-12, evaluate on 13-18.', datasets: '18 months', passGate: 'OOS PF ≥ 1.90', estRuntime: '3 days' },
      { type: 'Parameter Sensitivity', design: 'Sweep curve slope 0.05-0.20 per 0.10 confidence.', datasets: 'Regime Database', passGate: 'Plateau region ≥ 40% of swept range', estRuntime: '1 day' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'Statistically the cleanest relationship in the dataset. Low novelty but high rigour.', confidence: 82, approval: 'approve', concerns: ['Confidence model may be endogenous to Bull data'], recommendations: ['Re-derive confidence labels on Bear-only data first'] },
      { reviewer: 'Risk Officer', summary: 'Scaling up on confident days increases Bull concentration, which is already the open promotion blocker.', confidence: 58, approval: 'approve_with_conditions', concerns: ['Bull concentration at 42% vs 35% cap'], recommendations: ['Hard concentration cap must bind before scaling', 'Stress test at 2x confidence error'] },
      { reviewer: 'CIO', summary: 'Highest commercial value in the current queue; touches every allocation decision.', confidence: 86, approval: 'approve', concerns: ['Needs governance sign-off before any live weighting'], recommendations: ['Route through Allocation Production Path stage gates'] },
    ],
    board: 'needs_more_evidence',
    boardRationale: 'Board requires Bear-only confidence re-derivation and a binding concentration cap before validation is authorised.',
    paper: {
      executiveSummary: 'Regime confidence carries usable signal well beyond the current binary gate. A continuous scaling curve is hypothesised to lift portfolio profit factor by 0.08-0.15 without altering any specialist.',
      background: 'Allocation Lab v2 established Confidence Weighted Allocation as research champion using a thresholded confidence input. The underlying relationship was never modelled continuously.',
      problemStatement: 'Discarding confidence magnitude above the gate wastes information that the regime database shows is monotonically informative up to 0.90.',
      hypothesis: 'A capped linear scaling of specialist weight in confidence over [0.62, 0.90] improves portfolio PF versus the thresholded baseline.',
      supportingEvidence: ['412-window monotonic PF response', 'Confidence Weighted Allocation 2.11 PF', 'Champion Trial lead concentrated on high-confidence days'],
      counterArguments: ['Plateau above 0.90', 'Possible Bull overfit in the confidence model itself'],
      expectedMetrics: [
        { metric: 'Portfolio PF', baseline: '2.11', expected: '2.19-2.26' },
        { metric: 'Max Drawdown', baseline: '2.8%', expected: '2.8-3.2%' },
        { metric: 'Bull Concentration', baseline: '42%', expected: '44-48% (risk)' },
        { metric: 'Capital Efficiency', baseline: '0.71', expected: '0.74-0.78' },
      ],
      validationPlan: ['Cross-asset curve fitting', 'Strict out-of-sample split', 'Slope sensitivity sweep', 'Concentration stress test at 2x confidence error'],
      knownRisks: ['Bull concentration breach', 'Confidence model endogeneity', 'Plateau reduces realised gain'],
      governanceStatus: 'Research Only. Allocation weights are not modified. Adoption requires Allocation Production Path stage clearance.',
      references: [{ label: 'Allocation Lab v2', url: '/allocation-lab-v2' }, { label: 'Champion Trial', url: '/champion-trial' }, { label: 'Allocation Production Path', url: '/allocation-production-path' }],
    },
    explain: {
      whyExists: 'RC-02 found a near-linear confidence/PF relationship the current gate throws away.',
      supporting: ['412 regime windows', 'Allocation Lab v2 champion result'],
      contradicting: ['Plateau above 0.90', 'Confidence model trained mostly on Bull windows'],
      assumptions: ['Confidence estimates are calibrated', 'Regime labels are stable out-of-sample'],
      dataNeeded: ['Regime confidence series', 'Per-specialist daily returns', 'Concentration series'],
      confidenceRationale: 'Base 65 for a large-sample monotonic relationship, +12 for a corroborating champion result, -3 for endogeneity risk = 74.',
    },
    fastestValidationDays: 1, riskScore: 61,
    links: [{ label: 'Allocation Lab v2', url: '/allocation-lab-v2' }],
  },
  {
    id: 'HYP-03',
    title: 'Dynamic Volatility Filter',
    candidateId: 'RC-06',
    createdDay: 3,
    problem: 'Capital sits idle on 29% of days, holding capital efficiency at 0.71 against a 0.85 target.',
    supporting: [
      '29% of days deploy under 20% of allocated capital, nearly all Sideways/Low Vol.',
      'LVC v2 proves low-vol conditions are tradeable at PF 1.74.',
      'Idle-day PnL opportunity estimated at 0.9% of equity per month.',
    ],
    contradicting: [
      'Momentum Scalper v1 failed precisely in Sideways/Low Vol before regime gating.',
      'Filling idle days may raise correlation during drawdown clusters (RC-07).',
    ],
    expectedBenefit: 'Capital efficiency 0.71 → 0.80+ with unchanged drawdown budget.',
    expectedRisks: ['Forced participation degrades PF', 'Higher correlation in stress'],
    confidence: 66, novelty: 69, priority: 'medium',
    stage: 'simulation',
    scores: scoresOf({ innovation: 72, originality: 68, researchQuality: 74, evidenceStrength: 70, validationReadiness: 76, commercialValue: 82, executiveInterest: 78 }),
    grade: 'B',
    validations: [
      { type: 'Historical Validation', design: 'Replay idle days with a dynamic vol-band participation rule.', datasets: '90d, all assets', passGate: 'Efficiency ≥ 0.80, PF ≥ 1.90', estRuntime: '2 days' },
      { type: 'Stress Test', design: 'Bull / Bear / Sideways / High Vol / Low Vol scenario pack.', datasets: 'Scenario engine', passGate: 'No scenario PF < 1.20', estRuntime: '1 day' },
      { type: 'Monte Carlo', design: '5,000 resamples of trade order.', datasets: 'Simulated trade set', passGate: '95th pct DD < 4.5%', estRuntime: '1 day' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'Sound motivation, weaker evidence base than HYP-01/02. Needs a simulation before a paper is finalised.', confidence: 64, approval: 'approve_with_conditions', concerns: ['Efficiency is not itself a performance metric'], recommendations: ['Define success as PnL per unit risk, not deployment %'] },
      { reviewer: 'Risk Officer', summary: 'Participation-for-its-own-sake is the classic way to convert a good system into a mediocre one.', confidence: 48, approval: 'approve_with_conditions', concerns: ['MS v1 Sideways failure precedent', 'Correlation clustering'], recommendations: ['Hard PF floor of 1.20 per regime', 'Cap incremental exposure at 20% of book'] },
      { reviewer: 'CIO', summary: 'Efficiency is a standing executive concern; worth a simulation even at moderate confidence.', confidence: 72, approval: 'approve', concerns: ['Do not trade the metric'], recommendations: ['Report efficiency and PF jointly on every slide'] },
    ],
    board: 'deferred',
    boardRationale: 'Deferred until HYP-01 validation completes, to avoid confounding two capture-side changes in the same window.',
    paper: {
      executiveSummary: 'A dynamic volatility band is hypothesised to convert idle low-volatility days into risk-controlled participation, lifting capital efficiency from 0.71 toward 0.80 without breaching the drawdown budget.',
      background: 'Capital efficiency has been flagged as the sole amber metric in the Observation Center for eleven consecutive days.',
      problemStatement: 'The portfolio is selective by design, but 29% of days deploy almost no capital, and the specialist roster now contains a validated low-volatility performer.',
      hypothesis: 'A dynamic volatility band that scales LVC v2 participation on otherwise idle days raises capital efficiency above 0.80 while holding portfolio PF above 1.90.',
      supportingEvidence: ['29% idle-day measurement', 'LVC v2 PF 1.74 in low vol', 'Estimated 0.9%/month opportunity'],
      counterArguments: ['MS v1 Sideways failure', 'Correlation clustering risk', 'Efficiency is an input metric, not an outcome'],
      expectedMetrics: [
        { metric: 'Capital Efficiency', baseline: '0.71', expected: '0.79-0.83' },
        { metric: 'Portfolio PF', baseline: '2.11', expected: '1.95-2.10' },
        { metric: 'Max Drawdown', baseline: '2.8%', expected: '3.0-3.6%' },
        { metric: 'Trades / week', baseline: '11.4', expected: '14-16' },
      ],
      validationPlan: ['Idle-day replay', 'Five-regime stress pack', 'Monte Carlo drawdown distribution', 'Correlation-under-stress re-measurement'],
      knownRisks: ['PF dilution', 'Stress correlation', 'Overtrading low-quality setups'],
      governanceStatus: 'Research Only. No participation rule is enabled. Deferred by the Executive Board pending HYP-01.',
      references: [{ label: 'Observation Center', url: '/observation-center' }, { label: 'LVC v2', url: '/low-vol-coiler-v2' }],
    },
    explain: {
      whyExists: 'RC-06 quantified idle capital as the largest single efficiency drag in the programme.',
      supporting: ['Idle-day census', 'LVC v2 low-vol PF'],
      contradicting: ['MS v1 precedent', 'Stress correlation'],
      assumptions: ['Idle days are genuinely tradeable', 'LVC v2 scales linearly with participation'],
      dataNeeded: ['Daily deployment series', 'Regime labels', 'Per-day correlation matrix'],
      confidenceRationale: 'Base 55 for a single-source quantification, +15 for a validated specialist covering the target regime, -4 for a documented failure precedent = 66.',
    },
    fastestValidationDays: 1, riskScore: 66,
    links: [{ label: 'Observation Center', url: '/observation-center' }],
  },
  {
    id: 'HYP-04',
    title: 'Dual Confirmation Breakout',
    candidateId: 'RC-03',
    createdDay: 4,
    problem: 'MS v2 and VCB v1 overlap on 41% of High-Vol entry candles, doubling risk on a single view.',
    supporting: [
      'Entry-timestamp overlap of 41% in High Vol versus 12% overall.',
      'Overlapping trades show 1.9x the average position-level drawdown.',
      'Correlation rises to 0.58 in drawdown clusters (RC-07 corroboration).',
    ],
    contradicting: [
      'Overlapping trades also show the highest win rate (68%) — the overlap may be signal, not redundancy.',
      'De-duplication reduces trade count by an estimated 9%.',
    ],
    expectedBenefit: 'Drawdown -0.4 to -0.7pp with PF broadly unchanged.',
    expectedRisks: ['Removing the best trades by mistake', 'Lower frequency'],
    confidence: 61, novelty: 76, priority: 'medium',
    stage: 'paper',
    scores: scoresOf({ innovation: 76, originality: 74, researchQuality: 70, evidenceStrength: 64, validationReadiness: 68, commercialValue: 66, executiveInterest: 62 }),
    grade: 'B',
    validations: [
      { type: 'Historical Validation', design: 'Replay with a single-owner rule per overlapping candle.', datasets: '90d High Vol windows', passGate: 'DD improvement ≥ 0.3pp, PF ≥ prior -0.05', estRuntime: '2 days' },
      { type: 'Regime Isolation', design: 'High Vol only, then generalise.', datasets: 'Regime Database', passGate: 'Effect present in High Vol, neutral elsewhere', estRuntime: '1 day' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'Interesting but the win-rate counter-evidence is strong. Needs a cleaner causal design.', confidence: 58, approval: 'approve_with_conditions', concerns: ['Overlap may be confirmation rather than duplication'], recommendations: ['Test dual-confirmation sizing before de-duplication'] },
      { reviewer: 'Risk Officer', summary: 'Concentration in High Vol is the exact tail we cannot afford. Worth pursuing on risk grounds alone.', confidence: 71, approval: 'approve', concerns: ['1.9x position drawdown on overlap'], recommendations: ['Cap combined exposure per candle regardless of outcome'] },
      { reviewer: 'CIO', summary: 'Moderate portfolio value; primarily a risk-hygiene improvement.', confidence: 60, approval: 'approve_with_conditions', concerns: ['9% frequency loss'], recommendations: ['Quantify PnL forgone before any adoption'] },
    ],
    board: 'needs_more_evidence',
    boardRationale: 'The win-rate counter-evidence must be resolved before the board can distinguish redundancy from confirmation.',
    paper: {
      executiveSummary: 'Two specialists frequently enter the same High-Vol candle. This paper asks whether that overlap is duplicated risk or genuine dual confirmation, and proposes a design that can distinguish the two.',
      background: 'MS v2 and VCB v1 were validated independently and never jointly audited at candle resolution.',
      problemStatement: 'A 41% High-Vol overlap concentrates risk at the exact moment position sizing is largest, while simultaneously showing the roster\'s highest win rate.',
      hypothesis: 'Treating overlapping entries as a single dual-confirmed position with capped combined exposure reduces drawdown by 0.3-0.7pp without a material profit-factor cost.',
      supportingEvidence: ['41% overlap measurement', '1.9x position drawdown on overlap', 'Stress correlation of 0.58'],
      counterArguments: ['68% win rate on overlapping trades', '9% estimated frequency loss'],
      expectedMetrics: [
        { metric: 'Max Drawdown', baseline: '2.8%', expected: '2.1-2.5%' },
        { metric: 'Portfolio PF', baseline: '2.11', expected: '2.02-2.14' },
        { metric: 'Trades / week', baseline: '11.4', expected: '10.2-10.6' },
        { metric: 'Stress Correlation', baseline: '0.58', expected: '0.44-0.50' },
      ],
      validationPlan: ['Candle-resolution overlap replay', 'Dual-confirmation sizing arm vs de-duplication arm', 'High Vol regime isolation'],
      knownRisks: ['Discarding high-quality trades', 'Frequency loss', 'Design confounding between the two arms'],
      governanceStatus: 'Research Only. No specialist logic is modified. Paper stage; validation not yet authorised.',
      references: [{ label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' }, { label: 'VCB v1', url: '/vcb-v1' }],
    },
    explain: {
      whyExists: 'RC-03 detected candle-level entry overlap that no prior audit measured.',
      supporting: ['Overlap census', 'Position drawdown multiple'],
      contradicting: ['Highest win rate on the overlapping subset'],
      assumptions: ['Candle timestamps are directly comparable across specialists', 'Sizing rules remain fixed'],
      dataNeeded: ['Per-entry timestamps', 'Per-position MAE', 'Regime labels'],
      confidenceRationale: 'Base 60 for a clean measurement, +8 for corroboration by RC-07, -7 for strong counter-evidence in win rate = 61.',
    },
    fastestValidationDays: 2, riskScore: 55,
    links: [{ label: 'Specialist Championship', url: '/specialist-championship' }],
  },
  {
    id: 'HYP-05',
    title: 'Adaptive Trend Compression',
    candidateId: 'RC-05',
    createdDay: 5,
    problem: 'The 6-12 candle Low-Vol → High-Vol transition window is owned by no specialist and captures 0.31% of PnL against 8.4% of realised range.',
    supporting: [
      'Transition windows carry 8.4% of realised range across 412 regime segments.',
      'LVC v2 detects compression persistence but exits before the transition completes.',
      'Discovery Lab v2 previously flagged the low-vol gap that produced LVC v1.',
    ],
    contradicting: [
      'Transition detection is inherently lagging; the window may be unlearnable in real time.',
      'Only 34 clean transition events exist in 90 days — thin sample.',
    ],
    expectedBenefit: 'A sixth specialist candidate covering an uncovered regime segment.',
    expectedRisks: ['Thin sample overfitting', 'Detection lag destroys the edge'],
    confidence: 57, novelty: 88, priority: 'medium',
    stage: 'hypothesis',
    scores: scoresOf({ innovation: 90, originality: 88, researchQuality: 62, evidenceStrength: 56, validationReadiness: 54, commercialValue: 70, executiveInterest: 68 }),
    grade: 'B',
    validations: [
      { type: 'Out-of-Sample', design: 'Fit transition detector on 12 months, evaluate on 6.', datasets: 'BTC/ETH 15m, 18 months', passGate: 'OOS detection precision ≥ 0.60', estRuntime: '5 days' },
      { type: 'Monte Carlo', design: 'Bootstrap the 34 transition events to bound sample error.', datasets: 'Transition event set', passGate: '5th pct PF ≥ 1.10', estRuntime: '2 days' },
      { type: 'Cross Asset Validation', design: 'Repeat detector across four assets.', datasets: 'BTC/ETH/SOL/XRP', passGate: 'Effect present in ≥3 assets', estRuntime: '3 days' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'The most original idea in the queue and the least evidenced. Correct stage is hypothesis, not paper.', confidence: 55, approval: 'approve_with_conditions', concerns: ['34-event sample', 'Detection lag'], recommendations: ['Expand the event set to 18 months before writing the paper'] },
      { reviewer: 'Risk Officer', summary: 'Low risk to the existing portfolio because nothing currently trades this window.', confidence: 68, approval: 'approve', concerns: ['Overfitting a thin sample'], recommendations: ['Require bootstrap confidence intervals on every reported metric'] },
      { reviewer: 'CIO', summary: 'Coverage gaps are how the roster grew from four to five. Worth funding research time.', confidence: 64, approval: 'approve', concerns: ['Slow validation path'], recommendations: ['Sequence behind HYP-01 and HYP-02'] },
    ],
    board: 'approved_for_validation',
    boardRationale: 'Approved for validation design given zero portfolio risk and clear coverage rationale; sequenced third in the queue.',
    paper: {
      executiveSummary: 'Regime transitions are an unowned segment of the market. This hypothesis proposes a specialist candidate that trades the compression-to-expansion handover directly.',
      background: 'Specialist Discovery Lab v2 identified coverage gaps as the primary route to roster expansion, producing Low-Vol Coiler v1.',
      problemStatement: 'The 6-12 candle transition window represents 8.4% of realised range and 0.31% of captured PnL.',
      hypothesis: 'A transition-specific detector combining compression persistence with early expansion confirmation can capture the handover window at PF ≥ 1.40.',
      supportingEvidence: ['Transition range census', 'LVC v2 early-exit signature', 'Discovery Lab v2 gap precedent'],
      counterArguments: ['34-event sample', 'Detection lag', 'Possible overlap with an improved HYP-01 exit'],
      expectedMetrics: [
        { metric: 'Profit Factor', baseline: 'n/a (uncovered)', expected: '1.35-1.55' },
        { metric: 'Capture (transition)', baseline: '4%', expected: '30-45%' },
        { metric: 'Max Drawdown', baseline: 'n/a', expected: '< 3.5%' },
        { metric: 'Trades / week', baseline: '0', expected: '2-4' },
      ],
      validationPlan: ['18-month out-of-sample detector evaluation', 'Bootstrap of transition events', 'Cross-asset replication', 'Overlap audit against HYP-01'],
      knownRisks: ['Thin sample', 'Lagging detection', 'Redundancy with an improved compression exit'],
      governanceStatus: 'Research Only. No specialist is created. Any candidate must enter via Specialist Discovery and the Approval Board.',
      references: [{ label: 'Specialist Discovery v2', url: '/specialist-discovery-v2' }, { label: 'LVC v2', url: '/low-vol-coiler-v2' }],
    },
    explain: {
      whyExists: 'RC-05 identified a regime segment with material range and effectively zero capture.',
      supporting: ['Range/capture asymmetry', 'Prior gap-driven roster expansion'],
      contradicting: ['Thin event count', 'Detection lag'],
      assumptions: ['Transitions are detectable before the majority of the move', 'Regime labels are accurate at boundaries'],
      dataNeeded: ['18 months of labelled transitions', 'Per-candle ATR and BB width', 'Volume expansion series'],
      confidenceRationale: 'Base 50 for a well-measured gap, +12 for a successful precedent, -5 for a 34-event sample = 57.',
    },
    fastestValidationDays: 2, riskScore: 48,
    links: [{ label: 'Specialist Discovery v2', url: '/specialist-discovery-v2' }],
  },
  {
    id: 'HYP-06',
    title: 'Session-Aware Risk Throttle',
    candidateId: 'RC-08',
    createdDay: 6,
    problem: 'Profit factor collapses from 1.94 to 1.06 in the 00:00-04:00 UTC block on 14% of trades.',
    supporting: [
      'PF 1.06 inside the block versus 1.94 outside, across 90 days.',
      'Slippage in the block averages 0.11% versus 0.068% elsewhere.',
      'Effect is present in all four assets.',
    ],
    contradicting: [
      'Only 14% of trades — removing them barely moves aggregate PnL.',
      'Time-of-day effects are notoriously unstable across years.',
    ],
    expectedBenefit: 'PF +0.05 to +0.09 by throttling size rather than blocking trades.',
    expectedRisks: ['Curve-fitting a calendar artefact', 'Loss of genuine overnight moves'],
    confidence: 52, novelty: 45, priority: 'low',
    stage: 'idea',
    scores: scoresOf({ innovation: 44, originality: 40, researchQuality: 66, evidenceStrength: 62, validationReadiness: 70, commercialValue: 48, executiveInterest: 40 }),
    grade: 'C',
    validations: [
      { type: 'Out-of-Sample', design: 'Confirm the block effect on an unseen 6-month period.', datasets: '18 months', passGate: 'Effect persists with PF gap ≥ 0.4', estRuntime: '2 days' },
      { type: 'Parameter Sensitivity', design: 'Sweep throttle factor 0.25-1.00.', datasets: '90d', passGate: 'Monotonic response', estRuntime: '1 day' },
    ],
    reviews: [
      { reviewer: 'Research Director', summary: 'Classic time-of-day finding. Plausible via slippage, but the prior for spurious calendar effects is high.', confidence: 50, approval: 'approve_with_conditions', concerns: ['Multiple-comparison risk across 6 time blocks'], recommendations: ['Apply a Bonferroni-style correction before claiming significance'] },
      { reviewer: 'Risk Officer', summary: 'Throttling rather than blocking is the right shape; downside is bounded.', confidence: 62, approval: 'approve', concerns: ['Minimal aggregate impact'], recommendations: ['Throttle, never block'] },
      { reviewer: 'CIO', summary: 'Low commercial value. Should not displace higher-value work.', confidence: 44, approval: 'approve_with_conditions', concerns: ['Opportunity cost of research time'], recommendations: ['Queue last'] },
    ],
    board: 'archive',
    boardRationale: 'Archived for now: real but small, with high spurious-effect risk. Revisit if slippage modelling is revised.',
    paper: {
      executiveSummary: 'A pronounced overnight profit-factor deficit is documented and attributed largely to slippage. A size throttle rather than a trade block is proposed.',
      background: 'Analytics Hub hour-of-day reporting has shown this pattern intermittently since the Router v2 era.',
      problemStatement: 'Trades in the 00:00-04:00 UTC block are close to break-even after costs.',
      hypothesis: 'Throttling position size in the block improves aggregate profit factor by 0.05-0.09 without materially reducing capture.',
      supportingEvidence: ['PF 1.06 vs 1.94', 'Slippage 0.11% vs 0.068%', 'Present in all four assets'],
      counterArguments: ['14% of trades only', 'Calendar effects are unstable', 'Multiple-comparison risk'],
      expectedMetrics: [
        { metric: 'Portfolio PF', baseline: '2.11', expected: '2.16-2.20' },
        { metric: 'Capture', baseline: '64%', expected: '62-64%' },
        { metric: 'Max Drawdown', baseline: '2.8%', expected: '2.6-2.8%' },
        { metric: 'Trades / week', baseline: '11.4', expected: '11.4 (size-only change)' },
      ],
      validationPlan: ['Unseen-period replication', 'Throttle factor sweep', 'Multiple-comparison correction'],
      knownRisks: ['Spurious calendar effect', 'Small absolute benefit'],
      governanceStatus: 'Research Only. Archived by the Executive Board pending stronger evidence.',
      references: [{ label: 'Analytics Hub', url: '/analytics-hub' }],
    },
    explain: {
      whyExists: 'RC-08 surfaced a persistent hour-block profit-factor deficit during the journal scan.',
      supporting: ['PF gap', 'Slippage differential', 'Cross-asset presence'],
      contradicting: ['Small trade share', 'Known instability of calendar effects'],
      assumptions: ['Slippage model is accurate overnight', 'Block boundaries are not arbitrary'],
      dataNeeded: ['Per-trade timestamps and fills', '18-month history'],
      confidenceRationale: 'Base 55 for a consistent cross-asset measurement, +5 for a plausible slippage mechanism, -8 for multiple-comparison risk = 52.',
    },
    fastestValidationDays: 1, riskScore: 38,
    links: [{ label: 'Analytics Hub', url: '/analytics-hub' }],
  },
];

// ─── Section 1 — Executive Cards ─────────────────────────────────────────────

export const LAB_STATS = (() => {
  const active = HYPOTHESES.filter(h => h.stage !== 'idea' && h.board !== 'rejected' && h.board !== 'archive').length;
  const confirmed = HYPOTHESES.filter(h => h.board === 'approved_for_validation').length;
  const failed = HYPOTHESES.filter(h => h.board === 'rejected' || h.board === 'archive').length;
  const conf = Math.round(HYPOTHESES.reduce((s, h) => s + h.confidence, 0) / HYPOTHESES.length);
  const papers = HYPOTHESES.filter(h => PIPELINE_STAGES.findIndex(s => s.id === h.stage) >= 2).length;
  return [
    { label: 'Active Research Projects', value: String(active), sub: 'in pipeline beyond idea stage' },
    { label: 'New Hypotheses', value: String(HYPOTHESES.length), sub: 'generated from 10 candidates' },
    { label: 'Confirmed Discoveries', value: String(confirmed), sub: 'approved for validation design' },
    { label: 'Failed Hypotheses', value: String(failed), sub: 'rejected or archived' },
    { label: 'Research Confidence', value: `${conf}%`, sub: 'mean across all hypotheses' },
    { label: 'Papers Published', value: String(papers), sub: 'full papers auto-generated' },
  ];
})();

// ─── Section 9 — Knowledge Graph ─────────────────────────────────────────────

export const GRAPH_NODES: GraphNode[] = [
  { id: 'g-reg', label: 'Regime DB', type: 'regime', x: 90, y: 60, detail: '412 labelled regime windows feeding every discovery.', url: '/research' },
  { id: 'g-spec', label: 'Specialists', type: 'specialist', x: 90, y: 180, detail: 'TR v1, MR v1, MS v2, VCB v1, LVC v2.', url: '/specialist-approval-board' },
  { id: 'g-champ', label: 'Championship', type: 'strategy', x: 90, y: 300, detail: 'Elo and belt history across the roster.', url: '/specialist-championship' },
  { id: 'g-rc1', label: 'RC-01', type: 'discovery', x: 300, y: 40, detail: 'Compression exits fire before expansion completes.' },
  { id: 'g-rc2', label: 'RC-02', type: 'discovery', x: 300, y: 130, detail: 'Regime confidence and PF are near-linear above 0.62.' },
  { id: 'g-rc3', label: 'RC-03', type: 'discovery', x: 300, y: 220, detail: 'MS v2 / VCB v1 share 41% of High-Vol entry candles.' },
  { id: 'g-rc5', label: 'RC-05', type: 'discovery', x: 300, y: 310, detail: 'Regime transition window is unowned.' },
  { id: 'g-h1', label: 'HYP-01', type: 'hypothesis', x: 520, y: 40, detail: 'Adaptive Compression Momentum — grade A, approved for validation.' },
  { id: 'g-h2', label: 'HYP-02', type: 'hypothesis', x: 520, y: 130, detail: 'Regime Confidence Scaling — grade A, needs more evidence.' },
  { id: 'g-h4', label: 'HYP-04', type: 'hypothesis', x: 520, y: 220, detail: 'Dual Confirmation Breakout — grade B, needs more evidence.' },
  { id: 'g-h5', label: 'HYP-05', type: 'hypothesis', x: 520, y: 310, detail: 'Adaptive Trend Compression — grade B, approved for validation.' },
  { id: 'g-paper', label: 'Papers', type: 'paper', x: 730, y: 95, detail: '5 auto-generated research papers with PDF export.' },
  { id: 'g-val', label: 'Validation', type: 'validation', x: 730, y: 255, detail: '15 proposed experiments. None executed automatically.' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: 'g-reg', to: 'g-rc2' }, { from: 'g-reg', to: 'g-rc5' },
  { from: 'g-spec', to: 'g-rc1' }, { from: 'g-spec', to: 'g-rc3' },
  { from: 'g-champ', to: 'g-rc3' }, { from: 'g-champ', to: 'g-rc1' },
  { from: 'g-rc1', to: 'g-h1' }, { from: 'g-rc2', to: 'g-h2' },
  { from: 'g-rc3', to: 'g-h4' }, { from: 'g-rc5', to: 'g-h5' },
  { from: 'g-h1', to: 'g-paper' }, { from: 'g-h2', to: 'g-paper' },
  { from: 'g-h4', to: 'g-paper' }, { from: 'g-h5', to: 'g-val' },
  { from: 'g-h1', to: 'g-val' }, { from: 'g-h2', to: 'g-val' },
];

// ─── Section 10 — Rankings ───────────────────────────────────────────────────

export type RankKey =
  | 'confidence' | 'innovation' | 'commercial' | 'risk' | 'fastest' | 'evidence' | 'newest';

export const RANK_OPTIONS: { key: RankKey; label: string; describe: (h: Hypothesis) => string }[] = [
  { key: 'confidence', label: 'Highest Confidence', describe: h => `${h.confidence}% confidence` },
  { key: 'innovation', label: 'Highest Innovation', describe: h => `${h.scores.innovation} innovation` },
  { key: 'commercial', label: 'Highest Commercial Value', describe: h => `${h.scores.commercialValue} commercial value` },
  { key: 'risk', label: 'Highest Risk', describe: h => `${h.riskScore} risk score` },
  { key: 'fastest', label: 'Fastest Validation', describe: h => `${h.fastestValidationDays}d fastest test` },
  { key: 'evidence', label: 'Most Evidence', describe: h => `${h.supporting.length + h.paper.supportingEvidence.length} evidence items` },
  { key: 'newest', label: 'Newest Discovery', describe: h => `Day ${h.createdDay}` },
];

export function rankHypotheses(key: RankKey): Hypothesis[] {
  const list = [...HYPOTHESES];
  switch (key) {
    case 'confidence': return list.sort((a, b) => b.confidence - a.confidence);
    case 'innovation': return list.sort((a, b) => b.scores.innovation - a.scores.innovation);
    case 'commercial': return list.sort((a, b) => b.scores.commercialValue - a.scores.commercialValue);
    case 'risk': return list.sort((a, b) => b.riskScore - a.riskScore);
    case 'fastest': return list.sort((a, b) => a.fastestValidationDays - b.fastestValidationDays);
    case 'evidence': return list.sort((a, b) =>
      (b.supporting.length + b.paper.supportingEvidence.length) - (a.supporting.length + a.paper.supportingEvidence.length));
    case 'newest': return list.sort((a, b) => b.createdDay - a.createdDay);
  }
}

export function overallScore(s: Scores): number {
  return Math.round(
    (s.innovation + s.originality + s.researchQuality + s.evidenceStrength +
      s.validationReadiness + s.commercialValue + s.executiveInterest) / 7
  );
}

// ─── Section 13 — Governance ─────────────────────────────────────────────────

export const GOVERNANCE_RULES: string[] = [
  'Observation Only — the Quant Scientist reads research artefacts and writes nothing back.',
  'Research Only — every output is a hypothesis, a paper or a proposed experiment.',
  'Simulation Only — no live execution, no order routing, no exchange keys.',
  'No automatic promotion — Championship, Approval Board and Allocation Production Path remain the only promotion routes.',
  'No parameter changes — strategy and allocation parameters are read-only to this module.',
  'No Portfolio Manager writes — the module has no path to allocation state.',
  'Full traceability — every hypothesis links back to the candidate, module and evidence that produced it.',
];
