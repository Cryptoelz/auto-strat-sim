import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trade } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History } from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const sortedTrades = [...trades].reverse(); // Most recent first

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Trade History
          <Badge variant="secondary" className="ml-auto">
            {trades.length} trades
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {sortedTrades.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8">
              <p className="text-muted-foreground">No trades yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTrades.map((trade) => {
                const info = ASSET_INFO[trade.asset];
                return (
                  <div
                    key={trade.id}
                    className="rounded-lg border border-border/50 bg-secondary/20 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              trade.asset === 'BTCUSDT'
                                ? 'hsl(43, 96%, 56%)'
                                : 'hsl(220, 100%, 60%)',
                          }}
                        ></span>
                        <span className="font-medium">{info.symbol}</span>
                        <Badge
                          variant="outline"
                          className={
                            trade.type === 'win'
                              ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                              : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                          }
                        >
                          {trade.type === 'win' ? 'Win' : 'Loss'}
                        </Badge>
                      </div>
                      <span
                        className={`font-medium ${
                          trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                        }`}
                      >
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="text-xs">Entry</span>
                        <p className="font-medium text-foreground">
                          {formatCurrency(trade.entryPrice)}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs">Exit</span>
                        <p className="font-medium text-foreground">
                          {formatCurrency(trade.exitPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {format(new Date(trade.exitTime), 'MMM dd, HH:mm')}
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {trade.exitReason.replace('_', ' ')}
                        </Badge>
                        <span>{formatPercent(trade.pnlPercent)}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
