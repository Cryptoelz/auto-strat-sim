/**
 * Stage 3C — audit observer + reader hooks.
 *
 * `useEngineAuditObserver` is mounted ONCE at application level so capture is
 * independent of which page is open. It is a passive subscriber to the
 * logger's existing public API: it never calls into the engine, never writes
 * engine state and never returns data to the engine.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import { AUDIT_ENABLED } from '@/lib/audit/config';
import {
  clearAuditLedger,
  exportAuditJson,
  getAuditEvents,
  getAuditStorageStatus,
  recordLoggerEntries,
  subscribeToAudit,
  summariseAudit,
} from '@/lib/audit/auditLedger';
import type { AuditSummary, EngineAuditEvent } from '@/lib/audit/types';

/** Passive app-level observer. Renders nothing, returns nothing. */
export function useEngineAuditObserver(): void {
  useEffect(() => {
    if (!AUDIT_ENABLED) return;
    const capture = () => {
      try {
        recordLoggerEntries(getLogEntries());
      } catch {
        /* audit capture must never affect the engine */
      }
    };
    capture();
    return subscribeToLog(capture);
  }, []);
}

export interface EngineAuditLedgerState {
  events: EngineAuditEvent[];
  summary: AuditSummary;
  enabled: boolean;
  storage: ReturnType<typeof getAuditStorageStatus>;
  clear: () => void;
  exportJson: () => string;
}

/** Read-only view of the persisted ledger, newest first. */
export function useEngineAuditLedger(): EngineAuditLedgerState {
  const raw = useSyncExternalStore(subscribeToAudit, getAuditEvents, getAuditEvents);

  const events = useMemo(() => [...raw].sort((a, b) => b.timestamp - a.timestamp), [raw]);
  const summary = useMemo(() => summariseAudit(raw), [raw]);
  const clear = useCallback(() => clearAuditLedger(), []);

  return {
    events,
    summary,
    enabled: AUDIT_ENABLED,
    storage: getAuditStorageStatus(),
    clear,
    exportJson: exportAuditJson,
  };
}
