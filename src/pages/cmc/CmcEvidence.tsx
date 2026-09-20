/**
 * Stage 3D — CMC Evidence Summary (judge-facing, read-only).
 * Renders entirely from already-persisted data: no CMC API call is made here.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Globe2, XCircle } from 'lucide-react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { CMC_EVIDENCE_ENABLED } from '@/lib/cmc/evidenceConfig';
import { CMC_INPUTS, RETROSPECTIVE_LABEL, SMALL_SAMPLE_NOTE } from '@/lib/cmc/evidence';
import { useCmcEvidence } from '@/hooks/useCmcEvidence';
import { CmcDisabledNotice } from '@/components/cmc/CmcDisabledNotice';
import { EvidenceStatusCards } from '@/components/cmc/EvidenceStatusCards';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';

const ARCHITECTURE = [
  'Trading Engine (unmodified)',
  'Existing public decision / logger / completed-trade evidence',
  'Engine Audit Ledger',
  'CMC Context Observer',
  'CMC Evidence',
];

export default function CmcEvidencePage() {
  if (!CMC_ENABLED || !CMC_EVIDENCE_ENABLED) return <CmcDisabledNotice />;
  return <EvidenceView />;
}

function EvidenceView() {
  const { bundle, exportJson } = useCmcEvidence();
  const t = bundle.totals;

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cmc-evidence-bundle.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold">CMC EVIDENCE SUMMARY</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              HACKATHON · STAGE 3D
            </Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            One page showing how CoinMarketCap data is used in this project, and the genuine,
            verifiable evidence behind that claim.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge provenance="LIVE_CMC" />
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Export CMC evidence
          </Button>
        </div>
      </header>

      <EvidenceStatusCards bundle={bundle} />

      {/* 1 — what is this */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">1 · What is this?</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <p>CryptoTrader is a simulation-only trading research platform. No live orders are ever placed.</p>
          <p>CoinMarketCap data is used as an independent market-context and explainability layer.</p>
          <p className="font-medium text-foreground">CMC data does not control trading decisions.</p>
        </CardContent>
      </Card>

      {/* 2 — what CMC data is used */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">2 · What CoinMarketCap data is used?</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          {CMC_INPUTS.map((input) => (
            <div key={input.endpoint} className="rounded border border-border/60 p-3">
              <p className="font-mono text-[11px] text-primary">{input.endpoint}</p>
              <p className="mt-1 text-muted-foreground">{input.purpose}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{input.fields.join(' · ')}</p>
            </div>
          ))}
          <p className="text-muted-foreground">
            Tracked assets: {bundle.configuration.trackedAssets.join(', ')} · every request is proxied by the
            server function <span className="font-mono">{bundle.configuration.proxyFunction}</span>.
          </p>
        </CardContent>
      </Card>

      {/* 3 — how CMC connects */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">3 · How is CMC connected to engine decisions?</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="space-y-1">
            {ARCHITECTURE.map((step, i) => (
              <div key={step}>
                <p className="font-mono text-[11px]">{step}</p>
                {i < ARCHITECTURE.length - 1 && <p className="text-muted-foreground">↓</p>}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline" className="text-[10px]">CAUSAL INFLUENCE: NONE</Badge>
            <Badge variant="outline" className="text-[10px]">ENGINE MODIFIED: NO</Badge>
            <Badge variant="outline" className="text-[10px]">SIMULATION ONLY: YES</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 4 — verified evidence */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">4 · Verified evidence</CardTitle></CardHeader>
        <CardContent className="grid gap-3 pt-0 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total audit events" value={t.totalAuditEvents} />
          <Stat label="Live logger events" value={t.liveLoggerEvents} />
          <Stat label="Backfilled completed trades" value={t.backfilledCompletedTrades} />
          <Stat label="Contemporaneous CMC context" value={t.contemporaneousContextRecords} />
          <Stat label="Retrospective records" value={t.retrospectiveRecords} />
          <Stat label="Assets represented" value={t.assets.length ? t.assets.join(', ') : '—'} />
          <Stat
            label="Storage"
            value={`${bundle.storage.available ? 'OK' : 'ERROR'} · ${bundle.storage.persisted}/${bundle.configuration.auditStore.maxEvents}`}
          />
          <Stat
            label="Latest captured event"
            value={t.latestEventAt ? new Date(t.latestEventAt).toLocaleString() : 'none captured yet'}
          />
          <div className="sm:col-span-2 lg:col-span-4 text-muted-foreground">
            CMC context availability: LIVE {t.contextByState.LIVE} · CACHED {t.contextByState.CACHED} ·
            STALE {t.contextByState.STALE} · UNAVAILABLE {t.contextByState.UNAVAILABLE}.
            Historical / backfilled events remain labelled <span className="font-medium text-foreground">{RETROSPECTIVE_LABEL}</span> —
            historical CMC context is never reconstructed.
          </div>
        </CardContent>
      </Card>

      {/* 5 — integrity */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">5 · Data integrity &amp; API efficiency</CardTitle></CardHeader>
        <CardContent className="grid gap-3 pt-0 text-xs sm:grid-cols-2">
          <Stat label="API key" value="Server-side proxy only — never in browser code" />
          <Stat label="Cache duration" value={`${bundle.integrity.cacheTtlMs / 1000}s`} />
          <Stat label="Refresh throttle" value={`${bundle.integrity.throttleMs / 1000}s minimum spacing`} />
          <Stat label="Stale handling" value={bundle.integrity.staleHandling} />
          <Stat label="Unavailable handling" value={bundle.integrity.unavailableHandling} />
          <Stat label="Deduplication" value={bundle.integrity.deduplication} />
          <Stat label="Provenance" value={bundle.integrity.provenance} />
          <Stat label="Observer isolation" value={bundle.integrity.observerIsolation} />
          <Stat
            label="CMC requests this session"
            value={`${bundle.apiStats.networkRequests} network · ${bundle.apiStats.cacheHits} cache hits · ${bundle.apiStats.throttled} throttled · ${bundle.apiStats.rateLimited} rate-limited`}
          />
          <Stat label="Extra calls for context capture" value={bundle.apiStats.extraApiCallsForContextCapture} />
          <div className="sm:col-span-2 space-y-1">
            {bundle.isolationChecks.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  {c.passed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
                  )}
                  {c.label}
                </span>
                <span className="text-muted-foreground">{c.detail}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6 — export */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">6 · Judge evidence export</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs text-muted-foreground">
          <p>
            Downloads one JSON bundle: configuration that is safe to expose, audit summary, captured CMC
            context records, provenance, live vs retrospective classification, cache statistics, isolation
            verification and known limitations. No API key, secret or credential is included.
          </p>
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Export CMC evidence
          </Button>
          <ul className="list-disc space-y-1 pl-5">
            {bundle.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <p className="rounded border border-primary/30 bg-primary/5 p-3 text-foreground">{SMALL_SAMPLE_NOTE}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
