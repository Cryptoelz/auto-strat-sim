import { Asset, Position, PositionDirection, Trade, TradingConfig, TradingState } from '@/types/trading';
import {
  calculatePositionSize,
  calculateStopLoss,
  calculateTakeProfit,
  calculateFees,
  calculatePnl,
  shouldTriggerStopLoss,
  shouldTriggerTakeProfit,
} from './riskManager';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Open a LONG position
 */
export function openLong(
  state: TradingState,
  asset: Asset,
  price: number,
  config: TradingConfig
): TradingState {
  return openPosition(state, asset, price, 'long', config);
}

/**
 * Open a SHORT position
 */
export function openShort(
  state: TradingState,
  asset: Asset,
  price: number,
  config: TradingConfig
): TradingState {
  return openPosition(state, asset, price, 'short', config);
}

/**
 * Open a position (long or short)
 */
function openPosition(
  state: TradingState,
  asset: Asset,
  price: number,
  direction: PositionDirection,
  config: TradingConfig
): TradingState {
  const positionSize = calculatePositionSize(
    state.balance,
    price,
    config.risk.positionSizePercent
  );

  const positionValue = positionSize * price;
  const fees = calculateFees(positionValue, config.fees.takerPercent);

  const position: Position = {
    id: generateId(),
    asset,
    direction,
    entryPrice: price,
    entryTime: Date.now(),
    size: positionSize,
    stopLoss: calculateStopLoss(price, config.risk.stopLossPercent, direction),
    takeProfit: calculateTakeProfit(price, config.risk.takeProfitPercent, direction),
  };

  return {
    ...state,
    balance: state.balance - positionValue - fees,
    positions: {
      ...state.positions,
      [asset]: position,
    },
    lastTradeTime: {
      ...state.lastTradeTime,
      [asset]: Date.now(),
    },
  };
}

/**
 * Close an existing position
 */
export function closePosition(
  state: TradingState,
  asset: Asset,
  exitPrice: number,
  exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'flip',
  config: TradingConfig
): TradingState {
  const position = state.positions[asset];
  if (!position) return state;

  const exitValue = position.size * exitPrice;
  const fees = calculateFees(exitValue, config.fees.takerPercent);
  const rawPnl = calculatePnl(position.direction, position.entryPrice, exitPrice, position.size);
  const pnl = rawPnl - fees;
  
  const pnlPercent = position.direction === 'long'
    ? ((exitPrice - position.entryPrice) / position.entryPrice) * 100
    : ((position.entryPrice - exitPrice) / position.entryPrice) * 100;

  const trade: Trade = {
    id: generateId(),
    asset,
    direction: position.direction,
    entryPrice: position.entryPrice,
    exitPrice,
    entryTime: position.entryTime,
    exitTime: Date.now(),
    size: position.size,
    pnl,
    pnlPercent,
    fees,
    type: pnl >= 0 ? 'win' : 'loss',
    exitReason,
  };

  // Return the locked capital + PnL
  const entryValue = position.size * position.entryPrice;

  return {
    ...state,
    balance: state.balance + entryValue + rawPnl - fees,
    positions: {
      ...state.positions,
      [asset]: null,
    },
    trades: [...state.trades, trade],
    lastTradeTime: {
      ...state.lastTradeTime,
      [asset]: Date.now(),
    },
  };
}

/**
 * Flip position: close current and open opposite direction
 */
export function flipPosition(
  state: TradingState,
  asset: Asset,
  price: number,
  newDirection: PositionDirection,
  config: TradingConfig
): TradingState {
  // Close existing position
  let newState = closePosition(state, asset, price, 'flip', config);
  // Open in opposite direction
  if (newDirection === 'long') {
    newState = openLong(newState, asset, price, config);
  } else {
    newState = openShort(newState, asset, price, config);
  }
  return newState;
}

/**
 * Check and execute stop loss / take profit for all positions
 */
export function checkAndExecuteRiskLimits(
  state: TradingState,
  prices: Record<Asset, number | null>,
  config: TradingConfig
): TradingState {
  let newState = { ...state };

  for (const asset of config.assets) {
    const position = newState.positions[asset];
    const price = prices[asset];

    if (!position || !price) continue;

    if (shouldTriggerStopLoss(position, price)) {
      newState = closePosition(newState, asset, price, 'stop_loss', config);
    } else if (shouldTriggerTakeProfit(position, price)) {
      newState = closePosition(newState, asset, price, 'take_profit', config);
    }
  }

  return newState;
}
