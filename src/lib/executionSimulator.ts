import { Asset, MarketRegime, Position, PositionDirection, Trade, TradeReason, TradingConfig, TradingState } from '@/types/trading';
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

function applySlippage(price: number, direction: PositionDirection, slippagePercent: number): number {
  const slippage = price * (slippagePercent / 100);
  // Slippage always works against the trader
  return direction === 'long' ? price + slippage : price - slippage;
}

export function openLong(state: TradingState, asset: Asset, price: number, config: TradingConfig, regime?: MarketRegime): TradingState {
  return openPosition(state, asset, price, 'long', config, regime);
}

export function openShort(state: TradingState, asset: Asset, price: number, config: TradingConfig, regime?: MarketRegime): TradingState {
  return openPosition(state, asset, price, 'short', config, regime);
}

function openPosition(state: TradingState, asset: Asset, price: number, direction: PositionDirection, config: TradingConfig, regime?: MarketRegime): TradingState {
  const fillPrice = applySlippage(price, direction, config.filters.slippagePercent);
  const positionSize = calculatePositionSize(state.balance, fillPrice, config.risk.positionSizePercent);
  const positionValue = positionSize * fillPrice;
  const fees = calculateFees(positionValue, config.fees.takerPercent);

  const position: Position = {
    id: generateId(),
    asset,
    direction,
    entryPrice: fillPrice,
    entryTime: Date.now(),
    size: positionSize,
    stopLoss: calculateStopLoss(fillPrice, config.risk.stopLossPercent, direction),
    takeProfit: calculateTakeProfit(fillPrice, config.risk.takeProfitPercent, direction),
    entryRegime: regime,
  };

  return {
    ...state,
    balance: state.balance - positionValue - fees,
    positions: { ...state.positions, [asset]: position },
    lastTradeTime: { ...state.lastTradeTime, [asset]: Date.now() },
  };
}

export function closePosition(
  state: TradingState,
  asset: Asset,
  exitPrice: number,
  exitReason: TradeReason,
  config: TradingConfig,
  exitRegime?: MarketRegime,
): TradingState {
  const position = state.positions[asset];
  if (!position) return state;

  const fillPrice = applySlippage(exitPrice, position.direction === 'long' ? 'short' : 'long', config.filters.slippagePercent);
  const exitValue = position.size * fillPrice;
  const fees = calculateFees(exitValue, config.fees.takerPercent);
  const rawPnl = calculatePnl(position.direction, position.entryPrice, fillPrice, position.size);
  const pnl = rawPnl - fees;

  const pnlPercent = position.direction === 'long'
    ? ((fillPrice - position.entryPrice) / position.entryPrice) * 100
    : ((position.entryPrice - fillPrice) / position.entryPrice) * 100;

  const trade: Trade = {
    id: generateId(),
    asset,
    direction: position.direction,
    entryPrice: position.entryPrice,
    exitPrice: fillPrice,
    entryTime: position.entryTime,
    exitTime: Date.now(),
    size: position.size,
    pnl,
    pnlPercent,
    fees,
    type: pnl >= 0 ? 'win' : 'loss',
    exitReason,
    entryRegime: position.entryRegime,
    exitRegime,
  };

  const entryValue = position.size * position.entryPrice;

  return {
    ...state,
    balance: state.balance + entryValue + rawPnl - fees,
    positions: { ...state.positions, [asset]: null },
    trades: [...state.trades, trade],
    lastTradeTime: { ...state.lastTradeTime, [asset]: Date.now() },
  };
}

export function flipPosition(
  state: TradingState,
  asset: Asset,
  price: number,
  newDirection: PositionDirection,
  exitReason: TradeReason,
  config: TradingConfig,
  regime?: MarketRegime,
): TradingState {
  let newState = closePosition(state, asset, price, exitReason, config, regime);
  newState = newDirection === 'long'
    ? openLong(newState, asset, price, config, regime)
    : openShort(newState, asset, price, config, regime);
  return newState;
}

export function checkAndExecuteRiskLimits(
  state: TradingState,
  prices: Record<Asset, number | null>,
  config: TradingConfig,
  regimes?: Partial<Record<Asset, MarketRegime>>,
): TradingState {
  let newState = { ...state };

  for (const asset of config.assets) {
    const position = newState.positions[asset];
    const price = prices[asset];
    if (!position || !price) continue;

    const regime = regimes?.[asset];
    if (shouldTriggerStopLoss(position, price)) {
      newState = closePosition(newState, asset, price, 'stop_loss', config, regime);
    } else if (shouldTriggerTakeProfit(position, price)) {
      newState = closePosition(newState, asset, price, 'take_profit', config, regime);
    }
  }

  return newState;
}
