/** CMC Hackathon — Stage 2 deterministic intelligence calculations. */

import { describe, expect, it } from 'vitest';
import { buildSnapshot, computeBreadth } from '@/lib/cmc/intelligence';
import type { CmcGlobalMetrics, CmcQuote } from '@/lib/cmc/types';

function quote(symbol: string, h1: number, h24: number, d7: number): CmcQuote {
  return {
    cmcId: 1,
    cmcSymbol: symbol,
    pairSymbol: `${symbol}USDT`,
    name: symbol,
    price: 100,
    marketCap: 1000,
    volume24h: 500,
    circulatingSupply: 10,
    percentChange1h: h1,
    percentChange24h: h24,
    percentChange7d: d7,
    rank: 1,
    lastUpdated: '',
    provenance: 'LIVE_CMC',
  };
}

const quotes = [quote('BTC', 1, 2, -3), quote('ETH', -1, -2, 4), quote('SOL', 0, 5, 1), quote('XRP', 2, -1, 0)];

describe('CMC market breadth', () => {
  it('counts positives and negatives per window', () => {
    const breadth = computeBreadth(quotes);
    const h1 = breadth.windows.find((w) => w.window === '1h')!;
    const h24 = breadth.windows.find((w) => w.window === '24h')!;
    const d7 = breadth.windows.find((w) => w.window === '7d')!;

    expect(h1.positive).toBe(2);
    expect(h1.negative).toBe(1);
    expect(h1.flat).toBe(1);
    expect(h24.positive).toBe(2);
    expect(h24.negative).toBe(2);
    expect(h24.positivePct).toBe(50);
    expect(d7.positive).toBe(2);
  });

  it('identifies strongest and weakest 24h assets', () => {
    const breadth = computeBreadth(quotes);
    expect(breadth.strongest24h?.cmcSymbol).toBe('SOL');
    expect(breadth.weakest24h?.cmcSymbol).toBe('ETH');
  });

  it('handles an empty quote set without throwing', () => {
    const breadth = computeBreadth([]);
    expect(breadth.total).toBe(0);
    expect(breadth.strongest24h).toBeNull();
    expect(breadth.windows[0].positivePct).toBe(0);
  });
});

describe('CMC intelligence snapshot', () => {
  const global: CmcGlobalMetrics = {
    totalMarketCap: 2_000_000_000_000,
    totalVolume24h: 90_000_000_000,
    btcDominance: 54.321,
    ethDominance: 12.5,
    activeCryptocurrencies: 9000,
    marketCapChange24h: 1.234,
    volumeChange24h: -5.5,
    lastUpdated: '',
    provenance: 'LIVE_CMC',
  };

  it('derives deterministic text from the displayed values', () => {
    const snap = buildSnapshot(quotes, global, {
      value: 61,
      classification: 'Greed',
      updateTime: '',
      provenance: 'LIVE_CMC',
    });
    expect(snap.sentiment).toBe('Greed (61/100)');
    expect(snap.participation).toBe('2 of 4 tracked assets positive over 24h');
    expect(snap.dominance).toBe('BTC 54.32% · ETH 12.50%');
    expect(snap.breadth).toBe('50% positive / 50% negative (24h)');
    expect(snap.topPerformer).toBe('SOL +5.00%');
    expect(snap.weakestPerformer).toBe('ETH -2.00%');
    expect(snap.volumeChange).toBe('-5.50% total volume (24h)');
  });

  it('reports nulls rather than invented values when data is missing', () => {
    const snap = buildSnapshot([], null, null);
    expect(snap.sentiment).toBeNull();
    expect(snap.dominance).toBeNull();
    expect(snap.topPerformer).toBeNull();
  });
});
