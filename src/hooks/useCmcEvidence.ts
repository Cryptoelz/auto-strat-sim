/**
 * Stage 3D — read-only evidence reader.
 *
 * Reads two already-persisted stores plus the in-memory CMC request stats.
 * Performs ZERO network calls and spends ZERO CMC API credits: nothing here
 * calls the adapter, the client or the proxy.
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { getAuditEvents, getAuditStorageStatus, subscribeToAudit } from '@/lib/audit/auditLedger';
import { getCmcRequestStats } from '@/lib/cmc/cache';
import { loadContextState } from '@/lib/cmc/contextStore';
import { buildEvidenceBundle, evidenceJson, type EvidenceBundle } from '@/lib/cmc/evidence';

export interface CmcEvidenceState {
  bundle: EvidenceBundle;
  exportJson: () => string;
}

export function useCmcEvidence(): CmcEvidenceState {
  const auditEvents = useSyncExternalStore(subscribeToAudit, getAuditEvents, getAuditEvents);

  const contextState = useMemo(() => {
    try {
      return loadContextState();
    } catch {
      return { records: [], extraApiCalls: 0 };
    }
  }, [auditEvents]);

  const bundle = useMemo(
    () =>
      buildEvidenceBundle({
        auditEvents,
        contextRecords: contextState.records,
        extraApiCalls: contextState.extraApiCalls,
        requestStats: getCmcRequestStats(),
        storage: getAuditStorageStatus(),
      }),
    [auditEvents, contextState],
  );

  const exportJson = useCallback(
    () =>
      evidenceJson(
        buildEvidenceBundle({
          auditEvents,
          contextRecords: contextState.records,
          extraApiCalls: contextState.extraApiCalls,
          requestStats: getCmcRequestStats(),
          storage: getAuditStorageStatus(),
        }),
      ),
    [auditEvents, contextState],
  );

  return { bundle, exportJson };
}
