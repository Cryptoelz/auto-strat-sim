import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Play, Pause, StopCircle, RotateCcw, Activity, AlertTriangle,
  CheckCircle2, XCircle, Zap, Clock, Radio, Shield, Settings,
  FileText, Cpu, ArrowRight, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  OrchestrationState, SystemState, ExecutionMode, LifecyclePhase,
  SYSTEM_STATE_LABELS, PHASE_LABELS, LIFECYCLE_ORDER,
  OrchestrationConfig,
} from '@/types/orchestration';
import {
  getInitialOrchestrationState, startup, shutdown, transitionState,
  runCycle, setMode, reportFault, attemptRecovery, explainCurrentState,
  canTransition,
} from '@/lib/orchestrationEngine';
import { format } from 'date-fns';

const STATE_COLORS: Record<SystemState, string> = {
  STARTING: 'bg-muted text-muted-foreground',
  READY: 'bg-primary/10 text-primary',
  RUNNING: 'bg-green-500/10 text-green-500',
  PAUSED: 'bg-yellow-500/10 text-yellow-500',
  RESTRICTED: 'bg-orange-500/10 text-orange-500',
  ERROR: 'bg-destructive/10 text-destructive',
  RECOVERING: 'bg-blue-500/10 text-blue-500',
  STOPPED: 'bg-muted text-muted-foreground',
  REVIEW_REQUIRED: 'bg-purple-500/10 text-purple-500',
};

const MODE_LABELS: Record<ExecutionMode, string> = {
  backtesting: 'Backtesting',
  optimization: 'Optimization',
  live_paper: 'Live Paper',
  scenario_testing: 'Scenario Testing',
  stress_testing: 'Stress Testing',
  readiness_review: 'Readiness Review',
  experiment_replay: 'Experiment Replay',
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'text-green-500',
  degraded: 'text-yellow-500',
  failed: 'text-destructive',
  inactive: 'text-muted-foreground',
};

export function OrchestrationDashboard() {
  const [state, setState] = useState<OrchestrationState>(() => {
    const s = getInitialOrchestrationState();
    return startup(s);
  });
  const [autoRun, setAutoRun] = useState(false);

  // Auto-cycle
  useEffect(() => {
    if (!autoRun || state.systemState !== 'RUNNING') return;
    const interval = setInterval(() => {
      setState(prev => runCycle(prev));
    }, Math.max(state.config.cycleIntervalMs / 20, 2000));
    return () => clearInterval(interval);
  }, [autoRun, state.systemState, state.config.cycleIntervalMs]);

  const handleStart = useCallback(() => {
    setState(prev => {
      if (canTransition(prev.systemState, 'RUNNING')) {
        return transitionState(prev, 'RUNNING', 'Operator started execution');
      }
      return prev;
    });
  }, []);

  const handlePause = useCallback(() => {
    setState(prev => {
      if (canTransition(prev.systemState, 'PAUSED')) {
        return transitionState(prev, 'PAUSED', 'Operator paused execution');
      }
      return prev;
    });
  }, []);

  const handleStop = useCallback(() => {
    setState(prev => shutdown(prev));
    setAutoRun(false);
  }, []);

  const handleRestart = useCallback(() => {
    const fresh = getInitialOrchestrationState(state.config);
    setState(startup(fresh));
    setAutoRun(false);
  }, [state.config]);

  const handleRunCycle = useCallback(() => {
    setState(prev => {
      if (prev.systemState !== 'RUNNING') {
        const started = transitionState(prev, 'RUNNING', 'Manual cycle trigger');
        return runCycle(started);
      }
      return runCycle(prev);
    });
  }, []);

  const handleModeChange = useCallback((mode: ExecutionMode) => {
    setState(prev => setMode(prev, mode));
  }, []);

  const handleRecover = useCallback(() => {
    setState(prev => attemptRecovery(prev));
  }, []);

  const handleSimFault = useCallback(() => {
    setState(prev =>
      reportFault(prev, 'Market Data', 'LOAD_MARKET_DATA', 'Simulated data integrity failure', 'error')
    );
  }, []);

  const handleConfigChange = useCallback((key: keyof OrchestrationConfig, value: number | string | boolean) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  }, []);

  const explanation = explainCurrentState(state);
  const healthyModules = state.moduleHealth.filter(m => m.status === 'healthy').length;
  const totalModules = state.moduleHealth.length;
  const successfulCycles = state.recentCycles.filter(c => c.success).length;
  const unresolvedFaults = state.recentFaults.filter(f => !f.recovered).length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5 text-primary" />
              Master Orchestration
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              {explanation}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('text-xs', STATE_COLORS[state.systemState])}>
              {SYSTEM_STATE_LABELS[state.systemState]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {MODE_LABELS[state.currentMode]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Cycle #{state.cycleNumber}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-3 flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="lifecycle" className="text-xs">Lifecycle</TabsTrigger>
            <TabsTrigger value="modules" className="text-xs">Modules</TabsTrigger>
            <TabsTrigger value="events" className="text-xs">Events</TabsTrigger>
            <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleStart}
                disabled={!canTransition(state.systemState, 'RUNNING')}>
                <Play className="mr-1 h-3 w-3" /> Start
              </Button>
              <Button size="sm" variant="outline" onClick={handlePause}
                disabled={!canTransition(state.systemState, 'PAUSED')}>
                <Pause className="mr-1 h-3 w-3" /> Pause
              </Button>
              <Button size="sm" variant="outline" onClick={handleStop}
                disabled={!canTransition(state.systemState, 'STOPPED')}>
                <StopCircle className="mr-1 h-3 w-3" /> Stop
              </Button>
              <Button size="sm" variant="outline" onClick={handleRunCycle}>
                <Zap className="mr-1 h-3 w-3" /> Run Cycle
              </Button>
              <Button size="sm" variant="outline" onClick={handleRestart}>
                <RotateCcw className="mr-1 h-3 w-3" /> Restart
              </Button>
              {state.systemState === 'ERROR' && (
                <Button size="sm" variant="destructive" onClick={handleRecover}>
                  <RefreshCw className="mr-1 h-3 w-3" /> Recover
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleSimFault}>
                <AlertTriangle className="mr-1 h-3 w-3" /> Sim Fault
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Switch checked={autoRun} onCheckedChange={setAutoRun} id="auto-run" />
                <Label htmlFor="auto-run" className="text-xs">Auto-cycle</Label>
              </div>
            </div>

            {/* Mode selector */}
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground">Mode:</Label>
              <Select value={state.currentMode} onValueChange={(v) => handleModeChange(v as ExecutionMode)}>
                <SelectTrigger className="h-8 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MODE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatMini icon={Activity} label="Modules OK" value={`${healthyModules}/${totalModules}`}
                color={healthyModules === totalModules ? 'text-green-500' : 'text-yellow-500'} />
              <StatMini icon={Zap} label="Cycles" value={`${state.cycleNumber}`}
                color="text-primary" />
              <StatMini icon={CheckCircle2} label="Success Rate"
                value={state.recentCycles.length > 0 ? `${((successfulCycles / state.recentCycles.length) * 100).toFixed(0)}%` : 'N/A'}
                color="text-green-500" />
              <StatMini icon={AlertTriangle} label="Open Faults" value={`${unresolvedFaults}`}
                color={unresolvedFaults > 0 ? 'text-destructive' : 'text-muted-foreground'} />
            </div>

            {/* Recent cycles */}
            {state.recentCycles.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">Recent Cycles</h4>
                <ScrollArea className="h-40">
                  <div className="space-y-1.5">
                    {state.recentCycles.slice(0, 10).map(c => (
                      <div key={c.cycleId} className="flex items-start gap-2 rounded border border-border/50 p-2 text-xs">
                        {c.success ? <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" /> : <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground">{c.explanation}</p>
                          <p className="text-muted-foreground">{c.durationMs}ms • {c.phasesCompleted.length} phases • {c.faults.length} faults</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          {/* Lifecycle */}
          <TabsContent value="lifecycle" className="space-y-4">
            <h4 className="text-xs font-medium text-muted-foreground">
              Execution Pipeline — {MODE_LABELS[state.currentMode]}
            </h4>
            <div className="space-y-1">
              {LIFECYCLE_ORDER.map((phase, i) => {
                const activeInMode = (state.currentMode ? true : true); // all shown
                const isActive = phase === state.currentPhase;
                const lastCycle = state.recentCycles[0];
                const completed = lastCycle?.phasesCompleted.includes(phase);
                const failed = lastCycle?.phasesFailed.includes(phase);
                return (
                  <div key={phase} className="flex items-center gap-2">
                    <div className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                      failed ? 'bg-destructive/10 text-destructive' :
                        completed ? 'bg-green-500/10 text-green-500' :
                          isActive ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                    )}>
                      {i + 1}
                    </div>
                    <span className={cn('text-xs', isActive && 'font-medium text-foreground', !isActive && 'text-muted-foreground')}>
                      {PHASE_LABELS[phase]}
                    </span>
                    {i < LIFECYCLE_ORDER.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">State Machine</h4>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(SYSTEM_STATE_LABELS) as SystemState[]).map(s => (
                  <Badge key={s} className={cn('text-[10px]', s === state.systemState ? STATE_COLORS[s] : 'bg-muted/50 text-muted-foreground')}>
                    {SYSTEM_STATE_LABELS[s]}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Modules */}
          <TabsContent value="modules" className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {state.moduleHealth.map(m => (
                <div key={m.name} className="flex items-center justify-between rounded border border-border/50 p-2">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', {
                      'bg-green-500': m.status === 'healthy',
                      'bg-yellow-500': m.status === 'degraded',
                      'bg-destructive': m.status === 'failed',
                      'bg-muted-foreground': m.status === 'inactive',
                    })} />
                    <span className="text-xs font-medium">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{m.cycleCount} runs</span>
                    {m.lastRunMs > 0 && <span>{m.lastRunMs.toFixed(0)}ms</span>}
                    {m.lastError && (
                      <Badge variant="destructive" className="text-[10px]">error</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Events */}
          <TabsContent value="events">
            <ScrollArea className="h-64">
              {state.recentEvents.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No events yet</p>
              ) : (
                <div className="space-y-1.5">
                  {state.recentEvents.slice(0, 30).map(e => (
                    <div key={e.id} className="rounded border border-border/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">{e.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(e.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                      {e.explanation && (
                        <p className="mt-1 text-muted-foreground">{e.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Config */}
          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ConfigSlider label="Cycle Interval (ms)" value={state.config.cycleIntervalMs}
                min={1000} max={300000} step={1000}
                onChange={v => handleConfigChange('cycleIntervalMs', v)} />
              <ConfigSlider label="Module Timeout (ms)" value={state.config.moduleTimeoutMs}
                min={5000} max={120000} step={1000}
                onChange={v => handleConfigChange('moduleTimeoutMs', v)} />
              <ConfigSlider label="Retry Limit" value={state.config.retryLimit}
                min={0} max={10} step={1}
                onChange={v => handleConfigChange('retryLimit', v)} />
              <ConfigSlider label="Recovery Attempts" value={state.config.recoveryAttemptLimit}
                min={0} max={5} step={1}
                onChange={v => handleConfigChange('recoveryAttemptLimit', v)} />
              <ConfigSlider label="Health Check Interval" value={state.config.healthCheckInterval}
                min={1} max={50} step={1}
                onChange={v => handleConfigChange('healthCheckInterval', v)} />
            </div>
            <Separator />
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={state.config.autoRecoveryEnabled}
                  onCheckedChange={v => handleConfigChange('autoRecoveryEnabled', v)} />
                <Label className="text-xs">Auto Recovery</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Verbosity:</Label>
                <Select value={state.config.logVerbosity}
                  onValueChange={v => handleConfigChange('logVerbosity', v)}>
                  <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal" className="text-xs">Minimal</SelectItem>
                    <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                    <SelectItem value="verbose" className="text-xs">Verbose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Audit */}
          <TabsContent value="audit">
            <ScrollArea className="h-64">
              {state.auditLog.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No audit entries</p>
              ) : (
                <div className="space-y-1.5">
                  {state.auditLog.slice(0, 40).map(e => (
                    <div key={e.id} className="rounded border border-border/50 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {e.result === 'success' ? <CheckCircle2 className="h-3 w-3 text-green-500" /> :
                            e.result === 'warning' ? <AlertTriangle className="h-3 w-3 text-yellow-500" /> :
                              <XCircle className="h-3 w-3 text-destructive" />}
                          <span className="font-medium">{e.action}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(e.timestamp, 'HH:mm:ss')}
                        </span>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">{e.explanation}</p>
                      {e.stateTransition && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {e.stateTransition.from} → {e.stateTransition.to}
                        </Badge>
                      )}
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

function StatMini({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div className="rounded border border-border/50 p-2">
      <div className="flex items-center gap-1.5">
        <Icon className={cn('h-3.5 w-3.5', color)} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={cn('mt-1 text-lg font-bold', color)}>{value}</p>
    </div>
  );
}

function ConfigSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step}
        onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
