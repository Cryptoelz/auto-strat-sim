import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { departmentStats, PROFILE_BY_SLUG, collaborationLinks } from '@/lib/institutionOS';
import { NODE_TYPE_META } from '@/lib/knowledgeGraph';
import { Download, ExternalLink } from 'lucide-react';

function Section({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <Card className="border-border/50 bg-card/60 p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-trading-gold">{title}</h2>
        {note && <span className="text-[10px] text-muted-foreground">{note}</span>}
      </div>
      {children}
    </Card>
  );
}

export default function InstitutionDepartment() {
  const { dept = '' } = useParams();
  const profile = PROFILE_BY_SLUG[dept];
  const stats = useMemo(() => (profile ? departmentStats(profile.name) : null), [profile]);
  const collab = useMemo(
    () => (profile ? collaborationLinks().filter((l) => l.from === profile.name || l.to === profile.name) : []),
    [profile],
  );

  if (!profile || !stats) {
    return (
      <OsPage title="Department not found" subtitle="This department does not exist in the institution." department="Institution Departments™">
        <Button asChild variant="outline"><Link to="/institution/departments">Back to departments</Link></Button>
      </OsPage>
    );
  }

  const exportReport = () => {
    const lines = [
      `ATLAS OS — Department Report: ${profile.name}`,
      `Purpose: ${profile.purpose}`,
      `Executive rating: ${stats.rating} · Health: ${stats.health} · Impact: ${stats.impact}`,
      `Owned objects: ${stats.owned.length} · Workload: ${stats.workload} · Blocked: ${stats.blocked.length}`,
      '',
      'Responsibilities:', ...profile.responsibilities.map((r) => ` - ${r}`),
      '', 'Owned objects:', ...stats.owned.map((n) => ` - ${n.id} · ${n.title} (${n.status}, ${n.confidence}%)`),
      '', 'Open questions:', ...stats.openQuestions.map((q) => ` - ${q}`),
      '', 'Observation Only · Research Only · Simulation Only · Read Only · Human Approval Required',
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `atlas-department-${dept}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <OsPage
      title={profile.name}
      subtitle={profile.purpose}
      department="Institution Departments™"
      actions={
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={exportReport}><Download className="h-3.5 w-3.5" /> Department Report</Button>
          <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]"><Link to={profile.link}><ExternalLink className="h-3.5 w-3.5" /> Open module</Link></Button>
        </>
      }
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Executive Rating', stats.rating, 'Weighted by validated output'],
          ['Department Health', `${stats.health}`, `${stats.blocked.length} blocked items`],
          ['Institution Impact', `${stats.impact}`, `${stats.reuse} downstream reuses`],
          ['Current Workload', `${stats.workload}`, 'Open + blocked research'],
          ['Owned Objects', `${stats.owned.length}`, `${stats.validated.length} validated`],
        ].map(([l, v, s]) => (
          <Card key={l} className="border-border/50 bg-card/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{l}</p>
            <p className="mt-1.5 text-2xl font-semibold text-foreground">{v}</p>
            <p className="text-[10px] text-muted-foreground">{s}</p>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Responsibilities">
          <ul className="space-y-1.5 text-[12px] text-muted-foreground">
            {profile.responsibilities.map((r) => (
              <li key={r} className="flex gap-2"><span className="text-trading-gold">▸</span>{r}</li>
            ))}
          </ul>
        </Section>

        <Section title="Knowledge Produced" note={`${stats.owned.length} objects`}>
          <div className="flex flex-wrap gap-2">
            {stats.knowledgeProduced.map((k) => (
              <Badge key={k.type} variant="outline" className="border-border/50 text-[10px] text-muted-foreground">
                {NODE_TYPE_META[k.type].label} · {k.count}
              </Badge>
            ))}
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Mean confidence</span><span className="text-foreground">{stats.confidence}%</span></div>
            <Progress value={stats.confidence} className="h-1" />
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>Evidence integrity</span><span className="text-foreground">{stats.evidence}</span></div>
            <Progress value={stats.evidence} className="h-1" />
          </div>
        </Section>

        <Section title="Owned Objects" note="Read-only">
          <ScrollArea className="h-64 pr-3">
            <div className="space-y-1.5">
              {stats.owned.map((n) => (
                <Link key={n.id} to={`/explorer/${n.id}`} className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-3 py-1.5 text-[11px] hover:border-trading-gold/40">
                  <span className="truncate text-foreground">{n.id} · {n.title}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">{n.confidence}%</span>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </Section>

        <Section title="Pending Decisions" note="Human approval required">
          {stats.blocked.length + stats.pending.length === 0
            ? <p className="text-[12px] text-muted-foreground">No pending decisions on record.</p>
            : (
              <div className="space-y-1.5">
                {[...stats.blocked, ...stats.pending].slice(0, 10).map((n) => (
                  <Link key={n.id} to={`/explorer/${n.id}`} className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-3 py-1.5 text-[11px] hover:border-trading-gold/40">
                    <span className="truncate text-foreground">{n.id} · {n.title}</span>
                    <Badge variant="outline" className="ml-2 shrink-0 border-border/50 text-[9px] capitalize text-muted-foreground">{n.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
        </Section>

        <Section title="Research Timeline">
          <ScrollArea className="h-64 pr-3">
            <ol className="relative space-y-3 border-l border-border/50 pl-4">
              {stats.timeline.map((t) => (
                <li key={t.node.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-trading-gold" />
                  <p className="font-mono text-[10px] text-muted-foreground">Day {t.day} · {t.date}</p>
                  <Link to={`/explorer/${t.node.id}`} className="text-[12px] text-foreground hover:text-trading-gold">{t.node.id} · {t.node.title}</Link>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </Section>

        <Section title="Recent Contributions">
          <div className="space-y-2">
            {stats.recent.map((n) => (
              <Link key={n.id} to={`/explorer/${n.id}`} className="block rounded-md border border-border/40 bg-muted/10 p-2.5 hover:border-trading-gold/40">
                <p className="text-[12px] text-foreground">{n.title}</p>
                <p className="text-[10px] text-muted-foreground">{n.id} · {n.created} · {NODE_TYPE_META[n.type].label}</p>
              </Link>
            ))}
          </div>
        </Section>

        <Section title="Open Questions">
          {stats.openQuestions.length === 0
            ? <p className="text-[12px] text-muted-foreground">No open questions currently registered.</p>
            : <ul className="space-y-1.5 text-[12px] text-muted-foreground">{stats.openQuestions.map((q, i) => <li key={i} className="flex gap-2"><span className="text-trading-gold">?</span>{q}</li>)}</ul>}
        </Section>

        <Section title="Blocked Research" note="Governance gated">
          {stats.blocked.length === 0
            ? <p className="text-[12px] text-muted-foreground">Nothing blocked. All research within this department can progress under existing guardrails.</p>
            : <div className="space-y-1.5">{stats.blocked.map((n) => (
                <Link key={n.id} to={`/explorer/${n.id}`} className="block rounded-md border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[11px] text-foreground hover:border-destructive/60">
                  {n.id} · {n.title}
                </Link>
              ))}</div>}
        </Section>

        <Section title="Collaboration" note="Who requested, validated, approved or depends" >
          <div className="space-y-1.5">
            {collab.length === 0 && <p className="text-[12px] text-muted-foreground">No cross-department links recorded.</p>}
            {collab.map((l) => (
              <Link key={`${l.from}-${l.to}`} to="/institution/collaboration"
                className="flex items-center justify-between rounded-md border border-border/40 bg-muted/10 px-3 py-1.5 text-[11px] hover:border-trading-gold/40">
                <span className="text-foreground">{l.from} → {l.to}</span>
                <span className="text-muted-foreground">{l.count} links · {l.strength}%</span>
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </OsPage>
  );
}
