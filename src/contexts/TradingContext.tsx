import { createContext, useContext, useState, useMemo, useEffect, useRef, ReactNode } from 'react';
import { useUnifiedTradingEngine, StatusMessage, ConnectionStatus } from '@/hooks/useUnifiedTradingEngine';
import { useNotifications } from '@/hooks/useNotifications';
import { usePnlAlerts } from '@/hooks/usePnlAlerts';
import { useSessionAlerts } from '@/hooks/useSessionAlerts';
import { DEFAULT_CONFIG } from '@/config/trading';
import { StrategyConfig } from '@/components/StrategySettings';
import { Asset } from '@/types/trading';
import { PortfolioConfig, DEFAULT_PORTFOLIO_CONFIG } from '@/types/portfolio';
import { MultiStrategyConfig, DEFAULT_MULTI_STRATEGY_CONFIG } from '@/types/strategy';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { MemoryConfig, DEFAULT_MEMORY_CONFIG } from '@/types/memory';
import { GovernanceConfig, DEFAULT_GOVERNANCE_CONFIG, GovernanceStatus } from '@/types/governance';
import { OperatorState, OperatorConfig, DEFAULT_OPERATOR_STATE, DEFAULT_OPERATOR_CONFIG } from '@/types/operator';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import { useSyncExternalStore } from 'react';

interface TradingContextType {
  // Engine core
  state: ReturnType<typeof useUnifiedTradingEngine>['state'];
  candles: ReturnType<typeof useUnifiedTradingEngine>['candles'];
  prices: ReturnType<typeof useUnifiedTradingEngine>['prices'];
  signals: ReturnType<typeof useUnifiedTradingEngine>['signals'];
  analytics: ReturnType<typeof useUnifiedTradingEngine>['analytics'];
  isLoading: boolean;
  lastUpdate: Date | null;
  toggleRunning: () => void;
  reset: () => void;
  refetch: () => void;
  // Computed values (single source of truth)
  equity: number;
  unrealizedPnl: number;
  peakEquity: number;
  drawdown: number;
  dailyPnl: number;
  // Paper-mode controls (always available, active when on paper page)
  connectionStatus: ConnectionStatus;
  statusMessages: StatusMessage[];
  enabledAssets: Record<Asset, boolean>;
  emergencyStop: boolean;
  sessionStartTime: number;
  toggleAsset: (asset: Asset) => void;
  triggerEmergencyStop: () => void;
  clearEmergencyStop: () => void;
  clearConnectionErrors: () => void;
  // Config
  strategyConfig: StrategyConfig;
  setStrategyConfig: (c: StrategyConfig) => void;
  config: any;
  // Portfolio
  portfolioConfig: PortfolioConfig;
  setPortfolioConfig: (c: PortfolioConfig) => void;
  // Multi-strategy
  multiStrategyConfig: MultiStrategyConfig;
  setMultiStrategyConfig: (c: MultiStrategyConfig) => void;
  // Agent
  agentConfig: AgentConfig;
  setAgentConfig: (c: AgentConfig) => void;
  // Memory
  memoryConfig: MemoryConfig;
  setMemoryConfig: (c: MemoryConfig) => void;
  // Governance
  governanceConfig: GovernanceConfig;
  setGovernanceConfig: (c: GovernanceConfig) => void;
  prevGovStatus: GovernanceStatus | null;
  // Operator
  operatorState: OperatorState;
  setOperatorState: (s: OperatorState) => void;
  operatorConfig: OperatorConfig;
  setOperatorConfig: (c: OperatorConfig) => void;
  // Decision log
  blockedSignals: any[];
  decisionLog: any[];
  // Distance-confirmation pipeline
  pendingCrossovers: ReturnType<typeof useUnifiedTradingEngine>['pendingCrossovers'];
  signalConfirmStats: ReturnType<typeof useUnifiedTradingEngine>['signalConfirmStats'];
  executionAttempts: ReturnType<typeof useUnifiedTradingEngine>['executionAttempts'];
  liveActivity: ReturnType<typeof useUnifiedTradingEngine>['liveActivity'];

  // Notifications
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => void;
}

const TradingCtx = createContext<TradingContextType | null>(null);

export function useTradingContext() {
  const ctx = useContext(TradingCtx);
  if (!ctx) throw new Error('useTradingContext must be used within TradingProvider');
  return ctx;
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>(DEFAULT_PORTFOLIO_CONFIG);
  const [multiStrategyConfig, setMultiStrategyConfig] = useState<MultiStrategyConfig>(DEFAULT_MULTI_STRATEGY_CONFIG);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>(DEFAULT_MEMORY_CONFIG);
  const [governanceConfig, setGovernanceConfig] = useState<GovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG);
  const [prevGovStatus, setPrevGovStatus] = useState<GovernanceStatus | null>(null);
  const [operatorState, setOperatorState] = useState<OperatorState>(DEFAULT_OPERATOR_STATE);
  const [operatorConfig, setOperatorConfig] = useState<OperatorConfig>(DEFAULT_OPERATOR_CONFIG);

  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    timeframe: DEFAULT_CONFIG.timeframe as '5m' | '15m' | '1h' | '4h',
    enabledAssets: DEFAULT_CONFIG.assets as Asset[],
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
    pnlAlertProfit: null,
    pnlAlertLoss: null,
    filters: { ...DEFAULT_CONFIG.filters },
  });

  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    timeframe: strategyConfig.timeframe,
    assets: strategyConfig.enabledAssets,
    indicators: {
      ...DEFAULT_CONFIG.indicators,
      fastSMA: strategyConfig.fastSMA,
      slowSMA: strategyConfig.slowSMA,
    },
    risk: {
      ...DEFAULT_CONFIG.risk,
      positionSizePercent: strategyConfig.positionSizePercent,
      stopLossPercent: strategyConfig.stopLossPercent,
      takeProfitPercent: strategyConfig.takeProfitPercent,
    },
    filters: strategyConfig.filters,
  }), [strategyConfig]);

  // Single unified engine in paper mode (superset of simulation — includes WebSocket + emergency stop)
  const engine = useUnifiedTradingEngine({ mode: 'paper', config });

  usePnlAlerts({
    state: engine.state,
    profitTarget: strategyConfig.pnlAlertProfit,
    lossLimit: strategyConfig.pnlAlertLoss,
  });

  useSessionAlerts({
    state: engine.state,
    drawdown: engine.drawdown,
    sessionStartTime: engine.sessionStartTime,
    isRunning: engine.state.isRunning,
  });

  const { permission, isSupported, requestPermission, sendSignalNotification } = useNotifications();
  const prevSignalsRef = useRef<Record<Asset, string | null>>({ BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null, ETHUSDT: null, SOLUSDT: null });

  useEffect(() => {
    if (permission !== 'granted') return;
    strategyConfig.enabledAssets.forEach((asset) => {
      const signal = engine.signals[asset];
      if (signal && signal.type !== 'HOLD') {
        const signalKey = `${signal.type}-${signal.timestamp}`;
        if (prevSignalsRef.current[asset] !== signalKey) {
          sendSignalNotification(signal);
          prevSignalsRef.current[asset] = signalKey;
        }
      }
    });
  }, [engine.signals, permission, sendSignalNotification, strategyConfig.enabledAssets]);

  const decisionLog = useSyncExternalStore(subscribeToLog, getLogEntries);
  const blockedSignals = useMemo(() => decisionLog.filter(e => e.action === 'blocked'), [decisionLog]);

  const value = useMemo<TradingContextType>(() => ({
    // Core engine state
    state: engine.state,
    candles: engine.candles,
    prices: engine.prices,
    signals: engine.signals,
    analytics: engine.analytics,
    isLoading: engine.isLoading,
    lastUpdate: engine.lastUpdate,
    toggleRunning: engine.toggleRunning,
    reset: engine.reset,
    refetch: engine.refetch,
    // Computed (single source of truth)
    equity: engine.equity,
    unrealizedPnl: engine.unrealizedPnl,
    peakEquity: engine.peakEquity,
    drawdown: engine.drawdown,
    dailyPnl: engine.dailyPnl,
    // Paper-mode controls
    connectionStatus: engine.connectionStatus,
    statusMessages: engine.statusMessages,
    enabledAssets: engine.enabledAssets,
    emergencyStop: engine.emergencyStop,
    sessionStartTime: engine.sessionStartTime,
    toggleAsset: engine.toggleAsset,
    triggerEmergencyStop: engine.triggerEmergencyStop,
    clearEmergencyStop: engine.clearEmergencyStop,
    clearConnectionErrors: engine.clearConnectionErrors,
    // Config
    strategyConfig, setStrategyConfig, config,
    portfolioConfig, setPortfolioConfig,
    multiStrategyConfig, setMultiStrategyConfig,
    agentConfig, setAgentConfig,
    memoryConfig, setMemoryConfig,
    governanceConfig, setGovernanceConfig, prevGovStatus,
    operatorState, setOperatorState,
    operatorConfig, setOperatorConfig,
    blockedSignals, decisionLog,
    pendingCrossovers: engine.pendingCrossovers,
    signalConfirmStats: engine.signalConfirmStats,
    executionAttempts: engine.executionAttempts,
    permission, isSupported, requestPermission,
  }), [
    engine, strategyConfig, config,
    portfolioConfig, multiStrategyConfig,
    agentConfig, memoryConfig,
    governanceConfig, prevGovStatus,
    operatorState, operatorConfig,
    blockedSignals, decisionLog,
    permission, isSupported, requestPermission,
  ]);

  return <TradingCtx.Provider value={value}>{children}</TradingCtx.Provider>;
}
