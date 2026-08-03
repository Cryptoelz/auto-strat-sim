import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { ERA_META, evolutionTimeline, type EraKind } from '@/lib/institutionIntelligence';

const KIND_STYLE: Record<EraKind, string> = {
  birth: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  growth: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  discovery: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  failure: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  architecture: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  department: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  milestone: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  promotion: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
  maturity: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
};

export default function InstitutionEvolutionTimeline() {
  const events = useMemo(() => evolutionTimeline(), []);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<EraKind | 'all'>('all');
  const [cursor, setCursor] = useState(events.length);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCursor((c) => {
        if (c >= events.length) { setPlaying(false); return c; }
        return c + 1;
      });
    }, 240);
    return () => window.clearInterval(id);
  }, [playing, events.length]);

  const visible = events.slice(0, cursor).filter(
    (e) => (kind === 'all' || e.kind === kind) && (!q || `${e.title} ${e.detail} ${e.department} ${e.id}`.toLowerCase().includes(q.toLowerCase())),
  );
  const latest = events[Math.max(0, cursor - 1)];

  return (
    <OsPage
      title="Institution Evolution Timeline™"
      subtitle="Replay the complete evolution of ATLAS: birth, growth, major discoveries, major failures, architecture changes, department creation, knowledge milestones, promotion history and institutional maturity. Everything searchable, everything replayable."
      department="Institutional Intelligence Engine"
      actions={
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => { setCursor(0); setPlaying(true); }}>
            <RotateCcw className="h-3.5 w-3.5" /> Replay
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? 'Pause' : 'Play'}
          </Button>
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Replay position</p>
            <h2 className="mt-0.5 text-lg font-semibold text-foreground">{latest?.title ?? 'Institution not yet founded'}</h2>
            <p className="text-[12px] text-muted-foreground">
              {latest?.date} · {latest?.objectsAtTime} objects · Institution IQ {latest?.iqAtTime}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the institution's history…" className="h-8 w-64 text-[12px]" />
            <span className="font-mono text-[11px] text-muted-foreground">{cursor}/{events.length}</span>
          </div>
        </div>
        <input
          type="range" min={0} max={events.length} value={cursor}
          onChange={(e) => { setPlaying(false); setCursor(Number(e.target.value)); }}
          className="mt-4 w-full accent-[hsl(var(--trading-gold))]"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant={kind === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setKind('all')}>All</Button>
          {(Object.keys(ERA_META) as EraKind[]).map((k) => (
            <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setKind(k)}>
              {ERA_META[k].label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="space-y-2 border-l border-trading-gold/25 pl-4">
        {visible.map((e, i) => (
          <Card key={`${e.id}-${i}`} className="relative border-border/60 bg-card/50 p-4">
            <span className="absolute -left-[22px] top-6 h-2 w-2 rounded-full bg-trading-gold" />
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10.5px] text-trading-gold">{e.date}</p>
                <h3 className="text-[13.5px] font-semibold text-foreground">{e.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{e.detail}</p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[9.5px] uppercase tracking-wider ${KIND_STYLE[e.kind]}`}>{ERA_META[e.kind].label}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted-foreground">
              <span>{e.department}</span>
              <span>Objects {e.objectsAtTime}</span>
              <span>Institution IQ {e.iqAtTime}</span>
              <Link to={`/institution/explain/${e.id}`} className="text-trading-gold hover:underline">Explain</Link>
              {e.to && <Link to={e.to} className="text-trading-gold hover:underline">Open</Link>}
            </div>
          </Card>
        ))}
        {visible.length === 0 && (
          <Card className="border-border/60 bg-card/50 p-6 text-center text-[12px] text-muted-foreground">
            Move the replay slider forward or clear the filters to see institutional history.
          </Card>
        )}
      </div>
    </OsPage>
  );
}
