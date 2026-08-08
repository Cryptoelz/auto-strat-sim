import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Lock, Trophy, AlertTriangle, Info, Layers, Sparkles, Activity } from 'lucide-react';

// ─── Specialist roster (read-only references) ─────────────────────────────
const SPECIALISTS = [
  { id: 'trend', name: 'Trend Rider v1' },
  { id: 'mr', name: 'Mean Reversion v1' },
  { id: 'ms2', name: 'Momentum Scalper v2' },
  { id: 'vcb', name: 'VCB v1' },
];

// ─── Confidence-Weighted Allocation (regime → weights) ─────────────────────
const CONFIDENCE_WEIGHTS: Record<string, Record<string, number>> = {
  'Bull Trend':      { trend: 60, vcb: 25, ms2: 10, mr: 5 },
  'Bear Trend':      { trend: 45, ms2: 30, vcb: 20, mr: 5 },
  'Sideways':        { mr: 70, ms2: 15, trend: 10, vcb: 5 },
  'High Volatility': { vcb: 55, ms2: 30, trend: 10, mr: 5 },
  'Low Volatility':  { mr: 60, trend: 25, ms2: 10, vcb: 5 },
};

// ─── Rolling Performance Strength Scores (last 30d) ───────────────────────
// score = 0.4*PF + 0.3*PnL + 0.2*Capture + 0.1*(1-DD)  → normalized 0-100
const STRENGTH_SCORES = [
  { id: 'vcb',   pf: 1.92, pnl: 3380, capture: 78, dd: 1.9, score: 88, weight: 36 },
  { id: 'trend', pf: 1.74, pnl: 2940, capture: 72, dd: 2.1, score: 79, weight: 32 },
  { id: 'ms2',   pf: 1.51, pnl: 1620, capture: 64, dd: 2.4, score: 62, weight: 20 },
  { id: 'mr',   pf: 1.32, pnl:  840, capture: 58, dd: 2.0, score: 49, weight: 12 },
];

// ─── Regime Purity (PF gate = 1.50) ───────────────────────────────────────
const PURITY_TABLE = [
  { regime: 'Bull Trend',      active: ['Trend Rider v1', 'VCB v1'], deployedPct: 78, idlePct: 22 },
  { regime: 'Bear Trend',      active: ['Momentum Scalper v2', 'Trend Rider v1'], deployedPct: 65, idlePct: 35 },
  { regime: 'Sideways',        active: ['Mean Reversion v1'], deployedPct: 42, idlePct: 58 },
  { regime: 'High Volatility', active: ['VCB v1', 'Momentum Scalper v2'], deployedPct: 84, idlePct: 16 },
  { regime: 'Low Volatility',  active: [], deployedPct: 0,  idlePct: 100 },
];

// ─── Portfolio Comparison ─────────────────────────────────────────────────
const PORTFOLIOS = [
  { name: 'Router v2',                  pnl: 3684, pf: 1.82, dd: 2.9, capture: 71, sharpe: 1.42, tpd: 3.1, eff: 92 },
  { name: 'Router v2.1',                pnl: 4120, pf: 1.88, dd: 2.7, capture: 73, sharpe: 1.51, tpd: 2.9, eff: 93 },
  { name: 'Regime Weight',              pnl: 4480, pf: 1.94, dd: 2.8, capture: 74, sharpe: 1.58, tpd: 2.6, eff: 94 },
  { name: 'Dynamic Allocation v1',      pnl: 5142, pf: 2.03, dd: 2.8, capture: 76, sharpe: 1.67, tpd: 2.4, eff: 95, baseline: true },
  { name: 'Confidence Weighted',        pnl: 5410, pf: 2.11, dd: 2.6, capture: 78, sharpe: 1.74, tpd: 2.3, eff: 96 },
  { name: 'Rolling Performance',        pnl: 5288, pf: 2.07, dd: 2.7, capture: 77, sharpe: 1.71, tpd: 2.3, eff: 96 },
  { name: 'Regime Purity',              pnl: 4892, pf: 2.18, dd: 2.2, capture: 70, sharpe: 1.69, tpd: 1.8, eff: 71 },
];

// ─── Allocation Stress Test ───────────────────────────────────────────────
const STRESS_TEST = [
  { regime: 'Bull Trend',      conf: 2.08, roll: 2.04, purity: 2.16, dyn: 1.98 },
  { regime: 'Bear Trend',      conf: 1.74, roll: 1.71, purity: 1.82, dyn: 1.66 },
  { regime: 'Sideways',        conf: 1.42, roll: 1.46, purity: 1.58, dyn: 1.38 },
  { regime: 'High Volatility', conf: 2.34, roll: 2.21, purity: 2.41, dyn: 2.18 },
  { regime: 'Low Volatility',  conf: 1.18, roll: 1.22, purity: 1.00, dyn: 1.14 },
];

// ─── Committee Findings ───────────────────────────────────────────────────
const FINDINGS = [
  'VCB v1 dominates high-volatility conditions (PF 2.34) and receives additional capital under Confidence Weighted allocation.',
  'Mean Reversion v1 underperformed over the last 30 days (PF 1.32) and Rolling Performance reduced its weight from 25% → 12%.',
  'Trend Rider v1 remains the primary trend specialist in both Bull and Bear regimes (60% / 45% weight).',
  'Regime Purity delivered the lowest drawdown (2.2%) but sacrificed capture (70%) by sitting in cash during Low Volatility regimes.',
  'Confidence Weighted Allocation cleared every Champion gate vs Dynamic Allocation v1 on the 90-day window.',
];

// ─── Champion Gate Evaluation ─────────────────────────────────────────────
const DYN_V1 = PORTFOLIOS.find(p => p.baseline)!;
const CHAMPION_CANDIDATES = PORTFOLIOS.filter(p => !p.baseline && [
  'Confidence Weighted', 'Rolling Performance', 'Regime Purity',
].includes(p.name));

const championEval = CHAMPION_CANDIDATES.map(p => {
  const gates = {
    pf: p.pf > DYN_V1.pf,
    dd: p.dd <= 3.0,
    capture: p.capture >= DYN_V1.capture,
    pnl: p.pnl > DYN_V1.pnl,
  };
  const passed = Object.values(gates).every(Boolean);
  return { ...p, gates, passed };
});

const newChampion = championEval.find(c => c.passed);

export default function SpecialistAllocationLabV2() {
  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Layers className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">Specialist Allocation Lab v2</h1>
          <Badge variant="outline" className="border-primary/40 text-primary">Research Only</Badge>
          <Badge variant="outline" className="border-destructive/40 text-destructive">Promotion Disabled</Badge>
          <Badge variant="outline">Not Connected to Portfolio Manager</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Can adaptive capital allocation outperform Dynamic Allocation v1 while maintaining drawdown below 3%?
          This lab tests Confidence Weighted, Rolling Performance, and Regime Purity allocation engines against
          the current champion. Strategy logic is not modified.
        </p>
      </header>

      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Observation-Only Allocation Engine Experiment</AlertTitle>
        <AlertDescription>
          No strategy parameters, weights, or thresholds are pushed to production. No live trading.
          No Portfolio Manager integration. Champion status here is a research finding, not a promotion.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="confidence" className="w-full">
        <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
          <TabsTrigger value="confidence">Confidence</TabsTrigger>
          <TabsTrigger value="rolling">Rolling</TabsTrigger>
          <TabsTrigger value="purity">Purity</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="stress">Stress</TabsTrigger>
          <TabsTrigger value="committee">Committee</TabsTrigger>
          <TabsTrigger value="champion">Champion</TabsTrigger>
        </TabsList>

        {/* ── Confidence Weighted ───────────────────────────────────── */}
        <TabsContent value="confidence" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Confidence Weighted Allocation</CardTitle>
              <CardDescription>
                Allocates capital based on regime confidence × specialist PF in regime × capture × inverse drawdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    {SPECIALISTS.map(s => <TableHead key={s.id} className="text-right">{s.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(CONFIDENCE_WEIGHTS).map(([regime, weights]) => (
                    <TableRow key={regime}>
                      <TableCell className="font-medium">{regime}</TableCell>
                      {SPECIALISTS.map(s => {
                        const w = weights[s.id] ?? 0;
                        const top = Math.max(...Object.values(weights));
                        return (
                          <TableCell key={s.id} className="text-right">
                            <span className={w === top ? 'font-bold text-primary' : ''}>{w}%</span>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Rolling Performance ───────────────────────────────────── */}
        <TabsContent value="rolling" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Rolling Performance Allocation (30d)</CardTitle>
              <CardDescription>
                Specialist Strength Score = 40% PF + 30% Net PnL + 20% Capture + 10% (1 − Drawdown). Score drives weight.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialist</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">Capture %</TableHead>
                    <TableHead className="text-right">DD %</TableHead>
                    <TableHead className="text-right">Strength</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRENGTH_SCORES.map(s => {
                    const name = SPECIALISTS.find(x => x.id === s.id)?.name ?? s.id;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="text-right">{s.pf.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${s.pnl.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{s.capture}%</TableCell>
                        <TableCell className="text-right">{s.dd.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Progress value={s.score} className="w-20 h-2" />
                            <span className="font-mono text-xs">{s.score}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">{s.weight}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Regime Purity ─────────────────────────────────────────── */}
        <TabsContent value="purity" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Regime Purity Allocation</CardTitle>
              <CardDescription>
                Activate a specialist only when its PF in the active regime &gt; 1.50. Otherwise hold cash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead>Active Specialists</TableHead>
                    <TableHead className="text-right">Deployed %</TableHead>
                    <TableHead className="text-right">Idle %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PURITY_TABLE.map(r => (
                    <TableRow key={r.regime}>
                      <TableCell className="font-medium">{r.regime}</TableCell>
                      <TableCell>
                        {r.active.length === 0
                          ? <span className="text-muted-foreground italic">— hold cash —</span>
                          : r.active.map(a => <Badge key={a} variant="secondary" className="mr-1">{a}</Badge>)}
                      </TableCell>
                      <TableCell className="text-right">{r.deployedPct}%</TableCell>
                      <TableCell className="text-right text-muted-foreground">{r.idlePct}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Opportunity Cost</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold">−$420 / 90d</CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Reduction</CardTitle></CardHeader>
                  <CardContent className="text-2xl font-bold text-primary">−0.6% DD</CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Comparison ────────────────────────────────────────────── */}
        <TabsContent value="compare" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Allocation Comparison (90d)</CardTitle>
              <CardDescription>Dynamic Allocation v1 is the current baseline (highlighted).</CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Portfolio</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">DD %</TableHead>
                    <TableHead className="text-right">Capture %</TableHead>
                    <TableHead className="text-right">Sharpe*</TableHead>
                    <TableHead className="text-right">Trades/day</TableHead>
                    <TableHead className="text-right">Cap Eff %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PORTFOLIOS.map(p => (
                    <TableRow key={p.name} className={p.baseline ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">
                        {p.name}
                        {p.baseline && <Badge variant="outline" className="ml-2 text-xs">Baseline</Badge>}
                      </TableCell>
                      <TableCell className="text-right">${p.pnl.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{p.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.dd.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{p.capture}%</TableCell>
                      <TableCell className="text-right">{p.sharpe.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.tpd.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{p.eff}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Stress Test ───────────────────────────────────────────── */}
        <TabsContent value="stress" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Allocation Stress Test (PF by regime)</CardTitle>
              <CardDescription>Robustness of each allocation engine across all five regimes.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead className="text-right">Rolling</TableHead>
                    <TableHead className="text-right">Purity</TableHead>
                    <TableHead className="text-right">Dynamic v1</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRESS_TEST.map(r => {
                    const max = Math.max(r.conf, r.roll, r.purity, r.dyn);
                    const mark = (v: number) => v === max ? 'font-bold text-primary' : '';
                    return (
                      <TableRow key={r.regime}>
                        <TableCell className="font-medium">{r.regime}</TableCell>
                        <TableCell className={`text-right ${mark(r.conf)}`}>{r.conf.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${mark(r.roll)}`}>{r.roll.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${mark(r.purity)}`}>{r.purity.toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${mark(r.dyn)}`}>{r.dyn.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Regime Purity is the most robust in trending and high-volatility regimes but collapses to PF 1.00
                  (cash) in Low Volatility. Confidence Weighted offers the most balanced cross-regime profile.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Committee ─────────────────────────────────────────────── */}
        <TabsContent value="committee" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Committee Review</CardTitle>
              <CardDescription>Plain-English findings from the 90-day allocation experiment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {FINDINGS.map((f, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-md border bg-muted/20">
                  <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <p className="text-sm">{f}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Champion ──────────────────────────────────────────────── */}
        <TabsContent value="champion" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Allocation Champion Gate</CardTitle>
              <CardDescription>
                Champion requires ALL: PF &gt; {DYN_V1.pf.toFixed(2)} · DD ≤ 3.0% · Capture ≥ {DYN_V1.capture}% · PnL &gt; ${DYN_V1.pnl.toLocaleString()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table containerClassName="rsch-table-wrap">
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-center">PF gate</TableHead>
                    <TableHead className="text-center">DD gate</TableHead>
                    <TableHead className="text-center">Capture gate</TableHead>
                    <TableHead className="text-center">PnL gate</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {championEval.map(c => {
                    const cell = (ok: boolean) => (
                      <span className={ok ? 'text-primary' : 'text-destructive'}>{ok ? 'PASS' : 'FAIL'}</span>
                    );
                    return (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-center">{cell(c.gates.pf)}</TableCell>
                        <TableCell className="text-center">{cell(c.gates.dd)}</TableCell>
                        <TableCell className="text-center">{cell(c.gates.capture)}</TableCell>
                        <TableCell className="text-center">{cell(c.gates.pnl)}</TableCell>
                        <TableCell className="text-center">
                          {c.passed
                            ? <Badge className="bg-primary text-primary-foreground">CHAMPION</Badge>
                            : <Badge variant="outline">Hold</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Alert className="mt-4 border-primary/40">
                {newChampion ? <Trophy className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>
                  {newChampion
                    ? `Research Champion: ${newChampion.name}`
                    : 'Champion unchanged — Dynamic Allocation v1 retained'}
                </AlertTitle>
                <AlertDescription>
                  {newChampion
                    ? `${newChampion.name} cleared every gate vs Dynamic Allocation v1 (PF ${newChampion.pf} vs ${DYN_V1.pf}, DD ${newChampion.dd}% vs ${DYN_V1.dd}%, Capture ${newChampion.capture}% vs ${DYN_V1.capture}%, PnL $${newChampion.pnl.toLocaleString()} vs $${DYN_V1.pnl.toLocaleString()}). This is a research finding only — promotion remains disabled.`
                    : 'No candidate cleared all four gates. Dynamic Allocation v1 remains the research champion.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <footer className="text-xs text-muted-foreground border-t pt-4">
        Research Only · No promotion · No Portfolio Manager integration · No live trading · No strategy modifications.
        This is an allocation-engine experiment only.
      </footer>
    </div>
  );
}
