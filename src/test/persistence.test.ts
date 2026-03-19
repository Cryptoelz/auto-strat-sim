/**
 * Regression tests: State persistence and recovery
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { saveState, loadState, resetState, clearState } from '@/lib/stateManager';
import { getInitialState } from '@/config/trading';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => Object.keys(store).forEach(k => delete store[k]),
    },
    writable: true,
    configurable: true,
  });
});

describe('saveState / loadState', () => {
  it('round-trips initial state', () => {
    const initial = getInitialState();
    saveState(initial);
    const loaded = loadState();
    expect(loaded.balance).toBe(initial.balance);
    expect(loaded.initialBalance).toBe(initial.initialBalance);
    expect(loaded.isRunning).toBe(initial.isRunning);
    expect(loaded.trades).toEqual([]);
    expect(loaded.isPaused).toBe(false);
  });

  it('preserves positions through save/load', () => {
    const state = {
      ...getInitialState(),
      positions: {
        ...getInitialState().positions,
        BTCUSDT: {
          id: 'test-1', asset: 'BTCUSDT' as const, direction: 'long' as const,
          entryPrice: 50000, entryTime: Date.now(), size: 0.02,
          stopLoss: 49000, takeProfit: 52000,
        },
      },
    };
    saveState(state);
    const loaded = loadState();
    expect(loaded.positions.BTCUSDT).not.toBeNull();
    expect(loaded.positions.BTCUSDT!.direction).toBe('long');
    expect(loaded.positions.BTCUSDT!.entryPrice).toBe(50000);
  });

  it('preserves trades through save/load', () => {
    const state = {
      ...getInitialState(),
      trades: [{
        id: 't-1', asset: 'BTCUSDT' as const, direction: 'long' as const,
        entryPrice: 50000, exitPrice: 51000, entryTime: Date.now() - 1000,
        exitTime: Date.now(), size: 0.02, pnl: 20, pnlPercent: 2,
        fees: 0.1, type: 'win' as const, exitReason: 'take_profit' as const,
      }],
    };
    saveState(state);
    const loaded = loadState();
    expect(loaded.trades.length).toBe(1);
    expect(loaded.trades[0].pnl).toBe(20);
    expect(loaded.trades[0].exitReason).toBe('take_profit');
  });

  it('preserves risk state fields', () => {
    const state = {
      ...getInitialState(),
      isPaused: true,
      pauseUntil: Date.now() + 60000,
      pauseReason: 'Daily loss limit reached',
      dailyPnl: -500,
      consecutiveLosses: 3,
    };
    saveState(state);
    const loaded = loadState();
    expect(loaded.isPaused).toBe(true);
    expect(loaded.pauseReason).toBe('Daily loss limit reached');
    expect(loaded.dailyPnl).toBe(-500);
    expect(loaded.consecutiveLosses).toBe(3);
  });

  it('returns initial state for corrupted data', () => {
    store['crypto-trading-simulator'] = '{{broken json}}';
    const loaded = loadState();
    expect(loaded.balance).toBe(getInitialState().balance);
  });

  it('returns initial state when nothing saved', () => {
    const loaded = loadState();
    expect(loaded.balance).toBe(getInitialState().balance);
  });
});

describe('resetState', () => {
  it('returns clean initial state', () => {
    saveState({ ...getInitialState(), balance: 5000 });
    const reset = resetState();
    expect(reset.balance).toBe(10000);
    // Also saves to storage
    const loaded = loadState();
    expect(loaded.balance).toBe(10000);
  });
});

describe('clearState', () => {
  it('removes saved state', () => {
    saveState(getInitialState());
    clearState();
    expect(store['crypto-trading-simulator']).toBeUndefined();
  });
});
