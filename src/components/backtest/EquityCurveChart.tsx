import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EquityPoint, BacktestTrade } from '@/types/backtest';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { LineChart } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Scatter,
  Cell,
} from 'recharts';

interface EquityCurveChartProps {
  data: EquityPoint[];
  initialBalance: number;
  trades?: BacktestTrade[];
}

interface ChartPoint {
  timestamp: number;
  date: string;
  fullDate: string;
  balance: number;
  drawdown: number;
  // Trade marker fields
  tradeBalance?: number;
  tradeType?: 'long_entry' | 'long_exit' | 'short_entry' | 'short_exit';
  tradeLabel?: string;
  tradePnl?: number;
}

export function EquityCurveChart({ data, initialBalance, trades }: EquityCurveChartProps) {
  const chartData: ChartPoint[] = data.map(point => ({
    ...point,
    date: format(new Date(point.timestamp), 'MMM dd'),
    fullDate: format(new Date(point.timestamp), 'MMM dd, HH:mm'),
  }));

  // Add trade markers if trades provided
  if (trades && trades.length > 0) {
    // Build a balance lookup from equity curve timestamps
    let runningBalance = initialBalance;
    const balanceAtTime = new Map<number, number>();
    balanceAtTime.set(data[0]?.timestamp || 0, initialBalance);
    
    for (const point of data) {
      balanceAtTime.set(point.timestamp, point.balance);
    }

    // Find closest equity point for each trade event
    for (const trade of trades) {
      // Entry marker
      const entryPoint = chartData.find(p => p.timestamp >= trade.entryTime) || chartData[chartData.length - 1];
      if (entryPoint && !entryPoint.tradeType) {
        entryPoint.tradeType = trade.direction === 'long' ? 'long_entry' : 'short_entry';
        entryPoint.tradeBalance = entryPoint.balance;
        entryPoint.tradeLabel = `${trade.direction === 'long' ? 'LONG' : 'SHORT'} @ ${trade.entryPrice.toFixed(2)}`;
      }

      // Exit marker  
      const exitPoint = chartData.find(p => p.timestamp >= trade.exitTime) || chartData[chartData.length - 1];
      if (exitPoint && !exitPoint.tradeType) {
        exitPoint.tradeType = trade.direction === 'long' ? 'long_exit' : 'short_exit';
        exitPoint.tradeBalance = exitPoint.balance;
        exitPoint.tradeLabel = `Close ${trade.direction.toUpperCase()} @ ${trade.exitPrice.toFixed(2)}`;
        exitPoint.tradePnl = trade.pnl;
      }
    }
  }

  const tradeMarkerData = chartData.filter(p => p.tradeBalance !== undefined);

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const yDomain = [
    Math.floor(minBalance * 0.98),
    Math.ceil(maxBalance * 1.02)
  ];

  const isProfitable = data.length > 0 && data[data.length - 1].balance >= initialBalance;

  const hasLongShort = trades?.some(t => t.direction === 'short');

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <LineChart className="h-4 w-4" />
          Equity Curve
          {hasLongShort && (
            <span className="text-xs text-muted-foreground font-normal ml-2">
              (Long &amp; Short trades)
            </span>
          )}
        </CardTitle>
        <CardDescription>Balance changes over the backtest period with trade markers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                formatter={(value: number, name: string) => {
                  if (name === 'tradeBalance') return [null, null];
                  return [formatCurrency(value), 'Balance'];
                }}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as ChartPoint | undefined;
                  if (!p) return '';
                  let label = p.fullDate;
                  if (p.tradeLabel) {
                    label += `\n${p.tradeLabel}`;
                    if (p.tradePnl !== undefined) {
                      label += ` (${p.tradePnl >= 0 ? '+' : ''}${formatCurrency(p.tradePnl)})`;
                    }
                  }
                  return label;
                }}
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
              {/* Trade markers as scatter dots */}
              <Scatter
                dataKey="tradeBalance"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload?.tradeType || cx == null || cy == null) return null;
                  const isEntry = payload.tradeType.includes('entry');
                  const isLong = payload.tradeType.includes('long');
                  const size = 5;
                  
                  // Entries: triangles up (long) or down (short)
                  // Exits: circles
                  if (isEntry) {
                    const color = isLong ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)';
                    if (isLong) {
                      // Triangle pointing up
                      return (
                        <polygon
                          points={`${cx},${cy - size - 2} ${cx - size},${cy + size - 2} ${cx + size},${cy + size - 2}`}
                          fill={color}
                          stroke={color}
                          strokeWidth={1}
                        />
                      );
                    } else {
                      // Triangle pointing down
                      return (
                        <polygon
                          points={`${cx},${cy + size + 2} ${cx - size},${cy - size + 2} ${cx + size},${cy - size + 2}`}
                          fill={color}
                          stroke={color}
                          strokeWidth={1}
                        />
                      );
                    }
                  } else {
                    // Exit: circle
                    const pnl = payload.tradePnl ?? 0;
                    const color = pnl >= 0 ? 'hsl(142, 76%, 45%)' : 'hsl(0, 84%, 60%)';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={size}
                        fill={color}
                        fillOpacity={0.8}
                        stroke="hsl(var(--background))"
                        strokeWidth={1.5}
                      />
                    );
                  }
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {trades && trades.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1">
              <svg width="10" height="10"><polygon points="5,0 0,10 10,10" fill="hsl(142, 76%, 45%)" /></svg>
              Long Entry
            </span>
            <span className="flex items-center gap-1">
              <svg width="10" height="10"><polygon points="5,10 0,0 10,0" fill="hsl(0, 84%, 60%)" /></svg>
              Short Entry
            </span>
            <span className="flex items-center gap-1">
              <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="hsl(142, 76%, 45%)" /></svg>
              Win Exit
            </span>
            <span className="flex items-center gap-1">
              <svg width="10" height="10"><circle cx="5" cy="5" r="4" fill="hsl(0, 84%, 60%)" /></svg>
              Loss Exit
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
