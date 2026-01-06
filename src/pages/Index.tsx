import { useState, useMemo } from 'react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { DashboardHeader } from '@/components/trading/DashboardHeader';
import { BalanceCard, PriceCard, ModeCard } from '@/components/trading/DashboardCards';
import { PriceChart } from '@/components/trading/PriceChart';
import { SignalAlert } from '@/components/trading/SignalAlert';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CONFIG } from '@/config/trading';
import { StrategyConfig } from '@/components/StrategySettings';

const Index = () => {
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
  });

  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    indicators: {
      ...DEFAULT_CONFIG.indicators,
      fastSMA: strategyConfig.fastSMA,
      slowSMA: strategyConfig.slowSMA,
    },
    risk: {
      ...DEFAULT_CONFIG.risk,
      stopLossPercent: strategyConfig.stopLossPercent,
      takeProfitPercent: strategyConfig.takeProfitPercent,
    },
  }), [strategyConfig]);

  const {
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
    refetch,
  } = useTradingEngine(config);

  const handleConfigChange = (newConfig: StrategyConfig) => {
    setStrategyConfig(newConfig);
  };

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
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Top cards row */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-4">
          <BalanceCard state={state} prices={prices} />
          <PriceCard asset="BTCUSDT" price={prices.BTCUSDT} />
          <PriceCard asset="XRPUSDT" price={prices.XRPUSDT} />
          <ModeCard
            mode={state.mode}
            isRunning={state.isRunning}
            onToggleMode={toggleMode}
            onToggleRunning={toggleRunning}
          />
        </div>

        {/* Charts and signals row */}
        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 lg:grid-cols-2">
          <div className="space-y-3 sm:space-y-4">
            <PriceChart
              asset="BTCUSDT"
              candles={candles.BTCUSDT}
              position={state.positions.BTCUSDT}
              fastSMA={strategyConfig.fastSMA}
              slowSMA={strategyConfig.slowSMA}
            />
            <SignalAlert
              asset="BTCUSDT"
              signal={signals.BTCUSDT}
              position={state.positions.BTCUSDT}
              currentPrice={prices.BTCUSDT}
              mode={state.mode}
              onExecute={executeTrade}
            />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <PriceChart
              asset="XRPUSDT"
              candles={candles.XRPUSDT}
              position={state.positions.XRPUSDT}
              fastSMA={strategyConfig.fastSMA}
              slowSMA={strategyConfig.slowSMA}
            />
            <SignalAlert
              asset="XRPUSDT"
              signal={signals.XRPUSDT}
              position={state.positions.XRPUSDT}
              currentPrice={prices.XRPUSDT}
              mode={state.mode}
              onExecute={executeTrade}
            />
          </div>
        </div>

        {/* History and performance row */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <TradeHistory trades={state.trades} />
          <PerformanceStats state={state} />
        </div>

        {/* Footer disclaimer */}
        <footer className="mt-6 rounded-lg border border-border/50 bg-card/30 p-3 text-center sm:mt-8 sm:p-4">
          <p className="text-xs text-muted-foreground sm:text-sm">
            ⚠️ <strong>SIMULATION ONLY</strong> - Paper trading for educational purposes. No real trades.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
