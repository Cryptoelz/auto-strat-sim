import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Button } from '@/components/ui/button';
import { Code2, ArrowRight } from 'lucide-react';
import { developerTopics, PLATFORM_VERSION } from '@/lib/platform';

export default function DeveloperCentre() {
  const topics = useMemo(() => developerTopics(), []);

  return (
    <OsPage
      title="Developer Centre™"
      subtitle="Reference documentation for anyone extending ATLAS: architecture, components, routing, knowledge, Oracle, Explorer, the institution engine, the extension SDK and the performance and accessibility guides."
      department="Platform"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/plugin-sdk"><Code2 className="h-3.5 w-3.5" aria-hidden="true" /> Plugin SDK</Link></Button>}
    >
      <nav aria-label="Developer topics" className="flex flex-wrap gap-1.5">
        {topics.map((t) => (
          <a key={t.key} href={`#${t.key}`} className="rounded-md border border-border/50 bg-card/40 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            {t.title}
          </a>
        ))}
      </nav>

      <section className="grid gap-3 lg:grid-cols-2">
        {topics.map((t) => (
          <article key={t.key} id={t.key} className="scroll-mt-20 rounded-lg border border-border/50 bg-card/40 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.summary}</p>
            <ul className="mt-3 space-y-1">
              {t.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[11px] text-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold" aria-hidden="true" />{p}
                </li>
              ))}
            </ul>
            {t.link && (
              <Button asChild size="sm" variant="ghost" className="mt-3 h-7 justify-start gap-1 px-0 text-[11px]">
                <Link to={t.link.to}>{t.link.label} <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
              </Button>
            )}
          </article>
        ))}
      </section>

      <p className="text-[11px] text-muted-foreground">{PLATFORM_VERSION}</p>
    </OsPage>
  );
}
