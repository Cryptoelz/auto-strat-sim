/**
 * AI Research Assistant — platform-wide intelligence layer.
 * Deterministic, observation-only knowledge engine over the CryptoTrader research ecosystem.
 * No execution, no live trading, no production changes.
 */

export type Domain =
  | 'specialists' | 'strategies' | 'championship' | 'validation' | 'allocation'
  | 'director' | 'mission-control' | 'observation' | 'governance'
  | 'production-path' | 'journal' | 'reports';

export interface KnowledgeNode {
  id: string;
  title: string;
  domain: Domain;
  route: string;
  summary: string;
  keywords: string[];
  metrics?: Record<string, string | number>;
}

export interface MetricExplanation {
  id: string;
  label: string;
  value: string;
  calculation: string;
  drivers: { label: string; detail: string; impact: 'positive' | 'negative' | 'neutral' }[];
  evidence: string[];
  trend: { period: string; value: number }[];
  trendVerdict: 'improving' | 'stable' | 'declining';
  relatedIds: string[];
}

export interface MemoryEvent {
  id: string;
  date: string;
  category: 'governance' | 'champion' | 'promotion' | 'improvement' | 'recommendation' | 'research';
  title: string;
  detail: string;
  outcome?: string;
  relatedIds: string[];
}

export interface AssistantAnswer {
  question: string;
  headline: string;
  reasoning: string[];
  metrics: string[];
  confidence: number;
  related: KnowledgeNode[];
  metricIds: string[];
}

export interface Briefing {
  kind: 'morning' | 'end-of-day';
  generatedAt: string;
  headline: string;
  sections: { heading: string; lines: string[] }[];
  focus: string;
}

// ─── Knowledge base ──────────────────────────────────────────────────

export const KNOWLEDGE: KnowledgeNode[] = [
  { id: 'tr-v1', title: 'Trend Rider v1', domain: 'specialists', route: '/strategies',
    summary: 'Gold-belt specialist. Bull/trend regimes, highest allocation weight (40%) under Confidence Weighted Allocation.',
    keywords: ['trend rider', 'tr v1', 'trend', 'gold belt', '40%', 'allocation weight'],
    metrics: { PF: 1.92, DD: '2.4%', WinRate: '58%', Elo: 1742 } },
  { id: 'mr-v1', title: 'Mean Reversion v1', domain: 'specialists', route: '/strategies',
    summary: 'Sideways/range specialist. Stabilises the book when trend specialists are gated off.',
    keywords: ['mean reversion', 'mr v1', 'sideways', 'range'],
    metrics: { PF: 1.61, DD: '1.9%', WinRate: '63%' } },
  { id: 'ms-v2', title: 'Momentum Scalper v2', domain: 'specialists', route: '/momentum-scalper-v2',
    summary: 'Regime-gated scalper (High Vol / Bull / ATR expansion). Activation precision 81.6%. Specialist Approved.',
    keywords: ['momentum scalper', 'ms v2', 'scalper', 'activation', 'high vol'],
    metrics: { PF: 1.56, DD: '2.8%', Precision: '81.6%' } },
  { id: 'vcb-v1', title: 'VCB v1', domain: 'specialists', route: '/vcb-v1',
    summary: 'Volatility Compression Breakout. 67% capture on expansion moves, best asset SOL.',
    keywords: ['vcb', 'compression', 'breakout', 'volatility'],
    metrics: { PF: 1.64, DD: '3.1%', Capture: '67%' } },
  { id: 'lvc-v2', title: 'Low-Vol Coiler v2', domain: 'specialists', route: '/low-vol-coiler-v2',
    summary: 'Fifth specialist, fills the low-volatility coverage gap. Capture lifted 58% → 64%. Approved.',
    keywords: ['low vol coiler', 'lvc', 'coiler', 'low volatility', 'capture'],
    metrics: { PF: 1.74, DD: '2.2%', Capture: '64%' } },
  { id: 'router-v2', title: 'Router v2', domain: 'strategies', route: '/participation',
    summary: 'Control router with MPC v2 confidence recovery. Production baseline for all challenger comparisons.',
    keywords: ['router v2', 'control', 'mpc', 'baseline'],
    metrics: { PF: 1.71, DD: '2.6%' } },
  { id: 'router-v21', title: 'Router v2.1', domain: 'strategies', route: '/router-v21',
    summary: 'Fork of Router v2 with entry thresholds reduced 10%. Higher frequency, marginally better PnL.',
    keywords: ['router v2.1', 'v21', 'threshold', 'frequency', 'challenger'],
    metrics: { PF: 1.78, DD: '2.7%' } },
  { id: 'championship', title: 'Specialist Championship', domain: 'championship', route: '/specialist-championship',
    summary: 'Elo-rated specialist league with Gold/Silver/Bronze belts and regime-specific leaders.',
    keywords: ['championship', 'elo', 'belt', 'rank', 'leader'] },
  { id: 'arena', title: 'Championship Arena', domain: 'championship', route: '/championship',
    summary: 'Head-to-head arena for router and portfolio candidates.', keywords: ['arena', 'head to head'] },
  { id: 'forward-validation', title: 'Portfolio Manager v2 Forward Validation', domain: 'validation', route: '/forward-validation',
    summary: 'Observation-locked forward test. Success gate: PF > 1.90 and DD < 3% for 60 consecutive days.',
    keywords: ['forward validation', 'validation', 'streak', '60 days', 'success criteria'] },
  { id: 'champion-trial', title: 'Champion Forward Trial', domain: 'validation', route: '/champion-trial',
    summary: 'Confidence Weighted Allocation (challenger) vs Dynamic Allocation v1 (control). Stress Monitor + Defense tabs.',
    keywords: ['champion trial', 'challenger', 'lead', 'stability', 'defense'] },
  { id: 'allocation-lab', title: 'Specialist Allocation Lab v1', domain: 'allocation', route: '/allocation-lab',
    summary: 'Equal / Regime / Dynamic allocation comparison. Dynamic beat Router v2 by 39% with 2.8% DD.',
    keywords: ['allocation lab', 'dynamic allocation', 'equal weight', 'regime weight'] },
  { id: 'allocation-lab-v2', title: 'Specialist Allocation Lab v2', domain: 'allocation', route: '/allocation-lab-v2',
    summary: 'Confidence Weighted Allocation won at 2.11 PF and is the current research champion.',
    keywords: ['allocation lab v2', 'confidence weighted', 'rolling performance', 'regime purity'] },
  { id: 'production-path', title: 'Allocation Production Path', domain: 'production-path', route: '/allocation-production-path',
    summary: 'Five-stage promotion ladder with gates and a Promotion Forecast card. Currently stage 2 of 5.',
    keywords: ['production path', 'promotion', 'gates', 'forecast', 'probability', 'stage', 'blocking'] },
  { id: 'director', title: 'Portfolio AI Director™', domain: 'director', route: '/portfolio-ai-director',
    summary: 'Flagship CIO layer: executive brief, boardroom, scenario simulator, AI debate, evolution timeline.',
    keywords: ['director', 'cio', 'boardroom', 'scenario', 'debate', 'evolution'] },
  { id: 'mission-control', title: 'Mission Control™', domain: 'mission-control', route: '/mission-control',
    summary: 'Operational home: today\'s five missions, attention alerts, research calendar, end-of-day summary.',
    keywords: ['mission control', 'today', 'missions', 'attention', 'calendar'] },
  { id: 'observation', title: 'Observation Center', domain: 'observation', route: '/observation-center',
    summary: 'Long-term monitor: program status, architecture health, champion health, challenge monitor.',
    keywords: ['observation', 'monitor', 'health', 'champion health'] },
  { id: 'governance', title: 'Governance', domain: 'governance', route: '/governance',
    summary: 'Health Score, five operational states, promotion locks and autonomy policy. All promotions gated.',
    keywords: ['governance', 'lock', 'health score', 'autonomy', 'policy'] },
  { id: 'journal', title: 'Research Journal', domain: 'journal', route: '/journal',
    summary: 'Chronological record of every research build, validation run and verdict.',
    keywords: ['journal', 'log', 'history', 'entries'] },
  { id: 'monthly-report', title: 'Monthly Research Report', domain: 'reports', route: '/monthly-report',
    summary: 'Monthly executive rollup of research output, champion changes and portfolio metrics.',
    keywords: ['monthly report', 'report', 'month'] },
  { id: 'exec-status', title: 'Executive Trading Program Status', domain: 'reports', route: '/executive-program-status',
    summary: 'One-page program verdict. Current status: OBSERVING.',
    keywords: ['program status', 'executive', 'verdict', 'observing'] },
  { id: 'architecture', title: 'Portfolio Architecture Review', domain: 'reports', route: '/portfolio-architecture-review',
    summary: 'Five-layer architecture audit. Verdict: Architecture Mature (composite 89).',
    keywords: ['architecture', 'layers', 'spof', 'redundancy', 'mature'] },
  { id: 'approval-board', title: 'Specialist Approval Board', domain: 'specialists', route: '/specialist-approval-board',
    summary: 'Roster complete: five approved specialists, diversity score high, readiness 94.',
    keywords: ['approval board', 'roster', 'coverage', 'diversity', 'readiness'] },
];

export function searchKnowledge(query: string, limit = 6): KnowledgeNode[] {
  const q = query.toLowerCase();
  const tokens = q.split(/[^a-z0-9.%]+/).filter(t => t.length > 2);
  return KNOWLEDGE
    .map(n => {
      const hay = `${n.title} ${n.summary} ${n.keywords.join(' ')}`.toLowerCase();
      let score = 0;
      n.keywords.forEach(k => { if (q.includes(k)) score += 4; });
      tokens.forEach(t => { if (hay.includes(t)) score += 1; });
      return { n, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.n);
}

// ─── Metric explainability ───────────────────────────────────────────

export const METRICS: MetricExplanation[] = [
  {
    id: 'tr-weight',
    label: 'Trend Rider allocation weight',
    value: '40%',
    calculation:
      'weight = regimeConfidence(Bull/Trend) × strengthScore(PF, rolling PnL, capture, DD) ÷ Σ(all specialist scores), capped at the 40% single-specialist concentration limit.',
    drivers: [
      { label: 'Regime confidence 0.78 (Bull)', detail: 'Trend Rider is the primary specialist in the dominant 90-day regime.', impact: 'positive' },
      { label: 'Strength score 91/100', detail: 'PF 1.92 and the best rolling 30-day PnL of the roster.', impact: 'positive' },
      { label: 'Concentration cap', detail: 'Raw score implied 46%; the governance cap truncated it to 40%.', impact: 'negative' },
    ],
    evidence: ['Specialist Allocation Lab v2 — Confidence Weighted run', 'Specialist Championship — Gold belt, Elo 1742', 'Observation Center — concentration warning active'],
    trend: [{ period: '90d ago', value: 31 }, { period: '60d', value: 34 }, { period: '30d', value: 38 }, { period: 'Today', value: 40 }],
    trendVerdict: 'improving',
    relatedIds: ['tr-v1', 'allocation-lab-v2', 'championship', 'governance'],
  },
  {
    id: 'promotion-probability',
    label: 'Promotion probability',
    value: '58%',
    calculation:
      'probability = 0.30×gatesPassed + 0.20×timeCompleted + 0.15×tradeProgress + 0.15×stability + 0.10×trialLead − penalties(health, concentration).',
    drivers: [
      { label: 'Gates passed 4/7', detail: 'PF, DD, diversity and architecture gates cleared.', impact: 'positive' },
      { label: 'Runtime 23/60 days', detail: 'Time completion is the single largest drag on the score.', impact: 'negative' },
      { label: 'Bull concentration warning', detail: '−6 points penalty for regime concentration in the current book.', impact: 'negative' },
      { label: 'Stability score 82', detail: 'Challenger lead has persisted through the last three weekly windows.', impact: 'positive' },
    ],
    evidence: ['Allocation Production Path — Promotion Forecast card', 'Champion Forward Trial — Stress Monitor (GREEN)', 'Governance — promotion lock active'],
    trend: [{ period: '4w ago', value: 41 }, { period: '3w', value: 49 }, { period: '2w', value: 61 }, { period: 'Today', value: 58 }],
    trendVerdict: 'stable',
    relatedIds: ['production-path', 'champion-trial', 'governance'],
  },
  {
    id: 'portfolio-pf',
    label: 'Portfolio profit factor',
    value: '2.11',
    calculation: 'PF = Σ gross profit ÷ Σ gross loss across all specialist trades, weighted by live allocation.',
    drivers: [
      { label: 'Confidence Weighted Allocation', detail: 'Routing capital to high-confidence regimes lifted PF from 1.86 to 2.11.', impact: 'positive' },
      { label: 'Momentum Scalper gating', detail: 'Disabling MS v2 in chop removed the largest loss cluster.', impact: 'positive' },
      { label: 'Low-Vol Coiler drag', detail: 'LVC v2 contributes small positive PnL but dilutes aggregate PF slightly.', impact: 'neutral' },
    ],
    evidence: ['Specialist Allocation Lab v2', 'Momentum Scalper v2 Activation Audit (81.6% precision)', 'Forward Validation — success gate PF > 1.90'],
    trend: [{ period: '90d ago', value: 1.71 }, { period: '60d', value: 1.86 }, { period: '30d', value: 2.02 }, { period: 'Today', value: 2.11 }],
    trendVerdict: 'improving',
    relatedIds: ['allocation-lab-v2', 'ms-v2', 'forward-validation'],
  },
  {
    id: 'max-drawdown',
    label: 'Max drawdown',
    value: '2.8%',
    calculation: 'DD = max peak-to-trough decline of the simulated equity curve over the observation window.',
    drivers: [
      { label: 'Regime gating', detail: 'Specialists disabled outside their regime cut tail losses.', impact: 'positive' },
      { label: 'Correlated bull exposure', detail: 'TR v1 and MS v2 both fire in bull expansion, clustering losses on reversals.', impact: 'negative' },
    ],
    evidence: ['Forward Validation — DD gate < 3%', 'Portfolio Architecture Review — redundancy analysis', 'Champion Forward Trial — Defense tab'],
    trend: [{ period: '90d ago', value: 3.6 }, { period: '60d', value: 3.2 }, { period: '30d', value: 2.9 }, { period: 'Today', value: 2.8 }],
    trendVerdict: 'improving',
    relatedIds: ['forward-validation', 'architecture', 'champion-trial'],
  },
  {
    id: 'stability-score',
    label: 'Lead stability score',
    value: '82/100',
    calculation: 'stability = 40×leadPersistence + 30×(1 − leadVolatility) + 30×metricDominanceShare, over rolling 7/14/30-day windows.',
    drivers: [
      { label: 'Lead persistence 21/23 days', detail: 'Challenger has led on PnL in all but two days of the trial.', impact: 'positive' },
      { label: 'Metric dominance 4/6', detail: 'Challenger leads PnL, PF, capture and Sharpe-like score.', impact: 'positive' },
      { label: 'Lead erosion in week 3', detail: 'Margin narrowed from 7.4% to 5.8% — mean-reversion watch triggered.', impact: 'negative' },
    ],
    evidence: ['Champion Forward Trial — Stress Monitor', 'Champion Forward Trial — Defense tab (72% win probability by Day 60)'],
    trend: [{ period: 'Week 1', value: 68 }, { period: 'Week 2', value: 79 }, { period: 'Week 3', value: 85 }, { period: 'Today', value: 82 }],
    trendVerdict: 'stable',
    relatedIds: ['champion-trial', 'observation'],
  },
  {
    id: 'readiness',
    label: 'Portfolio readiness score',
    value: '94/100',
    calculation: 'readiness = coverage completeness + diversity score + architecture maturity − open gaps, normalised to 100.',
    drivers: [
      { label: 'Roster complete (5 specialists)', detail: 'All regime buckets covered after Low-Vol Coiler v2 approval.', impact: 'positive' },
      { label: 'Architecture mature (89)', detail: 'Five layers audited with no single point of failure at the allocation layer.', impact: 'positive' },
      { label: 'Capital efficiency', detail: 'Idle capital in low-vol windows remains the only open gap.', impact: 'negative' },
    ],
    evidence: ['Specialist Approval Board', 'Portfolio Architecture Review', 'Observation Center — capital efficiency flag'],
    trend: [{ period: '90d ago', value: 62 }, { period: '60d', value: 74 }, { period: '30d', value: 88 }, { period: 'Today', value: 94 }],
    trendVerdict: 'improving',
    relatedIds: ['approval-board', 'architecture', 'observation'],
  },
];

export function getMetric(id: string) {
  return METRICS.find(m => m.id === id) ?? null;
}

// ─── Executive memory ────────────────────────────────────────────────

export const MEMORY: MemoryEvent[] = [
  { id: 'm1', date: '2026-05-04', category: 'research', title: 'Trade Frequency Opportunity Audit',
    detail: 'Found profitable sub-threshold moves in the XRP 1.8–2.99% band.', outcome: 'Recommended −10% threshold reduction.', relatedIds: ['router-v2'] },
  { id: 'm2', date: '2026-05-11', category: 'improvement', title: 'Router v2.1 forked',
    detail: 'Entry thresholds reduced 10%, all other logic unchanged.', outcome: 'PF 1.71 → 1.78 with DD flat.', relatedIds: ['router-v21'] },
  { id: 'm3', date: '2026-05-26', category: 'research', title: 'Momentum Scalper v1 robustness audit',
    detail: 'Severe decay in sideways and low-vol regimes.', outcome: 'Converted to a regime-gated specialist.', relatedIds: ['ms-v2'] },
  { id: 'm4', date: '2026-06-03', category: 'governance', title: 'MS v2 activation audit — Specialist Approved',
    detail: 'Precision and recall both 81.6% across 90 days.', outcome: 'PF lifted 1.21 → 1.56.', relatedIds: ['ms-v2', 'governance'] },
  { id: 'm5', date: '2026-06-15', category: 'champion', title: 'Dynamic Allocation v1 becomes research champion',
    detail: 'Outperformed Router v2 by 39% with 2.8% drawdown.', outcome: 'Promoted to control in the forward trial.', relatedIds: ['allocation-lab'] },
  { id: 'm6', date: '2026-06-29', category: 'champion', title: 'Confidence Weighted Allocation takes the belt',
    detail: 'Allocation Lab v2 winner at 2.11 PF.', outcome: 'Entered Champion Forward Trial as challenger.', relatedIds: ['allocation-lab-v2', 'champion-trial'] },
  { id: 'm7', date: '2026-07-08', category: 'research', title: 'Low-Vol Coiler v1 verdict: NEEDS TUNING',
    detail: 'Capture failed on XRP and SOL.', outcome: 'Fork authorised.', relatedIds: ['lvc-v2'] },
  { id: 'm8', date: '2026-07-14', category: 'improvement', title: 'Low-Vol Coiler v2 approved',
    detail: 'Capture 58% → 64%, PF 1.74, DD 2.2%.', outcome: 'Fifth specialist confirmed; roster complete.', relatedIds: ['lvc-v2', 'approval-board'] },
  { id: 'm9', date: '2026-07-20', category: 'governance', title: 'Architecture Review — Mature',
    detail: 'Composite 89 across five layers, no SPOF at allocation.', outcome: 'Cleared architecture promotion gate.', relatedIds: ['architecture'] },
  { id: 'm10', date: '2026-07-25', category: 'promotion', title: 'Production Path stage 2 of 5',
    detail: 'Promotion locked pending 60-day runtime and 50-trade minimum.', outcome: 'Promotion probability 58%.', relatedIds: ['production-path', 'governance'] },
  { id: 'm11', date: '2026-07-30', category: 'recommendation', title: 'Concentration warning raised',
    detail: 'Bull-regime exposure concentrated across TR v1 and MS v2.', outcome: 'Recommended monitoring, no allocation change.', relatedIds: ['observation', 'tr-v1'] },
];

// ─── Question engine ─────────────────────────────────────────────────

interface Rule {
  match: RegExp;
  build: () => Omit<AssistantAnswer, 'question' | 'related'> & { relatedIds: string[] };
}

const RULES: Rule[] = [
  {
    match: /trend rider|40\s*%|why is .*40/i,
    build: () => ({
      headline: 'Trend Rider v1 sits at 40% because it is the strongest specialist in the dominant regime — and the cap, not the model, is what stops it going higher.',
      reasoning: [
        'Confidence Weighted Allocation multiplies regime confidence (0.78 Bull) by a strength score built from PF, rolling PnL, capture and drawdown.',
        'Trend Rider scores 91/100 on strength — the best of the five specialists — and PF 1.92 over the 90-day window.',
        'The raw weight came out at 46%; the 40% single-specialist concentration cap truncated it.',
        'This is why the Observation Center is showing a Bull-concentration warning: the book leans on one regime.',
      ],
      metrics: ['weight 40% (capped from 46%)', 'PF 1.92', 'strength 91/100', 'regime confidence 0.78'],
      confidence: 88,
      metricIds: ['tr-weight'],
      relatedIds: ['tr-v1', 'allocation-lab-v2', 'championship', 'observation'],
    }),
  },
  {
    match: /what changed|this week|overnight|since yesterday/i,
    build: () => ({
      headline: 'Three changes this week: the challenger lead narrowed, promotion probability slipped 3 points, and the concentration warning was raised.',
      reasoning: [
        'Champion Forward Trial: challenger lead eroded from 7.4% to 5.8%; stability score moved 85 → 82 (still GREEN).',
        'Promotion probability moved 61% → 58%, driven entirely by the new concentration penalty — no gate was lost.',
        'Low-Vol Coiler v2 completed its second full week of forward data with capture holding at 64%.',
        'No governance state changed. Promotion remains locked pending runtime and trade count.',
      ],
      metrics: ['lead 5.8%', 'stability 82', 'promotion 58%', 'gates 4/7'],
      confidence: 84,
      metricIds: ['stability-score', 'promotion-probability'],
      relatedIds: ['champion-trial', 'production-path', 'observation', 'lvc-v2'],
    }),
  },
  {
    match: /promotion probability|probability fall|probability drop/i,
    build: () => ({
      headline: 'Promotion probability fell from 61% to 58% because of a new concentration penalty, not a lost gate.',
      reasoning: [
        'Gates passed are unchanged at 4/7 — PF, DD, diversity and architecture all still clear.',
        'A −6 point penalty was applied for Bull-regime concentration across Trend Rider v1 and Momentum Scalper v2.',
        'Runtime progress (+2 points) and stability partially offset it, netting −3.',
        'The dominant structural drag remains runtime: 23 of 60 required days.',
      ],
      metrics: ['61% → 58%', 'gates 4/7', 'runtime 23/60d', 'penalty −6'],
      confidence: 86,
      metricIds: ['promotion-probability'],
      relatedIds: ['production-path', 'governance', 'observation'],
    }),
  },
  {
    match: /blocking promotion|what is blocking|blockers/i,
    build: () => ({
      headline: 'Two hard blockers and one soft blocker: runtime, trade count, and regime concentration.',
      reasoning: [
        'Hard: 23 of 60 consecutive qualifying days completed on the Champion Forward Trial.',
        'Hard: 34 of 50 minimum trades recorded across the allocation book.',
        'Soft: Bull-regime concentration warning reduces the forecast but does not gate promotion.',
        'Helping: PF 2.11 (gate 1.90), DD 2.8% (gate 3%), architecture mature, roster complete at readiness 94.',
      ],
      metrics: ['runtime 23/60d', 'trades 34/50', 'PF 2.11 ✓', 'DD 2.8% ✓'],
      confidence: 91,
      metricIds: ['promotion-probability', 'portfolio-pf', 'max-drawdown'],
      relatedIds: ['production-path', 'governance', 'champion-trial'],
    }),
  },
  {
    match: /compare .*last month|versus last month|month ago|vs last month/i,
    build: () => ({
      headline: 'Versus last month the portfolio is materially stronger: PF +0.09, DD −0.1pt, readiness +6, with one new specialist in the book.',
      reasoning: [
        'PF 2.02 → 2.11 as Confidence Weighted Allocation matured through its third trial week.',
        'Max drawdown improved 2.9% → 2.8% despite higher trade frequency from Router v2.1 logic.',
        'Readiness 88 → 94 after Low-Vol Coiler v2 approval closed the low-volatility coverage gap.',
        'Concentration is the one metric that worsened: Bull exposure rose as Trend Rider\'s weight climbed 38% → 40%.',
      ],
      metrics: ['PF 2.02 → 2.11', 'DD 2.9% → 2.8%', 'readiness 88 → 94', 'TR weight 38% → 40%'],
      confidence: 82,
      metricIds: ['portfolio-pf', 'max-drawdown', 'readiness', 'tr-weight'],
      relatedIds: ['allocation-lab-v2', 'lvc-v2', 'monthly-report', 'approval-board'],
    }),
  },
  {
    match: /improved most|which specialist improved|best improvement/i,
    build: () => ({
      headline: 'Low-Vol Coiler v2 improved most — capture +6 points and PF +0.19 versus its v1 fork.',
      reasoning: [
        'LVC v1 → v2: capture 58% → 64%, PF 1.55 → 1.74, DD held at 2.2%, driven by the XRP and SOL fixes.',
        'Runner-up is Momentum Scalper: the v1 → v2 activation gating lifted PF 1.21 → 1.56, the largest absolute PF gain of the programme.',
        'Trend Rider v1 is the strongest specialist but has been flat — its gains came from allocation, not strategy changes.',
      ],
      metrics: ['LVC capture +6pt', 'LVC PF +0.19', 'MS PF +0.35'],
      confidence: 85,
      metricIds: ['portfolio-pf'],
      relatedIds: ['lvc-v2', 'ms-v2', 'championship'],
    }),
  },
  {
    match: /drawdown|dd\b/i,
    build: () => ({
      headline: 'Drawdown is 2.8%, inside the 3% gate, and has improved every month since regime gating went live.',
      reasoning: [
        'Regime gating removed the chop-driven loss clusters that produced the 3.6% peak 90 days ago.',
        'The residual risk is correlated bull exposure: TR v1 and MS v2 fire together on expansion.',
        'The Defense tab models a 72% probability the challenger holds its lead to Day 60 with DD under gate.',
      ],
      metrics: ['DD 2.8%', 'gate 3.0%', '90d peak 3.6%'],
      confidence: 87,
      metricIds: ['max-drawdown'],
      relatedIds: ['forward-validation', 'champion-trial', 'architecture'],
    }),
  },
  {
    match: /champion|who is winning|lead/i,
    build: () => ({
      headline: 'Confidence Weighted Allocation is the research champion and leads the forward trial by 5.8% on PnL at day 23.',
      reasoning: [
        'It dominates 4 of 6 tracked metrics: PnL, PF, capture and the Sharpe-like score.',
        'Control (Dynamic Allocation v1) still leads on drawdown consistency in sideways windows.',
        'Stability score 82 with GREEN status; a mean-reversion watch is open after week-3 lead erosion.',
      ],
      metrics: ['lead 5.8%', 'day 23/60', 'metric dominance 4/6', 'stability 82'],
      confidence: 83,
      metricIds: ['stability-score', 'portfolio-pf'],
      relatedIds: ['champion-trial', 'allocation-lab-v2', 'championship'],
    }),
  },
  {
    match: /governance|locked|autonomy/i,
    build: () => ({
      headline: 'Governance state is Research / Observation Only. Every promotion path is locked by policy.',
      reasoning: [
        'Promotion locks require 60 days runtime and the minimum trade count before any stage advance.',
        'No strategy, allocation or execution change can be applied from any research page by design.',
        'Health Score is within normal bounds; no operational state escalation this week.',
      ],
      metrics: ['state: RESEARCH', 'promotion: LOCKED', 'stage 2/5'],
      confidence: 94,
      metricIds: ['promotion-probability'],
      relatedIds: ['governance', 'production-path', 'exec-status'],
    }),
  },
];

const FALLBACK_METRIC_IDS = ['portfolio-pf', 'promotion-probability'];

export function askAssistant(question: string): AssistantAnswer {
  const q = question.trim();
  const rule = RULES.find(r => r.match.test(q));
  if (rule) {
    const built = rule.build();
    const related = built.relatedIds
      .map(id => KNOWLEDGE.find(k => k.id === id))
      .filter(Boolean) as KnowledgeNode[];
    return { question: q, headline: built.headline, reasoning: built.reasoning, metrics: built.metrics, confidence: built.confidence, metricIds: built.metricIds, related };
  }

  const hits = searchKnowledge(q);
  if (hits.length > 0) {
    return {
      question: q,
      headline: `Closest match across the research ecosystem: ${hits.map(h => h.title).slice(0, 3).join(', ')}.`,
      reasoning: hits.slice(0, 4).map(h => `${h.title} — ${h.summary}`),
      metrics: hits.flatMap(h => Object.entries(h.metrics ?? {}).map(([k, v]) => `${h.title} ${k} ${v}`)).slice(0, 6),
      confidence: 62,
      metricIds: FALLBACK_METRIC_IDS,
      related: hits,
    };
  }

  return {
    question: q,
    headline: 'No indexed research matches that question yet.',
    reasoning: [
      'The assistant answers from indexed research artefacts only — specialists, allocation labs, trials, governance, reports and journals.',
      'Try naming a specialist, a metric, a page, or a time window (e.g. "this week", "last month").',
    ],
    metrics: [],
    confidence: 20,
    metricIds: [],
    related: KNOWLEDGE.slice(0, 4),
  };
}

export const SUGGESTED_QUESTIONS = [
  'Why is Trend Rider 40%?',
  'What changed this week?',
  'Why did promotion probability fall?',
  'Compare today\'s portfolio with last month.',
  'What is blocking promotion?',
  'Which specialist improved most?',
];

// ─── Briefings ───────────────────────────────────────────────────────

export function buildBriefing(kind: 'morning' | 'end-of-day'): Briefing {
  const now = new Date();
  const stamp = now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });

  if (kind === 'morning') {
    return {
      kind,
      generatedAt: stamp,
      headline: 'Programme stable overnight. Challenger still leads; promotion remains locked on runtime.',
      focus: 'Watch the challenger lead margin — a third consecutive week of erosion would trip the mean-reversion warning.',
      sections: [
        { heading: 'Overnight changes', lines: [
          'Champion Forward Trial advanced to day 23 of 60; lead 5.8% (−0.2pt).',
          'No governance state change. No health escalations.',
          'Low-Vol Coiler v2 capture held at 64% on fresh forward data.',
        ] },
        { heading: 'Portfolio position', lines: [
          'PF 2.11 · DD 2.8% · readiness 94 · stability 82 (GREEN).',
          'Allocation: TR v1 40%, VCB v1 22%, MR v1 18%, MS v2 12%, LVC v2 8%.',
        ] },
        { heading: 'Today\'s priorities', lines: [
          'Review the concentration warning on the Observation Center.',
          'Check trade-count progress (34/50) on the Production Path.',
          'Read the Defense tab confidence interval before the weekly report.',
        ] },
      ],
    };
  }

  return {
    kind,
    generatedAt: stamp,
    headline: 'Day closed with no gate changes. One recommendation logged, zero actions required.',
    focus: 'Nothing requires operator action. Promotion probability unchanged at 58%.',
    sections: [
      { heading: 'What happened today', lines: [
        'Trial day logged; challenger retained PnL and PF leadership.',
        'Concentration warning remains open (Bull exposure).',
        'No new validation runs completed.',
      ] },
      { heading: 'Metrics at close', lines: [
        'PF 2.11 · DD 2.8% · win rate 59% · stability 82.',
        'Gates passed 4/7 · promotion probability 58% · stage 2 of 5.',
      ] },
      { heading: 'Carried forward', lines: [
        'Runtime and trade count remain the only hard blockers.',
        'Next scheduled milestone: 30-day trial checkpoint.',
      ] },
    ],
  };
}
