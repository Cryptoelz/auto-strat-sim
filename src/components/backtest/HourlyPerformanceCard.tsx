import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { BacktestResult } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface HourlyPerformance {
  hour: number;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

function analyzeHourlyPerformance(trades: BacktestResult['trades']): HourlyPerformance[] {
  const hourlyData: Record<number, { trades: number; wins: number; losses: number; pnl: number }> = {};
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyData[h] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
  }

  trades.forEach(trade => {
    const hour = new Date(trade.entryTime).getUTCHours();
    hourlyData[hour].trades += 1;
    hourlyData[hour].pnl += trade.pnl;
    if (trade.type === 'win') {
      hourlyData[hour].wins += 1;
    } else {
      hourlyData[hour].losses += 1;
    }
  });

  return Object.entries(hourlyData).map(([hour, data]) => ({
    hour: parseInt(hour),
    ...data,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0
  }));
}

interface HourlyPerformanceCardProps {
  trades: BacktestResult['trades'];
}

export function HourlyPerformanceCard({ trades }: HourlyPerformanceCardProps) {
  const hourlyData = analyzeHourlyPerformance(trades);
  
  if (trades.length === 0) return null;

  const activeHours = hourlyData.filter(h => h.trades > 0);
  if (activeHours.length === 0) return null;

  const maxPnl = Math.max(...hourlyData.map(h => Math.abs(h.pnl)), 1);
  const maxTrades = Math.max(...hourlyData.map(h => h.trades), 1);
  
  const bestHour = [...activeHours].sort((a, b) => b.pnl - a.pnl)[0];
  const worstHour = [...activeHours].sort((a, b) => a.pnl - b.pnl)[0];
  const busiestHour = [...activeHours].sort((a, b) => b.trades - a.trades)[0];

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour12}${period}`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Hourly Performance
        </CardTitle>
        <CardDescription>Trading performance by hour of day (UTC)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2 rounded-lg border border-trading-profit/30 bg-trading-profit/5 text-center">
              <p className="text-xs text-muted-foreground">Best Hour</p>
              <p className="text-lg font-bold text-trading-profit">{formatHour(bestHour.hour)}</p>
              <p className="text-[10px] text-muted-foreground">+{formatCurrency(bestHour.pnl)}</p>
            </div>
            <div className="p-2 rounded-lg border border-trading-loss/30 bg-trading-loss/5 text-center">
              <p className="text-xs text-muted-foreground">Worst Hour</p>
              <p className="text-lg font-bold text-trading-loss">{formatHour(worstHour.hour)}</p>
              <p className="text-[10px] text-muted-foreground">{formatCurrency(worstHour.pnl)}</p>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">Most Active</p>
              <p className="text-lg font-bold">{formatHour(busiestHour.hour)}</p>
              <p className="text-[10px] text-muted-foreground">{busiestHour.trades} trades</p>
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">P&L by Hour</Label>
            <div className="flex items-end gap-0.5 h-24">
              {hourlyData.map((hour) => {
                const height = hour.trades > 0 ? (Math.abs(hour.pnl) / maxPnl) * 100 : 0;
                const isProfit = hour.pnl >= 0;
                
                return (
                  <div
                    key={hour.hour}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                    title={`${formatHour(hour.hour)}: ${formatCurrency(hour.pnl)} (${hour.trades} trades, ${hour.winRate.toFixed(0)}% WR)`}
                  >
                    <div
                      className={cn(
                        "w-full rounded-t transition-all cursor-default",
                        hour.trades === 0 ? "bg-secondary/20" :
                        isProfit ? "bg-trading-profit/60 hover:bg-trading-profit/80" : 
                        "bg-trading-loss/60 hover:bg-trading-loss/80"
                      )}
                      style={{ height: hour.trades > 0 ? `${Math.max(height, 8)}%` : '4px' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0:00</span>
              <span>6:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Trade Count Overlay */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trade Count by Hour</Label>
            <div className="flex items-end gap-0.5 h-12">
              {hourlyData.map((hour) => {
                const height = (hour.trades / maxTrades) * 100;
                
                return (
                  <div
                    key={hour.hour}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    <div
                      className="w-full rounded-t bg-primary/40 transition-all"
                      style={{ height: hour.trades > 0 ? `${Math.max(height, 8)}%` : '2px' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Hours Table */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Top Trading Hours</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto">
              {activeHours
                .sort((a, b) => b.trades - a.trades)
                .slice(0, 6)
                .map((hour) => (
                  <div 
                    key={hour.hour}
                    className="flex items-center justify-between p-1.5 rounded bg-secondary/30 text-xs"
                  >
                    <span className="font-medium">{formatHour(hour.hour)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {hour.trades}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        hour.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {hour.pnl >= 0 ? '+' : ''}{formatCurrency(hour.pnl)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-trading-profit/60" />
              <span>Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-trading-loss/60" />
              <span>Loss</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-primary/40" />
              <span>Trade Count</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
