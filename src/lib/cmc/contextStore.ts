/**
 * CMC Hackathon — Stage 3B storage.
 * A CMC-owned localStorage namespace. Writes nothing into trading, specialist,
 * attribution, execution, portfolio or governance state.
 */

import type { CmcDecisionContextRecord } from './decisionContext';

export const CMC_CONTEXT_STORAGE_KEY = 'atlas_cmc_context_v1';
export const CMC_CONTEXT_MAX_RECORDS = 500;

export interface CmcContextPersistedState {
  records: CmcDecisionContextRecord[];
  extraApiCalls: number;
}

const empty = (): CmcContextPersistedState => ({ records: [], extraApiCalls: 0 });

export function loadContextState(): CmcContextPersistedState {
  try {
    const raw = localStorage.getItem(CMC_CONTEXT_STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<CmcContextPersistedState>;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      extraApiCalls: typeof parsed.extraApiCalls === 'number' ? parsed.extraApiCalls : 0,
    };
  } catch {
    return empty();
  }
}

export function saveContextState(state: CmcContextPersistedState): void {
  try {
    localStorage.setItem(
      CMC_CONTEXT_STORAGE_KEY,
      JSON.stringify({
        records: state.records.slice(-CMC_CONTEXT_MAX_RECORDS),
        extraApiCalls: state.extraApiCalls,
      }),
    );
  } catch {
    /* storage full or unavailable — context capture must never throw */
  }
}

/** Appends records, ignoring any event that already has a context record. */
export function appendContextRecords(
  state: CmcContextPersistedState,
  incoming: CmcDecisionContextRecord[],
  extraApiCalls = 0,
): CmcContextPersistedState {
  const seen = new Set(state.records.map((r) => r.eventId));
  const added: CmcDecisionContextRecord[] = [];
  for (const record of incoming) {
    if (seen.has(record.eventId)) continue;
    seen.add(record.eventId);
    added.push(record);
  }
  if (!added.length && !extraApiCalls) return state;
  return {
    records: [...state.records, ...added].slice(-CMC_CONTEXT_MAX_RECORDS),
    extraApiCalls: state.extraApiCalls + extraApiCalls,
  };
}

export function clearContextState(): void {
  try {
    localStorage.removeItem(CMC_CONTEXT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
