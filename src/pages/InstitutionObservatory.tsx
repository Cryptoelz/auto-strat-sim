import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { observatoryPanels } from '@/lib/institutionLife';

export default function InstitutionObservatory() {
  const panels = observatoryPanels();
  const [filter, setFilter] = useState('');

  return (
    <OsPage
      title="Institution Observatory™"
      subtitle="A live wall of everything happening inside the institution — departments, evidence, discoveries, questions, validations, governance actions, approvals, conversations and reports."
      department="Observatory™"
      actions={
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter the wall…"
          className="h-7 w-52 rounded-md border border-border/50 bg-muted/20 px-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground focus:border-trading-gold/50"
        />
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {panels.map((p) => {
          const items = p.items.filter(
            (i) => !filter || `${i.primary} ${i.secondary} ${i.meta ?? ''}`.toLowerCase().includes(filter.toLowerCase()),
          );
          return (
            <Card key={p.key} className="border-border/50 bg-card/60">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-trading-gold" />
                  <h2 className="text-[12px] font-semibold tracking-tight text-foreground">{p.title}</h2>
                </div>
                <Badge variant="outline" className="border-border/50 px-1.5 py-0 text-[9px] text-muted-foreground">{items.length}</Badge>
              </div>
              <ScrollArea className="h-[260px]">
                <div className="divide-y divide-border/30">
                  {items.length === 0 && <p className="px-4 py-6 text-[11px] text-muted-foreground">No matching activity.</p>}
                  {items.map((it, i) => {
                    const body = (
                      <>
                        <p className="text-[11.5px] leading-relaxed text-foreground/90">{it.primary}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{it.secondary}{it.meta ? ` · ${it.meta}` : ''}</p>
                      </>
                    );
                    return it.objectId ? (
                      <Link key={i} to={`/explorer/${it.objectId}`} className="block px-4 py-2 transition-colors hover:bg-muted/20">{body}</Link>
                    ) : (
                      <div key={i} className="px-4 py-2">{body}</div>
                    );
                  })}
                </div>
              </ScrollArea>
              {p.to && (
                <div className="border-t border-border/40 px-4 py-2">
                  <Button asChild size="sm" variant="ghost" className="h-6 px-0 text-[10.5px] text-trading-gold hover:bg-transparent hover:underline">
                    <Link to={p.to}>Open module →</Link>
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </section>
    </OsPage>
  );
}
