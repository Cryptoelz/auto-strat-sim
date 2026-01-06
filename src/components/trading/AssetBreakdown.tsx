import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trade, Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Coins } from 'lucide-react';

interface AssetBreakdownProps {
  trades: Trade[];
}

interface AssetStats {
  asset: Asset;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalPnlPercent: number;
}

export function AssetBreakdown({ trades }: AssetBreakdownProps) {
  const assetStats = useMemo(() => {
    const stats: Record<Asset, AssetStats> = {
      BTCUSDT: {
        asset: 'BTCUSDT',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      },
      XRPUSDT: {
        asset: 'XRPUSDT',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      },
      FETUSDT: {
        asset: 'FETUSDT',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      },
      XLMUSDT: {
        asset: 'XLMUSDT',
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
      },
    };

    trades.forEach((trade) => {
      const s = stats[trade.asset];
      s.totalTrades += 1;
      s.totalPnl += trade.pnl;
      s.totalPnlPercent += trade.pnlPercent;
      if (trade.type === 'win') {
        s.wins += 1;
      } else {
        s.losses += 1;
      }
    });

    // Calculate win rates
    Object.values(stats).forEach((s) => {
      s.winRate = s.totalTrades > 0 ? (s.wins / s.totalTrades) * 100 : 0;
    });

    return stats;
  }, [trades]);

  const pieData = useMemo(() => {
    return Object.values(assetStats)
      .filter((s) => s.totalTrades > 0)
      .map((s) => ({
        name: ASSET_INFO[s.asset].symbol,
        value: Math.abs(s.totalPnl),
        pnl: s.totalPnl,
        asset: s.asset,
      }));
  }, [assetStats]);

  const COLORS: Record<Asset, string> = {
    BTCUSDT: 'hsl(43, 96%, 56%)',
    XRPUSDT: 'hsl(220, 100%, 60%)',
    FETUSDT: 'hsl(280, 80%, 55%)',
    XLMUSDT: 'hsl(170, 70%, 50%)',
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-4 w-4" />
          P&L by Asset
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Asset stats */}
          <div className="space-y-3">
            {(['BTCUSDT', 'XRPUSDT', 'FETUSDT', 'XLMUSDT'] as Asset[]).map((asset) => {
              const stats = assetStats[asset];
              const info = ASSET_INFO[asset];
              return (
                <div
                  key={asset}
                  className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: COLORS[asset] }}
                      />
                      <span className="font-medium">{info.symbol}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        stats.totalPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                      }`}
                    >
                      {stats.totalPnl >= 0 ? '+' : ''}
                      {formatCurrency(stats.totalPnl)}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block text-foreground font-medium">
                        {stats.totalTrades}
                      </span>
                      <span>Trades</span>
                    </div>
                    <div>
                      <span className="block text-foreground font-medium">
                        {stats.winRate.toFixed(0)}%
                      </span>
                      <span>Win Rate</span>
                    </div>
                    <div>
                      <span
                        className={`block font-medium ${
                          stats.totalPnlPercent >= 0
                            ? 'text-trading-profit'
                            : 'text-trading-loss'
                        }`}
                      >
                        {formatPercent(stats.totalPnlPercent)}
                      </span>
                      <span>Return</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pie chart */}
          <div className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <div className="h-[140px] w-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.asset}
                          fill={COLORS[entry.asset]}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        formatCurrency(props.payload.pnl),
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
                No trades yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
