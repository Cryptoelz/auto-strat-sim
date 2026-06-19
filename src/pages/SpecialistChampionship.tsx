import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Crown, Shield, Swords, Activity } from "lucide-react";

type Specialist = {
  id: string;
  name: string;
  short: string;
  netPnl: number;
  pf: number;
  dd: number;
  winRate: number;
  capture: number;
  tradesPerDay: number;
  capitalEff: number;
  elo: number;
  eloDelta: number;
  prevRank: number;
};

const SPECIALISTS: Specialist[] = [
  { id: "tr", name: "Trend Rider v1", short: "TR", netPnl: 14.8, pf: 2.31, dd: 2.1, winRate: 58.4, capture: 81.2, tradesPerDay: 2.3, capitalEff: 0.84, elo: 1742, eloDelta: 18, prevRank: 1 },
  { id: "ms", name: "Momentum Scalper v2", short: "MS2", netPnl: 11.6, pf: 2.04, dd: 2.4, winRate: 61.7, capture: 73.6, tradesPerDay: 5.8, capitalEff: 0.71, elo: 1688, eloDelta: 12, prevRank: 3 },
  { id: "vcb", name: "VCB v1", short: "VCB", netPnl: 10.2, pf: 1.97, dd: 2.6, winRate: 54.1, capture: 76.4, tradesPerDay: 1.7, capitalEff: 0.79, elo: 1671, eloDelta: -4, prevRank: 2 },
  { id: "mr", name: "Mean Reversion v1", short: "MR", netPnl: 8.4, pf: 1.78, dd: 2.8, winRate: 63.2, capture: 64.8, tradesPerDay: 3.4, capitalEff: 0.66, elo: 1612, eloDelta: -9, prevRank: 4 },
];

const ranked = [...SPECIALISTS].sort((a, b) => b.elo - a.elo);

const REGIME_LEADERS = [
  { regime: "Bull Trend", champion: "Trend Rider v1", pf: 2.78, capture: 88.4, runnerUp: "VCB v1" },
  { regime: "Bear Trend", champion: "Trend Rider v1", pf: 2.12, capture: 79.1, runnerUp: "Momentum Scalper v2" },
  { regime: "Sideways", champion: "Mean Reversion v1", pf: 2.34, capture: 71.6, runnerUp: "Momentum Scalper v2" },
  { regime: "High Volatility", champion: "VCB v1", pf: 2.47, capture: 82.3, runnerUp: "Momentum Scalper v2" },
  { regime: "Low Volatility", champion: "Mean Reversion v1", pf: 1.96, capture: 68.2, runnerUp: "Trend Rider v1" },
];

const WEEKLY_CHANGES = [
  { week: "Week 1", tr: 1, ms: 4, vcb: 2, mr: 3 },
  { week: "Week 2", tr: 1, ms: 3, vcb: 2, mr: 4 },
  { week: "Week 3", tr: 2, ms: 3, vcb: 1, mr: 4 },
  { week: "Week 4", tr: 1, ms: 3, vcb: 2, mr: 4 },
  { week: "Week 5", tr: 1, ms: 2, vcb: 3, mr: 4 },
  { week: "Week 6", tr: 1, ms: 2, vcb: 3, mr: 4 },
];

const BELT_HOLDER = {
  champion: ranked[0],
  daysHolding: 47,
  defences: 6,
  biggestChallenger: ranked[1],
  challengerGap: ranked[0].elo - ranked[1].elo,
};

function rankDelta(curr: number, prev: number) {
  const diff = prev - curr;
  if (diff > 0) return { icon: TrendingUp, color: "text-success", text: `▲${diff}` };
  if (diff < 0) return { icon: TrendingDown, color: "text-destructive", text: `▼${Math.abs(diff)}` };
  return { icon: Activity, color: "text-muted-foreground", text: "—" };
}

const BELT_META = [
  { icon: Trophy, label: "Gold Belt", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { icon: Medal, label: "Silver Belt", color: "text-slate-300", bg: "bg-slate-400/10 border-slate-400/30" },
  { icon: Award, label: "Bronze Belt", color: "text-orange-600", bg: "bg-orange-600/10 border-orange-600/30" },
];

export default function SpecialistChampionship() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="h-7 w-7 text-yellow-500" />
            Specialist Championship
          </h1>
          <p className="text-muted-foreground mt-1">
            60-day rolling competition · Determines the #1 specialist ranking
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/5">Observation Only</Badge>
          <Badge variant="outline">No Strategy Changes</Badge>
          <Badge variant="outline">Feeds Research Journal</Badge>
        </div>
      </div>

      {/* Belt holders */}
      <div className="grid gap-4 md:grid-cols-3">
        {ranked.slice(0, 3).map((s, idx) => {
          const meta = BELT_META[idx];
          const Icon = meta.icon;
          return (
            <Card key={s.id} className={`border ${meta.bg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`${meta.color} border-current`}>
                    {meta.label}
                  </Badge>
                  <Icon className={`h-6 w-6 ${meta.color}`} />
                </div>
                <CardTitle className="text-xl">{s.name}</CardTitle>
                <CardDescription>Elo {s.elo} ({s.eloDelta >= 0 ? "+" : ""}{s.eloDelta})</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">PnL</span><div className="font-semibold text-success">+{s.netPnl}%</div></div>
                  <div><span className="text-muted-foreground">PF</span><div className="font-semibold">{s.pf}</div></div>
                  <div><span className="text-muted-foreground">DD</span><div className="font-semibold">{s.dd}%</div></div>
                  <div><span className="text-muted-foreground">Capture</span><div className="font-semibold">{s.capture}%</div></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Champion belt summary */}
      <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            Reigning Champion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Current Champion</p>
              <p className="text-lg font-bold mt-1">{BELT_HOLDER.champion.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Days Holding Belt</p>
              <p className="text-lg font-bold mt-1">{BELT_HOLDER.daysHolding} days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Successful Defences</p>
              <p className="text-lg font-bold mt-1">{BELT_HOLDER.defences}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Biggest Challenger</p>
              <p className="text-lg font-bold mt-1 flex items-center gap-2">
                <Swords className="h-4 w-4 text-destructive" />
                {BELT_HOLDER.biggestChallenger.name}
              </p>
              <p className="text-xs text-muted-foreground">Gap: {BELT_HOLDER.challengerGap} Elo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="elo">Elo Ratings</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Rank Changes</TabsTrigger>
          <TabsTrigger value="regime">Regime Leaders</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Leaderboard</CardTitle>
              <CardDescription>Full performance snapshot over the 60-day championship window</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Specialist</TableHead>
                    <TableHead className="text-right">Net PnL</TableHead>
                    <TableHead className="text-right">PF</TableHead>
                    <TableHead className="text-right">Max DD</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Capture</TableHead>
                    <TableHead className="text-right">Trades/Day</TableHead>
                    <TableHead className="text-right">Capital Eff.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-bold">#{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right text-success">+{s.netPnl}%</TableCell>
                      <TableCell className="text-right">{s.pf}</TableCell>
                      <TableCell className="text-right">{s.dd}%</TableCell>
                      <TableCell className="text-right">{s.winRate}%</TableCell>
                      <TableCell className="text-right">{s.capture}%</TableCell>
                      <TableCell className="text-right">{s.tradesPerDay}</TableCell>
                      <TableCell className="text-right">{s.capitalEff}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="elo">
          <Card>
            <CardHeader>
              <CardTitle>Specialist Elo Ratings</CardTitle>
              <CardDescription>Pairwise head-to-head adjusted across daily windows</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Specialist</TableHead>
                    <TableHead className="text-right">Elo</TableHead>
                    <TableHead className="text-right">Weekly Δ</TableHead>
                    <TableHead className="text-right">Movement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranked.map((s, i) => {
                    const d = rankDelta(i + 1, s.prevRank);
                    const Icon = d.icon;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-bold">#{i + 1}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell className="text-right font-mono">{s.elo}</TableCell>
                        <TableCell className={`text-right ${s.eloDelta >= 0 ? "text-success" : "text-destructive"}`}>
                          {s.eloDelta >= 0 ? "+" : ""}{s.eloDelta}
                        </TableCell>
                        <TableCell className={`text-right flex items-center justify-end gap-1 ${d.color}`}>
                          <Icon className="h-4 w-4" />{d.text}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Rank Changes</CardTitle>
              <CardDescription>Position week-by-week (lower = better)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead className="text-center">Trend Rider v1</TableHead>
                    <TableHead className="text-center">Momentum Scalper v2</TableHead>
                    <TableHead className="text-center">VCB v1</TableHead>
                    <TableHead className="text-center">Mean Reversion v1</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WEEKLY_CHANGES.map(w => (
                    <TableRow key={w.week}>
                      <TableCell className="font-medium">{w.week}</TableCell>
                      <TableCell className="text-center">#{w.tr}</TableCell>
                      <TableCell className="text-center">#{w.ms}</TableCell>
                      <TableCell className="text-center">#{w.vcb}</TableCell>
                      <TableCell className="text-center">#{w.mr}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regime">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {REGIME_LEADERS.map(r => (
              <Card key={r.regime}>
                <CardHeader className="pb-3">
                  <CardDescription>{r.regime} Champion</CardDescription>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    {r.champion}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profit Factor</span>
                    <span className="font-semibold">{r.pf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Move Capture</span>
                    <span className="font-semibold">{r.capture}%</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Runner-up</span>
                    <span>{r.runnerUp}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/30">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <p><strong>Governance:</strong> Observation-only championship. No strategy or parameter modifications permitted.</p>
          <p><strong>Outputs:</strong> Weekly leaderboard snapshots and belt transitions are written to the Research Journal and aggregated into the Monthly Report.</p>
        </CardContent>
      </Card>
    </div>
  );
}
