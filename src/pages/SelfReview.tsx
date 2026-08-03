import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { selfReview, TREND_LABEL, type Trend } from '@/lib/institutionIntelligence';

const TREND_STYLE: Record<Trend, string> = {
  improved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  stable: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  declining: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
};
const TrendIcon = ({ t }: { t: Trend }) =>
  t === 'improved' ? <ArrowUpRight className="h-3.5 w-3.5" /> : t === 'declining' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />;

const WINDOWS = [7, 30, 90];

export default function SelfReview() {
  const [days, setDays] = useState(30);
  const review = useMemo(() => selfReview(days), [days]);

  return (
    <OsPage
      title="Institution Self Review™"
      subtitle="Every simulated day ATLAS evaluates itself across eight institutional dimensions, compares against its own past and explains why each measure improved, held or declined."
      department="Institutional Intelligence Engine"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{review.overall}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Self review</p>
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Daily institutional self assessment</p>
            <h2 className="text-lg font-semibold text-foreground">{review.headline}</h2>
            <p className="text-sm text-muted-foreground">{review.summary}</p>
          </div>
          <div className="flex gap-1">
            {WINDOWS.map((w) => (
              <Button key={w} size="sm" variant={w === days ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setDays(w)}>
                vs {w}d
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {review.dimensions.map((d) => (
          <Card key={d.key} className="border-border/60 bg-card/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{d.label}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {d.previous} → <span className="text-foreground">{d.score}</span> ({d.score - d.previous >= 0 ? '+' : ''}{d.score - d.previous} pts vs {days} days ago)
                </p>
              </div>
              <Badge variant="outline" className={`gap-1 text-[10px] ${TREND_STYLE[d.trend]}`}>
                <TrendIcon t={d.trend} /> {TREND_LABEL[d.trend]}
              </Badge>
            </div>
            <Progress value={d.score} className="mt-3 h-1.5" />
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{d.why}</p>
            <div className="mt-3 space-y-1">
              <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Drivers</p>
              {d.drivers.map((x) => (
                <p key={x} className="text-[11.5px] text-foreground/80">· {x}</p>
              ))}
            </div>
            {d.to && (
              <Button asChild size="sm" variant="outline" className="mt-3 h-7 text-[11px]">
                <Link to={d.to}>Open supporting module</Link>
              </Button>
            )}
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-muted/10 p-4">
        <p className="text-[11px] text-muted-foreground">
          Advisory only. This review changes no strategy, threshold, allocation or execution path. Observation · Research · Simulation · Read only · Human approval required.
        </p>
      </Card>
    </OsPage>
  );
}
