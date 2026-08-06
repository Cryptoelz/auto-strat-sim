import { MaintenancePage, HealthGauge, ScoreBar, StatCard, StatusPill } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExecutiveSummary, getModules, getWorkflows, getPredictions, statusFromScore } from '@/lib/maintenance';

export default function MaintenanceInstitutionHealth() {
  const s = getExecutiveSummary();
  const modules = getModules();
  const workflows = getWorkflows();
  const predictions = getPredictions();
  const groups = Array.from(new Set(modules.map((m) => m.group)));

  return (
    <MaintenancePage
      title="Institution Health"
      subtitle="A single explainable view of how the institution's health score is composed, where points are lost, and what is driving the trend."
      actions={<StatusPill status={s.status} />}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-trading-gold/25">
          <CardContent className="flex justify-center p-6"><HealthGauge value={s.institutionHealth} status={s.status} size={220} /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Score Composition — where the lost points are</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ['Performance', s.performanceScore],
              ['Security', s.securityScore],
              ['Governance', s.governanceScore],
              ['Knowledge', s.knowledgeScore],
              ['Accessibility', s.accessibilityScore],
              ['UI Consistency', s.uiConsistencyScore],
              ['Database Health', s.databaseHealth],
            ].map(([label, v]) => (
              <div key={label as string} className="grid grid-cols-[1fr_auto] items-center gap-4">
                <ScoreBar label={label as string} value={v as number} />
                <span className="text-[10px] text-muted-foreground">−{100 - (v as number)} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Healthy Modules" value={`${s.modulesHealthy}/${s.modulesChecked}`} tone="good" />
        <StatCard label="Workflows Intact" value={`${workflows.filter((w) => !w.brokenAt).length}/${workflows.length}`} tone="good" />
        <StatCard label="Open Warnings" value={s.warnings} tone="warn" />
        <StatCard label="Predicted Risks" value={predictions.filter((p) => p.severity !== 'low').length} tone="warn" />
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Health by Institution Group</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => {
            const ms = modules.filter((m) => m.group === g);
            const avg = Math.round(ms.reduce((a, m) => a + m.health, 0) / ms.length);
            return (
              <div key={g} className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{g}</span>
                  <StatusPill status={statusFromScore(avg)} />
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">{avg}</p>
                <p className="text-[10px] text-muted-foreground">{ms.length} modules · {ms.reduce((a, m) => a + m.warnings, 0)} warnings</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Explainability — why health is {s.institutionHealth}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[11px] text-muted-foreground">
          <p>• {s.modulesHealthy} of {s.modulesChecked} modules sit in the healthy band; the remainder carry {s.warnings} warnings and {s.criticalIssues} critical issues.</p>
          <p>• The largest deduction comes from the lowest-scoring dimension, currently {[['Performance', s.performanceScore], ['Knowledge', s.knowledgeScore], ['Accessibility', s.accessibilityScore], ['Database', s.databaseHealth]].sort((a, b) => (a[1] as number) - (b[1] as number))[0][0]}.</p>
          <p>• {workflows.filter((w) => w.brokenAt).length} workflow(s) reported an integrity break during the last cycle.</p>
          <p>• {s.autoRepairsToday} safe repairs were applied today, recovering hygiene points without touching trading state.</p>
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
