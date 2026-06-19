import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Activity, AlertTriangle, CheckCircle2, Crown, Eye, Lock, Shield,
  TrendingDown, TrendingUp, Trophy, Layers, Radio, Target,
} from 'lucide-react';

// ─── Executive Scorecard (Dynamic Allocation Portfolio, forward window) ────
const SCORECARD = {
  dailyPnl: '+$182',
  weeklyPnl: '+$1,124',
  monthlyPnl: '+$4,612',
  rolling30: '+$4,612',
  currentDd: '1.8%',
  rollingPf: 1.94,
  winRate: '58%',
  trades: 142,
  capture: '76%',
  healthScore: 86,
};

// ─── Strategy Health Monitor ─────────────────────────────────────────
type Health = 'Healthy' | 'Warning' | 'Critical';
type StratRow = {
  name: string;
  pf: number; dd: number; trades: number; hold: string; pnl: string; rank: number;
};
const STRATS: StratRow[] = [
  { name: 'Router v2.1',         pf: 1.84, dd: 2.6, trades: 188, hold: '4h 12m', pnl: '+$3,712', rank: 2 },
  { name: 'Trend Rider v1',      pf: 1.71, dd: 2.9, trades: 96,  hold: '11h 04m', pnl: '+$2,884', rank: 4 },
  { name: 'Mean Reversion v1',   pf: 1.44, dd: 2.5, trades: 124, hold: '2h 18m',  pnl: '+$1,412', rank: 6 },
  { name: 'Momentum Scalper v2', pf: 1.52, dd: 3.1, trades: 162, hold: '38m',     pnl: '+$2,968', rank: 5 },
  { name: 'VCB v1',              pf: 1.66, dd: 3.2, trades: 36,  hold: '6h 42m',  pnl: '+$2,812', rank: 3 },
  { name: 'Dynamic Allocation',  pf: 1.94, dd: 1.8, trades: 142, hold: '3h 22m',  pnl: '+$4,612', rank: 1 },
];

function healthOf(r: StratRow): Health {
  if (r.pf < 1.40 || r.dd > 4) return 'Critical';
  if (r.pf < 1.50 || r.dd > 3) return 'Warning';
  return 'Healthy';
}

function healthBadge(h: Health) {
  if (h === 'Healthy') return <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
  if (h === 'Warning') return <Badge className="bg-trading-warning/15 text-trading-warning border-trading-warning/30"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
  return <Badge className="bg-trading-loss/15 text-trading-loss border-trading-loss/30"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge>;
}

// ─── Dynamic Allocation Monitor ──────────────────────────────────────
const ALLOCATIONS = [
  { name: 'Trend Rider v1',      pct: 28, owner: false },
  { name: 'Mean Reversion v1',   pct: 12, owner: false },
  { name: 'Momentum Scalper v2', pct: 18, owner: false },
  { name: 'VCB v1',              pct: 34, owner: true },
  { name: 'Cash Reserve',        pct:  8, owner: false },
];

const ALLOC_HISTORY = [
  { ts: '2026-06-19 09:00', event: 'VCB v1 raised 26% → 34% (High Vol regime entry)' },
  { ts: '2026-06-18 14:30', event: 'Mean Reversion v1 trimmed 18% → 12% (chop fading)' },
  { ts: '2026-06-17 11:15', event: 'Trend Rider v1 lifted 22% → 28% (bullish HTF confirmed)' },
  { ts: '2026-06-16 08:00', event: 'Momentum Scalper v2 paused (low-vol filter triggered)' },
  { ts: '2026-06-15 16:45', event: 'Regime shift: Sideways → High Volatility' },
];

// ─── Forward Validation Timeline ─────────────────────────────────────
type Evt = { ts: string; type: string; msg: string };
const TIMELINE: Evt[] = [
  { ts: '2026-06-19', type: 'New High',          msg: 'Dynamic Allocation portfolio set new equity high at +$4,612.' },
  { ts: '2026-06-18', type: 'Leadership',        msg: 'VCB v1 overtook Router v2.1 as #2 over rolling 30d.' },
  { ts: '2026-06-17', type: 'Allocation',       msg: 'Capital shifted from Mean Reversion v1 → VCB v1 (+8%).' },
  { ts: '2026-06-16', type: 'Regime',            msg: 'High Volatility regime detected; specialist gating activated.' },
  { ts: '2026-06-15', type: 'Warning',           msg: 'Momentum Scalper v2 PF dipped under 1.55 — placed on watch.' },
  { ts: '2026-06-12', type: 'Drawdown Low',      msg: 'Trend Rider v1 hit -2.9% DD, still below Warning threshold.' },
];

// ─── Rolling Leaderboard ─────────────────────────────────────────────
const LEADERBOARD = [...STRATS].sort((a, b) => b.pf - a.pf);

// ─── Degradation detections ──────────────────────────────────────────
const DEGRADATION = [
  {
    strategy: 'Momentum Scalper v2',
    metric: 'Profit Factor',
    msg: 'Momentum Scalper v2 PF has declined from 1.82 to 1.52 over the last 21 days. Most degradation occurred during low-volatility sessions where signal noise increased.',
    severity: 'Warning' as Health,
  },
  {
    strategy: 'Mean Reversion v1',
    metric: 'Capture %',
    msg: 'Mean Reversion v1 capture % dropped from 42% to 36% over the last 14 days. Reversion windows have shortened as intraday volatility expanded.',
    severity: 'Warning' as Health,
  },
  {
    strategy: 'VCB v1',
    metric: 'Drawdown',
    msg: 'VCB v1 rolling DD climbed from 2.1% to 3.2% over 10 days, driven by two consecutive false breakouts on SOL. Still within Warning band.',
    severity: 'Warning' as Health,
  },
];

// ─── Success Criteria Gate ───────────────────────────────────────────
const GATES = [
  { label: 'Dynamic Allocation PF > 1.90', actual: '1.94', pass: true },
  { label: 'Drawdown < 3%',                actual: '1.8%', pass: true },
  { label: 'Capture > 75%',                actual: '76%',  pass: true },
  { label: 'Outperform Router v2.1 (30d)', actual: '+$900 ahead', pass: true },
];
const CONSECUTIVE_DAYS = 12; // out of 60 required

export default function ForwardValidation() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            Portfolio Manager v2 — Forward Validation
          </h1>
          <p className="text-sm text-muted-foreground">
            Observation-only monitor for the winning specialist ecosystem. No tuning, no promotion, no live capital.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary/15 text-primary border-primary/40"><Radio className="h-3 w-3 mr-1" />Forward Validation</Badge>
          <Badge variant="outline" className="border-trading-warning/40 text-trading-warning"><Lock className="h-3 w-3 mr-1" />Observation Mode</Badge>
        </div>
      </div>

      {/* Banner */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-primary">FORWARD VALIDATION MODE ACTIVE</p>
            <p className="text-muted-foreground mt-1">
              No parameter changes · No auto-optimization · No strategy tuning · No promotions. Isolated from live trading and Portfolio Manager production allocation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scorecard" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="scorecard">Executive Scorecard</TabsTrigger>
          <TabsTrigger value="health">Strategy Health</TabsTrigger>
          <TabsTrigger value="allocation">Allocation Monitor</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="degradation">Degradation</TabsTrigger>
          <TabsTrigger value="criteria">Success Criteria</TabsTrigger>
        </TabsList>

        {/* Executive Scorecard */}
        <TabsContent value="scorecard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { l: 'Daily PnL',         v: SCORECARD.dailyPnl,   t: 'up' },
              { l: 'Weekly PnL',        v: SCORECARD.weeklyPnl,  t: 'up' },
              { l: 'Monthly PnL',       v: SCORECARD.monthlyPnl, t: 'up' },
              { l: 'Rolling 30d PnL',   v: SCORECARD.rolling30,  t: 'up' },
              { l: 'Current Drawdown',  v: SCORECARD.currentDd,  t: 'neutral' },
              { l: 'Rolling PF',        v: SCORECARD.rollingPf.toFixed(2), t: 'up' },
              { l: 'Win Rate',          v: SCORECARD.winRate,    t: 'neutral' },
              { l: 'Trade Count',       v: String(SCORECARD.trades), t: 'neutral' },
              { l: 'Capture %',         v: SCORECARD.capture,    t: 'up' },
              { l: 'Health Score',      v: `${SCORECARD.healthScore}/100`, t: 'up' },
            ].map((c) => (
              <Card key={c.l} className="border-border/50 bg-card/50">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">{c.l}</p>
                  <p className={`text-lg font-bold mt-1 ${c.t === 'up' ? 'text-trading-profit' : ''}`}>{c.v}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" />Portfolio Health Score</CardTitle>
              <CardDescription>Composite of PF, DD, capture, consistency, and degradation flags.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={SCORECARD.healthScore} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {SCORECARD.healthScore}/100 — Strong. Two specialists currently on Watch; no Critical flags.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategy Health */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strategy Health Monitor (Rolling 30d)</CardTitle>
              <CardDescription>WARNING: PF &lt; 1.50 or DD &gt; 3% · CRITICAL: PF &lt; 1.40 or DD &gt; 4%</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PF (30d)</TableHead>
                    <TableHead className="text-right">DD (30d)</TableHead>
                    <TableHead className="text-right">Trades</TableHead>
                    <TableHead className="text-right">Avg Hold</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRATS.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{healthBadge(healthOf(s))}</TableCell>
                      <TableCell className="text-right">{s.pf.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{s.dd.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{s.trades}</TableCell>
                      <TableCell className="text-right">{s.hold}</TableCell>
                      <TableCell className="text-right text-trading-profit">{s.pnl}</TableCell>
                      <TableCell className="text-right">#{s.rank}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Monitor */}
        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" />Current Allocations</CardTitle>
              <CardDescription>Capital owner highlighted. Allocations updated by Dynamic Allocation engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ALLOCATIONS.map((a) => (
                <div key={a.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      {a.owner && <Crown className="h-3.5 w-3.5 text-trading-warning" />}
                      {a.name}
                    </span>
                    <span className="font-mono">{a.pct}%</span>
                  </div>
                  <Progress value={a.pct} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Allocation History</CardTitle>
              <CardDescription>Recent capital shifts and regime-driven rebalances.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ALLOC_HISTORY.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-primary/30 pl-3 py-1">
                    <span className="text-xs text-muted-foreground font-mono w-32 shrink-0">{h.ts}</span>
                    <span>{h.event}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Forward Validation Timeline</CardTitle>
              <CardDescription>Events also recorded in the Research Journal.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {TIMELINE.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-border pl-3 py-1.5">
                    <span className="text-xs text-muted-foreground font-mono w-24 shrink-0">{e.ts}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{e.type}</Badge>
                    <span className="text-muted-foreground">{e.msg}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4" />Rolling Leaderboard</CardTitle>
              <CardDescription>Ranked by Profit Factor. Weekly leadership rotations tracked in timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">DD</TableHead>
                    <TableHead className="text-right">Sharpe~</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEADERBOARD.map((s, i) => {
                    const sharpe = (s.pf * 0.9 - s.dd * 0.15).toFixed(2);
                    const cap = s.name === 'Dynamic Allocation' ? '76%'
                      : s.name === 'Router v2.1' ? '65%'
                      : s.name === 'VCB v1' ? '67%'
                      : s.name === 'Trend Rider v1' ? '64%'
                      : s.name === 'Momentum Scalper v2' ? '58%' : '38%';
                    return (
                      <TableRow key={s.name}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">{s.pf.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-trading-profit">{s.pnl}</TableCell>
                        <TableCell className="text-right">{s.dd.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{sharpe}</TableCell>
                        <TableCell className="text-right">{cap}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Degradation */}
        <TabsContent value="degradation" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4" />Degradation Detection Engine</CardTitle>
              <CardDescription>Automatic detection of falling PF, rising DD, reduced capture, and reduced win rate.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEGRADATION.map((d, i) => (
                <div key={i} className="rounded-md border border-border/60 p-3 bg-card/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{d.strategy}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">{d.metric}</Badge>
                      {healthBadge(d.severity)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{d.msg}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Success Criteria */}
        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Promotion Success Criteria</CardTitle>
              <CardDescription>All 4 gates must remain satisfied for 60 consecutive days to trigger a Promotion Board recommendation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterion</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {GATES.map((g) => (
                    <TableRow key={g.label}>
                      <TableCell>{g.label}</TableCell>
                      <TableCell className="text-right font-mono">{g.actual}</TableCell>
                      <TableCell className="text-right">
                        {g.pass
                          ? <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30">PASS</Badge>
                          : <Badge className="bg-trading-loss/15 text-trading-loss border-trading-loss/30">FAIL</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Consecutive days all gates passed</span>
                  <span className="font-mono">{CONSECUTIVE_DAYS} / 60</span>
                </div>
                <Progress value={(CONSECUTIVE_DAYS / 60) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {CONSECUTIVE_DAYS >= 60
                    ? 'Eligible — promotion recommendation generated for Promotion Board review.'
                    : `Not yet eligible. ${60 - CONSECUTIVE_DAYS} more clean days required. No promotion will be issued automatically.`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-trading-warning/30 bg-trading-warning/5">
            <CardContent className="p-4 flex items-start gap-3 text-sm">
              <Lock className="h-4 w-4 text-trading-warning mt-0.5" />
              <p className="text-muted-foreground">
                Observation Mode Lock is engaged. This page cannot modify parameters, allocations, or production strategy state.
                Any promotion recommendation requires explicit human approval at the Promotion Review Board.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
