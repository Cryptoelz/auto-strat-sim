import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { researchGenome, genomeCandidates } from '@/lib/institutionLife';

export default function InstitutionGenome() {
  const candidates = useMemo(() => genomeCandidates(), []);
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get('id') ?? candidates[0]?.id ?? '');
  const g = useMemo(() => researchGenome(id), [id]);

  return (
    <OsPage
      title="Research Genome™"
      subtitle="Every research object has a DNA profile: where it came from, what influenced it, what it produced, where it is reused, its confidence signature and its residual risk."
      department="Research Genome™"
    >
      <div className="flex flex-wrap gap-1.5">
        {candidates.map((c) => (
          <Button key={c.id} size="sm" variant={c.id === id ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setId(c.id)}>{c.id}</Button>
        ))}
      </div>

      {g && (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="border-trading-gold/25 bg-card/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Genome profile</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{g.node.id}</h2>
            <p className="text-[12px] text-muted-foreground">{g.node.title}</p>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{g.node.summary}</p>

            <div className="mt-4 space-y-2.5">
              {[
                { label: 'Institutional influence', value: g.influence },
                { label: 'Residual risk', value: g.risk },
                ...g.confidenceProfile.map((c) => ({ label: c.label, value: c.value })),
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{m.label}</span><span className="text-foreground">{m.value}</span></div>
                  <Progress value={m.value} className="mt-1 h-1" />
                </div>
              ))}
            </div>

            <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Promotion path</p>
            <ol className="mt-1.5 space-y-1">
              {g.promotion.map((p, i) => (
                <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{i + 1}. {p}</li>
              ))}
            </ol>
            <Link to={`/explorer/${g.node.id}`} className="mt-4 inline-block text-[11px] text-trading-gold hover:underline">Open full identity in Explorer →</Link>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
            {g.strands.map((s) => (
              <Card key={s.key} className="border-border/50 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-trading-gold">{s.label}</p>
                  <Badge variant="outline" className="border-border/50 px-1.5 py-0 text-[9px] text-muted-foreground">{s.items.length}</Badge>
                </div>
                <ul className="mt-2 space-y-1 border-l border-trading-gold/25 pl-3">
                  {s.items.length === 0 && <li className="text-[10.5px] text-muted-foreground">No strand data recorded.</li>}
                  {s.items.map((it, i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-foreground/85">
                      {it.id ? <Link to={`/explorer/${it.id}`} className="text-trading-gold hover:underline">{it.id}</Link> : null}
                      {it.id ? ' · ' : ''}{it.text}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}
    </OsPage>
  );
}
