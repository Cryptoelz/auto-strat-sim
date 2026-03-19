/**
 * Regression tests: Governance transitions
 */
import { describe, it, expect } from 'vitest';
import { calculateHealthScore, detectTriggers } from '@/lib/governanceEngine';
import { getInitialState } from '@/config/trading';
import { DEFAULT_GOVERNANCE_CONFIG } from '@/types/governance';

describe('calculateHealthScore', () => {
  it('returns a valid score for initial state', () => {
    const state = getInitialState();
    const analytics = {} as any;
    const score = calculateHealthScore(state, analytics, ['BTCUSDT'], 0, 0, 0);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it('decreases with high drawdown', () => {
    const state = getInitialState();
    const analytics = {} as any;
    const low = calculateHealthScore(state, analytics, ['BTCUSDT'], 2, 0, 0);
    const high = calculateHealthScore(state, analytics, ['BTCUSDT'], 20, 0, 0);
    expect(high.overall).toBeLessThan(low.overall);
  });

  it('decreases with reconnect errors', () => {
    const state = getInitialState();
    const analytics = {} as any;
    const clean = calculateHealthScore(state, analytics, ['BTCUSDT'], 0, 0, 0);
    const errors = calculateHealthScore(state, analytics, ['BTCUSDT'], 0, 0, 5);
    expect(errors.dataQuality).toBeLessThan(clean.dataQuality);
  });

  it('decreases with excessive flips', () => {
    const state = getInitialState();
    const analytics = {} as any;
    const noFlips = calculateHealthScore(state, analytics, ['BTCUSDT'], 0, 0, 0);
    const manyFlips = calculateHealthScore(state, analytics, ['BTCUSDT'], 0, 6, 0);
    expect(manyFlips.executionStability).toBeLessThan(noFlips.executionStability);
  });
});

describe('detectTriggers', () => {
  it('returns no triggers for healthy state', () => {
    const state = getInitialState();
    const triggers = detectTriggers(state, 0, 0, 0, DEFAULT_GOVERNANCE_CONFIG);
    expect(triggers.length).toBe(0);
  });

  it('triggers on high drawdown', () => {
    const state = getInitialState();
    const triggers = detectTriggers(state, 20, 0, 0, {
      ...DEFAULT_GOVERNANCE_CONFIG,
      drawdownGovernanceLimit: 10,
    });
    expect(triggers.some(t => t.type === 'portfolio_drawdown')).toBe(true);
  });

  it('triggers on consecutive losses', () => {
    const state = { ...getInitialState(), consecutiveLosses: 6 };
    const triggers = detectTriggers(state, 0, 0, 0, {
      ...DEFAULT_GOVERNANCE_CONFIG,
      consecutiveLossGovernanceLimit: 5,
    });
    expect(triggers.some(t => t.type === 'consecutive_losses')).toBe(true);
  });

  it('triggers on excessive flips', () => {
    const state = getInitialState();
    const triggers = detectTriggers(state, 0, 10, 0, {
      ...DEFAULT_GOVERNANCE_CONFIG,
      flipTradeGovernanceLimit: 5,
    });
    expect(triggers.some(t => t.type === 'excessive_flips')).toBe(true);
  });

  it('triggers on daily loss limit', () => {
    const state = { ...getInitialState(), dailyPnl: -600 };
    const triggers = detectTriggers(state, 0, 0, 0, {
      ...DEFAULT_GOVERNANCE_CONFIG,
      dailyLossGovernanceLimit: 5,
    });
    expect(triggers.some(t => t.type === 'daily_loss_limit')).toBe(true);
  });
});
