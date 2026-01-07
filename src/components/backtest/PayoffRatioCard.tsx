import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface PayoffRatioCardProps {
  trades: BacktestTrade[];
}

interface PayoffMetrics {
  avgWin: number;
  avgLoss: number;
  payoffRatio: number;
  avgWinPercent: number;
  avgLossPercent: number;
  payoffRatioPercent: number;
  largestWin: number;
  largestLoss: number;
  smallestWin: number;
  smallestLoss: number;
  medianWin: number;
  medianLoss: number;
  winCount: number;
  lossCount: number;
}

export function PayoffRatioCard({ trades }: PayoffRatioCardProps) {
  const metrics = useMemo((): PayoffMetrics | null => {
    if (trades.length < 2) return null;

    const winningTrades = trades.filter(t => t.type === 'win');
    const losingTrades = trades.filter(t => t.type === 'loss');

    if (winningTrades.length === 0 || losingTrades.length === 0) return null;

    const winPnls = winningTrades.map(t => t.pnl).sort((a, b) => a - b);
    const lossPnls = losingTrades.map(t => Math.abs(t.pnl)).sort((a, b) => a - b);

    const avgWin = winPnls.reduce((sum, p) => sum + p, 0) / winPnls.length;
    const avgLoss = lossPnls.reduce((sum, p) => sum + p, 0) / lossPnls.length;

    const winPercents = winningTrades.map(t => (t.pnl / (t.entryPrice * t.size)) * 100);
    const lossPercents = losingTrades.map(t => Math.abs((t.pnl / (t.entryPrice * t.size)) * 100));

    const avgWinPercent = winPercents.reduce((sum, p) => sum + p, 0) / winPercents.length;
    const avgLossPercent = lossPercents.reduce((sum, p) => sum + p, 0) / lossPercents.length;

    return {
      avgWin,
      avgLoss,
      payoffRatio: avgWin / avgLoss,
      avgWinPercent,
      avgLossPercent,
      payoffRatioPercent: avgWinPercent / avgLossPercent,
      largestWin: Math.max(...winPnls),
      largestLoss: Math.max(...lossPnls),
      smallestWin: Math.min(...winPnls),
      smallestLoss: Math.min(...lossPnls),
      medianWin: winPnls[Math.floor(winPnls.length / 2)],
      medianLoss: lossPnls[Math.floor(lossPnls.length / 2)],
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
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

  const getPayoffQuality = (ratio: number) => {
    if (ratio >= 3) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
    if (ratio >= 2) return { label: 'Very Good', color: 'text-green-400', bg: 'bg-green-400' };
    if (ratio >= 1.5) return { label: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (ratio >= 1) return { label: 'Fair', color: 'text-orange-500', bg: 'bg-orange-500' };
    return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const quality = getPayoffQuality(metrics.payoffRatio);

  // Calculate bar widths for visualization
  const maxValue = Math.max(metrics.avgWin, metrics.avgLoss);
  const winWidth = (metrics.avgWin / maxValue) * 100;
  const lossWidth = (metrics.avgLoss / maxValue) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5" />
          Payoff Ratio
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Payoff Ratio = Average Win ÷ Average Loss. Shows reward-to-risk per trade. Higher ratios mean bigger wins relative to losses.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Payoff Ratio Display */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Payoff Ratio</p>
              <p className={`text-3xl font-bold ${quality.color}`}>
                {metrics.payoffRatio.toFixed(2)}:1
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${quality.bg}/20 ${quality.color}`}>
              {quality.label}
            </div>
          </div>

          {/* Visual Comparison Bars */}
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Average Win
                </span>
                <span className="font-medium text-green-500">{formatCurrency(metrics.avgWin)}</span>
              </div>
              <div className="h-6 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${winWidth}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    +{metrics.avgWinPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Average Loss
                </span>
                <span className="font-medium text-red-500">{formatCurrency(metrics.avgLoss)}</span>
              </div>
              <div className="h-6 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all flex items-center justify-end pr-2"
                  style={{ width: `${lossWidth}%` }}
                >
                  <span className="text-xs font-medium text-white">
                    -{metrics.avgLossPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
            <p className="text-sm font-medium text-green-500 mb-2">
              Winning Trades ({metrics.winCount})
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest</span>
                <span className="font-medium">{formatCurrency(metrics.largestWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median</span>
                <span className="font-medium">{formatCurrency(metrics.medianWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Smallest</span>
                <span className="font-medium">{formatCurrency(metrics.smallestWin)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
            <p className="text-sm font-medium text-red-500 mb-2">
              Losing Trades ({metrics.lossCount})
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest</span>
                <span className="font-medium">{formatCurrency(metrics.largestLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Median</span>
                <span className="font-medium">{formatCurrency(metrics.medianLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Smallest</span>
                <span className="font-medium">{formatCurrency(metrics.smallestLoss)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakeven Win Rate */}
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Breakeven Win Rate Required</p>
              <p className="text-lg font-semibold">
                {(100 / (1 + metrics.payoffRatio)).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Actual Win Rate</p>
              <p className={`text-lg font-semibold ${
                (metrics.winCount / (metrics.winCount + metrics.lossCount)) * 100 > 
                (100 / (1 + metrics.payoffRatio)) 
                  ? 'text-green-500' 
                  : 'text-red-500'
              }`}>
                {((metrics.winCount / (metrics.winCount + metrics.lossCount)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.payoffRatio >= 2 ? (
            <p>Strong payoff ratio means each win is worth {metrics.payoffRatio.toFixed(1)}x an average loss. You only need to win {(100 / (1 + metrics.payoffRatio)).toFixed(0)}% of trades to break even.</p>
          ) : metrics.payoffRatio >= 1 ? (
            <p>Moderate payoff ratio. Wins are slightly larger than losses. Focus on maintaining win rate above {(100 / (1 + metrics.payoffRatio)).toFixed(0)}% for profitability.</p>
          ) : (
            <p>⚠️ Average losses exceed average wins. You need to win more than {(100 / (1 + metrics.payoffRatio)).toFixed(0)}% of trades just to break even. Consider widening take-profit or tightening stop-loss.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
