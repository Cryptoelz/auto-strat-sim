import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { institutionPulse, type PulseTone } from '@/lib/institutionLife';
import { Activity } from 'lucide-react';

const TONE: Record<PulseTone, string> = {
  excellent: 'text-trading-gold border-trading-gold/40 bg-trading-gold/10',
  good: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  moderate: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  watch: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

/** Institution Pulse™ — live institutional state derived from institutional metrics. */
export function InstitutionPulse() {
  const pulse = institutionPulse();
  return (
    <Card className="border-trading-gold/25 bg-card/60 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-gold/60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-trading-gold" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Institution Pulse™</p>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{pulse.headline}</h2>
          </div>
        </div>
        <div className={`rounded-md border px-3 py-1 text-[11px] uppercase tracking-widest ${TONE[pulse.tone]}`}>
          Pulse {pulse.score}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {pulse.signals.map((s) => (
          <Link key={s.key} to={s.to ?? '/institution'}
            className="group rounded-lg border border-border/40 bg-muted/10 p-3 transition-colors hover:border-trading-gold/40">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
              <Activity className="h-3 w-3 text-muted-foreground/40 group-hover:text-trading-gold" />
            </div>
            <p className={`mt-0.5 text-sm font-medium ${TONE[s.tone].split(' ')[0]}`}>{s.state}</p>
            <Progress value={s.score} className="mt-2 h-1" />
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{s.why}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
