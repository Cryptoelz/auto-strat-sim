import { memo, useMemo } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { PriceChart } from '@/components/trading/PriceChart';
import { AssetDetailPanel } from '@/components/trading/AssetDetailPanel';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { PortfolioAllocation } from '@/components/trading/PortfolioAllocation';
import { AssetBreakdown } from '@/components/trading/AssetBreakdown';
import { TradeJournal } from '@/components/trading/TradeJournal';
import { AgentStatusCard } from '@/components/trading/AgentStatusCard';
import { BalanceCard, PriceCard } from '@/components/trading/DashboardCards';
import { AgentDecisionDashboard } from '@/components/trading/AgentDecisionDashboard';
import { AgentMemoryDashboard } from '@/components/trading/AgentMemoryDashboard';
import { DecisionLog } from '@/components/trading/DecisionLog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Asset } from '@/types/trading';

const MemoizedPerformanceStats = memo(PerformanceStats);
const MemoizedPortfolioAllocation = memo(PortfolioAllocation);
const MemoizedAssetBreakdown = memo(AssetBreakdown);
const MemoizedTradeJournal = memo(TradeJournal);

export default function Trading() {
  const {
    state, candles, prices, signals, analytics, isLoading, lastUpdate,
    toggleRunning, reset, refetch,
    strategyConfig, setStrategyConfig,
    multiStrategyConfig,
    agentConfig, setAgentConfig,
    memoryConfig, setMemoryConfig,
    blockedSignals,
    peakEquityRef,
  } = useTradingContext();

  const portfolioDrawdown = useMemo(() => {
    let equity = state.balance;
    for (const [asset, pos] of Object.entries(state.positions)) {
      if (!pos || !prices[asset as Asset]) continue;
      const p = prices[asset as Asset]!;
      equity += pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size;
    }
    const peak = Math.max(peakEquityRef.current, equity);
    return peak > 0 ? ((peak - equity) / peak) * 100 : 0;
  }, [state, prices, peakEquityRef]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px]" /> <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Controls bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold sm:text-xl">Live Simulation</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading} className="h-8 text-xs gap-1">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
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

      {/* Charts + Asset Detail */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
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
            <AssetDetailPanel asset={asset} data={analytics[asset]} />
          </div>
        ))}
      </div>

      {/* Trade Log + Performance */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <TradeHistory trades={state.trades} />
        <MemoizedPerformanceStats state={state} />
      </div>

      {/* Agent Decision */}
      <AgentDecisionDashboard
        candles={candles}
        analytics={analytics}
        state={state}
        enabledAssets={strategyConfig.enabledAssets}
        multiConfig={multiStrategyConfig}
        portfolioDrawdown={portfolioDrawdown}
        agentConfig={agentConfig}
        onAgentConfigChange={setAgentConfig}
      />

      {/* Agent Memory */}
      <AgentMemoryDashboard
        state={state}
        analytics={analytics}
        enabledAssets={strategyConfig.enabledAssets}
        portfolioDrawdown={portfolioDrawdown}
        memoryConfig={memoryConfig}
        onMemoryConfigChange={setMemoryConfig}
      />

      <DecisionLog />

      {/* Portfolio + Asset breakdown */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <MemoizedPortfolioAllocation state={state} prices={prices} enabledAssets={strategyConfig.enabledAssets} />
        <MemoizedAssetBreakdown trades={state.trades} />
      </div>

      <MemoizedTradeJournal trades={state.trades} />
    </div>
  );
}
