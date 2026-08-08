import { ExecCard, ExecCardHeader, ExecStatusBadge } from '@/components/executive/ExecUi';
import { Milestone } from 'lucide-react';

type Phase = 'completed' | 'current' | 'planned';

const MILESTONES: { label: string; phase: Phase; note: string }[] = [
  { label: 'Foundation', phase: 'completed', note: 'Simulation engine, risk framework and audit trail.' },
  { label: 'Portfolio Intelligence', phase: 'completed', note: 'Specialists, allocation labs and forward validation.' },
  { label: 'Departments', phase: 'completed', note: 'AI departments with owned objects and ratings.' },
  { label: 'Knowledge Layer', phase: 'completed', note: 'Knowledge Graph, Explorer and Oracle explainability.' },
  { label: 'Institution OS', phase: 'completed', note: 'Autonomous cycles, IQ index and institutional dashboard.' },
  { label: 'Enterprise', phase: 'completed', note: 'Certification, acceptance programme and release candidate.' },
  { label: 'Platform', phase: 'completed', note: 'Metrics API, plugin SDK and extension management.' },
  { label: 'Institutional Memory', phase: 'current', note: 'Permanent citation-backed institutional record.' },
  { label: 'Current Phase', phase: 'planned', note: 'Executive experience polish and boardroom readiness.' },
];

/** Institution Evolution — compact executive roadmap. Presentation only. */
export function InstitutionEvolutionStrip() {
  return (
    <ExecCard as="section">
      <ExecCardHeader title="Institution Evolution" icon={Milestone} hint="How the institution was built" />
      <ol className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MILESTONES.map((m, i) => (
          <li key={m.label} className="exec-card !p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-foreground">
                <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                {m.label}
              </p>
              <ExecStatusBadge status={m.phase} />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{m.note}</p>
          </li>
        ))}
      </ol>
    </ExecCard>
  );
}
