import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal, AssetAnalytics, FilterBlockReason } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices, fetchHTFCandles } from '@/lib/marketData';
import { generateSignal, isInCooldown } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openLong, openShort, flipPosition } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { canExecuteTrade } from '@/lib/riskManager';
import { runFilters, getHTFTrend } from '@/lib/filters';
import { calculateATR, calculateATRPercent, calculateSMA, calculateSMASlope, calculateSMADistance, detectMarketRegime } from '@/lib/indicators';
import { logDecision, explainOpen, explainFlip, explainBlock, explainClose, explainRiskPause } from '@/lib/logger';
import { LiveMarketDataManager, ConnectionStatus } from '@/lib/liveMarketData';
import { toast } from 'sonner';

const POLL_INTERVAL = 60000;
const TIMEFRAME_MS: Record<string, number> = {
  '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000,
};

export interface PaperTradingStatus {
  mode: 'idle' | 'running' | 'paused' | 'emergency_stop';
  connectionStatus: ConnectionStatus;
  statusMessages: StatusMessage[];
  enabledAssets: Record<Asset, boolean>;
  sessionStartTime: number;
  dailyPnl: number;
  maxDrawdown: number;
}

export interface StatusMessage {
  id: string;
  timestamp: number;
  type: 'info' | 'trade' | 'warning' | 'error' | 'blocked';
  message: string;
  asset?: Asset;
}

const MAX_STATUS_MESSAGES = 100;
const PAPER_TRADING_KEY = 'paper-trading-session';

function loadSession(): { startTime: number; maxDrawdown: number } {
  try {
    const saved = localStorage.getItem(PAPER_TRADING_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { startTime: Date.now(), maxDrawdown: 0 };
}

function saveSession(data: { startTime: number; maxDrawdown: number }): void {
  try { localStorage.setItem(PAPER_TRADING_KEY, JSON.stringify(data)); } catch {}
}

export function usePaperTrading(config: TradingConfig = DEFAULT_CONFIG) {
  const [state, setState] = useState<TradingState>(loadState);
  const [candles, setCandles] = useState<Record<Asset, Candle[]>>(() => {
    const init: Record<Asset, Candle[]> = {} as any;
    for (const a of ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]) init[a] = [];
    return init;
  });
  const [htfCandles, setHtfCandles] = useState<Record<Asset, Candle[]>>(() => {
    const init: Record<Asset, Candle[]> = {} as any;
    for (const a of ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]) init[a] = [];
    return init;
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
        price: null, smaFast: null, smaSlow: null, smaDistance: null,
        smaFastSlope: null, smaSlowSlope: null, htfTrend: 'neutral',
        atr: null, atrPercent: null, marketRegime: 'sideways',
        signal: null, position: null, unrealizedPnl: null, realizedPnl: 0,
        filterBlocked: null,
      };
    }
    return init;
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false, reconnecting: false, lastMessage: 0, missedCandles: 0, error: null,
  });
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [enabledAssets, setEnabledAssets] = useState<Record<Asset, boolean>>(() => {
    const init: Record<Asset, boolean> = {} as any;
    config.assets.forEach(a => init[a] = true);
    return init;
  });
  const [emergencyStop, setEmergencyStop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const session = useRef(loadSession());
  const [maxDrawdown, setMaxDrawdown] = useState(session.current.maxDrawdown);
  const wsManagerRef = useRef<LiveMarketDataManager | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevSignalsRef = useRef<Record<Asset, Signal | null> | null>(null);

  const candleIntervalMs = TIMEFRAME_MS[config.timeframe] || 900000;

  const addStatus = useCallback((type: StatusMessage['type'], message: string, asset?: Asset) => {
    setStatusMessages(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(), type, message, asset,
    }, ...prev].slice(0, MAX_STATUS_MESSAGES));
  }, []);

  // Track max drawdown
  useEffect(() => {
    const equity = state.balance + Object.entries(state.positions).reduce((sum, [asset, pos]) => {
      if (!pos || !prices[asset as Asset]) return sum;
      const price = prices[asset as Asset]!;
      const uPnl = pos.direction === 'long'
        ? (price - pos.entryPrice) * pos.size
        : (pos.entryPrice - price) * pos.size;
      return sum + uPnl;
    }, 0);
    const dd = ((state.initialBalance - equity) / state.initialBalance) * 100;
    if (dd > maxDrawdown) {
      setMaxDrawdown(dd);
      session.current.maxDrawdown = dd;
      saveSession(session.current);
    }
  }, [state.balance, prices, state.positions, state.initialBalance, maxDrawdown]);

  // Compute analytics for an asset
  const computeAnalytics = useCallback((asset: Asset, ac: Candle[], htf: Candle[], price: number | null, currentState: TradingState): AssetAnalytics => {
    const result = generateSignal(asset, ac, config.indicators.fastSMA, config.indicators.slowSMA);

    const smaFast = ac.length >= config.indicators.fastSMA ? calculateSMA(ac, config.indicators.fastSMA) : null;
    const smaSlow = ac.length >= config.indicators.slowSMA ? calculateSMA(ac, config.indicators.slowSMA) : null;
    const smaFastSlope = calculateSMASlope(ac, config.indicators.fastSMA, 5);
    const smaSlowSlope = calculateSMASlope(ac, config.indicators.slowSMA, 5);
    const smaDistance = calculateSMADistance(ac, config.indicators.fastSMA, config.indicators.slowSMA);
    const atr = calculateATR(ac, config.filters.atrPeriod);
    const atrPercent = calculateATRPercent(ac, config.filters.atrPeriod);
    const htfTrend = getHTFTrend(htf, config.indicators.fastSMA, config.indicators.slowSMA);
    const marketRegime = detectMarketRegime(ac, config.indicators.fastSMA, config.indicators.slowSMA, config.filters.atrPeriod);

    let filterBlocked: FilterBlockReason | null = null;
    if (result.signal.type !== 'HOLD') {
      const filterResult = runFilters(result.signal.type, ac, htf, marketRegime, config.filters, currentState, config.indicators.fastSMA, config.indicators.slowSMA);
      if (!filterResult.allowed) filterBlocked = filterResult.reason;
    }

    const realizedPnl = currentState.trades.filter(t => t.asset === asset).reduce((s, t) => s + t.pnl, 0);
    const position = currentState.positions[asset];
    let unrealizedPnl: number | null = null;
    if (position && price) {
      unrealizedPnl = position.direction === 'long'
        ? (price - position.entryPrice) * position.size
        : (position.entryPrice - price) * position.size;
    }

    return {
      price, smaFast, smaSlow, smaDistance, smaFastSlope, smaSlowSlope,
      htfTrend, atr, atrPercent, marketRegime,
      signal: result.signal, position, unrealizedPnl, realizedPnl, filterBlocked,
    };
  }, [config]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const candlePromises = config.assets.map(a => fetchCandles(a, config.timeframe));
      const htfPromises = config.assets.map(a => fetchHTFCandles(a, config.filters.higherTimeframe));
      const pricePromise = fetchAllPrices(config.assets);

      const [candleResults, htfResults, currentPrices] = await Promise.all([
        Promise.all(candlePromises), Promise.all(htfPromises), pricePromise,
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

      setState(prev => {
        for (const asset of config.assets) {
          const a = computeAnalytics(asset, allCandles[asset], allHTF[asset], currentPrices[asset], prev);
          newAnalytics[asset] = a;
          if (a.signal) newSignals[asset] = a.signal;
        }
        setAnalytics(newAnalytics);
        setSignals(newSignals);
        prevSignalsRef.current = newSignals;

        // Check risk limits
        const newState = checkAndExecuteRiskLimits(prev, currentPrices, config);
        if (newState !== prev) saveState(newState);
        return newState;
      });

      setIsLoading(false);
      addStatus('info', 'Market data loaded successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      addStatus('error', 'Failed to fetch market data');
      setIsLoading(false);
    }
  }, [config, computeAnalytics, addStatus]);

  // Process signals
  const processSignals = useCallback(() => {
    if (!state.isRunning || emergencyStop) return;

    setState(prev => {
      let newState = { ...prev };

      // Clear pause if time elapsed
      if (newState.isPaused && Date.now() >= newState.pauseUntil) {
        newState = { ...newState, isPaused: false, pauseUntil: 0, pauseReason: null };
        addStatus('info', 'Trading resumed after loss-limit pause');
      }

      const today = new Date().toISOString().slice(0, 10);
      if (newState.dailyPnlDate !== today) {
        newState = { ...newState, dailyPnl: 0, dailyPnlDate: today };
      }

      for (const asset of config.assets) {
        if (!enabledAssets[asset]) continue;

        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];
        const assetAnalytic = analytics[asset];

        if (!signal || !price || signal.type === 'HOLD') {
          if (!signal || signal.type === 'HOLD') {
            // No signal - waiting for candle close
          }
          continue;
        }

        if (assetAnalytic?.filterBlocked) {
          const prevSig = prevSignalsRef.current?.[asset];
          if (!prevSig || prevSig.type !== signal.type) {
            const reason = assetAnalytic.filterBlocked;
            addStatus('blocked', explainBlock(asset, signal.type, reason), asset);
            logDecision({
              asset, action: 'blocked',
              explanation: explainBlock(asset, signal.type, reason),
              signal: signal.type, regime: assetAnalytic.marketRegime,
              filterBlocked: reason,
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
              const msg = explainFlip(asset, oldDir, 'long', price, assetAnalytic?.marketRegime || 'sideways');
              addStatus('trade', msg, asset);
              toast.success(`🔄 ${asset} FLIP: SHORT→LONG at $${price.toFixed(2)}`);
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs, addStatus);
              logDecision({ asset, action: 'flipped', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openLong(newState, asset, price, config);
                const msg = explainOpen(asset, 'long', price, assetAnalytic?.marketRegime || 'sideways', signal.type);
                addStatus('trade', msg, asset);
                toast.success(`📈 ${asset} LONG opened at $${price.toFixed(2)}`);
                logDecision({ asset, action: 'opened_long', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
              }
            } else {
              addStatus('blocked', `Waiting for cooldown on ${asset}`, asset);
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
              const msg = explainFlip(asset, oldDir, 'short', price, assetAnalytic?.marketRegime || 'sideways');
              addStatus('trade', msg, asset);
              toast.success(`🔄 ${asset} FLIP: LONG→SHORT at $${price.toFixed(2)}`);
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs, addStatus);
              logDecision({ asset, action: 'flipped', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openShort(newState, asset, price, config);
                const msg = explainOpen(asset, 'short', price, assetAnalytic?.marketRegime || 'sideways', signal.type);
                addStatus('trade', msg, asset);
                toast.success(`📉 ${asset} SHORT opened at $${price.toFixed(2)}`);
                logDecision({ asset, action: 'opened_short', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
              }
            }
          }
        }
      }

      if (newState !== prev) saveState(newState);
      return newState;
    });
  }, [state.isRunning, emergencyStop, signals, prices, config, analytics, enabledAssets, candleIntervalMs, addStatus]);

  // WebSocket connection
  useEffect(() => {
    const activeAssets = config.assets.filter(a => enabledAssets[a]);
    if (activeAssets.length === 0) return;

    const manager = new LiveMarketDataManager(
      activeAssets,
      config.timeframe,
      (asset, candle) => {
        // Append candle to local buffer
        setCandles(prev => {
          const updated = [...(prev[asset] || [])];
          // Replace last candle if same timestamp, else push
          if (updated.length > 0 && updated[updated.length - 1].timestamp === candle.timestamp) {
            updated[updated.length - 1] = candle;
          } else {
            updated.push(candle);
            if (updated.length > 200) updated.shift();
          }
          return { ...prev, [asset]: updated };
        });
        addStatus('info', `Candle closed on ${asset} at $${candle.close.toFixed(2)}`, asset);
      },
      (asset, price) => {
        setPrices(prev => ({ ...prev, [asset]: price }));
      },
      (status) => {
        setConnectionStatus(status);
      },
    );

    manager.connect();
    wsManagerRef.current = manager;

    return () => {
      manager.destroy();
      wsManagerRef.current = null;
    };
  }, [config.assets.join(','), config.timeframe, enabledAssets, addStatus]);

  // Initial data fetch + polling fallback
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Process signals on changes
  useEffect(() => {
    if (!state.isRunning || emergencyStop) return;
    const timeout = setTimeout(processSignals, 100);
    return () => clearTimeout(timeout);
  }, [signals, state.isRunning, processSignals, emergencyStop]);

  // Controls
  const toggleRunning = useCallback(() => {
    if (emergencyStop) return;
    setState(prev => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      saveState(newState);
      addStatus('info', newState.isRunning ? 'Paper trading started' : 'Paper trading paused');
      toast.info(newState.isRunning ? 'Paper trading started' : 'Paper trading paused');
      return newState;
    });
  }, [emergencyStop, addStatus]);

  const toggleAsset = useCallback((asset: Asset) => {
    setEnabledAssets(prev => {
      const next = { ...prev, [asset]: !prev[asset] };
      addStatus('info', `${asset} ${next[asset] ? 'enabled' : 'disabled'}`);
      return next;
    });
  }, [addStatus]);

  const triggerEmergencyStop = useCallback(() => {
    setEmergencyStop(true);
    setState(prev => {
      const newState = { ...prev, isRunning: false };
      saveState(newState);
      return newState;
    });
    addStatus('warning', '🚨 EMERGENCY STOP activated — all trading halted');
    toast.error('Emergency stop activated');
  }, [addStatus]);

  const clearEmergencyStop = useCallback(() => {
    setEmergencyStop(false);
    addStatus('info', 'Emergency stop cleared — ready to resume');
  }, [addStatus]);

  const reset = useCallback(() => {
    const newState = resetState();
    setState(newState);
    setStatusMessages([]);
    setMaxDrawdown(0);
    session.current = { startTime: Date.now(), maxDrawdown: 0 };
    saveSession(session.current);
    addStatus('info', 'Paper trading session reset');
    toast.info('Paper trading session reset');
  }, [addStatus]);

  // Daily PnL
  const dailyPnl = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return state.trades
      .filter(t => new Date(t.exitTime).toISOString().slice(0, 10) === today)
      .reduce((s, t) => s + t.pnl, 0);
  }, [state.trades]);

  return {
    state,
    candles,
    htfCandles,
    prices,
    signals,
    analytics,
    isLoading,
    lastUpdate,
    connectionStatus,
    statusMessages,
    enabledAssets,
    emergencyStop,
    maxDrawdown,
    dailyPnl,
    sessionStartTime: session.current.startTime,
    toggleRunning,
    toggleAsset,
    triggerEmergencyStop,
    clearEmergencyStop,
    reset,
    refetch: fetchData,
  };
}

function updateRiskTracking(
  state: TradingState,
  trade: { pnl: number; type: 'win' | 'loss'; asset?: Asset } | undefined,
  config: TradingConfig,
  candleIntervalMs: number,
  addStatus: (type: StatusMessage['type'], msg: string, asset?: Asset) => void,
): TradingState {
  if (!trade) return state;

  const today = new Date().toISOString().slice(0, 10);
  let dailyPnl = state.dailyPnlDate === today ? state.dailyPnl + trade.pnl : trade.pnl;
  let consecutiveLosses = trade.type === 'loss' ? state.consecutiveLosses + 1 : 0;
  let isPaused = state.isPaused;
  let pauseUntil = state.pauseUntil;
  let pauseReason = state.pauseReason;

  const dailyLossPercent = (Math.abs(Math.min(0, dailyPnl)) / state.initialBalance) * 100;
  if (config.filters.maxDailyLossPercent > 0 && dailyLossPercent >= config.filters.maxDailyLossPercent) {
    isPaused = true;
    pauseUntil = Date.now() + config.filters.pauseCandlesAfterLossLimit * candleIntervalMs;
    pauseReason = `Daily loss limit of ${config.filters.maxDailyLossPercent}% reached`;
    addStatus('warning', `⚠️ Trading paused: daily loss limit reached (${dailyLossPercent.toFixed(1)}%)`);
    logDecision({
      asset: (trade as any).asset || 'BTCUSDT', action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  } else if (config.filters.maxConsecutiveLosses > 0 && consecutiveLosses >= config.filters.maxConsecutiveLosses) {
    isPaused = true;
    pauseUntil = Date.now() + config.filters.pauseCandlesAfterLossLimit * candleIntervalMs;
    pauseReason = `${consecutiveLosses} consecutive losses`;
    addStatus('warning', `⚠️ Trading paused: ${consecutiveLosses} consecutive losses`);
    logDecision({
      asset: (trade as any).asset || 'BTCUSDT', action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  }

  return { ...state, dailyPnl, dailyPnlDate: today, consecutiveLosses, isPaused, pauseUntil, pauseReason };
}
