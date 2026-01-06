import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useNotifications } from '@/hooks/useNotifications';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { DashboardHeader } from '@/components/trading/DashboardHeader';
import { BalanceCard, PriceCard, ModeCard } from '@/components/trading/DashboardCards';
import { PriceChart } from '@/components/trading/PriceChart';
import { SignalAlert } from '@/components/trading/SignalAlert';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { AssetBreakdown } from '@/components/trading/AssetBreakdown';
import { PortfolioAllocation } from '@/components/trading/PortfolioAllocation';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_CONFIG } from '@/config/trading';
import { StrategyConfig } from '@/components/StrategySettings';
import { Asset } from '@/types/trading';
import { toast } from 'sonner';

const Index = () => {
  const [strategyConfig, setStrategyConfig] = useState<StrategyConfig>({
    timeframe: DEFAULT_CONFIG.timeframe as '5m' | '15m' | '1h' | '4h',
    enabledAssets: DEFAULT_CONFIG.assets as Asset[],
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
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

  // Keyboard shortcuts
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [keyboardEnabled, setKeyboardEnabled] = useState(true);

  const handleKeyboardBuy = useCallback((asset: Asset) => {
    if (!state.positions[asset]) {
      executeTrade(asset, 'buy');
    } else {
      toast.info(`Already have a ${asset} position`);
    }
  }, [state.positions, executeTrade]);

  const handleKeyboardSell = useCallback((asset: Asset) => {
    if (state.positions[asset]) {
      executeTrade(asset, 'sell');
    } else {
      toast.info(`No ${asset} position to sell`);
    }
  }, [state.positions, executeTrade]);

  useKeyboardShortcuts({
    enabled: keyboardEnabled,
    selectedAsset,
    onBuy: handleKeyboardBuy,
    onSell: handleKeyboardSell,
    onToggleMode: toggleMode,
    onToggleRunning: toggleRunning,
    onRefresh: refetch,
  });

  const { permission, isSupported, requestPermission, sendSignalNotification } = useNotifications();
  const prevSignalsRef = useRef<Record<Asset, string | null>>({ BTCUSDT: null, XRPUSDT: null, FETUSDT: null, XLMUSDT: null });

  // Send notifications when signals change
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
        keyboardEnabled={keyboardEnabled}
        onToggleKeyboard={() => setKeyboardEnabled(!keyboardEnabled)}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6">
        {/* Top cards row */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <BalanceCard state={state} prices={prices} />
          {strategyConfig.enabledAssets.map((asset) => (
            <PriceCard key={asset} asset={asset} price={prices[asset]} />
          ))}
          <ModeCard
            mode={state.mode}
            isRunning={state.isRunning}
            onToggleMode={toggleMode}
            onToggleRunning={toggleRunning}
          />
        </div>

        {/* Charts and signals grid */}
        <div className="mb-4 grid gap-4 sm:mb-6 sm:gap-6 md:grid-cols-2">
          {strategyConfig.enabledAssets.map((asset) => (
            <div key={asset} className="space-y-3 sm:space-y-4">
              <PriceChart
                asset={asset}
                candles={candles[asset]}
                position={state.positions[asset]}
                fastSMA={strategyConfig.fastSMA}
                slowSMA={strategyConfig.slowSMA}
                isSelected={selectedAsset === asset}
                onSelect={() => setSelectedAsset(selectedAsset === asset ? null : asset)}
              />
              <SignalAlert
                asset={asset}
                signal={signals[asset]}
                position={state.positions[asset]}
                currentPrice={prices[asset]}
                mode={state.mode}
                onExecute={executeTrade}
              />
            </div>
          ))}
        </div>

        {/* History and performance row */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <TradeHistory trades={state.trades} />
          <PerformanceStats state={state} />
        </div>

        {/* Portfolio and Asset breakdown */}
        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
          <PortfolioAllocation 
            state={state} 
            prices={prices} 
            enabledAssets={strategyConfig.enabledAssets} 
          />
          <AssetBreakdown trades={state.trades} />
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
