import { MaintenancePage, StatCard, ScoreBar } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDatabaseChecks, getStorageUsage, getExecutiveSummary } from '@/lib/maintenance';
import { Database, HardDrive } from 'lucide-react';

export default function MaintenanceDatabase() {
  const checks = getDatabaseChecks();
  const storage = getStorageUsage();
  const s = getExecutiveSummary();
  const total = checks.reduce((a, c) => a + c.found, 0);

  return (
    <MaintenancePage
      title="Database Integrity"
      subtitle="Automated inspection of duplicate records, orphaned records, broken references, missing IDs, invalid relationships, corrupt data, unused assets and storage usage."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Database Health" value={s.databaseHealth} tone="good" />
        <StatCard label="Findings" value={total} tone={total ? 'warn' : 'good'} />
        <StatCard label="Auto-Repairable" value={checks.filter((c) => c.repairable && c.found > 0).reduce((a, c) => a + c.found, 0)} tone="good" />
        <StatCard label="Storage Used" value={`${storage.percent}%`} hint={`${storage.usedKb} KB of ${storage.quotaKb} KB`} tone={storage.percent > 80 ? 'warn' : 'default'} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-trading-gold" />Integrity Scan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checks.map((c) => (
            <div key={c.category} className="flex items-start gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{c.category}</span>
                  <Badge variant="outline" className="text-[9px]">{c.repairable ? 'Auto-repairable' : 'Manual review'}</Badge>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{c.detail}</p>
              </div>
              <span
                className={`text-lg font-bold tabular-nums ${c.severity === 'info' ? 'text-trading-profit' : c.severity === 'warn' ? 'text-trading-warning' : 'text-trading-loss'}`}
              >
                {c.found}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><HardDrive className="h-4 w-4 text-trading-gold" />Storage Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScoreBar label={`Local persistence — ${storage.usedKb} KB of ${storage.quotaKb} KB`} value={storage.percent} suffix="%" />
          <p className="text-[10px] text-muted-foreground">
            Automatic pruning triggers at 80% of the quota. Only temporary snapshots, caches and unreferenced assets are eligible —
            research results, promotions and portfolio records are never removed.
          </p>
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
