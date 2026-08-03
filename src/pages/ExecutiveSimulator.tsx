import { useMemo, useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { explainableObjects, simulate, SIM_SCENARIOS, type SimScenario } from '@/lib/institutionIntelligence';

export default function ExecutiveSimulator() {
  const objects = useMemo(() => explainableObjects(), []);
  const [scenario, setScenario] = useState<SimScenario>('experiment-failed');
  const [objectId, setObjectId] = useState(objects[0]?.id ?? '');
  const [q, setQ] = useState('');
  const result = useMemo(() => simulate(scenario, objectId), [scenario, objectId]);
  const filtered = objects.filter((n) => !q || `${n.id} ${n.title} ${n.department}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40);

  return (
    <OsPage
      title="Executive Simulator™"
      subtitle="Ask “what if?” of the institution itself. Every scenario projects institutional impact only — research quality, confidence, governance, reuse and productivity. No strategy, threshold, allocation or execution is ever changed."
      department="Institutional Intelligence Engine"
    >
      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Scenario</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SIM_SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              className={`rounded-md border p-3 text-left transition-colors ${
                s.key === scenario ? 'border-trading-gold/40 bg-trading-gold/10' : 'border-border/50 bg-muted/10 hover:bg-muted/20'
              }`}
            >
              <p className="text-[12.5px] font-medium text-foreground">{s.question}</p>
              <p className="mt-0.5 text-[10.5px] text-muted-foreground">{s.blurb}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Object</p>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search research objects…" className="h-8 w-72 text-[12px]" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {filtered.map((n) => (
            <Button key={n.id} size="sm" variant={n.id === objectId ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setObjectId(n.id)}>
              {n.id}
            </Button>
          ))}
        </div>
      </Card>

      {result && (
        <>
          <Card className="border-trading-gold/25 bg-card/60 p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{result.question}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-foreground">{result.headline}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.objectTitle} ({result.object})</p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {result.impacts.map((i) => {
              const delta = i.after - i.before;
              return (
                <Card key={i.key} className="border-border/60 bg-card/50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">{i.label}</h3>
                    <Badge variant="outline" className={`text-[10px] ${delta >= 0 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                      {delta >= 0 ? '+' : ''}{delta} pts
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-[13px] text-muted-foreground">{i.before} → <span className="text-trading-gold">{i.after}</span></p>
                  <Progress value={i.after} className="mt-2 h-1.5" />
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{i.why}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/60 bg-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Objects affected</p>
              <div className="mt-2 space-y-1.5">
                {result.affected.length ? result.affected.map((a) => (
                  <p key={a.id} className="text-[12px] text-muted-foreground"><span className="text-foreground">{a.id}</span> · {a.effect}</p>
                )) : <p className="text-[12px] text-muted-foreground">No downstream objects depend on this one — the impact stays local.</p>}
              </div>
            </Card>
            <Card className="border-border/60 bg-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institutional narrative</p>
              <div className="mt-2 space-y-1.5">
                {result.narrative.map((n) => <p key={n} className="text-[12.5px] leading-relaxed text-muted-foreground">{n}</p>)}
              </div>
            </Card>
          </div>

          <Card className="border-border/60 bg-muted/10 p-4">
            <p className="text-[11px] text-muted-foreground">{result.governance}</p>
          </Card>
        </>
      )}
    </OsPage>
  );
}
