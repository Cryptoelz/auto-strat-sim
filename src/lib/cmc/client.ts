/**
 * CMC Hackathon — transport layer.
 * All CoinMarketCap calls go through the isolated server function so the API key
 * is never present in browser code, bundles, or network responses.
 * Stage 2 adds caching, refresh throttling, 429 handling and stale-data preservation.
 */

import { supabase } from '@/integrations/supabase/client';
import { CMC_ENABLED, CMC_PROXY_FUNCTION } from './config';
import {
  CMC_TTL_MS,
  cacheKey,
  canAttempt,
  isFresh,
  isRateLimitError,
  markAttempt,
  readCache,
  recordStat,
  writeCache,
} from './cache';

export type CmcEndpoint = 'quotes' | 'listings' | 'global' | 'info' | 'fearGreed';

export interface CmcRawResponse {
  data?: unknown;
  status?: { error_message?: string | null };
}

export interface CmcCallResult {
  raw: CmcRawResponse | null;
  error: string | null;
  fromCache: boolean;
  stale: boolean;
  fetchedAt: number | null;
  rateLimited: boolean;
}

export interface CmcCallOptions {
  /** Manual refresh: bypass the TTL (still respects the minimum spacing guard). */
  force?: boolean;
  ttlMs?: number;
}

export async function callCmc(
  endpoint: CmcEndpoint,
  params?: Record<string, string | number | boolean>,
  options: CmcCallOptions = {},
): Promise<CmcCallResult> {
  if (!CMC_ENABLED) {
    return { raw: null, error: 'CMC feature is disabled', fromCache: false, stale: false, fetchedAt: null, rateLimited: false };
  }

  const key = cacheKey(endpoint, params);
  const cached = readCache(key);
  const ttl = options.ttlMs ?? CMC_TTL_MS;

  // Fresh cache hit — no network call, no API credit spent.
  if (!options.force && isFresh(cached, ttl)) {
    recordStat('cache');
    return { raw: cached!.raw as CmcRawResponse, error: null, fromCache: true, stale: false, fetchedAt: cached!.fetchedAt, rateLimited: false };
  }

  // Refresh-spam guard: serve whatever we already hold instead of burning credits.
  if (!canAttempt(key)) {
    recordStat('throttled');
    if (cached) {
      return {
        raw: cached.raw as CmcRawResponse,
        error: null,
        fromCache: true,
        stale: !isFresh(cached, ttl),
        fetchedAt: cached.fetchedAt,
        rateLimited: false,
      };
    }
    return { raw: null, error: 'Refresh throttled — please wait a moment', fromCache: false, stale: false, fetchedAt: null, rateLimited: false };
  }

  markAttempt(key);
  recordStat('network');

  let message: string | null = null;
  try {
    const { data, error } = await supabase.functions.invoke(CMC_PROXY_FUNCTION, {
      body: { endpoint, params },
    });

    if (error) {
      message = error.message || 'CMC request failed';
    } else {
      const payload = data as CmcRawResponse & { error?: string };
      if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
        message = String(payload.error);
      } else if (payload) {
        const entry = writeCache(key, payload);
        return { raw: payload, error: null, fromCache: false, stale: false, fetchedAt: entry.fetchedAt, rateLimited: false };
      } else {
        message = 'Empty CMC response';
      }
    }
  } catch (err) {
    message = err instanceof Error ? err.message : 'CMC request failed';
  }

  const rateLimited = isRateLimitError(message);
  recordStat(rateLimited ? 'rateLimited' : 'error', message ?? undefined);

  // Preserve the last known good snapshot — never substitute simulated data.
  if (cached) {
    return {
      raw: cached.raw as CmcRawResponse,
      error: message,
      fromCache: true,
      stale: true,
      fetchedAt: cached.fetchedAt,
      rateLimited,
    };
  }

  return { raw: null, error: message, fromCache: false, stale: false, fetchedAt: null, rateLimited };
}
