/**
 * Stage 3C — app-level mount point for the passive audit observer.
 * Renders nothing. Mounted once in App so capture never depends on the page.
 */

import { useCompletedTradeAuditObserver, useEngineAuditObserver } from '@/hooks/useEngineAuditLedger';

/**
 * Mounted once INSIDE TradingProvider so it can observe both:
 *  1. the live logger stream (primary, contemporaneous), and
 *  2. the persisted completed-trade history (secondary, backfilled).
 */
export function EngineAuditObserver() {
  useEngineAuditObserver();
  useCompletedTradeAuditObserver();
  return null;
}
