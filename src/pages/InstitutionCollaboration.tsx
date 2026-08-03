import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { collaborationMatrix, collabBand, CollabLink, DEPARTMENT_PROFILES, slug } from '@/lib/institutionOS';
import { RELATIONSHIP_META } from '@/lib/knowledgeGraph';
import { cn } from '@/lib/utils';

const ROLE_COLOR: Record<string, string> = {
  requested: 'text-primary', validated: 'text-trading-gold',
  approved: 'text-trading-profit', rejected: 'text-destructive', depends: 'text-muted-foreground',
};

export default function InstitutionCollaboration() {
  const { names, links, cell } = useMemo(() => collaborationMatrix(), []);
  const [active, setActive] = useState<CollabLink | null>(null);

  const R = 230, cx = 300, cy = 280;
  const pos = names.map((n, i) => {
    const a = (i / names.length) * Math.PI * 2 - Math.PI / 2;
    return { name: n, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });
  const posOf = (n: string) => pos.find((p) => p.name === n)!;

  return (
    <OsPage
      title="Department Collaboration™"
      subtitle="How the institution works together: who requested research, who validated it, who approved or rejected it, and who depends on whom."
      department="Institution Collaboration™"
    >
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="border-border/50 bg-card/60 p-4 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-trading-gold">Collaboration network</p>
          <svg viewBox="0 0 600 560" className="mt-2 w-full">
            {links.map((l) => {
              const a = posOf(l.from), b = posOf(l.to);
              const on = active && active.from === l.from && active.to === l.to;
              return (
                <line key={`${l.from}-${l.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={on ? 'hsl(var(--trading-gold))' : 'hsl(var(--border))'}
                  strokeWidth={on ? 2.5 : Math.min(3, 0.6 + l.count * 0.25)}
                  opacity={active ? (on ? 1 : 0.15) : 0.55}
                  className="cursor-pointer" onClick={() => setActive(l)} />
              );
            })}
            {pos.map((p) => (
              <g key={p.name} className="cursor-pointer" onClick={() => setActive(null)}>
                <circle cx={p.x} cy={p.y} r={26} fill="hsl(var(--card))" stroke="hsl(var(--trading-gold))" strokeWidth={1.2} />
                <text x={p.x} y={p.y + 3} textAnchor="middle" className="fill-foreground" style={{ fontSize: 9 }}>
                  {DEPARTMENT_PROFILES.find((d) => d.name === p.name)?.short ?? p.name.slice(0, 6)}
                </text>
              </g>
            ))}
            <text x={cx} y={cy - 6} textAnchor="middle" className="fill-trading-gold" style={{ fontSize: 13, letterSpacing: 2 }}>ATLAS</text>
            <text x={cx} y={cy + 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 8 }}>{links.length} collaboration links</text>
          </svg>
        </Card>

        <Card className="border-border/50 bg-card/60 p-4 lg:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.2em] text-trading-gold">
            {active ? `${active.from} → ${active.to}` : 'Select a link'}
          </p>
          {!active && <p className="mt-3 text-[12px] text-muted-foreground">Click any line in the network, or a matrix cell below, to see every relationship behind that collaboration — with confidence and explanation.</p>}
          {active && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(active.roles).filter(([, v]) => v > 0).map(([k, v]) => (
                  <Badge key={k} variant="outline" className={cn('border-border/50 text-[10px] capitalize', ROLE_COLOR[k])}>{k} · {v}</Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{active.count} relationships · mean strength {active.strength}%</p>
              <ScrollArea className="h-80 pr-3">
                <div className="space-y-1.5">
                  {active.edges.map(({ edge, role, fromNode, toNode }, i) => (
                    <Link key={i} to={`/explorer/${fromNode.id}`} className="block rounded-md border border-border/40 bg-muted/10 p-2.5 hover:border-trading-gold/40">
                      <p className="text-[11px] text-foreground">{fromNode.id} {RELATIONSHIP_META[edge.type].label.toLowerCase()} {toNode.id}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{edge.note}</p>
                      <p className="mt-1 text-[9.5px]"><span className={ROLE_COLOR[role]}>{role}</span> · {edge.confidence}% confidence</p>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </Card>
      </div>

      <Card className="border-border/50 bg-card/60 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-trading-gold">Collaboration matrix</p>
        <p className="mb-3 mt-1 text-[11px] text-muted-foreground">Rows send, columns receive. Gold = strong collaboration, dim = weak, empty = no recorded link.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[10px]">
            <thead>
              <tr>
                <th className="p-1.5 text-left font-normal text-muted-foreground">from → to</th>
                {names.map((n) => (
                  <th key={n} className="p-1.5 font-normal text-muted-foreground">{DEPARTMENT_PROFILES.find((d) => d.name === n)?.short}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((r) => (
                <tr key={r}>
                  <td className="whitespace-nowrap p-1.5 text-muted-foreground">
                    <Link to={`/institution/departments/${slug(r)}`} className="hover:text-trading-gold">{r}</Link>
                  </td>
                  {names.map((c) => {
                    const l = cell(r, c);
                    const band = collabBand(l?.count ?? 0);
                    return (
                      <td key={c} className="p-0.5">
                        <button
                          onClick={() => l && setActive(l)}
                          className={cn('h-7 w-full rounded-sm border text-[10px] transition-colors',
                            band === 'strong' ? 'border-trading-gold/50 bg-trading-gold/25 text-trading-gold'
                              : band === 'weak' ? 'border-border/50 bg-muted/25 text-muted-foreground'
                              : 'border-border/20 bg-transparent text-muted-foreground/30')}
                        >
                          {l?.count ?? '·'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </OsPage>
  );
}
