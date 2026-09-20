/**
 * Stage 3D — CMC Evidence Summary tests.
 * Read-only aggregation: no trading test is modified by this file.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  buildEvidenceBundle,
  classifyEvents,
  computeEvidenceTotals,
  evidenceJson,
  CMC_INPUTS,
  RETROSPECTIVE_LABEL,
  type EvidenceInput,
} from '@/lib/cmc/evidence';
import { CMC_EVIDENCE_ENABLED } from '@/lib/cmc/evidenceConfig';
import { getCmcRequestStats } from '@/lib/cmc/cache';
import { CMC_CONTEXT_STORAGE_KEY, loadContextState } from '@/lib/cmc/contextStore';
import type { CmcDecisionContextRecord } from '@/lib/cmc/decisionContext';
import { EMPTY_CONTEXT } from '@/lib/cmc/decisionContext';
import type { EngineAuditEvent } from '@/lib/audit/types';

const liveEvent = (over: Partial<EngineAuditEvent> = {}): EngineAuditEvent => ({
  eventId: 'e-1',
  timestamp: 1_700_000_000_000,
  asset: 'BTCUSDT',
  eventType: 'opened_long',
  signal: 'long',
  explanation: 'engine reason',
  regime: 'bullish',
  filterBlocked: null,
  sourceModule: 'logger',
  backfilled: false,
  contextContemporaneous: true,
  capturedAt: 1_700_000_000_500,
  provenance: { engineModified: false, observerOnly: true },
  ...over,
});

const backfilledEvent = (over: Partial<EngineAuditEvent> = {}): EngineAuditEvent =>
  liveEvent({
    eventId: 'trade:t-1',
    asset: 'SOLUSDT',
    eventType: 'closed_long',
    sourceModule: 'trades',
    backfilled: true,
    contextContemporaneous: false,
    ...over,
  });

const contextRecord = (over: Partial<CmcDecisionContextRecord> = {}): CmcDecisionContextRecord => ({
  contextId: 'ctx_e-1',
  eventId: 'e-1',
  timestamp: 1_700_000_000_000,
  asset: 'BTCUSDT',
  decisionType: 'opened_long',
  decisionOutcome: 'long',
  detail: null,
  dataState: 'LIVE',
  context: { ...EMPTY_CONTEXT, btcDominance: 52.4, fearGreedValue: 61 },
  provenance: {
    source: 'CoinMarketCap',
    purpose: 'research context',
    causalInfluence: false,
    fetchedAt: 1_700_000_000_000,
    snapshotAgeMs: 0,
    cacheStatus: 'cached',
    stale: false,
    unavailableReason: null,
  },
  ...over,
});

const input = (over: Partial<EvidenceInput> = {}): EvidenceInput => ({
  auditEvents: [liveEvent(), backfilledEvent()],
  contextRecords: [contextRecord()],
  extraApiCalls: 0,
  requestStats: getCmcRequestStats(),
  storage: { available: true, persisted: 2, lastError: null },
  now: 1_700_000_100_000,
  ...over,
});

describe('Stage 3D — evidence totals', () => {
  it('computes correct evidence totals', () => {
    const t = computeEvidenceTotals([liveEvent(), backfilledEvent()], [contextRecord()]);
    expect(t.totalAuditEvents).toBe(2);
    expect(t.liveLoggerEvents).toBe(1);
    expect(t.backfilledCompletedTrades).toBe(1);
    expect(t.contemporaneousContextRecords).toBe(1);
    expect(t.retrospectiveRecords).toBe(1);
    expect(t.assets).toEqual(['BTCUSDT', 'SOLUSDT']);
    expect(t.contextByState.LIVE).toBe(1);
  });

  it('classifies live logger events and backfilled completed trades distinctly', () => {
    const [live, backfilled] = classifyEvents([liveEvent(), backfilledEvent()], [contextRecord()]);
    expect(live.classification).toBe('LIVE LOGGER EVENT');
    expect(live.contextStatus).toBe('LIVE');
    expect(backfilled.classification).toBe('BACKFILLED COMPLETED TRADE');
    expect(backfilled.contextStatus).toBe('RETROSPECTIVE');
    expect(backfilled.contextLabel).toBe(RETROSPECTIVE_LABEL);
  });

  it('never gives a retrospective record fabricated CMC context', () => {
    // a context record wrongly keyed to a backfilled event must still be ignored
    const rogue = contextRecord({ contextId: 'ctx_trade:t-1', eventId: 'trade:t-1', dataState: 'LIVE' });
    const [result] = classifyEvents([backfilledEvent()], [rogue]);
    expect(result.contextStatus).toBe('RETROSPECTIVE');
    expect(result.contextLabel).toBe(RETROSPECTIVE_LABEL);
  });

  it('keeps unavailable values unavailable', () => {
    const unavailable = contextRecord({ dataState: 'UNAVAILABLE', context: { ...EMPTY_CONTEXT } });
    const bundle = buildEvidenceBundle(input({ contextRecords: [unavailable] }));
    expect(bundle.totals.contextByState.UNAVAILABLE).toBe(1);
    expect(bundle.contextRecords[0].context.btcDominance).toBeNull();
    expect(bundle.classifications[0].contextLabel).toBe('CMC CONTEXT: UNAVAILABLE');
  });
});

describe('Stage 3D — evidence export', () => {
  it('exports the correct evidence', () => {
    const bundle = buildEvidenceBundle(input());
    const parsed = JSON.parse(evidenceJson(bundle));
    expect(parsed.stage).toContain('Stage 3D');
    expect(parsed.totals.totalAuditEvents).toBe(2);
    expect(parsed.classifications).toHaveLength(2);
    expect(parsed.contextRecords).toHaveLength(1);
    expect(parsed.integrity.causalInfluence).toBe(false);
    expect(parsed.integrity.protectedModulesModified).toBe(false);
    expect(parsed.configuration.cmcInputs).toHaveLength(CMC_INPUTS.length);
    expect(Array.isArray(parsed.limitations)).toBe(true);
    expect(parsed.disclaimer).toContain('not a claim of statistical trading performance');
  });

  it('exports no API key, secret or credential', () => {
    const json = evidenceJson(buildEvidenceBundle(input())).toLowerCase();
    for (const forbidden of ['api_key', 'apikey', 'x-cmc_pro_api_key', 'secret', 'password', 'credential', 'service_role']) {
      expect(json).not.toContain(forbidden);
    }
  });

  it('makes zero network calls while aggregating', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const before = getCmcRequestStats().networkRequests;
    buildEvidenceBundle(input());
    evidenceJson(buildEvidenceBundle(input()));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getCmcRequestStats().networkRequests).toBe(before);
    fetchSpy.mockRestore();
  });
});

describe('Stage 3D — resilience and flag', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('renders safely with empty storage', () => {
    const bundle = buildEvidenceBundle(input({ auditEvents: [], contextRecords: [], storage: { available: true, persisted: 0, lastError: null } }));
    expect(bundle.totals.totalAuditEvents).toBe(0);
    expect(bundle.totals.assets).toEqual([]);
    expect(bundle.totals.latestEventAt).toBeNull();
    expect(bundle.classifications).toEqual([]);
  });

  it('renders safely with corrupt storage', () => {
    localStorage.setItem(CMC_CONTEXT_STORAGE_KEY, '{not json');
    const state = loadContextState();
    expect(state.records).toEqual([]);
    const bundle = buildEvidenceBundle(input({ contextRecords: state.records }));
    expect(bundle.totals.contemporaneousContextRecords).toBe(0);
  });

  it('is controlled by a dedicated feature flag', () => {
    expect(typeof CMC_EVIDENCE_ENABLED).toBe('boolean');
    const page = fs.readFileSync(path.join(process.cwd(), 'src/pages/cmc/CmcEvidence.tsx'), 'utf8');
    expect(page).toMatch(/CMC_EVIDENCE_ENABLED/);
    const app = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
    expect(app).toMatch(/CMC_EVIDENCE_ENABLED && <Route path="\/cmc\/evidence"/);
  });

  it('keeps the protected-module import boundary intact', () => {
    const protectedFiles = [
      'src/hooks/useUnifiedTradingEngine.ts',
      'src/lib/logger.ts',
      'src/contexts/TradingContext.tsx',
      'src/lib/signalEngine.ts',
      'src/lib/executionSimulator.ts',
      'src/lib/riskManager.ts',
      'src/lib/portfolioManager.ts',
      'src/lib/governanceEngine.ts',
    ];
    for (const rel of protectedFiles) {
      const file = path.join(process.cwd(), rel);
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      expect(src, `${rel} must not import evidence/cmc/audit`).not.toMatch(/lib\/(audit|cmc)\//);
    }
    // the evidence module itself must not import engine modules
    const evidence = fs.readFileSync(path.join(process.cwd(), 'src/lib/cmc/evidence.ts'), 'utf8');
    expect(evidence).not.toMatch(/signalEngine|executionSimulator|riskManager|useUnifiedTradingEngine/);
  });
});
