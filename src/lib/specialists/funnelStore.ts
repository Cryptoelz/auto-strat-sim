import { Asset } from '@/types/trading';
import { SpecialistId } from './types';
import { FunnelMap, emptyFunnelMap, emptyFunnel, AttemptRecord } from './attribution';
import { SPECIALIST_IDS } from './stats';


/**
 * Persistence layer for the institutional attribution funnel.
 *
 * The funnel used to live in React state only, so every navigation or refresh
 * reset all eight stages to zero. This store keeps the funnel — and the
 * de-duplication keys that guarantee nothing is counted twice — in
 * localStorage so the Attribution dashboard always reflects the current
 * institutional state.
 *
 * Read-only with respect to trading: nothing here influences execution.
 */

const STORAGE_KEY = 'atlas_specialist_funnel_v1';
const MAX_KEYS = 500;

export interface PersistedFunnelState {
  version: 1;
  funnels: FunnelMap;
  championByAsset: Partial<Record<Asset, SpecialistId>>;
  /** Last candle timestamp already recorded per asset (prevents double counting). */
  seenCandles: Partial<Record<Asset, number>>;
  /** Execution attempt ids already resolved. */
  seenAttempts: string[];
  /** Closed trade ids already attributed. */
  seenTrades: string[];
  updatedAt: number;
}

export const emptyPersistedState = (): PersistedFunnelState => ({
  version: 1,
  funnels: emptyFunnelMap(),
  championByAsset: {},
  seenCandles: {},
  seenAttempts: [],
  seenTrades: [],
  updatedAt: Date.now(),
});

/** Normalises a possibly-partial stored funnel map onto the current shape. */
function normaliseFunnels(raw: unknown): FunnelMap {
  const base = emptyFunnelMap();
  if (!raw || typeof raw !== 'object') return base;
  const src = raw as Partial<FunnelMap>;
  SPECIALIST_IDS.forEach((id) => {
    const f = src[id];
    if (!f) return;
    base[id] = {
      ...emptyFunnel(),
      ...f,
      rejections: { ...(f.rejections ?? {}) },
      markets: { ...(f.markets ?? {}) },
      categories: { ...emptyFunnel().categories, ...(f.categories ?? {}) },
      lessons: Array.isArray(f.lessons) ? [...f.lessons] : [],
    };
  });
  return base;
}

export function loadFunnelState(): PersistedFunnelState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPersistedState();
    const parsed = JSON.parse(raw) as Partial<PersistedFunnelState>;
    return {
      version: 1,
      funnels: normaliseFunnels(parsed.funnels),
      championByAsset: parsed.championByAsset ?? {},
      seenCandles: parsed.seenCandles ?? {},
      seenAttempts: Array.isArray(parsed.seenAttempts) ? parsed.seenAttempts.slice(-MAX_KEYS) : [],
      seenTrades: Array.isArray(parsed.seenTrades) ? parsed.seenTrades.slice(-MAX_KEYS) : [],
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return emptyPersistedState();
  }
}

export function saveFunnelState(state: Omit<PersistedFunnelState, 'version' | 'updatedAt'>): void {
  try {
    const payload: PersistedFunnelState = {
      version: 1,
      funnels: state.funnels,
      championByAsset: state.championByAsset,
      seenCandles: state.seenCandles,
      seenAttempts: state.seenAttempts.slice(-MAX_KEYS),
      seenTrades: state.seenTrades.slice(-MAX_KEYS),
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full or unavailable — attribution degrades to in-memory only.
  }
}

export function clearFunnelState(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
