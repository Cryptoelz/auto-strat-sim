import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Shield, Settings, FileCheck, ClipboardList, Power, Eye, Radio, Zap,
  Lock, Unlock, CheckCircle2, XCircle, Clock, AlertTriangle, RotateCcw,
  ChevronRight, UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  OperatorState,
  OperatorConfig,
  DEFAULT_OPERATOR_STATE,
  DEFAULT_OPERATOR_CONFIG,
  AutonomyMode,
  PolicyRule,
  ManualOverride,
  ApprovalRequest,
  POLICY_TEMPLATES,
  PolicyTemplate,
} from '@/types/operator';
import {
  AUTONOMY_LABELS,
  createAuditEntry,
  applyTemplate,
  getPositionSizeMultiplier,
  getConvictionMultiplier,
  isAdaptationFrozen,
} from '@/lib/operatorEngine';

interface Props {
  operatorState: OperatorState;
  onStateChange: (state: OperatorState) => void;
  operatorConfig: OperatorConfig;
  onConfigChange: (config: OperatorConfig) => void;
}

export function OperatorControlDashboard({
  operatorState,
  onStateChange,
  operatorConfig,
  onConfigChange,
}: Props) {
  const activeOverrides = operatorState.overrides.filter(o => o.active);
  const pendingApprovals = operatorState.approvals.filter(a => a.status === 'pending');
  const enabledPolicies = operatorState.policies.filter(p => p.enabled);

  const addAudit = useCallback((action: string, prior: string, next: string, reason: string, extra?: any) => {
    const entry = createAuditEntry(action, prior, next, reason, extra);
    onStateChange({
      ...operatorState,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handleToggleAgent = useCallback(() => {
    const newEnabled = !operatorState.agentEnabled;
    const entry = createAuditEntry(
      newEnabled ? 'agent_enabled' : 'agent_disabled',
      operatorState.agentEnabled ? 'enabled' : 'disabled',
      newEnabled ? 'enabled' : 'disabled',
      `Operator ${newEnabled ? 'enabled' : 'disabled'} the agent`,
    );
    onStateChange({
      ...operatorState,
      agentEnabled: newEnabled,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handleAutonomyChange = useCallback((mode: AutonomyMode) => {
    const entry = createAuditEntry(
      'autonomy_changed',
      operatorState.autonomyMode,
      mode,
      `Autonomy mode changed to ${AUTONOMY_LABELS[mode].label}`,
    );
    onStateChange({
      ...operatorState,
      autonomyMode: mode,
      activeTemplate: null,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handleOverrideToggle = useCallback((id: string) => {
    const newOverrides = operatorState.overrides.map(o => {
      if (o.id !== id) return o;
      const newActive = !o.active;
      return { ...o, active: newActive, appliedAt: newActive ? Date.now() : null, reason: newActive ? 'Manual operator override' : '' };
    });
    const ov = operatorState.overrides.find(o => o.id === id)!;
    const entry = createAuditEntry(
      ov.active ? 'override_removed' : 'override_applied',
      ov.active ? 'active' : 'inactive',
      ov.active ? 'inactive' : 'active',
      `Override "${ov.label}" ${ov.active ? 'removed' : 'applied'}`,
    );
    onStateChange({
      ...operatorState,
      overrides: newOverrides,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handlePolicyToggle = useCallback((id: string) => {
    const newPolicies = operatorState.policies.map(p => {
      if (p.id !== id) return p;
      return { ...p, enabled: !p.enabled };
    });
    const pol = operatorState.policies.find(p => p.id === id)!;
    const entry = createAuditEntry(
      pol.enabled ? 'policy_disabled' : 'policy_enabled',
      pol.enabled ? 'enabled' : 'disabled',
      pol.enabled ? 'disabled' : 'enabled',
      `Policy "${pol.label}" ${pol.enabled ? 'disabled' : 'enabled'}`,
      { policyAffected: pol.label },
    );
    onStateChange({
      ...operatorState,
      policies: newPolicies,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handleApproval = useCallback((id: string, status: 'approved' | 'denied') => {
    const newApprovals = operatorState.approvals.map(a => {
      if (a.id !== id) return a;
      return { ...a, status, resolvedAt: Date.now() };
    });
    const req = operatorState.approvals.find(a => a.id === id)!;
    const entry = createAuditEntry(
      `approval_${status}`,
      'pending',
      status,
      `${req.action} ${status} by operator`,
    );
    onStateChange({
      ...operatorState,
      approvals: newApprovals,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const handleTemplateApply = useCallback((template: PolicyTemplate) => {
    const newState = applyTemplate(template, operatorState);
    onStateChange(newState);
  }, [operatorState, onStateChange]);

  const handleResetAll = useCallback(() => {
    const entry = createAuditEntry('full_reset', 'custom', 'default', 'Operator reset all controls to defaults');
    onStateChange({
      ...DEFAULT_OPERATOR_STATE,
      auditLog: [entry, ...operatorState.auditLog].slice(0, 200),
    });
  }, [operatorState, onStateChange]);

  const posMultiplier = getPositionSizeMultiplier(operatorState);
  const convMultiplier = getConvictionMultiplier(operatorState);
  const adaptFrozen = isAdaptationFrozen(operatorState);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Operator Controls & Policy</CardTitle>
              <CardDescription className="text-xs">Control agent autonomy, policies, and manual overrides</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs",
              operatorState.agentEnabled ? "border-trading-profit/50 text-trading-profit" : "border-destructive/50 text-destructive"
            )}>
              {operatorState.agentEnabled ? 'AGENT ON' : 'AGENT OFF'}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", AUTONOMY_LABELS[operatorState.autonomyMode].color)}>
              {AUTONOMY_LABELS[operatorState.autonomyMode].label}
            </Badge>
            {pendingApprovals.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">{pendingApprovals.length} pending</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="controls" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="controls" className="text-xs gap-1"><Power className="h-3 w-3" />Controls</TabsTrigger>
            <TabsTrigger value="policies" className="text-xs gap-1"><Shield className="h-3 w-3" />Policies</TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs gap-1"><FileCheck className="h-3 w-3" />Approvals</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs gap-1"><Settings className="h-3 w-3" />Templates</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs gap-1"><ClipboardList className="h-3 w-3" />Audit</TabsTrigger>
          </TabsList>

          {/* ─── Controls Tab ───────────────────────────────────── */}
          <TabsContent value="controls" className="space-y-4 mt-3">
            {/* Agent Enable/Disable */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div>
                <Label className="text-sm font-medium">Agent Enabled</Label>
                <p className="text-xs text-muted-foreground">Master switch for the trading agent</p>
              </div>
              <Switch checked={operatorState.agentEnabled} onCheckedChange={handleToggleAgent} />
            </div>

            {/* Autonomy Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Autonomy Mode</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(Object.keys(AUTONOMY_LABELS) as AutonomyMode[]).map(mode => {
                  const info = AUTONOMY_LABELS[mode];
                  const isActive = operatorState.autonomyMode === mode;
                  const icons: Record<AutonomyMode, React.ReactNode> = {
                    OBSERVE_ONLY: <Eye className="h-3.5 w-3.5" />,
                    SIGNALS_ONLY: <Radio className="h-3.5 w-3.5" />,
                    PAPER_EXECUTION: <Zap className="h-3.5 w-3.5" />,
                    SUPERVISED_AGENT: <Shield className="h-3.5 w-3.5" />,
                    FULL_SIMULATION_AUTONOMY: <Unlock className="h-3.5 w-3.5" />,
                  };
                  return (
                    <button
                      key={mode}
                      onClick={() => handleAutonomyChange(mode)}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border text-left text-xs transition-colors",
                        isActive
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/50 bg-muted/10 text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      <span className={cn(isActive ? info.color : 'text-muted-foreground')}>{icons[mode]}</span>
                      <div>
                        <p className="font-medium">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground">{info.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Manual Overrides */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Manual Overrides</Label>
              <div className="space-y-1.5">
                {operatorState.overrides.map(ov => (
                  <div key={ov.id} className="flex items-center justify-between p-2 rounded border border-border/30 bg-muted/10">
                    <div className="flex items-center gap-2">
                      {ov.active ? <Lock className="h-3 w-3 text-destructive" /> : <Unlock className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-xs">{ov.label}</span>
                    </div>
                    <Switch checked={ov.active} onCheckedChange={() => handleOverrideToggle(ov.id)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Active Restrictions Summary */}
            {(activeOverrides.length > 0 || posMultiplier < 1 || convMultiplier > 1 || adaptFrozen) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase">Active Restrictions</Label>
                  <div className="space-y-1">
                    {posMultiplier < 1 && (
                      <div className="flex items-center gap-2 text-xs text-yellow-500">
                        <AlertTriangle className="h-3 w-3" />
                        Position size reduced to {(posMultiplier * 100).toFixed(0)}%
                      </div>
                    )}
                    {convMultiplier > 1 && (
                      <div className="flex items-center gap-2 text-xs text-yellow-500">
                        <AlertTriangle className="h-3 w-3" />
                        Conviction threshold tightened ({convMultiplier.toFixed(1)}x)
                      </div>
                    )}
                    {adaptFrozen && (
                      <div className="flex items-center gap-2 text-xs text-blue-500">
                        <Lock className="h-3 w-3" />
                        Adaptation frozen
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetAll} className="gap-1 text-xs">
                <RotateCcw className="h-3 w-3" />Reset All Controls
              </Button>
            </div>
          </TabsContent>

          {/* ─── Policies Tab ───────────────────────────────────── */}
          <TabsContent value="policies" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Define what the agent is allowed to do. Policies override normal agent behavior.</p>

            {/* Asset Policies */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Asset Policies</Label>
              {operatorState.policies.filter(p => p.type === 'asset_enabled').map(pol => (
                <PolicyRow key={pol.id} policy={pol} onToggle={() => handlePolicyToggle(pol.id)} />
              ))}
            </div>

            <Separator />

            {/* Strategy Policies */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Strategy Policies</Label>
              {operatorState.policies.filter(p => p.type === 'strategy_enabled').map(pol => (
                <PolicyRow key={pol.id} policy={pol} onToggle={() => handlePolicyToggle(pol.id)} />
              ))}
            </div>

            <Separator />

            {/* Risk Policies */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Risk & Restriction Policies</Label>
              {operatorState.policies.filter(p => !['asset_enabled', 'strategy_enabled'].includes(p.type)).map(pol => (
                <PolicyRow key={pol.id} policy={pol} onToggle={() => handlePolicyToggle(pol.id)} />
              ))}
            </div>
          </TabsContent>

          {/* ─── Approvals Tab ──────────────────────────────────── */}
          <TabsContent value="approvals" className="mt-3">
            {operatorState.autonomyMode !== 'SUPERVISED_AGENT' && (
              <div className="text-xs text-muted-foreground text-center py-6">
                Approvals are only active in <strong>Supervised</strong> autonomy mode.
              </div>
            )}
            {pendingApprovals.length === 0 && operatorState.autonomyMode === 'SUPERVISED_AGENT' && (
              <p className="text-xs text-muted-foreground text-center py-6">No pending approvals.</p>
            )}
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {operatorState.approvals.slice(0, 50).map(req => (
                  <div key={req.id} className={cn(
                    "p-3 rounded-lg border text-xs space-y-2",
                    req.status === 'pending' ? "border-yellow-500/30 bg-yellow-500/5" :
                    req.status === 'approved' ? "border-trading-profit/30 bg-trading-profit/5" :
                    req.status === 'denied' ? "border-destructive/30 bg-destructive/5" :
                    "border-border/30 bg-muted/10"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{req.action}</span>
                      <Badge variant="outline" className={cn("text-[10px]",
                        req.status === 'pending' && "text-yellow-500",
                        req.status === 'approved' && "text-trading-profit",
                        req.status === 'denied' && "text-destructive",
                      )}>{req.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-muted-foreground">{req.reason}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {req.asset && <span>Asset: {req.asset}</span>}
                      <span>Confidence: {(req.confidence * 100).toFixed(0)}%</span>
                      <span>Risk: {req.riskContext}</span>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="h-6 text-[10px] gap-1" onClick={() => handleApproval(req.id, 'approved')}>
                          <CheckCircle2 className="h-3 w-3" />Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="h-6 text-[10px] gap-1" onClick={() => handleApproval(req.id, 'denied')}>
                          <XCircle className="h-3 w-3" />Deny
                        </Button>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {format(req.timestamp, 'MMM dd HH:mm:ss')}
                      {req.resolvedAt && ` → resolved ${format(req.resolvedAt, 'HH:mm:ss')}`}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ─── Templates Tab ──────────────────────────────────── */}
          <TabsContent value="templates" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Apply a predefined policy template. This will replace current policies and overrides.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POLICY_TEMPLATES.map(tmpl => {
                const isActive = operatorState.activeTemplate === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-1.5",
                      isActive ? "border-primary bg-primary/10" : "border-border/50 bg-muted/10"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{tmpl.name}</span>
                      {isActive && <Badge className="text-[10px] bg-primary/20 text-primary">Active</Badge>}
                    </div>
                    <p className="text-muted-foreground">{tmpl.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{AUTONOMY_LABELS[tmpl.autonomyMode].label}</Badge>
                      {tmpl.policies.length > 0 && (
                        <Badge variant="outline" className="text-[10px]">{tmpl.policies.length} policies</Badge>
                      )}
                    </div>
                    {!isActive && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px] mt-1" onClick={() => handleTemplateApply(tmpl)}>
                        Apply Template
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* ─── Audit Tab ──────────────────────────────────────── */}
          <TabsContent value="audit" className="mt-3">
            <ScrollArea className="max-h-[300px]">
              {operatorState.auditLog.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No operator actions recorded yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {operatorState.auditLog.slice(0, 100).map(entry => (
                    <div key={entry.id} className="p-2 rounded border border-border/30 bg-muted/10 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{entry.action.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-muted-foreground">{format(entry.timestamp, 'MMM dd HH:mm:ss')}</span>
                      </div>
                      <p className="text-muted-foreground">{entry.reason}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{entry.priorState}</span>
                        <ChevronRight className="h-2.5 w-2.5" />
                        <span>{entry.newState}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PolicyRow({ policy, onToggle }: { policy: PolicyRule; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between p-2 rounded border border-border/30 bg-muted/10">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", !policy.enabled && "text-muted-foreground line-through")}>{policy.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{policy.description}</p>
      </div>
      <Switch checked={policy.enabled} onCheckedChange={onToggle} />
    </div>
  );
}
