// ATLAS™ — Institutional AI Research Operating System.
// OBSERVATION ONLY / RESEARCH ONLY / SIMULATION ONLY.
// No exchange connectivity, no API keys, no order placement, no strategy or
// allocation mutation, no automatic promotion. Advisory output only.

export interface AtlasExplain {
  why: string;
  evidence: string[];
  counterEvidence: string[];
  weaknesses: string[];
  historicalComparison: string;
  confidence: number;
  requiredValidation: string[];
  supporting: string[];
  opposing: string[];
}

export interface ExecCard {
  key: string;
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'caution' | 'neutral';
  source: string;
  to: string;
  detail: string;
}

export const EXEC_CARDS: ExecCard[] = [
  { key: 'health', label: 'Institutional Health', value: '92 / 100', delta: '+3 (7d)', tone: 'positive', source: 'Portfolio Architecture Review', to: '/portfolio-architecture-review', detail: 'Composite of architecture maturity, governance compliance, specialist coverage and validation integrity.' },
  { key: 'iq', label: 'Research IQ', value: '138', delta: '+6 (7d)', tone: 'positive', source: 'AI Research Brain', to: '/research-brain', detail: 'Hypothesis quality, validation rigour, prediction accuracy and knowledge reuse.' },
  { key: 'portfolio', label: 'Portfolio Health', value: 'PF 2.04 · DD 2.6%', delta: 'PF -0.07', tone: 'caution', source: 'Forward Validation', to: '/forward-validation', detail: 'Confidence Weighted allocation under observation-mode forward validation.' },
  { key: 'gov', label: 'Governance Status', value: 'COMPLIANT', delta: '0 breaches', tone: 'positive', source: 'Governance', to: '/governance', detail: 'All modules observation-only. Promotion gates enforced. Full audit trail intact.' },
  { key: 'velocity', label: 'Research Velocity', value: '3.2 / day', delta: '+0.5', tone: 'positive', source: 'Autonomous Research Engine', to: '/autonomous-research', detail: 'Validated research artefacts produced per simulated research day.' },
  { key: 'promo', label: 'Promotion Probability', value: '58%', delta: '+6 pts', tone: 'neutral', source: 'Allocation Production Path', to: '/allocation-production-path', detail: 'Modelled probability that Confidence Weighted clears the 60-day / 50-trade gate.' },
  { key: 'consensus', label: 'Executive Consensus', value: '74%', delta: '6 of 8 depts', tone: 'positive', source: 'Investment Committee', to: '/committee', detail: 'Weighted board agreement on today\'s primary recommendation.' },
  { key: 'aiconf', label: 'AI Confidence', value: '81%', delta: '+4 pts', tone: 'positive', source: 'Intelligence Network', to: '/intelligence-network', detail: 'Mean confidence across live conclusions, weighted by evidence depth.' },
  { key: 'invest', label: 'Open Investigations', value: '7', delta: '+2 opened', tone: 'neutral', source: 'Mission Control', to: '/mission-control', detail: 'Investigations currently open across specialist, allocation and governance modules.' },
];

export type DeptStatus = 'Healthy' | 'Monitoring' | 'Investigating' | 'Reviewing' | 'Waiting';

export interface Department {
  id: string;
  name: string;
  to: string;
  health: number;
  confidence: number;
  status: DeptStatus;
  investigation: string;
  recommendation: string;
  lastUpdate: string;
  overnight: string;
  opportunity: string;
  risk: string;
  evidence: string[];
  recommendedInvestigation: string;
}

export const DEPARTMENTS: Department[] = [
  {
    id: 'brain', name: 'AI Research Brain', to: '/research-brain', health: 94, confidence: 84, status: 'Investigating',
    investigation: 'Low-Vol Coiler activation timing (2.4-candle lag)',
    recommendation: 'Prioritise LVC v2 activation-lag study before any allocation change.',
    lastUpdate: '04:12 (simulated)',
    overnight: 'Ranked 11 open questions by expected research impact ÷ runtime cost; three unexplained behaviours remain.',
    opportunity: 'Shifting LVC v2 activation earlier addresses capture %, PF and the sideways gap simultaneously.',
    risk: 'Two of three unexplained behaviours sit inside the allocation layer, not the specialists.',
    evidence: ['LVC v2 mean activation lag 2.4 candles', 'Sideways regime capture 41% vs 67% target', 'Compression persistence peaks precede breakout by 3 candles'],
    recommendedInvestigation: 'EXP-052 — LVC v2 activation-lag sweep (-1, -2, -3 candles).',
  },
  {
    id: 'cio', name: 'AI Chief Investment Officer', to: '/cio', health: 90, confidence: 79, status: 'Reviewing',
    investigation: 'PF drift in Momentum Scalper v2 during forward validation',
    recommendation: 'Hold promotion. Extend observation window by 14 simulated days.',
    lastUpdate: '05:40 (simulated)',
    overnight: 'Reviewed 3 executive alerts; one escalated — MS v2 PF slipped below the 1.50 warning line intraweek.',
    opportunity: 'Confidence Weighted allocation still leads Dynamic v1 by 0.19 PF on a 30-day window.',
    risk: 'MS v2 contribution volatility is the largest single driver of portfolio PF variance.',
    evidence: ['MS v2 PF 1.47 (7d) vs 1.56 (90d)', 'Allocation share 22% → 26%', 'Champion trial streak 31 of 60 days'],
    recommendedInvestigation: 'Cap MS v2 allocation share in simulation and re-measure portfolio PF.',
  },
  {
    id: 'quant', name: 'AI Quant Scientist', to: '/quant-scientist', health: 88, confidence: 76, status: 'Investigating',
    investigation: 'Adaptive Compression Momentum (EXP-052) design',
    recommendation: 'Advance EXP-052 to Monte Carlo + stress-test stage.',
    lastUpdate: '03:55 (simulated)',
    overnight: 'Generated 2 new hypotheses; 1 rejected for 68% behavioural overlap with VCB v1.',
    opportunity: 'Dual-confirmation entry lifts simulated PF from 1.64 to 1.81 on the compression cohort.',
    risk: 'Sample size of 46 trades is below the 60-trade validation floor.',
    evidence: ['HYP-031 innovation score 78', 'Overlap vs VCB v1 41% (below 60% rejection line)', 'Peer review 2 accept / 1 revise'],
    recommendedInvestigation: 'Run 5,000-path Monte Carlo on EXP-052 before board review.',
  },
  {
    id: 'director', name: 'Portfolio AI Director', to: '/portfolio-ai-director', health: 91, confidence: 82, status: 'Monitoring',
    investigation: 'Regime concentration in bull-weighted specialists',
    recommendation: 'Model a sideways-weighted allocation branch in the What-If Lab.',
    lastUpdate: '06:05 (simulated)',
    overnight: 'Simulated 4 allocation branches; the sideways-weighted branch reduced DD to 2.2% with PF 1.98.',
    opportunity: 'Idle capital in sideways regimes is the largest untapped simulated edge.',
    risk: 'Three of five specialists concentrate in bull/high-vol regimes (single point of failure).',
    evidence: ['Bull-regime exposure 61% of simulated capital', 'Sideways idle capital 28%', 'DD 2.6% vs 3.0% ceiling'],
    recommendedInvestigation: 'What-If: shift 10% weight to LVC v2 in sideways regimes.',
  },
  {
    id: 'network', name: 'Intelligence Network', to: '/intelligence-network', health: 93, confidence: 81, status: 'Healthy',
    investigation: 'Cross-module narrative: bull concentration ↔ idle capital',
    recommendation: 'Escalate the "idle capital in chop" narrative to the executive board.',
    lastUpdate: '06:20 (simulated)',
    overnight: 'Connected 5 isolated signals into 2 narratives; 1 promoted to the priority queue.',
    opportunity: 'Regime blind spot in sideways markets appears in 4 independent modules.',
    risk: 'Narrative confidence rests partly on a 90-day sample with only 12 sideways episodes.',
    evidence: ['4 modules flag sideways underperformance', 'Opportunity score 84 / 100', 'Prediction accuracy 71% trailing'],
    recommendedInvestigation: 'Validate the sideways narrative against synthetic chop scenarios.',
  },
  {
    id: 'mission', name: 'Mission Control', to: '/mission-control', health: 89, confidence: 77, status: 'Monitoring',
    investigation: 'Daily priority ordering for the research team',
    recommendation: 'Make the LVC activation study today\'s mission #1.',
    lastUpdate: '07:00 (simulated)',
    overnight: 'Re-ranked 5 missions; 2 attention alerts raised (1 governance, 1 health).',
    opportunity: 'Two missions can run concurrently without runtime contention.',
    risk: 'Champion trial requires 29 more simulated days before any gate can open.',
    evidence: ['5 active missions', '2 attention alerts', 'Calendar load 62%'],
    recommendedInvestigation: 'Sequence EXP-052 ahead of the allocation branch study.',
  },
  {
    id: 'auto', name: 'Autonomous Research Engine', to: '/autonomous-research', health: 87, confidence: 74, status: 'Investigating',
    investigation: 'Overnight discovery scan (10 signals)',
    recommendation: 'Promote 3 of 10 discoveries into formal hypotheses.',
    lastUpdate: '02:30 (simulated)',
    overnight: 'Scanned performance, risk and regime surfaces; flagged 10 signals, 3 above the promotion threshold.',
    opportunity: 'Discovery D-07 (volatility handoff between VCB v1 and LVC v2) is unexplored.',
    risk: 'Seven discoveries are low-confidence and may inflate the research backlog.',
    evidence: ['Research score grade A', '10 signals flagged', '3 above 70% confidence'],
    recommendedInvestigation: 'Formalise D-07 into a hypothesis with an explicit falsification test.',
  },
  {
    id: 'assistant', name: 'AI Research Assistant', to: '/research-assistant', health: 95, confidence: 86, status: 'Healthy',
    investigation: 'Knowledge index refresh and metric explainers',
    recommendation: 'No action required — index current, explainers complete.',
    lastUpdate: '07:15 (simulated)',
    overnight: 'Indexed 14 new artefacts; answered 9 traced questions with full evidence chains.',
    opportunity: 'Explainer coverage now spans every promotion-gate metric.',
    risk: 'Two metrics still resolve to definitions rather than measured history.',
    evidence: ['14 artefacts indexed', '100% gate-metric explainer coverage', '9 traced answers'],
    recommendedInvestigation: 'Backfill measured history for the two definition-only metrics.',
  },
];

export const BOARD_CONSENSUS = {
  statement: 'Advance the Low-Vol Coiler activation-lag study (EXP-052) before any allocation weighting change. Hold all promotions.',
  agreement: 74,
  supported: ['brain', 'quant', 'director', 'network', 'mission', 'auto'],
  rejected: ['cio'],
  abstained: ['assistant'],
  rationale: 'Six departments identify the sideways regime gap as the dominant unexplained variance. The CIO opposes sequencing research ahead of resolving MS v2 PF drift. The Research Assistant abstains — no independent evidence position.',
};

export interface BusStep {
  dept: string;
  to: string;
  output: string;
  confidence: number;
}

export const INTELLIGENCE_BUS: BusStep[] = [
  { dept: 'AI Research Brain', to: '/research-brain', output: 'Identified LVC v2 activation lag as highest unexplained variance.', confidence: 84 },
  { dept: 'AI Quant Scientist', to: '/quant-scientist', output: 'Formalised EXP-052 — activation-lag sweep with falsification criteria.', confidence: 76 },
  { dept: 'Validation', to: '/forward-validation', output: 'Designed Monte Carlo (5,000 paths) + chop stress scenarios.', confidence: 72 },
  { dept: 'Portfolio AI Director', to: '/portfolio-ai-director', output: 'Modelled sideways-weighted branch: PF 1.98, DD 2.2%.', confidence: 82 },
  { dept: 'AI CIO', to: '/cio', output: 'Flagged MS v2 PF drift as competing priority; recommends hold on promotion.', confidence: 79 },
  { dept: 'Mission Control', to: '/mission-control', output: 'Sequenced EXP-052 as mission #1 for the simulated research day.', confidence: 77 },
  { dept: 'Executive Board', to: '/committee', output: 'Consensus 74% — proceed with EXP-052, promotions remain locked.', confidence: 74 },
];

export type VoteKind = 'Supported' | 'Rejected' | 'Abstained';

export interface Proposal {
  id: string;
  title: string;
  summary: string;
  consensus: number;
  votes: { dept: string; deptId: string; vote: VoteKind; note: string }[];
  explain: AtlasExplain;
}

export const PROPOSALS: Proposal[] = [
  {
    id: 'PRP-014',
    title: 'Run EXP-052 — LVC v2 activation-lag sweep',
    summary: 'Sweep activation timing at -1, -2 and -3 candles against compression persistence peaks.',
    consensus: 74,
    votes: [
      { dept: 'AI Research Brain', deptId: 'brain', vote: 'Supported', note: 'Largest unexplained variance with the lowest runtime cost.' },
      { dept: 'AI Quant Scientist', deptId: 'quant', vote: 'Supported', note: 'Design is falsifiable and overlap with VCB v1 is inside limits.' },
      { dept: 'Portfolio AI Director', deptId: 'director', vote: 'Supported', note: 'Directly addresses idle capital in sideways regimes.' },
      { dept: 'Intelligence Network', deptId: 'network', vote: 'Supported', note: 'Four independent modules corroborate the sideways gap.' },
      { dept: 'Mission Control', deptId: 'mission', vote: 'Supported', note: 'Fits today\'s runtime budget without contention.' },
      { dept: 'Autonomous Research Engine', deptId: 'auto', vote: 'Supported', note: 'Overlaps discovery D-07 (volatility handoff).' },
      { dept: 'AI Chief Investment Officer', deptId: 'cio', vote: 'Rejected', note: 'MS v2 PF drift should be resolved before opening new research threads.' },
      { dept: 'AI Research Assistant', deptId: 'assistant', vote: 'Abstained', note: 'No independent evidence position; indexing role only.' },
    ],
    explain: {
      why: 'LVC v2 activates 2.4 candles after compression persistence peaks, which coincides with the largest simulated capture shortfall (41% vs 67% target) in sideways regimes.',
      evidence: ['Sideways capture 41% vs 67% target', 'Mean activation lag 2.4 candles', 'Sideways idle capital 28% of simulated equity', 'Four modules independently flag the same gap'],
      counterEvidence: ['Only 12 distinct sideways episodes in the 90-day sample', 'MS v2 PF drift may dominate near-term portfolio variance', 'Earlier activation historically raised false-breakout rate by 9%'],
      weaknesses: ['Sample size below the 60-trade validation floor', 'Compression persistence metric is sensitive to ATR window choice'],
      historicalComparison: 'VCB v1 underwent an equivalent trigger-timing sweep; PF rose 1.42 → 1.64 with a 4% rise in false triggers.',
      confidence: 74,
      requiredValidation: ['5,000-path Monte Carlo', 'Synthetic chop stress scenarios', 'Walk-forward on out-of-sample 30 days', 'Overlap re-check vs VCB v1'],
      supporting: ['AI Research Brain', 'AI Quant Scientist', 'Portfolio AI Director', 'Intelligence Network', 'Mission Control', 'Autonomous Research Engine'],
      opposing: ['AI Chief Investment Officer'],
    },
  },
  {
    id: 'PRP-015',
    title: 'Cap Momentum Scalper v2 allocation share at 20% (simulation)',
    summary: 'Constrain MS v2 weight inside the Confidence Weighted simulation and re-measure portfolio PF and DD.',
    consensus: 52,
    votes: [
      { dept: 'AI Chief Investment Officer', deptId: 'cio', vote: 'Supported', note: 'MS v2 is the dominant driver of portfolio PF variance.' },
      { dept: 'Portfolio AI Director', deptId: 'director', vote: 'Supported', note: 'Simulated DD falls to 2.3% under the cap.' },
      { dept: 'Mission Control', deptId: 'mission', vote: 'Supported', note: 'Low runtime cost; can run alongside EXP-052.' },
      { dept: 'AI Research Brain', deptId: 'brain', vote: 'Rejected', note: 'Treats a symptom; activation timing is the underlying cause.' },
      { dept: 'AI Quant Scientist', deptId: 'quant', vote: 'Rejected', note: 'Capping without a mechanism hypothesis is not falsifiable research.' },
      { dept: 'Intelligence Network', deptId: 'network', vote: 'Abstained', note: 'Narrative evidence is ambiguous at this sample size.' },
      { dept: 'Autonomous Research Engine', deptId: 'auto', vote: 'Abstained', note: 'No discovery signal supports or contradicts the cap.' },
      { dept: 'AI Research Assistant', deptId: 'assistant', vote: 'Abstained', note: 'Indexing role only.' },
    ],
    explain: {
      why: 'MS v2 contributes 26% of simulated allocation but 41% of portfolio PF variance, making it the single largest instability source in forward validation.',
      evidence: ['MS v2 PF 1.47 (7d) vs 1.56 (90d)', 'Variance contribution 41%', 'Simulated DD falls 2.6% → 2.3% under a 20% cap'],
      counterEvidence: ['MS v2 remains the top contributor in high-vol regimes', 'Capping reduces simulated net PnL by 6%', 'Drift may be a normal 7-day sampling artefact'],
      weaknesses: ['No causal mechanism proposed', 'A static cap conflicts with the confidence-weighted design intent'],
      historicalComparison: 'Router v2.1 threshold reduction produced a similar trade-off: higher frequency, marginally lower PF.',
      confidence: 52,
      requiredValidation: ['Regime-split attribution', 'Cap sensitivity sweep 15/20/25%', 'Forward validation re-run'],
      supporting: ['AI Chief Investment Officer', 'Portfolio AI Director', 'Mission Control'],
      opposing: ['AI Research Brain', 'AI Quant Scientist'],
    },
  },
];

export interface FeedItem { time: string; dept: string; to: string; text: string; tone: 'info' | 'positive' | 'caution' }

export const LIVE_FEED: FeedItem[] = [
  { time: '07:15', dept: 'AI Research Assistant', to: '/research-assistant', text: 'Knowledge index refreshed — 14 artefacts added.', tone: 'info' },
  { time: '07:00', dept: 'Mission Control', to: '/mission-control', text: 'Daily priorities updated — EXP-052 promoted to mission #1.', tone: 'positive' },
  { time: '06:20', dept: 'Intelligence Network', to: '/intelligence-network', text: 'Narrative "idle capital in chop" escalated to the priority queue.', tone: 'caution' },
  { time: '06:05', dept: 'Portfolio AI Director', to: '/portfolio-ai-director', text: 'Sideways-weighted allocation branch simulated: PF 1.98 / DD 2.2%.', tone: 'positive' },
  { time: '05:40', dept: 'AI Chief Investment Officer', to: '/cio', text: 'Executive recommendation changed — hold MS v2 promotion.', tone: 'caution' },
  { time: '04:12', dept: 'AI Research Brain', to: '/research-brain', text: 'Generated HYP-031 — compression persistence lead indicator.', tone: 'info' },
  { time: '03:55', dept: 'AI Quant Scientist', to: '/quant-scientist', text: 'Proposed EXP-052 — activation-lag sweep, innovation score 78.', tone: 'info' },
  { time: '02:30', dept: 'Autonomous Research Engine', to: '/autonomous-research', text: 'Overnight scan complete — 10 signals, 3 above threshold.', tone: 'info' },
  { time: '01:10', dept: 'Forward Validation', to: '/forward-validation', text: 'Day 31 of 60 completed — success streak intact.', tone: 'positive' },
  { time: '00:45', dept: 'Governance', to: '/governance', text: 'Compliance sweep passed — 0 breaches, audit trail intact.', tone: 'positive' },
];

export type MemoryKind = 'Major Discovery' | 'Rejected Idea' | 'Breakthrough' | 'Governance Decision' | 'Lesson Learned' | 'Promotion History' | 'Research Milestone';

export interface MemoryEntry { kind: MemoryKind; date: string; title: string; detail: string; to: string }

export const INSTITUTIONAL_MEMORY: MemoryEntry[] = [
  { kind: 'Major Discovery', date: 'Day 12', title: 'Sideways regime blind spot', detail: 'Four independent modules converged on the same capture shortfall in low-volatility chop.', to: '/intelligence-network' },
  { kind: 'Breakthrough', date: 'Day 24', title: 'Confidence Weighted allocation', detail: 'Regime confidence × specialist strength lifted simulated PF to 2.11, beating Dynamic v1.', to: '/allocation-lab-v2' },
  { kind: 'Rejected Idea', date: 'Day 27', title: 'Volatility Breakout clone', detail: 'Rejected at 68% behavioural overlap with VCB v1 — no diversification gain.', to: '/specialist-discovery-v2' },
  { kind: 'Governance Decision', date: 'Day 30', title: 'Promotion lock retained', detail: 'Promotions require 60 days runtime and 50 trades; no exceptions granted.', to: '/governance' },
  { kind: 'Lesson Learned', date: 'Day 33', title: 'Frequency is not free', detail: 'Router v2.1 showed threshold cuts raise trade count but compress PF — measure both.', to: '/router-v21' },
  { kind: 'Promotion History', date: 'Day 41', title: 'MS v2 specialist approval', detail: 'Regime gating lifted PF 1.21 → 1.56; approved as specialist, not standalone.', to: '/momentum-scalper-v2' },
  { kind: 'Research Milestone', date: 'Day 52', title: 'Specialist roster complete', detail: 'Five approved specialists; portfolio readiness score 94, architecture declared mature.', to: '/specialist-approval-board' },
  { kind: 'Lesson Learned', date: 'Day 58', title: 'Drift needs a mechanism', detail: 'Metric drift without a causal hypothesis produces caps, not understanding.', to: '/forward-validation' },
];

export interface CalendarItem { day: string; label: string; source: string; to: string; status: 'Scheduled' | 'In Progress' | 'Complete' }

export const EXECUTIVE_CALENDAR: CalendarItem[] = [
  { day: 'Today', label: 'EXP-052 activation-lag sweep', source: 'Mission Control', to: '/mission-control', status: 'In Progress' },
  { day: 'Today', label: 'Champion Trial day 31 of 60', source: 'Champion Trial', to: '/champion-trial', status: 'In Progress' },
  { day: 'Today', label: 'Governance compliance sweep', source: 'Governance', to: '/governance', status: 'Complete' },
  { day: 'Day +1', label: 'Forward validation daily checkpoint', source: 'Forward Validation', to: '/forward-validation', status: 'Scheduled' },
  { day: 'Day +2', label: 'Research review — specialist coverage', source: 'Specialist Approval Board', to: '/specialist-approval-board', status: 'Scheduled' },
  { day: 'Day +4', label: 'Weekly executive review', source: 'Weekly Review', to: '/weekly-review', status: 'Scheduled' },
  { day: 'Day +7', label: 'Promotion Board session (locked)', source: 'Promotion Board', to: '/promotion-board', status: 'Scheduled' },
  { day: 'Day +18', label: 'Monthly research report', source: 'Monthly Report', to: '/monthly-report', status: 'Scheduled' },
];

export interface AgreementEdge { from: string; to: string; level: 'Green' | 'Amber' | 'Red'; topic: string; supporting: string[]; counter: string[]; validation: string[] }

export const AGREEMENT_MAP: AgreementEdge[] = [
  { from: 'AI Research Brain', to: 'AI Quant Scientist', level: 'Green', topic: 'EXP-052 is the highest-value next study', supporting: ['Shared variance ranking', 'Falsifiable design accepted'], counter: [], validation: ['Monte Carlo before board review'] },
  { from: 'AI Quant Scientist', to: 'Portfolio AI Director', level: 'Green', topic: 'Sideways gap drives allocation inefficiency', supporting: ['Idle capital 28%', 'Branch simulation PF 1.98'], counter: ['Small sideways sample'], validation: ['Synthetic chop scenarios'] },
  { from: 'Portfolio AI Director', to: 'AI CIO', level: 'Amber', topic: 'Research sequencing vs drift containment', supporting: ['Both agree DD ceiling holds'], counter: ['CIO prioritises MS v2 drift', 'Director prioritises regime coverage'], validation: ['Regime-split attribution of PF variance'] },
  { from: 'AI CIO', to: 'Executive Consensus', level: 'Red', topic: 'Whether to open a new research thread today', supporting: ['Consensus cites 6-department agreement'], counter: ['CIO: unresolved drift outranks new threads', 'CIO: runtime contention risk understated'], validation: ['Cap sensitivity sweep 15/20/25%', 'Forward validation re-run'] },
  { from: 'Intelligence Network', to: 'Executive Consensus', level: 'Green', topic: 'Sideways narrative is board-worthy', supporting: ['Four-module corroboration', 'Opportunity score 84'], counter: [], validation: ['Prediction accuracy re-check at day 45'] },
];

export const EXECUTIVE_RECOMMENDATION = {
  title: 'Investigate Low-Vol Coiler v2 activation timing (EXP-052)',
  reason: 'It is the single highest-leverage unexplored variable: it simultaneously touches sideways capture %, portfolio PF and the idle-capital gap, at the lowest runtime cost of any open candidate.',
  expectedGain: 'Modelled +0.11 portfolio PF and +14 pts sideways capture if the lag hypothesis holds; a clean falsification also closes three open questions.',
  confidence: 74,
  humanApproval: true,
  sourceDepartments: ['AI Research Brain', 'AI Quant Scientist', 'Portfolio AI Director', 'Intelligence Network', 'Mission Control', 'Autonomous Research Engine'],
  explain: PROPOSALS[0].explain,
};

export interface SearchEntry { title: string; category: string; to: string; keywords: string }

export const SEARCH_INDEX: SearchEntry[] = [
  { title: 'Router v2.1 (threshold -10% fork)', category: 'Strategies', to: '/router-v21', keywords: 'router fork threshold frequency control challenger' },
  { title: 'Trend Rider v1', category: 'Specialists', to: '/specialist-championship', keywords: 'trend rider specialist gold belt elo' },
  { title: 'Momentum Scalper v2', category: 'Specialists', to: '/momentum-scalper-v2', keywords: 'momentum scalper regime gating high vol atr expansion' },
  { title: 'Volatility Compression Breakout v1', category: 'Specialists', to: '/vcb-v1', keywords: 'vcb compression breakout bollinger atr' },
  { title: 'Low-Vol Coiler v2', category: 'Specialists', to: '/low-vol-coiler-v2', keywords: 'coiler compression persistence sideways activation lag' },
  { title: 'HYP-031 — Compression persistence lead indicator', category: 'Hypotheses', to: '/research-brain', keywords: 'hypothesis compression persistence lead indicator lvc' },
  { title: 'EXP-052 — Activation-lag sweep', category: 'Hypotheses', to: '/quant-scientist', keywords: 'experiment activation lag sweep monte carlo falsification' },
  { title: 'Adaptive Compression Momentum paper', category: 'Research Papers', to: '/quant-scientist', keywords: 'research paper adaptive compression momentum peer review pdf' },
  { title: 'Forward Validation — 60-day observation', category: 'Validation', to: '/forward-validation', keywords: 'forward validation streak degradation health monitor' },
  { title: 'Champion Forward Trial', category: 'Validation', to: '/champion-trial', keywords: 'champion trial confidence weighted dynamic allocation battle log' },
  { title: 'Allocation Production Path', category: 'Promotion', to: '/allocation-production-path', keywords: 'promotion ladder stages forecast probability' },
  { title: 'Promotion Review Board', category: 'Promotion', to: '/promotion-board', keywords: 'promotion board gate locked review' },
  { title: 'Governance & Guardrails', category: 'Governance', to: '/governance', keywords: 'governance guardrails drawdown compliance audit' },
  { title: 'Intelligence Knowledge Graph', category: 'Knowledge Graph', to: '/intelligence-network', keywords: 'knowledge graph narrative connections opportunity engine' },
  { title: 'Research Brain knowledge timeline', category: 'Knowledge Graph', to: '/research-brain', keywords: 'timeline knowledge reasoning evidence tree' },
  { title: 'Institutional memory — lessons learned', category: 'Institutional Memory', to: '/journal', keywords: 'memory lessons rejected ideas breakthroughs milestones' },
  { title: 'Weekly Executive Review', category: 'Reports', to: '/weekly-review', keywords: 'weekly review report pdf export' },
  { title: 'Monthly Research Report', category: 'Reports', to: '/monthly-report', keywords: 'monthly report research summary' },
  { title: 'Specialist Allocation Lab v2', category: 'Strategies', to: '/allocation-lab-v2', keywords: 'confidence weighted rolling performance regime purity allocation' },
  { title: 'Portfolio Architecture Review', category: 'Governance', to: '/portfolio-architecture-review', keywords: 'architecture layers spof redundancy maturity' },
];

export interface ReportSpec { id: string; name: string; cadence: string; description: string; sections: string[] }

export const REPORTS: ReportSpec[] = [
  { id: 'daily', name: 'Daily Executive Brief', cadence: 'Every simulated day', description: 'Morning meeting output, consensus and today\'s single recommendation.', sections: ['Executive cards', 'Department reports', 'Board consensus', 'Recommendation'] },
  { id: 'weekly', name: 'Weekly Executive Review', cadence: 'Every 7 simulated days', description: 'Research velocity, agreement map movement and open investigations.', sections: ['Velocity', 'Agreement map', 'Open investigations', 'Risk register'] },
  { id: 'monthly', name: 'Monthly Research Report', cadence: 'Every 30 simulated days', description: 'Discoveries, hypotheses, validation outcomes and portfolio health.', sections: ['Discoveries', 'Hypotheses', 'Validation', 'Portfolio health'] },
  { id: 'quarterly', name: 'Quarterly Governance Review', cadence: 'Every 90 simulated days', description: 'Guardrail compliance, promotion gate history and audit integrity.', sections: ['Guardrails', 'Promotion gates', 'Audit trail', 'Exceptions'] },
  { id: 'annual', name: 'Annual Research Book', cadence: 'Yearly', description: 'Full institutional memory compiled into a durable research record.', sections: ['Milestones', 'Breakthroughs', 'Rejected ideas', 'Lessons learned'] },
  { id: 'promotion', name: 'Promotion Pack', cadence: 'On demand', description: 'Evidence bundle for a candidate facing the promotion gate.', sections: ['Metrics', 'Validation', 'Board votes', 'Required approvals'] },
  { id: 'validation', name: 'Validation Summary', cadence: 'On demand', description: 'Monte Carlo, stress tests and walk-forward outcomes in one pack.', sections: ['Monte Carlo', 'Stress tests', 'Walk-forward', 'Verdict'] },
  { id: 'audit', name: 'Audit Pack', cadence: 'On demand', description: 'Complete traceable record of reasoning, evidence and decisions.', sections: ['Intelligence bus', 'Votes', 'Evidence', 'Governance attestations'] },
];

export const GOVERNANCE_GUARANTEES: string[] = [
  'Observation Only',
  'Research Only',
  'Simulation Only',
  'No Exchange Connectivity',
  'No API Keys',
  'No Live Trading',
  'No Automatic Allocation',
  'No Strategy Modification',
  'Human Approval Required',
  'Full Audit Trail',
];

export function searchAtlas(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SEARCH_INDEX.filter(
    (e) => e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.keywords.includes(q),
  ).slice(0, 12);
}
