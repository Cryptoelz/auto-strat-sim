import { Asset, ExecutionAttempt, ExecutionOutcome } from '@/types/trading';
import { SpecialistId, SpecialistProposal } from './types';
import { SPECIALIST_IDS } from './stats';

/**
 * Per-specialist signal funnel.
 * Every counter below is incremented from the LIVE execution path:
 * specialists run against the same candles the engine evaluated, and the
 * approved/rejected/executed stages are resolved from the engine's own
 * ExecutionAttempt records (the gate log written inside processSignals).
 */
export interface SpecialistFunnel {
  seen: number;       // market snapshots the specialist analysed
  proposed: number;   // snapshots where it emitted BUY/SELL
  approved: number;   // proposals that won champion selection and cleared live gates
  rejected: number;   // proposals that lost selection or were blocked live
  executed: number;   // live engine actually opened/flipped a position
  rejections: Record<string, number>;
  lastReason: string | null;
  /** Markets this specialist examined, with the number of snapshots per market. */
  markets: Record<string, number>;
  /** Rejections grouped into the institutional reason categories. */
  categories: Record<RejectCategory, number>;
  /** Closed trades attributed to this specialist that finished in profit. */
  won: number;
  /** Closed trades attributed to this specialist that finished in loss. */
  lost: number;
  /** Distinct institutional lessons observed (rejections + trade outcomes). */
  lessons: string[];
  /** Rounds where the specialist decided to HOLD (an institutional decision). */
  holds: number;
}

export const REJECT_CATEGORIES = [
  'HTF Conflict',
  'ATR too low',
  'Distance filter',
  'Risk',
  'Governance',
  'Portfolio',
  'Champion selection',
  'Other',
] as const;
export type RejectCategory = typeof REJECT_CATEGORIES[number];

const emptyCategories = (): Record<RejectCategory, number> =>
  REJECT_CATEGORIES.reduce((a, c) => { a[c] = 0; return a; }, {} as Record<RejectCategory, number>);

/** Maps a free-text rejection reason onto an institutional category. */
export function categoriseReason(reason: string): RejectCategory {
  const r = reason.toLowerCase();
  if (r.includes('htf') || r.includes('higher timeframe') || r.includes('trend conflict')) return 'HTF Conflict';
  if (r.includes('atr') || r.includes('volatility too low')) return 'ATR too low';
  if (r.includes('distance')) return 'Distance filter';
  if (r.includes('risk') || r.includes('balance') || r.includes('position size')) return 'Risk';
  if (r.includes('governance') || r.includes('paused') || r.includes('participation')) return 'Governance';
  if (r.includes('allocation') || r.includes('exposure') || r.includes('max open') || r.includes('portfolio')) return 'Portfolio';
  if (r.includes('champion') || r.includes('selection')) return 'Champion selection';
  return 'Other';
}

export type FunnelMap = Record<SpecialistId, SpecialistFunnel>;

export const emptyFunnel = (): SpecialistFunnel => ({
  seen: 0, proposed: 0, approved: 0, rejected: 0, executed: 0, rejections: {}, lastReason: null,
  markets: {}, categories: emptyCategories(), won: 0, lost: 0, lessons: [], holds: 0,
});

export const emptyFunnelMap = (): FunnelMap =>
  SPECIALIST_IDS.reduce((acc, id) => { acc[id] = emptyFunnel(); return acc; }, {} as FunnelMap);

const clone = (m: FunnelMap): FunnelMap =>
  SPECIALIST_IDS.reduce((acc, id) => {
    acc[id] = {
      ...m[id],
      rejections: { ...m[id].rejections },
      markets: { ...(m[id].markets ?? {}) },
      categories: { ...emptyCategories(), ...(m[id].categories ?? {}) },
      won: m[id].won ?? 0,
      lost: m[id].lost ?? 0,
      lessons: [...(m[id].lessons ?? [])],
      holds: m[id].holds ?? 0,
    };
    return acc;
  }, {} as FunnelMap);

const learn = (f: SpecialistFunnel, lesson: string) => {
  if (!f.lessons.includes(lesson)) f.lessons.push(lesson);
};

const reject = (f: SpecialistFunnel, reason: string) => {
  f.rejected += 1;
  f.rejections[reason] = (f.rejections[reason] ?? 0) + 1;
  const cat = categoriseReason(reason);
  f.categories[cat] = (f.categories[cat] ?? 0) + 1;
  f.lastReason = reason;
  learn(f, `${cat}: proposals are being blocked at this gate — ${reason}`);
};

/** Human label for an engine gate outcome. */
export const OUTCOME_LABELS: Record<ExecutionOutcome, string> = {
  executed_open: 'Executed — position opened',
  executed_flip: 'Executed — position flipped',
  skipped_same_direction: 'Already in same direction',
  cooldown_active: 'Cooldown active',
  insufficient_balance: 'Insufficient balance',
  position_too_small: 'Position size below minimum',
  blocked_by_filter: 'Blocked by filter (HTF / ATR / regime)',
  blocked_by_governance: 'Blocked by governance pause',
  blocked_by_mpc: 'Blocked by market participation controller',
  blocked_by_allocation: 'Blocked by allocation engine',
  blocked_by_max_positions: 'Blocked by max open positions',
};

export const isExecutedOutcome = (o: ExecutionOutcome) => o === 'executed_open' || o === 'executed_flip';

/**
 * A HOLD is an institutional decision, not an absence of activity.
 * Every evaluated market that produced no actionable proposal is recorded here
 * with its reason, specialist, evidence and confidence, so the funnel can prove
 * the institution analysed the market even when it did not trade.
 */
export interface HoldDecision {
  id: string;
  timestamp: number;
  asset: Asset;
  decision: 'HOLD';
  /** Specialist whose view best represented the institution for this round. */
  specialistId: SpecialistId | null;
  reason: string;
  evidence: string[];
  confidence: number;
  /** True when at least one specialist generated a directional signal. */
  signalGenerated: boolean;
}

/** Record one comparison round: every specialist saw the candle, some proposed. */
export function recordRound(
  map: FunnelMap,
  proposals: SpecialistProposal[],
  championId: SpecialistId | null,
  championActionable: boolean,
  asset?: Asset,
  timestamp?: number,
): { map: FunnelMap; hold: HoldDecision | null } {
  const next = clone(map);
  proposals.forEach((p) => {
    const f = next[p.specialistId];
    if (!f) return;
    f.seen += 1;
    if (asset) f.markets[asset] = (f.markets[asset] ?? 0) + 1;
    if (p.signal === 'WAIT') {
      f.holds = (f.holds ?? 0) + 1;
      f.lastReason = p.reasoning?.[0] ?? 'HOLD — no actionable setup';
      return;
    }
    f.proposed += 1;
    if (p.specialistId !== championId) {
      reject(f, 'Lost champion selection');
    } else if (!championActionable) {
      reject(f, 'Champion score below institution action bar');
    }
  });

  let hold: HoldDecision | null = null;
  const anySignal = proposals.some((p) => p.signal !== 'WAIT');
  if (asset && !championActionable) {
    const lead = proposals.find((p) => p.specialistId === championId)
      ?? [...proposals].sort((a, b) => b.confidence - a.confidence)[0]
      ?? null;
    const ts = timestamp ?? Date.now();
    hold = {
      id: `${asset}-${ts}`,
      timestamp: ts,
      asset,
      decision: 'HOLD',
      specialistId: lead?.specialistId ?? null,
      reason: anySignal
        ? 'Signal generated but conviction below the institution action bar'
        : (lead?.reasoning?.[0] ?? 'No specialist found an actionable setup'),
      evidence: lead?.reasoning?.slice(0, 3) ?? [],
      confidence: lead?.confidence ?? 0,
      signalGenerated: anySignal,
    };
    if (lead && next[lead.specialistId]) {
      learn(next[lead.specialistId], `HOLD on ${asset}: ${hold.reason}`);
    }
  }
  return { map: next, hold };
}


/**
 * Immutable audit record of one live execution attempt. Written for EVERY
 * attempt the engine emits — including attempts that arrive before champion
 * selection has resolved for that asset, which used to be silently discarded.
 */
export interface AttemptRecord {
  id: string;
  asset: Asset;
  timestamp: number;
  outcome: ExecutionOutcome;
  executed: boolean;
  reason: string;
  /** Champion at resolution time, or null while still unattributed. */
  specialistId: SpecialistId | null;
  attributed: boolean;
}

export function describeAttempt(
  a: ExecutionAttempt,
  specialistId: SpecialistId | null,
): AttemptRecord {
  const executed = isExecutedOutcome(a.outcome);
  return {
    id: a.id,
    asset: a.asset,
    timestamp: a.timestamp ?? Date.now(),
    outcome: a.outcome,
    executed,
    reason: executed ? OUTCOME_LABELS[a.outcome] : gateReason(a),
    specialistId,
    attributed: specialistId !== null,
  };
}

/**
 * Resolves the live engine's execution attempt against the specialist that was
 * champion for that asset at the time. Approved = the proposal reached the
 * engine's gate stack; executed = the engine actually traded it.
 *
 * Race-safe: when no champion has been resolved yet the attempt is NOT
 * discarded — it is returned as `deferred` with a full audit record so the
 * caller can retry it once champion selection commits.
 */
export function recordExecutionAttempt(
  map: FunnelMap,
  attempt: ExecutionAttempt,
  championByAsset: Partial<Record<Asset, SpecialistId>>,
): { map: FunnelMap; record: AttemptRecord; deferred: boolean } {
  const id = championByAsset[attempt.asset];
  if (!id || !map[id]) {
    return { map, record: describeAttempt(attempt, null), deferred: true };
  }
  const next = clone(map);
  const f = next[id];
  f.approved += 1;
  if (isExecutedOutcome(attempt.outcome)) {
    f.executed += 1;
    f.lastReason = OUTCOME_LABELS[attempt.outcome];
  } else {
    reject(f, gateReason(attempt));
  }
  return { map: next, record: describeAttempt(attempt, id), deferred: false };
}


/** Precise blocking reason for a live attempt, using the engine's own gate log. */
function gateReason(a: ExecutionAttempt): string {
  const gate = (g?: { pass: boolean; detail: string }) => (g && !g.pass ? g.detail : undefined);
  return gate(a.governance) ? `Governance — ${gate(a.governance)}`
    : gate(a.mpc) ? `Governance — ${gate(a.mpc)}`
    : gate(a.risk) ? `Risk — ${gate(a.risk)}`
    : gate(a.allocation) ? `Portfolio allocation — ${gate(a.allocation)}`
    : gate(a.exposure) ? `Portfolio exposure — ${gate(a.exposure)}`
    : gate(a.maxPositions) ? `Portfolio — ${gate(a.maxPositions)}`
    : (OUTCOME_LABELS[a.outcome] ?? a.outcome) + (a.outcomeDetail ? ` — ${a.outcomeDetail}` : '');
}

/**
 * Attributes a closed trade to the specialist that was champion for that asset,
 * completing the institutional funnel (Executed -> Won -> Lessons learned).
 * Race-safe: unattributed outcomes are deferred, never dropped.
 */
export function recordTradeOutcome(
  map: FunnelMap,
  trade: { asset: Asset; type: 'win' | 'loss'; pnlPercent: number; exitReason: string },
  championByAsset: Partial<Record<Asset, SpecialistId>>,
): { map: FunnelMap; deferred: boolean } {
  const id = championByAsset[trade.asset];
  if (!id || !map[id]) return { map, deferred: true };
  const next = clone(map);
  const f = next[id];
  if (trade.type === 'win') {
    f.won += 1;
    learn(f, `Winning exit on ${trade.asset} via ${trade.exitReason} (${trade.pnlPercent.toFixed(2)}%)`);
  } else {
    f.lost += 1;
    learn(f, `Losing exit on ${trade.asset} via ${trade.exitReason} (${trade.pnlPercent.toFixed(2)}%)`);
  }
  return { map: next, deferred: false };
}


/** The eight institutional funnel stages, in order. */
export const FUNNEL_STAGES = [
  'Markets Examined',
  'Markets Evaluated',
  'Signals Generated',
  'HOLD Decisions',
  'Signals Proposed',
  'Signals Approved',
  'Trades Executed',
  'Trades Won',
  'Lessons Learned',
] as const;
export type FunnelStage = typeof FUNNEL_STAGES[number];

/** Stage counts for one specialist funnel. */
export function stageCounts(f: SpecialistFunnel): Record<FunnelStage, number> {
  return {
    'Markets Examined': Object.keys(f.markets ?? {}).length,
    'Markets Evaluated': f.seen,
    'Signals Generated': f.proposed,
    'HOLD Decisions': f.holds ?? 0,
    'Signals Proposed': Math.max(0, f.proposed - (f.categories?.['Champion selection'] ?? 0)),
    'Signals Approved': f.approved,
    'Trades Executed': f.executed,
    'Trades Won': f.won ?? 0,
    'Lessons Learned': (f.lessons ?? []).length,
  };
}

/** Institution-wide stage counts across every specialist. */
export function institutionStages(map: FunnelMap): Record<FunnelStage, number> {
  const markets = new Set<string>();
  const lessons = new Set<string>();
  const totals = FUNNEL_STAGES.reduce((a, s) => { a[s] = 0; return a; }, {} as Record<FunnelStage, number>);
  SPECIALIST_IDS.forEach((id) => {
    const f = map[id];
    if (!f) return;
    Object.keys(f.markets ?? {}).forEach((m) => markets.add(m));
    (f.lessons ?? []).forEach((l) => lessons.add(l));
    const c = stageCounts(f);
    FUNNEL_STAGES.forEach((s) => { totals[s] += c[s]; });
  });
  totals['Markets Examined'] = markets.size;
  totals['Lessons Learned'] = lessons.size;
  return totals;
}

export const conversionRate = (f: SpecialistFunnel) =>
  f.proposed ? Number(((f.executed / f.proposed) * 100).toFixed(1)) : 0;
