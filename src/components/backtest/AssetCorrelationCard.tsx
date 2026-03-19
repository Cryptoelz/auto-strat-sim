import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Grid3X3 } from 'lucide-react';
import type { BacktestTrade } from '@/types/backtest';

interface AssetCorrelationCardProps {
  trades: BacktestTrade[];
}

interface AssetStats {
  asset: string;
  tradeCount: number;
  avgReturn: number;
  winRate: number;
  totalPnl: number;
}

interface CorrelationData {
  assets: string[];
  matrix: number[][];
  assetStats: AssetStats[];
  strongestPositive: { pair: [string, string]; value: number } | null;
  strongestNegative: { pair: [string, string]; value: number } | null;
}

export function AssetCorrelationCard({ trades }: AssetCorrelationCardProps) {
  const correlationData = useMemo((): CorrelationData | null => {
    if (trades.length < 5) return null;

    // Get unique assets
    const assets = [...new Set(trades.map(t => t.asset))];
    
    if (assets.length < 2) return null;

    // Calculate returns for each trade
    const tradeReturns = trades.map(t => ({
      asset: t.asset,
      returnPercent: (t.pnl / (t.entryPrice * t.size)) * 100,
      timestamp: t.exitTime,
      pnl: t.pnl,
      type: t.type,
    }));

    // Calculate stats for each asset
    const assetStats: AssetStats[] = assets.map(asset => {
      const assetTrades = tradeReturns.filter(t => t.asset === asset);
      const wins = assetTrades.filter(t => t.type === 'win').length;
      
      return {
        asset,
        tradeCount: assetTrades.length,
        avgReturn: assetTrades.reduce((sum, t) => sum + t.returnPercent, 0) / assetTrades.length,
        winRate: (wins / assetTrades.length) * 100,
        totalPnl: assetTrades.reduce((sum, t) => sum + t.pnl, 0),
      };
    });

    // Group trades by time periods for correlation calculation
    // Use overlapping time windows to find concurrent trades
    const getTimeWindow = (timestamp: number) => Math.floor(timestamp / (1000 * 60 * 60 * 24)); // Daily windows

    const tradesByWindow: Map<number, Map<string, number[]>> = new Map();
    
    tradeReturns.forEach(trade => {
      const window = getTimeWindow(trade.timestamp);
      if (!tradesByWindow.has(window)) {
        tradesByWindow.set(window, new Map());
      }
      const windowMap = tradesByWindow.get(window)!;
      if (!windowMap.has(trade.asset)) {
        windowMap.set(trade.asset, []);
      }
      windowMap.get(trade.asset)!.push(trade.returnPercent);
    });

    // Calculate average return per asset per window
    const assetReturnsPerWindow: Map<string, Map<number, number>> = new Map();
    assets.forEach(asset => assetReturnsPerWindow.set(asset, new Map()));

    tradesByWindow.forEach((windowMap, window) => {
      windowMap.forEach((returns, asset) => {
        const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        assetReturnsPerWindow.get(asset)!.set(window, avgReturn);
      });
    });

    // Find common windows for each pair
    const calculateCorrelation = (asset1: string, asset2: string): number => {
      const returns1 = assetReturnsPerWindow.get(asset1)!;
      const returns2 = assetReturnsPerWindow.get(asset2)!;

      // Find common windows
      const commonWindows = [...returns1.keys()].filter(w => returns2.has(w));
      
      if (commonWindows.length < 3) {
        // Not enough data points, use overall return correlation
        const trades1 = tradeReturns.filter(t => t.asset === asset1).map(t => t.returnPercent);
        const trades2 = tradeReturns.filter(t => t.asset === asset2).map(t => t.returnPercent);
        
        if (trades1.length < 2 || trades2.length < 2) return 0;

        const avg1 = trades1.reduce((sum, r) => sum + r, 0) / trades1.length;
        const avg2 = trades2.reduce((sum, r) => sum + r, 0) / trades2.length;
        const std1 = Math.sqrt(trades1.reduce((sum, r) => sum + Math.pow(r - avg1, 2), 0) / trades1.length);
        const std2 = Math.sqrt(trades2.reduce((sum, r) => sum + Math.pow(r - avg2, 2), 0) / trades2.length);

        if (std1 === 0 || std2 === 0) return 0;

        // Use rank correlation as proxy
        const sorted1 = [...trades1].sort((a, b) => a - b);
        const sorted2 = [...trades2].sort((a, b) => a - b);
        const rank1 = trades1.map(v => sorted1.indexOf(v));
        const rank2 = trades2.map(v => sorted2.indexOf(v));

        const n = Math.min(rank1.length, rank2.length);
        const avgRank = (n - 1) / 2;
        
        let cov = 0;
        let var1 = 0;
        let var2 = 0;
        
        for (let i = 0; i < n; i++) {
          cov += (rank1[i] - avgRank) * (rank2[i % rank2.length] - avgRank);
          var1 += Math.pow(rank1[i] - avgRank, 2);
          var2 += Math.pow(rank2[i % rank2.length] - avgRank, 2);
        }

        if (var1 === 0 || var2 === 0) return 0;
        return cov / Math.sqrt(var1 * var2);
      }

      const values1 = commonWindows.map(w => returns1.get(w)!);
      const values2 = commonWindows.map(w => returns2.get(w)!);

      const avg1 = values1.reduce((sum, v) => sum + v, 0) / values1.length;
      const avg2 = values2.reduce((sum, v) => sum + v, 0) / values2.length;

      const std1 = Math.sqrt(values1.reduce((sum, v) => sum + Math.pow(v - avg1, 2), 0) / values1.length);
      const std2 = Math.sqrt(values2.reduce((sum, v) => sum + Math.pow(v - avg2, 2), 0) / values2.length);

      if (std1 === 0 || std2 === 0) return 0;

      const covariance = values1.reduce((sum, v, i) => sum + (v - avg1) * (values2[i] - avg2), 0) / values1.length;
      return covariance / (std1 * std2);
    };

    // Build correlation matrix
    const matrix: number[][] = assets.map((asset1, i) => 
      assets.map((asset2, j) => {
        if (i === j) return 1;
        if (i > j) return calculateCorrelation(asset2, asset1);
        return calculateCorrelation(asset1, asset2);
      })
    );

    // Find strongest correlations
    let strongestPositive: { pair: [string, string]; value: number } | null = null;
    let strongestNegative: { pair: [string, string]; value: number } | null = null;

    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const corr = matrix[i][j];
        if (!strongestPositive || corr > strongestPositive.value) {
          strongestPositive = { pair: [assets[i], assets[j]], value: corr };
        }
        if (!strongestNegative || corr < strongestNegative.value) {
          strongestNegative = { pair: [assets[i], assets[j]], value: corr };
        }
      }
    }

    return {
      assets,
      matrix,
      assetStats,
      strongestPositive: strongestPositive && strongestPositive.value > 0.1 ? strongestPositive : null,
      strongestNegative: strongestNegative && strongestNegative.value < -0.1 ? strongestNegative : null,
    };
  }, [trades]);

  if (!correlationData) return null;

  const getCorrelationColor = (value: number) => {
    if (value >= 0.7) return 'bg-green-500 text-white';
    if (value >= 0.3) return 'bg-green-500/50 text-foreground';
    if (value >= 0.1) return 'bg-green-500/20 text-foreground';
    if (value <= -0.7) return 'bg-red-500 text-white';
    if (value <= -0.3) return 'bg-red-500/50 text-foreground';
    if (value <= -0.1) return 'bg-red-500/20 text-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const formatCurrencyLocal = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Grid3X3 className="h-5 w-5" />
          Asset Correlation Matrix
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Shows how asset returns move together. Positive correlation means assets move in the same direction; negative means they move opposite.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Correlation Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-muted-foreground"></th>
                {correlationData.assets.map(asset => (
                  <th key={asset} className="p-2 text-center font-medium text-muted-foreground">
                    {asset.replace('USDT', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlationData.assets.map((asset, i) => (
                <tr key={asset}>
                  <td className="p-2 font-medium text-muted-foreground">
                    {asset.replace('USDT', '')}
                  </td>
                  {correlationData.matrix[i].map((corr, j) => (
                    <td key={j} className="p-1">
                      <div 
                        className={`p-2 text-center rounded font-medium text-xs ${getCorrelationColor(corr)}`}
                      >
                        {corr.toFixed(2)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span>Strong Negative</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-muted" />
            <span>No Correlation</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Strong Positive</span>
          </div>
        </div>

        {/* Key Findings */}
        {(correlationData.strongestPositive || correlationData.strongestNegative) && (
          <div className="grid gap-4 md:grid-cols-2">
            {correlationData.strongestPositive && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-sm font-medium text-green-500 mb-1">Strongest Positive</p>
                <p className="text-sm">
                  {correlationData.strongestPositive.pair[0].replace('USDT', '')} ↔ {correlationData.strongestPositive.pair[1].replace('USDT', '')}
                </p>
                <p className="text-lg font-bold text-green-500">
                  {correlationData.strongestPositive.value.toFixed(3)}
                </p>
              </div>
            )}
            {correlationData.strongestNegative && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm font-medium text-red-500 mb-1">Strongest Negative</p>
                <p className="text-sm">
                  {correlationData.strongestNegative.pair[0].replace('USDT', '')} ↔ {correlationData.strongestNegative.pair[1].replace('USDT', '')}
                </p>
                <p className="text-lg font-bold text-red-500">
                  {correlationData.strongestNegative.value.toFixed(3)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Asset Performance Summary */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-medium mb-3">Asset Performance Summary</p>
          <div className="grid gap-2">
            {correlationData.assetStats.map(stat => (
              <div key={stat.asset} className="flex items-center justify-between text-sm">
                <span className="font-medium">{stat.asset.replace('USDT', '')}</span>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{stat.tradeCount} trades</span>
                  <span className={stat.winRate >= 50 ? 'text-green-500' : 'text-red-500'}>
                    {stat.winRate.toFixed(0)}% WR
                  </span>
                  <span className={stat.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {stat.avgReturn >= 0 ? '+' : ''}{stat.avgReturn.toFixed(2)}%
                  </span>
                  <span className={`font-medium ${stat.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(stat.totalPnl)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <p className="font-medium text-foreground mb-1">Portfolio Implications</p>
          {correlationData.strongestPositive && correlationData.strongestPositive.value > 0.5 ? (
            <p>High correlation between {correlationData.strongestPositive.pair[0].replace('USDT', '')} and {correlationData.strongestPositive.pair[1].replace('USDT', '')} suggests concentrated risk. Consider reducing exposure to one when the other has open positions.</p>
          ) : correlationData.strongestNegative && correlationData.strongestNegative.value < -0.3 ? (
            <p>Negative correlation between {correlationData.strongestNegative.pair[0].replace('USDT', '')} and {correlationData.strongestNegative.pair[1].replace('USDT', '')} provides natural hedging. Trading both can reduce portfolio volatility.</p>
          ) : (
            <p>Assets show moderate independence. Portfolio is reasonably diversified across different market dynamics.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
