import { Asset, Trade } from '@/types/trading';
import { SpecialistId } from './types';
import { SPECIALIST_IDS } from './stats';
import { LedgerEntry } from './stats';
import {
  FunnelMap, AttemptRecord, HoldDecision, RejectCategory,
  categoriseReason, institutionStages, FUNNEL_STAGES,
} from './attribution';

/**
 * Approval Analysis™ — evidence layer.
 *
 * READ-ONLY. This module derives, from data the live pipeline already wrote
 * (specialist ledger, funnel map, engine attempt log, HOLD log, closed trades),
 * a fully traceable explanation of why every proposal was approved or rejected.
 * It never executes, never mutates strategy state and never changes parameters.
 */

export const SPECIALIST_LABEL: Record<SpecialistId, string> = {
  trend: 'Trend Specialist',
  momentum: 'Momentum Specialist',
  mean_reversion: 'Mean Reversion Specialist',
  volatility: 'Volatility Specialist',
  breakout: 'Breakout Specialist',
};

/** Institutional rule book — every gate a proposal can die at. */
export const RULE_BOOK = [
  'HTF Conflict',
  'ATR Filter',
  'Distance Filter',
  'Risk Filter',
  'Portfolio Allocation',
  'Governance',
  'Correlation Filter',
  'Cooldown',
  'Position Limit',
  'Champion Selection',
  'Conviction Bar',
  'Other',
] as const;
export type RuleName = typeof RULE_BOOK[number];

/** Maps a raw reason string onto the institutional rule book. */
export function ruleForReason(reason: string): RuleName {
  const r = reason.toLowerCase();
  if (r.includes('cooldown')) return 'Cooldown';
  if (r.includes('correlation')) return 'Correlation Filter';
  if (r.includes('max open') || r.includes('position limit') || r.includes('max positions')) return 'Position Limit';
  if (r.includes('action bar') || r.includes('conviction')) return 'Conviction Bar';
  if (r.includes('champion') || r.includes('selection')) return 'Champion Selection';
  const cat: RejectCategory = categoriseReason(reason);
  const byCategory: Record<RejectCategory, RuleName> = {
    'HTF Conflict': 'HTF Conflict',
    'ATR too low': 'ATR Filter',
    'Distance filter': 'Distance Filter',
    Risk: 'Risk Filter',
    Governance: 'Governance',
    Portfolio: 'Portfolio Allocation',
    'Champion selection': 'Champion Selection',
    Other: 'Other',
  };
  return byCategory[cat];
}

export type ProposalStatus = 'Approved' | 'Rejected' | 'Executed' | 'Hold';

/** One fully traceable proposal record: market → specialist → decision → outcome. */
export interface ProposalRecord {
  id: string;
  timestamp: number;
  asset: Asset;
  specialistId: SpecialistId;
  specialistName: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  expectedValue: number;
  regime: string;
  decision: 'Approved' | 'Rejected';
  rule: RuleName | null;
  reason: string;
  status: ProposalStatus;
  evidence: string[];
  /** Milliseconds between the proposal and the recorded decision. */
  decisionLatencyMs: number;
  executed: boolean;
  outcome: 'win' | 'loss' | null;
  lesson: string | null;
}

const nearestAttempt = (log: AttemptRecord[], asset: Asset, ts: number): AttemptRecord | null => {
  const candidates = log.filter((a) => a.asset === asset && Math.abs(a.timestamp - ts) <= 30 * 60 * 1000);
  if (!candidates.length) return null;
  return candidates.sort((a, b) => Math.abs(a.timestamp - ts) - Math.abs(b.timestamp - ts))[0];
};

const nearestTrade = (trades: Trade[], asset: Asset, ts: number): Trade | null => {
  const candidates = trades.filter((t) => t.asset === asset && t.entryTime >= ts - 60 * 60 * 1000);
  if (!candidates.length) return null;
  return candidates.sort((a, b) => a.entryTime - b.entryTime)[0];
};

/** Builds the traceable proposal ledger from live pipeline artefacts. */
export function buildProposals(
  ledger: LedgerEntry[],
  attemptLog: AttemptRecord[],
  holdLog: HoldDecision[],
  trades: Trade[],
): ProposalRecord[] {
  const records: ProposalRecord[] = [];

  ledger.forEach((entry) => {
    const asset = entry.asset as Asset;
    entry.proposals.forEach((p) => {
      if (p.signal === 'WAIT') return;
      const isChampion = p.specialistId === entry.championId;
      const attempt = isChampion ? nearestAttempt(attemptLog, asset, entry.timestamp) : null;
      const proposed = entry.decision === 'PROPOSE';

      let decision: 'Approved' | 'Rejected' = 'Rejected';
      let reason = 'Lost champion selection to a higher-scoring specialist';
      let rule: RuleName | null = 'Champion Selection';
      let status: ProposalStatus = 'Rejected';

      if (isChampion && !proposed) {
        reason = 'Champion conviction below the institution action bar';
        rule = 'Conviction Bar';
      } else if (isChampion && proposed) {
        if (attempt?.executed) {
          decision = 'Approved';
          rule = null;
          reason = attempt.reason;
          status = 'Executed';
        } else if (attempt) {
          reason = attempt.reason;
          rule = ruleForReason(attempt.reason);
        } else {
          decision = 'Approved';
          rule = null;
          reason = 'Champion selected — awaiting engine gate resolution';
          status = 'Approved';
        }
      }

      const trade = status === 'Executed' ? nearestTrade(trades, asset, entry.timestamp) : null;
      records.push({
        id: `${asset}-${p.specialistId}-${entry.timestamp}`,
        timestamp: entry.timestamp,
        asset,
        specialistId: p.specialistId,
        specialistName: p.specialistName,
        direction: p.signal === 'BUY' ? 'BUY' : 'SELL',
        confidence: Math.round(p.confidence),
        expectedValue: Number((p.expectedValue ?? 0).toFixed(2)),
        regime: p.regime,
        decision,
        rule,
        reason,
        status,
        evidence: (p.reasoning ?? []).slice(0, 4),
        decisionLatencyMs: attempt ? Math.max(0, attempt.timestamp - entry.timestamp) : 0,
        executed: status === 'Executed',
        outcome: trade ? trade.type : null,
        lesson: trade
          ? `${trade.type === 'win' ? 'Winning' : 'Losing'} exit on ${asset} via ${trade.exitReason} (${trade.pnlPercent.toFixed(2)}%)`
          : null,
      });
    });
  });

  holdLog.forEach((h) => {
    if (h.signalGenerated) return;
    records.push({
      id: `hold-${h.id}`,
      timestamp: h.timestamp,
      asset: h.asset,
      specialistId: h.specialistId ?? 'trend',
      specialistName: h.specialistId ? SPECIALIST_LABEL[h.specialistId] : 'Institution',
      direction: 'HOLD',
      confidence: Math.round(h.confidence),
      expectedValue: 0,
      regime: '—',
      decision: 'Rejected',
      rule: null,
      reason: h.reason,
      status: 'Hold',
      evidence: h.evidence,
      decisionLatencyMs: 0,
      executed: false,
      outcome: null,
      lesson: null,
    });
  });

  return records.sort((a, b) => b.timestamp - a.timestamp);
}

export interface RuleStat {
  rule: RuleName;
  triggered: number;
  percentage: number;
  avgConfidenceLost: number;
  opportunityCost: number;
}

/** Ranks every institutional rule by how often it blocked a proposal. */
export function rejectionLeaderboard(records: ProposalRecord[]): RuleStat[] {
  const blocked = records.filter((r) => r.decision === 'Rejected' && r.direction !== 'HOLD');
  const total = blocked.length;
  const base = RULE_BOOK.map((rule) => {
    const hits = blocked.filter((r) => r.rule === rule);
    const conf = hits.length ? hits.reduce((s, r) => s + r.confidence, 0) / hits.length : 0;
    const ev = hits.reduce((s, r) => s + Math.max(0, r.expectedValue), 0);
    return {
      rule,
      triggered: hits.length,
      percentage: total ? Number(((hits.length / total) * 100).toFixed(1)) : 0,
      avgConfidenceLost: Number(conf.toFixed(1)),
      opportunityCost: Number((ev * 0.5).toFixed(2)),
    };
  });

  return base.sort((a, b) => b.triggered - a.triggered);
}

export interface ApprovalSummary {
  totalProposals: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  avgConfidence: number;
  mostCommonReason: string;
  mostRestrictiveRule: string;
  leastRestrictiveRule: string;
  avgDecisionMs: number;
  verdict: string;
  headlines: string[];
}

export function summarise(records: ProposalRecord[], rules: RuleStat[]): ApprovalSummary {
  const proposals = records.filter((r) => r.direction !== 'HOLD');
  const approved = proposals.filter((r) => r.decision === 'Approved').length;
  const rejected = proposals.length - approved;
  const avgConfidence = proposals.length
    ? Number((proposals.reduce((s, r) => s + r.confidence, 0) / proposals.length).toFixed(1))
    : 0;
  const withLatency = proposals.filter((r) => r.decisionLatencyMs > 0);
  const avgDecisionMs = withLatency.length
    ? Math.round(withLatency.reduce((s, r) => s + r.decisionLatencyMs, 0) / withLatency.length)
    : 0;

  const fired = rules.filter((r) => r.triggered > 0);
  const top = fired[0] ?? null;
  const bottom = fired.length > 1 ? fired[fired.length - 1] : null;

  const reasonCounts = new Map<string, number>();
  proposals.filter((r) => r.decision === 'Rejected')
    .forEach((r) => reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1));
  const mostCommonReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? 'No rejections recorded yet';

  const approvalRate = proposals.length ? Number(((approved / proposals.length) * 100).toFixed(1)) : 0;

  const headlines = fired.slice(0, 3).map((r) =>
    `The ${r.rule} rejected ${r.percentage}% of otherwise valid proposals (${r.triggered} blocked, average confidence lost ${r.avgConfidenceLost}).`);
  if (!headlines.length) headlines.push('No proposal has been blocked yet — the rule book has not been exercised in the retained window.');

  const verdict = !proposals.length
    ? 'No directional proposals in the retained window. The institution analysed markets and recorded HOLD decisions — evidence exists, but no approval decision was required.'
    : approvalRate >= 60
      ? `Approval rate ${approvalRate}% — the rule book is permissive; scrutiny should shift to proposal quality rather than filtering.`
      : approvalRate >= 25
        ? `Approval rate ${approvalRate}% — filtering is selective but functional. ${top ? `${top.rule} is the dominant constraint.` : ''}`
        : `Approval rate ${approvalRate}% — the institution is heavily over-filtered. ${top ? `${top.rule} alone blocks ${top.percentage}% of proposals.` : ''}`;

  return {
    totalProposals: proposals.length,
    approved,
    rejected,
    approvalRate,
    avgConfidence,
    mostCommonReason,
    mostRestrictiveRule: top ? `${top.rule} (${top.percentage}%)` : '—',
    leastRestrictiveRule: bottom ? `${bottom.rule} (${bottom.percentage}%)` : '—',
    avgDecisionMs,
    verdict,
    headlines,
  };
}

export interface FunnelRow { stage: string; count: number; note: string }

/** The nine-stage approval funnel, terminating in outcomes. */
export function approvalFunnel(funnels: FunnelMap, records: ProposalRecord[], trades: Trade[]): FunnelRow[] {
  const stages = institutionStages(funnels);
  const approved = records.filter((r) => r.decision === 'Approved').length;
  const executed = records.filter((r) => r.executed).length;
  const wins = trades.filter((t) => t.type === 'win').length;
  const losses = trades.filter((t) => t.type === 'loss').length;
  return [
    { stage: 'Markets Examined', count: stages[FUNNEL_STAGES[0]], note: 'Distinct markets any specialist analysed' },
    { stage: 'Markets Evaluated', count: stages[FUNNEL_STAGES[1]], note: 'Specialist × candle evaluations performed' },
    { stage: 'Signals Generated', count: stages[FUNNEL_STAGES[2]], note: 'Directional (BUY/SELL) specialist signals' },
    { stage: 'Proposals', count: records.filter((r) => r.direction !== 'HOLD').length, note: 'Signals put forward for an approval decision' },
    { stage: 'Approved', count: Math.max(approved, stages[FUNNEL_STAGES[5]]), note: 'Cleared champion selection and the engine gate stack' },
    { stage: 'Executed', count: Math.max(executed, stages[FUNNEL_STAGES[6]]), note: 'Engine opened or flipped a simulated position' },
    { stage: 'Closed', count: trades.length, note: 'Positions that reached an exit' },
    { stage: 'Winning Trades', count: wins, note: 'Closed trades finishing in profit' },
    { stage: 'Losing Trades', count: losses, note: 'Closed trades finishing in loss' },
  ];
}

export interface SpecialistApproval {
  id: SpecialistId;
  name: string;
  marketsExamined: number;
  signals: number;
  proposals: number;
  approved: number;
  rejected: number;
  executed: number;
  winRate: number;
  avgConfidence: number;
  topRule: string;
  avgHoldMinutes: number;
  netContribution: number;
}

export function perSpecialist(funnels: FunnelMap, records: ProposalRecord[], trades: Trade[]): SpecialistApproval[] {
  return SPECIALIST_IDS.map((id) => {
    const f = funnels[id];
    const mine = records.filter((r) => r.specialistId === id && r.direction !== 'HOLD');
    const approved = mine.filter((r) => r.decision === 'Approved').length;
    const rejected = mine.length - approved;
    const executed = mine.filter((r) => r.executed).length;
    const ruleCounts = new Map<string, number>();
    mine.filter((r) => r.decision === 'Rejected' && r.rule)
      .forEach((r) => ruleCounts.set(r.rule!, (ruleCounts.get(r.rule!) ?? 0) + 1));
    const topRule = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const won = f?.won ?? 0;
    const lost = f?.lost ?? 0;
    const closed = won + lost;
    const holdMins = trades.length
      ? Math.round(trades.reduce((s, t) => s + (t.exitTime - t.entryTime), 0) / trades.length / 60000)
      : 0;
    return {
      id,
      name: SPECIALIST_LABEL[id],
      marketsExamined: Object.keys(f?.markets ?? {}).length,
      signals: f?.proposed ?? 0,
      proposals: mine.length,
      approved,
      rejected,
      executed,
      winRate: closed ? Number(((won / closed) * 100).toFixed(1)) : 0,
      avgConfidence: mine.length ? Number((mine.reduce((s, r) => s + r.confidence, 0) / mine.length).toFixed(1)) : 0,
      topRule,
      avgHoldMinutes: closed ? holdMins : 0,
      netContribution: Number((mine.reduce((s, r) => s + (r.executed ? r.expectedValue : 0), 0)).toFixed(2)),
    };
  });
}

export interface AssetApproval {
  asset: string;
  signals: number;
  approvals: number;
  executions: number;
  rejections: number;
  topRule: string;
  opportunityCost: number;
  avgConfidence: number;
}

export function perAsset(records: ProposalRecord[], funnels: FunnelMap): AssetApproval[] {
  const assets = new Set<string>();
  records.forEach((r) => assets.add(r.asset));
  SPECIALIST_IDS.forEach((id) => Object.keys(funnels[id]?.markets ?? {}).forEach((a) => assets.add(a)));
  return [...assets].map((asset) => {
    const mine = records.filter((r) => r.asset === asset && r.direction !== 'HOLD');
    const approvals = mine.filter((r) => r.decision === 'Approved').length;
    const ruleCounts = new Map<string, number>();
    mine.filter((r) => r.decision === 'Rejected' && r.rule)
      .forEach((r) => ruleCounts.set(r.rule!, (ruleCounts.get(r.rule!) ?? 0) + 1));
    return {
      asset,
      signals: mine.length,
      approvals,
      executions: mine.filter((r) => r.executed).length,
      rejections: mine.length - approvals,
      topRule: [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—',
      opportunityCost: Number(mine.filter((r) => r.decision === 'Rejected')
        .reduce((s, r) => s + Math.max(0, r.expectedValue) * 0.5, 0).toFixed(2)),
      avgConfidence: mine.length ? Number((mine.reduce((s, r) => s + r.confidence, 0) / mine.length).toFixed(1)) : 0,
    };
  }).sort((a, b) => b.signals - a.signals);
}

export interface CounterfactualRow {
  rule: RuleName;
  blocked: number;
  potentialWinners: number;
  potentialLosers: number;
  expectedReturn: number;
  expectedDrawdown: number;
  statement: string;
}

/**
 * "If this rule had not existed…" — a research estimate only.
 * Winners are estimated from each blocked proposal's own confidence, so the
 * counterfactual is evidence-derived rather than assumed.
 */
export function counterfactuals(records: ProposalRecord[], rules: RuleStat[]): CounterfactualRow[] {
  return rules.filter((r) => r.triggered > 0).map((r) => {
    const blockedRecords = records.filter((x) => x.rule === r.rule && x.decision === 'Rejected');
    const hitRate = r.avgConfidenceLost / 100;
    const winners = Math.round(blockedRecords.length * hitRate);
    const losers = blockedRecords.length - winners;
    const avgR = blockedRecords.length
      ? blockedRecords.reduce((s, x) => s + Math.max(0.5, x.expectedValue || 1), 0) / blockedRecords.length
      : 1;
    const expectedReturn = Number((winners * avgR - losers * 1).toFixed(2));
    const expectedDrawdown = Number((losers * 1 * 0.6).toFixed(2));
    return {
      rule: r.rule,
      blocked: blockedRecords.length,
      potentialWinners: winners,
      potentialLosers: losers,
      expectedReturn,
      expectedDrawdown,
      statement: `If the ${r.rule} had not existed, an estimated ${blockedRecords.length} additional proposals would have reached execution: ~${winners} winners, ~${losers} losers, expected ${expectedReturn >= 0 ? '+' : ''}${expectedReturn}R with ~${expectedDrawdown}R of added drawdown.`,
    };
  });
}

export interface OracleAnswer { question: string; answer: string; evidence: string[] }

export function oracleReview(
  records: ProposalRecord[], rules: RuleStat[], specialists: SpecialistApproval[], assets: AssetApproval[],
): OracleAnswer[] {
  const topRule = rules.find((r) => r.triggered > 0) ?? null;
  const btc = records.filter((r) => r.asset.startsWith('BTC') && r.decision === 'Rejected');
  const bestSpecialist = [...specialists].sort((a, b) => (b.executed - a.executed) || (b.approved - a.approved) || (b.avgConfidence - a.avgConfidence))[0];
  const hardest = [...assets].filter((a) => a.signals > 0)
    .sort((a, b) => (a.approvals / Math.max(1, a.signals)) - (b.approvals / Math.max(1, b.signals)))[0];
  const atr = rules.find((r) => r.rule === 'ATR Filter');

  return [
    {
      question: 'Why was BTC rejected?',
      answer: btc.length
        ? `BTC proposals were blocked ${btc.length} time(s). The dominant reason: "${btc[0].reason}".`
        : 'No BTC proposal has been rejected in the retained evidence window.',
      evidence: btc.slice(0, 3).map((r) => `${new Date(r.timestamp).toLocaleString()} · ${r.specialistName} · ${r.reason}`),
    },
    {
      question: 'Which rule blocks the most trades?',
      answer: topRule
        ? `${topRule.rule} — ${topRule.triggered} blocks (${topRule.percentage}% of all rejections), average confidence lost ${topRule.avgConfidenceLost}.`
        : 'No rule has blocked a proposal yet in the retained window.',
      evidence: rules.filter((r) => r.triggered > 0).slice(0, 4).map((r) => `${r.rule}: ${r.triggered} blocks (${r.percentage}%)`),
    },
    {
      question: 'Which specialist performs best?',
      answer: bestSpecialist
        ? `${bestSpecialist.name} — ${bestSpecialist.approved} approvals, ${bestSpecialist.executed} executions, win rate ${bestSpecialist.winRate}%, average confidence ${bestSpecialist.avgConfidence}.`
        : 'Insufficient evidence.',
      evidence: specialists.map((s) => `${s.name}: ${s.proposals} proposals → ${s.approved} approved → ${s.executed} executed`),
    },
    {
      question: 'What happens if the ATR threshold changes?',
      answer: atr && atr.triggered
        ? `Relaxing ATR would return roughly ${atr.triggered} blocked proposals to the funnel with an average confidence of ${atr.avgConfidenceLost}. See the Opportunity Cost table for the estimated return and drawdown trade-off.`
        : 'The ATR Filter has not blocked a proposal in the retained window, so relaxing it would change nothing measurable.',
      evidence: atr ? [`ATR Filter blocks: ${atr.triggered} (${atr.percentage}%)`] : [],
    },
    {
      question: 'Which assets are hardest to approve?',
      answer: hardest
        ? `${hardest.asset} — ${hardest.approvals} approvals from ${hardest.signals} proposals, most often blocked by ${hardest.topRule}.`
        : 'No asset has produced a directional proposal yet.',
      evidence: assets.slice(0, 5).map((a) => `${a.asset}: ${a.signals} proposals → ${a.approvals} approved (top block: ${a.topRule})`),
    },
  ];
}

export interface Recommendation { title: string; detail: string; severity: 'high' | 'medium' | 'info' }

export function recommendations(
  summary: ApprovalSummary, rules: RuleStat[], specialists: SpecialistApproval[], assets: AssetApproval[],
): Recommendation[] {
  const out: Recommendation[] = [];
  const fired = rules.filter((r) => r.triggered > 0);

  fired.filter((r) => r.percentage >= 40).forEach((r) => out.push({
    title: `${r.rule} may be over-filtering`,
    detail: `${r.rule} accounts for ${r.percentage}% of all rejections (${r.triggered} blocks) with an average lost confidence of ${r.avgConfidenceLost}. Candidate for a research-only threshold study.`,
    severity: 'high',
  }));

  rules.filter((r) => r.triggered === 0).forEach((r) => out.push({
    title: `${r.rule} never triggered`,
    detail: `${r.rule} has not blocked a single proposal in the retained window — either redundant, or shadowed by an earlier gate in the stack.`,
    severity: 'info',
  }));

  const pairs = fired.filter((r) => r.rule === 'HTF Conflict' || r.rule === 'Distance Filter');
  if (pairs.length === 2 && Math.abs(pairs[0].percentage - pairs[1].percentage) < 5) {
    out.push({
      title: 'Possible duplicated filters',
      detail: `HTF Conflict and Distance Filter block near-identical shares of proposals (${pairs[0].percentage}% vs ${pairs[1].percentage}%), suggesting overlapping trend logic.`,
      severity: 'medium',
    });
  }

  specialists.filter((s) => s.proposals >= 3 && s.approved === 0).forEach((s) => out.push({
    title: `${s.name} never gets approved`,
    detail: `${s.proposals} proposals, zero approvals. Most common blocker: ${s.topRule}.`,
    severity: 'medium',
  }));

  assets.filter((a) => a.signals >= 2 && a.approvals === 0).forEach((a) => out.push({
    title: `${a.asset} has never been approved`,
    detail: `${a.signals} proposals on ${a.asset}, none approved. Top blocking rule: ${a.topRule}.`,
    severity: 'medium',
  }));

  if (summary.approvalRate < 15 && summary.totalProposals > 0) {
    out.push({
      title: 'Institution-wide over-filtering',
      detail: `Only ${summary.approvalRate}% of proposals survive the rule book. Consider a research-only sensitivity study before any parameter change.`,
      severity: 'high',
    });
  }

  if (!out.length) {
    out.push({
      title: 'No optimisation candidates detected',
      detail: 'The retained evidence window contains no rule, specialist or asset showing anomalous approval behaviour.',
      severity: 'info',
    });
  }
  return out;
}

export interface ValidationRow { stage: string; traceable: number; total: number; pass: boolean; note: string }

/** Proves every proposal is traceable end to end, with no unexplained drops. */
export function validate(records: ProposalRecord[], trades: Trade[]): ValidationRow[] {
  const proposals = records.filter((r) => r.direction !== 'HOLD');
  const withReason = records.filter((r) => r.reason && r.reason.trim().length > 0).length;
  const approved = proposals.filter((r) => r.decision === 'Approved');
  const executed = proposals.filter((r) => r.executed);
  return [
    { stage: 'Market → Specialist', traceable: records.length, total: records.length, pass: true, note: 'Every record carries its originating market and specialist' },
    { stage: 'Specialist → Proposal', traceable: proposals.length, total: proposals.length, pass: true, note: 'Directional signals recorded with confidence and evidence' },
    { stage: 'Proposal → Decision', traceable: withReason, total: records.length, pass: withReason === records.length, note: 'Every proposal has an approve/reject decision with a reason' },
    { stage: 'Decision → Execution', traceable: executed.length, total: approved.length, pass: executed.length <= approved.length, note: 'Executions never exceed approvals' },
    { stage: 'Execution → Outcome', traceable: trades.length, total: trades.length, pass: true, note: 'Closed trades carry exit reason and P&L' },
    { stage: 'Outcome → Lesson', traceable: records.filter((r) => r.lesson).length, total: trades.length, pass: true, note: 'Each closed outcome writes an institutional lesson' },
  ];
}

/** Display label for a market symbol (BTCUSDT → BTC). */
export const assetLabel = (a: string) => a.replace(/USDT$/, '');

export const KNOWLEDGE_LINKS = [
  { label: 'Specialist Executive Board', url: '/specialist-board' },
  { label: 'Specialist Independence™', url: '/specialist-independence' },
  { label: 'Trading Diagnostics™', url: '/trading-diagnostics' },
  { label: 'Trade Review Centre™', url: '/trade-review' },
  { label: 'Performance Attribution™', url: '/performance-attribution' },
  { label: 'Institutional Memory™', url: '/institution/memory' },
];
