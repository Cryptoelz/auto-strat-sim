import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useBacktest } from '@/hooks/useBacktest';
import { useBacktestConfig, RISK_PRESETS, RiskPreset } from '@/hooks/useBacktestConfig';
import { StrategyOptimizer } from '@/components/backtest/StrategyOptimizer';
import { WalkForwardAnalysis } from '@/components/backtest/WalkForwardAnalysis';
import { ResultsDisplay } from '@/components/backtest/ResultsDisplay';
import { ComparisonTable } from '@/components/backtest/ComparisonTable';
import { BacktestConfigForm } from '@/components/backtest/BacktestConfigForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  AlertTriangle,
  BarChart3,
  Keyboard,
} from 'lucide-react';

const BACKTEST_SHORTCUTS = [
  { key: 'Enter', description: 'Run backtest' },
  { key: 'R', description: 'Reset results' },
  { key: '⌘/Ctrl+S', description: 'Save run for comparison' },
  { key: '⌘/Ctrl+E', description: 'Export results to CSV' },
  { key: '1', description: 'Apply Conservative preset' },
  { key: '2', description: 'Apply Moderate preset' },
  { key: '3', description: 'Apply Aggressive preset' },
  { key: '?', description: 'Show keyboard shortcuts' },
  { key: 'Esc', description: 'Close dialogs / unfocus' },
];

export default function Backtest() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { isRunning, progress, result, error, runBacktest, reset } = useBacktest();
  const config = useBacktestConfig();

  const handleRunBacktest = () => {
    const validation = config.validateConfig();
    if (!validation.success) return;
    runBacktest(config.buildConfig());
  };

  // Keyboard shortcuts for presets
  const handlePresetShortcut = useCallback((preset: RiskPreset) => {
    const presetConfig = RISK_PRESETS[preset];
    config.applyPreset(preset);
    toast.success(`${presetConfig.label} preset applied`, {
      description: `Position: ${presetConfig.positionSizePercent}% · SL: ${presetConfig.stopLossPercent}% · TP: ${presetConfig.takeProfitPercent}% · SMA: ${presetConfig.fastSMA}/${presetConfig.slowSMA}`,
    });
  }, [config]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape works even in inputs - closes dialogs and blurs focus
      if (e.key === 'Escape') {
        e.preventDefault();
        setShortcutsOpen(false);
        // Blur any focused element
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Ctrl/Cmd+S to save run - works everywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (result) {
          config.saveCurrentRun(result);
          toast.success('Run saved for comparison');
        } else {
          toast.error('No result to save', {
            description: 'Run a backtest first before saving',
          });
        }
        return;
      }

      // Ctrl/Cmd+E to export CSV - works everywhere
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (result) {
          config.exportCSV(result);
          toast.success('Results exported to CSV');
        } else {
          toast.error('No result to export', {
            description: 'Run a backtest first before exporting',
          });
        }
        return;
      }

      // Ignore other shortcuts if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isRunning) {
            handleRunBacktest();
          }
          break;
        case '1':
          e.preventDefault();
          handlePresetShortcut('conservative');
          break;
        case '2':
          e.preventDefault();
          handlePresetShortcut('moderate');
          break;
        case '3':
          e.preventDefault();
          handlePresetShortcut('aggressive');
          break;
        case '?':
          e.preventDefault();
          setShortcutsOpen(true);
          break;
        case 'r':
          e.preventDefault();
          if (result) {
            reset();
            toast.success('Results cleared');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePresetShortcut, isRunning, handleRunBacktest, result, config, reset]);

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
          <div className="flex items-center gap-2">
            <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Keyboard className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[340px]">
                <DialogHeader>
                  <DialogTitle>Keyboard Shortcuts</DialogTitle>
                  <DialogDescription>
                    Quick actions for the backtest page
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2 py-4">
                  {BACKTEST_SHORTCUTS.map((shortcut) => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                    >
                      <span className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </span>
                      <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
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
            feePercent={config.feePercent}
            onInitialBalanceChange={config.setInitialBalance}
            onPositionSizeChange={config.setPositionSizePercent}
            onStopLossChange={config.setStopLossPercent}
            onTakeProfitChange={config.setTakeProfitPercent}
            onFeeChange={config.setFeePercent}
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
            onShareConfig={config.copyShareableUrl}
            onResetToDefaults={config.resetConfig}
            onApplyPreset={config.applyPreset}
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
            {config.validationErrors.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/10 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">Validation Errors</p>
                      <ul className="text-sm text-destructive list-disc list-inside">
                        {config.validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
