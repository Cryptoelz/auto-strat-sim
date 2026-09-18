import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import type { ContextDiagnostics } from '@/lib/cmc/decisionContext';

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/20 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-base font-semibold ${tone ?? ''}`}>{value}</p>
    </div>
  );
}

export function CmcContextDiagnosticsPanel({ diagnostics }: { diagnostics: ContextDiagnostics }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-primary" aria-hidden="true" />
          Context capture diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 pt-0 sm:grid-cols-3">
        <Stat label="Snapshots captured" value={diagnostics.captured} />
        <Stat label="Live CMC" value={diagnostics.live} />
        <Stat label="Using cached data" value={diagnostics.cached} />
        <Stat label="Using stale data" value={diagnostics.stale} tone={diagnostics.stale ? 'text-trading-warning' : ''} />
        <Stat
          label="Context unavailable"
          value={diagnostics.unavailable}
          tone={diagnostics.unavailable ? 'text-destructive' : ''}
        />
        <Stat
          label="Extra API calls"
          value={diagnostics.extraApiCalls}
          tone={diagnostics.extraApiCalls === 0 ? 'text-trading-profit' : 'text-trading-warning'}
        />
      </CardContent>
    </Card>
  );
}
