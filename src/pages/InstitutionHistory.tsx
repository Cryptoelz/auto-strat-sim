import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { institutionHistory, HistoryKind } from '@/lib/institutionOS';
import { cn } from '@/lib/utils';

const KINDS: HistoryKind[] = ['version', 'discovery', 'breakthrough', 'decision', 'milestone', 'memory', 'birthday'];
const STYLE: Record<HistoryKind, string> = {
  version: 'border-trading-gold/50 text-trading-gold',
  discovery: 'border-primary/40 text-primary',
  breakthrough: 'border-trading-profit/40 text-trading-profit',
  decision: 'border-destructive/40 text-destructive',
  milestone: 'border-foreground/30 text-foreground',
  memory: 'border-muted-foreground/40 text-muted-foreground',
  birthday: 'border-trading-gold/50 text-trading-gold',
};

export default function InstitutionHistory() {
  const all = useMemo(() => institutionHistory(), []);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<HistoryKind | 'all'>('all');

  const list = all.filter((h) =>
    (kind === 'all' || h.kind === kind) &&
    (!q || `${h.title} ${h.detail} ${h.objectId ?? ''}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <OsPage
      title="Institution History™"
      subtitle="The complete institutional record: every platform version, discovery, breakthrough, decision and lesson since the institution was founded."
      department="Institution History™"
      actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search history" className="h-7 w-[190px] text-[11px]" />}
    >
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant={kind === 'all' ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setKind('all')}>All</Button>
        {KINDS.map((k) => (
          <Button key={k} size="sm" variant={kind === k ? 'default' : 'outline'} className="h-7 text-[11px] capitalize" onClick={() => setKind(k)}>{k}</Button>
        ))}
        <span className="ml-2 self-center text-[11px] text-muted-foreground">{list.length} entries</span>
      </div>

      <Card className="border-border/50 bg-card/60 p-6">
        <ol className="relative space-y-4 border-l border-trading-gold/30 pl-6">
          {list.map((h, i) => (
            <li key={`${h.title}-${i}`} className="relative">
              <span className={cn('absolute -left-[29px] top-2 h-2.5 w-2.5 rounded-full',
                h.kind === 'version' || h.kind === 'birthday' ? 'bg-trading-gold' : 'bg-border')} />
              <div className="rounded-md border border-border/40 bg-muted/10 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">Day {h.day} · {h.date}</span>
                  <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px] capitalize', STYLE[h.kind])}>{h.kind}</Badge>
                  {h.department && <span className="text-[9.5px] text-muted-foreground">{h.department}</span>}
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-foreground">{h.title}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{h.detail}</p>
                {h.objectId && (
                  <Link to={`/explorer/${h.objectId}`} className="mt-2 inline-block text-[10.5px] text-trading-gold hover:underline">
                    Open {h.objectId} in Explorer →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </OsPage>
  );
}
