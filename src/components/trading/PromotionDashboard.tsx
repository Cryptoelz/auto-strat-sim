import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Shield, ArrowUpCircle, Clock, FileText, Scale } from 'lucide-react';
import { loadExperimentStore } from '@/lib/experimentEngine';
import { loadPromotionStore, savePromotionStore, evaluateCandidate, promoteCandidate, rejectCandidate, setPromotionBaseline } from '@/lib/promotionEngine';
import { PromotionEvaluation, PromotionCriterion, StabilityCheck, PromotionAuditEntry } from '@/types/promotion';
import { ExperimentRun } from '@/types/experiment';
import { toast } from 'sonner';

// ─── Sub-components ──────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: string }) {
  const map: Record<string, { class: string; label: string }> = {
    promote: { class: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'PROMOTE' },
    approved: { class: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'APPROVED' },
    reject: { class: 'bg-destructive/20 text-destructive border-destructive/30', label: 'REJECT' },
    rejected: { class: 'bg-destructive/20 text-destructive border-destructive/30', label: 'REJECTED' },
    inconclusive: { class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'REVIEW' },
    under_review: { class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'UNDER REVIEW' },
    pending: { class: 'bg-muted text-muted-foreground border-border', label: 'PENDING' },
  };
  const v = map[verdict] ?? map.pending;
  return <Badge variant="outline" className={v.class}>{v.label}</Badge>;
}

function CriterionRow({ c }: { c: PromotionCriterion }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-border/50 last:border-0">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {c.passed ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{c.label}</p>
          <p className="text-xs text-muted-foreground">{c.explanation}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted-foreground">Base: {c.baselineValue.toFixed(2)}</p>
        <p className={`text-xs font-medium ${c.passed ? 'text-green-400' : 'text-destructive'}`}>Cand: {c.candidateValue.toFixed(2)}</p>
      </div>
    </div>
  );
}

function StabilityRow({ s }: { s: StabilityCheck }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      {s.passed ? <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium text-foreground">{s.label}</p>
        <p className="text-xs text-muted-foreground">{s.explanation}</p>
      </div>
    </div>
  );
}

function AuditRow({ entry }: { entry: PromotionAuditEntry }) {
  const icons: Record<string, typeof Shield> = {
    evaluation: Scale, promotion: ArrowUpCircle, rejection: XCircle, cooldown_block: Clock, baseline_set: Shield,
  };
  const Icon = icons[entry.type] ?? FileText;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-foreground capitalize">{entry.type.replace('_', ' ')}</p>
          <VerdictBadge verdict={entry.status} />
          <span className="text-[10px] text-muted-foreground ml-auto">{new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{entry.explanation}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function PromotionDashboard() {
  const [experimentStore] = useState(() => loadExperimentStore());
  const [promoStore, setPromoStore] = useState(() => loadPromotionStore());
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>(promoStore.currentBaselineRunId ?? '');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [activeEvaluation, setActiveEvaluation] = useState<PromotionEvaluation | null>(null);

  const runs = experimentStore.runs;
  const baselineRun = useMemo(() => runs.find(r => r.id === selectedBaselineId), [runs, selectedBaselineId]);
  const candidateRun = useMemo(() => runs.find(r => r.id === selectedCandidateId), [runs, selectedCandidateId]);

  const handleSetBaseline = useCallback(() => {
    if (!selectedBaselineId) return;
    const updated = setPromotionBaseline(promoStore, selectedBaselineId);
    setPromoStore(updated);
    toast.success('Baseline set');
  }, [promoStore, selectedBaselineId]);

  const handleEvaluate = useCallback(() => {
    if (!baselineRun || !candidateRun) return;
    const { store: updated, evaluation } = evaluateCandidate(baselineRun, candidateRun, promoStore);
    setPromoStore(updated);
    setActiveEvaluation(evaluation);
    toast.info(`Evaluation complete: ${evaluation.overallVerdict.toUpperCase()}`);
  }, [baselineRun, candidateRun, promoStore]);

  const handlePromote = useCallback(() => {
    if (!activeEvaluation || activeEvaluation.overallVerdict !== 'promote') return;
    const updated = promoteCandidate(promoStore, activeEvaluation.id);
    setPromoStore(updated);
    setSelectedBaselineId(activeEvaluation.candidateRunId);
    toast.success('Candidate promoted to baseline');
  }, [promoStore, activeEvaluation]);

  const handleReject = useCallback(() => {
    if (!activeEvaluation) return;
    const updated = rejectCandidate(promoStore, activeEvaluation.id);
    setPromoStore(updated);
    setActiveEvaluation({ ...activeEvaluation, status: 'rejected' });
    toast.info('Candidate rejected');
  }, [promoStore, activeEvaluation]);

  if (runs.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No experiment runs found. Run backtests or paper trading sessions first.</p>
      </CardContent></Card>
    );
  }

  return (
    <Tabs defaultValue="evaluate" className="space-y-4">
      <TabsList className="grid grid-cols-3 w-full max-w-md">
        <TabsTrigger value="evaluate">Evaluate</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="audit">Audit Log</TabsTrigger>
      </TabsList>

      {/* ── Evaluate Tab ── */}
      <TabsContent value="evaluate" className="space-y-4">
        {/* Run selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Baseline</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedBaselineId} onValueChange={setSelectedBaselineId}>
                <SelectTrigger><SelectValue placeholder="Select baseline run" /></SelectTrigger>
                <SelectContent>{runs.map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.id.slice(0, 8)})</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={handleSetBaseline} disabled={!selectedBaselineId} className="w-full">Set as Baseline</Button>
              {baselineRun && <RunSummaryMini run={baselineRun} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ArrowUpCircle className="h-4 w-4" /> Candidate</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
                <SelectTrigger><SelectValue placeholder="Select candidate run" /></SelectTrigger>
                <SelectContent>{runs.filter(r => r.id !== selectedBaselineId).map(r => <SelectItem key={r.id} value={r.id}>{r.name} ({r.id.slice(0, 8)})</SelectItem>)}</SelectContent>
              </Select>
              {candidateRun && <RunSummaryMini run={candidateRun} />}
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleEvaluate} disabled={!baselineRun || !candidateRun} className="w-full md:w-auto">
          <Scale className="h-4 w-4 mr-2" /> Evaluate Candidate
        </Button>

        {/* Evaluation results */}
        {activeEvaluation && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Evaluation Result</CardTitle>
                  <VerdictBadge verdict={activeEvaluation.overallVerdict} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">{activeEvaluation.explanation}</p>
                {!activeEvaluation.cooldownSatisfied && (
                  <div className="flex items-center gap-2 text-xs text-yellow-400">
                    <Clock className="h-3 w-3" />
                    Cooldown remaining: {Math.ceil(activeEvaluation.cooldownRemainingMs / 60000)}m
                  </div>
                )}
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Promotion Criteria ({activeEvaluation.passCount}/{activeEvaluation.criteria.length} passed)</p>
                {activeEvaluation.criteria.map(c => <CriterionRow key={c.id} c={c} />)}
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stability Checks</p>
                {activeEvaluation.stabilityChecks.map(s => <StabilityRow key={s.id} s={s} />)}

                {activeEvaluation.rejectionReasons.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rejection Reasons</p>
                    {activeEvaluation.rejectionReasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 py-1">
                        <AlertTriangle className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{r}</p>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handlePromote} disabled={activeEvaluation.overallVerdict !== 'promote'} className="flex-1">
                    <ArrowUpCircle className="h-3 w-3 mr-1" /> Promote
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleReject} disabled={activeEvaluation.status === 'rejected'} className="flex-1">
                    <XCircle className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>

      {/* ── History Tab ── */}
      <TabsContent value="history" className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evaluation History</CardTitle></CardHeader>
          <CardContent>
            {promoStore.evaluations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No evaluations yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                {promoStore.evaluations.map(ev => (
                  <div key={ev.id} className="py-3 border-b border-border/50 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-foreground">
                        {runs.find(r => r.id === ev.candidateRunId)?.name ?? ev.candidateRunId.slice(0, 8)} vs {runs.find(r => r.id === ev.baselineRunId)?.name ?? ev.baselineRunId.slice(0, 8)}
                      </p>
                      <VerdictBadge verdict={ev.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.explanation}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(ev.timestamp).toLocaleString()} • {ev.passCount}/{ev.criteria.length} passed</p>
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Audit Tab ── */}
      <TabsContent value="audit" className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Promotion Audit Log</CardTitle></CardHeader>
          <CardContent>
            {promoStore.auditLog.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No audit entries yet.</p>
            ) : (
              <ScrollArea className="h-[400px]">
                {promoStore.auditLog.map(entry => <AuditRow key={entry.id} entry={entry} />)}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Mini Run Summary ────────────────────────────────────────────────────────

function RunSummaryMini({ run }: { run: ExperimentRun }) {
  const r = run.result;
  return (
    <div className="grid grid-cols-3 gap-2 pt-2">
      {[
        { l: 'P&L', v: `$${r.netPnl.toFixed(0)}` },
        { l: 'DD', v: `${r.maxDrawdown.toFixed(1)}%` },
        { l: 'WR', v: `${r.winRate.toFixed(1)}%` },
        { l: 'PF', v: r.profitFactor.toFixed(2) },
        { l: 'Rob.', v: r.robustnessScore.toFixed(0) },
        { l: 'Trades', v: r.tradeCount },
      ].map(m => (
        <div key={m.l} className="text-center">
          <p className="text-[10px] text-muted-foreground">{m.l}</p>
          <p className="text-xs font-medium text-foreground">{m.v}</p>
        </div>
      ))}
    </div>
  );
}
