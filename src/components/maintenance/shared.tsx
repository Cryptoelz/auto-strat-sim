import { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HealthStatus, STATUS_LABEL } from '@/lib/maintenance';

export const STATUS_STYLES: Record<HealthStatus, { text: string; bg: string; border: string; stroke: string }> = {
  healthy: { text: 'text-trading-profit', bg: 'bg-trading-profit/10', border: 'border-trading-profit/40', stroke: 'hsl(var(--trading-profit))' },
  watch: { text: 'text-trading-gold', bg: 'bg-trading-gold/10', border: 'border-trading-gold/40', stroke: 'hsl(var(--trading-gold))' },
  warning: { text: 'text-trading-warning', bg: 'bg-trading-warning/10', border: 'border-trading-warning/40', stroke: 'hsl(var(--trading-warning))' },
  critical: { text: 'text-trading-loss', bg: 'bg-trading-loss/10', border: 'border-trading-loss/40', stroke: 'hsl(var(--trading-loss))' },
  running: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/40', stroke: 'hsl(var(--primary))' },
};

export function StatusPill({ status, label }: { status: HealthStatus; label?: string }) {
  const s = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={cn('exec-badge-crisp inline-flex items-center text-[10px] leading-none', s.text, s.bg, s.border)}>
      <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full', status === 'running' && 'animate-pulse')} style={{ background: s.stroke }} />
      {label ?? STATUS_LABEL[status]}
    </Badge>
  );
}


export function HealthGauge({ value, status, size = 200, label = 'Institution Health' }: { value: number; status: HealthStatus; size?: number; label?: string }) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const s = STATUS_STYLES[status];
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} opacity={0.35} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.stroke} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold tabular-nums', s.text)}>{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn('mt-1 text-[11px] font-medium', s.text)}>{STATUS_LABEL[status]}</span>
      </div>
    </div>
  );
}

export function ScoreBar({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  const s = STATUS_STYLES[value >= 92 ? 'healthy' : value >= 84 ? 'watch' : value >= 70 ? 'warning' : 'critical'];
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn('text-xs font-semibold tabular-nums', s.text)}>{value}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, value)}%`, background: s.stroke }} />
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, tone = 'default' }: { label: string; value: ReactNode; hint?: string; tone?: 'default' | 'good' | 'warn' | 'bad' }) {
  const tones = {
    default: 'text-foreground',
    good: 'text-trading-profit',
    warn: 'text-trading-warning',
    bad: 'text-trading-loss',
  } as const;
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-xl font-bold tabular-nums', tones[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function MaintenancePage({ title, subtitle, children, actions }: { title: string; subtitle: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <header className="exec-summary flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-trading-gold/25">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-trading-gold">ATLAS AI Maintenance™</p>
          <h1 className="mt-1.5 text-lg font-bold leading-tight tracking-tight sm:text-xl">{title}</h1>
          <p className="exec-summary-text mt-2 max-w-3xl text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>
      </header>
      {children}
      <div className="exec-governance rounded-lg border border-trading-gold/25 bg-trading-gold/5">
        <p className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">Governance</p>
        <p className="mt-2 max-w-4xl text-[11px] leading-relaxed text-muted-foreground">
          Observation / Diagnostics / Simulation / Read Only. ATLAS AI Maintenance™ never executes trades, never modifies
          strategies, research results, portfolio allocations or promotions. Repairs are limited to safe platform hygiene.
        </p>
      </div>
    </div>
  );
}

