/**
 * CMC Hackathon — extensible symbol translation layer.
 * Platform (Binance) pair symbols <-> CoinMarketCap base symbols.
 * Add new entries here only; never hard-code mappings elsewhere.
 */

export interface SymbolMapping {
  /** Platform pair symbol, e.g. BTCUSDT */
  pair: string;
  /** CoinMarketCap base symbol, e.g. BTC */
  cmc: string;
  /** Human label */
  name: string;
}

export const SYMBOL_MAP: SymbolMapping[] = [
  { pair: 'BTCUSDT', cmc: 'BTC', name: 'Bitcoin' },
  { pair: 'ETHUSDT', cmc: 'ETH', name: 'Ethereum' },
  { pair: 'SOLUSDT', cmc: 'SOL', name: 'Solana' },
  { pair: 'XRPUSDT', cmc: 'XRP', name: 'XRP' },
  { pair: 'FETUSDT', cmc: 'FET', name: 'Artificial Superintelligence Alliance' },
  { pair: 'XLMUSDT', cmc: 'XLM', name: 'Stellar' },
];

const PAIR_TO_CMC = new Map(SYMBOL_MAP.map((m) => [m.pair.toUpperCase(), m.cmc]));
const CMC_TO_PAIR = new Map(SYMBOL_MAP.map((m) => [m.cmc.toUpperCase(), m.pair]));

/** Generic fallback: strip common quote suffixes (USDT, USDC, USD, BUSD). */
const QUOTE_SUFFIXES = ['USDT', 'USDC', 'BUSD', 'USD'];

export function toCmcSymbol(pair: string): string {
  const key = pair.toUpperCase();
  const mapped = PAIR_TO_CMC.get(key);
  if (mapped) return mapped;
  for (const suffix of QUOTE_SUFFIXES) {
    if (key.endsWith(suffix) && key.length > suffix.length) return key.slice(0, -suffix.length);
  }
  return key;
}

export function toPairSymbol(cmcSymbol: string, quote = 'USDT'): string {
  const key = cmcSymbol.toUpperCase();
  return CMC_TO_PAIR.get(key) ?? `${key}${quote}`;
}

export function defaultCmcSymbols(): string[] {
  return SYMBOL_MAP.map((m) => m.cmc);
}

export function nameForCmcSymbol(cmcSymbol: string): string {
  return SYMBOL_MAP.find((m) => m.cmc === cmcSymbol.toUpperCase())?.name ?? cmcSymbol.toUpperCase();
}
