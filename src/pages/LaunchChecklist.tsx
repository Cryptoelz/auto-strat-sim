import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { launchChecklist, launchExport, downloadText, ACCESSIBILITY_AUDIT, CONSISTENCY_AUDIT } from '@/lib/enterprise';
import { Download, Rocket, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const statusMeta = {
  ready: { label: 'Ready', cls: 'text-trading-gold border-trading-gold/40', Icon: CheckCircle2 },
  monitor: { label: 'Monitor', cls: 'text-amber-400 border-amber-400/40', Icon: AlertCircle },
  gap: { label: 'Gap', cls: 'text-rose-400 border-rose-400/40', Icon: XCircle },
} as const;

export default function LaunchChecklist() {
  const c = launchChecklist();
  const [open, setOpen] = useState<string | null>(c.dimensions[0].key);

  return (
    <OsPage
      title="Enterprise Launch Checklist"
      subtitle="Final readiness scoring across nine dimensions, each backed by evidence taken from the live institution. The checklist is advisory: it tells an executive whether ATLAS is ready to demonstrate, it does not authorise anything."
      department="Enterprise Layer"
      actions={
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => downloadText('atlas-launch-checklist.md', launchExport())}>
            <Download className="h-3.5 w-3.5" /> Export report
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => downloadText('atlas-launch-checklist.json', JSON.stringify(c, null, 2))}>
            <Download className="h-3.5 w-3.5" /> Export JSON
          </Button>
        </>
      }
    >
      <section className="rounded-lg border border-trading-gold/25 bg-trading-gold/[0.05] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-trading-gold">
              <Rocket className="h-3.5 w-3.5" aria-hidden="true" /> Overall launch score
            </p>
            <p className="mt-2 font-mono text-5xl leading-none text-trading-gold">{c.total}</p>
            <p className="mt-2 text-sm text-foreground">{c.verdict}</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-right">
            <div><p className="font-mono text-2xl text-foreground">{c.grade}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Grade</p></div>
            <div><p className="font-mono text-2xl text-trading-gold">{c.dimensions.filter((d) => d.status === 'ready').length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ready</p></div>
            <div><p className="font-mono text-2xl text-amber-400">{c.dimensions.filter((d) => d.status !== 'ready').length}</p><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Open</p></div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        {c.dimensions.map((d) => {
          const m = statusMeta[d.status];
          const isOpen = open === d.key;
          return (
            <div key={d.key} className="rounded-lg border border-border/50 bg-card/40">
              <button
                onClick={() => setOpen(isOpen ? null : d.key)}
                aria-expanded={isOpen}
                className="flex w-full flex-wrap items-center gap-3 p-3 text-left"
              >
                <m.Icon className={`h-4 w-4 shrink-0 ${m.cls.split(' ')[0]}`} aria-hidden="true" />
                <span className="min-w-[170px] flex-1 text-xs font-medium text-foreground">{d.label}</span>
                <span className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted/30 sm:block">
                  <span className={`block h-full rounded-full ${d.status === 'ready' ? 'bg-trading-gold' : d.status === 'monitor' ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${d.score}%` }} />
                </span>
                <span className="font-mono text-sm text-foreground">{d.score}</span>
                <span className="font-mono text-[10px] text-muted-foreground">weight {(d.weight * 100).toFixed(0)}%</span>
                <Badge variant="outline" className={`text-[9.5px] uppercase tracking-wider ${m.cls}`}>{m.label}</Badge>
              </button>
              {isOpen && (
                <ul className="space-y-1.5 border-t border-border/40 p-3">
                  {d.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold/70" aria-hidden="true" />
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {[{ title: 'Accessibility review', rows: ACCESSIBILITY_AUDIT, to: '/settings' }, { title: 'Visual consistency audit', rows: CONSISTENCY_AUDIT, to: '/docs' }].map((panel) => (
          <section key={panel.title} className="rounded-lg border border-border/50 bg-card/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">{panel.title}</h2>
              <Link to={panel.to} className="text-[10px] text-trading-gold hover:underline">Open related module</Link>
            </div>
            <ul className="space-y-1.5">
              {panel.rows.map((r) => (
                <li key={r.area} className="rounded-md border border-border/40 bg-background/30 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">{r.area}</p>
                    <Badge variant="outline" className={`text-[9px] uppercase tracking-wider ${r.status === 'pass' ? 'border-trading-gold/40 text-trading-gold' : 'border-amber-400/40 text-amber-400'}`}>{r.status}</Badge>
                  </div>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{r.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Observation Only', 'Advisory Only', 'Human Approval Required', 'No Live Trading'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
