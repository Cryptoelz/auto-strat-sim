import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, BarChart3,
  RefreshCw, FileText, ArrowUpCircle, Settings, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TradingState } from '@/types/trading';
import {
  ReadinessReport, ReadinessConfig, ReadinessAuditEntry,
  READINESS_STATE_META, PROMOTION_LABELS, DEFAULT_READINESS_CONFIG,
} from '@/types/readiness';
import { runReadinessReview, reportToAuditEntry } from '@/lib/readinessEngine';
import { format } from 'date-fns';

interface Props {
  state: TradingState;
}

export function ReadinessDashboard({ state }: Props) {
  const [config, setConfig] = useState<ReadinessConfig>(DEFAULT_READINESS_CONFIG);
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [auditLog, setAuditLog] = useState<ReadinessAuditEntry[]>([]);

  const handleRunReview = () => {
    const r = runReadinessReview(state, config);
    setReport(r);
    setAuditLog(prev => [reportToAuditEntry(r), ...prev].slice(0, 50));
  };

  const meta = report ? READINESS_STATE_META[report.readinessState] : null;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Readiness Review & Validation</CardTitle>
              <CardDescription className="text-xs">Final validation before paper trading promotion</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={handleRunReview} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Run Review
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {!report ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Click "Run Review" to evaluate system readiness.
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-3">
            <TabsList className="grid w-full grid-cols-6 h-8">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="checks" className="text-xs">Checks</TabsTrigger>
              <TabsTrigger value="domains" className="text-xs">Domains</TabsTrigger>
              <TabsTrigger value="issues" className="text-xs">Issues</TabsTrigger>
              <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
              <TabsTrigger value="audit" className="text-xs">Audit</TabsTrigger>
            </TabsList>

            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta!.icon}</span>
                <div>
                  <Badge className={cn('text-xs', meta!.color)}>{meta!.label}</Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Score: <strong>{report.overallScore.toFixed(0)}</strong>/100
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge variant="outline" className="text-xs">{PROMOTION_LABELS[report.promotion]}</Badge>
                </div>
              </div>

              <Progress value={report.overallScore} className="h-2" />

              <p className="text-xs text-muted-foreground leading-relaxed">{report.explanation}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Score Components */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Score Breakdown</h4>
                  {report.scoreComponents.map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-[11px]">
                      {c.passed ? <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" /> : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                      <span className="flex-1 truncate">{c.label}</span>
                      <span className="font-mono text-muted-foreground">{c.score.toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Strengths / Weaknesses */}
                <div className="space-y-2">
                  {report.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-green-500 mb-1">Strengths</h4>
                      {report.strengths.map((s, i) => <p key={i} className="text-[11px] text-muted-foreground">✓ {s}</p>)}
                    </div>
                  )}
                  {report.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-destructive mb-1">Weaknesses</h4>
                      {report.weaknesses.map((w, i) => <p key={i} className="text-[11px] text-muted-foreground">✗ {w}</p>)}
                    </div>
                  )}
                  {report.recommendedRestrictions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-yellow-500 mb-1">Restrictions</h4>
                      {report.recommendedRestrictions.map((r, i) => <p key={i} className="text-[11px] text-muted-foreground">⚠ {r}</p>)}
                    </div>
                  )}
                </div>
              </div>

              {report.recommendedActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-1"><ArrowUpCircle className="h-3 w-3" /> Next Actions</h4>
                  {report.recommendedActions.map((a, i) => <p key={i} className="text-[11px] text-muted-foreground">→ {a}</p>)}
                </div>
              )}
            </TabsContent>

            {/* ── Checks ── */}
            <TabsContent value="checks">
              <ScrollArea className="h-[350px]">
                <div className="space-y-1">
                  {report.validationChecks.map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                      {c.passed
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        : <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.label}</p>
                        <p className="text-[10px] text-muted-foreground">{c.message}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] shrink-0',
                        c.severity === 'critical' && 'border-destructive/50 text-destructive',
                        c.severity === 'major' && 'border-yellow-500/50 text-yellow-500',
                      )}>{c.severity}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Domains ── */}
            <TabsContent value="domains">
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {report.domainSummaries.map(d => {
                    const dm = READINESS_STATE_META[d.state];
                    return (
                      <div key={d.domain} className="p-2 rounded border border-border/30 bg-background/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{d.domain}</span>
                          <Badge className={cn('text-[10px]', dm.color)}>{dm.label}</Badge>
                        </div>
                        <Progress value={d.score} className="h-1.5 mb-1.5" />
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            {d.strengths.map((s, i) => <p key={i} className="text-green-500">✓ {s}</p>)}
                          </div>
                          <div>
                            {d.weaknesses.map((w, i) => <p key={i} className="text-destructive">✗ {w}</p>)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* ── Issues ── */}
            <TabsContent value="issues">
              <ScrollArea className="h-[350px]">
                {report.unresolvedIssues.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No unresolved issues.</p>
                ) : (
                  <div className="space-y-2">
                    {report.unresolvedIssues.map(issue => (
                      <div key={issue.id} className="p-2 rounded border border-border/30 bg-background/30">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={cn('h-3 w-3 shrink-0',
                            issue.severity === 'critical' ? 'text-destructive' : issue.severity === 'major' ? 'text-yellow-500' : 'text-muted-foreground'
                          )} />
                          <span className="text-xs font-medium">{issue.category}</span>
                          <Badge variant="outline" className="text-[10px] ml-auto">{issue.severity}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{issue.description}</p>
                        <p className="text-[10px] text-primary mt-1">→ {issue.suggestedAction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* ── Config ── */}
            <TabsContent value="config">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'minReadinessScore' as const, label: 'Min Readiness Score', min: 30, max: 90 },
                  { key: 'maxAllowedDrawdown' as const, label: 'Max Allowed Drawdown %', min: 5, max: 50 },
                  { key: 'minRobustnessScore' as const, label: 'Min Robustness Score', min: 20, max: 80 },
                  { key: 'maxOosDegradation' as const, label: 'Max OoS Degradation %', min: 10, max: 60 },
                  { key: 'maxGovernanceCriticalEvents' as const, label: 'Max Governance Critical Events', min: 1, max: 10 },
                  { key: 'maxExecutionIntegrityFailures' as const, label: 'Max Execution Failures', min: 1, max: 20 },
                  { key: 'minNumberOfValidRuns' as const, label: 'Min Valid Runs', min: 1, max: 20 },
                ].map(({ key, label, min, max }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-[11px]">{label}: {config[key]}</Label>
                    <Slider
                      value={[config[key]]}
                      min={min} max={max} step={1}
                      onValueChange={([v]) => setConfig(prev => ({ ...prev, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Audit ── */}
            <TabsContent value="audit">
              <ScrollArea className="h-[350px]">
                {auditLog.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">No reviews run yet.</p>
                ) : (
                  <div className="space-y-2">
                    {auditLog.map(entry => {
                      const em = READINESS_STATE_META[entry.readinessState];
                      return (
                        <div key={entry.id} className="p-2 rounded border border-border/30 bg-background/30">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={cn('text-[10px]', em.color)}>{em.label}</Badge>
                            <span className="text-[10px] text-muted-foreground">{format(entry.timestamp, 'HH:mm:ss')}</span>
                          </div>
                          <p className="text-[11px]">Score: <strong>{entry.overallScore.toFixed(0)}</strong> | {PROMOTION_LABELS[entry.promotion]}</p>
                          {entry.failedGates.length > 0 && (
                            <p className="text-[10px] text-destructive mt-0.5">Failed: {entry.failedGates.join(', ')}</p>
                          )}
                          {entry.followUpRequired && (
                            <Badge variant="outline" className="text-[10px] mt-1 border-yellow-500/50 text-yellow-500">Follow-up Required</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
