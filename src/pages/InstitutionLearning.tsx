import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { institutionLessons, learningStats, LESSON_KINDS, type LessonKind } from '@/lib/institutionIntelligence';

const KIND_STYLE: Record<LessonKind, string> = {
  lesson: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  'best-practice': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  principle: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  'failure-pattern': 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  'success-pattern': 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  standard: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
};

export default function InstitutionLearning() {
  const lessons = useMemo(() => institutionLessons(), []);
  const stats = useMemo(() => learningStats(), []);
  const [kind, setKind] = useState<LessonKind | 'all'>('all');
  const [q, setQ] = useState('');

  const filtered = lessons.filter(
    (l) => (kind === 'all' || l.kind === kind) &&
      (!q || `${l.title} ${l.detail} ${l.department} ${l.sourceTitle}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <OsPage
      title="Institution Learning Engine™"
      subtitle="Every completed research project teaches the institution. Lessons, best practices, principles, failure and success patterns and institutional standards are extracted automatically and retained permanently — nothing is ever deleted."
      department="Institutional Intelligence Engine"
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{stats.score}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Learning score</p>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.byKind.map((k) => (
          <Card key={k.key} className="border-border/60 bg-card/50 p-4">
            <p className="font-mono text-xl text-trading-gold">{k.count}</p>
            <p className="text-[11px] font-medium text-foreground">{k.label}</p>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{k.blurb}</p>
          </Card>
        ))}
      </div>

      <Card className="border-trading-gold/25 bg-card/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Permanent institutional memory</p>
            <h2 className="text-lg font-semibold text-foreground">
              {stats.total} lessons retained across {stats.departments} departments · {stats.recent} learned in the last 30 simulated days
            </h2>
          </div>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons, sources, departments…" className="h-8 w-64 text-[12px]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Button size="sm" variant={kind === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setKind('all')}>All</Button>
          {LESSON_KINDS.map((k) => (
            <Button key={k.key} size="sm" variant={kind === k.key ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setKind(k.key)}>
              {k.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((l) => (
          <Card key={l.id} className="border-border/60 bg-card/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[13px] font-semibold leading-snug text-foreground">{l.title}</h3>
              <Badge variant="outline" className={`shrink-0 text-[9.5px] uppercase tracking-wider ${KIND_STYLE[l.kind]}`}>
                {LESSON_KINDS.find((k) => k.key === l.kind)?.label.replace(/s$/, '')}
              </Badge>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{l.detail}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted-foreground">
              <span>Source <Link to={`/institution/explain/${l.source}`} className="text-trading-gold hover:underline">{l.source}</Link></span>
              <span>{l.department}</span>
              <span>{l.learnedOn}</span>
              <span>Confidence <span className="text-foreground">{l.confidence}</span></span>
              <span className="text-emerald-400/80">Retained permanently</span>
            </div>
            {l.appliedTo.length > 0 && (
              <p className="mt-2 text-[10.5px] text-muted-foreground">Applied to: {l.appliedTo.join(', ')}</p>
            )}
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
