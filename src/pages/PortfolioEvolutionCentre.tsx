import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid,
  ExecStatusPill, ExecGovernanceFooter, toExecStatus, STATUS_TEXT,
} from '@/components/executive/ExecUi';
import {
  Landmark, History, Brain, FlaskConical, Users, LineChart as LineIcon,
  BookMarked, ShieldCheck, ScrollText, Telescope, FileCheck2, Ban, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell,
} from 'recharts';
import {
  evolutionHero, evolutionScore, evolutionMilestones, growthSeries,
  iqDrivers, iqNarrative, researchEvolution, specialistEvolution,
  memoryEvolution, governanceEvolution, executiveStory, futureProjection,
  evolutionSummary, STAGES, EVOLUTION_FORBIDDEN, EVOLUTION_VERSION,
} from '@/lib/portfolioEvolution';
import { institutionIQ } from '@/lib/institutionIntelligence';

const CHART_TOOLTIP = {
  contentStyle: {
    fontSize: 11,
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 8,
  },
} as const;

const MILESTONE_TONE = { completed: 'completed', current: 'current', planned: 'planned' } as const;

function SectionNote({ children }: { children: React.ReactNode }) {
  return <p className="exec-measure mt-3 text-[12px] leading-relaxed text-muted-foreground">{children}</p>;
}

function StatRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5">
      <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-trading-gold">{value}</p>
      {hint && <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function PortfolioEvolutionCentre() {
  const hero = useMemo(() => evolutionHero(), []);
  const ev = useMemo(() => evolutionScore(), []);
  const milestones = useMemo(() => evolutionMilestones(), []);
  const growth = useMemo(() => growthSeries(), []);
  const drivers = useMemo(() => iqDrivers(), []);
  const research = useMemo(() => researchEvolution(), []);
  const specialists = useMemo(() => specialistEvolution(), []);
  const memory = useMemo(() => memoryEvolution(), []);
  const governance = useMemo(() => governanceEvolution(), []);
  const story = useMemo(() => executiveStory(), []);
  const projection = useMemo(() => futureProjection(), []);
  const summary = useMemo(() => evolutionSummary(), []);
  const iq = useMemo(() => institutionIQ(), []);

  const [activeMilestone, setActiveMilestone] = useState(milestones.find((m) => m.state === 'current')?.id ?? milestones[0].id);
  const milestone = milestones.find((m) => m.id === activeMilestone) ?? milestones[0];
  const last = growth[growth.length - 1];
  const first = growth[0];

  return (
    <OsPage
      title="Portfolio Evolution™"
      subtitle="The complete history of how the institution has grown, learned, improved and earned confidence over time."
      department="Institutional History"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Portfolio Evolution™' }]}
    >
      {/* ── Executive hero ─────────────────────────────── */}
      <section aria-label="Executive hero" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {hero.map((h) => (
          <Link key={h.key} to={h.route} className="exec-card exec-card-interactive block">
            <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{h.label}</p>
            <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums leading-none text-trading-gold">{h.value}</p>
            <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{h.hint}</p>
          </Link>
        ))}
      </section>

      {/* ── Executive evolution score ──────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Executive Evolution Score" icon={Landmark} hint={EVOLUTION_VERSION} />
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-trading-gold/25 bg-trading-gold/[0.04] p-5">
            <span className="font-mono text-5xl font-semibold tabular-nums leading-none text-trading-gold">{ev.score}</span>
            <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Evolution Score</span>
            <ExecStatusPill status="current" label={ev.stage} className="mt-3" />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {STAGES.map((s, i) => (
                <span
                  key={s}
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] transition-colors duration-150',
                    i < ev.stageIndex && 'border-trading-gold/30 bg-trading-gold/5 text-trading-gold/70',
                    i === ev.stageIndex && 'border-trading-gold bg-trading-gold/15 text-trading-gold',
                    i > ev.stageIndex && 'border-border/50 text-muted-foreground',
                  )}
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="exec-measure text-[13px] leading-relaxed text-foreground">{ev.narrative}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ev.contributions.map((c) => (
                <div key={c.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{c.label}</span>
                    <span className="font-mono text-[12px] tabular-nums text-trading-gold">{c.value}</span>
                  </div>
                  <Progress value={c.value} className="mt-1.5 h-1.5" />
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{c.note} · weight {Math.round(c.weight * 100)}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ExecCard>

      {/* ── Evolution timeline ─────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Evolution Timeline" icon={History} hint={`${milestones.length} recorded milestones`} />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <ol className="exec-scroll relative max-h-[420px] space-y-3 overflow-auto border-l border-trading-gold/25 pl-5">
            {milestones.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setActiveMilestone(m.id)}
                  className={cn(
                    'relative w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-trading-gold/5',
                    m.id === milestone.id && 'bg-trading-gold/10',
                  )}
                >
                  <span
                    className={cn(
                      'absolute -left-[1.72rem] top-3.5 h-2 w-2 rounded-full',
                      m.state === 'planned' ? 'bg-border' : 'bg-trading-gold',
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{m.date}</span>
                    <span className="text-[12.5px] font-semibold text-foreground">{m.title}</span>
                    <ExecStatusPill status={MILESTONE_TONE[m.state]} />
                  </div>
                  <p className="exec-measure mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{m.description}</p>
                </button>
              </li>
            ))}
          </ol>
          <div className="rounded-xl border border-trading-gold/20 bg-trading-gold/[0.03] p-4">
            <p className="text-[9.5px] uppercase tracking-[0.18em] text-trading-gold">Milestone detail</p>
            <h3 className="mt-2 text-[15px] font-semibold text-foreground">{milestone.title}</h3>
            <p className="exec-measure mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{milestone.description}</p>
            <dl className="mt-4 space-y-2.5">
              {[
                ['Date', milestone.date],
                ['Evidence', milestone.evidence],
                ['Related module', milestone.module],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 text-[12px] text-foreground">{v}</dd>
                </div>
              ))}
              <div>
                <dt className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Status</dt>
                <dd className="mt-1"><ExecStatusPill status={MILESTONE_TONE[milestone.state]} /></dd>
              </div>
            </dl>
            <Button asChild size="sm" variant="outline" className="mt-4 h-7 gap-1.5 text-[11px]">
              <Link to={milestone.route}>Open {milestone.module} <ChevronRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </ExecCard>

      {/* ── Knowledge evolution ────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Knowledge Evolution" icon={Brain} hint="Objects · relationships · evidence · memory · confidence · questions · lessons" />
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growth} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="pe-gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--trading-gold))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip {...CHART_TOOLTIP} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="objects" name="Knowledge objects" stroke="hsl(var(--trading-gold))" fill="url(#pe-gold)" strokeWidth={2} />
              <Area type="monotone" dataKey="relationships" name="Relationships" stroke="hsl(var(--primary))" fill="transparent" strokeWidth={1.6} />
              <Area type="monotone" dataKey="evidence" name="Evidence links" stroke="hsl(var(--muted-foreground))" fill="transparent" strokeWidth={1.4} />
              <Area type="monotone" dataKey="memory" name="Memory records" stroke="hsl(var(--accent-foreground))" fill="transparent" strokeWidth={1.4} strokeDasharray="4 3" />
              <Area type="monotone" dataKey="questions" name="Research questions" stroke="hsl(var(--trading-profit))" fill="transparent" strokeWidth={1.4} />
              <Area type="monotone" dataKey="lessons" name="Learning objects" stroke="hsl(var(--trading-warning))" fill="transparent" strokeWidth={1.4} />
              <Area type="monotone" dataKey="confidence" name="Confidence" stroke="hsl(var(--foreground))" fill="transparent" strokeWidth={1.2} strokeDasharray="2 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <SectionNote>
          Knowledge compounded rather than accumulated: relationships grew faster than objects, which is what turns isolated
          results into an institution that can reason across its own history.
        </SectionNote>
      </ExecCard>

      {/* ── Institution IQ ─────────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Institution IQ" icon={Telescope} hint={`${iq.total} · ${iq.band}`} />
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Line type="monotone" dataKey="iq" name="Institution IQ" stroke="hsl(var(--trading-gold))" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="confidence" name="Confidence" stroke="hsl(var(--muted-foreground))" strokeWidth={1.4} dot={false} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="exec-measure text-[12.5px] leading-relaxed text-foreground">{iqNarrative()}</p>
            <p className="mt-4 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Largest contributing discoveries</p>
            <ul className="mt-2 space-y-2">
              {drivers.map((d) => (
                <li key={d.label} className="flex items-start gap-3">
                  <span className="mt-0.5 w-12 shrink-0 font-mono text-[12px] tabular-nums text-trading-gold">+{d.delta}</span>
                  <span className="min-w-0">
                    <Link to={d.route} className="exec-link text-[12px] font-medium text-foreground hover:text-trading-gold">{d.label}</Link>
                    <span className="block text-[11px] leading-relaxed text-muted-foreground">{d.note}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ExecCard>

      {/* ── Research evolution ─────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Research Evolution" icon={FlaskConical} hint="Questions to specialists" />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <StatRow label="Questions Asked" value={`${research.questionsAsked}`} />
          <StatRow label="Hypotheses Created" value={`${research.hypotheses}`} />
          <StatRow label="Validated" value={`${research.validated}`} />
          <StatRow label="Rejected" value={`${research.rejected}`} hint="Retained permanently as lessons" />
          <StatRow label="Open Research" value={`${research.open}`} />
          <StatRow label="Promotion Candidates" value={`${research.candidates}`} />
          <StatRow label="Specialists Created" value={`${research.specialists}`} />
        </div>
        <div className="mt-5 h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={research.qualityTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis domain={[30, 100]} tick={{ fontSize: 10 }} />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="quality" name="Research quality" stroke="hsl(var(--trading-gold))" fill="url(#pe-gold)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ExecCard>

      {/* ── Specialist evolution ───────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Specialist Evolution" icon={Users} hint="Confidence · growth · performance · contribution · rank" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={specialists} outerRadius="72%">
                <PolarGrid className="stroke-border/50" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 9.5 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Radar name="Confidence" dataKey="confidence" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold))" fillOpacity={0.18} />
                <Radar name="Performance" dataKey="performance" stroke="hsl(var(--primary))" fill="transparent" strokeWidth={1.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="exec-scroll overflow-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="text-left uppercase tracking-[0.14em] text-[9.5px] text-muted-foreground">
                  {['Rank', 'Specialist', 'Confidence', 'Growth', 'Performance', 'Contribution'].map((h) => (
                    <th key={h} className="border-b border-border/50 px-2 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specialists.map((s) => (
                  <tr key={s.name} className="border-b border-border/30">
                    <td className="px-2 py-2 font-mono tabular-nums text-trading-gold">#{s.rank}</td>
                    <td className="px-2 py-2">
                      <Link to={s.route} className="exec-link font-medium text-foreground hover:text-trading-gold">{s.name}</Link>
                    </td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{s.confidence}%</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-exec-healthy">+{s.growth}%</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{s.performance}</td>
                    <td className="px-2 py-2 font-mono tabular-nums text-muted-foreground">{s.contribution}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExecCard>

      {/* ── Portfolio evolution ────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Portfolio Evolution" icon={LineIcon} hint="Long-term institutional trends, not individual trades" />
        <ExecMetricGrid cols={4}>
          <ExecMetric label="Capital Growth" value={`+${(((last.equity - 100000) / 100000) * 100).toFixed(1)}%`} size="sm" status="healthy" hint="Simulated equity since founding" />
          <ExecMetric label="Drawdown Trend" value={`${last.drawdown}%`} size="sm" status="healthy" hint={`Compressed from ${first.drawdown}%`} />
          <ExecMetric label="Win Rate Trend" value={`${last.winRate}%`} size="sm" hint={`From ${first.winRate}%`} />
          <ExecMetric label="Profit Factor Trend" value={`${last.profitFactor}`} size="sm" status="healthy" hint={`From ${first.profitFactor}`} />
          <ExecMetric label="Capture Rate" value={`${last.capture}%`} size="sm" hint="Share of qualifying moves participated in" />
          <ExecMetric label="Portfolio Stability" value={`${last.stability}`} size="sm" hint="Return consistency index" />
          <ExecMetric label="Recovery Speed" value={`${last.recovery} days`} size="sm" hint="Average time to reclaim a drawdown peak" />
          <ExecMetric label="Simulated Equity" value={`$${last.equity.toLocaleString()}`} size="sm" hint="Paper capital only — no live funds" />
        </ExecMetricGrid>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 2000', 'dataMax + 2000']} width={64} />
                <Tooltip {...CHART_TOOLTIP} />
                <Area type="monotone" dataKey="equity" name="Simulated equity" stroke="hsl(var(--trading-gold))" fill="url(#pe-gold)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip {...CHART_TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="profitFactor" name="Profit factor" stroke="hsl(var(--trading-gold))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="drawdown" name="Max drawdown %" stroke="hsl(var(--trading-loss))" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="capture" name="Capture %" stroke="hsl(var(--muted-foreground))" strokeWidth={1.4} dot={false} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </ExecCard>

      {/* ── Memory evolution ───────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Memory Evolution" icon={BookMarked} hint="Permanent institutional recall" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatRow label="Memory Records" value={`${memory.records}`} />
          <StatRow label="Lessons Learned" value={`${memory.lessons}`} />
          <StatRow label="Permanent Knowledge" value={`${memory.permanent}`} hint="Records that can never be overwritten" />
          <StatRow label="Evidence Growth" value={`+${memory.evidenceGrowth}%`} hint="Since founding" />
          <StatRow label="Confidence Trend" value={`+${memory.confidenceTrend} pts`} />
          <StatRow label="Executive Questions Answered" value={`${memory.questionsAnswered}`} />
          <StatRow label="Average Citation Coverage" value={`${memory.citationCoverage}%`} />
          <StatRow label="Institution Recall Score" value={`${memory.recallScore}`} hint="Ability to retrieve the right prior result" />
        </div>
        <SectionNote>
          Memory is the difference between an institution and a script: every lesson above is cited, permanent and available to
          the next research cycle. Open the <Link to="/institution/memory" className="exec-link text-trading-gold">Institutional Memory™</Link> ledger for the underlying records.
        </SectionNote>
      </ExecCard>

      {/* ── Governance evolution ───────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Governance Evolution" icon={ShieldCheck} hint="How control matured over time" />
        <ol className="relative space-y-3 border-l border-trading-gold/25 pl-5">
          {governance.map((g) => (
            <li key={g.label} className="relative">
              <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-trading-gold" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{g.period}</span>
                <Link to={g.route} className="exec-link text-[12.5px] font-semibold text-foreground hover:text-trading-gold">{g.label}</Link>
                <span className="font-mono text-[11px] tabular-nums text-trading-gold">maturity {g.maturity}</span>
              </div>
              <p className="exec-measure mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{g.detail}</p>
              <Progress value={g.maturity} className="mt-2 h-1" />
            </li>
          ))}
        </ol>
      </ExecCard>

      {/* ── Executive story ────────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Executive Story" icon={ScrollText} hint="Annual report narrative" />
        <div className="grid gap-6 lg:grid-cols-2">
          {story.map((s) => (
            <article key={s.heading}>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-trading-gold">{s.heading}</h3>
              <p className="exec-measure mt-2 text-[13px] leading-[1.75] text-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </ExecCard>

      {/* ── Future projection ──────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Future Projection" icon={Telescope} hint="Institutional projection — not a market forecast" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {projection.items.map((p) => (
            <div key={p.label} className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.03] px-3 py-2.5">
              <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{p.label}</p>
              <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-trading-gold">{p.value}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{p.basis}</p>
            </div>
          ))}
        </div>
        <p className="exec-measure mt-4 rounded-md border border-exec-warning/30 bg-exec-warning/5 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
          {projection.caveat}
        </p>
      </ExecCard>

      {/* ── Executive summary ──────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Executive Summary" icon={FileCheck2} hint={EVOLUTION_VERSION} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/50 bg-muted/10 px-3 py-3">
              <p className="text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
              <p className={cn('mt-1.5 text-[12.5px] font-medium leading-snug', STATUS_TEXT[toExecStatus(s.tone)])}>{s.value}</p>
            </div>
          ))}
        </div>
        <SectionNote>
          The institution has learned and improved measurably, but it is not authorised to trade real capital. Promotion remains
          a human decision taken in the <Link to="/decision-centre" className="exec-link text-trading-gold">Executive Decision Centre™</Link> once
          forward validation completes.
        </SectionNote>
      </ExecCard>

      {/* ── Hard limits ────────────────────────────────── */}
      <ExecCard>
        <ExecCardHeader title="Governance Guarantees" icon={Ban} hint="Enforced by architecture" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {EVOLUTION_FORBIDDEN.map((f) => (
            <div key={f} className="rounded-md border border-exec-critical/30 bg-exec-critical/5 px-3 py-2 text-[11.5px] text-muted-foreground">{f}</div>
          ))}
        </div>
      </ExecCard>

      <ExecGovernanceFooter badges={['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required']} />
    </OsPage>
  );
}
