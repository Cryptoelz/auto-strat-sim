import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Puzzle, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  EXTENSIONS, EXTENSION_CATEGORIES, extensionSummary, PLATFORM_VERSION, PLATFORM_GUARANTEES,
  type ExtensionCategory,
} from '@/lib/platform';

const STATUS_TONE: Record<string, string> = {
  Active: 'border-trading-gold/40 bg-trading-gold/10 text-trading-gold',
  Enabled: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  'Observation Only': 'border-sky-500/40 bg-sky-500/10 text-sky-400',
  Bundled: 'border-border bg-muted/40 text-muted-foreground',
};

export default function ExtensionManager() {
  const [category, setCategory] = useState<ExtensionCategory | 'All'>('All');
  const summary = useMemo(() => extensionSummary(), []);
  const list = useMemo(
    () => (category === 'All' ? EXTENSIONS : EXTENSIONS.filter((e) => e.category === category)),
    [category],
  );

  return (
    <OsPage
      title="ATLAS Extension Manager™"
      subtitle="Every capability in the institution is delivered as a modular extension. This register is read-only: nothing here can be installed, disabled or executed."
      department="Platform"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/marketplace"><Puzzle className="h-3.5 w-3.5" aria-hidden="true" /> Marketplace</Link></Button>}
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Installed extensions', value: String(summary.total) },
          { label: 'Institutional surfaces', value: String(summary.surfaces) },
          { label: 'Publishing teams', value: String(summary.authors) },
          { label: 'Core version', value: 'v6.0' },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border/50 bg-card/40 p-4">
            <p className="font-mono text-xl text-trading-gold">{k.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter extensions by category">
          {(['All', ...EXTENSION_CATEGORIES] as const).map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? 'default' : 'outline'}
              onClick={() => setCategory(c as ExtensionCategory | 'All')}
              className="h-7 text-[11px]"
              aria-pressed={category === c}
            >
              {c}
              {c !== 'All' && (
                <span className="ml-1.5 text-muted-foreground">
                  {summary.byCategory.find((b) => b.category === c)?.count ?? 0}
                </span>
              )}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((e) => (
            <article key={e.id} className="rounded-lg border border-border/50 bg-card/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{e.name}</h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{e.category} · v{e.version} · {e.author}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] ${STATUS_TONE[e.status]}`}>{e.status}</Badge>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{e.summary}</p>

              <dl className="mt-3 grid grid-cols-1 gap-2 text-[11px] sm:grid-cols-2">
                <div>
                  <dt className="uppercase tracking-[0.14em] text-muted-foreground/70">Dependencies</dt>
                  <dd className="text-foreground">{e.dependencies.join(', ')}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.14em] text-muted-foreground/70">Compatibility</dt>
                  <dd className="text-foreground">{e.compatibility}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="uppercase tracking-[0.14em] text-muted-foreground/70">Institution impact</dt>
                  <dd className="text-foreground">{e.impact}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                <span className="text-[11px] text-muted-foreground">{e.surfaces} surface{e.surfaces === 1 ? '' : 's'}</span>
                <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-[11px]">
                  <Link to={e.route}>Open <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-trading-gold" aria-hidden="true" /> Platform governance
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          No extension may weaken an institutional guarantee. {PLATFORM_VERSION}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORM_GUARANTEES.map((g) => (
            <Badge key={g} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{g}</Badge>
          ))}
        </div>
      </section>
    </OsPage>
  );
}
