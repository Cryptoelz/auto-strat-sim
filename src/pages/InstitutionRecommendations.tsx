import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { institutionRecommendations, type RecPriority } from '@/lib/institutionIntelligence';

const PRIORITY: Record<RecPriority, string> = {
  high: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  low: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
};

export default function InstitutionRecommendations() {
  const recs = useMemo(() => institutionRecommendations(), []);

  return (
    <OsPage
      title="Institution Recommendations™"
      subtitle="ATLAS recommends improvements to itself: how research is sequenced, validated, governed and reused. Every recommendation is linked to the evidence that produced it and remains advisory until a human approves it."
      department="Institutional Intelligence Engine"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{recs.length}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Open recommendations</p>
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Self-improvement agenda</p>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">
          {recs.filter((r) => r.priority === 'high').length} high-priority process improvements identified by the institution about itself
        </h2>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Recommendations target the research process — never a strategy, threshold or allocation. Nothing here can be executed automatically.
        </p>
      </Card>

      <div className="space-y-3">
        {recs.map((r) => (
          <Card key={r.id} className="border-border/60 bg-card/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${PRIORITY[r.priority]}`}>{r.priority} priority</Badge>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{r.area}</span>
                </div>
                <h3 className="mt-1.5 text-base font-semibold text-foreground">{r.title}</h3>
              </div>
              {r.to && (
                <Button asChild size="sm" variant="outline" className="h-7 text-[11px]"><Link to={r.to}>Open evidence module</Link></Button>
              )}
            </div>

            <div className="mt-3 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Why the institution recommends this</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{r.rationale}</p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Expected institutional effect</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{r.expected}</p>
                <p className="mt-2 text-[11px] text-foreground/80">Measured by: {r.measure}</p>
              </div>
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Linked evidence</p>
                <div className="mt-1 space-y-1">
                  {r.evidence.map((e) => (
                    <p key={e.id} className="text-[11.5px] text-muted-foreground">
                      <Link to={`/institution/explain/${e.id}`} className="text-trading-gold hover:underline">{e.id}</Link> · {e.note}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
