import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid,
  ExecStatusPill, ExecGovernanceFooter, toExecStatus, STATUS_TEXT,
} from '@/components/executive/ExecUi';
import {
  Gavel, AlertTriangle, ListChecks, Scale, History, Ban,
  MessageSquare, ArrowUpRight, Download, ChevronRight, Clock, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import {
  decisionSnapshot, decisionFactors, decisionOptions, decisionScore,
  whyNotReady, whatMustImprove, decisionTimeline, confidenceTrend,
  answerDecisionQuestion, DECISION_QUESTIONS, DECISION_FORBIDDEN,
  DECISION_PHILOSOPHY, DECISION_VERSION, type DecisionState,
} from '@/lib/executiveDecision';

const STATE_TONE: Record<DecisionState, 'healthy' | 'watch' | 'critical'> = {
  pass: 'healthy', pending: 'watch', blocked: 'critical',
};
const STATE_LABEL: Record<DecisionState, string> = {
  pass: 'Pass', pending: 'Pending', blocked: 'Blocked',
};

function VerdictGauge({ score, verdict }: { score: number; verdict: string }) {
  const r = 84;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * c;
  const tone = score >= 80 ? 'healthy' : score >= 60 ? 'watch' : 'critical';
  return (
    <div className="relative flex h-[220px] w-[220px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
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
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Decision Score</span>
        <ExecStatusPill status={toExecStatus(tone)} label={verdict} className="mt-1" />
      </div>
    </div>
  );
}

export default function ExecutiveDecisionCentre() {
  const snap = useMemo(() => decisionSnapshot(), []);
  const factors = useMemo(() => decisionFactors(), []);
  const options = useMemo(() => decisionOptions(), []);
  const score = useMemo(() => decisionScore(factors), [factors]);
  const trend = useMemo(() => confidenceTrend(), []);
  const timeline = useMemo(() => decisionTimeline(), []);
  const improvements = useMemo(() => whatMustImprove(), []);
  const blockers = useMemo(() => whyNotReady(), []);
  const [question, setQuestion] = useState<string>(DECISION_QUESTIONS[0]);
  const answer = useMemo(() => answerDecisionQuestion(question, snap), [question, snap]);

  const exportBrief = () => {
    const lines = [
      'ATLAS OS — Executive Decision Brief (Advisory)',
      `Reference: ${snap.decisionRef}`,
      `Reviewed: ${snap.reviewedOn}`,
      '',
      `Candidate: ${snap.candidate}`,
      `Recommendation: ${snap.recommendation}`,
      `Overall Confidence: ${snap.confidence}%`,
      `Production Readiness: ${snap.productionReadiness}%`,
      `Human Approval: ${snap.humanApproval}`,
      `Decision Deadline: ${snap.deadlineDays} days`,
      '',
      'Why not ready:',
      ...blockers.map((b) => `  - ${b}`),
      '',
      'What must improve:',
      ...improvements.map((i) => `  - ${i.action} (${i.owner}, ${i.by})`),
      '',
      'This brief is advisory only. ATLAS does not trade, connect to exchanges,',
      'change allocations or approve itself. Human authorisation is mandatory.',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snap.decisionRef}-decision-brief.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OsPage
      title="Executive Decision Centre™"
      subtitle="One candidate. One question. Should ATLAS receive real capital today? Advisory only — the signature is always human."
      department="Governance"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Executive Decision Centre™' }]}
      actions={
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportBrief}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> Brief
          </Button>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
            <Link to="/production-readiness"><Scale className="h-3.5 w-3.5" aria-hidden="true" /> Readiness</Link>
          </Button>
        </>
      }
    >
      {/* Verdict */}
      <ExecCard className="flex flex-col items-center gap-6 lg:flex-row lg:items-stretch">
        <VerdictGauge score={score} verdict={snap.recommendation} />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Current Candidate</p>
            <Link to={snap.candidateRoute} className="exec-link inline-flex items-center gap-1.5 text-2xl font-semibold text-foreground hover:text-trading-gold">
              {snap.candidate} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="max-w-[68ch] text-[13px] leading-relaxed text-muted-foreground">{DECISION_PHILOSOPHY}</p>
          </div>
          <ExecMetricGrid cols={5}>
            <ExecMetric label="Recommendation" value={snap.recommendation} status="critical" hint="Advisory verdict" size="sm" />
            <ExecMetric label="Overall Confidence" value={`${snap.confidence}%`} status="healthy" trend="up" hint="Stable across evidence" size="sm" />
            <ExecMetric label="Production Readiness" value={`${snap.productionReadiness}%`} status="watch" hint="Two gates unmet" size="sm" />
            <ExecMetric label="Human Approval" value={snap.humanApproval} status="critical" hint="Cannot be automated" size="sm" />
            <ExecMetric label="Decision Deadline" value={`${snap.deadlineDays} days`} status="watch" hint={`Ref ${snap.decisionRef}`} size="sm" />
          </ExecMetricGrid>
        </div>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        {/* Factors */}
        <ExecCard>
          <ExecCardHeader title="Decision Factors" icon={ListChecks} hint="Weighted evidence" />
          <ul className="space-y-3">
            {factors.map((f) => (
              <li key={f.id} className="rounded-md border border-border/40 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ExecStatusPill status={toExecStatus(STATE_TONE[f.state])} label={STATE_LABEL[f.state]} />
                    <span className="text-[13px] font-medium text-foreground">{f.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Weight {f.weight}%</span>
                    <span className="font-mono tabular-nums text-trading-gold">{f.score}</span>
                    <Link to={f.route} className="exec-link hover:text-trading-gold">Evidence</Link>
                  </div>
                </div>
                <Progress value={f.score} className="mt-2 h-1" />
                <p className="mt-2 max-w-[68ch] text-[11.5px] leading-relaxed text-muted-foreground">{f.evidence}</p>
              </li>
            ))}
          </ul>
        </ExecCard>

        <div className="space-y-4">
          {/* Why not ready */}
          <ExecCard>
            <ExecCardHeader title="Why Not Ready?" icon={AlertTriangle} hint={`${blockers.length} reasons`} />
            <ul className="space-y-2.5">
              {blockers.map((b) => (
                <li key={b} className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-exec-critical" aria-hidden="true" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </ExecCard>

          {/* Trend */}
          <ExecCard>
            <ExecCardHeader title="Confidence vs Readiness" icon={TrendingUp} hint="Last 30 days" />
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                  <Area type="monotone" dataKey="confidence" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold) / 0.15)" strokeWidth={2} />
                  <Area type="monotone" dataKey="readiness" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground) / 0.08)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </div>
      </div>

      {/* Options */}
      <ExecCard>
        <ExecCardHeader title="Decision Options" icon={Gavel} hint="Advisory — requires human selection" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {options.map((o) => (
            <div
              key={o.id}
              className={cn(
                'flex h-full flex-col gap-2 rounded-md border p-3',
                o.recommended ? 'border-trading-gold/50 bg-trading-gold/5' : 'border-border/40',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[13px] font-semibold text-foreground">{o.title}</h3>
                {o.recommended && <ExecStatusPill status="healthy" label="Advised" />}
              </div>
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">{o.summary}</p>
              <p className="mt-auto text-[11px] text-exec-healthy">Upside — {o.upside}</p>
              <p className="text-[11px] text-exec-critical">Risk — {o.risk}</p>
            </div>
          ))}
        </div>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* What must improve */}
        <ExecCard>
          <ExecCardHeader title="What Must Improve" icon={Clock} hint="Owner and horizon" />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-border/40 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Owner</th>
                  <th className="py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {improvements.map((i) => (
                  <tr key={i.action} className="border-b border-border/20 last:border-0">
                    <td className="py-2 pr-3 leading-relaxed text-muted-foreground">{i.action}</td>
                    <td className="py-2 pr-3 whitespace-nowrap text-foreground">{i.owner}</td>
                    <td className="py-2 whitespace-nowrap font-mono tabular-nums text-trading-gold">{i.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExecCard>

        {/* Timeline */}
        <ExecCard>
          <ExecCardHeader title="Decision Timeline" icon={History} hint="Candidate history" />
          <ol className="space-y-3">
            {timeline.map((t) => (
              <li key={t.date} className="flex gap-3">
                <span className="w-14 shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-trading-gold">{t.date}</span>
                <div className="min-w-0 space-y-1">
                  <ExecStatusPill status={toExecStatus(STATE_TONE[t.state])} label={STATE_LABEL[t.state]} />
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{t.event}</p>
                </div>
              </li>
            ))}
          </ol>
        </ExecCard>
      </div>

      {/* Q&A */}
      <ExecCard>
        <ExecCardHeader title="Executive Questions" icon={MessageSquare} hint="Evidence-backed answers" />
        <div className="flex flex-wrap gap-1.5">
          {DECISION_QUESTIONS.map((q) => (
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
        <p className="mt-4 max-w-[68ch] text-[13px] leading-relaxed text-foreground">{answer}</p>
      </ExecCard>

      {/* Hard limits */}
      <ExecCard>
        <ExecCardHeader title="Hard Limits" icon={Ban} hint={DECISION_VERSION} />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DECISION_FORBIDDEN.map((f) => (
            <div key={f} className="rounded-md border border-exec-critical/30 bg-exec-critical/5 px-3 py-2 text-[11.5px] text-muted-foreground">
              {f}
            </div>
          ))}
        </div>
      </ExecCard>

      <ExecGovernanceFooter badges={['Advisory Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required']} />
    </OsPage>
  );
}
