/**
 * Regression tests: Execution Simulator
 */
import { describe, it, expect } from 'vitest';
import { openLong, openShort, closePosition, flipPosition, checkAndExecuteRiskLimits } from '@/lib/executionSimulator';
import { getInitialState, DEFAULT_CONFIG } from '@/config/trading';
import { TradingState } from '@/types/trading';

function makeState(overrides: Partial<TradingState> = {}): TradingState {
  return { ...getInitialState(), ...overrides };
}

const config = {
  ...DEFAULT_CONFIG,
  risk: { positionSizePercent: 10, stopLossPercent: 2, takeProfitPercent: 4, cooldownCandles: 3 },
  fees: { makerPercent: 0.1, takerPercent: 0.1 },
  filters: { ...DEFAULT_CONFIG.filters, slippagePercent: 0 },
};

describe('openLong', () => {
  it('opens a long position and reduces balance', () => {
    const state = makeState({ balance: 10000 });
    const result = openLong(state, 'BTCUSDT', 50000, config);
    expect(result.positions.BTCUSDT).not.toBeNull();
    expect(result.positions.BTCUSDT!.direction).toBe('long');
    expect(result.balance).toBeLessThan(10000);
  });

  it('sets stop loss below entry for long', () => {
    const state = makeState({ balance: 10000 });
    const result = openLong(state, 'BTCUSDT', 50000, config);
    expect(result.positions.BTCUSDT!.stopLoss).toBeLessThan(50000);
  });

  it('sets take profit above entry for long', () => {
    const state = makeState({ balance: 10000 });
    const result = openLong(state, 'BTCUSDT', 50000, config);
    expect(result.positions.BTCUSDT!.takeProfit).toBeGreaterThan(50000);
  });
});

describe('openShort', () => {
  it('opens a short position', () => {
    const state = makeState({ balance: 10000 });
    const result = openShort(state, 'XRPUSDT', 1.5, config);
    expect(result.positions.XRPUSDT).not.toBeNull();
    expect(result.positions.XRPUSDT!.direction).toBe('short');
  });

  it('sets stop loss above entry for short', () => {
    const state = makeState({ balance: 10000 });
    const result = openShort(state, 'XRPUSDT', 1.5, config);
    expect(result.positions.XRPUSDT!.stopLoss).toBeGreaterThan(1.5);
  });
});

describe('closePosition', () => {
  it('closes position and records trade', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const withClose = closePosition(state, 'BTCUSDT', 51000, 'take_profit', config);
    expect(withClose.positions.BTCUSDT).toBeNull();
    expect(withClose.trades.length).toBe(1);
    expect(withClose.trades[0].exitReason).toBe('take_profit');
  });

  it('records winning trade for profitable close', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const withClose = closePosition(state, 'BTCUSDT', 55000, 'take_profit', config);
    expect(withClose.trades[0].type).toBe('win');
    expect(withClose.trades[0].pnl).toBeGreaterThan(0);
  });

  it('records losing trade for unprofitable close', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const withClose = closePosition(state, 'BTCUSDT', 45000, 'stop_loss', config);
    expect(withClose.trades[0].type).toBe('loss');
    expect(withClose.trades[0].pnl).toBeLessThan(0);
  });

  it('returns same state if no position exists', () => {
    const state = makeState();
    const result = closePosition(state, 'BTCUSDT', 50000, 'stop_loss', config);
    expect(result).toEqual(state);
  });
});

describe('flipPosition', () => {
  it('closes existing and opens opposite', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const flipped = flipPosition(state, 'BTCUSDT', 51000, 'short', 'flip_to_short', config);
    expect(flipped.positions.BTCUSDT).not.toBeNull();
    expect(flipped.positions.BTCUSDT!.direction).toBe('short');
    expect(flipped.trades.length).toBe(1); // close trade recorded
  });
});

describe('checkAndExecuteRiskLimits', () => {
  it('triggers stop loss when price drops below SL', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const sl = state.positions.BTCUSDT!.stopLoss;
    const prices = { BTCUSDT: sl - 100, XRPUSDT: null, FETUSDT: null, XLMUSDT: null } as any;
    const result = checkAndExecuteRiskLimits(state, prices, config);
    expect(result.positions.BTCUSDT).toBeNull();
    expect(result.trades.length).toBe(1);
    expect(result.trades[0].exitReason).toBe('stop_loss');
  });

  it('triggers take profit when price rises above TP', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const tp = state.positions.BTCUSDT!.takeProfit;
    const prices = { BTCUSDT: tp + 100, XRPUSDT: null, FETUSDT: null, XLMUSDT: null } as any;
    const result = checkAndExecuteRiskLimits(state, prices, config);
    expect(result.positions.BTCUSDT).toBeNull();
    expect(result.trades[0].exitReason).toBe('take_profit');
  });

  it('does nothing when price is between SL and TP', () => {
    let state = makeState({ balance: 10000 });
    state = openLong(state, 'BTCUSDT', 50000, config);
    const prices = { BTCUSDT: 50000, XRPUSDT: null, FETUSDT: null, XLMUSDT: null } as any;
    const result = checkAndExecuteRiskLimits(state, prices, config);
    expect(result.positions.BTCUSDT).not.toBeNull();
    expect(result.trades.length).toBe(0);
  });
});
