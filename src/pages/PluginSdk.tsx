import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Code2, Compass } from 'lucide-react';
import { SDK_SECTIONS, SDK_LIFECYCLE, PLATFORM_VERSION } from '@/lib/platform';

export default function PluginSdk() {
  return (
    <OsPage
      title="Plugin SDK™"
      subtitle="The single build standard for every future institutional module. Follow it and a new module inherits ATLAS navigation, evidence discipline, governance, styling, accessibility and performance without any core change."
      department="Platform"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/developer"><Code2 className="h-3.5 w-3.5" aria-hidden="true" /> Developer Centre</Link></Button>}
    >
      <section className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5">
        <h2 className="text-sm font-semibold text-foreground">Module lifecycle</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-5">
          {SDK_LIFECYCLE.map((s) => (
            <li key={s.step} className="rounded-md border border-border/40 bg-card/40 p-3">
              <p className="font-mono text-[11px] text-trading-gold">Step {s.step}</p>
              <p className="mt-1 text-xs font-medium text-foreground">{s.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-label="SDK sections" className="flex flex-wrap gap-1.5">
        {SDK_SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="rounded-md border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            {s.title}
          </a>
        ))}
      </nav>

      <section className="space-y-3">
        {SDK_SECTIONS.map((s) => (
          <article key={s.id} id={s.id} className="scroll-mt-20 rounded-lg border border-border/50 bg-card/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
              <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">Standard</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.intent}</p>
            <ul className="mt-3 space-y-1">
              {s.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-xs text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold" aria-hidden="true" />{r}
                </li>
              ))}
            </ul>
            {s.snippet && (
              <pre className="mt-3 overflow-x-auto rounded-md border border-border/40 bg-muted/20 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                <code>{s.snippet}</code>
              </pre>
            )}
          </article>
        ))}
      </section>

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Compass className="h-3.5 w-3.5" aria-hidden="true" /> {PLATFORM_VERSION} · every rule above is enforced by review, not by runtime code.
      </p>
    </OsPage>
  );
}
