import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTradingContext } from '@/contexts/TradingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/performance';
import { ASSET_INFO } from '@/config/trading';
import { Asset } from '@/types/trading';
import {
  DollarSign, TrendingUp, TrendingDown, Activity, Shield, Zap,
  ArrowRight, BarChart3, AlertTriangle, Clock, LineChart, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Overview() {
  const {
    state, prices, signals, analytics, isLoading, lastUpdate,
    strategyConfig, operatorState, blockedSignals, decisionLog,
    sessionStartTime,
  } = useTradingContext();

  const equity = useMemo(() => {
    let total = state.balance;
    for (const [asset, pos] of Object.entries(state.positions)) {
      if (!pos || !prices[asset as Asset]) continue;
      const p = prices[asset as Asset]!;
      total += pos.direction === 'long'
        ? (p - pos.entryPrice) * pos.size
        : (pos.entryPrice - p) * pos.size;
    }
    return total;
  }, [state, prices]);

  const unrealizedPnl = useMemo(() => {
    return Object.entries(state.positions).reduce((sum, [asset, pos]) => {
      if (!pos || !prices[asset as Asset]) return sum;
      const p = prices[asset as Asset]!;
      return sum + (pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size);
    }, 0);
  }, [state, prices]);

  const realizedPnl = state.balance - state.initialBalance;
  const totalReturn = ((equity - state.initialBalance) / state.initialBalance) * 100;
  const activePositions = Object.values(state.positions).filter(Boolean);
  const recentTrades = state.trades.slice(-5).reverse();
  const recentBlocked = blockedSignals.slice(-5).reverse();
  const sessionDuration = Date.now() - sessionStartTime;
  const sessionHours = Math.floor(sessionDuration / 3600000);
  const sessionMins = Math.floor((sessionDuration % 3600000) / 60000);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" /> <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">System Overview</h1>
          <p className="text-xs text-muted-foreground">
            {lastUpdate ? `Updated ${format(lastUpdate, 'HH:mm:ss')}` : 'Waiting for data…'}
            {' · '}Session {sessionHours}h {sessionMins}m
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge variant={state.isRunning ? 'active' : 'paused'} label={state.isRunning ? 'Running' : 'Stopped'} size="md" />
          <StatusBadge variant={state.isPaused ? 'restricted' : 'healthy'} label={state.isPaused ? 'Risk Paused' : 'Healthy'} size="md" />
          <StatusBadge variant="info" label={`${operatorState.autonomyMode.replace(/_/g, ' ')}`} size="md" />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={DollarSign}
          label="Portfolio Equity"
          value={formatCurrency(equity)}
          change={totalReturn}
          iconColor="text-primary"
        />
        <MetricCard
          icon={TrendingUp}
          label="Realized P&L"
          value={formatCurrency(realizedPnl)}
          change={null}
          iconColor={realizedPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}
        />
        <MetricCard
          icon={Activity}
          label="Unrealized P&L"
          value={formatCurrency(unrealizedPnl)}
          change={null}
          iconColor={unrealizedPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}
        />
        <MetricCard
          icon={BarChart3}
          label="Total Trades"
          value={String(state.trades.length)}
          change={null}
          iconColor="text-primary"
        />
      </div>

      {/* Active Positions + Asset Prices */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Active Positions</CardTitle>
              <Link to="/trading">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  View Charts <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activePositions.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No open positions"
                description="The agent has no active positions. Signals are being evaluated."
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {Object.entries(state.positions).map(([asset, pos]) => {
                  if (!pos) return null;
                  const p = prices[asset as Asset];
                  const pnl = p ? (pos.direction === 'long' ? (p - pos.entryPrice) * pos.size : (pos.entryPrice - p) * pos.size) : 0;
                  return (
                    <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge variant={pos.direction === 'long' ? 'long' : 'short'} />
                        <span className="text-sm font-medium">{asset}</span>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-sm font-semibold', pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                          {formatCurrency(pnl)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Entry {formatCurrency(pos.entryPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Asset Overview</CardTitle>
              <Link to="/portfolio">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Portfolio <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {strategyConfig.enabledAssets.map((asset) => {
                  const info = ASSET_INFO[asset];
                  const price = prices[asset];
                  const a = analytics[asset];
                  const regime = a?.marketRegime || 'sideways';
                  return (
                    <div key={asset} className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{info?.name || asset}</span>
                        <StatusBadge variant={regime.includes('bullish') ? 'bullish' : regime.includes('bearish') ? 'bearish' : 'sideways'} label={regime} />
                    </div>
                    <p className="text-sm font-mono font-semibold">
                      {price ? formatCurrency(price) : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades + Blocked Signals */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Trades</CardTitle>
              <Link to="/trading">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  All Trades <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <EmptyState
                icon={LineChart}
                title="No trades yet"
                description="The agent hasn't executed any simulated trades in this session."
                className="py-6"
              />
            ) : (
              <div className="space-y-2">
                {recentTrades.map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border/30 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <StatusBadge variant={t.direction === 'long' ? 'long' : 'short'} size="sm" />
                      <span className="font-medium">{t.asset}</span>
                    </div>
                    <span className={cn('font-mono font-semibold', (t.pnl || 0) >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                      {formatCurrency(t.pnl || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Blocked Signals</CardTitle>
              <Badge variant="outline" className="text-[10px]">{blockedSignals.length} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recentBlocked.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No blocked signals"
                description="All signals have passed filters and governance checks."
                className="py-6"
              />
            ) : (
              <div className="space-y-2">
                {recentBlocked.map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border border-border/30 px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span>{b.asset}</span>
                    </div>
                    <span className="text-muted-foreground truncate max-w-[200px]">{b.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav */}
      <Card className="border-dashed">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Live Trading', to: '/trading', icon: LineChart },
              { label: 'Strategies', to: '/strategies', icon: Layers },
              { label: 'Governance', to: '/governance', icon: Shield },
              { label: 'Experiments', to: '/experiments', icon: Zap },
              { label: 'Readiness', to: '/readiness', icon: ClipboardCheck },
              { label: 'System Health', to: '/system-health', icon: Activity },
            ].map((item) => (
              <Link key={item.to} to={item.to}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="rounded-lg border border-border/50 bg-card/30 p-3 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>SIMULATION ONLY</strong> — No real trades. No live orders. No leverage.
        </p>
      </footer>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────

import { ClipboardCheck, Layers } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, change, iconColor }: {
  icon: any; label: string; value: string; change: number | null; iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-lg font-bold text-foreground sm:text-xl">{value}</p>
            {change !== null && (
              <p className={cn('text-xs font-medium', change >= 0 ? 'text-trading-profit' : 'text-trading-loss')}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted p-2">
            <Icon className={cn('h-4 w-4', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
