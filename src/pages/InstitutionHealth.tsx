import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { healthChecks, institutionPulse, type HealthCheck } from '@/lib/institutionLife';

const STATE: Record<HealthCheck['state'], string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  watch: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  issue: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
};

export default function InstitutionHealth() {
  const checks = useMemo(() => healthChecks(), []);
  const pulse = useMemo(() => institutionPulse(), []);
  const overall = Math.round(checks.reduce((s, c) => s + c.score, 0) / Math.max(1, checks.length));

  return (
    <OsPage
      title="Institution Health Monitor™"
      subtitle="Deep diagnostics of the institution itself: knowledge integrity, department balance, evidence quality, bottlenecks, contradiction load and confidence drift. Every check explains its own reasoning."
      department="Health Monitor™"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{overall}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Health index</p>
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live institutional state</p>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">{pulse.headline}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {pulse.signals.slice(0, 6).map((s) => (
            <div key={s.key} className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
              <p className="text-[12px] text-foreground">{s.state}</p>
              <Progress value={s.score} className="mt-1.5 h-1" />
            </div>
          ))}
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((c) => (
          <Card key={c.key} className="border-border/50 bg-card/60 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-foreground">{c.label}</p>
              <Badge variant="outline" className={`shrink-0 px-1.5 py-0 text-[9px] uppercase ${STATE[c.state]}`}>{c.state}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Progress value={c.score} className="h-1.5 flex-1" />
              <span className="text-[11px] text-trading-gold">{c.score}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{c.explanation}</p>
            <ul className="mt-2 space-y-0.5 border-l border-trading-gold/25 pl-3">
              {c.detail.map((d, i) => <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{d}</li>)}
            </ul>
            {c.to && <Link to={c.to} className="mt-2.5 inline-block text-[10.5px] text-trading-gold hover:underline">Investigate →</Link>}
          </Card>
        ))}
      </section>
    </OsPage>
  );
}
