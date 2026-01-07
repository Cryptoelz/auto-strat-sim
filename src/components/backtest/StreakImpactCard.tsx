import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { BacktestTrade } from '@/hooks/useBacktest';
import { formatCurrency } from '@/lib/performance';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface StreakImpactCardProps {
  trades: BacktestTrade[];
  initialBalance: number;
}

interface StreakEvent {
  type: 'win' | 'loss';
  length: number;
  startIndex: number;
  endIndex: number;
  totalPnl: number;
  pnlPercent: number;
  balanceBeforeStreak: number;
  balanceAfterStreak: number;
}

interface StreakImpactStats {
  streaks: StreakEvent[];
  maxWinStreak: StreakEvent | null;
  maxLossStreak: StreakEvent | null;
  avgWinStreakImpact: number;
  avgLossStreakImpact: number;
  worstConsecutiveLossPct: number;
  bestConsecutiveWinPct: number;
  lossStreakRecoveryTrades: number;
  portfolioVolatilityFromStreaks: number;
}

export function StreakImpactCard({ trades, initialBalance }: StreakImpactCardProps) {
  const stats = useMemo<StreakImpactStats | null>(() => {
    if (trades.length < 5) return null;

    // Calculate running balance and identify streaks
    const streaks: StreakEvent[] = [];
    let runningBalance = initialBalance;
    let currentStreakType: 'win' | 'loss' | null = null;
    let currentStreakStart = 0;
    let currentStreakPnl = 0;
    let balanceBeforeStreak = initialBalance;

    trades.forEach((trade, index) => {
      const isWin = trade.pnl > 0;
      const tradeType = isWin ? 'win' : 'loss';

      if (tradeType !== currentStreakType) {
        // End previous streak if exists
        if (currentStreakType !== null && index > currentStreakStart) {
          const streakLength = index - currentStreakStart;
          if (streakLength >= 2) {
            streaks.push({
              type: currentStreakType,
              length: streakLength,
              startIndex: currentStreakStart,
              endIndex: index - 1,
              totalPnl: currentStreakPnl,
              pnlPercent: (currentStreakPnl / balanceBeforeStreak) * 100,
              balanceBeforeStreak,
              balanceAfterStreak: runningBalance,
            });
          }
        }
        // Start new streak
        currentStreakType = tradeType;
        currentStreakStart = index;
        currentStreakPnl = trade.pnl;
        balanceBeforeStreak = runningBalance;
      } else {
        currentStreakPnl += trade.pnl;
      }

      runningBalance += trade.pnl;
    });

    // Don't forget the last streak
    if (currentStreakType !== null && trades.length > currentStreakStart) {
      const streakLength = trades.length - currentStreakStart;
      if (streakLength >= 2) {
        streaks.push({
          type: currentStreakType,
          length: streakLength,
          startIndex: currentStreakStart,
          endIndex: trades.length - 1,
          totalPnl: currentStreakPnl,
          pnlPercent: (currentStreakPnl / balanceBeforeStreak) * 100,
          balanceBeforeStreak,
          balanceAfterStreak: runningBalance,
        });
      }
    }

    if (streaks.length === 0) return null;

    const winStreaks = streaks.filter(s => s.type === 'win');
    const lossStreaks = streaks.filter(s => s.type === 'loss');

    const maxWinStreak = winStreaks.length > 0
      ? winStreaks.reduce((a, b) => a.length > b.length ? a : b)
      : null;

    const maxLossStreak = lossStreaks.length > 0
      ? lossStreaks.reduce((a, b) => a.length > b.length ? a : b)
      : null;

    const avgWinStreakImpact = winStreaks.length > 0
      ? winStreaks.reduce((sum, s) => sum + s.pnlPercent, 0) / winStreaks.length
      : 0;

    const avgLossStreakImpact = lossStreaks.length > 0
      ? lossStreaks.reduce((sum, s) => sum + s.pnlPercent, 0) / lossStreaks.length
      : 0;

    const worstConsecutiveLossPct = lossStreaks.length > 0
      ? Math.min(...lossStreaks.map(s => s.pnlPercent))
      : 0;

    const bestConsecutiveWinPct = winStreaks.length > 0
      ? Math.max(...winStreaks.map(s => s.pnlPercent))
      : 0;

    // Calculate average trades to recover from loss streaks
    let totalRecoveryTrades = 0;
    let recoveryCount = 0;
    lossStreaks.forEach(lossStreak => {
      const lossAmount = Math.abs(lossStreak.totalPnl);
      let recovered = 0;
      let tradesNeeded = 0;
      for (let i = lossStreak.endIndex + 1; i < trades.length && recovered < lossAmount; i++) {
        if (trades[i].pnl > 0) {
          recovered += trades[i].pnl;
        }
        tradesNeeded++;
      }
      if (recovered >= lossAmount) {
        totalRecoveryTrades += tradesNeeded;
        recoveryCount++;
      }
    });

    const lossStreakRecoveryTrades = recoveryCount > 0
      ? totalRecoveryTrades / recoveryCount
      : 0;

    // Portfolio volatility from streaks (standard deviation of streak impacts)
    const allImpacts = streaks.map(s => s.pnlPercent);
    const meanImpact = allImpacts.reduce((a, b) => a + b, 0) / allImpacts.length;
    const variance = allImpacts.reduce((sum, impact) => sum + Math.pow(impact - meanImpact, 2), 0) / allImpacts.length;
    const portfolioVolatilityFromStreaks = Math.sqrt(variance);

    return {
      streaks,
      maxWinStreak,
      maxLossStreak,
      avgWinStreakImpact,
      avgLossStreakImpact,
      worstConsecutiveLossPct,
      bestConsecutiveWinPct,
      lossStreakRecoveryTrades,
      portfolioVolatilityFromStreaks,
    };
  }, [trades, initialBalance]);

  if (!stats) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center text-muted-foreground">
          Not enough trade data for streak impact analysis (minimum 5 trades with consecutive sequences required)
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data for streak timeline
  const timelineData = stats.streaks.map((streak, index) => ({
    index: index + 1,
    impact: streak.pnlPercent,
    type: streak.type,
    length: streak.length,
    pnl: streak.totalPnl,
  }));

  // Prepare data for cumulative impact visualization
  let cumulativeBalance = initialBalance;
  const cumulativeData = trades.map((trade, index) => {
    cumulativeBalance += trade.pnl;
    const isInStreak = stats.streaks.some(
      s => index >= s.startIndex && index <= s.endIndex
    );
    const streakType = stats.streaks.find(
      s => index >= s.startIndex && index <= s.endIndex
    )?.type;
    return {
      trade: index + 1,
      balance: cumulativeBalance,
      isInStreak,
      streakType,
    };
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Consecutive Win/Loss Impact Analysis
            </CardTitle>
            <CardDescription>How streaks affect your portfolio</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.streaks.length} Streaks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-trading-profit/10 rounded-lg border border-trading-profit/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3 w-3 text-trading-profit" />
              <span className="text-xs text-muted-foreground">Best Win Streak</span>
            </div>
            <p className="text-lg font-bold text-trading-profit">
              +{stats.bestConsecutiveWinPct.toFixed(2)}%
            </p>
            {stats.maxWinStreak && (
              <p className="text-xs text-muted-foreground">
                {stats.maxWinStreak.length} consecutive wins
              </p>
            )}
          </div>
          <div className="text-center p-3 bg-trading-loss/10 rounded-lg border border-trading-loss/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-3 w-3 text-trading-loss" />
              <span className="text-xs text-muted-foreground">Worst Loss Streak</span>
            </div>
            <p className="text-lg font-bold text-trading-loss">
              {stats.worstConsecutiveLossPct.toFixed(2)}%
            </p>
            {stats.maxLossStreak && (
              <p className="text-xs text-muted-foreground">
                {stats.maxLossStreak.length} consecutive losses
              </p>
            )}
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Recovery</span>
            </div>
            <p className="text-lg font-bold">
              {stats.lossStreakRecoveryTrades > 0 
                ? `${stats.lossStreakRecoveryTrades.toFixed(1)} trades`
                : 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">to recover losses</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Streak Volatility</span>
            </div>
            <p className="text-lg font-bold">
              {stats.portfolioVolatilityFromStreaks.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">impact std dev</p>
          </div>
        </div>

        {/* Streak Impact Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Streak Impact Timeline</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="index"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Streak #', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value.toFixed(2)}% (${formatCurrency(props.payload.pnl)})`,
                    `${props.payload.length} ${props.payload.type === 'win' ? 'wins' : 'losses'}`
                  ]}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
                <Bar dataKey="impact" radius={[4, 4, 0, 0]}>
                  {timelineData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'win' ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio During Streaks */}
        <div>
          <h4 className="text-sm font-medium mb-3">Portfolio Balance with Streak Highlights</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="streakBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="trade"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  label={{ value: 'Trade #', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    formatCurrency(value),
                    props.payload.isInStreak 
                      ? `In ${props.payload.streakType} streak`
                      : 'Balance'
                  ]}
                />
                <ReferenceLine 
                  y={initialBalance} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#streakBalanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Streak Details Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Significant Streaks</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {stats.streaks
              .sort((a, b) => Math.abs(b.pnlPercent) - Math.abs(a.pnlPercent))
              .slice(0, 6)
              .map((streak, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    streak.type === 'win' 
                      ? 'border-trading-profit/20 bg-trading-profit/5' 
                      : 'border-trading-loss/20 bg-trading-loss/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {streak.type === 'win' ? (
                        <TrendingUp className="h-4 w-4 text-trading-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-trading-loss" />
                      )}
                      <span className="text-sm font-medium">
                        {streak.length} consecutive {streak.type === 'win' ? 'wins' : 'losses'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${
                        streak.type === 'win' ? 'text-trading-profit' : 'text-trading-loss'
                      }`}>
                        {streak.pnlPercent >= 0 ? '+' : ''}{streak.pnlPercent.toFixed(2)}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatCurrency(streak.totalPnl)})
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Trades {streak.startIndex + 1} - {streak.endIndex + 1} • 
                    Balance: {formatCurrency(streak.balanceBeforeStreak)} → {formatCurrency(streak.balanceAfterStreak)}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong>Analysis:</strong> {' '}
            {Math.abs(stats.avgLossStreakImpact) > stats.avgWinStreakImpact
              ? 'Loss streaks have a larger average impact than win streaks, suggesting the need for better risk management during drawdowns.'
              : 'Win streaks outpace loss streaks in average impact, indicating good momentum capture.'}{' '}
            {stats.lossStreakRecoveryTrades > 5
              ? `Recovery from loss streaks takes an average of ${stats.lossStreakRecoveryTrades.toFixed(1)} trades, which may indicate position sizing issues.`
              : stats.lossStreakRecoveryTrades > 0
                ? 'Quick recovery from losses shows resilient strategy characteristics.'
                : ''}{' '}
            {stats.portfolioVolatilityFromStreaks > 5
              ? 'High streak volatility suggests emotional or systematic biases may be affecting consistency.'
              : 'Low streak volatility indicates consistent performance patterns.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
