import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Check } from 'lucide-react';
import { TEMPLATES } from '@/lib/platform';
import { useAtlasSettings } from '@/hooks/useAtlasSettings';

export default function InstitutionTemplates() {
  const [settings, update] = useAtlasSettings();
  const active = TEMPLATES.find((t) => t.key === settings.template) ?? TEMPLATES[0];

  return (
    <OsPage
      title="Institution Templates™"
      subtitle="One engine, many institutions. A template changes institutional language, department naming and review vocabulary while the knowledge graph, governance and lifecycle engines stay identical."
      department="Platform"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => update({ template: 'investment', institutionName: TEMPLATES[0].institutionName, institutionTagline: TEMPLATES[0].tagline })}>
          <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Reset template
        </Button>
      }
    >
      <section className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Active template</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{active.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{active.summary}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Institution identity</p>
            <p className="text-sm text-foreground">{active.institutionName}</p>
            <p className="text-[11px] text-muted-foreground">{active.tagline}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">Departments</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {active.departments.map((d) => (
                <Badge key={d} variant="outline" className="border-border/60 text-[10px] text-muted-foreground">{d}</Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => {
          const on = t.key === active.key;
          return (
            <button
              key={t.key}
              onClick={() => update({ template: t.key, institutionName: t.institutionName, institutionTagline: t.tagline })}
              aria-pressed={on}
              className={`rounded-lg border p-4 text-left transition-colors ${on ? 'border-trading-gold/50 bg-trading-gold/[0.06]' : 'border-border/50 bg-card/40 hover:bg-card/70'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.institutionName}</p>
                </div>
                {on && <Check className="h-4 w-4 text-trading-gold" aria-hidden="true" />}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{t.summary}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Language mapping — {active.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">The engine concept on the left is presented with the template term on the right. No behaviour changes.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Engine concept</th>
                <th scope="col" className="py-2 font-medium">Template term</th>
              </tr>
            </thead>
            <tbody>
              {active.lexicon.map((l) => (
                <tr key={l.engine} className="border-b border-border/30 last:border-0">
                  <td className="py-2 pr-4 text-muted-foreground">{l.engine}</td>
                  <td className="py-2 text-foreground">{l.template}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OsPage>
  );
}
