import { MaintenancePage, StatusPill, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWorkflows } from '@/lib/maintenance';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  broken: 'Broken workflow',
  'missing-step': 'Missing step',
  'dead-end': 'Dead-end navigation',
  'missing-approval': 'Missing approval',
  'invalid-transition': 'Invalid transition',
};

export default function MaintenanceWorkflows() {
  const workflows = getWorkflows();
  const broken = workflows.filter((w) => w.brokenAt);

  return (
    <MaintenancePage
      title="Workflow Integrity"
      subtitle="Every institutional workflow is traced end to end each cycle to detect broken paths, missing steps, dead-end navigation, missing approvals and invalid transitions."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Workflows Traced" value={workflows.length} />
        <StatCard label="Intact" value={workflows.length - broken.length} tone="good" />
        <StatCard label="Issues Detected" value={broken.length} tone={broken.length ? 'warn' : 'good'} />
        <StatCard label="Average Integrity" value={Math.round(workflows.reduce((a, w) => a + w.integrity, 0) / workflows.length)} />
      </div>

      {workflows.map((w) => (
        <Card key={w.id} className={cn(w.brokenAt && 'border-trading-warning/40')}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                {w.brokenAt ? <AlertTriangle className="h-4 w-4 text-trading-warning" /> : <CheckCircle2 className="h-4 w-4 text-trading-profit" />}
                {w.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Integrity {w.integrity}</span>
                <StatusPill status={w.status} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {w.steps.map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded-md border px-2 py-1 text-[10px]',
                      step === w.brokenAt
                        ? 'border-trading-warning/60 bg-trading-warning/10 text-trading-warning'
                        : 'border-border/60 bg-card/50 text-muted-foreground'
                    )}
                  >
                    {step}
                  </span>
                  {i < w.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/60" />}
                </div>
              ))}
            </div>
            {w.brokenAt ? (
              <div className="rounded-md border border-trading-warning/30 bg-trading-warning/5 p-2.5">
                <p className="text-[11px] font-medium text-trading-warning">{TYPE_LABEL[w.issueType!]} at “{w.brokenAt}”</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{w.issue}</p>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">All transitions valid, all approvals recorded, no dead ends detected.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </MaintenancePage>
  );
}
