/**
 * CMC Hackathon — Stage 3B: CMC Decision Context (Option A).
 *
 * Pure, deterministic construction of "what were the CoinMarketCap market
 * conditions at the moment the existing CryptoTrader engine independently
 * produced this decision?".
 *
 * CONTEXT, NEVER CAUSE:
 *  - nothing in this file is imported by any trading, signal, specialist,
 *    risk, portfolio, governance, execution or backtest module;
 *  - records are written AFTER the engine has already decided;
 *  - a missing CMC value is recorded honestly as `null` / UNAVAILABLE and is
 *    never fabricated or substituted.
 */

import { fetchFearGreed, fetchGlobalMetrics, fetchQuotes } from './adapter';
import { computeBreadth } from './intelligence';
import { getCmcRequestStats } from './cache';
import { CMC_ENABLED } from './config';
import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote } from './types';

/** An event observed on the engine's public stream. Read-only input. */
export interface CmcObservedEvent {
  eventId: string;
  timestamp: number;
  asset: string;
  decisionType: string;
  decisionOutcome: string;
  detail?: string;
}

export type ContextDataState = 'LIVE' | 'CACHED' | 'STALE' | 'UNAVAILABLE';

export interface CmcContextValues {
  totalMarketCap: number | null;
  marketCapChange24h: number | null;
  totalVolume24h: number | null;
  volumeChange24h: number | null;
  btcDominance: number | null;
  ethDominance: number | null;
  fearGreedValue: number | null;
  fearGreedClassification: string | null;
  breadth1hPositivePct: number | null;
  breadth24hPositivePct: number | null;
  breadth7dPositivePct: number | null;
  breadthAssetCount: number | null;
  assetCmcRank: number | null;
  assetChange1h: number | null;
  assetChange24h: number | null;
  assetChange7d: number | null;
}

export interface CmcContextProvenance {
  source: 'CoinMarketCap';
  purpose: 'research context';
  causalInfluence: false;
  fetchedAt: number | null;
  snapshotAgeMs: number | null;
  cacheStatus: 'cached' | 'network' | 'unknown';
  stale: boolean;
  unavailableReason: string | null;
}

export interface CmcDecisionContextRecord {
  contextId: string;
  eventId: string;
  timestamp: number;
  asset: string;
  decisionType: string;
  decisionOutcome: string;
  detail: string | null;
  dataState: ContextDataState;
  context: CmcContextValues;
  provenance: CmcContextProvenance;
}

/** A point-in-time copy of the CMC layer, gathered without forcing refreshes. */
export interface CmcContextSnapshot {
  quotes: CmcQuote[];
  global: CmcGlobalMetrics | null;
  fearGreed: CmcFearGreed | null;
  fetchedAt: number | null;
  fromCache: boolean;
  stale: boolean;
  /** Network calls the CMC layer performed while gathering this snapshot. */
  networkCalls: number;
  unavailableReason: string | null;
}

export const EMPTY_CONTEXT: CmcContextValues = {
  totalMarketCap: null,
  marketCapChange24h: null,
  totalVolume24h: null,
  volumeChange24h: null,
  btcDominance: null,
  ethDominance: null,
  fearGreedValue: null,
  fearGreedClassification: null,
  breadth1hPositivePct: null,
  breadth24hPositivePct: null,
  breadth7dPositivePct: null,
  breadthAssetCount: null,
  assetCmcRank: null,
  assetChange1h: null,
  assetChange24h: null,
  assetChange7d: null,
};

/** Maps a platform pair symbol (BTCUSDT / BTC) onto a CMC quote. */
export function quoteForAsset(quotes: CmcQuote[], asset: string): CmcQuote | null {
  const upper = asset.toUpperCase();
  return (
    quotes.find((q) => q.pairSymbol.toUpperCase() === upper) ??
    quotes.find((q) => q.cmcSymbol.toUpperCase() === upper) ??
    quotes.find((q) => upper.startsWith(q.cmcSymbol.toUpperCase())) ??
    null
  );
}

export function resolveDataState(snapshot: CmcContextSnapshot): ContextDataState {
  const hasAny = snapshot.quotes.length > 0 || !!snapshot.global || !!snapshot.fearGreed;
  if (!hasAny) return 'UNAVAILABLE';
  if (snapshot.stale) return 'STALE';
  return snapshot.fromCache ? 'CACHED' : 'LIVE';
}

function pctOf(quotes: CmcQuote[], window: '1h' | '24h' | '7d'): number | null {
  if (!quotes.length) return null;
  const breadth = computeBreadth(quotes);
  const w = breadth.windows.find((x) => x.window === window);
  return w ? w.positivePct : null;
}

/** Pure: builds the immutable record for one observed event. */
export function buildDecisionContextRecord(
  event: CmcObservedEvent,
  snapshot: CmcContextSnapshot,
  now: number = Date.now(),
): CmcDecisionContextRecord {
  const dataState = resolveDataState(snapshot);
  const quote = quoteForAsset(snapshot.quotes, event.asset);

  const context: CmcContextValues =
    dataState === 'UNAVAILABLE'
      ? { ...EMPTY_CONTEXT }
      : {
          totalMarketCap: snapshot.global?.totalMarketCap ?? null,
          marketCapChange24h: snapshot.global?.marketCapChange24h ?? null,
          totalVolume24h: snapshot.global?.totalVolume24h ?? null,
          volumeChange24h: snapshot.global?.volumeChange24h ?? null,
          btcDominance: snapshot.global?.btcDominance ?? null,
          ethDominance: snapshot.global?.ethDominance ?? null,
          fearGreedValue: snapshot.fearGreed?.value ?? null,
          fearGreedClassification: snapshot.fearGreed?.classification ?? null,
          breadth1hPositivePct: pctOf(snapshot.quotes, '1h'),
          breadth24hPositivePct: pctOf(snapshot.quotes, '24h'),
          breadth7dPositivePct: pctOf(snapshot.quotes, '7d'),
          breadthAssetCount: snapshot.quotes.length || null,
          assetCmcRank: quote?.rank ?? null,
          assetChange1h: quote?.percentChange1h ?? null,
          assetChange24h: quote?.percentChange24h ?? null,
          assetChange7d: quote?.percentChange7d ?? null,
        };

  return {
    contextId: `ctx_${event.eventId}`,
    eventId: event.eventId,
    timestamp: event.timestamp,
    asset: event.asset,
    decisionType: event.decisionType,
    decisionOutcome: event.decisionOutcome,
    detail: event.detail ?? null,
    dataState,
    context,
    provenance: {
      source: 'CoinMarketCap',
      purpose: 'research context',
      causalInfluence: false,
      fetchedAt: snapshot.fetchedAt,
      snapshotAgeMs: snapshot.fetchedAt === null ? null : Math.max(0, now - snapshot.fetchedAt),
      cacheStatus: dataState === 'UNAVAILABLE' ? 'unknown' : snapshot.fromCache ? 'cached' : 'network',
      stale: snapshot.stale,
      unavailableReason: dataState === 'UNAVAILABLE' ? snapshot.unavailableReason ?? 'CMC context unavailable' : null,
    },
  };
}

/**
 * Gathers the current CMC snapshot WITHOUT forcing a refresh.
 * With a valid 120s cache this performs zero network calls; the returned
 * `networkCalls` figure is measured, not assumed.
 */
export async function captureContextSnapshot(): Promise<CmcContextSnapshot> {
  if (!CMC_ENABLED) {
    return {
      quotes: [], global: null, fearGreed: null, fetchedAt: null,
      fromCache: false, stale: false, networkCalls: 0,
      unavailableReason: 'CMC module disabled',
    };
  }

  const before = getCmcRequestStats().networkRequests;
  const [q, g, f] = await Promise.all([
    fetchQuotes(undefined, { force: false }),
    fetchGlobalMetrics({ force: false }),
    fetchFearGreed({ force: false }),
  ]);
  const networkCalls = getCmcRequestStats().networkRequests - before;

  const fetchedAtCandidates = [q, g, f].filter((r) => !!r.data).map((r) => r.fetchedAt);
  const errors = [q.error, g.error, f.error].filter((e): e is string => !!e);

  return {
    quotes: q.data ?? [],
    global: g.data ?? null,
    fearGreed: f.data ?? null,
    fetchedAt: fetchedAtCandidates.length ? Math.min(...fetchedAtCandidates) : null,
    fromCache: !!(q.fromCache || g.fromCache || f.fromCache),
    stale: !!(q.stale || g.stale || f.stale),
    networkCalls,
    unavailableReason: errors.length ? errors[0] : null,
  };
}

export interface ContextDiagnostics {
  captured: number;
  cached: number;
  stale: number;
  unavailable: number;
  live: number;
  extraApiCalls: number;
}

export function summariseContexts(
  records: CmcDecisionContextRecord[],
  extraApiCalls: number,
): ContextDiagnostics {
  return {
    captured: records.length,
    cached: records.filter((r) => r.dataState === 'CACHED').length,
    stale: records.filter((r) => r.dataState === 'STALE').length,
    unavailable: records.filter((r) => r.dataState === 'UNAVAILABLE').length,
    live: records.filter((r) => r.dataState === 'LIVE').length,
    extraApiCalls,
  };
}
