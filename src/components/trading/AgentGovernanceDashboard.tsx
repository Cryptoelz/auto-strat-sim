import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Shield, ShieldAlert, ShieldOff, ShieldCheck, Lock,
  AlertTriangle, Activity, Heart, Settings, History,
  CheckCircle2, XCircle, ArrowRight, TrendingDown, WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GovernanceStatus, GovernanceConfig, GovernanceState, DEFAULT_GOVERNANCE_CONFIG } from '@/types/governance';
import { TradingState, AssetAnalytics, Asset } from '@/types/trading';
import { evaluateGovernance, countRecentFlips } from '@/lib/governanceEngine';

const STATE_CONFIG: Record<GovernanceState, { icon: typeof Shield; color: string; bg: string }> = {
  ACTIVE: { icon: ShieldCheck, color: 'text-trading-profit', bg: 'bg-trading-profit/10' },
  CAUTION: { icon: Shield, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  RESTRICTED: { icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  PAUSED: { icon: ShieldOff, color: 'text-destructive', bg: 'bg-destructive/10' },
  LOCKED: { icon: Lock, color: 'text-destructive', bg: 'bg-destructive/10' },
};

interface Props {
  state: TradingState;
  analytics: Record<Asset, AssetAnalytics>;
  enabledAssets: Asset[];
  portfolioDrawdown: number;
  reconnectErrors?: number;
  governanceConfig: GovernanceConfig;
  onGovernanceConfigChange: (config: GovernanceConfig) => void;
  prevStatus: GovernanceStatus | null;
  candleIntervalMs?: number;
  onClearConnectionErrors?: () => void;
}

export function AgentGovernanceDashboard({
  state, analytics, enabledAssets, portfolioDrawdown,
  reconnectErrors = 0, governanceConfig, onGovernanceConfigChange,
  prevStatus, candleIntervalMs = 300000, onClearConnectionErrors,
}: Props) {
  const recentFlipCount = useMemo(
    () => countRecentFlips(state, governanceConfig.antiFlipWindow, candleIntervalMs),
    [state, governanceConfig.antiFlipWindow, candleIntervalMs],
  );

  const status = useMemo(
    () => evaluateGovernance(
      state, analytics, enabledAssets, portfolioDrawdown,
      recentFlipCount, reconnectErrors, governanceConfig, prevStatus, candleIntervalMs,
    ),
    [state, analytics, enabledAssets, portfolioDrawdown, recentFlipCount, reconnectErrors, governanceConfig, prevStatus, candleIntervalMs],
  );

  const stateInfo = STATE_CONFIG[status.currentState];
  const StateIcon = stateInfo.icon;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Agent Governance & Guardrails
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('gap-1', stateInfo.color)}>
              <StateIcon className="h-3 w-3" />
              {status.currentState}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Health: {status.healthScore.overall}/100
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Explanation banner */}
        <div className={cn('rounded-md px-3 py-2 mb-3 text-xs', stateInfo.bg, stateInfo.color)}>
          {status.explanation}
        </div>

        {/* Connection error override */}
        {onClearConnectionErrors && reconnectErrors > 0 && (
          <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5 text-orange-500" />
              <span>
                <strong className="text-foreground">{reconnectErrors}</strong> recent connection issue(s) tracked.
                These decay automatically over ~5 minutes if the connection stays healthy.
              </span>
            </div>
            <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={onClearConnectionErrors}>
              Clear Connection Errors
            </Button>
          </div>
        )}

        {status.manualReviewRequired && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 mb-3 text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <strong>Manual Review Required</strong>
              <ul className="mt-1 list-disc pl-4">
                {status.manualReviewReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="status" className="text-xs gap-1"><Heart className="h-3 w-3" />Status</TabsTrigger>
            <TabsTrigger value="triggers" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Triggers</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1"><History className="h-3 w-3" />Audit</TabsTrigger>
            <TabsTrigger value="config" className="text-xs gap-1"><Settings className="h-3 w-3" />Config</TabsTrigger>
          </TabsList>

          {/* ──── Status Tab ──── */}
          <TabsContent value="status" className="mt-3 space-y-3">
            {/* Health breakdown */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(status.healthScore).filter(([k]) => k !== 'overall').map(([key, val]) => (
                <div key={key} className="rounded-md border border-border/50 p-2">
                  <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={val as number} className="h-1.5 flex-1" />
                    <span className={cn('text-xs font-mono', (val as number) >= 60 ? 'text-trading-profit' : (val as number) >= 30 ? 'text-yellow-500' : 'text-destructive')}>
                      {val as number}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Restrictions */}
            <div className="rounded-md border border-border/50 p-3">
              <p className="text-xs font-medium mb-2">Active Restrictions</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position Size</span>
                  <span className={status.restrictions.positionSizeMultiplier < 1 ? 'text-yellow-500' : ''}>
                    {(status.restrictions.positionSizeMultiplier * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conviction Bar</span>
                  <span className={status.restrictions.convictionMultiplier > 1 ? 'text-yellow-500' : ''}>
                    ×{status.restrictions.convictionMultiplier.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Entries</span>
                  {status.restrictions.newEntriesAllowed
                    ? <CheckCircle2 className="h-3 w-3 text-trading-profit" />
                    : <XCircle className="h-3 w-3 text-destructive" />}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exits</span>
                  {status.restrictions.exitsAllowed
                    ? <CheckCircle2 className="h-3 w-3 text-trading-profit" />
                    : <XCircle className="h-3 w-3 text-destructive" />}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adaptation</span>
                  {status.restrictions.adaptationFrozen
                    ? <Badge variant="outline" className="text-[9px] border-destructive/50 text-destructive">FROZEN</Badge>
                    : <CheckCircle2 className="h-3 w-3 text-trading-profit" />}
                </div>
              </div>
            </div>

            {/* Recovery */}
            {status.recovery.isRecovering && (
              <div className="rounded-md border border-border/50 p-3">
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" /> Recovery Progress
                </p>
                <Progress value={status.recovery.progress} className="h-2 mb-2" />
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  {status.recovery.conditionsMet.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 text-trading-profit">
                      <CheckCircle2 className="h-2.5 w-2.5" />{c}
                    </span>
                  ))}
                  {status.recovery.conditionsNeeded.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-2.5 w-2.5" />{c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ──── Triggers Tab ──── */}
          <TabsContent value="triggers" className="mt-3">
            {status.activeTriggers.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No active triggers. System is healthy.</p>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {status.activeTriggers.map((t, i) => (
                    <div key={i} className="rounded-md border border-border/50 p-2.5 flex items-start gap-2">
                      <AlertTriangle className={cn('h-4 w-4 shrink-0 mt-0.5',
                        t.severity === 'critical' ? 'text-destructive' :
                        t.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-[9px]',
                            t.severity === 'critical' ? 'border-destructive/50 text-destructive' :
                            t.severity === 'high' ? 'border-orange-500/50 text-orange-500' : 'border-yellow-500/50 text-yellow-500'
                          )}>
                            {t.severity.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {t.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs mt-1">{t.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Value: {t.value.toFixed(1)} / Threshold: {t.threshold}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* ──── Audit Tab ──── */}
          <TabsContent value="audit" className="mt-3">
            <ScrollArea className="h-[280px]">
              {status.transitions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No governance transitions recorded.</p>
              ) : (
                <div className="space-y-2">
                  {[...status.transitions].reverse().map(t => (
                    <div key={t.id} className="rounded-md border border-border/50 p-2.5">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className={cn('text-[9px]', STATE_CONFIG[t.fromState].color)}>
                          {t.fromState}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={cn('text-[9px]', STATE_CONFIG[t.toState].color)}>
                          {t.toState}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1.5">{t.explanation}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Health: {t.healthScore} | Trigger: {t.trigger.replace(/_/g, ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ──── Config Tab ──── */}
          <TabsContent value="config" className="mt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Governance Enabled</Label>
              <Switch
                checked={governanceConfig.enabled}
                onCheckedChange={v => onGovernanceConfigChange({ ...governanceConfig, enabled: v })}
              />
            </div>
            <Separator />
            <ConfigSlider label="Daily Loss Limit (%)" value={governanceConfig.dailyLossGovernanceLimit}
              min={1} max={20} step={0.5}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, dailyLossGovernanceLimit: v })} />
            <ConfigSlider label="Drawdown Limit (%)" value={governanceConfig.drawdownGovernanceLimit}
              min={2} max={30} step={1}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, drawdownGovernanceLimit: v })} />
            <ConfigSlider label="Consecutive Loss Limit" value={governanceConfig.consecutiveLossGovernanceLimit}
              min={2} max={15} step={1}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, consecutiveLossGovernanceLimit: v })} />
            <ConfigSlider label="Flip Trade Limit" value={governanceConfig.flipTradeGovernanceLimit}
              min={2} max={10} step={1}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, flipTradeGovernanceLimit: v })} />
            <ConfigSlider label="Min Pause Candles" value={governanceConfig.minimumPauseCandles}
              min={3} max={50} step={1}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, minimumPauseCandles: v })} />
            <ConfigSlider label="Recovery Health Threshold" value={governanceConfig.recoveryHealthThreshold}
              min={30} max={90} step={5}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, recoveryHealthThreshold: v })} />
            <ConfigSlider label="Size Reduction (%)" value={governanceConfig.governanceReduceSizePercent}
              min={10} max={80} step={5}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, governanceReduceSizePercent: v })} />
            <ConfigSlider label="Conviction Multiplier" value={governanceConfig.governanceConvictionMultiplier}
              min={1} max={3} step={0.1}
              onChange={v => onGovernanceConfigChange({ ...governanceConfig, governanceConvictionMultiplier: v })} />

            {/* Health thresholds */}
            <Separator />
            <p className="text-xs font-medium">Health Score Thresholds</p>
            <ConfigSlider label="→ CAUTION below" value={governanceConfig.healthScoreThresholds.caution}
              min={30} max={90} step={5}
              onChange={v => onGovernanceConfigChange({
                ...governanceConfig, healthScoreThresholds: { ...governanceConfig.healthScoreThresholds, caution: v },
              })} />
            <ConfigSlider label="→ RESTRICTED below" value={governanceConfig.healthScoreThresholds.restricted}
              min={20} max={70} step={5}
              onChange={v => onGovernanceConfigChange({
                ...governanceConfig, healthScoreThresholds: { ...governanceConfig.healthScoreThresholds, restricted: v },
              })} />
            <ConfigSlider label="→ PAUSED below" value={governanceConfig.healthScoreThresholds.paused}
              min={10} max={50} step={5}
              onChange={v => onGovernanceConfigChange({
                ...governanceConfig, healthScoreThresholds: { ...governanceConfig.healthScoreThresholds, paused: v },
              })} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ConfigSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-[11px]">{label}</Label>
        <span className="text-[11px] font-mono text-muted-foreground">{value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
