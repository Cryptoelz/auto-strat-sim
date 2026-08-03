import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  PALETTE_GROUP_ORDER, recentObjects, pinnedObjects, recentSearches,
  pushRecentObject, pushRecentSearch, togglePinnedObject, type PaletteResult,
} from '@/lib/institutional';
import {
  advancedSearch, DEFAULT_FILTERS, DATE_PRESETS, STATUS_OPTIONS, filtersActive,
  savedSearches, saveSearch, removeSavedSearch, toggleSavedPin,
  TODAY_DAY, DEPARTMENTS, type SearchFilters,
} from '@/lib/enterprise';
import { NODE_BY_ID, NODE_TYPE_META, type KnowledgeNodeType } from '@/lib/knowledgeGraph';
import { Pin, Clock, Search, SlidersHorizontal, X, Star, BookmarkPlus } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Executive Home', to: '/home' },
  { label: 'ATLAS Oracle™', to: '/oracle' },
  { label: 'Executive Boardroom™', to: '/boardroom' },
  { label: 'Institutional Digital Twin™', to: '/digital-twin' },
  { label: 'Institutional Knowledge Graph™', to: '/knowledge-graph' },
  { label: 'ATLAS Intelligence Explorer™', to: '/explorer' },
  { label: 'Documentation Centre', to: '/docs' },
  { label: 'Performance Centre', to: '/performance' },
  { label: 'Enterprise Settings', to: '/settings' },
  { label: 'Launch Checklist', to: '/launch' },
];

const EXAMPLES = [
  'validated specialists with high confidence',
  'blocked governance last 30 days',
  'discoveries confidence above 85',
  'risk objects from Risk Radar',
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

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
        active ? 'border-trading-gold/60 bg-trading-gold/15 text-trading-gold' : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tick, setTick] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);

  const { results, parsed } = useMemo(() => advancedSearch(query, filters), [query, filters]);
  const grouped = useMemo(() => {
    const map = new Map<KnowledgeNodeType, PaletteResult[]>();
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
  const saved = useMemo(() => savedSearches(), [open, tick]);

  const toggle = <K extends 'departments' | 'types' | 'statuses'>(key: K, value: SearchFilters[K][number]) =>
    setFilters((f) => {
      const list = f[key] as string[];
      const next = list.includes(value as string) ? list.filter((x) => x !== value) : [...list, value as string];
      return { ...f, [key]: next } as SearchFilters;
    });

  const go = (to: string, id?: string) => {
    if (id) pushRecentObject(id);
    if (query) pushRecentSearch(query);
    onOpenChange(false);
    setQuery('');
    navigate(to);
  };

  const persistSearch = () => {
    const name = query.trim() || 'Filtered view';
    saveSearch(name.slice(0, 48), query, filters);
    setTick((t) => t + 1);
  };

  const activeFilterCount =
    filters.departments.length + filters.types.length + filters.statuses.length +
    (filters.confidenceMin > 0 || filters.confidenceMax < 100 ? 1 : 0) +
    (filters.dayFrom > 0 ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden border-trading-gold/25 bg-card/95 p-0 shadow-2xl backdrop-blur">
        <VisuallyHidden><DialogTitle>Institutional Command Palette — Global Search 2.0</DialogTitle></VisuallyHidden>
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search the institution in plain English — try “validated specialists with high confidence”"
          />

          <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-3 py-2">
            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1.5 px-2 text-[10px]"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="h-3 w-3" /> Filters{activeFilterCount ? ` · ${activeFilterCount}` : ''}
            </Button>
            <Button size="sm" variant="outline" className="h-6 gap-1.5 px-2 text-[10px]" onClick={persistSearch}>
              <BookmarkPlus className="h-3 w-3" /> Save search
            </Button>
            {filtersActive(filters) && (
              <Button size="sm" variant="ghost" className="h-6 gap-1 px-2 text-[10px] text-muted-foreground" onClick={() => setFilters(DEFAULT_FILTERS)}>
                <X className="h-3 w-3" /> Clear
              </Button>
            )}
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{results.length} matches</span>
          </div>

          {parsed.interpretations.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 bg-trading-gold/[0.04] px-3 py-1.5">
              <span className="text-[9.5px] uppercase tracking-wider text-trading-gold/80">Interpreted as</span>
              {Array.from(new Set(parsed.interpretations)).map((x) => (
                <Badge key={x} variant="outline" className="border-trading-gold/30 text-[9.5px] text-trading-gold">{x}</Badge>
              ))}
            </div>
          )}

          {showFilters && (
            <div className="space-y-2.5 border-b border-border/40 px-3 py-3">
              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Object types</p>
                <div className="flex flex-wrap gap-1">
                  {PALETTE_GROUP_ORDER.map((t) => (
                    <Chip key={t} active={filters.types.includes(t)} onClick={() => toggle('types', t)}>{NODE_TYPE_META[t].label}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Departments</p>
                <div className="flex flex-wrap gap-1">
                  {DEPARTMENTS.map((d) => (
                    <Chip key={d} active={filters.departments.includes(d)} onClick={() => toggle('departments', d)}>{d}</Chip>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="mb-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Status</p>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map((s) => (
                      <Chip key={s} active={filters.statuses.includes(s)} onClick={() => toggle('statuses', s)}>{s}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[9.5px] uppercase tracking-wider text-muted-foreground">Date range</p>
                  <div className="flex flex-wrap gap-1">
                    {DATE_PRESETS.map((p) => (
                      <Chip
                        key={p.key}
                        active={filters.dayFrom === Math.max(0, TODAY_DAY - p.days)}
                        onClick={() => setFilters((f) => ({ ...f, dayFrom: Math.max(0, TODAY_DAY - p.days), dayTo: TODAY_DAY }))}
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[9.5px] uppercase tracking-wider text-muted-foreground">
                  Confidence range · {filters.confidenceMin}% – {filters.confidenceMax}%
                </p>
                <Slider
                  aria-label="Confidence range"
                  value={[filters.confidenceMin, filters.confidenceMax]}
                  min={0} max={100} step={5}
                  onValueChange={([lo, hi]) => setFilters((f) => ({ ...f, confidenceMin: lo, confidenceMax: hi }))}
                  className="max-w-sm"
                />
              </div>
            </div>
          )}

          <CommandList className="max-h-[58vh]">
            <CommandEmpty>No institutional object matches that query or filter set.</CommandEmpty>

            {!query && !filtersActive(filters) && (
              <CommandGroup heading="Try a natural-language search">
                {EXAMPLES.map((e) => (
                  <CommandItem key={e} value={`example ${e}`} onSelect={() => setQuery(e)}>
                    <Search className="mr-2 h-3.5 w-3.5 text-trading-gold" />
                    <span className="text-xs">{e}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {saved.length > 0 && (
              <CommandGroup heading="Saved searches">
                {saved.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned)).map((s) => (
                  <CommandItem key={`sv-${s.name}`} value={`saved ${s.name}`} onSelect={() => { setQuery(s.query); setFilters(s.filters); }}>
                    <Star className={`mr-2 h-3.5 w-3.5 ${s.pinned ? 'text-trading-gold' : 'text-muted-foreground'}`} />
                    <span className="text-xs">{s.name}</span>
                    <span className="ml-auto flex items-center gap-1">
                      <button aria-label="Pin saved search" onClick={(e) => { e.stopPropagation(); toggleSavedPin(s.name); setTick((t) => t + 1); }} className="rounded p-0.5 text-muted-foreground hover:text-trading-gold">
                        <Pin className="h-3 w-3" />
                      </button>
                      <button aria-label="Delete saved search" onClick={(e) => { e.stopPropagation(); removeSavedSearch(s.name); setTick((t) => t + 1); }} className="rounded p-0.5 text-muted-foreground hover:text-rose-400">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

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
              {QUICK_LINKS.filter((l) => !query || l.label.toLowerCase().includes(query.toLowerCase())).map((l) => (
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
