import { MarketContext, Specialist, SpecialistProposal, EMPTY_PROPOSAL } from './types';
import { Candle, MarketRegime } from '@/types/trading';

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / (v.length || 1);
const stdev = (v: number[]) => {
  const m = mean(v);
  return Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
};

const tr = (c: Candle[], i: number) =>
  i === 0
    ? c[i].high - c[i].low
    : Math.max(c[i].high - c[i].low, Math.abs(c[i].high - c[i - 1].close), Math.abs(c[i].low - c[i - 1].close));

const atrSeries = (c: Candle[], period: number): number[] => {
  const out: number[] = [];
  for (let i = period; i < c.length; i++) {
    let s = 0;
    for (let j = i - period + 1; j <= i; j++) s += tr(c, j);
    out.push(s / period);
  }
  return out;
};

const NAME = 'Volatility Specialist';

export const volatilitySpecialist: Specialist = {
  id: 'volatility',
  meta: {
    name: NAME,
    mission: 'Detect volatility compression and trade the expansion out of it.',
    timeframe: '15m',
    colorToken: 'text-chart-4',
  },
  analyse(ctx: MarketContext): SpecialistProposal {
    const { candles, price } = ctx;
    if (candles.length < 50) return EMPTY_PROPOSAL('volatility', NAME, ctx, 'Insufficient history (needs 50 candles).');

    const series = atrSeries(candles, 14);
    const atrNow = series[series.length - 1];
    const atrAvg = mean(series);
    const compressionRatio = atrAvg > 0 ? atrNow / atrAvg : 1;

    const closes = candles.map((c) => c.close);
    const bbWindow = closes.slice(-20);
    const bbMid = mean(bbWindow);
    const bbSd = stdev(bbWindow);
    const bbWidth = bbMid > 0 ? ((bbSd * 4) / bbMid) * 100 : 0;

    // rank current BB width against the last 40 rolling widths
    const widths: number[] = [];
    for (let i = 20; i <= closes.length; i++) {
      const w = closes.slice(i - 20, i);
      const m = mean(w);
      widths.push(m > 0 ? ((stdev(w) * 4) / m) * 100 : 0);
    }
    const rank = widths.filter((w) => w < bbWidth).length / widths.length;

    const compressed = compressionRatio < 0.8 || rank < 0.25;
    const expanding = series.length > 3 && atrNow / series[series.length - 4] > 1.15;

    const window = candles.slice(-21, -1);
    const hi = Math.max(...window.map((c) => c.high));
    const lo = Math.min(...window.map((c) => c.low));
    const dirUp = price > hi;
    const dirDown = price < lo;

    const evidence = [
      { label: 'ATR vs 14-period average', value: `${(compressionRatio * 100).toFixed(0)}%`, threshold: '< 80% (compression)', pass: compressionRatio < 0.8 },
      { label: 'BB width percentile', value: `${(rank * 100).toFixed(0)}%`, threshold: 'lowest 25%', pass: rank < 0.25 },
      { label: 'ATR expansion', value: expanding ? 'yes' : 'no', threshold: '> 1.15x over 3 candles', pass: expanding },
      { label: 'Directional resolution', value: dirUp ? 'up' : dirDown ? 'down' : 'undecided', threshold: 'range resolved', pass: dirUp || dirDown },
    ];
    const passed = evidence.filter((e) => e.pass).length;

    const armed = compressed && expanding;
    const signal = armed && dirUp ? 'BUY' : armed && dirDown ? 'SELL' : 'WAIT';
    const regime: MarketRegime = compressed ? 'sideways' : dirUp ? 'trending_bullish' : dirDown ? 'trending_bearish' : 'sideways';
    const confidence = Math.round(Math.min(95, 20 + passed * 16 + (compressed ? 6 : 0)));

    return {
      specialistId: 'volatility',
      specialistName: NAME,
      asset: ctx.asset,
      regime,
      signal,
      confidence: signal === 'WAIT' ? Math.round(confidence * 0.5) : confidence,
      risk: Math.round(Math.min(85, 30 + compressionRatio * 20)),
      expectedReward: 3,
      expectedValue: Number((((signal === 'WAIT' ? 0 : confidence) / 100) * 3 - (1 - confidence / 100)).toFixed(2)),
      suggestedSizePercent: signal === 'WAIT' ? 0 : 2,
      suggestedStop: signal === 'BUY' ? price - atrNow : signal === 'SELL' ? price + atrNow : 0,
      suggestedTarget: signal === 'BUY' ? price + atrNow * 3 : signal === 'SELL' ? price - atrNow * 3 : 0,
      evidence,
      reasoning: [
        `ATR is at ${(compressionRatio * 100).toFixed(0)}% of its average and BB width sits in the ${(rank * 100).toFixed(0)}th percentile.`,
        compressed ? 'Market is coiled — the specialist is armed and watching for expansion.' : 'No compression present, so there is no coil to trade.',
        signal === 'WAIT' ? 'Waiting for expansion with a directional resolution.' : 'Expansion confirmed: 1 ATR stop, 3R target.',
      ],
      institutionScore: Math.round((passed / evidence.length) * 100),
      timestamp: ctx.timestamp,
    };
  },
};
