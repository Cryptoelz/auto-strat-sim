import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Share2, Sparkles, CalendarDays } from 'lucide-react';
import { ExecBreadcrumbs } from '@/components/executive/ExecUi';

import { OS_BADGES, OS_VERSION, institutionScore } from '@/lib/institutionOS';
import { LIFE_VERSION, LIFE_LINKS, pageContext } from '@/lib/institutionLife';
import { IQ_LINKS, IQ_VERSION, globalIntelligence } from '@/lib/institutionIntelligence';


/** Shared institutional page frame: executive header, department badge, counters and global actions. */
export function OsPage({
  title, subtitle, department, children, actions, breadcrumbs,
}: {
  title: string; subtitle: string; department?: string; children: ReactNode; actions?: ReactNode;
  breadcrumbs?: { label: string; to?: string }[];
}) {
  const score = institutionScore();
  const ctx = pageContext();
  const gi = globalIntelligence();
  return (
    <div className="min-h-full bg-gradient-to-b from-background via-background to-card/40">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:space-y-8 sm:p-8">
        <header className="exec-head border-b border-trading-gold/20">
          {breadcrumbs && <ExecBreadcrumbs trail={breadcrumbs} />}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2.5">
              {department && (
                <Badge variant="outline" className="exec-badge border-trading-gold/40 bg-trading-gold/10 tracking-[0.18em] text-trading-gold">
                  {department}
                </Badge>
              )}
              <h1 className="exec-head-title text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
              <p className="exec-head-sub text-sm text-muted-foreground">{subtitle}</p>
            </div>


            <nav aria-label="Global institutional shortcuts" className="flex flex-wrap items-center gap-1.5">
              {actions}
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/explorer"><Compass className="h-3.5 w-3.5" aria-hidden="true" /> Explorer</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/oracle"><Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Oracle</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/knowledge-graph"><Share2 className="h-3.5 w-3.5" aria-hidden="true" /> Graph</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/calendar"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Timeline</Link></Button>
            </nav>
          </div>

          <div className="exec-strip flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-trading-gold" aria-hidden="true" />{ctx.status}
            </span>
            <span><span className="font-mono tabular-nums text-foreground">{ctx.objects}</span> objects</span>
            <span><span className="font-mono tabular-nums text-foreground">{ctx.relationships}</span> relationships</span>
            <span><span className="font-mono tabular-nums text-foreground">{ctx.evidence}</span> evidence links</span>
            <span><span className="font-mono tabular-nums text-foreground">{ctx.velocity}</span> active cycles</span>
            <span>Knowledge score <span className="font-mono tabular-nums text-trading-gold">{score.components[3].score}</span></span>
            <span>Institution score <span className="font-mono tabular-nums text-trading-gold">{score.total}</span> ({score.grade})</span>
            <span className="text-muted-foreground/70">{OS_VERSION} · {LIFE_VERSION} · {IQ_VERSION}</span>
          </div>

          <section aria-label="Global intelligence summary" className="rounded-xl border border-trading-gold/20 bg-trading-gold/[0.04] p-3.5">
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-5 lg:grid-cols-9">
              {gi.metrics.map((m) => (
                <div key={m.key} className="min-w-0">
                  <p
                    className={`font-mono text-sm font-semibold leading-none tabular-nums ${
                      m.tone === 'good' ? 'text-trading-gold' : m.tone === 'watch' ? 'text-exec-watch' : 'text-exec-critical'
                    }`}
                    title={m.hint}
                  >
                    {m.value}
                  </p>
                  <p className="mt-1.5 truncate text-[9px] uppercase tracking-[0.14em] text-muted-foreground" title={m.label}>{m.label}</p>
                </div>
              ))}
            </div>
            <p className="exec-measure mt-3 border-t border-trading-gold/15 pt-2.5 text-[11px] leading-[1.65] text-muted-foreground">
              <span className="uppercase tracking-[0.2em] text-trading-gold/80">Executive summary · </span>{gi.summary}
            </p>

          </section>

          <nav aria-label="Institutional module links" className="flex flex-wrap gap-1.5">
            {[...LIFE_LINKS, ...IQ_LINKS].map((l) => (
              <Link key={l.to} to={l.to}
                className="rounded-full border border-trading-gold/25 bg-trading-gold/5 px-2.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] text-trading-gold/90 transition-colors hover:bg-trading-gold/15 hover:text-trading-gold">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap gap-1.5">
            {OS_BADGES.map((b) => (
              <span key={b} className="rounded-full border border-border/50 bg-muted/20 px-2.5 py-0.5 text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                {b}
              </span>
            ))}
          </div>

        </header>

        {children}
      </div>
    </div>
  );
}
