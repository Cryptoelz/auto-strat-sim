import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive, ArrowRight, Download, FileText, Landmark, Link2, Search, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExecCard, ExecMetric, ExecMetricGrid, ExecGovernanceFooter } from '@/components/executive/ExecUi';

import {
  VAULT_VERSION, VAULT_GOVERNANCE, VAULT_KIND_META, VAULT_EXPORTS,
  DEFAULT_FILTERS, vaultRecords, vaultSummary, vaultInsights, vaultDepartments,
  vaultStatuses, searchVault, chainOfEvidence, downloadExport,
  type VaultRecord, type VaultKind, type VaultFilters,
} from '@/lib/auditVault';
import { cn } from '@/lib/utils';

const KINDS = Object.keys(VAULT_KIND_META) as VaultKind[];

function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Archive; title: string; hint: string }) {
  return (
    <div className="space-y-1">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <Icon className="h-4 w-4 text-trading-gold" aria-hidden="true" /> {title}
      </h2>
      <p className="max-w-[68ch] text-[12px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export default function AuditVault() {
  const records = useMemo(() => vaultRecords(), []);
  const summary = useMemo(() => vaultSummary(records), [records]);
  const insights = useMemo(() => vaultInsights(records), [records]);
  const departments = useMemo(() => vaultDepartments(records), [records]);
  const statuses = useMemo(() => vaultStatuses(records), [records]);

  const [filters, setFilters] = useState<VaultFilters>(DEFAULT_FILTERS);
  const [open, setOpen] = useState<VaultRecord | null>(null);
  const [limit, setLimit] = useState(40);

  const filtered = useMemo(() => searchVault(records, filters), [records, filters]);
  const set = (patch: Partial<VaultFilters>) => { setFilters((f) => ({ ...f, ...patch })); setLimit(40); };

  return (
    <OsPage
      title="Audit Vault™"
      subtitle="The permanent institutional record of every important decision. Every event retains its evidence, reasoning, citations and outcome so it can be reconstructed years later."
      department="Audit Vault™"
      breadcrumbs={[{ label: 'Institution', to: '/institution' }, { label: 'Audit Vault' }]}
      actions={
        <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
          <p className="font-mono text-lg leading-none text-trading-gold">{summary.archived}</p>
          <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Records archived</p>
        </div>
      }
    >
      {/* Executive summary */}
      <section className="space-y-3">
        <SectionTitle icon={ShieldCheck} title="Executive summary" hint="Audit health is the mean of citation coverage, evidence completeness and institutional certification. Advisory only." />
        <ExecMetricGrid cols={4}>
          <ExecMetric label="Audit health" value={summary.auditHealth} numeric={summary.auditHealth} suffix="" hint="Composite of coverage, completeness and certification" />
          <ExecMetric label="Records archived" value={summary.archived} numeric={summary.archived} hint="Immutable institutional events" />
          <ExecMetric label="Citation coverage" value={`${summary.citationCoverage}%`} hint="Records carrying at least one evidence link" />
          <ExecMetric label="Evidence completeness" value={`${summary.evidenceCompleteness}%`} hint="Evidence, reasoning and outcome all present" />
          <ExecMetric label="Executive decisions" value={summary.decisions} numeric={summary.decisions} hint="Human judgements on file" />
          <ExecMetric label="Memory records" value={summary.memoryRecords} numeric={summary.memoryRecords} hint="Institutional Memory™ ledger" />
          <ExecMetric label="Certification status" value={summary.certification} size="sm" hint="Certification Centre verdict" />
          <ExecMetric label="Audit confidence" value={summary.auditConfidence} numeric={summary.auditConfidence} hint="Mean confidence across scored records" />
        </ExecMetricGrid>
      </section>

      {/* Executive search */}
      <section className="space-y-3">
        <SectionTitle icon={Search} title="Executive search" hint="Search by date, department, evidence ID, decision ID, trade ID, memory ID, confidence, status or reviewer." />
        <Card className="border-border/60 bg-card/50 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Search records (e.g. EXP-052, EDC-2026-0147, BTC, 2026-07)"
              className="exec-input h-9 w-full max-w-md text-[12px]"
              aria-label="Search the audit vault"
            />
            <Select value={filters.department} onValueChange={(v) => set({ department: v })}>
              <SelectTrigger className="h-9 w-[190px] text-[12px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger className="h-9 w-[160px] text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(filters.minConfidence)} onValueChange={(v) => set({ minConfidence: Number(v) })}>
              <SelectTrigger className="h-9 w-[170px] text-[12px]"><SelectValue placeholder="Confidence" /></SelectTrigger>
              <SelectContent>
                {[0, 60, 70, 80, 90].map((c) => <SelectItem key={c} value={String(c)}>{c === 0 ? 'Any confidence' : `Confidence ≥ ${c}`}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-9 text-[11.5px]" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset</Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button size="sm" variant={filters.kind === 'all' ? 'default' : 'outline'} className="exec-chip h-7 px-2.5 text-[10.5px]" onClick={() => set({ kind: 'all' })}>All events</Button>
            {KINDS.map((k) => (
              <Button key={k} size="sm" variant={filters.kind === k ? 'default' : 'outline'} className="exec-chip h-7 px-2.5 text-[10.5px]" onClick={() => set({ kind: k })}>
                {VAULT_KIND_META[k].label}
              </Button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground">{filtered.length} records match · showing {Math.min(limit, filtered.length)}</p>
        </Card>
      </section>

      {/* Global timeline */}
      <section className="space-y-3">
        <SectionTitle icon={Landmark} title="Global timeline" hint="Every significant institutional event in chronological order. Select any record to open its full audit trail." />
        <Card className="border-trading-gold/20 bg-card/60 p-5">
          <ol className="relative space-y-2.5 border-l border-trading-gold/25 pl-6">
            {filtered.slice(0, limit).map((r) => (
              <li key={r.id} className="relative">
                <span className={cn('absolute -left-[29px] top-3.5 h-2 w-2 rounded-full',
                  r.kind === 'decision' || r.kind === 'certification' ? 'bg-trading-gold' : 'bg-border')} aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="w-full rounded-md border border-border/40 bg-muted/10 p-3.5 text-left transition-colors hover:border-trading-gold/40 hover:bg-muted/20"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{r.date}</span>
                    <Badge variant="outline" className={cn('exec-badge border-border/50', VAULT_KIND_META[r.kind].tone)}>{VAULT_KIND_META[r.kind].label}</Badge>
                    <span className="text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">{r.department}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/80">{r.id}</span>
                    {typeof r.confidence === 'number' && (
                      <span className="text-[10px] text-muted-foreground">confidence <span className="font-mono text-foreground">{r.confidence}</span></span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[13px] font-medium text-foreground">{r.title}</p>
                  <p className="mt-1 max-w-[80ch] text-[11.5px] leading-relaxed text-muted-foreground">{r.summary}</p>
                  <p className="mt-1.5 text-[10.5px] text-trading-gold">{r.evidence.length} evidence links · open audit record →</p>
                </button>
              </li>
            ))}
          </ol>
          {limit < filtered.length && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" className="h-8 text-[11.5px]" onClick={() => setLimit((l) => l + 40)}>Load 40 more records</Button>
            </div>
          )}
        </Card>
      </section>

      {/* Audit insights */}
      <section className="space-y-3">
        <SectionTitle icon={Sparkles} title="Audit insights" hint="Derived from the archived record set — observation only, no recalculated research." />
        <div className="grid gap-3 lg:grid-cols-3">
          <ExecCard className="p-4 lg:col-span-1">
            <div className="space-y-2.5 text-[12px]">
              {[
                ['Most active department', `${insights.mostActiveDepartment.name} · ${insights.mostActiveDepartment.count} records`],
                ['Most cited evidence', `${insights.mostCitedEvidence.id} · cited ${insights.mostCitedEvidence.count}×`],
                ['Average confidence', `${insights.avgConfidence}`],
                ['Decision turnaround', `${insights.decisionTurnaround} hours`],
                ['Lessons archived', `${insights.lessonsArchived}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-border/30 pb-2 last:border-0">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{k}</span>
                  <span className="font-mono text-[12px] text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </ExecCard>
          <ExecCard className="p-4 lg:col-span-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Evidence growth</p>
            <div className="mt-3 h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.evidenceGrowth}>
                  <defs>
                    <linearGradient id="vaultEvidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--trading-gold))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--trading-gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                  <Area type="monotone" dataKey="evidence" name="Cumulative evidence links" stroke="hsl(var(--trading-gold))" fill="url(#vaultEvidence)" strokeWidth={2} />
                  <Area type="monotone" dataKey="records" name="Cumulative records" stroke="hsl(var(--primary))" fill="none" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ExecCard>
        </div>
      </section>

      {/* Exports */}
      <section className="space-y-3">
        <SectionTitle icon={Download} title="Exports" hint="Deterministic plain-text ledgers assembled from the archive. Advisory documents; they authorise nothing." />
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {VAULT_EXPORTS.map((e) => (
            <Button key={e} variant="outline" className="h-auto justify-start gap-2 p-3.5 text-left text-[12px]" onClick={() => downloadExport(e, records)}>
              <FileText className="h-4 w-4 shrink-0 text-trading-gold" aria-hidden="true" />
              <span>
                <span className="block font-medium text-foreground">{e}</span>
                <span className="block text-[10.5px] text-muted-foreground">Download .txt</span>
              </span>
            </Button>
          ))}
        </div>
      </section>

      <ExecGovernanceFooter badges={VAULT_GOVERNANCE} />
      <p className="text-[10px] text-muted-foreground/70">{VAULT_VERSION}</p>

      {/* Audit record detail */}
      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[16px] text-foreground">{open.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn('exec-badge border-border/50', VAULT_KIND_META[open.kind].tone)}>{VAULT_KIND_META[open.kind].label}</Badge>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{open.id}</span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{open.date}</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{open.department}</span>
                  <Badge variant="outline" className="exec-badge border-trading-gold/40 text-trading-gold">{open.phase}</Badge>
                  <Badge variant="outline" className="exec-badge border-border/50 text-muted-foreground">{open.status}</Badge>
                  {open.reviewer && <span className="text-[10.5px] text-muted-foreground">Reviewer: {open.reviewer}</span>}
                </div>

                <p className="max-w-[80ch] text-[12.5px] leading-relaxed text-muted-foreground">{open.summary}</p>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Evidence links</p>
                    <div className="mt-1.5 space-y-1">
                      {open.evidence.length === 0 && <p className="text-[11.5px] text-muted-foreground">Institution-level record.</p>}
                      {open.evidence.map((e, i) => (
                        <Link key={`${e.route}-${i}`} to={e.route} className="flex items-center gap-1.5 text-[11.5px] text-trading-gold hover:underline">
                          <Link2 className="h-3 w-3" aria-hidden="true" />{e.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Knowledge objects</p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {open.knowledgeObjects.length === 0 && <span className="text-[11.5px] text-muted-foreground">—</span>}
                        {open.knowledgeObjects.map((o, i) => (
                          <Link key={`${o}-${i}`} to={`/explorer/${o}`} className="rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:text-trading-gold">{o}</Link>
                        ))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Memory records</p>
                      <p className="mt-1 text-[11.5px] text-muted-foreground">{open.memoryRecords.join(' · ') || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Related decisions</p>
                      <p className="mt-1 text-[11.5px] text-muted-foreground">{open.relatedDecisions.join(' · ') || 'No linked executive decision.'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Oracle explanation</p>
                  <p className="mt-1 max-w-[80ch] text-[11.5px] leading-relaxed text-muted-foreground">{open.oracle}</p>
                </div>

                {open.chart && (
                  <div>
                    <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{open.chart.label}</p>
                    <div className="mt-2 h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={open.chart.series.map((v, i) => ({ step: `T${i + 1}`, value: v }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis dataKey="step" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--trading-gold))" fill="hsl(var(--trading-gold))" fillOpacity={0.18} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Chain of evidence</p>
                  <div className="mt-2 space-y-1.5">
                    {chainOfEvidence(open).map((c, i, arr) => (
                      <div key={c.stage}>
                        <Link to={c.route} className="block rounded-md border border-border/40 bg-muted/10 p-2.5 transition-colors hover:border-trading-gold/40">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[9.5px] uppercase tracking-[0.2em] text-trading-gold">{c.stage}</span>
                            <span className="text-[11.5px] font-medium text-foreground">{c.label}</span>
                          </div>
                          <p className="mt-0.5 max-w-[80ch] text-[11px] text-muted-foreground">{c.detail}</p>
                        </Link>
                        {i < arr.length - 1 && <div className="flex justify-center py-0.5" aria-hidden="true"><ArrowRight className="h-3 w-3 rotate-90 text-trading-gold/60" /></div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Executive notes</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{open.notes}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Outcome</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-foreground">{open.outcome}</p>
                  </div>
                </div>

                <ExecGovernanceFooter badges={VAULT_GOVERNANCE} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </OsPage>
  );
}
