import { useTradingEngine } from '@/hooks/useTradingEngine';
import { DashboardHeader } from '@/components/trading/DashboardHeader';
import { BalanceCard, PriceCard, ModeCard } from '@/components/trading/DashboardCards';
import { PriceChart } from '@/components/trading/PriceChart';
import { SignalAlert } from '@/components/trading/SignalAlert';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
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
  } = useTradingEngine();

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
      />

      <main className="container mx-auto px-4 py-6">
        {/* Top cards row */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <PriceChart
              asset="BTCUSDT"
              candles={candles.BTCUSDT}
              position={state.positions.BTCUSDT}
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
          <div className="space-y-4">
            <PriceChart
              asset="XRPUSDT"
              candles={candles.XRPUSDT}
              position={state.positions.XRPUSDT}
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
        <div className="grid gap-6 lg:grid-cols-2">
          <TradeHistory trades={state.trades} />
          <PerformanceStats state={state} />
        </div>

        {/* Footer disclaimer */}
        <footer className="mt-8 rounded-lg border border-border/50 bg-card/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            ⚠️ <strong>SIMULATION ONLY</strong> - This is a paper trading simulator for educational purposes.
            No real trades are executed. This is not financial advice.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
