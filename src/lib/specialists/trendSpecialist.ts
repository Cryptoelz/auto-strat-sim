import { MarketContext, Specialist, SpecialistProposal, EMPTY_PROPOSAL } from './types';
import { Candle, MarketRegime } from '@/types/trading';

// ─── Own indicators (intentionally local — no shared strategy code) ──────────
const ema = (values: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
};

const sma = (values: number[], period: number): number | null =>
  values.length < period ? null : values.slice(-period).reduce((a, b) => a + b, 0) / period;

const trueRange = (c: Candle[], i: number) =>
  i === 0
    ? c[i].high - c[i].low
    : Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));

const atr = (c: Candle[], period: number): number | null => {
  if (c.length < period + 1) return null;
  let sum = 0;
  for (let i = c.length - period; i < c.length; i++) sum += trueRange(c, i);
  return sum / period;
};

const NAME = 'Trend Specialist';

export const trendSpecialist: Specialist = {
  id: 'trend',
  meta: {
    name: NAME,
    mission: 'Capture sustained directional trends with structural alignment.',
    timeframe: '15m',
    colorToken: 'text-chart-1',
  },
  analyse(ctx: MarketContext): SpecialistProposal {
    const { candles, price } = ctx;
    if (candles.length < 60) return EMPTY_PROPOSAL('trend', NAME, ctx, 'Insufficient history (needs 60 candles).');

    const closes = candles.map((c) => c.close);
    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const fast = ema20[ema20.length - 1];
    const slow = ema50[ema50.length - 1];
    const slopeLookback = 10;
    const slope = ((fast - ema20[ema20.length - 1 - slopeLookback]) / ema20[ema20.length - 1 - slopeLookback]) * 100;
    const anchor = sma(closes, 50) ?? slow;
    const spread = ((fast - slow) / slow) * 100;
    const a = atr(candles, 14) ?? price * 0.005;
    const atrPct = (a / price) * 100;

    const bullish = fast > slow && slope > 0.15 && price > anchor;
    const bearish = fast < slow && slope < -0.15 && price < anchor;
    const regime: MarketRegime = bullish ? 'trending_bullish' : bearish ? 'trending_bearish' : 'sideways';

    const evidence = [
      { label: 'EMA20 vs EMA50', value: `${spread.toFixed(2)}%`, threshold: '|spread| > 0.10%', pass: Math.abs(spread) > 0.1 },
      { label: 'EMA20 slope (10c)', value: `${slope.toFixed(2)}%`, threshold: '|slope| > 0.15%', pass: Math.abs(slope) > 0.15 },
      { label: 'Price vs SMA50 anchor', value: `${(((price - anchor) / anchor) * 100).toFixed(2)}%`, threshold: 'aligned with trend', pass: bullish || bearish },
      { label: 'ATR%', value: `${atrPct.toFixed(2)}%`, threshold: '> 0.20%', pass: atrPct > 0.2 },
    ];

    const passed = evidence.filter((e) => e.pass).length;
    const signal = bullish && atrPct > 0.2 ? 'BUY' : bearish && atrPct > 0.2 ? 'SELL' : 'WAIT';
    const confidence = Math.round(Math.min(96, 30 + passed * 12 + Math.min(18, Math.abs(spread) * 8)));
    const stopDistance = a * 2.2;
    const targetDistance = a * 4.4;

    return {
      specialistId: 'trend',
      specialistName: NAME,
      asset: ctx.asset,
      regime,
      signal,
      confidence: signal === 'WAIT' ? Math.round(confidence * 0.5) : confidence,
      risk: Math.round(Math.min(90, 25 + atrPct * 12)),
      expectedReward: 2,
      expectedValue: Number((((signal === 'WAIT' ? 0 : confidence) / 100) * 2 - (1 - confidence / 100)).toFixed(2)),
      suggestedSizePercent: signal === 'WAIT' ? 0 : Number(Math.max(1.5, Math.min(4, 4 - atrPct)).toFixed(2)),
      suggestedStop: signal === 'BUY' ? price - stopDistance : signal === 'SELL' ? price + stopDistance : 0,
      suggestedTarget: signal === 'BUY' ? price + targetDistance : signal === 'SELL' ? price - targetDistance : 0,
      evidence,
      reasoning: [
        `EMA20 is ${spread >= 0 ? 'above' : 'below'} EMA50 by ${Math.abs(spread).toFixed(2)}%.`,
        `Trend slope over 10 candles is ${slope.toFixed(2)}%, ${Math.abs(slope) > 0.15 ? 'strong enough' : 'too flat'} for a trend entry.`,
        signal === 'WAIT'
          ? 'No sustained trend structure — the Trend Specialist stands aside.'
          : `Structure aligned for a ${signal === 'BUY' ? 'long' : 'short'} with a 2R target at 2.2x ATR risk.`,
      ],
      institutionScore: Math.round((passed / evidence.length) * 100),
      timestamp: ctx.timestamp,
    };
  },
};
