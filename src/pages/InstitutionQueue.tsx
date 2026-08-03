import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { workQueue, QUEUE_COLUMNS, QueueColumn, DEPARTMENT_PROFILES } from '@/lib/institutionOS';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

const PRIORITY: Record<string, string> = {
  High: 'border-trading-gold/50 text-trading-gold',
  Medium: 'border-border/50 text-muted-foreground',
  Low: 'border-border/40 text-muted-foreground/70',
};

export default function InstitutionQueue() {
  const cards = useMemo(() => workQueue(), []);
  const [dept, setDept] = useState<string>('All');

  const visible = cards.filter((c) => dept === 'All' || c.department === dept);
  const inCol = (col: QueueColumn) => visible.filter((c) => c.column === col);

  return (
    <OsPage
      title="Institution Work Queue™"
      subtitle="What every department is working on right now. Read-only simulation of institutional workload — nothing here executes, allocates or promotes."
      department="Institution Work Queue™"
      actions={
        <Badge variant="outline" className="h-7 gap-1.5 border-trading-gold/40 bg-trading-gold/10 px-2 text-[10px] text-trading-gold">
          <Lock className="h-3 w-3" /> Read-only simulation
        </Badge>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        {['All', ...DEPARTMENT_PROFILES.map((d) => d.name)].map((d) => (
          <Button key={d} size="sm" variant={dept === d ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setDept(d)}>
            {d === 'All' ? 'All departments' : (DEPARTMENT_PROFILES.find((p) => p.name === d)?.short ?? d)}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {QUEUE_COLUMNS.map((col) => (
          <Card key={col} className="flex flex-col border-border/50 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.16em] text-trading-gold">{col}</p>
              <span className="text-[10px] text-muted-foreground">{inCol(col).length}</span>
            </div>
            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-2">
                {inCol(col).map((c) => (
                  <Link key={c.id} to={`/explorer/${c.id}`}
                    className="block rounded-md border border-border/40 bg-muted/10 p-2.5 transition-colors hover:border-trading-gold/40">
                    <p className="text-[11.5px] leading-snug text-foreground">{c.title}</p>
                    <p className="mt-1 text-[9.5px] text-muted-foreground">{c.id} · {c.owner}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px]', PRIORITY[c.priority])}>{c.priority}</Badge>
                      <span className="text-[9px] text-muted-foreground">{c.confidence}% conf</span>
                      <span className="text-[9px] text-muted-foreground">{c.evidence} ev</span>
                    </div>
                    {c.dependencies.length > 0 && (
                      <p className="mt-1 truncate text-[9px] text-muted-foreground/80">depends on {c.dependencies.join(', ')}</p>
                    )}
                  </Link>
                ))}
                {inCol(col).length === 0 && <p className="px-1 text-[10px] text-muted-foreground/60">Empty</p>}
              </div>
            </ScrollArea>
          </Card>
        ))}
      </div>
    </OsPage>
  );
}
