import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Scale, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface ProfitFactorCardProps {
  trades: BacktestTrade[];
}

interface ProfitFactorMetrics {
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  netProfit: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  winCount: number;
  lossCount: number;
}

export function ProfitFactorCard({ trades }: ProfitFactorCardProps) {
  const metrics = useMemo((): ProfitFactorMetrics | null => {
    if (trades.length < 2) return null;

    const winningTrades = trades.filter(t => t.type === 'win');
    const losingTrades = trades.filter(t => t.type === 'loss');

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.abs(Math.min(...losingTrades.map(t => t.pnl))) : 0;

    return {
      grossProfit,
      grossLoss,
      profitFactor,
      netProfit: grossProfit - grossLoss,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      winCount: winningTrades.length,
      lossCount: losingTrades.length,
    };
  }, [trades]);

  if (!metrics) return null;

  const getProfitFactorQuality = (pf: number) => {
    if (pf >= 3) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500' };
    if (pf >= 2) return { label: 'Very Good', color: 'text-green-400', bg: 'bg-green-400' };
    if (pf >= 1.5) return { label: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (pf >= 1) return { label: 'Breakeven', color: 'text-orange-500', bg: 'bg-orange-500' };
    return { label: 'Losing', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const quality = getProfitFactorQuality(metrics.profitFactor);
  const profitRatio = metrics.grossProfit + metrics.grossLoss > 0
    ? (metrics.grossProfit / (metrics.grossProfit + metrics.grossLoss)) * 100
    : 50;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Scale className="h-5 w-5" />
          Profit Factor
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Profit Factor = Gross Profit ÷ Gross Loss. Values above 1.5 indicate a profitable strategy. Above 2.0 is very good.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Profit Factor Display */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Profit Factor</p>
              <p className={`text-3xl font-bold ${quality.color}`}>
                {metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${quality.bg}/20 ${quality.color}`}>
              {quality.label}
            </div>
          </div>

          {/* Profit/Loss Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-500">Gross Profit</span>
              <span className="text-red-500">Gross Loss</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden bg-red-500/30 flex">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${profitRatio}%` }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span className="text-green-500">{formatCurrency(metrics.grossProfit)}</span>
              <span className="text-red-500">{formatCurrency(metrics.grossLoss)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
          <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.netProfit >= 0 ? '+' : ''}{formatCurrency(metrics.netProfit)}
          </p>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-500">
              <TrendingUp className="h-4 w-4" />
              Winning Trades ({metrics.winCount})
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Win</span>
                <span className="font-medium">{formatCurrency(metrics.avgWin)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest Win</span>
                <span className="font-medium">{formatCurrency(metrics.largestWin)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-red-500">
              <TrendingDown className="h-4 w-4" />
              Losing Trades ({metrics.lossCount})
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Average Loss</span>
                <span className="font-medium">{formatCurrency(metrics.avgLoss)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest Loss</span>
                <span className="font-medium">{formatCurrency(metrics.largestLoss)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.profitFactor >= 2 ? (
            <p>Strong profit factor indicates robust edge. For every $1 lost, you gain ${metrics.profitFactor.toFixed(2)}. Strategy shows consistent profitability.</p>
          ) : metrics.profitFactor >= 1.5 ? (
            <p>Healthy profit factor. Consider optimizing entries or tightening stops to push above 2.0 for more robust performance.</p>
          ) : metrics.profitFactor >= 1 ? (
            <p>Marginal profitability. Small changes in market conditions could turn this negative. Focus on improving win rate or reward-to-risk ratio.</p>
          ) : (
            <p>⚠️ Strategy is losing money. Review entry/exit rules, position sizing, and risk management before continuing.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
