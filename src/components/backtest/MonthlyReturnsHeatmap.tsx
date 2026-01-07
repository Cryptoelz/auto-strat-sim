import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BacktestResult } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyReturnsHeatmapProps {
  trades: BacktestResult['trades'];
}

export function MonthlyReturnsHeatmap({ trades }: MonthlyReturnsHeatmapProps) {
  // Group trades by month and calculate monthly returns
  const monthlyData: Record<string, { pnl: number; trades: number }> = {};
  
  trades.forEach(trade => {
    const date = new Date(trade.exitTime);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { pnl: 0, trades: 0 };
    }
    monthlyData[key].pnl += trade.pnl;
    monthlyData[key].trades += 1;
  });

  // Get all unique years and months
  const entries = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0]));
  
  if (entries.length === 0) return null;

  // Group by year for display
  const yearGroups: Record<string, { month: number; pnl: number; trades: number }[]> = {};
  entries.forEach(([key, data]) => {
    const [year, month] = key.split('-');
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    yearGroups[year].push({ month: parseInt(month), ...data });
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Calculate max absolute PnL for color scaling
  const allPnls = entries.map(([, d]) => d.pnl);
  const maxAbsPnl = Math.max(...allPnls.map(Math.abs), 1);

  const getColor = (pnl: number) => {
    const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);
    if (pnl > 0) {
      return `hsla(142, 76%, 45%, ${0.2 + intensity * 0.6})`;
    } else if (pnl < 0) {
      return `hsla(0, 84%, 60%, ${0.2 + intensity * 0.6})`;
    }
    return 'hsl(var(--secondary))';
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Monthly Returns Heatmap
        </CardTitle>
        <CardDescription>Performance breakdown by month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-1 text-muted-foreground font-medium w-12">Year</th>
                {months.map(m => (
                  <th key={m} className="text-center py-2 px-1 text-muted-foreground font-medium w-12">{m}</th>
                ))}
                <th className="text-right py-2 px-2 text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(yearGroups).map(([year, monthData]) => {
                const yearTotal = monthData.reduce((sum, d) => sum + d.pnl, 0);
                return (
                  <tr key={year}>
                    <td className="py-1 px-1 font-medium text-foreground">{year}</td>
                    {months.map((_, idx) => {
                      const data = monthData.find(d => d.month === idx + 1);
                      if (!data) {
                        return (
                          <td key={idx} className="py-1 px-1">
                            <div className="h-8 rounded bg-secondary/30 flex items-center justify-center text-muted-foreground/50">
                              -
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={idx} className="py-1 px-1">
                          <div 
                            className="h-8 rounded flex flex-col items-center justify-center cursor-default transition-transform hover:scale-105"
                            style={{ backgroundColor: getColor(data.pnl) }}
                            title={`${months[idx]} ${year}: ${formatCurrency(data.pnl)} (${data.trades} trades)`}
                          >
                            <span className={cn(
                              "font-medium text-[10px]",
                              data.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                            )}>
                              {data.pnl >= 0 ? '+' : ''}{(data.pnl / 100).toFixed(0)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 text-right">
                      <span className={cn(
                        "font-medium",
                        yearTotal >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {yearTotal >= 0 ? '+' : ''}{formatCurrency(yearTotal)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsla(0, 84%, 60%, 0.6)' }} />
            <span>Loss</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-secondary/50" />
            <span>No Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsla(142, 76%, 45%, 0.6)' }} />
            <span>Profit</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
