import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, GitBranch } from 'lucide-react';
import {
  FunnelMap, FUNNEL_STAGES, FunnelStage, institutionStages, stageCounts,
} from '@/lib/specialists/attribution';
import { SPECIALIST_IDS } from '@/lib/specialists/stats';
import { SPECIALIST_NAMES } from '@/lib/specialists/independence';

const STAGE_NOTE: Record<FunnelStage, string> = {
  'Markets Examined': 'Distinct markets the specialist analysed',
  'Markets Evaluated': 'Candle snapshots evaluated across those markets',
  'Signals Generated': 'Snapshots that produced a BUY or SELL view',
  'HOLD Decisions': 'Rounds the institution actively decided to hold — analysed, no trade',
  'Signals Proposed': 'Signals that survived champion selection',
  'Signals Approved': 'Proposals that reached the live engine gate stack',
  'Trades Executed': 'Positions the live engine actually opened or flipped',
  'Trades Won': 'Closed trades attributed to the specialist that finished in profit',
  'Lessons Learned': 'Distinct institutional lessons recorded from blocks and outcomes',
};

function StageRow({
  stage, value, max, last,
}: { stage: FunnelStage; value: number; max: number; last: boolean }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 2;
  return (
    <div>
      <div className="rounded-md border bg-card p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium">{stage}</span>
          <span className="font-mono text-sm">{value}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-muted">
          <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{STAGE_NOTE[stage]}</p>
      </div>
      {!last && (
        <div className="flex justify-center py-0.5">
          <ArrowDown className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/**
 * The eight-stage institutional funnel: Markets Examined -> Lessons Learned.
 * Every counter is sourced from the live execution path. Presentation only.
 */
export function InstitutionalFunnel({ funnels }: { funnels: FunnelMap }) {
  const totals = institutionStages(funnels);
  const max = Math.max(...FUNNEL_STAGES.map((s) => totals[s]), 1);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4" /> Institutional Signal Funnel
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">Live execution path · read-only</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {FUNNEL_STAGES.map((s, i) => (
            <StageRow
              key={s}
              stage={s}
              value={totals[s]}
              max={max}
              last={i === FUNNEL_STAGES.length - 1}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {SPECIALIST_IDS.map((id) => {
          const f = funnels[id];
          const counts = stageCounts(f);
          const localMax = Math.max(...FUNNEL_STAGES.map((s) => counts[s]), 1);
          return (
            <Card key={id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">{SPECIALIST_NAMES[id]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {FUNNEL_STAGES.map((s) => (
                  <div key={s} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{s}</span>
                      <span className="font-mono">{counts[s]}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded bg-muted">
                      <div
                        className="h-full rounded bg-primary/70"
                        style={{ width: `${Math.max(2, (counts[s] / localMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {(f.lessons ?? []).length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                    {f.lessons.slice(-3).map((l) => <li key={l}>• {l}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
