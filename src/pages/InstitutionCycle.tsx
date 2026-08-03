import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { departmentCycle, type CycleTask } from '@/lib/institutionLife';
import { DEPARTMENT_PROFILES } from '@/lib/institutionOS';

const STATUS: Record<CycleTask['status'], string> = {
  running: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  queued: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
};

export default function InstitutionCycle() {
  const tasks = useMemo(() => departmentCycle(120), []);
  const [dept, setDept] = useState<string>('all');
  const filtered = tasks.filter((t) => dept === 'all' || t.department === dept);

  return (
    <OsPage
      title="Autonomous Department Cycle™"
      subtitle="Every AI department continuously performs simulated research work. Nothing modifies a strategy — every cycle produces an explainable research object."
      department="Autonomous Cycle™"
    >
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={dept === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setDept('all')}>All departments</Button>
        {DEPARTMENT_PROFILES.map((d) => (
          <Button key={d.name} size="sm" variant={dept === d.name ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setDept(d.name)}>{d.short}</Button>
        ))}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className="border-border/50 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-trading-gold/40">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-trading-gold">{t.department}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-foreground">
                  {t.action} <Link to={`/explorer/${t.objectId}`} className="text-trading-gold hover:underline">{t.objectId}</Link>
                </p>
              </div>
              <Badge variant="outline" className={`shrink-0 px-1.5 py-0 text-[9px] uppercase ${STATUS[t.status]}`}>{t.status}</Badge>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{t.detail}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <span>Output <span className="text-foreground">{t.output}</span></span>
              <span>Confidence <span className="text-foreground">{t.confidence}%</span></span>
              <span className="font-mono">{t.date}</span>
            </div>
          </Card>
        ))}
      </section>
    </OsPage>
  );
}
