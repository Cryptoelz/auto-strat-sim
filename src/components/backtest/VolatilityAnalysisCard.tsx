import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Gauge, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import type { BacktestTrade } from '@/hooks/useBacktest';

interface VolatilityAnalysisCardProps {
  trades: BacktestTrade[];
}

type VolatilityLevel = 'low' | 'medium' | 'high';

interface VolatilityStats {
  level: VolatilityLevel;
  tradeCount: number;
  winRate: number;
  avgReturn: number;
  avgVolatility: number;
  totalPnl: number;
  sharpeProxy: number;
}

interface VolatilityMetrics {
  overallVolatility: number;
  volatilityStats: VolatilityStats[];
  scatterData: { volatility: number; returnPercent: number; type: 'win' | 'loss'; asset: string }[];
  correlation: number;
  bestVolatilityLevel: VolatilityLevel;
  currentVolatility: VolatilityLevel;
  volatilityAdjustedReturn: number;
}

export function VolatilityAnalysisCard({ trades }: VolatilityAnalysisCardProps) {
  const metrics = useMemo((): VolatilityMetrics | null => {
    if (trades.length < 5) return null;

    // Calculate volatility for each trade (price range during trade)
    const tradeData = trades.map(trade => {
      // Use price change as proxy for volatility during trade
      const priceChange = Math.abs((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
      const returnPercent = (trade.pnl / (trade.entryPrice * trade.size)) * 100;
      
      return {
        trade,
        volatility: priceChange,
        returnPercent,
        type: trade.type,
        asset: trade.asset,
      };
    });

    const volatilities = tradeData.map(t => t.volatility);
    const returns = tradeData.map(t => t.returnPercent);

    // Calculate overall volatility stats
    const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
    const volStdDev = Math.sqrt(
      volatilities.reduce((sum, v) => sum + Math.pow(v - avgVolatility, 2), 0) / volatilities.length
    );

    // Classify volatility levels using percentiles
    const sortedVols = [...volatilities].sort((a, b) => a - b);
    const lowThreshold = sortedVols[Math.floor(sortedVols.length * 0.33)];
    const highThreshold = sortedVols[Math.floor(sortedVols.length * 0.66)];

    const classifyVolatility = (vol: number): VolatilityLevel => {
      if (vol <= lowThreshold) return 'low';
      if (vol >= highThreshold) return 'high';
      return 'medium';
    };

    // Calculate stats for each volatility level
    const levels: VolatilityLevel[] = ['low', 'medium', 'high'];
    const volatilityStats: VolatilityStats[] = levels.map(level => {
      const levelTrades = tradeData.filter(t => classifyVolatility(t.volatility) === level);
      
      if (levelTrades.length === 0) {
        return {
          level,
          tradeCount: 0,
          winRate: 0,
          avgReturn: 0,
          avgVolatility: 0,
          totalPnl: 0,
          sharpeProxy: 0,
        };
      }

      const wins = levelTrades.filter(t => t.type === 'win').length;
      const avgReturn = levelTrades.reduce((sum, t) => sum + t.returnPercent, 0) / levelTrades.length;
      const levelAvgVol = levelTrades.reduce((sum, t) => sum + t.volatility, 0) / levelTrades.length;
      const totalPnl = levelTrades.reduce((sum, t) => sum + t.trade.pnl, 0);
      
      // Calculate return std dev for Sharpe proxy
      const returnStdDev = Math.sqrt(
        levelTrades.reduce((sum, t) => sum + Math.pow(t.returnPercent - avgReturn, 2), 0) / levelTrades.length
      );
      const sharpeProxy = returnStdDev > 0 ? avgReturn / returnStdDev : 0;

      return {
        level,
        tradeCount: levelTrades.length,
        winRate: (wins / levelTrades.length) * 100,
        avgReturn,
        avgVolatility: levelAvgVol,
        totalPnl,
        sharpeProxy,
      };
    });

    // Calculate correlation between volatility and returns
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );

    let correlation = 0;
    if (volStdDev > 0 && returnStdDev > 0) {
      const covariance = tradeData.reduce((sum, t, i) => 
        sum + (volatilities[i] - avgVolatility) * (returns[i] - avgReturn), 0
      ) / trades.length;
      correlation = covariance / (volStdDev * returnStdDev);
    }

    // Find best volatility level
    const activeStats = volatilityStats.filter(s => s.tradeCount > 0);
    const bestVolatilityLevel = activeStats.length > 0
      ? activeStats.reduce((best, s) => s.avgReturn > best.avgReturn ? s : best).level
      : 'medium';

    // Current volatility (based on recent trades)
    const recentVols = volatilities.slice(-5);
    const recentAvgVol = recentVols.reduce((sum, v) => sum + v, 0) / recentVols.length;
    const currentVolatility = classifyVolatility(recentAvgVol);

    // Volatility-adjusted return (similar to Sharpe)
    const volatilityAdjustedReturn = avgVolatility > 0 ? avgReturn / avgVolatility : 0;

    return {
      overallVolatility: avgVolatility,
      volatilityStats,
      scatterData: tradeData.map(t => ({
        volatility: t.volatility,
        returnPercent: t.returnPercent,
        type: t.type,
        asset: t.asset,
      })),
      correlation,
      bestVolatilityLevel,
      currentVolatility,
      volatilityAdjustedReturn,
    };
  }, [trades]);

  if (!metrics) return null;

  const getVolatilityColor = (level: VolatilityLevel) => {
    switch (level) {
      case 'low': return 'text-blue-500';
      case 'medium': return 'text-yellow-500';
      case 'high': return 'text-red-500';
    }
  };

  const getVolatilityBg = (level: VolatilityLevel) => {
    switch (level) {
      case 'low': return 'bg-blue-500/20 border-blue-500/30';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 border-red-500/30';
    }
  };

  const getVolatilityFill = (level: VolatilityLevel) => {
    switch (level) {
      case 'low': return 'hsl(217, 91%, 60%)';
      case 'medium': return 'hsl(45, 93%, 47%)';
      case 'high': return 'hsl(0, 84%, 60%)';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const chartConfig = {
    return: { label: 'Return %', color: 'hsl(var(--chart-1))' },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gauge className="h-5 w-5" />
          Volatility-Adjusted Returns
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Analyzes how strategy performance varies with market volatility. Helps identify optimal trading conditions.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Volatility & Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`rounded-lg border p-3 ${getVolatilityBg(metrics.currentVolatility)}`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className={`h-4 w-4 ${getVolatilityColor(metrics.currentVolatility)}`} />
              <span className="text-sm text-muted-foreground">Current</span>
            </div>
            <p className={`text-lg font-bold capitalize ${getVolatilityColor(metrics.currentVolatility)}`}>
              {metrics.currentVolatility}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground mb-1">Avg Volatility</p>
            <p className="text-lg font-bold">{metrics.overallVolatility.toFixed(2)}%</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground mb-1">Vol-Return Corr</p>
            <p className={`text-lg font-bold ${Math.abs(metrics.correlation) > 0.3 ? 'text-primary' : 'text-muted-foreground'}`}>
              {metrics.correlation.toFixed(3)}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground mb-1">Vol-Adjusted Return</p>
            <p className={`text-lg font-bold ${metrics.volatilityAdjustedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.volatilityAdjustedReturn.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="h-[220px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                <XAxis 
                  type="number" 
                  dataKey="volatility" 
                  name="Volatility"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  label={{ value: 'Volatility %', position: 'bottom', offset: 20 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="returnPercent" 
                  name="Return"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                  label={{ value: 'Return %', angle: -90, position: 'insideLeft', offset: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name, props) => {
                        const data = props.payload;
                        return (
                          <div className="space-y-1">
                            <p className="font-semibold">{data.asset}</p>
                            <p>Volatility: {data.volatility.toFixed(2)}%</p>
                            <p className={data.type === 'win' ? 'text-green-500' : 'text-red-500'}>
                              Return: {data.returnPercent >= 0 ? '+' : ''}{data.returnPercent.toFixed(2)}%
                            </p>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Scatter data={metrics.scatterData} fill="hsl(var(--chart-1))">
                  {metrics.scatterData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'win' ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} 
                      opacity={0.7}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Volatility Level Breakdown */}
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.volatilityStats.map(stat => (
            <div 
              key={stat.level} 
              className={`rounded-lg border p-3 ${stat.level === metrics.bestVolatilityLevel ? 'ring-2 ring-green-500/50' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium capitalize ${getVolatilityColor(stat.level)}`}>
                  {stat.level} Volatility
                </span>
                {stat.level === metrics.bestVolatilityLevel && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-500">Best</span>
                )}
              </div>
              
              {stat.tradeCount > 0 ? (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trades</span>
                    <span className="font-medium">{stat.tradeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className={`font-medium ${stat.winRate >= 50 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Return</span>
                    <span className={`font-medium ${stat.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sharpe Proxy</span>
                    <span className="font-medium">{stat.sharpeProxy.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trades</p>
              )}
            </div>
          ))}
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.correlation > 0.2 ? (
            <p>Positive correlation: Higher volatility tends to produce better returns. Strategy may benefit from trending/volatile markets. Consider increasing exposure during high volatility periods.</p>
          ) : metrics.correlation < -0.2 ? (
            <p>Negative correlation: Lower volatility produces better returns. Strategy works best in calm markets. Consider reducing size or avoiding trades during high volatility.</p>
          ) : (
            <p>
              No strong correlation between volatility and returns. Best performance in {metrics.bestVolatilityLevel} volatility conditions 
              ({metrics.volatilityStats.find(s => s.level === metrics.bestVolatilityLevel)?.avgReturn.toFixed(2)}% avg return).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
