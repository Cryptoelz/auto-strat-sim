import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { allDepartmentStats, slug } from '@/lib/institutionOS';
import { Building2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InstitutionDepartments() {
  const depts = useMemo(() => allDepartmentStats(), []);
  return (
    <OsPage
      title="Institution Departments"
      subtitle="Every AI department operates with a purpose, responsibilities, workload, owned knowledge and institutional accountability."
      department="Institution Departments™"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/institution/collaboration"><Network className="h-3.5 w-3.5" /> Collaboration</Link></Button>}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {depts.map((d) => (
          <Link key={d.profile.name} to={`/institution/departments/${slug(d.profile.name)}`} className="group">
            <Card className="h-full border-border/50 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-trading-gold/40 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-trading-gold" />
                  <h2 className="text-sm font-semibold text-foreground">{d.profile.name}</h2>
                </div>
                <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">{d.rating}</Badge>
              </div>
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{d.profile.purpose}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[['Owned', d.owned.length], ['Workload', d.workload], ['Impact', d.impact]].map(([l, v]) => (
                  <div key={l as string} className="rounded-md border border-border/40 bg-muted/10 py-2">
                    <p className="text-base font-semibold text-foreground">{v as number}</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{l as string}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Department health</span><span className="text-foreground">{d.health}</span></div>
                <Progress value={d.health} className="h-1" />
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Mean confidence</span><span className="text-foreground">{d.confidence}%</span></div>
                <Progress value={d.confidence} className="h-1" />
              </div>

              <p className="mt-3 text-[10px] text-muted-foreground">
                {d.validated.length} validated · {d.blocked.length} blocked · {d.reuse} downstream reuses
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </OsPage>
  );
}
