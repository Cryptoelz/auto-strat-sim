import { Position, PositionDirection, TradingConfig } from '@/types/trading';

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
 * Calculate stop loss price for long or short
 */
export function calculateStopLoss(
  entryPrice: number,
  stopLossPercent: number,
  direction: PositionDirection
): number {
  if (direction === 'long') {
    return entryPrice * (1 - stopLossPercent / 100);
  }
  // Short: SL is above entry
  return entryPrice * (1 + stopLossPercent / 100);
}

/**
 * Calculate take profit price for long or short
 */
export function calculateTakeProfit(
  entryPrice: number,
  takeProfitPercent: number,
  direction: PositionDirection
): number {
  if (direction === 'long') {
    return entryPrice * (1 + takeProfitPercent / 100);
  }
  // Short: TP is below entry
  return entryPrice * (1 - takeProfitPercent / 100);
}

/**
 * Check if stop loss should be triggered
 */
export function shouldTriggerStopLoss(
  position: Position,
  currentPrice: number
): boolean {
  if (position.direction === 'long') {
    return currentPrice <= position.stopLoss;
  }
  // Short: price rising hits SL
  return currentPrice >= position.stopLoss;
}

/**
 * Check if take profit should be triggered
 */
export function shouldTriggerTakeProfit(
  position: Position,
  currentPrice: number
): boolean {
  if (position.direction === 'long') {
    return currentPrice >= position.takeProfit;
  }
  // Short: price falling hits TP
  return currentPrice <= position.takeProfit;
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
 * Calculate PnL for a position
 */
export function calculatePnl(
  direction: PositionDirection,
  entryPrice: number,
  exitPrice: number,
  size: number
): number {
  if (direction === 'long') {
    return (exitPrice - entryPrice) * size;
  }
  // Short PnL: profit when price drops
  return (entryPrice - exitPrice) * size;
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
