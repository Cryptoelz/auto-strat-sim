/**
 * CMC Hackathon — read-only enrichment hook.
 * Isolated: no trading, signal, specialist, risk or backtest module consumes this.
 * Stage 2: cache-aware, stale-preserving, refresh-throttled.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { fetchFearGreed, fetchGlobalMetrics, fetchQuotes } from '@/lib/cmc/adapter';
import { CMC_MIN_REFRESH_MS, getCmcRequestStats, isRateLimitError, type CmcRequestStats } from '@/lib/cmc/cache';
import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote } from '@/lib/cmc/types';

export interface CmcEndpointStatus {
  ok: boolean;
  error: string | null;
  stale: boolean;
  fromCache: boolean;
}

export interface CmcMarketDataState {
  quotes: CmcQuote[];
  global: CmcGlobalMetrics | null;
  fearGreed: CmcFearGreed | null;
  loading: boolean;
  error: string | null;
  rateLimited: boolean;
  stale: boolean;
  lastFetched: number | null;
  lastSuccessAt: number | null;
  endpointStatus: Record<'quotes' | 'global' | 'fearGreed', CmcEndpointStatus>;
  stats: CmcRequestStats;
  cooldownMs: number;
  refresh: () => void;
}

const emptyStatus: CmcEndpointStatus = { ok: false, error: null, stale: false, fromCache: false };

export function useCmcMarketData(): CmcMarketDataState {
  const [quotes, setQuotes] = useState<CmcQuote[]>([]);
  const [global, setGlobal] = useState<CmcGlobalMetrics | null>(null);
  const [fearGreed, setFearGreed] = useState<CmcFearGreed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [stale, setStale] = useState(false);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<number | null>(null);
  const [stats, setStats] = useState<CmcRequestStats>(getCmcRequestStats());
  const [cooldownMs, setCooldownMs] = useState(0);
  const [endpointStatus, setEndpointStatus] = useState<Record<'quotes' | 'global' | 'fearGreed', CmcEndpointStatus>>({
    quotes: emptyStatus,
    global: emptyStatus,
    fearGreed: emptyStatus,
  });

  const inFlight = useRef(false);
  const lastRefreshAt = useRef<number>(0);

  const load = useCallback(async (force: boolean) => {
    if (!CMC_ENABLED || inFlight.current) return;

    if (force) {
      const since = Date.now() - lastRefreshAt.current;
      if (lastRefreshAt.current && since < CMC_MIN_REFRESH_MS) {
        setCooldownMs(CMC_MIN_REFRESH_MS - since);
        return;
      }
      lastRefreshAt.current = Date.now();
    }

    inFlight.current = true;
    setLoading(true);
    setCooldownMs(0);

    const options = { force };
    const [q, g, f] = await Promise.all([
      fetchQuotes(undefined, options),
      fetchGlobalMetrics(options),
      fetchFearGreed(options),
    ]);

    // One endpoint failing must not clear the others.
    if (q.data) setQuotes(q.data);
    if (g.data) setGlobal(g.data);
    if (f.data) setFearGreed(f.data);

    setEndpointStatus({
      quotes: { ok: !!q.data && !q.error, error: q.error, stale: !!q.stale, fromCache: !!q.fromCache },
      global: { ok: !!g.data && !g.error, error: g.error, stale: !!g.stale, fromCache: !!g.fromCache },
      fearGreed: { ok: !!f.data && !f.error, error: f.error, stale: !!f.stale, fromCache: !!f.fromCache },
    });

    const errors = [q.error, g.error, f.error].filter((e): e is string => !!e);
    setError(errors.length ? errors[0] : null);
    setRateLimited(errors.some(isRateLimitError));
    setStale(!!(q.stale || g.stale || f.stale));
    setLastFetched(Date.now());
    if (!errors.length) setLastSuccessAt(Date.now());
    setStats(getCmcRequestStats());
    setLoading(false);
    inFlight.current = false;
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    quotes,
    global,
    fearGreed,
    loading,
    error,
    rateLimited,
    stale,
    lastFetched,
    lastSuccessAt,
    endpointStatus,
    stats,
    cooldownMs,
    refresh: () => void load(true),
  };
}
