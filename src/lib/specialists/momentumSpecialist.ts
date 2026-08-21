import { MarketContext, Specialist, SpecialistProposal, EMPTY_PROPOSAL } from './types';
import { Candle, MarketRegime } from '@/types/trading';

const roc = (closes: number[], period: number) =>
  ((closes[closes.length - 1] - closes[closes.length - 1 - period]) / closes[closes.length - 1 - period]) * 100;

const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / (v.length || 1);

const rangeATR = (c: Candle[], period: number) => {
  const slice = c.slice(-period);
  return avg(slice.map((x) => x.high - x.low));
};

const NAME = 'Momentum Specialist';

export const momentumSpecialist: Specialist = {
  id: 'momentum',
  meta: {
    name: NAME,
    mission: 'Capture acceleration: fast expansion moves with volume confirmation.',
    timeframe: '15m',
    colorToken: 'text-chart-2',
  },
  analyse(ctx: MarketContext): SpecialistProposal {
    const { candles, price } = ctx;
    if (candles.length < 40) return EMPTY_PROPOSAL('momentum', NAME, ctx, 'Insufficient history (needs 40 candles).');

    const closes = candles.map((c) => c.close);
    const roc5 = roc(closes, 5);
    const roc10 = roc(closes, 10);
    const accelerating = Math.abs(roc5) > Math.abs(roc10) / 2 && Math.sign(roc5) === Math.sign(roc10);

    const vols = candles.map((c) => c.volume);
    const volNow = avg(vols.slice(-3));
    const volBase = avg(vols.slice(-30, -3));
    const volRatio = volBase > 0 ? volNow / volBase : 1;

    const window = candles.slice(-11, -1);
    const hi = Math.max(...window.map((c) => c.high));
    const lo = Math.min(...window.map((c) => c.low));
    const brokeUp = price > hi;
    const brokeDown = price < lo;

    const atrNow = rangeATR(candles, 5);
    const atrBase = rangeATR(candles, 30);
    const atrExpanding = atrBase > 0 && atrNow / atrBase > 1.1;

    const evidence = [
      { label: 'ROC(5)', value: `${roc5.toFixed(2)}%`, threshold: '|ROC| > 0.35%', pass: Math.abs(roc5) > 0.35 },
      { label: 'Acceleration', value: accelerating ? 'yes' : 'no', threshold: 'ROC5 accelerating vs ROC10', pass: accelerating },
      { label: 'Volume ratio', value: `${volRatio.toFixed(2)}x`, threshold: '> 1.30x', pass: volRatio > 1.3 },
      { label: '10-candle breakout', value: brokeUp ? 'up' : brokeDown ? 'down' : 'none', threshold: 'break of range', pass: brokeUp || brokeDown },
      { label: 'ATR expansion', value: `${(atrBase ? atrNow / atrBase : 1).toFixed(2)}x`, threshold: '> 1.10x', pass: atrExpanding },
    ];
    const passed = evidence.filter((e) => e.pass).length;

    const signal = passed >= 4 && brokeUp ? 'BUY' : passed >= 4 && brokeDown ? 'SELL' : 'WAIT';
    const regime: MarketRegime = roc10 > 0.5 ? 'trending_bullish' : roc10 < -0.5 ? 'trending_bearish' : 'sideways';
    const confidence = Math.round(Math.min(94, 22 + passed * 14));
    const stop = atrNow * 1.1;

    return {
      specialistId: 'momentum',
      specialistName: NAME,
      asset: ctx.asset,
      regime,
      signal,
      confidence: signal === 'WAIT' ? Math.round(confidence * 0.6) : confidence,
      risk: Math.round(Math.min(95, 40 + volRatio * 10)),
      expectedReward: 1.5,
      expectedValue: Number((((signal === 'WAIT' ? 0 : confidence) / 100) * 1.5 - (1 - confidence / 100)).toFixed(2)),
      suggestedSizePercent: signal === 'WAIT' ? 0 : 2,
      suggestedStop: signal === 'BUY' ? price - stop : signal === 'SELL' ? price + stop : 0,
      suggestedTarget: signal === 'BUY' ? price + stop * 1.5 : signal === 'SELL' ? price - stop * 1.5 : 0,
      evidence,
      reasoning: [
        `Rate of change over 5 candles is ${roc5.toFixed(2)}% with volume at ${volRatio.toFixed(2)}x baseline.`,
        brokeUp || brokeDown
          ? `Price cleared the 10-candle ${brokeUp ? 'high' : 'low'} — acceleration confirmed.`
          : 'Price is still inside the 10-candle range, so no acceleration trigger.',
        signal === 'WAIT'
          ? 'Momentum Specialist waits: expansion criteria not simultaneously met.'
          : 'Tight 1.1x ATR stop with fast 1.5R profit taking.',
      ],
      institutionScore: Math.round((passed / evidence.length) * 100),
      timestamp: ctx.timestamp,
    };
  },
};
