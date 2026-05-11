import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradingState, Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChartIcon } from 'lucide-react';

interface PortfolioAllocationProps {
  state: TradingState;
  prices: Record<Asset, number | null>;
  enabledAssets: Asset[];
}

const ASSET_COLORS: Record<Asset, string> = {
  BTCUSDT: 'hsl(43, 96%, 56%)',
  XRPUSDT: 'hsl(220, 100%, 60%)',
  FETUSDT: 'hsl(280, 80%, 55%)',
  XLMUSDT: 'hsl(170, 70%, 50%)',
  ETHUSDT: 'hsl(230, 65%, 65%)',
  SOLUSDT: 'hsl(145, 80%, 60%)',
};

export function PortfolioAllocation({ state, prices, enabledAssets }: PortfolioAllocationProps) {
  // Create a stable price key to avoid re-renders when prices object reference changes
  const priceKey = enabledAssets.map(a => `${a}:${prices[a] ?? 0}`).join(',');

  const allocationData = useMemo(() => {
    const data: { name: string; value: number; asset: Asset | 'cash'; color: string }[] = [];
    
    // Calculate position values
    enabledAssets.forEach((asset) => {
      const position = state.positions[asset];
      const price = prices[asset];
      
      if (position && price) {
        const positionValue = position.size * price;
        data.push({
          name: ASSET_INFO[asset].symbol,
          value: positionValue,
          asset,
          color: ASSET_COLORS[asset],
        });
      }
    });
    
    // Add cash
    if (state.balance > 0) {
      data.push({
        name: 'Cash',
        value: state.balance,
        asset: 'cash',
        color: 'hsl(220, 10%, 50%)',
      });
    }
    
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.positions, state.balance, priceKey, enabledAssets]);

  const totalPortfolioValue = useMemo(() => {
    return allocationData.reduce((sum, item) => sum + item.value, 0);
  }, [allocationData]);

  const hasPositions = allocationData.some((item) => item.asset !== 'cash');

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4" />
          Portfolio Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pie chart */}
          <div className="flex items-center justify-center">
            {allocationData.length > 0 ? (
              <div className="h-[160px] w-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
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
                      formatter={(value: number) => [formatCurrency(value), 'Value']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            )}
          </div>

          {/* Allocation breakdown */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatCurrency(totalPortfolioValue)}</span>
            </div>
            
            <div className="space-y-2">
              {allocationData.map((item) => {
                const percentage = totalPortfolioValue > 0 
                  ? (item.value / totalPortfolioValue) * 100 
                  : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!hasPositions && (
              <p className="text-xs text-muted-foreground mt-2">
                No open positions. Your portfolio is 100% cash.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
