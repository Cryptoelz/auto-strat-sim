import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface MarketRegimeCardProps {
  trades: BacktestTrade[];
}

type RegimeType = 'uptrend' | 'downtrend' | 'ranging';

interface RegimeStats {
  type: RegimeType;
  tradeCount: number;
  winRate: number;
  avgReturn: number;
  totalPnl: number;
  avgDuration: number;
}

interface RegimeMetrics {
  regimes: RegimeStats[];
  tradeRegimes: { trade: BacktestTrade; regime: RegimeType; priceChange: number }[];
  bestRegime: RegimeType;
  worstRegime: RegimeType;
  currentRegime: RegimeType;
}

function classifyRegime(priceChangePercent: number): RegimeType {
  if (priceChangePercent > 2) return 'uptrend';
  if (priceChangePercent < -2) return 'downtrend';
  return 'ranging';
}

export function MarketRegimeCard({ trades }: MarketRegimeCardProps) {
  const metrics = useMemo((): RegimeMetrics | null => {
    if (trades.length < 5) return null;

    // Classify each trade's market regime based on price movement during the trade
    const tradeRegimes = trades.map(trade => {
      const priceChange = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
      // Use absolute price movement to determine regime (not trade direction)
      const absChange = Math.abs(priceChange);
      
      // Look at the magnitude of price movement
      let regime: RegimeType;
      if (absChange > 3) {
        // Strong directional move
        regime = priceChange > 0 ? 'uptrend' : 'downtrend';
      } else if (absChange > 1) {
        // Moderate move - still trending
        regime = priceChange > 0 ? 'uptrend' : 'downtrend';
      } else {
        // Small move - ranging
        regime = 'ranging';
      }

      return { trade, regime, priceChange };
    });

    // Calculate stats for each regime
    const regimeTypes: RegimeType[] = ['uptrend', 'downtrend', 'ranging'];
    const regimes: RegimeStats[] = regimeTypes.map(type => {
      const regimeTrades = tradeRegimes.filter(tr => tr.regime === type);
      
      if (regimeTrades.length === 0) {
        return {
          type,
          tradeCount: 0,
          winRate: 0,
          avgReturn: 0,
          totalPnl: 0,
          avgDuration: 0,
        };
      }

      const wins = regimeTrades.filter(tr => tr.trade.type === 'win').length;
      const totalPnl = regimeTrades.reduce((sum, tr) => sum + tr.trade.pnl, 0);
      const avgReturn = regimeTrades.reduce((sum, tr) => {
        return sum + (tr.trade.pnl / (tr.trade.entryPrice * tr.trade.size)) * 100;
      }, 0) / regimeTrades.length;
      const avgDuration = regimeTrades.reduce((sum, tr) => {
        return sum + (tr.trade.exitTime - tr.trade.entryTime);
      }, 0) / regimeTrades.length / (1000 * 60 * 60); // Convert to hours

      return {
        type,
        tradeCount: regimeTrades.length,
        winRate: (wins / regimeTrades.length) * 100,
        avgReturn,
        totalPnl,
        avgDuration,
      };
    });

    // Find best and worst regimes
    const activeRegimes = regimes.filter(r => r.tradeCount > 0);
    const bestRegime = activeRegimes.length > 0
      ? activeRegimes.reduce((best, r) => r.avgReturn > best.avgReturn ? r : best).type
      : 'ranging';
    const worstRegime = activeRegimes.length > 0
      ? activeRegimes.reduce((worst, r) => r.avgReturn < worst.avgReturn ? r : worst).type
      : 'ranging';

    // Current regime (based on last few trades)
    const recentTrades = tradeRegimes.slice(-5);
    const recentRegimeCounts = { uptrend: 0, downtrend: 0, ranging: 0 };
    recentTrades.forEach(tr => recentRegimeCounts[tr.regime]++);
    const currentRegime = Object.entries(recentRegimeCounts)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as RegimeType;

    return {
      regimes,
      tradeRegimes,
      bestRegime,
      worstRegime,
      currentRegime,
    };
  }, [trades]);

  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const getRegimeIcon = (type: RegimeType) => {
    switch (type) {
      case 'uptrend': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'downtrend': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'ranging': return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRegimeColor = (type: RegimeType) => {
    switch (type) {
      case 'uptrend': return 'hsl(142, 76%, 36%)';
      case 'downtrend': return 'hsl(0, 84%, 60%)';
      case 'ranging': return 'hsl(45, 93%, 47%)';
    }
  };

  const getRegimeBg = (type: RegimeType) => {
    switch (type) {
      case 'uptrend': return 'bg-green-500/20 border-green-500/30';
      case 'downtrend': return 'bg-red-500/20 border-red-500/30';
      case 'ranging': return 'bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const chartData = metrics.regimes.map(r => ({
    name: r.type.charAt(0).toUpperCase() + r.type.slice(1),
    type: r.type,
    winRate: r.winRate,
    avgReturn: r.avgReturn,
    trades: r.tradeCount,
  }));

  const chartConfig = {
    avgReturn: { label: 'Avg Return %', color: 'hsl(var(--chart-1))' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Market Regime Analysis
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Classifies trades by market conditions (trending up, down, or ranging) based on price movement during each trade.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Regime Indicator */}
        <div className={`rounded-lg border p-4 ${getRegimeBg(metrics.currentRegime)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRegimeIcon(metrics.currentRegime)}
              <div>
                <p className="text-sm text-muted-foreground">Current Market Regime</p>
                <p className="text-xl font-bold capitalize">{metrics.currentRegime}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Based on last 5 trades</p>
          </div>
        </div>

        {/* Regime Performance Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.regimes.map(regime => (
            <div 
              key={regime.type} 
              className={`rounded-lg border p-3 ${regime.type === metrics.bestRegime ? 'ring-2 ring-green-500/50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-3">
                {getRegimeIcon(regime.type)}
                <span className="text-sm font-medium capitalize">{regime.type}</span>
                {regime.type === metrics.bestRegime && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">Best</span>
                )}
                {regime.type === metrics.worstRegime && regime.tradeCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-500">Worst</span>
                )}
              </div>
              
              {regime.tradeCount > 0 ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="font-medium">{regime.tradeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className={`font-medium ${regime.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                      {regime.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Return</span>
                    <span className={`font-medium ${regime.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {regime.avgReturn >= 0 ? '+' : ''}{regime.avgReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total P&L</span>
                    <span className={`font-medium ${regime.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(regime.totalPnl)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Duration</span>
                    <span className="font-medium">{formatDuration(regime.avgDuration)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trades in this regime</p>
              )}
            </div>
          ))}
        </div>

        {/* Performance Comparison Chart */}
        <div className="h-[200px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">{data.name}</p>
                            <p>Trades: {data.trades}</p>
                            <p>Win Rate: {data.winRate.toFixed(1)}%</p>
                            <p>Avg Return: {data.avgReturn >= 0 ? '+' : ''}{data.avgReturn.toFixed(2)}%</p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Bar dataKey="avgReturn" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={getRegimeColor(entry.type as RegimeType)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Regime Distribution */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Trade Distribution by Regime</p>
          <div className="flex h-4 rounded-full overflow-hidden">
            {metrics.regimes.map(regime => {
              const percentage = (regime.tradeCount / trades.length) * 100;
              if (percentage === 0) return null;
              return (
                <div
                  key={regime.type}
                  className="h-full transition-all"
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: getRegimeColor(regime.type) 
                  }}
                  title={`${regime.type}: ${percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {metrics.regimes.map(regime => (
              <span key={regime.type} className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: getRegimeColor(regime.type) }}
                />
                {regime.type}: {((regime.tradeCount / trades.length) * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.bestRegime === 'uptrend' ? (
            <p>Strategy performs best in uptrending markets. Consider increasing exposure during bullish conditions and reducing size in ranging or bearish markets.</p>
          ) : metrics.bestRegime === 'downtrend' ? (
            <p>Strategy excels in downtrending markets, possibly due to effective short entries or quick exits. May benefit from bearish bias adjustments.</p>
          ) : (
            <p>Strategy performs well in ranging conditions. Consider mean-reversion entries and tighter profit targets during consolidation periods.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
