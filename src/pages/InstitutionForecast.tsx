import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { institutionForecast, type ForecastItem } from '@/lib/institutionLife';

export default function InstitutionForecast() {
  const items = useMemo(() => institutionForecast(), []);
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const [cat, setCat] = useState<string>('all');
  const list = items.filter((i) => cat === 'all' || i.category === cat);

  const avgProb = Math.round(items.reduce((s, i) => s + i.probability, 0) / Math.max(1, items.length));
  const highest = items[0] as ForecastItem | undefined;

  return (
    <OsPage
      title="Institution Forecast™"
      subtitle="Probability-based expectations for the institution: what is likely to be discovered, promoted, rejected, and how workload and evidence will grow. Every forecast is an advisory simulation, never an instruction."
      department="Forecast™"
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Forecasts generated', value: `${items.length}`, detail: 'Derived from live knowledge-graph state.' },
          { label: 'Average probability', value: `${avgProb}%`, detail: 'Confidence-weighted across all categories.' },
          { label: 'Highest conviction', value: `${highest?.probability ?? 0}%`, detail: highest?.title ?? '—' },
          { label: 'Categories tracked', value: `${categories.length}`, detail: 'Discovery, promotion, rejection, workload, growth.' },
        ].map((h) => (
          <Card key={h.label} className="border-trading-gold/25 bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{h.label}</p>
            <p className="mt-1.5 text-3xl font-semibold text-foreground">{h.value}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{h.detail}</p>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={cat === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setCat('all')}>All ({items.length})</Button>
        {categories.map((c) => (
          <Button key={c} size="sm" variant={cat === c ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setCat(c)}>
            {c} ({items.filter((i) => i.category === c).length})
          </Button>
        ))}
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((it) => (
          <Card key={it.id} className="border-border/50 bg-card/60 p-4 transition-all hover:-translate-y-0.5 hover:border-trading-gold/40">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="border-border/50 px-1.5 py-0 text-[9px] uppercase tracking-wider text-muted-foreground">{it.category}</Badge>
              <span className="text-sm font-semibold text-trading-gold">{it.probability}%</span>
            </div>
            <p className="mt-2 text-[12.5px] leading-snug text-foreground">{it.title}</p>
            <Progress value={it.probability} className="mt-2 h-1" />
            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Horizon · {it.horizon}</p>
            <ol className="mt-2 space-y-0.5 border-l border-trading-gold/30 pl-3">
              {it.reasoning.map((r, i) => (
                <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{r}</li>
              ))}
            </ol>
            {it.linked.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {it.linked.map((x) => (
                  <Link key={x} to={`/explorer/${x}`} className="rounded border border-border/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground transition-colors hover:border-trading-gold/40 hover:text-trading-gold">{x}</Link>
                ))}
              </div>
            )}
          </Card>
        ))}
      </section>
    </OsPage>
  );
}
