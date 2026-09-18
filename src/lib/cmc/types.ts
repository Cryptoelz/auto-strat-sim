/** CMC Hackathon — normalised types consumed by the CMC UI layer only. */

import type { DataProvenance } from './config';

export interface CmcQuote {
  /** CoinMarketCap numeric ID — preferred internal identifier. */
  cmcId: number | null;
  cmcSymbol: string;
  pairSymbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number | null;
  percentChange1h: number;
  percentChange24h: number;
  percentChange7d: number;
  rank: number | null;
  lastUpdated: string;
  provenance: DataProvenance;
}

export interface CmcGlobalMetrics {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  marketCapChange24h: number;
  volumeChange24h: number;
  lastUpdated: string;
  provenance: DataProvenance;
}

export interface CmcFearGreed {
  value: number;
  classification: string;
  updateTime: string;
  provenance: DataProvenance;
}

export interface CmcResult<T> {
  data: T | null;
  error: string | null;
  fetchedAt: number;
  /** True when the payload came from the local cache rather than a fresh network call. */
  fromCache?: boolean;
  /** True when the cached payload is older than the TTL because a refresh failed. */
  stale?: boolean;
}
