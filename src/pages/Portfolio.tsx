import { useTradingContext } from '@/contexts/TradingContext';
import { PortfolioDashboard } from '@/components/trading/PortfolioDashboard';
import { PortfolioAllocation } from '@/components/trading/PortfolioAllocation';
import { AssetBreakdown } from '@/components/trading/AssetBreakdown';
import { computePortfolioState } from '@/lib/portfolioManager';

export default function Portfolio() {
  const {
    state, prices, analytics, signals, strategyConfig,
    portfolioConfig, setPortfolioConfig,
    peakEquity,
  } = useTradingContext();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold sm:text-xl">Portfolio</h1>
        <p className="text-xs text-muted-foreground">Portfolio allocation, risk metrics, and asset breakdown.</p>
      </div>
      <PortfolioDashboard
        portfolioState={computePortfolioState(
          state, prices, analytics, signals,
          strategyConfig.enabledAssets, portfolioConfig,
          peakEquity, [],
        )}
        portfolioConfig={portfolioConfig}
        onConfigChange={setPortfolioConfig}
        enabledAssets={strategyConfig.enabledAssets}
      />
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <PortfolioAllocation state={state} prices={prices} enabledAssets={strategyConfig.enabledAssets} />
        <AssetBreakdown trades={state.trades} />
      </div>
    </div>
  );
}
