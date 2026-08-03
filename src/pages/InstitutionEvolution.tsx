import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { topEvolvingObjects, knowledgeEvolution } from '@/lib/institutionLife';
import { Play, Pause } from 'lucide-react';

export default function InstitutionEvolution() {
  const objects = useMemo(() => topEvolvingObjects(16), []);
  const [id, setId] = useState(objects[0]?.node.id ?? '');
  const evo = useMemo(() => knowledgeEvolution(id), [id]);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => { setFrame(0); setPlaying(true); }, [id]);
  useEffect(() => {
    if (!playing || !evo) return;
    const t = setInterval(() => setFrame((f) => (f + 1 >= evo.versions.length ? (setPlaying(false), evo.versions.length - 1) : f + 1)), 1200);
    return () => clearInterval(t);
  }, [playing, evo]);

  if (!evo) return null;
  const v = evo.versions[Math.min(frame, evo.versions.length - 1)];

  return (
    <OsPage
      title="Knowledge Evolution™"
      subtitle="Every institutional object evolves. Watch version history, confidence trend, evidence growth, relationship growth, reuse and department interaction unfold on an animated timeline."
      department="Knowledge Evolution™"
    >
      <div className="flex flex-wrap gap-1.5">
        {objects.map((o) => (
          <Button key={o.node.id} size="sm" variant={o.node.id === id ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setId(o.node.id)}>
            {o.node.id}
          </Button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-trading-gold/25 bg-card/60 p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Animated timeline</p>
              <h2 className="text-base font-semibold text-foreground">{evo.node.id} · {evo.node.title}</h2>
              <p className="mt-1 max-w-2xl text-[11.5px] text-muted-foreground">{evo.node.summary}</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}{playing ? 'Pause' : 'Replay'}
            </Button>
          </div>

          <div className="mt-5 flex items-center gap-1">
            {evo.versions.map((x, i) => (
              <button key={x.version} onClick={() => { setPlaying(false); setFrame(i); }}
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= frame ? 'bg-trading-gold' : 'bg-muted'}`} title={x.label} />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border/40 bg-muted/10 p-4 animate-fade-in" key={v.version}>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-trading-gold/40 px-1.5 py-0 text-[9.5px] text-trading-gold">{v.version}</Badge>
              <span className="text-[12.5px] font-medium text-foreground">{v.label}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{v.date}</span>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{v.note}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Confidence', value: v.confidence, suffix: '%' },
                { label: 'Evidence items', value: v.evidence, suffix: '' },
                { label: 'Relationships', value: v.relationships, suffix: '' },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-semibold text-foreground">{m.value}{m.suffix}</p>
                  <Progress value={m.label === 'Confidence' ? m.value : Math.min(100, m.value * 12)} className="mt-1.5 h-1" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Confidence trend</p>
            <svg viewBox="0 0 300 60" className="mt-2 h-16 w-full">
              <polyline
                fill="none" stroke="hsl(var(--trading-gold))" strokeWidth="2"
                points={evo.confidenceTrend.map((p, i) => `${(i / Math.max(1, evo.confidenceTrend.length - 1)) * 296 + 2},${58 - (p.value / 100) * 54}`).join(' ')}
              />
            </svg>
          </div>
        </Card>

        <Card className="border-border/50 bg-card/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institutional profile</p>
          <div className="mt-3 space-y-3">
            {[
              { label: 'Promotion progress', value: evo.promotionProgress },
              { label: 'Institutional importance', value: evo.importance },
              { label: 'Reuse count', value: Math.min(100, evo.reuse * 20), raw: evo.reuse },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-[11px]"><span className="text-muted-foreground">{m.label}</span><span className="text-foreground">{m.raw ?? m.value}</span></div>
                <Progress value={m.value} className="mt-1 h-1" />
              </div>
            ))}
          </div>

          <p className="mt-5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Department interactions</p>
          <div className="mt-2 space-y-1">
            {evo.interactions.map((x) => (
              <div key={x.department} className="flex items-center gap-2 text-[11px]">
                <span className="w-24 text-muted-foreground">{x.department}</span>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div className="h-1.5 rounded-full bg-trading-gold" style={{ width: `${Math.min(100, x.count * 22)}%` }} />
                </div>
                <span className="text-foreground">{x.count}</span>
              </div>
            ))}
          </div>

          <Link to={`/institution/genome?id=${evo.node.id}`} className="mt-5 inline-block text-[11px] text-trading-gold hover:underline">Open Research Genome™ →</Link>
        </Card>
      </section>
    </OsPage>
  );
}
