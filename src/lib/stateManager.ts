import { TradingState } from '@/types/trading';
import { getInitialState } from '@/config/trading';

const STORAGE_KEY = 'crypto-trading-simulator';

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
      // Validate essential fields
      if (
        typeof parsed.balance === 'number' &&
        typeof parsed.positions === 'object' &&
        Array.isArray(parsed.trades)
      ) {
        return {
          ...getInitialState(),
          ...parsed,
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
