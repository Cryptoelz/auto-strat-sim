import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Download, ShieldCheck, Trash2 } from 'lucide-react';
import { AUDIT_ENABLED, AUDIT_MAX_EVENTS, AUDIT_STORAGE_KEY } from '@/lib/audit/config';
import { useEngineAuditLedger } from '@/hooks/useEngineAuditLedger';
import { EngineAuditTable } from '@/components/audit/EngineAuditTable';

const ALL = '__all__';

export default function EngineDecisionAudit() {
  const { events, summary, storage, clear, exportJson } = useEngineAuditLedger();
  const [asset, setAsset] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);

  const types = useMemo(() => Object.keys(summary.byType).sort(), [summary.byType]);
  const filtered = useMemo(
    () => events.filter((e) => (asset === ALL || e.asset === asset) && (type === ALL || e.eventType === type)),
    [events, asset, type],
  );

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${AUDIT_STORAGE_KEY}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!AUDIT_ENABLED) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Engine Decision Audit™ disabled</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            The audit observer is switched off. No events are captured and no storage is written.
            CryptoTrader operates exactly as it does with the observer enabled.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold">ENGINE DECISION AUDIT™</h1>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
              STAGE 3C · OBSERVER
            </Badge>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Persistent evidence of genuine decisions produced independently by the CryptoTrader
            simulation engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={download}>
            <Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={clear}>
            <Trash2 className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Clear ledger
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Ledger status</CardTitle></CardHeader>
        <CardContent className="grid gap-3 pt-0 text-xs sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="Genuine events captured" value={String(summary.total)} />
          <Stat label="Latest event" value={summary.latestTimestamp ? new Date(summary.latestTimestamp).toLocaleString() : '—'} />
          <Stat label="Assets represented" value={summary.assets.length ? summary.assets.join(', ') : '—'} />
          <Stat label="Storage" value={`${storage.available ? 'OK' : 'UNAVAILABLE'} · ${storage.persisted}/${AUDIT_MAX_EVENTS}`} />
          <Stat label="Observer" value="ACTIVE · passive subscriber" />
          <Stat label="Engine modified" value="NO" />
          <Stat label="Source module" value="logger (existing public API)" />
          <Stat label="Event counts by type" value={types.length ? types.map((t) => `${t}: ${summary.byType[t]}`).join(' · ') : '—'} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Select value={asset} onValueChange={setAsset}>
          <SelectTrigger className="w-44 text-xs"><SelectValue placeholder="Asset" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All assets</SelectItem>
            {summary.assets.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-52 text-xs"><SelectValue placeholder="Event type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All event types</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <EngineAuditTable events={filtered} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
