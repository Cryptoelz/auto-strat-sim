import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MEMORY_KIND_META,
  memoryStats,
  searchMemory,
  forgetRecordedMemory,
  type MemoryKind,
} from '@/lib/institutionalMemory';

const FILTERS: (MemoryKind | 'all')[] = [
  'all', 'question', 'research', 'experiment', 'hypothesis-failed',
  'governance', 'promotion', 'specialist', 'confidence', 'milestone',
];

export default function InstitutionMemory() {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<MemoryKind | 'all'>('all');
  const [tick, setTick] = useState(0);

  const stats = useMemo(() => memoryStats(), [tick]);
  const records = useMemo(() => searchMemory(query, kind).slice(0, 120), [query, kind, tick]);

  return (
    <OsPage
      title="Institutional Memory™"
      subtitle="The permanent record of everything the institution has researched, decided, promoted, rejected and been asked. Every memory keeps its reasoning and citations so that any decision remains explainable years later."
      department="Institutional Memory™"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Memory' }]}
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{stats.total}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Retained memories</p>
        </div>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Memories retained', value: stats.total, note: 'Permanent, append-only' },
          { label: 'Recorded this institution', value: stats.recorded, note: 'Executive questions & answers' },
          { label: 'Evidence citations', value: stats.citations, note: 'Knowledge Graph objects' },
          { label: 'Cited memories', value: `${stats.citationRate}%`, note: 'No memory without evidence' },
          { label: 'Departments represented', value: stats.departments, note: `Earliest record ${stats.oldest}` },
        ].map((m) => (
          <Card key={m.label} className="exec-card border-border/60 bg-card/50 p-4">
            <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{m.label}</p>
            <p className="exec-metric-value mt-1 font-mono text-2xl text-foreground">{m.value}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{m.note}</p>
          </Card>
        ))}
      </section>

      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Memory composition</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
          {stats.byKind.map((k) => (
            <span key={k.kind} className="text-[11.5px] text-muted-foreground">
              <span className={`font-mono ${MEMORY_KIND_META[k.kind].tone}`}>{k.count}</span> {k.label}
            </span>
          ))}
        </div>
        <p className="mt-3 max-w-4xl text-[12px] leading-relaxed text-muted-foreground">
          Memory is observation-only. Nothing here executes, modifies a strategy or approves a promotion — it exists so future
          reviewers can reconstruct exactly what the institution knew, when it knew it, and which evidence supported the conclusion.
        </p>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories, departments or object IDs (e.g. EXP-052)"
            className="exec-input h-9 max-w-md text-[12px]"
            aria-label="Search institutional memory"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={kind === f ? 'default' : 'outline'}
                className="exec-chip h-7 px-2.5 text-[10.5px]"
                onClick={() => setKind(f)}
              >
                {f === 'all' ? 'All memory' : MEMORY_KIND_META[f].label}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">{records.length} memories shown</p>

        <div className="space-y-2.5">
          {records.map((m) => (
            <Card key={m.id} className="border-border/60 bg-card/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`exec-badge border-border/50 ${MEMORY_KIND_META[m.kind].tone}`}>
                      {MEMORY_KIND_META[m.kind].label}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">{m.date}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{m.department}</span>
                    {m.origin === 'recorded' && (
                      <Badge variant="outline" className="exec-badge border-trading-gold/40 text-trading-gold">Recorded</Badge>
                    )}
                    {typeof m.confidence === 'number' && (
                      <span className="text-[10px] text-muted-foreground">confidence <span className="font-mono text-foreground">{m.confidence}</span></span>
                    )}
                  </div>
                  <h3 className="mt-1.5 text-[13.5px] font-semibold text-foreground">{m.title}</h3>
                  <p className="mt-1 max-w-4xl text-[12px] leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
                {m.origin === 'recorded' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[10.5px] text-muted-foreground"
                    onClick={() => { forgetRecordedMemory(m.id); setTick((t) => t + 1); }}
                  >
                    Remove from record
                  </Button>
                )}
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Why this is retained</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{m.reasoning}</p>
                </div>
                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Cited evidence</p>
                  <div className="mt-1 space-y-1">
                    {m.citations.length === 0 && (
                      <p className="text-[11.5px] text-muted-foreground">Institution-level record — no single object cited.</p>
                    )}
                    {m.citations.map((c) => (
                      <p key={c.id + m.id} className="text-[11.5px] text-muted-foreground">
                        <Link to={`/institution/explain/${c.id}`} className="text-trading-gold hover:underline">{c.id}</Link>
                        {' '}· {c.label} · {c.note}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </OsPage>
  );
}
