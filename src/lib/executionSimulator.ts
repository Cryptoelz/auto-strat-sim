import { Asset, Position, Trade, TradingConfig, TradingState } from '@/types/trading';
import {
  calculatePositionSize,
  calculateStopLoss,
  calculateTakeProfit,
  calculateFees,
} from './riskManager';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simulate opening a position
 */
export function openPosition(
  state: TradingState,
  asset: Asset,
  price: number,
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
    entryPrice: price,
    entryTime: Date.now(),
    size: positionSize,
    type: 'long',
    stopLoss: calculateStopLoss(price, config.risk.stopLossPercent),
    takeProfit: calculateTakeProfit(price, config.risk.takeProfitPercent),
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
 * Simulate closing a position
 */
export function closePosition(
  state: TradingState,
  asset: Asset,
  exitPrice: number,
  exitReason: 'signal' | 'stop_loss' | 'take_profit',
  config: TradingConfig
): TradingState {
  const position = state.positions[asset];

  if (!position) {
    return state;
  }

  const exitValue = position.size * exitPrice;
  const entryValue = position.size * position.entryPrice;
  const fees = calculateFees(exitValue, config.fees.takerPercent);
  const pnl = exitValue - entryValue - fees;
  const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

  const trade: Trade = {
    id: generateId(),
    asset,
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

  return {
    ...state,
    balance: state.balance + exitValue - fees,
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
 * Check and execute stop loss / take profit
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

    if (price <= position.stopLoss) {
      newState = closePosition(newState, asset, price, 'stop_loss', config);
    } else if (price >= position.takeProfit) {
      newState = closePosition(newState, asset, price, 'take_profit', config);
    }
  }

  return newState;
}
