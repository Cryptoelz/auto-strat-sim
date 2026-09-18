/**
 * CMC Hackathon — Stage 2 cache + API credit protection.
 * Pure client-side memoisation of proxy responses. Holds no key material.
 * Never fabricates data: a miss with a failed request returns an error, not a stand-in.
 */

export const CMC_TTL_MS = 120_000; // serve cached payloads for 2 minutes
export const CMC_MIN_REFRESH_MS = 15_000; // minimum spacing between network calls per key

export interface CmcCacheEntry {
  raw: unknown;
  fetchedAt: number;
}

export interface CmcRequestStats {
  networkRequests: number;
  cacheHits: number;
  throttled: number;
  errors: number;
  rateLimited: number;
  lastRequestAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
}

const entries = new Map<string, CmcCacheEntry>();
const lastAttemptAt = new Map<string, number>();

const stats: CmcRequestStats = {
  networkRequests: 0,
  cacheHits: 0,
  throttled: 0,
  errors: 0,
  rateLimited: 0,
  lastRequestAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
};

export function cacheKey(endpoint: string, params?: Record<string, unknown>): string {
  return params && Object.keys(params).length ? `${endpoint}:${JSON.stringify(params)}` : endpoint;
}

export function readCache(key: string): CmcCacheEntry | null {
  return entries.get(key) ?? null;
}

export function writeCache(key: string, raw: unknown): CmcCacheEntry {
  const entry: CmcCacheEntry = { raw, fetchedAt: Date.now() };
  entries.set(key, entry);
  return entry;
}

export function isFresh(entry: CmcCacheEntry | null, ttl = CMC_TTL_MS): boolean {
  return !!entry && Date.now() - entry.fetchedAt < ttl;
}

/** True when a network call for this key is allowed right now. */
export function canAttempt(key: string, minInterval = CMC_MIN_REFRESH_MS): boolean {
  const last = lastAttemptAt.get(key);
  return last === undefined || Date.now() - last >= minInterval;
}

export function markAttempt(key: string): void {
  lastAttemptAt.set(key, Date.now());
}

export function isRateLimitError(message: string | null | undefined): boolean {
  if (!message) return false;
  return /429|rate limit|too many requests/i.test(message);
}

export function recordStat(kind: 'network' | 'cache' | 'throttled' | 'error' | 'rateLimited', message?: string): void {
  switch (kind) {
    case 'network':
      stats.networkRequests += 1;
      stats.lastRequestAt = Date.now();
      break;
    case 'cache':
      stats.cacheHits += 1;
      break;
    case 'throttled':
      stats.throttled += 1;
      break;
    case 'rateLimited':
      stats.rateLimited += 1;
      stats.errors += 1;
      stats.lastErrorAt = Date.now();
      stats.lastErrorMessage = message ?? 'Rate limited';
      break;
    case 'error':
      stats.errors += 1;
      stats.lastErrorAt = Date.now();
      stats.lastErrorMessage = message ?? 'Unknown error';
      break;
  }
}

export function getCmcRequestStats(): CmcRequestStats {
  return { ...stats };
}

/** Test/diagnostic helper — clears cached payloads and throttle timers. */
export function resetCmcCache(): void {
  entries.clear();
  lastAttemptAt.clear();
}
