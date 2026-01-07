import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown, Calendar, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface Trade {
  asset: string;
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercent: number;
}

interface TradeTimingCardProps {
  trades: Trade[];
}

interface TimeSlot {
  hour: number;
  label: string;
  trades: number;
  wins: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  score: number;
}

interface DaySlot {
  day: number;
  label: string;
  trades: number;
  wins: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
  score: number;
}

export function TradeTimingCard({ trades }: TradeTimingCardProps) {
  if (trades.length < 5) return null;

  // Analyze by hour of day
  const hourlyStats: Record<number, { trades: Trade[]; wins: number; totalPnl: number }> = {};
  for (let h = 0; h < 24; h++) {
    hourlyStats[h] = { trades: [], wins: 0, totalPnl: 0 };
  }

  trades.forEach(trade => {
    const hour = new Date(trade.entryTime).getUTCHours();
    hourlyStats[hour].trades.push(trade);
    if (trade.pnl > 0) hourlyStats[hour].wins++;
    hourlyStats[hour].totalPnl += trade.pnl;
  });

  const hourlyData: TimeSlot[] = Object.entries(hourlyStats).map(([hour, data]) => {
    const h = parseInt(hour);
    const tradesCount = data.trades.length;
    const winRate = tradesCount > 0 ? (data.wins / tradesCount) * 100 : 0;
    const avgPnl = tradesCount > 0 ? data.totalPnl / tradesCount : 0;
    
    // Score: combination of win rate, avg PnL, and sample size
    const sampleWeight = Math.min(tradesCount / 5, 1); // Full weight at 5+ trades
    const score = tradesCount > 0 ? (winRate * 0.4 + (avgPnl > 0 ? 30 : 0) + sampleWeight * 30) : 0;
    
    return {
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      trades: tradesCount,
      wins: data.wins,
      winRate,
      avgPnl,
      totalPnl: data.totalPnl,
      score,
    };
  });

  // Analyze by day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats: Record<number, { trades: Trade[]; wins: number; totalPnl: number }> = {};
  for (let d = 0; d < 7; d++) {
    dayStats[d] = { trades: [], wins: 0, totalPnl: 0 };
  }

  trades.forEach(trade => {
    const day = new Date(trade.entryTime).getUTCDay();
    dayStats[day].trades.push(trade);
    if (trade.pnl > 0) dayStats[day].wins++;
    dayStats[day].totalPnl += trade.pnl;
  });

  const dailyData: DaySlot[] = Object.entries(dayStats).map(([day, data]) => {
    const d = parseInt(day);
    const tradesCount = data.trades.length;
    const winRate = tradesCount > 0 ? (data.wins / tradesCount) * 100 : 0;
    const avgPnl = tradesCount > 0 ? data.totalPnl / tradesCount : 0;
    const sampleWeight = Math.min(tradesCount / 3, 1);
    const score = tradesCount > 0 ? (winRate * 0.4 + (avgPnl > 0 ? 30 : 0) + sampleWeight * 30) : 0;
    
    return {
      day: d,
      label: dayNames[d].slice(0, 3),
      trades: tradesCount,
      wins: data.wins,
      winRate,
      avgPnl,
      totalPnl: data.totalPnl,
      score,
    };
  });

  // Find best and worst times
  const activeHours = hourlyData.filter(h => h.trades >= 2);
  const bestHour = activeHours.length > 0 
    ? activeHours.reduce((best, curr) => curr.score > best.score ? curr : best)
    : null;
  const worstHour = activeHours.length > 0
    ? activeHours.reduce((worst, curr) => curr.score < worst.score ? curr : worst)
    : null;

  const activeDays = dailyData.filter(d => d.trades >= 2);
  const bestDay = activeDays.length > 0
    ? activeDays.reduce((best, curr) => curr.score > best.score ? curr : best)
    : null;
  const worstDay = activeDays.length > 0
    ? activeDays.reduce((worst, curr) => curr.score < worst.score ? curr : worst)
    : null;

  // Session analysis (crypto trading sessions)
  const sessions = [
    { name: 'Asian', startHour: 0, endHour: 8, color: 'hsl(200, 70%, 50%)' },
    { name: 'European', startHour: 8, endHour: 16, color: 'hsl(142, 76%, 45%)' },
    { name: 'American', startHour: 16, endHour: 24, color: 'hsl(45, 93%, 47%)' },
  ];

  const sessionStats = sessions.map(session => {
    const sessionTrades = trades.filter(trade => {
      const hour = new Date(trade.entryTime).getUTCHours();
      return hour >= session.startHour && hour < session.endHour;
    });
    
    const wins = sessionTrades.filter(t => t.pnl > 0).length;
    const totalPnl = sessionTrades.reduce((sum, t) => sum + t.pnl, 0);
    
    return {
      ...session,
      trades: sessionTrades.length,
      wins,
      winRate: sessionTrades.length > 0 ? (wins / sessionTrades.length) * 100 : 0,
      avgPnl: sessionTrades.length > 0 ? totalPnl / sessionTrades.length : 0,
      totalPnl,
    };
  });

  const bestSession = sessionStats.reduce((best, curr) => 
    curr.trades > 0 && curr.winRate > best.winRate ? curr : best
  );

  // Radar chart data for sessions
  const radarData = sessionStats.map(s => ({
    session: s.name,
    winRate: s.winRate,
    volume: Math.min(100, (s.trades / Math.max(...sessionStats.map(ss => ss.trades))) * 100),
    profitability: s.avgPnl > 0 ? Math.min(100, s.avgPnl * 10) : 0,
  }));

  // Optimal trading windows
  const optimalWindows = hourlyData
    .filter(h => h.trades >= 2 && h.winRate >= 50 && h.avgPnl > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Trade Timing Optimization
            </CardTitle>
            <CardDescription>
              Best entry times based on historical performance
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {trades.length} trades analyzed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Session Summary */}
        <div className="grid grid-cols-3 gap-3">
          {sessionStats.map(session => (
            <div 
              key={session.name}
              className={cn(
                "p-3 rounded-lg border",
                session.name === bestSession.name && session.trades > 0
                  ? "bg-trading-profit/10 border-trading-profit/30"
                  : "bg-secondary/50 border-border"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: session.color }}
                />
                <span className="text-sm font-medium">{session.name}</span>
                {session.name === bestSession.name && session.trades > 0 && (
                  <Badge className="ml-auto text-[10px] h-4 bg-trading-profit/20 text-trading-profit border-0">
                    BEST
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trades</span>
                  <span className="font-medium">{session.trades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className={cn(
                    "font-medium",
                    session.winRate >= 50 ? "text-trading-profit" : "text-trading-loss"
                  )}>
                    {session.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg P&L</span>
                  <span className={cn(
                    "font-medium",
                    session.avgPnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                  )}>
                    ${session.avgPnl.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                {session.startHour}:00 - {session.endHour}:00 UTC
              </p>
            </div>
          ))}
        </div>

        {/* Hourly Performance Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Hourly Performance</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  interval={2}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'winRate') return [`${value.toFixed(1)}%`, 'Win Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Hour: ${label} UTC`}
                />
                <Bar dataKey="winRate" name="winRate" radius={[2, 2, 0, 0]}>
                  {hourlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.trades === 0 
                        ? 'hsl(var(--muted))' 
                        : entry.winRate >= 50 
                          ? 'hsl(142, 76%, 45%)' 
                          : 'hsl(0, 84%, 60%)'
                      }
                      fillOpacity={entry.trades === 0 ? 0.2 : 0.7 + (entry.trades / 10) * 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Performance */}
        <div className="grid grid-cols-7 gap-2">
          {dailyData.map(day => (
            <div 
              key={day.day}
              className={cn(
                "p-2 rounded-lg text-center border",
                day.trades === 0 
                  ? "bg-muted/30 border-border/50"
                  : day.winRate >= 50 && day.avgPnl > 0
                    ? "bg-trading-profit/10 border-trading-profit/30"
                    : day.winRate < 50
                      ? "bg-trading-loss/10 border-trading-loss/30"
                      : "bg-secondary border-border"
              )}
            >
              <p className="text-xs font-medium">{day.label}</p>
              <p className={cn(
                "text-lg font-bold",
                day.trades === 0 
                  ? "text-muted-foreground"
                  : day.winRate >= 50 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {day.trades > 0 ? `${day.winRate.toFixed(0)}%` : '-'}
              </p>
              <p className="text-[10px] text-muted-foreground">{day.trades} trades</p>
            </div>
          ))}
        </div>

        {/* Best & Worst Times */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-trading-profit" />
              Best Trading Times
            </h4>
            <div className="space-y-3">
              {bestHour && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{bestHour.label} UTC</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-trading-profit">{bestHour.winRate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground ml-1">({bestHour.trades} trades)</span>
                  </div>
                </div>
              )}
              {bestDay && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{dayNames[bestDay.day]}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-trading-profit">{bestDay.winRate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground ml-1">({bestDay.trades} trades)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-trading-loss/10 border border-trading-loss/20">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-trading-loss" />
              Worst Trading Times
            </h4>
            <div className="space-y-3">
              {worstHour && worstHour.trades > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{worstHour.label} UTC</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-trading-loss">{worstHour.winRate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground ml-1">({worstHour.trades} trades)</span>
                  </div>
                </div>
              )}
              {worstDay && worstDay.trades > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{dayNames[worstDay.day]}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-trading-loss">{worstDay.winRate.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground ml-1">({worstDay.trades} trades)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optimal Windows */}
        {optimalWindows.length > 0 && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Optimal Trading Windows
            </h4>
            <div className="flex flex-wrap gap-2">
              {optimalWindows.map((window, idx) => (
                <Badge 
                  key={window.hour}
                  variant="outline" 
                  className="text-xs bg-primary/5 border-primary/30"
                >
                  #{idx + 1} {window.label} UTC ({window.winRate.toFixed(0)}% WR, ${window.avgPnl.toFixed(2)} avg)
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Windows with 50%+ win rate and positive average P&L
            </p>
          </div>
        )}

        {/* Interpretation */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Trading sessions:</strong> Asian (00:00-08:00 UTC), European (08:00-16:00 UTC), American (16:00-24:00 UTC).
          </p>
          <p>
            Consider focusing your trading during optimal windows and avoiding hours/days with consistently poor performance.
          </p>
          {bestSession.trades >= 5 && bestSession.winRate >= 55 && (
            <p className="text-trading-profit">
              ✓ The {bestSession.name} session shows strong performance with {bestSession.winRate.toFixed(0)}% win rate.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
