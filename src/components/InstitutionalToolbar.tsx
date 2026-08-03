import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  recentObjects, pinnedObjects, togglePinnedObject, pushRecentObject,
} from '@/lib/institutional';
import { NODE_BY_ID } from '@/lib/knowledgeGraph';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Pin, Clock, Search, Sparkles, Compass, Share2, GitCompare, Home, Network } from 'lucide-react';

const LABELS: Record<string, string> = {
  atlas: 'ATLAS™',
  oracle: 'ATLAS Oracle™',
  boardroom: 'Executive Boardroom™',
  'digital-twin': 'Institutional Digital Twin™',
  'knowledge-graph': 'Institutional Knowledge Graph™',
  explorer: 'Intelligence Explorer™',
};

const pretty = (seg: string) =>
  LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Smart breadcrumbs + recent/pinned objects + institutional quick actions on every page. */
export function InstitutionalToolbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [tick, setTick] = useState(0);

  const segments = location.pathname.split('/').filter(Boolean);
  const objectId = params.objectId ?? (segments[0] === 'explorer' ? segments[1] : undefined);
  const node = objectId ? NODE_BY_ID[objectId] : undefined;

  const recents = useMemo(() => recentObjects().slice(0, 5), [location.pathname, tick]);
  const pins = useMemo(() => pinnedObjects().slice(0, 5), [location.pathname, tick]);

  const go = (id: string) => { pushRecentObject(id); navigate(`/explorer/${id}`); };

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border/40 bg-card/20 px-3 py-1.5 text-[11px] backdrop-blur">
      <Breadcrumb>
        <BreadcrumbList className="gap-1 text-[11px]">
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/" className="flex items-center gap-1"><Home className="h-3 w-3" /> Institution</Link></BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((s, i) => (
            <span key={`${s}-${i}`} className="flex items-center gap-1">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {i === segments.length - 1
                  ? <BreadcrumbPage>{node && s === objectId ? `${node.id} · ${node.title}` : pretty(s)}</BreadcrumbPage>
                  : <BreadcrumbLink asChild><Link to={`/${segments.slice(0, i + 1).join('/')}`}>{pretty(s)}</Link></BreadcrumbLink>}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex flex-wrap items-center gap-1">
        {pins.length > 0 && (
          <span className="flex items-center gap-1">
            <Pin className="h-3 w-3 text-primary" />
            {pins.map((id) => (
              <button key={id} onClick={() => go(id)} className="rounded-full border border-primary/30 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary hover:border-primary/60">
                {id}
              </button>
            ))}
          </span>
        )}
        {recents.length > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {recents.map((id) => (
              <button key={id} onClick={() => go(id)} className="rounded-full border border-border/50 bg-muted/20 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
                {id}
              </button>
            ))}
          </span>
        )}

        {node && (
          <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]"
            onClick={() => { togglePinnedObject(node.id); setTick((t) => t + 1); }}>
            <Pin className="h-3 w-3" /> {pins.includes(node.id) ? 'Unpin' : 'Pin'}
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={onOpenSearch}><Search className="h-3 w-3" /> Search</Button>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => navigate('/oracle')}><Sparkles className="h-3 w-3" /> Oracle</Button>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => navigate(node ? `/explorer/${node.id}` : '/explorer')}><Compass className="h-3 w-3" /> Explorer</Button>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => navigate('/knowledge-graph')}><Share2 className="h-3 w-3" /> Graph</Button>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => navigate('/digital-twin')}><Network className="h-3 w-3" /> Timeline</Button>
        <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => navigate('/boardroom')}><GitCompare className="h-3 w-3" /> Compare</Button>
      </div>
    </div>
  );
}
