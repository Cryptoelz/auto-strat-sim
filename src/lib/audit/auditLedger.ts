/**
 * Stage 3C — persistent Engine Audit Ledger.
 *
 * ONE-WAY ARCHITECTURE:
 *   trading engine (unmodified) -> src/lib/logger.ts (public subscribe API)
 *     -> audit observer -> atlas_engine_audit_v1 -> CMC decision context
 *
 * Nothing in this module is imported by any trading, signal, specialist,
 * risk, portfolio, governance, execution or backtest module. Every storage
 * operation is defensive: a storage failure degrades the audit trail only and
 * can never propagate into the engine.
 */

import type { DecisionLogEntry, Trade } from '@/types/trading';
import { AUDIT_CLEARED_KEY, AUDIT_MAX_EVENTS, AUDIT_SOURCE_MODULE, AUDIT_STORAGE_KEY } from './config';
import type { AuditStorageStatus, AuditSummary, EngineAuditEvent } from './types';

/** Pure: maps a genuine logger entry onto an immutable audit record. */
export function toAuditEvent(entry: DecisionLogEntry, capturedAt: number = Date.now()): EngineAuditEvent {
  return {
    eventId: entry.id,
    timestamp: entry.timestamp,
    asset: entry.asset,
    eventType: entry.action,
    signal: entry.signal ?? null,
    explanation: entry.explanation,
    regime: entry.regime ?? null,
    filterBlocked: entry.filterBlocked ?? null,
    sourceModule: AUDIT_SOURCE_MODULE,
    backfilled: false,
    contextContemporaneous: true,
    capturedAt,
    provenance: { engineModified: false, observerOnly: true },
  };
}

/** Stable, immutable audit id derived from the engine's own trade id. */
export function tradeEventId(tradeId: string): string {
  return `trade:${tradeId}`;
}

/**
 * Pure: maps a genuine COMPLETED simulated trade onto an audit record.
 *
 * The trade is read back from the engine's already-public, already-persisted
 * trade history, so observation happens strictly AFTER execution. Such records
 * are therefore always marked backfilled and non-contemporaneous: no CMC
 * snapshot may ever be attached to them.
 */
export function toTradeAuditEvent(trade: Trade, capturedAt: number = Date.now()): EngineAuditEvent {
  return {
    eventId: tradeEventId(trade.id),
    timestamp: trade.exitTime,
    asset: trade.asset,
    eventType: trade.direction === 'short' ? 'closed_short' : 'closed_long',
    signal: trade.direction,
    explanation: `Completed simulated trade — exit reason: ${trade.exitReason}`,
    regime: trade.exitRegime ?? trade.entryRegime ?? null,
    filterBlocked: null,
    sourceModule: 'trades',
    backfilled: true,
    contextContemporaneous: false,
    capturedAt,
    provenance: { engineModified: false, observerOnly: true },
  };
}

/** Pure: appends new events, dropping duplicates by immutable event id. */
export function dedupeAppend(
  existing: EngineAuditEvent[],
  incoming: EngineAuditEvent[],
  max: number = AUDIT_MAX_EVENTS,
): EngineAuditEvent[] {
  const seen = new Set(existing.map((e) => e.eventId));
  const added: EngineAuditEvent[] = [];
  for (const event of incoming) {
    if (!event || seen.has(event.eventId)) continue;
    seen.add(event.eventId);
    added.push(event);
  }
  if (!added.length) return existing;
  const merged = [...existing, ...added].sort((a, b) => a.timestamp - b.timestamp);
  return merged.slice(-max);
}

export function summariseAudit(events: EngineAuditEvent[]): AuditSummary {
  const byType: Record<string, number> = {};
  const assets = new Set<string>();
  let latest: number | null = null;
  let live = 0;
  let backfilled = 0;
  for (const e of events) {
    if (e.backfilled) backfilled += 1;
    else live += 1;
    byType[e.eventType] = (byType[e.eventType] ?? 0) + 1;
    assets.add(e.asset);
    if (latest === null || e.timestamp > latest) latest = e.timestamp;
  }
  return { total: events.length, live, backfilled, byType, assets: [...assets].sort(), latestTimestamp: latest };
}

// ── persisted, observable store ───────────────────────────────────────────

let events: EngineAuditEvent[] | null = null;
let clearedIds: Set<string> | null = null;
let listeners: Array<() => void> = [];
let lastError: string | null = null;
let storageAvailable = true;

function readClearedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(AUDIT_CLEARED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as { ids?: unknown };
    const ids = Array.isArray(parsed?.ids) ? parsed.ids.filter((i): i is string => typeof i === 'string') : [];
    return new Set(ids.slice(-AUDIT_MAX_EVENTS));
  } catch {
    return new Set();
  }
}

function writeClearedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(AUDIT_CLEARED_KEY, JSON.stringify({ version: 1, ids: [...ids].slice(-AUDIT_MAX_EVENTS) }));
  } catch {
    /* tombstone persistence failure degrades only the clear guarantee */
  }
}

function ensureClearedIds(): Set<string> {
  if (clearedIds === null) clearedIds = readClearedIds();
  return clearedIds;
}

function readStorage(): EngineAuditEvent[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { events?: unknown };
    const list = Array.isArray(parsed?.events) ? parsed.events : [];
    return list
      .filter(
        (e): e is EngineAuditEvent =>
          !!e && typeof (e as EngineAuditEvent).eventId === 'string' &&
          typeof (e as EngineAuditEvent).timestamp === 'number',
      )
      .map((e) => ({
        // Records written before the trade source existed are live logger events.
        ...e,
        sourceModule: e.sourceModule ?? AUDIT_SOURCE_MODULE,
        backfilled: e.backfilled ?? false,
        contextContemporaneous: e.contextContemporaneous ?? true,
      }))
      .slice(-AUDIT_MAX_EVENTS);
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'corrupt audit storage';
    return [];
  }
}

function writeStorage(next: EngineAuditEvent[]): void {
  try {
    localStorage.setItem(
      AUDIT_STORAGE_KEY,
      JSON.stringify({ version: 1, events: next.slice(-AUDIT_MAX_EVENTS), updatedAt: Date.now() }),
    );
    storageAvailable = true;
    lastError = null;
  } catch (err) {
    storageAvailable = false;
    lastError = err instanceof Error ? err.message : 'audit storage unavailable';
  }
}

function ensureLoaded(): EngineAuditEvent[] {
  if (events === null) events = readStorage();
  return events;
}

function emit(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      /* a listener failure must never break capture */
    }
  });
}

/** Current persisted audit events, oldest first. */
export function getAuditEvents(): EngineAuditEvent[] {
  return ensureLoaded();
}

export function subscribeToAudit(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

/**
 * Persists genuine logger entries. Returns the number of NEW events stored.
 * Never throws — audit capture failure must not affect CryptoTrader.
 */
export function recordLoggerEntries(entries: DecisionLogEntry[], now: number = Date.now()): number {
  try {
    const tombstones = ensureClearedIds();
    const fresh = tombstones.size ? entries.filter((e) => !tombstones.has(e.id)) : entries;
    if (!fresh.length) return 0;
    const current = ensureLoaded();
    const next = dedupeAppend(current, fresh.map((e) => toAuditEvent(e, now)));
    if (next === current) return 0;
    events = next;
    writeStorage(next);
    emit();
    return next.length - current.length;
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'audit capture failed';
    return 0;
  }
}

/**
 * Persists genuine COMPLETED simulated trades read from the engine's public
 * trade history. Deduplicated by the engine's immutable trade id, so reloads,
 * re-renders and observer remounts can never create duplicates.
 * Never throws — audit capture failure must not affect CryptoTrader.
 */
export function recordCompletedTrades(trades: Trade[], now: number = Date.now()): number {
  try {
    if (!Array.isArray(trades) || !trades.length) return 0;
    const tombstones = ensureClearedIds();
    const mapped = trades
      .filter((t) => t && typeof t.id === 'string')
      .map((t) => toTradeAuditEvent(t, now))
      .filter((e) => !tombstones.has(e.eventId));
    if (!mapped.length) return 0;
    const current = ensureLoaded();
    const next = dedupeAppend(current, mapped);
    if (next === current) return 0;
    events = next;
    writeStorage(next);
    emit();
    return next.length - current.length;
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'audit trade capture failed';
    return 0;
  }
}

export function clearAuditLedger(): void {
  // Tombstone every id we know about (persisted events plus the logger's
  // in-memory buffer replayed by the observer) so cleared events can never
  // be re-ingested on the next logger notification.
  const tombstones = ensureClearedIds();
  for (const e of ensureLoaded()) tombstones.add(e.eventId);
  clearedIds = new Set([...tombstones].slice(-AUDIT_MAX_EVENTS));
  writeClearedIds(clearedIds);
  events = [];
  try {
    localStorage.removeItem(AUDIT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

/** Test/runtime helper — drops the in-memory copy so storage is re-read. */
export function resetAuditCache(): void {
  events = null;
  clearedIds = null;
  lastError = null;
  storageAvailable = true;
  emit();
}

export function getAuditStorageStatus(): AuditStorageStatus {
  return { available: storageAvailable, persisted: ensureLoaded().length, lastError };
}

/** Exportable hackathon evidence — genuine persisted records only. */
export function exportAuditJson(): string {
  const list = ensureLoaded();
  return JSON.stringify(
    {
      ledger: AUDIT_STORAGE_KEY,
      exportedAt: new Date().toISOString(),
      sourceModule: AUDIT_SOURCE_MODULE,
      provenance: { engineModified: false, observerOnly: true },
      count: list.length,
      events: list,
    },
    null,
    2,
  );
}
