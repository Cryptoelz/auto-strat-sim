import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BacktestResult } from '@/hooks/useBacktest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

interface DayOfWeekPerformance {
  day: number;
  dayName: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

function analyzeDayOfWeekPerformance(trades: BacktestResult['trades']): DayOfWeekPerformance[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayData: Record<number, { trades: number; wins: number; losses: number; pnl: number }> = {};
  
  // Initialize all days
  for (let d = 0; d < 7; d++) {
    dayData[d] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
  }

  trades.forEach(trade => {
    const day = new Date(trade.entryTime).getUTCDay();
    dayData[day].trades += 1;
    dayData[day].pnl += trade.pnl;
    if (trade.type === 'win') {
      dayData[day].wins += 1;
    } else {
      dayData[day].losses += 1;
    }
  });

  return Object.entries(dayData).map(([day, data]) => ({
    day: parseInt(day),
    dayName: dayNames[parseInt(day)],
    ...data,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
  }));
}

interface DayOfWeekPerformanceCardProps {
  trades: BacktestResult['trades'];
}

export function DayOfWeekPerformanceCard({ trades }: DayOfWeekPerformanceCardProps) {
  const dayData = analyzeDayOfWeekPerformance(trades);
  
  if (trades.length === 0) return null;

  const activeDays = dayData.filter(d => d.trades > 0);
  if (activeDays.length === 0) return null;

  const maxPnl = Math.max(...dayData.map(d => Math.abs(d.pnl)), 1);
  
  const sortedByPnl = [...activeDays].sort((a, b) => b.pnl - a.pnl);
  const bestDay = sortedByPnl[0];
  const worstDay = sortedByPnl[sortedByPnl.length - 1];
  const busiestDay = [...activeDays].sort((a, b) => b.trades - a.trades)[0];

  // Calculate weekday vs weekend performance
  const weekdayData = dayData.filter(d => d.day >= 1 && d.day <= 5);
  const weekendData = dayData.filter(d => d.day === 0 || d.day === 6);
  
  const weekdayPnl = weekdayData.reduce((sum, d) => sum + d.pnl, 0);
  const weekendPnl = weekendData.reduce((sum, d) => sum + d.pnl, 0);
  const weekdayTrades = weekdayData.reduce((sum, d) => sum + d.trades, 0);
  const weekendTrades = weekendData.reduce((sum, d) => sum + d.trades, 0);

  const dayColors: Record<number, string> = {
    0: 'bg-purple-500/60', // Sunday
    1: 'bg-blue-500/60',   // Monday
    2: 'bg-cyan-500/60',   // Tuesday
    3: 'bg-green-500/60',  // Wednesday
    4: 'bg-yellow-500/60', // Thursday
    5: 'bg-orange-500/60', // Friday
    6: 'bg-pink-500/60',   // Saturday
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-indigo-500" />
          Day of Week Performance
        </CardTitle>
        <CardDescription>Trading performance by day of the week (UTC)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded-lg border border-trading-profit/30 bg-trading-profit/5 text-center">
              <p className="text-xs text-muted-foreground">Best Day</p>
              <p className="text-lg font-bold text-trading-profit">{bestDay.dayName.slice(0, 3)}</p>
              <p className="text-[10px] text-muted-foreground">+{formatCurrency(bestDay.pnl)}</p>
            </div>
            <div className="p-2 rounded-lg border border-trading-loss/30 bg-trading-loss/5 text-center">
              <p className="text-xs text-muted-foreground">Worst Day</p>
              <p className="text-lg font-bold text-trading-loss">{worstDay.dayName.slice(0, 3)}</p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(worstDay.pnl)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">Most Active</p>
              <p className="text-lg font-bold">{busiestDay.dayName.slice(0, 3)}</p>
              <p className="text-[10px] text-muted-foreground">{busiestDay.trades} trades</p>
            </div>
          </div>

          {/* Day Performance Bars */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">P&L by Day</Label>
            <div className="space-y-2">
              {dayData.map((day) => {
                const barWidth = day.trades > 0 ? (Math.abs(day.pnl) / maxPnl) * 100 : 0;
                const isProfit = day.pnl >= 0;
                
                return (
                  <div key={day.day} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", dayColors[day.day])} />
                        <span className="text-muted-foreground w-16">{day.dayName.slice(0, 3)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {day.trades} trades
                        </Badge>
                        {day.trades > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {day.winRate.toFixed(0)}% WR
                          </span>
                        )}
                        <span className={cn(
                          "font-medium w-16 text-right",
                          day.trades === 0 ? "text-muted-foreground" :
                          isProfit ? "text-trading-profit" : "text-trading-loss"
                        )}>
                          {day.trades > 0 ? (isProfit ? '+' : '') + formatCurrency(day.pnl) : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary/30 rounded overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded transition-all",
                          day.trades === 0 ? "bg-secondary/50" :
                          isProfit ? "bg-trading-profit/60" : "bg-trading-loss/60"
                        )}
                        style={{ width: day.trades > 0 ? `${Math.max(barWidth, 2)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekday vs Weekend Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className={cn(
              "p-3 rounded-lg border",
              weekdayPnl >= 0 ? "border-trading-profit/30 bg-trading-profit/5" : "border-trading-loss/30 bg-trading-loss/5"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Weekdays</span>
                <Badge variant="secondary" className="text-[10px]">
                  {weekdayTrades} trades
                </Badge>
              </div>
              <p className={cn(
                "text-lg font-bold",
                weekdayPnl >= 0 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {weekdayPnl >= 0 ? '+' : ''}{formatCurrency(weekdayPnl)}
              </p>
              <p className="text-[10px] text-muted-foreground">Mon - Fri</p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border",
              weekendPnl >= 0 ? "border-trading-profit/30 bg-trading-profit/5" : "border-trading-loss/30 bg-trading-loss/5"
            )}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Weekends</span>
                <Badge variant="secondary" className="text-[10px]">
                  {weekendTrades} trades
                </Badge>
              </div>
              <p className={cn(
                "text-lg font-bold",
                weekendTrades === 0 ? "text-muted-foreground" :
                weekendPnl >= 0 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {weekendTrades > 0 ? (weekendPnl >= 0 ? '+' : '') + formatCurrency(weekendPnl) : 'No trades'}
              </p>
              <p className="text-[10px] text-muted-foreground">Sat - Sun</p>
            </div>
          </div>

          {/* Trading Days Insight */}
          <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
            {bestDay.pnl > 0 && worstDay.pnl < 0 ? (
              <p>
                <strong className="text-foreground">Pattern detected:</strong> {bestDay.dayName}s show the strongest 
                performance (+{formatCurrency(bestDay.pnl)}), while {worstDay.dayName}s 
                are the weakest ({formatCurrency(worstDay.pnl)}). Consider adjusting position sizes based on the day.
              </p>
            ) : bestDay.pnl > 0 ? (
              <p>
                <strong className="text-trading-profit">Positive overall:</strong> All trading days are profitable, 
                with {bestDay.dayName}s leading at +{formatCurrency(bestDay.pnl)}.
              </p>
            ) : (
              <p>
                <strong className="text-trading-loss">Challenging period:</strong> Most days show losses. 
                {activeDays.filter(d => d.pnl > 0).length > 0 && 
                  ` Consider focusing trades on ${activeDays.filter(d => d.pnl > 0).map(d => d.dayName.slice(0, 3)).join(', ')}.`
                }
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
