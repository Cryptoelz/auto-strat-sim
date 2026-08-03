import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { riskLevelSummary, type RiskLevel } from '@/lib/institutionIntelligence';

const LEVEL: Record<RiskLevel, string> = {
  critical: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  elevated: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  moderate: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
};

export default function InstitutionRiskRadar() {
  const summary = useMemo(() => riskLevelSummary(), []);

  return (
    <OsPage
      title="Institution Risk Radar™"
      subtitle="Institutional risk — not market risk. Bottlenecks, knowledge silos, weak validation, department overload, governance delay, confidence drift and single-point dependencies, each explained with a recommended mitigation."
      department="Institutional Intelligence Engine"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{summary.score}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Risk index · {summary.level}</p>
        </div>
      }
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Radar summary</p>
        <h2 className="mt-0.5 text-lg font-semibold text-foreground">
          Institutional risk is {summary.level} at {summary.score}/100 · {summary.critical} critical and {summary.elevated} elevated risks open
        </h2>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          Every risk below describes how the institution researches, not how it trades. Mitigations are advisory and require human approval; nothing is applied automatically.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {summary.risks.map((r) => (
          <Card key={r.id} className="border-border/60 bg-card/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{r.category}</p>
                <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
              </div>
              <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${LEVEL[r.level]}`}>{r.level} · {r.score}</Badge>
            </div>
            <Progress value={r.score} className="mt-2 h-1.5" />
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{r.explanation}</p>
            <div className="mt-3 space-y-1">
              <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Signals</p>
              {r.signals.map((s) => <p key={s} className="text-[11.5px] text-foreground/80">· {s}</p>)}
            </div>
            <div className="mt-3 rounded-md border border-trading-gold/25 bg-trading-gold/5 p-3">
              <p className="text-[9.5px] uppercase tracking-[0.2em] text-trading-gold">Recommended mitigation</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{r.mitigation}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10.5px] text-muted-foreground">Owner: {r.owner}</span>
              {r.to && <Button asChild size="sm" variant="outline" className="h-7 text-[11px]"><Link to={r.to}>Open module</Link></Button>}
            </div>
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
