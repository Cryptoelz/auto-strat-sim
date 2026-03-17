import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Asset, Signal, Position } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

interface SignalAlertProps {
  asset: Asset;
  signal: Signal | null;
  position: Position | null;
  currentPrice: number | null;
}

export function SignalAlert({
  asset,
  signal,
  position,
  currentPrice,
}: SignalAlertProps) {
  const info = ASSET_INFO[asset];

  const getSignalIcon = () => {
    if (!signal) return <MinusCircle className="h-6 w-6 text-trading-neutral" />;
    switch (signal.type) {
      case 'BUY':
        return <ArrowUpCircle className="h-6 w-6 text-trading-profit" />;
      case 'SELL':
        return <ArrowDownCircle className="h-6 w-6 text-trading-loss" />;
      default:
        return <MinusCircle className="h-6 w-6 text-trading-neutral" />;
    }
  };

  const getSignalClass = () => {
    if (!signal || signal.type === 'HOLD') return '';
    if (signal.type === 'BUY') return 'animate-pulse-glow';
    return 'animate-pulse-glow-red';
  };

  // Calculate unrealized P&L based on position direction
  const unrealizedPnl = position && currentPrice
    ? position.direction === 'long'
      ? (currentPrice - position.entryPrice) * position.size
      : (position.entryPrice - currentPrice) * position.size
    : null;
  const unrealizedPnlPercent = position && currentPrice
    ? position.direction === 'long'
      ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100
      : ((position.entryPrice - currentPrice) / position.entryPrice) * 100
    : null;

  return (
    <Card className={`border-border/50 bg-card/50 backdrop-blur ${getSignalClass()}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: asset === 'BTCUSDT' ? 'hsl(43, 96%, 56%)' : 'hsl(220, 100%, 60%)',
              }}
            ></span>
            {info.symbol} Signal
          </span>
          <div className="flex items-center gap-2">
            {position && (
              <Badge
                variant="outline"
                className={
                  position.direction === 'long'
                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                    : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                }
              >
                {position.direction.toUpperCase()}
              </Badge>
            )}
            {signal && (
              <Badge
                variant="outline"
                className={
                  signal.type === 'BUY'
                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                    : signal.type === 'SELL'
                    ? 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                    : 'border-trading-neutral/50 bg-trading-neutral/10 text-trading-neutral'
                }
              >
                {signal.type}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {getSignalIcon()}
          <div>
            <p className="font-medium">
              {signal?.type === 'BUY' && 'Bullish Crossover Detected'}
              {signal?.type === 'SELL' && 'Bearish Crossover Detected'}
              {(!signal || signal.type === 'HOLD') && 'Waiting for Crossover...'}
            </p>
            {signal && signal.type !== 'HOLD' && (
              <p className="text-sm text-muted-foreground">
                SMA {signal.smaFast.toFixed(2)} / {signal.smaSlow.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Position info */}
        {position && (
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {position.direction === 'long' ? '📈 Long' : '📉 Short'} Position
              </span>
              <span className="text-sm font-medium">
                Entry: {formatCurrency(position.entryPrice)}
              </span>
            </div>
            {unrealizedPnl !== null && unrealizedPnlPercent !== null && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Unrealized P&L</span>
                <span
                  className={`text-sm font-medium ${
                    unrealizedPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                  }`}
                >
                  {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)} ({unrealizedPnlPercent >= 0 ? '+' : ''}{unrealizedPnlPercent.toFixed(2)}%)
                </span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>SL: {formatCurrency(position.stopLoss)}</span>
              <span>TP: {formatCurrency(position.takeProfit)}</span>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          🤖 Fully automated — trades execute on crossover signals
        </p>
      </CardContent>
    </Card>
  );
}
