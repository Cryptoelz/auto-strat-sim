import { useEffect, useMemo, useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { institutionScore } from '@/lib/institutionOS';

export default function InstitutionScore() {
  const score = useMemo(() => institutionScore(), []);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400);
      setAnimated(Math.round(score.total * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score.total]);

  const dash = (animated / 100) * 534;

  return (
    <OsPage
      title="Institution Score™"
      subtitle="A single institutional health number, fully explainable. Every component shows how it is calculated and why it moves."
      department="Institution Score™"
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="flex flex-col items-center justify-center border-trading-gold/25 bg-card/60 p-8 lg:col-span-2">
          <div className="relative h-56 w-56">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
              <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" opacity={0.35} />
              <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--trading-gold))" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${dash} 534`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-semibold tracking-tight text-foreground">{animated}</span>
              <span className="text-sm text-trading-gold">Grade {score.grade}</span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institution Score</span>
            </div>
          </div>
          <p className="mt-6 max-w-xs text-center text-[11.5px] leading-relaxed text-muted-foreground">
            Weighted composite of institutional IQ, research efficiency, governance discipline, knowledge quality and executive alignment.
          </p>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          {score.components.map((c) => (
            <Card key={c.key} className="border-border/50 bg-card/60 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-[12px] font-medium text-foreground">{c.label}</h2>
                <span className="text-[11px] text-muted-foreground">weight {Math.round(c.weight * 100)}% · <span className="text-trading-gold">{c.score}</span></span>
              </div>
              <Progress value={c.score} className="mt-2 h-1.5" />
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{c.explanation}</p>
            </Card>
          ))}
        </div>
      </div>
    </OsPage>
  );
}
