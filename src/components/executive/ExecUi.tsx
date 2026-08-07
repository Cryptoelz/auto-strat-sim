import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronRight, type LucideIcon } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ATLAS OS™ Founder's Edition — Executive design primitives.
   Presentation only. No business logic lives in this file.
   ══════════════════════════════════════════════════════════════ */

/** The single canonical executive status vocabulary. */
export type ExecStatus =
  | 'healthy' | 'watch' | 'warning' | 'critical'
  | 'completed' | 'current' | 'planned' | 'vision';

export const EXEC_STATUS_LABEL: Record<ExecStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  warning: 'Warning',
  critical: 'Critical',
  completed: 'Completed',
  current: 'Current',
  planned: 'Planned',
  vision: 'Vision',
};

const STATUS_CLASS: Record<ExecStatus, string> = {
  healthy: 'exec-status-healthy',
  watch: 'exec-status-watch',
  warning: 'exec-status-warning',
  critical: 'exec-status-critical',
  completed: 'exec-status-completed',
  current: 'exec-status-current',
  planned: 'exec-status-planned',
  vision: 'exec-status-vision',
};

export const STATUS_TEXT: Record<ExecStatus, string> = {
  healthy: 'text-exec-healthy',
  watch: 'text-exec-watch',
  warning: 'text-exec-warning',
  critical: 'text-exec-critical',
  completed: 'text-exec-completed',
  current: 'text-exec-current',
  planned: 'text-exec-planned',
  vision: 'text-exec-vision',
};

/** Normalises the loose status words used across older modules onto the canonical set. */
export function toExecStatus(raw?: string): ExecStatus {
  const v = (raw ?? '').toLowerCase().trim();
  if (['good', 'green', 'ok', 'pass', 'healthy', 'stable', 'strong', 'approved'].includes(v)) return 'healthy';
  if (['watch', 'amber', 'monitor', 'caution', 'drift'].includes(v)) return 'watch';
  if (['warning', 'weak', 'degraded', 'attention', 'risk'].includes(v)) return 'warning';
  if (['critical', 'red', 'fail', 'failed', 'blocked', 'issue', 'breach'].includes(v)) return 'critical';
  if (['completed', 'complete', 'done', 'shipped', 'validated'].includes(v)) return 'completed';
  if (['current', 'active', 'live', 'running', 'in progress'].includes(v)) return 'current';
  if (['planned', 'queued', 'scheduled', 'next'].includes(v)) return 'planned';
  if (['vision', 'future', 'concept', 'exploratory'].includes(v)) return 'vision';
  return 'watch';
}

/** Standard status badge. One shape, one size, one vocabulary, everywhere. */
export function ExecStatusPill({
  status, label, className,
}: { status: ExecStatus; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]',
        STATUS_CLASS[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label ?? EXEC_STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Executive card shell. Identical radius, border, padding, shadow and hover
 * behaviour for every card in the executive layer.
 */
export function ExecCard({
  className, children, interactive, as = 'div', ...rest
}: {
  className?: string;
  children: ReactNode;
  interactive?: boolean;
  as?: 'div' | 'section' | 'li' | 'article';
} & React.HTMLAttributes<HTMLElement>) {
  const Tag = as as 'div';
  return (
    <Tag className={cn('exec-card', interactive && 'exec-card-interactive', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Consistent in-card section header: icon, title, optional hint. */
export function ExecCardHeader({
  title, icon: Icon, hint, action,
}: { title: string; icon?: LucideIcon; hint?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex min-h-[1.5rem] items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-trading-gold" aria-hidden="true" />}
        <span className="truncate">{title}</span>
      </h2>
      {action ?? (hint && <span className="shrink-0 text-[10px] text-muted-foreground">{hint}</span>)}
    </div>
  );
}

/** Smoothly counts a numeric value up on mount. Respects reduced motion. */
function useCountUp(target: number, enabled: boolean) {
  const [v, setV] = useState(enabled ? 0 : target);
  const raf = useRef<number>();
  useEffect(() => {
    if (!enabled) { setV(target); return; }
    const reduce =
      typeof window !== 'undefined' &&
      (document.documentElement.classList.contains('atlas-reduced-motion') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) { setV(target); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 700);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, enabled]);
  return v;
}

/**
 * Executive metric. Large tabular value, aligned label, optional trend and status.
 * Sized to stay readable from the far side of a meeting room.
 */
export function ExecMetric({
  label, value, hint, status, trend, numeric, suffix, prefix, size = 'md', className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  status?: ExecStatus;
  trend?: 'up' | 'down' | 'flat';
  /** Pass a number to animate the value counting up. */
  numeric?: number;
  suffix?: string;
  prefix?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const animated = useCountUp(numeric ?? 0, numeric !== undefined);
  const shown = numeric !== undefined ? Math.round(animated).toLocaleString() : value;
  const valueSize =
    size === 'lg' ? 'text-3xl sm:text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl sm:text-[1.75rem]';

  return (
    <div className={cn('exec-card exec-metric flex h-full flex-col justify-between gap-2', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase leading-tight tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {status && <ExecStatusPill status={status} />}
      </div>
      <p
        className={cn(
          'font-mono font-semibold leading-none tabular-nums tracking-tight',
          valueSize,
          status ? STATUS_TEXT[status] : 'text-trading-gold',
        )}
      >
        {prefix}{shown}{suffix}
      </p>
      <p className="min-h-[1rem] text-[11px] leading-snug text-muted-foreground">
        {trend && (
          <span
            aria-hidden="true"
            className={cn(
              'mr-1.5 font-medium',
              trend === 'up' ? 'text-exec-healthy' : trend === 'down' ? 'text-exec-critical' : 'text-muted-foreground',
            )}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
          </span>
        )}
        {hint}
      </p>
    </div>
  );
}

/** Consistent metric grid so every card row lines up on the same baseline. */
export function ExecMetricGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 | 6 }) {
  const map: Record<number, string> = {
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
  };
  return <div className={cn('grid auto-rows-fr grid-cols-2 gap-3', map[cols])}>{children}</div>;
}

/** Breadcrumb trail used by every executive page header. */
export function ExecBreadcrumbs({ trail }: { trail: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {trail.map((t, i) => (
          <li key={`${t.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" aria-hidden="true" />}
            {t.to && i < trail.length - 1 ? (
              <Link to={t.to} className="exec-link rounded-sm hover:text-trading-gold">{t.label}</Link>
            ) : (
              <span aria-current={i === trail.length - 1 ? 'page' : undefined} className={i === trail.length - 1 ? 'text-foreground' : undefined}>
                {t.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Governance footer badges — identical on every executive page. */
export function ExecGovernanceFooter({
  badges = ['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required'],
}: { badges?: string[] }) {
  return (
    <footer className="flex flex-wrap gap-1.5 border-t border-border/40 pt-5">
      {badges.map((b) => (
        <span
          key={b}
          className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-0.5 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground"
        >
          {b}
        </span>
      ))}
    </footer>
  );
}
