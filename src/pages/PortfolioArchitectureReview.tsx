import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2, Lock, Layers, Cpu, Workflow, Shield, Radar, CheckCircle2,
  AlertTriangle, TrendingUp, Activity, Zap, Compass, FlaskConical, Network, GitBranch,
} from 'lucide-react';

type Layer = {
  n: number;
  name: string;
  icon: any;
  components: string[];
  status: 'READY' | 'OBSERVED' | 'MATURE';
  note: string;
};

const layers: Layer[] = [
  { n: 1, name: 'Market Regime Detection', icon: Radar,
    components: ['HTF SMA Slope', 'ATR Volatility Bands', 'BB Width', 'Trend Strength Index'],
    status: 'MATURE', note: 'Classifies Bull / Bear / Sideways / High-Vol / Low-Vol on every closed candle.' },
  { n: 2, name: 'Specialist Selection', icon: Network,
    components: ['Router v2.1', 'Confidence Scoring', 'Regime-fit Matrix'],
    status: 'READY', note: 'Maps detected regime to the best-fit approved specialist.' },
  { n: 3, name: 'Allocation Engine', icon: Layers,
    components: ['Dynamic Allocation', 'Confidence-Weighted Sizing', 'Exposure Caps'],
    status: 'READY', note: 'Adaptive 70/30 baseline, tilts by conviction and regime fit.' },
  { n: 4, name: 'Execution Engine', icon: Cpu,
    components: ['Unified Trading Engine', '1-Candle Confirmation', 'Slippage 0.075% / Fees 0.1%'],
    status: 'MATURE', note: 'Deterministic close-only execution with realistic frictions.' },
  { n: 5, name: 'Risk Controls', icon: Shield,
    components: ['Asset Risk Profiles', 'Profit Protection', 'Drawdown Guardrails', 'Governance States'],
    status: 'MATURE', note: 'Breakeven at +2%, 1% trailing stop, 3% session DD ceiling.' },
];

type Regime = 'Bull Trend' | 'Bear Trend' | 'Sideways' | 'High Volatility' | 'Low Volatility';

const heatmap: { regime: Regime; primary: string; secondary: string; strength: number; icon: any }[] = [
  { regime: 'Bull Trend',      primary: 'Trend Rider v1',      secondary: 'Momentum Scalper v2', strength: 92, icon: TrendingUp },
  { regime: 'Bear Trend',      primary: 'VCB v1',              secondary: 'Momentum Scalper v2', strength: 86, icon: Compass },
  { regime: 'Sideways',        primary: 'Mean Reversion v1',   secondary: 'Low-Vol Coiler v2',   strength: 88, icon: Activity },
  { regime: 'High Volatility', primary: 'Momentum Scalper v2', secondary: 'VCB v1',              strength: 90, icon: Zap },
  { regime: 'Low Volatility',  primary: 'Low-Vol Coiler v2',   secondary: 'Mean Reversion v1',   strength: 89, icon: FlaskConical },
];

const dependencyRisks = [
  { label: 'Single Point of Failure (Low-Vol)',  level: 'Low',    score: 18, note: 'Mean Reversion v1 provides 34% backup coverage in Low Volatility.' },
  { label: 'Single Point of Failure (High-Vol)', level: 'Low',    score: 22, note: 'VCB v1 provides 38% backup coverage in High Volatility.' },
  { label: 'Overlap Concentration (Sideways)',   level: 'Medium', score: 41, note: 'Mean Reversion v1 and Low-Vol Coiler v2 both index strongly to Sideways.' },
  { label: 'Overlap Concentration (Bull)',       level: 'Low',    score: 24, note: 'Trend Rider v1 clearly dominates; Momentum Scalper v2 only partial overlap.' },
  { label: 'Redundancy Score',                   level: 'High',   score: 78, note: 'Every regime has at least one credible secondary specialist (target ≥ 70).' },
];

const opportunities = [
  { tier: 'Not Needed',   items: ['Sixth generalist specialist', 'Second Bull-trend specialist', 'Additional Sideways agent'] },
  { tier: 'Optional',     items: ['News-event filter overlay', 'Regime-transition smoother', 'Cross-asset correlation guard'] },
  { tier: 'High Priority',items: ['Multi-asset stress tests for Low-Vol Coiler v2', 'Long-horizon (180d) forward observation harness'] },
];

const readiness = { layers: 96, coverage: 89, redundancy: 78, diversity: 84 };
const composite = Math.round(
  0.30 * readiness.layers + 0.30 * readiness.coverage + 0.20 * readiness.redundancy + 0.20 * readiness.diversity,
);

function statusColor(s: Layer['status']) {
  return s === 'MATURE'
    ? 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit'
    : s === 'READY'
    ? 'border-primary/40 bg-primary/10 text-primary'
    : 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning';
}

function strengthBand(v: number) {
  if (v >= 85) return { label: 'STRONG', cls: 'border-trading-profit/40 bg-trading-profit/10 text-trading-profit' };
  if (v >= 70) return { label: 'COVERED', cls: 'border-primary/40 bg-primary/10 text-primary' };
  return { label: 'PARTIAL', cls: 'border-trading-warning/40 bg-trading-warning/10 text-trading-warning' };
}

function riskColor(level: string) {
  return level === 'Low'
    ? 'text-trading-profit'
    : level === 'Medium'
    ? 'text-trading-warning'
    : level === 'High'
    ? 'text-trading-profit' // high redundancy = good
    : 'text-trading-loss';
}

export default function PortfolioArchitectureReview() {
  const verdict =
    composite >= 90
      ? { label: 'Architecture Mature',     tone: 'profit' as const, text: 'All five layers operational and resilient. Roster, coverage, and controls meet executive-grade thresholds. Approved for long-term observation and operational testing.' }
      : composite >= 80
      ? { label: 'Architecture Ready',      tone: 'primary' as const,text: 'Layers operational with adequate coverage and diversity. Begin long-term observation and continue monitoring redundancy.' }
      : { label: 'Architecture Incomplete', tone: 'warning' as const,text: 'One or more layers require additional reinforcement before long-term observation begins.' };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Portfolio Architecture Review</h1>
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Lock className="mr-1 h-3 w-3" /> Observation Only
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Executive review of the 5-layer trading architecture. No strategy, parameter, or allocation changes.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Layer Maturity</p>
          <p className="mt-1 text-2xl font-bold">{readiness.layers}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Coverage Strength</p>
          <p className="mt-1 text-2xl font-bold">{readiness.coverage}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Redundancy</p>
          <p className="mt-1 text-2xl font-bold">{readiness.redundancy}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Composite Score</p>
          <p className="mt-1 text-2xl font-bold text-trading-profit">{composite}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="structure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="heatmap">Coverage Heat Map</TabsTrigger>
          <TabsTrigger value="dependency">Dependency Risk</TabsTrigger>
          <TabsTrigger value="expansion">Future Expansion</TabsTrigger>
          <TabsTrigger value="verdict">Executive Verdict</TabsTrigger>
        </TabsList>

        {/* Structure */}
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Structure</CardTitle>
              <CardDescription>Five operational layers, each with components and maturity status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {layers.map((l) => {
                const Icon = l.icon;
                return (
                  <div key={l.n} className="flex gap-4 rounded-md border border-border/60 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">LAYER {l.n}</span>
                          <span className="font-semibold">{l.name}</span>
                        </div>
                        <Badge variant="outline" className={statusColor(l.status)}>{l.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{l.note}</p>
                      <div className="flex flex-wrap gap-1">
                        {l.components.map((c) => (
                          <Badge key={c} variant="outline" className="border-border/60 bg-muted/30 text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heat map */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Coverage Heat Map</CardTitle>
              <CardDescription>Primary and secondary specialists per regime, with coverage strength.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead>Primary Specialist</TableHead>
                    <TableHead>Secondary</TableHead>
                    <TableHead>Strength</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmap.map((r) => {
                    const band = strengthBand(r.strength);
                    const Icon = r.icon;
                    return (
                      <TableRow key={r.regime}>
                        <TableCell>
                          <div className="flex items-center gap-2 font-medium">
                            <Icon className="h-4 w-4 text-primary" />
                            {r.regime}
                          </div>
                        </TableCell>
                        <TableCell>{r.primary}</TableCell>
                        <TableCell className="text-muted-foreground">{r.secondary}</TableCell>
                        <TableCell className="w-[200px]">
                          <div className="flex items-center gap-2">
                            <Progress value={r.strength} className="h-2 flex-1" />
                            <span className="w-10 text-right text-xs font-mono">{r.strength}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={band.cls}>{band.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dependency risk */}
        <TabsContent value="dependency">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Dependency Risk</CardTitle>
              <CardDescription>
                Single-point failures, overlap concentration, and roster-wide redundancy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dependencyRisks.map((d) => (
                <div key={d.label} className="rounded-md border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.label}</span>
                    <Badge variant="outline" className={`${riskColor(d.level)} border-border/60 bg-muted/30`}>
                      {d.level}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>
                  <Progress value={d.score} className="mt-2 h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expansion */}
        <TabsContent value="expansion">
          <div className="grid gap-4 md:grid-cols-3">
            {opportunities.map((o) => {
              const tone =
                o.tier === 'High Priority'
                  ? 'border-trading-warning/40 bg-trading-warning/5'
                  : o.tier === 'Optional'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/60 bg-muted/20';
              const icon =
                o.tier === 'High Priority' ? <AlertTriangle className="h-4 w-4 text-trading-warning" />
                : o.tier === 'Optional'     ? <GitBranch className="h-4 w-4 text-primary" />
                : <CheckCircle2 className="h-4 w-4 text-trading-profit" />;
              return (
                <Card key={o.tier} className={tone}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">{icon} {o.tier}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {o.items.map((i) => (
                        <li key={i} className="flex gap-2">
                          <Workflow className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{i}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Verdict */}
        <TabsContent value="verdict" className="space-y-4">
          <Alert
            className={
              verdict.tone === 'profit'
                ? 'border-trading-profit/40 bg-trading-profit/5'
                : verdict.tone === 'primary'
                ? 'border-primary/40 bg-primary/5'
                : 'border-trading-warning/40 bg-trading-warning/5'
            }
          >
            {verdict.tone === 'profit'
              ? <CheckCircle2 className="h-5 w-5 text-trading-profit" />
              : verdict.tone === 'primary'
              ? <Shield className="h-5 w-5 text-primary" />
              : <AlertTriangle className="h-5 w-5 text-trading-warning" />}
            <AlertTitle className="text-base font-semibold">{verdict.label}</AlertTitle>
            <AlertDescription className="mt-1 text-sm">{verdict.text}</AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Rationale</CardTitle>
              <CardDescription>Plain-English summary of the architecture's posture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                All five layers report at least READY status, with Regime Detection, Execution Engine, and
                Risk Controls assessed MATURE. Coverage strength averages{' '}
                <span className="font-semibold">{readiness.coverage}</span> across the five regimes, every
                regime has a credible secondary, and roster redundancy is{' '}
                <span className="font-semibold">{readiness.redundancy}</span>.
              </p>
              <p>
                Composite architecture score is <span className="font-semibold">{composite}</span>, placing the
                portfolio in the "{verdict.label}" band. Highest-priority follow-ups are multi-asset stress
                tests for Low-Vol Coiler v2 and a long-horizon forward observation harness.
              </p>
              <p className="text-muted-foreground">
                Observation-only output. No promotions, parameter tuning, allocation changes, or Portfolio
                Manager integration are issued from this review.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
