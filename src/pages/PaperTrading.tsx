import { useState, useMemo, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import { usePaperTrading, StatusMessage } from '@/hooks/usePaperTrading';
import { DEFAULT_CONFIG, ASSET_INFO } from '@/config/trading';
import { Asset, TradingConfig } from '@/types/trading';
import { PortfolioConfig, DEFAULT_PORTFOLIO_CONFIG } from '@/types/portfolio';
import { MultiStrategyConfig, DEFAULT_MULTI_STRATEGY_CONFIG } from '@/types/strategy';
import { AgentConfig, DEFAULT_AGENT_CONFIG } from '@/types/agent';
import { MemoryConfig, DEFAULT_MEMORY_CONFIG } from '@/types/memory';
import { GovernanceConfig, DEFAULT_GOVERNANCE_CONFIG, GovernanceStatus } from '@/types/governance';
import { computePortfolioState } from '@/lib/portfolioManager';
import { StrategyConfig } from '@/components/StrategySettings';
import { PriceChart } from '@/components/trading/PriceChart';
import { AssetDetailPanel } from '@/components/trading/AssetDetailPanel';
import { TradeHistory } from '@/components/trading/TradeHistory';
import { PerformanceStats } from '@/components/trading/PerformanceStats';
import { PortfolioDashboard } from '@/components/trading/PortfolioDashboard';
import { DecisionLog } from '@/components/trading/DecisionLog';
import { AlertsAndReports } from '@/components/trading/AlertsAndReports';
import { StrategyDashboard } from '@/components/trading/StrategyDashboard';
import { AgentDecisionDashboard } from '@/components/trading/AgentDecisionDashboard';
import { AgentMemoryDashboard } from '@/components/trading/AgentMemoryDashboard';
import { AgentGovernanceDashboard } from '@/components/trading/AgentGovernanceDashboard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getLogEntries, subscribeToLog } from '@/lib/logger';
import { formatCurrency } from '@/lib/performance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Play, Pause, RotateCcw, Shield, Wifi, WifiOff,
  AlertTriangle, Activity, TrendingUp, TrendingDown, Zap, Target,
  StopCircle, CheckCircle2, Clock, DollarSign, BarChart3, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncExternalStore } from 'react';
import { format } from 'date-fns';

const MemoizedPerformanceStats = memo(PerformanceStats);

export default function PaperTrading() {
  const [portfolioConfig, setPortfolioConfig] = useState<PortfolioConfig>(DEFAULT_PORTFOLIO_CONFIG);
  const [multiStrategyConfig, setMultiStrategyConfig] = useState<MultiStrategyConfig>(DEFAULT_MULTI_STRATEGY_CONFIG);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig>(DEFAULT_MEMORY_CONFIG);
  const [governanceConfig, setGovernanceConfig] = useState<GovernanceConfig>(DEFAULT_GOVERNANCE_CONFIG);
  const [prevGovStatus, setPrevGovStatus] = useState<GovernanceStatus | null>(null);
  const peakEquityRef = useRef(10000);
  const portfolioLogsRef = useRef<any[]>([]);

  const [strategyConfig] = useState<StrategyConfig>({
    timeframe: DEFAULT_CONFIG.timeframe as '5m' | '15m' | '1h' | '4h',
    enabledAssets: DEFAULT_CONFIG.assets as Asset[],
    fastSMA: DEFAULT_CONFIG.indicators.fastSMA,
    slowSMA: DEFAULT_CONFIG.indicators.slowSMA,
    positionSizePercent: DEFAULT_CONFIG.risk.positionSizePercent,
    stopLossPercent: DEFAULT_CONFIG.risk.stopLossPercent,
    takeProfitPercent: DEFAULT_CONFIG.risk.takeProfitPercent,
    pnlAlertProfit: null,
    pnlAlertLoss: null,
    filters: { ...DEFAULT_CONFIG.filters },
  });

  const config: TradingConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    timeframe: strategyConfig.timeframe,
    assets: strategyConfig.enabledAssets,
    indicators: { ...DEFAULT_CONFIG.indicators, fastSMA: strategyConfig.fastSMA, slowSMA: strategyConfig.slowSMA },
    risk: { ...DEFAULT_CONFIG.risk, positionSizePercent: strategyConfig.positionSizePercent, stopLossPercent: strategyConfig.stopLossPercent, takeProfitPercent: strategyConfig.takeProfitPercent },
    filters: strategyConfig.filters,
  }), [strategyConfig]);

  const {
    state, candles, prices, signals, analytics, isLoading, lastUpdate,
    connectionStatus, statusMessages, enabledAssets, emergencyStop,
    maxDrawdown, dailyPnl, sessionStartTime,
    toggleRunning, toggleAsset, triggerEmergencyStop, clearEmergencyStop, reset, refetch,
  } = usePaperTrading(config);

  const decisionLog = useSyncExternalStore(subscribeToLog, getLogEntries);
  const blockedSignals = useMemo(() => decisionLog.filter(e => e.action === 'blocked'), [decisionLog]);

  // Compute total unrealized PnL
  const unrealizedPnl = useMemo(() => {
    let total = 0;
    for (const asset of config.assets) {
      const pos = state.positions[asset];
      const price = prices[asset];
      if (pos && price) {
        total += pos.direction === 'long'
          ? (price - pos.entryPrice) * pos.size
          : (pos.entryPrice - price) * pos.size;
      }
    }
    return total;
  }, [state.positions, prices, config.assets]);

  const equity = state.balance + unrealizedPnl;
  const totalRealizedPnl = state.trades.reduce((s, t) => s + t.pnl, 0);
  const longTrades = state.trades.filter(t => t.direction === 'long').length;
  const shortTrades = state.trades.filter(t => t.direction === 'short').length;
  const wins = state.trades.filter(t => t.type === 'win').length;
  const winRate = state.trades.length > 0 ? (wins / state.trades.length) * 100 : 0;
  const grossProfit = state.trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(state.trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />Back
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary animate-pulse" />
                Paper Trading
              </h1>
              <p className="text-xs text-muted-foreground">Live simulation — no real orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Connection Status */}
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
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Emergency Warning Banner */}
      {emergencyStop && (
        <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
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
      <div className="bg-primary/5 border-b border-primary/20 px-4 py-1.5">
        <p className="container mx-auto text-xs text-center text-muted-foreground">
          ⚠️ <strong>PAPER TRADING ONLY</strong> — No real orders are placed. All trades are simulated.
        </p>
      </div>

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 space-y-4 sm:space-y-6">
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
                {config.assets.map(asset => (
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
              subtitle={`${state.trades.length} trades (${longTrades}L/${shortTrades}S)`} />
            <MetricCard icon={AlertTriangle} label="Max DD" value={`${maxDrawdown.toFixed(2)}%`}
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
          {config.assets.filter(a => enabledAssets[a]).map(asset => (
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
            config.assets.filter(a => enabledAssets[a]),
            portfolioConfig,
            peakEquityRef.current, portfolioLogsRef.current,
          )}
          portfolioConfig={portfolioConfig}
          onConfigChange={setPortfolioConfig}
          enabledAssets={config.assets.filter(a => enabledAssets[a])}
        />

        {/* Multi-Strategy Dashboard */}
        <StrategyDashboard
          candles={candles}
          enabledAssets={config.assets.filter(a => enabledAssets[a])}
          multiConfig={multiStrategyConfig}
          onConfigChange={setMultiStrategyConfig}
        />

        {/* Agent Decision Engine */}
        <AgentDecisionDashboard
          candles={candles}
          analytics={analytics}
          state={state}
          enabledAssets={config.assets.filter(a => enabledAssets[a])}
          multiConfig={multiStrategyConfig}
          portfolioDrawdown={maxDrawdown}
          agentConfig={agentConfig}
          onAgentConfigChange={setAgentConfig}
        />

        {/* Agent Memory & Adaptation */}
        <AgentMemoryDashboard
          state={state}
          analytics={analytics}
          enabledAssets={config.assets.filter(a => enabledAssets[a])}
          portfolioDrawdown={maxDrawdown}
          memoryConfig={memoryConfig}
          onMemoryConfigChange={setMemoryConfig}
        />

        {/* Agent Governance & Guardrails */}
        <AgentGovernanceDashboard
          state={state}
          analytics={analytics}
          enabledAssets={config.assets.filter(a => enabledAssets[a])}
          portfolioDrawdown={maxDrawdown}
          reconnectErrors={connectionStatus.missedCandles}
          governanceConfig={governanceConfig}
          onGovernanceConfigChange={setGovernanceConfig}
          prevStatus={prevGovStatus}
        />

        {/* Decision Log */}
        <DecisionLog />

        {/* Alerts, Reports & Daily Summary */}
        <AlertsAndReports
          state={state}
          config={config}
          portfolioConfig={portfolioConfig}
          unrealizedPnl={unrealizedPnl}
          maxDrawdown={maxDrawdown}
          sessionStartTime={sessionStartTime}
        />

        {/* Footer */}
        <footer className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong className="text-destructive">SIMULATION ONLY</strong> — No real orders. No real money. No leverage. No private API keys used.
          </p>
        </footer>
      </main>
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
    warning: <AlertTriangle className="h-3 w-3 text-yellow-500 shrink-0" />,
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
        msg.type === 'warning' && 'text-yellow-500',
        msg.type === 'error' && 'text-destructive',
        msg.type === 'blocked' && 'text-muted-foreground',
      )}>
        {msg.message}
      </span>
    </div>
  );
}
