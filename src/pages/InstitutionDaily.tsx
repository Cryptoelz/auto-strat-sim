import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChevronLeft, ChevronRight, Archive, ArrowDownRight, ArrowUpRight, Minus, Lock, CheckCircle2, CircleDashed } from 'lucide-react';
import {
  VALIDATION_VERSION, VALIDATION_MODE, VALIDATION_RULES, VALIDATION_CYCLE, TOTAL_VALIDATION_DAYS,
  validationCounters, dailyBrief, evidenceGrowth, institutionScoreRows, validationMilestones,
  validationCalendar, archiveRows, searchArchive, metricSeries, archiveBrief, briefIsArchived,
  RECOMMENDATION_KINDS,
} from '@/lib/institutionValidation';

const TONE: Record<string, string> = {
  healthy: 'border-trading-profit/40 text-trading-profit',
  watch: 'border-trading-gold/40 text-trading-gold',
  warning: 'border-exec-watch/40 text-exec-watch',
  critical: 'border-destructive/40 text-destructive',
};

function Delta({ value, suffix = '' }: { value: number; suffix?: string }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums',
      value > 0 ? 'text-trading-profit' : value < 0 ? 'text-destructive' : 'text-muted-foreground')}>
      <Icon className="h-3 w-3" aria-hidden="true" />{value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card className="border-border/50 bg-card/60 p-5">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-trading-gold/20 pb-2">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function InstitutionDaily() {
  const [day, setDay] = useState(TOTAL_VALIDATION_DAYS);
  const [query, setQuery] = useState('');
  const [archivedTick, setArchivedTick] = useState(0);

  const brief = useMemo(() => dailyBrief(day), [day]);
  const counters = useMemo(() => validationCounters(day), [day]);
  const evidence = useMemo(() => evidenceGrowth(day), [day]);
  const scores = useMemo(() => institutionScoreRows(day), [day]);
  const milestones = useMemo(() => validationMilestones(day), [day]);
  const calendar = useMemo(() => validationCalendar(day), [day]);
  const archive = useMemo(() => searchArchive(archiveRows(day), query), [day, query]);
  const series = useMemo(() => metricSeries(30, day), [day]);
  const archived = useMemo(() => briefIsArchived(brief), [brief, archivedTick]);

  const onArchive = () => {
    archiveBrief(brief);
    setArchivedTick((t) => t + 1);
    toast({ title: 'Briefing archived', description: `Day ${brief.day} written to Institutional Memory with citations.` });
  };

  return (
    <OsPage
      title="Institution Daily™"
      subtitle="Daily Executive Briefing — ATLAS OS operates in permanent Institutional Validation™ mode. The objective is no longer feature development; it is evidence generation. Research, simulation and observation only."
      department="Institutional Validation™"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Institution Daily™' }]}
      actions={
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setDay((d) => Math.max(1, d - 1))} aria-label="Previous day"><ChevronLeft className="h-3.5 w-3.5" /></Button>
          <span className="font-mono text-[11px] text-trading-gold">Day {brief.day} · {brief.date}</span>
          <Button size="sm" variant="outline" className="h-7 w-7 p-0" disabled={day >= TOTAL_VALIDATION_DAYS} onClick={() => setDay((d) => Math.min(TOTAL_VALIDATION_DAYS, d + 1))} aria-label="Next day"><ChevronRight className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant={archived ? 'outline' : 'default'} className="h-7 gap-1.5 text-[11px]" onClick={onArchive}>
            <Archive className="h-3.5 w-3.5" /> {archived ? 'Archived' : 'Archive to memory'}
          </Button>
        </div>
      }
    >
      {/* Validation counter */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counters.map((c) => (
          <Link key={c.key} to={c.route} className="rounded-xl border border-trading-gold/20 bg-trading-gold/[0.04] p-3.5 transition-colors hover:border-trading-gold/50">
            <p className="font-mono text-lg font-semibold leading-none tabular-nums text-trading-gold">{c.value}</p>
            <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{c.label}</p>
            <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground/80">{c.hint}</p>
          </Link>
        ))}
      </section>

      {/* Recommendation */}
      <SectionCard
        title="Executive Recommendation"
        action={<Badge variant="outline" className={cn('text-[10px]', TONE[brief.recommendation.tone])}>{brief.recommendation.kind}</Badge>}
      >
        <p className="exec-measure text-[13px] leading-relaxed text-foreground">{brief.recommendation.next}</p>
        <ul className="mt-3 space-y-1.5">
          {brief.recommendation.why.map((w, i) => (
            <li key={i} className="exec-measure text-[12px] leading-relaxed text-muted-foreground">Why · {w}</li>
          ))}
        </ul>
        <div className="mt-4 grid gap-1.5 border-t border-border/40 pt-3 sm:grid-cols-2 lg:grid-cols-5">
          {RECOMMENDATION_KINDS.map((r) => (
            <div key={r.kind} className={cn('rounded-md border px-2.5 py-2', r.kind === brief.recommendation.kind ? 'border-trading-gold/50 bg-trading-gold/10' : 'border-border/40')}>
              <p className={cn('text-[10.5px] font-semibold uppercase tracking-[0.1em]', r.kind === brief.recommendation.kind ? 'text-trading-gold' : 'text-muted-foreground')}>{r.kind}</p>
              <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/80">{r.blurb}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Daily brief sections */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {brief.sections.map((s) => (
          <Card key={s.heading} className="border-border/50 bg-card/60 p-5">
            <div className="flex items-center gap-2 border-b border-trading-gold/20 pb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-trading-gold" aria-hidden="true" />
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground">{s.heading}</h2>
            </div>
            <ul className="mt-3 space-y-1.5">
              {s.lines.map((l, i) => (
                <li key={i} className="exec-measure text-[12px] leading-relaxed text-foreground/85">• {l}</li>
              ))}
            </ul>
            {s.route && (
              <Link to={s.route} className="mt-3 inline-block text-[10.5px] uppercase tracking-[0.14em] text-trading-gold/90 hover:text-trading-gold">Open evidence →</Link>
            )}
          </Card>
        ))}
      </section>

      {/* Daily validation cycle */}
      <SectionCard title="Daily Validation Cycle">
        <ol className="grid gap-2 sm:grid-cols-3 lg:grid-cols-9">
          {VALIDATION_CYCLE.map((s, i) => (
            <li key={s.key}>
              <Link to={s.route} className="flex h-full flex-col rounded-lg border border-border/40 bg-muted/10 p-3 transition-colors hover:border-trading-gold/40">
                <span className="font-mono text-[10px] text-trading-gold">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-1 text-[11.5px] font-semibold text-foreground">{s.label}</span>
                <span className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{s.purpose}</span>
                <span className="mt-2 text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground/70">{s.output}</span>
              </Link>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* Evidence growth + score evolution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Evidence Growth">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="pb-2 text-left font-medium">Evidence</th>
                <th className="pb-2 text-right font-medium">Total</th>
                <th className="pb-2 text-right font-medium">Today</th>
              </tr>
            </thead>
            <tbody>
              {evidence.map((e) => (
                <tr key={e.key as string} className="border-t border-border/30">
                  <td className="py-1.5">
                    <Link to={e.route} className="text-foreground hover:text-trading-gold">{e.label}</Link>
                    <p className="text-[10px] text-muted-foreground">{e.note}</p>
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-foreground">{e.total}</td>
                  <td className="py-1.5 text-right"><Delta value={e.delta} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                <Area type="monotone" dataKey="evidence" name="Evidence links" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold))" fillOpacity={0.15} />
                <Area type="monotone" dataKey="memoryRecords" name="Memory records" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Institution Score">
          <div className="space-y-2">
            {scores.map((s) => (
              <Link key={s.key as string} to={s.route} className="block rounded-md border border-border/40 px-3 py-2 transition-colors hover:border-trading-gold/40">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-foreground">{s.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[12px] tabular-nums text-trading-gold">{Math.round(s.value)}</span>
                    <Delta value={s.delta} />
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">{s.explanation}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[50, 100]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                <Line type="monotone" dataKey="iq" name="Institution IQ" dot={false} stroke="hsl(var(--trading-gold))" strokeWidth={2} />
                <Line type="monotone" dataKey="readiness" name="Readiness" dot={false} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="stability" name="Stability" dot={false} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Milestones */}
      <SectionCard title="Validation Milestones">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {milestones.map((m) => (
            <div key={m.days} className={cn('rounded-lg border p-3.5',
              m.state === 'achieved' ? 'border-trading-profit/40 bg-trading-profit/5' : m.state === 'in-progress' ? 'border-trading-gold/40 bg-trading-gold/5' : 'border-border/40')}>
              <div className="flex items-center gap-1.5">
                {m.state === 'achieved' ? <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit" /> : m.state === 'in-progress' ? <CircleDashed className="h-3.5 w-3.5 text-trading-gold" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="text-[12px] font-semibold text-foreground">{m.label}</span>
              </div>
              <p className="mt-1.5 text-[10.5px] uppercase tracking-[0.12em] text-trading-gold/90">{m.certification}</p>
              <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">{m.requirement}</p>
              <div className="mt-2 h-1 rounded-full bg-muted/40">
                <div className="h-1 rounded-full bg-trading-gold" style={{ width: `${m.progress}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-[9.5px] text-muted-foreground">{m.progress}% · target {m.eta}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Calendar */}
      <SectionCard title="Institution Calendar">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-7">
          {calendar.map((c) => (
            <button key={c.day} type="button" onClick={() => setDay(c.day)}
              className={cn('rounded-md border p-2 text-left transition-colors hover:border-trading-gold/50',
                c.day === day ? 'border-trading-gold bg-trading-gold/10' : 'border-border/40 bg-muted/10')}>
              <p className="font-mono text-[10px] text-muted-foreground">{c.date.slice(5)}</p>
              <p className="mt-1 text-[10.5px] text-foreground">R {c.research} · T {c.trades}</p>
              <p className="text-[10px] text-muted-foreground">K +{c.knowledge} · M {c.maintenance}</p>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-trading-gold">{Math.round(c.readiness)}%</p>
              <p className="truncate text-[9px] uppercase tracking-[0.1em] text-muted-foreground/80" title={c.recommendation}>{c.reviewed ? 'Reviewed' : 'Pending'}</p>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Archive */}
      <SectionCard
        title="Institution Archive"
        action={<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search date, score, readiness, recommendation" className="h-7 w-[280px] text-[11px]" />}
      >
        <ScrollArea className="h-[380px]">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-card/95 backdrop-blur">
              <tr className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                <th className="py-2 text-left font-medium">Day</th>
                <th className="py-2 text-left font-medium">Date</th>
                <th className="py-2 text-right font-medium">Score</th>
                <th className="py-2 text-right font-medium">Readiness</th>
                <th className="py-2 text-right font-medium">Research</th>
                <th className="py-2 text-right font-medium">Memory</th>
                <th className="py-2 text-right font-medium">Portfolio</th>
                <th className="py-2 text-right font-medium">Governance</th>
                <th className="py-2 text-right font-medium">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {archive.map((r) => (
                <tr key={r.day} className="cursor-pointer border-t border-border/30 hover:bg-muted/20" onClick={() => setDay(r.day)}>
                  <td className="py-1.5 font-mono tabular-nums text-muted-foreground">{r.day}</td>
                  <td className="py-1.5 font-mono text-foreground">{r.date}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums text-trading-gold">{r.score}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{Math.round(r.readiness)}%</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{Math.round(r.research)}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{Math.round(r.memory)}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{Math.round(r.portfolio)}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{Math.round(r.governance)}</td>
                  <td className="py-1.5 text-right text-[10.5px] text-muted-foreground">{r.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollArea>
        <p className="mt-2 text-[10.5px] text-muted-foreground">{archive.length} archived briefings · every brief is permanent and citable from <Link to="/institution/memory" className="text-trading-gold">Institutional Memory™</Link>.</p>
      </SectionCard>

      {/* Governance */}
      <SectionCard title="Operating Mode & Hard Limits">
        <p className="exec-measure text-[12.5px] leading-relaxed text-muted-foreground">{VALIDATION_MODE.statement}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VALIDATION_RULES.map((r) => (
            <span key={r} className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{r}</span>
          ))}
        </div>
        <p className="mt-3 font-mono text-[10px] text-muted-foreground/70">{VALIDATION_VERSION}</p>
      </SectionCard>
    </OsPage>
  );
}
