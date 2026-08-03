import { useMemo, useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { BENCHMARK_WINDOWS, institutionBenchmark, TREND_LABEL, type Trend } from '@/lib/institutionIntelligence';

const STYLE: Record<Trend, string> = {
  improved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  stable: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  declining: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
};

export default function InstitutionBenchmark() {
  const [win, setWin] = useState(BENCHMARK_WINDOWS[0]);
  const bench = useMemo(() => institutionBenchmark(win.days), [win]);

  return (
    <OsPage
      title="Institution Benchmark™"
      subtitle="Compare today's institution against earlier versions of itself. Knowledge growth, research quality, governance, confidence, evidence, reuse, department productivity and Institution IQ — every figure explained."
      department="Institutional Intelligence Engine"
      actions={
        <div className="flex gap-1">
          {BENCHMARK_WINDOWS.map((w) => (
            <Button key={w.key} size="sm" variant={w.key === win.key ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setWin(w)}>
              {w.label}
            </Button>
          ))}
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Benchmark versus {win.label.toLowerCase()}</p>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">{bench.summary}</h2>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {bench.rows.map((r) => (
          <Card key={r.key} className="border-border/60 bg-card/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{r.label}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {win.label}: <span className="font-mono text-foreground">{r.then}</span> → today: <span className="font-mono text-trading-gold">{r.now}</span>
                </p>
              </div>
              <Badge variant="outline" className={`gap-1 text-[10px] ${STYLE[r.trend]}`}>
                {r.trend === 'improved' ? <ArrowUpRight className="h-3.5 w-3.5" /> : r.trend === 'declining' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {r.delta >= 0 ? '+' : ''}{r.delta} · {TREND_LABEL[r.trend]}
              </Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              <Progress value={Math.min(100, r.then)} className="h-1 opacity-50" />
              <Progress value={Math.min(100, r.now)} className="h-1.5" />
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{r.why}</p>
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
