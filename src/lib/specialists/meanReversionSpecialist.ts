import { MarketContext, Specialist, SpecialistProposal, EMPTY_PROPOSAL } from './types';
import { MarketRegime } from '@/types/trading';

const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / (v.length || 1);
const stdev = (v: number[]) => {
  const m = mean(v);
  return Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
};

const rsi = (closes: number[], period = 14): number => {
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  if (loss === 0) return 100;
  const rs = gain / period / (loss / period);
  return 100 - 100 / (1 + rs);
};

const NAME = 'Mean Reversion Specialist';

export const meanReversionSpecialist: Specialist = {
  id: 'mean_reversion',
  meta: {
    name: NAME,
    mission: 'Fade stretched moves back toward the statistical anchor.',
    timeframe: '15m',
    colorToken: 'text-chart-3',
  },
  analyse(ctx: MarketContext): SpecialistProposal {
    const { candles, price } = ctx;
    if (candles.length < 40) return EMPTY_PROPOSAL('mean_reversion', NAME, ctx, 'Insufficient history (needs 40 candles).');

    const closes = candles.map((c) => c.close);
    const window = closes.slice(-20);
    const anchor = mean(window);
    const sd = stdev(window);
    const z = sd > 0 ? (price - anchor) / sd : 0;
    const r = rsi(closes, 14);
    const deviation = ((price - anchor) / anchor) * 100;

    // Mean reversion only works when the market is NOT strongly trending.
    const trendStrength = Math.abs((mean(closes.slice(-10)) - mean(closes.slice(-40, -10))) / anchor) * 100;
    const chop = trendStrength < 0.9;

    const evidence = [
      { label: 'Z-score vs SMA20', value: z.toFixed(2), threshold: '|z| > 1.8', pass: Math.abs(z) > 1.8 },
      { label: 'RSI(14)', value: r.toFixed(1), threshold: '< 32 or > 68', pass: r < 32 || r > 68 },
      { label: 'Deviation from anchor', value: `${deviation.toFixed(2)}%`, threshold: '|dev| > 0.8%', pass: Math.abs(deviation) > 0.8 },
      { label: 'Non-trending backdrop', value: `${trendStrength.toFixed(2)}%`, threshold: '< 0.90%', pass: chop },
    ];
    const passed = evidence.filter((e) => e.pass).length;

    const oversold = z < -1.8 && r < 32;
    const overbought = z > 1.8 && r > 68;
    const signal = chop && oversold ? 'BUY' : chop && overbought ? 'SELL' : 'WAIT';
    const regime: MarketRegime = chop ? 'sideways' : deviation > 0 ? 'trending_bullish' : 'trending_bearish';
    const confidence = Math.round(Math.min(90, 25 + passed * 15));
    const stopDistance = Math.abs(price - anchor) * 0.9 || price * 0.008;

    return {
      specialistId: 'mean_reversion',
      specialistName: NAME,
      asset: ctx.asset,
      regime,
      signal,
      confidence: signal === 'WAIT' ? Math.round(confidence * 0.55) : confidence,
      risk: Math.round(Math.min(88, 45 + Math.abs(z) * 8)),
      expectedReward: 1.8,
      expectedValue: Number((((signal === 'WAIT' ? 0 : confidence) / 100) * 1.8 - (1 - confidence / 100)).toFixed(2)),
      suggestedSizePercent: signal === 'WAIT' ? 0 : 2.5,
      suggestedStop: signal === 'BUY' ? price - stopDistance : signal === 'SELL' ? price + stopDistance : 0,
      suggestedTarget: signal === 'WAIT' ? 0 : anchor,
      evidence,
      reasoning: [
        `Price sits ${deviation.toFixed(2)}% from the 20-candle anchor (z = ${z.toFixed(2)}), RSI ${r.toFixed(1)}.`,
        chop ? 'Backdrop is range-bound, which is where this specialist has edge.' : 'Backdrop is trending — fading it is not permitted by this specialist.',
        signal === 'WAIT' ? 'No stretched condition to fade.' : `Fading back toward the anchor as target.`,
      ],
      institutionScore: Math.round((passed / evidence.length) * 100),
      timestamp: ctx.timestamp,
    };
  },
};
