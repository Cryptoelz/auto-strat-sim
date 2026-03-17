import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal, AssetAnalytics, FilterBlockReason, MarketRegime } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices, fetchHTFCandles } from '@/lib/marketData';
import { generateSignal, isInCooldown, CANDLE_INTERVAL_MS } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openLong, openShort, closePosition, flipPosition } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { canExecuteTrade } from '@/lib/riskManager';
import { runFilters, getHTFTrend } from '@/lib/filters';
import { calculateATR, calculateATRPercent, calculateSMA, detectMarketRegime } from '@/lib/indicators';
import { playSignalSound } from '@/lib/sounds';
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
        price: null, smaFast: null, smaSlow: null, htfTrend: 'neutral',
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
      // Fetch execution TF candles + HTF candles + prices in parallel
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

      // Generate signals and analytics
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
        const atr = calculateATR(ac, config.filters.atrPeriod);
        const atrPercent = calculateATRPercent(ac, config.filters.atrPeriod);
        const htfTrend = getHTFTrend(htf, config.indicators.fastSMA, config.indicators.slowSMA);
        const marketRegime = detectMarketRegime(ac, config.indicators.fastSMA, config.indicators.slowSMA, config.filters.atrPeriod);

        // Check filters
        let filterBlocked: FilterBlockReason | null = null;
        if (result.signal.type !== 'HOLD') {
          const filterResult = runFilters(result.signal.type, ac, htf, marketRegime, config.filters);
          if (!filterResult.allowed) {
            filterBlocked = filterResult.reason;
          }
        }

        // Realized PnL for this asset
        const realizedPnl = state.trades
          .filter(t => t.asset === asset)
          .reduce((sum, t) => sum + t.pnl, 0);

        // Unrealized PnL
        const position = state.positions[asset];
        let unrealizedPnl: number | null = null;
        if (position && price) {
          unrealizedPnl = position.direction === 'long'
            ? (price - position.entryPrice) * position.size
            : (position.entryPrice - price) * position.size;
        }

        newAnalytics[asset] = {
          price, smaFast, smaSlow, htfTrend, atr, atrPercent,
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
  }, [config, state.trades, state.positions]);

  // Process signals automatically with flip logic + filters
  const processSignals = useCallback(() => {
    if (!state.isRunning) return;

    setState((prev) => {
      let newState = { ...prev };

      for (const asset of config.assets) {
        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];
        const assetAnalytic = analytics[asset];

        if (!signal || !price || signal.type === 'HOLD') continue;

        // Check if filters block this signal
        if (assetAnalytic?.filterBlocked) {
          continue;
        }

        if (signal.type === 'BUY') {
          if (position?.direction === 'short') {
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              newState = flipPosition(newState, asset, price, 'long', 'flip_to_long', config);
              const trade = newState.trades[newState.trades.length - 2];
              const pnlText = trade?.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: SHORT→LONG at $${price.toFixed(2)} (P&L: ${pnlText})`);
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openLong(newState, asset, price, config);
                toast.success(`📈 ${asset} LONG opened at $${price.toFixed(2)}`);
              }
            }
          }
        }

        if (signal.type === 'SELL') {
          if (position?.direction === 'long') {
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              newState = flipPosition(newState, asset, price, 'short', 'flip_to_short', config);
              const trade = newState.trades[newState.trades.length - 2];
              const pnlText = trade?.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: LONG→SHORT at $${price.toFixed(2)} (P&L: ${pnlText})`);
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openShort(newState, asset, price, config);
                toast.success(`📉 ${asset} SHORT opened at $${price.toFixed(2)}`);
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
