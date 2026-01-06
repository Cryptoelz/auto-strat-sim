import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TradingState, Asset } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { formatCurrency, formatPercent } from '@/lib/performance';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';

interface BalanceCardProps {
  state: TradingState;
  prices: Record<Asset, number | null>;
}

export function BalanceCard({ state, prices }: BalanceCardProps) {
  // Calculate total value including open positions
  let totalValue = state.balance;

  for (const asset of Object.keys(state.positions) as Asset[]) {
    const position = state.positions[asset];
    const price = prices[asset];
    if (position && price) {
      totalValue += position.size * price;
    }
  }

  const pnl = totalValue - state.initialBalance;
  const pnlPercent = ((totalValue - state.initialBalance) / state.initialBalance) * 100;
  const isProfit = pnl >= 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Portfolio Value
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xl font-bold sm:text-2xl md:text-3xl">{formatCurrency(totalValue)}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
          <Badge
            variant="outline"
            className={
              isProfit
                ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit text-xs'
                : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss text-xs'
            }
          >
            {isProfit ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {formatPercent(pnlPercent)}
          </Badge>
          <span className="text-xs text-muted-foreground sm:text-sm">
            ({isProfit ? '+' : ''}{formatCurrency(pnl)})
          </span>
        </div>
        <div className="mt-3 text-xs text-muted-foreground sm:mt-4 sm:text-sm">
          Available: {formatCurrency(state.balance)}
        </div>
      </CardContent>
    </Card>
  );
}

interface PriceCardProps {
  asset: Asset;
  price: number | null;
  previousPrice?: number;
}

export function PriceCard({ asset, price, previousPrice }: PriceCardProps) {
  const info = ASSET_INFO[asset];
  const priceChange = previousPrice && price ? ((price - previousPrice) / previousPrice) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          {info.name}
        </CardTitle>
        <Badge variant="outline" className={`text-${info.color} text-xs`}>
          {info.symbol}
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-lg font-bold sm:text-xl md:text-2xl">
          {price ? formatCurrency(price) : '---'}
        </div>
        {previousPrice && price && (
          <div className="mt-1 flex items-center gap-1">
            {isUp ? (
              <TrendingUp className="h-3 w-3 text-trading-profit" />
            ) : (
              <TrendingDown className="h-3 w-3 text-trading-loss" />
            )}
            <span
              className={isUp ? 'text-trading-profit text-xs sm:text-sm' : 'text-trading-loss text-xs sm:text-sm'}
            >
              {formatPercent(priceChange)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ModeCardProps {
  mode: 'auto' | 'manual';
  isRunning: boolean;
  onToggleMode: () => void;
  onToggleRunning: () => void;
}

export function ModeCard({ mode, isRunning, onToggleMode, onToggleRunning }: ModeCardProps) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Trading Mode
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMode}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              mode === 'auto'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Auto
          </button>
          <button
            onClick={onToggleMode}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              mode === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Manual
          </button>
        </div>
        {mode === 'auto' && (
          <button
            onClick={onToggleRunning}
            className={`mt-2.5 w-full rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:mt-3 sm:px-4 sm:py-2 sm:text-sm ${
              isRunning
                ? 'bg-trading-loss text-trading-loss-foreground'
                : 'bg-trading-profit text-trading-profit-foreground'
            }`}
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
