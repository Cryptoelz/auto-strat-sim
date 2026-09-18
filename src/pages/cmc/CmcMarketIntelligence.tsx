import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Globe2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { SYMBOL_MAP } from '@/lib/cmc/symbols';
import { useCmcMarketData } from '@/hooks/useCmcMarketData';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { CmcDisabledNotice } from '@/components/cmc/CmcDisabledNotice';

const fmtUsd = (value: number) =>
  value >= 1_000_000_000
    ? `$${(value / 1_000_000_000).toFixed(2)}B`
    : value >= 1_000_000
      ? `$${(value / 1_000_000).toFixed(2)}M`
      : `$${value.toLocaleString(undefined, { maximumFractionDigits: 4 })}`;

const pctClass = (value: number) =>
  value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground';

export default function CmcMarketIntelligence() {
  const { quotes, global, fearGreed, loading, error, lastFetched, refresh } = useCmcMarketData();

  if (!CMC_ENABLED) return <CmcDisabledNotice />;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold">CMC Market Intelligence</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              HACKATHON MODULE
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Read-only CoinMarketCap enrichment. Does not generate trades, alter signals, or replace platform candles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge provenance="LIVE_CMC" />
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
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

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle className="text-sm">CoinMarketCap data unavailable</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Market Cap', value: global ? fmtUsd(global.totalMarketCap) : null },
          { label: '24h Volume', value: global ? fmtUsd(global.totalVolume24h) : null },
          { label: 'BTC Dominance', value: global ? `${global.btcDominance.toFixed(2)}%` : null },
          {
            label: 'Fear & Greed',
            value: fearGreed ? `${fearGreed.value} · ${fearGreed.classification}` : null,
          },
        ].map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metric.value === null ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-lg font-semibold">{metric.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">Tracked Assets</CardTitle>
          <DataSourceBadge provenance="LIVE_CMC" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Platform Pair</th>
                <th className="py-2 pr-3">CMC Symbol</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3 text-right">Price</th>
                <th className="py-2 pr-3 text-right">1h</th>
                <th className="py-2 pr-3 text-right">24h</th>
                <th className="py-2 pr-3 text-right">7d</th>
                <th className="py-2 pr-3 text-right">Market Cap</th>
                <th className="py-2 text-right">Rank</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 &&
                SYMBOL_MAP.map((m) => (
                  <tr key={m.pair} className="border-b border-border/30">
                    <td className="py-2 pr-3 font-mono text-xs">{m.pair}</td>
                    <td className="py-2 pr-3 font-mono text-xs">{m.cmc}</td>
                    <td className="py-2 pr-3">{m.name}</td>
                    <td colSpan={6} className="py-2 text-right text-xs text-muted-foreground">
                      {loading ? 'Loading live CMC data…' : 'No live data'}
                    </td>
                  </tr>
                ))}
              {quotes.map((q) => (
                <tr key={q.cmcSymbol} className="border-b border-border/30">
                  <td className="py-2 pr-3 font-mono text-xs">{q.pairSymbol}</td>
                  <td className="py-2 pr-3 font-mono text-xs">{q.cmcSymbol}</td>
                  <td className="py-2 pr-3">{q.name}</td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtUsd(q.price)}</td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange1h)}`}>
                    {q.percentChange1h.toFixed(2)}%
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange24h)}`}>
                    {q.percentChange24h.toFixed(2)}%
                  </td>
                  <td className={`py-2 pr-3 text-right font-mono ${pctClass(q.percentChange7d)}`}>
                    {q.percentChange7d.toFixed(2)}%
                  </td>
                  <td className="py-2 pr-3 text-right font-mono">{fmtUsd(q.marketCap)}</td>
                  <td className="py-2 text-right font-mono">{q.rank ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {lastFetched ? `Last retrieved ${new Date(lastFetched).toLocaleTimeString()}` : 'Not yet retrieved'} ·
            Symbol translation via the extensible mapping layer (BTCUSDT → BTC, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
