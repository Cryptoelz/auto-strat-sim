import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useAtlasSettings } from '@/hooks/useAtlasSettings';
import { ACCENTS, formatDate, type AtlasSettings } from '@/lib/enterprise';
import { RotateCcw, Check } from 'lucide-react';

function Group({ title, blurb, children }: { title: string; blurb: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/50 bg-card/40 p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">{title}</h2>
      <p className="mt-1 text-[11px] text-muted-foreground">{blurb}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/40 bg-background/30 p-2.5">
      <div className="min-w-[190px] flex-1">
        <Label htmlFor={htmlFor} className="text-xs text-foreground">{label}</Label>
        {hint && <p className="mt-0.5 text-[10.5px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Choice<T extends string | number>({ value, options, onChange, name }: {
  value: T; options: { key: T; label: string }[]; onChange: (v: T) => void; name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={String(o.key)}
          role="radio"
          aria-checked={value === o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full border px-2.5 py-1 text-[10.5px] transition-colors ${
            value === o.key
              ? 'border-trading-gold/60 bg-trading-gold/15 text-trading-gold'
              : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function EnterpriseSettings() {
  const [s, update, reset] = useAtlasSettings();
  const set = <K extends keyof AtlasSettings>(k: K) => (v: AtlasSettings[K]) => update({ [k]: v } as Partial<AtlasSettings>);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <OsPage
      title="Enterprise Settings"
      subtitle="Central configuration for branding, presentation, accessibility, exports and simulation defaults. Settings change how ATLAS is displayed — they can never change research results, governance rules or the read-only posture."
      department="Enterprise Layer"
      actions={
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset defaults
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Group title="Institution branding" blurb="Displayed in the sidebar, presentation mode and exported reports.">
          <Row label="Institution name" htmlFor="inst-name">
            <Input id="inst-name" value={s.institutionName} onChange={(e) => update({ institutionName: e.target.value })} className="h-8 w-56 text-xs" />
          </Row>
          <Row label="Tagline" htmlFor="inst-tag">
            <Input id="inst-tag" value={s.institutionTagline} onChange={(e) => update({ institutionTagline: e.target.value })} className="h-8 w-56 text-xs" />
          </Row>
          <Row label="Accent colour" hint="Propagates to every module through the shared design tokens.">
            <div className="flex flex-wrap gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  aria-label={a.label}
                  aria-pressed={s.accent === a.key}
                  onClick={() => update({ accent: a.key })}
                  className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] transition-colors ${s.accent === a.key ? 'border-trading-gold/60 text-foreground' : 'border-border/50 text-muted-foreground'}`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: a.swatch }} />
                  {a.label}
                  {s.accent === a.key && <Check className="h-3 w-3" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </Row>
        </Group>

        <Group title="Theme and density" blurb="Controls the visual rhythm of every page.">
          <Row label="Layout density" hint="Compact tightens vertical spacing across all modules.">
            <Choice name="Layout density" value={s.density} onChange={set('density')} options={[{ key: 'comfortable', label: 'Comfortable' }, { key: 'compact', label: 'Compact' }]} />
          </Row>
          <Row label={`Font scale — ${s.fontScale}%`} hint="90% to 130%. All layouts are tested across the full range.">
            <div className="w-48">
              <Slider aria-label="Font scale" value={[s.fontScale]} min={90} max={130} step={5} onValueChange={([v]) => update({ fontScale: v })} />
            </div>
          </Row>
          <Row label="Governance badges" hint="Show the permanent guardrail badges on every page." htmlFor="gov-badges">
            <Switch id="gov-badges" checked={s.showGovernanceBadges} onCheckedChange={set('showGovernanceBadges')} />
          </Row>
          <Row label="Presentation mode" hint="Larger typography, simplified navigation, development controls hidden." htmlFor="pres-mode">
            <Switch id="pres-mode" checked={s.presentationMode} onCheckedChange={set('presentationMode')} />
          </Row>
        </Group>

        <Group title="Accessibility" blurb="Applied globally at the document root.">
          <Row label="Reduced motion" hint="Removes every animation and transition in the platform." htmlFor="reduced-motion">
            <Switch id="reduced-motion" checked={s.reducedMotion} onCheckedChange={set('reducedMotion')} />
          </Row>
          <Row label="High contrast" hint="Raises foreground and border contrast for projection and low-light rooms." htmlFor="high-contrast">
            <Switch id="high-contrast" checked={s.highContrast} onCheckedChange={set('highContrast')} />
          </Row>
          <Row label="Underline links" hint="Adds a persistent underline to in-page links." htmlFor="underline-links">
            <Switch id="underline-links" checked={s.underlineLinks} onCheckedChange={set('underlineLinks')} />
          </Row>
        </Group>

        <Group title="Exports and reports" blurb="Defaults used by every export button across ATLAS.">
          <Row label="Export format">
            <Choice name="Export format" value={s.exportFormat} onChange={set('exportFormat')} options={[{ key: 'markdown', label: 'Markdown' }, { key: 'csv', label: 'CSV' }, { key: 'json', label: 'JSON' }]} />
          </Row>
          <Row label="Include evidence" hint="Attach supporting and counter-evidence to every exported object." htmlFor="exp-ev">
            <Switch id="exp-ev" checked={s.exportIncludesEvidence} onCheckedChange={set('exportIncludesEvidence')} />
          </Row>
          <Row label="Report template">
            <Choice name="Report template" value={s.reportTemplate} onChange={set('reportTemplate')} options={[{ key: 'executive', label: 'Executive' }, { key: 'technical', label: 'Technical' }, { key: 'board', label: 'Board pack' }]} />
          </Row>
          <Row label="Date format" hint={`Preview — ${formatDate(today, s.dateFormat)}`}>
            <Choice name="Date format" value={s.dateFormat} onChange={set('dateFormat')} options={[{ key: 'iso', label: 'ISO' }, { key: 'long', label: 'Long' }, { key: 'short', label: 'Short' }]} />
          </Row>
        </Group>

        <Group title="User preferences" blurb="Where ATLAS opens and how it behaves for you.">
          <Row label="Default landing page">
            <Choice
              name="Default landing page"
              value={s.defaultLanding}
              onChange={set('defaultLanding')}
              options={[
                { key: '/home', label: 'Executive Home' },
                { key: '/institution', label: 'Institution' },
                { key: '/atlas', label: 'ATLAS™' },
                { key: '/observatory', label: 'Observatory' },
              ]}
            />
          </Row>
        </Group>

        <Group title="Simulation options" blurb="Display defaults for simulated studies. No simulation can execute, allocate or modify a strategy.">
          <Row label="Default horizon" hint="Window used when a page offers a default simulated view.">
            <Choice name="Simulation horizon" value={s.simulationHorizon} onChange={(v) => update({ simulationHorizon: v })} options={[{ key: 30 as const, label: '30 days' }, { key: 60 as const, label: '60 days' }, { key: 90 as const, label: '90 days' }]} />
          </Row>
          <div className="rounded-md border border-trading-gold/20 bg-trading-gold/[0.04] p-2.5 text-[11px] leading-relaxed text-muted-foreground">
            These options change presentation only. Observation Only, Research Only, Simulation Only, Read Only and Human Approval Required are structural guarantees and are not configurable.
          </div>
        </Group>
      </div>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Read Only', 'No Strategy Modification', 'No Automatic Allocation', 'Human Approval Required'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
