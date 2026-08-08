import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KNOWLEDGE_NODES, KNOWLEDGE_EDGES, NODE_TYPE_META, RELATIONSHIP_META, STRENGTH_META,
  type KnowledgeNode, type KnowledgeEdge,
} from '@/lib/knowledgeGraph';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const WORLD_W = 2500;
const WORLD_H = 1500;
const R = 26;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  selectedId: string | null;
  highlightIds: string[];
  onSelect: (id: string) => void;
}

export function KnowledgeGraphCanvas({ selectedId, highlightIds, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.55);
  const [offset, setOffset] = useState({ x: 40, y: 20 });
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => Object.fromEntries(KNOWLEDGE_NODES.map((k) => [k.id, { x: k.x, y: k.y }])),
  );
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  const wheelHandler = useRef((e: WheelEvent) => {});
  wheelHandler.current = (e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    const { zoom: z, offset: o } = stateRef.current;
    const next = clamp(z * Math.exp(-dy * 0.0018), MIN_ZOOM, MAX_ZOOM);
    const k = next / z;
    setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
    setZoom(next);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); wheelHandler.current(e); };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomAt = useCallback((factor: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = rect.width / 2, py = rect.height / 2;
    setZoom((z) => {
      const next = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      const k = next / z;
      setOffset((o) => ({ x: px - (px - o.x) * k, y: py - (py - o.y) * k }));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setZoom(0.55);
    setOffset({ x: 40, y: 20 });
    setPositions(Object.fromEntries(KNOWLEDGE_NODES.map((k) => [k.id, { x: k.x, y: k.y }])));
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (dragNode) return;
    setPanning(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragNode) {
      setPositions((p) => ({
        ...p,
        [dragNode]: { x: p[dragNode].x + e.movementX / zoom, y: p[dragNode].y + e.movementY / zoom },
      }));
    } else if (panning) {
      setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
    }
  };

  const endDrag = () => { setPanning(false); setDragNode(null); };

  const highlight = useMemo(() => new Set(highlightIds), [highlightIds]);
  const neighbours = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>();
    KNOWLEDGE_EDGES.forEach((e) => {
      if (e.from === selectedId) s.add(e.to);
      if (e.to === selectedId) s.add(e.from);
    });
    return s;
  }, [selectedId]);

  const isDim = (id: string) => {
    if (highlight.size) return !highlight.has(id);
    if (!selectedId) return false;
    return id !== selectedId && !neighbours.has(id);
  };

  const edgeDim = (e: KnowledgeEdge) => {
    if (highlight.size) return !(highlight.has(e.from) && highlight.has(e.to));
    if (!selectedId) return false;
    return e.from !== selectedId && e.to !== selectedId;
  };

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-50 bg-background'
          : 'relative h-[620px] w-full overflow-hidden rounded-xl border border-trading-gold/20 bg-card/40 backdrop-blur'
      }
    >
      <div
        ref={containerRef}
        className={`relative h-full w-full touch-none overflow-hidden ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <svg className="rsch-graph h-full w-full" role="application" aria-label="Institution knowledge graph" style={{ background: 'radial-gradient(circle at 30% 20%, hsl(var(--muted)/0.35), transparent 60%)' }}>
          <defs>
            <pattern id="kg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kg-grid)" />
          <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
            {KNOWLEDGE_EDGES.map((e) => {
              const a = positions[e.from], b = positions[e.to];
              if (!a || !b) return null;
              const meta = RELATIONSHIP_META[e.type];
              const s = STRENGTH_META[e.strength];
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 40;
              const dim = edgeDim(e);
              return (
                <path
                  key={e.id}
                  d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={`hsl(${meta.color})`}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  opacity={dim ? 0.06 : 0.8}
                  className={`kg-edge ${dim ? '' : 'kg-edge-animated'}`}
                  onPointerEnter={(ev) => setHover({
                    label: `${e.from} → ${e.to} · ${meta.label} · ${s.label} · ${e.confidence}% — ${e.note}`,
                    x: ev.clientX, y: ev.clientY,
                  })}
                  onPointerLeave={() => setHover(null)}
                />
              );
            })}

            {KNOWLEDGE_NODES.map((node) => {
              const p = positions[node.id];
              const meta = NODE_TYPE_META[node.type];
              const dim = isDim(node.id);
              const sel = node.id === selectedId;
              const circumference = 2 * Math.PI * (R + 6);
              return (
                <g
                  key={node.id}
                  transform={`translate(${p.x} ${p.y})`}
                  opacity={dim ? 0.15 : 1}
                  className="cursor-pointer"
                  onPointerDown={(ev) => { ev.stopPropagation(); setDragNode(node.id); }}
                  onPointerUp={(ev) => { ev.stopPropagation(); endDrag(); }}
                  onClick={(ev) => { ev.stopPropagation(); onSelect(node.id); }}
                  onPointerEnter={(ev) => setHover({ label: `${node.id} · ${node.title} (${meta.label})`, x: ev.clientX, y: ev.clientY })}
                  onPointerLeave={() => setHover(null)}
                >
                  {sel && (
                    <circle r={R + 15} fill="hsl(var(--trading-gold) / 0.08)" stroke="hsl(var(--trading-gold) / 0.55)" strokeWidth={1.5} />
                  )}
                  <circle r={R + 6} fill="none" stroke="hsl(var(--border))" strokeWidth={3} opacity={0.5} />
                  <circle
                    r={R + 6} fill="none" stroke="hsl(var(--primary))" strokeWidth={3}
                    strokeDasharray={`${(node.confidence / 100) * circumference} ${circumference}`}
                    transform="rotate(-90)" strokeLinecap="round"
                  />
                  <circle r={R} fill={`hsl(${meta.color} / 0.18)`} stroke={`hsl(${meta.color})`} strokeWidth={sel ? 3.5 : 1.8} />
                  <text textAnchor="middle" dy="4" fontSize="11" fontWeight="600" fill={`hsl(${meta.color})`}>
                    {node.id.split('-')[0]}
                  </text>
                  <circle
                    cx={R - 4} cy={-R + 4} r={5}
                    fill={
                      node.status === 'rejected' ? 'hsl(var(--trading-loss))'
                      : node.status === 'validated' ? 'hsl(var(--trading-profit))'
                      : node.status === 'blocked' ? 'hsl(var(--trading-warning))'
                      : node.status === 'archived' ? 'hsl(var(--trading-gold))'
                      : 'hsl(var(--primary))'
                    }
                    stroke="hsl(var(--background))" strokeWidth={1.5}
                  />
                  <text textAnchor="middle" y={R + 23} fontSize="11.5" fontWeight={sel ? 600 : 400} fill="hsl(var(--foreground))" opacity={0.92}>
                    {node.title.length > 30 ? `${node.title.slice(0, 29)}…` : node.title}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Mini-map */}
        <div className="pointer-events-none absolute bottom-3 right-3 h-28 w-44 overflow-hidden rounded-md border border-trading-gold/25 bg-background/80 backdrop-blur">
          <svg viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} className="h-full w-full">
            {KNOWLEDGE_EDGES.map((e) => {
              const a = positions[e.from], b = positions[e.to];
              if (!a || !b) return null;
              return <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth={4} />;
            })}
            {KNOWLEDGE_NODES.map((k) => {
              const p = positions[k.id];
              return <circle key={k.id} cx={p.x} cy={p.y} r={18} fill={`hsl(${NODE_TYPE_META[k.type].color})`} opacity={isDim(k.id) ? 0.25 : 0.95} />;
            })}
          </svg>
        </div>

        {/* Controls */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Button size="icon" variant="outline" className="h-8 w-8 border-trading-gold/30 bg-background/70" onClick={() => zoomAt(1.25)} aria-label="Zoom in"><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8 border-trading-gold/30 bg-background/70" onClick={() => zoomAt(0.8)} aria-label="Zoom out"><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8 border-trading-gold/30 bg-background/70" onClick={reset} aria-label="Reset view"><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8 border-trading-gold/30 bg-background/70" onClick={() => setFullscreen((f) => !f)} aria-label="Toggle fullscreen">
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-border/50 bg-background/70 px-2 py-1 text-[10px] text-muted-foreground">
          {Math.round(zoom * 100)}% · scroll to zoom · drag to pan · drag a node to move it
        </div>

        {hover && (
          <div
            className="pointer-events-none fixed z-[60] max-w-xs rounded-md border border-trading-gold/30 bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground shadow-lg"
            style={{ left: hover.x + 12, top: hover.y + 12 }}
          >
            {hover.label}
          </div>
        )}
      </div>
    </div>
  );
}
