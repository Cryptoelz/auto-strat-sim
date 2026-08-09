import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowUpRight, ArrowDownRight, Minus, Lock, Sun, Quote, Save, ArrowRight, Sparkles, ShieldCheck,
} from 'lucide-react';
import {
  FOUNDER_VERSION, FOUNDER_RULES, FOUNDER_PROMISE, CREATIVE_VISION, QUICK_ACCESS, JOURNAL_SECTIONS,
  morningPanel, todaysInstitution, foundersPriorities, currentMission, executiveDecisions,
  weeklyScoreboard, monthlyReflection, loadJournal, saveJournal, loadChecklist, saveChecklist,
  journalDaysWritten, type Journal, type JournalKey,
} from '@/lib/foundersOffice';
import { TOTAL_VALIDATION_DAYS } from '@/lib/institutionValidation';

function Delta({ value }: { value: number }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums',
      value > 0 ? 'text-trading-profit' : value < 0 ? 'text-destructive' : 'text-muted-foreground')}>
      <Icon className="h-3 w-3" aria-hidden="true" />{value > 0 ? '+' : ''}{value}
    </span>
  );
}

function SectionCard({ title, subtitle, children, action }: {
  title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card className="border-border/50 bg-card/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-trading-gold/20 pb-2.5">
        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-[11.5px] text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function FoundersOffice() {
  const day = TOTAL_VALIDATION_DAYS;

  const morning = useMemo(() => morningPanel(day), [day]);
  const metrics = useMemo(() => todaysInstitution(day), [day]);
  const priorities = useMemo(() => foundersPriorities(day), [day]);
  const mission = useMemo(() => currentMission(day), [day]);
  const decisions = useMemo(() => executiveDecisions(day), [day]);
  const scoreboard = useMemo(() => weeklyScoreboard(day), [day]);
  const reflection = useMemo(() => monthlyReflection(day), [day]);

  const [done, setDone] = useState<string[]>([]);
  const [journal, setJournal] = useState<Journal>({});
  const [journalDays, setJournalDays] = useState(0);

  useEffect(() => {
    setDone(loadChecklist(day));
    setJournal(loadJournal(day));
    setJournalDays(journalDaysWritten());
  }, [day]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      saveChecklist(day, next);
      return next;
    });
  };

  const onSaveJournal = () => {
    saveJournal(day, journal);
    setJournalDays(journalDaysWritten());
    toast({ title: 'Journal saved', description: 'Private to this device — never published to institutional memory.' });
  };

  const completion = Math.round((done.length / priorities.length) * 100);
  const groups = Array.from(new Set(decisions.map((d) => d.group)));

  return (
    <OsPage
      title="Founder's Office™"
      subtitle="The daily command centre for leading the institution. Private executive workspace — presentation layer only. It never controls trading, never changes governance and never approves production."
      department="Private · Founder"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: "Founder's Office™" }]}
      actions={
        <Badge variant="outline" className="h-7 gap-1.5 border-trading-gold/40 bg-trading-gold/10 text-[10px] tracking-[0.14em] text-trading-gold">
          <Lock className="h-3 w-3" aria-hidden="true" /> PRIVATE
        </Badge>
      }
    >
      {/* Good morning */}
      <section className="overflow-hidden rounded-2xl border border-trading-gold/25 bg-gradient-to-br from-trading-gold/[0.09] via-card/70 to-background p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-trading-gold">
              <Sun className="h-3.5 w-3.5" aria-hidden="true" /> {morning.phase}
            </span>
            <h2 className="exec-hero-title text-[1.9rem] leading-tight text-foreground sm:text-[2.4rem]">{morning.greeting}</h2>
            <p className="text-[13px] text-muted-foreground">{morning.date}</p>
            <p className="exec-measure text-[13.5px] leading-relaxed text-foreground">
              <span className="text-trading-gold">Today's focus · </span>{morning.focus}
            </p>
            <p className="exec-measure flex gap-2 border-l-2 border-trading-gold/40 pl-3 text-[13px] italic leading-relaxed text-muted-foreground">
              <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trading-gold/70" aria-hidden="true" />
              {morning.quote}
            </p>
          </div>
          <dl className="grid w-full max-w-sm grid-cols-2 gap-3">
            {[
              { label: 'Validation Day', value: `${morning.validationDay}` },
              { label: 'Institution Age', value: morning.institutionAge },
              { label: 'Institution Status', value: morning.status },
              { label: 'Journal Days', value: `${journalDays}` },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-trading-gold/20 bg-background/40 p-3">
                <dt className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</dt>
                <dd className="mt-1.5 font-mono text-[13px] leading-snug text-trading-gold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Today's institution */}
      <SectionCard title="Today's Institution" subtitle="Read directly from existing institutional evidence. Nothing here is editable.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {metrics.map((m) => (
            <Link key={m.key} to={m.route} className="rounded-xl border border-border/50 bg-background/40 p-3.5 transition-colors hover:border-trading-gold/50">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-xl font-semibold leading-none tabular-nums text-trading-gold">{m.value}</p>
                <Delta value={m.delta} />
              </div>
              <p className="mt-2 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{m.label}</p>
              <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground/80">{m.explanation}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priorities */}
        <SectionCard
          title="Today's Priorities"
          subtitle="Your operating checklist for the day."
          action={<span className="font-mono text-[11px] text-trading-gold">{done.length}/{priorities.length} · {completion}%</span>}
        >
          <Progress value={completion} className="mb-4 h-1.5" />
          <ul className="space-y-2">
            {priorities.map((p) => {
              const checked = done.includes(p.id);
              return (
                <li key={p.id} className={cn('flex items-start gap-3 rounded-lg border p-3 transition-colors',
                  checked ? 'border-trading-profit/30 bg-trading-profit/[0.05]' : 'border-border/50 bg-background/30')}>
                  <Checkbox id={`p-${p.id}`} checked={checked} onCheckedChange={() => toggle(p.id)} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`p-${p.id}`} className={cn('cursor-pointer text-[12.5px] font-medium', checked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                      {p.label}
                    </label>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/80">{p.note}</p>
                  </div>
                  {p.route && (
                    <Button asChild size="sm" variant="ghost" className="h-7 shrink-0 px-2 text-[11px]">
                      <Link to={p.route}>Open <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionCard>

        {/* Current mission */}
        <SectionCard title="Current Mission" subtitle={`${mission.name} · week ${mission.week}`}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Progress', value: `${mission.progress}%` },
              { label: 'Days Elapsed', value: `${mission.daysElapsed}` },
              { label: 'Days Remaining', value: `${mission.daysRemaining}` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border/50 bg-background/30 p-3">
                <p className="font-mono text-lg leading-none tabular-nums text-trading-gold">{s.value}</p>
                <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <Progress value={mission.progress} className="mt-4 h-1.5" />
          <h3 className="mt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Current objectives</h3>
          <ul className="mt-2 space-y-1.5">
            {mission.objectives.map((o) => (
              <li key={o} className="exec-measure text-[12px] leading-relaxed text-muted-foreground">· {o}</li>
            ))}
          </ul>
          <h3 className="mt-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Milestone progress</h3>
          <ul className="mt-2 space-y-2">
            {mission.milestones.map((m) => (
              <li key={m.label}>
                <div className="flex items-center justify-between gap-3 text-[11.5px]">
                  <span className="text-foreground">{m.label}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{m.progress}% · {m.eta}</span>
                </div>
                <Progress value={m.progress} className="mt-1 h-1" />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* Founder's journal */}
      <SectionCard
        title="Founder's Journal"
        subtitle="Private notes. Stored on this device only — never written to institutional memory."
        action={<Button size="sm" className="h-7 gap-1.5 text-[11px]" onClick={onSaveJournal}><Save className="h-3.5 w-3.5" /> Save journal</Button>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {JOURNAL_SECTIONS.map((s) => (
            <div key={s.key}>
              <label htmlFor={`j-${s.key}`} className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</label>
              <Textarea
                id={`j-${s.key}`}
                value={journal[s.key as JournalKey] ?? ''}
                placeholder={s.placeholder}
                onChange={(e) => setJournal((j) => ({ ...j, [s.key]: e.target.value }))}
                className="mt-1.5 min-h-[84px] resize-y bg-background/40 text-[12.5px]"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Executive decisions */}
      <SectionCard title="Executive Decisions" subtitle="Advisory only. Approval always happens in the governed module, never here.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={g} className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">{g}</h3>
              {decisions.filter((d) => d.group === g).map((d) => (
                <Link key={d.title} to={d.route} className="block rounded-lg border border-border/50 bg-background/30 p-3 transition-colors hover:border-trading-gold/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium leading-snug text-foreground">{d.title}</p>
                    <Badge variant="outline" className="shrink-0 border-border/60 text-[9.5px]">{d.state}</Badge>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground/80">{d.detail}</p>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Creative vision */}
      <section className="rounded-2xl border border-trading-gold/25 bg-gradient-to-br from-background via-card/60 to-trading-gold/[0.07] p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-trading-gold">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Creative Vision
        </span>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Mission</h3>
              <p className="exec-measure mt-1.5 text-[15px] leading-relaxed text-foreground">{CREATIVE_VISION.mission}</p>
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Vision</h3>
              <p className="exec-measure mt-1.5 text-[15px] leading-relaxed text-foreground">{CREATIVE_VISION.vision}</p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CREATIVE_VISION.objectives.map((o) => (
              <li key={o.title} className="rounded-xl border border-trading-gold/20 bg-background/40 p-4">
                <p className="text-[13px] font-medium text-trading-gold">{o.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground">{o.blurb}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Quick access */}
      <SectionCard title="Quick Access" subtitle="Everything the founder opens most days.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACCESS.map((q) => (
            <Link key={q.to} to={q.to} className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-trading-gold/60 hover:bg-trading-gold/[0.06]">
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-foreground">{q.label}</span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">{q.blurb}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-trading-gold" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* Weekly scoreboard */}
      <SectionCard title="Weekly Scoreboard" subtitle="Movement across the last seven validation days.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {scoreboard.map((s) => (
            <Link key={s.label} to={s.route} className="rounded-xl border border-border/50 bg-background/40 p-3.5 transition-colors hover:border-trading-gold/50">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-mono text-lg leading-none tabular-nums text-trading-gold">{s.value}</p>
                {s.delta !== 0 && <Delta value={s.delta} />}
              </div>
              <p className="mt-2 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
              <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground/80">{s.hint}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* Monthly reflection */}
      <SectionCard title="Monthly Reflection" subtitle="An executive reading of the last thirty days.">
        <div className="grid gap-4 md:grid-cols-2">
          {reflection.map((r) => (
            <article key={r.heading} className="rounded-xl border border-border/50 bg-background/30 p-4">
              <h3 className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">{r.heading}</h3>
              <p className="exec-measure mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{r.body}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      {/* Founder's promise */}
      <section className="rounded-2xl border border-trading-gold/30 bg-trading-gold/[0.05] p-6 sm:p-8">
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-trading-gold">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Founder's Promise
        </span>
        <div className="exec-measure mt-4 space-y-1.5">
          {FOUNDER_PROMISE.map((line, i) => (
            <p key={line} className={cn('leading-relaxed', i === 0 ? 'text-[15px] text-foreground' : 'text-[13px] text-muted-foreground')}>{line}</p>
          ))}
        </div>
      </section>

      {/* Governance footer */}
      <section className="rounded-xl border border-border/50 bg-card/40 p-5">
        <h2 className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Governance</h2>
        <ul className="mt-2 grid gap-1.5 md:grid-cols-2">
          {FOUNDER_RULES.map((r) => (
            <li key={r} className="text-[11.5px] leading-snug text-muted-foreground">· {r}</li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[10.5px] text-muted-foreground/70">{FOUNDER_VERSION}</p>
      </section>
    </OsPage>
  );
}
