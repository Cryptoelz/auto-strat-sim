import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import {
  Award, CheckCircle2, XCircle, AlertTriangle, CircleDashed, Gavel, Lock,
  ShieldCheck, Download, ArrowUpRight, Clock, ScrollText, Users,
} from 'lucide-react';
import {
  CERT_CATEGORIES, CERT_SUMMARY, EXECUTIVE_VERDICT as V, SIGNOFFS, CERT_TIMELINE,
  RISK_SUMMARY, INSTITUTION_RECOMMENDATION, GOVERNANCE_FOOTER,
  categoryStatus, buildCertificationReport, buildEvidenceExport, buildSignoffExport,
  buildAuditTrail, buildFullPack,
  type CertStatus, type SignoffState, type VerdictLevel,
} from '@/lib/allocationCertification';

// ─── Status badge ────────────────────────────────────────────────────
const STATUS_MAP: Record<CertStatus, { cls: string; Icon: typeof CheckCircle2 }> = {
  PASS: { cls: 'text-trading-profit border-trading-profit/40', Icon: CheckCircle2 },
  FAIL: { cls: 'text-trading-loss border-trading-loss/40', Icon: XCircle },
  WARNING: { cls: 'text-trading-warning border-trading-warning/40', Icon: AlertTriangle },
  'NOT TESTED': { cls: 'text-muted-foreground border-border', Icon: CircleDashed },
};

function CertStatusBadge({ status }: { status: CertStatus }) {
  const { cls, Icon } = STATUS_MAP[status];
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] whitespace-nowrap ${cls}`}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {status}
    </Badge>
  );
}

// ─── Verdict tone ────────────────────────────────────────────────────
const VERDICT_TONE: Record<VerdictLevel, { dot: string; text: string }> = {
  'Certified': { dot: '🟢', text: 'text-trading-profit' },
  'Certified With Caveats': { dot: '🟡', text: 'text-trading-warning' },
  'Requires Further Research': { dot: '🟠', text: 'text-trading-warning' },
  'Rejected': { dot: '🔴', text: 'text-trading-loss' },
};

const SIGNOFF_TONE: Record<SignoffState, string> = {
  Approved: 'text-trading-profit border-trading-profit/40',
  Pending: 'text-trading-warning border-trading-warning/40',
  Rejected: 'text-trading-loss border-trading-loss/40',
};

// ─── Progress ring ───────────────────────────────────────────────────
function ProgressRing({ percent }: { percent: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" role="img"
      aria-label={`Certification progress ${percent} percent`}>
      <circle cx="70" cy="70" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
      <circle
        cx="70" cy="70" r={r} fill="none" strokeWidth="12" strokeLinecap="round"
        className="stroke-primary" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="64" textAnchor="middle" className="fill-muted-foreground text-[10px]">Certification</text>
      <text x="70" y="88" textAnchor="middle" className="fill-foreground text-[26px] font-bold">{percent}%</text>
    </svg>
  );
}

// ─── Export helper (client-side, read-only) ──────────────────────────
const download = (filename: string, body: string) => {
  const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── Panel ───────────────────────────────────────────────────────────
export default function CertificationCentre() {
  const tone = VERDICT_TONE[V.overallVerdict];

  const verdictRows: { label: string; value: string; detail?: string; tone?: string }[] = [
    { label: 'Overall Verdict', value: `${tone.dot} ${V.overallVerdict}`, detail: V.verdictBasis, tone: tone.text },
    { label: 'Evidence Score', value: `${V.evidenceScore}/100`, detail: `Weighted across all ${CERT_SUMMARY.total} certification checks.` },
    { label: 'Confidence', value: `${V.confidence}% · ${V.confidenceLabel}`, detail: 'Weakest-link propagation from evidence nodes.' },
    { label: 'Risk Rating', value: V.riskRating, detail: V.riskBasis, tone: 'text-trading-warning' },
    { label: 'Research Quality', value: V.researchQuality, detail: 'Determinism, reproducibility and disclosure all verified.' },
    { label: 'Governance Status', value: V.governanceStatus, detail: 'Observation / Research / Simulation / Read Only enforced.', tone: 'text-trading-profit' },
    { label: 'Human Approval', value: V.humanApproval, detail: 'Research Lead approved. Governance, Executive and Operator pending.', tone: 'text-trading-warning' },
    { label: 'Promotion Status', value: V.promotionStatus, detail: 'No promote or deploy control exists in this module.', tone: 'text-trading-loss' },
    { label: 'Recommendation Status', value: V.recommendationStatus, detail: 'Out-of-sample evidence still accruing.' },
    { label: 'Last Validation', value: V.lastValidation, detail: 'Deterministic run — repeat runs reproduce identical output.' },
    { label: 'Validation Version', value: V.validationVersion },
  ];

  const exports = [
    { label: 'Export Certification Report', file: 'allocation-lab-v1-certification-report.md', build: buildCertificationReport },
    { label: 'Export Validation Evidence', file: 'allocation-lab-v1-validation-evidence.md', build: buildEvidenceExport },
    { label: 'Export Executive Sign-off', file: 'allocation-lab-v1-signoff.md', build: buildSignoffExport },
    { label: 'Export Audit Trail', file: 'allocation-lab-v1-audit-trail.md', build: buildAuditTrail },
    { label: 'Export Full Certification Pack', file: 'allocation-lab-v1-certification-pack.md', build: buildFullPack },
  ];

  return (
    <div className="space-y-4">
      {/* ── Executive Verdict ── */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-sm flex items-center gap-2 text-primary">
              <Award className="h-4 w-4" /> Institutional Certification Centre — Executive Verdict
            </CardTitle>
            <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> Simulation Only · Read Only
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Deterministic certification of Specialist Allocation Lab v1. Every value is sourced from the
            Institutional Knowledge Graph — no generated facts, no editable data.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {verdictRows.map((r) => (
            <div key={r.label} className="rounded-md border bg-card p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{r.label}</div>
              <div className={`text-sm font-semibold mt-0.5 ${r.tone ?? 'text-foreground'}`}>{r.value}</div>
              {r.detail && <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{r.detail}</div>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Certification Progress ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" /> Certification Progress
          </CardTitle>
          <CardDescription className="text-xs">Weighted: PASS 1.0 · WARNING 0.5 · FAIL / NOT TESTED 0.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          <ProgressRing percent={CERT_SUMMARY.percent} />
          <div className="flex-1 w-full space-y-2">
            <div className="text-sm font-semibold">
              {CERT_SUMMARY.completed} / {CERT_SUMMARY.total} checks completed
            </div>
            <div className="text-sm text-muted-foreground">
              {CERT_SUMMARY.pass} / {CERT_SUMMARY.total} passed
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
              {[
                { l: 'PASS', v: CERT_SUMMARY.pass, c: 'text-trading-profit' },
                { l: 'FAIL', v: CERT_SUMMARY.fail, c: 'text-trading-loss' },
                { l: 'WARNING', v: CERT_SUMMARY.warning, c: 'text-trading-warning' },
                { l: 'NOT TESTED', v: CERT_SUMMARY.notTested, c: 'text-muted-foreground' },
              ].map((t) => (
                <div key={t.l} className="rounded-md border bg-card p-2.5">
                  <div className={`text-lg font-bold ${t.c}`}>{t.v}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t.l}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Validation Categories ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> Validation Categories
          </CardTitle>
          <CardDescription className="text-xs">
            12 categories · {CERT_SUMMARY.total} checks. Each check carries status, timestamp, evidence link,
            responsible department, source module and confidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {CERT_CATEGORIES.map((cat) => {
              const st = categoryStatus(cat);
              const passed = cat.checks.filter((x) => x.status === 'PASS').length;
              return (
                <AccordionItem key={cat.id} value={cat.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-3 text-left">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{passed}/{cat.checks.length} passed</span>
                        <CertStatusBadge status={st} />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-muted-foreground mb-3">{cat.purpose}</p>
                    <ul className="space-y-2">
                      {cat.checks.map((chk) => (
                        <li key={chk.id} className="rounded-md border bg-card p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium">
                              <span className="font-mono text-[11px] text-muted-foreground mr-2">{chk.id}</span>
                              {chk.name}
                            </span>
                            <CertStatusBadge status={chk.status} />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{chk.evidence}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground">
                            <span><span className="uppercase tracking-wide">Dept:</span> {chk.department}</span>
                            <span><span className="uppercase tracking-wide">Source:</span> {chk.sourceModule}</span>
                            <span><span className="uppercase tracking-wide">Confidence:</span> {chk.confidence}%</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(chk.timestamp).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
                              })} UTC
                            </span>
                            <Link to={chk.evidenceRoute} className="inline-flex items-center gap-1 text-primary hover:underline">
                              {chk.evidenceRef} <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* ── Executive Sign-off ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Executive Sign-off
          </CardTitle>
          <CardDescription className="text-xs">
            Simulation only — sign-off states are recorded for research governance and confer no authority.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {SIGNOFFS.map((s) => (
            <div key={s.role} className="rounded-md border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold">{s.role}</span>
                <Badge variant="outline" className={`text-[10px] ${SIGNOFF_TONE[s.state]}`}>{s.state}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.owner} · {s.date}</div>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{s.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Certification Timeline ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Certification Timeline
          </CardTitle>
          <CardDescription className="text-xs">Append-only institutional history. Events are never edited or removed.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative border-l border-border pl-5 space-y-4">
            {CERT_TIMELINE.map((e) => (
              <li key={e.event} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 ${
                    e.done ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/50'
                  }`}
                  aria-hidden="true"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold">{e.event}</span>
                  <span className="text-[10px] text-muted-foreground">{e.date}</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{e.department}</Badge>
                  <span className="text-[10px] text-muted-foreground">confidence {e.confidence}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{e.evidence}</p>
                <Link to={e.route} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-0.5">
                  Linked evidence <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* ── Risk Summary ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-trading-warning" /> Risk Summary
          </CardTitle>
          <CardDescription className="text-xs">Every item links back into ATLAS Oracle or the Intelligence Explorer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {RISK_SUMMARY.map((g) => (
            <div key={g.group} className="rounded-md border bg-card p-3">
              <div className={`text-xs font-semibold ${g.tone}`}>{g.group}</div>
              <ul className="mt-2 space-y-2">
                {g.items.map((i) => (
                  <li key={i.title}>
                    <div className="text-[11px] font-medium">{i.title}</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{i.detail}</p>
                    <Link to={i.route} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                      {i.routeLabel} <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Institution Recommendation ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" /> Institution Recommendation
          </CardTitle>
          <CardDescription className="text-xs">
            Active positions are stated with their reasoning, evidence, confidence, counter-evidence and dependencies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {INSTITUTION_RECOMMENDATION.map((r) => (
            <div
              key={r.level}
              className={`rounded-md border p-3 ${r.active ? 'border-primary/40 bg-primary/5' : 'opacity-60'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`text-xs font-semibold ${r.active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {r.level}
                </span>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {r.active ? 'Active' : 'Not applicable'}
                </Badge>
              </div>
              {r.active && (
                <dl className="mt-2 space-y-1.5 text-[11px] leading-relaxed">
                  <div><dt className="inline font-medium">Why: </dt><dd className="inline text-muted-foreground">{r.why}</dd></div>
                  <div><dt className="inline font-medium">Evidence used: </dt><dd className="inline text-muted-foreground">{r.evidenceUsed}</dd></div>
                  <div><dt className="inline font-medium">Confidence: </dt><dd className="inline text-muted-foreground">{r.confidence}%</dd></div>
                  <div><dt className="inline font-medium">Counter evidence: </dt><dd className="inline text-muted-foreground">{r.counterEvidence}</dd></div>
                  <div><dt className="inline font-medium">Dependencies: </dt><dd className="inline text-muted-foreground">{r.dependencies}</dd></div>
                </dl>
              )}
              {!r.active && <p className="text-[11px] text-muted-foreground mt-1.5">{r.why}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Certification Export ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Certification Export
          </CardTitle>
          <CardDescription className="text-xs">Deterministic Markdown artefacts. Exports read state only.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {exports.map((e) => (
            <Button
              key={e.file} variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => download(e.file, e.build())}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> {e.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* ── Governance Footer ── */}
      <Card className="border-trading-warning/30 bg-trading-warning/5">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-trading-warning">
            <Lock className="h-3.5 w-3.5" /> Governance — permanently enforced
          </div>
          <Separator />
          <ul className="flex flex-wrap gap-1.5">
            {GOVERNANCE_FOOTER.map((g) => (
              <li key={g}>
                <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden="true" /> {g}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
