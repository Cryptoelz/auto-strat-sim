/**
 * Stage 3C — app-level mount point for the passive audit observer.
 * Renders nothing. Mounted once in App so capture never depends on the page.
 */

import { useEngineAuditObserver } from '@/hooks/useEngineAuditLedger';

export function EngineAuditObserver() {
  useEngineAuditObserver();
  return null;
}
