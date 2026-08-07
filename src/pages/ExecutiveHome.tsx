import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { executiveHome, type HomeItem } from '@/lib/enterprise';
import {
  ExecCard, ExecCardHeader, ExecMetric, ExecMetricGrid, ExecStatusPill,
  ExecGovernanceFooter, toExecStatus, STATUS_TEXT,
} from '@/components/executive/ExecUi';
import {
  ArrowRight, Sparkles, AlertTriangle, BookOpen, CalendarClock, Pin, Zap, Activity, ChevronRight,
} from 'lucide-react';

function Panel({
  title, icon: Icon, hint, children, className,
}: { title: string; icon: typeof Zap; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <ExecCard as="section" className={`flex h-full flex-col ${className ?? ''}`}>
      <ExecCardHeader title={title} icon={Icon} hint={hint} />
      <div className="flex-1">{children}</div>
    </ExecCard>
  );
}

function ItemList({ items, label }: { items: HomeItem[]; label: string }) {
  if (!items.length) {
    return (
      <p className="rounded-md border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground">
        Nothing recorded for this window.
      </p>
    );
  }
  return (
    <ul className="space-y-2" aria-label={label}>
      {items.map((it, i) => (
        <li key={`${it.id ?? it.title}-${i}`}>
          <Link
            to={it.to}
            className="exec-card exec-card-interactive group block !p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium leading-snug text-foreground group-hover:text-trading-gold">{it.title}</p>
              {it.id && <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">{it.id}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{it.detail}</p>
            <p className={`mt-1.5 flex items-center gap-1 text-[9.5px] uppercase tracking-[0.14em] ${STATUS_TEXT[toExecStatus(it.tone)]}`}>
              {it.meta}
              <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ExecutiveHome() {
  const home = executiveHome();

  return (
    <OsPage
      title="Executive Home"
      subtitle="The control centre of the institution. Today's brief, live institutional health, what needs your attention, what was discovered overnight and what to read next — every figure links back to its evidence."
      department="Executive Layer"
      breadcrumbs={[{ label: 'ATLAS OS', to: '/atlas' }, { label: 'Executive Layer' }, { label: 'Executive Home' }]}
      actions={
        <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]">
          <Link to="/presentation"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Boardroom Mode</Link>
        </Button>
      }
    >
      {/* Headline metrics — readable across a meeting room. */}
      <section aria-label="Headline institutional metrics" className="exec-rise">
        <ExecMetricGrid cols={6}>
          {home.headline.map((h) => (
            <ExecMetric key={h.label} label={h.label} value={h.value} hint={h.hint} />
          ))}
        </ExecMetricGrid>
      </section>

      <Panel title="Today's Brief" icon={Zap} hint={home.greetingDate}>
        <p className="max-w-4xl text-sm leading-relaxed text-foreground">{home.brief.summary}</p>
        <div className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-3">
          <ExecCard className="!p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Recommended action</p>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground">{home.brief.action}</p>
          </ExecCard>
          <ExecCard className="!p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Expected gain (simulated)</p>
            <p className="mt-1.5 text-xs leading-relaxed text-foreground">{home.brief.gain}</p>
          </ExecCard>
          <ExecCard className="!p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Brief confidence</p>
              <ExecStatusPill status={home.brief.confidence >= 75 ? 'healthy' : home.brief.confidence >= 55 ? 'watch' : 'warning'} />
            </div>
            <p className="mt-1.5 font-mono text-2xl font-semibold leading-none tabular-nums text-trading-gold">
              {home.brief.confidence}%
            </p>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{home.brief.departments.join(' · ')}</p>
          </ExecCard>
        </div>
      </Panel>

      <Panel title="Institution Health" icon={Activity} hint="Derived from the knowledge graph">
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {home.health.map((h) => {
            const status = h.light === 'green' ? 'healthy' : h.light === 'amber' ? 'watch' : 'critical';
            return (
              <ExecCard key={h.key} className="!p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{h.label}</p>
                  <ExecStatusPill status={status} />
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/30"
                    role="progressbar"
                    aria-valuenow={h.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${h.label} score`}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                        status === 'healthy' ? 'bg-exec-healthy' : status === 'watch' ? 'bg-exec-watch' : 'bg-exec-critical'
                      }`}
                      style={{ width: `${h.score}%` }}
                    />
                  </div>
                  <span className={`font-mono text-sm tabular-nums ${STATUS_TEXT[status]}`}>{h.score}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-[10.5px] leading-relaxed text-muted-foreground">{h.note}</p>
              </ExecCard>
            );
          })}
        </div>
      </Panel>

      <div className="grid auto-rows-fr gap-4 lg:grid-cols-2">
        <Panel title="Priority Research" icon={ArrowRight} hint="Highest connectivity, unresolved">
          <ItemList items={home.priority} label="Priority research" />
        </Panel>
        <Panel title="Recent Discoveries" icon={Sparkles} hint="Most recently recorded">
          <ItemList items={home.discoveries} label="Recent discoveries" />
        </Panel>
        <Panel title="Top Risks" icon={AlertTriangle} hint="Institutional and procedural only">
          <ItemList items={home.risks} label="Top risks" />
        </Panel>
        <Panel title="Recommended Reading" icon={BookOpen} hint="Best-evidenced writing">
          <ItemList items={home.reading} label="Recommended reading" />
        </Panel>
        <Panel title="Upcoming Reviews" icon={CalendarClock} hint="Governance and promotion gates">
          <ItemList items={home.reviews} label="Upcoming reviews" />
        </Panel>
        <Panel title="Pinned Reports" icon={Pin} hint="Your pinned and recent objects">
          <ItemList items={home.pinned} label="Pinned reports" />
        </Panel>
      </div>

      <Panel title="Quick Actions" icon={Zap} hint="Jump straight into the institution">
        <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {home.quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="exec-card exec-card-interactive group !p-3">
              <p className="flex items-center justify-between gap-2 text-xs font-medium text-foreground group-hover:text-trading-gold">
                {a.label}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{a.hint}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <ExecGovernanceFooter />
    </OsPage>
  );
}
