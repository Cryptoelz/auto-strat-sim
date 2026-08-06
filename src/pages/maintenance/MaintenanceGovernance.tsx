import { MaintenancePage, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGovernanceAudit, getExecutiveSummary } from '@/lib/maintenance';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export default function MaintenanceGovernance() {
  const audit = getGovernanceAudit();
  const s = getExecutiveSummary();
  const areas = Array.from(new Set(audit.map((a) => a.area)));
  const pass = audit.filter((a) => a.result === 'pass').length;
  const warn = audit.filter((a) => a.result === 'warn').length;
  const fail = audit.filter((a) => a.result === 'fail').length;

  return (
    <MaintenancePage
      title="Governance Auditor"
      subtitle="Continuous inspection of promotion rules, freeze rules, guardrails, human approvals, risk controls, emergency policies, version control and audit trails."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Governance Score" value={s.governanceScore} tone="good" />
        <StatCard label="Rules Passing" value={`${pass}/${audit.length}`} tone="good" />
        <StatCard label="Warnings" value={warn} tone="warn" />
        <StatCard label="Failures" value={fail} tone={fail ? 'bad' : 'good'} />
      </div>

      {areas.map((area) => (
        <Card key={area}>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{area}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {audit.filter((a) => a.area === area).map((a) => (
              <div key={a.rule} className="flex items-start gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
                {a.result === 'pass' && <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-trading-profit" />}
                {a.result === 'warn' && <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-trading-warning" />}
                {a.result === 'fail' && <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-trading-loss" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium">{a.rule}</p>
                  <p className="text-[10px] text-muted-foreground">{a.finding}</p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${a.result === 'pass' ? 'border-trading-profit/40 text-trading-profit' : a.result === 'warn' ? 'border-trading-warning/40 text-trading-warning' : 'border-trading-loss/40 text-trading-loss'}`}
                >
                  {a.result.toUpperCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Detection Register</CardTitle></CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {[
            ['Missing approvals', audit.filter((a) => a.area === 'Human approvals' && a.result !== 'pass').length],
            ['Invalid promotions', audit.filter((a) => a.area === 'Promotion rules' && a.result === 'fail').length],
            ['Unlocked champions', audit.filter((a) => a.area === 'Unlocked champions' && a.result !== 'pass').length],
            ['Broken governance', fail],
          ].map(([label, count]) => (
            <div key={label as string} className="flex items-center justify-between rounded-md border border-border/50 bg-card/30 p-2.5">
              <span className="text-xs">{label as string}</span>
              <span className={`text-sm font-bold tabular-nums ${(count as number) ? 'text-trading-warning' : 'text-trading-profit'}`}>{count as number}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
