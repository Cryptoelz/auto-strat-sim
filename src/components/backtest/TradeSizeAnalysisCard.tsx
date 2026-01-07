import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Layers, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/hooks/useBacktest';

interface TradeSizeAnalysisCardProps {
  trades: BacktestTrade[];
}

interface SizeMetrics {
  avgSize: number;
  minSize: number;
  maxSize: number;
  sizeStdDev: number;
  correlation: number;
  smallTradesAvgReturn: number;
  largeTradesAvgReturn: number;
  smallTradesWinRate: number;
  largeTradesWinRate: number;
  optimalSizeRange: { min: number; max: number };
  scatterData: { size: number; returnPercent: number; type: 'win' | 'loss'; asset: string }[];
}

export function TradeSizeAnalysisCard({ trades }: TradeSizeAnalysisCardProps) {
  const metrics = useMemo((): SizeMetrics | null => {
    if (trades.length < 5) return null;

    // Calculate position values (size * entry price)
    const tradeData = trades.map(t => ({
      size: t.size * t.entryPrice,
      returnPercent: (t.pnl / (t.entryPrice * t.size)) * 100,
      pnl: t.pnl,
      type: t.type,
      asset: t.asset,
    }));

    const sizes = tradeData.map(t => t.size);
    const returns = tradeData.map(t => t.returnPercent);

    const avgSize = sizes.reduce((sum, s) => sum + s, 0) / sizes.length;
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);

    // Standard deviation
    const sizeVariance = sizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / sizes.length;
    const sizeStdDev = Math.sqrt(sizeVariance);

    // Correlation between size and returns
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const returnStdDev = Math.sqrt(returnVariance);

    let correlation = 0;
    if (sizeStdDev > 0 && returnStdDev > 0) {
      const covariance = tradeData.reduce((sum, t, i) => 
        sum + (sizes[i] - avgSize) * (returns[i] - avgReturn), 0
      ) / trades.length;
      correlation = covariance / (sizeStdDev * returnStdDev);
    }

    // Split trades by median size
    const sortedBySize = [...tradeData].sort((a, b) => a.size - b.size);
    const medianIndex = Math.floor(sortedBySize.length / 2);
    const smallTrades = sortedBySize.slice(0, medianIndex);
    const largeTrades = sortedBySize.slice(medianIndex);

    const smallTradesAvgReturn = smallTrades.length > 0
      ? smallTrades.reduce((sum, t) => sum + t.returnPercent, 0) / smallTrades.length
      : 0;
    const largeTradesAvgReturn = largeTrades.length > 0
      ? largeTrades.reduce((sum, t) => sum + t.returnPercent, 0) / largeTrades.length
      : 0;

    const smallTradesWinRate = smallTrades.length > 0
      ? (smallTrades.filter(t => t.type === 'win').length / smallTrades.length) * 100
      : 0;
    const largeTradesWinRate = largeTrades.length > 0
      ? (largeTrades.filter(t => t.type === 'win').length / largeTrades.length) * 100
      : 0;

    // Find optimal size range (best performing quartile)
    const quartileSize = Math.floor(sortedBySize.length / 4);
    const quartiles = [
      sortedBySize.slice(0, quartileSize),
      sortedBySize.slice(quartileSize, quartileSize * 2),
      sortedBySize.slice(quartileSize * 2, quartileSize * 3),
      sortedBySize.slice(quartileSize * 3),
    ];

    const quartileReturns = quartiles.map(q => 
      q.length > 0 ? q.reduce((sum, t) => sum + t.returnPercent, 0) / q.length : 0
    );

    const bestQuartileIndex = quartileReturns.indexOf(Math.max(...quartileReturns));
    const bestQuartile = quartiles[bestQuartileIndex];
    const optimalSizeRange = bestQuartile.length > 0
      ? { min: Math.min(...bestQuartile.map(t => t.size)), max: Math.max(...bestQuartile.map(t => t.size)) }
      : { min: avgSize * 0.8, max: avgSize * 1.2 };

    return {
      avgSize,
      minSize,
      maxSize,
      sizeStdDev,
      correlation,
      smallTradesAvgReturn,
      largeTradesAvgReturn,
      smallTradesWinRate,
      largeTradesWinRate,
      optimalSizeRange,
      scatterData: tradeData.map(t => ({
        size: t.size,
        returnPercent: t.returnPercent,
        type: t.type,
        asset: t.asset,
      })),
    };
  }, [trades]);

  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value.toFixed(0)}`;
  };

  const getCorrelationInterpretation = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs < 0.1) return { text: 'No correlation', color: 'text-muted-foreground' };
    if (abs < 0.3) return { text: 'Weak', color: 'text-muted-foreground' };
    if (abs < 0.5) return { text: 'Moderate', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-primary' };
  };

  const corrInfo = getCorrelationInterpretation(metrics.correlation);

  const chartConfig = {
    size: { label: 'Position Size', color: 'hsl(var(--chart-1))' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5" />
          Trade Size Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Analyzes position sizing patterns and their relationship to trade returns.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Position</p>
            <p className="font-semibold">{formatCurrency(metrics.avgSize)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Size Range</p>
            <p className="font-semibold">{formatCurrency(metrics.minSize)} - {formatCurrency(metrics.maxSize)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Std Deviation</p>
            <p className="font-semibold">{formatCurrency(metrics.sizeStdDev)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Size-Return Correlation</p>
            <p className={`font-semibold ${corrInfo.color}`}>
              {metrics.correlation.toFixed(3)} ({corrInfo.text})
            </p>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="h-[250px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="size" 
                  name="Size"
                  tickFormatter={(value) => formatCurrency(value)}
                  label={{ value: 'Position Size', position: 'bottom', offset: 20 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="returnPercent" 
                  name="Return"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  label={{ value: 'Return %', angle: -90, position: 'insideLeft', offset: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">{data.asset}</p>
                            <p>Size: {formatCurrency(data.size)}</p>
                            <p className={data.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                              Return: {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(2)}%
                            </p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Scatter data={metrics.scatterData} fill="hsl(var(--chart-1))">
                  {metrics.scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'win' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} 
                      opacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Small vs Large Trades Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-2">Smaller Positions</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Return</span>
                <span className={`font-medium ${metrics.smallTradesAvgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.smallTradesAvgReturn >= 0 ? '+' : ''}{metrics.smallTradesAvgReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium">{metrics.smallTradesWinRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium mb-2">Larger Positions</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Return</span>
                <span className={`font-medium ${metrics.largeTradesAvgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.largeTradesAvgReturn >= 0 ? '+' : ''}{metrics.largeTradesAvgReturn.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium">{metrics.largeTradesWinRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimal Size Range */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium">Optimal Position Size Range</p>
          </div>
          <p className="text-lg font-semibold">
            {formatCurrency(metrics.optimalSizeRange.min)} - {formatCurrency(metrics.optimalSizeRange.max)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on best-performing size quartile
          </p>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.correlation > 0.2 ? (
            <p>Positive correlation suggests larger positions tend to yield higher returns. Consider increasing size on high-conviction trades, but manage risk carefully.</p>
          ) : metrics.correlation < -0.2 ? (
            <p>Negative correlation indicates smaller positions perform better. Larger sizes may be causing overexposure or emotional trading errors.</p>
          ) : metrics.largeTradesAvgReturn > metrics.smallTradesAvgReturn ? (
            <p>No strong correlation, but larger trades slightly outperform. Position sizing appears balanced. Continue current approach.</p>
          ) : (
            <p>No strong correlation between size and returns. Consider using consistent position sizing based on risk management rules rather than varying sizes.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
