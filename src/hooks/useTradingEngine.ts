import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices } from '@/lib/marketData';
import { generateSignal, isInCooldown, CANDLE_INTERVAL_MS } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openPosition, closePosition } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { canExecuteTrade } from '@/lib/riskManager';
import { toast } from 'sonner';

const POLL_INTERVAL = 60000; // 1 minute

export function useTradingEngine(config: TradingConfig = DEFAULT_CONFIG) {
  const [state, setState] = useState<TradingState>(loadState);
  const [candles, setCandles] = useState<Record<Asset, Candle[]>>({
    BTCUSDT: [],
    XRPUSDT: [],
  });
  const [prices, setPrices] = useState<Record<Asset, number | null>>({
    BTCUSDT: null,
    XRPUSDT: null,
  });
  const [signals, setSignals] = useState<Record<Asset, Signal | null>>({
    BTCUSDT: null,
    XRPUSDT: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch market data
  const fetchData = useCallback(async () => {
    try {
      const [btcCandles, xrpCandles, currentPrices] = await Promise.all([
        fetchCandles('BTCUSDT', config.timeframe),
        fetchCandles('XRPUSDT', config.timeframe),
        fetchAllPrices(config.assets),
      ]);

      setCandles({
        BTCUSDT: btcCandles,
        XRPUSDT: xrpCandles,
      });
      setPrices(currentPrices);
      setLastUpdate(new Date());

      // Generate signals
      const btcSignal = generateSignal(
        'BTCUSDT',
        btcCandles,
        config.indicators.fastSMA,
        config.indicators.slowSMA
      );
      const xrpSignal = generateSignal(
        'XRPUSDT',
        xrpCandles,
        config.indicators.fastSMA,
        config.indicators.slowSMA
      );

      setSignals({
        BTCUSDT: btcSignal.signal,
        XRPUSDT: xrpSignal.signal,
      });

      // Check risk limits (stop loss / take profit)
      setState((prev) => {
        const newState = checkAndExecuteRiskLimits(prev, currentPrices, config);
        if (newState !== prev) {
          saveState(newState);
          // Check if any position was closed
          for (const asset of config.assets) {
            if (prev.positions[asset] && !newState.positions[asset]) {
              const trade = newState.trades[newState.trades.length - 1];
              if (trade) {
                const reason = trade.exitReason === 'stop_loss' ? 'Stop Loss' : 'Take Profit';
                toast.info(`${asset} position closed: ${reason}`);
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
  }, [config]);

  // Process signals in auto mode
  const processAutoSignals = useCallback(() => {
    if (state.mode !== 'auto' || !state.isRunning) return;

    setState((prev) => {
      let newState = { ...prev };

      for (const asset of config.assets) {
        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];

        if (!signal || !price) continue;

        // Check cooldown
        if (isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, CANDLE_INTERVAL_MS)) {
          continue;
        }

        // Process BUY signal
        if (signal.type === 'BUY' && !position) {
          const validation = canExecuteTrade(newState.balance, price, config);
          if (validation.valid) {
            newState = openPosition(newState, asset, price, config);
            toast.success(`AUTO: Opened ${asset} position at $${price.toFixed(2)}`);
          }
        }

        // Process SELL signal
        if (signal.type === 'SELL' && position) {
          newState = closePosition(newState, asset, price, 'signal', config);
          const trade = newState.trades[newState.trades.length - 1];
          const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
          toast.success(`AUTO: Closed ${asset} position. P&L: ${pnlText}`);
        }
      }

      if (newState !== prev) {
        saveState(newState);
      }
      return newState;
    });
  }, [state.mode, state.isRunning, signals, prices, config]);

  // Manual trade execution
  const executeTrade = useCallback(
    (asset: Asset, action: 'buy' | 'sell') => {
      const price = prices[asset];
      if (!price) {
        toast.error('Price not available');
        return;
      }

      setState((prev) => {
        let newState = { ...prev };
        const position = prev.positions[asset];

        if (action === 'buy' && !position) {
          const validation = canExecuteTrade(prev.balance, price, config);
          if (!validation.valid) {
            toast.error(validation.reason || 'Cannot execute trade');
            return prev;
          }
          newState = openPosition(prev, asset, price, config);
          toast.success(`Opened ${asset} position at $${price.toFixed(2)}`);
        } else if (action === 'sell' && position) {
          newState = closePosition(prev, asset, price, 'signal', config);
          const trade = newState.trades[newState.trades.length - 1];
          const pnlText = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
          toast.success(`Closed ${asset} position. P&L: ${pnlText}`);
        }

        saveState(newState);
        return newState;
      });
    },
    [prices, config]
  );

  // Toggle mode
  const toggleMode = useCallback(() => {
    setState((prev) => {
      const newState = {
        ...prev,
        mode: prev.mode === 'auto' ? 'manual' : 'auto',
      } as TradingState;
      saveState(newState);
      toast.info(`Switched to ${newState.mode === 'auto' ? 'Auto' : 'Manual'} mode`);
      return newState;
    });
  }, []);

  // Toggle running state
  const toggleRunning = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      saveState(newState);
      toast.info(newState.isRunning ? 'Simulation started' : 'Simulation paused');
      return newState;
    });
  }, []);

  // Reset simulation
  const reset = useCallback(() => {
    const newState = resetState();
    setState(newState);
    toast.info('Simulation reset to initial state');
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  // Process auto signals when data changes
  useEffect(() => {
    processAutoSignals();
  }, [signals, processAutoSignals]);

  return {
    state,
    candles,
    prices,
    signals,
    isLoading,
    lastUpdate,
    executeTrade,
    toggleMode,
    toggleRunning,
    reset,
    refetch: fetchData,
  };
}
