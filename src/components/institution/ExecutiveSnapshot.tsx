import { Link } from 'react-router-dom';
import { ChevronRight, Building2, FlaskConical, Brain, Wrench, ShieldCheck, GraduationCap, Lightbulb, type LucideIcon } from 'lucide-react';
import { ExecCard, ExecCardHeader } from '@/components/executive/ExecUi';
import { institutionScore, institutionMetrics, activityFeed } from '@/lib/institutionOS';
import { institutionRecommendations, learningStats, institutionIQ } from '@/lib/institutionIntelligence';
import { memoryStats } from '@/lib/institutionalMemory';
import { getExecutiveSummary } from '@/lib/maintenance';
import { institutionPulse } from '@/lib/institutionLife';

interface SnapshotCard {
  key: string;
  title: string;
  icon: LucideIcon;
  value: string;
  line: string;
  to: string;
}

/** Executive Snapshot — one shared card shell, today's reading per department. Presentation only. */
export function ExecutiveSnapshot() {
  const score = institutionScore();
  const metrics = institutionMetrics();
  const feed = activityFeed(40);
  const recs = institutionRecommendations();
  const learning = learningStats();
  const mem = memoryStats();
  const maint = getExecutiveSummary();
  const iq = institutionIQ();
  const pulse = institutionPulse();
  const governance = pulse.signals.find((s) => s.key === 'governance');
  const research = metrics.find((m) => m.key === 'research-health');

  const cards: SnapshotCard[] = [
    {
      key: 'institution', title: "Today's Institution", icon: Building2,
      value: `${score.total} · ${score.grade}`,
      line: `Institution Score across ${score.components.length} weighted components; IQ ${iq.total} (${iq.band}).`,
      to: '/institution/score',
    },
    {
      key: 'research', title: "Today's Research", icon: FlaskConical,
      value: research?.value ?? '—',
      line: `${feed.length} recorded institutional events in the current window. ${research?.sub ?? ''}`,
      to: '/institution/analytics',
    },
    {
      key: 'memory', title: "Today's Memory", icon: Brain,
      value: `${mem.total}`,
      line: `${mem.citations} citations · ${mem.citationRate}% of records carry evidence links.`,
      to: '/institution/memory',
    },
    {
      key: 'maintenance', title: "Today's Maintenance", icon: Wrench,
      value: `${maint.institutionHealth}`,
      line: `${maint.modulesHealthy}/${maint.modulesChecked} modules healthy · ${maint.warnings} warnings observed.`,
      to: '/maintenance',
    },
    {
      key: 'governance', title: "Today's Governance", icon: ShieldCheck,
      value: governance?.state ?? '—',
      line: 'Every promotion remains human-approval gated; simulation and observation only.',
      to: '/governance',
    },
    {
      key: 'learning', title: "Today's Learning", icon: GraduationCap,
      value: `${learning.total}`,
      line: `${learning.recent} lessons recorded in the last 30 days across ${learning.departments} departments.`,
      to: '/institution/learning',
    },
    {
      key: 'recommendations', title: "Today's Recommendations", icon: Lightbulb,
      value: `${recs.length}`,
      line: `${recs.filter((r) => r.priority === 'high').length} high priority, each with rationale and evidence.`,
      to: '/institution/recommendations',
    },
  ];

  return (
    <ExecCard as="section">
      <ExecCardHeader title="Executive Snapshot" icon={Building2} hint="Where the institution stands today" />
      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.key} to={c.to} className="exec-card exec-card-interactive group !p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <c.icon className="h-3.5 w-3.5 shrink-0 text-trading-gold/70" aria-hidden="true" />
                {c.title}
              </p>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </div>
            <p className="mt-2 font-mono text-xl font-semibold leading-none tabular-nums text-trading-gold">{c.value}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{c.line}</p>
          </Link>
        ))}
      </div>
    </ExecCard>
  );
}
