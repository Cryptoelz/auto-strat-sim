import { Specialist, SpecialistId, MarketContext, SpecialistProposal } from './types';
import { trendSpecialist } from './trendSpecialist';
import { momentumSpecialist } from './momentumSpecialist';
import { meanReversionSpecialist } from './meanReversionSpecialist';
import { volatilitySpecialist } from './volatilitySpecialist';
import { breakoutSpecialist } from './breakoutSpecialist';
import { Asset, Candle } from '@/types/trading';

/** All registered specialists. Order is presentation-only. */
export const SPECIALISTS: Specialist[] = [
  trendSpecialist,
  momentumSpecialist,
  meanReversionSpecialist,
  volatilitySpecialist,
  breakoutSpecialist,
];

export const getSpecialist = (id: SpecialistId): Specialist | undefined =>
  SPECIALISTS.find((s) => s.id === id);

export const buildMarketContext = (asset: Asset, candles: Candle[]): MarketContext | null => {
  if (!candles || candles.length === 0) return null;
  const last = candles[candles.length - 1];
  return { asset, candles, price: last.close, timestamp: last.timestamp };
};

/** Runs every specialist independently. No specialist can see another's output. */
export const runAllSpecialists = (ctx: MarketContext): SpecialistProposal[] =>
  SPECIALISTS.map((s) => s.analyse(ctx));
