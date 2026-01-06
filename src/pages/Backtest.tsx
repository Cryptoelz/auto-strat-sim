import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBacktest, BacktestConfig, BacktestResult, EquityPoint } from '@/hooks/useBacktest';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { format, subDays } from 'date-fns';
import { 
  ArrowLeft, 
  Play, 
  RotateCcw, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  AlertTriangle,
  Trophy,
  Percent,
  DollarSign,
  LineChart,
  Save,
  Trash2,
  GitCompare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

const TIMEFRAME_OPTIONS = [
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
];

const SAVED_RUNS_KEY = 'backtest-saved-runs';

interface SavedRun {
  id: string;
  name: string;
  savedAt: number;
  config: {
    assets: Asset[];
    startDate: string;
    endDate: string;
    timeframe: string;
    fastSMA: number;
    slowSMA: number;
    initialBalance: number;
    positionSizePercent: number;
    stopLossPercent: number;
    takeProfitPercent: number;
  };
  result: {
    finalBalance: number;
    totalPnl: number;
    totalPnlPercent: number;
    winRate: number;
    totalTrades: number;
    maxDrawdown: number;
    profitFactor: number;
    sharpeRatio: number;
  };
}

function loadSavedRuns(): SavedRun[] {
  try {
    const saved = localStorage.getItem(SAVED_RUNS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSavedRuns(runs: SavedRun[]) {
  localStorage.setItem(SAVED_RUNS_KEY, JSON.stringify(runs));
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string; 
  value: string; 
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn(
              "text-lg font-bold mt-1",
              trend === 'up' && "text-trading-profit",
              trend === 'down' && "text-trading-loss"
            )}>
              {value}
            </p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            trend === 'up' && "bg-trading-profit/10 text-trading-profit",
            trend === 'down' && "bg-trading-loss/10 text-trading-loss",
            trend === 'neutral' && "bg-muted text-muted-foreground"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EquityCurveChart({ data, initialBalance }: { data: EquityPoint[]; initialBalance: number }) {
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

function DrawdownChart({ data, maxDrawdown }: { data: EquityPoint[]; maxDrawdown: number }) {
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

function MonthlyReturnsHeatmap({ trades }: { trades: BacktestResult['trades'] }) {
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

function ResultsDisplay({ result }: { result: BacktestResult }) {
  const pnlTrend = result.totalPnl >= 0 ? 'up' : 'down';
  const initialBalance = result.equityCurve.length > 0 ? result.equityCurve[0].balance : 10000;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          title="Final Balance"
          value={formatCurrency(result.finalBalance)}
          icon={DollarSign}
          trend={pnlTrend}
        />
        <StatCard
          title="Total P&L"
          value={`${result.totalPnl >= 0 ? '+' : ''}${formatCurrency(result.totalPnl)}`}
          icon={result.totalPnl >= 0 ? TrendingUp : TrendingDown}
          trend={pnlTrend}
        />
        <StatCard
          title="Return"
          value={`${result.totalPnlPercent >= 0 ? '+' : ''}${result.totalPnlPercent.toFixed(2)}%`}
          icon={Percent}
          trend={pnlTrend}
        />
        <StatCard
          title="Win Rate"
          value={`${result.winRate.toFixed(1)}%`}
          icon={Trophy}
          trend={result.winRate >= 50 ? 'up' : 'down'}
        />
      </div>

      {/* Equity Curve & Drawdown Charts */}
      {result.equityCurve.length > 1 && (
        <div className="space-y-4">
          <EquityCurveChart data={result.equityCurve} initialBalance={initialBalance} />
          <DrawdownChart data={result.equityCurve} maxDrawdown={result.maxDrawdown} />
        </div>
      )}

      {/* Monthly Returns Heatmap */}
      {result.trades.length > 0 && (
        <MonthlyReturnsHeatmap trades={result.trades} />
      )}

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Trade Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{result.totalTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Winning Trades</span>
              <span className="font-medium text-trading-profit">{result.winningTrades}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Losing Trades</span>
              <span className="font-medium text-trading-loss">{result.losingTrades}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Win</span>
              <span className="font-medium text-trading-profit">{formatCurrency(result.averageWin)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Loss</span>
              <span className="font-medium text-trading-loss">{formatCurrency(result.averageLoss)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Risk Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-trading-loss">-{result.maxDrawdown.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className={cn(
                "font-medium",
                result.profitFactor >= 1 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {result.profitFactor === Infinity ? '∞' : result.profitFactor.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sharpe Ratio</span>
              <span className={cn(
                "font-medium",
                result.sharpeRatio >= 1 ? "text-trading-profit" : result.sharpeRatio >= 0 ? "text-foreground" : "text-trading-loss"
              )}>
                {result.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Risk/Reward</span>
              <span className="font-medium">
                {result.averageLoss !== 0 
                  ? Math.abs(result.averageWin / result.averageLoss).toFixed(2) 
                  : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Breakdown */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Performance by Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(result.assetResults).map(([asset, stats]) => {
              if (stats.trades === 0) return null;
              const info = ASSET_INFO[asset as Asset];
              return (
                <div 
                  key={asset}
                  className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{info.symbol}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stats.trades} trades
                    </Badge>
                  </div>
                  <div className={cn(
                    "text-lg font-bold",
                    stats.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                  )}>
                    {stats.pnl >= 0 ? '+' : ''}{formatCurrency(stats.pnl)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Win Rate: {stats.winRate.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trade History */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trade History</CardTitle>
          <CardDescription>All {result.trades.length} trades from backtest</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {result.trades.map((trade, i) => {
                const info = ASSET_INFO[trade.asset];
                return (
                  <div 
                    key={trade.id}
                    className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/10 p-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-12">{info.symbol}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          trade.type === 'win'
                            ? "border-trading-profit/50 bg-trading-profit/10 text-trading-profit"
                            : "border-trading-loss/50 bg-trading-loss/10 text-trading-loss"
                        )}
                      >
                        {trade.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(trade.entryTime), 'MMM dd HH:mm')} → {format(new Date(trade.exitTime), 'MMM dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {trade.exitReason.replace('_', ' ')}
                      </Badge>
                      <span className={cn(
                        "font-medium",
                        trade.pnl >= 0 ? "text-trading-profit" : "text-trading-loss"
                      )}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function ComparisonTable({ runs, onRemove }: { runs: SavedRun[]; onRemove: (id: string) => void }) {
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

export default function Backtest() {
  const { isRunning, progress, result, error, runBacktest, reset } = useBacktest();
  
  // Config state
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h'>('15m');
  const [enabledAssets, setEnabledAssets] = useState<Asset[]>(['BTCUSDT', 'XRPUSDT']);
  const [fastSMA, setFastSMA] = useState(20);
  const [slowSMA, setSlowSMA] = useState(50);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [positionSizePercent, setPositionSizePercent] = useState(5);
  const [stopLossPercent, setStopLossPercent] = useState(2);
  const [takeProfitPercent, setTakeProfitPercent] = useState(4);

  // Saved runs state
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>(() => loadSavedRuns());
  const [showComparison, setShowComparison] = useState(false);

  const saveCurrentRun = () => {
    if (!result) return;
    
    const runName = `SMA ${fastSMA}/${slowSMA} ${timeframe}`;
    const newRun: SavedRun = {
      id: `run-${Date.now()}`,
      name: runName,
      savedAt: Date.now(),
      config: {
        assets: enabledAssets,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeframe,
        fastSMA,
        slowSMA,
        initialBalance,
        positionSizePercent,
        stopLossPercent,
        takeProfitPercent,
      },
      result: {
        finalBalance: result.finalBalance,
        totalPnl: result.totalPnl,
        totalPnlPercent: result.totalPnlPercent,
        winRate: result.winRate,
        totalTrades: result.totalTrades,
        maxDrawdown: result.maxDrawdown,
        profitFactor: result.profitFactor,
        sharpeRatio: result.sharpeRatio,
      },
    };

    const updatedRuns = [...savedRuns, newRun];
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const deleteRun = (id: string) => {
    const updatedRuns = savedRuns.filter(r => r.id !== id);
    setSavedRuns(updatedRuns);
    saveSavedRuns(updatedRuns);
  };

  const clearAllRuns = () => {
    setSavedRuns([]);
    saveSavedRuns([]);
    setShowComparison(false);
  };

  const toggleAsset = (asset: Asset) => {
    setEnabledAssets(prev => 
      prev.includes(asset) 
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleRunBacktest = () => {
    if (enabledAssets.length === 0) return;
    
    const config: BacktestConfig = {
      assets: enabledAssets,
      startDate,
      endDate,
      timeframe,
      fastSMA,
      slowSMA,
      initialBalance,
      positionSizePercent,
      stopLossPercent,
      takeProfitPercent,
      feePercent: 0.1,
    };

    runBacktest(config);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold md:text-xl">Strategy Backtester</h1>
              <p className="text-xs text-muted-foreground">Test your SMA crossover strategy on historical data</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <Card className="border-border/50 bg-card/50 backdrop-blur lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Backtest Configuration</CardTitle>
              <CardDescription>Configure your strategy parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(startDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date > endDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(endDate, 'MMM dd, yyyy')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate || date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Timeframe */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Timeframe</Label>
                <Select value={timeframe} onValueChange={(v) => setTimeframe(v as typeof timeframe)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assets */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trading Pairs</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]).map((asset) => (
                    <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
                      <span className="text-sm font-medium">{ASSET_INFO[asset].symbol}</span>
                      <Switch
                        checked={enabledAssets.includes(asset)}
                        onCheckedChange={() => toggleAsset(asset)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* SMA Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">SMA Indicators</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Fast SMA</Label>
                    <Input
                      type="number"
                      value={fastSMA}
                      onChange={(e) => setFastSMA(parseInt(e.target.value) || 20)}
                      min={5}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Slow SMA</Label>
                    <Input
                      type="number"
                      value={slowSMA}
                      onChange={(e) => setSlowSMA(parseInt(e.target.value) || 50)}
                      min={10}
                      max={200}
                    />
                  </div>
                </div>
              </div>

              {/* Risk Settings */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Risk Management</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Initial Balance ($)</Label>
                    <Input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(parseInt(e.target.value) || 10000)}
                      min={1000}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Position Size (%)</Label>
                    <Input
                      type="number"
                      value={positionSizePercent}
                      onChange={(e) => setPositionSizePercent(parseInt(e.target.value) || 5)}
                      min={1}
                      max={100}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Stop Loss (%)</Label>
                    <Input
                      type="number"
                      value={stopLossPercent}
                      onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || 2)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Take Profit (%)</Label>
                    <Input
                      type="number"
                      value={takeProfitPercent}
                      onChange={(e) => setTakeProfitPercent(parseFloat(e.target.value) || 4)}
                      min={0.5}
                      max={50}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleRunBacktest}
                    disabled={isRunning || enabledAssets.length === 0}
                    className="flex-1"
                  >
                    {isRunning ? (
                      <>Running...</>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Backtest
                      </>
                    )}
                  </Button>
                  {result && (
                    <Button variant="outline" onClick={reset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {result && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={saveCurrentRun}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save for Comparison
                  </Button>
                )}
              </div>

              {/* Saved Runs */}
              {savedRuns.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Saved Runs ({savedRuns.length})</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                      onClick={clearAllRuns}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <Button
                    variant={showComparison ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className="w-full"
                  >
                    <GitCompare className="h-4 w-4 mr-2" />
                    {showComparison ? 'Hide Comparison' : 'Compare Runs'}
                  </Button>
                </div>
              )}

              {/* Progress Bar */}
              {isRunning && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    Fetching historical data... {progress.toFixed(0)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {!result && !isRunning && !error && !showComparison && (
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Backtest</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Configure your strategy parameters and click "Run Backtest" to simulate 
                    your SMA crossover strategy on historical market data.
                  </p>
                </CardContent>
              </Card>
            )}

            {showComparison && savedRuns.length > 0 && (
              <ComparisonTable runs={savedRuns} onRemove={deleteRun} />
            )}

            {result && !showComparison && <ResultsDisplay result={result} />}
          </div>
        </div>
      </main>
    </div>
  );
}