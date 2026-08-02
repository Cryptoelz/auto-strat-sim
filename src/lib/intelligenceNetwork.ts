/**
 * CryptoTrader Intelligence Network™ v2
 * Observation Only · Research Only · Simulation Only.
 * Never executes, never rebalances, never changes allocations or parameters,
 * never bypasses Championship / Approval Board / Production Path governance.
 * Every output below is advisory.
 */

export interface InLink { label: string; url: string }

/* ------------------------------------------------------------------ */
/* Shared explainability envelope (Section 9)                          */
/* ------------------------------------------------------------------ */

export interface Explainability {
  reasoning: string;
  evidence: string[];
  confidence: number; // 0-100
  alternatives: string[];
  weaknesses: string[];
  requiredValidation: string[];
  historicalComparison: string;
}

/* ------------------------------------------------------------------ */
/* Section 1 — Daily Intelligence Brief                                */
/* ------------------------------------------------------------------ */

export interface BriefBlock {
  key: string;
  heading: string;
  body: string;
  metric?: string;
  tone: 'positive' | 'neutral' | 'caution' | 'critical';
}

export interface DailyBrief {
  greeting: string;
  date: string;
  blocks: BriefBlock[];
  investigations: { id: string; title: string; why: string; link: InLink }[];
  footer: string;
}

export function buildDailyBrief(now = new Date()): DailyBrief {
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
  return {
    greeting,
    date: now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    blocks: [
      {
        key: 'health',
        heading: "Today's Portfolio Health",
        body: 'Composite health 87/100. Profit Factor 2.11 on the Confidence Weighted challenger, drawdown 2.4% against the 3.0% ceiling. Four of five specialists inside tolerance; Momentum Scalper v2 remains on metric-drift watch.',
        metric: 'Health 87 · PF 2.11 · DD 2.4%',
        tone: 'positive',
      },
      {
        key: 'opportunity',
        heading: 'Biggest Opportunity',
        body: 'Low Vol Coiler v2 has been inactive for 11 sessions while 18.6% of simulated capital sat idle. Re-weighting idle capital toward compression specialists is the single largest modelled efficiency gain (+0.14 PF in simulation).',
        metric: 'Idle capital 18.6% · Modelled +0.14 PF',
        tone: 'neutral',
      },
      {
        key: 'risk',
        heading: 'Biggest Risk',
        body: 'Bull Trend concentration has exceeded the governance ceiling for 18 consecutive sessions, driven by Trend Rider v1 at 42% of exposure. This alone is holding the promotion gate closed.',
        metric: 'Bull concentration 42% (ceiling 35%)',
        tone: 'critical',
      },
      {
        key: 'promotion',
        heading: 'Promotion Status',
        body: 'Allocation Production Path at Stage 3 of 5. Forecast probability 58%. Blocking gate: concentration ceiling. Runtime and trade-count gates are on track (41/60 days, 38/50 trades).',
        metric: 'Stage 3/5 · 58% forecast',
        tone: 'caution',
      },
      {
        key: 'champion',
        heading: 'Champion Status',
        body: 'Dynamic Allocation v1 holds the belt at 23 days, one successful defence. Confidence Weighted Allocation leads head-to-head on PF and Sharpe-like score; challenger win probability 72%.',
        metric: 'Champion 23d · Challenger 72%',
        tone: 'neutral',
      },
      {
        key: 'research',
        heading: 'Research Summary',
        body: 'Overnight scan covered 12 modules and 5 specialists. Three prior discoveries were confirmed, one was rejected on weak evidence, and two moved into hypothesis drafting.',
        metric: '12 modules scanned',
        tone: 'positive',
      },
      {
        key: 'discoveries',
        heading: 'New Discoveries',
        body: 'Four new discoveries: TR/VCB return decoupling, regime-transition capture gap, MS v2 hold-time drift, and a stable parameter plateau on VCB compression width.',
        metric: '4 new',
        tone: 'neutral',
      },
      {
        key: 'hypotheses',
        heading: 'Hypotheses Awaiting Review',
        body: 'Three hypotheses sit in peer review: Adaptive Compression Momentum, Dual Confirmation Gating, and Transition Window Capture. None may proceed without Approval Board sign-off.',
        metric: '3 pending',
        tone: 'caution',
      },
      {
        key: 'capital',
        heading: 'Capital Efficiency',
        body: 'Deployed capital averaged 81.4% over the last 10 sessions, down from 88.2%. The decline is concentrated in Low Volatility windows where no specialist activates.',
        metric: '81.4% (−6.8pt)',
        tone: 'caution',
      },
      {
        key: 'execConfidence',
        heading: 'Executive Confidence',
        body: 'Executive confidence 79/100. Supported by stable drawdown and consistent champion behaviour; reduced by the unresolved concentration breach.',
        metric: '79/100',
        tone: 'neutral',
      },
      {
        key: 'resConfidence',
        heading: 'Research Confidence',
        body: 'Research confidence 84/100. Sample depth is adequate on four specialists; Low Vol Coiler v2 remains the thinnest evidence base at 31 simulated trades.',
        metric: '84/100',
        tone: 'positive',
      },
      {
        key: 'governance',
        heading: 'Governance Status',
        body: 'All safeguards intact. Observation Only, Research Only, Simulation Only. No automatic execution, promotion or allocation change occurred or can occur from this module.',
        metric: 'All gates enforced',
        tone: 'positive',
      },
    ],
    investigations: [
      {
        id: 'INV-01',
        title: 'Why is Low Vol Coiler v2 not activating?',
        why: 'Idle capital is the top driver of the capital-efficiency decline and indirectly of the promotion forecast.',
        link: { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' },
      },
      {
        id: 'INV-02',
        title: 'Can concentration fall without reducing Profit Factor?',
        why: 'The concentration ceiling is the only hard blocker on the production path.',
        link: { label: 'Allocation Lab v2', url: '/allocation-lab-v2' },
      },
      {
        id: 'INV-03',
        title: 'Is Momentum Scalper v2 hold-time drift structural or regime-driven?',
        why: 'Drift of +2.4 candles has preceded PF decay in two previous studies.',
        link: { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' },
      },
      {
        id: 'INV-04',
        title: 'Does the challenger keep its edge in a bear stress path?',
        why: 'Challenger win probability is 72% but bear-sample coverage is thin.',
        link: { label: 'Champion Trial', url: '/champion-trial' },
      },
    ],
    footer: 'Nothing in this brief executes automatically. All items are advisory and require operator review.',
  };
}

/* ------------------------------------------------------------------ */
/* Section 2 — AI Narrative Engine                                     */
/* ------------------------------------------------------------------ */

export interface NarrativeStep { at: string; text: string }

export interface Narrative {
  id: string;
  headline: string;
  fragments: string[]; // the isolated facts before connection
  story: string;       // the connected explanation
  explain: Explainability;
  timeline: NarrativeStep[];
  reports: InLink[];
  related: string[]; // discovery ids
}

export const NARRATIVES: Narrative[] = [
  {
    id: 'NAR-01',
    headline: 'Capital efficiency decline traced to regime concentration, not strategy decay',
    fragments: ['Capital Efficiency fell.', 'Bull Trend concentration increased.', 'Promotion Probability declined.'],
    story:
      'Capital Efficiency declined because Bull Trend concentration increased while Low Volatility remained inactive. This increased idle capital, reducing promotion probability despite unchanged Profit Factor.',
    explain: {
      reasoning:
        'Deployed-capital share fell 6.8 points over 10 sessions. Across the same window Trend Rider exposure rose from 31% to 42% while Low Vol Coiler v2 logged zero activations. Because the allocator caps total exposure, an unbalanced regime mix leaves capital unassigned rather than reallocated, and the production path penalises efficiency independently of Profit Factor.',
      evidence: [
        'Capital efficiency 88.2% → 81.4% (10 sessions)',
        'Trend Rider exposure 31% → 42%',
        'Low Vol Coiler v2 activations: 0 in 11 sessions',
        'Profit Factor unchanged at 2.11 ±0.03',
        'Promotion forecast 66% → 58%',
      ],
      confidence: 91,
      alternatives: [
        'Sizing model drift could reduce deployment independently of regime mix (not supported: sizing outputs stable within 1.2%).',
        'Fee/slippage model change could depress efficiency (rejected: execution realism parameters unchanged).',
      ],
      weaknesses: ['Only 10 sessions of observation.', 'Low Vol sample is structurally sparse, so absence of activation is weakly informative.'],
      requiredValidation: ['Re-run the 90-day allocation simulation with a synthetic Low Vol block.', 'Sensitivity sweep on the concentration ceiling at 35/40/45%.'],
      historicalComparison: 'A comparable efficiency slide (−7.1pt) occurred during the March study window and reverted within 9 sessions once compression regimes returned.',
    },
    timeline: [
      { at: 'Session −18', text: 'Bull Trend concentration first exceeds the 35% ceiling.' },
      { at: 'Session −11', text: 'Low Vol Coiler v2 logs its last activation.' },
      { at: 'Session −10', text: 'Capital efficiency begins a monotonic decline.' },
      { at: 'Session −3', text: 'Promotion forecast drops below 60%.' },
      { at: 'Today', text: 'Narrative generated and flagged as the top risk story.' },
    ],
    reports: [
      { label: 'Allocation Production Path', url: '/allocation-production-path' },
      { label: 'Allocation Lab v2', url: '/allocation-lab-v2' },
      { label: 'Forward Validation', url: '/forward-validation' },
    ],
    related: ['DSC-01', 'DSC-04'],
  },
  {
    id: 'NAR-02',
    headline: 'Challenger edge is real but concentrated in high-volatility windows',
    fragments: ['Confidence Weighted PF is higher.', 'High Vol trade share increased.', 'Bear sample is thin.'],
    story:
      'Confidence Weighted Allocation outperforms Dynamic Allocation v1 mainly because it upweights specialists during high-volatility expansion. That is where 63% of its excess return is generated, so the measured edge is regime-conditional rather than broad, and the thin bear sample means the head-to-head result is not yet portable.',
    explain: {
      reasoning:
        'Decomposing excess return by regime attributes 63% to High Vol, 21% to Bull Trend, 12% to compression and 4% to bear windows. Bear windows account for only 9% of the sample, so the estimate there carries the widest interval.',
      evidence: [
        'Excess return attribution: High Vol 63%',
        'Bear sample share 9% of sessions',
        'Head-to-head PF 2.11 vs 1.86',
        'Sharpe-like score 1.42 vs 1.19',
      ],
      confidence: 86,
      alternatives: [
        'The edge may be a sizing artefact rather than selection skill (partially supported: 18% of excess traces to size, not entry).',
        'High-Vol clustering could be a sampling accident of the trial window.',
      ],
      weaknesses: ['Bear regime under-sampled.', 'Trial has 38 of the required 50 trades.'],
      requiredValidation: ['Bear stress path in the scenario engine.', 'Bootstrap the head-to-head across 1,000 resamples.'],
      historicalComparison: 'Router v2.1 showed a similar regime-conditional edge that narrowed by 40% once bear coverage doubled.',
    },
    timeline: [
      { at: 'Day 1', text: 'Champion Forward Trial opens with Dynamic Allocation v1 as control.' },
      { at: 'Day 14', text: 'Challenger takes the PF lead.' },
      { at: 'Day 29', text: 'Regime attribution first shows High Vol dominance.' },
      { at: 'Today', text: 'Win probability 72% with bear coverage still flagged.' },
    ],
    reports: [
      { label: 'Champion Trial', url: '/champion-trial' },
      { label: 'Specialist Championship', url: '/specialist-championship' },
    ],
    related: ['DSC-02', 'DSC-05'],
  },
  {
    id: 'NAR-03',
    headline: 'Momentum Scalper v2 drift is a hold-time story, not an entry-quality story',
    fragments: ['MS v2 PF slipped.', 'Hold time increased.', 'Win rate unchanged.'],
    story:
      'Momentum Scalper v2 Profit Factor slipped from 1.56 to 1.48 while win rate held at 54%. The change is fully explained by average hold time extending 2.4 candles, which pushed exits past the fast-profit window the strategy was designed around, so average winners shrank while losers stayed the same size.',
    explain: {
      reasoning:
        'Win rate and entry precision are unchanged, isolating the change to exit timing. Average winner fell 0.21R while average loser moved 0.02R; the product of those changes reproduces the observed PF delta within 0.01.',
      evidence: ['PF 1.56 → 1.48', 'Win rate 54% (flat)', 'Hold time +2.4 candles', 'Avg winner −0.21R', 'Activation precision 81.6% (flat)'],
      confidence: 88,
      alternatives: ['Volatility regime shift could widen natural hold times (partially supported).', 'Trailing-stop interaction could delay exits.'],
      weaknesses: ['Exit-timing attribution assumes stable slippage.', '30-day window only.'],
      requiredValidation: ['Hold-time sensitivity sweep.', 'Re-run robustness audit segmented by ATR decile.'],
      historicalComparison: 'MS v1 decayed through entry quality, not hold time — the failure mode differs.',
    },
    timeline: [
      { at: 'Day −30', text: 'MS v2 approved as specialist with PF 1.56.' },
      { at: 'Day −12', text: 'Hold time crosses +2 candles versus spec.' },
      { at: 'Day −4', text: 'Health Monitor raises a metric-drift warning.' },
      { at: 'Today', text: 'Narrative isolates exit timing as the driver.' },
    ],
    reports: [
      { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' },
      { label: 'Forward Validation', url: '/forward-validation' },
    ],
    related: ['DSC-03'],
  },
];

/* ------------------------------------------------------------------ */
/* Section 3 — Cross-Module Intelligence                               */
/* ------------------------------------------------------------------ */

export type ImpactDomain =
  | 'Specialists' | 'Strategies' | 'Journals' | 'Validation Reports'
  | 'Executive Decisions' | 'Governance Rules' | 'Promotion Gates' | 'Research Papers';

export interface ImpactEdge { domain: ImpactDomain; items: InLink[]; note: string }

export interface Discovery {
  id: string;
  title: string;
  summary: string;
  severity: 'positive' | 'info' | 'caution' | 'critical';
  confidence: number;
  detected: string;
  impacts: ImpactEdge[];
  explain: Explainability;
}

export const DISCOVERIES: Discovery[] = [
  {
    id: 'DSC-01',
    title: 'Bull Trend concentration breach persists for 18 sessions',
    summary: 'Trend Rider v1 supplies 42% of simulated exposure against a 35% governance ceiling, blocking the production path.',
    severity: 'critical',
    confidence: 94,
    detected: 'Session −18',
    impacts: [
      { domain: 'Specialists', items: [{ label: 'Trend Rider v1', url: '/strategies' }, { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' }], note: 'Exposure source and the inactive offset.' },
      { domain: 'Strategies', items: [{ label: 'Router v2.1', url: '/router-v21' }], note: 'Shares the same bull-trend exposure family.' },
      { domain: 'Journals', items: [{ label: 'Research Journal', url: '/journal' }], note: 'Concentration entries logged since session −18.' },
      { domain: 'Validation Reports', items: [{ label: 'Forward Validation', url: '/forward-validation' }], note: 'Health Monitor concentration panel.' },
      { domain: 'Executive Decisions', items: [{ label: 'Investment Committee', url: '/committee' }], note: 'Deferred allocation decision pending resolution.' },
      { domain: 'Governance Rules', items: [{ label: 'Governance', url: '/governance' }], note: 'Concentration ceiling rule 35%.' },
      { domain: 'Promotion Gates', items: [{ label: 'Allocation Production Path', url: '/allocation-production-path' }], note: 'Stage 3 gate is held closed by this breach.' },
      { domain: 'Research Papers', items: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }], note: 'Referenced by the diversification hypothesis.' },
    ],
    explain: {
      reasoning: 'Rolling 18-session exposure attribution places Trend Rider above the ceiling on every session, with no offsetting compression activation.',
      evidence: ['Exposure 42% vs ceiling 35%', '18 consecutive breach sessions', 'Low Vol activations 0', 'Promotion forecast −8pt'],
      confidence: 94,
      alternatives: ['Ceiling may be mis-specified for a 5-specialist roster.', 'Breach could resolve naturally on regime rotation.'],
      weaknesses: ['Regime labelling is model-derived, not observed.'],
      requiredValidation: ['Ceiling sensitivity sweep 35/40/45%.', 'Synthetic Low Vol injection test.'],
      historicalComparison: 'The only prior breach of this length resolved in 9 sessions via regime rotation.',
    },
  },
  {
    id: 'DSC-02',
    title: 'Trend Rider and VCB returns have decoupled',
    summary: 'Rolling 30-day correlation fell from 0.41 to 0.08, improving the diversification score by 6 points.',
    severity: 'positive',
    confidence: 82,
    detected: 'Session −7',
    impacts: [
      { domain: 'Specialists', items: [{ label: 'VCB v1', url: '/vcb-v1' }], note: 'Second leg of the decoupled pair.' },
      { domain: 'Strategies', items: [{ label: 'Allocation Lab v2', url: '/allocation-lab-v2' }], note: 'Confidence weights respond to correlation inputs.' },
      { domain: 'Journals', items: [{ label: 'Research Journal', url: '/journal' }], note: 'Correlation study entries.' },
      { domain: 'Validation Reports', items: [{ label: 'Specialist Approval Board', url: '/specialist-approval-board' }], note: 'Diversity score recalculated.' },
      { domain: 'Executive Decisions', items: [{ label: 'Portfolio AI Director', url: '/portfolio-ai-director' }], note: 'Feeds the allocation studio.' },
      { domain: 'Governance Rules', items: [{ label: 'Governance', url: '/governance' }], note: 'No rule change; informational only.' },
      { domain: 'Promotion Gates', items: [{ label: 'Promotion Board', url: '/promotion-board' }], note: 'Diversification criterion improved.' },
      { domain: 'Research Papers', items: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }], note: 'Supports the dual-confirmation paper.' },
    ],
    explain: {
      reasoning: 'Correlation decay coincides with VCB shifting activation into compression-exit windows that Trend Rider ignores.',
      evidence: ['30d correlation 0.41 → 0.08', 'Shared entry candles 41% → 12%', 'Diversity score +6'],
      confidence: 82,
      alternatives: ['Correlation drop may be a low-activity artefact of a thin VCB sample.'],
      weaknesses: ['VCB has 44 simulated trades in window.'],
      requiredValidation: ['Extend to 90-day rolling correlation.', 'Block bootstrap the correlation estimate.'],
      historicalComparison: 'MS v2/VCB overlap ran the opposite direction, rising to 41% in High Vol.',
    },
  },
  {
    id: 'DSC-03',
    title: 'Momentum Scalper v2 hold-time drift',
    summary: 'Average hold time extended 2.4 candles beyond spec, compressing average winners by 0.21R.',
    severity: 'caution',
    confidence: 88,
    detected: 'Session −12',
    impacts: [
      { domain: 'Specialists', items: [{ label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' }], note: 'Primary subject.' },
      { domain: 'Strategies', items: [{ label: 'Momentum Scalper v1', url: '/momentum-scalper' }], note: 'Shared exit logic lineage.' },
      { domain: 'Journals', items: [{ label: 'Research Journal', url: '/journal' }], note: 'Drift log entries.' },
      { domain: 'Validation Reports', items: [{ label: 'Forward Validation', url: '/forward-validation' }], note: 'Health Monitor PF warning band.' },
      { domain: 'Executive Decisions', items: [{ label: 'AI Chief Investment Officer', url: '/cio' }], note: 'Advisory watch item.' },
      { domain: 'Governance Rules', items: [{ label: 'Governance', url: '/governance' }], note: 'PF < 1.50 warning threshold.' },
      { domain: 'Promotion Gates', items: [{ label: 'Specialist Approval Board', url: '/specialist-approval-board' }], note: 'Specialist standing under review.' },
      { domain: 'Research Papers', items: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }], note: 'Adaptive exit hypothesis.' },
    ],
    explain: {
      reasoning: 'Win rate and entry precision are flat, so the PF change is attributable to exit timing alone.',
      evidence: ['Hold time +2.4 candles', 'PF 1.56 → 1.48', 'Win rate flat at 54%', 'Precision 81.6% flat'],
      confidence: 88,
      alternatives: ['Wider ATR could justify longer holds.'],
      weaknesses: ['30-day window.'],
      requiredValidation: ['ATR-decile segmentation.', 'Exit-rule sensitivity sweep.'],
      historicalComparison: 'MS v1 decayed via entry quality, a different failure mode.',
    },
  },
  {
    id: 'DSC-04',
    title: 'Regime-transition capture gap',
    summary: 'The 6–12 candle window around regime transitions contains 8.4% of total range but only 0.31% is captured.',
    severity: 'info',
    confidence: 76,
    detected: 'Session −5',
    impacts: [
      { domain: 'Specialists', items: [{ label: 'Specialist Championship', url: '/specialist-championship' }], note: 'No specialist owns the transition window.' },
      { domain: 'Strategies', items: [{ label: 'Specialist Discovery v2', url: '/specialist-discovery-v2' }], note: 'Coverage gap scanner input.' },
      { domain: 'Journals', items: [{ label: 'Research Journal', url: '/journal' }], note: 'Transition study.' },
      { domain: 'Validation Reports', items: [{ label: 'Move Capture Audit', url: '/move-capture' }], note: 'Capture decomposition.' },
      { domain: 'Executive Decisions', items: [{ label: 'Executive Program Status', url: '/executive-program-status' }], note: 'Pipeline expansion candidate.' },
      { domain: 'Governance Rules', items: [{ label: 'Governance', url: '/governance' }], note: 'Any new specialist enters at Research Only.' },
      { domain: 'Promotion Gates', items: [{ label: 'Promotion', url: '/promotion' }], note: 'No gate impact yet.' },
      { domain: 'Research Papers', items: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }], note: 'Transition Window Capture hypothesis.' },
    ],
    explain: {
      reasoning: 'Range attribution by regime label shows a persistent uncovered band at transitions where all five specialists are gated off.',
      evidence: ['Transition range share 8.4%', 'Captured 0.31%', 'Zero specialist activations in window'],
      confidence: 76,
      alternatives: ['Transition windows may be unprofitable after costs.'],
      weaknesses: ['Regime transitions are labelled with hindsight.'],
      requiredValidation: ['Causal (non-hindsight) transition detector.', 'Cost-adjusted capture study.'],
      historicalComparison: 'The compression gap looked similar before VCB v1 and proved exploitable at 67% capture.',
    },
  },
  {
    id: 'DSC-05',
    title: 'VCB compression-width parameter plateau',
    summary: 'PF stays within 0.06 across compression widths of 16–24%, indicating genuine parameter stability rather than a fitted peak.',
    severity: 'positive',
    confidence: 80,
    detected: 'Session −9',
    impacts: [
      { domain: 'Specialists', items: [{ label: 'VCB v1', url: '/vcb-v1' }], note: 'Subject strategy.' },
      { domain: 'Strategies', items: [{ label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' }], note: 'Shares compression detection.' },
      { domain: 'Journals', items: [{ label: 'Research Journal', url: '/journal' }], note: 'Sensitivity study.' },
      { domain: 'Validation Reports', items: [{ label: 'Backtest', url: '/backtest' }], note: 'Parameter sensitivity card.' },
      { domain: 'Executive Decisions', items: [{ label: 'Investment Committee', url: '/committee' }], note: 'Robustness evidence.' },
      { domain: 'Governance Rules', items: [{ label: 'Governance', url: '/governance' }], note: 'Robustness requirement satisfied.' },
      { domain: 'Promotion Gates', items: [{ label: 'Readiness', url: '/readiness' }], note: 'Robustness score contribution.' },
      { domain: 'Research Papers', items: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }], note: 'Stability appendix.' },
    ],
    explain: {
      reasoning: 'A flat PF surface across an 8-point parameter band is the signature of structural edge rather than curve fitting.',
      evidence: ['PF range 1.61–1.67 across 16–24%', 'No single-point spike', 'Consistent across BTC/ETH/SOL'],
      confidence: 80,
      alternatives: ['Flatness could mean the parameter is simply inert.'],
      weaknesses: ['XRP shows a shallower plateau.'],
      requiredValidation: ['Walk-forward re-fit per quarter.', 'Out-of-sample plateau confirmation.'],
      historicalComparison: 'Router v2 SMA distance showed the same plateau shape before promotion.',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Section 4 — Opportunity Engine                                      */
/* ------------------------------------------------------------------ */

export type OpportunityKind =
  | 'unused_edge' | 'portfolio_improvement' | 'capital_efficiency' | 'diversification'
  | 'research_gap' | 'validation_gap' | 'regime_blind_spot' | 'parameter_stability'
  | 'behavioural_drift' | 'emerging_specialist';

export const OPP_LABEL: Record<OpportunityKind, string> = {
  unused_edge: 'Unused Edge',
  portfolio_improvement: 'Portfolio Improvement',
  capital_efficiency: 'Capital Efficiency',
  diversification: 'Diversification',
  research_gap: 'Research Gap',
  validation_gap: 'Validation Gap',
  regime_blind_spot: 'Regime Blind Spot',
  parameter_stability: 'Parameter Stability',
  behavioural_drift: 'Behavioural Drift',
  emerging_specialist: 'Emerging Specialist',
};

export interface Opportunity {
  id: string;
  kind: OpportunityKind;
  title: string;
  benefit: string;
  risk: string;
  confidence: number;
  evidence: string[];
  simulation: InLink;
}

export const OPPORTUNITIES: Opportunity[] = [
  { id: 'OPP-01', kind: 'capital_efficiency', title: 'Redeploy idle Low Vol capital in simulation', benefit: 'Modelled +0.14 PF and +6.1pt deployed capital.', risk: 'Raises compression exposure; drawdown modelled +0.2pt.', confidence: 84, evidence: ['Idle capital 18.6%', 'Low Vol activations 0/11', 'Sim PF 2.11 → 2.25'], simulation: { label: 'Allocation Lab v2', url: '/allocation-lab-v2' } },
  { id: 'OPP-02', kind: 'regime_blind_spot', title: 'Cover the 6–12 candle regime-transition window', benefit: 'Up to 8.1pt of uncaptured range becomes addressable.', risk: 'Transition signals are hindsight-labelled; live detection may lag.', confidence: 71, evidence: ['Transition range 8.4%', 'Capture 0.31%', 'No specialist gated on'], simulation: { label: 'Specialist Discovery v2', url: '/specialist-discovery-v2' } },
  { id: 'OPP-03', kind: 'diversification', title: 'Exploit the TR/VCB decoupling in weighting', benefit: 'Diversity score +6; modelled DD −0.3pt at equal return.', risk: 'Correlation may revert; weights would need re-review.', confidence: 78, evidence: ['Correlation 0.41 → 0.08', 'Shared entries 41% → 12%'], simulation: { label: 'Allocation Lab v1', url: '/allocation-lab' } },
  { id: 'OPP-04', kind: 'unused_edge', title: 'Adaptive compression exit to recover forfeited R', benefit: 'Compression specialists forfeit ~0.9R per trade at current exits.', risk: 'Longer holds increase reversal exposure.', confidence: 74, evidence: ['MFE/exit gap 0.9R', 'Consistent across VCB and LVC'], simulation: { label: 'AI Quant Scientist', url: '/quant-scientist' } },
  { id: 'OPP-05', kind: 'behavioural_drift', title: 'Correct MS v2 hold-time drift before PF breaches 1.40', benefit: 'Restores modelled PF from 1.48 to 1.56.', risk: 'Tighter exits may cut winners in genuine expansions.', confidence: 80, evidence: ['Hold +2.4 candles', 'Avg winner −0.21R'], simulation: { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' } },
  { id: 'OPP-06', kind: 'validation_gap', title: 'Fill the bear-regime coverage gap in the champion trial', benefit: 'Raises head-to-head confidence from 86 to an estimated 93.', risk: 'May reduce measured challenger edge.', confidence: 88, evidence: ['Bear sample 9% of sessions', 'Excess return in bear only 4%'], simulation: { label: 'Champion Trial', url: '/champion-trial' } },
  { id: 'OPP-07', kind: 'research_gap', title: 'No study exists on cross-specialist exit interference', benefit: 'Would explain 18% of unattributed drawdown clustering.', risk: 'Study cost; may return a null result.', confidence: 62, evidence: ['Unattributed DD clustering 18%', 'No journal entry on the topic'], simulation: { label: 'Research Journal', url: '/journal' } },
  { id: 'OPP-08', kind: 'parameter_stability', title: 'Promote VCB stability evidence into the readiness score', benefit: 'Robustness contribution +4 points.', risk: 'XRP plateau is shallower and could weaken the claim.', confidence: 79, evidence: ['PF 1.61–1.67 across 16–24%', 'Stable on BTC/ETH/SOL'], simulation: { label: 'Readiness', url: '/readiness' } },
  { id: 'OPP-09', kind: 'portfolio_improvement', title: 'Cap Trend Rider exposure in simulation to clear the gate', benefit: 'Modelled concentration 42% → 34%, gate clears.', risk: 'Modelled PnL −4.2% over the study window.', confidence: 86, evidence: ['Ceiling 35%', 'Sim concentration 34%', 'Sim PF 2.03'], simulation: { label: 'Allocation Production Path', url: '/allocation-production-path' } },
  { id: 'OPP-10', kind: 'emerging_specialist', title: 'Low Vol Coiler v2 is under-evidenced but promising', benefit: 'PF 1.74 at 64% capture on a thin sample; more data raises portfolio coverage.', risk: '31 trades only; conclusions are provisional.', confidence: 66, evidence: ['PF 1.74', 'Capture 64%', 'Trades 31'], simulation: { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' } },
];

/* ------------------------------------------------------------------ */
/* Section 5 — Risk Story Engine                                       */
/* ------------------------------------------------------------------ */

export interface RiskStory {
  id: string;
  title: string;
  severity: 'critical' | 'caution' | 'info';
  paragraphs: string[];
  origin: string;
  expectedResolution: string;
  confidence: number;
  links: InLink[];
}

export const RISK_STORIES: RiskStory[] = [
  {
    id: 'RSK-01',
    title: 'Concentration breach is blocking promotion despite improving Profit Factor',
    severity: 'critical',
    paragraphs: [
      'Bull Trend concentration has exceeded the governance ceiling for 18 consecutive sessions.',
      'This is preventing promotion despite improving Profit Factor.',
      'The concentration originates from Trend Rider contributing 42% of portfolio exposure while Low Vol Coiler remains inactive.',
    ],
    origin: 'Trend Rider v1 exposure 42% vs 35% ceiling; Low Vol Coiler v2 inactive for 11 sessions.',
    expectedResolution: 'Wait for Low Vol activation or simulate alternative allocations.',
    confidence: 94,
    links: [
      { label: 'Allocation Production Path', url: '/allocation-production-path' },
      { label: 'Governance', url: '/governance' },
      { label: 'Allocation Lab v2', url: '/allocation-lab-v2' },
    ],
  },
  {
    id: 'RSK-02',
    title: 'Challenger promotion case rests on an under-sampled bear regime',
    severity: 'caution',
    paragraphs: [
      'Confidence Weighted Allocation leads the champion trial with a 72% modelled win probability.',
      'However only 9% of trial sessions are bear-labelled, and just 4% of the challenger excess return comes from those sessions.',
      'If bear coverage doubles and the pattern from the Router v2.1 study repeats, the measured edge could narrow by up to 40%.',
    ],
    origin: 'Trial window sampling: high-volatility sessions over-represented relative to the 90-day regime distribution.',
    expectedResolution: 'Run the bear stress path in the scenario engine and extend the trial to the 50-trade minimum before any board decision.',
    confidence: 86,
    links: [
      { label: 'Champion Trial', url: '/champion-trial' },
      { label: 'Forward Validation', url: '/forward-validation' },
    ],
  },
  {
    id: 'RSK-03',
    title: 'Momentum Scalper v2 is trending toward its governance warning band',
    severity: 'caution',
    paragraphs: [
      'Profit Factor has fallen from 1.56 to 1.48 over 30 days, approaching the 1.50 warning threshold used by the Health Monitor.',
      'Entry precision and win rate are unchanged, so this is an exit-timing problem rather than a signal-quality problem.',
      'At the current rate of decay the strategy reaches the warning band within roughly eight sessions.',
    ],
    origin: 'Average hold time extended 2.4 candles beyond specification, shrinking average winners by 0.21R.',
    expectedResolution: 'Segment by ATR decile and run an exit-rule sensitivity sweep in simulation; no parameter change may be applied without Approval Board review.',
    confidence: 88,
    links: [
      { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' },
      { label: 'Specialist Approval Board', url: '/specialist-approval-board' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Section 6 — AI Research Companion                                   */
/* ------------------------------------------------------------------ */

export type CompanionKind = 'unusual' | 'completed' | 'relationship' | 'review' | 'hypothesis' | 'conflict';

export interface CompanionMessage {
  id: string;
  kind: CompanionKind;
  opener: string;
  detail: string;
  confidence: number;
  link: InLink;
}

export const COMPANION_MESSAGES: CompanionMessage[] = [
  { id: 'CMP-01', kind: 'unusual', opener: 'I found something unusual.', detail: 'Trend Rider and VCB correlation collapsed from 0.41 to 0.08 in seven sessions without any change to either strategy. That is faster than any correlation move in the archive.', confidence: 82, link: { label: 'Open DSC-02', url: '/specialist-championship' } },
  { id: 'CMP-02', kind: 'completed', opener: "I have completed today's research.", detail: 'Twelve modules scanned, four new discoveries, three confirmations and one rejection. The overnight report is ready for review.', confidence: 95, link: { label: 'Autonomous Research Engine', url: '/autonomous-research' } },
  { id: 'CMP-03', kind: 'relationship', opener: 'I discovered a new relationship.', detail: 'Capital efficiency and promotion probability now move together with a 0.79 rank correlation, independent of Profit Factor. Efficiency is behaving as the binding constraint.', confidence: 87, link: { label: 'Allocation Production Path', url: '/allocation-production-path' } },
  { id: 'CMP-04', kind: 'review', opener: 'I recommend reviewing Validation Report 17.', detail: 'The bear-regime block in the champion trial has only nine sessions. Every downstream promotion claim inherits that thin sample.', confidence: 86, link: { label: 'Champion Trial', url: '/champion-trial' } },
  { id: 'CMP-05', kind: 'hypothesis', opener: 'I generated a new hypothesis.', detail: 'Adaptive Compression Momentum: hold compression breakouts through the first pullback when ATR is still expanding. Modelled recovery of 0.9R per trade, unvalidated.', confidence: 74, link: { label: 'AI Quant Scientist', url: '/quant-scientist' } },
  { id: 'CMP-06', kind: 'conflict', opener: 'I detected conflicting evidence.', detail: 'The diversification score improved while capital efficiency fell. Both feed the promotion forecast in opposite directions, so the net gate movement is smaller than either signal implies.', confidence: 78, link: { label: 'Specialist Approval Board', url: '/specialist-approval-board' } },
  { id: 'CMP-07', kind: 'unusual', opener: 'Something changed overnight.', detail: 'Low Vol Coiler v2 has now been inactive for 11 sessions, the longest dormancy of any approved specialist since the roster closed.', confidence: 91, link: { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' } },
  { id: 'CMP-08', kind: 'review', opener: 'One of your gates is close to moving.', detail: 'The production path needs 19 more days and 12 more trades. At the current rate both clear in 19 days, assuming the concentration breach resolves.', confidence: 83, link: { label: 'Allocation Production Path', url: '/allocation-production-path' } },
];

/* ------------------------------------------------------------------ */
/* Section 7 — Executive Timeline                                      */
/* ------------------------------------------------------------------ */

export type TimelineKind =
  | 'discovery' | 'hypothesis' | 'validation' | 'paper' | 'review'
  | 'gate' | 'champion' | 'health';

export const TIMELINE_LABEL: Record<TimelineKind, string> = {
  discovery: 'Discovery created',
  hypothesis: 'Hypothesis generated',
  validation: 'Validation completed',
  paper: 'Research paper approved',
  review: 'Executive review',
  gate: 'Promotion gate updated',
  champion: 'Champion changed',
  health: 'Portfolio health changed',
};

export interface TimelineEvent {
  id: string;
  kind: TimelineKind;
  when: string;
  title: string;
  detail: string;
  evidence: InLink[];
}

export const TIMELINE: TimelineEvent[] = [
  { id: 'EVT-01', kind: 'champion', when: 'Day −23', title: 'Dynamic Allocation v1 takes the belt', detail: 'Champion Forward Trial opens with Dynamic Allocation v1 as control and Confidence Weighted as challenger.', evidence: [{ label: 'Champion Trial', url: '/champion-trial' }] },
  { id: 'EVT-02', kind: 'discovery', when: 'Day −18', title: 'Concentration breach detected (DSC-01)', detail: 'Bull Trend exposure crosses the 35% governance ceiling for the first time.', evidence: [{ label: 'Governance', url: '/governance' }, { label: 'Forward Validation', url: '/forward-validation' }] },
  { id: 'EVT-03', kind: 'discovery', when: 'Day −12', title: 'MS v2 hold-time drift detected (DSC-03)', detail: 'Average hold time exceeds specification by more than two candles.', evidence: [{ label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' }] },
  { id: 'EVT-04', kind: 'health', when: 'Day −10', title: 'Portfolio health declines to 87', detail: 'Capital efficiency falls 6.8 points; drawdown and Profit Factor unchanged.', evidence: [{ label: 'Observation Center', url: '/observation-center' }] },
  { id: 'EVT-05', kind: 'validation', when: 'Day −9', title: 'VCB parameter sensitivity study completed', detail: 'Flat PF surface confirmed across compression widths 16–24%.', evidence: [{ label: 'VCB v1', url: '/vcb-v1' }, { label: 'Backtest', url: '/backtest' }] },
  { id: 'EVT-06', kind: 'discovery', when: 'Day −7', title: 'TR/VCB decoupling detected (DSC-02)', detail: 'Rolling correlation falls to 0.08; diversity score gains 6 points.', evidence: [{ label: 'Specialist Championship', url: '/specialist-championship' }] },
  { id: 'EVT-07', kind: 'discovery', when: 'Day −5', title: 'Regime-transition capture gap detected (DSC-04)', detail: '8.4% of range sits in transition windows with 0.31% captured.', evidence: [{ label: 'Move Capture Audit', url: '/move-capture' }] },
  { id: 'EVT-08', kind: 'hypothesis', when: 'Day −4', title: 'Three hypotheses drafted', detail: 'Adaptive Compression Momentum, Dual Confirmation Gating and Transition Window Capture enter peer review.', evidence: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }] },
  { id: 'EVT-09', kind: 'paper', when: 'Day −3', title: 'Compression stability paper approved for circulation', detail: 'Peer review passed 3–0; remains research-only with no production effect.', evidence: [{ label: 'AI Quant Scientist', url: '/quant-scientist' }] },
  { id: 'EVT-10', kind: 'gate', when: 'Day −3', title: 'Promotion forecast drops to 58%', detail: 'Concentration breach and efficiency decline reduce the Stage 3 gate forecast.', evidence: [{ label: 'Allocation Production Path', url: '/allocation-production-path' }] },
  { id: 'EVT-11', kind: 'review', when: 'Day −1', title: 'Executive review: hold challenger promotion', detail: 'Committee defers the allocation decision until bear coverage improves.', evidence: [{ label: 'Investment Committee', url: '/committee' }] },
  { id: 'EVT-12', kind: 'discovery', when: 'Today', title: 'Narrative NAR-01 published', detail: 'Efficiency decline formally attributed to regime concentration rather than strategy decay.', evidence: [{ label: 'Allocation Lab v2', url: '/allocation-lab-v2' }] },
];

/* ------------------------------------------------------------------ */
/* Section 8 — Executive Workspace                                     */
/* ------------------------------------------------------------------ */

export interface PriorityItem { id: string; rank: number; title: string; reason: string; effort: 'Low' | 'Medium' | 'High'; link: InLink }

export const PRIORITY_QUEUE: PriorityItem[] = [
  { id: 'PQ-1', rank: 1, title: 'Resolve or simulate around the concentration breach', reason: 'Sole blocker on the Stage 3 promotion gate for 18 sessions.', effort: 'Medium', link: { label: 'Allocation Lab v2', url: '/allocation-lab-v2' } },
  { id: 'PQ-2', rank: 2, title: 'Run the bear stress path for the champion trial', reason: 'Challenger case rests on a 9% bear sample.', effort: 'Low', link: { label: 'Champion Trial', url: '/champion-trial' } },
  { id: 'PQ-3', rank: 3, title: 'Segment MS v2 by ATR decile', reason: 'Determines whether hold-time drift is structural or regime-driven.', effort: 'Medium', link: { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' } },
  { id: 'PQ-4', rank: 4, title: 'Review the three pending hypotheses', reason: 'Peer review complete; awaiting executive read.', effort: 'Low', link: { label: 'AI Quant Scientist', url: '/quant-scientist' } },
  { id: 'PQ-5', rank: 5, title: 'Investigate Low Vol Coiler dormancy', reason: 'Largest single contributor to idle capital.', effort: 'Medium', link: { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' } },
];

export interface AlertItem { id: string; severity: 'critical' | 'caution' | 'info'; title: string; detail: string; link: InLink }

export const ALERTS: AlertItem[] = [
  { id: 'ALR-1', severity: 'critical', title: 'Concentration ceiling breached (18 sessions)', detail: 'Bull Trend exposure 42% vs 35% ceiling.', link: { label: 'Governance', url: '/governance' } },
  { id: 'ALR-2', severity: 'caution', title: 'MS v2 approaching PF warning band', detail: 'PF 1.48 vs 1.50 threshold.', link: { label: 'Forward Validation', url: '/forward-validation' } },
  { id: 'ALR-3', severity: 'caution', title: 'Capital efficiency below 85%', detail: '81.4% deployed, 10-session decline.', link: { label: 'Allocation Production Path', url: '/allocation-production-path' } },
  { id: 'ALR-4', severity: 'info', title: 'Diversity score improved', detail: 'TR/VCB decoupling adds 6 points.', link: { label: 'Specialist Approval Board', url: '/specialist-approval-board' } },
];

export interface Investigation { id: string; title: string; status: 'open' | 'in_progress' | 'awaiting_evidence'; owner: string; progress: number; link: InLink }

export const INVESTIGATIONS: Investigation[] = [
  { id: 'INV-01', title: 'Low Vol Coiler v2 dormancy', status: 'in_progress', owner: 'Intelligence Network', progress: 62, link: { label: 'Low-Vol Coiler v2', url: '/low-vol-coiler-v2' } },
  { id: 'INV-02', title: 'Concentration vs Profit Factor trade-off', status: 'in_progress', owner: 'Allocation Lab', progress: 45, link: { label: 'Allocation Lab v2', url: '/allocation-lab-v2' } },
  { id: 'INV-03', title: 'MS v2 hold-time drift attribution', status: 'awaiting_evidence', owner: 'Quant Scientist', progress: 28, link: { label: 'Momentum Scalper v2', url: '/momentum-scalper-v2' } },
  { id: 'INV-04', title: 'Bear-regime portability of the challenger', status: 'open', owner: 'Champion Trial', progress: 10, link: { label: 'Champion Trial', url: '/champion-trial' } },
];

export interface PendingDecision { id: string; title: string; question: string; recommendation: string; confidence: number; link: InLink }

export const PENDING_DECISIONS: PendingDecision[] = [
  { id: 'DEC-1', title: 'Champion promotion', question: 'Promote Confidence Weighted Allocation to champion?', recommendation: 'Defer. Extend the trial to 50 trades and add bear coverage first.', confidence: 86, link: { label: 'Promotion Board', url: '/promotion-board' } },
  { id: 'DEC-2', title: 'Concentration ceiling review', question: 'Is a 35% ceiling appropriate for a five-specialist roster?', recommendation: 'Run the 35/40/45% sensitivity sweep before any governance change is even discussed.', confidence: 74, link: { label: 'Governance', url: '/governance' } },
  { id: 'DEC-3', title: 'MS v2 specialist standing', question: 'Retain MS v2 as an approved specialist?', recommendation: 'Retain with watch status; the drift is exit-timing and appears correctable in simulation.', confidence: 81, link: { label: 'Specialist Approval Board', url: '/specialist-approval-board' } },
];

export interface CalendarEntry { day: string; title: string; kind: string }

export const CALENDAR: CalendarEntry[] = [
  { day: 'Mon', title: 'Overnight scan + daily brief', kind: 'Automated' },
  { day: 'Tue', title: 'Bear stress path (champion trial)', kind: 'Validation' },
  { day: 'Wed', title: 'Concentration sensitivity sweep', kind: 'Simulation' },
  { day: 'Thu', title: 'Hypothesis peer review round', kind: 'Review' },
  { day: 'Fri', title: 'Weekly executive report + PDF export', kind: 'Reporting' },
  { day: 'Sat', title: 'Knowledge graph reconciliation', kind: 'Maintenance' },
  { day: 'Sun', title: 'Learning statistics recalculation', kind: 'Automated' },
];

export interface GraphNode { id: string; label: string; group: string; url: string }
export interface GraphEdge { from: string; to: string; label: string }

export const GRAPH_NODES: GraphNode[] = [
  { id: 'tr', label: 'Trend Rider v1', group: 'Specialist', url: '/strategies' },
  { id: 'mr', label: 'Mean Reversion v1', group: 'Specialist', url: '/strategies' },
  { id: 'ms', label: 'Momentum Scalper v2', group: 'Specialist', url: '/momentum-scalper-v2' },
  { id: 'vcb', label: 'VCB v1', group: 'Specialist', url: '/vcb-v1' },
  { id: 'lvc', label: 'Low-Vol Coiler v2', group: 'Specialist', url: '/low-vol-coiler-v2' },
  { id: 'cw', label: 'Confidence Weighted', group: 'Allocation', url: '/allocation-lab-v2' },
  { id: 'dyn', label: 'Dynamic Allocation v1', group: 'Allocation', url: '/allocation-lab' },
  { id: 'gate', label: 'Production Path Gate', group: 'Governance', url: '/allocation-production-path' },
  { id: 'gov', label: 'Governance Rules', group: 'Governance', url: '/governance' },
  { id: 'trial', label: 'Champion Trial', group: 'Validation', url: '/champion-trial' },
  { id: 'fwd', label: 'Forward Validation', group: 'Validation', url: '/forward-validation' },
  { id: 'qs', label: 'Research Papers', group: 'Research', url: '/quant-scientist' },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: 'tr', to: 'gate', label: 'blocks (concentration)' },
  { from: 'lvc', to: 'gate', label: 'dormancy reduces efficiency' },
  { from: 'tr', to: 'vcb', label: 'decoupled (0.08)' },
  { from: 'ms', to: 'fwd', label: 'drift warning' },
  { from: 'cw', to: 'trial', label: 'challenger' },
  { from: 'dyn', to: 'trial', label: 'control' },
  { from: 'gov', to: 'gate', label: 'defines ceiling' },
  { from: 'vcb', to: 'qs', label: 'stability evidence' },
  { from: 'ms', to: 'qs', label: 'adaptive exit hypothesis' },
  { from: 'cw', to: 'gate', label: 'promotion candidate' },
];

/* ------------------------------------------------------------------ */
/* Section 10 — Continuous Learning                                    */
/* ------------------------------------------------------------------ */

export interface LearningStat { key: string; label: string; value: string; detail: string; pct?: number }

export const LEARNING_STATS: LearningStat[] = [
  { key: 'made', label: 'Predictions made', value: '148', detail: 'Across 12 modules since the network was enabled.' },
  { key: 'confirmed', label: 'Predictions confirmed', value: '109', detail: 'Confirmed by later observation or validation.', pct: 74 },
  { key: 'rejected', label: 'Predictions rejected', value: '27', detail: 'Explicitly falsified; retained for calibration.', pct: 18 },
  { key: 'accuracy', label: 'Discovery accuracy', value: '80%', detail: 'Share of discoveries that survived follow-up evidence.', pct: 80 },
  { key: 'useful', label: 'Research usefulness', value: '71%', detail: 'Share of research items cited by a later decision or paper.', pct: 71 },
  { key: 'recAcc', label: 'Recommendation accuracy', value: '77%', detail: 'Advisory recommendations whose modelled effect matched later observation.', pct: 77 },
  { key: 'trust', label: 'Executive trust score', value: '82/100', detail: 'Weighted by decision adoption and post-hoc correctness.', pct: 82 },
  { key: 'learning', label: 'Learning score', value: '88/100', detail: 'Calibration improvement rate over the last 30 sessions.', pct: 88 },
];

export const LEARNING_CURVE = [
  { session: 'S-30', accuracy: 61, trust: 64 },
  { session: 'S-25', accuracy: 65, trust: 68 },
  { session: 'S-20', accuracy: 69, trust: 71 },
  { session: 'S-15', accuracy: 72, trust: 74 },
  { session: 'S-10', accuracy: 76, trust: 78 },
  { session: 'S-5', accuracy: 78, trust: 80 },
  { session: 'Now', accuracy: 80, trust: 82 },
];

/* ------------------------------------------------------------------ */
/* Section 11 — Institutional Readiness                                */
/* ------------------------------------------------------------------ */

export interface ReadinessItem { key: string; label: string; status: 'ready' | 'partial' | 'planned'; detail: string }

export const INSTITUTIONAL_READINESS: ReadinessItem[] = [
  { key: 'teams', label: 'Research teams', status: 'partial', detail: 'Shared research surfaces and journals exist; per-team scoping is not yet modelled.' },
  { key: 'compliance', label: 'Compliance review', status: 'ready', detail: 'Every conclusion carries reasoning, evidence, confidence and known weaknesses.' },
  { key: 'audit', label: 'Audit export', status: 'ready', detail: 'Timeline, discoveries and decisions export as a structured JSON audit bundle.' },
  { key: 'board', label: 'Board presentations', status: 'ready', detail: 'Executive workspace and brief are structured for direct board reading.' },
  { key: 'pdf', label: 'PDF reports', status: 'ready', detail: 'Daily brief and risk stories export to a paginated PDF.' },
  { key: 'ic', label: 'Investment committee meetings', status: 'ready', detail: 'Pending decisions carry an advisory recommendation and confidence.' },
  { key: 'white', label: 'White-label deployment', status: 'planned', detail: 'Design tokens are centralised; branding surface is not yet parameterised.' },
  { key: 'api', label: 'API integrations', status: 'planned', detail: 'Engine output is pure data and serialisable, ready for an API surface.' },
  { key: 'multi', label: 'Multi-user workspaces', status: 'planned', detail: 'Requires an accounts layer; nothing in the network assumes a single user.' },
  { key: 'rbac', label: 'Role-based permissions', status: 'planned', detail: 'Advisory-only posture means no privileged action exists to gate yet.' },
];

/* ------------------------------------------------------------------ */
/* Section 12/13 — Identity & Governance                               */
/* ------------------------------------------------------------------ */

export const PLATFORM_IDENTITY = {
  name: 'CryptoTrader™',
  tagline: 'Institutional Quantitative Research Operating System',
  mission: ['Discover.', 'Validate.', 'Explain.', 'Govern.'],
  promises: [
    'Everything remains traceable.',
    'Everything remains explainable.',
    'Everything remains simulation-only until governance approval.',
  ],
};

export const GOVERNANCE_GUARANTEES: string[] = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'No automatic execution',
  'No automatic promotion',
  'No automatic allocation changes',
  'Every recommendation remains advisory',
  'Never bypasses Championship, Approval Board, Production Path or the governance framework',
];

/* ------------------------------------------------------------------ */
/* Audit export (Section 11)                                           */
/* ------------------------------------------------------------------ */

export function buildAuditBundle() {
  return {
    generatedAt: new Date().toISOString(),
    platform: PLATFORM_IDENTITY,
    governance: GOVERNANCE_GUARANTEES,
    brief: buildDailyBrief(),
    narratives: NARRATIVES,
    discoveries: DISCOVERIES,
    opportunities: OPPORTUNITIES,
    riskStories: RISK_STORIES,
    timeline: TIMELINE,
    priorityQueue: PRIORITY_QUEUE,
    alerts: ALERTS,
    investigations: INVESTIGATIONS,
    pendingDecisions: PENDING_DECISIONS,
    learning: LEARNING_STATS,
    institutionalReadiness: INSTITUTIONAL_READINESS,
    disclaimer: 'Advisory only. Simulation-only research artefact. No execution, promotion or allocation change is implied or performed.',
  };
}
