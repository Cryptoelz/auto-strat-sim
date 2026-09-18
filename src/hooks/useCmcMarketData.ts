/**
 * CMC Hackathon — read-only enrichment hook.
 * Isolated: no trading, signal, specialist, risk or backtest module consumes this.
 */

import { useCallback, useEffect, useState } from 'react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { fetchFearGreed, fetchGlobalMetrics, fetchQuotes } from '@/lib/cmc/adapter';
import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote } from '@/lib/cmc/types';

export interface CmcMarketDataState {
  quotes: CmcQuote[];
  global: CmcGlobalMetrics | null;
  fearGreed: CmcFearGreed | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  refresh: () => void;
}

export function useCmcMarketData(): CmcMarketDataState {
  const [quotes, setQuotes] = useState<CmcQuote[]>([]);
  const [global, setGlobal] = useState<CmcGlobalMetrics | null>(null);
  const [fearGreed, setFearGreed] = useState<CmcFearGreed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!CMC_ENABLED) return;
    setLoading(true);
    setError(null);
    const [q, g, f] = await Promise.all([fetchQuotes(), fetchGlobalMetrics(), fetchFearGreed()]);
    setQuotes(q.data ?? []);
    setGlobal(g.data);
    setFearGreed(f.data);
    const firstError = q.error ?? g.error ?? f.error;
    setError(q.data || g.data || f.data ? null : firstError);
    setLastFetched(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { quotes, global, fearGreed, loading, error, lastFetched, refresh: () => void load() };
}
