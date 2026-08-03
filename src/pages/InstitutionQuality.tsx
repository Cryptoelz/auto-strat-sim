import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { allQualityScores, qualityIndex, type QualityScore } from '@/lib/institutionIntelligence';

const BAND: Record<QualityScore['band'], string> = {
  exceptional: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  strong: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  adequate: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  weak: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
};

export default function InstitutionQuality() {
  const index = useMemo(() => qualityIndex(), []);
  const all = useMemo(() => allQualityScores(), []);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(all[0]?.id ?? null);

  const filtered = all.filter((s) => !q || `${s.id} ${s.title} ${s.department} ${s.type}`.toLowerCase().includes(q.toLowerCase()));
  const open = all.find((s) => s.id === openId) ?? filtered[0];

  return (
    <OsPage
      title="Research Quality Index™"
      subtitle="Every research object receives an explainable quality score built from evidence depth, novelty, validation, reproducibility, reuse, governance, institutional impact and confidence calibration."
      department="Institutional Intelligence Engine"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{index.total}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Index {index.grade}</p>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Card className="border-trading-gold/25 bg-card/60 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Institution-wide quality</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="font-mono text-4xl text-trading-gold">{index.total}</span>
            <span className="pb-1 text-sm text-muted-foreground">{index.grade} · {index.objects} objects scored</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {index.exceptional} objects score as exceptional and {index.weak} score as weak. Weak objects are never deleted — they are flagged for validation depth and retained in institutional memory.
          </p>
          <div className="mt-4 space-y-2.5">
            {index.byComponent.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-[11.5px]">
                  <span className="text-foreground">{c.label}</span>
                  <span className="font-mono text-trading-gold">{c.score}</span>
                </div>
                <Progress value={c.score} className="mt-1 h-1" />
                <p className="mt-0.5 text-[10.5px] text-muted-foreground">{c.explanation}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border/60 bg-card/50 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Score explanation</p>
            {open && <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${BAND[open.band]}`}>{open.band}</Badge>}
          </div>
          {open && (
            <>
              <h3 className="mt-1 text-base font-semibold text-foreground">{open.title}</h3>
              <p className="text-[11px] text-muted-foreground">{open.id} · {open.type} · {open.department}</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="font-mono text-3xl text-trading-gold">{open.total}</span>
                <span className="pb-1 text-sm text-muted-foreground">{open.grade}</span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{open.summary}</p>
              <div className="mt-3 space-y-2">
                {open.components.map((c) => (
                  <div key={c.key} className="rounded-md border border-border/50 bg-muted/10 p-2.5">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="text-foreground">{c.label} <span className="text-muted-foreground">· weight {Math.round(c.weight * 100)}%</span></span>
                      <span className="font-mono text-trading-gold">{c.score}</span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-muted-foreground">{c.explanation}</p>
                  </div>
                ))}
              </div>
              <Link to={`/institution/explain/${open.id}`} className="mt-3 inline-block text-[11.5px] text-trading-gold hover:underline">
                Open full explainability page →
              </Link>
            </>
          )}
        </Card>
      </div>

      <Card className="border-border/60 bg-card/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">All scored objects</p>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search objects…" className="h-8 w-64 text-[12px]" />
        </div>
        <div className="mt-3 grid gap-1.5 md:grid-cols-2">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpenId(s.id)}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                s.id === openId ? 'border-trading-gold/40 bg-trading-gold/10' : 'border-border/50 bg-muted/10 hover:bg-muted/20'
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-[12px] text-foreground">{s.title}</span>
                <span className="block text-[10px] text-muted-foreground">{s.id} · {s.department}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-[13px] text-trading-gold">{s.total}</span>
                <span className="block text-[9.5px] text-muted-foreground">{s.grade}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </OsPage>
  );
}
