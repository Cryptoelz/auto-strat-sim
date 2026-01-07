import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BacktestResult } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';
import {
  Shuffle,
  TrendingUp,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MonteCarloResult {
  simulations: number[];
  mean: number;
  median: number;
  std: number;
  percentile5: number;
  percentile25: number;
  percentile75: number;
  percentile95: number;
  probabilityOfProfit: number;
  probabilityOfRuin: number;
  probabilityOfTarget: number;
  histogram: { bin: string; count: number; isPositive: boolean }[];
  percentileData: { trade: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
  expectedFinalBalance: number;
  worstCase: number;
  bestCase: number;
  avgMaxDrawdown: number;
}

function runMonteCarloSimulation(
  trades: BacktestResult['trades'], 
  initialBalance: number, 
  numSimulations: number = 1000,
  numTrades: number = 100,
  ruinThreshold: number = 0.5,
  targetMultiple: number = 2.0
): MonteCarloResult {
  const pnlPercents = trades.map(t => t.pnlPercent / 100);
  const allPaths: number[][] = [];
  const results: number[] = [];
  const finalBalances: number[] = [];
  const maxDrawdowns: number[] = [];
  let ruinCount = 0;
  let targetCount = 0;
  const ruinLevel = initialBalance * ruinThreshold;
  const targetLevel = initialBalance * targetMultiple;

  for (let sim = 0; sim < numSimulations; sim++) {
    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    let hitRuin = false;
    let hitTarget = false;
    const path: number[] = [initialBalance];

    for (let i = 0; i < numTrades; i++) {
      const randomIndex = Math.floor(Math.random() * pnlPercents.length);
      balance = balance * (1 + pnlPercents[randomIndex]);
      path.push(balance);

      if (balance > peak) peak = balance;
      const drawdown = ((peak - balance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      if (balance <= ruinLevel) hitRuin = true;
      if (balance >= targetLevel) hitTarget = true;
    }

    allPaths.push(path);
    results.push(((balance - initialBalance) / initialBalance) * 100);
    finalBalances.push(balance);
    maxDrawdowns.push(maxDrawdown);
    if (hitRuin) ruinCount++;
    if (hitTarget) targetCount++;
  }

  // Calculate percentiles at each trade point
  const percentileData: { trade: number; p5: number; p25: number; p50: number; p75: number; p95: number }[] = [];
  const step = Math.max(1, Math.floor(numTrades / 50)); // Sample up to 50 points for performance
  for (let tradeIdx = 0; tradeIdx <= numTrades; tradeIdx += step) {
    const balancesAtPoint = allPaths.map(path => path[tradeIdx]).sort((a, b) => a - b);
    const getPercentile = (arr: number[], p: number) => {
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)];
    };
    percentileData.push({
      trade: tradeIdx,
      p5: getPercentile(balancesAtPoint, 0.05),
      p25: getPercentile(balancesAtPoint, 0.25),
      p50: getPercentile(balancesAtPoint, 0.50),
      p75: getPercentile(balancesAtPoint, 0.75),
      p95: getPercentile(balancesAtPoint, 0.95),
    });
  }
  // Ensure last point is included
  if (percentileData[percentileData.length - 1]?.trade !== numTrades) {
    const balancesAtPoint = allPaths.map(path => path[numTrades]).sort((a, b) => a - b);
    const getPercentile = (arr: number[], p: number) => {
      const idx = Math.floor(arr.length * p);
      return arr[Math.min(idx, arr.length - 1)];
    };
    percentileData.push({
      trade: numTrades,
      p5: getPercentile(balancesAtPoint, 0.05),
      p25: getPercentile(balancesAtPoint, 0.25),
      p50: getPercentile(balancesAtPoint, 0.50),
      p75: getPercentile(balancesAtPoint, 0.75),
      p95: getPercentile(balancesAtPoint, 0.95),
    });
  }

  results.sort((a, b) => a - b);
  finalBalances.sort((a, b) => a - b);

  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const median = results[Math.floor(results.length / 2)];
  const variance = results.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / results.length;
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => results[Math.floor(results.length * p / 100)];

  // Create histogram bins
  const minReturn = Math.min(...results);
  const maxReturn = Math.max(...results);
  const binCount = 20;
  const binWidth = (maxReturn - minReturn) / binCount || 1;
  const bins: Record<string, number> = {};
  
  for (let i = 0; i < binCount; i++) {
    const binStart = minReturn + i * binWidth;
    const binLabel = `${binStart.toFixed(0)}%`;
    bins[binLabel] = 0;
  }

  results.forEach(r => {
    const binIndex = Math.min(Math.floor((r - minReturn) / binWidth), binCount - 1);
    const binStart = minReturn + binIndex * binWidth;
    const binLabel = `${binStart.toFixed(0)}%`;
    bins[binLabel] = (bins[binLabel] || 0) + 1;
  });

  const histogram = Object.entries(bins).map(([bin, count]) => ({
    bin,
    count,
    isPositive: parseFloat(bin) >= 0
  }));

  const probabilityOfProfit = results.filter(r => r > 0).length / results.length * 100;
  const avgMaxDrawdown = maxDrawdowns.reduce((a, b) => a + b, 0) / maxDrawdowns.length;

  return {
    simulations: results,
    mean,
    median,
    std,
    percentile5: getPercentile(5),
    percentile25: getPercentile(25),
    percentile75: getPercentile(75),
    percentile95: getPercentile(95),
    probabilityOfProfit,
    probabilityOfRuin: (ruinCount / numSimulations) * 100,
    probabilityOfTarget: (targetCount / numSimulations) * 100,
    histogram,
    percentileData,
    expectedFinalBalance: finalBalances.reduce((a, b) => a + b, 0) / numSimulations,
    worstCase: finalBalances[0],
    bestCase: finalBalances[numSimulations - 1],
    avgMaxDrawdown,
  };
}

interface MonteCarloCardProps {
  trades: BacktestResult['trades'];
  initialBalance: number;
}

export function MonteCarloCard({ trades, initialBalance }: MonteCarloCardProps) {
  const [result, setResult] = useState<MonteCarloResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [numSimulations, setNumSimulations] = useState(500);
  const [numTrades, setNumTrades] = useState(100);
  const [ruinThreshold, setRuinThreshold] = useState(50);
  const [targetMultiple, setTargetMultiple] = useState(20);

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      const simResult = runMonteCarloSimulation(
        trades, 
        initialBalance, 
        numSimulations, 
        numTrades,
        ruinThreshold / 100,
        targetMultiple / 10
      );
      setResult(simResult);
      setIsRunning(false);
    }, 50);
  };

  if (trades.length < 5) return null;

  const getProbabilityColor = (prob: number, isGood: boolean) => {
    if (isGood) {
      return prob >= 70 ? 'text-trading-profit' : prob >= 50 ? 'text-yellow-500' : 'text-trading-loss';
    } else {
      return prob <= 10 ? 'text-trading-profit' : prob <= 25 ? 'text-yellow-500' : 'text-trading-loss';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shuffle className="h-4 w-4 text-purple-500" />
              Monte Carlo Simulation
            </CardTitle>
            <CardDescription>
              {result ? `${numSimulations.toLocaleString()} simulations of ${numTrades} future trades` : 'Configure and run simulation'}
            </CardDescription>
          </div>
          <Button
            variant={result ? "outline" : "default"}
            size="sm"
            onClick={runSimulation}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : result ? 'Re-run' : 'Run Simulation'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 mb-4">
          <div className="space-y-2">
            <Label className="text-xs">Simulations: {numSimulations}</Label>
            <input
              type="range"
              value={numSimulations}
              onChange={(e) => setNumSimulations(Number(e.target.value))}
              min={100}
              max={1000}
              step={100}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Future Trades: {numTrades}</Label>
            <input
              type="range"
              value={numTrades}
              onChange={(e) => setNumTrades(Number(e.target.value))}
              min={20}
              max={500}
              step={10}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Ruin Level: {ruinThreshold}%</Label>
            <input
              type="range"
              value={ruinThreshold}
              onChange={(e) => setRuinThreshold(Number(e.target.value))}
              min={10}
              max={90}
              step={5}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Target: {(targetMultiple / 10).toFixed(1)}x</Label>
            <input
              type="range"
              value={targetMultiple}
              onChange={(e) => setTargetMultiple(Number(e.target.value))}
              min={12}
              max={50}
              step={1}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>

        {!result ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shuffle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Run Simulation" to project future outcomes</p>
            <p className="text-xs mt-1">Based on {trades.length} historical trades</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Probability Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-trading-profit" />
                  <span className="text-xs text-muted-foreground">Profit Prob.</span>
                </div>
                <p className={`text-xl font-bold ${getProbabilityColor(result.probabilityOfProfit, true)}`}>
                  {result.probabilityOfProfit.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-trading-loss" />
                  <span className="text-xs text-muted-foreground">Ruin Prob.</span>
                </div>
                <p className={`text-xl font-bold ${getProbabilityColor(result.probabilityOfRuin, false)}`}>
                  {result.probabilityOfRuin.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="h-3 w-3 text-purple-500" />
                  <span className="text-xs text-muted-foreground">Target Prob.</span>
                </div>
                <p className={`text-xl font-bold ${getProbabilityColor(result.probabilityOfTarget, true)}`}>
                  {result.probabilityOfTarget.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Equity Projection Chart */}
            <div>
              <Label className="text-xs text-muted-foreground">Equity Projection Bands</Label>
              <p className="text-[10px] text-muted-foreground mb-2">Shaded areas show 5th-95th percentile range</p>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.percentileData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mcOuterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="mcInnerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(280, 70%, 50%)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="trade"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          p5: '5th %ile',
                          p25: '25th %ile',
                          p50: 'Median',
                          p75: '75th %ile',
                          p95: '95th %ile',
                        };
                        return [formatCurrency(value), labels[name] || name];
                      }}
                    />
                    <ReferenceLine 
                      y={initialBalance} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                    <ReferenceLine 
                      y={initialBalance * (ruinThreshold / 100)} 
                      stroke="hsl(0, 84%, 60%)" 
                      strokeDasharray="3 3"
                      strokeOpacity={0.6}
                    />
                    <Area type="monotone" dataKey="p95" stroke="transparent" fill="url(#mcOuterGradient)" />
                    <Area type="monotone" dataKey="p5" stroke="transparent" fill="hsl(var(--background))" />
                    <Area type="monotone" dataKey="p75" stroke="transparent" fill="url(#mcInnerGradient)" />
                    <Area type="monotone" dataKey="p25" stroke="transparent" fill="hsl(var(--background))" />
                    <Area type="monotone" dataKey="p50" stroke="hsl(280, 70%, 50%)" strokeWidth={2} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500/20" />
                  <span>5-95%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500/40" />
                  <span>25-75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-0.5 bg-purple-500" />
                  <span>Median</span>
                </div>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="p-2 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Expected</p>
                <p className={cn(
                  "text-base font-bold",
                  result.expectedFinalBalance >= initialBalance ? "text-trading-profit" : "text-trading-loss"
                )}>
                  {formatCurrency(result.expectedFinalBalance)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30 text-center">
                <p className="text-xs text-muted-foreground">Median</p>
                <p className={cn(
                  "text-base font-bold",
                  result.median >= 0 ? "text-trading-profit" : "text-trading-loss"
                )}>
                  {result.median >= 0 ? '+' : ''}{result.median.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 rounded-lg bg-trading-loss/10 text-center">
                <p className="text-xs text-muted-foreground">Worst (5%)</p>
                <p className="text-base font-bold text-trading-loss">
                  {formatCurrency(result.worstCase)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-trading-profit/10 text-center">
                <p className="text-xs text-muted-foreground">Best (95%)</p>
                <p className="text-base font-bold text-trading-profit">
                  {formatCurrency(result.bestCase)}
                </p>
              </div>
            </div>

            {/* Distribution Histogram */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Return Distribution</Label>
              <div className="h-20 flex items-end gap-0.5">
                {result.histogram.map((bar, i) => {
                  const maxCount = Math.max(...result.histogram.map(h => h.count));
                  const height = (bar.count / maxCount) * 100;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex-1 rounded-t transition-all",
                        bar.isPositive ? "bg-trading-profit/60" : "bg-trading-loss/60"
                      )}
                      style={{ height: `${height}%` }}
                      title={`${bar.bin}: ${bar.count} simulations`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{result.histogram[0]?.bin}</span>
                <span>0%</span>
                <span>{result.histogram[result.histogram.length - 1]?.bin}</span>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg Max Drawdown</span>
                <Badge variant="outline" className="border-trading-loss/30 text-trading-loss text-xs">
                  -{result.avgMaxDrawdown.toFixed(1)}%
                </Badge>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg border border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Std Deviation</span>
                <Badge variant="outline" className="text-xs">
                  ±{result.std.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
              <p>
                <strong>Analysis:</strong> {' '}
                {result.probabilityOfProfit >= 70
                  ? `Strong edge with ${result.probabilityOfProfit.toFixed(0)}% profit probability.`
                  : result.probabilityOfProfit >= 50
                    ? `Moderate ${result.probabilityOfProfit.toFixed(0)}% profit probability.`
                    : `Weak ${result.probabilityOfProfit.toFixed(0)}% profit probability - review strategy.`}{' '}
                {result.probabilityOfRuin > 20
                  ? `High ${result.probabilityOfRuin.toFixed(0)}% ruin risk - reduce position sizes.`
                  : result.probabilityOfRuin > 5
                    ? `${result.probabilityOfRuin.toFixed(0)}% ruin risk - monitor closely.`
                    : `Low ${result.probabilityOfRuin.toFixed(0)}% ruin risk.`}{' '}
                Expected outcome: {formatCurrency(result.expectedFinalBalance)}, 90% CI: {formatCurrency(result.worstCase)} to {formatCurrency(result.bestCase)}.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
