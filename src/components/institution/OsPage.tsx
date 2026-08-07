import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Compass, Share2, Sparkles, CalendarDays } from 'lucide-react';
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
        <header className="space-y-4 border-b border-trading-gold/20 pb-6">
          {breadcrumbs && <ExecBreadcrumbs trail={breadcrumbs} />}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              {department && (
                <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] uppercase tracking-[0.22em] text-trading-gold">
                  {department}
                </Badge>
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {actions}
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/explorer"><Compass className="h-3.5 w-3.5" /> Explorer</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/oracle"><Sparkles className="h-3.5 w-3.5" /> Oracle</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/knowledge-graph"><Share2 className="h-3.5 w-3.5" /> Graph</Link></Button>
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to="/calendar"><CalendarDays className="h-3.5 w-3.5" /> Timeline</Link></Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-trading-gold" />{ctx.status}
            </span>
            <span><span className="text-foreground">{ctx.objects}</span> objects</span>
            <span><span className="text-foreground">{ctx.relationships}</span> relationships</span>
            <span><span className="text-foreground">{ctx.evidence}</span> evidence links</span>
            <span><span className="text-foreground">{ctx.velocity}</span> active cycles</span>
            <span>Knowledge score <span className="text-trading-gold">{score.components[3].score}</span></span>
            <span>Institution score <span className="text-trading-gold">{score.total}</span> ({score.grade})</span>
            <span className="text-muted-foreground/70">{OS_VERSION} · {LIFE_VERSION} · {IQ_VERSION}</span>
          </div>

          <div className="rounded-lg border border-trading-gold/20 bg-trading-gold/[0.04] p-3">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 sm:grid-cols-5 lg:grid-cols-9">
              {gi.metrics.map((m) => (
                <div key={m.key}>
                  <p className={`font-mono text-sm leading-none ${m.tone === 'good' ? 'text-trading-gold' : m.tone === 'watch' ? 'text-amber-400' : 'text-rose-400'}`} title={m.hint}>
                    {m.value}
                  </p>
                  <p className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 border-t border-trading-gold/15 pt-2 text-[11px] leading-relaxed text-muted-foreground">
              <span className="uppercase tracking-[0.2em] text-trading-gold/80">Executive summary · </span>{gi.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-1">
            {[...LIFE_LINKS, ...IQ_LINKS].map((l) => (
              <Link key={l.to} to={l.to}
                className="rounded-full border border-trading-gold/25 bg-trading-gold/5 px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-trading-gold/90 transition-colors hover:bg-trading-gold/15">
                {l.label}
              </Link>
            ))}
          </div>


          <div className="flex flex-wrap gap-1">
            {OS_BADGES.map((b) => (
              <span key={b} className="rounded-full border border-border/50 bg-muted/20 px-2 py-0.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
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
