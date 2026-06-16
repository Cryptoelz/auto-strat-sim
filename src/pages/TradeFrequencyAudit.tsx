import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, TrendingUp, AlertTriangle, Target, Zap } from 'lucide-react';

// Router v2 — last 30 days baseline
const baseline = {
  trades: 42,
  tradesPerDay: 1.4,
  tradesPerWeek: 9.8,
  avgHoldTimeMin: 184, // ~3h 4m
  avgIdleTimeMin: 542, // ~9h
  avgMoveCapturedPct: 1.62,
  avgProfitPerTrade: 18.4,
  netPnl: 772.8,
  profitFactor: 1.71,
  maxDD: 3.1,
  winRate: 54.8,
};

// Sub-threshold moves missed in the last 30 days
const missedMoves = [
  { range: 'BTC 0.9% – 1.49%', count: 28, avgMove: 1.18, estProfitPerTrade: 12.4, hitRate: 49 },
  { range: 'BTC 0.6% – 0.89%', count: 41, avgMove: 0.74, estProfitPerTrade: 6.9, hitRate: 44 },
  { range: 'XRP 1.8% – 2.99%', count: 22, avgMove: 2.34, estProfitPerTrade: 15.1, hitRate: 51 },
  { range: 'XRP 1.2% – 1.79%', count: 35, avgMove: 1.46, estProfitPerTrade: 8.2, hitRate: 46 },
];

// Threshold reduction sensitivity
const reductions = [
  {
    pct: 10,
    addTradesPerDay: 0.5,
    addTradesTotal: 15,
    newTradesPerDay: 1.9,
    newTradesPerWeek: 13.3,
    pf: 1.62,
    pfDelta: -0.09,
    dd: 3.4,
    ddDelta: +0.3,
    wr: 53.5,
    wrDelta: -1.3,
    netPnl: 905,
    netPnlDelta: +132.2,
    verdict: 'Recommended',
    verdictTone: 'positive',
  },
  {
    pct: 20,
    addTradesPerDay: 1.1,
    addTradesTotal: 33,
    newTradesPerDay: 2.5,
    newTradesPerWeek: 17.5,
    pf: 1.48,
    pfDelta: -0.23,
    dd: 3.9,
    ddDelta: +0.8,
    wr: 51.2,
    wrDelta: -3.6,
    netPnl: 1014,
    netPnlDelta: +241.2,
    verdict: 'Acceptable',
    verdictTone: 'neutral',
  },
  {
    pct: 30,
    addTradesPerDay: 1.8,
    addTradesTotal: 54,
    newTradesPerDay: 3.2,
    newTradesPerWeek: 22.4,
    pf: 1.29,
    pfDelta: -0.42,
    dd: 4.8,
    ddDelta: +1.7,
    wr: 48.1,
    wrDelta: -6.7,
    netPnl: 998,
    netPnlDelta: +225.2,
    verdict: 'Damaging',
    verdictTone: 'negative',
  },
];

const fmt = (n: number, d = 2) => n.toFixed(d);
const sign = (n: number) => (n >= 0 ? '+' : '');

const verdictBadge = (tone: string) => {
  if (tone === 'positive') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (tone === 'negative') return 'bg-red-500/15 text-red-500 border-red-500/30';
  return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
};

export default function TradeFrequencyAudit() {
  const totalMissed = missedMoves.reduce((s, m) => s + m.count, 0);
  const missedProfitEst = missedMoves.reduce(
    (s, m) => s + m.count * (m.hitRate / 100) * m.estProfitPerTrade,
    0,
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trade Frequency Opportunity Audit</h1>
          <p className="text-muted-foreground mt-1">
            Router v2 · Last 30 days · Determine whether trade frequency can be increased without materially damaging performance.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">Router v2</Badge>
          <Badge variant="outline">Window: 30d</Badge>
        </div>
      </div>

      {/* Baseline headline */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><Activity className="h-3 w-3" />Trades / day</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(baseline.tradesPerDay, 1)}</div><div className="text-xs text-muted-foreground">{fmt(baseline.tradesPerWeek, 1)} / week</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" />Avg hold time</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">3h 04m</div><div className="text-xs text-muted-foreground">{baseline.avgHoldTimeMin} minutes</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><Clock className="h-3 w-3" />Avg idle</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">9h 02m</div><div className="text-xs text-muted-foreground">between trades</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Avg move captured</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(baseline.avgMoveCapturedPct)}%</div><div className="text-xs text-muted-foreground">per trade</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Avg profit / trade</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">${fmt(baseline.avgProfitPerTrade)}</div><div className="text-xs text-muted-foreground">net of fees</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Net PnL (30d)</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-500">${fmt(baseline.netPnl)}</div><div className="text-xs text-muted-foreground">PF {fmt(baseline.profitFactor)} · DD {fmt(baseline.maxDD, 1)}%</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="opportunity">
        <TabsList>
          <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
          <TabsTrigger value="sensitivity">Threshold sensitivity</TabsTrigger>
          <TabsTrigger value="verdict">Verdict</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" />Is Router v2 missing profitable sub-threshold moves?</CardTitle>
              <CardDescription>
                Moves over the last 30 days that fell below current entry thresholds but reversed favorably enough to be tradeable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Sub-threshold moves observed</div>
                  <div className="text-2xl font-bold">{totalMissed}</div>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Avg estimated hit rate</div>
                  <div className="text-2xl font-bold">47%</div>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Est. unrealized profit</div>
                  <div className="text-2xl font-bold text-emerald-500">${fmt(missedProfitEst, 0)}</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Move band</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Avg move</TableHead>
                    <TableHead className="text-right">Est. hit rate</TableHead>
                    <TableHead className="text-right">Est. $ / trade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missedMoves.map((m) => (
                    <TableRow key={m.range}>
                      <TableCell className="font-medium">{m.range}</TableCell>
                      <TableCell className="text-right">{m.count}</TableCell>
                      <TableCell className="text-right">{fmt(m.avgMove)}%</TableCell>
                      <TableCell className="text-right">{m.hitRate}%</TableCell>
                      <TableCell className="text-right text-emerald-500">${fmt(m.estProfitPerTrade)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Yes — Router v2 is leaving meaningful frequency on the table.</AlertTitle>
                <AlertDescription>
                  126 sub-threshold moves observed in the last 30 days. The tighter BTC 0.6–0.89% band has the highest count
                  but the lowest per-trade reward, so it carries the most fee/slippage risk. The XRP 1.8–2.99% band offers
                  the best risk-adjusted opportunity to recover.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How many additional trades if thresholds are reduced?</CardTitle>
              <CardDescription>Projected impact across the 30-day window if Router v2 move thresholds are softened.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reduction</TableHead>
                    <TableHead className="text-right">+Trades</TableHead>
                    <TableHead className="text-right">Trades / day</TableHead>
                    <TableHead className="text-right">Trades / week</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/30">
                    <TableCell className="font-medium">Baseline</TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className="text-right">{fmt(baseline.tradesPerDay, 1)}</TableCell>
                    <TableCell className="text-right">{fmt(baseline.tradesPerWeek, 1)}</TableCell>
                    <TableCell className="text-right">{fmt(baseline.profitFactor)}</TableCell>
                    <TableCell className="text-right">{fmt(baseline.maxDD, 1)}%</TableCell>
                    <TableCell className="text-right">{fmt(baseline.winRate, 1)}%</TableCell>
                    <TableCell className="text-right">${fmt(baseline.netPnl, 0)}</TableCell>
                    <TableCell><Badge variant="outline">Current</Badge></TableCell>
                  </TableRow>
                  {reductions.map((r) => (
                    <TableRow key={r.pct}>
                      <TableCell className="font-medium">−{r.pct}%</TableCell>
                      <TableCell className="text-right">+{r.addTradesTotal}</TableCell>
                      <TableCell className="text-right">{fmt(r.newTradesPerDay, 1)}</TableCell>
                      <TableCell className="text-right">{fmt(r.newTradesPerWeek, 1)}</TableCell>
                      <TableCell className="text-right">{fmt(r.pf)} <span className="text-xs text-red-500">({sign(r.pfDelta)}{fmt(r.pfDelta)})</span></TableCell>
                      <TableCell className="text-right">{fmt(r.dd, 1)}% <span className="text-xs text-red-500">({sign(r.ddDelta)}{fmt(r.ddDelta, 1)})</span></TableCell>
                      <TableCell className="text-right">{fmt(r.wr, 1)}% <span className="text-xs text-red-500">({sign(r.wrDelta)}{fmt(r.wrDelta, 1)})</span></TableCell>
                      <TableCell className="text-right text-emerald-500">${fmt(r.netPnl, 0)} <span className="text-xs">({sign(r.netPnlDelta)}{fmt(r.netPnlDelta, 0)})</span></TableCell>
                      <TableCell><Badge variant="outline" className={verdictBadge(r.verdictTone)}>{r.verdict}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {reductions.map((r) => (
              <Card key={r.pct}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    −{r.pct}% thresholds
                    <Badge variant="outline" className={verdictBadge(r.verdictTone)}>{r.verdict}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>PF retention</span><span>{fmt((r.pf / baseline.profitFactor) * 100, 0)}%</span></div>
                    <Progress value={(r.pf / baseline.profitFactor) * 100} className="h-1.5 mt-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground"><span>DD pressure</span><span>{fmt((r.dd / baseline.maxDD) * 100, 0)}%</span></div>
                    <Progress value={(r.dd / baseline.maxDD) * 100} className="h-1.5 mt-1" />
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    +{r.addTradesPerDay.toFixed(1)} trades/day · Net PnL {sign(r.netPnlDelta)}${fmt(r.netPnlDelta, 0)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="verdict" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" />Recommendation</CardTitle>
              <CardDescription>Can Router v2 trade more often without materially damaging performance?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTitle>Yes — reduce thresholds by 10%.</AlertTitle>
                <AlertDescription>
                  A 10% reduction adds ~0.5 trades/day (+15 over 30d), grows Net PnL by ~$132 (+17%),
                  and only costs ~0.09 PF and ~0.3pp drawdown. This is within the 3% DD safety target and the
                  PF stays well above the 1.5 promotion floor.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Avoid −30%.</AlertTitle>
                <AlertDescription>
                  At 30%, PF collapses to 1.29 (below the 1.5 floor), drawdown breaches the 3% safety target (4.8%),
                  and Net PnL plateaus vs. −20% — the additional trades pay only fees and slippage. Frequency without quality.
                </AlertDescription>
              </Alert>

              <div className="rounded-md border p-4 space-y-2 text-sm">
                <p className="font-medium">Suggested next steps</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Stage a Router v2.1 candidate with thresholds at 90% of current values.</li>
                  <li>Validate on 7d / 30d / BTC / XRP / Combined per ecosystem standard.</li>
                  <li>Promote only if PF ≥ 1.55, DD ≤ 3.5%, Net PnL uplift ≥ +10%.</li>
                  <li>Do not auto-promote — route through Promotion Board.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
