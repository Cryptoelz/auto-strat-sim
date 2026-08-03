import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { downloadText } from '@/lib/enterprise';
import {
  VALIDATION_VERSION, TEST_COLUMNS, COLUMN_LABELS, STATE_META, TestState,
  moduleMatrix, testSummary, workflowValidation, knowledgeIntegrity,
  performanceSuite, governanceAudit, regressionReport, REGRESSION_KIND_META, acceptanceChecklist,
} from '@/lib/validation';
import {
  RefreshCw, Download, ShieldCheck, Workflow, Network, Gauge, GitCompare, ClipboardCheck, LayoutGrid, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';

const Dot = ({ state }: { state: TestState }) => (
  <span
    title={STATE_META[state].label}
    aria-label={STATE_META[state].label}
    className={`inline-block h-2 w-2 rounded-full ${state === 'pass' ? 'bg-trading-gold' : state === 'warn' ? 'bg-amber-400' : 'bg-rose-400'}`}
  />
);

const Pill = ({ state }: { state: TestState }) => (
  <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${STATE_META[state].className}`}>
    {STATE_META[state].label}
  </Badge>
);

function Section({ icon: Icon, title, blurb, children }: { icon: typeof Gauge; title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/50 bg-card/40 p-4">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        <Icon className="h-3.5 w-3.5 text-trading-gold" aria-hidden="true" /> {title}
      </h2>
      <p className="mt-1 mb-3 max-w-4xl text-[11px] leading-relaxed text-muted-foreground">{blurb}</p>
      {children}
    </section>
  );
}

export default function TestValidationCentre() {
  const [run, setRun] = useState(0);
  const [filter, setFilter] = useState<'all' | TestState>('all');

  const matrix = useMemo(() => moduleMatrix(), [run]);
  const summary = useMemo(() => testSummary(matrix), [matrix]);
  const workflow = useMemo(() => workflowValidation(), [run]);
  const integrity = useMemo(() => knowledgeIntegrity(), [run]);
  const perf = useMemo(() => performanceSuite(), [run]);
  const governance = useMemo(() => governanceAudit(), [run]);
  const regression = useMemo(() => regressionReport(), [run]);
  const acceptance = useMemo(() => acceptanceChecklist(), [run]);

  const visible = filter === 'all' ? matrix : matrix.filter((m) => m.status === filter);

  const exportReport = () => {
    const lines = [
      '# ATLAS OS™ — Test & Validation Centre report',
      '',
      `Generated ${new Date().toISOString()}`,
      VALIDATION_VERSION,
      '',
      '## Executive summary',
      `Platform health ${summary.health} · Launch score ${summary.launchScore} · Readiness ${summary.readiness}`,
      `${summary.modules} modules · ${summary.checks} checks · ${summary.passed} passed · ${summary.warnings} warnings · ${summary.failed} failed · coverage ${summary.coverage}%`,
      summary.verdict,
      '',
      '## Module matrix',
      ...matrix.map((m) => `- ${m.name} (${m.route}) — ${m.status.toUpperCase()} — ${TEST_COLUMNS.map((c) => `${COLUMN_LABELS[c]}:${m.results[c]}`).join(', ')}`),
      '',
      '## Workflow validation',
      ...workflow.steps.map((s) => `- ${s.step} → ${s.linkedTo}: ${s.state.toUpperCase()} — ${s.detail}`),
      '',
      '## Knowledge integrity',
      `Score ${integrity.score} · ${integrity.nodes} nodes · ${integrity.edges} relationships`,
      ...integrity.checks.map((c) => `- ${c.label}: ${c.state.toUpperCase()} (${c.count}) — ${c.detail}`),
      '',
      '## Performance',
      ...perf.map((p) => `- ${p.label}: ${p.measured} (budget ${p.budget}, ${p.state})`),
      '',
      '## Governance audit',
      ...governance.map((g) => `- ${g.rule}: ${g.state.toUpperCase()} — ${g.evidence}`),
      '',
      '## Regression',
      ...regression.map((r) => `- ${r.area}: ${r.previous} → ${r.current} (${r.delta}) — ${REGRESSION_KIND_META[r.kind].label}`),
      '',
      '## Executive acceptance',
      ...acceptance.map((a) => `- ${a.question} ${a.state.toUpperCase()} — ${a.evidence}`),
      '',
      'Observation Only · Research Only · Simulation Only · Read Only.',
    ];
    downloadText('atlas-test-validation-report.md', lines.join('\n'));
  };

  const stats = [
    { label: 'Platform health', value: summary.health, suffix: '' },
    { label: 'Modules tested', value: summary.modules, suffix: '' },
    { label: 'Tests passed', value: summary.passed, suffix: '' },
    { label: 'Tests failed', value: summary.failed, suffix: '' },
    { label: 'Warnings', value: summary.warnings, suffix: '' },
    { label: 'Coverage', value: summary.coverage, suffix: '%' },
    { label: 'Overall readiness', value: summary.readiness, suffix: '' },
    { label: 'Launch score', value: summary.launchScore, suffix: '' },
  ];

  return (
    <OsPage
      title="Test & Validation Centre"
      subtitle="Feature development is frozen. Every module, workflow, relationship and governance rule is verified here before any future development resumes. All checks are read-only observations of simulated institutional state."
      department="Quality Assurance"
      actions={
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setRun((r) => r + 1)}>
            <RefreshCw className="h-3.5 w-3.5" /> Re-run suite
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportReport}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </>
      }
    >
      {/* SECTION 1 — Executive Test Dashboard */}
      <section className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border/50 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <p className={`mt-1 font-mono text-3xl leading-none ${s.label === 'Tests failed' && s.value > 0 ? 'text-rose-400' : s.label === 'Warnings' && s.value > 0 ? 'text-amber-400' : 'text-trading-gold'}`}>
                {s.value}{s.suffix}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-foreground">{summary.verdict}</p>
            <Badge variant="outline" className="border-trading-gold/40 text-[9.5px] uppercase tracking-wider text-trading-gold">{VALIDATION_VERSION}</Badge>
          </div>
          <Progress value={summary.launchScore} className="mt-3 h-1.5" />
        </div>
      </section>

      {/* SECTION 2 — Module Test Matrix */}
      <Section icon={LayoutGrid} title="Module test matrix" blurb="Every registered module is exercised across seven dimensions. A module is only green when all seven checks pass.">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(['all', 'pass', 'warn', 'fail'] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} className="h-6 text-[10px] uppercase tracking-wider" onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${matrix.length})` : `${STATE_META[f].label} (${matrix.filter((m) => m.status === f).length})`}
            </Button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <caption className="sr-only">Module test matrix across load, navigation, search, exports, performance, accessibility and responsive checks</caption>
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-medium">Module</th>
                {TEST_COLUMNS.map((c) => (
                  <th key={c} scope="col" className="pb-2 pr-3 text-center font-medium">{COLUMN_LABELS[c]}</th>
                ))}
                <th scope="col" className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.route} className="border-b border-border/25">
                  <td className="py-2 pr-3 text-xs">
                    <Link to={m.route} className="font-medium text-foreground hover:text-trading-gold">{m.name}</Link>
                    <span className="ml-2 text-[10px] text-muted-foreground">{m.group}</span>
                  </td>
                  {TEST_COLUMNS.map((c) => (
                    <td key={c} className="py-2 pr-3 text-center"><Dot state={m.results[c]} /></td>
                  ))}
                  <td className="py-2"><Pill state={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SECTION 3 — Workflow Validation */}
      <Section icon={Workflow} title="Workflow validation" blurb="The complete institutional workflow is walked end to end. Any step that cannot hand off to the next is highlighted as a broken link.">
        <ol className="space-y-2">
          {workflow.steps.map((s, i) => (
            <li key={s.step} className={`flex flex-wrap items-center gap-3 rounded-md border p-2.5 ${s.state === 'pass' ? 'border-border/40 bg-card/30' : s.state === 'warn' ? 'border-amber-400/40 bg-amber-400/[0.05]' : 'border-rose-400/40 bg-rose-400/[0.05]'}`}>
              <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <Link to={s.route} className="text-xs font-medium text-foreground hover:text-trading-gold">{s.step}</Link>
              <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              <span className="text-[11px] text-muted-foreground">{s.linkedTo}</span>
              <span className="flex-1 text-[11px] leading-relaxed text-muted-foreground">{s.detail}</span>
              <Pill state={s.state} />
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {workflow.intact}/{workflow.steps.length} handoffs intact.{' '}
          {workflow.broken.length ? <span className="text-amber-400">Broken links: {workflow.broken.join(' · ')}</span> : <span className="text-trading-gold">No broken links detected.</span>}
        </p>
      </Section>

      {/* SECTION 4 — Knowledge Integrity */}
      <Section icon={Network} title="Knowledge integrity" blurb={`Structural verification of the institutional knowledge base — ${integrity.nodes} objects and ${integrity.edges} relationships checked. Integrity score ${integrity.score}.`}>
        <div className="grid gap-2 sm:grid-cols-2">
          {integrity.checks.map((c) => (
            <div key={c.label} className="rounded-md border border-border/40 bg-card/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">{c.label}</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{c.count}</span>
                  <Pill state={c.state} />
                </div>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{c.detail}</p>
              {c.items.length > 0 && (
                <p className="mt-1.5 font-mono text-[10px] text-amber-400/90">{c.items.join(' · ')}</p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 5 — Performance */}
      <Section icon={Gauge} title="Performance centre" blurb="Load, search, render, graph, Oracle, report generation and memory measured against enterprise budgets.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <caption className="sr-only">Performance measurements against budgets</caption>
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-medium">Metric</th>
                <th scope="col" className="pb-2 pr-3 text-right font-medium">Measured</th>
                <th scope="col" className="pb-2 pr-3 text-right font-medium">Budget</th>
                <th scope="col" className="pb-2 pr-3 font-medium">Status</th>
                <th scope="col" className="pb-2 font-medium">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {perf.map((p) => (
                <tr key={p.label} className="border-b border-border/25 align-top">
                  <td className="py-2 pr-3 text-xs font-medium text-foreground">{p.label}</td>
                  <td className="py-2 pr-3 text-right font-mono text-xs text-foreground">{p.measured}</td>
                  <td className="py-2 pr-3 text-right font-mono text-[11px] text-muted-foreground">{p.budget}</td>
                  <td className="py-2 pr-3"><Pill state={p.state} /></td>
                  <td className="py-2 text-[11px] leading-relaxed text-muted-foreground">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* SECTION 6 — Governance */}
      <Section icon={ShieldCheck} title="Governance audit" blurb="The eight non-negotiable institutional guarantees, each with the evidence used to verify it.">
        <div className="grid gap-2 sm:grid-cols-2">
          {governance.map((g) => (
            <div key={g.rule} className="flex items-start gap-2.5 rounded-md border border-trading-gold/20 bg-trading-gold/[0.03] p-3">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trading-gold" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-foreground">{g.rule}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{g.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 7 — Regression */}
      <Section icon={GitCompare} title="Regression testing" blurb="Every platform update is compared against the previous validated version. New failures and performance regressions block the resumption of feature work.">
        <div className="grid gap-2 sm:grid-cols-2">
          {regression.map((r) => {
            const meta = REGRESSION_KIND_META[r.kind];
            return (
              <div key={r.area} className={`rounded-md border p-3 ${meta.tone === 'fail' ? 'border-rose-400/40 bg-rose-400/[0.05]' : meta.tone === 'warn' ? 'border-amber-400/40 bg-amber-400/[0.05]' : 'border-border/40 bg-card/30'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{r.area}</p>
                  <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${STATE_META[meta.tone].className}`}>{meta.label}</Badge>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{r.previous} → {r.current} <span className="text-foreground">({r.delta})</span></p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* SECTION 8 — Executive acceptance */}
      <Section icon={ClipboardCheck} title="Executive acceptance" blurb="The five questions an executive sponsor must be able to answer yes to before ATLAS OS™ is accepted as enterprise-grade.">
        <ul className="space-y-2">
          {acceptance.map((a) => (
            <li key={a.question} className="flex items-start gap-2.5 rounded-md border border-border/40 bg-card/30 p-3">
              {a.state === 'pass'
                ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trading-gold" aria-hidden="true" />
                : a.state === 'warn'
                  ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                  : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />}
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{a.question}</p>
                  <Link to={a.route} className="text-[10px] uppercase tracking-wider text-trading-gold hover:underline">Verify</Link>
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{a.evidence}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'No Live Trading', 'No Exchange Connectivity', 'No API Keys'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
