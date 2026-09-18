import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { computeBreadth } from '@/lib/cmc/intelligence';
import { fmtPct, pctClass } from '@/lib/cmc/format';
import type { CmcQuote } from '@/lib/cmc/types';

export function MarketBreadthPanel({ quotes }: { quotes: CmcQuote[] }) {
  const breadth = computeBreadth(quotes);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm uppercase tracking-wide">CMC Market Breadth</CardTitle>
        <DataSourceBadge provenance="LIVE_CMC" />
      </CardHeader>
      <CardContent className="space-y-4">
        {breadth.total === 0 ? (
          <p className="text-xs text-muted-foreground">No live CMC quotes available to compute breadth.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {breadth.windows.map((w) => (
                <div key={w.window} className="space-y-2 rounded-md border border-border/50 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{w.window} window</p>
                  <p className="font-mono text-sm">
                    <span className="text-trading-profit">{w.positive} positive</span>
                    {' · '}
                    <span className="text-destructive">{w.negative} negative</span>
                    {w.flat > 0 ? ` · ${w.flat} flat` : ''}
                  </p>
                  <Progress value={w.positivePct} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">
                    {w.positivePct.toFixed(0)}% positive / {w.negativePct.toFixed(0)}% negative of {w.total} tracked
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Strongest tracked asset (24h)</p>
                <p className="font-mono text-sm">
                  {breadth.strongest24h?.cmcSymbol ?? '—'}{' '}
                  <span className={pctClass(breadth.strongest24h?.percentChange24h ?? 0)}>
                    {breadth.strongest24h ? fmtPct(breadth.strongest24h.percentChange24h) : ''}
                  </span>
                </p>
              </div>
              <div className="rounded-md border border-border/50 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Weakest tracked asset (24h)</p>
                <p className="font-mono text-sm">
                  {breadth.weakest24h?.cmcSymbol ?? '—'}{' '}
                  <span className={pctClass(breadth.weakest24h?.percentChange24h ?? 0)}>
                    {breadth.weakest24h ? fmtPct(breadth.weakest24h.percentChange24h) : ''}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}
        <p className="text-[11px] text-muted-foreground">
          Informational only — does not affect trading decisions. Calculated from the same quotes request already on
          screen; no additional API calls are made.
        </p>
      </CardContent>
    </Card>
  );
}
