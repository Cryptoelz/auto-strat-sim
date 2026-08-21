import { describe, it, expect } from 'vitest';
import { SPECIALISTS, buildMarketContext, runAllSpecialists } from '@/lib/specialists/registry';
import { selectChampion } from '@/lib/specialists/selector';
import { emptyStatsMap } from '@/lib/specialists/stats';
import { Candle } from '@/types/trading';

const makeCandles = (n: number, fn: (i: number) => number): Candle[] =>
  Array.from({ length: n }, (_, i) => {
    const close = fn(i);
    return {
      timestamp: 1_700_000_000_000 + i * 900_000,
      open: close * 0.999,
      high: close * 1.004,
      low: close * 0.996,
      close,
      volume: 1000 + (i % 7) * 120,
    } as Candle;
  });

describe('specialist independence', () => {
  const trending = makeCandles(150, (i) => 100 + i * 0.6);
  const ctx = buildMarketContext('BTCUSDT', trending)!;

  it('registers five specialists with unique ids', () => {
    expect(SPECIALISTS).toHaveLength(5);
    expect(new Set(SPECIALISTS.map((s) => s.id)).size).toBe(5);
  });

  it('each specialist returns a full contract-compliant proposal', () => {
    const proposals = runAllSpecialists(ctx);
    expect(proposals).toHaveLength(5);
    proposals.forEach((p) => {
      expect(['BUY', 'SELL', 'WAIT']).toContain(p.signal);
      expect(p.confidence).toBeGreaterThanOrEqual(0);
      expect(p.confidence).toBeLessThanOrEqual(100);
      expect(Array.isArray(p.evidence)).toBe(true);
      expect(p.reasoning.length).toBeGreaterThan(0);
    });
  });

  it('is deterministic and order-independent (no cross-specialist state)', () => {
    const a = runAllSpecialists(ctx);
    const b = [...SPECIALISTS].reverse().map((s) => s.analyse(ctx));
    a.forEach((p) => {
      const match = b.find((q) => q.specialistId === p.specialistId)!;
      expect(match.signal).toBe(p.signal);
      expect(match.confidence).toBe(p.confidence);
    });
  });

  it('produces divergent opinions rather than one shared signal', () => {
    const chop = buildMarketContext('ETHUSDT', makeCandles(150, (i) => 100 + Math.sin(i / 3) * 2))!;
    const signals = new Set(runAllSpecialists(chop).map((p) => p.signal));
    expect(signals.size).toBeGreaterThan(1);
  });

  it('champion selection ranks all proposals and can decline to act', () => {
    const result = selectChampion(runAllSpecialists(ctx), emptyStatsMap());
    expect(result.scores).toHaveLength(5);
    expect(['PROPOSE', 'NO_ACTION']).toContain(result.decision);
    expect(result.explanation.length).toBeGreaterThan(10);
  });
});
