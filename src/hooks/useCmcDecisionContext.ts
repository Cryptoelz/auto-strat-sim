/**
 * CMC Hackathon — Stage 3B observer hook.
 *
 * Subscribes READ-ONLY to the engine's already-public execution-attempt stream
 * on TradingContext. It never calls into, configures, blocks or delays the
 * trading engine; it only reads what the engine has already published and
 * attaches the surrounding CoinMarketCap context.
 *
 * Dependency direction: engine -> public stream -> this observer -> CMC store.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { CMC_ENABLED } from '@/lib/cmc/config';
import {
  buildDecisionContextRecord,
  captureContextSnapshot,
  summariseContexts,
  type CmcDecisionContextRecord,
  type CmcObservedEvent,
  type ContextDiagnostics,
} from '@/lib/cmc/decisionContext';
import {
  appendContextRecords,
  clearContextState,
  loadContextState,
  saveContextState,
  type CmcContextPersistedState,
} from '@/lib/cmc/contextStore';
import type { ExecutionAttempt } from '@/types/trading';

export function toObservedEvent(attempt: ExecutionAttempt): CmcObservedEvent {
  return {
    eventId: attempt.id,
    timestamp: attempt.timestamp,
    asset: attempt.asset,
    decisionType: `${attempt.side} entry attempt`,
    decisionOutcome: attempt.outcome,
    detail: attempt.outcomeDetail,
  };
}

export interface CmcDecisionContextState {
  records: CmcDecisionContextRecord[];
  diagnostics: ContextDiagnostics;
  capturing: boolean;
  enabled: boolean;
  clear: () => void;
}

export function useCmcDecisionContext(): CmcDecisionContextState {
  const { executionAttempts } = useTradingContext();

  const [state, setState] = useState<CmcContextPersistedState>(() =>
    CMC_ENABLED ? loadContextState() : { records: [], extraApiCalls: 0 },
  );
  const [capturing, setCapturing] = useState(false);
  // Bumped whenever a capture finishes, so any events that arrived mid-flight
  // are picked up immediately instead of waiting for the next engine event.
  const [tick, setTick] = useState(0);

  const stateRef = useRef(state);
  stateRef.current = state;
  const seenRef = useRef<Set<string>>(new Set(state.records.map((r) => r.eventId)));
  const busyRef = useRef(false);

  useEffect(() => {
    if (!CMC_ENABLED) return;
    const pending = (executionAttempts ?? []).filter((a) => a && !seenRef.current.has(a.id));
    if (!pending.length || busyRef.current) return;

    busyRef.current = true;
    setCapturing(true);

    (async () => {
      try {
        // One snapshot per batch — reuses the 120s cache, normally zero API calls.
        const snapshot = await captureContextSnapshot();
        const records = pending.map((attempt) =>
          buildDecisionContextRecord(toObservedEvent(attempt), snapshot),
        );
        pending.forEach((a) => seenRef.current.add(a.id));
        const next = appendContextRecords(stateRef.current, records, snapshot.networkCalls);
        saveContextState(next);
        setState(next);
      } catch {
        // CMC failure must never affect the platform — record nothing, keep going.
      } finally {
        busyRef.current = false;
        setCapturing(false);
        setTick((t) => t + 1);
      }
    })();
  }, [executionAttempts, tick]);

  const clear = useCallback(() => {
    clearContextState();
    seenRef.current = new Set();
    setState({ records: [], extraApiCalls: 0 });
  }, []);

  const diagnostics = useMemo(
    () => summariseContexts(state.records, state.extraApiCalls),
    [state],
  );

  const records = useMemo(
    () => [...state.records].sort((a, b) => b.timestamp - a.timestamp),
    [state.records],
  );

  return { records, diagnostics, capturing, enabled: CMC_ENABLED, clear };
}
