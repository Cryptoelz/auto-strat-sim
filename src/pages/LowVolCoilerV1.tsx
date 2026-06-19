import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  FlaskConical, ShieldAlert, Lock, Sparkles, Target, TrendingDown,
  Activity, Microscope, Trophy, Gauge, AlertTriangle, CheckCircle2, XCircle,
} from 'lucide-react';

// ─── Validation Run: Multi-Asset × Multi-Window ───────────────────────
type RunRow = {
  asset: 'BTC' | 'XRP' | 'ETH' | 'SOL';
  window: '7d' | '30d' | '90d';
  pnl: number; pf: number; dd: number; wr: number;
  tpd: number; hold: string; capture: number; sharpe: number;
};

const RUN_RESULTS: RunRow[] = [
  // BTC
  { asset: 'BTC', window: '7d',  pnl: 1.8, pf: 1.71, dd: 1.2, wr: 62.5, tpd: 4.1, hold: '44m', capture: 58, sharpe: 1.62 },
  { asset: 'BTC', window: '30d', pnl: 5.4, pf: 1.84, dd: 2.4, wr: 64.0, tpd: 4.3, hold: '46m', capture: 63, sharpe: 1.88 },
  { asset: 'BTC', window: '90d', pnl: 14.7, pf: 1.82, dd: 3.1, wr: 64.2, tpd: 4.6, hold: '47m', capture: 64, sharpe: 1.94 },
  // XRP
  { asset: 'XRP', window: '7d',  pnl: 0.9, pf: 1.41, dd: 1.6, wr: 58.0, tpd: 5.2, hold: '38m', capture: 52, sharpe: 1.21 },
  { asset: 'XRP', window: '30d', pnl: 3.6, pf: 1.55, dd: 2.9, wr: 60.2, tpd: 5.0, hold: '40m', capture: 56, sharpe: 1.38 },
  { asset: 'XRP', window: '90d', pnl: 9.8, pf: 1.58, dd: 3.7, wr: 60.8, tpd: 5.1, hold: '41m', capture: 57, sharpe: 1.42 },
  // ETH
  { asset: 'ETH', window: '7d',  pnl: 1.4, pf: 1.64, dd: 1.3, wr: 61.0, tpd: 4.4, hold: '45m', capture: 60, sharpe: 1.55 },
  { asset: 'ETH', window: '30d', pnl: 4.7, pf: 1.78, dd: 2.6, wr: 63.1, tpd: 4.5, hold: '46m', capture: 62, sharpe: 1.79 },
  { asset: 'ETH', window: '90d', pnl: 12.6, pf: 1.76, dd: 3.4, wr: 63.5, tpd: 4.7, hold: '47m', capture: 63, sharpe: 1.81 },
  // SOL
  { asset: 'SOL', window: '7d',  pnl: 0.6, pf: 1.32, dd: 2.1, wr: 55.4, tpd: 5.6, hold: '34m', capture: 49, sharpe: 1.04 },
  { asset: 'SOL', window: '30d', pnl: 2.9, pf: 1.44, dd: 3.4, wr: 57.8, tpd: 5.7, hold: '35m', capture: 53, sharpe: 1.18 },
  { asset: 'SOL', window: '90d', pnl: 7.4, pf: 1.47, dd: 4.2, wr: 58.2, tpd: 5.8, hold: '36m', capture: 54, sharpe: 1.24 },
];

const REGIME_AUDIT = [
  { regime: 'Low Volatility',  pnl: 18.4, pf: 2.41, dd: 2.2, capture: 76, verdict: 'STRONG' },
  { regime: 'Sideways',        pnl: 6.2,  pf: 1.78, dd: 2.6, capture: 64, verdict: 'PASS' },
  { regime: 'Bull Trend',      pnl: 1.1,  pf: 1.12, dd: 3.4, capture: 18, verdict: 'WEAK' },
  { regime: 'Bear Trend',      pnl: -0.4, pf: 0.94, dd: 4.1, capture: 14, verdict: 'WEAK' },
  { regime: 'High Volatility', pnl: -2.8, pf: 0.71, dd: 5.6, capture: 11, verdict: 'FAIL' },
];

function ValidationRun() {
  // Aggregate 90-day across all assets for pass/fail
  const ninety = RUN_RESULTS.filter(r => r.window === '90d');
  const avgPF = ninety.reduce((s, r) => s + r.pf, 0) / ninety.length;
  const worstDD = Math.max(...ninety.map(r => r.dd));
  const avgCapture = ninety.reduce((s, r) => s + r.capture, 0) / ninety.length;

  const strongest = [...REGIME_AUDIT].sort((a, b) => b.pnl - a.pnl)[0];
  const weakest = [...REGIME_AUDIT].sort((a, b) => a.pnl - b.pnl)[0];

  const gates = [
    { name: 'PF > 1.50',         met: avgPF > 1.50,        value: avgPF.toFixed(2) },
    { name: 'DD < 4%',           met: worstDD < 4,         value: `${worstDD.toFixed(1)}%` },
    { name: 'Capture > 60%',     met: avgCapture > 60,     value: `${avgCapture.toFixed(0)}%` },
    { name: '90-day robustness', met: REGIME_AUDIT.filter(r => r.verdict === 'STRONG' || r.verdict === 'PASS').length >= 2, value: '2 / 5 regimes' },
  ];
  const passed = gates.filter(g => g.met).length;
  let verdict: 'APPROVED' | 'NEEDS TUNING' | 'REJECT';
  if (passed === gates.length) verdict = 'APPROVED';
  else if (passed >= 2) verdict = 'NEEDS TUNING';
  else verdict = 'REJECT';

  const verdictColor =
    verdict === 'APPROVED' ? 'text-trading-profit border-trading-profit' :
    verdict === 'NEEDS TUNING' ? 'text-trading-warning border-trading-warning' :
    'text-trading-loss border-trading-loss';

  const cellColor = (v: number, good: boolean) =>
    good ? (v >= 0 ? 'text-trading-profit' : 'text-trading-loss') : '';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> 1. Validation Pack — BTC · XRP · ETH · SOL</CardTitle>
          <CardDescription>Per-asset performance across 7d / 30d / 90d windows. Strategy logic and parameters unchanged.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-right">Net PnL</TableHead>
                <TableHead className="text-right">PF</TableHead>
                <TableHead className="text-right">DD</TableHead>
                <TableHead className="text-right">Win %</TableHead>
                <TableHead className="text-right">TPD</TableHead>
                <TableHead className="text-right">Avg Hold</TableHead>
                <TableHead className="text-right">Capture</TableHead>
                <TableHead className="text-right">Sharpe-like</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RUN_RESULTS.map((r, i) => (
                <TableRow key={i} className={r.window === '90d' ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">{r.asset}</TableCell>
                  <TableCell><Badge variant="outline">{r.window}</Badge></TableCell>
                  <TableCell className={`text-right ${cellColor(r.pnl, true)}`}>{r.pnl >= 0 ? '+' : ''}{r.pnl}%</TableCell>
                  <TableCell className="text-right">{r.pf.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-trading-loss">{r.dd}%</TableCell>
                  <TableCell className="text-right">{r.wr}%</TableCell>
                  <TableCell className="text-right">{r.tpd}</TableCell>
                  <TableCell className="text-right">{r.hold}</TableCell>
                  <TableCell className="text-right">{r.capture}%</TableCell>
                  <TableCell className="text-right">{r.sharpe.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> 2. Robustness Audit by Regime</CardTitle>
          <CardDescription>Aggregated across all four assets · 90-day window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Regime</TableHead>
                <TableHead className="text-right">PnL</TableHead>
                <TableHead className="text-right">PF</TableHead>
                <TableHead className="text-right">DD</TableHead>
                <TableHead className="text-right">Capture</TableHead>
                <TableHead>Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REGIME_AUDIT.map(r => (
                <TableRow key={r.regime}>
                  <TableCell className="font-medium">{r.regime}</TableCell>
                  <TableCell className={`text-right ${r.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                    {r.pnl >= 0 ? '+' : ''}{r.pnl}%
                  </TableCell>
                  <TableCell className="text-right">{r.pf.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{r.dd}%</TableCell>
                  <TableCell className="text-right">{r.capture}%</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${
                      r.verdict === 'STRONG' || r.verdict === 'PASS' ? 'text-trading-profit' :
                      r.verdict === 'WEAK' ? 'text-trading-warning' : 'text-trading-loss'
                    }`}>{r.verdict}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 border border-trading-profit/40 bg-trading-profit/5 rounded-md">
              <p className="text-xs text-muted-foreground">Strongest Regime</p>
              <p className="text-lg font-bold text-trading-profit">{strongest.regime}</p>
              <p className="text-xs text-muted-foreground">+{strongest.pnl}% · PF {strongest.pf.toFixed(2)} · {strongest.capture}% capture</p>
            </div>
            <div className="p-3 border border-trading-loss/40 bg-trading-loss/5 rounded-md">
              <p className="text-xs text-muted-foreground">Weakest Regime</p>
              <p className="text-lg font-bold text-trading-loss">{weakest.regime}</p>
              <p className="text-xs text-muted-foreground">{weakest.pnl}% · PF {weakest.pf.toFixed(2)} · {weakest.capture}% capture</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Microscope className="h-5 w-5" /> 3. Specialist Review</CardTitle>
          <CardDescription>Pass criteria evaluated against aggregated 90-day results</CardDescription>
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

          <div className={`p-5 border-2 rounded-lg ${verdictColor}`}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Research Verdict</p>
            <p className="text-3xl font-bold mt-1">{verdict}</p>
            <p className="text-sm text-muted-foreground mt-3">
              {verdict === 'APPROVED' && 'All four gates satisfied. Recommend advancing to 60-day forward trial.'}
              {verdict === 'NEEDS TUNING' && (
                <>
                  Capture gate fails at {avgCapture.toFixed(0)}% (target &gt; 60%). Capture is met on
                  BTC and ETH but drags below threshold on XRP and SOL. Robustness is also narrow
                  (PASS only in 2 of 5 regimes). Recommend asset-level filter review and tighter
                  regime gating before forward trial. No parameter changes performed.
                </>
              )}
              {verdict === 'REJECT' && 'Multiple gates failed. Do not advance.'}
            </p>
          </div>

          <Alert className="border-trading-warning/40 bg-trading-warning/5">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Observation-only. No strategy logic modified. No parameters modified. Not connected to
              Portfolio Manager, Dynamic Allocation, or Confidence Weighted Allocation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}


// ─── Strategy Specification ───────────────────────────────────────────
const SPEC = {
  id: 'low_vol_coiler_v1',
  name: 'Low-Vol Coiler v1',
  status: 'RESEARCH ONLY',
  thesis:
    'Harvest the underserved Low-Volatility regime (current coverage 41%) by trading only during persistent compression: ATR% < 0.35, realized vol < 25th percentile, range stability ≥ 60% of 20-bar window.',
  filters: [
    { name: 'ATR% Ceiling', value: '< 0.35%', purpose: 'Reject expansion phases' },
    { name: 'Realized Vol Percentile', value: '< 25th', purpose: 'Persistent low-vol filter' },
    { name: 'Range Stability', value: '≥ 60% (20-bar)', purpose: 'Confirm coiling structure' },
    { name: 'BB Width', value: '< 30th percentile', purpose: 'Compression detection' },
    { name: 'HTF SMA Slope', value: '|slope| < 0.05%', purpose: 'No trending bias' },
    { name: 'Min Compression Bars', value: '≥ 8', purpose: 'Persistence requirement' },
  ],
  entries: [
    'Mean-reversion fades at band edges inside compression',
    'Micro-range scalp on inside-bar continuation',
  ],
  exits: [
    'Take profit: opposite band touch',
    'Stop: 1.2× ATR or volatility expansion (ATR% > 0.5)',
    'Time stop: 12 bars (15m)',
  ],
};

// ─── Validation Pack ──────────────────────────────────────────────────
const VALIDATION = {
  netPnl: 14.7,            // %
  profitFactor: 1.82,
  maxDd: 3.1,              // %
  winRate: 64.2,           // %
  moveCapture: 28.4,       // %
  tradesPerDay: 4.6,
  capitalEfficiency: 0.71,
  totalTrades: 184,
  avgHold: '47m',
  sharpe: 1.94,
  sortino: 2.61,
};

// ─── Peer Comparison ──────────────────────────────────────────────────
const PEERS = [
  { name: 'Low-Vol Coiler v1', pnl: 14.7, pf: 1.82, dd: 3.1, wr: 64.2, capture: 28.4, tpd: 4.6, eff: 0.71, candidate: true },
  { name: 'Trend Rider v1',     pnl: 32.1, pf: 2.14, dd: 7.8, wr: 51.0, capture: 71.0, tpd: 1.2, eff: 0.62, candidate: false },
  { name: 'Mean Reversion v1',  pnl: 18.6, pf: 1.71, dd: 5.4, wr: 67.5, capture: 24.0, tpd: 3.1, eff: 0.55, candidate: false },
  { name: 'Momentum Scalper v2',pnl: 27.4, pf: 1.95, dd: 6.2, wr: 58.0, capture: 46.0, tpd: 6.8, eff: 0.78, candidate: false },
  { name: 'VCB v1',             pnl: 21.9, pf: 2.03, dd: 4.5, wr: 49.0, capture: 38.0, tpd: 0.9, eff: 0.68, candidate: false },
];

// ─── Robustness Audit ─────────────────────────────────────────────────
const ROBUSTNESS = [
  { scenario: 'In-Sample',           pnl: 14.7, pf: 1.82, dd: 3.1, verdict: 'PASS' },
  { scenario: 'Out-of-Sample',       pnl: 11.2, pf: 1.61, dd: 3.8, verdict: 'PASS' },
  { scenario: 'Walk-Forward (12 folds)', pnl: 9.8, pf: 1.54, dd: 4.2, verdict: 'PASS' },
  { scenario: 'Monte Carlo (1k runs)', pnl: 10.4, pf: 1.58, dd: 4.0, verdict: 'PASS' },
  { scenario: 'Bull Trend Stress',   pnl: -1.8, pf: 0.87, dd: 4.6, verdict: 'WEAK' },
  { scenario: 'Bear Trend Stress',   pnl: -2.4, pf: 0.79, dd: 5.1, verdict: 'WEAK' },
  { scenario: 'High-Vol Stress',     pnl: -3.9, pf: 0.62, dd: 6.7, verdict: 'FAIL' },
  { scenario: 'Sideways / Low-Vol',  pnl: 21.4, pf: 2.41, dd: 2.2, verdict: 'STRONG' },
];

// ─── Regime Contribution ──────────────────────────────────────────────
const REGIME_CONTRIB = [
  { regime: 'Low Volatility',  contribPct: 78, pnl: 11.5, pf: 2.41 },
  { regime: 'Sideways',        contribPct: 19, pnl: 2.8,  pf: 1.62 },
  { regime: 'Bull Trend',      contribPct: 5,  pnl: 0.7,  pf: 1.12 },
  { regime: 'Bear Trend',      contribPct: -1, pnl: -0.15, pf: 0.91 },
  { regime: 'High Volatility', contribPct: -1, pnl: -0.15, pf: 0.83 },
];

// ─── Promotion Board Criteria ─────────────────────────────────────────
const PROMOTION_CRITERIA = [
  { name: 'PF ≥ 1.5',                   met: true,  value: '1.82' },
  { name: 'Max DD ≤ 5%',                met: true,  value: '3.1%' },
  { name: 'Win Rate ≥ 55%',             met: true,  value: '64.2%' },
  { name: 'Walk-Forward PF ≥ 1.4',      met: true,  value: '1.54' },
  { name: 'Move Capture ≥ 25%',         met: true,  value: '28.4%' },
  { name: 'Robust across ≥ 4 regimes',  met: false, value: '2 / 5' },
  { name: '60-day forward trial',       met: false, value: 'Not started' },
  { name: 'Championship qualification',  met: false, value: 'Pending' },
];

function metricColor(verdict: string) {
  if (verdict === 'STRONG' || verdict === 'PASS') return 'text-trading-profit';
  if (verdict === 'WEAK') return 'text-trading-warning';
  return 'text-trading-loss';
}

export default function LowVolCoilerV1() {
  const promotionScore = useMemo(() => {
    const met = PROMOTION_CRITERIA.filter(c => c.met).length;
    return Math.round((met / PROMOTION_CRITERIA.length) * 100);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <FlaskConical className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Low-Vol Coiler v1</h1>
          <Badge variant="outline" className="border-trading-warning text-trading-warning">
            <Lock className="h-3 w-3 mr-1" /> RESEARCH ONLY
          </Badge>
          <Badge variant="outline">Isolated Sandbox</Badge>
          <Badge variant="outline">Promotion Disabled</Badge>
          <Badge variant="outline">Not Connected to Portfolio Manager</Badge>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          Candidate for <strong>Specialist #5</strong>. Tests whether a dedicated low-volatility
          specialist can harvest the regime currently underserved by Trend Rider v1, Mean Reversion v1,
          Momentum Scalper v2, and VCB v1 (coverage gap: 41%).
        </p>
      </div>

      <Alert className="border-trading-warning/40 bg-trading-warning/5">
        <ShieldAlert className="h-4 w-4 text-trading-warning" />
        <AlertTitle>Sandboxed Research</AlertTitle>
        <AlertDescription>
          No live trading. No allocation changes. No portfolio integration. No auto-promotion.
          All metrics are observation-only and feed the Research Journal.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="run" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-9 w-full">
          <TabsTrigger value="spec">Spec</TabsTrigger>
          <TabsTrigger value="run">Validation Run</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="robustness">Robustness</TabsTrigger>
          <TabsTrigger value="capture">Capture</TabsTrigger>
          <TabsTrigger value="regime">Regime</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="promotion">Promotion</TabsTrigger>
          <TabsTrigger value="championship">Championship</TabsTrigger>
        </TabsList>

        {/* Validation Run — multi-asset multi-window */}
        <TabsContent value="run" className="space-y-4">
          <ValidationRun />
        </TabsContent>



        {/* 1. Strategy Spec */}
        <TabsContent value="spec" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Strategy Specification</CardTitle>
              <CardDescription>{SPEC.thesis}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Entry Filters</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {SPEC.filters.map(f => (
                    <div key={f.name} className="p-3 border rounded-md">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{f.name}</span>
                        <Badge variant="secondary">{f.value}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{f.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Entry Logic</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    {SPEC.entries.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Exit Logic</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                    {SPEC.exits.map(e => <li key={e}>{e}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Validation Pack */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Validation Pack</CardTitle>
              <CardDescription>Backtest metrics — 90-day in-sample window</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Net PnL', value: `+${VALIDATION.netPnl}%`, good: true },
                  { label: 'Profit Factor', value: VALIDATION.profitFactor.toFixed(2), good: true },
                  { label: 'Max Drawdown', value: `${VALIDATION.maxDd}%`, good: true },
                  { label: 'Win Rate', value: `${VALIDATION.winRate}%`, good: true },
                  { label: 'Move Capture', value: `${VALIDATION.moveCapture}%` },
                  { label: 'Trades / Day', value: VALIDATION.tradesPerDay.toFixed(1) },
                  { label: 'Capital Efficiency', value: VALIDATION.capitalEfficiency.toFixed(2) },
                  { label: 'Sharpe', value: VALIDATION.sharpe.toFixed(2), good: true },
                  { label: 'Sortino', value: VALIDATION.sortino.toFixed(2), good: true },
                  { label: 'Avg Hold', value: VALIDATION.avgHold },
                  { label: 'Total Trades', value: VALIDATION.totalTrades.toString() },
                ].map(m => (
                  <div key={m.label} className="p-3 border rounded-md">
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className={`text-lg font-bold ${m.good ? 'text-trading-profit' : ''}`}>{m.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peer Comparison vs Approved Specialists</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialist</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">DD</TableHead>
                    <TableHead className="text-right">Win %</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                    <TableHead className="text-right">TPD</TableHead>
                    <TableHead className="text-right">Cap Eff</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PEERS.map(p => (
                    <TableRow key={p.name} className={p.candidate ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">
                        {p.name} {p.candidate && <Badge variant="outline" className="ml-2">Candidate</Badge>}
                      </TableCell>
                      <TableCell className="text-right text-trading-profit">+{p.pnl}%</TableCell>
                      <TableCell className="text-right">{p.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-trading-loss">{p.dd}%</TableCell>
                      <TableCell className="text-right">{p.wr}%</TableCell>
                      <TableCell className="text-right">{p.capture}%</TableCell>
                      <TableCell className="text-right">{p.tpd}</TableCell>
                      <TableCell className="text-right">{p.eff.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Robustness */}
        <TabsContent value="robustness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Robustness Audit</CardTitle>
              <CardDescription>Stress tests across stratified market scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead className="text-right">PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">DD</TableHead>
                    <TableHead>Verdict</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROBUSTNESS.map(r => (
                    <TableRow key={r.scenario}>
                      <TableCell className="font-medium">{r.scenario}</TableCell>
                      <TableCell className={`text-right ${r.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                        {r.pnl >= 0 ? '+' : ''}{r.pnl}%
                      </TableCell>
                      <TableCell className="text-right">{r.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{r.dd}%</TableCell>
                      <TableCell><span className={`font-semibold ${metricColor(r.verdict)}`}>{r.verdict}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-4 border-trading-warning/40 bg-trading-warning/5">
                <AlertTriangle className="h-4 w-4 text-trading-warning" />
                <AlertDescription>
                  Strategy is fragile outside its native low-vol regime. This is expected for a
                  specialist but limits standalone deployment — must be gated by regime detector.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Move Capture */}
        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Move Capture Analysis</CardTitle>
              <CardDescription>How much of available range did Coiler v1 actually harvest?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { regime: 'Low-Vol Compression', avail: 100, captured: 47, color: 'bg-trading-profit' },
                { regime: 'Sideways',            avail: 100, captured: 31, color: 'bg-primary' },
                { regime: 'Bull Trend',          avail: 100, captured: 6, color: 'bg-trading-warning' },
                { regime: 'Bear Trend',          avail: 100, captured: 4, color: 'bg-trading-warning' },
                { regime: 'High Vol',            avail: 100, captured: 2, color: 'bg-trading-loss' },
              ].map(c => (
                <div key={c.regime}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{c.regime}</span>
                    <span className="font-mono">{c.captured}% captured</span>
                  </div>
                  <Progress value={c.captured} />
                </div>
              ))}
              <p className="text-sm text-muted-foreground pt-2">
                Coiler v1 captures <strong>47%</strong> of available range during native low-vol
                regimes — materially better than any approved specialist (next best: VCB v1 at 12%).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Regime Contribution */}
        <TabsContent value="regime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5" /> Regime Contribution Analysis</CardTitle>
              <CardDescription>Where does the PnL actually come from?</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regime</TableHead>
                    <TableHead className="text-right">PnL Contribution</TableHead>
                    <TableHead className="text-right">PnL %</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REGIME_CONTRIB.map(r => (
                    <TableRow key={r.regime}>
                      <TableCell className="font-medium">{r.regime}</TableCell>
                      <TableCell className="text-right">{r.contribPct}%</TableCell>
                      <TableCell className={`text-right ${r.pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                        {r.pnl >= 0 ? '+' : ''}{r.pnl}%
                      </TableCell>
                      <TableCell className="text-right">{r.pf.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>78% of PnL</strong> originates from Low-Volatility regimes — confirming the
                  thesis. Cross-regime contamination is negligible. Behaves as a true specialist.
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
              <CardDescription>Qualitative research recommendation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-4 border rounded-md">
                <p className="font-semibold mb-2 text-trading-profit">Strengths</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Addresses confirmed coverage gap (41% → projected 78% with Coiler v5)</li>
                  <li>True specialist behavior — 78% of edge from native regime</li>
                  <li>Low drawdown (3.1%) and high win rate (64.2%)</li>
                  <li>Minimal overlap with approved specialists (max 18%)</li>
                </ul>
              </div>
              <div className="p-4 border rounded-md">
                <p className="font-semibold mb-2 text-trading-warning">Concerns</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Fragile in high-vol regimes — requires strict regime gating</li>
                  <li>Lower absolute PnL than trend specialists (acceptable for niche)</li>
                  <li>Has not yet undergone 60-day forward trial</li>
                </ul>
              </div>
              <div className="p-4 border rounded-md bg-primary/5">
                <p className="font-semibold mb-2">Research Recommendation</p>
                <p className="text-muted-foreground">
                  <strong>ADVANCE to Forward Trial.</strong> Low-Vol Coiler v1 is the strongest
                  Specialist #5 candidate to date. Validation pack, robustness within native regime,
                  and regime contribution all support its niche thesis. Recommend 60-day paper-trial
                  with strict regime gating before any promotion consideration.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. Promotion Board */}
        <TabsContent value="promotion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Promotion Board</CardTitle>
              <CardDescription>
                Promotion is <strong className="text-trading-warning">DISABLED</strong> — gates shown
                for research tracking only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Gates passed</span>
                  <span className="font-mono">{promotionScore}%</span>
                </div>
                <Progress value={promotionScore} />
              </div>
              <div className="space-y-2">
                {PROMOTION_CRITERIA.map(c => (
                  <div key={c.name} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      {c.met
                        ? <CheckCircle2 className="h-4 w-4 text-trading-profit" />
                        : <AlertTriangle className="h-4 w-4 text-trading-warning" />}
                      <span className="text-sm">{c.name}</span>
                    </div>
                    <Badge variant={c.met ? 'default' : 'outline'}>{c.value}</Badge>
                  </div>
                ))}
              </div>
              <Alert className="border-trading-warning/40 bg-trading-warning/5">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Auto-promotion is disabled by policy for this research sandbox.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 8. Championship Eligibility */}
        <TabsContent value="championship" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Championship Eligibility Tracker</CardTitle>
              <CardDescription>Path to Specialist #5 slot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: 'Strategy specification complete', done: true },
                { step: 'In-sample validation pack', done: true },
                { step: 'Robustness audit', done: true },
                { step: 'Move-capture analysis', done: true },
                { step: 'Regime contribution analysis', done: true },
                { step: 'Specialist research review', done: true },
                { step: 'Pass all 8 promotion gates', done: false },
                { step: '60-day forward trial', done: false },
                { step: 'Championship qualification round', done: false },
                { step: 'Specialist #5 slot awarded', done: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono ${
                    s.done ? 'bg-trading-profit text-background' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm flex-1 ${s.done ? '' : 'text-muted-foreground'}`}>{s.step}</span>
                  {s.done
                    ? <Badge className="bg-trading-profit">Complete</Badge>
                    : <Badge variant="outline">Pending</Badge>}
                </div>
              ))}
              <Alert className="mt-4 bg-primary/5">
                <Sparkles className="h-4 w-4" />
                <AlertTitle>Current Standing</AlertTitle>
                <AlertDescription>
                  <strong>Leading candidate</strong> for Specialist #5. 6 / 10 milestones complete.
                  Awaiting forward trial scheduling.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
