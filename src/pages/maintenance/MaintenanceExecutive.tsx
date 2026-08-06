import { MaintenancePage, HealthGauge, ScoreBar, StatCard, StatusPill } from '@/components/maintenance/shared';
import { MaintenanceAssistant } from '@/components/maintenance/MaintenanceAssistant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getExecutiveSummary, getCycleSteps, getModules, statusFromScore } from '@/lib/maintenance';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';

export default function MaintenanceExecutive() {
  const s = getExecutiveSummary();
  const cycle = getCycleSteps();
  const modules = getModules();

  return (
    <MaintenancePage
      title="Executive Dashboard"
      subtitle="Autonomous operations overview for the entire ATLAS OS platform — health, integrity, repairs and the live maintenance cycle."
      actions={<StatusPill status={s.status} />}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-trading-gold/25 lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-6">
            <HealthGauge value={s.institutionHealth} status={s.status} />
            <div className="w-full space-y-2 pt-2">
              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Latest cycle</span><span>{s.latestCycle}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">Next cycle</span><span>{s.nextCycle}</span></div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
          <StatCard label="Modules Checked" value={s.modulesChecked} />
          <StatCard label="Modules Healthy" value={s.modulesHealthy} tone="good" />
          <StatCard label="Warnings" value={s.warnings} tone="warn" />
          <StatCard label="Critical Issues" value={s.criticalIssues} tone={s.criticalIssues ? 'bad' : 'good'} />
          <StatCard label="Auto Repairs Today" value={s.autoRepairsToday} tone="good" hint="Safe repairs only" />
          <StatCard label="Manual Reviews" value={s.manualReviews} tone="warn" hint="Operator action required" />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Institution Scorecard</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreBar label="Performance" value={s.performanceScore} />
          <ScoreBar label="Security" value={s.securityScore} />
          <ScoreBar label="Governance" value={s.governanceScore} />
          <ScoreBar label="Knowledge" value={s.knowledgeScore} />
          <ScoreBar label="Accessibility" value={s.accessibilityScore} />
          <ScoreBar label="UI Consistency" value={s.uiConsistencyScore} />
          <ScoreBar label="Database Health" value={s.databaseHealth} />
          <ScoreBar label="Overall Institution" value={s.institutionHealth} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Automatic Maintenance Cycle</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cycle.map((c) => (
              <div key={c.step} className="flex items-start gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
                {c.status === 'complete' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-trading-profit" />}
                {c.status === 'running' && <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />}
                {c.status === 'queued' && <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium">{c.step}</span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">{c.durationMs} ms</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{c.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Modules Requiring Attention</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {modules.filter((m) => m.status !== 'healthy').sort((a, b) => a.health - b.health).slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.note}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums">{m.health}</span>
                  <StatusPill status={statusFromScore(m.health)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MaintenanceAssistant />
    </MaintenancePage>
  );
}
