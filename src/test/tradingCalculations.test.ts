/**
 * Regression tests: Trading Calculations (single source of truth)
 */
import { describe, it, expect } from 'vitest';
import {
  computePositionPnl,
  computeUnrealizedPnl,
  computeEquity,
  computeDrawdown,
  computeTotalReturn,
  computeDailyPnl,
  computeTradeStats,
  computeRealizedPnl,
} from '@/lib/tradingCalculations';

describe('computePositionPnl', () => {
  it('computes long profit correctly', () => {
    expect(computePositionPnl(100, 110, 1, 'long')).toBe(10);
  });

  it('computes long loss correctly', () => {
    expect(computePositionPnl(100, 90, 1, 'long')).toBe(-10);
  });

  it('computes short profit correctly', () => {
    expect(computePositionPnl(100, 90, 1, 'short')).toBe(10);
  });

  it('computes short loss correctly', () => {
    expect(computePositionPnl(100, 110, 1, 'short')).toBe(-10);
  });

  it('scales with size', () => {
    expect(computePositionPnl(100, 110, 5, 'long')).toBe(50);
  });

  it('returns 0 when entry equals current', () => {
    expect(computePositionPnl(100, 100, 10, 'long')).toBe(0);
    expect(computePositionPnl(100, 100, 10, 'short')).toBe(0);
  });
});

describe('computeDrawdown', () => {
  it('returns 0 when equity equals peak', () => {
    expect(computeDrawdown(10000, 10000)).toBe(0);
  });

  it('returns correct percentage', () => {
    expect(computeDrawdown(9000, 10000)).toBe(10);
  });

  it('returns 0 when equity exceeds peak', () => {
    expect(computeDrawdown(11000, 10000)).toBe(0);
  });

  it('handles zero peak safely', () => {
    expect(computeDrawdown(5000, 0)).toBe(0);
  });

  it('handles 100% drawdown', () => {
    expect(computeDrawdown(0, 10000)).toBe(100);
  });
});

describe('computeEquity', () => {
  it('returns balance when no positions', () => {
    const positions = { BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null } as any;
    const prices = { BTCUSDT: 50000, XRPUSDT: 1, FETUSDT: 1, XLMUSDT: 0.1 } as any;
    expect(computeEquity(10000, positions, prices)).toBe(10000);
  });

  it('includes unrealized PnL', () => {
    const positions = {
      BTCUSDT: { entryPrice: 100, size: 1, direction: 'long' as const },
      XRPUSDT: null, FETUSDT: null, XLMUSDT: null,
    } as any;
    const prices = { BTCUSDT: 110, XRPUSDT: null, FETUSDT: null, XLMUSDT: null } as any;
    expect(computeEquity(10000, positions, prices)).toBe(10010);
  });
});

describe('computeTotalReturn', () => {
  it('returns correct positive return', () => {
    expect(computeTotalReturn(11000, 10000)).toBe(10);
  });

  it('returns correct negative return', () => {
    expect(computeTotalReturn(9000, 10000)).toBe(-10);
  });

  it('handles zero initial balance', () => {
    expect(computeTotalReturn(100, 0)).toBe(0);
  });
});

describe('computeTradeStats', () => {
  it('returns zeros for empty trades', () => {
    const stats = computeTradeStats([]);
    expect(stats.total).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.profitFactor).toBe(0);
  });

  it('computes win rate correctly', () => {
    const trades = [
      { type: 'win' as const, pnl: 10, direction: 'long' as const },
      { type: 'loss' as const, pnl: -5, direction: 'short' as const },
      { type: 'win' as const, pnl: 15, direction: 'long' as const },
    ] as any;
    const stats = computeTradeStats(trades);
    expect(stats.total).toBe(3);
    expect(stats.wins).toBe(2);
    expect(stats.winRate).toBeCloseTo(66.67, 1);
    expect(stats.longTrades).toBe(2);
    expect(stats.shortTrades).toBe(1);
  });

  it('computes profit factor correctly', () => {
    const trades = [
      { type: 'win' as const, pnl: 30, direction: 'long' as const },
      { type: 'loss' as const, pnl: -10, direction: 'long' as const },
    ] as any;
    const stats = computeTradeStats(trades);
    expect(stats.profitFactor).toBe(3);
  });

  it('returns Infinity profit factor when no losses', () => {
    const trades = [
      { type: 'win' as const, pnl: 10, direction: 'long' as const },
    ] as any;
    const stats = computeTradeStats(trades);
    expect(stats.profitFactor).toBe(Infinity);
  });
});
