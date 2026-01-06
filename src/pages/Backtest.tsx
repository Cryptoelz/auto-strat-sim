import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBacktest, BacktestConfig, BacktestResult } from '@/hooks/useBacktest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { format, subDays } from 'date-fns';
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  AlertTriangle,
  Trophy,
  Percent,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn(
              "text-lg font-bold mt-1",
              trend === 'up' && "text-trading-profit",
              trend === 'down' && "text-trading-loss"
            )}>
              {value}
            </p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            trend === 'up' && "bg-trading-profit/10 text-trading-profit",
            trend === 'down' && "bg-trading-loss/10 text-trading-loss",
            trend === 'neutral' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResultsDisplay({ result }: { result: BacktestResult }) {
  const pnlTrend = result.totalPnl >= 0 ? 'up' : 'down';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Final Balance"
          value={formatCurrency(result.finalBalance)}
          icon={DollarSign}
          trend={pnlTrend}
        />
        <StatCard
          title="Total P&L"
          value={`${result.totalPnl >= 0 ? '+' : ''}${formatCurrency(result.totalPnl)}`}
          icon={result.totalPnl >= 0 ? TrendingUp : TrendingDown}
          trend={pnlTrend}
        />
        <StatCard
          title="Return"
          value={`${result.totalPnlPercent >= 0 ? '+' : ''}${result.totalPnlPercent.toFixed(2)}%`}
          icon={Percent}
          trend={pnlTrend}
        />
        <StatCard
          title="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          icon={Trophy}
          trend={result.winRate >= 50 ? 'up' : 'down'}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trade Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{result.totalTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winning Trades</span>
              <span className="font-medium text-trading-profit">{result.winningTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Losing Trades</span>
              <span className="font-medium text-trading-loss">{result.losingTrades}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Win</span>
              <span className="font-medium text-trading-profit">{formatCurrency(result.averageWin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Loss</span>
              <span className="font-medium text-trading-loss">{formatCurrency(result.averageLoss)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-trading-loss">-{result.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className={cn(
                "font-medium",
                result.profitFactor >= 1 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className={cn(
                "font-medium",
                result.sharpeRatio >= 1 ? "text-trading-profit" : result.sharpeRatio >= 0 ? "text-foreground" : "text-trading-loss"
              )}>
                {result.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk/Reward</span>
              <span className="font-medium">
                {result.averageLoss !== 0 
                  ? Math.abs(result.averageWin / result.averageLoss).toFixed(2) 
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Breakdown */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance by Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(result.assetResults).map(([asset, stats]) => {
              if (stats.trades === 0) return null;
              const info = ASSET_INFO[asset as Asset];
              return (
                <div 
                  key={asset}
                  className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{info.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stats.trades} trades
                    </Badge>
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    stats.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                  )}>
                    {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Win Rate: {stats.winRate.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trade History</CardTitle>
          <CardDescription>All {result.trades.length} trades from backtest</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {result.trades.map((trade, i) => {
                const info = ASSET_INFO[trade.asset];
                return (
                  <div 
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/10 p-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-12">{info.symbol}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          trade.type === 'win'
                            ? "border-trading-profit/50 bg-trading-profit/10 text-trading-profit"
                            : "border-trading-loss/50 bg-trading-loss/10 text-trading-loss"
                        )}
                      >
                        {trade.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(trade.entryTime), 'MMM dd HH:mm')} → {format(new Date(trade.exitTime), 'MMM dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {trade.exitReason.replace('_', ' ')}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        trade.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
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
              <div className="flex gap-2 pt-2">
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

            {!result && !isRunning && !error && (
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

            {result && <ResultsDisplay result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
}