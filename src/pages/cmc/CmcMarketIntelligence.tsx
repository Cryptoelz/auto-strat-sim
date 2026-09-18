import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Globe2, ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { SYMBOL_MAP } from '@/lib/cmc/symbols';
import { fmtPct, fmtSupply, fmtUsd, pctClass } from '@/lib/cmc/format';
import { useCmcMarketData } from '@/hooks/useCmcMarketData';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { CmcDisabledNotice } from '@/components/cmc/CmcDisabledNotice';
import { MarketRegimePanel } from '@/components/cmc/MarketRegimePanel';
import { MarketBreadthPanel } from '@/components/cmc/MarketBreadthPanel';
import { IntelligenceSnapshotPanel } from '@/components/cmc/IntelligenceSnapshotPanel';
import { CmcDiagnosticsPanel } from '@/components/cmc/CmcDiagnosticsPanel';
import { CmcProvenanceNote } from '@/components/cmc/CmcProvenanceNote';

export default function CmcMarketIntelligence() {
  const {
    quotes,
    global,
    fearGreed,
    loading,
    error,
    rateLimited,
    stale,
    lastFetched,
    lastSuccessAt,
    endpointStatus,
    stats,
    cooldownMs,
    refresh,
  } = useCmcMarketData();

  if (!CMC_ENABLED) return <CmcDisabledNotice />;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold">CMC Market Intelligence</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              HACKATHON MODULE · STAGE 2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Read-only CoinMarketCap enrichment. Does not generate trades, alter signals, or replace platform candles.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <DataSourceBadge provenance="LIVE_CMC" />
            {stale && (
              <Badge variant="outline" className="border-trading-warning/50 text-[10px] text-trading-warning">
                STALE DATA
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {lastFetched ? `Last retrieved ${new Date(lastFetched).toLocaleTimeString()}` : 'Not yet retrieved'}
            {lastSuccessAt && stale ? ` · last good ${new Date(lastSuccessAt).toLocaleTimeString()}` : ''}
          </p>
        </div>
      </header>

      <Alert>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <AlertTitle className="text-sm">Isolation boundary active</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Every value on this page is live CoinMarketCap data retrieved through a server-side proxy. It is never mixed
          with seeded research data and never enters the trading, risk, or backtest engines.
        </AlertDescription>
      </Alert>

      {cooldownMs > 0 && (
        <Alert>
          <Clock className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="text-sm">Refresh throttled</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            To protect API credits, refreshes are spaced out. Try again in about {Math.ceil(cooldownMs / 1000)}s.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="text-sm">
            {rateLimited ? 'CoinMarketCap rate limit reached' : 'CoinMarketCap data partially unavailable'}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {error}
            {stale ? ' — showing the last known good CMC snapshot. No simulated data has been substituted.' : ''}
          </AlertDescription>
        </Alert>
      )}

      <MarketRegimePanel global={global} fearGreed={fearGreed} lastFetched={lastFetched} />

      <div className="grid gap-4 lg:grid-cols-2">
        <MarketBreadthPanel quotes={quotes} />
        <IntelligenceSnapshotPanel quotes={quotes} global={global} fearGreed={fearGreed} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm uppercase tracking-wide">Tracked Asset Intelligence</CardTitle>
          <DataSourceBadge provenance="LIVE_CMC" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Platform Pair</th>
                <th className="py-2 pr-3">CMC Symbol</th>
                <th className="py-2 pr-3">CMC ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-right">Rank</th>
                <th className="py-2 pr-3 text-right">Price</th>
                <th className="py-2 pr-3 text-right">1h</th>
                <th className="py-2 pr-3 text-right">24h</th>
                <th className="py-2 pr-3 text-right">7d</th>
                <th className="py-2 pr-3 text-right">Market Cap</th>
                <th className="py-2 pr-3 text-right">24h Volume</th>
                <th className="py-2 text-right">Circ. Supply</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 &&
                SYMBOL_MAP.map((m) => (
                  <tr key={m.pair} className="border-b border-border/30">
                    <td className="py-2 pr-3 font-mono text-xs">{m.pair}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{m.cmc}</td>
                    <td className="py-2 pr-3 font-mono text-xs">—</td>
                    <td className="py-2 pr-3">{m.name}</td>
                    <td colSpan={8} className="py-2 text-right text-xs text-muted-foreground">
                      {loading ? 'Loading live CMC data…' : 'No live data'}
                    </td>
                  </tr>
                ))}
              {quotes.map((q) => (
                <tr key={q.cmcId ?? q.cmcSymbol} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-mono text-xs">{q.pairSymbol}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{q.cmcSymbol}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{q.cmcId ?? '—'}</td>
                  <td className="py-2 pr-3">{q.name}</td>
                  <td className="py-2 pr-3 text-right font-mono">{q.rank ?? '—'}</td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtUsd(q.price)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange1h)}`}>
                    {fmtPct(q.percentChange1h)}
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange24h)}`}>
                    {fmtPct(q.percentChange24h)}
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange7d)}`}>
                    {fmtPct(q.percentChange7d)}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtUsd(q.marketCap)}</td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtUsd(q.volume24h)}</td>
                  <td className="py-2 text-right font-mono">{fmtSupply(q.circulatingSupply)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Assets are resolved by CoinMarketCap numeric ID where returned; the extensible mapping layer translates
            platform pairs (BTCUSDT → BTC, etc.).
          </p>
        </CardContent>
      </Card>

      <CmcDiagnosticsPanel stats={stats} endpointStatus={endpointStatus} />
      <CmcProvenanceNote />
    </div>
  );
}
