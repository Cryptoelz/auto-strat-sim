import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid,
  ExecStatusPill, ExecGovernanceFooter, toExecStatus, STATUS_TEXT,
} from '@/components/executive/ExecUi';
import {
  ShieldCheck, ListChecks, LockKeyhole, AlertTriangle, ArrowUpRight,
  TrendingUp, Award, MessageSquare, History, Ban, Download, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  readinessSnapshot, productionRisk, productionCertificate, readinessTimeline,
  answerQuestion, EXEC_QUESTIONS, PROMOTION_LADDER, currentLadderStage,
  PRODUCTION_FORBIDDEN, PRODUCTION_PHILOSOPHY, READINESS_TONE,
  type ItemState,
} from '@/lib/productionReadiness';

const STATE_TONE: Record<ItemState, 'healthy' | 'watch' | 'critical'> = {
  pass: 'healthy', pending: 'watch', blocked: 'critical',
};
const STATE_LABEL: Record<ItemState, string> = {
  pass: 'Pass', pending: 'Pending', blocked: 'Blocked',
};

/** Large executive readiness gauge. Presentation only. */
function ReadinessGauge({ score, status }: { score: number; status: string }) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * c;
  const tone = READINESS_TONE[status as keyof typeof READINESS_TONE] ?? 'watch';
  return (
    <div className="relative flex h-[220px] w-[220px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" strokeWidth="10" className="stroke-border/40" />
        <circle
          cx="100" cy="100" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          className={cn('transition-all duration-700', STATUS_TEXT[toExecStatus(tone)])}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="font-mono text-5xl font-semibold tabular-nums leading-none text-trading-gold">{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Readiness</span>
        <ExecStatusPill status={toExecStatus(tone)} label={status} className="mt-1" />
      </div>
    </div>
  );
}

export default function ProductionReadiness() {
  const snap = useMemo(() => readinessSnapshot(), []);
  const risk = useMemo(() => productionRisk(), []);
  const cert = useMemo(() => productionCertificate(snap), [snap]);
  const timeline = useMemo(() => readinessTimeline(), []);
  const [question, setQuestion] = useState<string>(EXEC_QUESTIONS[0]);
  const answer = useMemo(() => answerQuestion(question, snap), [question, snap]);

  const stage = currentLadderStage(snap.status);
  const gatesPassed = snap.gates.filter((g) => g.state === 'pass').length;

  const exportCertificate = () => {
    const lines = [
      'ATLAS OS — Production Readiness Certificate (Advisory)',
      `Reference: ${cert.reference}`,
      `Issued: ${cert.issued}`,
      '',
      `Overall: ${cert.overall}`,
      `Governance: ${cert.governance}`,
      `Research: ${cert.research}`,
      `Operational: ${cert.operational}`,
      `Institution: ${cert.institution}`,
      '',
      `Approval: ${cert.approval}`,
      ...cert.signatories.map((s) => `${s.body}: ${s.state}`),
      '',
      cert.statement,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OsPage
      title="Production Readiness Centre™"
      subtitle="The final governance layer between research mode and real capital. Advisory only — ATLAS never trades, never connects to an exchange and never approves its own promotion."
      department="Governance"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Production Readiness' }]}
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportCertificate}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export certificate
        </Button>
      }
    >
      <div className="exec-stack space-y-8">

        {/* ── Readiness score ── */}
        <section className="space-y-4">
          <ExecCard className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch">
            <ReadinessGauge score={snap.score} status={snap.status} />
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
                  Is ATLAS authorised to trade real capital today?
                </h2>
                <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-muted-foreground">
                  Not yet. Only {gatesPassed} of {snap.gates.length} governance gates are satisfied, and the human executive
                  signature at Gate 9 is outstanding. ATLAS withholds production authorisation until every governance
                  requirement carries evidence and a countersignature.
                </p>
              </div>
              <ExecMetricGrid cols={4}>
                <ExecMetric label="Current readiness" value={`${snap.score}`} suffix="/100" hint="Checklist 55% · Gates 45%" />
                <ExecMetric label="Days stable" value={snap.daysStable} hint="Consecutive days without regression" />
                <ExecMetric label="Last review" value={snap.lastReview} hint="Refreshed from live readings" size="sm" />
                <ExecMetric label="Gates passed" value={`${gatesPassed}/${snap.gates.length}`} hint="Gates 9 and 10 require humans" />
              </ExecMetricGrid>
            </div>
          </ExecCard>

          <ExecCard>
            <ExecCardHeader title="Historical trend" icon={TrendingUp} hint="Trailing 30 days" />
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snap.trend} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--trading-gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={5} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                      borderRadius: 8, fontSize: 11,
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="hsl(var(--trading-gold))" fill="url(#prGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </section>

        {/* ── Checklist ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="Readiness checklist" icon={ListChecks} hint={`${snap.checklist.filter((c) => c.state === 'pass').length}/${snap.checklist.length} passing`} />
            <ul className="divide-y divide-border/40">
              {snap.checklist.map((c) => (
                <li key={c.id} className="grid gap-2 py-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ExecStatusPill status={toExecStatus(STATE_TONE[c.state])} label={STATE_LABEL[c.state]} />
                      <span className="text-sm font-medium text-foreground">{c.label}</span>
                      <span className="font-mono text-[11px] tabular-nums text-trading-gold">{c.score}/100</span>
                    </div>
                    <p className="max-w-[68ch] text-[12px] leading-relaxed text-muted-foreground">{c.reason}</p>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Owner {c.owner} · Last review {c.lastReview}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="h-7 shrink-0 gap-1.5 text-[11px]">
                    <Link to={c.evidence.to}>{c.evidence.label} <ChevronRight className="h-3 w-3" aria-hidden="true" /></Link>
                  </Button>
                </li>
              ))}
            </ul>
          </ExecCard>
        </section>

        {/* ── Governance gates ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="Governance gates" icon={LockKeyhole} hint="All ten must clear before authorisation" />
            <div className="grid gap-3 lg:grid-cols-2">
              {snap.gates.map((g) => (
                <div key={g.id} className="rounded-[var(--exec-radius,10px)] border border-border/50 bg-muted/10 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Gate {g.id}</p>
                      <p className="truncate text-sm font-medium text-foreground">{g.label}</p>
                    </div>
                    <ExecStatusPill status={toExecStatus(STATE_TONE[g.state])} label={STATE_LABEL[g.state]} />
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div><dt className="text-muted-foreground">Requirement</dt><dd className="font-mono text-foreground">{g.requirement}</dd></div>
                    <div><dt className="text-muted-foreground">Evidence reading</dt><dd className="font-mono text-foreground">{g.actual}</dd></div>
                  </dl>
                  <Link to={g.evidence.to} className="exec-link mt-2 inline-flex items-center gap-1 text-[11px] text-trading-gold">
                    {g.evidence.label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </div>
              ))}
            </div>
          </ExecCard>
        </section>

        {/* ── Risk panel ── */}
        <section>
          <ExecCard>
            <ExecCardHeader
              title="Production risk panel"
              icon={ShieldCheck}
              action={<ExecStatusPill status={toExecStatus(risk.tone)} label={`${risk.level} risk`} />}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {risk.readings.map((r) => (
                <div key={r.label} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{r.label}</span>
                    <span className="font-mono text-sm tabular-nums text-trading-gold">{r.value}</span>
                  </div>
                  <Progress value={r.value} className="h-1.5" />
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground">{r.note}</p>
                </div>
              ))}
            </div>
          </ExecCard>
        </section>

        {/* ── Why not ready / what must improve ── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <ExecCard>
            <ExecCardHeader title="Why not ready?" icon={AlertTriangle} hint="Top blocking reasons" />
            <ul className="space-y-3">
              {snap.blockers.map((b, i) => (
                <li key={i} className="space-y-1 border-l-2 border-exec-critical/50 pl-3">
                  <p className="text-[12.5px] font-medium text-foreground">{b.title}</p>
                  <p className="max-w-[68ch] text-[11.5px] leading-relaxed text-muted-foreground">{b.detail}</p>
                  <Link to={b.evidence.to} className="exec-link inline-flex items-center gap-1 text-[11px] text-trading-gold">
                    {b.evidence.label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </ExecCard>

          <ExecCard>
            <ExecCardHeader title="What must improve?" icon={ArrowUpRight} hint="Executive recommendations" />
            <ul className="space-y-3">
              {snap.improvements.map((im, i) => (
                <li key={i} className="space-y-1 border-l-2 border-trading-gold/50 pl-3">
                  <p className="text-[12.5px] font-medium text-foreground">{im.action}</p>
                  <p className="max-w-[68ch] text-[11.5px] leading-relaxed text-muted-foreground">{im.detail}</p>
                  <Link to={im.evidence.to} className="exec-link inline-flex items-center gap-1 text-[11px] text-trading-gold">
                    {im.evidence.label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </ExecCard>
        </section>

        {/* ── Promotion ladder ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="Promotion ladder" icon={TrendingUp} hint={`Current stage: ${PROMOTION_LADDER[stage]}`} />
            <ol className="grid gap-2">
              {PROMOTION_LADDER.map((step, i) => {
                const done = i < stage;
                const current = i === stage;
                return (
                  <li
                    key={step}
                    className={cn(
                      'flex items-center gap-3 rounded-[var(--exec-radius,10px)] border px-3 py-2 transition-colors duration-150',
                      current ? 'border-trading-gold/60 bg-trading-gold/10' : 'border-border/40 bg-muted/5',
                    )}
                  >
                    <span className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px]',
                      done ? 'bg-exec-healthy/20 text-exec-healthy' : current ? 'bg-trading-gold/20 text-trading-gold' : 'bg-muted/30 text-muted-foreground',
                    )}>{i + 1}</span>
                    <span className={cn('text-sm', current ? 'font-semibold text-trading-gold' : done ? 'text-foreground' : 'text-muted-foreground')}>
                      {step}
                    </span>
                    {current && <Badge variant="outline" className="ml-auto text-[10px] uppercase tracking-[0.14em]">Current stage</Badge>}
                    {!done && !current && <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Locked</span>}
                  </li>
                );
              })}
            </ol>
          </ExecCard>
        </section>

        {/* ── Certificate ── */}
        <section>
          <ExecCard className="border-trading-gold/30">
            <ExecCardHeader title="Production certificate" icon={Award} hint={cert.reference} />
            <ExecMetricGrid cols={5}>
              <ExecMetric label="Overall" value={cert.overall} />
              <ExecMetric label="Governance" value={cert.governance} />
              <ExecMetric label="Research" value={cert.research} />
              <ExecMetric label="Operational" value={cert.operational} />
              <ExecMetric label="Institution" value={cert.institution} />
            </ExecMetricGrid>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {cert.signatories.map((s) => (
                <div key={s.body} className="rounded-[var(--exec-radius,10px)] border border-border/50 bg-muted/10 p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Signed by</p>
                  <p className="text-sm font-medium text-foreground">{s.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{s.state}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 max-w-[68ch] text-[11.5px] leading-relaxed text-muted-foreground">{cert.statement}</p>
            <p className="mt-2 text-[11px] font-medium text-trading-gold">Approval: {cert.approval}</p>
          </ExecCard>
        </section>

        {/* ── Executive questions ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="Executive questions" icon={MessageSquare} hint="Advisory answers with evidence" />
            <div className="flex flex-wrap gap-2">
              {EXEC_QUESTIONS.map((q) => (
                <Button
                  key={q}
                  size="sm"
                  variant={q === question ? 'default' : 'outline'}
                  className="h-7 text-[11px]"
                  onClick={() => setQuestion(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
            <div className="mt-4 rounded-[var(--exec-radius,10px)] border border-border/50 bg-muted/10 p-4">
              <p className="max-w-[68ch] text-[13px] leading-relaxed text-foreground">{answer.answer}</p>
              <ul className="mt-3 space-y-1.5">
                {answer.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed text-muted-foreground">
                    <span className="text-trading-gold" aria-hidden="true">·</span>{p}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {answer.links.map((l, i) => (
                  <Button key={`${l.to}-${i}`} asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
                    <Link to={l.to}>{l.label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></Link>
                  </Button>
                ))}
              </div>
            </div>
          </ExecCard>
        </section>

        {/* ── Timeline ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="Readiness timeline" icon={History} hint="Daily, weekly and monthly records" />
            <ol className="space-y-3">
              {timeline.map((e, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      'mt-1 h-2 w-2 rounded-full',
                      e.kind === 'promotion' ? 'bg-exec-healthy'
                        : e.kind === 'failed-gate' ? 'bg-exec-critical'
                          : e.kind === 'review' ? 'bg-trading-gold' : 'bg-muted-foreground',
                    )} aria-hidden="true" />
                    {i < timeline.length - 1 && <span className="w-px flex-1 bg-border/50" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 pb-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{e.date}</p>
                    <p className="text-[12.5px] font-medium text-foreground">{e.title}</p>
                    <p className="max-w-[68ch] text-[11.5px] leading-relaxed text-muted-foreground">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ExecCard>
        </section>

        {/* ── Hard limits ── */}
        <section>
          <ExecCard>
            <ExecCardHeader title="What this module never does" icon={Ban} hint="Enforced by construction" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {PRODUCTION_FORBIDDEN.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Ban className="h-3.5 w-3.5 shrink-0 text-exec-critical" aria-hidden="true" />{f}
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-border/40 pt-3">
              {PRODUCTION_PHILOSOPHY.map((p) => (
                <p key={p} className="text-[12.5px] font-medium text-trading-gold">{p}</p>
              ))}
            </div>
          </ExecCard>
        </section>

        <ExecGovernanceFooter />
      </div>
    </OsPage>
  );
}
