import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BacktestResult } from '@/hooks/useBacktest';
import { formatCurrency } from '@/lib/performance';
import { format } from 'date-fns';
import { Scale } from 'lucide-react';
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

interface BenchmarkData {
  strategyReturn: number;
  buyHoldReturn: number;
  alpha: number;
  outperformance: boolean;
  strategyEquity: { timestamp: number; value: number }[];
  buyHoldEquity: { timestamp: number; value: number }[];
}

function calculateBenchmark(
  trades: BacktestResult['trades'],
  equityCurve: BacktestResult['equityCurve'],
  initialBalance: number
): BenchmarkData {
  if (trades.length === 0 || equityCurve.length < 2) {
    return {
      strategyReturn: 0,
      buyHoldReturn: 0,
      alpha: 0,
      outperformance: false,
      strategyEquity: [],
      buyHoldEquity: []
    };
  }

  const sortedTrades = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  const firstTradeTime = sortedTrades[0].entryTime;
  const lastTradeTime = sortedTrades[sortedTrades.length - 1].exitTime;

  const assetPrices: Record<string, { entry: number; exit: number; weight: number }> = {};
  
  sortedTrades.forEach(trade => {
    if (!assetPrices[trade.asset]) {
      assetPrices[trade.asset] = { entry: trade.entryPrice, exit: trade.exitPrice, weight: 1 };
    } else {
      assetPrices[trade.asset].exit = trade.exitPrice;
      assetPrices[trade.asset].weight++;
    }
  });

  let totalWeight = 0;
  let weightedReturn = 0;
  
  Object.values(assetPrices).forEach(({ entry, exit, weight }) => {
    const assetReturn = ((exit - entry) / entry) * 100;
    weightedReturn += assetReturn * weight;
    totalWeight += weight;
  });

  const buyHoldReturn = totalWeight > 0 ? weightedReturn / totalWeight : 0;
  const strategyReturn = equityCurve.length > 0 
    ? ((equityCurve[equityCurve.length - 1].balance - initialBalance) / initialBalance) * 100 
    : 0;
  const alpha = strategyReturn - buyHoldReturn;

  const strategyEquity = equityCurve.map(p => ({
    timestamp: p.timestamp,
    value: ((p.balance - initialBalance) / initialBalance) * 100
  }));

  const buyHoldEquity: { timestamp: number; value: number }[] = [];
  if (equityCurve.length > 0) {
    const timeRange = lastTradeTime - firstTradeTime;
    equityCurve.forEach(p => {
      const progress = Math.min(Math.max((p.timestamp - firstTradeTime) / timeRange, 0), 1);
      buyHoldEquity.push({
        timestamp: p.timestamp,
        value: buyHoldReturn * progress
      });
    });
  }

  return {
    strategyReturn,
    buyHoldReturn,
    alpha,
    outperformance: strategyReturn > buyHoldReturn,
    strategyEquity,
    buyHoldEquity
  };
}

export function BenchmarkComparisonCard({ 
  trades, 
  equityCurve, 
  initialBalance 
}: { 
  trades: BacktestResult['trades']; 
  equityCurve: BacktestResult['equityCurve'];
  initialBalance: number;
}) {
  const benchmark = calculateBenchmark(trades, equityCurve, initialBalance);
  
  if (trades.length < 2) return null;

  const chartData = benchmark.strategyEquity.map((s, i) => ({
    date: format(new Date(s.timestamp), 'MMM dd'),
    strategy: s.value,
    buyHold: benchmark.buyHoldEquity[i]?.value || 0
  }));

  const allValues = [...chartData.map(d => d.strategy), ...chartData.map(d => d.buyHold)];
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues, 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4 text-purple-500" />
          Benchmark Comparison
        </CardTitle>
        <CardDescription>Strategy vs. Buy & Hold performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className={cn(
              "p-3 rounded-lg border text-center",
              benchmark.strategyReturn >= 0 
                ? "border-trading-profit/30 bg-trading-profit/5" 
                : "border-trading-loss/30 bg-trading-loss/5"
            )}>
              <p className="text-xs text-muted-foreground">Strategy Return</p>
              <p className={cn(
                "text-xl font-bold",
                benchmark.strategyReturn >= 0 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {benchmark.strategyReturn >= 0 ? '+' : ''}{benchmark.strategyReturn.toFixed(2)}%
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border text-center",
              benchmark.buyHoldReturn >= 0 
                ? "border-blue-500/30 bg-blue-500/5" 
                : "border-trading-loss/30 bg-trading-loss/5"
            )}>
              <p className="text-xs text-muted-foreground">Buy & Hold Return</p>
              <p className={cn(
                "text-xl font-bold",
                benchmark.buyHoldReturn >= 0 ? "text-blue-500" : "text-trading-loss"
              )}>
                {benchmark.buyHoldReturn >= 0 ? '+' : ''}{benchmark.buyHoldReturn.toFixed(2)}%
              </p>
            </div>
            <div className={cn(
              "p-3 rounded-lg border text-center",
              benchmark.alpha >= 0 
                ? "border-trading-profit/30 bg-trading-profit/5" 
                : "border-trading-loss/30 bg-trading-loss/5"
            )}>
              <p className="text-xs text-muted-foreground">Alpha (Excess Return)</p>
              <p className={cn(
                "text-xl font-bold",
                benchmark.alpha >= 0 ? "text-trading-profit" : "text-trading-loss"
              )}>
                {benchmark.alpha >= 0 ? '+' : ''}{benchmark.alpha.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Comparison Chart */}
          {chartData.length > 1 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="strategyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(142, 76%, 45%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="buyHoldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
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
                    domain={[Math.floor(minValue * 1.1), Math.ceil(maxValue * 1.1)]}
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
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(2)}%`, 
                      name === 'strategy' ? 'Strategy' : 'Buy & Hold'
                    ]}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
                  <Area
                    type="monotone"
                    dataKey="buyHold"
                    stroke="hsl(217, 91%, 60%)"
                    strokeWidth={2}
                    fill="url(#buyHoldGradient)"
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="strategy"
                    stroke="hsl(142, 76%, 45%)"
                    strokeWidth={2}
                    fill="url(#strategyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-trading-profit" />
              <span className="text-muted-foreground">Strategy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed' }} />
              <span className="text-muted-foreground">Buy & Hold</span>
            </div>
          </div>

          {/* Insight */}
          <div className="text-xs text-muted-foreground bg-secondary/20 rounded-lg p-3">
            {benchmark.outperformance ? (
              <p>
                <strong className="text-trading-profit">Strategy outperforms:</strong> Your trading strategy 
                generated {benchmark.alpha.toFixed(2)}% more return than simply holding the assets. 
                This alpha suggests the strategy adds value through active trading decisions.
              </p>
            ) : (
              <p>
                <strong className="text-trading-loss">Strategy underperforms:</strong> Buy-and-hold 
                would have returned {Math.abs(benchmark.alpha).toFixed(2)}% more. Consider whether 
                the trading costs and complexity justify active management, or adjust strategy parameters.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
