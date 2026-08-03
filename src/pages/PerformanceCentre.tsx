import { useEffect, useMemo, useState } from 'react';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { performanceMetrics, performanceSummary, downloadText, ENTERPRISE_VERSION } from '@/lib/enterprise';
import { Download, RefreshCw, Gauge } from 'lucide-react';

export default function PerformanceCentre() {
  const [tick, setTick] = useState(0);
  const metrics = useMemo(() => performanceMetrics(), [tick]);
  const summary = performanceSummary(metrics);
  const [fps, setFps] = useState<number | null>(null);

  // Measures real frame rate over one second. Read-only observation.
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      frames += 1;
      if (performance.now() - start < 1000) raf = requestAnimationFrame(loop);
      else setFps(frames);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick]);

  const exportReport = () => {
    const lines = [
      '# ATLAS OS™ — Performance Centre report',
      '',
      `Generated ${new Date().toISOString()}`,
      ENTERPRISE_VERSION,
      '',
      `Performance score: ${summary.score} — ${summary.verdict}`,
      `Measured frame rate: ${fps ?? 'measuring'} fps`,
      '',
      ...metrics.map((m) => `- ${m.label}: ${m.value} (budget ${m.budget}, ${m.tone}) — ${m.note}`),
      '',
      'Read Only · Observation Only · No external connectivity.',
    ];
    downloadText('atlas-performance-report.md', lines.join('\n'));
  };

  return (
    <OsPage
      title="Performance Centre"
      subtitle="Live, read-only diagnostics for the ATLAS OS front end. Every figure is measured in this browser session or derived from the size of the institutional knowledge base. Nothing here changes platform behaviour."
      department="Enterprise Layer"
      actions={
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setTick((t) => t + 1)}>
            <RefreshCw className="h-3.5 w-3.5" /> Re-measure
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportReport}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-4 sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Performance score</p>
          <p className="mt-1 font-mono text-3xl leading-none text-trading-gold">{summary.score}</p>
          <p className="mt-2 text-xs text-foreground">{summary.verdict}</p>
          <p className="mt-1 text-[10.5px] text-muted-foreground">{summary.weak} budgets exceeded · {summary.watch} approaching budget</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Measured frame rate</p>
          <p className="mt-1 font-mono text-3xl leading-none text-foreground">{fps ?? '—'}</p>
          <p className="mt-2 text-[10.5px] text-muted-foreground">Frames rendered in the last full second on this page.</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/40 p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Network calls</p>
          <p className="mt-1 font-mono text-3xl leading-none text-foreground">0</p>
          <p className="mt-2 text-[10.5px] text-muted-foreground">No API keys, no exchange connectivity, no outbound requests.</p>
        </div>
      </section>

      <section className="rounded-lg border border-border/50 bg-card/40 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          <Gauge className="h-3.5 w-3.5 text-trading-gold" aria-hidden="true" /> Diagnostics
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <caption className="sr-only">Read-only performance diagnostics with budgets</caption>
            <thead>
              <tr className="border-b border-border/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="pb-2 pr-3 font-medium">Metric</th>
                <th scope="col" className="pb-2 pr-3 text-right font-medium">Measured</th>
                <th scope="col" className="pb-2 pr-3 text-right font-medium">Budget</th>
                <th scope="col" className="pb-2 pr-3 font-medium">Status</th>
                <th scope="col" className="pb-2 font-medium">Explanation</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key} className="border-b border-border/25 align-top">
                  <td className="py-2 pr-3 text-xs font-medium text-foreground">{m.label}</td>
                  <td className="py-2 pr-3 text-right font-mono text-xs text-foreground">{m.value}</td>
                  <td className="py-2 pr-3 text-right font-mono text-[11px] text-muted-foreground">{m.budget}</td>
                  <td className="py-2 pr-3">
                    <Badge
                      variant="outline"
                      className={`text-[9.5px] uppercase tracking-wider ${m.tone === 'good' ? 'border-trading-gold/40 text-trading-gold' : m.tone === 'watch' ? 'border-amber-400/40 text-amber-400' : 'border-rose-400/40 text-rose-400'}`}
                    >
                      {m.tone === 'good' ? 'Within budget' : m.tone === 'watch' ? 'Monitor' : 'Exceeded'}
                    </Badge>
                  </td>
                  <td className="py-2 text-[11px] leading-relaxed text-muted-foreground">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Read Only', 'Observation Only', 'No External Connectivity', 'No Live Trading'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
