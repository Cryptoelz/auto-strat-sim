/**
 * AI Command Center Engine
 * Rule-based plain-English intelligence layer that synthesizes archived
 * sessions, per-trade context, regimes and governance into:
 *  - operator Q&A
 *  - system confidence score
 *  - opportunities
 *  - recommendations (with why/supporting metrics)
 *
 * All output is deterministic and derived from local archived data — no
 * external model calls. This keeps explainability auditable.
 */
import { ArchivedSession } from '@/lib/sessionHistory';
import {
  computeAssetMetrics,
  computeRegimeMetrics,
  computeBlockedTradeMetrics,
  archivedContextCoverage,
  computeEquityCurve,
  AssetMetrics,
  RegimeMetrics,
} from '@/lib/analyticsHub';
import {
  strongestRegimes,
  weakestForDirection,
  detectFailurePatterns,
  dangerousConditions,
  volatilityAssetMatrix,
  convictionRangeMetrics,
  continuationVsCrossoverByRegime,
} from '@/lib/contextIntelligence';
import { weekWindowFor } from '@/lib/weeklyReview';

// ─── Confidence ────────────────────────────────────────────────────

export interface ConfidenceFactor {
  key: string;
  label: string;
  score: number;       // 0–100
  weight: number;      // 0–1
  detail: string;
}

export interface ConfidenceReport {
  overall: number;     // 0–100
  band: 'strong' | 'healthy' | 'cautious' | 'weak';
  factors: ConfidenceFactor[];
  summary: string;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function band(score: number): ConfidenceReport['band'] {
  if (score >= 80) return 'strong';
  if (score >= 60) return 'healthy';
  if (score >= 40) return 'cautious';
  return 'weak';
}

export function computeConfidence(sessions: ArchivedSession[]): ConfidenceReport {
  const trades = sessions.flatMap(s => s.trades);
  const totalTrades = trades.length;

  // 1. Strategy health: PnL + win rate + profit factor
  const totalPnl = sessions.reduce((s, x) => s + x.totalPnl, 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 50;
  const gross = trades.reduce((acc, t) => {
    if (t.pnl > 0) acc.profit += t.pnl;
    else acc.loss += Math.abs(t.pnl);
    return acc;
  }, { profit: 0, loss: 0 });
  const pf = gross.loss > 0 ? gross.profit / gross.loss : gross.profit > 0 ? 3 : 1;
  const strategyScore = clamp(
    (winRate - 40) * 1.5 + (pf - 1) * 25 + (totalPnl > 0 ? 15 : -10) + 50,
  );

  // 2. Market alignment: how well winning regimes dominate
  const regimes = computeRegimeMetrics(sessions);
  const regimePnls = regimes.map(r => r.pnl);
  const positiveRegimes = regimePnls.filter(p => p > 0).length;
  const marketAlign = clamp(40 + positiveRegimes * 20);

  // 3. Governance state (count blocked trades)
  const blocked = computeBlockedTradeMetrics(sessions);
  const blockedTotal = blocked.reduce((s, b) => s + b.count, 0);
  const blockedRatio = totalTrades > 0 ? blockedTotal / (totalTrades + blockedTotal) : 0;
  const governanceScore = clamp(100 - blockedRatio * 120);

  // 4. Volatility / recent drawdown pressure
  const equity = computeEquityCurve(sessions);
  const recent = equity.slice(-Math.min(50, equity.length));
  const recentDd = recent.length > 0 ? Math.max(...recent.map(p => p.drawdown)) : 0;
  const drawdownScore = clamp(100 - recentDd * 4);

  // 5. Volatility distribution balance
  const volMatrix = volatilityAssetMatrix(sessions);
  const volTotals = new Map<string, number>();
  for (const c of volMatrix) volTotals.set(c.row, (volTotals.get(c.row) ?? 0) + c.pnl);
  const volBalance = volTotals.size > 0
    ? clamp(60 + Array.from(volTotals.values()).filter(v => v > 0).length * 15)
    : 50;

  // 6. Data quality (archived context coverage + sample size)
  const cov = archivedContextCoverage(sessions);
  const sampleScore = clamp(Math.log10(Math.max(totalTrades, 1)) * 35);
  const dataQuality = clamp(cov.percent * 0.6 + sampleScore * 0.4);

  const factors: ConfidenceFactor[] = [
    { key: 'strategy', label: 'Strategy Health', score: Math.round(strategyScore), weight: 0.25,
      detail: `${winRate.toFixed(0)}% WR · PF ${pf.toFixed(2)} · $${totalPnl.toFixed(0)} cumulative` },
    { key: 'market', label: 'Market Alignment', score: Math.round(marketAlign), weight: 0.15,
      detail: `${positiveRegimes}/3 regimes profitable` },
    { key: 'governance', label: 'Governance State', score: Math.round(governanceScore), weight: 0.15,
      detail: `${blockedTotal} guardrail blocks recorded` },
    { key: 'drawdown', label: 'Drawdown Pressure', score: Math.round(drawdownScore), weight: 0.20,
      detail: `Recent peak DD ${recentDd.toFixed(1)}%` },
    { key: 'volatility', label: 'Volatility Edge', score: Math.round(volBalance), weight: 0.10,
      detail: `${Array.from(volTotals.entries()).filter(([, v]) => v > 0).map(([k]) => k).join(', ') || 'mixed'}` },
    { key: 'data', label: 'Data Quality', score: Math.round(dataQuality), weight: 0.15,
      detail: `${cov.archived}/${cov.archived + cov.heuristic} trades with full context (${cov.percent.toFixed(0)}%)` },
  ];

  const overall = Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const b = band(overall);
  const summary =
    b === 'strong' ? 'System is operating within optimal parameters across strategy, market, and risk dimensions.' :
    b === 'healthy' ? 'System is generally healthy. Monitor weaker factors below for early warning signs.' :
    b === 'cautious' ? 'Mixed signals — reduce exposure and validate the lowest-scoring factors before scaling.' :
    'Multiple factors are weak. Pause new entries and run a research cycle before continuing.';

  return { overall, band: b, factors, summary };
}

// ─── Opportunities ─────────────────────────────────────────────────

export interface Opportunity {
  id: string;
  title: string;
  kind: 'setup' | 'regime_shift' | 'improving' | 'deteriorating' | 'anomaly';
  detail: string;
  metric?: string;
  severity: 'positive' | 'neutral' | 'warning';
}

function recencyHalf(sessions: ArchivedSession[]): { recent: ArchivedSession[]; older: ArchivedSession[] } {
  const ordered = [...sessions].sort((a, b) => b.endTime - a.endTime);
  const half = Math.max(1, Math.floor(ordered.length / 2));
  return { recent: ordered.slice(0, half), older: ordered.slice(half) };
}

function assetPnl(sessions: ArchivedSession[]): Map<string, { pnl: number; trades: number }> {
  const m = new Map<string, { pnl: number; trades: number }>();
  for (const s of sessions) for (const t of s.trades) {
    const cur = m.get(t.asset) ?? { pnl: 0, trades: 0 };
    cur.pnl += t.pnl; cur.trades += 1;
    m.set(t.asset, cur);
  }
  return m;
}

export function scanOpportunities(sessions: ArchivedSession[]): Opportunity[] {
  const out: Opportunity[] = [];
  if (sessions.length === 0) return out;

  // Best current setup: strongest regime × direction with positive avg
  const strong = strongestRegimes(sessions, 3);
  if (strong[0] && strong[0].avgPnl > 0) {
    out.push({
      id: 'setup-1',
      kind: 'setup',
      title: `Strongest regime: ${strong[0].label}`,
      detail: `Avg $${strong[0].avgPnl.toFixed(2)} per trade across ${strong[0].trades} samples (${strong[0].winRate.toFixed(0)}% WR). Bias allocation toward this regime.`,
      metric: `+$${strong[0].pnl.toFixed(2)} cumulative`,
      severity: 'positive',
    });
  }

  // Improving / deteriorating assets (recent vs older)
  const { recent, older } = recencyHalf(sessions);
  if (recent.length >= 2 && older.length >= 1) {
    const r = assetPnl(recent);
    const o = assetPnl(older);
    const deltas: Array<{ asset: string; delta: number; recent: number; older: number }> = [];
    for (const [asset, cur] of r) {
      const prev = o.get(asset);
      if (!prev) continue;
      deltas.push({ asset, delta: cur.pnl - prev.pnl, recent: cur.pnl, older: prev.pnl });
    }
    deltas.sort((a, b) => b.delta - a.delta);
    const top = deltas[0];
    const bot = deltas[deltas.length - 1];
    if (top && top.delta > 5) {
      out.push({
        id: 'imp-1', kind: 'improving',
        title: `${top.asset} is improving`,
        detail: `Recent sessions show $${top.recent.toFixed(2)} vs $${top.older.toFixed(2)} earlier (Δ +$${top.delta.toFixed(2)}). Edge is strengthening.`,
        metric: `Δ +$${top.delta.toFixed(2)}`,
        severity: 'positive',
      });
    }
    if (bot && bot.delta < -5 && bot !== top) {
      out.push({
        id: 'det-1', kind: 'deteriorating',
        title: `${bot.asset} is deteriorating`,
        detail: `Recent $${bot.recent.toFixed(2)} vs earlier $${bot.older.toFixed(2)} (Δ $${bot.delta.toFixed(2)}). Consider reducing size on this asset.`,
        metric: `Δ $${bot.delta.toFixed(2)}`,
        severity: 'warning',
      });
    }
  }

  // Regime shift detection
  if (recent.length >= 1 && older.length >= 1) {
    const recRegimes = computeRegimeMetrics(recent);
    const oldRegimes = computeRegimeMetrics(older);
    const recDom = [...recRegimes].sort((a, b) => b.trades - a.trades)[0];
    const oldDom = [...oldRegimes].sort((a, b) => b.trades - a.trades)[0];
    if (recDom && oldDom && recDom.regime !== oldDom.regime && recDom.trades >= 3) {
      out.push({
        id: 'shift-1', kind: 'regime_shift',
        title: `Regime shift detected: ${oldDom.label} → ${recDom.label}`,
        detail: `Recent sessions are dominated by ${recDom.label.toLowerCase()} (${recDom.trades} trades) where prior sessions favored ${oldDom.label.toLowerCase()}. Adaptive allocation should rebalance.`,
        severity: 'neutral',
      });
    }
  }

  // Anomaly: dangerous failure pattern
  const danger = dangerousConditions(sessions);
  if (danger[0]) {
    out.push({
      id: 'anom-1', kind: 'anomaly',
      title: 'Abnormal failure pattern',
      detail: danger[0].replace(/^⚠\s*/, ''),
      severity: 'warning',
    });
  }

  return out;
}

// ─── Recommendations with explainability ───────────────────────────

export interface Recommendation {
  id: string;
  action: string;                 // plain-English directive
  rationale: string;              // why
  metrics: string[];              // supporting metric lines
  contextTags: string[];          // supporting regime/context tags
  severity: 'info' | 'caution' | 'critical' | 'positive';
}

export function generateRecommendations(sessions: ArchivedSession[]): Recommendation[] {
  const recs: Recommendation[] = [];
  if (sessions.length === 0) {
    return [{
      id: 'rec-bootstrap',
      action: 'Run a paper trading session to populate the intelligence layer.',
      rationale: 'No archived sessions exist yet, so the Command Center cannot evaluate performance, regimes, or risk.',
      metrics: ['0 archived sessions', '0 archived trades'],
      contextTags: ['cold-start'],
      severity: 'info',
    }];
  }

  const conf = computeConfidence(sessions);
  const assets = computeAssetMetrics(sessions);
  const regimes = computeRegimeMetrics(sessions);
  const failures = detectFailurePatterns(sessions, 3);
  const weakestLong = weakestForDirection(sessions, 'long', 2)[0];
  const weakestShort = weakestForDirection(sessions, 'short', 2)[0];
  const cvc = continuationVsCrossoverByRegime(sessions);

  // Confidence-driven exposure
  if (conf.overall < 50) {
    recs.push({
      id: 'rec-reduce',
      action: 'Reduce exposure across all assets and pause new short entries.',
      rationale: 'Overall confidence is low. Multiple subsystems are flagging weakness simultaneously, so smaller position sizes give the agent room to validate before scaling.',
      metrics: [
        `Overall confidence ${conf.overall}/100 (${conf.band})`,
        ...conf.factors.filter(f => f.score < 50).map(f => `${f.label}: ${f.score}/100 — ${f.detail}`),
      ],
      contextTags: ['low-confidence', 'risk-off'],
      severity: 'critical',
    });
  } else if (conf.overall >= 75) {
    recs.push({
      id: 'rec-stable',
      action: 'Stable conditions — current sizing and strategy mix are appropriate.',
      rationale: 'All confidence factors are healthy. The system is finding profitable conditions and risk pressure is contained.',
      metrics: [
        `Overall confidence ${conf.overall}/100 (${conf.band})`,
        ...conf.factors.slice(0, 3).map(f => `${f.label}: ${f.score}/100`),
      ],
      contextTags: ['risk-on', 'aligned'],
      severity: 'positive',
    });
  }

  // Best regime → favor mean reversion / trend allocation
  const bestRegime = [...regimes].sort((a, b) => b.pnl - a.pnl)[0];
  const worstRegime = [...regimes].sort((a, b) => a.pnl - b.pnl)[0];
  if (bestRegime && bestRegime.pnl > 0) {
    const isSideways = bestRegime.regime === 'sideways';
    recs.push({
      id: 'rec-regime-bias',
      action: isSideways
        ? 'Favor mean reversion — sideways regime is the strongest performer.'
        : `Favor trend-following allocations — ${bestRegime.label.toLowerCase()} regime is dominant.`,
      rationale: `Trades classified as ${bestRegime.label.toLowerCase()} produced $${bestRegime.pnl.toFixed(2)} (${bestRegime.winRate.toFixed(0)}% WR), out-earning every other regime. Adaptive allocation should weight this regime higher.`,
      metrics: [
        `${bestRegime.label}: $${bestRegime.pnl.toFixed(2)} · ${bestRegime.trades} trades · ${bestRegime.winRate.toFixed(0)}% WR`,
        worstRegime ? `${worstRegime.label}: $${worstRegime.pnl.toFixed(2)} · ${worstRegime.trades} trades` : '',
      ].filter(Boolean),
      contextTags: [bestRegime.regime, isSideways ? 'mean-reversion' : 'trend-following'],
      severity: 'positive',
    });
  }

  // Shorts underperforming
  const longTrades = sessions.flatMap(s => s.trades).filter(t => t.direction === 'long');
  const shortTrades = sessions.flatMap(s => s.trades).filter(t => t.direction === 'short');
  const longPnl = longTrades.reduce((s, t) => s + t.pnl, 0);
  const shortPnl = shortTrades.reduce((s, t) => s + t.pnl, 0);
  if (shortTrades.length >= 5 && shortPnl < 0 && shortPnl < longPnl - 10) {
    recs.push({
      id: 'rec-avoid-shorts',
      action: 'Avoid new short entries until short edge recovers.',
      rationale: 'Shorts are underperforming longs by a wide margin. Without an edge, short fees and slippage compound losses.',
      metrics: [
        `Short PnL $${shortPnl.toFixed(2)} across ${shortTrades.length} trades`,
        `Long PnL $${longPnl.toFixed(2)} across ${longTrades.length} trades`,
        weakestShort ? `Worst short context: ${weakestShort.label} — avg $${weakestShort.avgPnl.toFixed(2)}/trade` : '',
      ].filter(Boolean),
      contextTags: ['short-weakness'],
      severity: 'caution',
    });
  }

  // Increase caution if failure pattern severe
  const severe = failures.find(f => f.severity === 'high');
  if (severe) {
    recs.push({
      id: 'rec-caution',
      action: 'Increase caution and add a filter for the recurring failure pattern.',
      rationale: `One recurring context is responsible for repeated losses. Filtering it out should immediately lift expectancy.`,
      metrics: [
        `Pattern: ${severe.description}`,
        `${severe.trades} trades · ${severe.lossRate.toFixed(0)}% loss rate · $${severe.pnl.toFixed(2)} cumulative`,
      ],
      contextTags: ['failure-pattern', severe.severity],
      severity: 'caution',
    });
  }

  // Worst asset → cut size
  const worstAsset = [...assets].sort((a, b) => a.pnl - b.pnl)[0];
  if (worstAsset && worstAsset.pnl < 0 && worstAsset.trades >= 4) {
    recs.push({
      id: 'rec-worst-asset',
      action: `Cut size on ${worstAsset.asset} until performance stabilizes.`,
      rationale: 'This asset is the largest drag on cumulative PnL. Reducing size limits the damage while keeping observation samples flowing.',
      metrics: [
        `${worstAsset.asset}: $${worstAsset.pnl.toFixed(2)} over ${worstAsset.trades} trades (PF ${worstAsset.profitFactor.toFixed(2)})`,
      ],
      contextTags: [worstAsset.asset, 'underperformer'],
      severity: 'caution',
    });
  }

  // Continuation vs crossover insight
  const cont = cvc.filter(c => c.col === 'Continuation').reduce((s, x) => s + x.pnl, 0);
  const cross = cvc.filter(c => c.col === 'Crossover').reduce((s, x) => s + x.pnl, 0);
  if (Math.abs(cont - cross) > 20) {
    recs.push({
      id: 'rec-exit-style',
      action: cont > cross
        ? 'Let trades reach SL/TP rather than flipping on opposite signals.'
        : 'Tighten take-profit — crossover flips currently extract more value than SL/TP.',
      rationale: cont > cross
        ? 'Continuation exits significantly outperform reversal flips, so premature flips are leaving money on the table.'
        : 'Crossover flips outperform SL/TP exits, which usually means TPs are too far out or stops too tight.',
      metrics: [
        `Continuation cumulative: $${cont.toFixed(2)}`,
        `Crossover cumulative: $${cross.toFixed(2)}`,
      ],
      contextTags: ['exit-style'],
      severity: 'info',
    });
  }

  return recs;
}

// ─── Operator Q&A (natural-language router) ────────────────────────

export interface AnswerSection { heading: string; body: string }
export interface OperatorAnswer {
  question: string;
  summary: string;
  sections: AnswerSection[];
  metrics: string[];
}

const SUGGESTED_QUESTIONS = [
  'Why did performance change this week?',
  'Which regimes are strongest right now?',
  'Are shorts underperforming?',
  'Which asset has the highest edge?',
  'What conditions are most dangerous?',
  'Is drawdown risk increasing?',
];

export function getSuggestedQuestions(): string[] { return SUGGESTED_QUESTIONS; }

function emptyAnswer(question: string): OperatorAnswer {
  return {
    question,
    summary: 'No archived sessions available yet. Run a paper trading session to populate intelligence.',
    sections: [],
    metrics: [],
  };
}

export function answerOperatorQuestion(rawQuestion: string, sessions: ArchivedSession[]): OperatorAnswer {
  const question = rawQuestion.trim();
  const q = question.toLowerCase();
  if (sessions.length === 0) return emptyAnswer(question);

  // Performance change this week
  if (q.includes('week') || (q.includes('performance') && q.includes('change'))) {
    const thisWeek = weekWindowFor();
    const lastWeek = weekWindowFor(Date.now(), -1);
    const inWindow = (s: ArchivedSession, w: typeof thisWeek) =>
      s.endTime >= w.start && s.endTime < w.end;
    const cur = sessions.filter(s => inWindow(s, thisWeek));
    const prev = sessions.filter(s => inWindow(s, lastWeek));
    const curPnl = cur.reduce((a, s) => a + s.totalPnl, 0);
    const prevPnl = prev.reduce((a, s) => a + s.totalPnl, 0);
    const delta = curPnl - prevPnl;
    const drivers = computeRegimeMetrics(cur).sort((a, b) => b.pnl - a.pnl);
    const top = drivers[0];
    const bottom = drivers[drivers.length - 1];
    return {
      question,
      summary: `${delta >= 0 ? 'Performance improved' : 'Performance declined'} by $${delta.toFixed(2)} versus last week ($${curPnl.toFixed(2)} vs $${prevPnl.toFixed(2)}).`,
      sections: [
        { heading: 'Top contributor', body: top && top.trades > 0
          ? `${top.label} regime added $${top.pnl.toFixed(2)} across ${top.trades} trades (${top.winRate.toFixed(0)}% WR).`
          : 'No regime stood out this week.' },
        { heading: 'Largest drag', body: bottom && bottom !== top && bottom.trades > 0
          ? `${bottom.label} regime cost $${bottom.pnl.toFixed(2)} across ${bottom.trades} trades.`
          : 'No clear losing regime detected.' },
      ],
      metrics: [
        `This week: ${cur.length} sessions, $${curPnl.toFixed(2)} PnL`,
        `Last week: ${prev.length} sessions, $${prevPnl.toFixed(2)} PnL`,
      ],
    };
  }

  // Regime strength
  if (q.includes('regime')) {
    const strong = strongestRegimes(sessions, 2);
    const top = strong[0];
    return {
      question,
      summary: top
        ? `Strongest regime is ${top.label}: avg $${top.avgPnl.toFixed(2)} per trade across ${top.trades} samples.`
        : 'Not enough archived trades to rank regimes confidently.',
      sections: strong.map(r => ({
        heading: r.label,
        body: `${r.trades} trades · ${r.winRate.toFixed(0)}% WR · $${r.pnl.toFixed(2)} cumulative · avg $${r.avgPnl.toFixed(2)}/trade.`,
      })),
      metrics: strong.map(r => `${r.label}: $${r.pnl.toFixed(2)}`),
    };
  }

  // Shorts underperforming
  if (q.includes('short')) {
    const trades = sessions.flatMap(s => s.trades);
    const shorts = trades.filter(t => t.direction === 'short');
    const longs = trades.filter(t => t.direction === 'long');
    const sPnl = shorts.reduce((s, t) => s + t.pnl, 0);
    const lPnl = longs.reduce((s, t) => s + t.pnl, 0);
    const sWR = shorts.length ? (shorts.filter(t => t.pnl > 0).length / shorts.length) * 100 : 0;
    const lWR = longs.length ? (longs.filter(t => t.pnl > 0).length / longs.length) * 100 : 0;
    const worst = weakestForDirection(sessions, 'short', 2)[0];
    const underperforming = shorts.length >= 3 && sPnl < lPnl - 5;
    return {
      question,
      summary: underperforming
        ? `Yes — shorts are underperforming longs by $${(lPnl - sPnl).toFixed(2)}.`
        : 'Shorts are roughly in line with longs (or sample is too small to conclude).',
      sections: [
        { heading: 'Longs', body: `${longs.length} trades · ${lWR.toFixed(0)}% WR · $${lPnl.toFixed(2)} cumulative.` },
        { heading: 'Shorts', body: `${shorts.length} trades · ${sWR.toFixed(0)}% WR · $${sPnl.toFixed(2)} cumulative.` },
        worst ? { heading: 'Worst short context', body: `${worst.label}: ${worst.trades} trades, avg $${worst.avgPnl.toFixed(2)}/trade.` } : null,
      ].filter(Boolean) as AnswerSection[],
      metrics: [`Long-short spread: $${(lPnl - sPnl).toFixed(2)}`],
    };
  }

  // Best asset / highest edge
  if (q.includes('asset') || q.includes('edge') || q.includes('coin') || q.includes('symbol')) {
    const assets = computeAssetMetrics(sessions).sort((a, b) => b.pnl - a.pnl);
    const top = assets[0];
    return {
      question,
      summary: top
        ? `${top.asset} has the highest edge: $${top.pnl.toFixed(2)} over ${top.trades} trades (PF ${top.profitFactor.toFixed(2)}, ${top.winRate.toFixed(0)}% WR).`
        : 'No asset data available.',
      sections: assets.slice(0, 4).map(a => ({
        heading: a.asset,
        body: `${a.trades} trades · ${a.winRate.toFixed(0)}% WR · PF ${a.profitFactor.toFixed(2)} · $${a.pnl.toFixed(2)} (L:$${a.longPnl.toFixed(2)} / S:$${a.shortPnl.toFixed(2)}).`,
      })),
      metrics: assets.slice(0, 4).map(a => `${a.asset}: $${a.pnl.toFixed(2)}`),
    };
  }

  // Dangerous conditions
  if (q.includes('danger') || q.includes('risk') && !q.includes('drawdown')) {
    const danger = dangerousConditions(sessions);
    const failures = detectFailurePatterns(sessions, 3);
    return {
      question,
      summary: danger.length > 0
        ? `${danger.length} dangerous conditions detected. Top: ${danger[0].replace(/^⚠\s*/, '')}`
        : 'No dangerous conditions detected yet at the current sensitivity threshold.',
      sections: failures.slice(0, 4).map(f => ({
        heading: f.severity.toUpperCase() + ' · ' + f.description,
        body: `${f.trades} trades · ${f.lossRate.toFixed(0)}% loss rate · $${f.pnl.toFixed(2)} cumulative.`,
      })),
      metrics: danger,
    };
  }

  // Drawdown risk
  if (q.includes('drawdown') || q.includes('risk')) {
    const equity = computeEquityCurve(sessions);
    const recent = equity.slice(-Math.min(30, equity.length));
    const earlier = equity.slice(0, Math.max(1, equity.length - recent.length));
    const recentPeak = recent.length ? Math.max(...recent.map(p => p.drawdown)) : 0;
    const earlierPeak = earlier.length ? Math.max(...earlier.map(p => p.drawdown)) : 0;
    const increasing = recentPeak > earlierPeak + 1;
    return {
      question,
      summary: increasing
        ? `Yes — drawdown pressure is increasing. Recent peak ${recentPeak.toFixed(1)}% vs earlier ${earlierPeak.toFixed(1)}%.`
        : `Drawdown pressure is stable. Recent peak ${recentPeak.toFixed(1)}% (earlier ${earlierPeak.toFixed(1)}%).`,
      sections: [
        { heading: 'Recent window', body: `${recent.length} trades, peak DD ${recentPeak.toFixed(2)}%.` },
        { heading: 'Earlier window', body: `${earlier.length} trades, peak DD ${earlierPeak.toFixed(2)}%.` },
      ],
      metrics: [`Δ drawdown: ${(recentPeak - earlierPeak).toFixed(2)}%`],
    };
  }

  // Fallback: holistic summary
  const conf = computeConfidence(sessions);
  return {
    question,
    summary: `${conf.summary} Overall confidence ${conf.overall}/100.`,
    sections: conf.factors.map(f => ({ heading: f.label, body: `${f.score}/100 — ${f.detail}` })),
    metrics: conf.factors.map(f => `${f.label}: ${f.score}/100`),
  };
}

// ─── AI Insights bundles ───────────────────────────────────────────

export interface InsightBundle {
  systemHealth: string[];
  market: string[];
  regime: string[];
  allocation: string[];
  risk: string[];
  strategy: string[];
}

export function generateInsights(sessions: ArchivedSession[]): InsightBundle {
  if (sessions.length === 0) {
    const empty = ['No archived data yet — run a paper session to populate insights.'];
    return { systemHealth: empty, market: empty, regime: empty, allocation: empty, risk: empty, strategy: empty };
  }
  const conf = computeConfidence(sessions);
  const regimes = computeRegimeMetrics(sessions);
  const assets = computeAssetMetrics(sessions);
  const bestRegime = [...regimes].sort((a, b) => b.pnl - a.pnl)[0];
  const worstRegime = [...regimes].sort((a, b) => a.pnl - b.pnl)[0];
  const bestAsset = [...assets].sort((a, b) => b.pnl - a.pnl)[0];
  const worstAsset = [...assets].sort((a, b) => a.pnl - b.pnl)[0];
  const danger = dangerousConditions(sessions);
  const conv = convictionRangeMetrics(sessions).filter(c => c.trades >= 3);
  const bestConv = conv.sort((a, b) => b.avgPnl - a.avgPnl)[0];

  return {
    systemHealth: [
      `Overall confidence ${conf.overall}/100 (${conf.band}). ${conf.summary}`,
      ...conf.factors.map(f => `${f.label}: ${f.score}/100 — ${f.detail}`),
    ],
    market: [
      bestRegime ? `Dominant profitable regime: ${bestRegime.label} ($${bestRegime.pnl.toFixed(2)}, ${bestRegime.trades} trades).` : 'No regime is clearly dominant.',
      worstRegime && worstRegime !== bestRegime ? `Weakest regime: ${worstRegime.label} ($${worstRegime.pnl.toFixed(2)}).` : '',
    ].filter(Boolean),
    regime: regimes.map(r => `${r.label}: ${r.trades} trades · ${r.winRate.toFixed(0)}% WR · $${r.pnl.toFixed(2)}.`),
    allocation: [
      bestAsset ? `Increase weight on ${bestAsset.asset} — $${bestAsset.pnl.toFixed(2)} cumulative, PF ${bestAsset.profitFactor.toFixed(2)}.` : '',
      worstAsset && worstAsset !== bestAsset && worstAsset.pnl < 0 ? `Reduce weight on ${worstAsset.asset} — $${worstAsset.pnl.toFixed(2)} drag.` : '',
      bestRegime?.regime === 'sideways' ? 'Favor mean reversion in current allocation mix.' : bestRegime ? 'Favor trend-following allocations in current mix.' : '',
    ].filter(Boolean),
    risk: danger.length > 0 ? danger : ['No dangerous patterns detected at the current threshold (≥60% loss rate, ≥3 trades).'],
    strategy: [
      bestConv ? `Best conviction band: ${bestConv.range} — avg $${bestConv.avgPnl.toFixed(2)}/trade across ${bestConv.trades} trades.` : 'Conviction-band data is sparse — wire the agent decision engine into paper execution.',
    ],
  };
}
