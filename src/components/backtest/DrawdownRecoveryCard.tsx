import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
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
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface Trade {
  entryTime: number;
  exitTime: number;
  pnl: number;
  pnlPercent: number;
}

interface DrawdownRecoveryCardProps {
  trades: Trade[];
  initialBalance: number;
}

interface DrawdownEvent {
  startIdx: number;
  endIdx: number;
  recoveryIdx: number | null;
  peakBalance: number;
  troughBalance: number;
  drawdownPercent: number;
  drawdownTrades: number;
  recoveryTrades: number | null;
  startTime: number;
  troughTime: number;
  recoveryTime: number | null;
  drawdownDuration: number;
  recoveryDuration: number | null;
  totalDuration: number | null;
  recovered: boolean;
}

export function DrawdownRecoveryCard({ trades, initialBalance }: DrawdownRecoveryCardProps) {
  if (trades.length < 5) return null;

  // Build equity curve
  const equityCurve: { balance: number; time: number; tradeIdx: number }[] = [];
  let balance = initialBalance;
  
  trades.forEach((trade, idx) => {
    balance += trade.pnl;
    equityCurve.push({
      balance,
      time: trade.exitTime,
      tradeIdx: idx,
    });
  });

  // Find all drawdown events
  const drawdownEvents: DrawdownEvent[] = [];
  let peak = initialBalance;
  let peakIdx = -1;
  let peakTime = trades[0]?.entryTime || 0;
  let inDrawdown = false;
  let currentDrawdown: Partial<DrawdownEvent> = {};

  equityCurve.forEach((point, idx) => {
    if (point.balance >= peak) {
      // New peak - check if we were in a drawdown
      if (inDrawdown && currentDrawdown.startIdx !== undefined) {
        currentDrawdown.recoveryIdx = idx;
        currentDrawdown.recoveryTime = point.time;
        currentDrawdown.recoveryTrades = idx - (currentDrawdown.endIdx || 0);
        currentDrawdown.recoveryDuration = point.time - (currentDrawdown.troughTime || 0);
        currentDrawdown.totalDuration = point.time - (currentDrawdown.startTime || 0);
        currentDrawdown.recovered = true;
        drawdownEvents.push(currentDrawdown as DrawdownEvent);
        inDrawdown = false;
        currentDrawdown = {};
      }
      peak = point.balance;
      peakIdx = idx;
      peakTime = point.time;
    } else {
      const drawdownPercent = ((peak - point.balance) / peak) * 100;
      
      if (!inDrawdown && drawdownPercent >= 1) {
        // Start new drawdown
        inDrawdown = true;
        currentDrawdown = {
          startIdx: peakIdx,
          peakBalance: peak,
          troughBalance: point.balance,
          drawdownPercent,
          startTime: peakTime,
          troughTime: point.time,
          endIdx: idx,
          drawdownTrades: idx - peakIdx,
          drawdownDuration: point.time - peakTime,
          recovered: false,
        };
      } else if (inDrawdown) {
        // Update trough if deeper
        if (point.balance < (currentDrawdown.troughBalance || Infinity)) {
          currentDrawdown.troughBalance = point.balance;
          currentDrawdown.drawdownPercent = drawdownPercent;
          currentDrawdown.troughTime = point.time;
          currentDrawdown.endIdx = idx;
          currentDrawdown.drawdownTrades = idx - (currentDrawdown.startIdx || 0);
          currentDrawdown.drawdownDuration = point.time - (currentDrawdown.startTime || 0);
        }
      }
    }
  });

  // Handle ongoing drawdown
  if (inDrawdown && currentDrawdown.startIdx !== undefined) {
    currentDrawdown.recoveryIdx = null;
    currentDrawdown.recoveryTime = null;
    currentDrawdown.recoveryTrades = null;
    currentDrawdown.recoveryDuration = null;
    currentDrawdown.totalDuration = null;
    currentDrawdown.recovered = false;
    drawdownEvents.push(currentDrawdown as DrawdownEvent);
  }

  // Filter significant drawdowns (> 2%)
  const significantDrawdowns = drawdownEvents.filter(d => d.drawdownPercent >= 2);
  const recoveredDrawdowns = significantDrawdowns.filter(d => d.recovered);

  // Calculate statistics
  const avgDrawdownPercent = significantDrawdowns.length > 0
    ? significantDrawdowns.reduce((sum, d) => sum + d.drawdownPercent, 0) / significantDrawdowns.length
    : 0;
  
  const avgRecoveryTrades = recoveredDrawdowns.length > 0
    ? recoveredDrawdowns.reduce((sum, d) => sum + (d.recoveryTrades || 0), 0) / recoveredDrawdowns.length
    : 0;

  const avgDrawdownTrades = significantDrawdowns.length > 0
    ? significantDrawdowns.reduce((sum, d) => sum + d.drawdownTrades, 0) / significantDrawdowns.length
    : 0;

  const recoveryRate = significantDrawdowns.length > 0
    ? (recoveredDrawdowns.length / significantDrawdowns.length) * 100
    : 100;

  const maxDrawdown = significantDrawdowns.length > 0
    ? Math.max(...significantDrawdowns.map(d => d.drawdownPercent))
    : 0;

  const longestRecovery = recoveredDrawdowns.length > 0
    ? Math.max(...recoveredDrawdowns.map(d => d.recoveryTrades || 0))
    : 0;

  // Recovery ratio (trades to recover vs trades to drawdown)
  const avgRecoveryRatio = recoveredDrawdowns.length > 0 && avgDrawdownTrades > 0
    ? avgRecoveryTrades / avgDrawdownTrades
    : 0;

  // Chart data - Drawdown depth over time
  const drawdownChartData = equityCurve.map((point, idx) => {
    let currentPeak = initialBalance;
    for (let i = 0; i <= idx; i++) {
      if (equityCurve[i].balance > currentPeak) {
        currentPeak = equityCurve[i].balance;
      }
    }
    const dd = ((currentPeak - point.balance) / currentPeak) * 100;
    return {
      trade: idx + 1,
      drawdown: -dd,
      balance: point.balance,
    };
  });

  // Recovery time distribution
  const recoveryBuckets = [
    { label: '1-3', min: 1, max: 3, count: 0 },
    { label: '4-6', min: 4, max: 6, count: 0 },
    { label: '7-10', min: 7, max: 10, count: 0 },
    { label: '11-15', min: 11, max: 15, count: 0 },
    { label: '16+', min: 16, max: Infinity, count: 0 },
  ];

  recoveredDrawdowns.forEach(d => {
    const trades = d.recoveryTrades || 0;
    const bucket = recoveryBuckets.find(b => trades >= b.min && trades <= b.max);
    if (bucket) bucket.count++;
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur col-span-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Drawdown Recovery Analysis
            </CardTitle>
            <CardDescription>
              How long it takes to recover from losses
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {significantDrawdowns.length} drawdown events
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-trading-loss/10 border border-trading-loss/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-trading-loss" />
              <span className="text-xs text-muted-foreground">Max Drawdown</span>
            </div>
            <p className="text-lg font-bold text-trading-loss">-{maxDrawdown.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Worst decline</p>
          </div>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Recovery</span>
            </div>
            <p className="text-lg font-bold text-primary">{avgRecoveryTrades.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Trades to recover</p>
          </div>
          
          <div className="p-3 rounded-lg bg-trading-profit/10 border border-trading-profit/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-3 w-3 text-trading-profit" />
              <span className="text-xs text-muted-foreground">Recovery Rate</span>
            </div>
            <p className="text-lg font-bold text-trading-profit">{recoveryRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Drawdowns recovered</p>
          </div>
          
          <div className="p-3 rounded-lg bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Recovery Ratio</span>
            </div>
            <p className="text-lg font-bold">{avgRecoveryRatio.toFixed(1)}x</p>
            <p className="text-xs text-muted-foreground mt-0.5">vs drawdown time</p>
          </div>
        </div>

        {/* Drawdown Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Drawdown Over Time</h4>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={drawdownChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="drawdownRecoveryGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="trade" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  label={{ value: 'Trade #', position: 'bottom', offset: -5, fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  domain={[Math.floor(-maxDrawdown * 1.2), 0]}
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
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                  labelFormatter={(label) => `Trade #${label}`}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.5} />
                <ReferenceLine 
                  y={-maxDrawdown} 
                  stroke="hsl(0, 84%, 50%)" 
                  strokeDasharray="5 5"
                  strokeOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={1.5}
                  fill="url(#drawdownRecoveryGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recovery Time Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">Recovery Time Distribution (Trades)</h4>
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recoveryBuckets} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: number) => [value, 'Recoveries']}
                  labelFormatter={(label) => `${label} trades to recover`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {recoveryBuckets.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={index < 2 ? 'hsl(142, 76%, 45%)' : index < 4 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)'}
                      fillOpacity={0.7}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drawdown Events Table */}
        {significantDrawdowns.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Significant Drawdown Events</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {significantDrawdowns.slice(0, 8).map((dd, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between",
                    dd.recovered 
                      ? "bg-trading-profit/5 border-trading-profit/20" 
                      : "bg-trading-loss/5 border-trading-loss/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      dd.recovered ? "bg-trading-profit/20 text-trading-profit" : "bg-trading-loss/20 text-trading-loss"
                    )}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        <span className="text-trading-loss">-{dd.drawdownPercent.toFixed(1)}%</span>
                        <span className="text-muted-foreground mx-2">→</span>
                        {dd.recovered ? (
                          <span className="text-trading-profit">Recovered</span>
                        ) : (
                          <span className="text-yellow-500">Ongoing</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dd.drawdownTrades} trades to bottom
                        {dd.recovered && ` • ${dd.recoveryTrades} trades to recover`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${dd.peakBalance.toFixed(0)} → ${dd.troughBalance.toFixed(0)}
                    </p>
                    {dd.recovered && dd.recoveryTrades && dd.drawdownTrades && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px]",
                          dd.recoveryTrades <= dd.drawdownTrades 
                            ? "border-trading-profit/50 text-trading-profit" 
                            : "border-yellow-500/50 text-yellow-500"
                        )}
                      >
                        {(dd.recoveryTrades / dd.drawdownTrades).toFixed(1)}x recovery ratio
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <h4 className="text-sm font-medium mb-2">Recovery Insights</h4>
          <div className="space-y-2 text-xs text-muted-foreground">
            {avgRecoveryRatio <= 1 && recoveredDrawdowns.length > 0 && (
              <p className="flex items-start gap-2">
                <CheckCircle className="h-3 w-3 text-trading-profit mt-0.5 shrink-0" />
                <span>
                  Excellent recovery efficiency! On average, you recover faster ({avgRecoveryTrades.toFixed(1)} trades) 
                  than the time spent in drawdown ({avgDrawdownTrades.toFixed(1)} trades).
                </span>
              </p>
            )}
            {avgRecoveryRatio > 1 && avgRecoveryRatio <= 2 && (
              <p className="flex items-start gap-2">
                <Clock className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  Moderate recovery time. It takes about {avgRecoveryRatio.toFixed(1)}x longer to recover 
                  than to enter a drawdown. Consider tighter risk management.
                </span>
              </p>
            )}
            {avgRecoveryRatio > 2 && (
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-trading-loss mt-0.5 shrink-0" />
                <span>
                  Slow recovery pattern detected. Taking {avgRecoveryRatio.toFixed(1)}x longer to recover 
                  suggests potential issues with position sizing or risk management.
                </span>
              </p>
            )}
            {longestRecovery > 10 && (
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                <span>
                  Longest recovery took {longestRecovery} trades. Extended drawdown periods 
                  can be psychologically challenging and affect trading decisions.
                </span>
              </p>
            )}
            {significantDrawdowns.some(d => !d.recovered) && (
              <p className="flex items-start gap-2">
                <RefreshCw className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <span>
                  There are {significantDrawdowns.filter(d => !d.recovered).length} ongoing drawdown(s) 
                  that haven't fully recovered yet.
                </span>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
