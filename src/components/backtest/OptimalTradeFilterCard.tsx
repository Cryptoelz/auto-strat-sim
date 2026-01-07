import { useMemo } from 'react';
import { BacktestTrade } from '@/types/backtest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'recharts';
import { Filter, TrendingUp, TrendingDown, Clock, Calendar, Zap, Target } from 'lucide-react';

interface OptimalTradeFilterCardProps {
  trades: BacktestTrade[];
}

interface FilterAnalysis {
  name: string;
  category: string;
  segments: {
    label: string;
    count: number;
    winRate: number;
    avgPnl: number;
    avgPnlPercent: number;
    totalPnl: number;
  }[];
  correlation: number;
  bestSegment: string;
  worstSegment: string;
  importance: number;
}

function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

export function OptimalTradeFilterCard({ trades }: OptimalTradeFilterCardProps) {
  const analyses = useMemo(() => {
    if (trades.length < 5) return [];

    const results: FilterAnalysis[] = [];
    const pnls = trades.map(t => t.pnl);

    // 1. Hour of Day Analysis
    const hourBuckets: Record<string, BacktestTrade[]> = {};
    trades.forEach(t => {
      const hour = new Date(t.entryTime).getUTCHours();
      const bucket = hour < 6 ? '00-06' : hour < 12 ? '06-12' : hour < 18 ? '12-18' : '18-24';
      if (!hourBuckets[bucket]) hourBuckets[bucket] = [];
      hourBuckets[bucket].push(t);
    });

    const hourSegments = Object.entries(hourBuckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, trs]) => ({
        label: `${label} UTC`,
        count: trs.length,
        winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
        avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
        avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
        totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
      }));

    const hourValues = trades.map(t => new Date(t.entryTime).getUTCHours());
    const hourCorr = Math.abs(calculateCorrelation(hourValues, pnls));
    
    if (hourSegments.length > 0) {
      const bestHour = hourSegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstHour = hourSegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Time of Day',
        category: 'Timing',
        segments: hourSegments,
        correlation: hourCorr,
        bestSegment: bestHour.label,
        worstSegment: worstHour.label,
        importance: hourCorr * 100,
      });
    }

    // 2. Day of Week Analysis
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayBuckets: Record<string, BacktestTrade[]> = {};
    trades.forEach(t => {
      const day = dayNames[new Date(t.entryTime).getUTCDay()];
      if (!dayBuckets[day]) dayBuckets[day] = [];
      dayBuckets[day].push(t);
    });

    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const daySegments = dayOrder
      .filter(day => dayBuckets[day])
      .map(label => {
        const trs = dayBuckets[label];
        return {
          label: label.slice(0, 3),
          count: trs.length,
          winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
          avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
          avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
          totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
        };
      });

    const dayValues = trades.map(t => new Date(t.entryTime).getUTCDay());
    const dayCorr = Math.abs(calculateCorrelation(dayValues, pnls));

    if (daySegments.length > 0) {
      const bestDay = daySegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstDay = daySegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Day of Week',
        category: 'Timing',
        segments: daySegments,
        correlation: dayCorr,
        bestSegment: bestDay.label,
        worstSegment: worstDay.label,
        importance: dayCorr * 100,
      });
    }

    // 3. Trade Duration Analysis
    const durations = trades.map(t => (t.exitTime - t.entryTime) / (1000 * 60 * 60)); // hours
    const durationPercentiles = [0, 25, 50, 75, 100].map(p => {
      const sorted = [...durations].sort((a, b) => a - b);
      return sorted[Math.floor((p / 100) * (sorted.length - 1))];
    });

    const durationBuckets: Record<string, BacktestTrade[]> = { 'Short': [], 'Medium': [], 'Long': [] };
    trades.forEach((t, i) => {
      const d = durations[i];
      if (d < durationPercentiles[2]) durationBuckets['Short'].push(t);
      else if (d < durationPercentiles[3]) durationBuckets['Medium'].push(t);
      else durationBuckets['Long'].push(t);
    });

    const durationSegments = ['Short', 'Medium', 'Long']
      .filter(label => durationBuckets[label].length > 0)
      .map(label => {
        const trs = durationBuckets[label];
        return {
          label,
          count: trs.length,
          winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
          avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
          avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
          totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
        };
      });

    const durationCorr = Math.abs(calculateCorrelation(durations, pnls));

    if (durationSegments.length > 0) {
      const bestDuration = durationSegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstDuration = durationSegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Trade Duration',
        category: 'Execution',
        segments: durationSegments,
        correlation: durationCorr,
        bestSegment: bestDuration.label,
        worstSegment: worstDuration.label,
        importance: durationCorr * 100,
      });
    }

    // 4. Exit Reason Analysis
    const exitBuckets: Record<string, BacktestTrade[]> = {};
    trades.forEach(t => {
      const reason = t.exitReason || 'signal';
      if (!exitBuckets[reason]) exitBuckets[reason] = [];
      exitBuckets[reason].push(t);
    });

    const exitSegments = Object.entries(exitBuckets).map(([label, trs]) => ({
      label: label === 'take_profit' ? 'Take Profit' : label === 'stop_loss' ? 'Stop Loss' : 'Signal',
      count: trs.length,
      winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
      avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
      avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
      totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
    }));

    // For exit reason, use variance as importance indicator
    const exitVariance = exitSegments.length > 1 
      ? Math.sqrt(exitSegments.reduce((s, seg) => s + Math.pow(seg.avgPnl - exitSegments.reduce((a, b) => a + b.avgPnl, 0) / exitSegments.length, 2), 0) / exitSegments.length)
      : 0;

    if (exitSegments.length > 0) {
      const bestExit = exitSegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstExit = exitSegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Exit Reason',
        category: 'Execution',
        segments: exitSegments,
        correlation: 0,
        bestSegment: bestExit.label,
        worstSegment: worstExit.label,
        importance: Math.min(exitVariance / 10, 100),
      });
    }

    // 5. Asset Analysis
    const assetBuckets: Record<string, BacktestTrade[]> = {};
    trades.forEach(t => {
      if (!assetBuckets[t.asset]) assetBuckets[t.asset] = [];
      assetBuckets[t.asset].push(t);
    });

    const assetSegments = Object.entries(assetBuckets).map(([label, trs]) => ({
      label: label.replace('USDT', ''),
      count: trs.length,
      winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
      avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
      avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
      totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
    }));

    const assetVariance = assetSegments.length > 1
      ? Math.sqrt(assetSegments.reduce((s, seg) => s + Math.pow(seg.avgPnl - assetSegments.reduce((a, b) => a + b.avgPnl, 0) / assetSegments.length, 2), 0) / assetSegments.length)
      : 0;

    if (assetSegments.length > 1) {
      const bestAsset = assetSegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstAsset = assetSegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Asset',
        category: 'Selection',
        segments: assetSegments,
        correlation: 0,
        bestSegment: bestAsset.label,
        worstSegment: worstAsset.label,
        importance: Math.min(assetVariance / 5, 100),
      });
    }

    // 6. Position Size Analysis
    const sizes = trades.map(t => t.size * t.entryPrice);
    const sizePercentiles = [0, 33, 66, 100].map(p => {
      const sorted = [...sizes].sort((a, b) => a - b);
      return sorted[Math.floor((p / 100) * (sorted.length - 1))];
    });

    const sizeBuckets: Record<string, BacktestTrade[]> = { 'Small': [], 'Medium': [], 'Large': [] };
    trades.forEach((t, i) => {
      const s = sizes[i];
      if (s < sizePercentiles[1]) sizeBuckets['Small'].push(t);
      else if (s < sizePercentiles[2]) sizeBuckets['Medium'].push(t);
      else sizeBuckets['Large'].push(t);
    });

    const sizeSegments = ['Small', 'Medium', 'Large']
      .filter(label => sizeBuckets[label].length > 0)
      .map(label => {
        const trs = sizeBuckets[label];
        return {
          label,
          count: trs.length,
          winRate: (trs.filter(t => t.type === 'win').length / trs.length) * 100,
          avgPnl: trs.reduce((s, t) => s + t.pnl, 0) / trs.length,
          avgPnlPercent: (trs.reduce((s, t) => s + t.pnlPercent, 0) / trs.length) * 100,
          totalPnl: trs.reduce((s, t) => s + t.pnl, 0),
        };
      });

    const sizeCorr = Math.abs(calculateCorrelation(sizes, pnls));

    if (sizeSegments.length > 0) {
      const bestSize = sizeSegments.reduce((a, b) => a.avgPnl > b.avgPnl ? a : b);
      const worstSize = sizeSegments.reduce((a, b) => a.avgPnl < b.avgPnl ? a : b);
      results.push({
        name: 'Position Size',
        category: 'Risk',
        segments: sizeSegments,
        correlation: sizeCorr,
        bestSegment: bestSize.label,
        worstSegment: worstSize.label,
        importance: sizeCorr * 100,
      });
    }

    // Sort by importance
    return results.sort((a, b) => b.importance - a.importance);
  }, [trades]);

  if (trades.length < 5) {
    return null;
  }

  const topFilters = analyses.slice(0, 3);
  const avgOverallWinRate = (trades.filter(t => t.type === 'win').length / trades.length) * 100;

  const chartConfig = {
    avgPnl: { label: 'Avg P&L', color: 'hsl(var(--primary))' },
    winRate: { label: 'Win Rate', color: 'hsl(var(--accent))' },
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Optimal Trade Filter Analysis
        </CardTitle>
        <CardDescription>
          Identifies which trade characteristics correlate most strongly with profitability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Importance Ranking */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Factor Importance Ranking</h4>
          <div className="space-y-2">
            {analyses.map((analysis, index) => (
              <div key={analysis.name} className="flex items-center gap-3">
                <Badge variant={index === 0 ? 'default' : 'outline'} className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                  {index + 1}
                </Badge>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{analysis.name}</span>
                    <span className="text-xs text-muted-foreground">{analysis.category}</span>
                  </div>
                  <Progress value={analysis.importance} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {analysis.importance.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Filter Analysis Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          {topFilters.map((analysis) => (
            <div key={analysis.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{analysis.name}</h4>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">{analysis.bestSegment}</span>
                  <span className="text-muted-foreground mx-1">|</span>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{analysis.worstSegment}</span>
                </div>
              </div>
              <ChartContainer config={chartConfig} className="h-[160px] w-full">
                <BarChart data={analysis.segments} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={60} />
                  <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item) => {
                          const seg = item.payload;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between gap-4">
                                <span>Avg P&L:</span>
                                <span className={seg.avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  ${seg.avgPnl.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Win Rate:</span>
                                <span>{seg.winRate.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Trades:</span>
                                <span>{seg.count}</span>
                              </div>
                              <div className="flex justify-between gap-4">
                                <span>Total P&L:</span>
                                <span className={seg.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  ${seg.totalPnl.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                    }
                  />
                  <Bar dataKey="avgPnl" radius={[0, 4, 4, 0]}>
                    {analysis.segments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.avgPnl >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          ))}
        </div>

        {/* Optimal Filter Recommendations */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Optimal Filter Recommendations
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {analyses.slice(0, 4).map((analysis) => {
              const bestSeg = analysis.segments.find(s => s.label === analysis.bestSegment || s.label.includes(analysis.bestSegment));
              if (!bestSeg) return null;
              
              const improvement = bestSeg.winRate - avgOverallWinRate;
              
              return (
                <div key={analysis.name} className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/50">
                  <div>
                    <span className="text-sm font-medium">{analysis.name}: </span>
                    <Badge variant="secondary" className="ml-1">{analysis.bestSegment}</Badge>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-medium ${improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}% WR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Applying these filters would have improved win rate compared to the overall {avgOverallWinRate.toFixed(1)}% baseline.
          </p>
        </div>

        {/* Insight */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">Insight: </span>
            {analyses.length > 0 ? (
              <>
                <span className="font-semibold text-primary">{analyses[0].name}</span> shows the strongest correlation with profitability. 
                Trading during <span className="font-medium">{analyses[0].bestSegment}</span> periods yielded the best results, 
                while <span className="font-medium">{analyses[0].worstSegment}</span> periods underperformed. 
                Consider filtering trades based on these characteristics to improve strategy performance.
              </>
            ) : (
              'Not enough data to determine optimal trade filters.'
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
