import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Pause,
  Lock, Activity, TrendingUp, TrendingDown, Minus,
  Shield, ShieldAlert, Eye,
} from 'lucide-react';

type StatusVariant =
  | 'active' | 'paused' | 'locked' | 'restricted'
  | 'pass' | 'fail' | 'warning'
  | 'ready' | 'not_ready' | 'needs_review' | 'testing_only' | 'limited_ready' | 'rejected'
  | 'bullish' | 'bearish' | 'sideways'
  | 'healthy' | 'degraded' | 'unstable'
  | 'long' | 'short' | 'none'
  | 'info';

const VARIANT_CONFIG: Record<StatusVariant, { icon: any; className: string; label: string }> = {
  active:        { icon: CheckCircle2, className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Active' },
  paused:        { icon: Pause,        className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',               label: 'Paused' },
  locked:        { icon: Lock,         className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Locked' },
  restricted:    { icon: ShieldAlert,  className: 'border-orange-500/30 bg-orange-500/10 text-orange-500',               label: 'Restricted' },
  pass:          { icon: CheckCircle2, className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Pass' },
  fail:          { icon: XCircle,      className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Fail' },
  warning:       { icon: AlertTriangle,className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',               label: 'Warning' },
  ready:         { icon: CheckCircle2, className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Ready' },
  not_ready:     { icon: XCircle,      className: 'border-muted-foreground/30 bg-muted text-muted-foreground',           label: 'Not Ready' },
  needs_review:  { icon: Eye,         className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',               label: 'Needs Review' },
  testing_only:  { icon: Activity,     className: 'border-primary/30 bg-primary/10 text-primary',                       label: 'Testing Only' },
  limited_ready: { icon: Shield,       className: 'border-orange-500/30 bg-orange-500/10 text-orange-500',               label: 'Limited Ready' },
  rejected:      { icon: XCircle,      className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Rejected' },
  bullish:       { icon: TrendingUp,   className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Bullish' },
  bearish:       { icon: TrendingDown, className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Bearish' },
  sideways:      { icon: Minus,        className: 'border-muted-foreground/30 bg-muted text-muted-foreground',           label: 'Sideways' },
  healthy:       { icon: CheckCircle2, className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Healthy' },
  degraded:      { icon: AlertTriangle,className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',               label: 'Degraded' },
  unstable:      { icon: XCircle,      className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Unstable' },
  long:          { icon: TrendingUp,   className: 'border-trading-profit/30 bg-trading-profit/10 text-trading-profit',   label: 'Long' },
  short:         { icon: TrendingDown, className: 'border-destructive/30 bg-destructive/10 text-destructive',            label: 'Short' },
  none:          { icon: Minus,        className: 'border-muted-foreground/30 bg-muted text-muted-foreground',           label: 'None' },
  info:          { icon: Activity,     className: 'border-primary/30 bg-primary/10 text-primary',                       label: 'Info' },
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ variant, label, size = 'sm', className, showIcon = true }: StatusBadgeProps) {
  const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.info;
  const Icon = cfg.icon;
  const displayLabel = label || cfg.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        'exec-badge',
        size === 'md' && 'text-[11px] px-2.5 py-1',
        cfg.className,
        className,
      )}
    >
      {showIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />}
      {displayLabel}
    </Badge>

  );
}
