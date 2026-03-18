import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Settings2, Play, Trophy, TrendingUp, TrendingDown, Target, AlertTriangle,
  RotateCcw, Shield, Zap, BarChart3, Layers, Crown, Award, Medal
} from 'lucide-react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Tooltip, Cell, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Asset, Candle } from '@/types/trading';
import {
  ParameterRanges,
  FullOptimizationResult,
  BestSettingsSummary,
  AssetComparisonResult,
  DEFAULT_RANGES,
  generateParameterGrid,
  countCombinations,
  runBatchOptimization,
  runWalkForwardOptimization,
  findBestSettings,
  buildAssetComparison,
  rankResults,
  SortField,
} from '@/lib/optimizer-engine';
import { formatCurrency } from '@/lib/performance';

interface FullOptimizerProps {
  assets: Asset[];
  startDate: Date;
  endDate: Date;
  timeframe: '5m' | '15m' | '1h' | '4h';
  initialBalance: number;
  positionSizePercent: number;
  feePercent: number;
  onApplyParams?: (params: { fastSMA: number; slowSMA: number; stopLoss: number; takeProfit: number }) => void;
}

const BINANCE_API = 'https://api.binance.com/api/v3';
const TIMEFRAME_MS: Record<string, number> = {
  '5m': 5 * 60 * 1000, '15m': 15 * 60 * 1000, '1h': 60 * 60 * 1000, '4h': 4 * 60 * 60 * 1000,
};

async function fetchCandles(asset: Asset, interval: string, startTime: number, endTime: number): Promise<Candle[]> {
  const all: Candle[] = [];
  let cur = startTime;
  while (cur < endTime) {
    try {
      const res = await fetch(`${BINANCE_API}/klines?symbol=${asset}&interval=${interval}&startTime=${cur}&endTime=${endTime}&limit=1000`);
      if (!res.ok) break;
      const data = await res.json();
      if (data.length === 0) break;
      const candles: Candle[] = data.map((c: (string | number)[]) => ({
        timestamp: Number(c[0]), open: parseFloat(c[1] as string), high: parseFloat(c[2] as string),
        low: parseFloat(c[3] as string), close: parseFloat(c[4] as string), volume: parseFloat(c[5] as string),
      }));
      all.push(...candles);
      cur = candles[candles.length - 1].timestamp + TIMEFRAME_MS[interval];
      await new Promise(r => setTimeout(r, 50));
    } catch { break; }
  }
  return all;
}

function RangeInput({ label, range, onChange, disabled, step }: {
  label: string; range: { min: number; max: number; step: number };
  onChange: (r: { min: number; max: number; step: number }) => void; disabled: boolean; step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-3 gap-1">
        <Input type="number" value={range.min} onChange={e => onChange({ ...range, min: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs" disabled={disabled} step={step} placeholder="Min" />
        <Input type="number" value={range.max} onChange={e => onChange({ ...range, max: parseFloat(e.target.value) || 0 })}
          className="h-7 text-xs" disabled={disabled} step={step} placeholder="Max" />
        <Input type="number" value={range.step} onChange={e => onChange({ ...range, step: parseFloat(e.target.value) || 1 })}
          className="h-7 text-xs" disabled={disabled} step={step} placeholder="Step" />
      </div>
    </div>
  );
}

function BestSettingsCard({ title, icon: Icon, result, color, onApply }: {
  title: string; icon: React.ElementType; result: FullOptimizationResult | null;
  color: string; onApply?: () => void;
}) {
  if (!result) return null;
  return (
    <div className={cn("p-3 rounded-lg border", color)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{title}</span>
        {result.overfitFlag && (
          <Badge variant="destructive" className="text-[10px] ml-auto">OVERFIT</Badge>
        )}
      </div>
      <div className="space-y-1 text-xs">
        <p className="font-semibold">SMA {result.params.fastSMA}/{result.params.slowSMA} • SL {result.params.stopLossPercent}% / TP {result.params.takeProfitPercent}%</p>
        <p className="text-muted-foreground">ATR {result.params.atrPeriod} ≥{result.params.minAtrPercent}% • Dist ≥{result.params.minSmaDistancePercent}% • CD {result.params.cooldownCandles}</p>
        <div className="flex gap-3 mt-1">
          <span className={result.totalPnl >= 0 ? "text-trading-profit font-medium" : "text-trading-loss font-medium"}>
            {result.totalPnl >= 0 ? '+' : ''}{result.totalPnlPercent.toFixed(2)}%
          </span>
          <span>WR: {result.winRate.toFixed(1)}%</span>
          <span>DD: {result.maxDrawdown.toFixed(1)}%</span>
          <span>PF: {result.profitFactor.toFixed(2)}</span>
        </div>
        <div className="flex gap-3 text-muted-foreground">
          <span>{result.totalTrades} trades</span>
          <span>{result.longTrades}L / {result.shortTrades}S</span>
        </div>
      </div>
      {onApply && (
        <Button size="sm" variant="outline" className="mt-2 w-full text-xs h-7" onClick={onApply}>
          Apply These Parameters
        </Button>
      )}
    </div>
  );
}

export function FullOptimizer({
  assets, startDate, endDate, timeframe, initialBalance, positionSizePercent, feePercent, onApplyParams,
}: FullOptimizerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [ranges, setRanges] = useState<ParameterRanges>(DEFAULT_RANGES);
  const [mode, setMode] = useState<'combined' | 'per-asset'>('per-asset');
  const [enableWalkForward, setEnableWalkForward] = useState(true);
  const [inSampleRatio, setInSampleRatio] = useState(70);
  const [sortBy, setSortBy] = useState<SortField>('riskAdjustedScore');

  const [results, setResults] = useState<FullOptimizationResult[]>([]);
  const [wfResults, setWfResults] = useState<FullOptimizationResult[]>([]);
  const [bestSettings, setBestSettings] = useState<BestSettingsSummary>({ bestOverall: null, bestLowDrawdown: null, bestHighWinRate: null, bestBalanced: null });
  const [assetComparison, setAssetComparison] = useState<AssetComparisonResult[]>([]);

  const totalCombinations = countCombinations(ranges);

  const updateRange = (key: keyof ParameterRanges, val: { min: number; max: number; step: number }) => {
    setRanges(prev => ({ ...prev, [key]: val }));
  };

  const runOptimization = useCallback(async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    setWfResults([]);
    setAssetComparison([]);
    setBestSettings({ bestOverall: null, bestLowDrawdown: null, bestHighWinRate: null, bestBalanced: null });

    try {
      // Fetch data
      setStatusText('Fetching historical data...');
      const candlesMap: Record<Asset, Candle[]> = {} as any;
      for (const asset of assets) {
        candlesMap[asset] = await fetchCandles(asset, timeframe, startDate.getTime(), endDate.getTime());
        setProgress(prev => prev + (15 / assets.length));
      }

      // Generate grid
      const grid = generateParameterGrid(ranges);
      setStatusText(`Running ${grid.length} combinations (${mode} mode)...`);

      // Run batch
      const batchResults = await runBatchOptimization(
        candlesMap, assets, grid, positionSizePercent, feePercent, initialBalance,
        (pct) => setProgress(15 + pct * 0.6), mode,
      );
      setResults(batchResults);

      // Best settings
      const combinedResults = mode === 'combined' ? batchResults : batchResults.filter(r => r.asset === 'combined');
      const best = findBestSettings(combinedResults.length > 0 ? combinedResults : batchResults);
      setBestSettings(best);

      // Per-asset comparison
      if (mode === 'per-asset') {
        const comparison = buildAssetComparison(batchResults, assets);
        setAssetComparison(comparison);
      }

      // Walk-forward validation
      if (enableWalkForward && grid.length > 0) {
        setStatusText('Running walk-forward validation...');
        setProgress(80);
        const wfr = runWalkForwardOptimization(
          candlesMap, assets, grid, positionSizePercent, feePercent, initialBalance, inSampleRatio,
        );
        setWfResults(wfr);
        // Update best settings with overfit info
        const updatedBest = findBestSettings(wfr.filter(r => !r.overfitFlag));
        if (updatedBest.bestOverall) {
          setBestSettings(prev => ({
            ...prev,
            bestOverall: updatedBest.bestOverall || prev.bestOverall,
            bestBalanced: updatedBest.bestBalanced || prev.bestBalanced,
          }));
        }
      }

      setStatusText('Optimization complete');
      setProgress(100);
    } catch (err) {
      console.error('Optimization error:', err);
      setStatusText('Error during optimization');
    } finally {
      setIsRunning(false);
    }
  }, [assets, startDate, endDate, timeframe, initialBalance, positionSizePercent, feePercent, ranges, mode, enableWalkForward, inSampleRatio]);

  const sorted = rankResults(results, sortBy);
  const scatterData = results
    .filter(r => r.totalTrades >= 3)
    .map(r => ({ x: r.maxDrawdown, y: r.totalPnlPercent, winRate: r.winRate, label: `${r.params.fastSMA}/${r.params.slowSMA}` }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          Full Parameter Optimizer
        </CardTitle>
        <CardDescription>
          Test all parameter combinations with filters, walk-forward validation, and per-asset comparison
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parameter Ranges */}
        <div className="grid gap-3 md:grid-cols-4">
          <RangeInput label="Fast SMA" range={ranges.fastSMA} onChange={v => updateRange('fastSMA', v)} disabled={isRunning} />
          <RangeInput label="Slow SMA" range={ranges.slowSMA} onChange={v => updateRange('slowSMA', v)} disabled={isRunning} />
          <RangeInput label="Stop Loss %" range={ranges.stopLossPercent} onChange={v => updateRange('stopLossPercent', v)} disabled={isRunning} step={0.5} />
          <RangeInput label="Take Profit %" range={ranges.takeProfitPercent} onChange={v => updateRange('takeProfitPercent', v)} disabled={isRunning} step={0.5} />
          <RangeInput label="ATR Period" range={ranges.atrPeriod} onChange={v => updateRange('atrPeriod', v)} disabled={isRunning} />
          <RangeInput label="Min ATR %" range={ranges.minAtrPercent} onChange={v => updateRange('minAtrPercent', v)} disabled={isRunning} step={0.1} />
          <RangeInput label="SMA Distance %" range={ranges.minSmaDistancePercent} onChange={v => updateRange('minSmaDistancePercent', v)} disabled={isRunning} step={0.05} />
          <RangeInput label="Cooldown Candles" range={ranges.cooldownCandles} onChange={v => updateRange('cooldownCandles', v)} disabled={isRunning} />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)} disabled={isRunning}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="combined">Combined Portfolio</SelectItem>
              <SelectItem value="per-asset">Per-Asset</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Switch checked={enableWalkForward} onCheckedChange={setEnableWalkForward} disabled={isRunning} />
            <Label className="text-xs">Walk-Forward Validation</Label>
          </div>

          {enableWalkForward && (
            <div className="flex items-center gap-1">
              <Label className="text-xs text-muted-foreground">IS Ratio:</Label>
              <Input type="number" value={inSampleRatio} onChange={e => setInSampleRatio(parseInt(e.target.value) || 70)}
                className="h-7 w-16 text-xs" min={50} max={90} disabled={isRunning} />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          )}

          <Button onClick={runOptimization} disabled={isRunning || assets.length === 0} className="gap-2">
            {isRunning ? <><RotateCcw className="h-4 w-4 animate-spin" />Optimizing...</> : <><Play className="h-4 w-4" />Run ({totalCombinations} combos)</>}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">{statusText} — {progress.toFixed(0)}%</p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !isRunning && (
          <Tabs defaultValue="best" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="best" className="text-xs">Best Settings</TabsTrigger>
              <TabsTrigger value="table" className="text-xs">All Results</TabsTrigger>
              <TabsTrigger value="comparison" className="text-xs">Asset Comparison</TabsTrigger>
              <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
            </TabsList>

            {/* Best Settings Tab */}
            <TabsContent value="best" className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <BestSettingsCard title="Best Overall" icon={Crown} result={bestSettings.bestOverall}
                  color="border-yellow-500/30 bg-yellow-500/5"
                  onApply={bestSettings.bestOverall && onApplyParams ? () => onApplyParams({
                    fastSMA: bestSettings.bestOverall!.params.fastSMA,
                    slowSMA: bestSettings.bestOverall!.params.slowSMA,
                    stopLoss: bestSettings.bestOverall!.params.stopLossPercent,
                    takeProfit: bestSettings.bestOverall!.params.takeProfitPercent,
                  }) : undefined}
                />
                <BestSettingsCard title="Best Low Drawdown" icon={Shield} result={bestSettings.bestLowDrawdown}
                  color="border-blue-500/30 bg-blue-500/5" />
                <BestSettingsCard title="Best Win Rate" icon={Target} result={bestSettings.bestHighWinRate}
                  color="border-green-500/30 bg-green-500/5" />
                <BestSettingsCard title="Best Balanced (Risk-Adjusted)" icon={Award} result={bestSettings.bestBalanced}
                  color="border-primary/30 bg-primary/5" />
              </div>

              {/* Walk-forward validated results */}
              {wfResults.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-500" />
                    Walk-Forward Validated (Out-of-Sample)
                  </Label>
                  <div className="grid gap-2">
                    {wfResults.map((r, i) => (
                      <div key={i} className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs",
                        r.overfitFlag ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-secondary/20"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{i + 1}</span>
                          <span>SMA {r.params.fastSMA}/{r.params.slowSMA}</span>
                          <span className="text-muted-foreground">SL {r.params.stopLossPercent}% / TP {r.params.takeProfitPercent}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={r.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss"}>
                            {r.totalPnlPercent >= 0 ? '+' : ''}{r.totalPnlPercent.toFixed(2)}%
                          </span>
                          <span>WR {r.winRate.toFixed(0)}%</span>
                          <span>DD {r.maxDrawdown.toFixed(1)}%</span>
                          {r.overfitFlag ? (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />OVERFIT
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-trading-profit/20 text-trading-profit border-trading-profit/30">
                              ROBUST
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Full Results Table */}
            <TabsContent value="table" className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{sorted.length} results</Label>
                <Select value={sortBy} onValueChange={v => setSortBy(v as SortField)}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="riskAdjustedScore">Risk-Adjusted Score</SelectItem>
                    <SelectItem value="totalPnl">Net P&L</SelectItem>
                    <SelectItem value="winRate">Win Rate</SelectItem>
                    <SelectItem value="profitFactor">Profit Factor</SelectItem>
                    <SelectItem value="maxDrawdown">Max Drawdown</SelectItem>
                    <SelectItem value="sharpeRatio">Sharpe Ratio</SelectItem>
                    <SelectItem value="avgTradePnl">Avg Trade</SelectItem>
                    <SelectItem value="consistencyScore">Consistency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="h-[400px] rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] w-8">#</TableHead>
                      {mode === 'per-asset' && <TableHead className="text-[10px]">Asset</TableHead>}
                      <TableHead className="text-[10px]">Fast/Slow</TableHead>
                      <TableHead className="text-[10px]">SL/TP</TableHead>
                      <TableHead className="text-[10px]">ATR</TableHead>
                      <TableHead className="text-[10px]">Dist</TableHead>
                      <TableHead className="text-[10px]">CD</TableHead>
                      <TableHead className="text-[10px] text-right">Return</TableHead>
                      <TableHead className="text-[10px] text-right">DD</TableHead>
                      <TableHead className="text-[10px] text-right">Trades</TableHead>
                      <TableHead className="text-[10px] text-right">L/S</TableHead>
                      <TableHead className="text-[10px] text-right">WR</TableHead>
                      <TableHead className="text-[10px] text-right">PF</TableHead>
                      <TableHead className="text-[10px] text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.slice(0, 100).map((r, i) => (
                      <TableRow key={i} className={cn(i === 0 && "bg-trading-profit/10")}>
                        <TableCell className="text-[10px]">
                          {i + 1}
                          {i === 0 && <Trophy className="h-3 w-3 inline ml-0.5 text-yellow-500" />}
                        </TableCell>
                        {mode === 'per-asset' && <TableCell className="text-[10px]">{r.asset === 'combined' ? 'ALL' : r.asset.replace('USDT', '')}</TableCell>}
                        <TableCell className="text-[10px] font-medium">{r.params.fastSMA}/{r.params.slowSMA}</TableCell>
                        <TableCell className="text-[10px]">{r.params.stopLossPercent}/{r.params.takeProfitPercent}</TableCell>
                        <TableCell className="text-[10px]">{r.params.atrPeriod}≥{r.params.minAtrPercent}</TableCell>
                        <TableCell className="text-[10px]">{r.params.minSmaDistancePercent}</TableCell>
                        <TableCell className="text-[10px]">{r.params.cooldownCandles}</TableCell>
                        <TableCell className={cn("text-[10px] text-right font-medium", r.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                          {r.totalPnlPercent >= 0 ? '+' : ''}{r.totalPnlPercent.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-[10px] text-right text-trading-loss">{r.maxDrawdown.toFixed(1)}%</TableCell>
                        <TableCell className="text-[10px] text-right">{r.totalTrades}</TableCell>
                        <TableCell className="text-[10px] text-right">{r.longTrades}/{r.shortTrades}</TableCell>
                        <TableCell className="text-[10px] text-right">{r.winRate.toFixed(0)}%</TableCell>
                        <TableCell className="text-[10px] text-right">{r.profitFactor.toFixed(1)}</TableCell>
                        <TableCell className="text-[10px] text-right">{r.riskAdjustedScore.toFixed(0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>

            {/* Asset Comparison Tab */}
            <TabsContent value="comparison" className="space-y-4">
              {assetComparison.length > 0 ? (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    {assetComparison.map(ac => (
                      <Card key={ac.asset} className="border-border/50 bg-secondary/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            {ac.asset.replace('USDT', '/USDT')}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <p className="font-medium">Best: SMA {ac.bestParams.fastSMA}/{ac.bestParams.slowSMA}</p>
                          <p className="text-muted-foreground">
                            SL {ac.bestParams.stopLossPercent}% / TP {ac.bestParams.takeProfitPercent}% •
                            ATR {ac.bestParams.atrPeriod} ≥{ac.bestParams.minAtrPercent}% •
                            Dist ≥{ac.bestParams.minSmaDistancePercent}% • CD {ac.bestParams.cooldownCandles}
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="p-2 rounded bg-secondary/30">
                              <span className="text-muted-foreground">Return</span>
                              <p className={cn("font-bold", ac.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}>
                                {ac.totalPnlPercent >= 0 ? '+' : ''}{ac.totalPnlPercent.toFixed(2)}%
                              </p>
                            </div>
                            <div className="p-2 rounded bg-secondary/30">
                              <span className="text-muted-foreground">Win Rate</span>
                              <p className="font-bold">{ac.winRate.toFixed(1)}%</p>
                            </div>
                            <div className="p-2 rounded bg-secondary/30">
                              <span className="text-muted-foreground">Max DD</span>
                              <p className="font-bold text-trading-loss">{ac.maxDrawdown.toFixed(1)}%</p>
                            </div>
                            <div className="p-2 rounded bg-secondary/30">
                              <span className="text-muted-foreground">Trades</span>
                              <p className="font-bold">{ac.totalTrades} ({ac.longTrades}L/{ac.shortTrades}S)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {assetComparison.length >= 2 && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                      <span className="font-medium">Analysis: </span>
                      {(() => {
                        const sorted = [...assetComparison].sort((a, b) => b.totalPnlPercent - a.totalPnlPercent);
                        const best = sorted[0];
                        const paramsDiffer = assetComparison.some(a =>
                          a.bestParams.fastSMA !== assetComparison[0].bestParams.fastSMA ||
                          a.bestParams.slowSMA !== assetComparison[0].bestParams.slowSMA
                        );
                        return (
                          <>
                            <span className="text-primary font-semibold">{best.asset.replace('USDT', '')}</span> outperforms with{' '}
                            <span className={best.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss"}>
                              {best.totalPnlPercent.toFixed(2)}%
                            </span> return.{' '}
                            {paramsDiffer
                              ? 'Different assets perform best with different SMA values and filter thresholds — consider running per-asset strategies.'
                              : 'Both assets perform best with similar parameters — a combined strategy may work well.'}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Run optimization in "Per-Asset" mode to see asset comparison
                </p>
              )}
            </TabsContent>

            {/* Charts Tab */}
            <TabsContent value="charts" className="space-y-4">
              {scatterData.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Return vs Max Drawdown</Label>
                  <div className="h-[300px] rounded-lg border border-border/50 bg-secondary/10 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis type="number" dataKey="x" name="Max DD %" tick={{ fontSize: 10 }}
                          label={{ value: 'Max Drawdown %', position: 'bottom', fontSize: 10 }} />
                        <YAxis type="number" dataKey="y" name="Return %" tick={{ fontSize: 10 }}
                          label={{ value: 'Return %', angle: -90, position: 'left', fontSize: 10 }} />
                        <Tooltip content={({ payload }) => {
                          if (!payload?.[0]) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded p-2 text-xs shadow-lg">
                              <p className="font-medium">{d.label}</p>
                              <p>Return: {d.y.toFixed(2)}%</p>
                              <p>Max DD: {d.x.toFixed(2)}%</p>
                              <p>Win Rate: {d.winRate.toFixed(1)}%</p>
                            </div>
                          );
                        }} />
                        <Scatter data={scatterData} fill="hsl(var(--primary))">
                          {scatterData.map((d, i) => (
                            <Cell key={i} fill={d.y >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} opacity={0.6} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* SMA Heatmap */}
              {results.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SMA Combination Heatmap (Return %)</Label>
                  <div className="overflow-x-auto">
                    {(() => {
                      const fastVals = [...new Set(results.map(r => r.params.fastSMA))].sort((a, b) => a - b);
                      const slowVals = [...new Set(results.map(r => r.params.slowSMA))].sort((a, b) => a - b);
                      const maxPnl = Math.max(...results.map(r => Math.abs(r.totalPnlPercent)), 1);

                      // Group by SMA pair, take best result for each
                      const bestByPair = new Map<string, FullOptimizationResult>();
                      for (const r of results) {
                        const key = `${r.params.fastSMA}-${r.params.slowSMA}`;
                        const existing = bestByPair.get(key);
                        if (!existing || r.totalPnl > existing.totalPnl) {
                          bestByPair.set(key, r);
                        }
                      }

                      return (
                        <div className="inline-grid gap-1" style={{
                          gridTemplateColumns: `auto repeat(${slowVals.length}, minmax(44px, 1fr))`
                        }}>
                          <div className="text-[10px] text-muted-foreground p-1">F\S</div>
                          {slowVals.map(s => <div key={s} className="text-[10px] text-muted-foreground p-1 text-center">{s}</div>)}
                          {fastVals.map(f => (
                            <>
                              <div key={`l-${f}`} className="text-[10px] text-muted-foreground p-1">{f}</div>
                              {slowVals.map(s => {
                                if (f >= s) return <div key={`${f}-${s}`} className="bg-muted/20 rounded p-1 text-center text-[10px]">-</div>;
                                const r = bestByPair.get(`${f}-${s}`);
                                if (!r) return <div key={`${f}-${s}`} className="bg-muted/20 rounded p-1 text-center text-[10px]">-</div>;
                                const intensity = Math.min(Math.abs(r.totalPnlPercent) / maxPnl, 1);
                                return (
                                  <TooltipProvider key={`${f}-${s}`}>
                                    <UITooltip>
                                      <TooltipTrigger asChild>
                                        <div className={cn("rounded p-1 text-center text-[10px] cursor-default", r.totalPnl >= 0 ? "text-trading-profit" : "text-trading-loss")}
                                          style={{ backgroundColor: r.totalPnl >= 0 ? `hsla(142,76%,36%,${0.1 + intensity * 0.5})` : `hsla(0,84%,60%,${0.1 + intensity * 0.5})` }}>
                                          {r.totalPnlPercent.toFixed(0)}%
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-0.5">
                                          <p className="font-medium">SMA {f}/{s}</p>
                                          <p>Return: {r.totalPnlPercent.toFixed(2)}%</p>
                                          <p>WR: {r.winRate.toFixed(1)}% • DD: {r.maxDrawdown.toFixed(1)}%</p>
                                          <p>SL {r.params.stopLossPercent}% / TP {r.params.takeProfitPercent}%</p>
                                        </div>
                                      </TooltipContent>
                                    </UITooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-trading-loss/50" /><span>Loss</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-muted/30" /><span>Break-even</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-trading-profit/50" /><span>Profit</span></div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
