import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface PnLDistributionChartProps {
  trades: BacktestTrade[];
}

interface HistogramBin {
  range: string;
  count: number;
  minPnl: number;
  maxPnl: number;
  isPositive: boolean;
  isZeroCrossing: boolean;
}

export function PnLDistributionChart({ trades }: PnLDistributionChartProps) {
  const { histogramData, stats } = useMemo(() => {
    if (trades.length < 2) {
      return { histogramData: [], stats: null };
    }

    // Calculate P&L percentages for each trade
    const pnlPercentages = trades.map((trade) => {
      return (trade.pnl / (trade.entryPrice * trade.size)) * 100;
    });

    const minPnl = Math.min(...pnlPercentages);
    const maxPnl = Math.max(...pnlPercentages);
    const range = maxPnl - minPnl;

    // Determine number of bins (Sturges' formula)
    const numBins = Math.max(5, Math.min(20, Math.ceil(1 + 3.322 * Math.log10(trades.length))));
    const binWidth = range / numBins;

    // Create histogram bins
    const bins: HistogramBin[] = [];
    for (let i = 0; i < numBins; i++) {
      const binMin = minPnl + i * binWidth;
      const binMax = minPnl + (i + 1) * binWidth;
      const count = pnlPercentages.filter(
        (pnl) => pnl >= binMin && (i === numBins - 1 ? pnl <= binMax : pnl < binMax)
      ).length;

      const midpoint = (binMin + binMax) / 2;
      bins.push({
        range: `${binMin.toFixed(1)}% to ${binMax.toFixed(1)}%`,
        count,
        minPnl: binMin,
        maxPnl: binMax,
        isPositive: midpoint >= 0,
        isZeroCrossing: binMin < 0 && binMax > 0,
      });
    }

    // Calculate statistics
    const mean = pnlPercentages.reduce((sum, pnl) => sum + pnl, 0) / pnlPercentages.length;
    const sortedPnl = [...pnlPercentages].sort((a, b) => a - b);
    const median = sortedPnl[Math.floor(sortedPnl.length / 2)];
    
    const variance = pnlPercentages.reduce((sum, pnl) => sum + Math.pow(pnl - mean, 2), 0) / pnlPercentages.length;
    const stdDev = Math.sqrt(variance);

    // Calculate skewness
    const skewness = pnlPercentages.reduce((sum, pnl) => sum + Math.pow((pnl - mean) / stdDev, 3), 0) / pnlPercentages.length;

    // Calculate kurtosis
    const kurtosis = pnlPercentages.reduce((sum, pnl) => sum + Math.pow((pnl - mean) / stdDev, 4), 0) / pnlPercentages.length - 3;

    return {
      histogramData: bins,
      stats: {
        mean,
        median,
        stdDev,
        skewness,
        kurtosis,
        min: minPnl,
        max: maxPnl,
        positive: pnlPercentages.filter(p => p > 0).length,
        negative: pnlPercentages.filter(p => p < 0).length,
      },
    };
  }, [trades]);

  if (trades.length < 2 || !stats) {
    return null;
  }

  const chartConfig = {
    count: {
      label: 'Trades',
      color: 'hsl(var(--chart-1))',
    },
  };

  const getSkewnessInterpretation = (skew: number) => {
    if (skew > 0.5) return { text: 'Right-skewed (more large wins)', color: 'text-green-500' };
    if (skew < -0.5) return { text: 'Left-skewed (more large losses)', color: 'text-red-500' };
    return { text: 'Approximately symmetric', color: 'text-muted-foreground' };
  };

  const skewnessInfo = getSkewnessInterpretation(stats.skewness);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          P&L Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Mean Return</p>
            <p className={`font-semibold ${stats.mean >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.mean >= 0 ? '+' : ''}{stats.mean.toFixed(2)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Median Return</p>
            <p className={`font-semibold ${stats.median >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.median >= 0 ? '+' : ''}{stats.median.toFixed(2)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Std Deviation</p>
            <p className="font-semibold">{stats.stdDev.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Skewness</p>
            <p className={`font-semibold ${skewnessInfo.color}`}>
              {stats.skewness.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Histogram Chart */}
        <div className="h-[250px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <XAxis 
                  dataKey="range" 
                  tick={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Frequency', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <ReferenceLine x={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const data = props.payload as HistogramBin;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">{data.range}</p>
                            <p>{data.count} trade{data.count !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.isZeroCrossing 
                        ? 'hsl(var(--muted-foreground))' 
                        : entry.isPositive 
                          ? 'hsl(142, 76%, 36%)' 
                          : 'hsl(0, 84%, 60%)'
                      }
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Range Labels */}
        <div className="flex justify-between text-xs text-muted-foreground px-2">
          <span>{stats.min.toFixed(1)}%</span>
          <span>0%</span>
          <span>{stats.max.toFixed(1)}%</span>
        </div>

        {/* Win/Loss Breakdown */}
        <div className="flex gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>{stats.positive} profitable ({((stats.positive / trades.length) * 100).toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>{stats.negative} losing ({((stats.negative / trades.length) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Distribution Analysis</p>
          <p>
            {stats.skewness > 0.5 
              ? 'Positive skew indicates occasional large wins that boost overall performance. This is favorable for trend-following strategies.'
              : stats.skewness < -0.5
                ? 'Negative skew suggests occasional large losses. Consider tightening stop-losses to reduce tail risk.'
                : 'Symmetric distribution indicates consistent trade outcomes. Focus on improving win rate or reward-to-risk ratio.'}
            {stats.kurtosis > 1 && ' High kurtosis indicates more extreme outcomes than a normal distribution.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
