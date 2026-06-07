/**
 * Execution Path Audit
 *
 * For every signal that reached the final execution branch (i.e. confirmation
 * passed and MPC/Governance/Allocation/Risk gates were evaluated), show the
 * decision at each gate plus a final 5-stage waterfall:
 *
 *   Governance Approved → Allocation Approved → Risk Approved
 *   → Execution Submitted → Position Opened
 *
 * Surfaces why approved signals are not becoming executed paper trades.
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, ArrowDown, CheckCircle2, XCircle, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';
import { ASSET_INFO } from '@/config/trading';
import { ExecutionAttempt, ExecutionOutcome } from '@/types/trading';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const OUTCOME_LABEL: Record<ExecutionOutcome, string> = {
  executed_open: 'EXECUTED (open)',
  executed_flip: 'EXECUTED (flip)',
  skipped_same_direction: 'SKIPPED — same direction',
  cooldown_active: 'BLOCKED — cooldown',
  insufficient_balance: 'BLOCKED — balance',
  position_too_small: 'BLOCKED — size < $10',
  blocked_by_filter: 'BLOCKED — filter',
  blocked_by_governance: 'BLOCKED — governance',
  blocked_by_mpc: 'BLOCKED — MPC',
  blocked_by_allocation: 'BLOCKED — allocation',
  blocked_by_max_positions: 'BLOCKED — max positions',
};

const OUTCOME_TONE: Record<ExecutionOutcome, string> = {
  executed_open: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  executed_flip: 'border-primary/50 bg-primary/10 text-primary',
  skipped_same_direction: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
  cooldown_active: 'border-muted bg-muted/40 text-muted-foreground',
  insufficient_balance: 'border-destructive/50 bg-destructive/10 text-destructive',
  position_too_small: 'border-destructive/50 bg-destructive/10 text-destructive',
  blocked_by_filter: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
  blocked_by_governance: 'border-destructive/50 bg-destructive/10 text-destructive',
  blocked_by_mpc: 'border-destructive/50 bg-destructive/10 text-destructive',
  blocked_by_allocation: 'border-destructive/50 bg-destructive/10 text-destructive',
  blocked_by_max_positions: 'border-destructive/50 bg-destructive/10 text-destructive',
};

function isExecuted(o: ExecutionOutcome): boolean {
  return o === 'executed_open' || o === 'executed_flip';
}

export function ExecutionPathAudit() {
  const { executionAttempts } = useTradingContext();

  const waterfall = useMemo(() => {
    const total = executionAttempts.length;
    const govOK = executionAttempts.filter(a => a.governance.pass).length;
    const allocOK = executionAttempts.filter(a => a.governance.pass && a.allocation.pass).length;
    const riskOK = executionAttempts.filter(a =>
      a.governance.pass && a.allocation.pass &&
      a.risk.pass && a.cooldown.pass && a.maxPositions.pass && a.exposure.pass,
    ).length;
    // "Submitted" = engine reached the open/flip branch (everything except
    // governance / filter / cooldown / balance / max-positions / allocation blocks).
    const submitted = executionAttempts.filter(a =>
      isExecuted(a.outcome) || a.outcome === 'skipped_same_direction',
    ).length;
    const opened = executionAttempts.filter(a => isExecuted(a.outcome)).length;
    return [
      { key: 'gov', label: 'Governance Approved', count: govOK },
      { key: 'alloc', label: 'Allocation Approved', count: allocOK },
      { key: 'risk', label: 'Risk Approved', count: riskOK },
      { key: 'submitted', label: 'Execution Submitted', count: submitted },
      { key: 'opened', label: 'Position Opened', count: opened },
    ].map(s => ({ ...s, total }));
  }, [executionAttempts]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Execution Path Audit
          <Badge variant="outline" className="ml-2 text-[10px]">
            {executionAttempts.length} attempt{executionAttempts.length === 1 ? '' : 's'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Final waterfall */}
        <div className="rounded-md border border-border/50 bg-background/40 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">Final-stage waterfall</span>
            <span className="ml-auto text-muted-foreground">over last {executionAttempts.length} confirmed signals</span>
          </div>
          {waterfall.map((s, idx) => {
            const pct = s.total > 0 ? (s.count / s.total) * 100 : 0;
            const isLast = s.key === 'opened';
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {idx > 0 && <ArrowDown className="h-3 w-3 text-muted-foreground" />}
                    <span className={cn(isLast && 'font-semibold')}>{s.label}</span>
                  </div>
                  <span className={cn(
                    'font-mono tabular-nums',
                    isLast ? (s.count > 0 ? 'text-trading-profit' : 'text-trading-loss') : '',
                  )}>
                    {s.count}/{s.total}
                  </span>
                </div>
                <Progress value={pct} className="h-1 mt-0.5" />
              </div>
            );
          })}
          {executionAttempts.length > 0 && waterfall[3].count > waterfall[4].count && (
            <p className="text-[10px] text-trading-warning pt-1">
              ⚠ {waterfall[3].count - waterfall[4].count} signal(s) reached Execution Submitted
              but did not open a position — see the attempts table below for the exact reason.
            </p>
          )}
        </div>

        {/* Per-attempt audit */}
        {executionAttempts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No confirmed signals have reached the execution branch yet — start the engine and wait
            for the post-crossover confirmation pipeline to promote a signal.
          </p>
        ) : (
          <ScrollArea className="max-h-[480px] pr-2">
            <div className="space-y-2">
              {executionAttempts.map(a => (
                <AttemptRow key={a.id} a={a} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function AttemptRow({ a }: { a: ExecutionAttempt }) {
  const info = ASSET_INFO[a.asset];
  return (
    <div className="rounded-md border border-border/50 bg-background/40 p-2.5 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold">{info?.symbol ?? a.asset}</span>
        <Badge variant="outline" className={cn(
          'text-[10px]',
          a.side === 'long'
            ? 'border-trading-profit/50 text-trading-profit'
            : 'border-trading-loss/50 text-trading-loss',
        )}>
          {a.side.toUpperCase()}
        </Badge>
        <Badge variant="outline" className={cn('text-[10px]', OUTCOME_TONE[a.outcome])}>
          {OUTCOME_LABEL[a.outcome]}
        </Badge>
        <span className="text-[10px] text-muted-foreground">@ ${a.price.toFixed(2)}</span>
        <span className="text-[10px] text-muted-foreground">
          dist {a.smaDistance !== null ? `${a.smaDistance.toFixed(3)}%` : 'n/a'}
        </span>
        <span className="text-[10px] text-muted-foreground">conv +{a.convictionScore}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {format(new Date(a.timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px]">
        <GateChip label="MPC" g={a.mpc} />
        <GateChip label="Governance" g={a.governance} />
        <GateChip label="Allocation" g={a.allocation} />
        <GateChip label="Exposure" g={a.exposure} />
        <GateChip label="Cooldown" g={a.cooldown} />
        <GateChip label="Max Positions" g={a.maxPositions} />
        <GateChip label="Risk / Balance" g={a.risk} />
        <div className="rounded border border-border/50 px-1.5 py-1 bg-background/60">
          <div className="text-muted-foreground">Position Sizing</div>
          <div className="font-mono">
            {a.positionSizing.positionPercent}% → {a.positionSizing.sizeUnits.toFixed(6)}
            <span className="text-muted-foreground"> (${a.positionSizing.sizeUsd.toFixed(2)})</span>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <strong>Outcome:</strong> {a.outcomeDetail}
      </p>
    </div>
  );
}

function GateChip({ label, g }: { label: string; g: { pass: boolean; detail: string } }) {
  const Icon = g.pass ? CheckCircle2 : XCircle;
  return (
    <div className={cn(
      'rounded border px-1.5 py-1 flex items-start gap-1',
      g.pass
        ? 'border-trading-profit/30 bg-trading-profit/5'
        : 'border-destructive/40 bg-destructive/10',
    )}>
      <Icon className={cn(
        'h-3 w-3 mt-0.5 shrink-0',
        g.pass ? 'text-trading-profit' : 'text-destructive',
      )} />
      <div className="min-w-0">
        <div className="text-muted-foreground">{label}</div>
        <div className="truncate" title={g.detail}>{g.detail}</div>
      </div>
    </div>
  );
}

export default ExecutionPathAudit;
