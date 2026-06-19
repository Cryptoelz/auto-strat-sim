import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Activity, AlertTriangle, CheckCircle2, Crown, Lock, Shield, Sparkles,
  TrendingDown, TrendingUp, Trophy, Swords, Flag, Calendar, Gauge,
  ShieldAlert, HeartPulse, Repeat, ArrowUp, ArrowDown,
} from 'lucide-react';

// ─── Stress Monitor Data ───────────────────────────────────────────────
type StressRow = {
  metric: string;
  champ7: string; chal7: string;
  champ14: string; chal14: string;
  champ30: string; chal30: string;
};
const STRESS_ROWS: StressRow[] = [
  { metric: 'Net PnL',       champ7: '+$842',  chal7: '+$1,012', champ14: '+$1,684', chal14: '+$1,948', champ30: '+$3,884', chal30: '+$4,212' },
  { metric: 'Profit Factor', champ7: '1.88',   chal7: '2.04',    champ14: '1.91',    chal14: '2.02',    champ30: '1.94',    chal30: '2.06' },
  { metric: 'Drawdown',      champ7: '1.4%',   chal7: '1.9%',    champ14: '1.7%',    chal14: '2.0%',    champ30: '1.8%',    chal30: '2.1%' },
  { metric: 'Win Rate',      champ7: '57%',    chal7: '61%',     champ14: '58%',     chal14: '60%',     champ30: '58%',     chal30: '60%' },
  { metric: 'Capture %',     champ7: '74%',    chal7: '79%',     champ14: '75%',     chal14: '78%',     champ30: '76%',     chal30: '78%' },
];
// Leader counts: challenger leads 7d (4/5), 14d (4/5), 30d (4/5) → consistent
const LEAD_WINDOWS = [
  { window: '7d',  leader: 'challenger' as const, wins: 4, total: 5, delta: '+$170' },
  { window: '14d', leader: 'challenger' as const, wins: 4, total: 5, delta: '+$264' },
  { window: '30d', leader: 'challenger' as const, wins: 4, total: 5, delta: '+$328' },
];
const consistentLeader = LEAD_WINDOWS.every(w => w.leader === LEAD_WINDOWS[0].leader);
const avgWinRatio = LEAD_WINDOWS.reduce((s, w) => s + w.wins / w.total, 0) / LEAD_WINDOWS.length;
const LEAD_STABILITY_SCORE = Math.round(consistentLeader ? 60 + (avgWinRatio - 0.5) * 80 : avgWinRatio * 50);

const PERSISTENCE = {
  consecutiveDaysLeading: 5,
  leadChanges: 6,
  largestLeadGained: '+9.2%',
  largestLeadLost: '-3.4%',
  currentLeader: 'Confidence Weighted Allocation',
};

type WarnLevel = 'green' | 'amber' | 'red';
type Warning = { rule: string; reading: string; threshold: string; level: WarnLevel };
const WARNINGS: Warning[] = [
  { rule: 'Leader loses >50% of its lead within 7 days', reading: '-12% lead erosion', threshold: '>50%', level: 'green' },
  { rule: 'Profit Factor drops >15%',                   reading: '-1.0% PF (2.06→2.04)', threshold: '>15%', level: 'green' },
  { rule: 'Drawdown rises >25%',                        reading: '+5% DD drift',         threshold: '>25%', level: 'green' },
  { rule: 'Capture drops >10%',                         reading: '-1.3% capture',        threshold: '>10%', level: 'green' },
];
const worstLevel: WarnLevel = WARNINGS.some(w => w.level === 'red')
  ? 'red' : WARNINGS.some(w => w.level === 'amber') ? 'amber' : 'green';

const CONFIDENCE_30D: 'Low' | 'Moderate' | 'High' =
  LEAD_STABILITY_SCORE >= 75 && worstLevel === 'green' ? 'High'
  : LEAD_STABILITY_SCORE >= 50 && worstLevel !== 'red' ? 'Moderate'
  : 'Low';

// ─── Trial Configuration ───────────────────────────────────────────────
const TRIAL = {
  daysCompleted: 23,
  daysRequired: 60,
  minTradesPerSide: 50,
  champion: 'Dynamic Allocation v1',
  challenger: 'Confidence Weighted Allocation',
  startedAt: '2026-05-27',
};
const daysRemaining = Math.max(0, TRIAL.daysRequired - TRIAL.daysCompleted);
const progressPct = Math.min(100, (TRIAL.daysCompleted / TRIAL.daysRequired) * 100);

// ─── Head-to-Head Metrics ──────────────────────────────────────────────
type Side = 'champion' | 'challenger';
type Metric = {
  label: string;
  champion: number | string;
  challenger: number | string;
  leader: Side;
  format?: 'pct' | 'usd' | 'num';
  better: 'higher' | 'lower';
};
const METRICS: Metric[] = [
  { label: 'Net PnL',           champion: '+$3,884', challenger: '+$4,212', leader: 'challenger', better: 'higher' },
  { label: 'Profit Factor',     champion: 1.94,      challenger: 2.06,      leader: 'challenger', better: 'higher' },
  { label: 'Max Drawdown',      champion: '1.8%',    challenger: '2.1%',    leader: 'champion',   better: 'lower' },
  { label: 'Win Rate',          champion: '58%',     challenger: '60%',     leader: 'challenger', better: 'higher' },
  { label: 'Capture %',         champion: '76%',     challenger: '78%',     leader: 'challenger', better: 'higher' },
  { label: 'Trades / day',      champion: 6.2,       challenger: 5.8,       leader: 'champion',   better: 'higher' },
  { label: 'Sharpe-like Score', champion: 1.84,      challenger: 1.97,      leader: 'challenger', better: 'higher' },
  { label: 'Capital Efficiency',champion: '71%',     challenger: '74%',     leader: 'challenger', better: 'higher' },
];

const championWins = METRICS.filter(m => m.leader === 'champion').length;
const challengerWins = METRICS.filter(m => m.leader === 'challenger').length;
const currentLeader: Side = challengerWins > championWins ? 'challenger' : 'champion';
const leadMargin = (((4212 - 3884) / 3884) * 100).toFixed(1);

// ─── Daily Battle Log ──────────────────────────────────────────────────
type DailyRow = {
  day: number; date: string; winner: Side;
  champPnl: string; chalPnl: string;
  contributor: string; drag: string; regime: string;
};
const DAILY: DailyRow[] = [
  { day: 23, date: '06-19', winner: 'challenger', champPnl: '+$182', chalPnl: '+$214', contributor: 'VCB v1', drag: 'Mean Reversion v1', regime: 'High Volatility' },
  { day: 22, date: '06-18', winner: 'challenger', champPnl: '+$96',  chalPnl: '+$148', contributor: 'Trend Rider v1', drag: 'Momentum Scalper v2', regime: 'Bull Trend' },
  { day: 21, date: '06-17', winner: 'champion',   champPnl: '+$211', chalPnl: '+$178', contributor: 'Momentum Scalper v2', drag: 'VCB v1', regime: 'Sideways' },
  { day: 20, date: '06-16', winner: 'challenger', champPnl: '+$54',  chalPnl: '+$112', contributor: 'VCB v1', drag: 'Mean Reversion v1', regime: 'High Volatility' },
  { day: 19, date: '06-15', winner: 'challenger', champPnl: '-$32',  chalPnl: '+$18',  contributor: 'Trend Rider v1', drag: 'Momentum Scalper v2', regime: 'Bear Trend' },
  { day: 18, date: '06-14', winner: 'champion',   champPnl: '+$166', chalPnl: '+$142', contributor: 'Mean Reversion v1', drag: 'VCB v1', regime: 'Low Volatility' },
  { day: 17, date: '06-13', winner: 'challenger', champPnl: '+$124', chalPnl: '+$201', contributor: 'VCB v1', drag: 'Mean Reversion v1', regime: 'High Volatility' },
];

// ─── Weekly Battle Reports ─────────────────────────────────────────────
const WEEKLY = [
  {
    week: 'Week 4 (in progress)',
    summary: 'Confidence Weighted outperformed Dynamic Allocation by 4.2% this week due to stronger capital concentration during high-volatility sessions led by VCB v1.',
    leader: 'challenger' as Side,
  },
  {
    week: 'Week 3',
    summary: 'Challenger held a narrow 1.6% PnL lead. Capture parity at ~77%. Drawdown drift on Challenger to 2.1% triggered a stability soft-flag.',
    leader: 'challenger' as Side,
  },
  {
    week: 'Week 2',
    summary: 'Dynamic Allocation defended with a 0.9% PnL edge during a sideways regime; Mean Reversion v1 contributions favored the champion.',
    leader: 'champion' as Side,
  },
  {
    week: 'Week 1',
    summary: 'Statistical tie. Both engines shared regime calls. Insufficient trades to draw conclusions.',
    leader: 'champion' as Side,
  },
];

// ─── Stability Monitor ─────────────────────────────────────────────────
type Stability = {
  metric: string;
  champion: string; challenger: string;
  flag: 'OK' | 'Watch' | 'Deteriorating';
};
const STABILITY: Stability[] = [
  { metric: 'PF stability (7d σ)',         champion: '±0.06', challenger: '±0.09', flag: 'Watch' },
  { metric: 'DD stability',                champion: '±0.2%', challenger: '±0.4%', flag: 'Watch' },
  { metric: 'Capture stability',           champion: '±2.1%', challenger: '±2.4%', flag: 'OK' },
  { metric: 'Allocation stability (turnover)', champion: '12%/day', challenger: '19%/day', flag: 'Watch' },
];

// ─── Championship Timeline ─────────────────────────────────────────────
type TimelineEvent = {
  day: number; date: string; type: 'lead-change' | 'equity-high' | 'dd-low' | 'divergence';
  text: string;
};
const TIMELINE: TimelineEvent[] = [
  { day: 23, date: '06-19', type: 'equity-high', text: 'Challenger new equity high: +$4,212 cumulative.' },
  { day: 21, date: '06-17', type: 'lead-change', text: 'Champion briefly retook lead by $33 after sideways session.' },
  { day: 20, date: '06-16', type: 'divergence', text: 'Significant divergence: Challenger +$112 vs Champion +$54 during BTC vol spike.' },
  { day: 17, date: '06-13', type: 'lead-change', text: 'Challenger seized lead after VCB v1 contribution surge.' },
  { day: 12, date: '06-08', type: 'dd-low', text: 'Champion drawdown low: -1.8% peak-to-trough preserved.' },
  { day: 1,  date: '05-27', type: 'lead-change', text: 'Trial opens. Both engines start at $10,000 baseline.' },
];

// ─── Final Promotion Gate ──────────────────────────────────────────────
const GATE = [
  { rule: 'PF ≥ Dynamic Allocation v1 (1.94)',           value: 'Challenger 2.06', pass: true },
  { rule: 'Net PnL > Dynamic Allocation v1 (+$3,884)',   value: 'Challenger +$4,212', pass: true },
  { rule: 'DD ≤ Dynamic Allocation v1 + 0.3% (2.1% cap)', value: 'Challenger 2.1%', pass: true },
  { rule: 'Capture ≥ Dynamic Allocation v1 (76%)',       value: 'Challenger 78%', pass: true },
  { rule: 'No critical health warnings',                  value: '2 watch flags', pass: true },
];
const gatesPassed = GATE.filter(g => g.pass).length;
const wouldPromoteIfFinal = gatesPassed === GATE.length;
const trialComplete = TRIAL.daysCompleted >= TRIAL.daysRequired;
const finalStatus = trialComplete
  ? (wouldPromoteIfFinal ? 'NEW CHAMPION' : 'CHAMPION DEFENDS TITLE')
  : 'TRIAL IN PROGRESS';

// ─── Helpers ───────────────────────────────────────────────────────────
const leaderName = (s: Side) => s === 'champion' ? TRIAL.champion : TRIAL.challenger;

function leaderBadge(s: Side) {
  return s === 'challenger'
    ? <Badge className="bg-primary/15 text-primary border-primary/30"><Sparkles className="h-3 w-3 mr-1" />Challenger</Badge>
    : <Badge className="bg-trading-warning/15 text-trading-warning border-trading-warning/30"><Crown className="h-3 w-3 mr-1" />Champion</Badge>;
}

function flagBadge(f: Stability['flag']) {
  if (f === 'OK') return <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30"><CheckCircle2 className="h-3 w-3 mr-1" />OK</Badge>;
  if (f === 'Watch') return <Badge className="bg-trading-warning/15 text-trading-warning border-trading-warning/30"><AlertTriangle className="h-3 w-3 mr-1" />Watch</Badge>;
  return <Badge className="bg-trading-loss/15 text-trading-loss border-trading-loss/30"><TrendingDown className="h-3 w-3 mr-1" />Deteriorating</Badge>;
}

export default function ChampionTrial() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Governance Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm">
          <Lock className="h-4 w-4 text-primary" />
          <span className="font-semibold text-primary">Research Only · Promotion Disabled</span>
          <span className="text-muted-foreground">
            No Portfolio Manager integration · No live trading · No strategy or allocation modifications · No auto-optimization
          </span>
        </CardContent>
      </Card>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Swords className="h-7 w-7 text-primary" />
          Champion Forward Trial
        </h1>
        <p className="text-muted-foreground mt-1">
          Forward-validation duel: {TRIAL.champion} (current champion) vs {TRIAL.challenger} (challenger).
        </p>
      </div>

      {/* Trophy Card — Current Title Holder */}
      <Card className="border-trading-warning/40 bg-gradient-to-br from-trading-warning/10 via-card to-primary/5">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-full bg-trading-warning/15 flex items-center justify-center border-2 border-trading-warning/40">
                <Trophy className="h-12 w-12 text-trading-warning" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Title Holder</p>
                <h2 className="text-3xl font-bold">{TRIAL.champion}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Defending against <span className="text-primary font-medium">{TRIAL.challenger}</span>
                </p>
              </div>
            </div>
            <div className="text-right space-y-1">
              <Badge className="bg-primary/15 text-primary border-primary/30 text-sm px-3 py-1">
                {finalStatus}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Trial day {TRIAL.daysCompleted} / {TRIAL.daysRequired}
              </p>
              <p className="text-sm">
                Live leader: <span className="font-semibold">{leaderName(currentLeader)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Championship Scoreboard */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Days Completed</CardDescription><CardTitle className="text-2xl">{TRIAL.daysCompleted}</CardTitle></CardHeader>
          <CardContent><Progress value={progressPct} className="h-2" /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Days Remaining</CardDescription><CardTitle className="text-2xl">{daysRemaining}</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Min {TRIAL.minTradesPerSide} trades / side</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Current Leader</CardDescription>
            <CardTitle className="text-lg">{leaderName(currentLeader)}</CardTitle>
          </CardHeader>
          <CardContent>{leaderBadge(currentLeader)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Lead Margin</CardDescription>
            <CardTitle className="text-2xl text-trading-profit">+{leadMargin}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">PnL delta vs champion</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Status</CardDescription>
            <CardTitle className="text-lg">{finalStatus}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {trialComplete ? 'Verdict locked' : 'Trial in progress'}
          </CardContent>
        </Card>
      </div>

      {/* Trial Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4" />Trial Rules</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {[
            'Minimum 60 days',
            `Minimum ${TRIAL.minTradesPerSide} trades per engine`,
            'Same market data',
            'Same asset universe',
            'Same fees (0.10%)',
            'Same slippage (0.075%)',
          ].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-trading-profit shrink-0" />
              <span>{r}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="h2h" className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="h2h">Head-to-Head</TabsTrigger>
          <TabsTrigger value="daily">Daily Battle Log</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Report</TabsTrigger>
          <TabsTrigger value="stability">Stability</TabsTrigger>
          <TabsTrigger value="stress">Stress Monitor</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="h2h" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4" />Head-to-Head Comparison</CardTitle>
              <CardDescription>
                Champion {championWins} · Challenger {challengerWins} (out of {METRICS.length} metrics)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Dynamic Allocation v1</TableHead>
                    <TableHead className="text-right">Confidence Weighted</TableHead>
                    <TableHead>Leader</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {METRICS.map((m) => (
                    <TableRow key={m.label}>
                      <TableCell className="font-medium">{m.label}</TableCell>
                      <TableCell className={`text-right ${m.leader === 'champion' ? 'text-trading-warning font-semibold' : ''}`}>
                        {m.champion}
                      </TableCell>
                      <TableCell className={`text-right ${m.leader === 'challenger' ? 'text-primary font-semibold' : ''}`}>
                        {m.challenger}
                      </TableCell>
                      <TableCell>{leaderBadge(m.leader)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" />Daily Battle Log</CardTitle>
              <CardDescription>Every day recorded · stored in Research Journal</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead className="text-right">Champion PnL</TableHead>
                    <TableHead className="text-right">Challenger PnL</TableHead>
                    <TableHead>Biggest Contributor</TableHead>
                    <TableHead>Biggest Drag</TableHead>
                    <TableHead>Regime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAILY.map((d) => (
                    <TableRow key={d.day}>
                      <TableCell>{d.day}</TableCell>
                      <TableCell className="text-muted-foreground">{d.date}</TableCell>
                      <TableCell>{leaderBadge(d.winner)}</TableCell>
                      <TableCell className={`text-right ${d.champPnl.startsWith('-') ? 'text-trading-loss' : 'text-trading-profit'}`}>{d.champPnl}</TableCell>
                      <TableCell className={`text-right ${d.chalPnl.startsWith('-') ? 'text-trading-loss' : 'text-trading-profit'}`}>{d.chalPnl}</TableCell>
                      <TableCell>{d.contributor}</TableCell>
                      <TableCell className="text-muted-foreground">{d.drag}</TableCell>
                      <TableCell><Badge variant="outline">{d.regime}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 pt-4">
          {WEEKLY.map((w) => (
            <Card key={w.week}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{w.week}</CardTitle>
                  {leaderBadge(w.leader)}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{w.summary}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="stability" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Stability Monitor</CardTitle>
              <CardDescription>Rolling 7-day standard deviation across key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Champion</TableHead>
                    <TableHead className="text-right">Challenger</TableHead>
                    <TableHead>Flag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STABILITY.map((s) => (
                    <TableRow key={s.metric}>
                      <TableCell className="font-medium">{s.metric}</TableCell>
                      <TableCell className="text-right">{s.champion}</TableCell>
                      <TableCell className="text-right">{s.challenger}</TableCell>
                      <TableCell>{flagBadge(s.flag)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground mt-3">
                Challenger shows higher allocation turnover (19%/day vs 12%/day) — flagged for monitoring but not deteriorating.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress" className="space-y-4 pt-4">
          {/* Edge Status Banner */}
          <Card className={
            worstLevel === 'red' ? 'border-trading-loss/40 bg-trading-loss/5'
            : worstLevel === 'amber' ? 'border-trading-warning/40 bg-trading-warning/5'
            : 'border-trading-profit/40 bg-trading-profit/5'
          }>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className={
                    worstLevel === 'red' ? 'h-6 w-6 text-trading-loss'
                    : worstLevel === 'amber' ? 'h-6 w-6 text-trading-warning'
                    : 'h-6 w-6 text-trading-profit'
                  } />
                  <div>
                    <CardTitle className="text-lg">
                      {worstLevel === 'red' ? 'RED · Possible Overfit'
                       : worstLevel === 'amber' ? 'AMBER · Under Review'
                       : 'GREEN · Stable Edge'}
                    </CardTitle>
                    <CardDescription>
                      Forward Validation Stress Monitor · observation-only
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Current Leader: {PERSISTENCE.currentLeader}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Rolling Windows Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" />Rolling Performance Windows</CardTitle>
              <CardDescription>7d / 14d / 30d side-by-side — Dynamic Allocation v1 vs Confidence Weighted</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead rowSpan={2}>Metric</TableHead>
                    <TableHead className="text-center border-l" colSpan={2}>7-Day</TableHead>
                    <TableHead className="text-center border-l" colSpan={2}>14-Day</TableHead>
                    <TableHead className="text-center border-l" colSpan={2}>30-Day</TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead className="text-right border-l text-xs">Dyn v1</TableHead>
                    <TableHead className="text-right text-xs">Conf Wt</TableHead>
                    <TableHead className="text-right border-l text-xs">Dyn v1</TableHead>
                    <TableHead className="text-right text-xs">Conf Wt</TableHead>
                    <TableHead className="text-right border-l text-xs">Dyn v1</TableHead>
                    <TableHead className="text-right text-xs">Conf Wt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {STRESS_ROWS.map((r) => (
                    <TableRow key={r.metric}>
                      <TableCell className="font-medium">{r.metric}</TableCell>
                      <TableCell className="text-right border-l text-muted-foreground">{r.champ7}</TableCell>
                      <TableCell className="text-right text-primary font-semibold">{r.chal7}</TableCell>
                      <TableCell className="text-right border-l text-muted-foreground">{r.champ14}</TableCell>
                      <TableCell className="text-right text-primary font-semibold">{r.chal14}</TableCell>
                      <TableCell className="text-right border-l text-muted-foreground">{r.champ30}</TableCell>
                      <TableCell className="text-right text-primary font-semibold">{r.chal30}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Lead Stability Score + Persistence */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gauge className="h-4 w-4" />Lead Stability Score</CardTitle>
                <CardDescription>100 = consistent across all windows · 0 = unstable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="text-5xl font-bold text-primary">{LEAD_STABILITY_SCORE}</div>
                  <Badge className={
                    LEAD_STABILITY_SCORE >= 75 ? 'bg-trading-profit/15 text-trading-profit border-trading-profit/30'
                    : LEAD_STABILITY_SCORE >= 50 ? 'bg-trading-warning/15 text-trading-warning border-trading-warning/30'
                    : 'bg-trading-loss/15 text-trading-loss border-trading-loss/30'
                  }>
                    {LEAD_STABILITY_SCORE >= 75 ? 'Consistent' : LEAD_STABILITY_SCORE >= 50 ? 'Mixed' : 'Unstable'}
                  </Badge>
                </div>
                <Progress value={LEAD_STABILITY_SCORE} className="h-2" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Window</TableHead>
                      <TableHead>Leader</TableHead>
                      <TableHead className="text-right">Metrics Won</TableHead>
                      <TableHead className="text-right">PnL Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {LEAD_WINDOWS.map((w) => (
                      <TableRow key={w.window}>
                        <TableCell className="font-medium">{w.window}</TableCell>
                        <TableCell>{leaderBadge(w.leader)}</TableCell>
                        <TableCell className="text-right">{w.wins}/{w.total}</TableCell>
                        <TableCell className="text-right text-trading-profit">{w.delta}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Repeat className="h-4 w-4" />Leadership Persistence Tracker</CardTitle>
                <CardDescription>How sticky is the current lead?</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Consecutive Days Leading</p>
                  <p className="text-2xl font-bold mt-1">{PERSISTENCE.consecutiveDaysLeading}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Lead Changes (trial)</p>
                  <p className="text-2xl font-bold mt-1">{PERSISTENCE.leadChanges}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUp className="h-3 w-3 text-trading-profit" />Largest Lead Gained</p>
                  <p className="text-2xl font-bold mt-1 text-trading-profit">{PERSISTENCE.largestLeadGained}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDown className="h-3 w-3 text-trading-loss" />Largest Lead Lost</p>
                  <p className="text-2xl font-bold mt-1 text-trading-loss">{PERSISTENCE.largestLeadLost}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mean Reversion Warning Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Mean Reversion Warning</CardTitle>
              <CardDescription>Detects when current leader's edge may be reverting to the mean</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger Rule</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead className="text-right">Current Reading</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WARNINGS.map((w) => (
                    <TableRow key={w.rule}>
                      <TableCell className="font-medium">{w.rule}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{w.threshold}</TableCell>
                      <TableCell className="text-right">{w.reading}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={
                          w.level === 'red' ? 'bg-trading-loss/15 text-trading-loss border-trading-loss/30'
                          : w.level === 'amber' ? 'bg-trading-warning/15 text-trading-warning border-trading-warning/30'
                          : 'bg-trading-profit/15 text-trading-profit border-trading-profit/30'
                        }>
                          {w.level.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 30-Day Confidence Card */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartPulse className="h-4 w-4" />30-Day Leadership Confidence</CardTitle>
              <CardDescription>
                How confident are we that today's leader remains the leader after another 30 days?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Today's Leader</p>
                  <p className="text-base font-semibold">{PERSISTENCE.currentLeader}</p>
                </div>
                <Badge className={
                  CONFIDENCE_30D === 'High' ? 'bg-trading-profit/15 text-trading-profit border-trading-profit/30 text-sm px-3 py-1'
                  : CONFIDENCE_30D === 'Moderate' ? 'bg-trading-warning/15 text-trading-warning border-trading-warning/30 text-sm px-3 py-1'
                  : 'bg-trading-loss/15 text-trading-loss border-trading-loss/30 text-sm px-3 py-1'
                }>
                  {CONFIDENCE_30D} Confidence
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Derived from Lead Stability Score ({LEAD_STABILITY_SCORE}/100), worst warning level ({worstLevel.toUpperCase()}),
                and {PERSISTENCE.consecutiveDaysLeading} consecutive days of leadership. Observation-only — no allocation or
                strategy changes will be triggered automatically.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Flag className="h-4 w-4" />Championship Timeline</CardTitle>
              <CardDescription>Leadership changes, equity highs, drawdown lows, and divergences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TIMELINE.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 border-l-2 border-border pl-4 pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">Day {e.day} · {e.date}</span>
                        {e.type === 'lead-change' && <Badge variant="outline" className="text-xs"><Swords className="h-3 w-3 mr-1" />Lead Change</Badge>}
                        {e.type === 'equity-high' && <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30 text-xs"><TrendingUp className="h-3 w-3 mr-1" />Equity High</Badge>}
                        {e.type === 'dd-low'      && <Badge className="bg-primary/15 text-primary border-primary/30 text-xs"><TrendingDown className="h-3 w-3 mr-1" />DD Low</Badge>}
                        {e.type === 'divergence'  && <Badge className="bg-trading-warning/15 text-trading-warning border-trading-warning/30 text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Divergence</Badge>}
                      </div>
                      <p className="text-sm mt-1">{e.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Final Promotion Gate */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" />Final Promotion Gate</CardTitle>
          <CardDescription>
            Evaluated after Day 60. Challenger becomes Champion only if ALL conditions pass.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule</TableHead>
                <TableHead>Current Reading</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GATE.map((g) => (
                <TableRow key={g.rule}>
                  <TableCell className="font-medium">{g.rule}</TableCell>
                  <TableCell className="text-muted-foreground">{g.value}</TableCell>
                  <TableCell className="text-right">
                    {g.pass
                      ? <Badge className="bg-trading-profit/15 text-trading-profit border-trading-profit/30"><CheckCircle2 className="h-3 w-3 mr-1" />Pass</Badge>
                      : <Badge className="bg-trading-loss/15 text-trading-loss border-trading-loss/30"><AlertTriangle className="h-3 w-3 mr-1" />Fail</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium">
              Provisional Verdict (Day {TRIAL.daysCompleted}/{TRIAL.daysRequired}):
              <span className="ml-2 text-primary">
                {trialComplete
                  ? finalStatus
                  : `On current track: ${wouldPromoteIfFinal ? 'NEW CHAMPION' : 'CHAMPION DEFENDS TITLE'}`}
              </span>
            </p>
            <p className="text-muted-foreground mt-1">
              {gatesPassed}/{GATE.length} gates currently passing. Verdict locks at Day {TRIAL.daysRequired}.
              No automatic promotion under any circumstance — Promotion Board review required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
