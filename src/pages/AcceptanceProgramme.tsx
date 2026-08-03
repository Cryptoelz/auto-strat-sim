import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { downloadText } from '@/lib/enterprise';
import {
  ACCEPTANCE_VERSION, READINESS_CARDS, OVERALL_READINESS, STATUS_BOARD, BOARD_SUMMARY,
  CROSS_MODULE_CHAIN, CHAIN_SUMMARY, INSTITUTION_HEALTH, RELEASE_CHECKLIST, CHECKLIST_SUMMARY,
  RELEASE_SCORE, FINAL_RECOMMENDATION, RECOMMENDATION_LADDER, ACCEPTANCE_TIMELINE,
  ACCEPTANCE_GOVERNANCE, GOVERNANCE_NOTE, fmt,
  buildExecutiveReleaseReport, buildReadinessReport, buildCertificationSummary,
  buildAcceptanceAudit, buildHealthReport, buildEnterprisePack,
  type AcceptState, type Trend,
} from '@/lib/acceptance';
import {
  ShieldCheck, Download, CheckCircle2, AlertTriangle, XCircle, ArrowRight, TrendingUp,
  Minus, TrendingDown, Gauge, Network, ClipboardCheck, Award, Landmark, ScrollText, Lock, Activity,
} from 'lucide-react';

const STATE_CLS: Record<AcceptState, string> = {
  PASS: 'text-trading-gold border-trading-gold/40',
  WARNING: 'text-amber-400 border-amber-400/40',
  FAIL: 'text-rose-400 border-rose-400/40',
};
const STATE_ICON: Record<AcceptState, typeof CheckCircle2> = {
  PASS: CheckCircle2, WARNING: AlertTriangle, FAIL: XCircle,
};

function StatePill({ state }: { state: AcceptState }) {
  const Icon = STATE_ICON[state];
  return (
    <Badge variant="outline" className={`gap-1 text-[9.5px] uppercase tracking-wider ${STATE_CLS[state]}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {state}
    </Badge>
  );
}

function TrendMark({ trend, delta }: { trend: Trend; delta: number }) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const cls = trend === 'up' ? 'text-trading-gold' : trend === 'down' ? 'text-rose-400' : 'text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${cls}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {delta === 0 ? 'stable' : `${delta > 0 ? '+' : ''}${delta} pts / 7d`}
    </span>
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

function ScoreRing({ percent, grade }: { percent: number; grade: string }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" role="img" aria-label={`Enterprise release score ${percent}`}>
      <circle cx="75" cy="75" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
      <circle
        cx="75" cy="75" r={r} fill="none" strokeWidth="12" strokeLinecap="round"
        className="stroke-trading-gold" strokeDasharray={circ} strokeDashoffset={circ * (1 - percent / 100)}
        transform="rotate(-90 75 75)"
      />
      <text x="75" y="68" textAnchor="middle" className="fill-muted-foreground text-[10px]">Release score</text>
      <text x="75" y="94" textAnchor="middle" className="fill-foreground text-[28px] font-bold">{percent}</text>
      <text x="75" y="112" textAnchor="middle" className="fill-trading-gold text-[10px] uppercase tracking-widest">{grade}</text>
    </svg>
  );
}

const EXPORTS: Array<[string, string, () => string]> = [
  ['Executive Release Report', 'atlas-executive-release-report.md', buildExecutiveReleaseReport],
  ['Institution Readiness Report', 'atlas-institution-readiness.md', buildReadinessReport],
  ['Certification Summary', 'atlas-certification-summary.md', buildCertificationSummary],
  ['Acceptance Audit', 'atlas-acceptance-audit.md', buildAcceptanceAudit],
  ['Institution Health Report', 'atlas-institution-health.md', buildHealthReport],
  ['Complete Enterprise Pack', 'atlas-enterprise-pack.md', buildEnterprisePack],
];

export default function AcceptanceProgramme() {
  return (
    <OsPage
      title="Institutional Acceptance Programme™"
      subtitle="Enterprise-wide certification before institutional release."
      department="Governance Office · ATLAS OS™ v7.0"
      actions={
        <Badge variant="outline" className="h-7 gap-1.5 border-trading-gold/40 text-[10px] uppercase tracking-widest text-trading-gold">
          <Lock className="h-3 w-3" aria-hidden="true" /> Read Only
        </Badge>
      }
    >
      {/* Executive readiness */}
      <Section
        icon={Gauge}
        title="Executive Readiness"
        blurb="Eight enterprise pillars scored deterministically from the Institutional Knowledge Graph, plus the weighted overall readiness figure."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...READINESS_CARDS, OVERALL_READINESS].map((c) => (
            <div
              key={c.id}
              className={`rounded-lg border p-3 ${c.id === 'overall' ? 'border-trading-gold/40 bg-trading-gold/[0.06]' : 'border-border/50 bg-background/40'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{c.label}</p>
                <StatePill state={c.status} />
              </div>
              <p className="mt-2 font-mono text-3xl leading-none text-foreground">{c.percent}%</p>
              <Progress value={c.percent} className="mt-2 h-1.5" />
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <TrendMark trend={c.trend} delta={c.delta} />
                <span>Confidence {c.confidence}%</span>
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{c.note}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">Source: {c.source}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Status board */}
      <Section
        icon={Landmark}
        title="Institution Status Board"
        blurb={`${BOARD_SUMMARY.modules} modules · ${BOARD_SUMMARY.certified} certified · ${BOARD_SUMMARY.validated} validated · ${BOARD_SUMMARY.warnings} warnings · ${BOARD_SUMMARY.openIssues} open issues · ${BOARD_SUMMARY.coverage}% average coverage.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-[11px]">
            <thead>
              <tr className="border-b border-border/60 text-left text-[9.5px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Module</th>
                <th className="py-2 pr-3 font-medium">Certified</th>
                <th className="py-2 pr-3 font-medium">Validated</th>
                <th className="py-2 pr-3 font-medium">Warnings</th>
                <th className="py-2 pr-3 font-medium">Open issues</th>
                <th className="py-2 pr-3 font-medium">Coverage</th>
                <th className="py-2 pr-3 font-medium">Evidence</th>
                <th className="py-2 pr-3 font-medium">Last tested</th>
                <th className="py-2 pr-3 font-medium">Owner department</th>
              </tr>
            </thead>
            <tbody>
              {STATUS_BOARD.map((r) => (
                <tr key={r.module} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-3">
                    <Link to={r.route} className="text-foreground underline-offset-2 hover:text-trading-gold hover:underline">
                      {r.module}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    <StatePill state={r.certified ? 'PASS' : 'WARNING'} />
                  </td>
                  <td className="py-2 pr-3">
                    <StatePill state={r.validated ? 'PASS' : 'FAIL'} />
                  </td>
                  <td className={`py-2 pr-3 font-mono ${r.warnings > 1 ? 'text-amber-400' : 'text-muted-foreground'}`}>{r.warnings}</td>
                  <td className={`py-2 pr-3 font-mono ${r.openIssues > 0 ? 'text-rose-400' : 'text-muted-foreground'}`}>{r.openIssues}</td>
                  <td className="py-2 pr-3 font-mono text-foreground">{r.coverage}%</td>
                  <td className="py-2 pr-3 font-mono text-trading-gold">{r.evidence}</td>
                  <td className="py-2 pr-3 font-mono text-muted-foreground">{fmt(r.lastTested)}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{r.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Cross module validation */}
      <Section
        icon={Network}
        title="Cross Module Validation"
        blurb={`${CHAIN_SUMMARY.passed} of ${CHAIN_SUMMARY.links} institutional links pass, traversing ${CHAIN_SUMMARY.relationships} graph relationships end to end.`}
      >
        <ol className="space-y-2">
          {CROSS_MODULE_CHAIN.map((l) => (
            <li key={`${l.from}-${l.to}`} className="rounded-md border border-border/40 bg-background/40 p-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link to={l.fromRoute} className="text-[11px] font-medium text-foreground hover:text-trading-gold">{l.from}</Link>
                <ArrowRight className="h-3 w-3 text-trading-gold" aria-hidden="true" />
                <Link to={l.toRoute} className="text-[11px] font-medium text-foreground hover:text-trading-gold">{l.to}</Link>
                <StatePill state={l.state} />
                <span className="font-mono text-[10px] text-muted-foreground">{l.relationships} relationships</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">{fmt(l.checkedAt)}</span>
              </div>
              <p className="mt-1 text-[10.5px] text-muted-foreground">{l.evidence}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Institution health */}
      <Section
        icon={Activity}
        title="Institution Health"
        blurb="Seven health dimensions captured from the live institutional record. Each links to its owning module for verification."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INSTITUTION_HEALTH.map((x) => (
            <Link
              key={x.id}
              to={x.route}
              className="rounded-lg border border-border/50 bg-background/40 p-3 transition-colors hover:border-trading-gold/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{x.label}</p>
                <StatePill state={x.state} />
              </div>
              <p className="mt-1.5 font-mono text-2xl leading-none text-foreground">{x.score}</p>
              <Progress value={x.score} className="mt-2 h-1.5" />
              <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{x.driver}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* Release checklist */}
      <Section
        icon={ClipboardCheck}
        title="Release Checklist"
        blurb={`${CHECKLIST_SUMMARY.pass} pass · ${CHECKLIST_SUMMARY.warning} warning · ${CHECKLIST_SUMMARY.fail} fail across ${CHECKLIST_SUMMARY.total} executive checks.`}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {RELEASE_CHECKLIST.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 rounded-md border border-border/40 bg-background/40 p-2.5">
              <StatePill state={c.state} />
              <div className="min-w-0">
                <Link to={c.route} className="text-[11px] font-medium text-foreground hover:text-trading-gold">{c.label}</Link>
                <p className="text-[10.5px] leading-relaxed text-muted-foreground">{c.detail}</p>
                <p className="mt-0.5 font-mono text-[9.5px] text-muted-foreground/70">{fmt(c.checkedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Enterprise release score */}
      <Section
        icon={Award}
        title="Enterprise Release Score"
        blurb="Weighted composite of readiness, health, checklist, coverage and cross-module integrity."
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing percent={RELEASE_SCORE.overall} grade={RELEASE_SCORE.grade} />
            <div className="space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Institution Ready</p>
                <p className={`font-mono text-3xl leading-none ${RELEASE_SCORE.ready ? 'text-trading-gold' : 'text-amber-400'}`}>
                  {RELEASE_SCORE.ready ? 'YES' : 'NO'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Readiness</p>
                <p className="font-mono text-xl leading-none text-foreground">{RELEASE_SCORE.readiness}%</p>
              </div>
              <div className="flex gap-1.5">
                {(['Bronze', 'Silver', 'Gold', 'Platinum'] as const).map((g) => (
                  <Badge
                    key={g}
                    variant="outline"
                    className={`text-[9.5px] uppercase tracking-wider ${g === RELEASE_SCORE.grade ? 'border-trading-gold/60 bg-trading-gold/10 text-trading-gold' : 'border-border/50 text-muted-foreground/60'}`}
                  >
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {RELEASE_SCORE.components.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="text-muted-foreground">{c.label} <span className="text-muted-foreground/60">· weight {c.weight}%</span></span>
                  <span className="font-mono text-foreground">{c.value}</span>
                </div>
                <Progress value={c.value} className="mt-1 h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Final recommendation */}
      <Section
        icon={ShieldCheck}
        title="Final Executive Recommendation"
        blurb="Issued by the Chief Investment Officer department. Advisory only — no action may be taken without recorded human approval."
      >
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/[0.05] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-trading-gold">{FINAL_RECOMMENDATION.level}</p>
            <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">
              Confidence {FINAL_RECOMMENDATION.confidence}%
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {RECOMMENDATION_LADDER.map((l) => (
              <Badge
                key={l}
                variant="outline"
                className={`text-[9.5px] ${l === FINAL_RECOMMENDATION.level ? 'border-trading-gold/60 bg-trading-gold/10 text-trading-gold' : 'border-border/50 text-muted-foreground/60'}`}
              >
                {l}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">Reason. </span>{FINAL_RECOMMENDATION.reason}
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence</p>
              <ul className="mt-1.5 space-y-1.5">
                {FINAL_RECOMMENDATION.evidence.map((e) => (
                  <li key={e.label} className="text-[10.5px] text-muted-foreground">
                    <Link to={e.route} className="text-foreground hover:text-trading-gold">{e.label}</Link> — {e.note}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Dependencies</p>
              <ul className="mt-1.5 space-y-1.5">
                {FINAL_RECOMMENDATION.dependencies.map((d) => (
                  <li key={d.label} className="flex items-start gap-2 text-[10.5px] text-muted-foreground">
                    <StatePill state={d.state} />
                    <span><Link to={d.route} className="text-foreground hover:text-trading-gold">{d.label}</Link> — {d.note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Why not the other levels</p>
            <ul className="mt-1.5 space-y-1">
              {FINAL_RECOMMENDATION.notYet.map((n) => (
                <li key={n.level} className="text-[10.5px] text-muted-foreground">
                  <span className="text-foreground">{n.level}:</span> {n.why}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Timeline */}
      <Section
        icon={ScrollText}
        title="Acceptance Timeline"
        blurb="Append-only record of the acceptance programme. Entries cannot be edited or removed."
      >
        <ol className="space-y-2">
          {ACCEPTANCE_TIMELINE.map((e) => (
            <li key={e.at} className="flex gap-3 rounded-md border border-border/40 bg-background/40 p-2.5">
              <span className="font-mono text-[10px] text-muted-foreground/70">{fmt(e.at)}</span>
              <div className="min-w-0">
                <p className="text-[11px] text-foreground">{e.event} <span className="text-muted-foreground">· {e.actor}</span></p>
                <p className="text-[10.5px] text-muted-foreground">{e.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* Release pack */}
      <Section
        icon={Download}
        title="Enterprise Release Pack"
        blurb="Deterministic markdown exports. Regenerating any pack from the same institutional record produces identical output."
      >
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map(([label, file, build]) => (
            <Button
              key={file}
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-[11px]"
              onClick={() => downloadText(file, build())}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> {label}
            </Button>
          ))}
        </div>
      </Section>

      {/* Governance footer */}
      <footer className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.04] p-4">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-trading-gold">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Governance
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ACCEPTANCE_GOVERNANCE.map((g) => (
            <Badge key={g} variant="outline" className="border-trading-gold/30 text-[9.5px] uppercase tracking-wider text-muted-foreground">
              {g}
            </Badge>
          ))}
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{GOVERNANCE_NOTE}</p>
        <p className="mt-1 font-mono text-[9.5px] text-muted-foreground/60">{ACCEPTANCE_VERSION}</p>
      </footer>
    </OsPage>
  );
}
