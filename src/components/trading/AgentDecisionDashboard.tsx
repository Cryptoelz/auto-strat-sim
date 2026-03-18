import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Brain, Target, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Activity, Zap, Eye, FileText, Settings,
  ArrowUpRight, ArrowDownRight, Hand, Ban, Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/performance';
import { Asset, Candle, AssetAnalytics, TradingState } from '@/types/trading';
import { MultiStrategyConfig, StrategyId } from '@/types/strategy';
import { ASSET_INFO } from '@/config/trading';
import { getStrategyDefinition, generateAllStrategySignals } from '@/lib/strategyEngine';
import {
  AgentConfig, DEFAULT_AGENT_CONFIG, AgentState, AgentAction,
  ConvictionScore, AgentAuditEntry,
} from '@/types/agent';
import { runAgentDecisionCycle, explainAgentState } from '@/lib/agentDecisionEngine';

// ─── Action icons & labels ───────────────────────────────────────────

const ACTION_ICON: Record<AgentAction, React.ElementType> = {
  OPEN_LONG: ArrowUpRight,
  OPEN_SHORT: ArrowDownRight,
  CLOSE_POSITION: Ban,
  HOLD_POSITION: Hand,
  DO_NOTHING: Pause,
};

const ACTION_STYLE: Record<AgentAction, string> = {
  OPEN_LONG: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  OPEN_SHORT: 'border-trading-loss/50 bg-trading-loss/10 text-trading-loss',
  CLOSE_POSITION: 'border-primary/50 bg-primary/10 text-primary',
  HOLD_POSITION: 'border-muted bg-muted/50 text-muted-foreground',
  DO_NOTHING: 'border-muted bg-muted/50 text-muted-foreground',
};

const RISK_STYLE: Record<string, string> = {
  normal: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  elevated: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  critical: 'border-destructive/50 bg-destructive/10 text-destructive',
};

// ─── Main Component ──────────────────────────────────────────────────

interface AgentDecisionDashboardProps {
  candles: Record<Asset, Candle[]>;
  analytics: Record<Asset, AssetAnalytics>;
  state: TradingState;
  enabledAssets: Asset[];
  multiConfig: MultiStrategyConfig;
  portfolioDrawdown: number;
  agentConfig: AgentConfig;
  onAgentConfigChange: (config: AgentConfig) => void;
}

export function AgentDecisionDashboard({
  candles, analytics, state, enabledAssets, multiConfig,
  portfolioDrawdown, agentConfig, onAgentConfigChange,
}: AgentDecisionDashboardProps) {
  // Generate all strategy signals
  const strategySignals = useMemo(() => {
    const result: Record<Asset, any[]> = {} as any;
    for (const asset of enabledAssets) {
      result[asset] = candles[asset]?.length > 50
        ? generateAllStrategySignals(asset, candles[asset], multiConfig)
        : [];
    }
    return result;
  }, [candles, enabledAssets, multiConfig]);

  // Run agent decision cycle
  const agentState = useMemo(() => {
    return runAgentDecisionCycle(
      enabledAssets,
      strategySignals,
      analytics,
      state,
      portfolioDrawdown,
      10, // max drawdown allowed
      agentConfig,
    );
  }, [enabledAssets, strategySignals, analytics, state, portfolioDrawdown, agentConfig]);

  const summary = useMemo(() => explainAgentState(agentState), [agentState]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="decisions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="decisions" className="text-xs gap-1">
            <Brain className="h-3 w-3" />Decisions
          </TabsTrigger>
          <TabsTrigger value="conviction" className="text-xs gap-1">
            <Target className="h-3 w-3" />Conviction
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1">
            <FileText className="h-3 w-3" />Audit
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1">
            <Settings className="h-3 w-3" />Config
          </TabsTrigger>
        </TabsList>

        {/* ─── Decisions Tab ─────────────────────────── */}
        <TabsContent value="decisions" className="mt-3 space-y-4">
          {/* Agent Status Header */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-primary" />
                Agent Decision Engine
                <Badge variant="outline" className={cn("ml-auto text-[10px]", RISK_STYLE[agentState.riskState])}>
                  {agentState.riskState.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {agentState.isActive ? 'Actively evaluating opportunities' : 'Agent inactive'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 mb-3">
                <p className="text-xs leading-relaxed">{summary}</p>
              </div>

              {/* Top Opportunity */}
              {agentState.topOpportunity ? (
                <div className="rounded-md border border-trading-profit/30 bg-trading-profit/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-trading-profit" />
                      Top Opportunity
                    </span>
                    <Badge variant="outline" className={cn("text-[10px]", ACTION_STYLE[agentState.topOpportunity.action])}>
                      {agentState.topOpportunity.action.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium">{ASSET_INFO[agentState.topOpportunity.asset]?.symbol}</span>
                    <span className="text-muted-foreground">via {getStrategyDefinition(agentState.topOpportunity.strategyId).name}</span>
                    <span className="ml-auto font-mono text-trading-profit">{agentState.topOpportunity.convictionScore.toFixed(0)}/100</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground leading-relaxed">
                    {agentState.topOpportunity.explanation}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-muted bg-muted/30 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    {agentState.noTradeReason ?? 'No opportunities identified.'}
                  </p>
                </div>
              )}

              {/* All Decisions */}
              {agentState.decisions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">Active Decisions</Label>
                  {agentState.decisions.map((d, i) => {
                    const Icon = ACTION_ICON[d.action];
                    return (
                      <div key={i} className="rounded-md border border-border/30 p-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{ASSET_INFO[d.asset]?.symbol}</span>
                            <span className="text-[10px] text-muted-foreground">{getStrategyDefinition(d.strategyId).name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-[10px]", ACTION_STYLE[d.action])}>
                              {d.action.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs font-mono">{d.convictionScore.toFixed(0)}</span>
                          </div>
                        </div>
                        {d.allocationPercent > 0 && (
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                            <span>Allocation: {d.allocationPercent.toFixed(1)}%</span>
                            <span>({formatCurrency(d.allocationAmount)})</span>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{d.explanation}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Performance */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Strategy Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {agentState.recentPerformance.filter((r, i, arr) =>
                  arr.findIndex(x => x.asset === r.asset && x.strategyId === r.strategyId) === i
                ).map((perf, i) => (
                  <div key={i} className="rounded-md border border-border/30 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{ASSET_INFO[perf.asset]?.symbol}</span>
                      <span className="text-[10px] text-muted-foreground">{getStrategyDefinition(perf.strategyId).name}</span>
                      {perf.isUnderperforming && (
                        <Badge variant="outline" className="text-[9px] border-destructive/50 text-destructive px-1 py-0">
                          UNDERPERFORMING
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span>WR: {perf.winRate.toFixed(0)}%</span>
                      <span className={perf.netPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}>
                        {perf.netPnl >= 0 ? '+' : ''}{formatCurrency(perf.netPnl)}
                      </span>
                      <span>{perf.tradeCount} trades</span>
                    </div>
                  </div>
                ))}
                {agentState.recentPerformance.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">No performance data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Conviction Tab ────────────────────────── */}
        <TabsContent value="conviction" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4" />
                Conviction Scores
              </CardTitle>
              <CardDescription className="text-xs">
                Weighted scores for each asset × strategy combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {[...agentState.convictionScores]
                    .sort((a, b) => b.total - a.total)
                    .map((conv, i) => (
                      <ConvictionRow key={i} conviction={conv} threshold={agentConfig.minConvictionScore} />
                    ))}
                  {agentState.convictionScores.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No data — waiting for signals</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Audit Tab ─────────────────────────────── */}
        <TabsContent value="audit" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                Agent Audit Log
              </CardTitle>
              <CardDescription className="text-xs">
                Every decision cycle is recorded for traceability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {agentState.auditLog.map((entry, i) => (
                    <AuditRow key={i} entry={entry} />
                  ))}
                  {agentState.auditLog.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No audit entries yet</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Config Tab ────────────────────────────── */}
        <TabsContent value="settings" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                Agent Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conviction threshold */}
              <div className="space-y-2">
                <Label className="text-xs">Min Conviction Score: {agentConfig.minConvictionScore}</Label>
                <Slider
                  min={10} max={80} step={5}
                  value={[agentConfig.minConvictionScore]}
                  onValueChange={([v]) => onAgentConfigChange({ ...agentConfig, minConvictionScore: v })}
                  className="w-full"
                />
                <p className="text-[10px] text-muted-foreground">
                  Opportunities below this score will not trigger trades
                </p>
              </div>

              <Separator />

              {/* Position sizing */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Base Position %</Label>
                  <Input
                    type="number" min={1} max={20} step={1}
                    value={agentConfig.basePositionSizePercent}
                    onChange={e => onAgentConfigChange({ ...agentConfig, basePositionSizePercent: Number(e.target.value) || 5 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max Position %</Label>
                  <Input
                    type="number" min={5} max={50} step={1}
                    value={agentConfig.maxPositionSizePercent}
                    onChange={e => onAgentConfigChange({ ...agentConfig, maxPositionSizePercent: Number(e.target.value) || 15 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Performance Window</Label>
                  <Input
                    type="number" min={5} max={50} step={5}
                    value={agentConfig.recentPerformanceWindow}
                    onChange={e => onAgentConfigChange({ ...agentConfig, recentPerformanceWindow: Number(e.target.value) || 10 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cooldown Candles</Label>
                  <Input
                    type="number" min={5} max={100} step={5}
                    value={agentConfig.strategyCooldownCandles}
                    onChange={e => onAgentConfigChange({ ...agentConfig, strategyCooldownCandles: Number(e.target.value) || 30 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Max Simultaneous Positions</Label>
                <Input
                  type="number" min={1} max={6} step={1}
                  value={agentConfig.maxSimultaneousPositions}
                  onChange={e => onAgentConfigChange({ ...agentConfig, maxSimultaneousPositions: Number(e.target.value) || 3 })}
                  className="h-8 text-xs"
                />
              </div>

              <Separator />

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Conviction-Based Position Scaling</Label>
                  <Switch
                    checked={agentConfig.convictionPositionScalingEnabled}
                    onCheckedChange={v => onAgentConfigChange({ ...agentConfig, convictionPositionScalingEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Confidence Decay on Underperformance</Label>
                  <Switch
                    checked={agentConfig.confidenceDecayEnabled}
                    onCheckedChange={v => onAgentConfigChange({ ...agentConfig, confidenceDecayEnabled: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Multi-Asset Allocation</Label>
                  <Switch
                    checked={agentConfig.allowMultiAssetAllocation}
                    onCheckedChange={v => onAgentConfigChange({ ...agentConfig, allowMultiAssetAllocation: v })}
                  />
                </div>
              </div>

              <Button
                variant="outline" size="sm" className="w-full text-xs"
                onClick={() => onAgentConfigChange(DEFAULT_AGENT_CONFIG)}
              >
                Reset to Defaults
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function ConvictionRow({ conviction, threshold }: { conviction: ConvictionScore; threshold: number }) {
  const isAbove = conviction.total >= threshold;
  const symbol = ASSET_INFO[conviction.asset]?.symbol ?? conviction.asset;
  const stratName = getStrategyDefinition(conviction.strategyId).name;

  return (
    <div className={cn(
      'rounded-md border p-2.5',
      conviction.eligible
        ? 'border-trading-profit/20 bg-trading-profit/5'
        : 'border-border/30',
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{symbol}</span>
          <span className="text-[10px] text-muted-foreground">{stratName}</span>
          {conviction.eligible && (
            <Badge variant="outline" className="text-[9px] border-trading-profit/50 text-trading-profit px-1 py-0">
              ELIGIBLE
            </Badge>
          )}
        </div>
        <span className={cn(
          'text-sm font-bold font-mono',
          isAbove ? 'text-trading-profit' : 'text-muted-foreground',
        )}>
          {conviction.total.toFixed(0)}
        </span>
      </div>

      {/* Score breakdown bar */}
      <Progress value={conviction.total} className="h-1.5 mb-2" />

      <div className="grid grid-cols-4 gap-1 text-[9px]">
        <ScoreChip label="Signal" value={conviction.signalStrength} max={25} />
        <ScoreChip label="Regime" value={conviction.regimeAlignment} max={20} />
        <ScoreChip label="Volatility" value={conviction.volatilityQuality} max={15} />
        <ScoreChip label="Trend" value={conviction.trendQuality} max={15} />
      </div>
      <div className="grid grid-cols-3 gap-1 mt-1 text-[9px]">
        <ScoreChip label="Recent Perf" value={conviction.recentPerformance} max={15} />
        <ScoreChip label="DD Penalty" value={conviction.drawdownPenalty} max={0} negative />
        <ScoreChip label="Filters" value={conviction.filterStatus} max={10} />
      </div>

      {conviction.disqualifyReason && (
        <p className="mt-1.5 text-[10px] text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {conviction.disqualifyReason}
        </p>
      )}
    </div>
  );
}

function ScoreChip({ label, value, max, negative }: {
  label: string; value: number; max: number; negative?: boolean;
}) {
  return (
    <div className="rounded bg-muted/50 px-1.5 py-0.5 text-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(
        'block font-mono font-medium',
        negative ? (value < 0 ? 'text-destructive' : 'text-muted-foreground') :
        value >= max * 0.7 ? 'text-trading-profit' : 'text-muted-foreground',
      )}>
        {value.toFixed(0)}
      </span>
    </div>
  );
}

function AuditRow({ entry }: { entry: AgentAuditEntry }) {
  const symbol = ASSET_INFO[entry.asset]?.symbol ?? entry.asset;
  const stratName = getStrategyDefinition(entry.strategyId).name;
  const Icon = ACTION_ICON[entry.selectedAction];

  return (
    <div className="rounded-md border border-border/30 p-2.5 text-xs">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5" />
          <span className="font-medium">{symbol}</span>
          <span className="text-[10px] text-muted-foreground">{stratName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[9px]", ACTION_STYLE[entry.selectedAction])}>
            {entry.selectedAction.replace('_', ' ')}
          </Badge>
          <span className="font-mono text-[10px]">{entry.convictionScore.toFixed(0)}</span>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap text-[9px] text-muted-foreground mb-1">
        <span>Signal: {entry.signalType}</span>
        <span>Regime: {entry.regime.replace('trending_', '')}</span>
        <span>Vol: {entry.volatilityCondition}</span>
        <span>Risk: {entry.riskState}</span>
        {entry.allocationPercent > 0 && <span>Alloc: {entry.allocationPercent.toFixed(1)}%</span>}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">{entry.explanation}</p>
    </div>
  );
}
