import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTradingContext } from '@/contexts/TradingContext';

const fmt = (ts: number | null) => (ts ? new Date(ts).toLocaleTimeString() : '—');

/**
 * Market Data Status — surfaces REST/WebSocket feed health so the institution
 * never appears idle because of a silent kline failure. Presentation only.
 */
export function MarketDataStatusPanel() {
  const { marketDataStatus: m } = useTradingContext();

  const restVariant = m.restStatus === 'ok' ? 'default'
    : m.restStatus === 'degraded' ? 'secondary' : 'destructive';
  const wsVariant = m.websocketStatus === 'connected' ? 'default'
    : m.websocketStatus === 'reconnecting' ? 'secondary' : 'destructive';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" /> Market Data Status
          </CardTitle>
          <Badge variant={restVariant} className="text-[10px]">
            {m.restStatus === 'ok' ? (
              <><CheckCircle2 className="mr-1 h-3 w-3" /> Healthy</>
            ) : (
              <><AlertTriangle className="mr-1 h-3 w-3" /> {m.restStatus === 'degraded' ? 'Degraded mode' : 'Feed down'}</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-[11px]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <div className="text-muted-foreground">REST status</div>
            <Badge variant={restVariant} className="mt-0.5 text-[10px]">{m.restStatus}</Badge>
          </div>
          <div>
            <div className="text-muted-foreground">WebSocket status</div>
            <Badge variant={wsVariant} className="mt-0.5 text-[10px]">{m.websocketStatus}</Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Last successful candle</div>
            <div className="font-mono">{fmt(m.lastSuccessfulCandleTs)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last update</div>
            <div className="font-mono">{fmt(m.lastAttemptTs)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Retries</div>
            <div className="font-mono">{m.retries}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Empty markets</div>
            <div className="font-mono">{m.emptyAssets.length ? m.emptyAssets.join(', ') : 'none'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Served from cache</div>
            <div className="font-mono">{m.cachedAssets.length ? m.cachedAssets.join(', ') : 'none'}</div>
          </div>
        </div>

        {m.message && <p className="text-warning">{m.message}</p>}
      </CardContent>
    </Card>
  );
}
