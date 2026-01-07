import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Flame, Snowflake, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/hooks/useBacktest';

interface StreakProbabilityCardProps {
  trades: BacktestTrade[];
}

interface StreakData {
  length: number;
  type: 'win' | 'loss';
  probability: number;
  observed: number;
  expected: number;
}

interface StreakStats {
  winRate: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgWinStreak: number;
  avgLossStreak: number;
  currentStreak: { type: 'win' | 'loss'; length: number };
  streakDistribution: StreakData[];
  allStreaks: { type: 'win' | 'loss'; length: number; startIndex: number }[];
}

export function StreakProbabilityCard({ trades }: StreakProbabilityCardProps) {
  const stats = useMemo((): StreakStats | null => {
    if (trades.length < 5) return null;

    const winRate = trades.filter(t => t.type === 'win').length / trades.length;
    const lossRate = 1 - winRate;

    // Find all streaks
    const allStreaks: { type: 'win' | 'loss'; length: number; startIndex: number }[] = [];
    let currentStreakType: 'win' | 'loss' | null = null;
    let currentStreakLength = 0;
    let streakStartIndex = 0;

    trades.forEach((trade, index) => {
      if (trade.type === currentStreakType) {
        currentStreakLength++;
      } else {
        if (currentStreakType !== null) {
          allStreaks.push({ 
            type: currentStreakType, 
            length: currentStreakLength,
            startIndex: streakStartIndex
          });
        }
        currentStreakType = trade.type;
        currentStreakLength = 1;
        streakStartIndex = index;
      }
    });

    // Don't forget the last streak
    if (currentStreakType !== null) {
      allStreaks.push({ 
        type: currentStreakType, 
        length: currentStreakLength,
        startIndex: streakStartIndex
      });
    }

    const winStreaks = allStreaks.filter(s => s.type === 'win');
    const lossStreaks = allStreaks.filter(s => s.type === 'loss');

    const maxWinStreak = winStreaks.length > 0 ? Math.max(...winStreaks.map(s => s.length)) : 0;
    const maxLossStreak = lossStreaks.length > 0 ? Math.max(...lossStreaks.map(s => s.length)) : 0;

    const avgWinStreak = winStreaks.length > 0
      ? winStreaks.reduce((sum, s) => sum + s.length, 0) / winStreaks.length
      : 0;
    const avgLossStreak = lossStreaks.length > 0
      ? lossStreaks.reduce((sum, s) => sum + s.length, 0) / lossStreaks.length
      : 0;

    // Current streak (last streak)
    const currentStreak = allStreaks[allStreaks.length - 1] || { type: 'win', length: 0 };

    // Calculate streak distribution and probabilities
    const maxStreak = Math.max(maxWinStreak, maxLossStreak, 5);
    const streakDistribution: StreakData[] = [];

    for (let len = 1; len <= maxStreak; len++) {
      // Win streaks
      const observedWin = winStreaks.filter(s => s.length === len).length;
      const probWin = Math.pow(winRate, len) * (1 - winRate); // Probability of exactly this length
      const expectedWin = probWin * (trades.length - len);

      streakDistribution.push({
        length: len,
        type: 'win',
        probability: probWin * 100,
        observed: observedWin,
        expected: Math.max(0, expectedWin),
      });

      // Loss streaks
      const observedLoss = lossStreaks.filter(s => s.length === len).length;
      const probLoss = Math.pow(lossRate, len) * (1 - lossRate);
      const expectedLoss = probLoss * (trades.length - len);

      streakDistribution.push({
        length: len,
        type: 'loss',
        probability: probLoss * 100,
        observed: observedLoss,
        expected: Math.max(0, expectedLoss),
      });
    }

    return {
      winRate: winRate * 100,
      maxWinStreak,
      maxLossStreak,
      avgWinStreak,
      avgLossStreak,
      currentStreak: { type: currentStreak.type, length: currentStreak.length },
      streakDistribution,
      allStreaks,
    };
  }, [trades]);

  if (!stats) return null;

  // Prepare chart data
  const chartData = [];
  const maxLen = Math.max(stats.maxWinStreak, stats.maxLossStreak);
  
  for (let len = 1; len <= maxLen; len++) {
    const winData = stats.streakDistribution.find(d => d.type === 'win' && d.length === len);
    const lossData = stats.streakDistribution.find(d => d.type === 'loss' && d.length === len);
    
    chartData.push({
      length: len,
      wins: winData?.observed || 0,
      losses: lossData?.observed || 0,
      winProb: winData?.probability || 0,
      lossProb: lossData?.probability || 0,
    });
  }

  const chartConfig = {
    wins: { label: 'Win Streaks', color: 'hsl(142, 76%, 36%)' },
    losses: { label: 'Loss Streaks', color: 'hsl(0, 84%, 60%)' },
  };

  // Calculate probability of current streak continuing
  const streakContinueProbability = stats.currentStreak.type === 'win'
    ? stats.winRate
    : (100 - stats.winRate);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5" />
          Streak Probability Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Streak */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {stats.currentStreak.type === 'win' ? (
                <div className="p-2 rounded-full bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-red-500/20">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className={`text-xl font-bold ${stats.currentStreak.type === 'win' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.currentStreak.length} {stats.currentStreak.type === 'win' ? 'Wins' : 'Losses'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Continue Probability</p>
              <p className="text-lg font-semibold">{streakContinueProbability.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Streak Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-green-500" />
              <p className="text-muted-foreground">Max Win Streak</p>
            </div>
            <p className="font-semibold text-green-500">{stats.maxWinStreak}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Snowflake className="h-3 w-3 text-red-500" />
              <p className="text-muted-foreground">Max Loss Streak</p>
            </div>
            <p className="font-semibold text-red-500">{stats.maxLossStreak}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Win Streak</p>
            <p className="font-semibold">{stats.avgWinStreak.toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Loss Streak</p>
            <p className="font-semibold">{stats.avgLossStreak.toFixed(1)}</p>
          </div>
        </div>

        {/* Streak Distribution Chart */}
        <div className="h-[200px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  dataKey="length" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}`}
                  label={{ value: 'Streak Length', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  allowDecimals={false}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">Streak of {data.length}</p>
                            <p className="text-green-500">{data.wins} win streak{data.wins !== 1 ? 's' : ''} ({data.winProb.toFixed(1)}% prob)</p>
                            <p className="text-red-500">{data.losses} loss streak{data.losses !== 1 ? 's' : ''} ({data.lossProb.toFixed(1)}% prob)</p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="wins" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Legend */}
        <div className="flex gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Win Streaks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Loss Streaks</span>
          </div>
        </div>

        {/* Probability Table */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Streak Probabilities (based on {stats.winRate.toFixed(1)}% win rate)</p>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="font-medium">Length</div>
            <div className="font-medium text-green-500">Win Prob</div>
            <div className="font-medium text-green-500">Observed</div>
            <div className="font-medium text-red-500">Loss Prob</div>
            <div className="font-medium text-red-500">Observed</div>
            {[1, 2, 3, 4, 5].map(len => {
              const winData = stats.streakDistribution.find(d => d.type === 'win' && d.length === len);
              const lossData = stats.streakDistribution.find(d => d.type === 'loss' && d.length === len);
              return (
                <>
                  <div key={`len-${len}`}>{len}+</div>
                  <div key={`win-prob-${len}`}>{(Math.pow(stats.winRate / 100, len) * 100).toFixed(1)}%</div>
                  <div key={`win-obs-${len}`}>{stats.allStreaks.filter(s => s.type === 'win' && s.length >= len).length}</div>
                  <div key={`loss-prob-${len}`}>{(Math.pow((100 - stats.winRate) / 100, len) * 100).toFixed(1)}%</div>
                  <div key={`loss-obs-${len}`}>{stats.allStreaks.filter(s => s.type === 'loss' && s.length >= len).length}</div>
                </>
              );
            })}
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Analysis</p>
          {stats.maxLossStreak >= 5 ? (
            <p>⚠️ Experienced a {stats.maxLossStreak}-trade losing streak. Ensure position sizing can withstand extended drawdowns. With a {stats.winRate.toFixed(0)}% win rate, a {stats.maxLossStreak}+ streak has ~{(Math.pow((100 - stats.winRate) / 100, stats.maxLossStreak) * 100).toFixed(1)}% probability.</p>
          ) : stats.maxWinStreak >= 5 ? (
            <p>Strong {stats.maxWinStreak}-trade winning streak observed! This suggests momentum in favorable conditions. Be cautious of overconfidence after such runs.</p>
          ) : (
            <p>Streak patterns appear normal for your win rate. No extreme sequences detected that would suggest strategy issues or exceptional performance.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
