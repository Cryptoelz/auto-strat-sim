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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Portfolio Value
        </CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(totalValue)}</div>
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              isProfit
                ? 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit'
                : 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss'
            }
          >
            {isProfit ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {formatPercent(pnlPercent)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            ({isProfit ? '+' : ''}{formatCurrency(pnl)})
          </span>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {info.name}
        </CardTitle>
        <Badge variant="outline" className={`text-${info.color}`}>
          {info.symbol}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
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
              className={isUp ? 'text-trading-profit text-sm' : 'text-trading-loss text-sm'}
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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Trading Mode
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMode}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Auto
          </button>
          <button
            onClick={onToggleMode}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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
            className={`mt-3 w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isRunning
                ? 'bg-trading-loss text-trading-loss-foreground'
                : 'bg-trading-profit text-trading-profit-foreground'
            }`}
          >
            {isRunning ? 'Pause Simulation' : 'Start Simulation'}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
