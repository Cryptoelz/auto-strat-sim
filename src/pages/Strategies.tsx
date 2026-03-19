import { useTradingContext } from '@/contexts/TradingContext';
import { StrategyDashboard } from '@/components/trading/StrategyDashboard';

export default function Strategies() {
  const { candles, strategyConfig, multiStrategyConfig, setMultiStrategyConfig } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Strategy Comparison</h1>
        <p className="text-xs text-muted-foreground">Compare strategy performance, select active strategies, and tune parameters.</p>
      </div>
      <StrategyDashboard
        candles={candles}
        enabledAssets={strategyConfig.enabledAssets}
        multiConfig={multiStrategyConfig}
        onConfigChange={setMultiStrategyConfig}
      />
    </div>
  );
}
