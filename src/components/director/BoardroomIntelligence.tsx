/**
 * Portfolio AI Director™ v3.5 — Boardroom Intelligence modules.
 * Sections: Executive Heat Map, Confidence History, Board Voting,
 * Research Knowledge Graph, Long Term Memory, Executive Watchlist,
 * Executive Report Export, Director Conclusion.
 *
 * Observation / research / simulation only. No trading, execution,
 * allocation or automatic promotion.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Grid3X3, LineChart as LineChartIcon, Vote, Network, Archive, Eye,
  FileDown, Crown, CheckCircle2, AlertTriangle, Clock, XCircle, Lock,
  TrendingUp, TrendingDown, Minus, ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { BoardroomMetrics } from './ExecutiveBoardroom';

/* ================= SECTION 3 — EXECUTIVE HEAT MAP ================= */

type HeatCol = 'PnL' | 'PF' | 'Capture' | 'Risk' | 'Diversification' | 'Readiness';

interface HeatRow {
  name: string;
  href: string;
  scores: Record<HeatCol, number>;
  notes: Record<HeatCol, string>;
}

const HEAT_COLS: HeatCol[] = ['PnL', 'PF', 'Capture', 'Risk', 'Diversification', 'Readiness'];

const HEAT_ROWS: HeatRow[] = [
  {
    name: 'Trend Rider', href: '/specialist-championship',
    scores: { PnL: 92, PF: 90, Capture: 74, Risk: 71, Diversification: 58, Readiness: 95 },
    notes: {
      PnL: '90-day simulated PnL +$4,820 — largest single contributor to the book.',
      PF: 'Profit factor 1.94, best-in-roster and comfortably above the 1.50 specialist bar.',
      Capture: 'Captures 63% of qualifying directional moves; entry delay averages 2 candles.',
      Risk: 'Max drawdown 3.6% — inside ceiling but the heaviest single-sleeve drawdown.',
      Diversification: 'Overlaps with Momentum Scalper v2 in Bull Trend; drives the 42% concentration flag.',
      Readiness: 'Gold Belt holder, Elo 1742, 47 sessions defended. Fully certified.',
    },
  },
  {
    name: 'Momentum Scalp', href: '/momentum-scalper-v2',
    scores: { PnL: 78, PF: 74, Capture: 82, Risk: 66, Diversification: 54, Readiness: 84 },
    notes: {
      PnL: 'Realised +$3,128 while regime-active; avoided -$1,052 of v1 chop bleed while gated off.',
      PF: '90-day PF 1.56 after the regime gate (1.21 pre-gate). Above bar, below roster median.',
      Capture: 'Highest capture of fast expansion moves at 71% on a 15m timeframe.',
      Risk: 'Max drawdown 3.1%; tight stops but frequency raises path risk in false breakouts.',
      Diversification: 'Shares Bull-Trend and High-Vol exposure with Trend Rider and VCB.',
      Readiness: 'Specialist Approved — activation precision 81.6%, accuracy 84.4%.',
    },
  },
  {
    name: 'VCB', href: '/vcb-v1',
    scores: { PnL: 88, PF: 84, Capture: 90, Risk: 80, Diversification: 76, Readiness: 91 },
    notes: {
      PnL: '90-day aggregate +$10,070 across BTC/ETH/SOL/XRP; SOL strongest at +$3,108.',
      PF: 'Aggregate PF 1.64, rising to 2.08 in High Volatility.',
      Capture: 'Best-in-roster 67% capture with the lowest entry delay (1 candle).',
      Risk: 'Drawdown 3.4% with a 1-ATR stop and 1.5R trail — well-controlled path.',
      Diversification: 'Profitable in all five regimes; genuine cross-regime contributor.',
      Readiness: 'Specialist Approved; 74.5% of edge concentrated in the top two regimes.',
    },
  },
  {
    name: 'Mean Reversion', href: '/allocation-lab',
    scores: { PnL: 62, PF: 60, Capture: 55, Risk: 84, Diversification: 88, Readiness: 76 },
    notes: {
      PnL: 'Moderate standalone PnL — value is behavioural offset, not headline return.',
      PF: 'PF drifted to 1.52 and is flagged Warning by the Forward Validation health monitor.',
      Capture: 'Low capture by design; only trades range extremes with confirmation.',
      Risk: 'Lowest drawdown profile in the roster; small size, fast exits.',
      Diversification: 'Sideways / Low-Vol champion — the strongest counterweight to trend sleeves.',
      Readiness: 'Certified but on watch pending PF recovery above 1.60.',
    },
  },
  {
    name: 'Low Vol', href: '/low-vol-coiler-v2',
    scores: { PnL: 58, PF: 82, Capture: 64, Risk: 88, Diversification: 92, Readiness: 70 },
    notes: {
      PnL: 'Smallest absolute PnL — staged at 0% weight, so contribution is projected only.',
      PF: 'PF 1.74 after v2 tuning (1.66 in v1); Low-Vol native PF reaches 2.41.',
      Capture: 'Aggregate capture 64% post-tuning (BTC 66%, XRP 62%, SOL 61%).',
      Risk: 'Drawdown below 4.0% and the least correlated path in the roster.',
      Diversification: 'Closes the 41% Low-Volatility coverage gap — highest marginal diversification.',
      Readiness: 'Approved but unfunded; awaits ATR% < 0.35 activation trigger.',
    },
  },
];

function heatTone(v: number) {
  if (v >= 80) return { bg: 'hsl(var(--trading-profit) / 0.22)', fg: 'text-trading-profit', label: 'Green' };
  if (v >= 65) return { bg: 'hsl(var(--trading-warning) / 0.20)', fg: 'text-trading-warning', label: 'Yellow' };
  return { bg: 'hsl(var(--trading-loss) / 0.20)', fg: 'text-trading-loss', label: 'Red' };
}

function ExecutiveHeatMap() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Grid3X3 className="h-4 w-4 text-trading-gold" /> Executive Heat Map
        </CardTitle>
        <CardDescription className="text-xs">
          Every specialist scored 0–100 on six board dimensions. Hover any cell for the reasoning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="p-2 text-left">Specialist</th>
                  {HEAT_COLS.map((c) => <th key={c} className="p-2 text-center">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {HEAT_ROWS.map((r, i) => (
                  <tr key={r.name} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="whitespace-nowrap p-2 font-medium">
                      <Link to={r.href} className="hover:text-trading-gold hover:underline">{r.name}</Link>
                    </td>
                    {HEAT_COLS.map((c) => {
                      const v = r.scores[c];
                      const t = heatTone(v);
                      return (
                        <td key={c} className="p-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="cursor-default rounded-md border border-border/40 px-2 py-3 text-center transition-transform duration-200 hover:scale-[1.04]"
                                style={{ background: t.bg }}
                              >
                                <div className={cn('font-mono text-sm font-semibold', t.fg)}>{v}</div>
                                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[280px] text-xs">
                              <div className="font-medium">{r.name} · {c} — {v}/100</div>
                              <div className="mt-1 text-muted-foreground">{r.notes[c]}</div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded" style={{ background: 'hsl(var(--trading-profit) / 0.5)' }} /> Green ≥ 80</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded" style={{ background: 'hsl(var(--trading-warning) / 0.5)' }} /> Yellow 65–79</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded" style={{ background: 'hsl(var(--trading-loss) / 0.5)' }} /> Red &lt; 65</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 4 — CONFIDENCE HISTORY ================= */

const SERIES = [
  { key: 'confidence', label: 'Portfolio Confidence', color: 'hsl(var(--trading-gold))' },
  { key: 'architecture', label: 'Architecture Score', color: 'hsl(var(--primary))' },
  { key: 'health', label: 'Health Score', color: 'hsl(var(--trading-profit))' },
  { key: 'promotion', label: 'Promotion Probability', color: 'hsl(var(--trading-warning))' },
] as const;

const RANGES = [
  { key: '7', label: '7 Days', days: 7 },
  { key: '30', label: '30 Days', days: 30 },
  { key: '90', label: '90 Days', days: 90 },
  { key: 'trial', label: 'Entire Trial', days: 120 },
];

function buildConfidenceHistory(days: number) {
  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = (days - i) / days;
    const d = new Date(Date.now() - i * 86400000);
    rows.push({
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      confidence: Math.round(52 + 19 * t + Math.sin(i / 6) * 3),
      architecture: Math.round(68 + 21 * t + Math.cos(i / 9) * 1.6),
      health: Math.round(74 + 14 * t + Math.sin(i / 5) * 2.2),
      promotion: Math.round(24 + 34 * t + Math.cos(i / 7) * 3.4),
    });
  }
  return rows;
}

function ConfidenceHistory() {
  const [range, setRange] = useState('30');
  const [hidden, setHidden] = useState<string[]>([]);
  const days = RANGES.find((r) => r.key === range)?.days ?? 30;
  const data = useMemo(() => buildConfidenceHistory(days), [days]);
  const toggle = (k: string) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChartIcon className="h-4 w-4 text-trading-gold" /> Confidence History
            </CardTitle>
            <CardDescription className="text-xs">
              Simulated evolution of the four board confidence measures. Click the legend to isolate a line.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <Button key={r.key} size="sm" variant={range === r.key ? 'default' : 'outline'}
                className="h-7 text-[11px]" onClick={() => setRange(r.key)}>
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2">
          {SERIES.map((s) => {
            const off = hidden.includes(s.key);
            return (
              <button key={s.key} onClick={() => toggle(s.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition-all duration-200',
                  off ? 'border-border/40 text-muted-foreground opacity-50' : 'border-border/70 hover:border-trading-gold/50',
                )}>
                <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" minTickGap={24} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <RTooltip contentStyle={{
                background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
                borderRadius: 8, fontSize: 11,
              }} />
              {SERIES.filter((s) => !hidden.includes(s.key)).map((s) => (
                <Line key={s.key} type="monotone" dataKey={s.key} name={s.label}
                  stroke={s.color} strokeWidth={2} dot={false} isAnimationActive />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 5 — BOARD VOTING SYSTEM ================= */

type VoteKind = 'Approve' | 'Observe' | 'Delay' | 'Reject';

const VOTES: { member: string; role: string; vote: VoteKind; confidence: number; evidence: string; reason: string }[] = [
  {
    member: 'AI Director', role: 'Chief Investment Officer (simulated)', vote: 'Observe', confidence: 78,
    evidence: 'Composite health 88/100 · PF 2.11 · drawdown 2.8% vs 3.0% ceiling',
    reason: 'The book is structurally sound and the challenger leads six of eight head-to-head metrics, but nothing in the evidence requires a production change today. Holding the current allocation is the highest-expectancy action.',
  },
  {
    member: 'Risk Officer', role: 'Risk & Guardrails', vote: 'Delay', confidence: 71,
    evidence: 'Bull concentration 42% for 19 days vs 35% tolerance · 42% of trial lead from one regime',
    reason: 'Concentration remains outside tolerance and the measured edge is not regime-diversified. I would delay any promotion discussion until concentration prints below 35% for five consecutive sessions.',
  },
  {
    member: 'Research Director', role: 'Discovery & Validation', vote: 'Approve', confidence: 84,
    evidence: 'Five specialists certified · 89% average regime coverage · readiness 94',
    reason: 'The research case is complete: every specialist carries validation, robustness and capture audits, and Low-Vol Coiler v2 closed the last coverage gap. From a research-quality standpoint the work is approvable.',
  },
  {
    member: 'Portfolio Manager', role: 'Allocation & Construction', vote: 'Observe', confidence: 74,
    evidence: 'Capital efficiency 0.73 vs 0.75 target · Low-Vol sleeve staged at 0% weight',
    reason: 'Construction is nearly there. Efficiency has improved every week since Portfolio Version 5, and activating the Low-Vol sleeve should close the remaining gap — but I want the activation trigger to fire naturally, not by override.',
  },
  {
    member: 'Governance Officer', role: 'Promotion Gates & Compliance', vote: 'Delay', confidence: 92,
    evidence: 'Trial day 24 of 60 · 31 of 50 trades · 6 of 9 gates passing',
    reason: 'Promotion is mechanically locked. Time and trade minimums are unmet, so no vote to approve can be actioned regardless of performance. My recommendation is procedural: delay until the gates mature.',
  },
];

function voteStyle(v: VoteKind) {
  switch (v) {
    case 'Approve': return { cls: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit', Icon: CheckCircle2 };
    case 'Observe': return { cls: 'border-primary/40 bg-primary/10 text-primary', Icon: Eye };
    case 'Delay': return { cls: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning', Icon: Clock };
    default: return { cls: 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss', Icon: XCircle };
  }
}

function BoardVoting() {
  const tally = VOTES.reduce<Record<string, number>>((a, v) => ({ ...a, [v.vote]: (a[v.vote] ?? 0) + 1 }), {});
  const avgConfidence = Math.round(VOTES.reduce((s, v) => s + v.confidence, 0) / VOTES.length);

  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Vote className="h-4 w-4 text-trading-gold" /> Board Voting System
        </CardTitle>
        <CardDescription className="text-xs">
          Five simulated board members cast an advisory recommendation. No vote triggers any action.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {VOTES.map((v, i) => {
          const s = voteStyle(v.vote);
          return (
            <div key={v.member}
              className="animate-fade-in rounded-xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-trading-gold/40"
              style={{ animationDelay: `${i * 45}ms` }}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{v.member}</p>
                <span className="text-[10px] text-muted-foreground">{v.role}</span>
                <Badge variant="outline" className={cn('ml-auto text-[10px]', s.cls)}>
                  <s.Icon className="mr-1 h-3 w-3" /> {v.vote}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={v.confidence} className="h-1.5 flex-1" />
                <span className="text-[10px] tabular-nums text-muted-foreground">{v.confidence}% confidence</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="uppercase tracking-wider">Evidence · </span>{v.evidence}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-foreground/85">{v.reason}</p>
            </div>
          );
        })}

        <div className="rounded-xl border border-trading-gold/40 bg-trading-gold/5 p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Overall Board Decision</p>
          <p className="mt-1 text-2xl font-bold text-trading-gold">Continue Observation — Promotion Delayed</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tally: {Object.entries(tally).map(([k, n]) => `${n} ${k}`).join(' · ')} — no majority to approve.
            Mean board confidence {avgConfidence}%.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="border-trading-warning/40 text-[10px] text-trading-warning">Governance blocks promotion</Badge>
            <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">
              <Lock className="mr-1 h-3 w-3" /> Advisory only
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 6 — RESEARCH KNOWLEDGE GRAPH ================= */

interface GNode { id: string; label: string; href: string; x: number; y: number; group: string; note: string }

const NODES: GNode[] = [
  { id: 'disc', label: 'Discovery', href: '/specialist-discovery-v2', x: 12, y: 20, group: 'research', note: 'Coverage gap scanning and idea generation — source of Specialist #5.' },
  { id: 'valid', label: 'Validation', href: '/forward-validation', x: 12, y: 62, group: 'research', note: 'Multi-asset, multi-window validation packs and degradation detection.' },
  { id: 'spec', label: 'Specialists', href: '/specialist-approval-board', x: 38, y: 14, group: 'core', note: 'Five certified specialists: TR, MS v2, VCB, MR, Low-Vol Coiler v2.' },
  { id: 'arch', label: 'Architecture', href: '/portfolio-architecture-review', x: 38, y: 50, group: 'core', note: 'Five-layer stack — detection, selection, allocation, execution, risk.' },
  { id: 'alloc', label: 'Allocation', href: '/allocation-lab-v2', x: 62, y: 24, group: 'core', note: 'Confidence Weighted Allocation, current research champion.' },
  { id: 'champ', label: 'Champion', href: '/champion-trial', x: 62, y: 66, group: 'core', note: 'Champion Forward Trial — day 24 of 60, 31 of 50 trades.' },
  { id: 'obs', label: 'Observation', href: '/observation-center', x: 86, y: 18, group: 'gov', note: 'Long-term monitoring of champion and architecture health.' },
  { id: 'gov', label: 'Governance', href: '/governance', x: 86, y: 48, group: 'gov', note: 'Guardrails, autonomy levels and breach records — zero breaches.' },
  { id: 'promo', label: 'Promotion', href: '/allocation-production-path', x: 86, y: 78, group: 'gov', note: 'Five-stage promotion ladder — 6 of 9 gates passing.' },
];

const EDGES: [string, string][] = [
  ['disc', 'spec'], ['valid', 'spec'], ['valid', 'arch'], ['spec', 'arch'],
  ['spec', 'alloc'], ['arch', 'alloc'], ['arch', 'champ'], ['alloc', 'champ'],
  ['alloc', 'obs'], ['champ', 'gov'], ['champ', 'promo'], ['gov', 'promo'], ['obs', 'gov'],
];

function KnowledgeGraph() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const byId = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, n])), []);
  const activeNode = active ? byId[active] : null;

  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4 text-trading-gold" /> Research Knowledge Graph
        </CardTitle>
        <CardDescription className="text-xs">
          How the programme connects. Hover a node for context, click to open the underlying research page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-background/40">
          <svg viewBox="0 0 100 92" className="h-[360px] w-full" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="kg-edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
                <stop offset="50%" stopColor="hsl(var(--trading-gold))" stopOpacity="0.75" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {EDGES.map(([a, b], i) => {
              const A = byId[a]; const B = byId[b];
              const on = active === a || active === b;
              return (
                <line key={`${a}-${b}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke="url(#kg-edge)" strokeWidth={on ? 0.7 : 0.35}
                  strokeDasharray="2 2" opacity={active && !on ? 0.2 : 1}>
                  <animate attributeName="stroke-dashoffset" from="8" to="0"
                    dur={`${2 + (i % 4) * 0.4}s`} repeatCount="indefinite" />
                </line>
              );
            })}
            {NODES.map((n) => {
              const on = active === n.id;
              const fill = n.group === 'core' ? 'hsl(var(--trading-gold))'
                : n.group === 'research' ? 'hsl(var(--primary))' : 'hsl(var(--trading-profit))';
              return (
                <g key={n.id} className="cursor-pointer"
                  onMouseEnter={() => setActive(n.id)} onMouseLeave={() => setActive(null)}
                  onClick={() => navigate(n.href)}>
                  <circle cx={n.x} cy={n.y} r={on ? 5.4 : 4} fill={fill} opacity={0.2}>
                    <animate attributeName="r" values="4;5.2;4" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={n.x} cy={n.y} r={2.2} fill={fill} />
                  <text x={n.x} y={n.y + 8} textAnchor="middle" fontSize="2.8"
                    fill="hsl(var(--foreground))" opacity={active && !on ? 0.4 : 0.9}>{n.label}</text>
                </g>
              );
            })}
          </svg>
          <div className="border-t border-border/50 bg-card/60 p-3 text-[11px]">
            {activeNode ? (
              <span><b className="text-trading-gold">{activeNode.label}</b> — {activeNode.note} <span className="text-muted-foreground">Click to open.</span></span>
            ) : (
              <span className="text-muted-foreground">Nine nodes across research, core architecture and governance. Connections animate continuously.</span>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {NODES.map((n) => (
            <Link key={n.id} to={n.href}
              className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-1 text-[10px] transition-colors hover:border-trading-gold/50 hover:text-trading-gold">
              {n.label} <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 7 — LONG TERM MEMORY ================= */

const MILESTONES = [
  { month: 'July 2026', items: [
    { d: '28 Jul', s: 'Portfolio Health exceeded 85 — composite rose 86 → 88 as correlation eased.', tone: 'good' },
    { d: '24 Jul', s: 'Coverage gap reduced to 9% after Low-Vol Coiler v2 approval at 64% capture.', tone: 'good' },
    { d: '21 Jul', s: 'Architecture reached Mature — composite 89, layers 1, 4 and 5 certified.', tone: 'good' },
    { d: '18 Jul', s: 'Specialist roster completed — five strategies certified at readiness 94.', tone: 'good' },
    { d: '12 Jul', s: 'Champion Forward Trial opened, minimum 60 days / 50 trades.', tone: 'info' },
    { d: '09 Jul', s: 'Bull concentration remained elevated for 18 consecutive days above 35%.', tone: 'warn' },
    { d: '02 Jul', s: 'Champion changed — Confidence Weighted Allocation took research champion status.', tone: 'good' },
  ] },
  { month: 'June 2026', items: [
    { d: '26 Jun', s: 'Champion defended title across 47 sessions — Trend Rider v1 holds the Gold Belt.', tone: 'good' },
    { d: '19 Jun', s: 'VCB v1 approved as the only specialist profitable in all five regimes.', tone: 'good' },
    { d: '11 Jun', s: 'Momentum Scalper v2 regime gate lifted 90-day PF from 1.21 to 1.56.', tone: 'good' },
    { d: '04 Jun', s: 'Capital efficiency began a five-week improvement run from 0.64.', tone: 'info' },
  ] },
  { month: 'May 2026', items: [
    { d: '22 May', s: 'Router v2.1 forked at −10% entry thresholds following the Trade Frequency Audit.', tone: 'info' },
    { d: '14 May', s: 'Momentum Scalper v1 archived as standalone; converted to regime specialist.', tone: 'warn' },
    { d: '03 May', s: 'Portfolio Version 5 published — first specialist-centric architecture.', tone: 'good' },
  ] },
];

function LongTermMemory() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Archive className="h-4 w-4 text-trading-gold" /> Long Term Memory
        </CardTitle>
        <CardDescription className="text-xs">Institutional milestones retained by the Director, grouped by month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {MILESTONES.map((g, gi) => (
          <div key={g.month}>
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-trading-gold">{g.month}</p>
            <div className="relative space-y-2 pl-5">
              <div className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-gradient-to-b from-trading-gold/60 via-primary/30 to-transparent" />
              {g.items.map((it, i) => (
                <div key={it.s} className="animate-fade-in relative rounded-lg border border-border/40 bg-card/40 p-3 transition-colors hover:border-trading-gold/40"
                  style={{ animationDelay: `${(gi * 6 + i) * 25}ms` }}>
                  <span className={cn(
                    'absolute -left-[17px] top-4 h-2 w-2 rounded-full',
                    it.tone === 'good' && 'bg-trading-profit',
                    it.tone === 'warn' && 'bg-trading-warning',
                    it.tone === 'info' && 'bg-primary',
                  )} />
                  <div className="flex items-start gap-3">
                    <p className="flex-1 text-[11px] leading-relaxed">{it.s}</p>
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{it.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 8 — EXECUTIVE WATCHLIST ================= */

const WATCHLIST = [
  { rank: 1, item: 'Bull concentration', priority: 'Critical', confidence: 91, trend: 'flat', review: '05 Aug 2026',
    note: 'Held at 42% for 19 days against a 35% tolerance; blocks two promotion gates.' },
  { rank: 2, item: 'Promotion gate', priority: 'High', confidence: 88, trend: 'up', review: '10 Sep 2026',
    note: 'Trial day 24 of 60 and 31 of 50 trades. Earliest mechanical promotion 06 Sep 2026.' },
  { rank: 3, item: 'Capital efficiency', priority: 'High', confidence: 76, trend: 'up', review: '07 Aug 2026',
    note: 'Improved 0.71 → 0.73 but still below the 0.75 board target; only Warning-status metric.' },
  { rank: 4, item: 'Low Vol activation', priority: 'Medium', confidence: 72, trend: 'up', review: '14 Aug 2026',
    note: 'Low-Vol Coiler v2 approved and staged at 0% weight, awaiting ATR% < 0.35.' },
  { rank: 5, item: 'Correlation drift', priority: 'Medium', confidence: 68, trend: 'down', review: '12 Aug 2026',
    note: 'MS v2 / VCB correlation eased this week; monitor for re-tightening in high-vol clusters.' },
  { rank: 6, item: 'Diversification', priority: 'Low', confidence: 64, trend: 'up', review: '21 Aug 2026',
    note: 'Score improves ~6 points once the Low-Vol sleeve is funded; no action while staged.' },
];

function TrendIcon({ t }: { t: string }) {
  if (t === 'up') return <TrendingUp className="h-3 w-3 text-trading-profit" />;
  if (t === 'down') return <TrendingDown className="h-3 w-3 text-trading-loss" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function ExecutiveWatchlist() {
  return (
    <Card className="animate-fade-in border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-trading-gold" /> Executive Watchlist
        </CardTitle>
        <CardDescription className="text-xs">Highest-priority observations ranked by board impact.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="p-2 text-left">#</th>
                <th className="p-2 text-left">Observation</th>
                <th className="p-2 text-left">Priority</th>
                <th className="p-2 text-right">Confidence</th>
                <th className="p-2 text-center">Trend</th>
                <th className="p-2 text-right">Expected review</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((w, i) => (
                <tr key={w.item} className="animate-fade-in border-b border-border/50 transition-colors hover:bg-muted/30"
                  style={{ animationDelay: `${i * 35}ms` }}>
                  <td className="p-2 tabular-nums text-muted-foreground">{w.rank}</td>
                  <td className="p-2">
                    <p className="font-medium">{w.item}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{w.note}</p>
                  </td>
                  <td className="p-2">
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      w.priority === 'Critical' && 'border-trading-loss/40 bg-trading-loss/10 text-trading-loss',
                      w.priority === 'High' && 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning',
                      w.priority === 'Medium' && 'border-primary/40 bg-primary/10 text-primary',
                      w.priority === 'Low' && 'border-border text-muted-foreground',
                    )}>{w.priority}</Badge>
                  </td>
                  <td className="p-2 text-right tabular-nums">{w.confidence}%</td>
                  <td className="p-2"><div className="flex justify-center"><TrendIcon t={w.trend} /></div></td>
                  <td className="p-2 text-right tabular-nums text-muted-foreground">{w.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 9 — EXECUTIVE REPORT EXPORT ================= */

const REPORT_SECTIONS = [
  'Executive Summary', 'Research Summary', 'Architecture Review', 'Allocation Review',
  'Governance Review', 'Charts', 'Timeline', 'AI Conclusions',
];

async function generateReport(m: BoardroomMetrics) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  const watermark = () => {
    doc.saveGraphicsState?.();
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(56);
    doc.text('OBSERVATION ONLY', W / 2, H / 2, { align: 'center', angle: 28 });
    doc.restoreGraphicsState?.();
    doc.setTextColor(30, 30, 30);
  };

  const header = (title: string) => {
    doc.setFillColor(12, 14, 20);
    doc.rect(0, 0, W, 74, 'F');
    doc.setFillColor(198, 160, 74);
    doc.rect(0, 74, W, 3, 'F');
    doc.setTextColor(198, 160, 74);
    doc.setFontSize(9);
    doc.text('PORTFOLIO AI DIRECTOR™ v3.5 · EXECUTIVE BOARDROOM INTELLIGENCE', 40, 32);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text(title, 40, 56);
    doc.setTextColor(30, 30, 30);
    y = 108;
    watermark();
  };

  const page = (title: string) => { doc.addPage(); header(title); };

  const h2 = (t: string) => {
    if (y > H - 110) page('Continued');
    doc.setFontSize(12);
    doc.setTextColor(150, 110, 20);
    doc.text(t, 40, y); y += 8;
    doc.setDrawColor(220, 210, 190);
    doc.line(40, y, W - 40, y); y += 16;
    doc.setTextColor(40, 40, 40);
  };

  const para = (t: string) => {
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(t, W - 80) as string[];
    for (const line of lines) {
      if (y > H - 60) { page('Continued'); }
      doc.text(line, 40, y); y += 14;
    }
    y += 8;
  };

  const kv = (rows: [string, string][]) => {
    doc.setFontSize(10);
    for (const [k, v] of rows) {
      if (y > H - 60) page('Continued');
      doc.setTextColor(110, 110, 110); doc.text(k, 40, y);
      doc.setTextColor(20, 20, 20); doc.text(v, W - 40, y, { align: 'right' });
      y += 15;
    }
    y += 8;
    doc.setTextColor(40, 40, 40);
  };

  const bars = (rows: [string, number][]) => {
    doc.setFontSize(9);
    for (const [label, v] of rows) {
      if (y > H - 70) page('Charts (continued)');
      doc.setTextColor(70, 70, 70);
      doc.text(label, 40, y);
      doc.setFillColor(235, 235, 235);
      doc.rect(190, y - 8, 280, 10, 'F');
      doc.setFillColor(198, 160, 74);
      doc.rect(190, y - 8, 280 * Math.max(0, Math.min(1, v / 100)), 10, 'F');
      doc.setTextColor(20, 20, 20);
      doc.text(`${v}`, W - 40, y, { align: 'right' });
      y += 20;
    }
    y += 6;
  };

  /* Cover */
  header('Executive Board Report');
  doc.setFontSize(10); doc.setTextColor(90, 90, 90);
  doc.text(`Generated ${new Date().toLocaleString('en-GB')} · Simulated research book · Not investment advice`, 40, y); y += 26;

  h2('1. Executive Summary');
  para(`The research programme is operating a ${m.regime.toLowerCase()} regime at ${m.regimeConfidence}% detector confidence. Composite portfolio health is ${m.health}/100 with a simulated profit factor of ${m.pf.toFixed(2)}, maximum drawdown of ${m.dd.toFixed(1)}% against a 3.0% ceiling, ${m.capture.toFixed(0)}% move capture and a diversification score of ${m.diversification.toFixed(0)}. The board recommendation is Continue Observation: no production changes are recommended and promotion remains locked behind governance gates.`);
  kv([
    ['Market regime', `${m.regime} (${m.regimeConfidence}%)`],
    ['Portfolio health', `${m.health}/100`],
    ['Current champion', m.champion],
    ['Architecture status', `${m.architecture} (${m.architectureScore})`],
    ['Board confidence', `${m.confidence}%`],
    ['Governance status', m.governance],
    ['Promotion probability', `${m.promotionProbability}%`],
  ]);

  page('Research Summary');
  h2('2. Research Summary');
  para('Five specialists are certified with 89% average regime coverage and a readiness score of 94. Trend Rider v1 holds the Gold Belt at Elo 1742 with 47 sessions defended. Momentum Scalper v2 lifted its 90-day profit factor from 1.21 to 1.56 through a regime activation gate with 81.6% precision. VCB v1 is profitable across all five regimes with 67% capture. Mean Reversion v1 provides the chop and low-volatility counterweight but is on watch with profit factor 1.52. Low-Vol Coiler v2 was approved at 64% capture, closing the 41% low-volatility coverage gap, and remains staged at 0% weight.');
  h2('Specialist Heat Map (0-100)');
  bars(HEAT_ROWS.map((r) => [r.name, Math.round(HEAT_COLS.reduce((s, c) => s + r.scores[c], 0) / HEAT_COLS.length)] as [string, number]));

  page('Architecture Review');
  h2('3. Architecture Review');
  para(`The five-layer stack — regime detection, specialist selection, allocation, execution and risk — scored a composite ${m.architectureScore} and is rated ${m.architecture}. Layers 1, 4 and 5 are Mature; layers 2 and 3 are Ready. Redundancy scores 78 with no single points of failure in the high- or low-volatility regimes. The principal structural weakness remains directional concentration rather than component fragility.`);
  h2('4. Allocation Review');
  para('Confidence Weighted Allocation holds research champion status after clearing all four Allocation Lab v2 gates, posting a simulated $5,410 PnL at 2.11 profit factor against Dynamic Allocation v1. The recommended book keeps trend exposure dominant, which is the direct source of the 42% bull-regime concentration flag. Funding the staged low-volatility sleeve is the identified remedy and would add an estimated six diversification points without increasing directional risk.');

  page('Governance, Timeline and Conclusions');
  h2('5. Governance Review');
  para(`Governance status is ${m.governance}. Six of nine promotion gates are passing. The Champion Forward Trial stands at day ${m.championDays} of 60 with 31 of the required 50 trades, so promotion is mechanically locked regardless of measured performance. Zero guardrail breaches have been recorded during the trial and every allocation change to date originated from research rather than performance chasing.`);
  h2('6. Charts — Confidence Measures');
  bars([
    ['Portfolio confidence', m.confidence],
    ['Architecture score', m.architectureScore],
    ['Health score', m.health],
    ['Promotion probability', m.promotionProbability],
  ]);
  h2('7. Timeline');
  for (const g of MILESTONES) {
    if (y > H - 110) page('Timeline (continued)');
    doc.setFontSize(10); doc.setTextColor(150, 110, 20);
    doc.text(g.month, 40, y); y += 14; doc.setTextColor(40, 40, 40);
    for (const it of g.items) {
      if (y > H - 60) page('Timeline (continued)');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(`${it.d} — ${it.s}`, W - 100) as string[];
      for (const l of lines) { doc.text(l, 56, y); y += 12; }
    }
    y += 8;
  }

  page('AI Conclusions');
  h2('8. AI Conclusions');
  para('The research programme remains structurally healthy. Architecture maturity continues to improve, specialist coverage is complete and no governance breaches have been detected. The current recommendation remains Continue Observation while promotion gates continue to mature.');
  kv([
    ['Overall research grade', 'AAA'],
    ['Portfolio health', `${m.health}`],
    ['Architecture', m.architecture],
    ['Confidence', `${m.confidence}`],
    ['Promotion probability', `${m.promotionProbability}%`],
    ['Overall status', 'Institutional Research Ready'],
  ]);
  para('This document is a simulated research record produced by Portfolio AI Director™. It performs no live trading, modifies no strategy, changes no allocation and bypasses no governance. Figures are simulated and must not be read as investment advice.');

  doc.save(`portfolio-ai-director-board-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function ReportExport({ m }: { m: BoardroomMetrics }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await generateReport(m);
      toast({ title: 'Executive board report generated', description: 'Simulated research record — observation watermark applied.' });
    } catch {
      toast({ title: 'Report generation failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="animate-fade-in overflow-hidden border-trading-gold/40 bg-gradient-to-br from-card via-card to-primary/5">
      <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/20" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileDown className="h-4 w-4 text-trading-gold" /> Executive Report Export
        </CardTitle>
        <CardDescription className="text-xs">
          Generates a multi-page board PDF with an observation watermark. Nothing is transmitted or executed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_SECTIONS.map((s, i) => (
            <div key={s} className="animate-fade-in flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 p-2.5"
              style={{ animationDelay: `${i * 25}ms` }}>
              <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit" />
              <span className="text-[11px]">{s}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={busy} className="bg-trading-gold text-background hover:bg-trading-gold/90">
            <FileDown className="mr-2 h-4 w-4" /> {busy ? 'Generating…' : 'Generate board report (PDF)'}
          </Button>
          <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">
            <Lock className="mr-1 h-3 w-3" /> Observation watermark
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= SECTION 10 — DIRECTOR CONCLUSION ================= */

function DirectorConclusion({ m }: { m: BoardroomMetrics }) {
  const tiles: [string, string, string][] = [
    ['Overall Research Grade', 'AAA', 'text-trading-gold'],
    ['Portfolio Health', `${m.health}`, 'text-trading-profit'],
    ['Architecture', m.architecture, 'text-trading-profit'],
    ['Confidence', `${m.confidence}`, 'text-primary'],
    ['Promotion Probability', `${m.promotionProbability}%`, 'text-trading-warning'],
  ];
  return (
    <Card className="animate-fade-in overflow-hidden border-trading-gold/50 bg-gradient-to-br from-background via-card to-trading-gold/10">
      <div className="h-1 w-full bg-gradient-to-r from-trading-gold via-primary to-trading-gold/20" />
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Crown className="h-4 w-4 text-trading-gold" /> Director Conclusion
        </CardTitle>
        <CardDescription className="text-xs">Closing statement of the v3.5 boardroom review. Observation record only.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-[13px] leading-relaxed text-foreground/85">
          The research programme remains structurally healthy. Architecture maturity continues to improve, specialist coverage
          is complete across all five regimes and no governance breaches have been detected. Bull-trend concentration at 42%
          and capital efficiency at 0.73 are the two open items, both trending in the right direction and neither breaching a
          guardrail. The current recommendation remains <b className="text-trading-gold">Continue Observation</b> while
          promotion gates continue to mature.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {tiles.map(([k, v, tone], i) => (
            <div key={k} className="animate-fade-in rounded-xl border border-border/50 bg-background/40 p-4 text-center"
              style={{ animationDelay: `${i * 40}ms` }}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p>
              <p className={cn('mt-1 text-2xl font-bold', tone)}>{v}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-trading-gold/40 bg-trading-gold/5 p-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Overall Status</p>
          <p className="mt-1 bg-gradient-to-r from-trading-gold via-foreground to-primary bg-clip-text text-3xl font-bold text-transparent">
            Institutional Research Ready
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="border-trading-profit/40 text-[10px] text-trading-profit">
              <CheckCircle2 className="mr-1 h-3 w-3" /> No governance breaches
            </Badge>
            <Badge variant="outline" className="border-trading-warning/40 text-[10px] text-trading-warning">
              <AlertTriangle className="mr-1 h-3 w-3" /> Bull concentration 42%
            </Badge>
            <Badge variant="outline" className="border-trading-gold/40 text-[10px] text-trading-gold">
              <Lock className="mr-1 h-3 w-3" /> Simulation only — no execution
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= Composite export ================= */

export default function BoardroomIntelligence({ m }: { m: BoardroomMetrics }) {
  return (
    <div className="space-y-6">
      <ExecutiveHeatMap />
      <ConfidenceHistory />
      <div className="grid gap-6 lg:grid-cols-2">
        <BoardVoting />
        <div className="space-y-6">
          <KnowledgeGraph />
          <ExecutiveWatchlist />
        </div>
      </div>
      <LongTermMemory />
      <ReportExport m={m} />
      <DirectorConclusion m={m} />
    </div>
  );
}

export {
  ExecutiveHeatMap, ConfidenceHistory, BoardVoting, KnowledgeGraph,
  LongTermMemory, ExecutiveWatchlist, ReportExport, DirectorConclusion,
};
