/**
 * CMC Hackathon — Stage 3C observer hook.
 *
 * Its primary event source is now the persisted Engine Audit Ledger
 * (atlas_engine_audit_v1). CMC context is attached STRICTLY AFTER a genuine
 * engine event has already been produced by the engine, published by the
 * logger and persisted by the audit observer.
 *
 * Order: engine -> logger -> audit ledger -> CMC context.
 * CMC never participates in the first three steps and never feeds back.
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { AUDIT_ENABLED } from '@/lib/audit/config';
import { getAuditEvents, subscribeToAudit } from '@/lib/audit/auditLedger';
import type { EngineAuditEvent } from '@/lib/audit/types';
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

/** Maps a persisted genuine audit event onto the observed-event shape. */
export function toObservedEvent(event: EngineAuditEvent): CmcObservedEvent {
  return {
    eventId: event.eventId,
    timestamp: event.timestamp,
    asset: event.asset,
    decisionType: event.eventType,
    decisionOutcome: event.signal ?? event.eventType,
    detail: event.explanation,
  };
}

export interface CmcDecisionContextState {
  records: CmcDecisionContextRecord[];
  diagnostics: ContextDiagnostics;
  capturing: boolean;
  enabled: boolean;
  auditEnabled: boolean;
  clear: () => void;
}

export function useCmcDecisionContext(): CmcDecisionContextState {
  const auditEvents = useSyncExternalStore(subscribeToAudit, getAuditEvents, getAuditEvents);

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
    // CMC fails safe when the audit ledger is disabled: no source, no capture.
    if (!CMC_ENABLED || !AUDIT_ENABLED) return;
    const pending = (auditEvents ?? []).filter((e) => e && !seenRef.current.has(e.eventId));
    if (!pending.length || busyRef.current) return;

    busyRef.current = true;
    setCapturing(true);

    (async () => {
      try {
        // One snapshot per batch — reuses the 120s cache, normally zero API calls.
        const snapshot = await captureContextSnapshot();
        const records = pending.map((event) =>
          buildDecisionContextRecord(toObservedEvent(event), snapshot),
        );
        pending.forEach((e) => seenRef.current.add(e.eventId));
        const next = appendContextRecords(stateRef.current, records, snapshot.networkCalls);
        saveContextState(next);
        setState(next);
      } catch {
        // CMC failure must never affect the platform or the audit record.
      } finally {
        busyRef.current = false;
        setCapturing(false);
        setTick((t) => t + 1);
      }
    })();
  }, [auditEvents, tick]);

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

  return { records, diagnostics, capturing, enabled: CMC_ENABLED, auditEnabled: AUDIT_ENABLED, clear };
}
