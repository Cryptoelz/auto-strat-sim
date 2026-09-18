import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CMC_MIN_REFRESH_MS, CMC_TTL_MS, type CmcRequestStats } from '@/lib/cmc/cache';
import type { CmcEndpointStatus } from '@/hooks/useCmcMarketData';

interface Props {
  stats: CmcRequestStats;
  endpointStatus: Record<string, CmcEndpointStatus>;
}

export function CmcDiagnosticsPanel({ stats, endpointStatus }: Props) {
  const items: { label: string; value: string }[] = [
    { label: 'Proxy requests', value: String(stats.networkRequests) },
    { label: 'Cache hits (credits saved)', value: String(stats.cacheHits) },
    { label: 'Throttled refreshes', value: String(stats.throttled) },
    { label: 'Errors', value: String(stats.errors) },
    { label: 'Rate limited (429)', value: String(stats.rateLimited) },
    { label: 'Cache TTL', value: `${CMC_TTL_MS / 1000}s` },
    { label: 'Min refresh spacing', value: `${CMC_MIN_REFRESH_MS / 1000}s` },
    {
      label: 'Last proxy request',
      value: stats.lastRequestAt ? new Date(stats.lastRequestAt).toLocaleTimeString() : '—',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm uppercase tracking-wide">API Usage Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className="font-mono text-sm">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(endpointStatus).map(([name, status]) => (
            <Badge
              key={name}
              variant="outline"
              className={
                status.ok
                  ? 'border-trading-profit/50 text-trading-profit'
                  : status.stale
                    ? 'border-trading-warning/50 text-trading-warning'
                    : 'border-destructive/50 text-destructive'
              }
            >
              {name}: {status.ok ? 'OK' : status.stale ? 'STALE' : status.error ? 'FAILED' : 'PENDING'}
              {status.fromCache ? ' · cached' : ''}
            </Badge>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Diagnostics are derived locally from proxy call outcomes. No key material or credentials are exposed.
        </p>
      </CardContent>
    </Card>
  );
}
