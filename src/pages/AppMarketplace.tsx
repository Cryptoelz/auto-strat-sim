import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, BookOpen, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { MARKET_APPS, type MarketApp } from '@/lib/platform';

const KIND_LABEL: Record<string, string> = {
  graph: 'Graph view', table: 'Table view', timeline: 'Timeline view', chart: 'Chart view', report: 'Report view',
};

function ScreenshotFrame({ title, caption, kind }: { title: string; caption: string; kind: string }) {
  return (
    <figure className="overflow-hidden rounded-lg border border-border/50 bg-muted/20">
      <div className="flex h-28 items-center justify-center border-b border-border/40 bg-gradient-to-br from-trading-gold/[0.08] via-transparent to-transparent">
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ImageIcon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.18em]">{KIND_LABEL[kind] ?? 'Preview'}</span>
        </div>
      </div>
      <figcaption className="p-3">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{caption}</p>
      </figcaption>
    </figure>
  );
}

export default function AppMarketplace() {
  const [selected, setSelected] = useState<MarketApp>(MARKET_APPS[0]);

  return (
    <OsPage
      title="Institution App Marketplace™"
      subtitle="A simulated catalogue of institutional applications. Nothing is downloaded, installed or executed — each listing documents what a module provides and what it depends on."
      department="Platform"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/extensions"><Store className="h-3.5 w-3.5" aria-hidden="true" /> Extensions</Link></Button>}
    >
      <section className="grid gap-3 lg:grid-cols-[1fr_1.35fr]">
        <div className="space-y-2">
          {MARKET_APPS.map((a) => {
            const active = a.id === selected.id;
            return (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                aria-pressed={active}
                className={`w-full rounded-lg border p-4 text-left transition-colors ${active ? 'border-trading-gold/40 bg-trading-gold/[0.06]' : 'border-border/50 bg-card/40 hover:bg-card/70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{a.category} · v{a.version} · {a.publisher}</p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${a.state === 'Installed' ? 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold' : 'border-border/60 text-muted-foreground'}`}>
                    {a.state}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{a.description}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-lg border border-border/50 bg-card/40 p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{selected.category} · v{selected.version} · {selected.publisher}</p>
            </div>
            {selected.route ? (
              <Button asChild size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
                <Link to={selected.route}>Open module <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
              </Button>
            ) : (
              <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">Simulation only · no download</Badge>
            )}
          </header>

          <p className="text-sm text-muted-foreground">{selected.description}</p>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Highlights</h3>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {selected.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-xs text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold" aria-hidden="true" />{h}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Screenshots</h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {selected.screenshots.map((s) => <ScreenshotFrame key={s.title} {...s} />)}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Documentation
            </h3>
            <dl className="mt-2 space-y-2">
              {selected.documentation.map((d) => (
                <div key={d.heading} className="rounded-md border border-border/40 bg-muted/10 p-3">
                  <dt className="text-xs font-medium text-foreground">{d.heading}</dt>
                  <dd className="mt-0.5 text-[11px] text-muted-foreground">{d.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Dependencies</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.dependencies.map((d) => (
                <Badge key={d} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{d}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>
    </OsPage>
  );
}
