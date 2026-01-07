import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EquityPoint } from '@/hooks/useBacktest';
import { format } from 'date-fns';
import { TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface DrawdownChartProps {
  data: EquityPoint[];
  maxDrawdown: number;
}

export function DrawdownChart({ data, maxDrawdown }: DrawdownChartProps) {
  const chartData = data.map(point => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
    fullDate: format(new Date(point.timestamp), 'MMM dd, HH:mm'),
    drawdownNegative: -point.drawdown, // Invert for visual effect (drawdown goes down)
  }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-trading-loss" />
          Drawdown
          <Badge variant="outline" className="ml-auto border-trading-loss/50 bg-trading-loss/10 text-trading-loss text-xs">
            Max: -{maxDrawdown.toFixed(2)}%
          </Badge>
        </CardTitle>
        <CardDescription>Portfolio decline from peak value</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[Math.floor(-maxDrawdown * 1.2), 0]}
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
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
              />
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeOpacity={0.5}
              />
              <ReferenceLine 
                y={-maxDrawdown} 
                stroke="hsl(0, 84%, 50%)" 
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{ 
                  value: 'Max DD', 
                  position: 'right', 
                  fill: 'hsl(0, 84%, 60%)', 
                  fontSize: 10 
                }}
              />
              <Area
                type="monotone"
                dataKey="drawdownNegative"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={1.5}
                fill="url(#drawdownGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
