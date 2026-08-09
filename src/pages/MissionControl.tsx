import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock, Compass,
  Gauge, Landmark, LineChart as LineChartIcon, Radar, Search, Sparkles, Target, Waves,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { OsPage } from '@/components/institution/OsPage';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecStatusPill,
  ExecGovernanceFooter, toExecStatus,
} from '@/components/executive/ExecUi';

import {
  MISSION_VERSION, MISSION_QUICK_ACTIONS, MISSION_GOVERNANCE,
  liveStatus, missionOverview, institutionMap, eventStream, missionAlerts,
  missionTasks, loadTasks, saveTasks, liveMetrics, healthSeries, missionState,
  decisionRadar, productionMonitor, portfolioMonitor, memoryPanel, founderInsights,
  globalSearch,
} from '@/lib/missionControl';
import { askOracle, SUGGESTED_CARDS } from '@/lib/oracle';

const ALERT_TONE = {
  critical: 'exec-status-critical',
  warning: 'exec-status-warning',
  watch: 'exec-status-watch',
  info: 'exec-status-planned',
} as const;

function SectionTitle({ icon: Icon, title, hint, to }: { icon: typeof Activity; title: string; hint: string; to?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-foreground">
          <Icon className="h-3.5 w-3.5 text-trading-gold" aria-hidden="true" /> {title}
        </h2>
        <p className="exec-measure mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {to && (
        <Button asChild size="sm" variant="ghost" className="h-6 gap-1 text-[10.5px] text-trading-gold">
          <Link to={to}>Open <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
        </Button>
      )}
    </div>
  );
}

export default function MissionControl() {
  const [now, setNow] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState('');
  const [done, setDone] = useState<string[]>(() => loadTasks());

  // Live clock + gentle auto refresh of derived readings.
  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const refresh = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => { window.clearInterval(clock); window.clearInterval(refresh); };
  }, []);

  const status = useMemo(() => liveStatus(), []);
  const overview = useMemo(() => missionOverview(), []);
  const departments = useMemo(() => institutionMap(), []);
  const stream = useMemo(() => eventStream(18), [tick]);
  const alerts = useMemo(() => missionAlerts(), []);
  const tasks = useMemo(() => missionTasks(), []);
  const metrics = useMemo(() => liveMetrics(), [tick]);
  const series = useMemo(() => healthSeries(21), []);
  const { mission, milestones } = useMemo(() => missionState(), []);
  const radar = useMemo(() => decisionRadar(), []);
  const production = useMemo(() => productionMonitor(), []);
  const portfolio = useMemo(() => portfolioMonitor(), []);
  const memory = useMemo(() => memoryPanel(), []);
  const insights = useMemo(() => founderInsights(), []);
  const oracle = useMemo(() => askOracle(SUGGESTED_CARDS[0].query), []);
  const hits = useMemo(() => globalSearch(query), [query]);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    saveTasks(next);
  };

  const pulseSignals = departments.filter((d) =>
    ['research', 'knowledge', 'maintenance', 'evolution', 'oracle', 'memory', 'decisions'].includes(d.key));

  return (
    <OsPage
      title="Mission Control™"
      subtitle="The live operating centre of the institution."
      department="Executive Operations"
      breadcrumbs={[{ label: 'ATLAS OS', to: '/institution' }, { label: 'Mission Control' }]}
      actions={
        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
          <Link to="/founders-office"><Landmark className="h-3.5 w-3.5" aria-hidden="true" /> Founder's Office</Link>
        </Button>
      }
    >
      {/* ── Live status bar ─────────────────────────────────────── */}
      <section aria-label="Live institution status"
        className="sticky top-0 z-20 -mx-1 rounded-xl border border-trading-gold/25 bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2 text-foreground">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-trading-gold/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-trading-gold" />
            </span>
            <span className="font-medium">{status.status}</span>
          </span>
          <span>{status.phase}</span>
          <span>Validation day <span className="font-mono tabular-nums text-foreground">{status.validationDay}</span></span>
          <span>Age <span className="font-mono tabular-nums text-foreground">{status.age}</span></span>
          <span>Health <span className="font-mono tabular-nums text-trading-gold">{status.health}</span></span>
          <span>Readiness <span className="font-mono tabular-nums text-trading-gold">{status.readiness}%</span></span>
          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" aria-hidden="true" />
            <span className="font-mono tabular-nums text-foreground">{now.toLocaleTimeString('en-GB')}</span>
          </span>
          <span>Next cycle <span className="text-foreground">{status.nextCycle}</span></span>
          <span className="text-muted-foreground/70">{MISSION_VERSION}</span>
        </div>
      </section>

      {/* ── Mission overview hero ───────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Gauge} title="Mission Overview" to="/institution/score"
          hint="Every institutional score on one baseline, drawn from the engines that already own each reading." />
        <ExecMetricGrid cols={5}>
          {overview.map((m) => (
            <Link key={m.key} to={m.route} className="exec-link rounded-xl">
              <ExecMetric label={m.label} value={`${m.value}${m.suffix ?? ''}`} hint={m.hint} status={toExecStatus(m.tone)} />
            </Link>
          ))}
        </ExecMetricGrid>
      </section>

      {/* ── Live institution map ────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Building2} title="Live Institution Map" to="/institution/departments"
          hint="Every department reports its own status, activity, confidence and open alerts." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {departments.map((d) => (
            <ExecCard key={d.key} interactive as="article" className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <Link to={d.route} className="exec-link text-[13px] font-semibold tracking-tight text-foreground hover:text-trading-gold">
                  {d.name}
                </Link>
                <ExecStatusPill status={toExecStatus(d.tone)} label={d.status} />
              </div>
              <p className="exec-measure text-[11.5px] leading-relaxed text-muted-foreground">{d.activity}</p>
              <dl className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <div><dt>Conf</dt><dd className="font-mono text-[12px] tabular-nums text-foreground">{d.confidence}</dd></div>
                <div><dt>Health</dt><dd className="font-mono text-[12px] tabular-nums text-foreground">{d.health}</dd></div>
                <div><dt>Alerts</dt><dd className={`font-mono text-[12px] tabular-nums ${d.alerts ? 'text-exec-warning' : 'text-foreground'}`}>{d.alerts}</dd></div>
              </dl>
              <p className="truncate text-[10px] text-muted-foreground/80">Updated {d.updated}</p>
            </ExecCard>
          ))}
        </div>
      </section>

      {/* ── Stream + alerts ─────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <ExecCard className="space-y-3">
          <ExecCardHeader title="Institution Timeline™" icon={Activity} hint="Newest first" />
          <ol className="space-y-2.5">
            {stream.map((e) => (
              <li key={e.id} className="flex gap-3 border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-trading-gold/70" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <Link to={e.route} className="exec-link block text-[12px] leading-relaxed text-foreground hover:text-trading-gold">
                    {e.text}
                  </Link>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {e.department} · {e.kind} · {e.when}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </ExecCard>

        <ExecCard className="space-y-3">
          <ExecCardHeader title="Executive Alerts" icon={AlertTriangle} hint={`${alerts.length} active`} />
          <ul className="space-y-2.5">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/50 bg-muted/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12.5px] font-semibold tracking-tight text-foreground">{a.title}</p>
                  <span className={`exec-badge shrink-0 ${ALERT_TONE[a.level]}`}>{a.level}</span>
                </div>
                <p className="exec-measure mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{a.why}</p>
                <p className="exec-measure mt-1 text-[11px] leading-relaxed text-muted-foreground/85">Evidence — {a.evidence}</p>
                <p className="exec-measure mt-1 text-[11px] leading-relaxed text-trading-gold/90">Recommended — {a.action}</p>
                <Link to={a.route} className="exec-link mt-1.5 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground hover:text-trading-gold">
                  {a.department} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </ExecCard>
      </section>

      {/* ── Tasks + live metrics ────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <ExecCard className="space-y-3">
          <ExecCardHeader title="Today's Executive Tasks" icon={CheckCircle2} hint={`${done.length}/${tasks.length} complete`} />
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-2.5 rounded-lg border border-border/40 p-2.5">
                <Checkbox id={`task-${t.id}`} checked={done.includes(t.id)} onCheckedChange={() => toggle(t.id)} className="mt-0.5" />
                <div className="min-w-0">
                  <label htmlFor={`task-${t.id}`} className={`block cursor-pointer text-[12px] font-medium ${done.includes(t.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {t.label}
                  </label>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
                  <Link to={t.route} className="exec-link text-[10.5px] uppercase tracking-[0.14em] text-trading-gold/90">Open</Link>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/70">Completion is stored on this device only. Nothing is executed or approved.</p>
        </ExecCard>

        <div className="space-y-3">
          <SectionTitle icon={LineChartIcon} title="Live Metrics" hint="Auto-refreshing institutional readings. Presentation only — every figure is owned by its source engine." />
          <ExecMetricGrid cols={5}>
            {metrics.map((m) => (
              <Link key={m.key} to={m.route} className="exec-link rounded-xl">
                <ExecMetric label={m.label} value={`${m.value}${m.suffix ?? ''}`} hint={m.hint} status={toExecStatus(m.tone)} size="sm" />
              </Link>
            ))}
          </ExecMetricGrid>
          <ExecCard>
            <ExecCardHeader title="Institution health · 21 days" icon={Activity} hint="Health · readiness · confidence" />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mcHealth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--trading-gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="health" stroke="hsl(var(--trading-gold))" fill="url(#mcHealth)" strokeWidth={2} />
                  <Area type="monotone" dataKey="readiness" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="confidence" stroke="hsl(var(--primary))" fill="transparent" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </div>
      </section>

      {/* ── Current mission + timeline ──────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <ExecCard className="space-y-3">
          <ExecCardHeader title="Current Mission" icon={Target} hint={mission.name} />
          <div className="flex items-end justify-between">
            <p className="font-mono text-3xl font-semibold tabular-nums text-trading-gold">{mission.progress}%</p>
            <p className="text-[11px] text-muted-foreground">Week {mission.week} · {mission.daysRemaining} days remaining</p>
          </div>
          <Progress value={mission.progress} className="h-1.5" />
          <ul className="space-y-1.5 border-t border-border/40 pt-2.5">
            {mission.objectives.map((o) => (
              <li key={o} className="exec-measure text-[11.5px] leading-relaxed text-muted-foreground">— {o}</li>
            ))}
          </ul>
        </ExecCard>

        <ExecCard className="space-y-3">
          <ExecCardHeader title="Mission Timeline" icon={Compass} hint="Completed milestones turn gold" />
          <ol className="flex flex-wrap gap-2 sm:flex-nowrap">
            {milestones.map((m) => (
              <li key={m.days} className={`flex-1 rounded-lg border p-2.5 ${
                m.state === 'achieved' ? 'border-trading-gold/50 bg-trading-gold/10'
                  : m.state === 'in-progress' ? 'border-trading-gold/30 bg-trading-gold/[0.04] animate-pulse'
                  : 'border-border/40 bg-muted/10'}`}>
                <p className={`text-[11.5px] font-semibold ${m.state === 'locked' ? 'text-muted-foreground' : 'text-trading-gold'}`}>{m.label}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{m.certification}</p>
                <p className="mt-1.5 font-mono text-[11px] tabular-nums text-foreground">{m.progress}%</p>
                <p className="text-[10px] text-muted-foreground/80">{m.eta}</p>
              </li>
            ))}
          </ol>
          <p className="exec-measure text-[11px] leading-relaxed text-muted-foreground">
            Next milestone — {milestones.find((m) => m.state !== 'achieved')?.requirement ?? 'All milestones achieved.'}
          </p>
        </ExecCard>
      </section>

      {/* ── Institution pulse ───────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Waves} title="Institution Pulse" hint="Each department breathes independently — healthy, warning or critical." />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {pulseSignals.map((s) => (
            <Link key={s.key} to={s.route} className="exec-link">
              <ExecCard interactive className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="relative flex h-3 w-3" aria-hidden="true">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                    s.tone === 'healthy' ? 'bg-exec-healthy' : s.tone === 'watch' ? 'bg-exec-watch' : s.tone === 'warning' ? 'bg-exec-warning' : 'bg-exec-critical'}`} />
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${
                    s.tone === 'healthy' ? 'bg-exec-healthy' : s.tone === 'watch' ? 'bg-exec-watch' : s.tone === 'warning' ? 'bg-exec-warning' : 'bg-exec-critical'}`} />
                </span>
                <p className="text-[11.5px] font-medium text-foreground">{s.name}</p>
                <p className="font-mono text-[13px] tabular-nums text-trading-gold">{s.health}</p>
              </ExecCard>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Radar / production / portfolio ──────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ExecCard className="space-y-3">
          <ExecCardHeader title="Decision Radar" icon={Radar} hint="Executive Decision Centre" />
          <div className="grid grid-cols-2 gap-2">
            {radar.map((r) => (
              <Link key={r.key} to="/decision-centre" className="exec-link rounded-lg border border-border/40 p-2.5 hover:border-trading-gold/40">
                <p className="font-mono text-xl font-semibold tabular-nums text-trading-gold">{r.value}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{r.label}</p>
              </Link>
            ))}
          </div>
        </ExecCard>

        <ExecCard className="space-y-3">
          <ExecCardHeader title="Production Monitor" icon={Gauge} hint="Advisory only" />
          <div className="flex items-end justify-between">
            <p className="font-mono text-3xl font-semibold tabular-nums text-trading-gold">{production.score}%</p>
            <ExecStatusPill status="critical" label="Not authorised" />
          </div>
          <Progress value={production.score} className="h-1.5" />
          <dl className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div><dt>Passed</dt><dd className="font-mono text-[13px] tabular-nums text-exec-healthy">{production.passed}</dd></div>
            <div><dt>Blocked</dt><dd className="font-mono text-[13px] tabular-nums text-exec-critical">{production.blocked}</dd></div>
            <div><dt>Approvals</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{production.approvals}</dd></div>
          </dl>
          <ul className="space-y-1 border-t border-border/40 pt-2">
            {production.blockers.map((b) => (
              <li key={b.title} className="exec-measure text-[11px] leading-relaxed text-muted-foreground">— {b.title}</li>
            ))}
          </ul>
          <Link to="/production-readiness" className="exec-link text-[10.5px] uppercase tracking-[0.14em] text-trading-gold">Open readiness centre</Link>
        </ExecCard>

        <ExecCard className="space-y-3">
          <ExecCardHeader title="Portfolio Monitor" icon={LineChartIcon} hint="Simulation only" />
          <p className="text-[13px] font-semibold tracking-tight text-foreground">{portfolio.champion}</p>
          <p className="text-[11px] text-muted-foreground">{portfolio.forward}</p>
          <dl className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div><dt>Stability</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{portfolio.stability}</dd></div>
            <div><dt>Drawdown</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{portfolio.drawdown}%</dd></div>
            <div><dt>Win rate</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{portfolio.winRate}%</dd></div>
            <div><dt>Confidence</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{portfolio.confidence}</dd></div>
          </dl>
          <Link to="/forward-validation" className="exec-link text-[10.5px] uppercase tracking-[0.14em] text-trading-gold">Open forward validation</Link>
        </ExecCard>
      </section>

      {/* ── Memory + Oracle + insights ──────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <ExecCard className="space-y-3">
          <ExecCardHeader title="Institutional Memory" icon={Landmark} hint={`${memory.stats.total} records`} />
          <dl className="grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <div><dt>Recorded</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{memory.stats.recorded}</dd></div>
            <div><dt>Citations</dt><dd className="font-mono text-[13px] tabular-nums text-foreground">{memory.stats.citations}</dd></div>
            <div><dt>Cited</dt><dd className="font-mono text-[13px] tabular-nums text-trading-gold">{memory.stats.citationRate}%</dd></div>
          </dl>
          <ul className="space-y-1.5 border-t border-border/40 pt-2">
            {memory.newest.map((r) => (
              <li key={r.id}>
                <p className="text-[11.5px] font-medium text-foreground">{r.title}</p>
                <p className="text-[10.5px] text-muted-foreground">{r.department} · {r.date}</p>
              </li>
            ))}
          </ul>
          <Link to="/institution/memory" className="exec-link text-[10.5px] uppercase tracking-[0.14em] text-trading-gold">Open the ledger</Link>
        </ExecCard>

        <ExecCard className="space-y-3">
          <ExecCardHeader title="Oracle Live" icon={Sparkles} hint={`${oracle.confidence.overall}% confidence`} />
          <p className="text-[11.5px] font-medium text-foreground">{oracle.resolvedQuestion}</p>
          <ul className="space-y-1.5">
            {oracle.summary.slice(0, 3).map((s, i) => (
              <li key={i} className="exec-measure text-[11.5px] leading-relaxed text-muted-foreground">{s}</li>
            ))}
          </ul>
          <p className="text-[10.5px] text-muted-foreground/80">
            Evidence strength {oracle.confidence.evidenceStrength}% · {oracle.focusIds.length} supporting object(s)
          </p>
          <Button asChild size="sm" variant="outline" className="h-7 w-full gap-1.5 text-[11px]">
            <Link to="/oracle"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Ask Oracle</Link>
          </Button>
        </ExecCard>

        <ExecCard className="space-y-2.5">
          <ExecCardHeader title="Founder Insights" icon={Target} hint="Generated each morning" />
          <div className="space-y-2 text-[11.5px] leading-relaxed">
            <p><span className="uppercase tracking-[0.14em] text-trading-gold/80">Focus · </span><span className="text-muted-foreground">{insights.focus}</span></p>
            <p><span className="uppercase tracking-[0.14em] text-trading-gold/80">Opportunity · </span><span className="text-muted-foreground">{insights.opportunity}</span></p>
            <p><span className="uppercase tracking-[0.14em] text-trading-gold/80">Biggest risk · </span><span className="text-muted-foreground">{insights.risk}</span></p>
            <p><span className="uppercase tracking-[0.14em] text-trading-gold/80">Greatest strength · </span><span className="text-muted-foreground">{insights.strength}</span></p>
            <p><span className="uppercase tracking-[0.14em] text-trading-gold/80">Recommended action · </span><span className="text-muted-foreground">{insights.action}</span></p>
          </div>
          <blockquote className="border-l-2 border-trading-gold/40 pl-3 text-[11.5px] italic leading-relaxed text-muted-foreground">
            {insights.quote}
          </blockquote>
        </ExecCard>
      </section>

      {/* ── Global search ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Search} title="Global Search" hint="Search research, memory, knowledge, decisions, departments and the timeline." />
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the entire institution…"
            aria-label="Search the institution" className="h-9 pl-9 text-[12px]" />
        </div>
        {query.trim().length >= 2 && (
          <ExecCard className="space-y-1.5">
            {hits.length === 0 && <p className="text-[11.5px] text-muted-foreground">No institutional record matches “{query}”.</p>}
            {hits.map((h, i) => (
              <Link key={`${h.route}-${i}`} to={h.route}
                className="exec-link flex items-start justify-between gap-3 rounded-lg border border-transparent p-2 hover:border-trading-gold/30 hover:bg-trading-gold/[0.04]">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-foreground">{h.label}</p>
                  <p className="truncate text-[10.5px] text-muted-foreground">{h.detail}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[9.5px] uppercase tracking-[0.14em]">{h.group}</Badge>
              </Link>
            ))}
          </ExecCard>
        )}
      </section>

      {/* ── Quick actions ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionTitle icon={Compass} title="Quick Actions" hint="Every institutional surface, one click away." />
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {MISSION_QUICK_ACTIONS.map((a) => (
            <Button key={a.to} asChild variant="outline" className="h-11 justify-between border-trading-gold/25 text-[11.5px] hover:border-trading-gold/50">
              <Link to={a.to}>{a.label} <ArrowRight className="h-3.5 w-3.5 text-trading-gold" aria-hidden="true" /></Link>
            </Button>
          ))}
        </div>
      </section>

      {/* ── Live footer ─────────────────────────────────────────── */}
      <ExecGovernanceFooter badges={[...MISSION_GOVERNANCE, `Uptime ${status.validationDay} days`]} />
    </OsPage>
  );
}
