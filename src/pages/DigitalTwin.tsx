import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  twinNodes, twinEdges, TWIN_FILTERS, intelligenceFeed, knowledgePulse, healthMonitor,
  INSTITUTIONAL_BADGES, LAYER_VERSION, TODAY_DAY, dayOf, pushRecentObject, type Light,
} from '@/lib/institutional';
import { NODE_BY_ID, NODE_TYPE_META, RELATIONSHIP_META, connections, type KnowledgeNodeType } from '@/lib/knowledgeGraph';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Network, Lock, Play, Pause, RotateCcw, ChevronDown, Activity, ExternalLink } from 'lucide-react';

const LIGHT_DOT: Record<Light, string> = {
  green: 'bg-trading-profit', amber: 'bg-trading-warning', red: 'bg-destructive',
};

export default function DigitalTwin() {
  const navigate = useNavigate();
  const nodes = useMemo(() => twinNodes(), []);
  const edges = useMemo(() => twinEdges(), []);
  const feed = useMemo(() => intelligenceFeed(), []);
  const pulse = useMemo(() => knowledgePulse(), []);
  const health = useMemo(() => healthMonitor(), []);

  const [filter, setFilter] = useState<KnowledgeNodeType | 'all'>('all');
  const [day, setDay] = useState(TODAY_DAY);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [openDiag, setOpenDiag] = useState<string | null>(null);
  const timer = useRef<number>();

  const minDay = useMemo(() => Math.min(...nodes.map((n) => n.day)), [nodes]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setDay((d) => (d >= TODAY_DAY ? (setPlaying(false), TODAY_DAY) : d + 1));
    }, 120);
    return () => window.clearInterval(timer.current);
  }, [playing]);

  const visible = nodes.filter((n) => n.day <= day && (filter === 'all' || n.node.type === filter));
  const visibleIds = new Set(visible.map((v) => v.node.id));
  const visibleEdges = edges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to));
  const hovered = hover ? NODE_BY_ID[hover] : null;
  const visibleFeed = feed.filter((f) => f.day <= day);

  const open = (id: string) => { pushRecentObject(id); navigate(`/explorer/${id}`); };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">
      <header className="relative overflow-hidden rounded-2xl border border-trading-gold/25 bg-gradient-to-br from-background via-card/60 to-background p-6">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-trading-gold/10 blur-3xl" />
        <div className="relative space-y-3">
          <Badge variant="outline" className="border-trading-gold/40 bg-trading-gold/10 text-[10px] tracking-widest text-trading-gold">
            PHASE 5 · LIVING INSTITUTIONAL MODEL
          </Badge>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
            <Network className="h-7 w-7 text-trading-gold" /> Institutional Digital Twin™
          </h1>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            A live visual representation of the institution. {nodes.length} knowledge objects and {edges.length} explainable
            relationships, replayable across institutional time. Read-only observation — nothing here executes.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {INSTITUTIONAL_BADGES.slice(0, 6).map((b) => (
              <Badge key={b} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
                <Lock className="mr-1 h-2.5 w-2.5" />{b}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Knowledge pulse */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {pulse.map((p) => (
          <Card key={p.label} className="border-border/50 bg-card/40 backdrop-blur">
            <CardContent className="space-y-1 p-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.label}</p>
              <p className="font-mono text-2xl font-semibold text-trading-gold animate-fade-in">{p.value}</p>
              <p className="text-[10px] text-muted-foreground">+{p.today} today · +{p.week} week · +{p.month} month</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Network */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Interactive Knowledge Network</CardTitle>
            <CardDescription className="text-[11px]">
              Showing {visible.length} nodes and {visibleEdges.length} relationships up to institutional day {day}. Hover for detail, click to open the Intelligence Explorer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {TWIN_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${filter === f.key ? 'border-trading-gold/50 bg-trading-gold/10 text-trading-gold' : 'border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-background/60">
              <svg viewBox="0 0 1000 640" className="h-[520px] w-full">
                {visibleEdges.map((e) => {
                  const a = nodes.find((n) => n.node.id === e.from)!;
                  const b = nodes.find((n) => n.node.id === e.to)!;
                  const active = hover === e.from || hover === e.to;
                  return (
                    <line key={e.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={`hsl(${RELATIONSHIP_META[e.type].color})`}
                      strokeWidth={active ? 2.2 : 1}
                      strokeOpacity={active ? 0.95 : 0.28}
                      strokeDasharray="6 6"
                      className="transition-all duration-300"
                    >
                      <animate attributeName="stroke-dashoffset" from="12" to="0" dur="1.4s" repeatCount="indefinite" />
                    </line>
                  );
                })}
                {visible.map((n) => {
                  const fresh = n.day > day - 3;
                  const active = hover === n.node.id;
                  return (
                    <g key={n.node.id} className="cursor-pointer"
                      onMouseEnter={() => setHover(n.node.id)} onMouseLeave={() => setHover(null)}
                      onClick={() => open(n.node.id)}>
                      {fresh && (
                        <circle cx={n.x} cy={n.y} r={n.radius + 6} fill={`hsl(${NODE_TYPE_META[n.node.type].color})`} opacity={0.18}>
                          <animate attributeName="r" values={`${n.radius};${n.radius + 12};${n.radius}`} dur="2.4s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.28;0.02;0.28" dur="2.4s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={n.x} cy={n.y} r={active ? n.radius + 3 : n.radius}
                        fill={`hsl(${NODE_TYPE_META[n.node.type].color})`}
                        fillOpacity={active ? 1 : 0.82}
                        stroke="hsl(var(--background))" strokeWidth={1.4}
                        className="transition-all duration-200" />
                      {(active || n.degree >= 5) && (
                        <text x={n.x + n.radius + 4} y={n.y + 3} fontSize={9} fill="hsl(var(--foreground))" opacity={active ? 1 : 0.55}>
                          {n.node.id}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {hovered && (
                <div className="pointer-events-none absolute bottom-3 left-3 max-w-sm rounded-lg border border-trading-gold/30 bg-card/95 p-3 shadow-xl backdrop-blur animate-fade-in">
                  <p className="text-xs font-semibold">{hovered.id} · {hovered.title}</p>
                  <p className="text-[10px] text-muted-foreground">{NODE_TYPE_META[hovered.type].label} · {hovered.status}</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                    <span className="text-muted-foreground">Confidence</span><span className="font-mono">{hovered.confidence}%</span>
                    <span className="text-muted-foreground">Evidence</span><span className="font-mono">{hovered.evidenceScore}/100 · {hovered.supportingEvidence.length} items</span>
                    <span className="text-muted-foreground">Dependencies</span><span className="font-mono">{connections(hovered.id).length}</span>
                    <span className="text-muted-foreground">Connected</span><span className="truncate font-mono">{connections(hovered.id).slice(0, 3).map((c) => (c.from === hovered.id ? c.to : c.from)).join(', ') || '—'}</span>
                    <span className="text-muted-foreground">Created By</span><span className="truncate">{hovered.owner}</span>
                    <span className="text-muted-foreground">Last Updated</span><span className="font-mono">{hovered.created} (day {dayOf(hovered.created)})</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-trading-gold">Click to open the Intelligence Explorer</p>
                </div>
              )}
            </div>

            {/* Timeline playback */}
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="h-7 gap-1.5 text-[11px]" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />} {playing ? 'Pause' : 'Replay'}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-[11px]" onClick={() => { setPlaying(false); setDay(minDay); }}>
                <RotateCcw className="h-3 w-3" /> Reset
              </Button>
              <Slider min={minDay} max={TODAY_DAY} step={1} value={[day]} onValueChange={(v) => { setPlaying(false); setDay(v[0]); }} className="flex-1" />
              <span className="w-28 shrink-0 text-right font-mono text-[10px] text-muted-foreground">day {day} / {TODAY_DAY}</span>
            </div>
          </CardContent>
        </Card>

        {/* Live intelligence feed */}
        <Card className="border-border/50 bg-card/40 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4 text-trading-gold" /> Live Intelligence Feed</CardTitle>
            <CardDescription className="text-[11px]">Institutional activity up to day {day}. Replays with the timeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[560px] pr-3">
              <div className="space-y-1.5">
                {visibleFeed.map((f, i) => (
                  <button key={`${f.id}-${i}`} onClick={() => f.id && open(f.id)}
                    className="group w-full rounded-md border border-border/40 bg-muted/15 px-2.5 py-2 text-left transition-colors hover:border-trading-gold/40">
                    <p className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className="truncate">{f.actor}</span>
                      <span className="shrink-0 font-mono">{f.date}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed transition-colors group-hover:text-foreground">{f.text}</p>
                  </button>
                ))}
                {!visibleFeed.length && <p className="text-xs text-muted-foreground">No recorded activity before this institutional day.</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Health monitor */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Institution Health Monitor</h2>
        <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3">
          {health.map((h) => (
            <Collapsible key={h.key} open={openDiag === h.key} onOpenChange={(o) => setOpenDiag(o ? h.key : null)}>
              <Card className="border-border/50 bg-card/40 backdrop-blur transition-colors hover:border-trading-gold/25">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="text-left">
                      <p className="text-xs font-semibold">{h.label}</p>
                      <p className="font-mono text-lg">{h.score}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${LIGHT_DOT[h.light]}`} />
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openDiag === h.key ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-1.5 px-4 pb-4 pt-0">
                    {h.diagnostics.map((d, i) => (
                      <p key={i} className="rounded-md border border-border/40 bg-muted/15 px-2.5 py-1.5 text-[11px] text-muted-foreground">{d}</p>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </section>

      <Card className="border-primary/25 bg-card/40 backdrop-blur">
        <CardContent className="flex flex-wrap items-center gap-1.5 p-5">
          <span className="mr-2 text-[11px] text-muted-foreground">{LAYER_VERSION}</span>
          {INSTITUTIONAL_BADGES.map((b) => (
            <Badge key={b} variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">{b}</Badge>
          ))}
          <Button size="sm" variant="ghost" className="h-6 gap-1 text-[11px]" onClick={() => navigate('/knowledge-graph')}>
            Open Knowledge Graph <ExternalLink className="h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
