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
  markets: {}, categories: emptyCategories(),
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
    };
    return acc;
  }, {} as FunnelMap);

const reject = (f: SpecialistFunnel, reason: string) => {
  f.rejected += 1;
  f.rejections[reason] = (f.rejections[reason] ?? 0) + 1;
  const cat = categoriseReason(reason);
  f.categories[cat] = (f.categories[cat] ?? 0) + 1;
  f.lastReason = reason;
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

/** Record one comparison round: every specialist saw the candle, some proposed. */
export function recordRound(
  map: FunnelMap,
  proposals: SpecialistProposal[],
  championId: SpecialistId | null,
  championActionable: boolean,
  asset?: Asset,
): FunnelMap {
  const next = clone(map);
  proposals.forEach((p) => {
    const f = next[p.specialistId];
    if (!f) return;
    f.seen += 1;
    if (asset) f.markets[asset] = (f.markets[asset] ?? 0) + 1;
    if (p.signal === 'WAIT') return;
    f.proposed += 1;
    if (p.specialistId !== championId) {
      reject(f, 'Lost champion selection');
    } else if (!championActionable) {
      reject(f, 'Champion score below institution action bar');
    }
  });
  return next;
}

/**
 * Resolves the live engine's execution attempt against the specialist that was
 * champion for that asset at the time. Approved = the proposal reached the
 * engine's gate stack; executed = the engine actually traded it.
 */
export function recordExecutionAttempt(
  map: FunnelMap,
  attempt: ExecutionAttempt,
  championByAsset: Partial<Record<Asset, SpecialistId>>,
): FunnelMap {
  const id = championByAsset[attempt.asset];
  if (!id || !map[id]) return map;
  const next = clone(map);
  const f = next[id];
  f.approved += 1;
  if (isExecutedOutcome(attempt.outcome)) {
    f.executed += 1;
    f.lastReason = OUTCOME_LABELS[attempt.outcome];
  } else {
    reject(f, gateReason(attempt));
  }
  return next;
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

export const conversionRate = (f: SpecialistFunnel) =>
  f.proposed ? Number(((f.executed / f.proposed) * 100).toFixed(1)) : 0;
