import { Link } from 'react-router-dom';
import { useBacktest } from '@/hooks/useBacktest';
import { useBacktestConfig } from '@/hooks/useBacktestConfig';
import { StrategyOptimizer } from '@/components/backtest/StrategyOptimizer';
import { WalkForwardAnalysis } from '@/components/backtest/WalkForwardAnalysis';
import { ResultsDisplay } from '@/components/backtest/ResultsDisplay';
import { ComparisonTable } from '@/components/backtest/ComparisonTable';
import { BacktestConfigForm } from '@/components/backtest/BacktestConfigForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  ArrowLeft, 
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

export default function Backtest() {
  const { isRunning, progress, result, error, runBacktest, reset } = useBacktest();
  const config = useBacktestConfig();

  const handleRunBacktest = () => {
    if (config.enabledAssets.length === 0) return;
    runBacktest(config.buildConfig());
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold md:text-xl">Strategy Backtester</h1>
              <p className="text-xs text-muted-foreground">Test your SMA crossover strategy on historical data</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <BacktestConfigForm
            startDate={config.startDate}
            endDate={config.endDate}
            onStartDateChange={config.setStartDate}
            onEndDateChange={config.setEndDate}
            timeframe={config.timeframe}
            onTimeframeChange={config.setTimeframe}
            enabledAssets={config.enabledAssets}
            onToggleAsset={config.toggleAsset}
            fastSMA={config.fastSMA}
            slowSMA={config.slowSMA}
            onFastSMAChange={config.setFastSMA}
            onSlowSMAChange={config.setSlowSMA}
            initialBalance={config.initialBalance}
            positionSizePercent={config.positionSizePercent}
            stopLossPercent={config.stopLossPercent}
            takeProfitPercent={config.takeProfitPercent}
            onInitialBalanceChange={config.setInitialBalance}
            onPositionSizeChange={config.setPositionSizePercent}
            onStopLossChange={config.setStopLossPercent}
            onTakeProfitChange={config.setTakeProfitPercent}
            isRunning={isRunning}
            progress={progress}
            result={result}
            onRunBacktest={handleRunBacktest}
            onReset={reset}
            onSaveRun={() => result && config.saveCurrentRun(result)}
            onExportCSV={() => result && config.exportCSV(result)}
            savedRuns={config.savedRuns}
            showComparison={config.showComparison}
            onToggleComparison={config.toggleComparison}
            onClearAllRuns={config.clearAllRuns}
            onExportComparison={config.exportComparison}
          />

          {/* Strategy Optimizer */}
          <StrategyOptimizer
            assets={config.enabledAssets}
            startDate={config.startDate}
            endDate={config.endDate}
            timeframe={config.timeframe}
            initialBalance={config.initialBalance}
            positionSizePercent={config.positionSizePercent}
            stopLossPercent={config.stopLossPercent}
            takeProfitPercent={config.takeProfitPercent}
            currentFastSMA={config.fastSMA}
            currentSlowSMA={config.slowSMA}
            onApplyOptimal={config.applyOptimalSMA}
          />

          {/* Walk-Forward Analysis */}
          <WalkForwardAnalysis
            assets={config.enabledAssets}
            startDate={config.startDate}
            endDate={config.endDate}
            timeframe={config.timeframe}
            initialBalance={config.initialBalance}
            positionSizePercent={config.positionSizePercent}
            stopLossPercent={config.stopLossPercent}
            takeProfitPercent={config.takeProfitPercent}
            fastSMARange={{ min: 5, max: 30, step: 5 }}
            slowSMARange={{ min: 20, max: 100, step: 10 }}
          />

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {!result && !isRunning && !error && !config.showComparison && (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Backtest</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your strategy parameters and click "Run Backtest" to simulate 
                    your SMA crossover strategy on historical market data.
                  </p>
                </CardContent>
              </Card>
            )}

            {config.showComparison && config.savedRuns.length > 0 && (
              <ComparisonTable runs={config.savedRuns} onRemove={config.deleteRun} />
            )}

            {result && !config.showComparison && (
              <ResultsDisplay 
                result={result} 
                fastSMA={config.fastSMA} 
                slowSMA={config.slowSMA} 
                stopLossPercent={config.stopLossPercent} 
                takeProfitPercent={config.takeProfitPercent} 
                positionSizePercent={config.positionSizePercent} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
