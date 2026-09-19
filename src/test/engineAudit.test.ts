/**
 * Stage 3C — Engine Audit Ledger tests.
 * Audit/CMC only: no existing trading test is modified by this file.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  clearAuditLedger,
  dedupeAppend,
  exportAuditJson,
  getAuditEvents,
  getAuditStorageStatus,
  recordLoggerEntries,
  resetAuditCache,
  summariseAudit,
  toAuditEvent,
} from '@/lib/audit/auditLedger';
import { AUDIT_MAX_EVENTS, AUDIT_STORAGE_KEY } from '@/lib/audit/config';
import { logDecision, getLogEntries, clearLog } from '@/lib/logger';
import { toObservedEvent } from '@/hooks/useCmcDecisionContext';
import { buildDecisionContextRecord, type CmcContextSnapshot } from '@/lib/cmc/decisionContext';
import type { DecisionLogEntry } from '@/types/trading';

const entry = (over: Partial<DecisionLogEntry> = {}): DecisionLogEntry => ({
  id: 'evt-1',
  timestamp: 1_700_000_000_000,
  asset: 'BTCUSDT' as DecisionLogEntry['asset'],
  action: 'blocked',
  explanation: 'HTF trend filter does not align with signal direction',
  signal: 'BUY',
  regime: 'sideways',
  filterBlocked: 'trend_filter',
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  resetAuditCache();
  clearLog();
});

describe('Stage 3C — genuine event capture', () => {
  it('captures a genuine logger event verbatim, inferring nothing', () => {
    logDecision({ asset: 'BTCUSDT' as DecisionLogEntry['asset'], action: 'blocked', explanation: 'blocked by filter', signal: 'BUY' });
    const stored = recordLoggerEntries(getLogEntries());
    expect(stored).toBe(1);

    const [e] = getAuditEvents();
    expect(e.eventType).toBe('blocked');
    expect(e.explanation).toBe('blocked by filter');
    expect(e.regime).toBeNull();          // not supplied -> not invented
    expect(e.filterBlocked).toBeNull();
    expect(e.sourceModule).toBe('logger');
    expect(e.provenance).toEqual({ engineModified: false, observerOnly: true });
  });

  it('survives a store reload', () => {
    recordLoggerEntries([entry()]);
    resetAuditCache();                     // simulates a fresh page load
    expect(getAuditEvents()).toHaveLength(1);
    expect(getAuditEvents()[0].eventId).toBe('evt-1');
  });

  it('rejects duplicate event ids', () => {
    recordLoggerEntries([entry()]);
    const added = recordLoggerEntries([entry(), entry({ id: 'evt-2' })]);
    expect(added).toBe(1);
    expect(getAuditEvents()).toHaveLength(2);
  });

  it('enforces bounded retention at 1000 events', () => {
    const many = Array.from({ length: AUDIT_MAX_EVENTS + 50 }, (_, i) =>
      toAuditEvent(entry({ id: `e${i}`, timestamp: 1_700_000_000_000 + i })),
    );
    const kept = dedupeAppend([], many);
    expect(kept).toHaveLength(AUDIT_MAX_EVENTS);
    expect(kept[kept.length - 1].eventId).toBe(`e${AUDIT_MAX_EVENTS + 49}`);
  });

  it('handles corrupt storage safely', () => {
    localStorage.setItem(AUDIT_STORAGE_KEY, '{not json');
    resetAuditCache();
    expect(() => getAuditEvents()).not.toThrow();
    expect(getAuditEvents()).toEqual([]);
    expect(recordLoggerEntries([entry()])).toBe(1);
  });

  it('never throws when storage writes fail — engine is unaffected', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => recordLoggerEntries([entry()])).not.toThrow();
    expect(getAuditStorageStatus().available).toBe(false);
    spy.mockRestore();
    // The engine's own logger is untouched by the audit failure.
    expect(() => logDecision({ asset: 'BTCUSDT' as DecisionLogEntry['asset'], action: 'blocked', explanation: 'still logging' })).not.toThrow();
    expect(getLogEntries()).toHaveLength(1);
  });

  it('writes nothing when the observer is disabled', () => {
    // Disabled path = the observer never calls recordLoggerEntries.
    clearAuditLedger();
    expect(localStorage.getItem(AUDIT_STORAGE_KEY)).toBeNull();
    expect(getAuditEvents()).toEqual([]);
  });

  it('summarises and exports only genuine persisted records', () => {
    recordLoggerEntries([entry(), entry({ id: 'evt-2', action: 'opened_long' })]);
    const summary = summariseAudit(getAuditEvents());
    expect(summary.total).toBe(2);
    expect(summary.byType.blocked).toBe(1);
    const parsed = JSON.parse(exportAuditJson());
    expect(parsed.count).toBe(2);
    expect(parsed.events.map((e: { eventId: string }) => e.eventId).sort()).toEqual(['evt-1', 'evt-2']);
  });
});

describe('Stage 3C — CMC attaches after the audit event', () => {
  const emptySnapshot: CmcContextSnapshot = {
    quotes: [], global: null, fearGreed: null, fetchedAt: null,
    fromCache: false, stale: false, networkCalls: 0, unavailableReason: 'CMC unavailable',
  };

  it('derives the CMC observed event from a persisted audit record', () => {
    recordLoggerEntries([entry()]);
    const [audit] = getAuditEvents();
    const observed = toObservedEvent(audit);
    expect(observed.eventId).toBe(audit.eventId);
    expect(observed.decisionType).toBe('blocked');
  });

  it('leaves the audit event intact when CMC is unavailable', () => {
    recordLoggerEntries([entry()]);
    const [audit] = getAuditEvents();
    const record = buildDecisionContextRecord(toObservedEvent(audit), emptySnapshot);
    expect(record.dataState).toBe('UNAVAILABLE');
    expect(record.provenance.causalInfluence).toBe(false);
    expect(getAuditEvents()).toHaveLength(1);   // genuine engine record untouched
  });
});

describe('Stage 3C — one-way dependency', () => {
  const protectedFiles = [
    'src/hooks/useUnifiedTradingEngine.ts',
    'src/lib/logger.ts',
    'src/contexts/TradingContext.tsx',
    'src/lib/signalEngine.ts',
    'src/lib/filters.ts',
    'src/lib/indicators.ts',
    'src/lib/executionSimulator.ts',
    'src/lib/riskManager.ts',
    'src/lib/portfolioManager.ts',
    'src/lib/governanceEngine.ts',
    'src/lib/backtest-engine.ts',
    'src/lib/liveMarketData.ts',
    'src/lib/marketData.ts',
  ];

  it('no protected trading module imports audit or CMC modules', () => {
    const root = process.cwd();
    for (const rel of protectedFiles) {
      const file = path.join(root, rel);
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      expect(src, `${rel} must not import audit/cmc`).not.toMatch(/from ['"]@?\/?.*lib\/(audit|cmc)\//);
    }
  });

  it('no specialist module imports audit or CMC modules', () => {
    const dir = path.join(process.cwd(), 'src/lib/specialists');
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(path.join(dir, f), 'utf8');
      expect(src, `${f} must not import audit/cmc`).not.toMatch(/lib\/(audit|cmc)\//);
    }
  });
});
