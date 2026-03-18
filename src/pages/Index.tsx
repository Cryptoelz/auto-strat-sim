import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useNotifications } from '@/hooks/useNotifications';
import { usePnlAlerts } from '@/hooks/usePnlAlerts';
import { DashboardHeader } from '@/components/trading/DashboardHeader';
import { BalanceCard, PriceCard } from '@/components/trading/DashboardCards';
import { PriceChart } from '@/components/trading/PriceChart';
import { AssetDetailPanel } from '@/components/trading/AssetDetailPanel';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { TradeJournal } from '@/components/trading/TradeJournal';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { AssetBreakdown } from '@/components/trading/AssetBreakdown';
import { PortfolioAllocation } from '@/components/trading/PortfolioAllocation';
import { PortfolioDashboard } from '@/components/trading/PortfolioDashboard';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';
import { StrategyDashboard } from '@/components/trading/StrategyDashboard';
import { AgentStatusCard } from '@/components/trading/AgentStatusCard';
import { DecisionLog } from '@/components/trading/DecisionLog';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CONFIG } from '@/config/trading';
import { StrategyConfig } from '@/components/StrategySettings';
import { Asset, DecisionLogEntry } from '@/types/trading';
import { PortfolioConfig, DEFAULT_PORTFOLIO_CONFIG } from '@/types/portfolio';
import { MultiStrategyConfig, DEFAULT_MULTI_STRATEGY_CONFIG } from '@/types/strategy';
import { AgentDecisionDashboard } from '@/components/trading/AgentDecisionDashboard';
import { AgentMemoryDashboard } from '@/components/trading/AgentMemoryDashboard';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { MemoryConfig, DEFAULT_MEMORY_CONFIG } from '@/types/memory';
import { GovernanceConfig, DEFAULT_GOVERNANCE_CONFIG, GovernanceStatus } from '@/types/governance';
import { AgentGovernanceDashboard } from '@/components/trading/AgentGovernanceDashboard';
import { computePortfolioState } from '@/lib/portfolioManager';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import { useSyncExternalStore } from 'react';

const MemoizedPortfolioAllocation = memo(PortfolioAllocation);
const MemoizedAssetBreakdown = memo(AssetBreakdown);
const MemoizedTradeJournal = memo(TradeJournal);
const MemoizedPerformanceStats = memo(PerformanceStats);

const Index = () => {
  // Subscribe to decision log for blocked signals
  const decisionLog = useSyncExternalStore(subscribeToLog, getLogEntries);
  const blockedSignals = useMemo(() => decisionLog.filter(e => e.action === 'blocked'), [decisionLog]);

  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>(DEFAULT_PORTFOLIO_CONFIG);
  const [multiStrategyConfig, setMultiStrategyConfig] = useState<MultiStrategyConfig>(DEFAULT_MULTI_STRATEGY_CONFIG);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>(DEFAULT_MEMORY_CONFIG);
  const [governanceConfig, setGovernanceConfig] = useState<GovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG);
  const [prevGovStatus, setPrevGovStatus] = useState<GovernanceStatus | null>(null);
  const peakEquityRef = useRef(10000);
  const portfolioLogsRef = useRef<any[]>([]);

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
    state,
    candles,
    prices,
    signals,
    analytics,
    isLoading,
    lastUpdate,
    toggleRunning,
    reset,
    refetch,
  } = useTradingEngine(config);

  const handleConfigChange = (newConfig: StrategyConfig) => {
    setStrategyConfig(newConfig);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[350px]" />
            <Skeleton className="h-[350px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        lastUpdate={lastUpdate}
        isLoading={isLoading}
        onRefresh={refetch}
        onReset={reset}
        onConfigChange={handleConfigChange}
        strategyConfig={strategyConfig}
        notificationPermission={permission}
        notificationsSupported={isSupported}
        onRequestNotifications={requestPermission}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Top cards row */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-4">
          <BalanceCard state={state} prices={prices} />
          {strategyConfig.enabledAssets.map((asset) => (
            <PriceCard key={asset} asset={asset} price={prices[asset]} />
          ))}
          <AgentStatusCard
            isRunning={state.isRunning}
            onToggleRunning={toggleRunning}
            totalTrades={state.trades.length}
            isPaused={state.isPaused}
            pauseReason={state.pauseReason}
          />
        </div>

        {/* Charts + Asset Detail Panels */}
        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 md:grid-cols-2">
          {strategyConfig.enabledAssets.map((asset) => (
            <div key={asset} className="space-y-3 sm:space-y-4">
              <PriceChart
                asset={asset}
                candles={candles[asset]}
                position={state.positions[asset] ? { entryPrice: state.positions[asset]!.entryPrice, direction: state.positions[asset]!.direction } : null}
                fastSMA={strategyConfig.fastSMA}
                slowSMA={strategyConfig.slowSMA}
                trades={state.trades}
                blockedSignals={blockedSignals}
              />
              <AssetDetailPanel
                asset={asset}
                data={analytics[asset]}
              />
            </div>
          ))}
        </div>

        {/* Trade Log and Performance Dashboard */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <TradeHistory trades={state.trades} />
          <MemoizedPerformanceStats state={state} />
        </div>

        {/* Multi-Strategy Dashboard */}
        <div className="mt-4 sm:mt-6">
          <StrategyDashboard
            candles={candles}
            enabledAssets={strategyConfig.enabledAssets}
            multiConfig={multiStrategyConfig}
            onConfigChange={setMultiStrategyConfig}
          />
        </div>

        {/* Agent Decision Engine */}
        <div className="mt-4 sm:mt-6">
          <AgentDecisionDashboard
            candles={candles}
            analytics={analytics}
            state={state}
            enabledAssets={strategyConfig.enabledAssets}
            multiConfig={multiStrategyConfig}
            portfolioDrawdown={0}
            agentConfig={agentConfig}
            onAgentConfigChange={setAgentConfig}
          />
        </div>

        {/* Agent Memory & Adaptation */}
        <div className="mt-4 sm:mt-6">
          <AgentMemoryDashboard
            state={state}
            analytics={analytics}
            enabledAssets={strategyConfig.enabledAssets}
            portfolioDrawdown={0}
            memoryConfig={memoryConfig}
            onMemoryConfigChange={setMemoryConfig}
          />
        </div>

        <div className="mt-4 sm:mt-6">
          <DecisionLog />
        </div>

        {/* Portfolio Dashboard */}
        <div className="mt-4 sm:mt-6">
          <PortfolioDashboard
            portfolioState={computePortfolioState(
              state, prices, analytics, signals,
              strategyConfig.enabledAssets, portfolioConfig,
              peakEquityRef.current, portfolioLogsRef.current,
            )}
            portfolioConfig={portfolioConfig}
            onConfigChange={setPortfolioConfig}
            enabledAssets={strategyConfig.enabledAssets}
          />
        </div>

        {/* Portfolio and Asset breakdown */}
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
          <MemoizedPortfolioAllocation
            state={state}
            prices={prices}
            enabledAssets={strategyConfig.enabledAssets}
          />
          <MemoizedAssetBreakdown trades={state.trades} />
        </div>

        {/* Trading Journal */}
        <div className="mt-4 sm:mt-6">
          <MemoizedTradeJournal trades={state.trades} />
        </div>

        {/* Alerts, Reports & Daily Summary */}
        <div className="mt-4 sm:mt-6">
          <AlertsAndReports
            state={state}
            config={config}
            portfolioConfig={portfolioConfig}
            unrealizedPnl={Object.entries(state.positions).reduce((sum, [asset, pos]) => {
              if (!pos || !prices[asset as Asset]) return sum;
              const p = prices[asset as Asset]!;
              return sum + (pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size);
            }, 0)}
            maxDrawdown={0}
            sessionStartTime={Date.now()}
          />
        </div>

        {/* Footer disclaimer */}
        <footer className="mt-6 rounded-lg border border-border/50 bg-card/30 p-3 text-center sm:mt-8 sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">
            ⚠️ <strong>SIMULATION ONLY</strong> — Automated trading agent with trend, volatility, regime & trend-strength filters. No real trades.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
