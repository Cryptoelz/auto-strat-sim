import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { GitBranch, Play, RotateCcw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Asset, Candle } from '@/types/trading';
import { WindowResult, WalkForwardResult } from '@/types/backtest';
import { runQuickBacktest } from '@/lib/backtest-engine';
import { formatCurrency } from '@/lib/performance';
import { format, addDays, differenceInDays } from 'date-fns';

interface WalkForwardAnalysisProps {
  assets: Asset[];
  startDate: Date;
  endDate: Date;
  timeframe: '5m' | '15m' | '1h' | '4h';
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  fastSMARange: { min: number; max: number; step: number };
  slowSMARange: { min: number; max: number; step: number };
}

const BINANCE_API = 'https://api.binance.com/api/v3';

const TIMEFRAME_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
};

async function fetchHistoricalCandles(
  asset: Asset,
  interval: string,
  startTime: number,
  endTime: number
): Promise<Candle[]> {
  const allCandles: Candle[] = [];
  let currentStart = startTime;
  const limit = 1000;

  while (currentStart < endTime) {
    try {
      const response = await fetch(
        `${BINANCE_API}/klines?symbol=${asset}&interval=${interval}&startTime=${currentStart}&endTime=${endTime}&limit=${limit}`
      );

      if (!response.ok) break;

      const data = await response.json();
      if (data.length === 0) break;

      const candles: Candle[] = data.map((candle: (string | number)[]) => ({
        timestamp: Number(candle[0]),
        open: parseFloat(candle[1] as string),
        high: parseFloat(candle[2] as string),
        low: parseFloat(candle[3] as string),
        close: parseFloat(candle[4] as string),
        volume: parseFloat(candle[5] as string),
      }));

      allCandles.push(...candles);
      currentStart = candles[candles.length - 1].timestamp + TIMEFRAME_MS[interval];
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch {
      break;
    }
  }

  return allCandles;
}

function runQuickBacktest(
  candles: Candle[],
  fastSMA: number,
  slowSMA: number,
  positionSizePercent: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  initialBalance: number
): { pnl: number; wins: number; losses: number } {
  let balance = initialBalance;
  let wins = 0;
  let losses = 0;
  let position: { entryPrice: number; size: number; stopLoss: number; takeProfit: number } | null = null;

  if (candles.length < slowSMA + 1) {
    return { pnl: 0, wins: 0, losses: 0 };
  }

  const fastSMAValues = calculateSMASeries(candles, fastSMA);
  const slowSMAValues = calculateSMASeries(candles, slowSMA);

  for (let i = slowSMA + 1; i < candles.length; i++) {
    const candle = candles[i];
    const currentPrice = candle.close;
    
    const fastCurrent = fastSMAValues[i];
    const slowCurrent = slowSMAValues[i];
    const fastPrevious = fastSMAValues[i - 1];
    const slowPrevious = slowSMAValues[i - 1];

    if (position) {
      let shouldClose = false;
      let exitPrice = currentPrice;

      if (candle.low <= position.stopLoss) {
        shouldClose = true;
        exitPrice = position.stopLoss;
      } else if (candle.high >= position.takeProfit) {
        shouldClose = true;
        exitPrice = position.takeProfit;
      } else {
        const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);
        if (crossover === -1) {
          shouldClose = true;
        }
      }

      if (shouldClose) {
        const grossPnl = (exitPrice - position.entryPrice) * position.size;
        const fee = position.size * exitPrice * 0.001 + position.size * position.entryPrice * 0.001;
        const netPnl = grossPnl - fee;

        if (netPnl >= 0) wins++;
        else losses++;

        balance += netPnl;
        position = null;
      }
    }

    if (!position) {
      const crossover = detectCrossover(fastCurrent, slowCurrent, fastPrevious, slowPrevious);
      
      if (crossover === 1) {
        const positionValue = balance * (positionSizePercent / 100);
        const fee = positionValue * 0.001;
        const size = (positionValue - fee) / currentPrice;
        
        if (size > 0 && positionValue < balance) {
          position = {
            entryPrice: currentPrice,
            size,
            stopLoss: currentPrice * (1 - stopLossPercent / 100),
            takeProfit: currentPrice * (1 + takeProfitPercent / 100),
          };
          balance -= fee;
        }
      }
    }
  }

  if (position && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    const exitPrice = lastCandle.close;
    const grossPnl = (exitPrice - position.entryPrice) * position.size;
    const fee = position.size * exitPrice * 0.001;
    const netPnl = grossPnl - fee;
    if (netPnl >= 0) wins++;
    else losses++;
    balance += netPnl;
  }

  return { pnl: balance - initialBalance, wins, losses };
}

function findOptimalParameters(
  candles: Candle[],
  fastRange: { min: number; max: number; step: number },
  slowRange: { min: number; max: number; step: number },
  positionSizePercent: number,
  stopLossPercent: number,
  takeProfitPercent: number,
  initialBalance: number
): { fastSMA: number; slowSMA: number; pnl: number; wins: number; losses: number } {
  let bestResult = { fastSMA: fastRange.min, slowSMA: slowRange.min, pnl: -Infinity, wins: 0, losses: 0 };

  for (let fast = fastRange.min; fast <= fastRange.max; fast += fastRange.step) {
    for (let slow = slowRange.min; slow <= slowRange.max; slow += slowRange.step) {
      if (fast >= slow) continue;

      const result = runQuickBacktest(
        candles,
        fast,
        slow,
        positionSizePercent,
        stopLossPercent,
        takeProfitPercent,
        initialBalance
      );

      if (result.pnl > bestResult.pnl) {
        bestResult = { fastSMA: fast, slowSMA: slow, ...result };
      }
    }
  }

  return bestResult;
}

export function WalkForwardAnalysis({
  assets,
  startDate,
  endDate,
  timeframe,
  initialBalance,
  positionSizePercent,
  stopLossPercent,
  takeProfitPercent,
  fastSMARange,
  slowSMARange,
}: WalkForwardAnalysisProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<WalkForwardResult | null>(null);
  
  const [numWindows, setNumWindows] = useState(4);
  const [inSampleRatio, setInSampleRatio] = useState(70);

  const runAnalysis = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResult(null);

    try {
      const totalDays = differenceInDays(endDate, startDate);
      const windowDays = Math.floor(totalDays / numWindows);
      const inSampleDays = Math.floor(windowDays * (inSampleRatio / 100));
      const outOfSampleDays = windowDays - inSampleDays;

      // Fetch all candles first
      const candlesMap: Record<Asset, Candle[]> = {} as Record<Asset, Candle[]>;
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      for (const asset of assets) {
        const candles = await fetchHistoricalCandles(asset, timeframe, startTime, endTime);
        candlesMap[asset] = candles;
        setProgress(10 + (Object.keys(candlesMap).length / assets.length) * 20);
      }

      const windows: WindowResult[] = [];
      const balancePerAsset = initialBalance / assets.length;

      for (let w = 0; w < numWindows; w++) {
        const windowStart = addDays(startDate, w * windowDays);
        const inSampleEnd = addDays(windowStart, inSampleDays);
        const outOfSampleEnd = addDays(inSampleEnd, outOfSampleDays);

        // Filter candles for each period
        const inSampleCandles: Record<Asset, Candle[]> = {} as Record<Asset, Candle[]>;
        const outOfSampleCandles: Record<Asset, Candle[]> = {} as Record<Asset, Candle[]>;

        for (const asset of assets) {
          inSampleCandles[asset] = candlesMap[asset].filter(
            c => c.timestamp >= windowStart.getTime() && c.timestamp < inSampleEnd.getTime()
          );
          outOfSampleCandles[asset] = candlesMap[asset].filter(
            c => c.timestamp >= inSampleEnd.getTime() && c.timestamp < outOfSampleEnd.getTime()
          );
        }

        // Find optimal parameters on in-sample data
        let bestFast = fastSMARange.min;
        let bestSlow = slowSMARange.min;
        let bestInSamplePnl = -Infinity;
        let bestInSampleWins = 0;
        let bestInSampleLosses = 0;

        for (let fast = fastSMARange.min; fast <= fastSMARange.max; fast += fastSMARange.step) {
          for (let slow = slowSMARange.min; slow <= slowSMARange.max; slow += slowSMARange.step) {
            if (fast >= slow) continue;

            let totalPnl = 0;
            let totalWins = 0;
            let totalLosses = 0;

            for (const asset of assets) {
              const result = runQuickBacktest(
                inSampleCandles[asset],
                fast,
                slow,
                positionSizePercent,
                stopLossPercent,
                takeProfitPercent,
                balancePerAsset
              );
              totalPnl += result.pnl;
              totalWins += result.wins;
              totalLosses += result.losses;
            }

            if (totalPnl > bestInSamplePnl) {
              bestInSamplePnl = totalPnl;
              bestInSampleWins = totalWins;
              bestInSampleLosses = totalLosses;
              bestFast = fast;
              bestSlow = slow;
            }
          }
        }

        // Test optimized parameters on out-of-sample data
        let outOfSamplePnl = 0;
        let outOfSampleWins = 0;
        let outOfSampleLosses = 0;

        for (const asset of assets) {
          const result = runQuickBacktest(
            outOfSampleCandles[asset],
            bestFast,
            bestSlow,
            positionSizePercent,
            stopLossPercent,
            takeProfitPercent,
            balancePerAsset
          );
          outOfSamplePnl += result.pnl;
          outOfSampleWins += result.wins;
          outOfSampleLosses += result.losses;
        }

        const inSampleTrades = bestInSampleWins + bestInSampleLosses;
        const outOfSampleTrades = outOfSampleWins + outOfSampleLosses;

        // Robustness ratio: out-of-sample performance / in-sample performance
        const robustnessRatio = bestInSamplePnl !== 0 
          ? outOfSamplePnl / Math.abs(bestInSamplePnl) 
          : outOfSamplePnl > 0 ? 1 : 0;

        windows.push({
          windowIndex: w + 1,
          inSampleStart: windowStart,
          inSampleEnd: inSampleEnd,
          outOfSampleStart: inSampleEnd,
          outOfSampleEnd: outOfSampleEnd,
          optimalFastSMA: bestFast,
          optimalSlowSMA: bestSlow,
          inSamplePnl: bestInSamplePnl,
          inSamplePnlPercent: (bestInSamplePnl / initialBalance) * 100,
          inSampleWinRate: inSampleTrades > 0 ? (bestInSampleWins / inSampleTrades) * 100 : 0,
          inSampleTrades,
          outOfSamplePnl,
          outOfSamplePnlPercent: (outOfSamplePnl / initialBalance) * 100,
          outOfSampleWinRate: outOfSampleTrades > 0 ? (outOfSampleWins / outOfSampleTrades) * 100 : 0,
          outOfSampleTrades,
          robustnessRatio,
        });

        setProgress(30 + ((w + 1) / numWindows) * 70);
      }

      const totalInSamplePnl = windows.reduce((s, w) => s + w.inSamplePnl, 0);
      const totalOutOfSamplePnl = windows.reduce((s, w) => s + w.outOfSamplePnl, 0);
      const profitableWindows = windows.filter(w => w.outOfSamplePnl > 0).length;
      const avgRobustnessRatio = windows.reduce((s, w) => s + w.robustnessRatio, 0) / windows.length;
      
      // Consistency score: percentage of windows where out-of-sample is at least 50% of in-sample
      const consistentWindows = windows.filter(w => w.robustnessRatio >= 0.5).length;
      const consistencyScore = (consistentWindows / windows.length) * 100;

      setResult({
        windows,
        totalInSamplePnl,
        totalOutOfSamplePnl,
        avgRobustnessRatio,
        consistencyScore,
        profitableWindows,
        totalWindows: windows.length,
      });
    } catch (err) {
      console.error('Walk-forward analysis error:', err);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  }, [assets, startDate, endDate, timeframe, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, fastSMARange, slowSMARange, numWindows, inSampleRatio]);

  const chartData = result?.windows.map(w => ({
    window: `W${w.windowIndex}`,
    inSample: w.inSamplePnlPercent,
    outOfSample: w.outOfSamplePnlPercent,
    parameters: `${w.optimalFastSMA}/${w.optimalSlowSMA}`,
  })) || [];

  const chartConfig = {
    inSample: { label: 'In-Sample', color: 'hsl(var(--primary))' },
    outOfSample: { label: 'Out-of-Sample', color: 'hsl(142, 76%, 36%)' },
  };

  const getRobustnessColor = (ratio: number) => {
    if (ratio >= 0.75) return 'text-trading-profit';
    if (ratio >= 0.5) return 'text-yellow-500';
    if (ratio >= 0.25) return 'text-orange-500';
    return 'text-trading-loss';
  };

  const getConsistencyLabel = (score: number) => {
    if (score >= 75) return { label: 'Excellent', color: 'text-trading-profit', icon: CheckCircle2 };
    if (score >= 50) return { label: 'Good', color: 'text-yellow-500', icon: CheckCircle2 };
    if (score >= 25) return { label: 'Fair', color: 'text-orange-500', icon: AlertTriangle };
    return { label: 'Poor', color: 'text-trading-loss', icon: XCircle };
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Walk-Forward Analysis
        </CardTitle>
        <CardDescription>
          Validate optimized parameters on out-of-sample data to prevent overfitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              Number of Windows
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="text-xs">How many training/testing periods to create from the date range</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={numWindows}
              onChange={(e) => setNumWindows(Math.max(2, Math.min(10, parseInt(e.target.value) || 4)))}
              min={2}
              max={10}
              className="h-8 text-sm"
              disabled={isRunning}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              In-Sample Ratio (%)
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="text-xs">Percentage of each window used for optimization (training)</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </Label>
            <Input
              type="number"
              value={inSampleRatio}
              onChange={(e) => setInSampleRatio(Math.max(50, Math.min(90, parseInt(e.target.value) || 70)))}
              min={50}
              max={90}
              className="h-8 text-sm"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Run Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={runAnalysis}
            disabled={isRunning || assets.length === 0}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Walk-Forward
              </>
            )}
          </Button>
          <span className="text-xs text-muted-foreground">
            {numWindows} windows × {inSampleRatio}% training / {100 - inSampleRatio}% testing
          </span>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress.toFixed(0)}% complete</p>
          </div>
        )}

        {/* Results */}
        {result && !isRunning && (
          <>
            {/* Summary Stats */}
            <div className="grid gap-3 md:grid-cols-4">
              <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-1">In-Sample Total</p>
                <p className={cn("text-lg font-bold", result.totalInSamplePnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                  {result.totalInSamplePnl >= 0 ? '+' : ''}{formatCurrency(result.totalInSamplePnl)}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1">Out-of-Sample Total</p>
                <p className={cn("text-lg font-bold", result.totalOutOfSamplePnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                  {result.totalOutOfSamplePnl >= 0 ? '+' : ''}{formatCurrency(result.totalOutOfSamplePnl)}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-1">Avg Robustness</p>
                <p className={cn("text-lg font-bold", getRobustnessColor(result.avgRobustnessRatio))}>
                  {(result.avgRobustnessRatio * 100).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-lg border border-border/50 bg-secondary/20">
                <p className="text-xs text-muted-foreground mb-1">Profitable Windows</p>
                <p className="text-lg font-bold">
                  {result.profitableWindows}/{result.totalWindows}
                </p>
              </div>
            </div>

            {/* Consistency Score */}
            {(() => {
              const consistency = getConsistencyLabel(result.consistencyScore);
              const Icon = consistency.icon;
              return (
                <div className={cn("p-4 rounded-lg border", 
                  result.consistencyScore >= 50 ? "border-trading-profit/30 bg-trading-profit/5" : "border-trading-loss/30 bg-trading-loss/5"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", consistency.color)} />
                      <div>
                        <p className="text-sm font-medium">Consistency Score: <span className={consistency.color}>{result.consistencyScore.toFixed(0)}%</span></p>
                        <p className="text-xs text-muted-foreground">
                          {result.consistencyScore >= 50 
                            ? "Parameters are robust and likely to perform well on unseen data"
                            : "High overfitting risk - parameters may not generalize well"
                          }
                        </p>
                      </div>
                    </div>
                    <Badge variant={result.consistencyScore >= 50 ? "default" : "destructive"}>
                      {consistency.label}
                    </Badge>
                  </div>
                </div>
              );
            })()}

            {/* Comparison Chart */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">In-Sample vs Out-of-Sample Performance</Label>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="window" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) => {
                          const isInSample = name === 'inSample';
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span>{isInSample ? 'In-Sample' : 'Out-of-Sample'}:</span>
                                <span className={Number(value) >= 0 ? 'text-trading-profit' : 'text-trading-loss'}>
                                  {Number(value).toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-4 text-muted-foreground">
                                <span>Parameters:</span>
                                <span>{item.payload.parameters}</span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="inSample" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                  <Bar dataKey="outOfSample" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.outOfSample >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primary/70"></div>
                  <span className="text-muted-foreground">In-Sample (Training)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-trading-profit"></div>
                  <span className="text-muted-foreground">Out-of-Sample (Testing)</span>
                </div>
              </div>
            </div>

            {/* Detailed Results Table */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Window Details</Label>
              <ScrollArea className="h-[200px] rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Window</TableHead>
                      <TableHead className="text-xs">Optimal SMA</TableHead>
                      <TableHead className="text-xs text-right">IS P&L</TableHead>
                      <TableHead className="text-xs text-right">OOS P&L</TableHead>
                      <TableHead className="text-xs text-right">IS WR</TableHead>
                      <TableHead className="text-xs text-right">OOS WR</TableHead>
                      <TableHead className="text-xs text-right">Robustness</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.windows.map((window) => (
                      <TableRow key={window.windowIndex}>
                        <TableCell className="text-xs">
                          <div>
                            <p className="font-medium">Window {window.windowIndex}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(window.inSampleStart, 'MM/dd')} - {format(window.outOfSampleEnd, 'MM/dd')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {window.optimalFastSMA}/{window.optimalSlowSMA}
                        </TableCell>
                        <TableCell className={cn("text-xs text-right", window.inSamplePnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                          {window.inSamplePnlPercent.toFixed(1)}%
                        </TableCell>
                        <TableCell className={cn("text-xs text-right", window.outOfSamplePnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                          {window.outOfSamplePnlPercent.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-xs text-right">{window.inSampleWinRate.toFixed(0)}%</TableCell>
                        <TableCell className="text-xs text-right">{window.outOfSampleWinRate.toFixed(0)}%</TableCell>
                        <TableCell className={cn("text-xs text-right font-medium", getRobustnessColor(window.robustnessRatio))}>
                          {(window.robustnessRatio * 100).toFixed(0)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Interpretation */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <p className="text-sm">
                <span className="font-medium">Interpretation: </span>
                {result.avgRobustnessRatio >= 0.5 ? (
                  <>
                    The strategy shows <span className="text-trading-profit font-semibold">good robustness</span> with 
                    an average of {(result.avgRobustnessRatio * 100).toFixed(0)}% of in-sample performance 
                    retained out-of-sample. {result.profitableWindows}/{result.totalWindows} windows were 
                    profitable on unseen data, suggesting the optimization is not severely overfitting.
                  </>
                ) : (
                  <>
                    The strategy shows <span className="text-trading-loss font-semibold">signs of overfitting</span> with 
                    only {(result.avgRobustnessRatio * 100).toFixed(0)}% of in-sample performance retained 
                    out-of-sample. Only {result.profitableWindows}/{result.totalWindows} windows were 
                    profitable on unseen data. Consider using more conservative parameters or a simpler strategy.
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Tip:</strong> A robustness ratio above 50% is generally considered acceptable. 
                Values above 75% indicate excellent generalization.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
