import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import {
  searchInstitution, PALETTE_GROUP_ORDER, recentObjects, pinnedObjects, recentSearches,
  pushRecentObject, pushRecentSearch, togglePinnedObject, type PaletteResult,
} from '@/lib/institutional';
import { NODE_BY_ID, NODE_TYPE_META } from '@/lib/knowledgeGraph';
import { Pin, Clock, Search } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'ATLAS Oracle™', to: '/oracle' },
  { label: 'Executive Boardroom™', to: '/boardroom' },
  { label: 'Institutional Digital Twin™', to: '/digital-twin' },
  { label: 'Institutional Knowledge Graph™', to: '/knowledge-graph' },
  { label: 'ATLAS Intelligence Explorer™', to: '/explorer' },
  { label: 'ATLAS™ Command Centre', to: '/atlas' },
];

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { open, setOpen };
}

interface Props { open: boolean; onOpenChange: (v: boolean) => void }

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);

  const results = useMemo(() => searchInstitution(query), [query]);
  const grouped = useMemo(() => {
    const map = new Map<string, PaletteResult[]>();
    for (const r of results) {
      const list = map.get(r.type) ?? [];
      list.push(r);
      map.set(r.type, list);
    }
    return PALETTE_GROUP_ORDER.filter((t) => map.has(t)).map((t) => ({ type: t, items: map.get(t)! }));
  }, [results]);

  const recents = useMemo(() => recentObjects(), [open, tick]);
  const pins = useMemo(() => pinnedObjects(), [open, tick]);
  const searches = useMemo(() => recentSearches(), [open, tick]);

  const go = (to: string, id?: string) => {
    if (id) pushRecentObject(id);
    if (query) pushRecentSearch(query);
    onOpenChange(false);
    setQuery('');
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden border-trading-gold/25 bg-card/95 p-0 shadow-2xl backdrop-blur">
        <VisuallyHidden><DialogTitle>Institutional Command Palette</DialogTitle></VisuallyHidden>
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search the entire institution..."
          />
          <CommandList className="max-h-[62vh]">
        <CommandEmpty>No institutional object matches that query.</CommandEmpty>

        {!query && pins.length > 0 && (
          <CommandGroup heading="Pinned Objects">
            {pins.map((id) => (
              <CommandItem key={`p-${id}`} value={`pin ${id} ${NODE_BY_ID[id].title}`} onSelect={() => go(`/explorer/${id}`, id)}>
                <Pin className="mr-2 h-3.5 w-3.5 text-primary" />
                <span className="text-xs">{id} · {NODE_BY_ID[id].title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && recents.length > 0 && (
          <CommandGroup heading="Recently Viewed">
            {recents.map((id) => (
              <CommandItem key={`r-${id}`} value={`recent ${id} ${NODE_BY_ID[id].title}`} onSelect={() => go(`/explorer/${id}`, id)}>
                <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{id} · {NODE_BY_ID[id].title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && searches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {searches.map((s) => (
              <CommandItem key={`s-${s}`} value={`search ${s}`} onSelect={() => setQuery(s)}>
                <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{s}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Institutional Modules">
          {QUICK_LINKS.map((l) => (
            <CommandItem key={l.to} value={`module ${l.label}`} onSelect={() => go(l.to)}>
              <span className="text-xs font-medium">{l.label}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{l.to}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {grouped.map((g) => (
          <CommandGroup key={g.type} heading={`${NODE_TYPE_META[g.type].label} · ${g.items.length}`}>
            {g.items.map((r) => (
              <CommandItem
                key={r.id}
                value={`${r.id} ${r.title} ${r.typeLabel} ${r.department} ${r.status}`}
                onSelect={() => go(r.to, r.id)}
                className="gap-2"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `hsl(${r.color})` }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{r.title}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {r.id} · {r.typeLabel} · {r.status} · {r.department}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[9px] text-primary">{r.confidence}%</Badge>
                  <Badge variant="outline" className="border-border/50 text-[9px] text-muted-foreground">E {r.evidenceScore}</Badge>
                  <button
                    aria-label="Pin object"
                    onClick={(e) => { e.stopPropagation(); togglePinnedObject(r.id); setTick((t) => t + 1); }}
                    className="rounded p-0.5 text-muted-foreground hover:text-primary"
                  >
                    <Pin className="h-3 w-3" />
                  </button>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
