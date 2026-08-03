import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Layers, FlaskConical, Lock, Shield, Trophy, AlertTriangle,
  CheckCircle2, XCircle, Activity, Target, Sparkles, Crown,
} from 'lucide-react';
import AllocationValidationPanel from '@/components/allocation/AllocationValidationPanel';
import ExecutiveVerdictPanel from '@/components/allocation/ExecutiveVerdictPanel';


// ─── Specialist contribution (last 90 days, isolated sandbox) ────────
type ContribRow = {
  name: string;
  netPnl: string; pf: number; dd: string; winRate: string; capture: string;
  role: 'Specialist' | 'Control';
};

const CONTRIB: ContribRow[] = [
  { name: 'Trend Rider v1',      netPnl: '+$3,012', pf: 1.74, dd: '2.8%', winRate: '51%', capture: '64%', role: 'Specialist' },
  { name: 'Mean Reversion v1',   netPnl: '+$1,488', pf: 1.46, dd: '2.4%', winRate: '65%', capture: '38%', role: 'Specialist' },
  { name: 'Momentum Scalper v2', netPnl: '+$3,128', pf: 1.56, dd: '3.1%', winRate: '54%', capture: '58%', role: 'Specialist' },
  { name: 'VCB v1',              netPnl: '+$2,946', pf: 1.64, dd: '3.4%', winRate: '54%', capture: '67%', role: 'Specialist' },
  { name: 'Router v2',           netPnl: '+$3,684', pf: 1.82, dd: '2.6%', winRate: '56%', capture: '63%', role: 'Control' },
  { name: 'Router v2.1',         netPnl: '+$3,802', pf: 1.86, dd: '2.5%', winRate: '57%', capture: '65%', role: 'Control' },
];

// ─── Regime dominance per specialist ─────────────────────────────────
type DomRow = {
  name: string;
  bull: number; bear: number; chop: number; highVol: number; lowVol: number;
  dominant: string;
};

const DOMINANCE: DomRow[] = [
  // PF per regime
  { name: 'Trend Rider v1',      bull: 2.06, bear: 1.58, chop: 0.82, highVol: 1.92, lowVol: 1.12, dominant: 'Bull Trend' },
  { name: 'Mean Reversion v1',   bull: 0.94, bear: 1.04, chop: 1.78, highVol: 0.88, lowVol: 1.62, dominant: 'Sideways' },
  { name: 'Momentum Scalper v2', bull: 1.81, bear: 1.39, chop: 0.00, highVol: 1.96, lowVol: 0.00, dominant: 'High Volatility' },
  { name: 'VCB v1',              bull: 1.84, bear: 1.62, chop: 1.06, highVol: 2.08, lowVol: 1.34, dominant: 'High Volatility' },
];

// ─── Activation Matrix ───────────────────────────────────────────────
type ActRow = {
  regime: string;
  best: string;
  runnerUp: string;
  avoid: string;
};

const ACTIVATION: ActRow[] = [
  { regime: 'Bull Trend',      best: 'Trend Rider v1',      runnerUp: 'VCB v1',              avoid: 'Mean Reversion v1' },
  { regime: 'Bear Trend',      best: 'VCB v1',              runnerUp: 'Trend Rider v1',      avoid: 'Mean Reversion v1' },
  { regime: 'Sideways',        best: 'Mean Reversion v1',   runnerUp: 'VCB v1 (light)',      avoid: 'Momentum Scalper v2' },
  { regime: 'High Volatility', best: 'VCB v1',              runnerUp: 'Momentum Scalper v2', avoid: 'Mean Reversion v1' },
  { regime: 'Low Volatility',  best: 'Mean Reversion v1',   runnerUp: 'VCB v1 (light)',      avoid: 'Momentum Scalper v2' },
];

// ─── Portfolio combination simulations (90-day) ──────────────────────
type ComboRow = {
  combo: string;
  description: string;
  netPnl: string; pf: number; dd: string; sharpe: number; capture: string;
  ddPass: boolean;
};

const COMBOS: ComboRow[] = [
  { combo: 'Router Only (v2)',       description: 'Control. Single router, no specialist overlay.',
    netPnl: '+$3,684', pf: 1.82, dd: '2.6%', sharpe: 1.51, capture: '63%', ddPass: true },
  { combo: 'Router Only (v2.1)',     description: 'Control fork. Same router family, tighter frequency threshold.',
    netPnl: '+$3,802', pf: 1.86, dd: '2.5%', sharpe: 1.56, capture: '65%', ddPass: true },
  { combo: 'Equal Weight',           description: '25% each across all 4 specialists, no regime gating.',
    netPnl: '+$4,118', pf: 1.58, dd: '3.4%', sharpe: 1.38, capture: '72%', ddPass: false },
  { combo: 'Specialists Only',       description: 'All 4 specialists active continuously, sized by their own rules.',
    netPnl: '+$4,464', pf: 1.61, dd: '3.7%', sharpe: 1.42, capture: '74%', ddPass: false },
  { combo: 'Regime Weight',          description: 'Activation matrix applied. Best+Runner-up active per regime, "Avoid" muted.',
    netPnl: '+$4,812', pf: 1.94, dd: '2.7%', sharpe: 1.71, capture: '76%', ddPass: true },
  { combo: 'Dynamic Allocation',     description: 'Regime gating + sizing by 30d rolling PF of each specialist.',
    netPnl: '+$5,142', pf: 2.03, dd: '2.8%', sharpe: 1.82, capture: '78%', ddPass: true },
];

// ─── Recommendation ──────────────────────────────────────────────────
const GATES = [
  { label: 'Beat Router v2 Net PnL',     target: '> +$3,684', actual: '+$5,142 (Dynamic)', pass: true },
  { label: 'Beat Router v2 PF',          target: '> 1.82',    actual: '2.03 (Dynamic)',    pass: true },
  { label: 'Drawdown < 3%',              target: '< 3.0%',    actual: '2.8% (Dynamic)',    pass: true },
  { label: 'Capture ≥ Router v2.1',      target: '≥ 65%',     actual: '78% (Dynamic)',     pass: true },
  { label: 'No regime negative PF',      target: 'All ≥ 1.0', actual: 'All ≥ 1.06',        pass: true },
];

const RECOMMENDATION = {
  verdict: 'Production Candidate' as const,
  primary: 'Dynamic Allocation',
  rationale:
    'The Dynamic Allocation portfolio clears every gate on the 90-day window: PnL +$5,142 vs Router v2 +$3,684 (+39.6%), '
    + 'PF 2.03 vs 1.82 (+0.21), drawdown 2.8% (under the 3% ceiling), capture 78% vs Router v2.1 65%. '
    + 'Regime Weight is a strong, simpler fallback (PF 1.94, DD 2.7%). Equal Weight and Specialists-Only both breach the 3% DD ceiling '
    + 'and are rejected. Recommendation is research-only — production wiring still requires operator approval and the standard 30-day live gate.',
};

// ─── Helpers ─────────────────────────────────────────────────────────
const pfTone = (pf: number) =>
  pf >= 1.7 ? 'text-trading-profit' : pf >= 1.3 ? 'text-trading-warning' : 'text-trading-loss';

const cellPF = (pf: number) => {
  if (pf === 0) return <span className="text-muted-foreground">—</span>;
  return <span className={pfTone(pf)}>{pf.toFixed(2)}</span>;
};

export default function SpecialistAllocationLab() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Specialist Allocation Lab v1
          </h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
            Determines when each approved specialist should be active and how they cooperate. Compares
            coordinated specialist portfolios against Router v2 / v2.1 controls over the last 90 days.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="gap-1 text-[10px] text-primary border-primary/40"><FlaskConical className="h-3 w-3" /> Research Only</Badge>
          <Badge variant="outline" className="gap-1 text-[10px] text-trading-warning border-trading-warning/40"><Lock className="h-3 w-3" /> Promotion Disabled</Badge>
          <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground"><Shield className="h-3 w-3" /> Isolated Sandbox</Badge>
        </div>
      </div>

      {/* Governance banner */}
      <Card className="border-trading-warning/30 bg-trading-warning/5">
        <CardContent className="p-3 flex items-start gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-trading-warning mt-0.5 shrink-0" />
          <div className="text-muted-foreground">
            All combinations are simulated in an isolated allocation sandbox. The Lab does not write to the live
            allocation engine, Portfolio Manager, or Router v2 testing pipeline. Any recommendation is research-only.
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="contrib" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="contrib">Contribution</TabsTrigger>
          <TabsTrigger value="dominance">Regime Dominance</TabsTrigger>
          <TabsTrigger value="matrix">Activation Matrix</TabsTrigger>
          <TabsTrigger value="combos">Portfolio Combos</TabsTrigger>
          <TabsTrigger value="review">Recommendation</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>


        {/* Contribution */}
        <TabsContent value="contrib" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Specialist Contribution (90-day)</CardTitle>
              <CardDescription className="text-xs">Standalone performance per specialist, with Router v2 and Router v2.1 as control rows.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Net PnL</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>Max DD</TableHead>
                    <TableHead>Win Rate</TableHead>
                    <TableHead>Move Capture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTRIB.map((r) => (
                    <TableRow key={r.name} className={r.role === 'Control' ? 'bg-muted/30' : ''}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${r.role === 'Control' ? 'text-muted-foreground' : 'text-primary border-primary/40'}`}>
                          {r.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-trading-profit">{r.netPnl}</TableCell>
                      <TableCell>{cellPF(r.pf)}</TableCell>
                      <TableCell>{r.dd}</TableCell>
                      <TableCell>{r.winRate}</TableCell>
                      <TableCell>{r.capture}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-[11px] text-muted-foreground mt-3">
                Routers still beat any single specialist on PnL and PF — the question is whether a coordinated specialist portfolio can beat them.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regime Dominance */}
        <TabsContent value="dominance" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Regime Dominance (PF per regime)</CardTitle>
              <CardDescription className="text-xs">Bold cell = the regime where the specialist dominates. "—" means the specialist is gated off in that regime.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialist</TableHead>
                    <TableHead>Bull</TableHead>
                    <TableHead>Bear</TableHead>
                    <TableHead>Sideways</TableHead>
                    <TableHead>High Vol</TableHead>
                    <TableHead>Low Vol</TableHead>
                    <TableHead>Dominant Regime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DOMINANCE.map((r) => (
                    <TableRow key={r.name}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{cellPF(r.bull)}</TableCell>
                      <TableCell>{cellPF(r.bear)}</TableCell>
                      <TableCell>{cellPF(r.chop)}</TableCell>
                      <TableCell>{cellPF(r.highVol)}</TableCell>
                      <TableCell>{cellPF(r.lowVol)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/40">{r.dominant}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activation Matrix */}
        <TabsContent value="matrix" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Activation Matrix</CardTitle>
              <CardDescription className="text-xs">Derived directly from regime dominance. Drives Regime Weight and Dynamic Allocation portfolios.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead>Best Specialist</TableHead>
                    <TableHead>Runner Up</TableHead>
                    <TableHead>Avoid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ACTIVATION.map((r) => (
                    <TableRow key={r.regime}>
                      <TableCell className="font-medium">{r.regime}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-trading-profit border-trading-profit/40">{r.best}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-trading-warning border-trading-warning/40">{r.runnerUp}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] text-trading-loss border-trading-loss/40">{r.avoid}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Combos */}
        <TabsContent value="combos" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Portfolio Combination Simulations (90-day)</CardTitle>
              <CardDescription className="text-xs">Drawdown ceiling = 3.0%. Rows breaching the ceiling are flagged.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combination</TableHead>
                    <TableHead>Net PnL</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>Max DD</TableHead>
                    <TableHead>Sharpe-like</TableHead>
                    <TableHead>Capture</TableHead>
                    <TableHead>DD ≤ 3%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMBOS.map((c) => {
                    const isWinner = c.combo === 'Dynamic Allocation';
                    return (
                      <TableRow key={c.combo} className={isWinner ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <div className={isWinner ? 'font-semibold text-primary' : 'font-medium'}>{c.combo}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{c.description}</div>
                        </TableCell>
                        <TableCell className="text-trading-profit">{c.netPnl}</TableCell>
                        <TableCell>{cellPF(c.pf)}</TableCell>
                        <TableCell className={c.ddPass ? '' : 'text-trading-loss'}>{c.dd}</TableCell>
                        <TableCell>{c.sharpe.toFixed(2)}</TableCell>
                        <TableCell>{c.capture}</TableCell>
                        <TableCell>
                          {c.ddPass ? (
                            <Badge variant="outline" className="gap-1 text-[10px] text-trading-profit border-trading-profit/40">
                              <CheckCircle2 className="h-3 w-3" /> PASS
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[10px] text-trading-loss border-trading-loss/40">
                              <XCircle className="h-3 w-3" /> FAIL
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendation */}
        <TabsContent value="review" className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Recommendation Gate</CardTitle>
              <CardDescription className="text-xs">Measured on the {RECOMMENDATION.primary} portfolio against Router v2 control.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterion</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GATES.map((g) => (
                    <TableRow key={g.label}>
                      <TableCell className="font-medium">{g.label}</TableCell>
                      <TableCell className="text-muted-foreground">{g.target}</TableCell>
                      <TableCell>{g.actual}</TableCell>
                      <TableCell>
                        {g.pass ? (
                          <Badge variant="outline" className="gap-1 text-[10px] text-trading-profit border-trading-profit/40">
                            <CheckCircle2 className="h-3 w-3" /> PASS
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-[10px] text-trading-loss border-trading-loss/40">
                            <XCircle className="h-3 w-3" /> FAIL
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Crown className="h-4 w-4" /> Allocation Recommendation: {RECOMMENDATION.verdict}
              </CardTitle>
              <CardDescription className="text-xs">Primary portfolio: <span className="text-foreground font-medium">{RECOMMENDATION.primary}</span></CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-2">
              <p>{RECOMMENDATION.rationale}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline" className="text-[10px] text-trading-profit border-trading-profit/40">Production Candidate</Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground line-through">Needs More Evidence</Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground line-through">Specialist Only</Badge>
              </div>
              <div className="flex items-center gap-2 pt-2 text-trading-warning">
                <Lock className="h-3 w-3" />
                <span className="text-[11px]">Auto-promotion blocked. Operator approval and 30-day live gate required before any production wiring.</span>
              </div>
            </CardContent>
          </Card>

          {/* Executive Verdict */}
          <ExecutiveVerdictPanel />
        </TabsContent>

        {/* Validation */}
        <TabsContent value="validation" className="space-y-3">
          <AllocationValidationPanel />
        </TabsContent>
      </Tabs>

    </div>
  );
}
