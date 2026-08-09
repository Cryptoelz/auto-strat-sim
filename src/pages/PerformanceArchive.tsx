import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, ArrowRight, BookOpen, Download, Flag, History, Landmark, Lightbulb,
  Pause, PenLine, Play, Rewind, ScrollText, Sparkles, Trophy,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecGovernanceFooter,
} from '@/components/executive/ExecUi';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

import {
  ARCHIVE_EXPORTS, ARCHIVE_GOVERNANCE, ARCHIVE_VERSION, EVENT_META, EVOLUTION_SERIES,
  LATEST_DAY, REFLECTION_SECTIONS, archiveKpis, decisionHistory, downloadArchiveExport,
  eventsUpTo, evolutionData, executiveStory, lessonsLearned, loadReflection, milestoneWall,
  saveReflection, snapshot, timePoints, type ArchiveExport, type Reflection,
} from '@/lib/performanceArchive';
import { dateOfValidationDay } from '@/lib/institutionValidation';

const REPLAY_MS = 700;

export default function PerformanceArchive() {
  const [day, setDay] = useState(LATEST_DAY);
  const [seriesKey, setSeriesKey] = useState(EVOLUTION_SERIES[0].key);
  const [replaying, setReplaying] = useState(false);
  const [reflection, setReflection] = useState<Reflection>(() => loadReflection(LATEST_DAY));
  const replayEnd = useRef(LATEST_DAY);

  const kpis = useMemo(() => archiveKpis(), []);
  const points = useMemo(() => timePoints(), []);
  const snap = useMemo(() => snapshot(day), [day]);
  const story = useMemo(() => executiveStory(day), [day]);
  const events = useMemo(() => eventsUpTo(day, 30), [day]);
  const decisions = useMemo(() => decisionHistory(day), [day]);
  const chart = useMemo(() => evolutionData(seriesKey, day), [seriesKey, day]);
  const lessons = useMemo(() => lessonsLearned(day), [day]);
  const milestones = useMemo(() => milestoneWall(day), [day]);
  const activeSeries = EVOLUTION_SERIES.find((s) => s.key === seriesKey)!;

  useEffect(() => { setReflection(loadReflection(day)); }, [day]);

  useEffect(() => {
    if (!replaying) return;
    const id = window.setInterval(() => {
      setDay((d) => {
        if (d >= replayEnd.current) { setReplaying(false); return replayEnd.current; }
        return d + 1;
      });
    }, REPLAY_MS);
    return () => window.clearInterval(id);
  }, [replaying]);

  const startReplay = () => {
    replayEnd.current = day;
    setDay(Math.max(1, day - 6));
    setReplaying(true);
  };

  const updateReflection = (key: string, value: string) => {
    const next = { ...reflection, [key]: value };
    setReflection(next);
    saveReflection(day, next);
  };

  const doExport = (kind: ArchiveExport) => {
    downloadArchiveExport(kind, day);
    toast({ title: `${kind} generated`, description: `Reconstructed from day ${day} · advisory record only.` });
  };

  return (
    <OsPage
      title="Institutional Performance Archive™"
      subtitle="Replay every institutional day exactly as it was understood at the time."
      department="Permanent Historical Record"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Performance Archive' }]}
      actions={
        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
          <Link to="/audit-vault"><Archive className="h-3.5 w-3.5" aria-hidden="true" /> Audit Vault</Link>
        </Button>
      }
    >
      {/* Executive KPIs */}
      <section aria-label="Archive key figures">
        <ExecMetricGrid cols={4}>
          {kpis.map((k) => (
            <Link key={k.label} to={k.route} className="focus-visible:outline-none">
              <ExecMetric label={k.label} value={k.value} numeric={k.value} hint={k.hint} />
            </Link>
          ))}
        </ExecMetricGrid>
      </section>

      {/* Time machine */}
      <ExecCard as="section" className="p-5">
        <ExecCardHeader
          title="Time Machine"
          icon={History}
          hint={`Reconstructing day ${day} · ${dateOfValidationDay(day)}`}
        />
        <div className="flex flex-wrap gap-2">
          {points.map((p) => (
            <Button
              key={p.label}
              size="sm"
              variant={day === p.day ? 'default' : 'outline'}
              disabled={!p.available}
              onClick={() => setDay(p.day)}
              className="h-7 text-[11px]"
            >
              {p.label}
              <span className="ml-1.5 font-mono text-[10px] opacity-70">{p.date}</span>
            </Button>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          <Slider
            value={[day]}
            min={1}
            max={LATEST_DAY}
            step={1}
            onValueChange={([v]) => { setReplaying(false); setDay(v); }}
            aria-label="Archive day"
          />
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Day 1 · {dateOfValidationDay(1)}</span>
            <span className="font-mono text-trading-gold">Day {day}</span>
            <span>Day {LATEST_DAY} · Today</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => (replaying ? setReplaying(false) : startReplay())}>
            {replaying ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            {replaying ? 'Pause replay' : 'Replay this week'}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-[11px]" onClick={() => { setReplaying(false); setDay(LATEST_DAY); }}>
            <Rewind className="h-3.5 w-3.5" aria-hidden="true" /> Return to today
          </Button>
          {replaying && (
            <span className="text-[11px] text-muted-foreground">
              Replaying the institution as it grew — day {day} of {replayEnd.current}.
            </span>
          )}
        </div>
      </ExecCard>

      {/* Snapshot + story */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Snapshot view" icon={Landmark} hint="Exactly as it existed" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {snap.map((r) => (
              <li key={r.key}>
                <Link
                  to={r.route}
                  className="exec-card-interactive flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-foreground">{r.label}</span>
                    <span className="block truncate text-[10.5px] text-muted-foreground">{r.explanation}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-base tabular-nums text-trading-gold">{r.value.toLocaleString()}</span>
                    <span className={cn(
                      'block font-mono text-[10px] tabular-nums',
                      r.delta > 0 ? 'text-exec-healthy' : r.delta < 0 ? 'text-exec-critical' : 'text-muted-foreground',
                    )}>
                      {r.delta > 0 ? '+' : ''}{r.delta} / 7d
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </ExecCard>

        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Executive story" icon={ScrollText} hint="Written from the archive" />
          <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground [max-width:68ch]">
            {story.map((p, i) => (
              <p key={i} className={i === 0 ? 'text-foreground' : undefined}>{p}</p>
            ))}
          </div>
        </ExecCard>
      </div>

      {/* Performance evolution */}
      <ExecCard as="section" className="p-5">
        <ExecCardHeader title="Performance evolution" icon={Sparkles} hint={activeSeries.hint} />
        <div className="mb-4 flex flex-wrap gap-1.5">
          {EVOLUTION_SERIES.map((s) => (
            <Button
              key={s.key}
              size="sm"
              variant={s.key === seriesKey ? 'default' : 'outline'}
              className="h-7 text-[11px]"
              onClick={() => setSeriesKey(s.key)}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="archiveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} width={48} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                  borderRadius: 8, fontSize: 12,
                }}
                labelFormatter={(d) => `Day ${d}`}
                formatter={(v: number) => [`${v}${activeSeries.unit}`, activeSeries.label]}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--trading-gold))" strokeWidth={2} fill="url(#archiveFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ExecCard>

      {/* Major events + decision history */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Major events" icon={Flag} hint={`Up to day ${day}`} />
          <ScrollArea className="h-[420px] pr-3">
            <ol className="relative space-y-3 border-l border-border/50 pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-2 h-1.5 w-1.5 rounded-full bg-trading-gold" aria-hidden="true" />
                  <Link to={e.route} className="exec-card-interactive block rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className={cn('text-[10px] uppercase tracking-[0.16em]', EVENT_META[e.kind].tone)}>
                        {EVENT_META[e.kind].label}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">Day {e.day} · {e.date}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] font-medium text-foreground">{e.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{e.detail}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/70">Source · {e.source}</p>
                  </Link>
                </li>
              ))}
              {events.length === 0 && (
                <li className="text-[12px] text-muted-foreground">No archived events before this day.</li>
              )}
            </ol>
          </ScrollArea>
        </ExecCard>

        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Decision history" icon={BookOpen} hint={`${decisions.length} executive decisions`} />
          <ScrollArea className="h-[420px] pr-3">
            <ul className="space-y-3">
              {decisions.map((d) => (
                <li key={d.id} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-[0.14em]">{d.status}</Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">Day {d.day} · {d.date}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] font-medium text-foreground">{d.title}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">{d.reasoning}</p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground sm:grid-cols-4">
                    <div><dt className="opacity-70">Evidence</dt><dd className="font-mono text-foreground">{d.evidence}</dd></div>
                    <div><dt className="opacity-70">Confidence</dt><dd className="font-mono text-foreground">{d.confidence}</dd></div>
                    <div><dt className="opacity-70">Reviewer</dt><dd className="truncate text-foreground">{d.reviewer}</dd></div>
                    <div><dt className="opacity-70">Outcome</dt><dd className="truncate text-foreground">{d.outcome}</dd></div>
                  </dl>
                </li>
              ))}
              {decisions.length === 0 && (
                <li className="text-[12px] text-muted-foreground">No executive decisions had been raised by this day.</li>
              )}
            </ul>
          </ScrollArea>
        </ExecCard>
      </div>

      {/* Lessons learned */}
      <ExecCard as="section" className="p-5">
        <ExecCardHeader title="Lessons learned" icon={Lightbulb} hint="Written automatically from the archive" />
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {lessons.map((l) => (
            <li key={l.label}>
              <Link to={l.route} className="exec-card-interactive flex h-full flex-col rounded-lg border border-border/40 bg-muted/10 p-3">
                <span className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">{l.label}</span>
                <span className="mt-1 text-[12.5px] font-medium text-foreground">{l.title}</span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{l.detail}</span>
                <span className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/80">
                  Open source <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ExecCard>

      {/* Milestone wall */}
      <ExecCard as="section" className="p-5">
        <ExecCardHeader title="Milestone wall" icon={Trophy} hint="Every milestone permanent" />
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {milestones.map((m) => (
            <li key={m.label}>
              <Link
                to={m.route}
                className={cn(
                  'exec-card-interactive flex h-full flex-col rounded-lg border p-3',
                  m.achieved ? 'border-trading-gold/40 bg-trading-gold/5' : 'border-border/40 bg-muted/10 opacity-70',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn('text-[12px] font-semibold', m.achieved ? 'text-trading-gold' : 'text-muted-foreground')}>
                    {m.label}
                  </span>
                  <span className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    {m.achieved ? (m.day ? `Day ${m.day}` : 'Achieved') : 'Pending'}
                  </span>
                </span>
                <span className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{m.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ExecCard>

      {/* Founder reflections + exports */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Founder reflections" icon={PenLine} hint={`Private · day ${day} · stored on this device`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {REFLECTION_SECTIONS.map((s) => (
              <label key={s.key} className="block space-y-1.5">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</span>
                <Textarea
                  rows={4}
                  value={reflection[s.key] ?? ''}
                  placeholder={s.placeholder}
                  onChange={(e) => updateReflection(s.key, e.target.value)}
                  className="text-[12.5px]"
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] text-muted-foreground">
            Reflections are linked to day {day} of institutional history and never leave this device.
          </p>
        </ExecCard>

        <ExecCard as="section" className="p-5">
          <ExecCardHeader title="Export" icon={Download} hint="Advisory documents" />
          <div className="grid gap-2">
            {ARCHIVE_EXPORTS.map((k) => (
              <Button key={k} variant="outline" size="sm" className="h-8 justify-between text-[11.5px]" onClick={() => doExport(k)}>
                {k}
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] text-muted-foreground">
            Every export is reconstructed from day {day} and is advisory only — no export authorises live capital.
          </p>
        </ExecCard>
      </div>

      <p className="text-[10.5px] text-muted-foreground/70">{ARCHIVE_VERSION} · every historical record immutable.</p>
      <ExecGovernanceFooter badges={ARCHIVE_GOVERNANCE} />
    </OsPage>
  );
}
