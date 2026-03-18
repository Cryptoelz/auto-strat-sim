import { Asset, DecisionLogEntry, FilterBlockReason, MarketRegime, SignalType } from '@/types/trading';

const MAX_LOG_ENTRIES = 200;
let logEntries: DecisionLogEntry[] = [];
let listeners: (() => void)[] = [];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const REGIME_LABELS: Record<MarketRegime, string> = {
  trending_bullish: 'bullish',
  trending_bearish: 'bearish',
  sideways: 'sideways',
};

const FILTER_EXPLANATIONS: Record<FilterBlockReason, string> = {
  trend_filter: 'HTF trend filter does not align with signal direction',
  volatility_filter: 'ATR is below minimum threshold (low volatility)',
  regime_filter: 'market regime conflicts with signal direction',
  sma_distance_filter: 'SMA distance is too small (low conviction)',
  cooldown_active: 'cooldown period is still active',
  insufficient_balance: 'insufficient balance to open position',
  daily_loss_pause: 'daily loss limit has been reached',
  consecutive_loss_pause: 'consecutive loss limit has been reached',
};

export function logDecision(entry: Omit<DecisionLogEntry, 'id' | 'timestamp'>): void {
  const newEntry: DecisionLogEntry = {
    ...entry,
    id: generateId(),
    timestamp: Date.now(),
  };
  logEntries = [newEntry, ...logEntries].slice(0, MAX_LOG_ENTRIES);
  listeners.forEach((l) => l());
}

export function getLogEntries(): DecisionLogEntry[] {
  return logEntries;
}

export function clearLog(): void {
  logEntries = [];
  listeners.forEach((l) => l());
}

export function subscribeToLog(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// Helper functions to generate explanations

export function explainOpen(
  asset: Asset,
  direction: 'long' | 'short',
  price: number,
  regime: MarketRegime,
  signal: SignalType
): string {
  const crossType = signal === 'BUY' ? 'fast SMA crossed above slow SMA' : 'fast SMA crossed below slow SMA';
  return `Opened ${direction.toUpperCase()} on ${asset} at $${price.toFixed(2)} because ${crossType}, volatility filter passed, and regime is ${REGIME_LABELS[regime]}.`;
}

export function explainFlip(
  asset: Asset,
  fromDir: 'long' | 'short',
  toDir: 'long' | 'short',
  price: number,
  regime: MarketRegime
): string {
  const crossType = toDir === 'long' ? 'bullish' : 'bearish';
  return `Closed ${fromDir.toUpperCase()} and flipped to ${toDir.toUpperCase()} on ${asset} at $${price.toFixed(2)} due to confirmed ${crossType} crossover. Regime: ${REGIME_LABELS[regime]}.`;
}

export function explainBlock(
  asset: Asset,
  signal: SignalType,
  reason: FilterBlockReason
): string {
  const direction = signal === 'BUY' ? 'LONG' : 'SHORT';
  return `Blocked ${direction} on ${asset} because ${FILTER_EXPLANATIONS[reason]}.`;
}

export function explainClose(
  asset: Asset,
  direction: 'long' | 'short',
  reason: string,
  pnl: number
): string {
  const pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  return `Closed ${direction.toUpperCase()} on ${asset} via ${reason} (P&L: ${pnlText}).`;
}

export function explainRiskPause(reason: string, pauseCandles: number): string {
  return `Trading paused: ${reason}. Will resume after ${pauseCandles} candles.`;
}
