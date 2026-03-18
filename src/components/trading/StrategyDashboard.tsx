import { useState, useMemo, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Layers, TrendingUp, TrendingDown, BarChart3, Target, Shield,
  Zap, ArrowUpDown, Crown, Activity, ChevronDown, ChevronUp, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/performance';
import { Asset, Candle, MarketRegime } from '@/types/trading';
import {
  StrategyId, StrategySignal, StrategyPerformance, StrategyComparison,
  MultiStrategyConfig, StrategySelectionMode, StrategySwitchRule,
  DEFAULT_MULTI_STRATEGY_CONFIG,
} from '@/types/strategy';
import { ASSET_INFO } from '@/config/trading';
import {
  STRATEGY_DEFINITIONS, getStrategyDefinition,
  generateAllStrategySignals,
} from '@/lib/strategyEngine';
import { compareStrategies, calculateStrategyPerformance, selectStrategy, explainStrategyDecision } from '@/lib/strategyComparison';

// ─── Labels ──────────────────────────────────────────────────────────

const MODE_LABELS: Record<StrategySelectionMode, string> = {
  single: 'Single Strategy',
  compare: 'Compare All',
  best_overall: 'Best Overall',
  best_per_asset: 'Best Per Asset',
  best_by_regime: 'Best By Regime',
};

const SWITCH_LABELS: Record<StrategySwitchRule, string> = {
  fixed: 'Fixed (No Switch)',
  best_recent: 'Best Recent',
  by_regime: 'By Regime',
  rolling_perf: 'Rolling Performance',
};

const REGIME_LABELS: Record<MarketRegime, string> = {
  trending_bullish: 'Bullish',
  trending_bearish: 'Bearish',
  sideways: 'Sideways',
};

// ─── Main Component ──────────────────────────────────────────────────

interface StrategyDashboardProps {
  candles: Record<Asset, Candle[]>;
  enabledAssets: Asset[];
  multiConfig: MultiStrategyConfig;
  onConfigChange: (config: MultiStrategyConfig) => void;
}

export function StrategyDashboard({
  candles, enabledAssets, multiConfig, onConfigChange,
}: StrategyDashboardProps) {
  const [expandedStrategy, setExpandedStrategy] = useState<StrategyId | null>(null);

  // Generate signals for all strategies on all assets
  const allSignals = useMemo(() => {
    const result: Record<Asset, StrategySignal[]> = {} as any;
    for (const asset of enabledAssets) {
      result[asset] = candles[asset]?.length > 50
        ? generateAllStrategySignals(asset, candles[asset], multiConfig)
        : [];
    }
    return result;
  }, [candles, enabledAssets, multiConfig]);

  // Mock performance — in real use this would come from backtesting
  // For now compute from signal quality heuristics
  const performances = useMemo(() => {
    const perfs: StrategyPerformance[] = [];
    for (const asset of enabledAssets) {
      for (const strat of multiConfig.activeStrategies) {
        perfs.push(calculateStrategyPerformance(strat, asset, [], []));
      }
    }
    return perfs;
  }, [enabledAssets, multiConfig.activeStrategies]);

  const comparisons = useMemo(() => {
    return enabledAssets.map(asset =>
      compareStrategies(asset, performances.filter(p => p.asset === asset)),
    );
  }, [enabledAssets, performances]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="text-xs gap-1">
            <Layers className="h-3 w-3" />Overview
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-xs gap-1">
            <Zap className="h-3 w-3" />Signals
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs gap-1">
            <Shield className="h-3 w-3" />Config
          </TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────── */}
        <TabsContent value="overview" className="mt-3 space-y-4">
          {/* Strategy Rankings */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4" />
                Strategy Rankings
              </CardTitle>
              <CardDescription className="text-xs">
                Mode: <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {MODE_LABELS[multiConfig.selectionMode]}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STRATEGY_DEFINITIONS.filter(s => multiConfig.activeStrategies.includes(s.id)).map((def, i) => {
                const isActive = enabledAssets.some(a => multiConfig.activeStrategyPerAsset[a] === def.id);
                return (
                  <div key={def.id} className="rounded-md border border-border/30 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                          i === 0 ? 'bg-amber-500/20 text-amber-500' :
                          i === 1 ? 'bg-muted text-muted-foreground' :
                          'bg-muted text-muted-foreground',
                        )}>
                          {i + 1}
                        </span>
                        <span className="text-xs font-medium">{def.name}</span>
                        {isActive && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                            ACTIVE
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost" size="sm" className="h-6 w-6 p-0"
                        onClick={() => setExpandedStrategy(expandedStrategy === def.id ? null : def.id)}
                      >
                        {expandedStrategy === def.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{def.description}</p>

                    {expandedStrategy === def.id && (
                      <div className="mt-2 space-y-2">
                        <Separator />
                        {enabledAssets.map(asset => {
                          const signals = allSignals[asset] || [];
                          const sig = signals.find(s => s.strategyId === def.id);
                          return (
                            <div key={asset} className="flex items-center justify-between text-xs">
                              <span>{ASSET_INFO[asset].symbol}</span>
                              <div className="flex items-center gap-2">
                                {sig ? (
                                  <>
                                    <SignalBadge type={sig.type} />
                                    <span className="text-[10px] text-muted-foreground">
                                      conf: {sig.confidence}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">No data</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Per-asset comparison */}
          {comparisons.map(comp => (
            <Card key={comp.asset} className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  {ASSET_INFO[comp.asset].symbol} — Strategy Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-primary/20 bg-primary/5 p-2 mb-3">
                  <p className="text-xs leading-relaxed">{comp.explanation}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border border-border/30 p-2">
                    <p className="text-[10px] text-muted-foreground">Best Overall</p>
                    <p className="text-xs font-medium">{getStrategyDefinition(comp.bestOverall).name}</p>
                  </div>
                  <div className="rounded-md border border-border/30 p-2">
                    <p className="text-[10px] text-muted-foreground">Lowest DD</p>
                    <p className="text-xs font-medium">{getStrategyDefinition(comp.bestLowDrawdown).name}</p>
                  </div>
                  <div className="rounded-md border border-border/30 p-2">
                    <p className="text-[10px] text-muted-foreground">Highest WR</p>
                    <p className="text-xs font-medium">{getStrategyDefinition(comp.bestHighWinRate).name}</p>
                  </div>
                </div>

                {/* Best by regime */}
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {(Object.keys(comp.bestByRegime) as MarketRegime[]).map(regime => (
                    <div key={regime} className="rounded-md border border-border/30 p-1.5">
                      <p className="text-[9px] text-muted-foreground">{REGIME_LABELS[regime]}</p>
                      <p className="text-[10px] font-medium">{getStrategyDefinition(comp.bestByRegime[regime]).name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── Signals Tab ──────────────────────────────── */}
        <TabsContent value="signals" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" />
                Live Strategy Signals
              </CardTitle>
              <CardDescription className="text-xs">
                Current signals from all active strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {enabledAssets.map(asset => (
                    <div key={asset} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{ASSET_INFO[asset].symbol}</p>
                      {(allSignals[asset] || []).map(sig => {
                        const def = getStrategyDefinition(sig.strategyId);
                        const isActive = multiConfig.activeStrategyPerAsset[asset] === sig.strategyId;
                        return (
                          <div key={sig.strategyId} className={cn(
                            'rounded-md border p-2 text-xs',
                            isActive ? 'border-primary/30 bg-primary/5' : 'border-border/30',
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{def.name}</span>
                                {isActive && <Badge variant="outline" className="text-[9px] px-1 py-0">ACTIVE</Badge>}
                              </div>
                              <div className="flex items-center gap-2">
                                <SignalBadge type={sig.type} />
                                <span className="text-[10px] text-muted-foreground">{sig.confidence}%</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {explainStrategyDecision(sig, isActive, isActive ? undefined : 'not the active strategy for this asset')}
                            </p>
                            {/* Metadata */}
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {Object.entries(sig.metadata).map(([k, v]) => (
                                <span key={k} className="text-[9px] text-muted-foreground">
                                  {k}: {typeof v === 'number' ? v.toFixed(2) : String(v)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {(allSignals[asset] || []).length === 0 && (
                        <p className="text-[10px] text-muted-foreground pl-2">Insufficient data for signal generation</p>
                      )}
                      <Separator className="my-1" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Config Tab ───────────────────────────────── */}
        <TabsContent value="config" className="mt-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Multi-Strategy Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Selection Mode</Label>
                  <Select
                    value={multiConfig.selectionMode}
                    onValueChange={(v) => onConfigChange({ ...multiConfig, selectionMode: v as StrategySelectionMode })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MODE_LABELS) as StrategySelectionMode[]).map(m => (
                        <SelectItem key={m} value={m} className="text-xs">{MODE_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Switch Rule</Label>
                  <Select
                    value={multiConfig.switchRule}
                    onValueChange={(v) => onConfigChange({ ...multiConfig, switchRule: v as StrategySwitchRule })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SWITCH_LABELS) as StrategySwitchRule[]).map(r => (
                        <SelectItem key={r} value={r} className="text-xs">{SWITCH_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Rolling Window</Label>
                  <Input
                    type="number" min={20} max={500} step={10}
                    value={multiConfig.rollingWindowCandles}
                    onChange={(e) => onConfigChange({ ...multiConfig, rollingWindowCandles: Number(e.target.value) || 100 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Min Before Switch</Label>
                  <Input
                    type="number" min={5} max={100} step={5}
                    value={multiConfig.minCandlesBeforeSwitch}
                    onChange={(e) => onConfigChange({ ...multiConfig, minCandlesBeforeSwitch: Number(e.target.value) || 20 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Separator />

              {/* Per-asset strategy assignment */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Active Strategy Per Asset</Label>
                {enabledAssets.map(asset => (
                  <div key={asset} className="flex items-center justify-between">
                    <Label className="text-xs">{ASSET_INFO[asset].symbol}</Label>
                    <Select
                      value={multiConfig.activeStrategyPerAsset[asset]}
                      onValueChange={(v) => onConfigChange({
                        ...multiConfig,
                        activeStrategyPerAsset: { ...multiConfig.activeStrategyPerAsset, [asset]: v as StrategyId },
                      })}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STRATEGY_DEFINITIONS.map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Per-strategy params */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Strategy Parameters</Label>
                {STRATEGY_DEFINITIONS.filter(s => multiConfig.activeStrategies.includes(s.id)).map(def => {
                  const params = multiConfig.strategyParams[def.id] || def.defaultParams;
                  return (
                    <div key={def.id} className="rounded-md border border-border/30 p-2 space-y-2">
                      <p className="text-xs font-medium">{def.name}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {def.id === 'sma_crossover' && (
                          <>
                            <ParamInput label="Fast SMA" value={params.smaFast ?? 20} onChange={v => updateParam(def.id, 'smaFast', v)} />
                            <ParamInput label="Slow SMA" value={params.smaSlow ?? 50} onChange={v => updateParam(def.id, 'smaSlow', v)} />
                          </>
                        )}
                        {def.id === 'ema_crossover' && (
                          <>
                            <ParamInput label="Fast EMA" value={params.emaFast ?? 12} onChange={v => updateParam(def.id, 'emaFast', v)} />
                            <ParamInput label="Slow EMA" value={params.emaSlow ?? 26} onChange={v => updateParam(def.id, 'emaSlow', v)} />
                          </>
                        )}
                        {def.id === 'rsi_trend' && (
                          <>
                            <ParamInput label="RSI Period" value={params.rsiPeriod ?? 14} onChange={v => updateParam(def.id, 'rsiPeriod', v)} />
                            <ParamInput label="Overbought" value={params.rsiOverbought ?? 70} onChange={v => updateParam(def.id, 'rsiOverbought', v)} />
                            <ParamInput label="Oversold" value={params.rsiOversold ?? 30} onChange={v => updateParam(def.id, 'rsiOversold', v)} />
                          </>
                        )}
                        <ParamInput label="SL %" value={params.stopLossPercent ?? 2} onChange={v => updateParam(def.id, 'stopLossPercent', v)} step={0.5} />
                        <ParamInput label="TP %" value={params.takeProfitPercent ?? 4} onChange={v => updateParam(def.id, 'takeProfitPercent', v)} step={0.5} />
                        <ParamInput label="Cooldown" value={params.cooldownCandles ?? 3} onChange={v => updateParam(def.id, 'cooldownCandles', v)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  function updateParam(strategyId: StrategyId, key: string, value: number) {
    onConfigChange({
      ...multiConfig,
      strategyParams: {
        ...multiConfig.strategyParams,
        [strategyId]: { ...multiConfig.strategyParams[strategyId], [key]: value },
      },
    });
  }
}

// ─── Sub-components ──────────────────────────────────────────────────

function SignalBadge({ type }: { type: string }) {
  if (type === 'BUY') return (
    <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30 border-0">
      <TrendingUp className="h-2.5 w-2.5 mr-0.5" />BUY
    </Badge>
  );
  if (type === 'SELL') return (
    <Badge className="text-[10px] px-1.5 py-0 bg-destructive/20 text-destructive border-0">
      <TrendingDown className="h-2.5 w-2.5 mr-0.5" />SELL
    </Badge>
  );
  return (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
      <Minus className="h-2.5 w-2.5 mr-0.5" />HOLD
    </Badge>
  );
}

function ParamInput({ label, value, onChange, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <div className="space-y-0.5">
      <Label className="text-[10px]">{label}</Label>
      <Input
        type="number" step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="h-7 text-xs"
      />
    </div>
  );
}
