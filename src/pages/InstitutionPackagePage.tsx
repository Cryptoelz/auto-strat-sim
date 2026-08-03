import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Download, ArrowRight } from 'lucide-react';
import { institutionPackage, PLATFORM_GUARANTEES, PLATFORM_VERSION } from '@/lib/platform';

export default function InstitutionPackage() {
  const pkg = useMemo(() => institutionPackage(), []);

  const download = () => {
    const lines = [
      `# Institution Package — ${pkg.generated}`,
      `${PLATFORM_VERSION}`,
      '',
      `Objects: ${pkg.totals.objects} · Relationships: ${pkg.totals.relationships} · Departments: ${pkg.totals.departments} · Modules: ${pkg.totals.modules}`,
      '',
      ...pkg.sections.flatMap((s) => [`## ${s.title} (${s.count})`, ...s.items.map((i) => `- ${i}`), '']),
      '## Governance',
      ...PLATFORM_GUARANTEES.map((g) => `- ${g}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas-institution-package-${pkg.generated}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OsPage
      title="Institution Package™"
      subtitle="A complete, read-only bundle of the institution: architecture, knowledge, reports, documentation, screenshots, metrics, governance, exports and presentation material."
      department="Platform"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={download}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Export bundle
        </Button>
      }
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Knowledge objects', value: pkg.totals.objects },
          { label: 'Relationships', value: pkg.totals.relationships },
          { label: 'Departments', value: pkg.totals.departments },
          { label: 'Modules', value: pkg.totals.modules },
        ].map((k) => (
          <div key={k.label} className="rounded-lg border border-border/50 bg-card/40 p-4">
            <p className="font-mono text-xl text-trading-gold">{k.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{k.label}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {pkg.sections.map((s) => (
          <article key={s.key} className="flex flex-col rounded-lg border border-border/50 bg-card/40 p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="h-4 w-4 text-trading-gold" aria-hidden="true" /> {s.title}
              </h2>
              <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{s.count}</Badge>
            </div>
            <ul className="mt-3 flex-1 space-y-1">
              {s.items.map((i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-trading-gold/70" aria-hidden="true" />{i}
                </li>
              ))}
            </ul>
            <Button asChild size="sm" variant="ghost" className="mt-3 h-7 justify-start gap-1 px-0 text-[11px]">
              <Link to={s.route}>Inspect <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
            </Button>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5">
        <h2 className="text-sm font-semibold text-foreground">Bundle guarantees</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PLATFORM_GUARANTEES.map((g) => (
            <Badge key={g} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{g}</Badge>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">Generated in the browser on {pkg.generated}. No upload, no external transmission.</p>
      </section>
    </OsPage>
  );
}
