import { Asset, Candle } from '@/types/trading';
import { CANDLE_LIMIT } from '@/config/trading';

const BINANCE_API = 'https://api.binance.com/api/v3';

export async function fetchCandles(
  asset: Asset,
  interval: string = '15m',
  limit: number = CANDLE_LIMIT
): Promise<Candle[]> {
  try {
    const response = await fetch(
      `${BINANCE_API}/klines?symbol=${asset}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) throw new Error(`Failed to fetch candles: ${response.statusText}`);

    const data = await response.json();
    return data.map((candle: (string | number)[]) => ({
      timestamp: Number(candle[0]),
      open: parseFloat(candle[1] as string),
      high: parseFloat(candle[2] as string),
      low: parseFloat(candle[3] as string),
      close: parseFloat(candle[4] as string),
      volume: parseFloat(candle[5] as string),
    }));
  } catch (error) {
    console.error(`Error fetching candles for ${asset}:`, error);
    return [];
  }
}

export async function fetchCurrentPrice(asset: Asset): Promise<number | null> {
  try {
    const response = await fetch(`${BINANCE_API}/ticker/price?symbol=${asset}`);
    if (!response.ok) throw new Error(`Failed to fetch price: ${response.statusText}`);
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching price for ${asset}:`, error);
    return null;
  }
}

export async function fetchAllPrices(assets: Asset[]): Promise<Record<Asset, number | null>> {
  const prices = await Promise.all(assets.map(fetchCurrentPrice));
  return assets.reduce((acc, asset, index) => {
    acc[asset] = prices[index];
    return acc;
  }, {} as Record<Asset, number | null>);
}

/**
 * Fetch higher timeframe candles for trend filter
 */
export async function fetchHTFCandles(
  asset: Asset,
  htfInterval: string
): Promise<Candle[]> {
  return fetchCandles(asset, htfInterval, CANDLE_LIMIT);
}
