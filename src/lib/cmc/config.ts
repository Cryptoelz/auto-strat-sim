/**
 * CMC Hackathon — feature flag + configuration.
 * Isolated from all trading/simulation logic. Setting CMC_ENABLED to false
 * removes the entire feature surface (routes, nav entry, data calls).
 */

export const CMC_ENABLED = true;

/** Name of the isolated server function that holds the API key. */
export const CMC_PROXY_FUNCTION = 'cmc-proxy';

/** Data provenance labels — CMC data must never be mixed silently with seeded data. */
export type DataProvenance = 'LIVE_CMC' | 'SEEDED_RESEARCH' | 'LIVE_BINANCE';

export const PROVENANCE_LABEL: Record<DataProvenance, string> = {
  LIVE_CMC: 'LIVE CMC DATA',
  SEEDED_RESEARCH: 'SEEDED / RESEARCH DATA',
  LIVE_BINANCE: 'LIVE BINANCE DATA',
};

/** Stage 1 guarantee: CMC data is read-only enrichment. */
export const CMC_READ_ONLY = true as const;
