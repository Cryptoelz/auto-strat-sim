import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calendarEvents, CALENDAR_KINDS, CalendarKind } from '@/lib/institutionOS';
import { cn } from '@/lib/utils';

const KIND_STYLE: Record<CalendarKind, string> = {
  research: 'border-primary/40 text-primary',
  validation: 'border-trading-gold/40 text-trading-gold',
  promotion: 'border-trading-profit/40 text-trading-profit',
  governance: 'border-destructive/40 text-destructive',
  executive: 'border-foreground/30 text-foreground',
  memory: 'border-muted-foreground/40 text-muted-foreground',
};

export default function InstitutionCalendar() {
  const events = useMemo(() => calendarEvents(), []);
  const [kinds, setKinds] = useState<CalendarKind[]>([]);
  const [jump, setJump] = useState('');

  const filtered = events.filter((e) => (kinds.length === 0 || kinds.includes(e.kind)) && (!jump || e.date >= jump));
  const months = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    filtered.forEach((e) => {
      const key = e.date.slice(0, 7);
      m.set(key, [...(m.get(key) ?? []), e]);
    });
    return [...m.entries()];
  }, [filtered]);

  const toggle = (k: CalendarKind) => setKinds((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  return (
    <OsPage
      title="Institution Calendar™"
      subtitle="Every event that has ever happened inside the institution, in chronological order. Jump to any date and read what the institution was doing."
      department="Institution Calendar™"
      actions={<Input type="date" value={jump} onChange={(e) => setJump(e.target.value)} className="h-7 w-[150px] text-[11px]" />}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {CALENDAR_KINDS.map((k) => (
          <Button key={k.key} size="sm" variant={kinds.includes(k.key) ? 'default' : 'outline'}
            className="h-7 text-[11px]" onClick={() => toggle(k.key)}>{k.label}</Button>
        ))}
        {(kinds.length > 0 || jump) && (
          <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setKinds([]); setJump(''); }}>Reset</Button>
        )}
        <span className="ml-2 text-[11px] text-muted-foreground">{filtered.length} events</span>
      </div>

      <Card className="border-border/50 bg-card/60">
        <ScrollArea className="h-[680px]">
          <div className="space-y-6 p-5">
            {months.map(([month, list]) => (
              <div key={month}>
                <div className="sticky top-0 z-10 -mx-5 mb-2 bg-card/95 px-5 py-1.5 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-trading-gold">{month} · {list.length} events</p>
                </div>
                <ol className="relative space-y-2 border-l border-border/50 pl-4">
                  {list.map((e) => (
                    <li key={`${e.objectId}-${e.day}`} className="relative">
                      <span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-trading-gold" />
                      <Link to={`/explorer/${e.objectId}`}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2 hover:border-trading-gold/40">
                        <span className="font-mono text-[10px] text-muted-foreground">{e.date}</span>
                        <Badge variant="outline" className={cn('px-1.5 py-0 text-[9px] capitalize', KIND_STYLE[e.kind])}>{e.kind}</Badge>
                        <span className="flex-1 text-[12px] text-foreground">{e.title}</span>
                        <span className="text-[10px] text-muted-foreground">{e.department} · {e.confidence}%</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </OsPage>
  );
}
