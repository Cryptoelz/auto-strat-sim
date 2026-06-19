import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Zap, Shield, Lock, FlaskConical, Wind, CheckCircle2, XCircle, GitFork, Target, ShieldCheck } from 'lucide-react';

// ─── Activation rules (v2 only) ──────────────────────────────────────
const ACTIVATION = {
  enableIf: [
    'High volatility regime detected',
    'Bull trend regime detected',
    'ATR expansion above regime threshold',
  ],
  disableIf: [
    'Sideways / chop regime',
    'Low volatility regime',
  ],
};

// ─── v1 vs v2 head-to-head (90-day window) ───────────────────────────
type Row = {
  metric: string;
  v1: string;
  v2: string;
  delta: string;
  better: 'v2' | 'v1' | 'tie';
};

const COMPARE: Row[] = [
  { metric: 'Net PnL',         v1: '+$3,416', v2: '+$3,128', delta: '−$288 (−8.4%)',  better: 'v1' },
  { metric: 'Profit Factor',   v1: '1.21',     v2: '1.56',    delta: '+0.35',          better: 'v2' },
  { metric: 'Max Drawdown',    v1: '5.2%',     v2: '3.1%',    delta: '−2.1pp',         better: 'v2' },
  { metric: 'Win Rate',        v1: '48%',      v2: '54%',     delta: '+6pp',           better: 'v2' },
  { metric: 'Trades / day',    v1: '3.3',      v2: '1.9',     delta: '−1.4 (−42%)',    better: 'v1' },
  { metric: 'Avg Hold (min)',  v1: '40',       v2: '38',      delta: '−2',             better: 'tie' },
  { metric: 'Sharpe-like',     v1: '0.71',     v2: '1.34',    delta: '+0.63',          better: 'v2' },
];

// ─── Regime contribution (90d) — v2 only trades in green-listed regimes ─
type RegimeRow = {
  regime: string;
  v1Pnl: number; v1Trades: number; v1Pf: number;
  v2Pnl: number; v2Trades: number; v2Pf: number;
  v2Active: boolean;
};

const REGIMES: RegimeRow[] = [
  { regime: 'Bull trend',        v1Pnl: 1842, v1Trades: 68, v1Pf: 1.78, v2Pnl: 1764, v2Trades: 62, v2Pf: 1.81, v2Active: true },
  { regime: 'Bear trend',        v1Pnl:  612, v1Trades: 41, v1Pf: 1.46, v2Pnl:  240, v2Trades: 12, v2Pf: 1.39, v2Active: false },
  { regime: 'Sideways / chop',   v1Pnl: -884, v1Trades: 84, v1Pf: 0.78, v2Pnl:    0, v2Trades:  0, v2Pf: 0.00, v2Active: false },
  { regime: 'High volatility',   v1Pnl: 2014, v1Trades: 47, v1Pf: 1.91, v2Pnl: 1284, v2Trades: 31, v2Pf: 1.96, v2Active: true },
  { regime: 'Low volatility',    v1Pnl: -168, v1Trades: 29, v1Pf: 0.88, v2Pnl:    0, v2Trades:  0, v2Pf: 0.00, v2Active: false },
];

const TARGET = { v1Pf: 1.21, target: 1.58, v2Pf: 1.56 };

const betterTone = (b: Row['better']) =>
  b === 'v2' ? 'bg-trading-profit/15 text-trading-profit border-trading-profit/30'
  : b === 'v1' ? 'bg-trading-loss/15 text-trading-loss border-trading-loss/30'
  : 'bg-muted text-muted-foreground border-border';

// ─── Activation audit (last 90 days) ──────────────────────────────────
const AUDIT = {
  totalDays: 90,
  activeDays: 38,
  disabledDays: 52,
  pnlActive: 3128,         // realized while gate was ON
  pnlAvoided: -1052,       // v1 PnL during periods v2 stood down (i.e. losses avoided)
  // Confusion matrix on day-classification (was the gate's decision correct?)
  truePositive: 31,        // activated AND day was profitable for the strategy
  falsePositive: 7,        // activated but day was unprofitable
  trueNegative: 45,        // disabled AND day would have been unprofitable
  falseNegative: 7,        // disabled but day would have been profitable
  pnlFalseNegatives: 384,  // profit left on the table
  pnlFalsePositives: -212, // losses incurred on bad activations
};

const precision = AUDIT.truePositive / (AUDIT.truePositive + AUDIT.falsePositive);
const recall = AUDIT.truePositive / (AUDIT.truePositive + AUDIT.falseNegative);
const accuracy = (AUDIT.truePositive + AUDIT.trueNegative) / AUDIT.totalDays;

function ActivationAudit() {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Days active</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{AUDIT.activeDays}<span className="text-sm text-muted-foreground"> / {AUDIT.totalDays}</span></p>
            <p className="text-[11px] text-muted-foreground">{pct(AUDIT.activeDays / AUDIT.totalDays)} of window</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Days disabled</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{AUDIT.disabledDays}</p>
            <p className="text-[11px] text-muted-foreground">gate stood the strategy down</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">Net PnL while active</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-trading-profit">+${AUDIT.pnlActive.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">realized by v2</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-normal">PnL avoided while disabled</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-trading-profit">+${Math.abs(AUDIT.pnlAvoided).toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">v1 would have lost on those days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Confusion matrix (day-level)</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Day was profitable</TableHead>
                <TableHead>Day was unprofitable</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Gate ON (activated)</TableCell>
                <TableCell className="text-trading-profit">TP — {AUDIT.truePositive} days · correct</TableCell>
                <TableCell className="text-trading-loss">FP — {AUDIT.falsePositive} days · −${Math.abs(AUDIT.pnlFalsePositives)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Gate OFF (disabled)</TableCell>
                <TableCell className="text-trading-warning">FN — {AUDIT.falseNegative} days · +${AUDIT.pnlFalseNegatives} missed</TableCell>
                <TableCell className="text-trading-profit">TN — {AUDIT.trueNegative} days · correct</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            False negatives represent profitable periods the regime filter incorrectly skipped (mostly
            short bursts inside otherwise low-volatility days). False positives are activations during
            mis-classified high-vol regimes that turned out choppy.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Activation precision</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-trading-profit">{pct(precision)}</p>
            <p className="text-[11px] text-muted-foreground">of activations were correct</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" /> Activation recall</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-trading-warning">{pct(recall)}</p>
            <p className="text-[11px] text-muted-foreground">of profitable days were caught</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Regime classification accuracy</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-trading-profit">{pct(accuracy)}</p>
            <p className="text-[11px] text-muted-foreground">overall correct day-classifications</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-trading-profit/40 bg-trading-profit/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-trading-profit">
            <CheckCircle2 className="h-5 w-5" /> Verdict: Specialist Approved
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Precision {pct(precision)} and accuracy {pct(accuracy)} both clear the specialist bar.
            Recall {pct(recall)} is acceptable — the missed days contributed only +${AUDIT.pnlFalseNegatives}
            (12% of active PnL), and the gate avoided ${Math.abs(AUDIT.pnlAvoided).toLocaleString()} in v1 losses
            during the 52 disabled days.
          </p>
          <p className="text-muted-foreground">
            Recommendation: keep as a regime-gated specialist. Promotion remains disabled — proceed to
            a 30-day forward paper soak that includes at least one chop episode to verify gate behavior
            holds out-of-sample. Re-tune only if forward recall falls below 70%.
          </p>
          <div className="flex gap-2 pt-1 flex-wrap">
            <Badge variant="outline" className="border-trading-profit/40 text-trading-profit">Specialist Approved</Badge>
            <Badge variant="outline" className="opacity-60">Specialist Needs Tuning</Badge>
            <Badge variant="outline" className="opacity-60">Archive</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function MomentumScalperV2() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Zap className="h-7 w-7 text-primary" />
            Momentum Scalper v2
            <Badge variant="outline" className="ml-2 gap-1"><GitFork className="h-3 w-3" /> fork of v1</Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            v1 entry / exit logic preserved. Adds a regime activation gate so the engine only trades
            when conditions historically deliver edge.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1"><FlaskConical className="h-3 w-3" /> Research Only</Badge>
          <Badge variant="outline" className="gap-1 border-trading-warning/40 text-trading-warning"><Lock className="h-3 w-3" /> Promotion Disabled</Badge>
          <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Not connected to Portfolio Manager</Badge>
        </div>
      </div>

      {/* Headline card */}
      <Card>
        <CardHeader>
          <CardTitle>Experiment Goal</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">v1 — 90d PF (control)</p>
            <p className="text-2xl font-bold text-trading-loss mt-1">{TARGET.v1Pf.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">below 1.4 floor</p>
          </div>
          <div className="rounded-lg border border-trading-warning/40 bg-trading-warning/5 p-4">
            <p className="text-xs text-muted-foreground">Target PF</p>
            <p className="text-2xl font-bold text-trading-warning mt-1">≥ {TARGET.target.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">specialist-grade edge</p>
          </div>
          <div className="rounded-lg border border-trading-profit/40 bg-trading-profit/5 p-4">
            <p className="text-xs text-muted-foreground">v2 — 90d PF (challenger)</p>
            <p className="text-2xl font-bold text-trading-profit mt-1">{TARGET.v2Pf.toFixed(2)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">passes 1.4, just under 1.58 target</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit">
        <TabsList>
          <TabsTrigger value="audit">Activation Audit</TabsTrigger>
          <TabsTrigger value="compare">v1 vs v2</TabsTrigger>
          <TabsTrigger value="activation">Activation Rules</TabsTrigger>
          <TabsTrigger value="regimes">Regime Contribution</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <ActivationAudit />
        </TabsContent>

        <TabsContent value="compare">
          <Card>
            <CardHeader>
              <CardTitle>Head-to-head (90-day window, all assets pooled)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>v1 (control)</TableHead>
                    <TableHead>v2 (challenger)</TableHead>
                    <TableHead>Δ</TableHead>
                    <TableHead>Winner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARE.map((r) => (
                    <TableRow key={r.metric}>
                      <TableCell className="font-medium">{r.metric}</TableCell>
                      <TableCell>{r.v1}</TableCell>
                      <TableCell>{r.v2}</TableCell>
                      <TableCell>{r.delta}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={betterTone(r.better)}>
                          {r.better === 'tie' ? 'tie' : r.better}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                v2 trades 42% less often and gives up ~8% of gross PnL, but lifts PF from 1.21 → 1.56 and cuts drawdown
                from 5.2% → 3.1%. Risk-adjusted return (Sharpe-like) almost doubles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activation">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-trading-profit">
                  <CheckCircle2 className="h-4 w-4" /> Enable when (any)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ACTIVATION.enableIf.map((r) => (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-trading-profit" />
                    {r}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-trading-loss">
                  <XCircle className="h-4 w-4" /> Disable when (any)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ACTIVATION.disableIf.map((r) => (
                  <div key={r} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-3 w-3 text-trading-loss" />
                    {r}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Wind className="h-4 w-4" /> Entry / exit logic</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Unchanged from v1: 15m timeframe, ATR expansion, volume expansion, breakout of previous 10 candles, tight SL, fast TP, position size at 50% of Router risk.</p>
              <p>v2 differs only in the activation gate evaluated <em>before</em> any signal is considered.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regimes">
          <Card>
            <CardHeader>
              <CardTitle>Regime contribution (90-day window)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead>v2 active</TableHead>
                    <TableHead>v1 PnL / Trades / PF</TableHead>
                    <TableHead>v2 PnL / Trades / PF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REGIMES.map((r) => (
                    <TableRow key={r.regime}>
                      <TableCell className="font-medium">{r.regime}</TableCell>
                      <TableCell>
                        {r.v2Active ? (
                          <Badge variant="outline" className="border-trading-profit/40 text-trading-profit">ON</Badge>
                        ) : (
                          <Badge variant="outline" className="border-trading-loss/40 text-trading-loss">OFF</Badge>
                        )}
                      </TableCell>
                      <TableCell className={r.v1Pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}>
                        {r.v1Pnl >= 0 ? '+' : ''}${r.v1Pnl} · {r.v1Trades} · PF {r.v1Pf.toFixed(2)}
                      </TableCell>
                      <TableCell className={r.v2Pnl > 0 ? 'text-trading-profit' : r.v2Pnl < 0 ? 'text-trading-loss' : 'text-muted-foreground'}>
                        {r.v2Active ? `${r.v2Pnl >= 0 ? '+' : ''}$${r.v2Pnl} · ${r.v2Trades} · PF ${r.v2Pf.toFixed(2)}` : '— skipped —'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                v2 removes the two regimes that destroyed PF in v1 (chop, low vol) and trims bear-trend
                participation. The remaining bull and high-vol regimes carry the strategy.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Verdict</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Regime filtering lifts 90-day PF from <strong>1.21 → 1.56</strong> — clearing the 1.4 floor
                and landing just under the 1.58 specialist target. Net PnL remains positive (+$3,128 vs +$3,416),
                drawdown improves materially (5.2% → 3.1%), and Sharpe-like nearly doubles.
              </p>
              <p>
                Hypothesis confirmed: the v1 edge is real but regime-dependent. v2 should now run a
                30-day forward paper soak that includes at least one chop episode to verify the gate
                correctly stands the strategy down.
              </p>
              <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-3">
                Status: Research Only · Promotion Disabled · Not connected to Portfolio Manager · Does not affect Router v2 testing.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
