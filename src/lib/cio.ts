/**
 * AI Chief Investment Officer™ (Phase 1)
 * Proactive executive intelligence layer over the CryptoTrader research ecosystem.
 * OBSERVATION ONLY · RESEARCH ONLY · SIMULATION ONLY.
 * Nothing here executes trades, modifies allocations, parameters, promotion or capital.
 */
import { KNOWLEDGE, METRICS, MEMORY, getMetric, searchKnowledge, type KnowledgeNode } from './researchAssistant';

export type Severity = 'high' | 'medium' | 'low' | 'info';

export interface FeedItem {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  reason?: string;
  impact: string;
  confidence: number;
  sources: string[];
  metricIds: string[];
  relatedIds: string[];
  ctaLabel: string;
  ctaRoute: string;
}

export interface ExecAlert {
  id: string;
  severity: Severity;
  title: string;
  evidence: string[];
  confidence: number;
  metricIds: string[];
  investigationQuestion: string;
}

export interface Recommendation {
  id: string;
  recommendation: string;
  reason: string;
  benefit: string;
  confidence: number;
  simulation: { label: string; before: string; after: string; note: string }[];
  evidence: string[];
  relatedIds: string[];
  primaryRoute: string;
  primaryLabel: string;
}

export interface DailyBrief {
  kind: 'morning' | 'end-of-day';
  generatedAt: string;
  summary: string[];
  priorities: string[];
  biggestRisk: { title: string; detail: string; confidence: number };
  biggestOpportunity: { title: string; detail: string; confidence: number };
  promotionOutlook: { probability: number; verdict: string; blocker: string; earliest: string };
  researchHealth: { label: string; value: string; state: 'good' | 'watch' | 'risk' }[];
  executiveSummary: string;
}

export interface Investigation {
  question: string;
  summary: string;
  evidence: string[];
  confidence: number;
  metricIds: string[];
  related: KnowledgeNode[];
  suggested: string[];
  observation: string;
  recommendation: string;
}

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2, info: 3 };

// ─── Section 1 · Executive Intelligence Feed ─────────────────────────

export const FEED: FeedItem[] = [
  {
    id: 'f1', severity: 'high',
    title: 'Bull Trend concentration has exceeded the 35% governance threshold for 18 consecutive sessions.',
    detail: 'Combined Bull-regime exposure (Trend Rider v1 40% + Momentum Scalper v2 12% when gated on) reaches 42% of deployed capital against a 35% ceiling.',
    reason: 'Confidence Weighted Allocation keeps routing capital to the dominant 90-day regime; the single-specialist cap truncates weight but not aggregate regime exposure.',
    impact: 'Promotion Blocker',
    confidence: 96,
    sources: ['Promotion Gates', 'Risk Radar', 'Allocation Studio'],
    metricIds: ['tr-weight', 'promotion-probability'],
    relatedIds: ['production-path', 'allocation-lab-v2', 'governance'],
    ctaLabel: 'Explain', ctaRoute: '/allocation-production-path',
  },
  {
    id: 'f2', severity: 'medium',
    title: 'Capital Efficiency has fallen to 0.71.',
    detail: 'Deployed capital averaged 71% of available capital across the last 14 observation sessions.',
    reason: 'Idle capital increased during disabled specialist periods — regime gating parks capital in low-vol and chop windows before Low-Vol Coiler v2 activates.',
    impact: 'Moderate',
    confidence: 88,
    sources: ['Observation Center', 'Allocation Studio', 'Low-Vol Coiler v2'],
    metricIds: ['readiness'],
    relatedIds: ['observation', 'lvc-v2', 'allocation-lab-v2'],
    ctaLabel: 'Investigate', ctaRoute: '/observation-center',
  },
  {
    id: 'f3', severity: 'low',
    title: 'Champion Trial has reached Day 23. Lead maintained for five consecutive sessions.',
    detail: 'Confidence Weighted Allocation leads Dynamic Allocation v1 by 5.8% on PnL and holds 4 of 6 metric dominance categories. Promotion probability increased to 58%.',
    impact: 'Positive',
    confidence: 91,
    sources: ['Champion Forward Trial', 'Stress Monitor', 'Promotion Forecast'],
    metricIds: ['stability-score', 'promotion-probability'],
    relatedIds: ['champion-trial', 'production-path'],
    ctaLabel: 'View Trial', ctaRoute: '/champion-trial',
  },
  {
    id: 'f4', severity: 'info',
    title: 'Architecture maturity increased to composite 89 — verdict Mature.',
    detail: 'All five layers audited: regime detection, specialist selection, allocation, execution and risk. No single point of failure at the allocation layer.',
    impact: 'Informational',
    confidence: 93,
    sources: ['Portfolio Architecture Review', 'Specialist Approval Board'],
    metricIds: ['readiness'],
    relatedIds: ['architecture', 'approval-board'],
    ctaLabel: 'Open Review', ctaRoute: '/portfolio-architecture-review',
  },
  {
    id: 'f5', severity: 'medium',
    title: 'Lead erosion detected in trial week 3 — margin narrowed from 7.4% to 5.8%.',
    detail: 'Mean-reversion watch is armed. A third consecutive week of erosion would downgrade the stability score below the 75 GREEN floor.',
    reason: 'Control portfolio recovered during two sideways sessions where Mean Reversion v1 carried more weight in the control book.',
    impact: 'Moderate',
    confidence: 84,
    sources: ['Stress Monitor', 'Defense Dashboard'],
    metricIds: ['stability-score'],
    relatedIds: ['champion-trial'],
    ctaLabel: 'Investigate', ctaRoute: '/champion-trial',
  },
  {
    id: 'f6', severity: 'low',
    title: 'Portfolio profit factor improved to 2.11 and cleared the 1.90 forward-validation gate.',
    detail: 'Regime gating on Momentum Scalper v2 removed the largest loss cluster; drawdown simultaneously fell to 2.8%.',
    impact: 'Positive',
    confidence: 92,
    sources: ['Forward Validation', 'Allocation Lab v2'],
    metricIds: ['portfolio-pf', 'max-drawdown'],
    relatedIds: ['forward-validation', 'allocation-lab-v2', 'ms-v2'],
    ctaLabel: 'View Validation', ctaRoute: '/forward-validation',
  },
];

export function sortedFeed(filter: Severity | 'all' = 'all') {
  return FEED
    .filter(f => filter === 'all' || f.severity === filter)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

// ─── Section 4 · Executive Alerts ────────────────────────────────────

export const ALERTS: ExecAlert[] = [
  {
    id: 'a1', severity: 'high', title: 'Promotion blocker detected — Bull Trend concentration 42% vs 35% limit.',
    evidence: [
      'Concentration breach persisted 18 consecutive sessions (Promotion Gates).',
      'Gate 5 of 7 (regime diversification) remains failed on the Production Path.',
      'Promotion probability carries a −6 point concentration penalty.',
    ],
    confidence: 96, metricIds: ['tr-weight', 'promotion-probability'],
    investigationQuestion: 'Why is promotion blocked?',
  },
  {
    id: 'a2', severity: 'medium', title: 'Capital efficiency declining — 0.79 → 0.71 over 14 sessions.',
    evidence: [
      'Idle capital rose during gated low-vol windows (Observation Center).',
      'Low-Vol Coiler v2 activates on only 31% of low-vol sessions.',
      'No PnL loss recorded; the cost is opportunity, not drawdown.',
    ],
    confidence: 88, metricIds: ['readiness'],
    investigationQuestion: 'Why did capital efficiency fall?',
  },
  {
    id: 'a3', severity: 'medium', title: 'Challenger lead erosion — mean-reversion watch armed.',
    evidence: [
      'Lead margin 7.4% → 5.8% across trial week 3 (Stress Monitor).',
      'Stability score eased 85 → 82, still inside the GREEN band.',
      'Defense tab still forecasts 72% probability of challenger win by Day 60.',
    ],
    confidence: 84, metricIds: ['stability-score'],
    investigationQuestion: 'Why did the challenger lead narrow?',
  },
  {
    id: 'a4', severity: 'low', title: 'Champion health improving — PF 2.02 → 2.11, DD 2.9% → 2.8%.',
    evidence: [
      'Forward Validation success streak at 12 of 60 required days.',
      'Momentum Scalper v2 activation precision holding at 81.6%.',
    ],
    confidence: 90, metricIds: ['portfolio-pf', 'max-drawdown'],
    investigationQuestion: 'Explain today\'s portfolio.',
  },
  {
    id: 'a5', severity: 'info', title: 'Architecture maturity increased — composite 89, verdict Mature.',
    evidence: [
      'Five-layer audit closed with no single point of failure at allocation.',
      'Specialist roster complete at five approved specialists; readiness 94.',
    ],
    confidence: 93, metricIds: ['readiness'],
    investigationQuestion: 'Summarise this week\'s research.',
  },
];

// ─── Section 5 · Executive Recommendations ───────────────────────────

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    recommendation: 'Investigate Bull Trend concentration.',
    reason: '42% aggregate Bull-regime exposure exceeds the 35% governance limit and is the largest single drag on promotion probability.',
    benefit: 'Promotion probability may rise from 58% toward the high 60s once the diversification gate clears.',
    confidence: 84,
    simulation: [
      { label: 'Bull exposure', before: '42%', after: '34%', note: 'Simulated cap on aggregate regime exposure, not a live change.' },
      { label: 'Promotion probability', before: '58%', after: '67%', note: 'Concentration penalty removed; runtime drag unchanged.' },
      { label: 'Portfolio PF', before: '2.11', after: '2.04', note: 'Modest PF cost from reallocating away from the strongest specialist.' },
      { label: 'Max drawdown', before: '2.8%', after: '2.5%', note: 'Reduced correlated bull clustering on reversals.' },
    ],
    evidence: ['Promotion Gates — gate 5 of 7 failed', 'Risk Radar — concentration flag active 18 sessions', 'Allocation Studio — TR v1 raw score implied 46%'],
    relatedIds: ['production-path', 'allocation-lab-v2', 'governance'],
    primaryRoute: '/portfolio-ai-director', primaryLabel: 'Open Allocation Studio',
  },
  {
    id: 'r2',
    recommendation: 'Study capital efficiency in gated low-volatility windows.',
    reason: 'Capital efficiency 0.71 with no PnL penalty indicates unused capacity rather than a risk failure.',
    benefit: 'Recovering to 0.85 would lift capital-weighted return without changing risk per trade.',
    confidence: 79,
    simulation: [
      { label: 'Capital efficiency', before: '0.71', after: '0.85', note: 'Simulated wider LVC v2 activation band.' },
      { label: 'Net PnL (90d, simulated)', before: '+18.4%', after: '+21.0%', note: 'Same risk-per-trade assumption.' },
      { label: 'Max drawdown', before: '2.8%', after: '3.0%', note: 'Slightly more capital at work in quiet regimes.' },
    ],
    evidence: ['Observation Center — capital efficiency flag', 'Low-Vol Coiler v2 — 31% low-vol session activation', 'Architecture Review — execution layer notes idle capital'],
    relatedIds: ['observation', 'lvc-v2', 'architecture'],
    primaryRoute: '/low-vol-coiler-v2', primaryLabel: 'Open Low-Vol Coiler v2',
  },
  {
    id: 'r3',
    recommendation: 'Hold the Champion Forward Trial to full term.',
    reason: 'The challenger leads on 4 of 6 metrics but has completed only 23 of 60 days and 34 of 50 trades; the sample is not yet decisive.',
    benefit: 'Preserves statistical validity of the promotion decision and avoids an early-stop bias.',
    confidence: 92,
    simulation: [
      { label: 'Decision confidence at Day 23', before: '—', after: '72%', note: 'Defense tab interval, wide.' },
      { label: 'Decision confidence at Day 60', before: '—', after: '91%', note: 'Projected if current lead persistence holds.' },
    ],
    evidence: ['Champion Forward Trial — Day 23 of 60', 'Production Path — 34 of 50 trades', 'Governance — promotion lock active'],
    relatedIds: ['champion-trial', 'production-path', 'governance'],
    primaryRoute: '/champion-trial', primaryLabel: 'View Trial',
  },
];

// ─── Section 2 · Daily Executive Briefing ────────────────────────────

export function buildDailyBrief(kind: 'morning' | 'end-of-day'): DailyBrief {
  const generatedAt = new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });
  const researchHealth: DailyBrief['researchHealth'] = [
    { label: 'Portfolio health', value: '86 / 100', state: 'good' },
    { label: 'Profit factor', value: '2.11', state: 'good' },
    { label: 'Max drawdown', value: '2.8%', state: 'good' },
    { label: 'Lead stability', value: '82 (GREEN)', state: 'watch' },
    { label: 'Capital efficiency', value: '0.71', state: 'risk' },
    { label: 'Governance breaches', value: 'None', state: 'good' },
  ];

  const promotionOutlook = {
    probability: 58,
    verdict: 'Locked — runtime and trade minimums outstanding, diversification gate failed.',
    blocker: 'Bull Trend concentration at 42% against a 35% ceiling.',
    earliest: 'Estimated earliest promotion review: Day 60 of the trial (≈ 37 sessions away).',
  };

  if (kind === 'morning') {
    return {
      kind, generatedAt,
      summary: [
        'Portfolio Health remains strong at 86.',
        'Champion continues to lead by 5.8%.',
        'Promotion probability remains 58%.',
        'Primary blocker remains Bull Trend concentration.',
        'Capital efficiency continues to recover from its 0.68 low.',
        'No governance breaches detected overnight.',
      ],
      priorities: [
        'Review the Bull Trend concentration breach on the Promotion Gates panel.',
        'Check trade-count progress (34 of 50) on the Allocation Production Path.',
        'Read the Defense tab confidence interval before the weekly report.',
        'Confirm Low-Vol Coiler v2 activation rate on fresh low-vol sessions.',
      ],
      biggestRisk: {
        title: 'Regime concentration blocking promotion',
        detail: '42% aggregate Bull exposure has breached the governance ceiling for 18 consecutive sessions and carries a −6 point promotion penalty.',
        confidence: 96,
      },
      biggestOpportunity: {
        title: 'Idle capital in gated low-volatility windows',
        detail: 'Capital efficiency 0.71 with no associated drawdown cost — the cheapest available improvement in the book.',
        confidence: 79,
      },
      promotionOutlook, researchHealth,
      executiveSummary:
        'The programme opens stable. The challenger allocation retains a 5.8% lead with stability inside the GREEN band, and both the profit factor and drawdown gates are clear. Promotion remains correctly locked: runtime, trade count and regime diversification are all outstanding. The board should treat concentration as the single actionable research question today; nothing observed warrants a change of course.',
    };
  }

  return {
    kind, generatedAt,
    summary: [
      'Session closed with no governance state change.',
      'Challenger lead held at 5.8%; five consecutive sessions in front.',
      'Portfolio PF finished at 2.11, drawdown 2.8%.',
      'Concentration breach extended to 18 sessions.',
      'Capital efficiency ticked from 0.70 to 0.71.',
    ],
    priorities: [
      'Log the concentration streak in the Research Journal.',
      'Queue a simulated diversification study for tomorrow\'s Allocation Studio session.',
      'Re-check stability score after the next weekly window closes.',
    ],
    biggestRisk: {
      title: 'Third consecutive week of lead erosion',
      detail: 'Margin has narrowed from 7.4% to 5.8%. A further erosion week would push stability below the 75 GREEN floor and reduce promotion probability.',
      confidence: 84,
    },
    biggestOpportunity: {
      title: 'Diversification study could unlock the promotion gate',
      detail: 'Simulation suggests capping aggregate Bull exposure at 34% raises promotion probability to roughly 67% at a 0.07 PF cost.',
      confidence: 84,
    },
    promotionOutlook, researchHealth,
    executiveSummary:
      'A quiet close. Performance metrics remain inside all forward-validation gates and the challenger keeps its lead, though the erosion trend deserves a further week of observation before it is called a pattern. No promotion action is available or appropriate; the correct next step is research into regime diversification, run in simulation only.',
  };
}

// ─── Section 3 · AI Investigation Mode ───────────────────────────────

interface Rule {
  match: RegExp;
  build: () => Omit<Investigation, 'question' | 'related'> & { relatedIds: string[] };
}

const RULES: Rule[] = [
  {
    match: /promotion.*(block|lock|stuck|denied)|why.*promotion/i,
    build: () => ({
      summary: 'Promotion is blocked by three independent gates: regime diversification (failed), runtime (23 of 60 days) and trade count (34 of 50). Concentration is the only one addressable by research today.',
      evidence: [
        'Promotion Gates: 4 of 7 passed — PF, drawdown, diversity of specialists and architecture maturity.',
        'Gate 5 (regime diversification) failed: aggregate Bull exposure 42% vs a 35% ceiling, breached 18 consecutive sessions.',
        'Promotion Forecast: probability 58%, carrying a −6 point concentration penalty and the largest drag from incomplete runtime.',
        'Governance: promotion lock is active and cannot be bypassed by this system.',
      ],
      confidence: 94,
      metricIds: ['promotion-probability', 'tr-weight'],
      relatedIds: ['production-path', 'governance', 'allocation-lab-v2'],
      suggested: ['Why is Trend Rider 40%?', 'What changed today?', 'Compare last month.'],
      observation: 'Three gates are open; two of them are purely time-based and will clear on schedule if performance holds.',
      recommendation: 'Run a simulated diversification study capping aggregate Bull exposure at 34% and review the PF trade-off before proposing anything to the board.',
    }),
  },
  {
    match: /(pf|profit factor).*(fall|fell|drop|down|declin)|why.*pf/i,
    build: () => ({
      summary: 'Portfolio profit factor has not fallen. It rose from 1.86 to 2.11 over 60 days. The metric that eased is the challenger lead margin, from 7.4% to 5.8%.',
      evidence: [
        'PF trend: 1.71 (90d) → 1.86 (60d) → 2.02 (30d) → 2.11 today.',
        'Momentum Scalper v2 regime gating removed the largest loss cluster (activation precision 81.6%).',
        'Low-Vol Coiler v2 adds positive PnL but slightly dilutes aggregate PF — a mix effect, not a degradation.',
        'The only downward metric in the book is lead margin, tracked by the Stress Monitor.',
      ],
      confidence: 90,
      metricIds: ['portfolio-pf', 'stability-score'],
      relatedIds: ['allocation-lab-v2', 'ms-v2', 'champion-trial'],
      suggested: ['Why did the challenger lead narrow?', 'Explain today\'s portfolio.'],
      observation: 'PF is improving; the perceived decline is a lead-margin effect in the trial, not a portfolio-level one.',
      recommendation: 'Monitor the lead margin for one further weekly window before treating erosion as a pattern.',
    }),
  },
  {
    match: /trend rider|tr v1|40\s*%/i,
    build: () => ({
      summary: 'Trend Rider v1 sits at 40% because Confidence Weighted Allocation scored it highest on both regime confidence and strength, and the governance cap truncated it there.',
      evidence: [
        'Regime confidence 0.78 for Bull/Trend, the dominant regime across the 90-day window.',
        'Strength score 91 of 100 — PF 1.92 and the best rolling 30-day PnL on the roster.',
        'Raw score implied 46%; the single-specialist concentration cap truncated the weight to 40%.',
        'Specialist Championship: Gold belt, Elo 1742.',
      ],
      confidence: 93,
      metricIds: ['tr-weight'],
      relatedIds: ['tr-v1', 'allocation-lab-v2', 'championship', 'governance'],
      suggested: ['Why is promotion blocked?', 'Explain today\'s portfolio.'],
      observation: 'The weight is the cap, not the model output — the allocator wanted more.',
      recommendation: 'Treat aggregate Bull exposure, not the single-specialist weight, as the governance question worth researching.',
    }),
  },
  {
    match: /explain.*(today|portfolio)|portfolio.*today/i,
    build: () => ({
      summary: 'A five-specialist book on Confidence Weighted Allocation: PF 2.11, drawdown 2.8%, readiness 94, health 86. Challenger leads the trial by 5.8% at Day 23 of 60.',
      evidence: [
        'Allocation: TR v1 40%, VCB v1 22%, MR v1 18%, MS v2 12%, LVC v2 8%.',
        'Forward Validation gates: PF > 1.90 cleared, DD < 3% cleared, 12 of 60 consecutive success days.',
        'Open warnings: Bull concentration 42%, capital efficiency 0.71.',
        'No governance breaches; promotion lock active.',
      ],
      confidence: 92,
      metricIds: ['portfolio-pf', 'max-drawdown', 'readiness'],
      relatedIds: ['allocation-lab-v2', 'forward-validation', 'observation'],
      suggested: ['Why is promotion blocked?', 'Summarise this week\'s research.'],
      observation: 'Performance is inside every gate; the open items are structural, not performance-related.',
      recommendation: 'No action. Continue observation and let the trial run to term.',
    }),
  },
  {
    match: /(this )?week|weekly/i,
    build: () => ({
      summary: 'This week: architecture confirmed Mature, roster confirmed complete at five specialists, concentration breach extended, and the challenger held its lead through five sessions.',
      evidence: [
        'Portfolio Architecture Review — composite 89, verdict Mature, no SPOF at allocation.',
        'Specialist Approval Board — readiness 94, roster declared complete.',
        'Champion Forward Trial — Day 23, lead 5.8%, stability 82.',
        'Risk Radar — Bull concentration breach now 18 consecutive sessions.',
      ],
      confidence: 89,
      metricIds: ['readiness', 'stability-score'],
      relatedIds: ['architecture', 'approval-board', 'champion-trial'],
      suggested: ['Compare last month.', 'What changed today?'],
      observation: 'Structural work closed out; performance work continues in the trial.',
      recommendation: 'Shift research attention from specialist discovery to allocation diversification.',
    }),
  },
  {
    match: /last month|compare.*month|month/i,
    build: () => ({
      summary: 'Versus one month ago: PF 2.02 → 2.11, drawdown 2.9% → 2.8%, readiness 88 → 94, promotion probability 49% → 58%. Capital efficiency is the only metric that deteriorated.',
      evidence: [
        'Low-Vol Coiler v2 approved (capture 58% → 64%), completing the roster.',
        'Confidence Weighted Allocation took the research champion belt at 2.11 PF.',
        'Architecture composite rose from 81 to 89.',
        'Capital efficiency fell from 0.79 to 0.71 as regime gating tightened.',
      ],
      confidence: 87,
      metricIds: ['portfolio-pf', 'promotion-probability', 'readiness'],
      relatedIds: ['lvc-v2', 'allocation-lab-v2', 'architecture', 'observation'],
      suggested: ['Why did capital efficiency fall?', 'What changed today?'],
      observation: 'Month-over-month the programme improved on every gate metric except capital utilisation.',
      recommendation: 'Frame next month\'s research agenda around utilisation and diversification.',
    }),
  },
  {
    match: /capital efficiency|idle capital|utilisation|utilization/i,
    build: () => ({
      summary: 'Capital efficiency fell from 0.79 to 0.71 because regime gating parks capital when specialists are disabled, and Low-Vol Coiler v2 activates on only 31% of low-vol sessions.',
      evidence: [
        'Observation Center — capital efficiency is the only non-green health metric.',
        'Low-Vol Coiler v2 activation rate 31% of qualifying low-vol sessions.',
        'No associated drawdown or PnL loss — the cost is opportunity.',
        'Architecture Review flags idle capital at the execution layer as the sole open gap.',
      ],
      confidence: 88,
      metricIds: ['readiness'],
      relatedIds: ['observation', 'lvc-v2', 'architecture'],
      suggested: ['Explain today\'s portfolio.', 'Summarise this week\'s research.'],
      observation: 'This is an efficiency gap, not a risk event.',
      recommendation: 'Simulate a wider LVC v2 activation band and measure the drawdown cost before recommending anything.',
    }),
  },
  {
    match: /lead.*(narrow|erod|fall|drop)|challenger.*lead|stability/i,
    build: () => ({
      summary: 'The challenger lead narrowed from 7.4% to 5.8% during trial week 3, driven by two sideways sessions where the control book\'s Mean Reversion weighting performed better.',
      evidence: [
        'Stress Monitor — rolling 7/14/30-day windows all still favour the challenger.',
        'Stability score eased 85 → 82, inside the GREEN band (floor 75).',
        'Defense tab — 72% probability the challenger is still ahead at Day 60.',
        'Mean-reversion warning armed, not triggered.',
      ],
      confidence: 86,
      metricIds: ['stability-score'],
      relatedIds: ['champion-trial'],
      suggested: ['Why is promotion blocked?', 'What changed today?'],
      observation: 'Erosion is real but within the historical noise band of the trial.',
      recommendation: 'Observe one further weekly window before escalating.',
    }),
  },
  {
    match: /changed today|today.*change|what.?s new/i,
    build: () => ({
      summary: 'Today: concentration streak extended to 18 sessions, capital efficiency ticked up 0.70 → 0.71, trial advanced to Day 23 with the lead intact. No governance state change.',
      evidence: [
        'Risk Radar — concentration breach day 18.',
        'Observation Center — capital efficiency +0.01.',
        'Champion Forward Trial — Day 23 of 60, lead 5.8%, five sessions in front.',
        'Governance — state unchanged, promotion lock active.',
      ],
      confidence: 90,
      metricIds: ['promotion-probability', 'stability-score'],
      relatedIds: ['observation', 'champion-trial', 'governance'],
      suggested: ['Why is promotion blocked?', 'Explain today\'s portfolio.'],
      observation: 'A low-variance session with no new signals.',
      recommendation: 'No action required today.',
    }),
  },
];

export const INVESTIGATION_PROMPTS = [
  'Why is promotion blocked?',
  'Why did PF fall?',
  'Why is Trend Rider 40%?',
  'Explain today\'s portfolio.',
  'Summarise this week\'s research.',
  'Compare last month.',
  'What changed today?',
];

export function investigate(question: string): Investigation {
  const q = question.trim();
  const rule = RULES.find(r => r.match.test(q));
  if (rule) {
    const b = rule.build();
    return {
      question: q,
      summary: b.summary,
      evidence: b.evidence,
      confidence: b.confidence,
      metricIds: b.metricIds,
      related: b.relatedIds.map(id => KNOWLEDGE.find(k => k.id === id)).filter(Boolean) as KnowledgeNode[],
      suggested: b.suggested,
      observation: b.observation,
      recommendation: b.recommendation,
    };
  }

  const hits = searchKnowledge(q, 5);
  if (hits.length > 0) {
    return {
      question: q,
      summary: `I can only answer from indexed research. The closest supported material is: ${hits.slice(0, 3).map(h => h.title).join(', ')}.`,
      evidence: hits.slice(0, 4).map(h => `${h.title} — ${h.summary}`),
      confidence: 58,
      metricIds: ['portfolio-pf'],
      related: hits,
      suggested: INVESTIGATION_PROMPTS.slice(0, 4),
      observation: 'The question is partially matched; treat the answer as directional rather than evidenced.',
      recommendation: 'Rephrase naming a specialist, metric, page or time window for an evidenced answer.',
    };
  }

  return {
    question: q,
    summary: 'No indexed evidence supports an answer to that question. I will not speculate.',
    evidence: ['The knowledge index covers specialists, allocation labs, trials, governance, production path, reports and journals only.'],
    confidence: 15,
    metricIds: [],
    related: KNOWLEDGE.slice(0, 4),
    suggested: INVESTIGATION_PROMPTS.slice(0, 4),
    observation: 'Unsupported question.',
    recommendation: 'Ask again naming a specialist, metric, page or time window.',
  };
}

// ─── Section 7 · Executive memory (reuses the research memory ledger) ─

export function memoryTimeline() {
  return [...MEMORY].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export { METRICS, getMetric, KNOWLEDGE };
