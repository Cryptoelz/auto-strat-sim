import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBacktest } from '@/hooks/useBacktest';
import { BacktestConfig, SavedRun } from '@/types/backtest';
import { StrategyOptimizer } from '@/components/backtest/StrategyOptimizer';
import { WalkForwardAnalysis } from '@/components/backtest/WalkForwardAnalysis';
import { ResultsDisplay } from '@/components/backtest/ResultsDisplay';
import { ComparisonTable } from '@/components/backtest/ComparisonTable';
import { BacktestConfigForm } from '@/components/backtest/BacktestConfigForm';
import { 
  loadSavedRuns, 
  saveSavedRuns, 
  exportResultToCSV, 
  exportComparisonToCSV 
} from '@/lib/backtest-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Asset } from '@/types/trading';
import { subDays } from 'date-fns';
import { 
  ArrowLeft, 
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

export default function Backtest() {
  const { isRunning, progress, result, error, runBacktest, reset } = useBacktest();
  
  // Config state
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h'>('15m');
  const [enabledAssets, setEnabledAssets] = useState<Asset[]>(['BTCUSDT', 'XRPUSDT']);
  const [fastSMA, setFastSMA] = useState(20);
  const [slowSMA, setSlowSMA] = useState(50);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [positionSizePercent, setPositionSizePercent] = useState(5);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);

  // Saved runs state
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showComparison, setShowComparison] = useState(false);

  const saveCurrentRun = () => {
    if (!result) return;
    
    const runName = `SMA ${fastSMA}/${slowSMA} ${timeframe}`;
    const newRun: SavedRun = {
      id: `run-${Date.now()}`,
      name: runName,
      savedAt: Date.now(),
      config: {
        assets: enabledAssets,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe,
        fastSMA,
        slowSMA,
        initialBalance,
        positionSizePercent,
        stopLossPercent,
        takeProfitPercent,
      },
      result: {
        finalBalance: result.finalBalance,
        totalPnl: result.totalPnl,
        totalPnlPercent: result.totalPnlPercent,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        maxDrawdown: result.maxDrawdown,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
      },
    };

    const updatedRuns = [...savedRuns, newRun];
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const deleteRun = (id: string) => {
    const updatedRuns = savedRuns.filter(r => r.id !== id);
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const clearAllRuns = () => {
    setSavedRuns([]);
    saveSavedRuns([]);
    setShowComparison(false);
  };

  const toggleAsset = (asset: Asset) => {
    setEnabledAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleRunBacktest = () => {
    if (enabledAssets.length === 0) return;
    
    const config: BacktestConfig = {
      assets: enabledAssets,
      startDate,
      endDate,
      timeframe,
      fastSMA,
      slowSMA,
      initialBalance,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent,
      feePercent: 0.1,
    };

    runBacktest(config);
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
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            enabledAssets={enabledAssets}
            onToggleAsset={toggleAsset}
            fastSMA={fastSMA}
            slowSMA={slowSMA}
            onFastSMAChange={setFastSMA}
            onSlowSMAChange={setSlowSMA}
            initialBalance={initialBalance}
            positionSizePercent={positionSizePercent}
            stopLossPercent={stopLossPercent}
            takeProfitPercent={takeProfitPercent}
            onInitialBalanceChange={setInitialBalance}
            onPositionSizeChange={setPositionSizePercent}
            onStopLossChange={setStopLossPercent}
            onTakeProfitChange={setTakeProfitPercent}
            isRunning={isRunning}
            progress={progress}
            result={result}
            onRunBacktest={handleRunBacktest}
            onReset={reset}
            onSaveRun={saveCurrentRun}
            onExportCSV={() => result && exportResultToCSV(result, { fastSMA, slowSMA, timeframe })}
            savedRuns={savedRuns}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison(!showComparison)}
            onClearAllRuns={clearAllRuns}
            onExportComparison={() => exportComparisonToCSV(savedRuns)}
          />

          {/* Strategy Optimizer */}
          <StrategyOptimizer
            assets={enabledAssets}
            startDate={startDate}
            endDate={endDate}
            timeframe={timeframe}
            initialBalance={initialBalance}
            positionSizePercent={positionSizePercent}
            stopLossPercent={stopLossPercent}
            takeProfitPercent={takeProfitPercent}
            currentFastSMA={fastSMA}
            currentSlowSMA={slowSMA}
            onApplyOptimal={(fast, slow) => {
              setFastSMA(fast);
              setSlowSMA(slow);
            }}
          />

          {/* Walk-Forward Analysis */}
          <WalkForwardAnalysis
            assets={enabledAssets}
            startDate={startDate}
            endDate={endDate}
            timeframe={timeframe}
            initialBalance={initialBalance}
            positionSizePercent={positionSizePercent}
            stopLossPercent={stopLossPercent}
            takeProfitPercent={takeProfitPercent}
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

            {!result && !isRunning && !error && !showComparison && (
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

            {showComparison && savedRuns.length > 0 && (
              <ComparisonTable runs={savedRuns} onRemove={deleteRun} />
            )}

            {result && !showComparison && <ResultsDisplay result={result} fastSMA={fastSMA} slowSMA={slowSMA} stopLossPercent={stopLossPercent} takeProfitPercent={takeProfitPercent} positionSizePercent={positionSizePercent} />}
          </div>
        </div>
      </main>
    </div>
  );
}