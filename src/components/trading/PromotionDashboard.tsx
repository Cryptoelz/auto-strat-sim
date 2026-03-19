import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, AlertTriangle, Shield, ArrowUpCircle, Clock,
  FileText, Scale, ChevronRight, RotateCcw, FlaskConical, Loader2,
  TrendingUp, TrendingDown, Minus, History,
} from 'lucide-react';
import { loadExperimentStore } from '@/lib/experimentEngine';
import {
  loadPromotionStore, evaluateCandidate, promoteCandidate,
  rejectCandidate, setPromotionBaseline,
} from '@/lib/promotionEngine';
import {
  runResearchCycle, saveCycleEntry, loadCycleHistory,
  ResearchCycleResult, PhaseResult, SideBySideMetric,
} from '@/lib/researchCycleEngine';
import { PromotionEvaluation, PromotionCriterion, StabilityCheck, PromotionAuditEntry } from '@/types/promotion';
import { ExperimentRun } from '@/types/experiment';
import { toast } from 'sonner';

// ─── Workflow Steps ──────────────────────────────────────────────────────────

type WorkflowStep = 'baseline' | 'candidate' | 'test' | 'compare' | 'decide';

const STEPS: { key: WorkflowStep; label: string; icon: typeof Shield }[] = [
  { key: 'baseline', label: 'Baseline', icon: Shield },
  { key: 'candidate', label: 'Candidate', icon: ArrowUpCircle },
  { key: 'test', label: 'Test', icon: FlaskConical },
  { key: 'compare', label: 'Compare', icon: Scale },
  { key: 'decide', label: 'Decide', icon: CheckCircle },
];

// ─── Shared Small Components ─────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    promote: { cls: 'bg-primary/20 text-primary border-primary/30', label: 'PROMOTE' },
    approved: { cls: 'bg-primary/20 text-primary border-primary/30', label: 'APPROVED' },
    reject: { cls: 'bg-destructive/20 text-destructive border-destructive/30', label: 'REJECT' },
    rejected: { cls: 'bg-destructive/20 text-destructive border-destructive/30', label: 'REJECTED' },
    inconclusive: { cls: 'bg-accent text-accent-foreground border-border', label: 'REVIEW' },
    under_review: { cls: 'bg-accent text-accent-foreground border-border', label: 'UNDER REVIEW' },
    pending: { cls: 'bg-muted text-muted-foreground border-border', label: 'PENDING' },
    passed: { cls: 'bg-primary/20 text-primary border-primary/30', label: 'PASSED' },
    failed: { cls: 'bg-destructive/20 text-destructive border-destructive/30', label: 'FAILED' },
    warning: { cls: 'bg-accent text-accent-foreground border-border', label: 'WARNING' },
    promoted: { cls: 'bg-primary/20 text-primary border-primary/30', label: 'PROMOTED' },
  };
  const v = map[verdict] ?? map.pending;
  return <Badge variant="outline" className={v.cls}>{v.label}</Badge>;
}

function RunSummaryMini({ run }: { run: ExperimentRun }) {
  const r = run.result;
  const metrics = [
    { l: 'P&L', v: `$${r.netPnl.toFixed(0)}` },
    { l: 'DD', v: `${r.maxDrawdown.toFixed(1)}%` },
    { l: 'WR', v: `${r.winRate.toFixed(1)}%` },
    { l: 'PF', v: r.profitFactor.toFixed(2) },
    { l: 'Rob.', v: r.robustnessScore.toFixed(0) },
    { l: 'Trades', v: String(r.tradeCount) },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 pt-2">
      {metrics.map(m => (
        <div key={m.l} className="text-center">
          <p className="text-[10px] text-muted-foreground">{m.l}</p>
          <p className="text-xs font-medium text-foreground">{m.v}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Phase Result Card ───────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: PhaseResult }) {
  const statusIcon = phase.status === 'passed'
    ? <CheckCircle className="h-4 w-4 text-primary" />
    : phase.status === 'failed'
      ? <XCircle className="h-4 w-4 text-destructive" />
      : <AlertTriangle className="h-4 w-4 text-accent-foreground" />;

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcon}
            <p className="text-sm font-medium text-foreground">{phase.label}</p>
          </div>
          <VerdictBadge verdict={phase.status} />
        </div>
        <p className="text-xs text-muted-foreground">{phase.explanation}</p>
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            { l: 'Return', v: `${phase.metrics.totalReturn.toFixed(1)}%` },
            { l: 'DD', v: `${phase.metrics.maxDrawdown.toFixed(1)}%` },
            { l: 'PF', v: phase.metrics.profitFactor.toFixed(2) },
            { l: 'Rob.', v: phase.metrics.robustnessScore.toFixed(0) },
          ].map(m => (
            <div key={m.l} className="text-center">
              <p className="text-[10px] text-muted-foreground">{m.l}</p>
              <p className="text-xs font-medium text-foreground">{m.v}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">Data: {phase.duration}</p>
      </CardContent>
    </Card>
  );
}

// ─── Side-by-Side Row ────────────────────────────────────────────────────────

function SideBySideRow({ m }: { m: SideBySideMetric }) {
  const ChangeIcon = m.change > 0 ? TrendingUp : m.change < 0 ? TrendingDown : Minus;
  return (
    <div className="grid grid-cols-4 items-center py-2 border-b border-border/50 last:border-0 text-xs">
      <p className="font-medium text-foreground">{m.label}</p>
      <p className="text-center text-muted-foreground">
        {m.unit === '$' ? `$${m.baselineValue.toFixed(0)}` : `${m.baselineValue.toFixed(1)}${m.unit}`}
      </p>
      <p className="text-center text-muted-foreground">
        {m.unit === '$' ? `$${m.candidateValue.toFixed(0)}` : `${m.candidateValue.toFixed(1)}${m.unit}`}
      </p>
      <div className={`flex items-center justify-end gap-1 ${m.improved ? 'text-primary' : m.change === 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
        <ChangeIcon className="h-3 w-3" />
        <span>{m.change > 0 ? '+' : ''}{m.changePercent.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ─── Criterion / Stability / Audit Rows ──────────────────────────────────────

function CriterionRow({ c }: { c: PromotionCriterion }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {c.passed ? <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{c.label}</p>
          <p className="text-xs text-muted-foreground">{c.explanation}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">Base: {c.baselineValue.toFixed(2)}</p>
        <p className={`text-xs font-medium ${c.passed ? 'text-primary' : 'text-destructive'}`}>Cand: {c.candidateValue.toFixed(2)}</p>
      </div>
    </div>
  );
}

function StabilityRow({ s }: { s: StabilityCheck }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      {s.passed ? <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium text-foreground">{s.label}</p>
        <p className="text-xs text-muted-foreground">{s.explanation}</p>
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: PromotionAuditEntry }) {
  const icons: Record<string, typeof Shield> = {
    evaluation: Scale, promotion: ArrowUpCircle, rejection: XCircle,
    cooldown_block: Clock, baseline_set: Shield,
  };
  const Icon = icons[entry.type] ?? FileText;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-medium text-foreground capitalize">{entry.type.replace(/_/g, ' ')}</p>
          <VerdictBadge verdict={entry.status} />
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{entry.explanation}</p>
      </div>
    </div>
  );
}

// ─── Step Indicator ──────────────────────────────────────────────────────────

function StepIndicator({ current, completed }: { current: WorkflowStep; completed: Set<WorkflowStep> }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((step, i) => {
        const isActive = step.key === current;
        const isDone = completed.has(step.key);
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isActive ? 'bg-primary text-primary-foreground'
                : isDone ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className={`h-3 w-3 shrink-0 ${isDone ? 'text-primary' : 'text-muted-foreground/40'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function PromotionDashboard() {
  const [experimentStore] = useState(() => loadExperimentStore());
  const [promoStore, setPromoStore] = useState(() => loadPromotionStore());
  const [cycleHistory, setCycleHistory] = useState(() => loadCycleHistory());
  const [step, setStep] = useState<WorkflowStep>('baseline');
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(promoStore.currentBaselineRunId ?? '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [activeEvaluation, setActiveEvaluation] = useState<PromotionEvaluation | null>(null);
  const [cycleResult, setCycleResult] = useState<ResearchCycleResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const runs = experimentStore.runs;
  const baselineRun = useMemo(() => runs.find(r => r.id === selectedBaselineId), [runs, selectedBaselineId]);
  const candidateRun = useMemo(() => runs.find(r => r.id === selectedCandidateId), [runs, selectedCandidateId]);

  const completed = useMemo(() => {
    const s = new Set<WorkflowStep>();
    if (selectedBaselineId && promoStore.currentBaselineRunId === selectedBaselineId) s.add('baseline');
    if (selectedCandidateId) s.add('candidate');
    if (cycleResult) { s.add('test'); s.add('compare'); }
    if (activeEvaluation?.status === 'approved' || activeEvaluation?.status === 'rejected') s.add('decide');
    return s;
  }, [selectedBaselineId, selectedCandidateId, cycleResult, activeEvaluation, promoStore.currentBaselineRunId]);

  // ── Handlers ──

  const handleSetBaseline = useCallback(() => {
    if (!selectedBaselineId) return;
    const updated = setPromotionBaseline(promoStore, selectedBaselineId);
    setPromoStore(updated);
    setStep('candidate');
    toast.success('Baseline locked');
  }, [promoStore, selectedBaselineId]);

  const handlePickCandidate = useCallback(() => {
    if (!selectedCandidateId) return;
    setStep('test');
  }, [selectedCandidateId]);

  const handleRunTests = useCallback(() => {
    if (!baselineRun || !candidateRun) return;
    setTesting(true);
    setTestProgress(0);

    // Simulate phased progress
    const phases = [
      { pct: 33, delay: 600 },
      { pct: 66, delay: 1200 },
      { pct: 100, delay: 1800 },
    ];
    phases.forEach(({ pct, delay }) => {
      setTimeout(() => setTestProgress(pct), delay);
    });

    setTimeout(() => {
      const result = runResearchCycle(baselineRun, candidateRun);
      setCycleResult(result);
      setTesting(false);
      setTestProgress(100);

      // Also run promotion evaluation
      const { store: updated, evaluation } = evaluateCandidate(baselineRun, candidateRun, promoStore);
      setPromoStore(updated);
      setActiveEvaluation(evaluation);
      setStep('compare');
      toast.info(`Research cycle complete: ${result.phases.filter(p => p.status === 'passed').length}/3 phases passed`);
    }, 2200);
  }, [baselineRun, candidateRun, promoStore]);

  const handlePromote = useCallback(() => {
    if (!activeEvaluation || activeEvaluation.overallVerdict !== 'promote') return;
    const updated = promoteCandidate(promoStore, activeEvaluation.id);
    setPromoStore(updated);
    setSelectedBaselineId(activeEvaluation.candidateRunId);
    setActiveEvaluation({ ...activeEvaluation, status: 'approved' });
    if (cycleResult && baselineRun && candidateRun) {
      saveCycleEntry(cycleResult, baselineRun.name, candidateRun.name, 'promoted');
      setCycleHistory(loadCycleHistory());
    }
    setStep('decide');
    toast.success('Candidate promoted to new baseline');
  }, [promoStore, activeEvaluation, cycleResult, baselineRun, candidateRun]);

  const handleReject = useCallback(() => {
    if (!activeEvaluation) return;
    const updated = rejectCandidate(promoStore, activeEvaluation.id);
    setPromoStore(updated);
    setActiveEvaluation({ ...activeEvaluation, status: 'rejected' });
    if (cycleResult && baselineRun && candidateRun) {
      saveCycleEntry(cycleResult, baselineRun.name, candidateRun.name, 'rejected');
      setCycleHistory(loadCycleHistory());
    }
    setStep('decide');
    toast.info('Candidate rejected');
  }, [promoStore, activeEvaluation, cycleResult, baselineRun, candidateRun]);

  const handleReset = useCallback(() => {
    setSelectedCandidateId('');
    setActiveEvaluation(null);
    setCycleResult(null);
    setTestProgress(0);
    setStep('candidate');
  }, []);

  // ── Empty state ──

  if (runs.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <FlaskConical className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No experiment runs available. Run backtests or paper trading sessions first to start a research cycle.</p>
      </CardContent></Card>
    );
  }

  // ── Layout ──

  return (
    <div className="space-y-5">
      <StepIndicator current={step} completed={completed} />

      <Tabs value={step} onValueChange={v => setStep(v as WorkflowStep)} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="baseline">① Baseline</TabsTrigger>
          <TabsTrigger value="candidate" disabled={!completed.has('baseline')}>② Candidate</TabsTrigger>
          <TabsTrigger value="test" disabled={!selectedCandidateId}>③ Test</TabsTrigger>
          <TabsTrigger value="compare" disabled={!cycleResult}>④ Compare</TabsTrigger>
          <TabsTrigger value="decide" disabled={!activeEvaluation}>⑤ Decide</TabsTrigger>
        </TabsList>

        {/* ── Step 1: Baseline ── */}
        <TabsContent value="baseline" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Lock a Baseline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Select the current best strategy configuration. All candidates will be measured against this.</p>
              <Select value={selectedBaselineId} onValueChange={setSelectedBaselineId}>
                <SelectTrigger><SelectValue placeholder="Select baseline run…" /></SelectTrigger>
                <SelectContent>
                  {runs.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} — {r.result.totalReturn.toFixed(1)}% return ({r.id.slice(0, 8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {baselineRun && <RunSummaryMini run={baselineRun} />}
              <Button onClick={handleSetBaseline} disabled={!selectedBaselineId} className="w-full">
                Lock Baseline & Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Step 2: Candidate ── */}
        <TabsContent value="candidate" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Select a Candidate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Pick the strategy run to evaluate for promotion against the baseline.</p>
              {baselineRun && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                  <Shield className="h-3 w-3 text-primary shrink-0" />
                  Baseline: <span className="font-medium text-foreground">{baselineRun.name}</span>
                </div>
              )}
              <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                <SelectTrigger><SelectValue placeholder="Select candidate run…" /></SelectTrigger>
                <SelectContent>
                  {runs.filter(r => r.id !== selectedBaselineId).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} — {r.result.totalReturn.toFixed(1)}% return ({r.id.slice(0, 8)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {candidateRun && <RunSummaryMini run={candidateRun} />}
              <Button onClick={handlePickCandidate} disabled={!selectedCandidateId} className="w-full">
                Confirm Candidate & Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Step 3: Test ── */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Run Research Cycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Automatically run backtest, out-of-sample validation, and scenario stress tests against the candidate.
              </p>

              {/* Preview cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {baselineRun && (
                  <div className="border border-border rounded-md p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Baseline</p>
                    <p className="text-sm font-medium text-foreground">{baselineRun.name}</p>
                    <RunSummaryMini run={baselineRun} />
                  </div>
                )}
                {candidateRun && (
                  <div className="border border-primary/30 rounded-md p-3">
                    <p className="text-[10px] uppercase tracking-wider text-primary mb-1">Candidate</p>
                    <p className="text-sm font-medium text-foreground">{candidateRun.name}</p>
                    <RunSummaryMini run={candidateRun} />
                  </div>
                )}
              </div>

              {/* Test phases overview */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Test Phases</p>
                {['In-Sample Backtest', 'Out-of-Sample Validation', 'Scenario Stress Test'].map((label, i) => {
                  const phaseDone = testProgress > (i + 1) * 33 - 10;
                  const phaseActive = testing && testProgress >= i * 33 && testProgress < (i + 1) * 33;
                  return (
                    <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${
                      phaseDone ? 'bg-primary/10 text-primary' : phaseActive ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-muted-foreground'
                    }`}>
                      {phaseDone ? <CheckCircle className="h-3 w-3" /> : phaseActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                      {label}
                    </div>
                  );
                })}
              </div>

              {testing && <Progress value={testProgress} className="h-1.5" />}

              <Button
                onClick={handleRunTests}
                disabled={!baselineRun || !candidateRun || testing}
                className="w-full"
              >
                {testing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Tests…</>
                ) : (
                  <><FlaskConical className="h-4 w-4 mr-2" /> Start Research Cycle</>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Step 4: Compare ── */}
        <TabsContent value="compare" className="space-y-4">
          {/* Phase results */}
          {cycleResult && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Test Phase Results</CardTitle>
                    <Badge variant="outline" className={cycleResult.overallPassed ? 'bg-primary/20 text-primary border-primary/30' : 'bg-destructive/20 text-destructive border-destructive/30'}>
                      {cycleResult.phases.filter(p => p.status !== 'failed').length}/{cycleResult.phases.length} PASSED
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{cycleResult.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cycleResult.phases.map(p => <PhaseCard key={p.phase} phase={p} />)}
                  </div>
                </CardContent>
              </Card>

              {/* Side-by-side */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Side-by-Side Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider text-muted-foreground py-2 border-b border-border">
                    <span>Metric</span>
                    <span className="text-center">Baseline</span>
                    <span className="text-center">Candidate</span>
                    <span className="text-right">Change</span>
                  </div>
                  {cycleResult.sideBySide.map(m => <SideBySideRow key={m.label} m={m} />)}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Promotion criteria */}
          {activeEvaluation && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Promotion Criteria</CardTitle>
                  <VerdictBadge verdict={activeEvaluation.overallVerdict} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!activeEvaluation.cooldownSatisfied && (
                  <div className="flex items-center gap-2 text-xs text-accent-foreground bg-accent rounded-md px-3 py-2">
                    <Clock className="h-3 w-3" />
                    Cooldown remaining: {Math.ceil(activeEvaluation.cooldownRemainingMs / 60000)}m
                  </div>
                )}
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Criteria ({activeEvaluation.passCount}/{activeEvaluation.criteria.length} passed)
                </p>
                {activeEvaluation.criteria.map(c => <CriterionRow key={c.id} c={c} />)}
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stability Checks</p>
                {activeEvaluation.stabilityChecks.map(s => <StabilityRow key={s.id} s={s} />)}

                {activeEvaluation.rejectionReasons.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Issues</p>
                    {activeEvaluation.rejectionReasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{r}</p>
                      </div>
                    ))}
                  </>
                )}

                <Button onClick={() => setStep('decide')} className="w-full">
                  Proceed to Decision <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Step 5: Decide ── */}
        <TabsContent value="decide" className="space-y-4">
          {activeEvaluation && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Promotion Decision</CardTitle>
                  <VerdictBadge verdict={activeEvaluation.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">{activeEvaluation.explanation}</p>

                {activeEvaluation.status === 'approved' && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-md px-3 py-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <p className="text-xs text-foreground">Candidate promoted. It is now the active baseline. Start a new cycle to test the next candidate.</p>
                  </div>
                )}
                {activeEvaluation.status === 'rejected' && (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <p className="text-xs text-foreground">Candidate rejected and archived. Baseline unchanged. Try a different candidate.</p>
                  </div>
                )}

                {activeEvaluation.status !== 'approved' && activeEvaluation.status !== 'rejected' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePromote} disabled={activeEvaluation.overallVerdict !== 'promote'} className="flex-1">
                      <ArrowUpCircle className="h-3 w-3 mr-1" /> Promote to Baseline
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleReject} className="flex-1">
                      <XCircle className="h-3 w-3 mr-1" /> Reject & Archive
                    </Button>
                  </div>
                )}

                <Separator />
                <Button variant="outline" onClick={handleReset} className="w-full">
                  <RotateCcw className="h-3 w-3 mr-2" /> Start New Cycle
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Cycle History & Audit ── */}
      <Separator />
      <Tabs defaultValue="cycles" className="space-y-3">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="cycles" className="flex-1">Cycle History</TabsTrigger>
          <TabsTrigger value="evaluations" className="flex-1">Evaluations</TabsTrigger>
          <TabsTrigger value="audit" className="flex-1">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="cycles">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Research Cycle History</CardTitle>
            </CardHeader>
            <CardContent>
              {cycleHistory.cycles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No completed research cycles yet.</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  {cycleHistory.cycles.map(c => (
                    <div key={c.id} className="py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-foreground">{c.candidateName} vs {c.baselineName}</p>
                        <VerdictBadge verdict={c.verdict} />
                      </div>
                      <p className="text-xs text-muted-foreground">{c.summary}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(c.timestamp).toLocaleString()} • {c.phasesPassed}/{c.phasesTotal} phases passed
                      </p>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Evaluation History</CardTitle></CardHeader>
            <CardContent>
              {promoStore.evaluations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No evaluations yet.</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  {promoStore.evaluations.map(ev => (
                    <div key={ev.id} className="py-3 border-b border-border/50 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-foreground">
                          {runs.find(r => r.id === ev.candidateRunId)?.name ?? ev.candidateRunId.slice(0, 8)}
                          {' vs '}
                          {runs.find(r => r.id === ev.baselineRunId)?.name ?? ev.baselineRunId.slice(0, 8)}
                        </p>
                        <VerdictBadge verdict={ev.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">{ev.explanation}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(ev.timestamp).toLocaleString()} • {ev.passCount}/{ev.criteria.length} passed
                      </p>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Promotion Audit Log</CardTitle></CardHeader>
            <CardContent>
              {promoStore.auditLog.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No audit entries yet.</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  {promoStore.auditLog.map(entry => <AuditRow key={entry.id} entry={entry} />)}
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
