import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { InstitutionPulse } from '@/components/institution/InstitutionPulse';
import { ExecutiveStatusRibbon } from '@/components/institution/ExecutiveStatusRibbon';
import { ExecutiveSnapshot } from '@/components/institution/ExecutiveSnapshot';
import { InstitutionEvolutionStrip } from '@/components/institution/InstitutionEvolutionStrip';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ExecCard, ExecCardHeader, ExecGovernanceFooter } from '@/components/executive/ExecUi';
import { institutionMetrics, activityFeed, institutionScore, allDepartmentStats, slug } from '@/lib/institutionOS';
import { NODE_TYPE_META } from '@/lib/knowledgeGraph';
import { ArrowUpRight, Activity, Building2 } from 'lucide-react';

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-lg border border-trading-gold/30 bg-trading-gold/5 px-3 py-1.5 text-right">
      <p className="font-mono text-lg leading-none text-trading-gold">{now.toUTCString().slice(17, 25)}</p>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Institution clock · UTC</p>
    </div>
  );
}

export default function Institution() {
  const metrics = useMemo(() => institutionMetrics(), []);
  const feed = useMemo(() => activityFeed(120), []);
  const score = useMemo(() => institutionScore(), []);
  const depts = useMemo(() => allDepartmentStats(), []);

  return (
    <OsPage
      title="ATLAS OS™"
      subtitle="Institutional Intelligence Operating System"
      department="Institution Dashboard™"
      actions={<Clock />}
    >
      <div className="exec-stack">
        <section aria-label="Institutional welcome" className="exec-hero exec-rise">
          <p className="exec-hero-quote text-[15px] text-foreground/90 sm:text-base">
            “A living research institution that remembers, explains and continuously improves every conclusion.”
          </p>
        </section>

        <ExecutiveStatusRibbon />

        <InstitutionPulse />

        <ExecutiveSnapshot />

        <section aria-label="Institutional metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metrics.map((m) => (
            <Link key={m.key} to={m.to ?? '/institution'} className="exec-card exec-card-interactive group">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{m.label}</p>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-trading-gold" aria-hidden="true" />
              </div>
              <p className="mt-2.5 font-mono text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">
                {m.value}<span className="text-sm font-normal text-muted-foreground">{m.unit ?? ''}</span>
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{m.sub}</p>
              <Progress value={m.score} className="mt-3 h-1" />
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <ExecCard className="border-trading-gold/25 lg:col-span-1">
            <ExecCardHeader title="Institution Score™" icon={Building2} hint={`Grade ${score.grade}`} />
            <div className="flex items-center gap-5">
              <div className="relative h-28 w-28 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="9" opacity={0.4} />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--trading-gold))" strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${(score.total / 100) * 327} 327`} className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{score.total}</span>
                  <span className="text-[10px] text-trading-gold">{score.grade}</span>
                </div>
              </div>
              <div className="space-y-1 text-[11px] leading-relaxed text-muted-foreground">
                {score.components.slice(0, 5).map((c) => (
                  <p key={c.key}>{c.label} <span className="font-mono tabular-nums text-foreground">{c.score}</span></p>
                ))}
                <Link to="/institution/score" className="exec-link inline-block pt-1 text-trading-gold hover:underline">Explain every component →</Link>
              </div>
            </div>
          </ExecCard>

          <ExecCard className="lg:col-span-2">
            <ExecCardHeader title="Departments" icon={Building2} hint="Owned objects and current rating" />
            <div className="grid gap-2 sm:grid-cols-2">
              {depts.slice(0, 8).map((d) => (
                <Link key={d.profile.name} to={`/institution/departments/${slug(d.profile.name)}`}
                  className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-[11px] transition-colors hover:border-trading-gold/40">
                  <span className="text-foreground">{d.profile.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono tabular-nums">{d.owned.length} obj</span>
                    <Badge variant="outline" className="border-trading-gold/40 px-1.5 py-0 text-[9px] text-trading-gold">{d.rating}</Badge>
                  </span>
                </Link>
              ))}
            </div>
          </ExecCard>
        </section>

        <InstitutionEvolutionStrip />

        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Activity className="h-4 w-4 shrink-0 text-trading-gold" aria-hidden="true" />
            <h2 className="text-sm font-semibold tracking-tight">Institution Activity Feed</h2>
            <span className="text-[11px] text-muted-foreground">Everything happening inside the institution · every entry opens in Explorer</span>
          </div>
          <Card className="border-border/50 bg-card/60">
            <ScrollArea className="h-[520px]">
              <div className="divide-y divide-border/40">
                {feed.map((a, i) => (
                  <Link key={`${a.objectId}-${i}`} to={`/explorer/${a.objectId}`}
                    className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20">
                    <span className="w-20 shrink-0 font-mono text-[10px] text-muted-foreground">{a.date}</span>
                    <Badge variant="outline" className="shrink-0 border-border/50 px-1.5 py-0 text-[9px] text-muted-foreground">
                      {NODE_TYPE_META[a.kind as keyof typeof NODE_TYPE_META]?.label ?? a.kind}
                    </Badge>
                    <span className="flex-1 text-[12px] leading-relaxed text-foreground/90">{a.text}</span>
                    <span className="shrink-0 text-[10px] text-trading-gold">{a.department}</span>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </section>

        <ExecGovernanceFooter />
      </div>
    </OsPage>
  );
}
