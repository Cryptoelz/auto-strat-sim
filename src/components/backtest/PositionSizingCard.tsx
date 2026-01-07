import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, TrendingUp, TrendingDown, AlertTriangle, Target, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';

interface Trade {
  pnl: number;
  pnlPercent: number;
}

interface PositionSizingCardProps {
  trades: Trade[];
  initialBalance: number;
  currentPositionSize: number;
}

interface ScenarioResult {
  positionSize: number;
  finalBalance: number;
  totalReturn: number;
  maxDrawdown: number;
  riskAdjustedReturn: number;
  ruinProbability: number;
  volatility: number;
}

export function PositionSizingCard({ trades, initialBalance, currentPositionSize }: PositionSizingCardProps) {
  if (trades.length < 5) return null;

  // Calculate base trade statistics
  const winRate = trades.filter(t => t.pnl > 0).length / trades.length;
  const avgWinPercent = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / 
    Math.max(1, trades.filter(t => t.pnl > 0).length);
  const avgLossPercent = trades.filter(t => t.pnl <= 0).reduce((sum, t) => sum + Math.abs(t.pnlPercent), 0) / 
    Math.max(1, trades.filter(t => t.pnl <= 0).length);

  // Simulate different position sizes
  const positionSizes = [1, 2, 3, 5, 7, 10, 15, 20, 25, 30];
  
  const simulateScenario = (positionSizePercent: number): ScenarioResult => {
    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    const returns: number[] = [];
    
    trades.forEach(trade => {
      // Scale the trade PnL by position size ratio
      const scaledPnlPercent = (trade.pnlPercent / currentPositionSize) * positionSizePercent;
      const tradePnl = balance * (scaledPnlPercent / 100);
      
      balance += tradePnl;
      returns.push(scaledPnlPercent);
      
      if (balance > peak) peak = balance;
      const drawdown = ((peak - balance) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const totalReturn = ((balance - initialBalance) / initialBalance) * 100;
    const volatility = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - (totalReturn / trades.length), 2), 0) / returns.length
    );
    
    // Risk-adjusted return (simplified Sharpe-like ratio)
    const riskAdjustedReturn = volatility > 0 ? totalReturn / volatility : 0;
    
    // Simplified ruin probability based on Kelly Criterion
    const kellyFraction = winRate - ((1 - winRate) / (avgWinPercent / avgLossPercent));
    const overBet = positionSizePercent / 100 > kellyFraction * 2;
    const ruinProbability = overBet ? Math.min(95, positionSizePercent * 3) : Math.min(50, positionSizePercent);

    return {
      positionSize: positionSizePercent,
      finalBalance: Math.max(0, balance),
      totalReturn,
      maxDrawdown,
      riskAdjustedReturn,
      ruinProbability,
      volatility,
    };
  };

  const scenarios = positionSizes.map(simulateScenario);
  
  // Find optimal position size (best risk-adjusted return with acceptable drawdown)
  const acceptableScenarios = scenarios.filter(s => s.maxDrawdown < 30 && s.ruinProbability < 20);
  const optimalScenario = acceptableScenarios.length > 0
    ? acceptableScenarios.reduce((best, curr) => 
        curr.riskAdjustedReturn > best.riskAdjustedReturn ? curr : best
      )
    : scenarios[0];

  // Current scenario
  const currentScenario = simulateScenario(currentPositionSize);

  // Kelly Criterion calculation
  const kellyOptimal = Math.max(0, (winRate * avgWinPercent - (1 - winRate) * avgLossPercent) / avgWinPercent);
  const halfKelly = kellyOptimal / 2;
  const quarterKelly = kellyOptimal / 4;

  // Chart data for equity curves
  const equityCurveData = trades.map((_, idx) => {
    const dataPoint: Record<string, number> = { trade: idx + 1 };
    
    [currentPositionSize, optimalScenario.positionSize, 10, 20].forEach(size => {
      let balance = initialBalance;
      for (let i = 0; i <= idx; i++) {
        const scaledPnlPercent = (trades[i].pnlPercent / currentPositionSize) * size;
        balance += balance * (scaledPnlPercent / 100);
      }
      dataPoint[`size_${size}`] = balance;
    });
    
    return dataPoint;
  });

  // Risk/Return chart data
  const riskReturnData = scenarios.map(s => ({
    ...s,
    label: `${s.positionSize}%`,
  }));

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Position Sizing Analysis
            </CardTitle>
            <CardDescription>
              Risk-reward scenarios for different position sizes
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            Current: {currentPositionSize}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Kelly Criterion */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Full Kelly</span>
            </div>
            <p className="text-lg font-bold text-primary">{(kellyOptimal * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Theoretical max</p>
          </div>
          
          <div className="p-3 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="h-3 w-3 text-trading-profit" />
              <span className="text-xs text-muted-foreground">Half Kelly</span>
            </div>
            <p className="text-lg font-bold text-trading-profit">{(halfKelly * 100).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Recommended</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Scale className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Optimal Found</span>
            </div>
            <p className="text-lg font-bold">{optimalScenario.positionSize}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Best risk-adjusted</p>
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border",
            currentPositionSize > halfKelly * 100 
              ? "bg-yellow-500/10 border-yellow-500/20" 
              : "bg-secondary border-border"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={cn(
                "h-3 w-3",
                currentPositionSize > halfKelly * 100 ? "text-yellow-500" : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">Current Size</span>
            </div>
            <p className="text-lg font-bold">{currentPositionSize}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentPositionSize > halfKelly * 100 ? "Above optimal" : "Conservative"}
            </p>
          </div>
        </div>

        {/* Equity Curves Comparison */}
        <div>
          <h4 className="text-sm font-medium mb-3">Equity Curve Comparison</h4>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={equityCurveData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="trade" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  label={{ value: 'Trade #', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => {
                    const size = name.replace('size_', '');
                    return [`$${value.toFixed(0)}`, `${size}% Position`];
                  }}
                />
                <Legend 
                  formatter={(value) => `${value.replace('size_', '')}%`}
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey={`size_${currentPositionSize}`} 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name={`size_${currentPositionSize}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={`size_${optimalScenario.positionSize}`} 
                  stroke="hsl(142, 76%, 45%)" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray={optimalScenario.positionSize === currentPositionSize ? "0" : "5 5"}
                  name={`size_${optimalScenario.positionSize}`}
                />
                {currentPositionSize !== 10 && optimalScenario.positionSize !== 10 && (
                  <Line 
                    type="monotone" 
                    dataKey="size_10" 
                    stroke="hsl(45, 93%, 47%)" 
                    strokeWidth={1}
                    dot={false}
                    opacity={0.6}
                    name="size_10"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk vs Return Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Risk vs Return by Position Size</h4>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskReturnData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  width={40}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'totalReturn' ? 'Return' : 'Max Drawdown'
                  ]}
                />
                <ReferenceLine 
                  y={currentScenario.totalReturn} 
                  yAxisId="left"
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />
                <Bar yAxisId="left" dataKey="totalReturn" name="totalReturn" radius={[2, 2, 0, 0]}>
                  {riskReturnData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={entry.positionSize === currentPositionSize 
                        ? 'hsl(var(--primary))' 
                        : entry.positionSize === optimalScenario.positionSize
                          ? 'hsl(142, 76%, 45%)'
                          : entry.totalReturn >= 0 
                            ? 'hsl(142, 76%, 45%)' 
                            : 'hsl(0, 84%, 60%)'
                      }
                      fillOpacity={entry.positionSize === currentPositionSize || entry.positionSize === optimalScenario.positionSize ? 1 : 0.4}
                    />
                  ))}
                </Bar>
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="maxDrawdown" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(0, 84%, 60%)', r: 3 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Bars = Total Return | Line = Max Drawdown
          </p>
        </div>

        {/* Scenario Comparison Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Scenario Comparison</h4>
          <div className="grid grid-cols-5 gap-2 text-xs">
            <div className="font-medium text-muted-foreground">Size</div>
            <div className="font-medium text-muted-foreground">Return</div>
            <div className="font-medium text-muted-foreground">Max DD</div>
            <div className="font-medium text-muted-foreground">Risk-Adj</div>
            <div className="font-medium text-muted-foreground">Ruin %</div>
            
            {scenarios.filter((_, i) => i % 2 === 0 || scenarios[i].positionSize === currentPositionSize || scenarios[i].positionSize === optimalScenario.positionSize).slice(0, 6).map(s => (
              <>
                <div key={`size-${s.positionSize}`} className={cn(
                  "font-medium",
                  s.positionSize === currentPositionSize && "text-primary",
                  s.positionSize === optimalScenario.positionSize && "text-trading-profit"
                )}>
                  {s.positionSize}%
                  {s.positionSize === currentPositionSize && " ●"}
                  {s.positionSize === optimalScenario.positionSize && s.positionSize !== currentPositionSize && " ★"}
                </div>
                <div key={`return-${s.positionSize}`} className={s.totalReturn >= 0 ? "text-trading-profit" : "text-trading-loss"}>
                  {s.totalReturn >= 0 ? '+' : ''}{s.totalReturn.toFixed(1)}%
                </div>
                <div key={`dd-${s.positionSize}`} className={s.maxDrawdown > 25 ? "text-trading-loss" : "text-muted-foreground"}>
                  -{s.maxDrawdown.toFixed(1)}%
                </div>
                <div key={`risk-${s.positionSize}`}>{s.riskAdjustedReturn.toFixed(2)}</div>
                <div key={`ruin-${s.positionSize}`} className={s.ruinProbability > 15 ? "text-trading-loss" : "text-muted-foreground"}>
                  {s.ruinProbability.toFixed(0)}%
                </div>
              </>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ● Current position size | ★ Optimal position size
          </p>
        </div>

        {/* Recommendations */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            {currentPositionSize > optimalScenario.positionSize && (
              <p className="flex items-start gap-2">
                <TrendingDown className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  Consider reducing position size from {currentPositionSize}% to {optimalScenario.positionSize}% 
                  for better risk-adjusted returns ({optimalScenario.riskAdjustedReturn.toFixed(2)} vs {currentScenario.riskAdjustedReturn.toFixed(2)}).
                </span>
              </p>
            )}
            {currentPositionSize < optimalScenario.positionSize && (
              <p className="flex items-start gap-2">
                <TrendingUp className="h-3 w-3 text-trading-profit mt-0.5 shrink-0" />
                <span>
                  You could increase position size to {optimalScenario.positionSize}% for potentially higher returns 
                  while maintaining acceptable risk levels.
                </span>
              </p>
            )}
            {currentScenario.maxDrawdown > 25 && (
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-trading-loss mt-0.5 shrink-0" />
                <span>
                  Current max drawdown of {currentScenario.maxDrawdown.toFixed(1)}% is high. 
                  Consider reducing position size to limit potential losses.
                </span>
              </p>
            )}
            <p className="flex items-start gap-2">
              <Target className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span>
                Half-Kelly criterion suggests {(halfKelly * 100).toFixed(1)}% as a balanced position size 
                that optimizes growth while limiting volatility.
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
