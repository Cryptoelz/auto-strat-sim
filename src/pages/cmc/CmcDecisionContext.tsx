import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { CMC_ENABLED } from '@/lib/cmc/config';
import { getCmcRequestStats } from '@/lib/cmc/cache';
import { runIsolationChecks } from '@/lib/cmc/isolationCheck';
import { useCmcDecisionContext } from '@/hooks/useCmcDecisionContext';
import { CmcDisabledNotice } from '@/components/cmc/CmcDisabledNotice';
import { DataSourceBadge } from '@/components/cmc/DataSourceBadge';
import { CmcExplainabilityPanel } from '@/components/cmc/CmcExplainabilityPanel';
import { CmcJudgeEvidencePanel } from '@/components/cmc/CmcJudgeEvidencePanel';
import { CmcContextDiagnosticsPanel } from '@/components/cmc/CmcContextDiagnosticsPanel';
import { CmcDecisionContextTable } from '@/components/cmc/CmcDecisionContextTable';
import { CmcProvenanceNote } from '@/components/cmc/CmcProvenanceNote';

export default function CmcDecisionContextPage() {
  if (!CMC_ENABLED) return <CmcDisabledNotice />;
  return <DecisionContextView />;
}

function DecisionContextView() {
  const { records, diagnostics, capturing, clear } = useCmcDecisionContext();
  const checks = useMemo(() => runIsolationChecks(records), [records]);
  const verified = checks.every((c) => c.passed);
  const cacheHits = getCmcRequestStats().cacheHits;

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold">CMC Decision Context™</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              HACKATHON MODULE · STAGE 3B
            </Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            CoinMarketCap market conditions surrounding independently generated CryptoTrader decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataSourceBadge provenance="LIVE_CMC" />
          {capturing && <Badge variant="outline" className="text-[10px]">CAPTURING…</Badge>}
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Clear context log
          </Button>
        </div>
      </header>

      <CmcExplainabilityPanel />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <CmcContextDiagnosticsPanel diagnostics={diagnostics} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Isolation checks (runtime)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {checks.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 text-xs">
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
            </CardContent>
          </Card>
        </div>
        <CmcJudgeEvidencePanel diagnostics={diagnostics} cacheHits={cacheHits} isolationVerified={verified} />
      </div>

      <CmcDecisionContextTable records={records} />

      <CmcProvenanceNote />
    </div>
  );
}
