/**
 * CMC Hackathon — Stage 2 intelligence calculations.
 * Deterministic, arithmetic-only derivations from displayed CMC values.
 * No LLM commentary, no recommendations, no trading semantics.
 * Read-only: nothing here is imported by trading, signal, risk or backtest code.
 */

import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote } from './types';

export type BreadthWindow = '1h' | '24h' | '7d';

export interface BreadthWindowStats {
  window: BreadthWindow;
  positive: number;
  negative: number;
  flat: number;
  total: number;
  positivePct: number;
  negativePct: number;
}

export interface MarketBreadth {
  windows: BreadthWindowStats[];
  strongest24h: CmcQuote | null;
  weakest24h: CmcQuote | null;
  total: number;
}

export function changeFor(quote: CmcQuote, window: BreadthWindow): number {
  if (window === '1h') return quote.percentChange1h;
  if (window === '7d') return quote.percentChange7d;
  return quote.percentChange24h;
}

function windowStats(quotes: CmcQuote[], window: BreadthWindow): BreadthWindowStats {
  const total = quotes.length;
  let positive = 0;
  let negative = 0;
  for (const q of quotes) {
    const change = changeFor(q, window);
    if (change > 0) positive += 1;
    else if (change < 0) negative += 1;
  }
  const flat = total - positive - negative;
  return {
    window,
    positive,
    negative,
    flat,
    total,
    positivePct: total ? (positive / total) * 100 : 0,
    negativePct: total ? (negative / total) * 100 : 0,
  };
}

export function computeBreadth(quotes: CmcQuote[]): MarketBreadth {
  const windows: BreadthWindow[] = ['1h', '24h', '7d'];
  const sorted = [...quotes].sort((a, b) => b.percentChange24h - a.percentChange24h);
  return {
    windows: windows.map((w) => windowStats(quotes, w)),
    strongest24h: sorted[0] ?? null,
    weakest24h: sorted.length ? sorted[sorted.length - 1] : null,
    total: quotes.length,
  };
}

export interface IntelligenceSnapshot {
  sentiment: string | null;
  participation: string | null;
  dominance: string | null;
  breadth: string | null;
  topPerformer: string | null;
  weakestPerformer: string | null;
  marketCapChange: string | null;
  volumeChange: string | null;
}

const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

export function buildSnapshot(
  quotes: CmcQuote[],
  global: CmcGlobalMetrics | null,
  fearGreed: CmcFearGreed | null,
): IntelligenceSnapshot {
  const breadth = computeBreadth(quotes);
  const day = breadth.windows.find((w) => w.window === '24h') ?? null;

  return {
    sentiment: fearGreed ? `${fearGreed.classification} (${fearGreed.value}/100)` : null,
    participation: day && day.total ? `${day.positive} of ${day.total} tracked assets positive over 24h` : null,
    dominance: global ? `BTC ${global.btcDominance.toFixed(2)}% · ETH ${global.ethDominance.toFixed(2)}%` : null,
    breadth: day && day.total ? `${day.positivePct.toFixed(0)}% positive / ${day.negativePct.toFixed(0)}% negative (24h)` : null,
    topPerformer: breadth.strongest24h
      ? `${breadth.strongest24h.cmcSymbol} ${pct(breadth.strongest24h.percentChange24h)}`
      : null,
    weakestPerformer: breadth.weakest24h
      ? `${breadth.weakest24h.cmcSymbol} ${pct(breadth.weakest24h.percentChange24h)}`
      : null,
    marketCapChange: global ? `${pct(global.marketCapChange24h)} total market cap (24h)` : null,
    volumeChange: global ? `${pct(global.volumeChange24h)} total volume (24h)` : null,
  };
}
