import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BacktestResult } from '@/types/backtest';
import { Clock, Trophy, TrendingDown } from 'lucide-react';

interface DurationAnalysis {
  avgWinDuration: number;
  avgLossDuration: number;
  avgOverallDuration: number;
  minDuration: number;
  maxDuration: number;
  winDurations: number[];
  lossDurations: number[];
  durationBuckets: { label: string; wins: number; losses: number }[];
}

function formatDuration(ms: number): string {
  const minutes = ms / (1000 * 60);
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

function analyzeTradeDurations(trades: BacktestResult['trades']): DurationAnalysis {
  const winDurations = trades.filter(t => t.type === 'win').map(t => t.exitTime - t.entryTime);
  const lossDurations = trades.filter(t => t.type === 'loss').map(t => t.exitTime - t.entryTime);
  const allDurations = trades.map(t => t.exitTime - t.entryTime);

  const avgWinDuration = winDurations.length > 0 
    ? winDurations.reduce((a, b) => a + b, 0) / winDurations.length 
    : 0;
  const avgLossDuration = lossDurations.length > 0 
    ? lossDurations.reduce((a, b) => a + b, 0) / lossDurations.length 
    : 0;
  const avgOverallDuration = allDurations.length > 0 
    ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length 
    : 0;

  const minDuration = allDurations.length > 0 ? Math.min(...allDurations) : 0;
  const maxDuration = allDurations.length > 0 ? Math.max(...allDurations) : 0;

  // Create duration buckets
  const bucketLabels = ['<1h', '1-4h', '4-12h', '12-24h', '1-3d', '>3d'];
  const bucketThresholds = [
    1000 * 60 * 60,           // 1h
    1000 * 60 * 60 * 4,       // 4h
    1000 * 60 * 60 * 12,      // 12h
    1000 * 60 * 60 * 24,      // 24h
    1000 * 60 * 60 * 24 * 3,  // 3d
    Infinity
  ];

  const durationBuckets = bucketLabels.map((label, i) => {
    const lowerBound = i === 0 ? 0 : bucketThresholds[i - 1];
    const upperBound = bucketThresholds[i];
    
    const wins = winDurations.filter(d => d >= lowerBound && d < upperBound).length;
    const losses = lossDurations.filter(d => d >= lowerBound && d < upperBound).length;
    
    return { label, wins, losses };
  });

  return {
    avgWinDuration,
    avgLossDuration,
    avgOverallDuration,
    minDuration,
    maxDuration,
    winDurations,
    lossDurations,
    durationBuckets
  };
}

interface TradeDurationCardProps {
  trades: BacktestResult['trades'];
}

export function TradeDurationCard({ trades }: TradeDurationCardProps) {
  const analysis = analyzeTradeDurations(trades);

  if (trades.length === 0) return null;

  const maxBucketTotal = Math.max(...analysis.durationBuckets.map(b => b.wins + b.losses), 1);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-500" />
          Trade Duration Analysis
        </CardTitle>
        <CardDescription>How long trades are held before exit</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Duration Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-trading-profit" />
                <span className="text-sm text-muted-foreground">Avg Win Duration</span>
              </div>
              <span className="text-lg font-bold text-trading-profit">
                {formatDuration(analysis.avgWinDuration)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-trading-loss/10 border border-trading-loss/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-trading-loss" />
                <span className="text-sm text-muted-foreground">Avg Loss Duration</span>
              </div>
              <span className="text-lg font-bold text-trading-loss">
                {formatDuration(analysis.avgLossDuration)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Average</span>
              <span className="font-medium">{formatDuration(analysis.avgOverallDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shortest Trade</span>
              <span className="font-medium">{formatDuration(analysis.minDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Longest Trade</span>
              <span className="font-medium">{formatDuration(analysis.maxDuration)}</span>
            </div>
            {analysis.avgWinDuration > 0 && analysis.avgLossDuration > 0 && (
              <>
                <Separator />
                <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-2">
                  {analysis.avgWinDuration > analysis.avgLossDuration ? (
                    <p>Winners are held <strong className="text-trading-profit">
                      {((analysis.avgWinDuration / analysis.avgLossDuration - 1) * 100).toFixed(0)}% longer
                    </strong> than losers on average.</p>
                  ) : (
                    <p>Losers are held <strong className="text-trading-loss">
                      {((analysis.avgLossDuration / analysis.avgWinDuration - 1) * 100).toFixed(0)}% longer
                    </strong> than winners on average.</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Duration Distribution */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Duration Distribution</Label>
            <div className="space-y-1.5">
              {analysis.durationBuckets.map((bucket, i) => {
                const total = bucket.wins + bucket.losses;
                if (total === 0 && i > 2) return null; // Skip empty high buckets
                
                const winWidth = (bucket.wins / maxBucketTotal) * 100;
                const lossWidth = (bucket.losses / maxBucketTotal) * 100;
                
                return (
                  <div key={bucket.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12 text-right">{bucket.label}</span>
                    <div className="flex-1 h-5 bg-secondary/30 rounded overflow-hidden flex">
                      <div 
                        className="h-full bg-trading-profit/70 transition-all"
                        style={{ width: `${winWidth}%` }}
                        title={`${bucket.wins} wins`}
                      />
                      <div 
                        className="h-full bg-trading-loss/70 transition-all"
                        style={{ width: `${lossWidth}%` }}
                        title={`${bucket.losses} losses`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{total}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-trading-profit/70" />
                <span>Wins ({analysis.winDurations.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-trading-loss/70" />
                <span>Losses ({analysis.lossDurations.length})</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
