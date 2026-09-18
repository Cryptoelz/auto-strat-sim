import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Info, ListTree } from 'lucide-react';
import { fmtPct, fmtUsd, pctClass } from '@/lib/cmc/format';
import type { CmcDecisionContextRecord, ContextDataState } from '@/lib/cmc/decisionContext';

const STATE_STYLE: Record<ContextDataState, string> = {
  LIVE: 'border-trading-profit/50 bg-trading-profit/10 text-trading-profit',
  CACHED: 'border-primary/50 bg-primary/10 text-primary',
  STALE: 'border-trading-warning/50 bg-trading-warning/10 text-trading-warning',
  UNAVAILABLE: 'border-destructive/50 bg-destructive/10 text-destructive',
};

const STATE_LABEL: Record<ContextDataState, string> = {
  LIVE: 'LIVE',
  CACHED: 'CACHED',
  STALE: 'STALE',
  UNAVAILABLE: 'CONTEXT UNAVAILABLE',
};

const dash = '—';

/** Deterministic, descriptive regime label — no recommendation, no direction call. */
export function regimeLabel(record: CmcDecisionContextRecord): string {
  const cap = record.context.marketCapChange24h;
  const breadth = record.context.breadth24hPositivePct;
  if (cap === null && breadth === null) return dash;
  const capPart =
    cap === null ? 'cap n/a' : cap > 0.5 ? 'Cap expanding' : cap < -0.5 ? 'Cap contracting' : 'Cap flat';
  const breadthPart = breadth === null ? '' : ` · ${breadth.toFixed(0)}% positive`;
  return `${capPart}${breadthPart}`;
}

function ageLabel(ms: number | null): string {
  if (ms === null) return dash;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60_000)}m`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-xs font-medium">{value}</span>
    </div>
  );
}

export function CmcDecisionContextTable({ records }: { records: CmcDecisionContextRecord[] }) {
  const [selected, setSelected] = useState<CmcDecisionContextRecord | null>(null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ListTree className="h-4 w-4 text-primary" aria-hidden="true" />
          Decision context timeline
          <Badge variant="outline" className="text-[10px]">{records.length} records</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {records.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No engine decisions observed yet. Start a paper-trading session — each decision the engine independently
            produces will be recorded here with its surrounding CoinMarketCap context.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Engine decision</TableHead>
                  <TableHead>CMC market regime</TableHead>
                  <TableHead className="text-right">Fear &amp; Greed</TableHead>
                  <TableHead className="text-right">BTC dom.</TableHead>
                  <TableHead className="text-right">Breadth 24h</TableHead>
                  <TableHead className="text-right">Asset 24h</TableHead>
                  <TableHead className="text-right">Snapshot age</TableHead>
                  <TableHead>Data state</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.contextId}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{r.asset}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-medium">{r.decisionType}</span>
                      <span className="ml-1 text-muted-foreground">· {r.decisionOutcome}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{regimeLabel(r)}</TableCell>
                    <TableCell className="text-right text-xs">
                      {r.context.fearGreedValue === null
                        ? dash
                        : `${r.context.fearGreedValue} · ${r.context.fearGreedClassification ?? dash}`}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {r.context.btcDominance === null ? dash : `${r.context.btcDominance.toFixed(2)}%`}
                    </TableCell>
                    <TableCell className="text-right text-xs">
                      {r.context.breadth24hPositivePct === null
                        ? dash
                        : `${r.context.breadth24hPositivePct.toFixed(0)}%`}
                    </TableCell>
                    <TableCell className={`text-right text-xs ${r.context.assetChange24h === null ? '' : pctClass(r.context.assetChange24h)}`}>
                      {r.context.assetChange24h === null ? dash : fmtPct(r.context.assetChange24h)}
                    </TableCell>
                    <TableCell className="text-right text-xs">{ageLabel(r.provenance.snapshotAgeMs)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${STATE_STYLE[r.dataState]}`}>
                        {STATE_LABEL[r.dataState]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(r)} aria-label="Provenance details">
                        <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Context provenance</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Event</p>
                <DetailRow label="Context ID" value={<code className="text-[10px]">{selected.contextId}</code>} />
                <DetailRow label="Event ID" value={<code className="text-[10px]">{selected.eventId}</code>} />
                <DetailRow label="Timestamp" value={new Date(selected.timestamp).toLocaleString()} />
                <DetailRow label="Asset" value={selected.asset} />
                <DetailRow label="Decision type" value={selected.decisionType} />
                <DetailRow label="Outcome" value={selected.decisionOutcome} />
                <DetailRow label="Engine detail" value={selected.detail ?? dash} />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">CMC context</p>
                <DetailRow
                  label="Total market cap"
                  value={selected.context.totalMarketCap === null ? 'unavailable' : fmtUsd(selected.context.totalMarketCap)}
                />
                <DetailRow
                  label="Market cap 24h"
                  value={selected.context.marketCapChange24h === null ? 'unavailable' : fmtPct(selected.context.marketCapChange24h)}
                />
                <DetailRow
                  label="Total 24h volume"
                  value={selected.context.totalVolume24h === null ? 'unavailable' : fmtUsd(selected.context.totalVolume24h)}
                />
                <DetailRow
                  label="Volume 24h change"
                  value={selected.context.volumeChange24h === null ? 'unavailable' : fmtPct(selected.context.volumeChange24h)}
                />
                <DetailRow
                  label="BTC dominance"
                  value={selected.context.btcDominance === null ? 'unavailable' : `${selected.context.btcDominance.toFixed(2)}%`}
                />
                <DetailRow
                  label="ETH dominance"
                  value={selected.context.ethDominance === null ? 'unavailable' : `${selected.context.ethDominance.toFixed(2)}%`}
                />
                <DetailRow
                  label="Fear & Greed"
                  value={
                    selected.context.fearGreedValue === null
                      ? 'unavailable'
                      : `${selected.context.fearGreedValue} (${selected.context.fearGreedClassification ?? dash})`
                  }
                />
                <DetailRow
                  label="Breadth 1h / 24h / 7d"
                  value={
                    selected.context.breadth24hPositivePct === null
                      ? 'unavailable'
                      : `${(selected.context.breadth1hPositivePct ?? 0).toFixed(0)}% / ${(selected.context.breadth24hPositivePct ?? 0).toFixed(0)}% / ${(selected.context.breadth7dPositivePct ?? 0).toFixed(0)}% positive of ${selected.context.breadthAssetCount ?? 0}`
                  }
                />
                <DetailRow label="Asset CMC rank" value={selected.context.assetCmcRank ?? 'unavailable'} />
                <DetailRow
                  label="Asset 1h / 24h / 7d"
                  value={
                    selected.context.assetChange24h === null
                      ? 'unavailable'
                      : `${fmtPct(selected.context.assetChange1h ?? 0)} / ${fmtPct(selected.context.assetChange24h)} / ${fmtPct(selected.context.assetChange7d ?? 0)}`
                  }
                />
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Provenance</p>
                <DetailRow label="Source" value={selected.provenance.source} />
                <DetailRow label="Purpose" value={selected.provenance.purpose} />
                <DetailRow label="Causal influence" value={String(selected.provenance.causalInfluence)} />
                <DetailRow
                  label="CMC fetchedAt"
                  value={selected.provenance.fetchedAt ? new Date(selected.provenance.fetchedAt).toLocaleString() : 'unavailable'}
                />
                <DetailRow label="Snapshot age" value={ageLabel(selected.provenance.snapshotAgeMs)} />
                <DetailRow label="Cache status" value={selected.provenance.cacheStatus} />
                <DetailRow label="Stale" value={String(selected.provenance.stale)} />
                <DetailRow label="Unavailable reason" value={selected.provenance.unavailableReason ?? dash} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
