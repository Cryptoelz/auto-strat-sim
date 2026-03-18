import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal, AssetAnalytics, FilterBlockReason, MarketRegime } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices, fetchHTFCandles } from '@/lib/marketData';
import { generateSignal, isInCooldown, CANDLE_INTERVAL_MS } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openLong, openShort, closePosition, flipPosition } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { canExecuteTrade } from '@/lib/riskManager';
import { runFilters, getHTFTrend } from '@/lib/filters';
import { calculateATR, calculateATRPercent, calculateSMA, calculateSMASlope, calculateSMADistance, detectMarketRegime } from '@/lib/indicators';
import { playSignalSound } from '@/lib/sounds';
import { logDecision, explainOpen, explainFlip, explainBlock, explainClose, explainRiskPause } from '@/lib/logger';
import { toast } from 'sonner';

const POLL_INTERVAL = 60000;

const TIMEFRAME_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

export function useTradingEngine(config: TradingConfig = DEFAULT_CONFIG) {
  const [state, setState] = useState<TradingState>(loadState);
  const [candles, setCandles] = useState<Record<Asset, Candle[]>>({
    BTCUSDT: [], XRPUSDT: [], FETUSDT: [], XLMUSDT: [],
  });
  const [htfCandles, setHtfCandles] = useState<Record<Asset, Candle[]>>({
    BTCUSDT: [], XRPUSDT: [], FETUSDT: [], XLMUSDT: [],
  });
  const [prices, setPrices] = useState<Record<Asset, number | null>>({
    BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null,
  });
  const [signals, setSignals] = useState<Record<Asset, Signal | null>>({
    BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null,
  });
  const [analytics, setAnalytics] = useState<Record<Asset, AssetAnalytics>>(() => {
    const init: Record<Asset, AssetAnalytics> = {} as any;
    for (const a of ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]) {
      init[a] = {
        price: null, smaFast: null, smaSlow: null,
        smaDistance: null, smaFastSlope: null, smaSlowSlope: null,
        htfTrend: 'neutral',
        atr: null, atrPercent: null, marketRegime: 'sideways',
        signal: null, position: null, unrealizedPnl: null, realizedPnl: 0,
        filterBlocked: null,
      };
    }
    return init;
  });
  const prevSignalsRef = useRef<Record<Asset, Signal | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const candleIntervalMs = TIMEFRAME_MS[config.timeframe] || CANDLE_INTERVAL_MS;

  const fetchData = useCallback(async () => {
    try {
      const candlePromises = config.assets.map(a => fetchCandles(a, config.timeframe));
      const htfPromises = config.assets.map(a => fetchHTFCandles(a, config.filters.higherTimeframe));
      const pricePromise = fetchAllPrices(config.assets);

      const [candleResults, htfResults, currentPrices] = await Promise.all([
        Promise.all(candlePromises),
        Promise.all(htfPromises),
        pricePromise,
      ]);

      const allCandles: Record<Asset, Candle[]> = { BTCUSDT: [], XRPUSDT: [], FETUSDT: [], XLMUSDT: [] };
      const allHTF: Record<Asset, Candle[]> = { BTCUSDT: [], XRPUSDT: [], FETUSDT: [], XLMUSDT: [] };

      config.assets.forEach((asset, i) => {
        allCandles[asset] = candleResults[i];
        allHTF[asset] = htfResults[i];
      });

      setCandles(allCandles);
      setHtfCandles(allHTF);
      setPrices(currentPrices);
      setLastUpdate(new Date());

      const newSignals: Record<Asset, Signal | null> = { BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null };
      const newAnalytics: Record<Asset, AssetAnalytics> = {} as any;

      for (const asset of config.assets) {
        const ac = allCandles[asset];
        const htf = allHTF[asset];
        const price = currentPrices[asset];

        const result = generateSignal(asset, ac, config.indicators.fastSMA, config.indicators.slowSMA);
        newSignals[asset] = result.signal;

        const smaFast = ac.length >= config.indicators.fastSMA ? calculateSMA(ac, config.indicators.fastSMA) : null;
        const smaSlow = ac.length >= config.indicators.slowSMA ? calculateSMA(ac, config.indicators.slowSMA) : null;
        const smaFastSlope = calculateSMASlope(ac, config.indicators.fastSMA, 5);
        const smaSlowSlope = calculateSMASlope(ac, config.indicators.slowSMA, 5);
        const smaDistance = calculateSMADistance(ac, config.indicators.fastSMA, config.indicators.slowSMA);
        const atr = calculateATR(ac, config.filters.atrPeriod);
        const atrPercent = calculateATRPercent(ac, config.filters.atrPeriod);
        const htfTrend = getHTFTrend(htf, config.indicators.fastSMA, config.indicators.slowSMA);
        const marketRegime = detectMarketRegime(ac, config.indicators.fastSMA, config.indicators.slowSMA, config.filters.atrPeriod);

        // Check filters (pass state for risk protection checks)
        let filterBlocked: FilterBlockReason | null = null;
        if (result.signal.type !== 'HOLD') {
          const filterResult = runFilters(
            result.signal.type, ac, htf, marketRegime, config.filters,
            state, config.indicators.fastSMA, config.indicators.slowSMA
          );
          if (!filterResult.allowed) {
            filterBlocked = filterResult.reason;
          }
        }

        const realizedPnl = state.trades
          .filter(t => t.asset === asset)
          .reduce((sum, t) => sum + t.pnl, 0);

        const position = state.positions[asset];
        let unrealizedPnl: number | null = null;
        if (position && price) {
          unrealizedPnl = position.direction === 'long'
            ? (price - position.entryPrice) * position.size
            : (position.entryPrice - price) * position.size;
        }

        newAnalytics[asset] = {
          price, smaFast, smaSlow, smaDistance, smaFastSlope, smaSlowSlope,
          htfTrend, atr, atrPercent,
          marketRegime, signal: result.signal, position,
          unrealizedPnl, realizedPnl, filterBlocked,
        };
      }

      // Play sound for new actionable signals
      for (const asset of config.assets) {
        const newSig = newSignals[asset];
        const prevSig = prevSignalsRef.current?.[asset];
        if (newSig && (newSig.type === 'BUY' || newSig.type === 'SELL')) {
          if (!prevSig || prevSig.type !== newSig.type) {
            playSignalSound(newSig.type);
          }
        }
      }

      prevSignalsRef.current = newSignals;
      setSignals(newSignals);
      setAnalytics(newAnalytics);

      // Check risk limits
      setState((prev) => {
        const newState = checkAndExecuteRiskLimits(prev, currentPrices, config);
        if (newState !== prev) {
          saveState(newState);
          for (const asset of config.assets) {
            if (prev.positions[asset] && !newState.positions[asset]) {
              const trade = newState.trades[newState.trades.length - 1];
              if (trade) {
                const reason = trade.exitReason === 'stop_loss' ? 'Stop Loss' : 'Take Profit';
                toast.info(`${asset} ${trade.direction.toUpperCase()} closed: ${reason}`);
                logDecision({
                  asset,
                  action: trade.direction === 'long' ? 'closed_long' : 'closed_short',
                  explanation: explainClose(asset, trade.direction, reason, trade.pnl),
                  signal: 'HOLD',
                  regime: newAnalytics[asset]?.marketRegime,
                });
              }
            }
          }
        }
        return newState;
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch market data');
      setIsLoading(false);
    }
  }, [config, state.trades, state.positions, state.isPaused, state.dailyPnl, state.consecutiveLosses]);

  // Process signals automatically with flip logic + filters
  const processSignals = useCallback(() => {
    if (!state.isRunning) return;

    setState((prev) => {
      let newState = { ...prev };

      // Check and clear pause if time has elapsed
      if (newState.isPaused && Date.now() >= newState.pauseUntil) {
        newState = { ...newState, isPaused: false, pauseUntil: 0, pauseReason: null };
        toast.info('Trading resumed after loss-limit pause');
      }

      // Reset daily PnL if new day
      const today = new Date().toISOString().slice(0, 10);
      if (newState.dailyPnlDate !== today) {
        newState = { ...newState, dailyPnl: 0, dailyPnlDate: today };
      }

      for (const asset of config.assets) {
        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];
        const assetAnalytic = analytics[asset];

        if (!signal || !price || signal.type === 'HOLD') continue;

        // Check if filters block this signal
        if (assetAnalytic?.filterBlocked) {
          // Log the block (only once per signal change)
          const prevSig = prevSignalsRef.current?.[asset];
          if (!prevSig || prevSig.type !== signal.type) {
            logDecision({
              asset,
              action: 'blocked',
              explanation: explainBlock(asset, signal.type, assetAnalytic.filterBlocked),
              signal: signal.type,
              regime: assetAnalytic.marketRegime,
              filterBlocked: assetAnalytic.filterBlocked,
            });
          }
          continue;
        }

        if (signal.type === 'BUY') {
          if (position?.direction === 'short') {
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              const oldDir = position.direction;
              newState = flipPosition(newState, asset, price, 'long', 'flip_to_long', config);
              const closeTrade = newState.trades[newState.trades.length - 2];
              const pnlText = closeTrade?.pnl >= 0 ? `+$${closeTrade.pnl.toFixed(2)}` : `-$${Math.abs(closeTrade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: SHORT→LONG at $${price.toFixed(2)} (P&L: ${pnlText})`);
              // Update risk tracking
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs);
              logDecision({
                asset,
                action: 'flipped',
                explanation: explainFlip(asset, oldDir, 'long', price, assetAnalytic?.marketRegime || 'sideways'),
                signal: signal.type,
                regime: assetAnalytic?.marketRegime,
              });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openLong(newState, asset, price, config);
                toast.success(`📈 ${asset} LONG opened at $${price.toFixed(2)}`);
                logDecision({
                  asset,
                  action: 'opened_long',
                  explanation: explainOpen(asset, 'long', price, assetAnalytic?.marketRegime || 'sideways', signal.type),
                  signal: signal.type,
                  regime: assetAnalytic?.marketRegime,
                });
              }
            }
          }
        }

        if (signal.type === 'SELL') {
          if (position?.direction === 'long') {
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              const oldDir = position.direction;
              newState = flipPosition(newState, asset, price, 'short', 'flip_to_short', config);
              const closeTrade = newState.trades[newState.trades.length - 2];
              const pnlText = closeTrade?.pnl >= 0 ? `+$${closeTrade.pnl.toFixed(2)}` : `-$${Math.abs(closeTrade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: LONG→SHORT at $${price.toFixed(2)} (P&L: ${pnlText})`);
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs);
              logDecision({
                asset,
                action: 'flipped',
                explanation: explainFlip(asset, oldDir, 'short', price, assetAnalytic?.marketRegime || 'sideways'),
                signal: signal.type,
                regime: assetAnalytic?.marketRegime,
              });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openShort(newState, asset, price, config);
                toast.success(`📉 ${asset} SHORT opened at $${price.toFixed(2)}`);
                logDecision({
                  asset,
                  action: 'opened_short',
                  explanation: explainOpen(asset, 'short', price, assetAnalytic?.marketRegime || 'sideways', signal.type),
                  signal: signal.type,
                  regime: assetAnalytic?.marketRegime,
                });
              }
            }
          }
        }
      }

      if (newState !== prev) {
        saveState(newState);
      }
      return newState;
    });
  }, [state.isRunning, signals, prices, config, analytics, candleIntervalMs]);

  const toggleRunning = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      saveState(newState);
      toast.info(newState.isRunning ? 'Agent started' : 'Agent paused');
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    const newState = resetState();
    setState(newState);
    toast.info('Agent reset to initial state');
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  useEffect(() => {
    if (!state.isRunning) return;
    const timeoutId = setTimeout(processSignals, 100);
    return () => clearTimeout(timeoutId);
  }, [signals, state.isRunning, processSignals]);

  return {
    state,
    candles,
    htfCandles,
    prices,
    signals,
    analytics,
    isLoading,
    lastUpdate,
    toggleRunning,
    reset,
    refetch: fetchData,
  };
}

/**
 * Update risk tracking after a trade closes (daily PnL, consecutive losses, pause)
 */
function updateRiskTracking(
  state: TradingState,
  trade: { pnl: number; type: 'win' | 'loss' } | undefined,
  config: TradingConfig,
  candleIntervalMs: number
): TradingState {
  if (!trade) return state;

  const today = new Date().toISOString().slice(0, 10);
  let dailyPnl = state.dailyPnlDate === today ? state.dailyPnl + trade.pnl : trade.pnl;
  let consecutiveLosses = trade.type === 'loss' ? state.consecutiveLosses + 1 : 0;
  let isPaused = state.isPaused;
  let pauseUntil = state.pauseUntil;
  let pauseReason = state.pauseReason;

  // Check if we need to pause
  const dailyLossPercent = (Math.abs(Math.min(0, dailyPnl)) / state.initialBalance) * 100;
  if (config.filters.maxDailyLossPercent > 0 && dailyLossPercent >= config.filters.maxDailyLossPercent) {
    isPaused = true;
    pauseUntil = Date.now() + config.filters.pauseCandlesAfterLossLimit * candleIntervalMs;
    pauseReason = `Daily loss limit of ${config.filters.maxDailyLossPercent}% reached`;
    toast.warning(`⚠️ Trading paused: daily loss limit reached (${dailyLossPercent.toFixed(1)}%)`);
    logDecision({
      asset: trade && 'asset' in trade ? (trade as any).asset : 'BTCUSDT',
      action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  } else if (config.filters.maxConsecutiveLosses > 0 && consecutiveLosses >= config.filters.maxConsecutiveLosses) {
    isPaused = true;
    pauseUntil = Date.now() + config.filters.pauseCandlesAfterLossLimit * candleIntervalMs;
    pauseReason = `${consecutiveLosses} consecutive losses`;
    toast.warning(`⚠️ Trading paused: ${consecutiveLosses} consecutive losses`);
    logDecision({
      asset: trade && 'asset' in trade ? (trade as any).asset : 'BTCUSDT',
      action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  }

  return {
    ...state,
    dailyPnl,
    dailyPnlDate: today,
    consecutiveLosses,
    isPaused,
    pauseUntil,
    pauseReason,
  };
}
