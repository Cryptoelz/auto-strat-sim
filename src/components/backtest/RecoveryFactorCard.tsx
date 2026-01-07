import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import type { BacktestTrade } from '@/hooks/useBacktest';

interface RecoveryFactorCardProps {
  trades: BacktestTrade[];
  initialBalance?: number;
}

interface RecoveryMetrics {
  netProfit: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;
  peakBalance: number;
  troughBalance: number;
  currentBalance: number;
  recoveryTime: number; // trades to recover from max drawdown
}

export function RecoveryFactorCard({ trades, initialBalance = 10000 }: RecoveryFactorCardProps) {
  const metrics = useMemo((): RecoveryMetrics | null => {
    if (trades.length < 2) return null;

    let balance = initialBalance;
    let peak = initialBalance;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peakBalance = initialBalance;
    let troughBalance = initialBalance;
    let drawdownStartIndex = 0;
    let maxDrawdownEndIndex = 0;
    let recoveryIndex = 0;

    // Track drawdown periods
    const balanceHistory: number[] = [initialBalance];

    trades.forEach((trade, index) => {
      balance += trade.pnl;
      balanceHistory.push(balance);

      if (balance > peak) {
        peak = balance;
        drawdownStartIndex = index + 1;
      }

      const currentDrawdown = peak - balance;
      const currentDrawdownPercent = (currentDrawdown / peak) * 100;

      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown;
        maxDrawdownPercent = currentDrawdownPercent;
        peakBalance = peak;
        troughBalance = balance;
        maxDrawdownEndIndex = index + 1;
      }
    });

    // Find recovery point (when balance exceeds the peak before max drawdown)
    let recoveryTime = 0;
    if (maxDrawdownEndIndex < balanceHistory.length - 1) {
      for (let i = maxDrawdownEndIndex + 1; i < balanceHistory.length; i++) {
        if (balanceHistory[i] >= peakBalance) {
          recoveryTime = i - maxDrawdownEndIndex;
          break;
        }
      }
      if (recoveryTime === 0 && balanceHistory[balanceHistory.length - 1] < peakBalance) {
        recoveryTime = -1; // Still in drawdown
      }
    }

    const netProfit = balance - initialBalance;
    const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : netProfit > 0 ? Infinity : 0;

    return {
      netProfit,
      maxDrawdown,
      maxDrawdownPercent,
      recoveryFactor,
      peakBalance,
      troughBalance,
      currentBalance: balance,
      recoveryTime,
    };
  }, [trades, initialBalance]);

  if (!metrics) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getRecoveryFactorQuality = (rf: number) => {
    if (rf >= 5) return { label: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (rf >= 3) return { label: 'Very Good', color: 'text-green-400', bg: 'bg-green-400/20' };
    if (rf >= 2) return { label: 'Good', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    if (rf >= 1) return { label: 'Acceptable', color: 'text-orange-500', bg: 'bg-orange-500/20' };
    return { label: 'Poor', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  const quality = getRecoveryFactorQuality(metrics.recoveryFactor);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCw className="h-5 w-5" />
          Recovery Factor
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Recovery Factor = Net Profit ÷ Max Drawdown. Shows how well the strategy recovers from losses. Values above 3 are considered good.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Recovery Factor Display */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Recovery Factor</p>
              <p className={`text-3xl font-bold ${quality.color}`}>
                {metrics.recoveryFactor === Infinity ? '∞' : metrics.recoveryFactor.toFixed(2)}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${quality.bg} ${quality.color}`}>
              {quality.label}
            </div>
          </div>

          {/* Formula Display */}
          <div className="flex items-center justify-center gap-2 text-sm bg-muted/50 rounded-lg p-3">
            <span className={`font-medium ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(metrics.netProfit)}
            </span>
            <span className="text-muted-foreground">÷</span>
            <span className="font-medium text-red-500">
              {formatCurrency(metrics.maxDrawdown)}
            </span>
            <span className="text-muted-foreground">=</span>
            <span className={`font-semibold ${quality.color}`}>
              {metrics.recoveryFactor === Infinity ? '∞' : metrics.recoveryFactor.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Net Profit</span>
            </div>
            <p className={`text-xl font-bold ${metrics.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.netProfit >= 0 ? '+' : ''}{formatCurrency(metrics.netProfit)}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Max Drawdown</span>
            </div>
            <p className="text-xl font-bold text-red-500">
              -{formatCurrency(metrics.maxDrawdown)}
            </p>
            <p className="text-sm text-muted-foreground">
              ({metrics.maxDrawdownPercent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Drawdown Details */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Drawdown Analysis</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Peak Balance</p>
              <p className="font-semibold">{formatCurrency(metrics.peakBalance)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Trough Balance</p>
              <p className="font-semibold">{formatCurrency(metrics.troughBalance)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Current Balance</p>
              <p className="font-semibold">{formatCurrency(metrics.currentBalance)}</p>
            </div>
          </div>
        </div>

        {/* Recovery Status */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Recovery Status</span>
            {metrics.recoveryTime === -1 ? (
              <span className="text-sm font-medium text-orange-500">Still in drawdown</span>
            ) : metrics.recoveryTime === 0 ? (
              <span className="text-sm font-medium text-muted-foreground">No significant drawdown</span>
            ) : (
              <span className="text-sm font-medium text-green-500">
                Recovered in {metrics.recoveryTime} trade{metrics.recoveryTime !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Interpretation</p>
          {metrics.recoveryFactor >= 3 ? (
            <p>Strong recovery factor indicates the strategy generates profits well in excess of its worst drawdown. This suggests good risk-adjusted performance and resilience.</p>
          ) : metrics.recoveryFactor >= 1 ? (
            <p>Moderate recovery factor. Net profits exceed maximum drawdown, but consider whether the drawdown is acceptable for your risk tolerance.</p>
          ) : metrics.recoveryFactor > 0 ? (
            <p>⚠️ Low recovery factor. The maximum drawdown is larger than net profits. Consider reducing position sizes or improving the strategy's edge.</p>
          ) : (
            <p>⚠️ Negative recovery factor indicates the strategy is net negative. Review and optimize before continuing.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
