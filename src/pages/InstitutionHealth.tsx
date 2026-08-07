import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Progress } from '@/components/ui/progress';
import {
  ExecCard, ExecStatusPill, ExecGovernanceFooter, STATUS_TEXT, type ExecStatus,
} from '@/components/executive/ExecUi';
import { healthChecks, institutionPulse, type HealthCheck } from '@/lib/institutionLife';
import { ArrowRight } from 'lucide-react';

const STATE: Record<HealthCheck['state'], ExecStatus> = {
  healthy: 'healthy',
  watch: 'watch',
  issue: 'critical',
};

export default function InstitutionHealth() {
  const checks = useMemo(() => healthChecks(), []);
  const pulse = useMemo(() => institutionPulse(), []);
  const overall = Math.round(checks.reduce((s, c) => s + c.score, 0) / Math.max(1, checks.length));
  const overallStatus: ExecStatus = overall >= 80 ? 'healthy' : overall >= 65 ? 'watch' : 'critical';

  return (
    <OsPage
      title="Institution Health Monitor™"
      subtitle="The single view of whether the institution itself is sound: knowledge integrity, department balance, evidence quality, bottlenecks, contradiction load and confidence drift. Every check explains its own reasoning and links to the evidence behind it."
      department="Health Monitor™"
      breadcrumbs={[{ label: 'ATLAS OS', to: '/atlas' }, { label: 'Executive Layer' }, { label: 'Institution Health' }]}
      actions={
        <div className="flex items-center gap-2 rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5">
          <div className="text-right">
            <p className="font-mono text-lg font-semibold leading-none tabular-nums text-trading-gold">{overall}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Health index</p>
          </div>
          <ExecStatusPill status={overallStatus} />
        </div>
      }
    >
      <ExecCard className="exec-rise !p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live institutional state</p>
        <h2 className="mt-1 text-lg font-semibold leading-snug text-foreground">{pulse.headline}</h2>
        <div className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pulse.signals.slice(0, 6).map((s) => (
            <div key={s.key} className="rounded-lg border border-border/40 bg-muted/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-[12px] leading-snug text-foreground">{s.state}</p>
              <Progress value={s.score} className="mt-2 h-1" aria-label={`${s.label} score ${s.score}`} />
            </div>
          ))}
        </div>
      </ExecCard>

      <section aria-label="Health checks" className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((c) => {
          const status = STATE[c.state];
          return (
            <ExecCard key={c.key} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-semibold leading-snug text-foreground">{c.label}</p>
                <ExecStatusPill status={status} />
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <Progress value={c.score} className="h-1.5 flex-1" aria-label={`${c.label} score`} />
                <span className={`font-mono text-[11px] tabular-nums ${STATUS_TEXT[status]}`}>{c.score}</span>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">{c.explanation}</p>
              <ul className="mt-2.5 flex-1 space-y-1 border-l border-trading-gold/25 pl-3">
                {c.detail.map((d, i) => <li key={i} className="text-[10.5px] leading-relaxed text-muted-foreground">{d}</li>)}
              </ul>
              {c.to && (
                <Link
                  to={c.to}
                  className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-trading-gold hover:underline"
                >
                  Investigate <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              )}
            </ExecCard>
          );
        })}
      </section>

      <ExecGovernanceFooter />
    </OsPage>
  );
}
