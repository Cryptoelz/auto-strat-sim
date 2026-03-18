import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trade } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Download, TableIcon, List } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const REASON_LABELS: Record<string, string> = {
  bullish_crossover: 'Bullish Cross',
  bearish_crossover: 'Bearish Cross',
  stop_loss: 'Stop Loss',
  take_profit: 'Take Profit',
  flip_to_long: 'Flip → Long',
  flip_to_short: 'Flip → Short',
  daily_loss_limit: 'Daily Loss',
  consecutive_loss_limit: 'Loss Streak',
  signal: 'Signal',
  flip: 'Flip',
  unknown: 'Unknown',
};

const REASON_COLORS: Record<string, string> = {
  bullish_crossover: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  bearish_crossover: 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss',
  stop_loss: 'border-destructive/50 bg-destructive/10 text-destructive',
  take_profit: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  flip_to_long: 'border-primary/50 bg-primary/10 text-primary',
  flip_to_short: 'border-primary/50 bg-primary/10 text-primary',
  daily_loss_limit: 'border-destructive/50 bg-destructive/10 text-destructive',
  consecutive_loss_limit: 'border-destructive/50 bg-destructive/10 text-destructive',
  signal: 'border-muted bg-muted/50 text-muted-foreground',
  flip: 'border-primary/50 bg-primary/10 text-primary',
  unknown: 'border-muted bg-muted/50 text-muted-foreground',
};

function getTradeDirection(trade: Partial<Trade>): 'LONG' | 'SHORT' {
  return trade.direction === 'short' ? 'SHORT' : 'LONG';
}

function getTradeReason(reason: unknown): string {
  return typeof reason === 'string' && REASON_LABELS[reason] ? reason : 'unknown';
}

function isFlipTrade(trade: Trade): boolean {
  return trade.exitReason === 'flip_to_long' || trade.exitReason === 'flip_to_short';
}

function getGrossPnl(trade: Trade): number {
  return trade.pnl + (trade.fees || 0);
}

function exportToCSV(trades: Trade[]) {
  const headers = ['Timestamp', 'Asset', 'Side', 'Entry Time', 'Exit Time', 'Entry Price', 'Exit Price', 'Size', 'Fees', 'Gross PnL', 'Net PnL', 'PnL %', 'Exit Reason', 'Flip Trade'];
  const rows = trades.map((trade) => {
    const info = ASSET_INFO[trade.asset];
    const reasonKey = getTradeReason(trade.exitReason);
    return [
      format(new Date(trade.exitTime), 'yyyy-MM-dd HH:mm:ss'),
      info.symbol,
      getTradeDirection(trade),
      format(new Date(trade.entryTime), 'yyyy-MM-dd HH:mm:ss'),
      format(new Date(trade.exitTime), 'yyyy-MM-dd HH:mm:ss'),
      trade.entryPrice.toFixed(6),
      trade.exitPrice.toFixed(6),
      trade.size.toFixed(6),
      trade.fees.toFixed(4),
      getGrossPnl(trade).toFixed(2),
      trade.pnl.toFixed(2),
      (trade.pnlPercent * 100).toFixed(2) + '%',
      REASON_LABELS[reasonKey],
      isFlipTrade(trade) ? 'Yes' : 'No',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trade-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const sortedTrades = [...trades].reverse();

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Trade Log
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5"
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
            >
              {viewMode === 'cards' ? <TableIcon className="h-3 w-3" /> : <List className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => exportToCSV(trades)} disabled={trades.length === 0} className="h-6 px-2">
              <Download className="mr-1 h-3 w-3" />CSV
            </Button>
            <Badge variant="secondary">{trades.length} trades</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {sortedTrades.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8">
              <p className="text-muted-foreground">No trades yet — agent is waiting for signals</p>
            </div>
          ) : viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px]">Asset</TableHead>
                  <TableHead className="text-[10px]">Side</TableHead>
                  <TableHead className="text-[10px]">Entry</TableHead>
                  <TableHead className="text-[10px]">Exit</TableHead>
                  <TableHead className="text-[10px]">Entry $</TableHead>
                  <TableHead className="text-[10px]">Exit $</TableHead>
                  <TableHead className="text-[10px]">Size</TableHead>
                  <TableHead className="text-[10px]">Fees</TableHead>
                  <TableHead className="text-[10px]">Gross</TableHead>
                  <TableHead className="text-[10px]">Net PnL</TableHead>
                  <TableHead className="text-[10px]">Reason</TableHead>
                  <TableHead className="text-[10px]">Flip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => {
                  const info = ASSET_INFO[trade.asset];
                  const reasonKey = getTradeReason(trade.exitReason);
                  const gross = getGrossPnl(trade);
                  const flip = isFlipTrade(trade);
                  return (
                    <TableRow key={trade.id} className="text-[10px]">
                      <TableCell className="py-1 font-medium">{info.symbol}</TableCell>
                      <TableCell className={cn("py-1", trade.direction === 'long' ? 'text-trading-profit' : 'text-trading-loss')}>
                        {getTradeDirection(trade)}
                      </TableCell>
                      <TableCell className="py-1">{format(new Date(trade.entryTime), 'MM/dd HH:mm')}</TableCell>
                      <TableCell className="py-1">{format(new Date(trade.exitTime), 'MM/dd HH:mm')}</TableCell>
                      <TableCell className="py-1">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="py-1">${trade.exitPrice.toFixed(2)}</TableCell>
                      <TableCell className="py-1">{trade.size.toFixed(4)}</TableCell>
                      <TableCell className="py-1">${trade.fees.toFixed(2)}</TableCell>
                      <TableCell className={cn("py-1", gross >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {gross >= 0 ? '+' : ''}{formatCurrency(gross)}
                      </TableCell>
                      <TableCell className={cn("py-1 font-medium", trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </TableCell>
                      <TableCell className="py-1">
                        <Badge variant="outline" className={`${REASON_COLORS[reasonKey]} text-[8px] px-1 py-0`}>
                          {REASON_LABELS[reasonKey]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1">
                        {flip && <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[8px] px-1 py-0">Flip</Badge>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="space-y-2">
              {sortedTrades.map((trade) => {
                const info = ASSET_INFO[trade.asset];
                const directionLabel = getTradeDirection(trade);
                const reasonKey = getTradeReason(trade.exitReason);
                const flip = isFlipTrade(trade);
                const gross = getGrossPnl(trade);
                const directionClass =
                  directionLabel === 'LONG'
                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit text-[10px]'
                    : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss text-[10px]';

                return (
                  <div key={trade.id} className="rounded-lg border border-border/50 bg-secondary/20 p-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{info.symbol}</span>
                        <Badge variant="outline" className={directionClass}>
                          {directionLabel}
                        </Badge>
                        <Badge variant="outline" className={`${REASON_COLORS[reasonKey]} text-[10px]`}>
                          {REASON_LABELS[reasonKey]}
                        </Badge>
                        {flip && (
                          <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary text-[10px]">
                            Flip
                          </Badge>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                      </span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-5 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <span>Entry</span>
                        <p className="font-medium text-foreground">{formatCurrency(trade.entryPrice)}</p>
                        <p className="text-[9px]">{format(new Date(trade.entryTime), 'HH:mm')}</p>
                      </div>
                      <div>
                        <span>Exit</span>
                        <p className="font-medium text-foreground">{formatCurrency(trade.exitPrice)}</p>
                        <p className="text-[9px]">{format(new Date(trade.exitTime), 'HH:mm')}</p>
                      </div>
                      <div>
                        <span>Fees</span>
                        <p className="font-medium text-foreground">{formatCurrency(trade.fees)}</p>
                      </div>
                      <div>
                        <span>Gross</span>
                        <p className={`font-medium ${gross >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                          {gross >= 0 ? '+' : ''}{formatCurrency(gross)}
                        </p>
                      </div>
                      <div>
                        <span>PnL %</span>
                        <p className={`font-medium ${trade.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                          {formatPercent(trade.pnlPercent)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {format(new Date(trade.entryTime), 'MMM dd, HH:mm')} → {format(new Date(trade.exitTime), 'MMM dd, HH:mm')}
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
