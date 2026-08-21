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
}

export type FunnelMap = Record<SpecialistId, SpecialistFunnel>;

export const emptyFunnel = (): SpecialistFunnel => ({
  seen: 0, proposed: 0, approved: 0, rejected: 0, executed: 0, rejections: {}, lastReason: null,
});

export const emptyFunnelMap = (): FunnelMap =>
  SPECIALIST_IDS.reduce((acc, id) => { acc[id] = emptyFunnel(); return acc; }, {} as FunnelMap);

const clone = (m: FunnelMap): FunnelMap =>
  SPECIALIST_IDS.reduce((acc, id) => {
    acc[id] = { ...m[id], rejections: { ...m[id].rejections } };
    return acc;
  }, {} as FunnelMap);

const reject = (f: SpecialistFunnel, reason: string) => {
  f.rejected += 1;
  f.rejections[reason] = (f.rejections[reason] ?? 0) + 1;
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
): FunnelMap {
  const next = clone(map);
  proposals.forEach((p) => {
    const f = next[p.specialistId];
    if (!f) return;
    f.seen += 1;
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
    reject(f, OUTCOME_LABELS[attempt.outcome] ?? attempt.outcome);
  }
  return next;
}

export const conversionRate = (f: SpecialistFunnel) =>
  f.proposed ? Number(((f.executed / f.proposed) * 100).toFixed(1)) : 0;
