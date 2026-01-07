import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EquityPoint } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { LineChart } from 'lucide-react';
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

interface EquityCurveChartProps {
  data: EquityPoint[];
  initialBalance: number;
}

export function EquityCurveChart({ data, initialBalance }: EquityCurveChartProps) {
  const chartData = data.map(point => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
    fullDate: format(new Date(point.timestamp), 'MMM dd, HH:mm'),
  }));

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const yDomain = [
    Math.floor(minBalance * 0.98),
    Math.ceil(maxBalance * 1.02)
  ];

  const isProfitable = data.length > 0 && data[data.length - 1].balance >= initialBalance;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Equity Curve
        </CardTitle>
        <CardDescription>Balance changes over the backtest period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isProfitable ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)'} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isProfitable ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)'} 
                    stopOpacity={0}
                  />
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
                domain={yDomain}
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
                formatter={(value: number) => [formatCurrency(value), 'Balance']}
                labelFormatter={(_, payload) => payload[0]?.payload?.fullDate || ''}
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
                stroke={isProfitable ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)'}
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
