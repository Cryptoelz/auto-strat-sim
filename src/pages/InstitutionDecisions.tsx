import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { institutionDecisions } from '@/lib/institutionLife';

const OUTCOME_TONE: Record<string, string> = {
  'Approved for further research': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  'Delayed pending evidence': 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  'Blocked by governance': 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  'Archived as lesson': 'border-border/50 bg-muted/20 text-muted-foreground',
};

export default function InstitutionDecisions() {
  const decisions = useMemo(() => institutionDecisions(), []);
  const [outcome, setOutcome] = useState('all');
  const [open, setOpen] = useState<string | null>(decisions[0]?.id ?? null);
  const outcomes = Array.from(new Set(decisions.map((d) => d.outcome)));
  const list = decisions.filter((d) => outcome === 'all' || d.outcome === outcome);

  return (
    <OsPage
      title="Institution Decisions™"
      subtitle="Every important institutional decision is a structured, permanent record: departments involved, evidence for and against, votes, reasoning and outcome. Nothing is hidden. All outcomes are advisory and require human approval."
      department="Decisions™"
    >
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={outcome === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setOutcome('all')}>All ({decisions.length})</Button>
        {outcomes.map((o) => (
          <Button key={o} size="sm" variant={outcome === o ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setOutcome(o)}>
            {o} ({decisions.filter((d) => d.outcome === o).length})
          </Button>
        ))}
      </div>

      <section className="space-y-3">
        {list.map((d) => {
          const expanded = open === d.id;
          return (
            <Card key={d.id} className="border-border/50 bg-card/60">
              <button onClick={() => setOpen(expanded ? null : d.id)} className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left">
                <span className="font-mono text-[10px] text-muted-foreground">{d.date}</span>
                <span className="flex-1 text-[12.5px] text-foreground">{d.decision}</span>
                <Badge variant="outline" className={`px-1.5 py-0 text-[9px] ${OUTCOME_TONE[d.outcome]}`}>{d.outcome}</Badge>
                <span className="text-[10px] text-trading-gold">{d.confidence}%</span>
              </button>

              {expanded && (
                <div className="grid gap-4 border-t border-border/40 px-4 py-4 lg:grid-cols-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Departments involved</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.departments.map((x) => <Badge key={x} variant="outline" className="border-trading-gold/30 px-1.5 py-0 text-[9.5px] text-trading-gold">{x}</Badge>)}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Confidence</p>
                      <Progress value={d.confidence} className="mt-1.5 h-1.5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Votes</p>
                      <ul className="mt-1 space-y-1">
                        {d.votes.map((v) => (
                          <li key={v.department} className="text-[10.5px] leading-relaxed text-muted-foreground">
                            <span className={v.vote === 'for' ? 'text-emerald-400' : v.vote === 'against' ? 'text-rose-400' : 'text-amber-400'}>{v.vote.toUpperCase()}</span>
                            {' · '}<span className="text-foreground">{v.department}</span> — {v.rationale}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Supporting evidence</p>
                      <ul className="mt-1 space-y-0.5">
                        {d.supporting.length ? d.supporting.map((s, i) => <li key={i} className="text-[10.5px] text-muted-foreground">• {s}</li>) : <li className="text-[10.5px] text-muted-foreground">None recorded.</li>}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Counter evidence</p>
                      <ul className="mt-1 space-y-0.5">
                        {d.counter.length ? d.counter.map((s, i) => <li key={i} className="text-[10.5px] text-rose-400/90">• {s}</li>) : <li className="text-[10.5px] text-muted-foreground">None recorded.</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Reasoning</p>
                      <ol className="mt-1 space-y-0.5">
                        {d.reasoning.map((r, i) => <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{i + 1}. {r}</li>)}
                      </ol>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Linked research</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Link to={`/explorer/${d.objectId}`} className="rounded border border-trading-gold/30 px-1.5 py-0.5 text-[9.5px] text-trading-gold hover:bg-trading-gold/10">{d.objectId}</Link>
                        {d.linked.map((x) => (
                          <Link key={x} to={`/explorer/${x}`} className="rounded border border-border/50 px-1.5 py-0.5 text-[9.5px] text-muted-foreground hover:border-trading-gold/40">{x}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </OsPage>
  );
}
