import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ATLAS OS™ Founder's Edition — Trading & Research primitives.
   Presentation only. No calculations, no governance, no logic.
   ══════════════════════════════════════════════════════════════ */

/** The canonical analytical flow every research page communicates. */
export const RESEARCH_FLOW = [
  'Question', 'Evidence', 'Analysis', 'Decision', 'Confidence', 'Recommendation',
] as const;

export function ResearchFlow({ active, className }: { active?: string; className?: string }) {
  return (
    <nav aria-label="Research flow" className={cn('rsch-flow', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {RESEARCH_FLOW.map((step, i) => {
          const on = active?.toLowerCase() === step.toLowerCase();
          return (
            <li key={step} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true" className="text-muted-foreground/40">→</span>}
              <span
                aria-current={on ? 'step' : undefined}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[9.5px] uppercase tracking-[0.16em] transition-colors duration-150',
                  on
                    ? 'border-trading-gold/45 bg-trading-gold/10 text-trading-gold'
                    : 'border-border/45 bg-muted/15 text-muted-foreground',
                )}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Standard research page header: title, subtitle, analytical flow, actions. */
export function ResearchHeader({
  title, subtitle, eyebrow, actions, flow, activeStep,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  flow?: boolean;
  activeStep?: string;
}) {
  return (
    <header className="rsch-header space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-trading-gold">{eyebrow}</p>
          )}
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {flow && <ResearchFlow active={activeStep} />}
    </header>
  );
}

/** Research metric card — identical height, padding, radius and shadow everywhere. */
export function ResearchMetric({
  label, value, hint, icon: Icon, tone = 'neutral', className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'positive' | 'negative' | 'gold';
  className?: string;
}) {
  const toneClass =
    tone === 'positive' ? 'text-trading-profit'
      : tone === 'negative' ? 'text-trading-loss'
        : tone === 'gold' ? 'text-trading-gold'
          : 'text-foreground';
  return (
    <div className={cn('exec-card rsch-metric flex h-full flex-col justify-between gap-2', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase leading-tight tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
      </div>
      <p className={cn('font-mono text-2xl font-semibold leading-none tabular-nums tracking-tight', toneClass)}>
        {value}
      </p>
      <p className="min-h-[1rem] text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

export function ResearchMetricGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 | 6 }) {
  const map: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-3 lg:grid-cols-5',
    6: 'sm:grid-cols-3 lg:grid-cols-6',
  };
  return <div className={cn('grid auto-rows-fr grid-cols-2 gap-3', map[cols])}>{children}</div>;
}

/**
 * Scroll container for analytical tables: sticky header, subtle zebra striping,
 * numeric alignment, hover rows and keyboard-reachable scrolling.
 */
export function ResearchTable({
  children, className, label, maxHeight,
}: { children: ReactNode; className?: string; label?: string; maxHeight?: string }) {
  return (
    <div
      className={cn('rsch-table-wrap', className)}
      style={maxHeight ? { maxHeight } : undefined}
      tabIndex={0}
      role="region"
      aria-label={label ?? 'Data table'}
    >
      {children}
    </div>
  );
}

/* ── Shared Recharts styling. Semantic tokens only, never hard-coded colours ── */
export const CHART_AXIS = {
  tick: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
  tickLine: false,
  axisLine: false,
} as const;

export const CHART_GRID = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
  opacity: 0.3,
  vertical: false,
} as const;

export const CHART_TOOLTIP = {
  contentStyle: {
    background: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.5rem',
    fontSize: 11,
    boxShadow: 'var(--exec-shadow)',
    padding: '0.5rem 0.625rem',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))', fontSize: 10, marginBottom: 2 },
  itemStyle: { color: 'hsl(var(--foreground))', fontSize: 11 },
  cursor: { stroke: 'hsl(var(--border))', strokeWidth: 1 },
} as const;

export const CHART_LEGEND = {
  wrapperStyle: { fontSize: 11, color: 'hsl(var(--muted-foreground))', paddingTop: 8 },
} as const;

/** Accessible wrapper so charts announce their meaning to screen readers. */
export function ChartFrame({
  title, description, height = 'h-56', children, className,
}: { title: string; description?: string; height?: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn('rsch-chart m-0', className)}>
      <div className={cn('w-full min-w-0', height)} role="img" aria-label={description ? `${title}. ${description}` : title}>
        {children}
      </div>
      {description && (
        <figcaption className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">{description}</figcaption>
      )}
    </figure>
  );
}
