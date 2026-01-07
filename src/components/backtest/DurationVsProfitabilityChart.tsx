import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface DurationVsProfitabilityChartProps {
  trades: BacktestTrade[];
}

interface ScatterDataPoint {
  durationHours: number;
  profitPercent: number;
  asset: string;
  type: 'win' | 'loss';
}

function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  } else if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  } else {
    return `${(hours / 24).toFixed(1)}d`;
  }
}

export function DurationVsProfitabilityChart({ trades }: DurationVsProfitabilityChartProps) {
  const { scatterData, stats } = useMemo(() => {
    const data: ScatterDataPoint[] = trades.map((trade) => {
      const durationMs = trade.exitTime - trade.entryTime;
      const durationHours = durationMs / (1000 * 60 * 60);
      const profitPercent = (trade.pnl / (trade.entryPrice * trade.size)) * 100;
      
      return {
        durationHours,
        profitPercent,
        asset: trade.asset,
        type: trade.type,
      };
    });

    // Calculate correlation and stats
    const n = data.length;
    if (n < 2) {
      return { scatterData: data, stats: null };
    }

    const sumX = data.reduce((sum, d) => sum + d.durationHours, 0);
    const sumY = data.reduce((sum, d) => sum + d.profitPercent, 0);
    const sumXY = data.reduce((sum, d) => sum + d.durationHours * d.profitPercent, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.durationHours * d.durationHours, 0);
    const sumY2 = data.reduce((sum, d) => sum + d.profitPercent * d.profitPercent, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;

    const avgDuration = sumX / n;
    const avgProfit = sumY / n;
    const minDuration = Math.min(...data.map(d => d.durationHours));
    const maxDuration = Math.max(...data.map(d => d.durationHours));

    // Calculate avg profit for short vs long trades
    const medianDuration = [...data].sort((a, b) => a.durationHours - b.durationHours)[Math.floor(n / 2)].durationHours;
    const shortTrades = data.filter(d => d.durationHours < medianDuration);
    const longTrades = data.filter(d => d.durationHours >= medianDuration);
    
    const avgShortProfit = shortTrades.length > 0 
      ? shortTrades.reduce((sum, d) => sum + d.profitPercent, 0) / shortTrades.length 
      : 0;
    const avgLongProfit = longTrades.length > 0 
      ? longTrades.reduce((sum, d) => sum + d.profitPercent, 0) / longTrades.length 
      : 0;

    return {
      scatterData: data,
      stats: {
        correlation,
        avgDuration,
        avgProfit,
        minDuration,
        maxDuration,
        avgShortProfit,
        avgLongProfit,
        medianDuration,
      },
    };
  }, [trades]);

  if (trades.length < 2) {
    return null;
  }

  const chartConfig = {
    profit: {
      label: 'Profit %',
      color: 'hsl(var(--chart-1))',
    },
  };

  const getCorrelationInterpretation = (correlation: number) => {
    const absCorr = Math.abs(correlation);
    if (absCorr < 0.1) return { text: 'No correlation', color: 'text-muted-foreground' };
    if (absCorr < 0.3) return { text: 'Weak correlation', color: 'text-muted-foreground' };
    if (absCorr < 0.5) return { text: 'Moderate correlation', color: 'text-yellow-500' };
    if (absCorr < 0.7) return { text: 'Strong correlation', color: 'text-orange-500' };
    return { text: 'Very strong correlation', color: 'text-primary' };
  };

  const correlationInfo = stats ? getCorrelationInterpretation(stats.correlation) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Trade Duration vs Profitability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Correlation</p>
              <p className={`font-semibold ${correlationInfo?.color}`}>
                {stats.correlation.toFixed(3)} ({correlationInfo?.text})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Avg Duration</p>
              <p className="font-semibold">{formatDuration(stats.avgDuration)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Short Trades Avg</p>
              <p className={`font-semibold ${stats.avgShortProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.avgShortProfit >= 0 ? '+' : ''}{stats.avgShortProfit.toFixed(2)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Long Trades Avg</p>
              <p className={`font-semibold ${stats.avgLongProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.avgLongProfit >= 0 ? '+' : ''}{stats.avgLongProfit.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <div className="h-[300px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="durationHours" 
                  name="Duration"
                  tickFormatter={(value) => formatDuration(value)}
                  label={{ value: 'Duration', position: 'bottom', offset: 20 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="profitPercent" 
                  name="Profit"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  label={{ value: 'Profit %', angle: -90, position: 'insideLeft', offset: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name, props) => {
                        const data = props.payload as ScatterDataPoint;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">{data.asset}</p>
                            <p>Duration: {formatDuration(data.durationHours)}</p>
                            <p className={data.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                              Profit: {data.profitPercent >= 0 ? '+' : ''}{data.profitPercent.toFixed(2)}%
                            </p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Scatter data={scatterData} fill="hsl(var(--chart-1))">
                  {scatterData.map((entry, index) => (
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

        {stats && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <p className="font-medium text-foreground mb-1">Insight</p>
            {stats.correlation > 0.2 ? (
              <p>Longer trades tend to be more profitable. Consider extending holding periods for better returns.</p>
            ) : stats.correlation < -0.2 ? (
              <p>Shorter trades tend to be more profitable. Quick entries and exits may improve performance.</p>
            ) : (
              <p>Trade duration has minimal impact on profitability. Focus on entry/exit signals rather than holding time.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
