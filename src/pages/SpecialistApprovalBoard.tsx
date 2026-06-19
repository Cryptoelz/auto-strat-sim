import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ShieldCheck, Users, Layers, Sparkles, Gauge, CheckCircle2, AlertTriangle,
  Lock, TrendingUp, TrendingDown, Activity, Compass, Zap, FlaskConical,
} from 'lucide-react';

type Specialist = {
  id: string;
  name: string;
  icon: any;
  netPnl: number;
  pf: number;
  dd: number;
  winRate: number;
  capture: number;
  dominant: string;
  status: 'APPROVED' | 'OBSERVATION';
};

const specialists: Specialist[] = [
  { id: 'tr1',  name: 'Trend Rider v1',       icon: TrendingUp,  netPnl: 22.4, pf: 1.94, dd: 3.6, winRate: 54, capture: 71, dominant: 'Bull Trend',     status: 'APPROVED' },
  { id: 'mr1',  name: 'Mean Reversion v1',    icon: Activity,    netPnl: 16.8, pf: 1.71, dd: 3.2, winRate: 61, capture: 63, dominant: 'Sideways',       status: 'APPROVED' },
  { id: 'ms2',  name: 'Momentum Scalper v2',  icon: Zap,         netPnl: 19.1, pf: 1.66, dd: 3.9, winRate: 52, capture: 68, dominant: 'High Volatility',status: 'APPROVED' },
  { id: 'vcb1', name: 'VCB v1',               icon: Compass,     netPnl: 17.5, pf: 1.78, dd: 3.4, winRate: 56, capture: 66, dominant: 'Bear Trend',     status: 'APPROVED' },
  { id: 'lvc2', name: 'Low-Vol Coiler v2',    icon: FlaskConical,netPnl: 15.9, pf: 1.74, dd: 3.7, winRate: 58, capture: 64, dominant: 'Low Volatility', status: 'APPROVED' },
];

const regimes = ['Bull Trend', 'Bear Trend', 'Sideways', 'High Volatility', 'Low Volatility'];

// Specialist contribution % to each regime (rows = specialist, cols = regime)
const coverage: Record<string, Record<string, number>> = {
  tr1:  { 'Bull Trend': 72, 'Bear Trend': 10, 'Sideways': 18, 'High Volatility': 31, 'Low Volatility': 14 },
  mr1:  { 'Bull Trend': 12, 'Bear Trend': 18, 'Sideways': 68, 'High Volatility': 14, 'Low Volatility': 34 },
  ms2:  { 'Bull Trend': 28, 'Bear Trend': 22, 'Sideways': 12, 'High Volatility': 74, 'Low Volatility':  8 },
  vcb1: { 'Bull Trend': 18, 'Bear Trend': 64, 'Sideways': 22, 'High Volatility': 38, 'Low Volatility': 16 },
  lvc2: { 'Bull Trend':  9, 'Bear Trend': 11, 'Sideways': 26, 'High Volatility':  7, 'Low Volatility': 78 },
};

const diversity: Record<string, number> = {
  tr1: 84, mr1: 81, ms2: 88, vcb1: 79, lvc2: 86,
};

function regimeCoverage(regime: string) {
  const sum = specialists.reduce((s, sp) => s + (coverage[sp.id][regime] || 0), 0);
  const top = [...specialists].sort((a, b) => coverage[b.id][regime] - coverage[a.id][regime])[0];
  return { sum, leader: top.name, leaderShare: coverage[top.id][regime] };
}

function coverageBand(sum: number): { label: string; color: string } {
  if (sum >= 110) return { label: 'STRONG', color: 'text-trading-profit border-trading-profit/40 bg-trading-profit/10' };
  if (sum >= 80)  return { label: 'COVERED', color: 'text-primary border-primary/40 bg-primary/10' };
  if (sum >= 50)  return { label: 'PARTIAL', color: 'text-trading-warning border-trading-warning/40 bg-trading-warning/10' };
  return { label: 'GAP', color: 'text-trading-loss border-trading-loss/40 bg-trading-loss/10' };
}

export default function SpecialistApprovalBoard() {
  const avgDiversity = Math.round(
    Object.values(diversity).reduce((a, b) => a + b, 0) / Object.values(diversity).length,
  );

  const regimeRows = regimes.map((r) => ({ regime: r, ...regimeCoverage(r) }));
  const gaps = regimeRows.filter((r) => r.sum < 80);
  const strong = regimeRows.filter((r) => r.sum >= 110).length;

  // Portfolio Readiness composite (0-100)
  const readiness = Math.round(
    0.35 * avgDiversity +
    0.45 * (regimeRows.reduce((s, r) => s + Math.min(100, r.sum * 0.9), 0) / regimes.length) +
    0.20 * (specialists.length * 20), // 5 specialists -> 100
  );

  const recommendation =
    gaps.length === 0 && readiness >= 85
      ? { tone: 'profit', label: 'Specialist Roster Complete',  text: 'All five market regimes have a primary specialist with adequate diversity. Roster is ready for long-term observation.' }
      : gaps.length > 0
      ? { tone: 'loss',    label: 'Coverage Gap Detected',       text: `Coverage shortfall identified in: ${gaps.map(g => g.regime).join(', ')}. Investigate before declaring roster complete.` }
      : { tone: 'warning', label: 'Additional Specialist Needed',text: 'Roster coverage is adequate but diversity or readiness is below target. Consider a sixth specialist for resilience.' };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Specialist Approval Board</h1>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Lock className="mr-1 h-3 w-3" /> Observation Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Executive review of the five approved specialists. No strategy, parameter, or allocation changes.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved Specialists</p>
                <p className="mt-1 text-2xl font-bold">{specialists.length} / 5</p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Regimes Strongly Covered</p>
                <p className="mt-1 text-2xl font-bold">{strong} / {regimes.length}</p>
              </div>
              <Layers className="h-5 w-5 text-trading-profit" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Diversity Score</p>
                <p className="mt-1 text-2xl font-bold">{avgDiversity}</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Portfolio Readiness</p>
                <p className="mt-1 text-2xl font-bold">{readiness}</p>
              </div>
              <Gauge className="h-5 w-5 text-trading-profit" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="roster" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roster">Roster</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Map</TabsTrigger>
          <TabsTrigger value="diversity">Diversity</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
        </TabsList>

        {/* Roster */}
        <TabsContent value="roster">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Roster</CardTitle>
              <CardDescription>Full performance card for each approved specialist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialist</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                    <TableHead>Dominant Regime</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialists.map((s) => {
                    const Icon = s.icon;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            {s.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-trading-profit">+{s.netPnl}%</TableCell>
                        <TableCell className="text-right">{s.pf.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-trading-loss">{s.dd}%</TableCell>
                        <TableCell className="text-right">{s.winRate}%</TableCell>
                        <TableCell className="text-right">{s.capture}%</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                            {s.dominant}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-trading-profit/15 text-trading-profit hover:bg-trading-profit/20">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage map */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Coverage Map</CardTitle>
              <CardDescription>
                Cells show each specialist's relative contribution (%) inside each regime.
                Column totals indicate combined coverage strength.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialist</TableHead>
                    {regimes.map((r) => (
                      <TableHead key={r} className="text-right">{r}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialists.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      {regimes.map((r) => {
                        const v = coverage[s.id][r];
                        const intense = v >= 60 ? 'bg-trading-profit/20 text-trading-profit'
                          : v >= 30 ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground';
                        return (
                          <TableCell key={r} className={`text-right ${intense}`}>{v}%</TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-semibold">Combined</TableCell>
                    {regimeRows.map((r) => {
                      const band = coverageBand(r.sum);
                      return (
                        <TableCell key={r.regime} className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-semibold">{r.sum}%</span>
                            <Badge variant="outline" className={`text-[10px] ${band.color}`}>{band.label}</Badge>
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overlaps & Gaps</CardTitle>
              <CardDescription>Where specialists reinforce each other and where coverage is thin.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {regimeRows.map((r) => {
                const band = coverageBand(r.sum);
                return (
                  <div key={r.regime} className="rounded-md border border-border/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.regime}</span>
                      <Badge variant="outline" className={band.color}>{band.label}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Primary: <span className="text-foreground">{r.leader}</span> ({r.leaderShare}%) · Combined {r.sum}%
                    </p>
                    <Progress value={Math.min(100, r.sum)} className="mt-2 h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diversity */}
        <TabsContent value="diversity">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Diversity Score</CardTitle>
              <CardDescription>
                How distinct each specialist's behaviour is versus the rest of the roster (higher = more unique).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {specialists.map((s) => {
                const score = diversity[s.id];
                return (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="font-mono">{score}</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                );
              })}
              <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                Roster average diversity: <span className="font-semibold">{avgDiversity}</span> / 100 — target ≥ 75.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Readiness */}
        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Readiness Score</CardTitle>
              <CardDescription>Composite of coverage breadth, diversity, and roster size.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border/60 p-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Readiness</p>
                    <p className="text-4xl font-bold text-trading-profit">{readiness}</p>
                  </div>
                  <Badge variant="outline" className="border-trading-profit/40 bg-trading-profit/10 text-trading-profit">
                    {readiness >= 85 ? 'READY' : readiness >= 70 ? 'NEARLY READY' : 'NOT READY'}
                  </Badge>
                </div>
                <Progress value={readiness} className="mt-3 h-2" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Coverage component</p>
                  <p className="text-xl font-semibold">
                    {Math.round(regimeRows.reduce((s, r) => s + Math.min(100, r.sum * 0.9), 0) / regimes.length)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Weighted 45%</p>
                </div>
                <div className="rounded-md border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Diversity component</p>
                  <p className="text-xl font-semibold">{avgDiversity}</p>
                  <p className="text-[11px] text-muted-foreground">Weighted 35%</p>
                </div>
                <div className="rounded-md border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Roster size component</p>
                  <p className="text-xl font-semibold">{specialists.length * 20}</p>
                  <p className="text-[11px] text-muted-foreground">Weighted 20%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendation */}
        <TabsContent value="recommendation">
          <Alert
            className={
              recommendation.tone === 'profit'
                ? 'border-trading-profit/40 bg-trading-profit/5'
                : recommendation.tone === 'loss'
                ? 'border-trading-loss/40 bg-trading-loss/5'
                : 'border-trading-warning/40 bg-trading-warning/5'
            }
          >
            {recommendation.tone === 'profit' ? (
              <CheckCircle2 className="h-5 w-5 text-trading-profit" />
            ) : recommendation.tone === 'loss' ? (
              <TrendingDown className="h-5 w-5 text-trading-loss" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-trading-warning" />
            )}
            <AlertTitle className="text-base font-semibold">{recommendation.label}</AlertTitle>
            <AlertDescription className="mt-1 text-sm">{recommendation.text}</AlertDescription>
          </Alert>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Decision Rationale</CardTitle>
              <CardDescription>Plain-English summary of the board's findings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                Five specialists are approved, each with a distinct dominant regime: Bull Trend, Sideways,
                High Volatility, Bear Trend, and Low Volatility.
              </p>
              <p>
                Combined coverage is <span className="font-semibold">{strong}</span> regime(s) STRONG and
                {' '}<span className="font-semibold">{gaps.length}</span> regime(s) below the partial threshold.
                Average diversity is <span className="font-semibold">{avgDiversity}</span> and overall readiness is
                {' '}<span className="font-semibold">{readiness}</span>.
              </p>
              <p className="text-muted-foreground">
                Observation-only output. No promotions, parameter tuning, or allocation changes are issued from
                this board.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
