import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { BacktestResult } from '@/hooks/useBacktest';
import { cn } from '@/lib/utils';
import { Flame, Zap, TrendingDown } from 'lucide-react';

interface StreakAnalysis {
  maxWinStreak: number;
  maxLossStreak: number;
  currentStreak: { type: 'win' | 'loss'; count: number } | null;
  avgWinStreak: number;
  avgLossStreak: number;
  streakDistribution: { streak: number; type: 'win' | 'loss'; count: number }[];
}

function analyzeStreaks(trades: BacktestResult['trades']): StreakAnalysis {
  if (trades.length === 0) {
    return {
      maxWinStreak: 0,
      maxLossStreak: 0,
      currentStreak: null,
      avgWinStreak: 0,
      avgLossStreak: 0,
      streakDistribution: []
    };
  }

  const streaks: { type: 'win' | 'loss'; length: number }[] = [];
  let currentType = trades[0].type;
  let currentLength = 1;

  for (let i = 1; i < trades.length; i++) {
    if (trades[i].type === currentType) {
      currentLength++;
    } else {
      streaks.push({ type: currentType, length: currentLength });
      currentType = trades[i].type;
      currentLength = 1;
    }
  }
  streaks.push({ type: currentType, length: currentLength });

  const winStreaks = streaks.filter(s => s.type === 'win').map(s => s.length);
  const lossStreaks = streaks.filter(s => s.type === 'loss').map(s => s.length);

  const maxWinStreak = winStreaks.length > 0 ? Math.max(...winStreaks) : 0;
  const maxLossStreak = lossStreaks.length > 0 ? Math.max(...lossStreaks) : 0;
  const avgWinStreak = winStreaks.length > 0 ? winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length : 0;
  const avgLossStreak = lossStreaks.length > 0 ? lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length : 0;

  // Distribution of streak lengths
  const distribution: Record<string, number> = {};
  streaks.forEach(s => {
    const key = `${s.type}-${s.length}`;
    distribution[key] = (distribution[key] || 0) + 1;
  });

  const streakDistribution = Object.entries(distribution)
    .map(([key, count]) => {
      const [type, streak] = key.split('-');
      return { type: type as 'win' | 'loss', streak: parseInt(streak), count };
    })
    .sort((a, b) => b.streak - a.streak);

  const lastStreak = streaks[streaks.length - 1];

  return {
    maxWinStreak,
    maxLossStreak,
    currentStreak: lastStreak ? { type: lastStreak.type, count: lastStreak.length } : null,
    avgWinStreak,
    avgLossStreak,
    streakDistribution
  };
}

interface StreakAnalysisCardProps {
  trades: BacktestResult['trades'];
}

export function StreakAnalysisCard({ trades }: StreakAnalysisCardProps) {
  const analysis = analyzeStreaks(trades);

  if (trades.length === 0) return null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Win/Loss Streak Analysis
        </CardTitle>
        <CardDescription>Consecutive trade patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Streak Stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-trading-profit" />
                <span className="text-sm text-muted-foreground">Max Win Streak</span>
              </div>
              <span className="text-lg font-bold text-trading-profit">{analysis.maxWinStreak}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-trading-loss/10 border border-trading-loss/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-trading-loss" />
                <span className="text-sm text-muted-foreground">Max Loss Streak</span>
              </div>
              <span className="text-lg font-bold text-trading-loss">{analysis.maxLossStreak}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Win Streak</span>
              <span className="font-medium">{analysis.avgWinStreak.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avg Loss Streak</span>
              <span className="font-medium">{analysis.avgLossStreak.toFixed(1)}</span>
            </div>
            {analysis.currentStreak && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Streak</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      analysis.currentStreak.type === 'win' 
                        ? "border-trading-profit/50 bg-trading-profit/10 text-trading-profit"
                        : "border-trading-loss/50 bg-trading-loss/10 text-trading-loss"
                    )}
                  >
                    {analysis.currentStreak.count} {analysis.currentStreak.type === 'win' ? 'wins' : 'losses'}
                  </Badge>
                </div>
              </>
            )}
          </div>

          {/* Streak Distribution */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Streak Distribution</Label>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {analysis.streakDistribution.map((item, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between text-xs p-1.5 rounded bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] px-1.5",
                        item.type === 'win' 
                          ? "border-trading-profit/50 bg-trading-profit/10 text-trading-profit"
                          : "border-trading-loss/50 bg-trading-loss/10 text-trading-loss"
                      )}
                    >
                      {item.type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {item.streak} in a row
                    </span>
                  </div>
                  <span className="font-medium">{item.count}×</span>
                </div>
              ))}
              {analysis.streakDistribution.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Not enough data
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
