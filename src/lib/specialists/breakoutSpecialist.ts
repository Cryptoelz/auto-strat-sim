import { MarketContext, Specialist, SpecialistProposal, EMPTY_PROPOSAL } from './types';
import { Candle, MarketRegime } from '@/types/trading';

const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / (v.length || 1);

const swingLevels = (c: Candle[], lookback: number) => {
  const w = c.slice(-lookback - 1, -1);
  return { high: Math.max(...w.map((x) => x.high)), low: Math.min(...w.map((x) => x.low)) };
};

const NAME = 'Breakout Specialist';

export const breakoutSpecialist: Specialist = {
  id: 'breakout',
  meta: {
    name: NAME,
    mission: 'Trade structural breakouts of established ranges with retest confirmation.',
    timeframe: '15m',
    colorToken: 'text-chart-5',
  },
  analyse(ctx: MarketContext): SpecialistProposal {
    const { candles, price } = ctx;
    if (candles.length < 45) return EMPTY_PROPOSAL('breakout', NAME, ctx, 'Insufficient history (needs 45 candles).');

    const { high, low } = swingLevels(candles, 20);
    const rangePct = ((high - low) / low) * 100;
    const structural = rangePct > 0.8 && rangePct < 12;

    const brokeUp = price > high;
    const brokeDown = price < low;
    const closes = candles.map((c) => c.close);
    const prev = closes[closes.length - 2];
    const retestUp = brokeUp && prev <= high * 1.001;
    const retestDown = brokeDown && prev >= low * 0.999;

    const vols = candles.map((c) => c.volume);
    const volRatio = avg(vols.slice(-30, -1)) > 0 ? vols[vols.length - 1] / avg(vols.slice(-30, -1)) : 1;

    const touchesHigh = candles.slice(-21, -1).filter((c) => c.high >= high * 0.998).length;
    const touchesLow = candles.slice(-21, -1).filter((c) => c.low <= low * 1.002).length;
    const validated = (brokeUp ? touchesHigh : touchesLow) >= 2;

    const evidence = [
      { label: '20-candle range', value: `${rangePct.toFixed(2)}%`, threshold: '0.80% - 12%', pass: structural },
      { label: 'Level break', value: brokeUp ? 'above high' : brokeDown ? 'below low' : 'inside range', threshold: 'range broken', pass: brokeUp || brokeDown },
      { label: 'Level validation', value: `${brokeUp ? touchesHigh : touchesLow} touches`, threshold: '>= 2 touches', pass: validated },
      { label: 'Breakout volume', value: `${volRatio.toFixed(2)}x`, threshold: '> 1.20x', pass: volRatio > 1.2 },
      { label: 'Fresh break (retest zone)', value: retestUp || retestDown ? 'yes' : 'no', threshold: 'break from level', pass: retestUp || retestDown },
    ];
    const passed = evidence.filter((e) => e.pass).length;

    const signal = structural && brokeUp && validated && volRatio > 1.2 ? 'BUY'
      : structural && brokeDown && validated && volRatio > 1.2 ? 'SELL'
      : 'WAIT';
    const regime: MarketRegime = brokeUp ? 'trending_bullish' : brokeDown ? 'trending_bearish' : 'sideways';
    const confidence = Math.round(Math.min(93, 18 + passed * 15));
    const stopDistance = signal === 'BUY' ? Math.max(price - high, price * 0.004) : Math.max(low - price, price * 0.004);

    return {
      specialistId: 'breakout',
      specialistName: NAME,
      asset: ctx.asset,
      regime,
      signal,
      confidence: signal === 'WAIT' ? Math.round(confidence * 0.5) : confidence,
      risk: Math.round(Math.min(90, 35 + rangePct * 3)),
      expectedReward: 2.5,
      expectedValue: Number((((signal === 'WAIT' ? 0 : confidence) / 100) * 2.5 - (1 - confidence / 100)).toFixed(2)),
      suggestedSizePercent: signal === 'WAIT' ? 0 : 2.5,
      suggestedStop: signal === 'BUY' ? price - stopDistance : signal === 'SELL' ? price + stopDistance : 0,
      suggestedTarget: signal === 'BUY' ? price + stopDistance * 2.5 : signal === 'SELL' ? price - stopDistance * 2.5 : 0,
      evidence,
      reasoning: [
        `The 20-candle structure spans ${rangePct.toFixed(2)}% (high ${high.toFixed(4)}, low ${low.toFixed(4)}).`,
        brokeUp || brokeDown
          ? `Price has broken ${brokeUp ? 'above the range high' : 'below the range low'} on ${volRatio.toFixed(2)}x volume.`
          : 'Price remains inside the structure — nothing to trade.',
        signal === 'WAIT' ? 'Breakout Specialist stands aside until a validated level breaks with volume.' : 'Structural break confirmed with a 2.5R target.',
      ],
      institutionScore: Math.round((passed / evidence.length) * 100),
      timestamp: ctx.timestamp,
    };
  },
};
