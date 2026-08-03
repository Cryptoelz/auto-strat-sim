import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { downloadText } from '@/lib/enterprise';
import {
  RC_VERSION, RC_SUMMARY, RELEASE_NOTES, CHANGE_LOG, REGRESSION_SUITES, REGRESSION_TOTALS,
  SIGN_OFF, SIGN_OFF_NOTE, KNOWN_ISSUES, ISSUE_COUNTS, RELEASE_HISTORY, MATURITY_STAGES,
  MATURITY_NOTE, RC_GOVERNANCE, RC_GOVERNANCE_NOTE, fmt,
  buildExecutiveReleaseNotes, buildTechnicalReleaseNotes, buildCertificationSummaryRc,
  buildAcceptanceReportRc, buildPlatformHealthReport, buildCompleteReleaseArchive,
  type RcState, type Priority,
} from '@/lib/releaseCandidate';
import {
  Rocket, Download, CheckCircle2, AlertTriangle, XCircle, ScrollText, History, Gauge,
  PenLine, Bug, Package, Archive, Milestone, Lock, ArrowRight, FileText,
} from 'lucide-react';

const STATE_CLS: Record<RcState, string> = {
  PASS: 'text-trading-gold border-trading-gold/40',
  WARNING: 'text-amber-400 border-amber-400/40',
  FAIL: 'text-rose-400 border-rose-400/40',
};
const STATE_ICON: Record<RcState, typeof CheckCircle2> = {
  PASS: CheckCircle2, WARNING: AlertTriangle, FAIL: XCircle,
};
const PRIORITY_CLS: Record<Priority, string> = {
  Low: 'text-muted-foreground border-border/60',
  Medium: 'text-amber-400 border-amber-400/40',
  High: 'text-orange-400 border-orange-400/40',
  Critical: 'text-rose-400 border-rose-400/40',
};

function StatePill({ state }: { state: RcState }) {
  const Icon = STATE_ICON[state];
  return (
    <Badge variant="outline" className={`gap-1 text-[9.5px] uppercase tracking-wider ${STATE_CLS[state]}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {state}
    </Badge>
  );
}

function Section({
  icon: Icon, title, blurb, children,
}: { icon: typeof Gauge; title: string; blurb: string; children: React.ReactNode }) {
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

const EXPORTS: Array<[string, string, () => string]> = [
  ['Executive Release Notes', 'atlas-rc1-executive-release-notes.md', buildExecutiveReleaseNotes],
  ['Technical Release Notes', 'atlas-rc1-technical-release-notes.md', buildTechnicalReleaseNotes],
  ['Certification Summary', 'atlas-rc1-certification-summary.md', buildCertificationSummaryRc],
  ['Acceptance Report', 'atlas-rc1-acceptance-report.md', buildAcceptanceReportRc],
  ['Platform Health Report', 'atlas-rc1-platform-health.md', buildPlatformHealthReport],
  ['Complete Release Archive', 'atlas-rc1-release-archive.md', buildCompleteReleaseArchive],
];

export default function ReleaseCandidateCentre() {
  return (
    <OsPage
      title="Enterprise Release Candidate Centre"
      subtitle="The command centre used before every platform release. Deterministic, append-only, and derived entirely from the Institutional Knowledge Graph."
      department="Enterprise Platform · Release Governance"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"
          onClick={() => downloadText('atlas-rc1-release-archive.md', buildCompleteReleaseArchive())}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Release Archive
        </Button>
      }
    >
      {/* 1 · Summary */}
      <Section icon={Rocket} title="1 · Release Candidate Summary"
        blurb="The identity of this candidate build. Every field is sourced from an upstream institutional record, never authored here.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {RC_SUMMARY.map((f) => (
            <div key={f.label} className="rounded-md border border-border/50 bg-background/40 p-3">
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
              <p className="mt-1 font-mono text-sm text-trading-gold">{f.value}</p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{f.note}</p>
              <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground/60">{f.source}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 2 · Release notes */}
      <Section icon={ScrollText} title="2 · Release Notes"
        blurb="Generated automatically from completed institutional work, grouped by the department that produced it.">
        <div className="grid gap-2 lg:grid-cols-3">
          {RELEASE_NOTES.map((g) => (
            <div key={g.group} className="rounded-md border border-border/50 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-foreground">{g.group}</p>
                <Link to={g.route} className="inline-flex items-center gap-1 text-[10px] text-trading-gold hover:underline">
                  Open <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{g.summary}</p>
              <ul className="mt-2 space-y-1.5">
                {g.items.map((i) => (
                  <li key={i.title} className="border-l border-trading-gold/30 pl-2">
                    <p className="text-[10.5px] text-foreground">{i.title}</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{i.detail}</p>
                    <Link to={i.evidence} className="text-[9.5px] text-trading-gold/80 hover:underline">{i.evidence}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 3 · Change log */}
      <Section icon={History} title="3 · Change Log"
        blurb="Chronological institutional history. Append-only — entries are never edited or removed.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[10.5px]">
            <thead className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/50">
                {['Timestamp', 'Version', 'Feature', 'Reason', 'Evidence', 'Impact', 'Department', 'Approval'].map((h) => (
                  <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANGE_LOG.map((c) => (
                <tr key={c.version} className="border-b border-border/30">
                  <td className="py-1.5 pr-3 font-mono text-muted-foreground">{fmt(c.at)}</td>
                  <td className="py-1.5 pr-3 font-mono text-trading-gold">{c.version}</td>
                  <td className="py-1.5 pr-3 text-foreground">{c.feature}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{c.reason}</td>
                  <td className="py-1.5 pr-3"><Link to={c.evidence} className="text-trading-gold/80 hover:underline">{c.evidence}</Link></td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{c.impact}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{c.department}</td>
                  <td className="py-1.5 pr-3 text-foreground">{c.approval}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4 · Regression */}
      <Section icon={Gauge} title="4 · Regression Snapshot"
        blurb="Deterministic regression executed against the RC1 build. Identical inputs reproduce identical results.">
        <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Tests Run', REGRESSION_TOTALS.run],
            ['Passed', REGRESSION_TOTALS.passed],
            ['Warnings', REGRESSION_TOTALS.warnings],
            ['Failed', REGRESSION_TOTALS.failed],
            ['Coverage', `${REGRESSION_TOTALS.coverage}%`],
            ['Performance', `${REGRESSION_TOTALS.performanceMs} ms`],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-md border border-border/50 bg-background/40 p-3">
              <p className="font-mono text-lg leading-none text-trading-gold">{value}</p>
              <p className="mt-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {REGRESSION_SUITES.map((s) => (
            <div key={s.suite} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border/40 bg-background/30 px-3 py-2">
              <StatePill state={s.state} />
              <span className="min-w-[200px] text-[11px] text-foreground">{s.suite}</span>
              <span className="text-[10px] text-muted-foreground">run {s.run} · passed {s.passed} · warnings {s.warnings} · failed {s.failed}</span>
              <span className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
                <Progress value={s.coverage} className="h-1.5 w-24" /> {s.coverage}% · {s.performanceMs} ms
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* 5 · Sign-off */}
      <Section icon={PenLine} title="5 · Executive Sign-off"
        blurb={SIGN_OFF_NOTE}>
        <div className="grid gap-2 lg:grid-cols-5">
          {SIGN_OFF.map((s) => (
            <div key={s.role} className={`rounded-md border p-3 ${s.state === 'Signed' ? 'border-trading-gold/30 bg-trading-gold/[0.04]' : 'border-amber-400/40 bg-amber-400/[0.04]'}`}>
              <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{s.role}</p>
              <p className="mt-1 text-[11px] text-foreground">{s.signatory}</p>
              <Badge variant="outline" className={`mt-1.5 text-[9.5px] uppercase tracking-wider ${s.state === 'Signed' ? 'border-trading-gold/40 text-trading-gold' : 'border-amber-400/40 text-amber-400'}`}>
                {s.state}
              </Badge>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{s.scope}</p>
              <p className="mt-1 font-mono text-[9.5px] text-muted-foreground/60">{s.signature} · {fmt(s.at)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6 · Known issues */}
      <Section icon={Bug} title="6 · Known Issues"
        blurb="Every remaining warning carried into the candidate, with an evidence link back to the module that raised it.">
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(ISSUE_COUNTS) as Priority[]).map((p) => (
            <Badge key={p} variant="outline" className={`text-[9.5px] uppercase tracking-wider ${PRIORITY_CLS[p]}`}>
              {p}: {ISSUE_COUNTS[p]}
            </Badge>
          ))}
        </div>
        <div className="space-y-1.5">
          {KNOWN_ISSUES.map((i) => (
            <div key={i.id} className="rounded-md border border-border/40 bg-background/30 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${PRIORITY_CLS[i.priority]}`}>{i.priority}</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">{i.id}</span>
                <span className="text-[11px] text-foreground">{i.title}</span>
                <span className="ml-auto text-[9.5px] uppercase tracking-wider text-muted-foreground">{i.area} · target {i.target}</span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{i.detail}</p>
              <p className="mt-1 text-[9.5px] text-muted-foreground">
                Owner {i.owner} · <Link to={i.evidence} className="text-trading-gold/80 hover:underline">evidence {i.evidence}</Link>
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 · Release package */}
      <Section icon={Package} title="7 · Release Package"
        blurb="Deterministic markdown exports. Regenerating any document from the same institutional record produces identical output.">
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map(([label, file, build]) => (
            <Button key={file} size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"
              onClick={() => downloadText(file, build())}>
              <FileText className="h-3.5 w-3.5" aria-hidden="true" /> {label}
            </Button>
          ))}
        </div>
      </Section>

      {/* 8 · Release history */}
      <Section icon={Archive} title="8 · Release History"
        blurb="Every platform release is permanently archived. Nothing is deleted; the record is append-only.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[10.5px]">
            <thead className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/50">
                {['Archived', 'Version', 'Release', 'Grade', 'Score', 'State', 'Note'].map((h) => (
                  <th key={h} className="py-1.5 pr-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RELEASE_HISTORY.map((r) => (
                <tr key={r.version} className={`border-b border-border/30 ${r.state === 'Current' ? 'bg-trading-gold/[0.05]' : ''}`}>
                  <td className="py-1.5 pr-3 font-mono text-muted-foreground">{fmt(r.at)}</td>
                  <td className="py-1.5 pr-3 font-mono text-trading-gold">{r.version}</td>
                  <td className="py-1.5 pr-3 text-foreground">{r.name}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{r.grade}</td>
                  <td className="py-1.5 pr-3 font-mono text-foreground">{r.score}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{r.state}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 9 · Maturity */}
      <Section icon={Milestone} title="9 · Platform Maturity"
        blurb={MATURITY_NOTE}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {MATURITY_STAGES.map((s) => (
            <div key={s.stage}
              className={`rounded-md border p-3 ${s.current
                ? 'border-trading-gold/60 bg-trading-gold/10'
                : s.reached ? 'border-trading-gold/25 bg-background/40' : 'border-border/40 bg-background/20 opacity-70'}`}>
              <p className={`text-[11px] font-semibold ${s.current ? 'text-trading-gold' : 'text-foreground'}`}>{s.stage}</p>
              <Badge variant="outline" className={`mt-1 text-[9px] uppercase tracking-wider ${s.current ? 'border-trading-gold/50 text-trading-gold' : s.reached ? 'border-border/60 text-muted-foreground' : 'border-border/40 text-muted-foreground/70'}`}>
                {s.current ? 'Current stage' : s.reached ? 'Reached' : 'Pending'}
              </Badge>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{s.criteria}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Governance footer */}
      <footer className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.04] p-4">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-trading-gold">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Governance
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RC_GOVERNANCE.map((g) => (
            <Badge key={g} variant="outline" className="border-trading-gold/30 text-[9.5px] uppercase tracking-wider text-muted-foreground">
              {g}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{RC_GOVERNANCE_NOTE}</p>
        <p className="mt-1 font-mono text-[9.5px] text-muted-foreground/60">{RC_VERSION}</p>
      </footer>
    </OsPage>
  );
}
