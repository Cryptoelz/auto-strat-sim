import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Asset, AssetAnalytics, MarketRegime } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency } from '@/lib/performance';
import { TrendingUp, TrendingDown, Minus, Activity, Shield, Zap, BarChart3, Gauge } from 'lucide-react';

const REGIME_LABELS: Record<MarketRegime, { label: string; className: string }> = {
  trending_bullish: { label: 'Bullish ↑', className: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit' },
  trending_bearish: { label: 'Bearish ↓', className: 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss' },
  sideways: { label: 'Sideways', className: 'border-trading-neutral/50 bg-trading-neutral/10 text-trading-neutral' },
};

const TREND_ICONS = {
  bullish: <TrendingUp className="h-3.5 w-3.5 text-trading-profit" />,
  bearish: <TrendingDown className="h-3.5 w-3.5 text-trading-loss" />,
  neutral: <Minus className="h-3.5 w-3.5 text-trading-neutral" />,
};

const FILTER_LABELS: Record<string, string> = {
  trend_filter: 'Trend Filter',
  volatility_filter: 'Low Volatility',
  regime_filter: 'Regime Filter',
  sma_distance_filter: 'Low Conviction',
  cooldown_active: 'Cooldown',
  insufficient_balance: 'Low Balance',
  daily_loss_pause: 'Daily Loss Limit',
  consecutive_loss_pause: 'Loss Streak',
};

interface AssetDetailPanelProps {
  asset: Asset;
  data: AssetAnalytics;
}

export function AssetDetailPanel({ asset, data }: AssetDetailPanelProps) {
  const info = ASSET_INFO[asset];
  const regime = REGIME_LABELS[data.marketRegime];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            {info.symbol} Analytics
          </span>
          <Badge variant="outline" className={regime.className}>
            {regime.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price & SMA */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-secondary/30 p-2">
            <span className="text-muted-foreground">Price</span>
            <p className="font-medium text-foreground">{data.price ? formatCurrency(data.price) : '---'}</p>
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <span className="text-muted-foreground">Fast SMA</span>
            <p className="font-medium text-foreground">{data.smaFast ? `$${data.smaFast.toFixed(2)}` : '---'}</p>
            {data.smaFastSlope !== null && (
              <span className={`text-[10px] ${data.smaFastSlope >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                {data.smaFastSlope >= 0 ? '↑' : '↓'} {Math.abs(data.smaFastSlope).toFixed(3)}%
              </span>
            )}
          </div>
          <div className="rounded-md bg-secondary/30 p-2">
            <span className="text-muted-foreground">Slow SMA</span>
            <p className="font-medium text-foreground">{data.smaSlow ? `$${data.smaSlow.toFixed(2)}` : '---'}</p>
            {data.smaSlowSlope !== null && (
              <span className={`text-[10px] ${data.smaSlowSlope >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                {data.smaSlowSlope >= 0 ? '↑' : '↓'} {Math.abs(data.smaSlowSlope).toFixed(3)}%
              </span>
            )}
          </div>
        </div>

        {/* HTF Trend, ATR, SMA Distance */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 rounded-md bg-secondary/30 p-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">HTF Trend</span>
              <div className="flex items-center gap-1">
                {TREND_ICONS[data.htfTrend]}
                <span className="font-medium capitalize text-foreground">{data.htfTrend}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary/30 p-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">ATR</span>
              <p className="font-medium text-foreground">
                {data.atrPercent !== null ? `${data.atrPercent.toFixed(2)}%` : '---'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary/30 p-2">
            <Gauge className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <span className="text-muted-foreground">SMA Dist</span>
              <p className="font-medium text-foreground">
                {data.smaDistance !== null ? `${data.smaDistance.toFixed(3)}%` : '---'}
              </p>
            </div>
          </div>
        </div>

        {/* Signal */}
        <div className="flex items-center justify-between rounded-md bg-secondary/30 p-2 text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Signal</span>
          </div>
          <div className="flex items-center gap-2">
            {data.filterBlocked && (
              <Badge variant="outline" className="border-destructive/50 bg-destructive/10 text-destructive text-[10px]">
                ⛔ {FILTER_LABELS[data.filterBlocked] || data.filterBlocked}
              </Badge>
            )}
            {data.signal && (
              <Badge
                variant="outline"
                className={
                  data.signal.type === 'BUY'
                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                    : data.signal.type === 'SELL'
                    ? 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                    : 'border-trading-neutral/50 bg-trading-neutral/10 text-trading-neutral'
                }
              >
                {data.signal.type}
              </Badge>
            )}
          </div>
        </div>

        {/* Position */}
        {data.position && (
          <div className="rounded-md border border-border/50 bg-secondary/20 p-2 text-xs">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={
                  data.position.direction === 'long'
                    ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                    : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
                }
              >
                {data.position.direction === 'long' ? '📈 LONG' : '📉 SHORT'}
              </Badge>
              {data.unrealizedPnl !== null && (
                <span className={`font-medium ${data.unrealizedPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                  {data.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(data.unrealizedPnl)}
                </span>
              )}
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-muted-foreground">
              <div>
                <span>Entry</span>
                <p className="font-medium text-foreground">{formatCurrency(data.position.entryPrice)}</p>
              </div>
              <div>
                <span>SL</span>
                <p className="font-medium text-trading-loss">{formatCurrency(data.position.stopLoss)}</p>
              </div>
              <div>
                <span>TP</span>
                <p className="font-medium text-trading-profit">{formatCurrency(data.position.takeProfit)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Realized PnL */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Realized P&L</span>
          <span className={`font-medium ${data.realizedPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
            {data.realizedPnl >= 0 ? '+' : ''}{formatCurrency(data.realizedPnl)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
