import { useMemo } from 'react';
import { BacktestTrade } from '@/hooks/useBacktest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts';
import { Layers, TrendingUp, TrendingDown, Target, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';

interface TradeClusteringCardProps {
  trades: BacktestTrade[];
}

interface TradeFeatures {
  trade: BacktestTrade;
  hour: number;
  dayOfWeek: number;
  durationHours: number;
  positionValue: number;
  normalizedDuration: number;
  normalizedSize: number;
  normalizedHour: number;
}

interface Cluster {
  id: number;
  trades: TradeFeatures[];
  centroid: { duration: number; size: number; hour: number };
  avgPnl: number;
  totalPnl: number;
  winRate: number;
  count: number;
  characteristics: string[];
  label: string;
  quality: 'profitable' | 'break-even' | 'losing';
}

// Simple K-means clustering implementation
function kMeansClustering(features: TradeFeatures[], k: number, maxIterations: number = 50): number[] {
  if (features.length < k) return features.map((_, i) => i % k);
  
  // Initialize centroids using k-means++ method
  const centroids: { duration: number; size: number; hour: number }[] = [];
  const usedIndices = new Set<number>();
  
  // First centroid is random
  const firstIdx = Math.floor(Math.random() * features.length);
  centroids.push({
    duration: features[firstIdx].normalizedDuration,
    size: features[firstIdx].normalizedSize,
    hour: features[firstIdx].normalizedHour,
  });
  usedIndices.add(firstIdx);
  
  // Select remaining centroids with probability proportional to distance squared
  while (centroids.length < k) {
    let maxDist = -Infinity;
    let maxIdx = 0;
    
    features.forEach((f, i) => {
      if (usedIndices.has(i)) return;
      
      const minDist = Math.min(...centroids.map(c => 
        Math.sqrt(
          Math.pow(f.normalizedDuration - c.duration, 2) +
          Math.pow(f.normalizedSize - c.size, 2) +
          Math.pow(f.normalizedHour - c.hour, 2)
        )
      ));
      
      if (minDist > maxDist) {
        maxDist = minDist;
        maxIdx = i;
      }
    });
    
    centroids.push({
      duration: features[maxIdx].normalizedDuration,
      size: features[maxIdx].normalizedSize,
      hour: features[maxIdx].normalizedHour,
    });
    usedIndices.add(maxIdx);
  }
  
  let assignments = new Array(features.length).fill(0);
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign each point to nearest centroid
    const newAssignments = features.map(f => {
      let minDist = Infinity;
      let minCluster = 0;
      
      centroids.forEach((c, i) => {
        const dist = Math.sqrt(
          Math.pow(f.normalizedDuration - c.duration, 2) +
          Math.pow(f.normalizedSize - c.size, 2) +
          Math.pow(f.normalizedHour - c.hour, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          minCluster = i;
        }
      });
      
      return minCluster;
    });
    
    // Check for convergence
    const changed = newAssignments.some((a, i) => a !== assignments[i]);
    assignments = newAssignments;
    
    if (!changed) break;
    
    // Update centroids
    for (let i = 0; i < k; i++) {
      const clusterPoints = features.filter((_, idx) => assignments[idx] === i);
      if (clusterPoints.length === 0) continue;
      
      centroids[i] = {
        duration: clusterPoints.reduce((s, p) => s + p.normalizedDuration, 0) / clusterPoints.length,
        size: clusterPoints.reduce((s, p) => s + p.normalizedSize, 0) / clusterPoints.length,
        hour: clusterPoints.reduce((s, p) => s + p.normalizedHour, 0) / clusterPoints.length,
      };
    }
  }
  
  return assignments;
}

function getTimeLabel(hour: number): string {
  if (hour < 6) return 'Night (00-06)';
  if (hour < 12) return 'Morning (06-12)';
  if (hour < 18) return 'Afternoon (12-18)';
  return 'Evening (18-24)';
}

function getDurationLabel(hours: number): string {
  if (hours < 1) return 'Very Short (<1h)';
  if (hours < 4) return 'Short (1-4h)';
  if (hours < 12) return 'Medium (4-12h)';
  if (hours < 24) return 'Long (12-24h)';
  return 'Very Long (>24h)';
}

function getSizeLabel(percentile: number): string {
  if (percentile < 0.33) return 'Small Position';
  if (percentile < 0.67) return 'Medium Position';
  return 'Large Position';
}

export function TradePatternClusteringCard({ trades }: TradeClusteringCardProps) {
  const analysis = useMemo(() => {
    if (trades.length < 10) return null;

    // Extract features from trades
    const durations = trades.map(t => (t.exitTime - t.entryTime) / (1000 * 60 * 60));
    const sizes = trades.map(t => t.size * t.entryPrice);
    const hours = trades.map(t => new Date(t.entryTime).getUTCHours());
    
    // Normalize features to 0-1 range
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    const maxSize = Math.max(...sizes);
    const minSize = Math.min(...sizes);
    
    const features: TradeFeatures[] = trades.map((trade, i) => ({
      trade,
      hour: hours[i],
      dayOfWeek: new Date(trade.entryTime).getUTCDay(),
      durationHours: durations[i],
      positionValue: sizes[i],
      normalizedDuration: maxDuration !== minDuration ? (durations[i] - minDuration) / (maxDuration - minDuration) : 0.5,
      normalizedSize: maxSize !== minSize ? (sizes[i] - minSize) / (maxSize - minSize) : 0.5,
      normalizedHour: hours[i] / 24,
    }));

    // Determine optimal number of clusters (between 3 and 5)
    const k = Math.min(5, Math.max(3, Math.floor(trades.length / 8)));
    
    // Run K-means clustering
    const assignments = kMeansClustering(features, k);
    
    // Group trades by cluster and calculate statistics
    const clusters: Cluster[] = [];
    
    for (let i = 0; i < k; i++) {
      const clusterTrades = features.filter((_, idx) => assignments[idx] === i);
      if (clusterTrades.length === 0) continue;
      
      const pnls = clusterTrades.map(t => t.trade.pnl);
      const avgPnl = pnls.reduce((a, b) => a + b, 0) / pnls.length;
      const totalPnl = pnls.reduce((a, b) => a + b, 0);
      const wins = clusterTrades.filter(t => t.trade.type === 'win').length;
      const winRate = (wins / clusterTrades.length) * 100;
      
      // Calculate centroid characteristics
      const avgDuration = clusterTrades.reduce((s, t) => s + t.durationHours, 0) / clusterTrades.length;
      const avgSize = clusterTrades.reduce((s, t) => s + t.positionValue, 0) / clusterTrades.length;
      const avgHour = clusterTrades.reduce((s, t) => s + t.hour, 0) / clusterTrades.length;
      
      // Determine cluster characteristics
      const characteristics: string[] = [];
      
      // Time of day
      characteristics.push(getTimeLabel(avgHour));
      
      // Duration
      characteristics.push(getDurationLabel(avgDuration));
      
      // Position size (relative)
      const sizePercentile = (avgSize - minSize) / (maxSize - minSize || 1);
      characteristics.push(getSizeLabel(sizePercentile));
      
      // Most common exit reason
      const exitReasons = clusterTrades.reduce((acc, t) => {
        const reason = t.trade.exitReason || 'signal';
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const topExitReason = Object.entries(exitReasons).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topExitReason === 'take_profit') characteristics.push('Mostly Take Profit');
      else if (topExitReason === 'stop_loss') characteristics.push('Mostly Stop Loss');
      
      // Generate label based on performance and characteristics
      let label = '';
      if (avgPnl > 0) {
        if (avgDuration < 4) label = 'Quick Wins';
        else if (avgHour >= 6 && avgHour < 12) label = 'Morning Runners';
        else if (avgHour >= 18 || avgHour < 6) label = 'Night Traders';
        else label = 'Steady Gainers';
      } else if (avgPnl < -20) {
        if (topExitReason === 'stop_loss') label = 'Stop Outs';
        else label = 'Losing Trades';
      } else {
        label = 'Break-Even';
      }
      
      clusters.push({
        id: i,
        trades: clusterTrades,
        centroid: { duration: avgDuration, size: avgSize, hour: avgHour },
        avgPnl,
        totalPnl,
        winRate,
        count: clusterTrades.length,
        characteristics,
        label,
        quality: avgPnl > 10 ? 'profitable' : avgPnl < -10 ? 'losing' : 'break-even',
      });
    }
    
    // Sort by average PnL
    clusters.sort((a, b) => b.avgPnl - a.avgPnl);
    
    // Calculate overall stats
    const overallWinRate = (trades.filter(t => t.type === 'win').length / trades.length) * 100;
    const overallAvgPnl = trades.reduce((s, t) => s + t.pnl, 0) / trades.length;
    
    // Scatter chart data - show trades with cluster coloring
    const scatterData = features.map((f, i) => ({
      x: f.durationHours,
      y: f.trade.pnl,
      size: f.positionValue,
      cluster: assignments[i],
      winRate: f.trade.type === 'win' ? 100 : 0,
      asset: f.trade.asset,
    }));

    return {
      clusters,
      scatterData,
      overallWinRate,
      overallAvgPnl,
      features,
    };
  }, [trades]);

  if (!analysis || analysis.clusters.length === 0) {
    return null;
  }

  const { clusters, scatterData, overallWinRate, overallAvgPnl } = analysis;
  const profitableClusters = clusters.filter(c => c.quality === 'profitable');
  const losingClusters = clusters.filter(c => c.quality === 'losing');

  const clusterColors = [
    'hsl(142, 76%, 36%)', // Green
    'hsl(217, 91%, 60%)', // Blue
    'hsl(280, 87%, 65%)', // Purple
    'hsl(43, 96%, 56%)',  // Yellow
    'hsl(0, 84%, 60%)',   // Red
  ];

  const chartConfig = clusters.reduce((acc, cluster, i) => {
    acc[`cluster${cluster.id}`] = { 
      label: cluster.label, 
      color: clusterColors[i % clusterColors.length] 
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Trade Clustering Analysis
        </CardTitle>
        <CardDescription>
          Groups similar trades by duration, timing, and size to identify profitable patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cluster Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Clusters Found</span>
            </div>
            <p className="text-2xl font-bold">{clusters.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {trades.length} trades analyzed
            </p>
          </div>
          <div className="p-4 rounded-lg border border-trading-profit/30 bg-trading-profit/5">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-trading-profit" />
              <span className="text-sm font-medium text-trading-profit">Profitable Clusters</span>
            </div>
            <p className="text-2xl font-bold text-trading-profit">{profitableClusters.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {profitableClusters.reduce((s, c) => s + c.count, 0)} trades
            </p>
          </div>
          <div className="p-4 rounded-lg border border-trading-loss/30 bg-trading-loss/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-trading-loss" />
              <span className="text-sm font-medium text-trading-loss">Losing Clusters</span>
            </div>
            <p className="text-2xl font-bold text-trading-loss">{losingClusters.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {losingClusters.reduce((s, c) => s + c.count, 0)} trades
            </p>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Trade Distribution by Duration & P&L
          </h4>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Duration" 
                unit="h"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="P&L" 
                unit="$"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
              />
              <ZAxis type="number" dataKey="size" range={[40, 400]} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const d = item.payload;
                      return (
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span>P&L:</span>
                            <span className={d.y >= 0 ? 'text-green-500' : 'text-red-500'}>
                              ${d.y.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Duration:</span>
                            <span>{d.x.toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Size:</span>
                            <span>${d.size.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>Cluster:</span>
                            <span>{clusters[d.cluster]?.label || `#${d.cluster}`}</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Scatter data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={clusterColors[entry.cluster % clusterColors.length]}
                    fillOpacity={0.7}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {clusters.map((cluster, i) => (
              <div key={cluster.id} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: clusterColors[i % clusterColors.length] }}
                />
                <span className="text-muted-foreground">{cluster.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cluster Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Cluster Profiles
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {clusters.map((cluster, i) => (
              <div 
                key={cluster.id}
                className={`p-4 rounded-lg border ${
                  cluster.quality === 'profitable' 
                    ? 'border-trading-profit/30 bg-trading-profit/5' 
                    : cluster.quality === 'losing'
                      ? 'border-trading-loss/30 bg-trading-loss/5'
                      : 'border-border/50 bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: clusterColors[i % clusterColors.length] }}
                    />
                    <span className="font-medium">{cluster.label}</span>
                  </div>
                  <Badge 
                    variant={cluster.quality === 'profitable' ? 'default' : 'outline'}
                    className={
                      cluster.quality === 'profitable' 
                        ? 'bg-trading-profit/20 text-trading-profit border-trading-profit/30' 
                        : cluster.quality === 'losing'
                          ? 'bg-trading-loss/20 text-trading-loss border-trading-loss/30'
                          : ''
                    }
                  >
                    {cluster.count} trades
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <p className={`text-sm font-bold ${cluster.avgPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      ${cluster.avgPnl.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg P&L</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{cluster.winRate.toFixed(0)}%</p>
                    <p className="text-[10px] text-muted-foreground">Win Rate</p>
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${cluster.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                      ${cluster.totalPnl.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total P&L</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {cluster.characteristics.slice(0, 3).map((char, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                      {char}
                    </Badge>
                  ))}
                </div>

                {/* Win rate comparison */}
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">vs Overall Win Rate</span>
                    <span className={cluster.winRate > overallWinRate ? 'text-trading-profit' : 'text-trading-loss'}>
                      {cluster.winRate > overallWinRate ? '+' : ''}{(cluster.winRate - overallWinRate).toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={cluster.winRate} 
                    className="h-1.5"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Pattern Insights
          </h4>
          <div className="grid gap-2 md:grid-cols-2">
            {profitableClusters.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-trading-profit mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-trading-profit font-medium">Best pattern: </span>
                  "{profitableClusters[0].label}" with {profitableClusters[0].winRate.toFixed(0)}% win rate and ${profitableClusters[0].avgPnl.toFixed(0)} avg P&L. 
                  {' '}Characteristics: {profitableClusters[0].characteristics.slice(0, 2).join(', ')}.
                </p>
              </div>
            )}
            {losingClusters.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-trading-loss mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="text-trading-loss font-medium">Avoid: </span>
                  "{losingClusters[0].label}" trades with {losingClusters[0].winRate.toFixed(0)}% win rate. 
                  {' '}Pattern: {losingClusters[0].characteristics.slice(0, 2).join(', ')}.
                </p>
              </div>
            )}
          </div>
          {profitableClusters.length > 0 && (
            <p className="text-xs text-muted-foreground border-t border-border/30 pt-2">
              💡 <strong>Recommendation:</strong> Focus on trades matching the "{profitableClusters[0].label}" profile 
              ({profitableClusters[0].characteristics.slice(0, 2).join(' + ')}) to improve overall performance by 
              up to {((profitableClusters[0].winRate - overallWinRate) * 0.5).toFixed(0)}% win rate.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
