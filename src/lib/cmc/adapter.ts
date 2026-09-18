/**
 * CMC Hackathon — adapter. Normalises raw CoinMarketCap payloads into the
 * platform-neutral shapes in ./types before ANY consumer sees them.
 * Read-only enrichment: nothing here feeds trading, signals, risk, or backtests.
 */

import { callCmc } from './client';
import { defaultCmcSymbols, nameForCmcSymbol, toPairSymbol } from './symbols';
import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote, CmcResult } from './types';

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

interface RawQuoteEntry {
  name?: string;
  symbol?: string;
  cmc_rank?: number;
  last_updated?: string;
  quote?: {
    USD?: {
      price?: number;
      market_cap?: number;
      volume_24h?: number;
      percent_change_1h?: number;
      percent_change_24h?: number;
      percent_change_7d?: number;
      last_updated?: string;
    };
  };
}

export function normaliseQuote(entry: RawQuoteEntry): CmcQuote {
  const usd = entry.quote?.USD ?? {};
  const symbol = (entry.symbol ?? '').toUpperCase();
  return {
    cmcSymbol: symbol,
    pairSymbol: toPairSymbol(symbol),
    name: entry.name ?? nameForCmcSymbol(symbol),
    price: num(usd.price),
    marketCap: num(usd.market_cap),
    volume24h: num(usd.volume_24h),
    percentChange1h: num(usd.percent_change_1h),
    percentChange24h: num(usd.percent_change_24h),
    percentChange7d: num(usd.percent_change_7d),
    rank: typeof entry.cmc_rank === 'number' ? entry.cmc_rank : null,
    lastUpdated: usd.last_updated ?? entry.last_updated ?? '',
    provenance: 'LIVE_CMC',
  };
}

export async function fetchQuotes(symbols: string[] = defaultCmcSymbols()): Promise<CmcResult<CmcQuote[]>> {
  const { raw, error } = await callCmc('quotes', { symbol: symbols.join(','), convert: 'USD' });
  if (error || !raw) return { data: null, error: error ?? 'No CMC data returned', fetchedAt: Date.now() };

  const map = (raw.data ?? {}) as Record<string, RawQuoteEntry | RawQuoteEntry[]>;
  const quotes = symbols
    .map((symbol) => {
      const entry = map[symbol];
      const record = Array.isArray(entry) ? entry[0] : entry;
      return record ? normaliseQuote(record) : null;
    })
    .filter((q): q is CmcQuote => q !== null);

  return { data: quotes, error: null, fetchedAt: Date.now() };
}

export async function fetchGlobalMetrics(): Promise<CmcResult<CmcGlobalMetrics>> {
  const { raw, error } = await callCmc('global', { convert: 'USD' });
  if (error || !raw) return { data: null, error: error ?? 'No CMC data returned', fetchedAt: Date.now() };

  const d = (raw.data ?? {}) as {
    btc_dominance?: number;
    eth_dominance?: number;
    active_cryptocurrencies?: number;
    last_updated?: string;
    quote?: { USD?: { total_market_cap?: number; total_volume_24h?: number; total_market_cap_yesterday_percentage_change?: number } };
  };
  const usd = d.quote?.USD ?? {};

  return {
    data: {
      totalMarketCap: num(usd.total_market_cap),
      totalVolume24h: num(usd.total_volume_24h),
      btcDominance: num(d.btc_dominance),
      ethDominance: num(d.eth_dominance),
      activeCryptocurrencies: num(d.active_cryptocurrencies),
      marketCapChange24h: num(usd.total_market_cap_yesterday_percentage_change),
      lastUpdated: d.last_updated ?? '',
      provenance: 'LIVE_CMC',
    },
    error: null,
    fetchedAt: Date.now(),
  };
}

export async function fetchFearGreed(): Promise<CmcResult<CmcFearGreed>> {
  const { raw, error } = await callCmc('fearGreed');
  if (error || !raw) return { data: null, error: error ?? 'No CMC data returned', fetchedAt: Date.now() };

  const d = (raw.data ?? {}) as { value?: number; value_classification?: string; update_time?: string };
  return {
    data: {
      value: num(d.value),
      classification: d.value_classification ?? 'Unknown',
      updateTime: d.update_time ?? '',
      provenance: 'LIVE_CMC',
    },
    error: null,
    fetchedAt: Date.now(),
  };
}
