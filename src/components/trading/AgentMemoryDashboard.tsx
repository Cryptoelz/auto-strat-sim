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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Brain, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Activity, Eye, FileText, Settings, RotateCcw,
  Thermometer, Wind, Gauge, Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/performance';
import { Asset, AssetAnalytics, TradingState } from '@/types/trading';
import { ASSET_INFO } from '@/config/trading';
import { getStrategyDefinition } from '@/lib/strategyEngine';
import {
  MemoryConfig, DEFAULT_MEMORY_CONFIG, AdaptationMode,
  CautionLevel, AgentMemoryState, StrategyMemoryEntry, AdaptationAuditEntry,
} from '@/types/memory';
import { computeAgentMemory, explainAdaptation } from '@/lib/memoryEngine';

// ─── Style Helpers ───────────────────────────────────────────────────

const CAUTION_STYLE: Record<CautionLevel, string> = {
  low: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  moderate: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500',
  high: 'border-orange-500/50 bg-orange-500/10 text-orange-500',
  extreme: 'border-destructive/50 bg-destructive/10 text-destructive',
};

const MODE_LABELS: Record<AdaptationMode, string> = {
  conservative: 'Conservative',
  balanced: 'Balanced',
  aggressive: 'Aggressive',
};

// ─── Main Component ──────────────────────────────────────────────────

interface AgentMemoryDashboardProps {
  state: TradingState;
  analytics: Record<Asset, AssetAnalytics>;
  enabledAssets: Asset[];
  portfolioDrawdown: number;
  memoryConfig: MemoryConfig;
  onMemoryConfigChange: (config: MemoryConfig) => void;
}

export function AgentMemoryDashboard({
  state, analytics, enabledAssets, portfolioDrawdown,
  memoryConfig, onMemoryConfigChange,
}: AgentMemoryDashboardProps) {
  const [prevMemory, setPrevMemory] = useState<AgentMemoryState | null>(null);

  const memory = useMemo(() => {
    const m = computeAgentMemory(
      state, analytics, enabledAssets, portfolioDrawdown,
      memoryConfig, prevMemory,
    );
    return m;
  }, [state, analytics, enabledAssets, portfolioDrawdown, memoryConfig, prevMemory]);

  // Update prev for next cycle (on state change this triggers re-memo)
  // We use a ref-like pattern — prevMemory lags one cycle behind
  // This is safe because useMemo runs synchronously
  const explanationText = useMemo(() => explainAdaptation(memory), [memory]);

  const handleReset = () => {
    setPrevMemory(null);
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs gap-1">
            <Brain className="h-3 w-3" />Memory
          </TabsTrigger>
          <TabsTrigger value="confidence" className="text-xs gap-1">
            <Gauge className="h-3 w-3" />Confidence
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1">
            <FileText className="h-3 w-3" />Audit
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs gap-1">
            <Settings className="h-3 w-3" />Config
          </TabsTrigger>
        </TabsList>

        {/* ─── Memory Overview ───────────────────────── */}
        <TabsContent value="overview" className="mt-3 space-y-4">
          {/* Adaptation Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-primary" />
                Agent Memory & Adaptation
                <Badge variant="outline" className={cn("ml-auto text-[10px]", CAUTION_STYLE[memory.adaptation.cautionLevel])}>
                  CAUTION: {memory.adaptation.cautionLevel.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {memory.adaptation.isAdaptationActive ? 'Adaptation active' : 'Adaptation disabled'}
                {' • '}Mode: {MODE_LABELS[memoryConfig.adaptationMode]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 mb-3">
                <p className="text-xs leading-relaxed">{explanationText}</p>
              </div>

              {/* Multipliers */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MultiplierCard
                  icon={Thermometer}
                  label="Position Size"
                  value={memory.adaptation.positionSizeMultiplier}
                />
                <MultiplierCard
                  icon={Activity}
                  label="Trade Frequency"
                  value={memory.adaptation.tradeFrequencyMultiplier}
                />
              </div>

              {/* Market Memory */}
              <Card className="border-border/30">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Waves className="h-3.5 w-3.5" />Market Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2 space-y-1.5">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Dominant Regime</p>
                      <p className="text-[10px] font-medium capitalize">{memory.market.dominantRegime.replace('trending_', '')}</p>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Stability</p>
                      <p className="text-[10px] font-medium">{memory.market.regimeStability.toFixed(0)}%</p>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Avg Volatility</p>
                      <p className="text-[10px] font-medium">{memory.market.avgVolatility.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {memory.market.recentConditions.map(c => (
                      <Badge key={c} variant="secondary" className="text-[9px] px-1.5 py-0">
                        {c.replace('_', ' ')}
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      vol: {memory.market.volatilityTrend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Memory */}
              <Card className="border-border/30 mt-2">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />Risk Memory
                    <Badge variant="outline" className={cn("ml-auto text-[9px]", CAUTION_STYLE[memory.risk.stressLevel])}>
                      {memory.risk.stressLevel.toUpperCase()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Consec. Losses</p>
                      <p className={cn("text-[10px] font-medium", memory.risk.consecutiveLosses >= 3 ? 'text-destructive' : '')}>
                        {memory.risk.consecutiveLosses}
                      </p>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Stop-Loss Exits</p>
                      <p className="text-[10px] font-medium">{memory.risk.recentStopLossCount}</p>
                    </div>
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[9px] text-muted-foreground">Drawdown</p>
                      <p className={cn("text-[10px] font-medium", memory.risk.currentDrawdownPercent > 5 ? 'text-destructive' : '')}>
                        {memory.risk.currentDrawdownPercent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Bias */}
              <Card className="border-border/30 mt-2">
                <CardHeader className="pb-1 pt-2 px-3">
                  <CardTitle className="text-xs flex items-center gap-1.5">
                    <Wind className="h-3.5 w-3.5" />Portfolio Memory
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2">
                  <div className="space-y-1">
                    {enabledAssets.map(asset => {
                      const bias = memory.portfolio.allocationBias[asset] ?? 0;
                      return (
                        <div key={asset} className="flex items-center justify-between text-xs">
                          <span>{ASSET_INFO[asset]?.symbol}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={50 + bias * 50} className="h-1.5 w-20" />
                            <span className={cn(
                              "text-[10px] font-mono w-12 text-right",
                              bias > 0 ? 'text-trading-profit' : bias < 0 ? 'text-trading-loss' : 'text-muted-foreground',
                            )}>
                              {bias > 0 ? '+' : ''}{(bias * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Avg recent return: {formatCurrency(memory.portfolio.avgRecentReturn)}
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Confidence Tab ────────────────────────── */}
        <TabsContent value="confidence" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gauge className="h-4 w-4" />
                Strategy Confidence Memory
              </CardTitle>
              <CardDescription className="text-xs">
                Per-asset strategy confidence adjusted by recent performance, regime fit, and risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {memory.strategies.map((entry, i) => (
                    <ConfidenceRow key={i} entry={entry} />
                  ))}
                  {memory.strategies.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No strategy data yet</p>
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
                Adaptation Audit Log
              </CardTitle>
              <CardDescription className="text-xs">
                Confidence changes with full reasoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {memory.auditLog.map((entry, i) => (
                    <AuditRow key={i} entry={entry} />
                  ))}
                  {memory.auditLog.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No confidence changes detected yet
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Config Tab ────────────────────────────── */}
        <TabsContent value="config" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                Memory & Adaptation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Enable Adaptation</Label>
                <Switch
                  checked={memoryConfig.adaptationEnabled}
                  onCheckedChange={v => onMemoryConfigChange({ ...memoryConfig, adaptationEnabled: v })}
                />
              </div>

              <Separator />

              {/* Mode */}
              <div className="space-y-1">
                <Label className="text-xs">Adaptation Mode</Label>
                <Select
                  value={memoryConfig.adaptationMode}
                  onValueChange={v => onMemoryConfigChange({ ...memoryConfig, adaptationMode: v as AdaptationMode })}
                >
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative" className="text-xs">Conservative — slow, minimal adjustments</SelectItem>
                    <SelectItem value="balanced" className="text-xs">Balanced — moderate adjustments</SelectItem>
                    <SelectItem value="aggressive" className="text-xs">Aggressive — fast, larger adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Windows */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Trade Window (small)</Label>
                  <Input
                    type="number" min={5} max={30} step={5}
                    value={memoryConfig.memoryTradeWindow}
                    onChange={e => onMemoryConfigChange({ ...memoryConfig, memoryTradeWindow: Number(e.target.value) || 10 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Trade Window (large)</Label>
                  <Input
                    type="number" min={10} max={50} step={5}
                    value={memoryConfig.memoryTradeWindowLarge}
                    onChange={e => onMemoryConfigChange({ ...memoryConfig, memoryTradeWindowLarge: Number(e.target.value) || 20 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Decay & Strength */}
              <div className="space-y-2">
                <Label className="text-xs">Confidence Decay Rate: {memoryConfig.confidenceDecayRate.toFixed(2)}</Label>
                <Slider
                  min={0.01} max={0.2} step={0.01}
                  value={[memoryConfig.confidenceDecayRate]}
                  onValueChange={([v]) => onMemoryConfigChange({ ...memoryConfig, confidenceDecayRate: v })}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Adaptation Strength: {memoryConfig.adaptationStrength.toFixed(2)}</Label>
                <Slider
                  min={0.1} max={1.0} step={0.1}
                  value={[memoryConfig.adaptationStrength]}
                  onValueChange={([v]) => onMemoryConfigChange({ ...memoryConfig, adaptationStrength: v })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Max Confidence Adjustment (±points)</Label>
                <Input
                  type="number" min={5} max={40} step={5}
                  value={memoryConfig.maxConfidenceAdjustment}
                  onChange={e => onMemoryConfigChange({ ...memoryConfig, maxConfidenceAdjustment: Number(e.target.value) || 20 })}
                  className="h-8 text-xs"
                />
              </div>

              {/* Thresholds */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Loss Streak Caution</Label>
                  <Input
                    type="number" min={2} max={10} step={1}
                    value={memoryConfig.lossStreakCautionThreshold}
                    onChange={e => onMemoryConfigChange({ ...memoryConfig, lossStreakCautionThreshold: Number(e.target.value) || 3 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Drawdown Caution %</Label>
                  <Input
                    type="number" min={2} max={20} step={1}
                    value={memoryConfig.drawdownCautionThreshold}
                    onChange={e => onMemoryConfigChange({ ...memoryConfig, drawdownCautionThreshold: Number(e.target.value) || 5 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="text-xs">Persist Memory Across Sessions</Label>
                <Switch
                  checked={memoryConfig.persistMemoryAcrossSessions}
                  onCheckedChange={v => onMemoryConfigChange({ ...memoryConfig, persistMemoryAcrossSessions: v })}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm" className="flex-1 text-xs gap-1"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-3 w-3" />Reset Memory
                </Button>
                <Button
                  variant="outline" size="sm" className="flex-1 text-xs"
                  onClick={() => onMemoryConfigChange(DEFAULT_MEMORY_CONFIG)}
                >
                  Reset Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function MultiplierCard({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: number;
}) {
  const isReduced = value < 0.95;
  return (
    <div className={cn(
      'rounded-md border p-2.5 text-center',
      isReduced ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border/30',
    )}>
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className={cn(
        'text-lg font-bold font-mono',
        isReduced ? 'text-yellow-500' : 'text-trading-profit',
      )}>
        ×{value.toFixed(2)}
      </span>
    </div>
  );
}

function ConfidenceRow({ entry }: { entry: StrategyMemoryEntry }) {
  const symbol = ASSET_INFO[entry.asset]?.symbol ?? entry.asset;
  const stratName = getStrategyDefinition(entry.strategyId).name;
  const delta = entry.confidence - entry.priorConfidence;

  return (
    <div className={cn(
      'rounded-md border p-2.5',
      entry.isOnCooldown ? 'border-destructive/20 bg-destructive/5' : 'border-border/30',
    )}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{symbol}</span>
          <span className="text-[10px] text-muted-foreground">{stratName}</span>
          {entry.isOnCooldown && (
            <Badge variant="outline" className="text-[9px] border-destructive/50 text-destructive px-1 py-0">
              COOLDOWN
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {Math.abs(delta) > 0.5 && (
            <span className={cn("text-[10px] font-mono",
              delta > 0 ? 'text-trading-profit' : 'text-trading-loss',
            )}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
            </span>
          )}
          <span className={cn(
            'text-sm font-bold font-mono',
            entry.confidence >= 60 ? 'text-trading-profit' :
            entry.confidence >= 40 ? 'text-yellow-500' :
            'text-destructive',
          )}>
            {entry.confidence.toFixed(0)}
          </span>
        </div>
      </div>

      <Progress value={entry.confidence} className="h-1.5 mb-2" />

      <div className="grid grid-cols-4 gap-1 text-[9px]">
        <div className="rounded bg-muted/50 px-1.5 py-0.5 text-center">
          <span className="text-muted-foreground">Win Rate</span>
          <span className="block font-mono font-medium">{entry.recentWinRate.toFixed(0)}%</span>
        </div>
        <div className="rounded bg-muted/50 px-1.5 py-0.5 text-center">
          <span className="text-muted-foreground">PnL</span>
          <span className={cn("block font-mono font-medium",
            entry.recentPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss',
          )}>
            {formatCurrency(entry.recentPnl)}
          </span>
        </div>
        <div className="rounded bg-muted/50 px-1.5 py-0.5 text-center">
          <span className="text-muted-foreground">Regime Fit</span>
          <span className="block font-mono font-medium">{entry.regimeFit.toFixed(0)}%</span>
        </div>
        <div className="rounded bg-muted/50 px-1.5 py-0.5 text-center">
          <span className="text-muted-foreground">Max DD</span>
          <span className="block font-mono font-medium">{entry.recentDrawdown.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: AdaptationAuditEntry }) {
  const symbol = ASSET_INFO[entry.asset]?.symbol ?? entry.asset;
  const stratName = getStrategyDefinition(entry.strategyId).name;
  const delta = entry.updatedConfidence - entry.priorConfidence;

  return (
    <div className="rounded-md border border-border/30 p-2.5 text-xs">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{symbol}</span>
          <span className="text-[10px] text-muted-foreground">{stratName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{entry.priorConfidence.toFixed(0)}</span>
          <span className="text-[10px]">→</span>
          <span className={cn("text-[10px] font-mono font-bold",
            delta > 0 ? 'text-trading-profit' : delta < 0 ? 'text-trading-loss' : 'text-muted-foreground',
          )}>
            {entry.updatedConfidence.toFixed(0)}
          </span>
        </div>
      </div>
      <div className="flex gap-1 flex-wrap mb-1">
        {entry.memoryFactors.map((f, i) => (
          <Badge key={i} variant="secondary" className="text-[9px] px-1 py-0">{f}</Badge>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground space-y-0.5">
        <p>{entry.cautionAdjustment}</p>
        <p>{entry.allocationAdjustment}</p>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{entry.explanation}</p>
    </div>
  );
}
