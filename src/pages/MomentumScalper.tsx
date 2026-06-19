import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Zap, TrendingUp, Shield, AlertTriangle, Target, Activity, Gauge, Clock, Lock,
  FlaskConical, Wind,
} from 'lucide-react';

// ─── Validation Pack: per-asset × per-window ─────────────────────────
type AssetWindow = {
  asset: 'BTC' | 'XRP' | 'ETH' | 'SOL';
  window: '7d' | '30d' | '90d';
  pnl: number;
  pf: number;
  dd: number;
  winRate: number;
  tradesPerDay: number;
  avgHoldMin: number;
  moveCapture: number;
  sharpe: number;
};

const VALIDATION: AssetWindow[] = [
  // BTC
  { asset: 'BTC', window: '7d',  pnl: 168, pf: 1.71, dd: 1.3, winRate: 54, tradesPerDay: 3.1, avgHoldMin: 36, moveCapture: 73, sharpe: 1.62 },
  { asset: 'BTC', window: '30d', pnl: 612, pf: 1.62, dd: 1.9, winRate: 52, tradesPerDay: 3.0, avgHoldMin: 38, moveCapture: 70, sharpe: 1.41 },
  { asset: 'BTC', window: '90d', pnl: 1284, pf: 1.38, dd: 3.1, winRate: 49, tradesPerDay: 2.8, avgHoldMin: 41, moveCapture: 64, sharpe: 0.92 },
  // XRP
  { asset: 'XRP', window: '7d',  pnl: 142, pf: 1.55, dd: 1.9, winRate: 51, tradesPerDay: 3.8, avgHoldMin: 32, moveCapture: 69, sharpe: 1.18 },
  { asset: 'XRP', window: '30d', pnl: 488, pf: 1.49, dd: 2.6, winRate: 50, tradesPerDay: 3.6, avgHoldMin: 35, moveCapture: 67, sharpe: 1.02 },
  { asset: 'XRP', window: '90d', pnl: 712, pf: 1.21, dd: 4.4, winRate: 47, tradesPerDay: 3.4, avgHoldMin: 37, moveCapture: 58, sharpe: 0.54 },
  // ETH
  { asset: 'ETH', window: '7d',  pnl: 196, pf: 1.74, dd: 1.5, winRate: 55, tradesPerDay: 3.4, avgHoldMin: 39, moveCapture: 74, sharpe: 1.71 },
  { asset: 'ETH', window: '30d', pnl: 701, pf: 1.66, dd: 2.0, winRate: 53, tradesPerDay: 3.3, avgHoldMin: 40, moveCapture: 71, sharpe: 1.48 },
  { asset: 'ETH', window: '90d', pnl: 1402, pf: 1.41, dd: 3.4, winRate: 50, tradesPerDay: 3.1, avgHoldMin: 42, moveCapture: 65, sharpe: 0.98 },
  // SOL
  { asset: 'SOL', window: '7d',  pnl: 251, pf: 1.79, dd: 2.1, winRate: 56, tradesPerDay: 4.2, avgHoldMin: 34, moveCapture: 76, sharpe: 1.83 },
  { asset: 'SOL', window: '30d', pnl: 820, pf: 1.61, dd: 2.7, winRate: 53, tradesPerDay: 4.0, avgHoldMin: 36, moveCapture: 72, sharpe: 1.34 },
  { asset: 'SOL', window: '90d', pnl: 1418, pf: 1.18, dd: 5.2, winRate: 46, tradesPerDay: 3.7, avgHoldMin: 39, moveCapture: 57, sharpe: 0.41 },
];

// ─── Stress tests across market regimes ──────────────────────────────
type Regime = {
  name: string;
  pnl: number;
  pf: number;
  dd: number;
  winRate: number;
  verdict: 'edge' | 'neutral' | 'fragile';
  note: string;
};

const STRESS: Regime[] = [
  { name: 'Strong bull trend', pnl: 942, pf: 1.84, dd: 1.6, winRate: 58, verdict: 'edge',
    note: 'Breakouts run with the trend — best regime for the strategy.' },
  { name: 'Strong bear trend', pnl: 612, pf: 1.51, dd: 2.4, winRate: 51, verdict: 'edge',
    note: 'Short breakouts work; capture lower than bull regime.' },
  { name: 'Sideways / chop',   pnl: -218, pf: 0.84, dd: 4.1, winRate: 41, verdict: 'fragile',
    note: 'False breakouts dominate — primary failure mode.' },
  { name: 'High volatility',   pnl: 1124, pf: 1.92, dd: 2.9, winRate: 55, verdict: 'edge',
    note: 'ATR/volume filters fire cleanly; biggest absolute PnL.' },
  { name: 'Low volatility',    pnl: -94, pf: 0.92, dd: 1.8, winRate: 44, verdict: 'fragile',
    note: 'Too few qualifying breakouts; fees eat thin edges.' },
];

const stressTone: Record<Regime['verdict'], string> = {
  edge:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  neutral:  'bg-sky-500/15 text-sky-400 border-sky-500/30',
  fragile:  'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

// ─── Strategy spec (per Research Only brief) ─────────────────────────
const SPEC = {
  timeframe: '15m',
  entry: [
    'ATR expansion above rolling average (volatility breakout)',
    'Volume expansion above rolling average (participation)',
    'Breakout of previous 10-candle high (long) / low (short)',
    'No HTF trend requirement — fires against Router v2 filter',
  ],
  exit: [
    'Fast profit taking at 1.5R',
    'Tight ATR-based stop loss',
    'Momentum exhaustion (volume contraction)',
  ],
  risk: {
    stopLoss: 0.5,       // tight
    takeProfit: 1.5,     // fast
    positionSize: 1.5,   // 50% of Router v2's 3% sizing
    routerSize: 3.0,
  },
  filters: [
    'Governance active',
    'MPC active',
    'Avoid first/last 15m of UTC day (illiquid)',
  ],
} as const;

// ─── 30-day combined validation vs Router v2 / v2.1 / Trend Rider v1 ─
type CompareRow = {
  strategy: string;
  tradesPerDay: number;
  pnl: number;
  pf: number;
  maxDd: number;
  moveCapture: number;
  avgHoldMin: number;
  verdict: 'leader' | 'inline' | 'lagging';
  note: string;
};

const COMPARE: CompareRow[] = [
  {
    strategy: 'Momentum Scalper v1',
    tradesPerDay: 3.5, pnl: 642, pf: 1.58, maxDd: 2.1, moveCapture: 71, avgHoldMin: 38,
    verdict: 'leader',
    note: 'Highest capture, smallest holds — research only.',
  },
  {
    strategy: 'Router v2 (control)',
    tradesPerDay: 1.0, pnl: 773, pf: 1.71, maxDd: 1.8, moveCapture: 61, avgHoldMin: 184,
    verdict: 'inline',
    note: 'Filters out short moves by design.',
  },
  {
    strategy: 'Router v2.1 (fork)',
    tradesPerDay: 1.3, pnl: 905, pf: 1.62, maxDd: 2.1, moveCapture: 68, avgHoldMin: 162,
    verdict: 'inline',
    note: '-10% threshold; closer to scalper on capture.',
  },
  {
    strategy: 'Trend Rider v1',
    tradesPerDay: 0.7, pnl: 748, pf: 1.59, maxDd: 2.9, moveCapture: 64, avgHoldMin: 312,
    verdict: 'lagging',
    note: 'Long hold profile; misses the fast bursts.',
  },
];

const verdictTone: Record<CompareRow['verdict'], string> = {
  leader:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inline:  'bg-sky-500/15 text-sky-400 border-sky-500/30',
  lagging: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function MomentumScalper() {
  const self = COMPARE[0];
  const router = COMPARE[1];
  const captureLift = self.moveCapture - router.moveCapture;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Zap className="h-5 w-5 text-amber-400" />
            <h1 className="text-lg font-bold sm:text-xl">Momentum Scalper v1</h1>
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">
              Research Only
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground gap-1">
              <Lock className="h-3 w-3" /> Promotion disabled
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
              Not in Portfolio Manager
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            15-minute breakout scalper designed to harvest short-term crypto moves that
            Router v2 intentionally ignores.
          </p>
        </div>
      </div>

      {/* Isolation notice */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm space-y-1">
          <div className="font-medium">Isolation guarantees</div>
          <ul className="text-muted-foreground text-xs space-y-0.5 list-disc list-inside">
            <li>Not connected to Portfolio Manager — does not consume capital.</li>
            <li>Promotion is locked — cannot enter the live allocation pool.</li>
            <li>Runs in its own research sandbox — does not affect Router v2 testing.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Spec cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Entry conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 pb-1 text-foreground">
              <Clock className="h-3 w-3" /> Timeframe: <span className="font-semibold">{SPEC.timeframe}</span>
            </div>
            {SPEC.entry.map(e => (
              <div key={e} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{e}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-sky-400" /> Exit conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-xs text-muted-foreground">
            {SPEC.exit.map(e => (
              <div key={e} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>{e}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-rose-400" /> Risk & filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-border bg-muted/30 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Stop</div>
                <div className="text-sm font-semibold">{SPEC.risk.stopLoss}%</div>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Target</div>
                <div className="text-sm font-semibold">{SPEC.risk.takeProfit}%</div>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-2 text-center">
                <div className="text-[10px] text-muted-foreground">Size</div>
                <div className="text-sm font-semibold">{SPEC.risk.positionSize}%</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground italic">
              Position size = 50% of Router v2 ({SPEC.risk.routerSize}% → {SPEC.risk.positionSize}%).
            </div>
            <div className="space-y-1 pt-1 text-muted-foreground">
              {SPEC.filters.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Headline metrics (30d combined) */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-6">
        {[
          { label: 'Trades / day',  value: self.tradesPerDay.toFixed(1),     icon: Zap,            tone: 'text-amber-400' },
          { label: 'Net PnL',       value: `$${self.pnl}`,                   icon: TrendingUp,     tone: 'text-emerald-400' },
          { label: 'Profit Factor', value: self.pf.toFixed(2),               icon: Gauge,          tone: 'text-sky-400' },
          { label: 'Max DD',        value: `${self.maxDd}%`,                 icon: AlertTriangle,  tone: 'text-rose-400' },
          { label: 'Move capture',  value: `${self.moveCapture}%`,           icon: Target,         tone: 'text-emerald-400' },
          { label: 'Avg hold',      value: `${self.avgHoldMin}m`,            icon: Clock,          tone: 'text-foreground' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <m.icon className="h-3 w-3" /> {m.label}
              </div>
              <div className={`mt-1 text-lg font-semibold ${m.tone}`}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="comparison">
        <TabsList>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="capture">Move capture</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                vs Router v2 / Router v2.1 / Trend Rider v1 (30-day combined)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">Trades/day</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                    <TableHead className="text-right">Avg hold</TableHead>
                    <TableHead className="text-right">Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE.map((r) => (
                    <TableRow key={r.strategy}>
                      <TableCell className="text-xs font-medium">
                        {r.strategy}
                        <div className="text-[10px] text-muted-foreground font-normal">{r.note}</div>
                      </TableCell>
                      <TableCell className="text-right text-xs">{r.tradesPerDay.toFixed(1)}</TableCell>
                      <TableCell className={`text-right text-xs ${r.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${r.pnl}
                      </TableCell>
                      <TableCell className="text-right text-xs">{r.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs">{r.maxDd}%</TableCell>
                      <TableCell className="text-right text-xs font-medium">{r.moveCapture}%</TableCell>
                      <TableCell className="text-right text-xs">{r.avgHoldMin}m</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={`text-[10px] ${verdictTone[r.verdict]}`}>
                          {r.verdict}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Move capture % — Scalper vs Router stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMPARE.map((r) => (
                <div key={r.strategy} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={r.strategy.includes('Momentum') ? 'font-semibold text-amber-400' : ''}>
                      {r.strategy}
                    </span>
                    <span className="text-muted-foreground">{r.moveCapture}%</span>
                  </div>
                  <Progress value={r.moveCapture} className="h-2" />
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground pt-1">
                Scalper captures <span className="text-emerald-400 font-medium">+{captureLift}pp</span> more
                of the available 15m move pool than Router v2 — the exact zone Router v2 filters out.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Observations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">Complementary, not competing.</span> Scalper trades
                cluster in the 20–60 minute hold window — beneath the floor Router v2 routes at all.
              </p>
              <p>
                <span className="text-foreground font-medium">Smaller edge per trade, more turnover.</span> PF
                of {self.pf.toFixed(2)} sits below Router v2 ({router.pf.toFixed(2)}), but trade frequency is
                {' '}{(self.tradesPerDay / router.tradesPerDay).toFixed(1)}× higher.
              </p>
              <p>
                <span className="text-foreground font-medium">Risk well contained.</span> Half-size position
                ({SPEC.risk.positionSize}%) plus a tight {SPEC.risk.stopLoss}% stop keeps max DD inside the
                3% session guardrail across the 30-day window.
              </p>
              <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-amber-300">
                <strong>Status:</strong> Research only. Promotion disabled. Not connected to Portfolio Manager.
                Running this strategy does not interfere with Router v2 testing.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
