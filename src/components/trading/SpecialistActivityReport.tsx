import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';
import { FunnelMap, REJECT_CATEGORIES } from '@/lib/specialists/attribution';
import { SPECIALIST_IDS } from '@/lib/specialists/stats';
import { SPECIALIST_NAMES } from '@/lib/specialists/independence';

/**
 * Per-specialist activity report in the institutional briefing format:
 * markets examined, trades evaluated, proposed, and the categorised reasons
 * every rejected proposal was blocked. Presentation only.
 */
export function SpecialistActivityReport({ funnels }: { funnels: FunnelMap }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {SPECIALIST_IDS.map((id) => {
        const f = funnels[id];
        const markets = Object.keys(f.markets ?? {});
        const finalProposals = Math.max(0, f.proposed - (f.categories?.['Champion selection'] ?? 0));
        return (
          <Card key={id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4" /> {SPECIALIST_NAMES[id]}
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  {markets.length} market{markets.length === 1 ? '' : 's'} examined
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-[11px]">
              <div>
                <div className="text-muted-foreground">Market examined</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {markets.length === 0 ? (
                    <span className="text-muted-foreground">No markets analysed yet</span>
                  ) : (
                    markets.map((m) => (
                      <Badge key={m} variant="secondary" className="font-mono text-[10px]">
                        {m.replace('USDT', '')} · {f.markets[m]}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-muted-foreground">Trades evaluated</div>
                  <div className="font-mono text-sm">{f.seen}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Trades proposed</div>
                  <div className="font-mono text-sm">{f.proposed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Final proposals</div>
                  <div className="font-mono text-sm text-success">{finalProposals}</div>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground">Rejected because</div>
                <ul className="mt-1 space-y-0.5">
                  {REJECT_CATEGORIES.map((c) => {
                    const n = f.categories?.[c] ?? 0;
                    return (
                      <li key={c} className="flex items-center justify-between">
                        <span className={n > 0 ? '' : 'text-muted-foreground'}>{c}</span>
                        <span className={`font-mono ${n > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{n}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {f.lastReason && (
                <p className="text-muted-foreground">Most recent outcome: {f.lastReason}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
