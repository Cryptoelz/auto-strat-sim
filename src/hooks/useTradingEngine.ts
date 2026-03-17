import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices } from '@/lib/marketData';
import { generateSignal, isInCooldown, CANDLE_INTERVAL_MS } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openLong, openShort, closePosition, flipPosition } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { canExecuteTrade } from '@/lib/riskManager';
import { playSignalSound } from '@/lib/sounds';
import { toast } from 'sonner';

const POLL_INTERVAL = 60000;

export function useTradingEngine(config: TradingConfig = DEFAULT_CONFIG) {
  const [state, setState] = useState<TradingState>(loadState);
  const [candles, setCandles] = useState<Record<Asset, Candle[]>>({
    BTCUSDT: [],
    XRPUSDT: [],
    FETUSDT: [],
    XLMUSDT: [],
  });
  const [prices, setPrices] = useState<Record<Asset, number | null>>({
    BTCUSDT: null,
    XRPUSDT: null,
    FETUSDT: null,
    XLMUSDT: null,
  });
  const [signals, setSignals] = useState<Record<Asset, Signal | null>>({
    BTCUSDT: null,
    XRPUSDT: null,
    FETUSDT: null,
    XLMUSDT: null,
  });
  const prevSignalsRef = useRef<Record<Asset, Signal | null> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [btcCandles, xrpCandles, fetCandles, xlmCandles, currentPrices] = await Promise.all([
        fetchCandles('BTCUSDT', config.timeframe),
        fetchCandles('XRPUSDT', config.timeframe),
        fetchCandles('FETUSDT', config.timeframe),
        fetchCandles('XLMUSDT', config.timeframe),
        fetchAllPrices(config.assets),
      ]);

      setCandles({
        BTCUSDT: btcCandles,
        XRPUSDT: xrpCandles,
        FETUSDT: fetCandles,
        XLMUSDT: xlmCandles,
      });
      setPrices(currentPrices);
      setLastUpdate(new Date());

      const allCandles: Record<Asset, Candle[]> = {
        BTCUSDT: btcCandles,
        XRPUSDT: xrpCandles,
        FETUSDT: fetCandles,
        XLMUSDT: xlmCandles,
      };

      const newSignals: Record<Asset, Signal | null> = {
        BTCUSDT: null,
        XRPUSDT: null,
        FETUSDT: null,
        XLMUSDT: null,
      };

      for (const asset of config.assets) {
        const result = generateSignal(
          asset,
          allCandles[asset],
          config.indicators.fastSMA,
          config.indicators.slowSMA
        );
        newSignals[asset] = result.signal;
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
  }, [config]);

  // Process signals automatically with flip logic
  const processSignals = useCallback(() => {
    if (!state.isRunning) return;

    setState((prev) => {
      let newState = { ...prev };

      for (const asset of config.assets) {
        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];

        if (!signal || !price || signal.type === 'HOLD') continue;

        // BUY signal (bullish crossover)
        if (signal.type === 'BUY') {
          if (position?.direction === 'short') {
            // FLIP: close SHORT, open LONG
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              newState = flipPosition(newState, asset, price, 'long', config);
              const trade = newState.trades[newState.trades.length - 2]; // The close trade
              const pnlText = trade?.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: SHORT→LONG at $${price.toFixed(2)} (P&L: ${pnlText})`);
            }
          } else if (!position) {
            // No position → open LONG
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, CANDLE_INTERVAL_MS)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openLong(newState, asset, price, config);
                toast.success(`📈 ${asset} LONG opened at $${price.toFixed(2)}`);
              }
            }
          }
          // If already LONG, do nothing
        }

        // SELL signal (bearish crossover)
        if (signal.type === 'SELL') {
          if (position?.direction === 'long') {
            // FLIP: close LONG, open SHORT
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              newState = flipPosition(newState, asset, price, 'short', config);
              const trade = newState.trades[newState.trades.length - 2];
              const pnlText = trade?.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: LONG→SHORT at $${price.toFixed(2)} (P&L: ${pnlText})`);
            }
          } else if (!position) {
            // No position → open SHORT
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, CANDLE_INTERVAL_MS)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openShort(newState, asset, price, config);
                toast.success(`📉 ${asset} SHORT opened at $${price.toFixed(2)}`);
              }
            }
          }
          // If already SHORT, do nothing
        }
      }

      if (newState !== prev) {
        saveState(newState);
      }
      return newState;
    });
  }, [state.isRunning, signals, prices, config]);

  // Toggle running state
  const toggleRunning = useCallback(() => {
    setState((prev) => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      saveState(newState);
      toast.info(newState.isRunning ? 'Agent started' : 'Agent paused');
      return newState;
    });
  }, []);

  // Reset simulation
  const reset = useCallback(() => {
    const newState = resetState();
    setState(newState);
    toast.info('Agent reset to initial state');
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

  // Process signals when data changes
  useEffect(() => {
    if (!state.isRunning) return;
    const timeoutId = setTimeout(processSignals, 100);
    return () => clearTimeout(timeoutId);
  }, [signals, state.isRunning, processSignals]);

  return {
    state,
    candles,
    prices,
    signals,
    isLoading,
    lastUpdate,
    toggleRunning,
    reset,
    refetch: fetchData,
  };
}
