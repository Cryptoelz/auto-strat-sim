import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BacktestResult } from '@/hooks/useBacktest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';
import { Group } from 'lucide-react';

interface ClusterAnalysis {
  clusters: { start: number; end: number; type: 'win' | 'loss'; trades: number; pnl: number }[];
  winClusterCount: number;
  lossClusterCount: number;
  avgWinClusterSize: number;
  avgLossClusterSize: number;
  maxWinCluster: number;
  maxLossCluster: number;
  clusteringScore: number;
  timeline: { index: number; type: 'win' | 'loss'; pnl: number; clusterStart: boolean }[];
}

function analyzeTradeClusteringData(trades: BacktestResult['trades']): ClusterAnalysis {
  if (trades.length === 0) {
    return {
      clusters: [],
      winClusterCount: 0,
      lossClusterCount: 0,
      avgWinClusterSize: 0,
      avgLossClusterSize: 0,
      maxWinCluster: 0,
      maxLossCluster: 0,
      clusteringScore: 0,
      timeline: []
    };
  }

  const sortedTrades = [...trades].sort((a, b) => a.exitTime - b.exitTime);
  const clusters: ClusterAnalysis['clusters'] = [];
  const timeline: ClusterAnalysis['timeline'] = [];
  
  let currentCluster = {
    start: 0,
    end: 0,
    type: sortedTrades[0].type,
    trades: 1,
    pnl: sortedTrades[0].pnl
  };

  timeline.push({
    index: 0,
    type: sortedTrades[0].type,
    pnl: sortedTrades[0].pnl,
    clusterStart: true
  });

  for (let i = 1; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i];
    const isClusterStart = trade.type !== currentCluster.type;
    
    timeline.push({
      index: i,
      type: trade.type,
      pnl: trade.pnl,
      clusterStart: isClusterStart
    });

    if (isClusterStart) {
      clusters.push({ ...currentCluster });
      currentCluster = {
        start: i,
        end: i,
        type: trade.type,
        trades: 1,
        pnl: trade.pnl
      };
    } else {
      currentCluster.end = i;
      currentCluster.trades++;
      currentCluster.pnl += trade.pnl;
    }
  }
  clusters.push({ ...currentCluster });

  const winClusters = clusters.filter(c => c.type === 'win');
  const lossClusters = clusters.filter(c => c.type === 'loss');

  const avgWinClusterSize = winClusters.length > 0 
    ? winClusters.reduce((sum, c) => sum + c.trades, 0) / winClusters.length 
    : 0;
  const avgLossClusterSize = lossClusters.length > 0 
    ? lossClusters.reduce((sum, c) => sum + c.trades, 0) / lossClusters.length 
    : 0;
  const maxWinCluster = winClusters.length > 0 
    ? Math.max(...winClusters.map(c => c.trades)) 
    : 0;
  const maxLossCluster = lossClusters.length > 0 
    ? Math.max(...lossClusters.map(c => c.trades)) 
    : 0;

  // Calculate clustering score (runs test approximation)
  const expectedRuns = (2 * trades.filter(t => t.type === 'win').length * trades.filter(t => t.type === 'loss').length) / trades.length + 1;
  const actualRuns = clusters.length;
  const clusteringScore = expectedRuns > 0 
    ? Math.max(0, Math.min(100, (1 - actualRuns / expectedRuns) * 100 + 50)) 
    : 50;

  return {
    clusters,
    winClusterCount: winClusters.length,
    lossClusterCount: lossClusters.length,
    avgWinClusterSize,
    avgLossClusterSize,
    maxWinCluster,
    maxLossCluster,
    clusteringScore,
    timeline
  };
}

interface TradeClusteringCardProps {
  trades: BacktestResult['trades'];
}

export function TradeClusteringCard({ trades }: TradeClusteringCardProps) {
  const analysis = analyzeTradeClusteringData(trades);

  if (trades.length < 5) return null;

  const clusteringLevel = analysis.clusteringScore >= 65 ? 'high' : analysis.clusteringScore >= 45 ? 'moderate' : 'low';

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Group className="h-4 w-4 text-violet-500" />
          Trade Clustering Analysis
          <Badge 
            variant="outline" 
            className={cn(
              "ml-auto text-xs",
              clusteringLevel === 'high' ? "border-violet-500/50 bg-violet-500/10 text-violet-500" :
              clusteringLevel === 'moderate' ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-500" :
              "border-muted-foreground/50 bg-secondary text-muted-foreground"
            )}
          >
            {clusteringLevel} clustering
          </Badge>
        </CardTitle>
        <CardDescription>Identifies patterns of consecutive wins or losses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="p-2 rounded-lg bg-trading-profit/10 border border-trading-profit/20 text-center">
              <p className="text-xs text-muted-foreground">Win Clusters</p>
              <p className="text-lg font-bold text-trading-profit">{analysis.winClusterCount}</p>
              <p className="text-[10px] text-muted-foreground">avg {analysis.avgWinClusterSize.toFixed(1)} trades</p>
            </div>
            <div className="p-2 rounded-lg bg-trading-loss/10 border border-trading-loss/20 text-center">
              <p className="text-xs text-muted-foreground">Loss Clusters</p>
              <p className="text-lg font-bold text-trading-loss">{analysis.lossClusterCount}</p>
              <p className="text-[10px] text-muted-foreground">avg {analysis.avgLossClusterSize.toFixed(1)} trades</p>
            </div>
            <div className="p-2 rounded-lg bg-trading-profit/10 border border-trading-profit/20 text-center">
              <p className="text-xs text-muted-foreground">Longest Win Run</p>
              <p className="text-lg font-bold text-trading-profit">{analysis.maxWinCluster}</p>
              <p className="text-[10px] text-muted-foreground">consecutive</p>
            </div>
            <div className="p-2 rounded-lg bg-trading-loss/10 border border-trading-loss/20 text-center">
              <p className="text-xs text-muted-foreground">Longest Loss Run</p>
              <p className="text-lg font-bold text-trading-loss">{analysis.maxLossCluster}</p>
              <p className="text-[10px] text-muted-foreground">consecutive</p>
            </div>
          </div>

          {/* Timeline Visualization */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trade Sequence (oldest → newest)</Label>
            <div className="flex flex-wrap gap-0.5">
              {analysis.timeline.map((t, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-4 rounded-sm transition-all cursor-default",
                    t.type === 'win' ? "bg-trading-profit/70 hover:bg-trading-profit" : "bg-trading-loss/70 hover:bg-trading-loss",
                    t.clusterStart && i > 0 && "ml-1"
                  )}
                  style={{ width: `${Math.max(8, 100 / Math.min(analysis.timeline.length, 50))}px` }}
                  title={`Trade ${i + 1}: ${t.type === 'win' ? '+' : ''}${formatCurrency(t.pnl)}${t.clusterStart && i > 0 ? ' (new cluster)' : ''}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>First trade</span>
              <span>Last trade</span>
            </div>
          </div>

          {/* Cluster Details */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Cluster Breakdown</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
              {analysis.clusters
                .sort((a, b) => b.trades - a.trades)
                .slice(0, 8)
                .map((cluster, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-2 rounded-lg border text-xs",
                      cluster.type === 'win' 
                        ? "border-trading-profit/30 bg-trading-profit/5" 
                        : "border-trading-loss/30 bg-trading-loss/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]",
                          cluster.type === 'win' 
                            ? "border-trading-profit/50 text-trading-profit" 
                            : "border-trading-loss/50 text-trading-loss"
                        )}
                      >
                        {cluster.trades} {cluster.type}s
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        cluster.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {cluster.pnl >= 0 ? '+' : ''}{formatCurrency(cluster.pnl)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Clustering Insight */}
          <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
            {clusteringLevel === 'high' ? (
              <p>
                <strong className="text-violet-500">High clustering detected:</strong> Wins and losses tend to occur in streaks. 
                This could indicate momentum-based market conditions or strategy sensitivity to market regimes. 
                Consider position sizing adjustments during losing streaks.
              </p>
            ) : clusteringLevel === 'moderate' ? (
              <p>
                <strong className="text-yellow-500">Moderate clustering:</strong> Some grouping of wins and losses is present, 
                which is normal for trend-following strategies. Monitor streak patterns for risk management.
              </p>
            ) : (
              <p>
                <strong className="text-foreground">Low clustering:</strong> Trade outcomes appear relatively random with minimal 
                consecutive patterns. This suggests consistent strategy performance across different market conditions.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
