import { createContext, useContext, useState, useMemo, useEffect, useRef, memo, ReactNode } from 'react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useNotifications } from '@/hooks/useNotifications';
import { usePnlAlerts } from '@/hooks/usePnlAlerts';
import { DEFAULT_CONFIG } from '@/config/trading';
import { StrategyConfig } from '@/components/StrategySettings';
import { Asset } from '@/types/trading';
import { PortfolioConfig, DEFAULT_PORTFOLIO_CONFIG } from '@/types/portfolio';
import { MultiStrategyConfig, DEFAULT_MULTI_STRATEGY_CONFIG } from '@/types/strategy';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { MemoryConfig, DEFAULT_MEMORY_CONFIG } from '@/types/memory';
import { GovernanceConfig, DEFAULT_GOVERNANCE_CONFIG, GovernanceStatus } from '@/types/governance';
import { OperatorState, OperatorConfig, DEFAULT_OPERATOR_STATE, DEFAULT_OPERATOR_CONFIG } from '@/types/operator';
import { computePortfolioState } from '@/lib/portfolioManager';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import { useSyncExternalStore } from 'react';

interface TradingContextType {
  // Engine
  state: ReturnType<typeof useTradingEngine>['state'];
  candles: ReturnType<typeof useTradingEngine>['candles'];
  prices: ReturnType<typeof useTradingEngine>['prices'];
  signals: ReturnType<typeof useTradingEngine>['signals'];
  analytics: ReturnType<typeof useTradingEngine>['analytics'];
  isLoading: boolean;
  lastUpdate: Date | null;
  toggleRunning: () => void;
  reset: () => void;
  refetch: () => void;
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
  // Notifications
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => void;
  // Refs
  peakEquityRef: React.MutableRefObject<number>;
  portfolioLogsRef: React.MutableRefObject<any[]>;
  // Session
  sessionStartTime: number;
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
  const peakEquityRef = useRef(10000);
  const portfolioLogsRef = useRef<any[]>([]);
  const sessionStartTime = useRef(Date.now()).current;

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

  const {
    state, candles, prices, signals, analytics,
    isLoading, lastUpdate, toggleRunning, reset, refetch,
  } = useTradingEngine(config);

  usePnlAlerts({
    state,
    profitTarget: strategyConfig.pnlAlertProfit,
    lossLimit: strategyConfig.pnlAlertLoss,
  });

  const { permission, isSupported, requestPermission, sendSignalNotification } = useNotifications();
  const prevSignalsRef = useRef<Record<Asset, string | null>>({ BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null });

  useEffect(() => {
    if (permission !== 'granted') return;
    strategyConfig.enabledAssets.forEach((asset) => {
      const signal = signals[asset];
      if (signal && signal.type !== 'HOLD') {
        const signalKey = `${signal.type}-${signal.timestamp}`;
        if (prevSignalsRef.current[asset] !== signalKey) {
          sendSignalNotification(signal);
          prevSignalsRef.current[asset] = signalKey;
        }
      }
    });
  }, [signals, permission, sendSignalNotification, strategyConfig.enabledAssets]);

  const decisionLog = useSyncExternalStore(subscribeToLog, getLogEntries);
  const blockedSignals = useMemo(() => decisionLog.filter(e => e.action === 'blocked'), [decisionLog]);

  const value = useMemo<TradingContextType>(() => ({
    state, candles, prices, signals, analytics,
    isLoading, lastUpdate, toggleRunning, reset, refetch,
    strategyConfig, setStrategyConfig, config,
    portfolioConfig, setPortfolioConfig,
    multiStrategyConfig, setMultiStrategyConfig,
    agentConfig, setAgentConfig,
    memoryConfig, setMemoryConfig,
    governanceConfig, setGovernanceConfig, prevGovStatus,
    operatorState, setOperatorState,
    operatorConfig, setOperatorConfig,
    blockedSignals, decisionLog,
    permission, isSupported, requestPermission,
    peakEquityRef, portfolioLogsRef,
    sessionStartTime,
  }), [
    state, candles, prices, signals, analytics,
    isLoading, lastUpdate, toggleRunning, reset, refetch,
    strategyConfig, config,
    portfolioConfig, multiStrategyConfig,
    agentConfig, memoryConfig,
    governanceConfig, prevGovStatus,
    operatorState, operatorConfig,
    blockedSignals, decisionLog,
    permission, isSupported, requestPermission,
    sessionStartTime,
  ]);

  return <TradingCtx.Provider value={value}>{children}</TradingCtx.Provider>;
}
