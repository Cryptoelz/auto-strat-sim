import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { institutionIQ, TREND_LABEL } from '@/lib/institutionIntelligence';

export default function InstitutionIQ() {
  const iq = useMemo(() => institutionIQ(), []);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let frame = 0;
    const id = window.setInterval(() => {
      frame += 1;
      const p = Math.min(1, frame / 45);
      setShown(Math.round(iq.total * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [iq.total]);

  const r = 78;
  const circ = 2 * Math.PI * r;

  return (
    <OsPage
      title="Institution Intelligence Index™"
      subtitle="One premium institutional score built from knowledge, evidence, governance, research, prediction, reuse, memory, explainability, department balance and innovation."
      department="Institutional Intelligence Engine"
      actions={
        <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] uppercase tracking-[0.2em] text-trading-gold">
          {iq.band}
        </Badge>
      }
    >
      <Card className="border-trading-gold/25 bg-gradient-to-br from-card/80 to-background p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className="relative h-[200px] w-[200px] shrink-0">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r={r} className="fill-none stroke-border/40" strokeWidth="10" />
              <circle
                cx="100" cy="100" r={r}
                className="fill-none stroke-trading-gold transition-[stroke-dashoffset] duration-100 ease-out"
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ - (circ * shown) / 100}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl text-trading-gold">{shown}</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Institution IQ</span>
              <span className="mt-1 text-[11px] text-foreground">{iq.grade} · {TREND_LABEL[iq.trend]}</span>
            </div>
          </div>
          <div className="max-w-3xl space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Executive reading</p>
            <h2 className="text-xl font-semibold text-foreground">{iq.band}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{iq.narrative}</p>
            <p className="text-[11.5px] text-muted-foreground">
              Previous 30-day composite: <span className="font-mono text-foreground">{iq.previous}</span> · movement{' '}
              <span className="font-mono text-trading-gold">{iq.total - iq.previous >= 0 ? '+' : ''}{iq.total - iq.previous}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {iq.components.map((c) => (
          <Card key={c.key} className="border-border/60 bg-card/50 p-4">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-foreground">{c.label} <span className="text-muted-foreground">· weight {Math.round(c.weight * 100)}%</span></span>
              <span className="font-mono text-trading-gold">{c.score}</span>
            </div>
            <Progress value={c.score} className="mt-2 h-1.5" />
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{c.explanation}</p>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-muted/10 p-4">
        <p className="text-[11px] text-muted-foreground">
          Advisory index. See <Link to="/self-review" className="text-trading-gold hover:underline">Self Review™</Link>,{' '}
          <Link to="/institution/benchmark" className="text-trading-gold hover:underline">Benchmark™</Link> and{' '}
          <Link to="/institution/risk-radar" className="text-trading-gold hover:underline">Risk Radar™</Link> for the underlying reasoning.
        </p>
      </Card>
    </OsPage>
  );
}
