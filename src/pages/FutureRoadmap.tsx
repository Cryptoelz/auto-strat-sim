import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, CheckCircle2, Circle, Play } from 'lucide-react';
import { ROADMAP, ROADMAP_STATE_ORDER, type RoadmapState } from '@/lib/platform';

const TONE: Record<RoadmapState, string> = {
  Completed: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  Current: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  Next: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
  Planned: 'border-border/60 bg-muted/20 text-muted-foreground',
  Vision: 'border-border/50 bg-muted/10 text-muted-foreground/80',
};

export default function FutureRoadmap() {
  return (
    <OsPage
      title="Future Roadmap™"
      subtitle="Where ATLAS has been, where it is now and where it is going. Every completed phase links directly to the modules that implement it."
      department="Platform"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/certification"><Rocket className="h-3.5 w-3.5" aria-hidden="true" /> Certification</Link></Button>}
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ROADMAP_STATE_ORDER.map((s) => (
          <div key={s} className="rounded-lg border border-border/50 bg-card/40 p-4">
            <p className="font-mono text-xl text-trading-gold">{ROADMAP.filter((p) => p.state === s).length}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{s}</p>
          </div>
        ))}
      </section>

      <section className="relative space-y-3 pl-6">
        <span className="absolute left-[9px] top-2 bottom-2 w-px bg-border/60" aria-hidden="true" />
        {ROADMAP.map((p) => (
          <article key={p.id} className="relative rounded-lg border border-border/50 bg-card/40 p-5">
            <span className="absolute -left-6 top-6 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border/60 bg-background" aria-hidden="true">
              {p.state === 'Completed' ? <CheckCircle2 className="h-3.5 w-3.5 text-trading-gold" />
                : p.state === 'Current' ? <Play className="h-3 w-3 text-emerald-400" />
                : <Circle className="h-3 w-3 text-muted-foreground" />}
            </span>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.phase}</p>
                <h2 className="text-sm font-semibold text-foreground">{p.title}</h2>
              </div>
              <Badge variant="outline" className={`text-[10px] ${TONE[p.state]}`}>{p.state}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{p.summary}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.deliverables.map((d) => (
                <Badge key={d} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{d}</Badge>
              ))}
            </div>
            {p.link && (
              <Button asChild size="sm" variant="ghost" className="mt-3 h-7 justify-start gap-1 px-0 text-[11px]">
                <Link to={p.link.to}>{p.link.label} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
              </Button>
            )}
          </article>
        ))}
      </section>
    </OsPage>
  );
}
