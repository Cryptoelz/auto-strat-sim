import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Award } from 'lucide-react';
import { CMC_READ_ONLY } from '@/lib/cmc/config';
import type { ContextDiagnostics } from '@/lib/cmc/decisionContext';

interface Props {
  diagnostics: ContextDiagnostics;
  cacheHits: number;
  isolationVerified: boolean;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-1.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

export function CmcJudgeEvidencePanel({ diagnostics, cacheHits, isolationVerified }: Props) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Award className="h-4 w-4 text-primary" aria-hidden="true" />
          Hackathon Evidence
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Row label="Decision contexts recorded" value={diagnostics.captured} />
        <Row label="CMC source" value="CoinMarketCap API (server-side proxy)" />
        <Row label="API calls saved through caching" value={cacheHits} />
        <Row label="Additional API calls from Decision Context" value={diagnostics.extraApiCalls} />
        <Row label="Stale contexts" value={diagnostics.stale} />
        <Row label="Unavailable contexts" value={diagnostics.unavailable} />
        <Row label="Trading engine modified" value={<span className="text-trading-profit">NO</span>} />
        <Row label="CMC causal influence" value={<span className="text-trading-profit">NONE</span>} />
        <Row label="Execution mode" value="Simulation only (paper)" />
        <Row label="Read-only enrichment flag" value={String(CMC_READ_ONLY)} />
        <div className="pt-3">
          {isolationVerified ? (
            <Badge variant="outline" className="border-trading-profit/50 bg-trading-profit/10 text-[10px] text-trading-profit">
              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
              ISOLATION VERIFIED
            </Badge>
          ) : (
            <Badge variant="outline" className="border-trading-warning/50 text-[10px] text-trading-warning">
              ISOLATION CHECK PENDING
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
