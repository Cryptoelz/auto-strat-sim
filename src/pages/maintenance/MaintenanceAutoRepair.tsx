import { MaintenancePage, StatCard } from '@/components/maintenance/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRepairs, REPAIR_FORBIDDEN } from '@/lib/maintenance';
import { Wrench, CheckCircle2, Lock, PlayCircle, ShieldX } from 'lucide-react';

export default function MaintenanceAutoRepair() {
  const repairs = getRepairs();
  const applied = repairs.filter((r) => r.status === 'applied');
  const available = repairs.filter((r) => r.status === 'available');
  const blocked = repairs.filter((r) => r.status === 'blocked');

  return (
    <MaintenancePage
      title="Auto Repair Engine"
      subtitle="Safe automatic repairs only — platform hygiene, navigation, caches, indexes and temporary records. Trading state is never touched."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Repairs Applied Today" value={applied.length} tone="good" />
        <StatCard label="Available" value={available.length} />
        <StatCard label="Blocked by Policy" value={blocked.length} tone="warn" />
        <StatCard label="Trading State Touched" value="0" tone="good" hint="Hard constraint" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4 text-trading-gold" />Repair Register</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {repairs.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-md border border-border/50 bg-card/30 p-2.5">
              {r.status === 'applied' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-trading-profit" />}
              {r.status === 'available' && <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
              {r.status === 'blocked' && <Lock className="mt-0.5 h-4 w-4 shrink-0 text-trading-warning" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium">{r.action}</span>
                  <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{r.target}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{r.explanation}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-[9px] ${r.status === 'applied' ? 'border-trading-profit/40 text-trading-profit' : r.status === 'available' ? 'border-primary/40 text-primary' : 'border-trading-warning/40 text-trading-warning'}`}
              >
                {r.status.toUpperCase()}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-trading-loss/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><ShieldX className="h-4 w-4 text-trading-loss" />Never Modified</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REPAIR_FORBIDDEN.map((f) => (
            <Badge key={f} variant="outline" className="border-trading-loss/40 text-[10px] text-trading-loss">{f}</Badge>
          ))}
        </CardContent>
      </Card>
    </MaintenancePage>
  );
}
