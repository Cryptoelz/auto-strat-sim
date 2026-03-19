/**
 * Regression tests: Risk Manager
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePositionSize,
  calculateStopLoss,
  calculateTakeProfit,
  shouldTriggerStopLoss,
  shouldTriggerTakeProfit,
  calculatePnl,
  calculateFees,
  canExecuteTrade,
} from '@/lib/riskManager';
import { DEFAULT_CONFIG } from '@/config/trading';

describe('calculatePositionSize', () => {
  it('calculates correct size for 10% of balance', () => {
    const size = calculatePositionSize(10000, 50000, 10);
    expect(size).toBeCloseTo(0.02, 4);
  });

  it('scales linearly with percentage', () => {
    const s5 = calculatePositionSize(10000, 100, 5);
    const s10 = calculatePositionSize(10000, 100, 10);
    expect(s10).toBeCloseTo(s5 * 2, 4);
  });
});

describe('calculateStopLoss', () => {
  it('is below entry for long', () => {
    const sl = calculateStopLoss(100, 2, 'long');
    expect(sl).toBe(98);
  });

  it('is above entry for short', () => {
    const sl = calculateStopLoss(100, 2, 'short');
    expect(sl).toBe(102);
  });
});

describe('calculateTakeProfit', () => {
  it('is above entry for long', () => {
    const tp = calculateTakeProfit(100, 4, 'long');
    expect(tp).toBe(104);
  });

  it('is below entry for short', () => {
    const tp = calculateTakeProfit(100, 4, 'short');
    expect(tp).toBe(96);
  });
});

describe('shouldTriggerStopLoss', () => {
  it('triggers for long when price at or below SL', () => {
    const pos = { direction: 'long' as const, stopLoss: 98 } as any;
    expect(shouldTriggerStopLoss(pos, 98)).toBe(true);
    expect(shouldTriggerStopLoss(pos, 97)).toBe(true);
    expect(shouldTriggerStopLoss(pos, 99)).toBe(false);
  });

  it('triggers for short when price at or above SL', () => {
    const pos = { direction: 'short' as const, stopLoss: 102 } as any;
    expect(shouldTriggerStopLoss(pos, 102)).toBe(true);
    expect(shouldTriggerStopLoss(pos, 103)).toBe(true);
    expect(shouldTriggerStopLoss(pos, 101)).toBe(false);
  });
});

describe('shouldTriggerTakeProfit', () => {
  it('triggers for long when price at or above TP', () => {
    const pos = { direction: 'long' as const, takeProfit: 104 } as any;
    expect(shouldTriggerTakeProfit(pos, 104)).toBe(true);
    expect(shouldTriggerTakeProfit(pos, 105)).toBe(true);
    expect(shouldTriggerTakeProfit(pos, 103)).toBe(false);
  });

  it('triggers for short when price at or below TP', () => {
    const pos = { direction: 'short' as const, takeProfit: 96 } as any;
    expect(shouldTriggerTakeProfit(pos, 96)).toBe(true);
    expect(shouldTriggerTakeProfit(pos, 95)).toBe(true);
    expect(shouldTriggerTakeProfit(pos, 97)).toBe(false);
  });
});

describe('calculatePnl', () => {
  it('long profit', () => {
    expect(calculatePnl('long', 100, 110, 10)).toBe(100);
  });

  it('short profit', () => {
    expect(calculatePnl('short', 100, 90, 10)).toBe(100);
  });
});

describe('calculateFees', () => {
  it('computes percentage correctly', () => {
    expect(calculateFees(1000, 0.1)).toBe(1);
  });
});

describe('canExecuteTrade', () => {
  it('allows valid trades', () => {
    const result = canExecuteTrade(10000, 50000, DEFAULT_CONFIG);
    expect(result.valid).toBe(true);
  });

  it('rejects when position too small', () => {
    const result = canExecuteTrade(10, 50000, DEFAULT_CONFIG);
    expect(result.valid).toBe(false);
  });
});
