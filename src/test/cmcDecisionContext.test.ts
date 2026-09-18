/**
 * CMC Hackathon — Stage 3B tests.
 * CMC-only: no existing trading test is modified by this file.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  buildDecisionContextRecord,
  resolveDataState,
  summariseContexts,
  quoteForAsset,
  type CmcContextSnapshot,
  type CmcObservedEvent,
} from '@/lib/cmc/decisionContext';
import {
  appendContextRecords,
  clearContextState,
  loadContextState,
  saveContextState,
  CMC_CONTEXT_STORAGE_KEY,
} from '@/lib/cmc/contextStore';
import { isolationVerified, PROTECTED_STORAGE_KEYS } from '@/lib/cmc/isolationCheck';
import type { CmcQuote } from '@/lib/cmc/types';

const quote = (symbol: string, over: Partial<CmcQuote> = {}): CmcQuote => ({
  cmcId: 1,
  cmcSymbol: symbol,
  pairSymbol: `${symbol}USDT`,
  name: symbol,
  price: 100,
  marketCap: 1_000,
  volume24h: 500,
  circulatingSupply: 10,
  percentChange1h: 0.5,
  percentChange24h: 1.5,
  percentChange7d: -2,
  rank: 1,
  lastUpdated: '2026-01-01T00:00:00Z',
  provenance: 'LIVE_CMC',
  ...over,
});

const snapshot = (over: Partial<CmcContextSnapshot> = {}): CmcContextSnapshot => ({
  quotes: [quote('BTC'), quote('ETH', { percentChange24h: -1, rank: 2 })],
  global: {
    totalMarketCap: 3e12,
    totalVolume24h: 1e11,
    btcDominance: 58.5,
    ethDominance: 11.2,
    activeCryptocurrencies: 100,
    marketCapChange24h: 1.1,
    volumeChange24h: -3.2,
    lastUpdated: '2026-01-01T00:00:00Z',
    provenance: 'LIVE_CMC',
  },
  fearGreed: { value: 68, classification: 'Greed', updateTime: '2026-01-01T00:00:00Z', provenance: 'LIVE_CMC' },
  fetchedAt: 1_000_000,
  fromCache: true,
  stale: false,
  networkCalls: 0,
  unavailableReason: null,
  ...over,
});

const event: CmcObservedEvent = {
  eventId: 'attempt_1',
  timestamp: 1_000_500,
  asset: 'BTCUSDT',
  decisionType: 'LONG entry attempt',
  decisionOutcome: 'executed',
  detail: 'all gates passed',
};

describe('CMC Decision Context — observer capture', () => {
  it('captures an observed engine decision with its CMC context', () => {
    const record = buildDecisionContextRecord(event, snapshot(), 1_060_000);
    expect(record.eventId).toBe('attempt_1');
    expect(record.asset).toBe('BTCUSDT');
    expect(record.decisionOutcome).toBe('executed');
    expect(record.context.btcDominance).toBe(58.5);
    expect(record.context.fearGreedValue).toBe(68);
    expect(record.context.assetCmcRank).toBe(1);
    expect(record.context.assetChange24h).toBe(1.5);
    expect(record.provenance.causalInfluence).toBe(false);
    expect(record.provenance.source).toBe('CoinMarketCap');
    expect(record.provenance.snapshotAgeMs).toBe(60_000);
  });

  it('resolves the platform pair symbol onto the right CMC quote', () => {
    expect(quoteForAsset([quote('BTC'), quote('XRP')], 'XRPUSDT')?.cmcSymbol).toBe('XRP');
  });
});

describe('CMC Decision Context — data states', () => {
  it('labels a cached snapshot as CACHED and counts no extra API call', () => {
    const s = snapshot({ fromCache: true, networkCalls: 0 });
    expect(resolveDataState(s)).toBe('CACHED');
    const record = buildDecisionContextRecord(event, s);
    expect(record.provenance.cacheStatus).toBe('cached');
    expect(summariseContexts([record], s.networkCalls).extraApiCalls).toBe(0);
  });

  it('labels a stale snapshot correctly and keeps the stale flag', () => {
    const record = buildDecisionContextRecord(event, snapshot({ stale: true }));
    expect(record.dataState).toBe('STALE');
    expect(record.provenance.stale).toBe(true);
  });

  it('records unavailable context honestly instead of fabricating values', () => {
    const record = buildDecisionContextRecord(
      event,
      snapshot({ quotes: [], global: null, fearGreed: null, fetchedAt: null, unavailableReason: 'API unavailable' }),
    );
    expect(record.dataState).toBe('UNAVAILABLE');
    expect(record.context.btcDominance).toBeNull();
    expect(record.context.fearGreedValue).toBeNull();
    expect(record.provenance.unavailableReason).toBe('API unavailable');
    // The decision itself is still recorded — trading is unaffected.
    expect(record.decisionOutcome).toBe('executed');
  });
});

describe('CMC Decision Context — storage', () => {
  beforeEach(() => clearContextState());

  it('does not create a duplicate record for the same event', () => {
    const record = buildDecisionContextRecord(event, snapshot());
    let state = appendContextRecords({ records: [], extraApiCalls: 0 }, [record]);
    state = appendContextRecords(state, [record]);
    expect(state.records).toHaveLength(1);
  });

  it('persists to the CMC-owned namespace only', () => {
    const record = buildDecisionContextRecord(event, snapshot());
    saveContextState({ records: [record], extraApiCalls: 0 });
    expect(loadContextState().records).toHaveLength(1);
    expect(CMC_CONTEXT_STORAGE_KEY).toBe('atlas_cmc_context_v1');
    for (const key of PROTECTED_STORAGE_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});

describe('CMC Decision Context — feature flag', () => {
  afterEach(() => vi.resetModules());

  it('captures nothing and performs no network activity when CMC is disabled', async () => {
    vi.resetModules();
    vi.doMock('@/lib/cmc/config', async () => {
      const actual = await vi.importActual<typeof import('@/lib/cmc/config')>('@/lib/cmc/config');
      return { ...actual, CMC_ENABLED: false };
    });
    const { captureContextSnapshot } = await import('@/lib/cmc/decisionContext');
    const result = await captureContextSnapshot();
    expect(result.networkCalls).toBe(0);
    expect(result.quotes).toHaveLength(0);
    expect(result.unavailableReason).toBe('CMC module disabled');
    vi.doUnmock('@/lib/cmc/config');
  });
});

describe('CMC Decision Context — isolation', () => {
  const root = path.resolve(__dirname, '..');
  const PROTECTED_FILES = [
    'hooks/useUnifiedTradingEngine.ts',
    'lib/signalEngine.ts',
    'lib/riskManager.ts',
    'lib/portfolioManager.ts',
    'lib/governanceEngine.ts',
    'lib/executionSimulator.ts',
    'contexts/TradingContext.tsx',
    'lib/specialists/attribution.ts',
    'lib/specialists/registry.ts',
  ];

  it('is never imported by protected trading modules', () => {
    for (const rel of PROTECTED_FILES) {
      const file = path.join(root, rel);
      if (!fs.existsSync(file)) continue;
      const source = fs.readFileSync(file, 'utf8');
      expect(/from ['"][^'"]*cmc/i.test(source), `${rel} must not import CMC`).toBe(false);
    }
  });

  it('exposes no API key in client source', () => {
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : [];
      });
    const offenders = walk(path.join(root, 'lib', 'cmc')).filter((f) =>
      /CMC_API_KEY|X-CMC_PRO_API_KEY/i.test(fs.readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('reports isolation verified for well-formed records', () => {
    expect(isolationVerified([buildDecisionContextRecord(event, snapshot())])).toBe(true);
  });
});
