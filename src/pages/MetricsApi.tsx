import { useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiEndpoints, metricsPayload, downloadText } from '@/lib/enterprise';
import { Copy, Download, PlugZap, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

export default function MetricsApi() {
  const endpoints = apiEndpoints();
  const [active, setActive] = useState(endpoints[0].path);
  const [called, setCalled] = useState<Record<string, number>>({});
  const endpoint = endpoints.find((e) => e.path === active) ?? endpoints[0];
  const body = JSON.stringify(endpoint.sample, null, 2);

  const call = () => {
    const t0 = performance.now();
    // Simulated internal call — the payload is computed locally, in-process. No network is used.
    void metricsPayload();
    setCalled((c) => ({ ...c, [endpoint.path]: performance.now() - t0 }));
  };

  return (
    <OsPage
      title="Institution Metrics API"
      subtitle="A simulated, internal, read-only metrics surface. It exposes structured institutional numbers for internal visualisations only — there is no server, no network transport, no authentication surface and no way to write anything back."
      department="Enterprise Layer"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => downloadText('atlas-metrics.json', JSON.stringify(metricsPayload(), null, 2))}>
          <Download className="h-3.5 w-3.5" /> Export payload
        </Button>
      }
    >
      <section className="flex flex-wrap gap-3">
        {[
          { icon: ShieldOff, label: 'External connectivity', value: 'None' },
          { icon: ShieldOff, label: 'Write operations', value: 'None' },
          { icon: PlugZap, label: 'Transport', value: 'In-process only' },
          { icon: PlugZap, label: 'Endpoints', value: `${endpoints.length} read-only` },
        ].map((c) => (
          <div key={c.label} className="flex min-w-[180px] flex-1 items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3">
            <c.icon className="h-4 w-4 text-trading-gold" aria-hidden="true" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="text-sm text-foreground">{c.value}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <nav aria-label="Metrics endpoints" className="space-y-1.5">
          {endpoints.map((e) => (
            <button
              key={e.path}
              onClick={() => setActive(e.path)}
              aria-current={active === e.path ? 'true' : undefined}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                active === e.path ? 'border-trading-gold/50 bg-trading-gold/[0.06]' : 'border-border/50 bg-card/40 hover:border-trading-gold/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-trading-gold/40 text-[9px] text-trading-gold">{e.method}</Badge>
                <span className="font-mono text-[10.5px] text-foreground">{e.path}</span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{e.description}</p>
            </button>
          ))}
        </nav>

        <section className="rounded-lg border border-border/50 bg-card/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
            <h2 className="font-mono text-xs text-foreground">{endpoint.method} {endpoint.path}</h2>
            <div className="flex items-center gap-2">
              {called[endpoint.path] !== undefined && (
                <span className="font-mono text-[10px] text-muted-foreground">200 OK · {called[endpoint.path].toFixed(2)} ms · in-process</span>
              )}
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={call}>Run simulated call</Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 text-[11px]"
                onClick={() => { navigator.clipboard?.writeText(body); toast.success('Response copied'); }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          </div>
          <pre className="mt-3 max-h-[520px] overflow-auto rounded-md border border-border/40 bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
{body}
          </pre>
        </section>
      </div>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Read Only', 'Simulated Endpoint', 'No API Keys', 'No Exchange Connectivity'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
