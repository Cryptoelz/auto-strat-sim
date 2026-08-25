import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PauseCircle } from 'lucide-react';
import { HoldDecision, AttemptRecord } from '@/lib/specialists/attribution';
import { SPECIALIST_NAMES } from '@/lib/specialists/independence';

/**
 * Institutional HOLD ledger. A HOLD is a decision, not idleness: every
 * evaluated market that produced no trade is recorded with its reason,
 * specialist, evidence and confidence. Presentation only.
 */
export function HoldDecisionLog({
  holds, attempts,
}: { holds: HoldDecision[]; attempts: AttemptRecord[] }) {
  const recentHolds = [...holds].slice(-25).reverse();
  const recentAttempts = [...attempts].slice(-25).reverse();

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <PauseCircle className="h-4 w-4" /> Institutional HOLD Decisions
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">{holds.length} recorded</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-[11px]">
          {recentHolds.length === 0 && (
            <p className="text-muted-foreground">No HOLD decisions recorded yet.</p>
          )}
          {recentHolds.map((h) => (
            <div key={h.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono">{h.asset.replace('USDT', '')} · HOLD</span>
                <span className="text-muted-foreground">
                  {new Date(h.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1">{h.reason}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-muted-foreground">
                <Badge variant="secondary" className="text-[10px]">
                  {h.specialistId ? SPECIALIST_NAMES[h.specialistId] : 'No lead specialist'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Confidence {h.confidence.toFixed(0)}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  {h.signalGenerated ? 'Signal generated' : 'No signal'}
                </Badge>
              </div>
              {h.evidence.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
                  {h.evidence.map((e) => <li key={e}>• {e}</li>)}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Execution Attempt Audit Trail</CardTitle>
            <Badge variant="outline" className="text-[10px]">{attempts.length} recorded</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-[11px]">
          {recentAttempts.length === 0 && (
            <p className="text-muted-foreground">No execution attempts observed yet.</p>
          )}
          {recentAttempts.map((a) => (
            <div key={a.id} className="rounded-md border p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono">{a.asset.replace('USDT', '')}</span>
                <Badge
                  variant={a.executed ? 'default' : 'outline'}
                  className="text-[10px]"
                >
                  {a.executed ? 'Executed' : 'Blocked'}
                </Badge>
              </div>
              <p className="mt-1">{a.reason}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {a.attributed
                  ? `Attributed to ${SPECIALIST_NAMES[a.specialistId!]}`
                  : 'Awaiting champion attribution — retained in audit trail'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
