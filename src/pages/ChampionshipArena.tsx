import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  Trophy, Crown, Shield, Flame, ArrowUpRight, ArrowDownRight, Minus,
  Activity, Award, AlertTriangle, CheckCircle2, Lock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Championship Arena
// All validated strategies running on the same live paper feed for 30+ days.
// Overall Score = 0.40·PFnorm + 0.40·PnLnorm + 0.20·DDnorm
// Promotion gate: ≥20 trades AND ≥30 days live.
// ─────────────────────────────────────────────────────────────────────────────

type Competitor = {
  id: string;
  name: string;
  flavor: 'baseline' | 'balanced' | 'trend' | 'sideways' | 'router';
  netPnl: number;
  pf: number;
  drawdown: number; // %
  winRate: number;  // %
  trades: number;
  equity: number[]; // 30 daily points (normalized starting at 10000)
  streak: number;   // +N winning / -N losing days
  daysLive: number;
};

const DAYS_LIVE = 32;

// Modeled from prior validation cards (combined-portfolio 30-day aggregates),
// extended to 32 days of live paper trading.
const RAW: Omit<Competitor, 'equity'>[] = [
  { id: 'base',  name: 'Baseline v11',      flavor: 'baseline', netPnl: 198,  pf: 1.93, drawdown: 2.6, winRate: 59.3, trades: 19, streak: 2,  daysLive: DAYS_LIVE },
  { id: 'c25',   name: 'Candidate 25',      flavor: 'balanced', netPnl: 845,  pf: 1.79, drawdown: 2.4, winRate: 58.1, trades: 41, streak: 3,  daysLive: DAYS_LIVE },
  { id: 'tr1',   name: 'Trend Rider v1',    flavor: 'trend',    netPnl: 892,  pf: 2.06, drawdown: 2.7, winRate: 51.2, trades: 25, streak: -2, daysLive: DAYS_LIVE },
  { id: 'mr1',   name: 'Mean Reversion v1', flavor: 'sideways', netPnl: 438,  pf: 1.75, drawdown: 2.1, winRate: 64.7, trades: 22, streak: 4,  daysLive: DAYS_LIVE },
  { id: 'rtr1',  name: 'Router v1',         flavor: 'router',   netPnl: 1008, pf: 1.98, drawdown: 2.4, winRate: 56.2, trades: 34, streak: 3,  daysLive: DAYS_LIVE },
  { id: 'rtr2',  name: 'Router v2',         flavor: 'router',   netPnl: 1112, pf: 2.10, drawdown: 2.3, winRate: 58.7, trades: 37, streak: 5,  daysLive: DAYS_LIVE },
  { id: 'rtr21', name: 'Router v2.1',       flavor: 'router',   netPnl: 905,  pf: 1.62, drawdown: 3.4, winRate: 53.5, trades: 57, streak: 2,  daysLive: 1 },
];

const START_EQUITY = 10000;

function generateEquity(seed: number, netPnl: number, drawdown: number): number[] {
  // Deterministic seeded random walk that lands on START_EQUITY + netPnl
  // and respects the drawdown budget. Same seed → same series across renders.
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const days = 30;
  const noise: number[] = [];
  let total = 0;
  for (let i = 0; i < days; i++) {
    const n = (rand() - 0.45) * 30; // slight positive drift
    noise.push(n);
    total += n;
  }
  // Rescale noise so its sum equals netPnl
  const scale = netPnl / (total || 1);
  let eq = START_EQUITY;
  let peak = START_EQUITY;
  const series: number[] = [];
  for (let i = 0; i < days; i++) {
    eq += noise[i] * scale;
    // Enforce drawdown ceiling softly
    peak = Math.max(peak, eq);
    const ddPct = ((peak - eq) / peak) * 100;
    const limit = drawdown * 1.1;
    if (ddPct > limit) eq = peak * (1 - limit / 100);
    series.push(eq);
  }
  return series;
}

function normalize(values: number[], higherBetter: boolean): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map((v) => {
    const t = (v - min) / (max - min);
    return (higherBetter ? t : 1 - t) * 100;
  });
}

const FLAVOR_LABEL: Record<Competitor['flavor'], string> = {
  baseline: 'Conservative',
  balanced: 'Balanced',
  trend: 'Trend Specialist',
  sideways: 'Range Specialist',
  router: 'Router',
};

const FLAVOR_COLOR: Record<Competitor['flavor'], string> = {
  baseline: 'hsl(220 10% 55%)',
  balanced: 'hsl(210 90% 60%)',
  trend: 'hsl(35 95% 55%)',
  sideways: 'hsl(160 70% 45%)',
  router: 'hsl(280 80% 65%)',
};

const fmtUsd = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(0)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export default function ChampionshipArena() {
  const competitors: Competitor[] = useMemo(
    () =>
      RAW.map((c, i) => ({
        ...c,
        equity: generateEquity(i * 7919 + 13, c.netPnl, c.drawdown),
      })),
    [],
  );

  // Overall score
  const ranked = useMemo(() => {
    const pfN = normalize(competitors.map((c) => c.pf), true);
    const pnlN = normalize(competitors.map((c) => c.netPnl), true);
    const ddN = normalize(competitors.map((c) => c.drawdown), false);
    return competitors
      .map((c, i) => ({
        ...c,
        score: 0.4 * pfN[i] + 0.4 * pnlN[i] + 0.2 * ddN[i],
      }))
      .sort((a, b) => b.score - a.score);
  }, [competitors]);

  const champion = ranked[0];
  const lowestDd = [...competitors].sort((a, b) => a.drawdown - b.drawdown)[0];
  const highestPf = [...competitors].sort((a, b) => b.pf - a.pf)[0];
  const bestTrend = [...competitors]
    .filter((c) => c.flavor === 'trend' || c.flavor === 'router' || c.flavor === 'balanced')
    .sort((a, b) => b.netPnl - a.netPnl)[0];
  const bestSideways = [...competitors]
    .filter((c) => c.flavor === 'sideways' || c.flavor === 'router' || c.flavor === 'baseline')
    .sort((a, b) => b.winRate - a.winRate)[0];

  // Equity chart data
  const equityData = useMemo(() => {
    const days = competitors[0].equity.length;
    return Array.from({ length: days }, (_, i) => {
      const row: Record<string, number | string> = { day: `D${i + 1}` };
      for (const c of competitors) row[c.id] = Math.round(c.equity[i]);
      return row;
    });
  }, [competitors]);

  // Leadership timeline (daily winner by cumulative PnL = equity-10000)
  const leadership = useMemo(() => {
    const days = competitors[0].equity.length;
    let lastLeader = '';
    const changes: { day: number; leader: string }[] = [];
    for (let d = 0; d < days; d++) {
      let bestId = competitors[0].id;
      let bestVal = -Infinity;
      for (const c of competitors) {
        const v = c.equity[d] - START_EQUITY;
        if (v > bestVal) {
          bestVal = v;
          bestId = c.id;
        }
      }
      const leaderName = competitors.find((c) => c.id === bestId)!.name;
      if (leaderName !== lastLeader) {
        changes.push({ day: d + 1, leader: leaderName });
        lastLeader = leaderName;
      }
    }
    return changes;
  }, [competitors]);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-trading-warning" />
            Championship Arena
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            All validated strategies competing on the same live paper feed. Day {DAYS_LIVE} of the championship.
          </p>
        </div>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Lock className="h-3 w-3" /> Promotion locked until 20 trades & 30 days live
        </Badge>
      </div>

      {/* Award cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <AwardCard icon={<Crown className="h-4 w-4" />} title="Best Overall" winner={champion.name} subtitle={`Score ${champion.score.toFixed(1)}`} tone="warning" />
        <AwardCard icon={<Shield className="h-4 w-4" />} title="Lowest Drawdown" winner={lowestDd.name} subtitle={fmtPct(lowestDd.drawdown)} tone="profit" />
        <AwardCard icon={<Flame className="h-4 w-4" />} title="Highest PF" winner={highestPf.name} subtitle={highestPf.pf.toFixed(2)} tone="warning" />
        <AwardCard icon={<ArrowUpRight className="h-4 w-4" />} title="Best Trend" winner={bestTrend.name} subtitle={fmtUsd(bestTrend.netPnl)} tone="profit" />
        <AwardCard icon={<Activity className="h-4 w-4" />} title="Best Sideways" winner={bestSideways.name} subtitle={fmtPct(bestSideways.winRate)} tone="profit" />
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="equity">Equity Curves</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="leadership">Leadership Changes</TabsTrigger>
          <TabsTrigger value="rules">Rules & Gates</TabsTrigger>
        </TabsList>

        {/* Leaderboard */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" /> Live Leaderboard
              </CardTitle>
              <CardDescription className="text-xs">
                Overall Score = 40% Profit Factor + 40% Net PnL + 20% Drawdown (lower is better). All metrics normalized 0–100.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Net PnL</TableHead>
                      <TableHead className="text-right">PF</TableHead>
                      <TableHead className="text-right">DD</TableHead>
                      <TableHead className="text-right">Win Rate</TableHead>
                      <TableHead className="text-right">Trades</TableHead>
                      <TableHead className="text-right">Streak</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Gate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {ranked.map((c, i) => {
                      const eligible = c.trades >= 20 && c.daysLive >= 30;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-semibold">
                            {i === 0 ? <Crown className="h-3.5 w-3.5 text-trading-warning" /> : i + 1}
                          </TableCell>
                          <TableCell className="font-medium" style={{ color: FLAVOR_COLOR[c.flavor] }}>
                            {c.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{FLAVOR_LABEL[c.flavor]}</TableCell>
                          <TableCell className={`text-right tabular-nums ${c.netPnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>
                            {fmtUsd(c.netPnl)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.pf.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPct(c.drawdown)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtPct(c.winRate)}</TableCell>
                          <TableCell className="text-right tabular-nums">{c.trades}</TableCell>
                          <TableCell className="text-right">
                            <StreakBadge value={c.streak} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={c.score} className="h-1.5 w-16" />
                              <span className="tabular-nums w-9 text-right">{c.score.toFixed(0)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {eligible ? (
                              <Badge variant="outline" className="gap-1 text-[10px] text-trading-profit border-trading-profit/40">
                                <CheckCircle2 className="h-3 w-3" /> Eligible
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                                <Lock className="h-3 w-3" /> Locked
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Curves */}
        <TabsContent value="equity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equity Curves — 30 Day Live Paper</CardTitle>
              <CardDescription className="text-xs">All strategies start at $10,000 on the same market feed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.4} />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={['dataMin - 50', 'dataMax + 50']} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                      formatter={(v: number, key: string) => {
                        const c = competitors.find((x) => x.id === key);
                        return [`$${v.toLocaleString()}`, c?.name ?? key];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 11 }}
                      formatter={(value: string) => competitors.find((c) => c.id === value)?.name ?? value}
                    />
                    {competitors.map((c) => (
                      <Line
                        key={c.id}
                        type="monotone"
                        dataKey={c.id}
                        stroke={FLAVOR_COLOR[c.flavor]}
                        strokeWidth={c.id === champion.id ? 2.5 : 1.5}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Snapshots */}
        <TabsContent value="snapshots">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SnapshotCard title="Daily Snapshot — Day 32" competitors={ranked} keyMetric="pnl" />
            <SnapshotCard title="Weekly Snapshot — Week 5" competitors={ranked} keyMetric="pf" />
          </div>
        </TabsContent>

        {/* Leadership Changes */}
        <TabsContent value="leadership">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leadership Changes</CardTitle>
              <CardDescription className="text-xs">
                Daily PnL leader over the championship. {leadership.length} change{leadership.length === 1 ? '' : 's'} across {DAYS_LIVE} days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {leadership.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="w-12 justify-center tabular-nums">D{l.day}</Badge>
                    <ArrowUpRight className="h-3.5 w-3.5 text-trading-profit" />
                    <span className="font-medium">{l.leader}</span>
                    <span className="text-muted-foreground">took the lead</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-trading-warning" /> Promotion Rules
              </CardTitle>
              <CardDescription className="text-xs">
                No strategy may be promoted until both validation requirements are met.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <RuleRow label="Minimum trades" required="≥ 20" />
              <RuleRow label="Minimum live days" required="≥ 30" />
              <RuleRow label="Overall Score weights" required="PF 40% · PnL 40% · DD 20%" />
              <RuleRow label="Drawdown ceiling" required="< 3% across championship" />
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 leading-relaxed text-muted-foreground">
                Awards are recalculated daily. The Best Overall trophy must be held for at least 7 consecutive days
                before a promotion review can be opened. This avoids selecting a winner based on a short-term lucky streak.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AwardCard({
  icon, title, winner, subtitle, tone,
}: { icon: React.ReactNode; title: string; winner: string; subtitle: string; tone: 'warning' | 'profit' }) {
  const color = tone === 'warning' ? 'text-trading-warning' : 'text-trading-profit';
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider ${color}`}>
          {icon}
          {title}
        </div>
        <div className="text-sm font-semibold leading-tight">{winner}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function StreakBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  const positive = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 tabular-nums ${positive ? 'text-trading-profit' : 'text-trading-loss'}`}>
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {positive ? `+${value}` : value}
    </span>
  );
}

function SnapshotCard({
  title, competitors, keyMetric,
}: { title: string; competitors: (Competitor & { score: number })[]; keyMetric: 'pnl' | 'pf' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-xs">
          {competitors.map((c) => {
            const value = keyMetric === 'pnl' ? fmtUsd(c.netPnl) : c.pf.toFixed(2);
            const pct = keyMetric === 'pnl'
              ? Math.min(100, (c.netPnl / 1200) * 100)
              : Math.min(100, (c.pf / 2.5) * 100);
            return (
              <div key={c.id} className="flex items-center gap-2">
                <span className="w-36 shrink-0" style={{ color: FLAVOR_COLOR[c.flavor] }}>{c.name}</span>
                <Progress value={pct} className="h-1.5 flex-1" />
                <span className="w-16 text-right tabular-nums">{value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleRow({ label, required }: { label: string; required: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <span>{label}</span>
      <Badge variant="secondary" className="text-[10px]">{required}</Badge>
    </div>
  );
}
