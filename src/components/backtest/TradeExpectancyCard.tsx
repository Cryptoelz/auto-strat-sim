import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Calculator, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface TradeExpectancyCardProps {
  trades: BacktestTrade[];
}

interface ExpectancyMetrics {
  expectancy: number;
  expectancyPercent: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
  rewardToRisk: number;
  totalTrades: number;
  projectedPnl100: number;
  projectedPnl500: number;
}

export function TradeExpectancyCard({ trades }: TradeExpectancyCardProps) {
  const metrics = useMemo((): ExpectancyMetrics | null => {
    if (trades.length < 5) return null;

    const winningTrades = trades.filter(t => t.type === 'win');
    const losingTrades = trades.filter(t => t.type === 'loss');

    const winRate = winningTrades.length / trades.length;
    const lossRate = losingTrades.length / trades.length;

    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0;

    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
      : 0;

    // Calculate percentage-based metrics
    const avgWinPercent = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => {
          return sum + (t.pnl / (t.entryPrice * t.size)) * 100;
        }, 0) / winningTrades.length
      : 0;

    const avgLossPercent = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => {
          return sum + (t.pnl / (t.entryPrice * t.size)) * 100;
        }, 0) / losingTrades.length)
      : 0;

    // Expectancy formula: (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);
    const expectancyPercent = (winRate * avgWinPercent) - (lossRate * avgLossPercent);

    const rewardToRisk = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      expectancy,
      expectancyPercent,
      winRate: winRate * 100,
      lossRate: lossRate * 100,
      avgWin,
      avgLoss,
      avgWinPercent,
      avgLossPercent,
      rewardToRisk,
      totalTrades: trades.length,
      projectedPnl100: expectancy * 100,
      projectedPnl500: expectancy * 500,
    };
  }, [trades]);

  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getExpectancyQuality = (exp: number) => {
    if (exp > 50) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (exp > 20) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-400/20' };
    if (exp > 0) return { label: 'Positive', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (exp === 0) return { label: 'Breakeven', color: 'text-muted-foreground', bg: 'bg-muted' };
    return { label: 'Negative', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  const quality = getExpectancyQuality(metrics.expectancy);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="h-5 w-5" />
          Trade Expectancy
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Expectancy = (Win Rate × Avg Win) - (Loss Rate × Avg Loss). This shows the expected profit per trade based on historical performance.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Expectancy Display */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-muted-foreground">Expected Value Per Trade</p>
              <p className={`text-3xl font-bold ${quality.color}`}>
                {metrics.expectancy >= 0 ? '+' : ''}{formatCurrency(metrics.expectancy)}
              </p>
              <p className={`text-sm ${quality.color}`}>
                ({metrics.expectancyPercent >= 0 ? '+' : ''}{metrics.expectancyPercent.toFixed(2)}%)
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${quality.bg} ${quality.color}`}>
              {quality.label}
            </div>
          </div>
        </div>

        {/* Expectancy Formula Breakdown */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Expectancy Formula</p>
          <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
            <span className="px-2 py-1 rounded bg-green-500/20 text-green-500">
              {metrics.winRate.toFixed(1)}% × {formatCurrency(metrics.avgWin)}
            </span>
            <span className="text-muted-foreground">−</span>
            <span className="px-2 py-1 rounded bg-red-500/20 text-red-500">
              {metrics.lossRate.toFixed(1)}% × {formatCurrency(metrics.avgLoss)}
            </span>
            <span className="text-muted-foreground">=</span>
            <span className={`px-2 py-1 rounded font-semibold ${quality.bg} ${quality.color}`}>
              {formatCurrency(metrics.expectancy)}
            </span>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Winning Trades</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-medium text-green-500">{metrics.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Win</span>
                <span className="font-medium">{formatCurrency(metrics.avgWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Win %</span>
                <span className="font-medium">+{metrics.avgWinPercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Losing Trades</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loss Rate</span>
                <span className="font-medium text-red-500">{metrics.lossRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Loss</span>
                <span className="font-medium">{formatCurrency(metrics.avgLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Loss %</span>
                <span className="font-medium">-{metrics.avgLossPercent.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Ratios */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Reward-to-Risk Ratio</p>
            <p className="font-semibold text-lg">{metrics.rewardToRisk.toFixed(2)}:1</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Trades Analyzed</p>
            <p className="font-semibold text-lg">{metrics.totalTrades}</p>
          </div>
        </div>

        {/* Projections */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Projected Returns (if expectancy holds)</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Next 100 Trades</p>
              <p className={`font-semibold ${metrics.projectedPnl100 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.projectedPnl100 >= 0 ? '+' : ''}{formatCurrency(metrics.projectedPnl100)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Next 500 Trades</p>
              <p className={`font-semibold ${metrics.projectedPnl500 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.projectedPnl500 >= 0 ? '+' : ''}{formatCurrency(metrics.projectedPnl500)}
              </p>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.expectancy > 0 ? (
            <p>
              Positive expectancy of {formatCurrency(metrics.expectancy)} per trade. 
              {metrics.rewardToRisk >= 2 
                ? " Strong reward-to-risk ratio supports the strategy even with lower win rates."
                : metrics.winRate > 55
                  ? " High win rate compensates for moderate reward-to-risk ratio."
                  : " Consider improving either win rate or reward-to-risk to increase edge."}
            </p>
          ) : (
            <p>⚠️ Negative expectancy indicates expected losses over time. Review entry criteria, stop-loss placement, or profit targets to improve edge.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
