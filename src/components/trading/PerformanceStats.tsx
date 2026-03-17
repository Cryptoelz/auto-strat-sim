import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradingState } from '@/types/trading';
import { calculatePerformanceMetrics, formatCurrency, formatPercent } from '@/lib/performance';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { format } from 'date-fns';
import { TrendingUp, Target, AlertTriangle, BarChart3, Award, Scale } from 'lucide-react';

interface PerformanceStatsProps {
  state: TradingState;
}

export function PerformanceStats({ state }: PerformanceStatsProps) {
  const metrics = useMemo(() => calculatePerformanceMetrics(state), [state]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4" />
          Performance Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[11px]">Win Rate</span>
            </div>
            <p className="mt-1 text-lg font-bold">{metrics.winRate.toFixed(1)}%</p>
            <p className="text-[11px] text-muted-foreground">{metrics.winningTrades}W / {metrics.losingTrades}L</p>
          </div>

          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              <span className="text-[11px]">Total P&L</span>
            </div>
            <p className={`mt-1 text-lg font-bold ${metrics.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
              {formatCurrency(metrics.totalPnl)}
            </p>
            <p className="text-[11px] text-muted-foreground">{formatPercent(metrics.totalPnlPercent)}</p>
          </div>

          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[11px]">Max DD</span>
            </div>
            <p className="mt-1 text-lg font-bold text-trading-loss">{metrics.maxDrawdown.toFixed(2)}%</p>
          </div>

          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              <span className="text-[11px]">Avg Win</span>
            </div>
            <p className="mt-1 text-sm font-bold text-trading-profit">{formatCurrency(metrics.avgWin)}</p>
          </div>

          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[11px]">Avg Loss</span>
            </div>
            <p className="mt-1 text-sm font-bold text-trading-loss">{formatCurrency(metrics.avgLoss)}</p>
          </div>

          <div className="rounded-lg bg-secondary/30 p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Scale className="h-3.5 w-3.5" />
              <span className="text-[11px]">Profit Factor</span>
            </div>
            <p className={`mt-1 text-sm font-bold ${metrics.profitFactor >= 1 ? 'text-trading-profit' : 'text-trading-loss'}`}>
              {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Equity Curve */}
        {metrics.equityCurve.length > 1 && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Equity Curve</p>
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.equityCurve} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) => format(new Date(time), 'MM/dd')}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(time) => format(new Date(time), 'MMM dd, yyyy')}
                    formatter={(value: number) => [formatCurrency(value), 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" fill="url(#equityGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
