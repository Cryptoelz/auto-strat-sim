import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { buildSnapshot } from '@/lib/cmc/intelligence';
import type { CmcFearGreed, CmcGlobalMetrics, CmcQuote } from '@/lib/cmc/types';

interface Props {
  quotes: CmcQuote[];
  global: CmcGlobalMetrics | null;
  fearGreed: CmcFearGreed | null;
}

export function IntelligenceSnapshotPanel({ quotes, global, fearGreed }: Props) {
  const snapshot = buildSnapshot(quotes, global, fearGreed);

  const rows: { label: string; value: string | null }[] = [
    { label: 'Market sentiment', value: snapshot.sentiment },
    { label: 'Market participation', value: snapshot.participation },
    { label: 'Dominance', value: snapshot.dominance },
    { label: 'Breadth', value: snapshot.breadth },
    { label: 'Top tracked performer', value: snapshot.topPerformer },
    { label: 'Weakest tracked performer', value: snapshot.weakestPerformer },
    { label: 'Total market cap change', value: snapshot.marketCapChange },
    { label: 'Total volume change', value: snapshot.volumeChange },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm uppercase tracking-wide">CMC Intelligence Snapshot</CardTitle>
        <DataSourceBadge provenance="LIVE_CMC" />
      </CardHeader>
      <CardContent className="space-y-2">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-border/30 py-1">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-mono text-xs">{row.value ?? 'Not available'}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[11px] text-muted-foreground">
          Deterministic summary computed directly from the CMC values displayed on this page. No generated commentary,
          no forecasts, no investment advice.
        </p>
      </CardContent>
    </Card>
  );
}
