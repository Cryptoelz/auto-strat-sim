import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBacktest, BacktestConfig, BacktestResult } from '@/hooks/useBacktest';
import { StrategyOptimizer } from '@/components/backtest/StrategyOptimizer';
import { WalkForwardAnalysis } from '@/components/backtest/WalkForwardAnalysis';
import { ResultsDisplay } from '@/components/backtest/ResultsDisplay';
import { 
  SavedRun, 
  loadSavedRuns, 
  saveSavedRuns, 
  exportResultToCSV, 
  exportComparisonToCSV 
} from '@/lib/backtest-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { format, subDays } from 'date-fns';
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  AlertTriangle,
  BarChart3,
  Save,
  Trash2,
  GitCompare,
  X,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];



function ComparisonTable({ runs, onRemove }: { runs: SavedRun[]; onRemove: (id: string) => void }) {
  if (runs.length === 0) return null;

  const metrics = [
    { key: 'totalPnlPercent', label: 'Return', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, best: 'high' },
    { key: 'winRate', label: 'Win Rate', format: (v: number) => `${v.toFixed(1)}%`, best: 'high' },
    { key: 'totalTrades', label: 'Trades', format: (v: number) => v.toString(), best: 'neutral' },
    { key: 'maxDrawdown', label: 'Max DD', format: (v: number) => `-${v.toFixed(2)}%`, best: 'low' },
    { key: 'profitFactor', label: 'Profit Factor', format: (v: number) => v === Infinity ? '∞' : v.toFixed(2), best: 'high' },
    { key: 'sharpeRatio', label: 'Sharpe', format: (v: number) => v.toFixed(2), best: 'high' },
  ] as const;

  const getBestValue = (key: string, best: string) => {
    const values = runs.map(r => r.result[key as keyof typeof r.result] as number);
    if (best === 'high') return Math.max(...values);
    if (best === 'low') return Math.min(...values);
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          Strategy Comparison
          <Badge variant="secondary" className="ml-auto">{runs.length} runs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Strategy</th>
                {metrics.map(m => (
                  <th key={m.key} className="text-right py-2 px-2 text-muted-foreground font-medium">{m.label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 px-2">
                    <div>
                      <span className="font-medium">{run.name}</span>
                      <div className="text-xs text-muted-foreground">
                        SMA {run.config.fastSMA}/{run.config.slowSMA} • {run.config.timeframe}
                      </div>
                    </div>
                  </td>
                  {metrics.map(m => {
                    const value = run.result[m.key as keyof typeof run.result] as number;
                    const bestValue = getBestValue(m.key, m.best);
                    const isBest = bestValue !== null && value === bestValue && runs.length > 1;
                    return (
                      <td 
                        key={m.key} 
                        className={cn(
                          "text-right py-2 px-2",
                          isBest && m.best === 'high' && "text-trading-profit font-medium",
                          isBest && m.best === 'low' && "text-trading-profit font-medium",
                          m.key === 'totalPnlPercent' && value >= 0 && "text-trading-profit",
                          m.key === 'totalPnlPercent' && value < 0 && "text-trading-loss",
                        )}
                      >
                        {m.format(value)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(run.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

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
          <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Backtest Configuration</CardTitle>
              <CardDescription>Configure your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date > endDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timeframe</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trading Pairs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]).map((asset) => (
                    <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                      <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                      <Switch
                        checked={enabledAssets.includes(asset)}
                        onCheckedChange={() => toggleAsset(asset)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* SMA Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">SMA Indicators</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fast SMA</Label>
                    <Input
                      type="number"
                      value={fastSMA}
                      onChange={(e) => setFastSMA(parseInt(e.target.value) || 20)}
                      min={5}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Slow SMA</Label>
                    <Input
                      type="number"
                      value={slowSMA}
                      onChange={(e) => setSlowSMA(parseInt(e.target.value) || 50)}
                      min={10}
                      max={200}
                    />
                  </div>
                </div>
              </div>

              {/* Risk Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Risk Management</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Initial Balance ($)</Label>
                    <Input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(parseInt(e.target.value) || 10000)}
                      min={1000}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Position Size (%)</Label>
                    <Input
                      type="number"
                      value={positionSizePercent}
                      onChange={(e) => setPositionSizePercent(parseInt(e.target.value) || 5)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Stop Loss (%)</Label>
                    <Input
                      type="number"
                      value={stopLossPercent}
                      onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 2)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 4)}
                      min={0.5}
                      max={50}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleRunBacktest}
                    disabled={isRunning || enabledAssets.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>Running...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Backtest
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {result && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={saveCurrentRun}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save for Comparison
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportResultToCSV(result, { fastSMA, slowSMA, timeframe })}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Saved Runs */}
              {savedRuns.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Saved Runs ({savedRuns.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={clearAllRuns}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={showComparison ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowComparison(!showComparison)}
                      className="flex-1"
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      {showComparison ? 'Hide Comparison' : 'Compare Runs'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportComparisonToCSV(savedRuns)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Fetching historical data... {progress.toFixed(0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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