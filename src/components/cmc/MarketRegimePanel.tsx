import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { fmtPct, fmtUsd, pctClass } from '@/lib/cmc/format';
import type { CmcFearGreed, CmcGlobalMetrics } from '@/lib/cmc/types';

interface Props {
  global: CmcGlobalMetrics | null;
  fearGreed: CmcFearGreed | null;
  lastFetched: number | null;
}

export function MarketRegimePanel({ global, fearGreed, lastFetched }: Props) {
  const rows: { label: string; value: string | null; tone?: number }[] = [
    { label: 'Total Market Cap', value: global ? fmtUsd(global.totalMarketCap) : null },
    { label: '24h Total Volume', value: global ? fmtUsd(global.totalVolume24h) : null },
    { label: 'BTC Dominance', value: global ? `${global.btcDominance.toFixed(2)}%` : null },
    { label: 'ETH Dominance', value: global ? `${global.ethDominance.toFixed(2)}%` : null },
    {
      label: 'Fear & Greed',
      value: fearGreed ? `${fearGreed.value} · ${fearGreed.classification}` : null,
    },
    {
      label: 'Market Cap Change 24h',
      value: global ? fmtPct(global.marketCapChange24h) : null,
      tone: global?.marketCapChange24h,
    },
    { label: 'Volume Change 24h', value: global ? fmtPct(global.volumeChange24h) : null, tone: global?.volumeChange24h },
    { label: 'Active Cryptocurrencies', value: global ? global.activeCryptocurrencies.toLocaleString() : null },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm uppercase tracking-wide">CMC Market Regime</CardTitle>
        <DataSourceBadge provenance="LIVE_CMC" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
              {row.value === null ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className={`font-mono text-base font-semibold ${row.tone === undefined ? '' : pctClass(row.tone)}`}>
                  {row.value}
                </p>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Factual market conditions only — no trading recommendations are derived from these values.
          {lastFetched ? ` Last retrieved ${new Date(lastFetched).toLocaleTimeString()}.` : ''}
        </p>
      </CardContent>
    </Card>
  );
}
