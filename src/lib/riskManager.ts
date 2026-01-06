import { Position, TradingConfig } from '@/types/trading';

/**
 * Calculate position size based on available balance
 */
export function calculatePositionSize(
  balance: number,
  price: number,
  positionSizePercent: number
): number {
  const positionValue = balance * (positionSizePercent / 100);
  return positionValue / price;
}

/**
 * Calculate stop loss price
 */
export function calculateStopLoss(
  entryPrice: number,
  stopLossPercent: number
): number {
  return entryPrice * (1 - stopLossPercent / 100);
}

/**
 * Calculate take profit price
 */
export function calculateTakeProfit(
  entryPrice: number,
  takeProfitPercent: number
): number {
  return entryPrice * (1 + takeProfitPercent / 100);
}

/**
 * Check if stop loss should be triggered
 */
export function shouldTriggerStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  return currentPrice <= position.stopLoss;
}

/**
 * Check if take profit should be triggered
 */
export function shouldTriggerTakeProfit(
  position: Position,
  currentPrice: number
): boolean {
  return currentPrice >= position.takeProfit;
}

/**
 * Calculate fees for a trade
 */
export function calculateFees(
  value: number,
  feePercent: number
): number {
  return value * (feePercent / 100);
}

/**
 * Validate if a trade can be executed
 */
export function canExecuteTrade(
  balance: number,
  price: number,
  config: TradingConfig
): { valid: boolean; reason?: string } {
  const positionValue = balance * (config.risk.positionSizePercent / 100);
  const fees = calculateFees(positionValue, config.fees.takerPercent);

  if (positionValue + fees > balance) {
    return { valid: false, reason: 'Insufficient balance' };
  }

  if (positionValue < 10) {
    return { valid: false, reason: 'Position too small (min $10)' };
  }

  return { valid: true };
}
