import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  /** Secondary explanation — what this surface will show once data exists. */
  secondary?: string;
  /** Recommended next steps. Executive empty states are never dead ends. */
  suggestions?: { label: string; to: string }[];
  action?: React.ReactNode;
  className?: string;
}

const DEFAULT_SUGGESTIONS = [
  { label: 'Run Backtest', to: '/backtest' },
  { label: 'Open Paper Trading', to: '/paper-trading' },
  { label: 'Open Research', to: '/research' },
  { label: 'View Documentation', to: '/documentation' },
];

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  secondary,
  suggestions = DEFAULT_SUGGESTIONS,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('exec-empty', className)} role="status">
      <span className="exec-empty-icon" aria-hidden="true">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="exec-measure text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      <p className="exec-measure text-[11px] leading-relaxed text-muted-foreground/80">
        {secondary ?? 'Nothing has been recorded here yet. Once a simulation or research cycle completes, results appear automatically — no manual import required.'}
      </p>
      {action}
      {suggestions.length > 0 && (
        <nav aria-label="Recommended next steps" className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
          {suggestions.map((s) => (
            <Link
              key={s.to + s.label}
              to={s.to}
              className="exec-chip border border-trading-gold/35 bg-trading-gold/5 text-[11px] font-medium uppercase tracking-[0.12em] text-trading-gold"
            >
              {s.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
