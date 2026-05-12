/**
 * Paper Trading — Presentation layer only.
 * All state and logic comes from TradingContext (single source of truth).
 */
import { useMemo, memo } from 'react';
import { useTradingContext } from '@/contexts/TradingContext';
import { StatusMessage } from '@/hooks/useUnifiedTradingEngine';
import { ASSET_INFO } from '@/config/trading';
import { Asset } from '@/types/trading';
import { computePortfolioState } from '@/lib/portfolioManager';
import { computeTradeStats } from '@/lib/tradingCalculations';
import { PriceChart } from '@/components/trading/PriceChart';
import { AssetDetailPanel } from '@/components/trading/AssetDetailPanel';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { PortfolioDashboard } from '@/components/trading/PortfolioDashboard';
import { DecisionLog } from '@/components/trading/DecisionLog';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';
import { SessionHistoryPanel } from '@/components/trading/SessionHistoryPanel';
import { CleanSessionButton } from '@/components/trading/CleanSessionButton';
import { StrategyDashboard } from '@/components/trading/StrategyDashboard';
import { AgentDecisionDashboard } from '@/components/trading/AgentDecisionDashboard';
import { AgentMemoryDashboard } from '@/components/trading/AgentMemoryDashboard';
import { AgentGovernanceDashboard } from '@/components/trading/AgentGovernanceDashboard';
import { OperatorControlDashboard } from '@/components/trading/OperatorControlDashboard';
import { ExperimentDashboard } from '@/components/trading/ExperimentDashboard';
import { ReadinessDashboard } from '@/components/trading/ReadinessDashboard';
import { OrchestrationDashboard } from '@/components/trading/OrchestrationDashboard';
import { formatCurrency } from '@/lib/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Play, Pause, RotateCcw, Shield, Wifi, WifiOff,
  AlertTriangle, Activity, TrendingUp, Zap, Target,
  StopCircle, CheckCircle2, Clock, DollarSign, BarChart3, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const MemoizedPerformanceStats = memo(PerformanceStats);

export default function PaperTrading() {
  const ctx = useTradingContext();
  const {
    // Core state (from single engine)
    state, candles, prices, signals, analytics, isLoading, lastUpdate,
    // Computed values (single source of truth)
    equity, unrealizedPnl, drawdown, dailyPnl, peakEquity,
    // Paper-mode controls
    connectionStatus, statusMessages, enabledAssets, emergencyStop, sessionStartTime,
    toggleRunning, toggleAsset, triggerEmergencyStop, clearEmergencyStop, clearConnectionErrors, reset, refetch,
    // Config (from context — no local state)
    strategyConfig, config,
    portfolioConfig, setPortfolioConfig,
    multiStrategyConfig, setMultiStrategyConfig,
    agentConfig, setAgentConfig,
    memoryConfig, setMemoryConfig,
    governanceConfig, setGovernanceConfig, prevGovStatus,
    operatorState, setOperatorState,
    operatorConfig, setOperatorConfig,
    blockedSignals,
  } = ctx;

  const { total, wins, winRate, longTrades, shortTrades, profitFactor } = useMemo(
    () => computeTradeStats(state.trades), [state.trades],
  );
  const totalRealizedPnl = state.trades.reduce((s, t) => s + t.pnl, 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2 sm:text-xl">
            <Radio className="h-5 w-5 text-primary animate-pulse" />
            Paper Trading
          </h1>
          <p className="text-xs text-muted-foreground">Live simulation — no real orders</p>
        </div>
        <div className="flex items-center gap-2">
          <CleanSessionButton />
          <Badge variant="outline" className={cn(
            "text-xs",
            connectionStatus.connected
              ? "border-trading-profit/50 text-trading-profit"
              : "border-trading-loss/50 text-trading-loss"
          )}>
            {connectionStatus.connected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {connectionStatus.connected ? 'LIVE' : connectionStatus.reconnecting ? 'RECONNECTING' : 'OFFLINE'}
          </Badge>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {format(lastUpdate, 'HH:mm:ss')}
            </span>
          )}
        </div>
      </div>

      {/* Emergency Warning Banner */}
      {emergencyStop && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <StopCircle className="h-4 w-4" />
              EMERGENCY STOP ACTIVE — All trading halted
            </div>
            <Button size="sm" variant="outline" onClick={clearEmergencyStop} className="text-xs">
              Clear & Resume
            </Button>
          </div>
        </div>
      )}

      {/* Simulation Disclaimer */}
      <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-1.5 text-center">
        <p className="text-xs text-muted-foreground">
          ⚠️ <strong>PAPER TRADING ONLY</strong> — No real orders are placed. All trades are simulated.
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Controls & Live Metrics */}
        <div className="grid gap-3 md:grid-cols-5">
          {/* Safety Controls */}
          <Card className="border-border/50 bg-card/50 backdrop-blur md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={toggleRunning}
                  disabled={emergencyStop}
                  className={cn("flex-1 gap-2", state.isRunning ? "bg-destructive hover:bg-destructive/90" : "")}
                  size="sm"
                >
                  {state.isRunning ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Start</>}
                </Button>
                <Button variant="destructive" size="sm" onClick={triggerEmergencyStop} disabled={emergencyStop} className="gap-1">
                  <StopCircle className="h-4 w-4" />STOP
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="gap-1">
                  <RotateCcw className="h-4 w-4" />Reset
                </Button>
              </div>

              {/* Per-asset toggles */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Asset Controls</Label>
                {config.assets.map((asset: Asset) => (
                  <div key={asset} className="flex items-center justify-between">
                    <Label className="text-xs">{ASSET_INFO[asset].symbol}</Label>
                    <Switch checked={enabledAssets[asset]} onCheckedChange={() => toggleAsset(asset)} disabled={emergencyStop} />
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={cn("text-[10px]",
                    state.isPaused ? "border-destructive/50 text-destructive" :
                    state.isRunning ? "border-trading-profit/50 text-trading-profit" :
                    "border-muted text-muted-foreground"
                  )}>
                    {state.isPaused ? 'RISK PAUSE' : state.isRunning ? 'RUNNING' : 'STOPPED'}
                  </Badge>
                </div>
                {state.isPaused && state.pauseReason && (
                  <p className="text-[10px] text-destructive">{state.pauseReason}</p>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session</span>
                  <span>{format(sessionStartTime, 'MMM dd HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Missed Candles</span>
                  <span className={connectionStatus.missedCandles > 0 ? "text-destructive" : ""}>{connectionStatus.missedCandles}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Metrics */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <MetricCard icon={DollarSign} label="Equity" value={formatCurrency(equity)}
              color={equity >= state.initialBalance ? "text-trading-profit" : "text-trading-loss"} />
            <MetricCard icon={TrendingUp} label="Realized P&L" value={`${totalRealizedPnl >= 0 ? '+' : ''}${formatCurrency(totalRealizedPnl)}`}
              color={totalRealizedPnl >= 0 ? "text-trading-profit" : "text-trading-loss"} />
            <MetricCard icon={Activity} label="Unrealized P&L" value={`${unrealizedPnl >= 0 ? '+' : ''}${formatCurrency(unrealizedPnl)}`}
              color={unrealizedPnl >= 0 ? "text-trading-profit" : "text-trading-loss"} />
            <MetricCard icon={BarChart3} label="Daily P&L" value={`${dailyPnl >= 0 ? '+' : ''}${formatCurrency(dailyPnl)}`}
              color={dailyPnl >= 0 ? "text-trading-profit" : "text-trading-loss"} />
            <MetricCard icon={Target} label="Win Rate" value={`${winRate.toFixed(1)}%`}
              color={winRate >= 50 ? "text-trading-profit" : "text-trading-loss"}
              subtitle={`${total} trades (${longTrades}L/${shortTrades}S)`} />
            <MetricCard icon={AlertTriangle} label="Max DD" value={`${drawdown.toFixed(2)}%`}
              color="text-trading-loss" subtitle={`PF: ${profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}`} />
          </div>
        </div>

        {/* Live Status Feed */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Live Status Feed
              <Badge variant="secondary" className="ml-auto text-[10px]">{statusMessages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[140px]">
              {statusMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Waiting for events...</p>
              ) : (
                <div className="space-y-1">
                  {statusMessages.slice(0, 30).map(msg => (
                    <StatusMessageRow key={msg.id} msg={msg} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Charts + Asset Monitoring */}
        <div className="grid gap-4 md:grid-cols-2">
          {config.assets.filter((a: Asset) => enabledAssets[a]).map((asset: Asset) => (
            <div key={asset} className="space-y-3">
              <PriceChart
                asset={asset}
                candles={candles[asset]}
                position={state.positions[asset] ? { entryPrice: state.positions[asset]!.entryPrice, direction: state.positions[asset]!.direction } : null}
                fastSMA={strategyConfig.fastSMA}
                slowSMA={strategyConfig.slowSMA}
                trades={state.trades}
                blockedSignals={blockedSignals}
              />
              <AssetDetailPanel asset={asset} data={analytics[asset]} />
            </div>
          ))}
        </div>

        {/* Trade History & Performance */}
        <div className="grid gap-4 lg:grid-cols-2">
          <TradeHistory trades={state.trades} />
          <MemoizedPerformanceStats state={state} />
        </div>

        {/* Portfolio Dashboard */}
        <PortfolioDashboard
          portfolioState={computePortfolioState(
            state, prices, analytics, signals,
            config.assets.filter((a: Asset) => enabledAssets[a]),
            portfolioConfig,
            peakEquity, [],
          )}
          portfolioConfig={portfolioConfig}
          onConfigChange={setPortfolioConfig}
          enabledAssets={config.assets.filter((a: Asset) => enabledAssets[a])}
        />

        {/* Multi-Strategy Dashboard */}
        <StrategyDashboard
          candles={candles}
          enabledAssets={config.assets.filter((a: Asset) => enabledAssets[a])}
          multiConfig={multiStrategyConfig}
          onConfigChange={setMultiStrategyConfig}
        />

        {/* Operator Controls & Policy */}
        <OperatorControlDashboard
          operatorState={operatorState}
          onStateChange={setOperatorState}
          operatorConfig={operatorConfig}
          onConfigChange={setOperatorConfig}
        />

        {/* Agent Decision Engine */}
        <AgentDecisionDashboard
          candles={candles}
          analytics={analytics}
          state={state}
          enabledAssets={config.assets.filter((a: Asset) => enabledAssets[a])}
          multiConfig={multiStrategyConfig}
          portfolioDrawdown={drawdown}
          agentConfig={agentConfig}
          onAgentConfigChange={setAgentConfig}
        />

        {/* Agent Memory & Adaptation */}
        <AgentMemoryDashboard
          state={state}
          analytics={analytics}
          enabledAssets={config.assets.filter((a: Asset) => enabledAssets[a])}
          portfolioDrawdown={drawdown}
          memoryConfig={memoryConfig}
          onMemoryConfigChange={setMemoryConfig}
        />

        {/* Agent Governance & Guardrails */}
        <AgentGovernanceDashboard
          state={state}
          analytics={analytics}
          enabledAssets={config.assets.filter((a: Asset) => enabledAssets[a])}
          portfolioDrawdown={drawdown}
          reconnectErrors={connectionStatus.missedCandles}
          governanceConfig={governanceConfig}
          onGovernanceConfigChange={setGovernanceConfig}
          prevStatus={prevGovStatus}
          onClearConnectionErrors={clearConnectionErrors}
        />

        {/* Experiment Management */}
        <ExperimentDashboard />

        {/* Readiness Review & Validation */}
        <ReadinessDashboard state={state} />

        {/* Master Orchestration */}
        <OrchestrationDashboard />

        {/* Decision Log */}
        <DecisionLog />

        {/* Alerts, Reports & Daily Summary */}
        <AlertsAndReports
          state={state}
          config={config}
          portfolioConfig={portfolioConfig}
          unrealizedPnl={unrealizedPnl}
          maxDrawdown={drawdown}
          sessionStartTime={sessionStartTime}
        />

        {/* Session History */}
        <SessionHistoryPanel />

        {/* Footer */}
        <footer className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong className="text-destructive">SIMULATION ONLY</strong> — No real orders. No real money. No leverage. No private API keys used.
          </p>
        </footer>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType; label: string; value: string; color: string; subtitle?: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
        </div>
        <p className={cn("text-lg font-bold", color)}>{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function StatusMessageRow({ msg }: { msg: StatusMessage }) {
  const iconMap = {
    info: <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />,
    trade: <Zap className="h-3 w-3 text-trading-profit shrink-0" />,
    warning: <AlertTriangle className="h-3 w-3 text-trading-warning shrink-0" />,
    error: <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />,
    blocked: <StopCircle className="h-3 w-3 text-muted-foreground shrink-0" />,
  };

  return (
    <div className="flex items-start gap-2 text-xs py-1 border-b border-border/20 last:border-0">
      {iconMap[msg.type]}
      <span className="text-[10px] text-muted-foreground shrink-0 w-16">
        {format(msg.timestamp, 'HH:mm:ss')}
      </span>
      {msg.asset && (
        <Badge variant="outline" className="text-[10px] shrink-0 py-0 h-4">
          {msg.asset.replace('USDT', '')}
        </Badge>
      )}
      <span className={cn("text-xs",
        msg.type === 'trade' && 'text-trading-profit',
        msg.type === 'warning' && 'text-trading-warning',
        msg.type === 'error' && 'text-destructive',
        msg.type === 'blocked' && 'text-muted-foreground',
      )}>
        {msg.message}
      </span>
    </div>
  );
}
