import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Check } from 'lucide-react';
import { THEMES } from '@/lib/platform';
import { useAtlasSettings } from '@/hooks/useAtlasSettings';

export default function ThemeEngine() {
  const [settings, update] = useAtlasSettings();

  return (
    <OsPage
      title="Theme Engine™"
      subtitle="Eight institutional themes. Every module reads the same semantic tokens, so a theme switches the entire institution instantly without touching a single module."
      department="Platform"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => update({ theme: 'executive-dark', accent: 'gold' })}>
          <Palette className="h-3.5 w-3.5" aria-hidden="true" /> Reset to default
        </Button>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {THEMES.map((t) => {
          const active = settings.theme === t.key;
          return (
            <button
              key={t.key}
              onClick={() => update({ theme: t.key })}
              aria-pressed={active}
              className={`rounded-lg border p-4 text-left transition-colors ${active ? 'border-trading-gold/50 bg-trading-gold/[0.06]' : 'border-border/50 bg-card/40 hover:bg-card/70'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{t.mode} mode</p>
                </div>
                {active && <Check className="h-4 w-4 text-trading-gold" aria-hidden="true" />}
              </div>
              <div className="mt-3 flex gap-1.5" aria-hidden="true">
                {t.swatches.map((s, i) => (
                  <span key={i} className="h-6 w-6 rounded-md border border-border/60" style={{ background: s }} />
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{t.description}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Live preview</h2>
        <p className="mt-1 text-xs text-muted-foreground">Standard institutional chrome rendered in the active theme.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <div className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Institution score</p>
            <p className="mt-1 font-mono text-2xl text-trading-gold">94</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Accent surface</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Standard card</p>
            <p className="mt-1 text-sm text-foreground">Foreground text on the neutral surface.</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Muted supporting copy.</p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card/40 p-4">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] text-trading-gold">Validated</Badge>
              <Badge variant="outline" className="border-border/60 text-[10px] text-muted-foreground">Research Only</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-[11px]">Primary</Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]">Secondary</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border/50 bg-card/40 p-5">
        <h2 className="text-sm font-semibold text-foreground">Theme rules</h2>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>Themes only rewrite semantic tokens. No module contains a hardcoded colour.</li>
          <li>Accessible High Contrast is validated against the accessibility guide before every release.</li>
          <li>Presentation and Museum themes are intended for projection and exhibit surfaces.</li>
          <li>Theme selection persists locally and applies across every institutional route.</li>
        </ul>
      </section>
    </OsPage>
  );
}
