import { TradingState, Trade } from '@/types/trading';
import { getInitialState } from '@/config/trading';

const STORAGE_KEY = 'crypto-trading-simulator';

function normalizeTrade(rawTrade: Partial<Trade>): Trade {
  return {
    id: rawTrade.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    asset: rawTrade.asset ?? 'BTCUSDT',
    direction: rawTrade.direction === 'short' ? 'short' : 'long',
    entryPrice: typeof rawTrade.entryPrice === 'number' ? rawTrade.entryPrice : 0,
    exitPrice: typeof rawTrade.exitPrice === 'number' ? rawTrade.exitPrice : 0,
    entryTime: typeof rawTrade.entryTime === 'number' ? rawTrade.entryTime : Date.now(),
    exitTime: typeof rawTrade.exitTime === 'number' ? rawTrade.exitTime : Date.now(),
    size: typeof rawTrade.size === 'number' ? rawTrade.size : 0,
    pnl: typeof rawTrade.pnl === 'number' ? rawTrade.pnl : 0,
    pnlPercent: typeof rawTrade.pnlPercent === 'number' ? rawTrade.pnlPercent : 0,
    fees: typeof rawTrade.fees === 'number' ? rawTrade.fees : 0,
    type: rawTrade.type === 'loss' ? 'loss' : 'win',
    exitReason:
      rawTrade.exitReason === 'bearish_crossover' ||
      rawTrade.exitReason === 'stop_loss' ||
      rawTrade.exitReason === 'take_profit' ||
      rawTrade.exitReason === 'flip_to_long' ||
      rawTrade.exitReason === 'flip_to_short'
        ? rawTrade.exitReason
        : 'bullish_crossover',
  };
}

/**
 * Save state to localStorage
 */
export function saveState(state: TradingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Load state from localStorage
 */
export function loadState(): TradingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        typeof parsed.balance === 'number' &&
        typeof parsed.positions === 'object' &&
        Array.isArray(parsed.trades)
      ) {
        return {
          ...getInitialState(),
          ...parsed,
          trades: parsed.trades.map(normalizeTrade),
        };
      }
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  return getInitialState();
}

/**
 * Reset state to initial values
 */
export function resetState(): TradingState {
  const initial = getInitialState();
  saveState(initial);
  return initial;
}

/**
 * Clear all saved data
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
}
