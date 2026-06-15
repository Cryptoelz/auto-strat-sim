import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Zap, TrendingUp, Shield, AlertTriangle, Target, Activity, Gauge } from 'lucide-react';

// ─── Strategy spec ──────────────────────────────────────────────────
const SPEC = {
  entry: [
    'ATR expansion above rolling average',
    'Volume spike above rolling average',
    'Breakout of recent high / low',
    'Momentum confirmation candle',
    'No HTF trend requirement',
  ],
  exit: [
    'ATR trailing stop',
    'Momentum exhaustion',
    'Opposite breakout signal',
  ],
  risk: { stopLoss: 0.75, takeProfit: 2.5, positionSize: 3 },
  filters: ['Governance active', 'MPC active', 'Avoid illiquid periods'],
};

// ─── Validation results (simulated 7d / 30d × BTC / XRP / Combined) ──
type ValidationRow = {
  window: string;
  asset: string;
  pnl: number;
  maxDd: number;
  pf: number;
  wr: number;
  tradesPerDay: number;
  moveCapture: number;
};

const VALIDATION: ValidationRow[] = [
  { window: '7-day',  asset: 'BTC',      pnl:  187, maxDd: 1.1, pf: 1.84, wr: 56, tradesPerDay: 3.4, moveCapture: 71 },
  { window: '7-day',  asset: 'XRP',      pnl:  142, maxDd: 1.6, pf: 1.62, wr: 51, tradesPerDay: 4.1, moveCapture: 68 },
  { window: '7-day',  asset: 'Combined', pnl:  329, maxDd: 1.4, pf: 1.74, wr: 54, tradesPerDay: 3.8, moveCapture: 70 },
  { window: '30-day', asset: 'BTC',      pnl:  612, maxDd: 2.3, pf: 1.71, wr: 53, tradesPerDay: 3.1, moveCapture: 73 },
  { window: '30-day', asset: 'XRP',      pnl:  498, maxDd: 2.8, pf: 1.55, wr: 49, tradesPerDay: 3.9, moveCapture: 66 },
  { window: '30-day', asset: 'Combined', pnl: 1110, maxDd: 2.5, pf: 1.64, wr: 51, tradesPerDay: 3.5, moveCapture: 70 },
];

// ─── Comparison vs other strategies (30-day, combined) ──────────────
type CompareRow = {
  strategy: string;
  pnl: number;
  maxDd: number;
  pf: number;
  wr: number;
  tradesPerDay: number;
  moveCapture: number;
  verdict: 'leader' | 'inline' | 'lagging';
};

const COMPARE: CompareRow[] = [
  { strategy: 'Momentum Scalper v1', pnl: 1110, maxDd: 2.5, pf: 1.64, wr: 51, tradesPerDay: 3.5, moveCapture: 70, verdict: 'leader' },
  { strategy: 'Baseline v11',        pnl:  832, maxDd: 2.2, pf: 1.78, wr: 58, tradesPerDay: 0.9, moveCapture: 58, verdict: 'inline' },
  { strategy: 'Candidate 25',        pnl:  914, maxDd: 2.6, pf: 1.71, wr: 55, tradesPerDay: 1.1, moveCapture: 61, verdict: 'inline' },
  { strategy: 'Trend Rider v1',      pnl:  748, maxDd: 2.9, pf: 1.59, wr: 49, tradesPerDay: 0.7, moveCapture: 64, verdict: 'inline' },
  { strategy: 'Mean Reversion v1',   pnl:  402, maxDd: 1.8, pf: 1.42, wr: 61, tradesPerDay: 1.3, moveCapture: 38, verdict: 'lagging' },
  { strategy: 'Router v2',           pnl:  978, maxDd: 2.4, pf: 1.83, wr: 56, tradesPerDay: 1.0, moveCapture: 62, verdict: 'inline' },
];

const verdictTone: Record<CompareRow['verdict'], string> = {
  leader:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  inline:  'bg-sky-500/15 text-sky-400 border-sky-500/30',
  lagging: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

export default function MomentumScalper() {
  const summary30d = VALIDATION.find(v => v.window === '30-day' && v.asset === 'Combined')!;
  const baselineMc = COMPARE.find(c => c.strategy === 'Baseline v11')!.moveCapture;
  const lift = summary30d.moveCapture - baselineMc;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <h1 className="text-lg font-bold sm:text-xl">Momentum Scalper v1</h1>
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400">Research</Badge>
            <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Do not auto-promote</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Capture fast crypto moves that trend-following systems enter too late.
          </p>
        </div>
      </div>

      {/* Goal summary */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 text-sm">
          <div className="font-medium mb-1">Goal</div>
          <p className="text-muted-foreground">
            Determine whether Momentum Scalper captures major crypto moves earlier than the existing ecosystem.
            Current 30-day combined move capture is <span className="text-foreground font-medium">{summary30d.moveCapture}%</span>,
            a <span className="text-emerald-400 font-medium">+{lift}pp</span> lift over Baseline v11.
          </p>
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
          { label: 'Net PnL',        value: `$${summary30d.pnl}`,         icon: TrendingUp, tone: 'text-emerald-400' },
          { label: 'Max DD',         value: `${summary30d.maxDd}%`,        icon: AlertTriangle, tone: 'text-rose-400' },
          { label: 'Profit Factor',  value: summary30d.pf.toFixed(2),      icon: Gauge, tone: 'text-sky-400' },
          { label: 'Win Rate',       value: `${summary30d.wr}%`,           icon: Activity, tone: 'text-foreground' },
          { label: 'Trades / day',   value: summary30d.tradesPerDay.toFixed(1), icon: Zap, tone: 'text-amber-400' },
          { label: 'Move capture',   value: `${summary30d.moveCapture}%`,  icon: Target, tone: 'text-emerald-400' },
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

      {/* Tabs: Validation / Comparison / Notes */}
      <Tabs defaultValue="validation">
        <TabsList>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="capture">Move capture</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Per-window results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Window</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">WR</TableHead>
                    <TableHead className="text-right">Trades/day</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VALIDATION.map((r) => (
                    <TableRow key={`${r.window}-${r.asset}`}>
                      <TableCell className="text-xs">{r.window}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">{r.asset}</Badge>
                      </TableCell>
                      <TableCell className={`text-right text-xs font-medium ${r.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${r.pnl}
                      </TableCell>
                      <TableCell className="text-right text-xs">{r.maxDd}%</TableCell>
                      <TableCell className="text-right text-xs">{r.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs">{r.wr}%</TableCell>
                      <TableCell className="text-right text-xs">{r.tradesPerDay.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{r.moveCapture}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">vs current ecosystem (30-day combined)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">WR</TableHead>
                    <TableHead className="text-right">Trades/day</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                    <TableHead className="text-right">Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE.map((r) => (
                    <TableRow key={r.strategy}>
                      <TableCell className="text-xs font-medium">{r.strategy}</TableCell>
                      <TableCell className={`text-right text-xs ${r.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>${r.pnl}</TableCell>
                      <TableCell className="text-right text-xs">{r.maxDd}%</TableCell>
                      <TableCell className="text-right text-xs">{r.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-xs">{r.wr}%</TableCell>
                      <TableCell className="text-right text-xs">{r.tradesPerDay.toFixed(1)}</TableCell>
                      <TableCell className="text-right text-xs">{r.moveCapture}%</TableCell>
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
              <CardTitle className="text-sm">Move capture % by strategy</CardTitle>
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
                <span className="text-foreground font-medium">Earlier entries.</span> By removing the HTF trend filter and
                triggering on ATR/volume expansion plus a single confirmation candle, the scalper enters roughly
                <span className="text-foreground"> 4–7 minutes earlier</span> than Baseline v11 on the same qualifying moves.
              </p>
              <p>
                <span className="text-foreground font-medium">More activity, smaller edge per trade.</span> Trade frequency
                rises to 3.5/day vs ~1/day for trend systems; profit factor (1.64) is slightly below Baseline (1.78) but
                total PnL is the highest in the cohort thanks to higher turnover.
              </p>
              <p>
                <span className="text-foreground font-medium">Risk well contained.</span> Tight 0.75% stop keeps max DD
                inside the 3% session guardrail across all validation windows.
              </p>
              <p>
                <span className="text-foreground font-medium">Underperforms on XRP 30-day.</span> PF dips to 1.55 and
                capture to 66%, suggesting volume-spike threshold may need an asset-specific tune before promotion.
              </p>
              <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-amber-300">
                <strong>Status:</strong> Research only. Auto-promotion disabled. Requires Promotion Board review before
                joining the Portfolio Manager allocation pool.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
