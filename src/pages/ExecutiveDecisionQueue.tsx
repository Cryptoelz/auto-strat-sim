import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid,
  ExecStatusPill, ExecGovernanceFooter, ExecEmptyState, toExecStatus,
} from '@/components/executive/ExecUi';
import {
  Gavel, Scale, ShieldCheck, History, Sparkles, Search, Clock, ArrowUpRight,
  MessageSquare, BookOpen, AlertTriangle, ListChecks, Share2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { toast } from '@/hooks/use-toast';
import {
  decisionQueue, centreSummary, historyStats, institutionalLearning,
  readLedger, appendLedger, QUEUE_STATUS_LABEL, ACTION_LABEL, CENTRE_GOVERNANCE,
  EXEC_QUESTIONS, DECISION_CENTRE_VERSION, OPEN_STATUSES,
  type DecisionItem, type QueueStatus, type ActionKind, type Priority, type DecisionRecord,
} from '@/lib/decisionCentre';

const STATUS_TONE: Record<QueueStatus, string> = {
  waiting: 'watch',
  'needs-evidence': 'warning',
  ready: 'current',
  approved: 'healthy',
  declined: 'critical',
  deferred: 'planned',
};

const PRIORITY_TONE: Record<Priority, string> = { high: 'critical', medium: 'watch', low: 'planned' };
const RISK_TONE = { low: 'healthy', moderate: 'watch', elevated: 'critical' } as const;

const ACTIONS: ActionKind[] = ['approve', 'decline', 'evidence', 'defer', 'archive'];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'exec-chip border text-[11px] uppercase tracking-[0.12em] transition-colors',
        active
          ? 'border-trading-gold/50 bg-trading-gold/10 text-trading-gold'
          : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function waitLabel(h: number) {
  if (h <= 0) return 'Closed';
  if (h < 48) return `${h}h waiting`;
  return `${Math.round(h / 24)}d waiting`;
}

function QueueCard({ d, onOpen }: { d: DecisionItem; onOpen: () => void }) {
  return (
    <ExecCard interactive as="article" className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {d.department} · {d.type} · {d.id}
          </p>
          <h3 className="text-[14px] font-semibold leading-snug tracking-tight text-foreground">{d.title}</h3>
        </div>
        <ExecStatusPill status={toExecStatus(STATUS_TONE[d.status])} label={QUEUE_STATUS_LABEL[d.status]} />
      </div>

      <p className="exec-measure text-[12px] leading-relaxed text-muted-foreground">{d.summary}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:grid-cols-4">
        <div>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Confidence</p>
          <p className="font-mono tabular-nums text-trading-gold">{d.confidence}%</p>
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Evidence</p>
          <p className="font-mono tabular-nums text-foreground">{d.evidenceCount}</p>
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Priority</p>
          <ExecStatusPill status={toExecStatus(PRIORITY_TONE[d.priority])} label={d.priority} />
        </div>
        <div>
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Waiting</p>
          <p className="font-mono tabular-nums text-foreground">{waitLabel(d.waitingHours)}</p>
        </div>
      </div>

      <Progress value={d.confidence} className="h-1" />

      <dl className="space-y-1.5 text-[11.5px] leading-relaxed">
        <div className="flex gap-2">
          <dt className="shrink-0 text-exec-healthy">Benefit</dt>
          <dd className="text-muted-foreground">{d.benefit}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 text-exec-critical">Risk</dt>
          <dd className="text-muted-foreground">{d.risk}</dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          Reviewer · {d.reviewer}
        </span>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={onOpen}>
          Open decision <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </ExecCard>
  );
}

function DecisionDetail({
  d, onAction,
}: { d: DecisionItem; onAction: (a: ActionKind, reason: string, notes: string) => void }) {
  const [question, setQuestion] = useState<string>(EXEC_QUESTIONS[0]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const trend = d.confidenceTrend.map((c, i) => ({ day: `D${(i + 1) * 3}`, confidence: c }));

  return (
    <div className="space-y-5">
      <ExecMetricGrid cols={4}>
        <ExecMetric label="Confidence" value={`${d.confidence}%`} size="sm" hint="ATLAS advisory confidence" />
        <ExecMetric label="Evidence Links" value={d.evidenceCount} size="sm" hint="Traceable citations" />
        <ExecMetric label="Waiting" value={waitLabel(d.waitingHours)} size="sm" hint={`Raised ${d.raisedOn}`} />
        <ExecMetric
          label="Status" value={QUEUE_STATUS_LABEL[d.status]} size="sm"
          status={toExecStatus(STATUS_TONE[d.status])} hint={`Reviewer · ${d.reviewer}`}
        />
      </ExecMetricGrid>

      <ExecCard>
        <ExecCardHeader title="Executive Summary" icon={Gavel} hint={d.type} />
        <p className="exec-measure text-[12.5px] leading-relaxed text-muted-foreground">{d.summary}</p>
        <p className="exec-measure mt-2 text-[12px] leading-relaxed text-muted-foreground/85">{d.background}</p>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecCard>
          <ExecCardHeader title="Evidence Timeline" icon={History} hint={`${d.evidenceTimeline.length} events`} />
          <ol className="space-y-3">
            {d.evidenceTimeline.map((e) => (
              <li key={e.date + e.label} className="border-l border-trading-gold/30 pl-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{e.date}</p>
                <Link to={e.route} className="exec-link text-[12.5px] font-medium text-foreground hover:text-trading-gold">
                  {e.label}
                </Link>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">{e.detail}</p>
              </li>
            ))}
          </ol>
        </ExecCard>

        <div className="space-y-4">
          <ExecCard>
            <ExecCardHeader title="Knowledge Graph Links" icon={Share2} />
            <div className="flex flex-wrap gap-1.5">
              {d.graphLinks.map((g) => (
                <Link key={g.label} to={g.route} className="exec-chip border border-trading-gold/35 bg-trading-gold/5 text-[11px] text-trading-gold">
                  {g.label}
                </Link>
              ))}
            </div>
          </ExecCard>

          <ExecCard>
            <ExecCardHeader title="Supporting Memory" icon={BookOpen} />
            <ul className="space-y-2">
              {d.memory.map((m) => (
                <li key={m.label} className="text-[11.5px] leading-relaxed text-muted-foreground">
                  <span className="font-mono text-trading-gold">{m.label}</span> · {m.detail}
                </li>
              ))}
            </ul>
            <Link to="/institution/memory" className="exec-link mt-3 inline-flex items-center gap-1 text-[11px] text-trading-gold">
              Institutional Memory <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </ExecCard>

          <ExecCard>
            <ExecCardHeader title="Related Research" icon={ListChecks} />
            <div className="flex flex-wrap gap-1.5">
              {d.supportingResearch.map((r) => (
                <Link key={r.route + r.label} to={r.route} className="exec-chip border border-border/50 bg-muted/20 text-[11px] text-muted-foreground hover:text-foreground">
                  {r.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              <span className="uppercase tracking-[0.14em] text-muted-foreground/70">Forward validation · </span>
              {d.forwardValidation}
            </p>
          </ExecCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecCard>
          <ExecCardHeader title="Risk Assessment" icon={AlertTriangle} />
          <ul className="space-y-2.5">
            {d.riskAssessment.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-foreground">{r.label}</p>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">{r.note}</p>
                </div>
                <ExecStatusPill status={toExecStatus(RISK_TONE[r.level])} label={r.level} />
              </li>
            ))}
          </ul>
        </ExecCard>

        <ExecCard>
          <ExecCardHeader title="Counter Arguments" icon={Scale} />
          <ul className="space-y-3">
            {d.counterArguments.map((c) => (
              <li key={c.claim}>
                <p className="text-[12px] font-medium text-foreground">“{c.claim}”</p>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">{c.rebuttal}</p>
              </li>
            ))}
          </ul>
        </ExecCard>
      </div>

      <ExecCard>
        <ExecCardHeader title="Confidence Trend" icon={Clock} hint="Last 30 days" />
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground" />
              <Tooltip contentStyle={{ fontSize: 11, background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="confidence" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold))" fillOpacity={0.12} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ExecCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ExecCard>
          <ExecCardHeader title="Oracle Explanation" icon={Sparkles} />
          <p className="exec-measure text-[12.5px] leading-relaxed text-muted-foreground">{d.oracle}</p>
          <p className="mt-3 rounded-lg border border-trading-gold/25 bg-trading-gold/[0.05] p-3 text-[12.5px] leading-relaxed text-foreground">
            <span className="uppercase tracking-[0.16em] text-trading-gold/80">Institution recommendation · </span>
            {d.recommendation}
          </p>
        </ExecCard>

        <ExecCard>
          <ExecCardHeader title="Executive Questions" icon={MessageSquare} />
          <div className="flex flex-wrap gap-1.5">
            {EXEC_QUESTIONS.map((q) => (
              <Chip key={q} active={q === question} onClick={() => setQuestion(q)}>{q}</Chip>
            ))}
          </div>
          <p className="exec-measure mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {d.answers[question] ?? 'No evidence-backed answer is on file for that question.'}
          </p>
        </ExecCard>
      </div>

      <ExecCard>
        <ExecCardHeader title="Decision Actions" icon={ShieldCheck} hint="Advisory record only — nothing executes" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the decision"
            className="h-9 text-[12px]"
            aria-label="Reason"
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Executive notes (optional)"
            className="min-h-[38px] text-[12px]"
            aria-label="Executive notes"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === 'approve' ? 'default' : 'outline'}
              className="h-7 text-[11px]"
              onClick={() => { onAction(a, reason.trim() || 'No reason recorded', notes.trim()); setReason(''); setNotes(''); }}
            >
              {ACTION_LABEL[a]}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Actions are recorded as advisory governance records with reviewer and timestamp. They never execute,
          never change parameters and never grant production approval.
        </p>
      </ExecCard>
    </div>
  );
}

export default function ExecutiveDecisionCentre() {
  const items = useMemo(() => decisionQueue(), []);
  const summary = useMemo(() => centreSummary(items), [items]);
  const stats = useMemo(() => historyStats(items), [items]);
  const learning = useMemo(() => institutionalLearning(items), [items]);

  const [query, setQuery] = useState('');
  const [dept, setDept] = useState<string>('all');
  const [status, setStatus] = useState<string>('open');
  const [priority, setPriority] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<DecisionRecord[]>(() => readLedger());

  const departments = useMemo(() => ['all', ...stats.departments], [stats.departments]);

  const filtered = useMemo(() => items.filter((d) => {
    if (dept !== 'all' && d.department !== dept) return false;
    if (priority !== 'all' && d.priority !== priority) return false;
    if (status === 'open' && !OPEN_STATUSES.includes(d.status)) return false;
    if (status !== 'open' && status !== 'all' && d.status !== status) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      const hay = [d.title, d.department, d.type, d.summary, d.id, d.reviewer, String(d.confidence), d.raisedOn]
        .join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [items, dept, priority, status, query]);

  const active = items.find((d) => d.id === openId) ?? null;

  const record = (d: DecisionItem, action: ActionKind, reason: string, notes: string) => {
    setLedger(appendLedger({ decisionId: d.id, action, reason, notes, reviewer: d.reviewer }));
    toast({
      title: `${ACTION_LABEL[action]} recorded (advisory)`,
      description: `${d.id} · ${d.title}. No execution, no parameter change.`,
    });
    setOpenId(null);
  };

  return (
    <OsPage
      title="Executive Decision Centre™"
      subtitle="Every important institutional recommendation waiting for executive judgement."
      department="Executive Governance"
      breadcrumbs={[{ label: 'ATLAS OS', to: '/atlas' }, { label: 'Decision Centre' }]}
      actions={
        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
          <Link to="/decision-centre/candidate"><Gavel className="h-3.5 w-3.5" aria-hidden="true" /> Candidate Review</Link>
        </Button>
      }
    >
      <div className="space-y-8">
        {/* Executive summary hero */}
        <section aria-label="Executive summary">
          <ExecMetricGrid cols={4}>
            <ExecMetric label="Open Decisions" value={summary.open} numeric={summary.open} size="lg" hint="Awaiting executive judgement" />
            <ExecMetric label="High Priority" value={summary.highPriority} status={summary.highPriority > 1 ? 'warning' : 'watch'} hint="Escalated to the board" />
            <ExecMetric label="Waiting For Evidence" value={summary.needsEvidence} status="warning" hint="Blocked pending citations" />
            <ExecMetric label="Approved Today" value={summary.approvedToday} status="healthy" hint="Advisory approvals recorded" />
            <ExecMetric label="Declined Today" value={summary.declinedToday} status="critical" hint="Advisory declines recorded" />
            <ExecMetric label="Avg Decision Time" value={`${summary.avgDecisionHours}h`} hint="Raised to resolution" />
            <ExecMetric label="Governance Health" value={`${summary.governanceHealth}%`} status="healthy" hint="Controls passing" />
            <ExecMetric label="Decision Confidence" value={`${summary.decisionConfidence}%`} status={summary.decisionConfidence >= 70 ? 'healthy' : 'watch'} hint="Mean across open queue" />
          </ExecMetricGrid>
        </section>

        {/* Small executive KPI row */}
        <ExecCard>
          <ExecCardHeader title="Executive Dashboard" icon={ShieldCheck} hint={DECISION_CENTRE_VERSION} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ['Pending Decisions', String(summary.open)],
              ['Oldest Waiting', waitLabel(summary.oldestWaitingHours)],
              ['Avg Review Time', `${summary.avgDecisionHours}h`],
              ['High Confidence', String(summary.highConfidence)],
              ['Needs Evidence', String(summary.needsEvidence)],
              ['Ready For Production', String(summary.readyForProduction)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="font-mono text-sm font-semibold leading-none tabular-nums text-trading-gold">{value}</p>
                <p className="mt-1.5 truncate text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </ExecCard>

        {/* Search */}
        <ExecCard>
          <ExecCardHeader title="Search The Queue" icon={Search} hint={`${filtered.length} of ${items.length}`} />
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search department, confidence, evidence, recommendation type, reviewer or date"
                className="h-9 pl-9 text-[12px]"
                aria-label="Search decisions"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {departments.map((x) => (
                <Chip key={x} active={dept === x} onClick={() => setDept(x)}>{x === 'all' ? 'All departments' : x}</Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['open', 'all', 'waiting', 'needs-evidence', 'ready', 'approved', 'declined', 'deferred'].map((s) => (
                <Chip key={s} active={status === s} onClick={() => setStatus(s)}>
                  {s === 'open' ? 'Open' : s === 'all' ? 'All statuses' : QUEUE_STATUS_LABEL[s as QueueStatus]}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'high', 'medium', 'low'].map((p) => (
                <Chip key={p} active={priority === p} onClick={() => setPriority(p)}>{p === 'all' ? 'All priorities' : p}</Chip>
              ))}
            </div>
          </div>
        </ExecCard>

        {/* Decision queue */}
        <section aria-label="Decision queue" className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">Decision Queue</h2>
          {filtered.length === 0 ? (
            <ExecEmptyState
              icon={Gavel}
              title="No decisions match this view"
              description="Adjust the search or filters to review the remaining institutional recommendations."
              secondary="The queue is generated from existing research, governance and maintenance modules."
              actions={[{ label: 'Production Readiness', to: '/production-readiness' }, { label: 'Governance', to: '/governance' }]}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filtered.map((d) => <QueueCard key={d.id} d={d} onOpen={() => setOpenId(d.id)} />)}
            </div>
          )}
        </section>

        {/* Decision history */}
        <ExecCard>
          <ExecCardHeader title="Decision History" icon={History} hint={`${stats.total} recorded`} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
            {[
              ['Approval Rate', `${stats.approvalRate}%`],
              ['Decline Rate', `${stats.declineRate}%`],
              ['Avg Confidence', `${stats.avgConfidence}%`],
              ['Avg Evidence', String(stats.avgEvidence)],
              ['Departments', String(stats.departments.length)],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="font-mono text-sm font-semibold tabular-nums text-trading-gold">{v}</p>
                <p className="mt-1 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-[11.5px]">
              <thead>
                <tr className="border-b border-border/50 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Reference</th>
                  <th className="py-2 pr-3 font-medium">Decision</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Confidence</th>
                  <th className="py-2 pr-3 font-medium">Evidence</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 font-medium">Learning outcome</th>
                </tr>
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id} className="border-b border-border/30 align-top">
                    <td className="py-2 pr-3 font-mono text-[11px] text-muted-foreground">{d.id}</td>
                    <td className="py-2 pr-3">
                      <button type="button" onClick={() => setOpenId(d.id)} className="exec-link text-left text-foreground hover:text-trading-gold">
                        {d.title}
                      </button>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.department}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-trading-gold">{d.confidence}%</td>
                    <td className="py-2 pr-3 font-mono tabular-nums text-muted-foreground">{d.evidenceCount}</td>
                    <td className="py-2 pr-3"><ExecStatusPill status={toExecStatus(STATUS_TONE[d.status])} label={QUEUE_STATUS_LABEL[d.status]} /></td>
                    <td className="py-2 text-muted-foreground">{d.lesson}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExecCard>

        {/* Advisory ledger */}
        <ExecCard>
          <ExecCardHeader title="Executive Action Ledger" icon={Scale} hint="Advisory records, this device only" />
          {ledger.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              No executive actions recorded yet. Open a decision and record approve, decline, request evidence,
              defer or archive — each entry stores the reason, notes, reviewer and timestamp.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {ledger.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/30 pb-2 text-[11.5px]">
                  <span className="font-mono text-trading-gold">{r.decisionId}</span>
                  <span className="font-medium text-foreground">{ACTION_LABEL[r.action]}</span>
                  <span className="text-muted-foreground">{r.reason}</span>
                  {r.notes && <span className="text-muted-foreground/80">— {r.notes}</span>}
                  <span className="ml-auto font-mono text-[10.5px] text-muted-foreground/70">
                    {r.reviewer} · {new Date(r.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ExecCard>

        {/* Institutional learning */}
        <ExecCard>
          <ExecCardHeader title="Institutional Learning" icon={BookOpen} hint="Every decision creates knowledge" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {learning.map((l) => (
              <div key={l.id} className="rounded-lg border border-border/40 bg-muted/10 p-3">
                <p className="font-mono text-[10px] text-muted-foreground">{l.id}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground">{l.lesson}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Memory <span className="font-mono text-trading-gold">{l.memory}</span> · Knowledge {l.knowledge}
                </p>
                <Link to={l.related.route} className="exec-link mt-2 inline-flex items-center gap-1 text-[11px] text-trading-gold">
                  {l.related.label} <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        </ExecCard>

        {/* Governance */}
        <ExecCard>
          <ExecCardHeader title="Governance" icon={ShieldCheck} hint="Permanent constraints" />
          <div className="flex flex-wrap gap-1.5">
            {CENTRE_GOVERNANCE.map((g) => (
              <span key={g} className="rounded-full border border-trading-gold/30 bg-trading-gold/[0.06] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-trading-gold/90">
                {g}
              </span>
            ))}
          </div>
          <p className="exec-measure mt-3 text-[12px] leading-relaxed text-muted-foreground">
            The Decision Centre assembles evidence and states a recommendation. It never executes, never trades,
            never changes parameters, never connects to an exchange and never approves itself. The signature is always human.
          </p>
        </ExecCard>

        <ExecGovernanceFooter badges={CENTRE_GOVERNANCE} />
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[16px] tracking-tight">{active.title}</DialogTitle>
                <DialogDescription className="text-[11.5px]">
                  {active.id} · {active.department} · {active.type} · Reviewer {active.reviewer}
                </DialogDescription>
              </DialogHeader>
              <DecisionDetail d={active} onAction={(a, reason, notes) => record(active, a, reason, notes)} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </OsPage>
  );
}
