import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, TrendingUp, Shield, Target } from 'lucide-react';
import type { BacktestTrade } from '@/hooks/useBacktest';

interface RiskAdjustedReturnsCardProps {
  trades: BacktestTrade[];
  annualRiskFreeRate?: number; // Default 5% annual
}

interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  avgReturn: number;
  stdDev: number;
  downsideDev: number;
  maxDrawdown: number;
  annualizedReturn: number;
  annualizedVolatility: number;
}

export function RiskAdjustedReturnsCard({ 
  trades, 
  annualRiskFreeRate = 5 
}: RiskAdjustedReturnsCardProps) {
  const metrics = useMemo((): RiskMetrics | null => {
    if (trades.length < 5) return null;

    // Calculate returns for each trade
    const returns = trades.map((trade) => {
      return (trade.pnl / (trade.entryPrice * trade.size)) * 100;
    });

    // Calculate average return
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate standard deviation (total volatility)
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    // Calculate downside deviation (only negative returns)
    const negativeReturns = returns.filter(r => r < 0);
    const downsideVariance = negativeReturns.length > 0
      ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / returns.length
      : 0;
    const downsideDev = Math.sqrt(downsideVariance);

    // Calculate max drawdown
    let peak = 100;
    let maxDrawdown = 0;
    let runningValue = 100;

    for (const ret of returns) {
      runningValue *= (1 + ret / 100);
      if (runningValue > peak) {
        peak = runningValue;
      }
      const drawdown = ((peak - runningValue) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Estimate annualization factor based on trade frequency
    const firstTrade = trades[0];
    const lastTrade = trades[trades.length - 1];
    const tradingPeriodDays = (lastTrade.exitTime - firstTrade.entryTime) / (1000 * 60 * 60 * 24);
    const tradesPerYear = tradingPeriodDays > 0 ? (trades.length / tradingPeriodDays) * 365 : 252;

    // Annualized metrics
    const annualizedReturn = avgReturn * tradesPerYear;
    const annualizedVolatility = stdDev * Math.sqrt(tradesPerYear);
    const annualizedDownsideDev = downsideDev * Math.sqrt(tradesPerYear);

    // Risk-free rate per trade
    const riskFreePerTrade = annualRiskFreeRate / tradesPerYear;

    // Sharpe Ratio = (Return - Risk Free Rate) / Std Dev
    const excessReturn = avgReturn - riskFreePerTrade;
    const sharpeRatio = stdDev > 0 ? (excessReturn / stdDev) * Math.sqrt(tradesPerYear) : 0;

    // Sortino Ratio = (Return - Risk Free Rate) / Downside Dev
    const sortinoRatio = downsideDev > 0 ? (excessReturn / downsideDev) * Math.sqrt(tradesPerYear) : 0;

    // Calmar Ratio = Annualized Return / Max Drawdown
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      avgReturn,
      stdDev,
      downsideDev,
      maxDrawdown,
      annualizedReturn,
      annualizedVolatility,
    };
  }, [trades, annualRiskFreeRate]);

  if (!metrics) return null;

  const getRatioQuality = (ratio: number, type: 'sharpe' | 'sortino' | 'calmar') => {
    const thresholds = {
      sharpe: { excellent: 2, good: 1, acceptable: 0.5 },
      sortino: { excellent: 2.5, good: 1.5, acceptable: 0.75 },
      calmar: { excellent: 3, good: 1.5, acceptable: 0.5 },
    };

    const t = thresholds[type];
    if (ratio >= t.excellent) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (ratio >= t.good) return { label: 'Good', color: 'text-green-400', bg: 'bg-green-400/20' };
    if (ratio >= t.acceptable) return { label: 'Acceptable', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (ratio >= 0) return { label: 'Poor', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    return { label: 'Negative', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  const sharpeQuality = getRatioQuality(metrics.sharpeRatio, 'sharpe');
  const sortinoQuality = getRatioQuality(metrics.sortinoRatio, 'sortino');
  const calmarQuality = getRatioQuality(metrics.calmarRatio, 'calmar');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Risk-Adjusted Returns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Ratios */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Sharpe Ratio */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sharpe Ratio</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Measures excess return per unit of total risk. Higher is better. Above 1.0 is good, above 2.0 is excellent.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className={`text-2xl font-bold ${sharpeQuality.color}`}>
              {metrics.sharpeRatio.toFixed(2)}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded ${sharpeQuality.bg} ${sharpeQuality.color}`}>
              {sharpeQuality.label}
            </span>
          </div>

          {/* Sortino Ratio */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sortino Ratio</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Like Sharpe but only penalizes downside volatility. Better for strategies with positive skew. Above 1.5 is good.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className={`text-2xl font-bold ${sortinoQuality.color}`}>
              {metrics.sortinoRatio.toFixed(2)}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded ${sortinoQuality.bg} ${sortinoQuality.color}`}>
              {sortinoQuality.label}
            </span>
          </div>

          {/* Calmar Ratio */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Calmar Ratio</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Annualized return divided by max drawdown. Measures return per unit of drawdown risk. Above 1.5 is good.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className={`text-2xl font-bold ${calmarQuality.color}`}>
              {metrics.calmarRatio.toFixed(2)}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded ${calmarQuality.bg} ${calmarQuality.color}`}>
              {calmarQuality.label}
            </span>
          </div>
        </div>

        {/* Supporting Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Avg Return/Trade</p>
            <p className={`font-semibold ${metrics.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.avgReturn >= 0 ? '+' : ''}{metrics.avgReturn.toFixed(2)}%
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Volatility (σ)</p>
            <p className="font-semibold">{metrics.stdDev.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Downside Dev</p>
            <p className="font-semibold">{metrics.downsideDev.toFixed(2)}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Max Drawdown</p>
            <p className="font-semibold text-red-500">-{metrics.maxDrawdown.toFixed(2)}%</p>
          </div>
        </div>

        {/* Annualized Metrics */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Annualized Estimates</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Annualized Return</p>
              <p className={`font-semibold ${metrics.annualizedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metrics.annualizedReturn >= 0 ? '+' : ''}{metrics.annualizedReturn.toFixed(1)}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Annualized Volatility</p>
              <p className="font-semibold">{metrics.annualizedVolatility.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.sortinoRatio > metrics.sharpeRatio * 1.2 ? (
            <p>Sortino significantly higher than Sharpe indicates positive skew—large wins offset occasional losses. This is a favorable risk profile.</p>
          ) : metrics.sharpeRatio > metrics.sortinoRatio * 1.2 ? (
            <p>Sharpe higher than Sortino suggests some upside volatility. Consider if gains are consistent or occasional large swings.</p>
          ) : (
            <p>Sharpe and Sortino are similar, indicating symmetric return distribution. Focus on improving either win rate or risk-reward ratio.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
