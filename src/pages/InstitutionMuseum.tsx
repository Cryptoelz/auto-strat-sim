import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { OsPage } from '@/components/institution/OsPage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { museumExhibits, MUSEUM_ERAS } from '@/lib/institutionOS';
import { NODE_TYPE_META } from '@/lib/knowledgeGraph';
import { Landmark } from 'lucide-react';

export default function InstitutionMuseum() {
  const exhibits = useMemo(() => museumExhibits(), []);
  const [era, setEra] = useState('All');
  const [q, setQ] = useState('');

  const list = exhibits.filter((e) =>
    (era === 'All' || e.era === era) &&
    (!q || `${e.node.id} ${e.node.title} ${e.node.summary}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <OsPage
      title="Institution Museum™"
      subtitle="Nothing is ever deleted. Every research object — validated, archived or rejected — is preserved permanently with its story, relationships and significance."
      department="Institution Museum™"
      actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the archive" className="h-7 w-[190px] text-[11px]" />}
    >
      <div className="flex flex-wrap gap-1.5">
        {['All', ...MUSEUM_ERAS].map((e) => (
          <Button key={e} size="sm" variant={era === e ? 'default' : 'outline'} className="h-7 text-[11px]" onClick={() => setEra(e)}>{e}</Button>
        ))}
        <span className="ml-2 self-center text-[11px] text-muted-foreground">{list.length} exhibits preserved</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((e) => (
          <Link key={e.node.id} to={`/explorer/${e.node.id}`} className="group">
            <Card className="h-full border-border/50 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-trading-gold/40 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Landmark className="h-3.5 w-3.5 text-trading-gold" />
                  <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{e.era}</span>
                </div>
                <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[9.5px] text-trading-gold">
                  Significance {e.significance}
                </Badge>
              </div>
              <h2 className="mt-2 text-[13px] font-medium leading-snug text-foreground">{e.node.title}</h2>
              <p className="mt-1 text-[10px] text-muted-foreground">{e.node.id} · {NODE_TYPE_META[e.node.type].label} · {e.node.created}</p>
              <p className="mt-2 line-clamp-3 text-[11.5px] leading-relaxed text-muted-foreground">{e.node.summary}</p>
              <p className="mt-3 border-t border-border/40 pt-2 text-[11px] italic text-trading-gold/90">{e.epitaph}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {e.relationships} relationships · touched {e.departments.length} departments
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </OsPage>
  );
}
