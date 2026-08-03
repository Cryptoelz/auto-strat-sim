import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { documentation, downloadText, ENTERPRISE_VERSION } from '@/lib/enterprise';
import { Download, BookOpen } from 'lucide-react';

export default function DocumentationCentre() {
  const sections = documentation();
  const [active, setActive] = useState(sections[0].key);
  const section = sections.find((s) => s.key === active) ?? sections[0];

  const exportDocs = () => {
    const lines: string[] = [`# ATLAS OS™ — Documentation`, '', ENTERPRISE_VERSION, `Generated ${new Date().toISOString()}`, ''];
    sections.forEach((s) => {
      lines.push(`## ${s.title}`, '', s.blurb, '');
      s.blocks.forEach((b) => {
        lines.push(`### ${b.heading}`, '', b.body, '');
        (b.bullets ?? []).forEach((x) => lines.push(`- ${x}`));
        lines.push('');
      });
    });
    downloadText('atlas-documentation.md', lines.join('\n'));
  };

  return (
    <OsPage
      title="Documentation Centre"
      subtitle="Documentation generated directly from the live institution: architecture, departments, knowledge graph, Oracle, Explorer, governance, both lifecycles, glossary and system map. Nothing here is hand-maintained, so it can never drift from the platform."
      department="Enterprise Layer"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportDocs}>
          <Download className="h-3.5 w-3.5" /> Export all
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Documentation sections" className="rounded-lg border border-border/50 bg-card/40 p-2">
          <ul className="space-y-0.5">
            {sections.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => setActive(s.key)}
                  aria-current={active === s.key ? 'page' : undefined}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors ${
                    active === s.key ? 'bg-trading-gold/15 text-trading-gold' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  }`}
                >
                  {s.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <article className="rounded-lg border border-border/50 bg-card/40 p-5">
          <header className="border-b border-border/40 pb-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <BookOpen className="h-4 w-4 text-trading-gold" aria-hidden="true" /> {section.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{section.blurb}</p>
          </header>
          <div className="mt-4 space-y-5">
            {section.blocks.map((b, i) => (
              <section key={`${section.key}-${i}`}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-trading-gold/90">{b.heading}</h3>
                {b.body && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{b.body}</p>}
                {b.bullets && (
                  <ul className="mt-2 space-y-1">
                    {b.bullets.map((x, j) => (
                      <li key={j} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold/70" aria-hidden="true" />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
          {section.key === 'system-map' && (
            <p className="mt-5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              Jump to <Link className="text-trading-gold hover:underline" to="/launch">Launch Checklist</Link> for the readiness scoring of everything listed above.
            </p>
          )}
        </article>
      </div>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Generated From Live Data', 'Read Only', 'Observation Only'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
