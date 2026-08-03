import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { executiveHome, type HomeItem } from '@/lib/enterprise';
import {
  ArrowRight, Sparkles, AlertTriangle, BookOpen, CalendarClock, Pin, Zap, Activity,
} from 'lucide-react';

const toneClass = (t?: HomeItem['tone']) =>
  t === 'good' ? 'text-trading-gold' : t === 'watch' ? 'text-amber-400' : t === 'weak' ? 'text-rose-400' : 'text-muted-foreground';

function Panel({ title, icon: Icon, hint, children }: { title: string; icon: typeof Zap; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border/50 bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
          <Icon className="h-3.5 w-3.5 text-trading-gold" aria-hidden="true" /> {title}
        </h2>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function ItemList({ items }: { items: HomeItem[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">Nothing recorded for this window.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={`${it.id ?? it.title}-${i}`}>
          <Link
            to={it.to}
            className="group block rounded-md border border-border/40 bg-background/30 p-2.5 transition-colors hover:border-trading-gold/40 hover:bg-trading-gold/5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium text-foreground group-hover:text-trading-gold">{it.title}</p>
              {it.id && <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground">{it.id}</span>}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{it.detail}</p>
            <p className={`mt-1 text-[9.5px] uppercase tracking-wider ${toneClass(it.tone)}`}>{it.meta}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ExecutiveHome() {
  const home = executiveHome();

  return (
    <OsPage
      title="Executive Home"
      subtitle="One page for the executive: today's brief, institution health, what needs attention, what was discovered and what to read next. Everything is observation only and links back to the evidence."
      department="Executive Layer"
      actions={<Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/presentation"><Sparkles className="h-3.5 w-3.5" /> Presentation Mode</Link></Button>}
    >
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {home.headline.map((h) => (
          <div key={h.label} className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-3">
            <p className="font-mono text-lg leading-none text-trading-gold">{h.value}</p>
            <p className="mt-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{h.label}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/80">{h.hint}</p>
          </div>
        ))}
      </div>

      <Panel title="Today's Brief" icon={Zap} hint={home.greetingDate}>
        <p className="text-sm leading-relaxed text-foreground">{home.brief.summary}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border/40 bg-background/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended action</p>
            <p className="mt-1 text-xs text-foreground">{home.brief.action}</p>
          </div>
          <div className="rounded-md border border-border/40 bg-background/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Expected gain (simulated)</p>
            <p className="mt-1 text-xs text-foreground">{home.brief.gain}</p>
          </div>
          <div className="rounded-md border border-border/40 bg-background/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Brief confidence</p>
            <p className="mt-1 font-mono text-lg leading-none text-trading-gold">{home.brief.confidence}%</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{home.brief.departments.join(' · ')}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Institution Health" icon={Activity} hint="Derived from the knowledge graph">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {home.health.map((h) => (
            <div key={h.key} className="rounded-md border border-border/40 bg-background/30 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">{h.label}</p>
                <span className={`font-mono text-sm ${h.light === 'green' ? 'text-trading-gold' : h.light === 'amber' ? 'text-amber-400' : 'text-rose-400'}`}>{h.score}</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted/30" role="presentation">
                <div className={`h-full rounded-full ${h.light === 'green' ? 'bg-trading-gold' : h.light === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${h.score}%` }} />
              </div>
              <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-relaxed text-muted-foreground">{h.note}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Priority Research" icon={ArrowRight} hint="Highest connectivity, still unresolved">
          <ItemList items={home.priority} />
        </Panel>
        <Panel title="Recent Discoveries" icon={Sparkles} hint="Most recently recorded">
          <ItemList items={home.discoveries} />
        </Panel>
        <Panel title="Top Risks" icon={AlertTriangle} hint="Institutional and procedural only">
          <ItemList items={home.risks} />
        </Panel>
        <Panel title="Recommended Reading" icon={BookOpen} hint="Best-evidenced institutional writing">
          <ItemList items={home.reading} />
        </Panel>
        <Panel title="Upcoming Reviews" icon={CalendarClock} hint="Governance, promotion and executive gates">
          <ItemList items={home.reviews} />
        </Panel>
        <Panel title="Pinned Reports" icon={Pin} hint="Your pinned and recent objects">
          <ItemList items={home.pinned} />
        </Panel>
      </div>

      <Panel title="Quick Actions" icon={Zap}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {home.quickActions.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="rounded-md border border-border/40 bg-background/30 p-3 transition-colors hover:border-trading-gold/40 hover:bg-trading-gold/5"
            >
              <p className="text-xs font-medium text-foreground">{a.label}</p>
              <p className="mt-1 text-[10.5px] text-muted-foreground">{a.hint}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <footer className="flex flex-wrap gap-1 border-t border-border/40 pt-4">
        {['Observation Only', 'Research Only', 'Simulation Only', 'Read Only', 'Human Approval Required'].map((b) => (
          <Badge key={b} variant="outline" className="border-border/50 text-[9.5px] uppercase tracking-wider text-muted-foreground">{b}</Badge>
        ))}
      </footer>
    </OsPage>
  );
}
