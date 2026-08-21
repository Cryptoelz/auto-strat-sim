/**
 * Specialist Independence Score™ — institutional diversity analysis.
 *
 * READ-ONLY research module. It observes the shadow-mode specialist ledger and
 * the live attribution funnels and measures how independently the specialists
 * think. It never mutates trading, risk, allocation, governance or execution.
 */
import { SpecialistId } from './types';
import { SPECIALIST_IDS, LedgerEntry, StatsMap } from './stats';
import { FunnelMap } from './attribution';

export const SPECIALIST_NAMES: Record<SpecialistId, string> = {
  trend: 'Trend Specialist',
  momentum: 'Momentum Specialist',
  mean_reversion: 'Mean Reversion Specialist',
  volatility: 'Volatility Specialist',
  breakout: 'Breakout Specialist',
};

export interface PairMetrics {
  a: SpecialistId;
  b: SpecialistId;
  rounds: number;             // rounds where both were observed
  correlation: number;        // signal correlation %, 0-100
  agreementRate: number;      // % of rounds with identical signal
  sharedTrades: number;       // both actionable, same direction
  differentTrades: number;    // both actionable, different direction
  uniqueIdeas: number;        // exactly one of the pair was actionable
  conflictRate: number;       // % of rounds in direct opposition
}

export interface SpecialistIndependence {
  id: SpecialistId;
  name: string;
  independenceScore: number;   // 0-100
  seen: number;
  proposed: number;
  approved: number;
  executed: number;
  uniqueOpportunities: number;
  sharedOpportunities: number;
  duplicatedOpportunities: number;
  uniquePct: number;
  sharedPct: number;
  duplicatedPct: number;
  contribution: number;        // % of total institutional ideas
  participationRate: number;   // proposed / seen %
  avgConfidence: number;
  institutionRating: 'Excellent' | 'Strong' | 'Adequate' | 'Monitor' | 'Investigate';
  personality: string[];
  discoveryIndex: number;      // unique profitable-quality ideas found only here
}

export interface OverlapFinding {
  a: SpecialistId;
  b: SpecialistId;
  similarity: number;
  severity: 'critical' | 'warning' | 'healthy';
  reason: string;
  evidence: string[];
}

export interface Recommendation {
  title: string;
  detail: string;
  evidence: string;
  priority: 'high' | 'medium' | 'low';
}

export interface OracleLine {
  question: string;
  answer: string;
  evidence: string;
}

export interface IndependenceReport {
  generatedAt: number;
  rounds: number;
  institutionIndependence: number;
  diversityScore: number;
  signalDiversity: number;
  agreementRate: number;
  uniqueOpportunities: number;
  correlationRisk: number;
  researchHealth: 'Healthy' | 'Watch' | 'At Risk';
  recommendation: string;
  specialists: SpecialistIndependence[];
  pairs: PairMetrics[];
  overlaps: OverlapFinding[];
  recommendations: Recommendation[];
  oracle: OracleLine[];
  summary: string;
}

const pct = (n: number, d: number) => (d > 0 ? Number(((n / d) * 100).toFixed(1)) : 0);
const clamp = (n: number) => Math.max(0, Math.min(100, Number(n.toFixed(1))));

type Round = { key: string; signals: Partial<Record<SpecialistId, { sig: string; conf: number; ev: number }>> };

function buildRounds(ledger: LedgerEntry[]): Round[] {
  return ledger.map((e) => {
    const signals: Round['signals'] = {};
    e.proposals.forEach((p) => {
      signals[p.specialistId] = { sig: p.signal, conf: p.confidence, ev: p.expectedValue };
    });
    return { key: `${e.asset}-${e.timestamp}`, signals };
  });
}

function pairMetrics(rounds: Round[], a: SpecialistId, b: SpecialistId): PairMetrics {
  let both = 0, agree = 0, shared = 0, different = 0, unique = 0, conflict = 0;
  rounds.forEach((r) => {
    const sa = r.signals[a], sb = r.signals[b];
    if (!sa || !sb) return;
    both += 1;
    if (sa.sig === sb.sig) agree += 1;
    const aAct = sa.sig !== 'WAIT', bAct = sb.sig !== 'WAIT';
    if (aAct && bAct) {
      if (sa.sig === sb.sig) shared += 1;
      else { different += 1; conflict += 1; }
    } else if (aAct !== bAct) unique += 1;
  });
  const agreementRate = pct(agree, both);
  // Correlation weights identical actionable calls far above shared inaction.
  const actionable = shared + different + unique;
  const actionOverlap = actionable ? pct(shared, actionable) : 0;
  const correlation = clamp(agreementRate * 0.45 + actionOverlap * 0.55);
  return {
    a, b, rounds: both,
    correlation,
    agreementRate,
    sharedTrades: shared,
    differentTrades: different,
    uniqueIdeas: unique,
    conflictRate: pct(conflict, both),
  };
}

function personalityOf(
  s: { participationRate: number; avgConfidence: number; uniquePct: number; buyBias: number; avgHold: number },
): string[] {
  const traits: string[] = [];
  traits.push(s.participationRate >= 45 ? 'High frequency' : s.participationRate >= 20 ? 'Selective' : s.participationRate > 0 ? 'Patient' : 'Dormant');
  traits.push(s.avgConfidence >= 65 ? 'High conviction' : s.avgConfidence >= 45 ? 'Balanced conviction' : 'Cautious');
  traits.push(s.uniquePct >= 55 ? 'Original thinker' : s.uniquePct >= 30 ? 'Partly differentiated' : 'Consensus-aligned');
  if (s.buyBias >= 70) traits.push('Long-biased');
  else if (s.buyBias <= 30 && s.buyBias >= 0) traits.push('Short-biased');
  else traits.push('Two-sided');
  if (s.participationRate < 15 && s.avgConfidence >= 60) traits.push('Waits for confirmation');
  if (s.participationRate >= 40 && s.avgConfidence < 55) traits.push('Early, aggressive entries');
  return traits;
}

export function analyseIndependence(
  ledger: LedgerEntry[],
  funnels: FunnelMap,
  stats: StatsMap,
): IndependenceReport {
  const rounds = buildRounds(ledger);
  const roundCount = rounds.length;

  // ── Pairwise matrix ──
  const pairs: PairMetrics[] = [];
  for (let i = 0; i < SPECIALIST_IDS.length; i++) {
    for (let j = i + 1; j < SPECIALIST_IDS.length; j++) {
      pairs.push(pairMetrics(rounds, SPECIALIST_IDS[i], SPECIALIST_IDS[j]));
    }
  }

  // ── Per-specialist diversity ──
  const totalActionable = rounds.reduce(
    (n, r) => n + SPECIALIST_IDS.filter((id) => r.signals[id] && r.signals[id]!.sig !== 'WAIT').length, 0);

  const specialists: SpecialistIndependence[] = SPECIALIST_IDS.map((id) => {
    let acted = 0, uniqueOpp = 0, sharedOpp = 0, duplicated = 0, confSum = 0, buys = 0, discovery = 0;
    rounds.forEach((r) => {
      const me = r.signals[id];
      if (!me || me.sig === 'WAIT') return;
      acted += 1;
      confSum += me.conf;
      if (me.sig === 'BUY') buys += 1;
      const peers = SPECIALIST_IDS.filter((o) => o !== id && r.signals[o] && r.signals[o]!.sig !== 'WAIT');
      const same = peers.filter((o) => r.signals[o]!.sig === me.sig);
      if (peers.length === 0) {
        uniqueOpp += 1;
        if (me.ev > 0 && me.conf >= 55) discovery += 1;
      } else if (same.length === 0) sharedOpp += 1;
      else duplicated += 1;
    });

    const f = funnels[id];
    const seen = f?.seen ?? rounds.filter((r) => r.signals[id]).length;
    const proposed = f?.proposed ?? acted;
    const participationRate = pct(acted, roundCount);
    const avgConfidence = acted ? Number((confSum / acted).toFixed(1)) : 0;
    const uniquePct = pct(uniqueOpp, acted);
    const sharedPct = pct(sharedOpp, acted);
    const duplicatedPct = pct(duplicated, acted);

    // Independence = originality of ideas, discounted by peer correlation.
    const myPairs = pairs.filter((p) => p.a === id || p.b === id);
    const avgCorr = myPairs.length ? myPairs.reduce((s, p) => s + p.correlation, 0) / myPairs.length : 0;
    const raw = acted === 0
      ? Math.max(0, 40 - avgCorr * 0.3)
      : uniquePct * 0.5 + sharedPct * 0.3 + (100 - avgCorr) * 0.2;
    const independenceScore = clamp(raw);

    const rating: SpecialistIndependence['institutionRating'] =
      acted === 0 ? 'Investigate'
      : independenceScore >= 75 ? 'Excellent'
      : independenceScore >= 60 ? 'Strong'
      : independenceScore >= 45 ? 'Adequate'
      : independenceScore >= 30 ? 'Monitor' : 'Investigate';

    return {
      id,
      name: SPECIALIST_NAMES[id],
      independenceScore,
      seen,
      proposed,
      approved: f?.approved ?? 0,
      executed: f?.executed ?? 0,
      uniqueOpportunities: uniqueOpp,
      sharedOpportunities: sharedOpp,
      duplicatedOpportunities: duplicated,
      uniquePct, sharedPct, duplicatedPct,
      contribution: pct(acted, totalActionable),
      participationRate,
      avgConfidence,
      institutionRating: rating,
      personality: personalityOf({
        participationRate,
        avgConfidence,
        uniquePct,
        buyBias: acted ? pct(buys, acted) : -1,
        avgHold: 0,
      }),
      discoveryIndex: discovery,
    };
  });

  const avgCorrelation = pairs.length ? pairs.reduce((s, p) => s + p.correlation, 0) / pairs.length : 0;
  const agreementRate = pairs.length ? pairs.reduce((s, p) => s + p.agreementRate, 0) / pairs.length : 0;
  const diversityScore = clamp(
    specialists.reduce((s, x) => s + x.independenceScore, 0) / (specialists.length || 1));
  const signalDiversity = clamp(100 - avgCorrelation);
  const institutionIndependence = clamp(diversityScore * 0.55 + signalDiversity * 0.45);
  const correlationRisk = clamp(avgCorrelation);
  const uniqueOpportunities = specialists.reduce((s, x) => s + x.uniqueOpportunities, 0);

  const researchHealth: IndependenceReport['researchHealth'] =
    roundCount < 10 ? 'Watch'
    : institutionIndependence >= 70 ? 'Healthy'
    : institutionIndependence >= 50 ? 'Watch' : 'At Risk';

  // ── Overlaps ──
  const overlaps: OverlapFinding[] = pairs
    .filter((p) => p.rounds > 0)
    .sort((x, y) => y.correlation - x.correlation)
    .slice(0, 5)
    .map((p) => ({
      a: p.a, b: p.b,
      similarity: p.correlation,
      severity: p.correlation >= 85 ? 'critical' : p.correlation >= 65 ? 'warning' : 'healthy',
      reason: p.correlation >= 85
        ? 'Behaviour is nearly identical — possible duplicated logic or shared indicator base.'
        : p.correlation >= 65
          ? 'Meaningful overlap. Ideas frequently coincide in direction and timing.'
          : 'Distinct behaviour. The pair contributes separate ideas.',
      evidence: [
        `Signal correlation ${p.correlation}% across ${p.rounds} observed rounds`,
        `Agreement rate ${p.agreementRate}% · conflict rate ${p.conflictRate}%`,
        `Trade overlap: ${p.sharedTrades} shared, ${p.differentTrades} opposing, ${p.uniqueIdeas} solo ideas`,
      ],
    }));

  // ── Recommendations ──
  const recommendations: Recommendation[] = [];
  overlaps.filter((o) => o.severity !== 'healthy').forEach((o) => {
    recommendations.push({
      title: `${SPECIALIST_NAMES[o.a]} and ${SPECIALIST_NAMES[o.b]} are highly correlated`,
      detail: 'Research whether indicator diversity should increase, or whether one engine should specialise into a different regime.',
      evidence: o.evidence[0],
      priority: o.severity === 'critical' ? 'high' : 'medium',
    });
  });
  const best = [...specialists].sort((a, b) => b.uniqueOpportunities - a.uniqueOpportunities)[0];
  if (best && best.uniqueOpportunities > 0) {
    recommendations.push({
      title: `${best.name} contributes the highest number of unique opportunities`,
      detail: 'Continue development. This engine is the strongest source of institutional diversity.',
      evidence: `${best.uniqueOpportunities} solo ideas (${best.uniquePct}% of its proposals) across ${roundCount} rounds`,
      priority: 'low',
    });
  }
  specialists.filter((s) => s.participationRate < 5).forEach((s) => {
    recommendations.push({
      title: `${s.name} has very low participation`,
      detail: 'Investigate activation logic — the engine rarely emits an actionable proposal.',
      evidence: `Participation ${s.participationRate}% (${s.proposed} proposals from ${s.seen} observations)`,
      priority: 'medium',
    });
  });
  if (roundCount < 10) {
    recommendations.push({
      title: 'Insufficient observation sample',
      detail: 'Run a paper trading session so specialists analyse live candles. Diversity metrics stabilise after ~50 rounds.',
      evidence: `${roundCount} comparison rounds recorded`,
      priority: 'high',
    });
  }

  // ── Oracle ──
  const ranked = [...specialists].sort((a, b) => b.independenceScore - a.independenceScore);
  const most = ranked[0], least = ranked[ranked.length - 1];
  const topPair = overlaps[0];
  const oracle: OracleLine[] = [
    {
      question: 'Which specialist contributes the most independent thinking?',
      answer: most ? `${most.name}, with an independence score of ${most.independenceScore}%.` : 'No data yet.',
      evidence: most ? `${most.uniqueOpportunities} unique ideas, ${most.uniquePct}% originality, contribution ${most.contribution}%` : '—',
    },
    {
      question: 'Which contributes the least?',
      answer: least ? `${least.name}, at ${least.independenceScore}%.` : 'No data yet.',
      evidence: least ? `${least.duplicatedPct}% of its proposals duplicated a peer; participation ${least.participationRate}%` : '—',
    },
    {
      question: 'Which specialists strengthen the institution?',
      answer: ranked.filter((s) => s.independenceScore >= 60).map((s) => s.name).join(', ') || 'None currently clear the 60% independence bar.',
      evidence: `Institution independence ${institutionIndependence}% · signal diversity ${signalDiversity}%`,
    },
    {
      question: 'Which specialists duplicate work?',
      answer: topPair && topPair.severity !== 'healthy'
        ? `${SPECIALIST_NAMES[topPair.a]} and ${SPECIALIST_NAMES[topPair.b]} at ${topPair.similarity}% similarity.`
        : 'No duplication above the institutional warning threshold.',
      evidence: topPair ? topPair.evidence.join(' · ') : '—',
    },
  ];

  const recommendation =
    researchHealth === 'Healthy'
      ? 'Maintain current specialist architecture. Continue observation.'
      : researchHealth === 'Watch'
        ? 'Extend observation window and monitor the flagged correlated pairs.'
        : 'Escalate to research board — specialist diversity is below institutional standard.';

  const summary = roundCount === 0
    ? 'No comparison rounds recorded yet. Run a paper trading session so every specialist analyses live candle closes; independence metrics will populate automatically.'
    : `ATLAS currently demonstrates an Institutional Independence Score of ${institutionIndependence}%. `
      + `${most?.name ?? '—'} and ${ranked[1]?.name ?? '—'} provide the greatest diversity. `
      + (topPair && topPair.severity !== 'healthy'
        ? `${SPECIALIST_NAMES[topPair.a]} and ${SPECIALIST_NAMES[topPair.b]} show ${topPair.similarity}% overlap. `
        : 'No material overlap detected between any pair. ')
      + `${overlaps.some((o) => o.severity === 'critical') ? 'Critical duplication detected.' : 'No critical duplication detected.'} `
      + `Institutional specialist diversity is ${researchHealth.toLowerCase() === 'healthy' ? 'healthy' : researchHealth === 'Watch' ? 'under observation' : 'at risk'}.`;

  return {
    generatedAt: Date.now(),
    rounds: roundCount,
    institutionIndependence,
    diversityScore,
    signalDiversity,
    agreementRate: Number(agreementRate.toFixed(1)),
    uniqueOpportunities,
    correlationRisk,
    researchHealth,
    recommendation,
    specialists,
    pairs,
    overlaps,
    recommendations,
    oracle,
    summary,
  };
}

/* ── Knowledge Graph persistence (read-only research artefact) ── */
const REPORT_KEY = 'atlas_independence_reports_v1';

export interface StoredIndependenceReport {
  id: string;
  generatedAt: number;
  rounds: number;
  institutionIndependence: number;
  diversityScore: number;
  correlationRisk: number;
  researchHealth: string;
  summary: string;
}

export function loadIndependenceReports(): StoredIndependenceReport[] {
  try {
    const raw = localStorage.getItem(REPORT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function storeIndependenceReport(r: IndependenceReport): StoredIndependenceReport[] {
  const entry: StoredIndependenceReport = {
    id: `IND-${r.generatedAt}`,
    generatedAt: r.generatedAt,
    rounds: r.rounds,
    institutionIndependence: r.institutionIndependence,
    diversityScore: r.diversityScore,
    correlationRisk: r.correlationRisk,
    researchHealth: r.researchHealth,
    summary: r.summary,
  };
  const next = [entry, ...loadIndependenceReports()].slice(0, 30);
  try { localStorage.setItem(REPORT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export const KNOWLEDGE_GRAPH_LINKS = [
  { label: 'Research', url: '/research' },
  { label: 'Trade Review Centre™', url: '/trade-review' },
  { label: 'Opportunity Analysis', url: '/opportunity-analysis' },
  { label: 'Performance Attribution™', url: '/performance-attribution' },
  { label: 'Institutional Memory™', url: '/institution/memory' },
  { label: 'Audit Vault™', url: '/audit-vault' },
  { label: 'Executive Intelligence™', url: '/executive-intelligence' },
];
