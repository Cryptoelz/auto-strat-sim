import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecStatusPill,
  ExecGovernanceFooter, toExecStatus,
} from '@/components/executive/ExecUi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Sunrise, ListChecks, Brain, History, Gavel, Eye, Activity,
  Rocket, LineChart, MessageSquare, ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import {
  morningBriefing, todaysFocus, executiveInsights, overnightChanges, todaysDecisions,
  decisionStatusLabel, executiveWatchlist, pulseReadings, FOUNDER_ACTIONS,
  executiveForecast, atlasAdvisor, EI_GOVERNANCE, EI_VERSION,
} from '@/lib/executiveIntelligence';

const RANK_TONE = { HIGH: 'critical', MEDIUM: 'warning', LOW: 'planned' } as const;

export default function ExecutiveIntelligence() {
  const brief = morningBriefing();
  const focus = todaysFocus();
  const insights = executiveInsights();
  const overnight = overnightChanges();
  const decisions = todaysDecisions();
  const watchlist = executiveWatchlist();
  const readings = pulseReadings();
  const forecast = executiveForecast();
  const advisor = atlasAdvisor();

  // Subtle breathing animation — presentation only.
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setBeat((b) => b + 1), 3200);
    return () => window.clearInterval(id);
  }, []);

  const chartData = forecast.rows.map((r) => ({ name: r.label, Now: r.now, 'Day 7': r.d7, 'Day 30': r.d30, 'Day 90': r.d90 }));

  return (
    <OsPage
      title="ATLAS Executive Intelligence™ Centre"
      subtitle="The central intelligence layer of the institution. Every reading below is derived from existing engines, is advisory only, and never bypasses governance."
      department="Executive Intelligence™"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Executive Intelligence™' }]}
    >
      {/* ── Executive morning briefing ─────────────────────────── */}
      <ExecCard as="section" className="border-trading-gold/30">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="exec-hero-kicker text-[10px] text-trading-gold">Executive Morning Briefing</p>
            <h2 className="exec-hero-title text-[1.6rem] text-foreground sm:text-[2rem]">{brief.greeting}</h2>
            <p className="exec-measure text-[12.5px] leading-relaxed text-muted-foreground">
              {brief.date} · Validation day {brief.day}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sunrise className="h-4 w-4 text-trading-gold" aria-hidden="true" />
            <ExecStatusPill status="current" label="Advisory Only" />
          </div>
        </div>

        <div className="mt-5">
          <ExecMetricGrid cols={5}>
            {brief.readings.map((r) => (
              <Link key={r.key} to={r.route} className="exec-link">
                <ExecMetric
                  label={r.label}
                  value={r.value}
                  hint={r.hint}
                  status={toExecStatus(r.tone)}
                  trend={r.trend}
                  size="sm"
                />
              </Link>
            ))}
          </ExecMetricGrid>
        </div>

        <div className="mt-5 rounded-lg border border-trading-gold/25 bg-trading-gold/5 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-trading-gold">Today's Recommendation</p>
          <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-foreground">{brief.attention}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{brief.recommendation}</p>
        </div>
      </ExecCard>

      {/* ── Today's focus ──────────────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader title="Today's Focus" icon={ListChecks} hint="Automatically ranked" />
        <ol className="space-y-2.5">
          {focus.map((f) => (
            <li key={f.id}>
              <Link to={f.route} className="exec-card exec-card-interactive flex flex-wrap items-start gap-3 p-3.5">
                <ExecStatusPill status={RANK_TONE[f.rank]} label={f.rank} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[13px] font-medium leading-snug text-foreground">{f.title}</p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{f.detail}</p>
                  <p className="text-[11.5px] leading-relaxed text-trading-gold">{f.action}</p>
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      </ExecCard>

      {/* ── Executive insights ─────────────────────────────────── */}
      <section className="space-y-3">
        <ExecCardHeader title="Executive Insights" icon={Brain} hint="Observation · Evidence · Risk · Recommendation" />
        <div className="grid gap-3 lg:grid-cols-3">
          {insights.map((i) => (
            <ExecCard key={i.id} className="flex h-full flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14px] font-semibold leading-snug tracking-tight text-foreground">{i.observation}</p>
                <ExecStatusPill status={toExecStatus(i.tone)} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Evidence</p>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground/90">{i.evidence}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Risk</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{i.risk}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Recommendation</p>
                <p className="mt-1 text-[12px] leading-relaxed text-trading-gold">{i.recommendation}</p>
              </div>
              <div className="mt-auto space-y-2 pt-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Confidence</span>
                  <span className="font-mono text-[13px] tabular-nums text-foreground">{i.confidence}%</span>
                </div>
                <Progress value={i.confidence} className="h-1.5" />
                <Button asChild size="sm" variant="outline" className="h-7 w-full text-[11px]">
                  <Link to={i.evidenceRoute}>Open evidence</Link>
                </Button>
              </div>
            </ExecCard>
          ))}
        </div>
      </section>

      {/* ── What changed overnight ─────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader title="What Changed Overnight" icon={History} hint={`${overnight.length} institutional changes`} />
        <ol className="relative space-y-2.5 border-l border-border/50 pl-4">
          {overnight.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-2 h-1.5 w-1.5 rounded-full bg-trading-gold" aria-hidden="true" />
              <Link to={e.route} className="block rounded-md px-2 py-1.5 transition-colors hover:bg-muted/30">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="h-4 border-border/50 px-1.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {e.kind}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{e.department}</span>
                  <span className="text-[10.5px] text-muted-foreground/70">{e.when}</span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-foreground/90">{e.text}</p>
              </Link>
            </li>
          ))}
        </ol>
      </ExecCard>

      {/* ── Today's decisions ──────────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader
          title="Today's Decisions"
          icon={Gavel}
          action={
            <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
              <Link to="/decision-centre">Executive Decision Centre</Link>
            </Button>
          }
        />
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {decisions.map((g) => (
            <div key={g.key} className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {g.label} · {g.items.length}
              </p>
              {g.items.map((d) => (
                <Link key={d.id} to="/decision-centre" className="exec-card exec-card-interactive block p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-medium leading-snug text-foreground">{d.title}</p>
                    <span className="font-mono text-[11px] tabular-nums text-trading-gold">{d.confidence}%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {d.department} · {decisionStatusLabel(d.status)} · {d.priority} priority
                  </p>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </ExecCard>

      {/* ── Executive watchlist ────────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader title="Executive Watchlist" icon={Eye} hint="Health · Confidence · Trend · Alerts" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {watchlist.map((w) => (
            <Link key={w.key} to={w.route} className="exec-card exec-card-interactive p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-medium text-foreground">{w.label}</p>
                <ExecStatusPill status={toExecStatus(w.tone)} />
              </div>
              <div className="mt-2.5 flex items-baseline gap-3 font-mono text-[12px] tabular-nums">
                <span className="text-foreground">{w.health}</span>
                <span className="text-muted-foreground">conf {w.confidence}%</span>
                <span className={cn(
                  'text-[11px]',
                  w.trend === 'up' ? 'text-exec-healthy' : w.trend === 'down' ? 'text-exec-critical' : 'text-muted-foreground',
                )}>
                  {w.trend === 'up' ? '▲' : w.trend === 'down' ? '▼' : '—'}
                </span>
                {w.alerts > 0 && (
                  <span className="text-[11px] text-exec-warning">{w.alerts} alert{w.alerts === 1 ? '' : 's'}</span>
                )}
              </div>
              <Progress value={w.health} className="mt-2 h-1" />
              <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">{w.note}</p>
            </Link>
          ))}
        </div>
      </ExecCard>

      {/* ── Institution pulse ──────────────────────────────────── */}
      <ExecCard as="section" className="border-trading-gold/25">
        <ExecCardHeader title="Institution Pulse" icon={Activity} hint="The institution breathing — updates continuously" />
        <div className="exec-pulse-row">
          {readings.map((r, idx) => {
            const alive = (beat + idx) % 3 === 0;
            return (
              <Link key={r.key} to={r.route} className="exec-card exec-card-interactive exec-pulse-card">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-1.5 rounded-full bg-trading-gold transition-all duration-1000',
                      alive ? 'scale-150 opacity-100' : 'scale-100 opacity-50',
                    )}
                  />
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{r.label}</p>
                </div>
                <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-trading-gold">{r.score}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/30" role="progressbar" aria-valuenow={r.score} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.label} score`}>
                  <div className="h-full rounded-full bg-trading-gold/70 transition-all duration-1000" style={{ width: `${r.score}%` }} />
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{r.note}</p>
              </Link>
            );
          })}
        </div>
      </ExecCard>

      {/* ── Founder actions ────────────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader title="Founder Actions" icon={Rocket} hint="Every department, one click away" />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {FOUNDER_ACTIONS.map((a) => (
            <Button key={a.to} asChild variant="outline" className="h-auto justify-start border-trading-gold/25 px-3.5 py-3 text-left hover:border-trading-gold/50">
              <Link to={a.to}>
                <span className="block min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-foreground">{a.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">{a.note}</span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </ExecCard>

      {/* ── Executive forecast ─────────────────────────────────── */}
      <ExecCard as="section">
        <ExecCardHeader title="Executive Forecast" icon={LineChart} hint={forecast.trajectory} />
        <div className="grid gap-3 lg:grid-cols-3">
          {forecast.horizons.map((h) => (
            <div key={h.horizon} className="exec-card p-3.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-trading-gold">{h.horizon}</p>
              <p className="mt-1.5 text-[12.5px] font-medium leading-snug text-foreground">{h.headline}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">Why: {h.why}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <RLineChart data={chartData} margin={{ top: 8, right: 12, bottom: 8, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} height={48} angle={-18} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="Now" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Day 7" stroke="hsl(var(--trading-gold))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Day 30" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Day 90" stroke="hsl(var(--trading-profit))" strokeWidth={1.5} dot={false} />
            </RLineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 space-y-2">
          {forecast.rows.map((r) => (
            <div key={r.label} className="rounded-md border border-border/40 p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[12.5px] font-medium text-foreground">{r.label}</p>
                <p className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
                  now {r.now} · 7d {r.d7} · 30d {r.d30} · 90d {r.d90}
                </p>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Why: {r.why}</p>
            </div>
          ))}
        </div>

        {forecast.drivers.length > 0 && (
          <ul className="mt-3 space-y-1 text-[11.5px] leading-relaxed text-muted-foreground">
            {forecast.drivers.map((d) => <li key={d}>· {d}</li>)}
          </ul>
        )}
      </ExecCard>

      {/* ── ATLAS Advisor ──────────────────────────────────────── */}
      <ExecCard as="section" className="border-trading-gold/30 bg-trading-gold/[0.03]">
        <ExecCardHeader title="ATLAS Advisor" icon={MessageSquare} hint="Permanent advisory panel" />
        <div className="space-y-1.5">
          {advisor.lines.map((l, i) => (
            <p key={i} className={cn('exec-measure text-[13px] leading-relaxed', i === 0 ? 'text-trading-gold' : 'text-foreground/90')}>
              {l}
            </p>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Confidence</span>
          <span className="font-mono text-lg tabular-nums text-trading-gold">{advisor.confidence}%</span>
          <ExecStatusPill status={toExecStatus(advisor.tone)} />
        </div>
      </ExecCard>

      <ExecGovernanceFooter badges={EI_GOVERNANCE} />
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{EI_VERSION}</p>
    </OsPage>
  );
}
