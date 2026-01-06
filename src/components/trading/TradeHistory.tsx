import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Download } from 'lucide-react';

function exportToCSV(trades: Trade[]) {
  const headers = ['ID', 'Asset', 'Symbol', 'Type', 'Entry Price', 'Exit Price', 'Entry Time', 'Exit Time', 'PnL', 'PnL %', 'Exit Reason'];
  const rows = trades.map(trade => {
    const info = ASSET_INFO[trade.asset];
    return [
      trade.id,
      trade.asset,
      info.symbol,
      trade.type,
      trade.entryPrice.toFixed(2),
      trade.exitPrice.toFixed(2),
      format(new Date(trade.entryTime), 'yyyy-MM-dd HH:mm:ss'),
      format(new Date(trade.exitTime), 'yyyy-MM-dd HH:mm:ss'),
      trade.pnl.toFixed(2),
      (trade.pnlPercent * 100).toFixed(2) + '%',
      trade.exitReason
    ].join(',');
  });
  
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trade-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

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
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportToCSV(trades)}
              disabled={trades.length === 0}
              className="h-6 px-2"
            >
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
            <Badge variant="secondary">
              {trades.length} trades
            </Badge>
          </div>
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
