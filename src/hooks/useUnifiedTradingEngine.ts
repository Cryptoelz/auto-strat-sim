/**
 * Unified Trading Engine Hook
 * 
 * Single hook that supports both polling-based simulation and live paper trading
 * with WebSocket streaming. Eliminates all duplicated logic between the former
 * useTradingEngine and usePaperTrading hooks.
 * 
 * Modes:
 *   - 'simulation' (default): Polls market data on interval, processes signals automatically
 *   - 'paper': Same as simulation but adds WebSocket streaming, emergency stop,
 *              per-asset toggles, status feed, drawdown tracking, session persistence
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Asset, Candle, TradingConfig, TradingState, Signal, AssetAnalytics, FilterBlockReason } from '@/types/trading';
import { DEFAULT_CONFIG } from '@/config/trading';
import { fetchCandles, fetchAllPrices, fetchHTFCandles } from '@/lib/marketData';
import { generateSignal, isInCooldown, CANDLE_INTERVAL_MS } from '@/lib/signalEngine';
import { checkAndExecuteRiskLimits, openLong, openShort, flipPosition, classifyVolatility } from '@/lib/executionSimulator';
import { saveState, loadState, resetState } from '@/lib/stateManager';
import { archiveSession } from '@/lib/sessionHistory';
import { canExecuteTrade } from '@/lib/riskManager';
import { runFilters, getHTFTrend } from '@/lib/filters';
import { calculateATR, calculateATRPercent, calculateSMA, calculateSMASlope, calculateSMADistance, detectMarketRegime } from '@/lib/indicators';
import { playSignalSound } from '@/lib/sounds';
import { logDecision, explainOpen, explainFlip, explainBlock, explainClose, explainRiskPause } from '@/lib/logger';
import { LiveMarketDataManager, ConnectionStatus } from '@/lib/liveMarketData';
import { computeUnrealizedPnl, computeEquity, computeDrawdown, computeDailyPnl } from '@/lib/tradingCalculations';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────

export type EngineMode = 'simulation' | 'paper';

export interface StatusMessage {
  id: string;
  timestamp: number;
  type: 'info' | 'trade' | 'warning' | 'error' | 'blocked';
  message: string;
  asset?: Asset;
}

/** Soak-test diagnostics — tracks long-session health metrics */
export interface SoakDiagnostics {
  sessionDurationMs: number;
  cycleCount: number;
  reconnectCount: number;
  errorCount: number;
  warningCount: number;
  blockedTradeCount: number;
  governanceTransitions: number;
  stateRestoreCount: number;
  lastCycleTimestamp: number;
}

/** Post-crossover distance-confirmation pending entry. */
export interface PendingCrossover {
  asset: Asset;
  direction: 'long' | 'short';
  originTs: number;
  originPrice: number;
  ageCandles: number;
}

/** Cumulative confirmation counters surfaced to the diagnostics widget. */
export interface SignalConfirmStats {
  registered: number;  // total pendings created
  passed: number;      // distance + HTF confirmed → promoted to execution
  failed: number;      // grace window exhausted without passing
  expired: number;     // SMA flipped against direction before confirmation
}

export interface UnifiedEngineOptions {
  mode?: EngineMode;
  config?: TradingConfig;
}

export interface UnifiedEngineResult {
  // Core state
  state: TradingState;
  candles: Record<Asset, Candle[]>;
  htfCandles: Record<Asset, Candle[]>;
  prices: Record<Asset, number | null>;
  signals: Record<Asset, Signal | null>;
  analytics: Record<Asset, AssetAnalytics>;
  isLoading: boolean;
  lastUpdate: Date | null;
  // Controls
  toggleRunning: () => void;
  reset: () => void;
  refetch: () => void;
  // Computed values
  equity: number;
  unrealizedPnl: number;
  peakEquity: number;
  drawdown: number;
  dailyPnl: number;
  // Paper-trading extras (always present but only active in paper mode)
  connectionStatus: ConnectionStatus;
  statusMessages: StatusMessage[];
  enabledAssets: Record<Asset, boolean>;
  emergencyStop: boolean;
  sessionStartTime: number;
  toggleAsset: (asset: Asset) => void;
  triggerEmergencyStop: () => void;
  clearEmergencyStop: () => void;
  clearConnectionErrors: () => void;
  // Soak-test diagnostics
  diagnostics: SoakDiagnostics;
  // Distance-confirmation pipeline (post-crossover gate)
  pendingCrossovers: Record<Asset, PendingCrossover | null>;
  signalConfirmStats: SignalConfirmStats;
}

// ─── Constants ──────────────────────────────────────

const POLL_INTERVAL = 60000;
const MAX_STATUS_MESSAGES = 100;
const SESSION_STORAGE_KEY = 'paper-trading-session';

const TIMEFRAME_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

const EMPTY_CANDLES = (): Record<Asset, Candle[]> => ({
  BTCUSDT: [], XRPUSDT: [], FETUSDT: [], XLMUSDT: [], ETHUSDT: [], SOLUSDT: [],
});

const EMPTY_PRICES = (): Record<Asset, number | null> => ({
  BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null, ETHUSDT: null, SOLUSDT: null,
});

const EMPTY_SIGNALS = (): Record<Asset, Signal | null> => ({
  BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null, ETHUSDT: null, SOLUSDT: null,
});

const EMPTY_ANALYTICS = (): Record<Asset, AssetAnalytics> => {
  const init = {} as Record<Asset, AssetAnalytics>;
  for (const a of ['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT', 'ETHUSDT', 'SOLUSDT'] as Asset[]) {
    init[a] = {
      price: null, smaFast: null, smaSlow: null, smaDistance: null,
      smaFastSlope: null, smaSlowSlope: null, htfTrend: 'neutral',
      atr: null, atrPercent: null, marketRegime: 'sideways',
      signal: null, position: null, unrealizedPnl: null, realizedPnl: 0,
      filterBlocked: null,
    };
  }
  return init;
};

// ─── Session persistence (paper mode only) ──────────

function loadSession(): { startTime: number; maxDrawdown: number } {
  try {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { startTime: Date.now(), maxDrawdown: 0 };
}

function saveSession(data: { startTime: number; maxDrawdown: number }): void {
  try { localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data)); } catch {}
}

// ─── Hook ───────────────────────────────────────────

export function useUnifiedTradingEngine({
  mode = 'simulation',
  config = DEFAULT_CONFIG,
}: UnifiedEngineOptions = {}): UnifiedEngineResult {
  const isPaperMode = mode === 'paper';

  // ── Core state ──
  const [state, setState] = useState<TradingState>(loadState);
  const [candles, setCandles] = useState<Record<Asset, Candle[]>>(EMPTY_CANDLES);
  const [htfCandles, setHtfCandles] = useState<Record<Asset, Candle[]>>(EMPTY_CANDLES);
  const [prices, setPrices] = useState<Record<Asset, number | null>>(EMPTY_PRICES);
  const [signals, setSignals] = useState<Record<Asset, Signal | null>>(EMPTY_SIGNALS);
  const [analytics, setAnalytics] = useState<Record<Asset, AssetAnalytics>>(EMPTY_ANALYTICS);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ── Paper-mode state ──
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false, reconnecting: false, lastMessage: 0, missedCandles: 0, error: null,
  });
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [enabledAssets, setEnabledAssets] = useState<Record<Asset, boolean>>(() => {
    const init = {} as Record<Asset, boolean>;
    config.assets.forEach(a => init[a] = true);
    return init;
  });
  const [emergencyStop, setEmergencyStop] = useState(false);

  // ── Distance-confirmation pipeline state ──
  const [pendingCrossovers, setPendingCrossovers] = useState<Record<Asset, PendingCrossover | null>>(() => ({
    BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null, ETHUSDT: null, SOLUSDT: null,
  }));
  const [signalConfirmStats, setSignalConfirmStats] = useState<SignalConfirmStats>({
    registered: 0, passed: 0, failed: 0, expired: 0,
  });

  // ── Tracking refs ──
  const prevSignalsRef = useRef<Record<Asset, Signal | null> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsManagerRef = useRef<LiveMarketDataManager | null>(null);
  const sessionRef = useRef(isPaperMode ? loadSession() : { startTime: Date.now(), maxDrawdown: 0 });
  const peakEquityRef = useRef(config.risk.positionSizePercent ? state.initialBalance : 10000);

  // ── Soak diagnostics ref ──
  const diagnosticsRef = useRef<SoakDiagnostics>({
    sessionDurationMs: 0,
    cycleCount: 0,
    reconnectCount: 0,
    errorCount: 0,
    warningCount: 0,
    blockedTradeCount: 0,
    governanceTransitions: 0,
    stateRestoreCount: 0,
    lastCycleTimestamp: Date.now(),
  });

  const candleIntervalMs = TIMEFRAME_MS[config.timeframe] || CANDLE_INTERVAL_MS;

  // ── Status message helper (paper mode) + diagnostics tracking ──
  const addStatus = useCallback((type: StatusMessage['type'], message: string, asset?: Asset) => {
    // Track soak diagnostics regardless of mode
    if (type === 'error') diagnosticsRef.current.errorCount++;
    if (type === 'warning') diagnosticsRef.current.warningCount++;
    if (type === 'blocked') diagnosticsRef.current.blockedTradeCount++;

    if (!isPaperMode) return;
    setStatusMessages(prev => [{
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(), type, message, asset,
    }, ...prev].slice(0, MAX_STATUS_MESSAGES));
  }, [isPaperMode]);

  // ── Compute analytics for one asset ──
  const computeAnalytics = useCallback((
    asset: Asset, ac: Candle[], htf: Candle[], price: number | null, currentState: TradingState,
  ): AssetAnalytics => {
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
      const filterResult = runFilters(
        result.signal.type, ac, htf, marketRegime, config.filters,
        currentState, config.indicators.fastSMA, config.indicators.slowSMA,
      );
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

  // ── Fetch market data ──
  const fetchData = useCallback(async () => {
    try {
      const candlePromises = config.assets.map(a => fetchCandles(a, config.timeframe));
      const htfPromises = config.assets.map(a => fetchHTFCandles(a, config.filters.higherTimeframe));
      const pricePromise = fetchAllPrices(config.assets);

      const [candleResults, htfResults, currentPrices] = await Promise.all([
        Promise.all(candlePromises), Promise.all(htfPromises), pricePromise,
      ]);

      const allCandles: Record<Asset, Candle[]> = EMPTY_CANDLES();
      const allHTF: Record<Asset, Candle[]> = EMPTY_CANDLES();
      config.assets.forEach((asset, i) => {
        allCandles[asset] = candleResults[i];
        allHTF[asset] = htfResults[i];
      });

      setCandles(allCandles);
      setHtfCandles(allHTF);
      setPrices(currentPrices);
      setLastUpdate(new Date());

      const newSignals: Record<Asset, Signal | null> = EMPTY_SIGNALS();
      const newAnalytics: Record<Asset, AssetAnalytics> = {} as any;

      setState(prev => {
        for (const asset of config.assets) {
          const a = computeAnalytics(asset, allCandles[asset], allHTF[asset], currentPrices[asset], prev);
          newAnalytics[asset] = a;
          if (a.signal) newSignals[asset] = a.signal;
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
        setAnalytics(newAnalytics);
        setSignals(newSignals);

        // Check risk limits — pass current regime/volatility per asset for exit context
        const exitContexts: Partial<Record<Asset, { regime?: typeof newAnalytics[Asset]['marketRegime']; volatilityLevel?: 'low' | 'moderate' | 'high' }>> = {};
        for (const a of config.assets) {
          const an = newAnalytics[a];
          if (!an) continue;
          exitContexts[a] = {
            regime: an.marketRegime,
            volatilityLevel: classifyVolatility(an.atrPercent),
          };
        }
        const newState = checkAndExecuteRiskLimits(prev, currentPrices, config, exitContexts);
        if (newState !== prev) {
          saveState(newState);
          // Log closed positions
          for (const asset of config.assets) {
            if (prev.positions[asset] && !newState.positions[asset]) {
              const trade = newState.trades[newState.trades.length - 1];
              if (trade) {
                const reason = trade.exitReason === 'stop_loss' ? 'Stop Loss' : 'Take Profit';
                toast.info(`${asset} ${trade.direction.toUpperCase()} closed: ${reason}`);
                addStatus('trade', `${asset} closed: ${reason}`, asset as Asset);
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
      diagnosticsRef.current.cycleCount++;
      diagnosticsRef.current.lastCycleTimestamp = Date.now();
      addStatus('info', 'Market data loaded successfully');
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch market data');
      addStatus('error', 'Failed to fetch market data');
      setIsLoading(false);
    }
  }, [config, computeAnalytics, addStatus]);

  // ── Process signals ──
  const processSignals = useCallback(() => {
    if (!state.isRunning) return;
    if (isPaperMode && emergencyStop) return;

    setState(prev => {
      let newState = { ...prev };

      // Clear pause if time elapsed
      if (newState.isPaused && Date.now() >= newState.pauseUntil) {
        newState = { ...newState, isPaused: false, pauseUntil: 0, pauseReason: null };
        toast.info('Trading resumed after loss-limit pause');
        addStatus('info', 'Trading resumed after loss-limit pause');
      }

      // Reset daily PnL if new day
      const today = new Date().toISOString().slice(0, 10);
      if (newState.dailyPnlDate !== today) {
        newState = { ...newState, dailyPnl: 0, dailyPnlDate: today };
      }

      for (const asset of config.assets) {
        // In paper mode, skip disabled assets
        if (isPaperMode && !enabledAssets[asset]) continue;

        const signal = signals[asset];
        const price = prices[asset];
        const position = newState.positions[asset];
        const assetAnalytic = analytics[asset];

        if (!signal || !price || signal.type === 'HOLD') continue;

        // Build per-trade entry context snapshot
        const entryCtx = {
          regime: assetAnalytic?.marketRegime,
          volatilityLevel: classifyVolatility(assetAnalytic?.atrPercent ?? null),
          atrPercent: assetAnalytic?.atrPercent ?? undefined,
          smaDistance: assetAnalytic?.smaDistance ?? undefined,
          strategySource: 'sma_crossover',
          governanceState: newState.isPaused ? 'paused' : (isPaperMode && emergencyStop ? 'halted' : 'active'),
        };

        // Check if filters block this signal
        if (assetAnalytic?.filterBlocked) {
          const prevSig = prevSignalsRef.current?.[asset];
          if (!prevSig || prevSig.type !== signal.type) {
            const explanation = explainBlock(asset, signal.type, assetAnalytic.filterBlocked);
            addStatus('blocked', explanation, asset);
            logDecision({
              asset, action: 'blocked', explanation,
              signal: signal.type, regime: assetAnalytic.marketRegime,
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
              newState = flipPosition(newState, asset, price, 'long', 'flip_to_long', config, entryCtx);
              const closeTrade = newState.trades[newState.trades.length - 2];
              const pnlText = closeTrade?.pnl >= 0 ? `+$${closeTrade.pnl.toFixed(2)}` : `-$${Math.abs(closeTrade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: SHORT→LONG at $${price.toFixed(2)} (P&L: ${pnlText})`);
              const msg = explainFlip(asset, oldDir, 'long', price, assetAnalytic?.marketRegime || 'sideways');
              addStatus('trade', msg, asset);
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs, addStatus);
              logDecision({ asset, action: 'flipped', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openLong(newState, asset, price, config, entryCtx);
                const msg = explainOpen(asset, 'long', price, assetAnalytic?.marketRegime || 'sideways', signal.type);
                toast.success(`📈 ${asset} LONG opened at $${price.toFixed(2)}`);
                addStatus('trade', msg, asset);
                logDecision({ asset, action: 'opened_long', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
              }
            } else if (isPaperMode) {
              addStatus('blocked', `Waiting for cooldown on ${asset}`, asset);
            }
          }
        }

        if (signal.type === 'SELL') {
          if (position?.direction === 'long') {
            const validation = canExecuteTrade(newState.balance + position.size * position.entryPrice, price, config);
            if (validation.valid) {
              const oldDir = position.direction;
              newState = flipPosition(newState, asset, price, 'short', 'flip_to_short', config, entryCtx);
              const closeTrade = newState.trades[newState.trades.length - 2];
              const pnlText = closeTrade?.pnl >= 0 ? `+$${closeTrade.pnl.toFixed(2)}` : `-$${Math.abs(closeTrade.pnl).toFixed(2)}`;
              toast.success(`🔄 ${asset} FLIP: LONG→SHORT at $${price.toFixed(2)} (P&L: ${pnlText})`);
              const msg = explainFlip(asset, oldDir, 'short', price, assetAnalytic?.marketRegime || 'sideways');
              addStatus('trade', msg, asset);
              newState = updateRiskTracking(newState, closeTrade, config, candleIntervalMs, addStatus);
              logDecision({ asset, action: 'flipped', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
            }
          } else if (!position) {
            if (!isInCooldown(newState.lastTradeTime[asset], Date.now(), config.risk.cooldownCandles, candleIntervalMs)) {
              const validation = canExecuteTrade(newState.balance, price, config);
              if (validation.valid) {
                newState = openShort(newState, asset, price, config, entryCtx);
                const msg = explainOpen(asset, 'short', price, assetAnalytic?.marketRegime || 'sideways', signal.type);
                toast.success(`📉 ${asset} SHORT opened at $${price.toFixed(2)}`);
                addStatus('trade', msg, asset);
                logDecision({ asset, action: 'opened_short', explanation: msg, signal: signal.type, regime: assetAnalytic?.marketRegime });
              }
            }
          }
        }
      }

      if (newState !== prev) saveState(newState);
      return newState;
    });
  }, [state.isRunning, emergencyStop, isPaperMode, signals, prices, config, analytics, enabledAssets, candleIntervalMs, addStatus]);

  // ── Computed values ──
  const unrealizedPnl = useMemo(() => computeUnrealizedPnl(state.positions, prices), [state.positions, prices]);
  const equity = state.balance + unrealizedPnl;

  // Track peak equity and drawdown
  useEffect(() => {
    if (equity > peakEquityRef.current) {
      peakEquityRef.current = equity;
    }
    if (isPaperMode) {
      const dd = computeDrawdown(equity, state.initialBalance);
      if (dd > sessionRef.current.maxDrawdown) {
        sessionRef.current.maxDrawdown = dd;
        saveSession(sessionRef.current);
      }
    }
  }, [equity, isPaperMode, state.initialBalance]);

  const drawdown = computeDrawdown(equity, peakEquityRef.current);
  const dailyPnl = useMemo(() => computeDailyPnl(state.trades), [state.trades]);

  // ── WebSocket (paper mode only) ──
  useEffect(() => {
    if (!isPaperMode) return;

    const activeAssets = config.assets.filter(a => enabledAssets[a]);
    if (activeAssets.length === 0) return;

    const manager = new LiveMarketDataManager(
      activeAssets,
      config.timeframe,
      (asset, candle) => {
        setCandles(prev => {
          const updated = [...(prev[asset] || [])];
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
  }, [isPaperMode, config.assets.join(','), config.timeframe, enabledAssets, addStatus]);

  // ── Polling ──
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // ── Signal processing ──
  useEffect(() => {
    if (!state.isRunning) return;
    if (isPaperMode && emergencyStop) return;
    const timeout = setTimeout(processSignals, 100);
    return () => clearTimeout(timeout);
  }, [signals, state.isRunning, processSignals, isPaperMode, emergencyStop]);

  // ── Controls ──
  const toggleRunning = useCallback(() => {
    if (isPaperMode && emergencyStop) return;
    setState(prev => {
      const newState = { ...prev, isRunning: !prev.isRunning };
      saveState(newState);
      const label = isPaperMode ? 'Paper trading' : 'Agent';
      toast.info(newState.isRunning ? `${label} started` : `${label} paused`);
      addStatus('info', newState.isRunning ? `${label} started` : `${label} paused`);
      return newState;
    });
  }, [isPaperMode, emergencyStop, addStatus]);

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

  const clearConnectionErrors = useCallback(() => {
    wsManagerRef.current?.clearErrors();
    setConnectionStatus(prev => ({ ...prev, missedCandles: 0, error: null }));
    addStatus('info', 'Connection errors cleared — governance re-evaluating');
    toast.success('Connection errors cleared');
  }, [addStatus]);

  const reset = useCallback(() => {
    // Archive current session before resetting (paper mode only, if trades exist)
    if (isPaperMode && state.trades.length > 0) {
      archiveSession(state, sessionRef.current.startTime, sessionRef.current.maxDrawdown);
    }

    const newState = resetState();
    setState(newState);
    peakEquityRef.current = newState.initialBalance;
    diagnosticsRef.current = {
      ...diagnosticsRef.current,
      cycleCount: 0, errorCount: 0, warningCount: 0,
      blockedTradeCount: 0, governanceTransitions: 0,
      stateRestoreCount: 0, reconnectCount: 0,
      lastCycleTimestamp: Date.now(),
    };
    // Reset connection error tracking on session reset so governance does not
    // remain RESTRICTED based on errors from the previous session.
    wsManagerRef.current?.clearErrors();
    setConnectionStatus(prev => ({ ...prev, missedCandles: 0, error: null }));
    if (isPaperMode) {
      setStatusMessages([]);
      sessionRef.current = { startTime: Date.now(), maxDrawdown: 0 };
      saveSession(sessionRef.current);
      addStatus('info', 'Session reset (previous session archived)');
    }
    toast.info(isPaperMode ? 'Paper trading session reset (archived)' : 'Agent reset to initial state');
  }, [isPaperMode, addStatus, state]);

  // ── Update soak diagnostics on each cycle ──
  diagnosticsRef.current.sessionDurationMs = Date.now() - sessionRef.current.startTime;

  return {
    state, candles, htfCandles, prices, signals, analytics, isLoading, lastUpdate,
    toggleRunning, reset, refetch: fetchData,
    // Computed
    equity,
    unrealizedPnl,
    peakEquity: peakEquityRef.current,
    drawdown,
    dailyPnl,
    // Paper extras
    connectionStatus, statusMessages, enabledAssets, emergencyStop,
    sessionStartTime: sessionRef.current.startTime,
    toggleAsset, triggerEmergencyStop, clearEmergencyStop, clearConnectionErrors,
    // Soak diagnostics
    diagnostics: diagnosticsRef.current,
  };
}

// ── Risk tracking helper ──────────────────────────────

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
    toast.warning(`⚠️ Trading paused: daily loss limit reached`);
    logDecision({
      asset: (trade as any).asset || 'BTCUSDT',
      action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  } else if (config.filters.maxConsecutiveLosses > 0 && consecutiveLosses >= config.filters.maxConsecutiveLosses) {
    isPaused = true;
    pauseUntil = Date.now() + config.filters.pauseCandlesAfterLossLimit * candleIntervalMs;
    pauseReason = `${consecutiveLosses} consecutive losses`;
    addStatus('warning', `⚠️ Trading paused: ${consecutiveLosses} consecutive losses`);
    toast.warning(`⚠️ Trading paused: consecutive losses`);
    logDecision({
      asset: (trade as any).asset || 'BTCUSDT',
      action: 'risk_pause',
      explanation: explainRiskPause(pauseReason, config.filters.pauseCandlesAfterLossLimit),
    });
  }

  return { ...state, dailyPnl, dailyPnlDate: today, consecutiveLosses, isPaused, pauseUntil, pauseReason };
}

// ── Re-exports for backward compatibility ──
export { type ConnectionStatus } from '@/lib/liveMarketData';
