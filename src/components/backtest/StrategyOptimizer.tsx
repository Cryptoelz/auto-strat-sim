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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings2, Play, Trophy, TrendingUp, TrendingDown, Zap, Target, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Asset, Candle } from '@/types/trading';
import { OptimizationResult } from '@/types/backtest';
import { runQuickBacktest } from '@/lib/backtest-engine';
import { formatCurrency } from '@/lib/performance';

interface StrategyOptimizerProps {
  assets: Asset[];
  startDate: Date;
  endDate: Date;
  timeframe: '5m' | '15m' | '1h' | '4h';
  initialBalance: number;
  positionSizePercent: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  currentFastSMA: number;
  currentSlowSMA: number;
  onApplyOptimal?: (fastSMA: number, slowSMA: number) => void;
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

// runQuickBacktest is now imported from '@/lib/backtest-engine'

export function StrategyOptimizer({
  assets,
  startDate,
  endDate,
  timeframe,
  initialBalance,
  positionSizePercent,
  stopLossPercent,
  takeProfitPercent,
  currentFastSMA,
  currentSlowSMA,
  onApplyOptimal,
}: StrategyOptimizerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  
  // Optimization parameters
  const [fastMin, setFastMin] = useState(5);
  const [fastMax, setFastMax] = useState(30);
  const [fastStep, setFastStep] = useState(5);
  const [slowMin, setSlowMin] = useState(20);
  const [slowMax, setSlowMax] = useState(100);
  const [slowStep, setSlowStep] = useState(10);
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'profitFactor' | 'sharpe'>('pnl');

  const runOptimization = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Fetch candles for all assets first
      const candlesMap: Record<Asset, Candle[]> = {} as Record<Asset, Candle[]>;
      const startTime = startDate.getTime();
      const endTime = endDate.getTime();

      for (const asset of assets) {
        const candles = await fetchHistoricalCandles(asset, timeframe, startTime, endTime);
        candlesMap[asset] = candles;
      }

      // Generate all SMA combinations
      const combinations: { fast: number; slow: number }[] = [];
      for (let fast = fastMin; fast <= fastMax; fast += fastStep) {
        for (let slow = slowMin; slow <= slowMax; slow += slowStep) {
          if (fast < slow) {
            combinations.push({ fast, slow });
          }
        }
      }

      const optimizationResults: OptimizationResult[] = [];
      const balancePerAsset = initialBalance / assets.length;

      for (let i = 0; i < combinations.length; i++) {
        const { fast, slow } = combinations[i];
        
        let totalPnl = 0;
        let totalWins = 0;
        let totalLosses = 0;
        let totalMaxDrawdown = 0;
        const returns: number[] = [];

        for (const asset of assets) {
          const candles = candlesMap[asset];
          if (candles.length === 0) continue;

          const result = runQuickBacktest(
            candles,
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
          totalMaxDrawdown = Math.max(totalMaxDrawdown, result.maxDrawdown);
          
          if (result.wins + result.losses > 0) {
            returns.push(result.pnl / balancePerAsset);
          }
        }

        const totalTrades = totalWins + totalLosses;
        const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
        
        // Simplified profit factor calculation
        const avgWin = totalWins > 0 ? (totalPnl > 0 ? totalPnl / totalWins : 0) : 0;
        const avgLoss = totalLosses > 0 ? Math.abs(totalPnl < 0 ? totalPnl / totalLosses : totalPnl * 0.5 / Math.max(totalLosses, 1)) : 0;
        const profitFactor = avgLoss > 0 && totalWins > 0 ? (avgWin * totalWins) / (avgLoss * totalLosses) : totalPnl > 0 ? 99 : 0;

        // Sharpe ratio
        const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
        const stdDev = returns.length > 1
          ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
          : 0;
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

        optimizationResults.push({
          fastSMA: fast,
          slowSMA: slow,
          totalPnl,
          totalPnlPercent: (totalPnl / initialBalance) * 100,
          winRate,
          totalTrades,
          profitFactor: Math.min(profitFactor, 99),
          maxDrawdown: totalMaxDrawdown,
          sharpeRatio,
        });

        setProgress(((i + 1) / combinations.length) * 100);
      }

      setResults(optimizationResults);
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  }, [assets, startDate, endDate, timeframe, initialBalance, positionSizePercent, stopLossPercent, takeProfitPercent, fastMin, fastMax, fastStep, slowMin, slowMax, slowStep]);

  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.totalPnl - a.totalPnl;
      case 'winRate': return b.winRate - a.winRate;
      case 'profitFactor': return b.profitFactor - a.profitFactor;
      case 'sharpe': return b.sharpeRatio - a.sharpeRatio;
      default: return b.totalPnl - a.totalPnl;
    }
  });

  const bestResult = sortedResults[0];
  const worstResult = sortedResults[sortedResults.length - 1];
  const currentResult = results.find(r => r.fastSMA === currentFastSMA && r.slowSMA === currentSlowSMA);

  const combinationCount = Math.floor((fastMax - fastMin) / fastStep + 1) * Math.floor((slowMax - slowMin) / slowStep + 1);
  const validCombinations = results.length;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Strategy Optimizer
        </CardTitle>
        <CardDescription>
          Test different SMA period combinations to find optimal parameters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parameter Configuration */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-secondary/20">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Fast SMA Range
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={fastMin}
                  onChange={(e) => setFastMin(parseInt(e.target.value) || 5)}
                  min={2}
                  max={fastMax - 1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={fastMax}
                  onChange={(e) => setFastMax(parseInt(e.target.value) || 30)}
                  min={fastMin + 1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Step</Label>
                <Input
                  type="number"
                  value={fastStep}
                  onChange={(e) => setFastStep(parseInt(e.target.value) || 5)}
                  min={1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-secondary/20">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-500" />
              Slow SMA Range
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Min</Label>
                <Input
                  type="number"
                  value={slowMin}
                  onChange={(e) => setSlowMin(parseInt(e.target.value) || 20)}
                  min={fastMax + 1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max</Label>
                <Input
                  type="number"
                  value={slowMax}
                  onChange={(e) => setSlowMax(parseInt(e.target.value) || 100)}
                  min={slowMin + 1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Step</Label>
                <Input
                  type="number"
                  value={slowStep}
                  onChange={(e) => setSlowStep(parseInt(e.target.value) || 10)}
                  min={1}
                  className="h-8 text-sm"
                  disabled={isRunning}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={runOptimization}
            disabled={isRunning || assets.length === 0}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Optimization
              </>
            )}
          </Button>
          <span className="text-sm text-muted-foreground">
            ~{validCombinations || combinationCount} combinations to test
          </span>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{progress.toFixed(0)}% complete</p>
          </div>
        )}

        {/* Results Summary */}
        {results.length > 0 && !isRunning && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {/* Best Result */}
              {bestResult && (
                <div className="p-3 rounded-lg border border-trading-profit/30 bg-trading-profit/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Best Parameters</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">SMA {bestResult.fastSMA}/{bestResult.slowSMA}</p>
                    <p className={cn("text-sm", bestResult.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                      {bestResult.totalPnl >= 0 ? '+' : ''}{formatCurrency(bestResult.totalPnl)} ({bestResult.totalPnlPercent.toFixed(2)}%)
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>WR: {bestResult.winRate.toFixed(1)}%</span>
                      <span>PF: {bestResult.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                  {onApplyOptimal && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full text-xs"
                      onClick={() => onApplyOptimal(bestResult.fastSMA, bestResult.slowSMA)}
                    >
                      Apply These Parameters
                    </Button>
                  )}
                </div>
              )}

              {/* Current Result */}
              {currentResult && (
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Current Parameters</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">SMA {currentResult.fastSMA}/{currentResult.slowSMA}</p>
                    <p className={cn("text-sm", currentResult.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                      {currentResult.totalPnl >= 0 ? '+' : ''}{formatCurrency(currentResult.totalPnl)} ({currentResult.totalPnlPercent.toFixed(2)}%)
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>WR: {currentResult.winRate.toFixed(1)}%</span>
                      <span>PF: {currentResult.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                  {bestResult && currentResult.fastSMA !== bestResult.fastSMA && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {((bestResult.totalPnl - currentResult.totalPnl) / Math.abs(currentResult.totalPnl || 1) * 100).toFixed(0)}% improvement possible
                    </Badge>
                  )}
                </div>
              )}

              {/* Worst Result */}
              {worstResult && (
                <div className="p-3 rounded-lg border border-trading-loss/30 bg-trading-loss/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-trading-loss" />
                    <span className="text-sm font-medium">Worst Parameters</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">SMA {worstResult.fastSMA}/{worstResult.slowSMA}</p>
                    <p className={cn("text-sm", worstResult.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                      {worstResult.totalPnl >= 0 ? '+' : ''}{formatCurrency(worstResult.totalPnl)} ({worstResult.totalPnlPercent.toFixed(2)}%)
                    </p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>WR: {worstResult.winRate.toFixed(1)}%</span>
                      <span>PF: {worstResult.profitFactor.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">All Results ({results.length} combinations)</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pnl">Sort by P&L</SelectItem>
                    <SelectItem value="winRate">Sort by Win Rate</SelectItem>
                    <SelectItem value="profitFactor">Sort by Profit Factor</SelectItem>
                    <SelectItem value="sharpe">Sort by Sharpe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[300px] rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs w-[50px]">#</TableHead>
                      <TableHead className="text-xs">Fast/Slow</TableHead>
                      <TableHead className="text-xs text-right">P&L</TableHead>
                      <TableHead className="text-xs text-right">P&L %</TableHead>
                      <TableHead className="text-xs text-right">Win Rate</TableHead>
                      <TableHead className="text-xs text-right">Trades</TableHead>
                      <TableHead className="text-xs text-right">PF</TableHead>
                      <TableHead className="text-xs text-right">DD</TableHead>
                      <TableHead className="text-xs text-right">Sharpe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedResults.map((result, index) => {
                      const isBest = result === bestResult;
                      const isCurrent = result.fastSMA === currentFastSMA && result.slowSMA === currentSlowSMA;
                      
                      return (
                        <TableRow 
                          key={`${result.fastSMA}-${result.slowSMA}`}
                          className={cn(
                            isBest && "bg-trading-profit/10",
                            isCurrent && "bg-primary/10"
                          )}
                        >
                          <TableCell className="text-xs">
                            {index + 1}
                            {isBest && <Trophy className="h-3 w-3 inline ml-1 text-yellow-500" />}
                            {isCurrent && <Target className="h-3 w-3 inline ml-1 text-primary" />}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {result.fastSMA}/{result.slowSMA}
                          </TableCell>
                          <TableCell className={cn("text-xs text-right", result.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                            {result.totalPnl >= 0 ? '+' : ''}{formatCurrency(result.totalPnl)}
                          </TableCell>
                          <TableCell className={cn("text-xs text-right", result.totalPnlPercent >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                            {result.totalPnlPercent >= 0 ? '+' : ''}{result.totalPnlPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-xs text-right">{result.winRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-xs text-right">{result.totalTrades}</TableCell>
                          <TableCell className="text-xs text-right">{result.profitFactor.toFixed(2)}</TableCell>
                          <TableCell className="text-xs text-right text-trading-loss">{result.maxDrawdown.toFixed(1)}%</TableCell>
                          <TableCell className="text-xs text-right">{result.sharpeRatio.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* Heatmap visualization */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">P&L Heatmap</Label>
              <div className="overflow-x-auto">
                <div className="inline-grid gap-1" style={{ 
                  gridTemplateColumns: `auto repeat(${Math.ceil((slowMax - slowMin) / slowStep) + 1}, minmax(40px, 1fr))` 
                }}>
                  {/* Header row */}
                  <div className="text-xs text-muted-foreground p-1"></div>
                  {Array.from({ length: Math.ceil((slowMax - slowMin) / slowStep) + 1 }, (_, i) => slowMin + i * slowStep)
                    .filter(s => s <= slowMax)
                    .map(slow => (
                      <div key={slow} className="text-xs text-muted-foreground p-1 text-center">{slow}</div>
                    ))}
                  
                  {/* Data rows */}
                  {Array.from({ length: Math.ceil((fastMax - fastMin) / fastStep) + 1 }, (_, i) => fastMin + i * fastStep)
                    .filter(f => f <= fastMax)
                    .map(fast => (
                      <>
                        <div key={`label-${fast}`} className="text-xs text-muted-foreground p-1">{fast}</div>
                        {Array.from({ length: Math.ceil((slowMax - slowMin) / slowStep) + 1 }, (_, i) => slowMin + i * slowStep)
                          .filter(s => s <= slowMax)
                          .map(slow => {
                            const result = results.find(r => r.fastSMA === fast && r.slowSMA === slow);
                            if (!result || fast >= slow) {
                              return <div key={`${fast}-${slow}`} className="bg-muted/20 rounded p-1 text-center text-xs">-</div>;
                            }
                            
                            const maxPnl = Math.max(...results.map(r => Math.abs(r.totalPnl)));
                            const intensity = Math.min(Math.abs(result.totalPnl) / maxPnl, 1);
                            
                            return (
                              <TooltipProvider key={`${fast}-${slow}`}>
                                <UITooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "rounded p-1 text-center text-xs cursor-default transition-colors",
                                        result.totalPnl >= 0 
                                          ? "text-trading-profit" 
                                          : "text-trading-loss"
                                      )}
                                      style={{
                                        backgroundColor: result.totalPnl >= 0
                                          ? `hsla(142, 76%, 36%, ${0.1 + intensity * 0.5})`
                                          : `hsla(0, 84%, 60%, ${0.1 + intensity * 0.5})`
                                      }}
                                    >
                                      {result.totalPnlPercent.toFixed(0)}%
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs space-y-1">
                                      <p className="font-medium">SMA {fast}/{slow}</p>
                                      <p>P&L: {formatCurrency(result.totalPnl)}</p>
                                      <p>Win Rate: {result.winRate.toFixed(1)}%</p>
                                      <p>Trades: {result.totalTrades}</p>
                                    </div>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            );
                          })}
                      </>
                    ))}
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-trading-loss/50"></div>
                  <span>Loss</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-muted/30"></div>
                  <span>Break-even</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-trading-profit/50"></div>
                  <span>Profit</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Insight: </span>
                {bestResult && (
                  <>
                    The optimal parameters are <span className="font-semibold text-primary">SMA {bestResult.fastSMA}/{bestResult.slowSMA}</span>,
                    yielding <span className={cn("font-semibold", bestResult.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                      {bestResult.totalPnlPercent.toFixed(2)}%
                    </span> return with a {bestResult.winRate.toFixed(1)}% win rate.
                    {currentResult && bestResult.fastSMA !== currentFastSMA && (
                      <> Switching from your current {currentFastSMA}/{currentSlowSMA} settings could improve results by {((bestResult.totalPnl - currentResult.totalPnl) / initialBalance * 100).toFixed(2)}%.</>
                    )}
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
