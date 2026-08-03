import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { explainableObjects, explanationPage } from '@/lib/institutionIntelligence';

export default function InstitutionExplain() {
  const { objectId } = useParams();
  const navigate = useNavigate();
  const objects = useMemo(() => explainableObjects(), []);
  const activeId = objectId ?? objects[0]?.id;
  const page = useMemo(() => (activeId ? explanationPage(activeId) : null), [activeId]);
  const [q, setQ] = useState('');
  const filtered = objects.filter((n) => !q || `${n.id} ${n.title} ${n.department}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <OsPage
      title="Institution Explainability™"
      subtitle="Every conclusion in the institution has an explanation page: reasoning chain, supporting and counter evidence, alternative explanations, confidence workings, departments involved, validation history and full timeline. Nothing is hidden."
      department="Institutional Intelligence Engine"
      actions={
        page && (
          <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
            <p className="font-mono text-lg leading-none text-trading-gold">{page.confidence.calculated}</p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Institutional confidence</p>
          </div>
        )
      }
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit border-border/60 bg-card/50 p-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a conclusion…" className="h-8 text-[12px]" />
          <div className="mt-2 max-h-[70vh] space-y-1 overflow-auto pr-1">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/institution/explain/${n.id}`)}
                className={`w-full rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                  n.id === activeId ? 'border-trading-gold/40 bg-trading-gold/10' : 'border-border/40 bg-muted/10 hover:bg-muted/20'
                }`}
              >
                <span className="block truncate text-[11.5px] text-foreground">{n.title}</span>
                <span className="block text-[9.5px] text-muted-foreground">{n.id} · {n.department}</span>
              </button>
            ))}
          </div>
        </Card>

        {page && (
          <div className="space-y-4">
            <Card className="border-trading-gold/25 bg-card/60 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Conclusion</p>
              <h2 className="mt-0.5 text-lg font-semibold text-foreground">{page.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{page.conclusion}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">Quality {page.quality.total} ({page.quality.grade})</Badge>
                <Badge variant="outline" className="text-[10px]">Stated confidence {page.confidence.stated}</Badge>
                <Badge variant="outline" className="text-[10px]">Evidence {page.confidence.evidence}</Badge>
                <Badge variant="outline" className="text-[10px]">Calculated {page.confidence.calculated}</Badge>
              </div>
            </Card>

            <Card className="border-border/60 bg-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reasoning chain</p>
              <div className="mt-2 space-y-2">
                {page.reasoningChain.map((s) => (
                  <div key={s.step} className="flex gap-3 rounded-md border border-border/50 bg-muted/10 p-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-trading-gold/40 text-[10px] text-trading-gold">{s.step}</span>
                    <div>
                      <p className="text-[12.5px] font-medium text-foreground">{s.claim}</p>
                      <p className="text-[11.5px] text-muted-foreground">{s.basis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">Supporting evidence</p>
                <ul className="mt-2 space-y-1.5">
                  {(page.supporting.length ? page.supporting : ['No supporting evidence recorded — the conclusion is provisional.']).map((s) => (
                    <li key={s} className="text-[12px] text-muted-foreground">· {s}</li>
                  ))}
                </ul>
              </Card>
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80">Counter evidence</p>
                <ul className="mt-2 space-y-1.5">
                  {page.counter.map((s) => <li key={s} className="text-[12px] text-muted-foreground">· {s}</li>)}
                </ul>
              </Card>
            </div>

            <Card className="border-border/60 bg-card/50 p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Alternative explanations considered</p>
              <div className="mt-2 space-y-2">
                {page.alternatives.map((a) => (
                  <div key={a.hypothesis} className="rounded-md border border-border/50 bg-muted/10 p-3">
                    <p className="text-[12.5px] font-medium text-foreground">{a.hypothesis}</p>
                    <p className="text-[11.5px] text-muted-foreground">Not adopted: {a.whyNotAdopted}</p>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Confidence calculation</p>
                <Progress value={page.confidence.calculated} className="mt-2 h-1.5" />
                <div className="mt-2 space-y-1">
                  {page.confidence.workings.map((w) => <p key={w} className="font-mono text-[11px] text-muted-foreground">{w}</p>)}
                </div>
              </Card>
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Departments involved</p>
                <div className="mt-2 space-y-1.5">
                  {page.departments.map((d) => (
                    <p key={d.name} className="text-[12px] text-muted-foreground"><span className="text-foreground">{d.name}</span> — {d.role}</p>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Validation history</p>
                <div className="mt-2 space-y-1.5">
                  {(page.validationHistory.length ? page.validationHistory : [{ date: '—', event: 'No validation events recorded yet.' }]).map((v, i) => (
                    <p key={i} className="text-[12px] text-muted-foreground"><span className="font-mono text-foreground">{v.date}</span> · {v.event}</p>
                  ))}
                </div>
              </Card>
              <Card className="border-border/60 bg-card/50 p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
                <div className="mt-2 space-y-1.5 border-l border-trading-gold/25 pl-3">
                  {page.timeline.map((t, i) => (
                    <div key={i}>
                      <p className="font-mono text-[10.5px] text-trading-gold">{t.date}</p>
                      <p className="text-[12px] text-muted-foreground">{t.event}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="border-border/60 bg-muted/10 p-4">
              <p className="text-[11px] text-muted-foreground">
                Read only. See also{' '}
                <Link to={`/explorer/${page.id}`} className="text-trading-gold hover:underline">Intelligence Explorer</Link> and{' '}
                <Link to="/knowledge-graph" className="text-trading-gold hover:underline">Knowledge Graph</Link>.
              </p>
            </Card>
          </div>
        )}
      </div>
    </OsPage>
  );
}
