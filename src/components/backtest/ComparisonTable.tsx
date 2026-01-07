import { SavedRun } from '@/lib/backtest-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCompare, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  runs: SavedRun[];
  onRemove: (id: string) => void;
}

export function ComparisonTable({ runs, onRemove }: ComparisonTableProps) {
  if (runs.length === 0) return null;

  const metrics = [
    { key: 'totalPnlPercent', label: 'Return', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, best: 'high' },
    { key: 'winRate', label: 'Win Rate', format: (v: number) => `${v.toFixed(1)}%`, best: 'high' },
    { key: 'totalTrades', label: 'Trades', format: (v: number) => v.toString(), best: 'neutral' },
    { key: 'maxDrawdown', label: 'Max DD', format: (v: number) => `-${v.toFixed(2)}%`, best: 'low' },
    { key: 'profitFactor', label: 'Profit Factor', format: (v: number) => v === Infinity ? '∞' : v.toFixed(2), best: 'high' },
    { key: 'sharpeRatio', label: 'Sharpe', format: (v: number) => v.toFixed(2), best: 'high' },
  ] as const;

  const getBestValue = (key: string, best: string) => {
    const values = runs.map(r => r.result[key as keyof typeof r.result] as number);
    if (best === 'high') return Math.max(...values);
    if (best === 'low') return Math.min(...values);
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          Strategy Comparison
          <Badge variant="secondary" className="ml-auto">{runs.length} runs</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">Strategy</th>
                {metrics.map(m => (
                  <th key={m.key} className="text-right py-2 px-2 text-muted-foreground font-medium">{m.label}</th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-border/30 hover:bg-secondary/20">
                  <td className="py-2 px-2">
                    <div>
                      <span className="font-medium">{run.name}</span>
                      <div className="text-xs text-muted-foreground">
                        SMA {run.config.fastSMA}/{run.config.slowSMA} • {run.config.timeframe}
                      </div>
                    </div>
                  </td>
                  {metrics.map(m => {
                    const value = run.result[m.key as keyof typeof run.result] as number;
                    const bestValue = getBestValue(m.key, m.best);
                    const isBest = bestValue !== null && value === bestValue && runs.length > 1;
                    return (
                      <td 
                        key={m.key} 
                        className={cn(
                          "text-right py-2 px-2",
                          isBest && m.best === 'high' && "text-trading-profit font-medium",
                          isBest && m.best === 'low' && "text-trading-profit font-medium",
                          m.key === 'totalPnlPercent' && value >= 0 && "text-trading-profit",
                          m.key === 'totalPnlPercent' && value < 0 && "text-trading-loss",
                        )}
                      >
                        {m.format(value)}
                      </td>
                    );
                  })}
                  <td className="py-2 px-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(run.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
