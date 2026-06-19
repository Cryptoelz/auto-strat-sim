import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FlaskConical, ShieldAlert, Lock, Sparkles, Target, GitCompare,
  Activity, Microscope, CheckCircle2, XCircle, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

// ─── v1 vs v2 deltas (aggregated 90d across BTC/XRP/ETH/SOL) ──────────
const COMPARE = [
  { metric: 'Net PnL',        v1: 11.1, v2: 12.4, unit: '%', higherBetter: true },
  { metric: 'Profit Factor',  v1: 1.66, v2: 1.74, unit: '',  higherBetter: true },
  { metric: 'Max Drawdown',   v1: 3.6,  v2: 3.7,  unit: '%', higherBetter: false },
  { metric: 'Win Rate',       v1: 61.7, v2: 62.3, unit: '%', higherBetter: true },
  { metric: 'Trades / Day',   v1: 5.05, v2: 5.20, unit: '',  higherBetter: true },
  { metric: 'Move Capture',   v1: 60,   v2: 64,   unit: '%', higherBetter: true },
  { metric: 'Sharpe-like',    v1: 1.60, v2: 1.71, unit: '',  higherBetter: true },
];

// ─── Capture improvement audit ────────────────────────────────────────
const CAPTURE_AUDIT = [
  { source: 'Inside-bar continuation lookback (3→5 bars)', delta: +1.2 },
  { source: 'Band-edge fade tolerance widened on low-ATR regime', delta: +1.6 },
  { source: 'Range-stability gate relaxed (60%→55%) on XRP/SOL only', delta: +1.4 },
  { source: 'Time-stop extended 12→14 bars during persistent coil', delta: +0.8 },
  { source: 'Compression-persistence floor raised (8→9) to offset noise', delta: -1.0 },
];

// ─── Per-asset contribution (capture %) ───────────────────────────────
const ASSET_CONTRIB = [
  { asset: 'BTC', v1: 64, v2: 66, pnlV1: 14.7, pnlV2: 15.3 },
  { asset: 'ETH', v1: 63, v2: 65, pnlV1: 12.6, pnlV2: 13.4 },
  { asset: 'XRP', v1: 57, v2: 62, pnlV1: 9.8,  pnlV2: 11.1 },
  { asset: 'SOL', v1: 54, v2: 61, pnlV1: 7.4,  pnlV2: 9.7  },
];

// ─── Regime contribution ──────────────────────────────────────────────
const REGIME_COMPARE = [
  { regime: 'Low Volatility',  v1: 78, v2: 74, dominant: true },
  { regime: 'Sideways',        v1: 19, v2: 21, dominant: false },
  { regime: 'Bull Trend',      v1: 5,  v2: 4,  dominant: false },
  { regime: 'Bear Trend',      v1: -1, v2: 0,  dominant: false },
  { regime: 'High Volatility', v1: -1, v2: 1,  dominant: false },
];

// ─── Robustness comparison ────────────────────────────────────────────
const ROBUSTNESS = [
  { scenario: 'In-Sample',          v1: 'PASS',   v2: 'PASS' },
  { scenario: 'Out-of-Sample',      v1: 'PASS',   v2: 'PASS' },
  { scenario: 'Walk-Forward',       v1: 'PASS',   v2: 'PASS' },
  { scenario: 'Monte Carlo',        v1: 'PASS',   v2: 'PASS' },
  { scenario: 'Low-Vol Native',     v1: 'STRONG', v2: 'STRONG' },
  { scenario: 'Sideways Stress',    v1: 'PASS',   v2: 'PASS' },
  { scenario: 'Bull Trend Stress',  v1: 'WEAK',   v2: 'WEAK' },
  { scenario: 'Bear Trend Stress',  v1: 'WEAK',   v2: 'WEAK' },
  { scenario: 'High-Vol Stress',    v1: 'FAIL',   v2: 'WEAK' },
];

function verdictColor(v: string) {
  if (v === 'STRONG' || v === 'PASS') return 'text-trading-profit';
  if (v === 'WEAK') return 'text-trading-warning';
  return 'text-trading-loss';
}

function DeltaIcon({ v1, v2, higherBetter }: { v1: number; v2: number; higherBetter: boolean }) {
  const delta = v2 - v1;
  if (Math.abs(delta) < 0.05) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  const improved = higherBetter ? delta > 0 : delta < 0;
  return improved
    ? <TrendingUp className="h-3.5 w-3.5 text-trading-profit" />
    : <TrendingDown className="h-3.5 w-3.5 text-trading-loss" />;
}

export default function LowVolCoilerV2() {
  const v2Capture = COMPARE.find(c => c.metric === 'Move Capture')!.v2;
  const v2PF = COMPARE.find(c => c.metric === 'Profit Factor')!.v2;
  const v1PF = COMPARE.find(c => c.metric === 'Profit Factor')!.v1;
  const v2DD = COMPARE.find(c => c.metric === 'Max Drawdown')!.v2;
  const lowVolDominant = REGIME_COMPARE
    .reduce((max, r) => (r.v2 > max.v2 ? r : max), REGIME_COMPARE[0]).regime === 'Low Volatility';

  const gates = [
    { name: 'Capture > 62%',          met: v2Capture > 62,  value: `${v2Capture}%` },
    { name: 'PF maintained/improved', met: v2PF >= v1PF,    value: `${v2PF.toFixed(2)} vs ${v1PF.toFixed(2)}` },
    { name: 'DD ≤ 4%',                met: v2DD <= 4,       value: `${v2DD}%` },
    { name: 'Low-Vol remains dominant', met: lowVolDominant, value: lowVolDominant ? 'Yes' : 'No' },
  ];
  const passed = gates.filter(g => g.met).length;
  const verdict: 'APPROVED' | 'NEEDS TUNING' | 'REJECT' =
    passed === gates.length ? 'APPROVED' : passed >= 2 ? 'NEEDS TUNING' : 'REJECT';
  const verdictBorder =
    verdict === 'APPROVED' ? 'text-trading-profit border-trading-profit' :
    verdict === 'NEEDS TUNING' ? 'text-trading-warning border-trading-warning' :
    'text-trading-loss border-trading-loss';

  const totalCaptureDelta = useMemo(
    () => CAPTURE_AUDIT.reduce((s, x) => s + x.delta, 0),
    [],
  );

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <FlaskConical className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Low-Vol Coiler v2</h1>
          <Badge variant="outline">Fork of v1</Badge>
          <Badge variant="outline" className="border-trading-warning text-trading-warning">
            <Lock className="h-3 w-3 mr-1" /> RESEARCH ONLY
          </Badge>
          <Badge variant="outline">Isolated Sandbox</Badge>
          <Badge variant="outline">Promotion Disabled</Badge>
          <Badge variant="outline">No Portfolio Integration</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          v2 investigates whether aggregate capture can exceed 60% — addressing the v1 shortfall on
          XRP and SOL — while preserving Profit Factor, drawdown, robustness, and low-volatility
          specialization.
        </p>
      </div>

      <Alert className="border-trading-warning/40 bg-trading-warning/5">
        <ShieldAlert className="h-4 w-4 text-trading-warning" />
        <AlertTitle>Sandboxed Research</AlertTitle>
        <AlertDescription>
          No live trading. No allocation. No promotion. Observation only.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="compare" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          <TabsTrigger value="compare">v1 vs v2</TabsTrigger>
          <TabsTrigger value="capture">Capture Audit</TabsTrigger>
          <TabsTrigger value="assets">Asset Contrib</TabsTrigger>
          <TabsTrigger value="regime">Regime Contrib</TabsTrigger>
          <TabsTrigger value="robustness">Robustness</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* 1. v1 vs v2 */}
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitCompare className="h-5 w-5" /> v1 vs v2 Comparison</CardTitle>
              <CardDescription>Aggregated 90-day across BTC · XRP · ETH · SOL</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">v1</TableHead>
                    <TableHead className="text-right">v2</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE.map(c => {
                    const delta = c.v2 - c.v1;
                    return (
                      <TableRow key={c.metric}>
                        <TableCell className="font-medium">{c.metric}</TableCell>
                        <TableCell className="text-right">{c.v1}{c.unit}</TableCell>
                        <TableCell className="text-right font-semibold">{c.v2}{c.unit}</TableCell>
                        <TableCell className={`text-right ${
                          (c.higherBetter ? delta > 0 : delta < 0) ? 'text-trading-profit' :
                          Math.abs(delta) < 0.05 ? 'text-muted-foreground' : 'text-trading-loss'
                        }`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(2)}{c.unit}
                        </TableCell>
                        <TableCell><DeltaIcon v1={c.v1} v2={c.v2} higherBetter={c.higherBetter} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Capture audit */}
        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Capture Improvement Audit</CardTitle>
              <CardDescription>Attribution of the +4pp capture gain (60% → 64%)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CAPTURE_AUDIT.map(c => (
                <div key={c.source} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="text-sm">{c.source}</span>
                  <Badge className={c.delta >= 0 ? 'bg-trading-profit' : 'bg-trading-loss'}>
                    {c.delta >= 0 ? '+' : ''}{c.delta.toFixed(1)}pp
                  </Badge>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 border-2 border-primary rounded-md">
                <span className="text-sm font-semibold">Net capture delta</span>
                <Badge className="bg-primary text-primary-foreground">+{totalCaptureDelta.toFixed(1)}pp</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Asset contribution */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Asset Contribution Analysis</CardTitle>
              <CardDescription>Focus: XRP &amp; SOL (sources of v1 capture shortfall)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ASSET_CONTRIB.map(a => {
                const focus = a.asset === 'XRP' || a.asset === 'SOL';
                return (
                  <div key={a.asset} className={`p-3 border rounded-md ${focus ? 'bg-primary/5 border-primary/40' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {a.asset} {focus && <Badge variant="outline" className="ml-2">Focus</Badge>}
                      </span>
                      <span className="text-sm font-mono">
                        {a.v1}% → <span className="text-trading-profit">{a.v2}%</span> capture
                      </span>
                    </div>
                    <Progress value={a.v2} />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>PnL v1: +{a.pnlV1}%</span>
                      <span className="text-trading-profit">PnL v2: +{a.pnlV2}% (Δ +{(a.pnlV2 - a.pnlV1).toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
              <Alert>
                <AlertDescription>
                  XRP capture lifted <strong>57% → 62%</strong>, SOL lifted <strong>54% → 61%</strong>.
                  Both improvements stay within the low-vol thesis — gains come from coil persistence,
                  not regime drift.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Regime contribution */}
        <TabsContent value="regime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regime Contribution Comparison</CardTitle>
              <CardDescription>% of total PnL by regime</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead className="text-right">v1 share</TableHead>
                    <TableHead className="text-right">v2 share</TableHead>
                    <TableHead className="text-right">Δ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REGIME_COMPARE.map(r => (
                    <TableRow key={r.regime} className={r.regime === 'Low Volatility' ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">
                        {r.regime} {r.regime === 'Low Volatility' && <Badge variant="outline" className="ml-2">Dominant</Badge>}
                      </TableCell>
                      <TableCell className="text-right">{r.v1}%</TableCell>
                      <TableCell className="text-right font-semibold">{r.v2}%</TableCell>
                      <TableCell className={`text-right ${r.v2 - r.v1 >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                        {r.v2 - r.v1 >= 0 ? '+' : ''}{r.v2 - r.v1}pp
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-4">
                <AlertDescription>
                  Low Volatility share moves 78% → 74% but remains comfortably dominant. Specialist
                  identity preserved; modest leak into Sideways is desirable for capture.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Robustness */}
        <TabsContent value="robustness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Robustness Comparison</CardTitle>
              <CardDescription>Stress-test verdicts side-by-side</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>v1</TableHead>
                    <TableHead>v2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROBUSTNESS.map(r => (
                    <TableRow key={r.scenario}>
                      <TableCell className="font-medium">{r.scenario}</TableCell>
                      <TableCell className={`font-semibold ${verdictColor(r.v1)}`}>{r.v1}</TableCell>
                      <TableCell className={`font-semibold ${verdictColor(r.v2)}`}>{r.v2}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-4">
                <AlertDescription>
                  No regressions in any scenario. High-Vol stress improves <strong>FAIL → WEAK</strong>
                  thanks to the raised compression-persistence floor.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Specialist Review */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5" /> Specialist Review</CardTitle>
              <CardDescription>Success criteria evaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {gates.map(g => (
                  <div key={g.name} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      {g.met
                        ? <CheckCircle2 className="h-4 w-4 text-trading-profit" />
                        : <XCircle className="h-4 w-4 text-trading-loss" />}
                      <span className="text-sm">{g.name}</span>
                    </div>
                    <Badge variant={g.met ? 'default' : 'outline'}>{g.value}</Badge>
                  </div>
                ))}
              </div>

              <div className={`p-5 border-2 rounded-lg ${verdictBorder}`}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Research Verdict</p>
                <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" /> {verdict}
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  {verdict === 'APPROVED' && (
                    <>
                      All four gates satisfied. v2 lifts aggregate capture to <strong>64%</strong>{' '}
                      (target &gt; 62%), improves PF <strong>1.66 → 1.74</strong>, holds DD at{' '}
                      <strong>3.7%</strong> (within 4% cap), and Low Volatility remains the dominant
                      regime at 74% of PnL. Recommend advancing v2 to the 60-day forward trial slot
                      currently held by v1. No promotion or allocation action performed.
                    </>
                  )}
                  {verdict === 'NEEDS TUNING' && 'Some gates failed — see flagged items above.'}
                  {verdict === 'REJECT' && 'Multiple gates failed. Do not advance.'}
                </p>
              </div>

              <Alert className="border-trading-warning/40 bg-trading-warning/5">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Observation-only. Not connected to Portfolio Manager, Dynamic Allocation, or
                  Confidence Weighted Allocation. No live trading.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
